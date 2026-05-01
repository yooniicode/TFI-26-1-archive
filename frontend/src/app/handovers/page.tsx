'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { authApi, handoverApi, interpreterApi, patientApi } from '@/lib/api'
import type { AuthMe, Consultation, Patient, Interpreter } from '@/lib/types'
import { useEnumLabels } from '@/lib/i18n/enumLabels'
import { useTranslation } from '@/lib/i18n/I18nContext'

export default function HandoversPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const labels = useEnumLabels()
  const [me, setMe] = useState<AuthMe | null>(null)
  const [patients, setPatients] = useState<Patient[]>([])
  const [interpreters, setInterpreters] = useState<Interpreter[]>([])
  const [loading, setLoading] = useState(true)

  // 인수인계 요청 폼
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ patientId: '', consultationId: '', reason: '', notes: '' })
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  // 진료 이력
  const [consultationHistory, setConsultationHistory] = useState<Consultation[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    Promise.all([authApi.me(), patientApi.list()])
      .then(([meRes, pRes]) => {
        setMe(meRes.payload)
        setPatients(pRes.payload ?? [])
        if (meRes.payload.role === 'admin' && (meRes.payload.centerId || meRes.payload.centerName)) {
          return interpreterApi.list().then(r => setInterpreters(r.payload ?? []))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!form.patientId) {
      setConsultationHistory([])
      setForm(f => ({ ...f, consultationId: '' }))
      return
    }
    setHistoryLoading(true)
    patientApi.history(form.patientId)
      .then(r => setConsultationHistory(r.payload ?? []))
      .catch(() => setConsultationHistory([]))
      .finally(() => setHistoryLoading(false))
  }, [form.patientId])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await handoverApi.create({
        patientId: form.patientId,
        consultationId: form.consultationId || undefined,
        reason: form.reason,
        notes: form.notes || undefined,
      })
      setSuccess(true)
      setShowForm(false)
      setForm({ patientId: '', consultationId: '', reason: '', notes: '' })
      setConsultationHistory([])
    } catch (e) {
      setError(e instanceof Error ? e.message : t.handover.err_submit)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <AppShell><Spinner /></AppShell>

  const selectedPatient = patients.find(p => p.id === form.patientId)

  return (
    <AppShell>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-bold">{t.handover.title}</h1>
        {me?.role === 'interpreter' && (
          <button
            onClick={() => { setShowForm(v => !v); setSuccess(false) }}
            className="btn-primary text-sm py-1.5 px-3"
          >
            {showForm ? t.common.cancel : t.handover.request}
          </button>
        )}
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 text-sm text-green-700">
          {t.handover.success_msg}
        </div>
      )}

      {showForm && me?.role === 'interpreter' && (
        <form onSubmit={handleCreate} className="card mb-4 space-y-4">
          <h2 className="font-semibold text-sm">{t.handover.form_title}</h2>

          <div>
            <label className="label">{t.handover.patient}</label>
            <select
              className="input"
              value={form.patientId}
              onChange={e => setForm(f => ({ ...f, patientId: e.target.value, consultationId: '' }))}
              required
            >
              <option value="">{t.handover.select_placeholder}</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {selectedPatient && (
            <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500 flex gap-3 flex-wrap">
              <span>{labels.nationality[selectedPatient.nationality]}</span>
              {selectedPatient.birthDate && <span>{selectedPatient.birthDate}</span>}
              {selectedPatient.phone && <span>{selectedPatient.phone}</span>}
              {selectedPatient.region && <span>{selectedPatient.region}</span>}
            </div>
          )}

          {form.patientId && (
            <div>
              <label className="label">
                {t.handover.consultation_label}
                <span className="text-gray-400 font-normal ml-1 text-xs">{t.handover.consultation_hint}</span>
              </label>

              {historyLoading ? (
                <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
                  <Spinner />
                  <span>{t.handover.history_loading}</span>
                </div>
              ) : consultationHistory.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">{t.handover.no_history}</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {consultationHistory.map(c => {
                    const selected = form.consultationId === c.id
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setForm(f => ({
                          ...f,
                          consultationId: selected ? '' : c.id,
                        }))}
                        className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                          selected
                            ? 'border-primary-400 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {selected && (
                              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                                <span className="text-white text-[10px]">✓</span>
                              </span>
                            )}
                            <span className="text-sm font-medium">{c.consultationDate}</span>
                            <span className="text-xs text-gray-500">{labels.issue[c.issueType]}</span>
                            {c.hospitalName && (
                              <span className="text-xs text-gray-400 truncate">· {c.hospitalName}</span>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            {c.confirmed
                              ? <Badge variant="green">{t.common.confirmed}</Badge>
                              : <Badge variant="yellow">{t.common.unconfirmed}</Badge>}
                          </div>
                        </div>
                        {c.memo && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-1">{c.memo}</p>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="label">{t.handover.reason_label}</label>
            <textarea
              className="input resize-none min-h-[80px]"
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              placeholder={t.handover.reason_placeholder}
              required
            />
          </div>

          <div>
            <label className="label">{t.handover.notes_label}</label>
            <textarea
              className="input resize-none min-h-[60px]"
              placeholder={t.handover.notes_placeholder}
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            />
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={submitting}>
            {submitting ? t.handover.submitting : t.handover.submit}
          </button>
        </form>
      )}

      <div className="text-center py-12 text-gray-400">
        <p className="text-4xl mb-2">🔄</p>
        <p className="text-sm">{t.handover.guide_msg.split('\n').map((line, i) => (
          <span key={i}>{line}{i === 0 && <br />}</span>
        ))}</p>
        <button onClick={() => router.push('/patients')} className="mt-4 btn-secondary text-sm">
          {t.handover.go_to_patients}
        </button>
      </div>
    </AppShell>
  )
}
