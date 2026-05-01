'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { adminApi, patientApi, authApi, handoverApi, centerApi } from '@/lib/api'
import type { Patient, Consultation, AuthMe, Handover, CenterPatientMemo, Center } from '@/lib/types'
import { useEnumLabels } from '@/lib/i18n/enumLabels'
import { useTranslation } from '@/lib/i18n/I18nContext'

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { t } = useTranslation()
  const labels = useEnumLabels()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [history, setHistory] = useState<Consultation[]>([])
  const [handovers, setHandovers] = useState<Handover[]>([])
  const [memos, setMemos] = useState<CenterPatientMemo[]>([])
  const [me, setMe] = useState<AuthMe | null>(null)
  const [loading, setLoading] = useState(true)
  const [publicMemo, setPublicMemo] = useState('')
  const [privateMemo, setPrivateMemo] = useState('')
  const [interpreterVisible, setInterpreterVisible] = useState(true)
  const [memoSaving, setMemoSaving] = useState(false)
  const [memoError, setMemoError] = useState('')
  const [historyError, setHistoryError] = useState('')

  const [centerPopupOpen, setCenterPopupOpen] = useState(false)
  const [centerSearchQuery, setCenterSearchQuery] = useState('')
  const [allCenters, setAllCenters] = useState<Center[]>([])
  const [centerActionLoading, setCenterActionLoading] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setHistoryError('')
      try {
        const meRes = await authApi.me()
        if (cancelled) return
        const currentMe = meRes.payload
        setMe(currentMe)

        const [pRes, hoRes] = await Promise.all([
          patientApi.get(id),
          handoverApi.byPatient(id),
        ])
        if (cancelled) return
        setPatient(pRes.payload)
        setHandovers(hoRes.payload ?? [])

        if (currentMe.role === 'admin' && !currentMe.centerId && !currentMe.centerName) {
          setHistory([])
          setHistoryError(t.common.admin_center_required)
          return
        }

        try {
          const hRes = await patientApi.history(id)
          if (!cancelled) setHistory(hRes.payload ?? [])
        } catch (e) {
          if (!cancelled) {
            setHistory([])
            setHistoryError(e instanceof Error ? e.message : t.patient.no_consultation)
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [id, t.common.admin_center_required, t.patient.no_consultation])

  useEffect(() => {
    if (!me || (me.role !== 'admin' && me.role !== 'interpreter')) return
    if (me.role === 'admin' && !me.centerId && !me.centerName) {
      setMemos([])
      return
    }
    adminApi.patientMemos(id)
      .then(res => setMemos(res.payload ?? []))
      .catch(() => setMemos([]))
  }, [id, me])

  useEffect(() => {
    if (!centerPopupOpen) return
    centerApi.list(centerSearchQuery || undefined)
      .then(res => setAllCenters(res.payload ?? []))
      .catch(() => setAllCenters([]))
  }, [centerPopupOpen, centerSearchQuery])

  async function handleMemoCreate(e: React.FormEvent) {
    e.preventDefault()
    setMemoSaving(true)
    setMemoError('')
    try {
      await adminApi.createPatientMemo(id, { publicMemo, privateMemo, interpreterVisible })
      setPublicMemo('')
      setPrivateMemo('')
      setInterpreterVisible(true)
      const res = await adminApi.patientMemos(id)
      setMemos(res.payload ?? [])
    } catch (e) {
      setMemoError(e instanceof Error ? e.message : t.patient.err_memo)
    } finally {
      setMemoSaving(false)
    }
  }

  async function handleAddCenter(centerId: string) {
    setCenterActionLoading(centerId)
    try {
      const res = await patientApi.addCenter(id, centerId)
      setPatient(res.payload as Patient)
      setCenterPopupOpen(false)
      setCenterSearchQuery('')
    } catch (e) {
      alert(e instanceof Error ? e.message : t.patient.err_center_add)
    } finally {
      setCenterActionLoading(null)
    }
  }

  async function handleRemoveCenter(centerId: string) {
    if (!confirm(t.patient.confirm_center_remove)) return
    setCenterActionLoading(centerId)
    try {
      const res = await patientApi.removeCenter(id, centerId)
      setPatient(res.payload as Patient)
    } catch (e) {
      alert(e instanceof Error ? e.message : t.patient.err_center_remove)
    } finally {
      setCenterActionLoading(null)
    }
  }

  if (loading) return <AppShell><Spinner /></AppShell>
  if (!patient) return <AppShell><p className="text-center py-10 text-gray-400">{t.patient.not_found}</p></AppShell>

  const registeredCenterIds = new Set((patient.centers ?? []).map(c => c.id))
  const filteredCenters = allCenters.filter(c =>
    !centerSearchQuery || c.name.toLowerCase().includes(centerSearchQuery.toLowerCase())
  )

  const basicRows: [string, string | undefined | null][] = [
    [t.patient.nationality, labels.nationality[patient.nationality]],
    [t.patient.gender, labels.gender[patient.gender]],
    [t.patient.visa, labels.visa[patient.visaType]],
    [t.patient.birth_date, patient.birthDate],
    [t.patient.phone, patient.phone],
    [t.patient.region, patient.region],
  ]

  return (
    <AppShell>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.back()} className="text-gray-400">←</button>
        <h1 className="text-lg font-bold">{patient.name}</h1>
      </div>

      <div className="card mb-4">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">{t.patient.basic_info}</h2>
        {basicRows.filter(([, v]) => v).map(([label, value]) => (
          <div key={label as string} className="flex gap-2 mb-2">
            <span className="text-xs text-gray-500 w-16 flex-shrink-0">{label}</span>
            <span className="text-sm">{value}</span>
          </div>
        ))}

        <div className="flex gap-2 mt-2">
          <span className="text-xs text-gray-500 w-16 flex-shrink-0 pt-1">{t.patient.affiliation_center}</span>
          <div className="flex flex-wrap gap-1 flex-1">
            {(patient.centers ?? []).map(center => (
              <span key={center.id}
                className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                {center.name}
                {me?.role === 'admin' && (
                  <button
                    onClick={() => handleRemoveCenter(center.id)}
                    disabled={centerActionLoading === center.id}
                    className="text-blue-400 hover:text-red-500 ml-0.5 font-bold leading-none"
                    aria-label={`${center.name} 제거`}
                  >
                    {centerActionLoading === center.id ? '…' : '×'}
                  </button>
                )}
              </span>
            ))}
            {me?.role === 'admin' && (
              <button
                onClick={() => setCenterPopupOpen(true)}
                className="text-xs text-gray-400 border border-dashed border-gray-300 rounded-full px-2 py-0.5 hover:border-blue-400 hover:text-blue-500"
              >
                {t.patient.add_center}
              </button>
            )}
            {(patient.centers ?? []).length === 0 && me?.role !== 'admin' && (
              <span className="text-xs text-gray-400">{t.patient.no_center}</span>
            )}
          </div>
        </div>
      </div>

      {centerPopupOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center sm:items-center p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-4 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">{t.patient.center_search_title}</h3>
              <button onClick={() => { setCenterPopupOpen(false); setCenterSearchQuery('') }}
                className="text-gray-400 text-lg leading-none">×</button>
            </div>
            <input
              className="input"
              placeholder={t.patient.center_search_placeholder}
              value={centerSearchQuery}
              onChange={e => setCenterSearchQuery(e.target.value)}
              autoFocus
            />
            <div className="max-h-60 overflow-y-auto space-y-1">
              {filteredCenters.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">{t.common.no_result}</p>
              ) : filteredCenters.map(center => {
                const already = registeredCenterIds.has(center.id)
                return (
                  <button
                    key={center.id}
                    onClick={() => !already && handleAddCenter(center.id)}
                    disabled={already || centerActionLoading === center.id}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                      already
                        ? 'bg-gray-50 text-gray-400 cursor-default'
                        : 'hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    <span className="font-medium">{center.name}</span>
                    {center.address && <span className="text-xs text-gray-400 ml-1">{center.address}</span>}
                    {already && <span className="text-xs text-green-600 ml-1">{t.patient.already_registered}</span>}
                    {centerActionLoading === center.id && <span className="text-xs ml-1">{t.patient.adding}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {me?.role === 'interpreter' && (
        <div className="flex gap-2 mb-4">
          <Link href={`/consultations/new?patientId=${id}`} className="btn-primary flex-1 text-center text-sm">
            {t.patient.write_report}
          </Link>
          <Link href={`/scripts/patient/${id}`} className="btn-secondary flex-1 text-center text-sm">
            {t.patient.medical_script}
          </Link>
        </div>
      )}

      <section className="mb-4">
        <h2 className="font-semibold text-sm mb-2">{t.patient.past_interpreters}</h2>
        {Array.from(new Set(history.map(h => h.interpreterName).filter(Boolean))).length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(history.map(h => h.interpreterName).filter(Boolean))).map(name => (
              <span key={name} className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full px-2 py-0.5 shadow-sm">
                {name} {t.patient.interpreter_suffix}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">{t.patient.no_past_interpreter}</p>
        )}
      </section>

      <section className="mb-4">
        <h2 className="font-semibold text-sm mb-2">
          {t.patient.consultation_history} ({history.length}건)
        </h2>
        {historyError ? (
          <p className="text-sm text-red-500 text-center py-4">{historyError}</p>
        ) : history.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">{t.patient.no_consultation}</p>
        ) : (
          <div className="space-y-2">
            {history.map(c => (
              <Link key={c.id} href={`/consultations/${c.id}`}
                className="card flex items-center justify-between hover:border-primary-200 transition-colors">
                <div>
                  <p className="text-sm font-medium">{c.consultationDate}</p>
                  <p className="text-xs text-gray-400">
                    {labels.issue[c.issueType]}
                    {c.hospitalName && ` · ${c.hospitalName}`}
                    {c.interpreterName && ` · ${t.patient.in_charge}: ${c.interpreterName}`}
                  </p>
                </div>
                {c.confirmed
                  ? <Badge variant="green">{t.common.confirmed}</Badge>
                  : <Badge variant="yellow">{t.common.unconfirmed}</Badge>}
              </Link>
            ))}
          </div>
        )}
      </section>

      {(me?.role === 'admin' || me?.role === 'interpreter') && (
        <section className="mb-4">
          <h2 className="font-semibold text-sm mb-2">{t.patient.center_memo}</h2>

          {me?.role === 'admin' && (
            <form onSubmit={handleMemoCreate} className="card mb-3 space-y-3">
              <div>
                <label className="label">{t.patient.public_memo}</label>
                <textarea
                  className="input min-h-20"
                  value={publicMemo}
                  onChange={e => setPublicMemo(e.target.value)}
                  placeholder={t.patient.public_memo_placeholder}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={interpreterVisible}
                  onChange={e => setInterpreterVisible(e.target.checked)}
                />
                {t.patient.interpreter_visible}
              </label>
              <div>
                <label className="label">{t.patient.private_memo}</label>
                <textarea
                  className="input min-h-20"
                  value={privateMemo}
                  onChange={e => setPrivateMemo(e.target.value)}
                  placeholder={t.patient.private_memo_placeholder}
                />
              </div>
              {memoError && <p className="text-red-500 text-xs">{memoError}</p>}
              <button type="submit" className="btn-secondary w-full" disabled={memoSaving}>
                {memoSaving ? t.patient.memo_saving : t.patient.memo_save}
              </button>
            </form>
          )}

          {memos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">{t.patient.no_memo}</p>
          ) : (
            <div className="space-y-2">
              {memos.map(memo => (
                <div key={memo.id} className="card text-sm space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-400">{new Date(memo.createdAt).toLocaleString(t.locale)}</p>
                    {memo.interpreterVisible
                      ? <Badge variant="green">{t.patient.badge_interpreter_visible}</Badge>
                      : <Badge variant="yellow">{t.patient.badge_admin_only}</Badge>}
                  </div>
                  {memo.publicMemo && <p className="whitespace-pre-wrap">{memo.publicMemo}</p>}
                  {me?.role === 'admin' && memo.privateMemo && (
                    <div className="rounded bg-gray-50 p-2">
                      <p className="text-xs text-gray-500 mb-1">{t.patient.private_memo_label}</p>
                      <p className="whitespace-pre-wrap">{memo.privateMemo}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {handovers.length > 0 && (
        <section className="mb-4">
          <h2 className="font-semibold text-sm mb-2">{t.patient.handover_history}</h2>
          <div className="space-y-2">
            {handovers.map(h => (
              <div key={h.id} className="card text-sm">
                <p className="text-gray-500 text-xs">{new Date(h.createdAt).toLocaleDateString(t.locale)}</p>
                <p>{h.fromInterpreterName} → {h.toInterpreterName ?? t.patient.pending_assignment}</p>
                <p className="text-xs text-gray-400 mt-1">{h.reason}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  )
}
