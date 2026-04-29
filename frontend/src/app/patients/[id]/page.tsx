'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { adminApi, patientApi, authApi, handoverApi } from '@/lib/api'
import type { Patient, Consultation, AuthMe, Handover, CenterPatientMemo } from '@/lib/types'
import { NATIONALITY_LABEL, GENDER_LABEL, VISA_LABEL, ISSUE_LABEL } from '@/lib/types'

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
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

  useEffect(() => {
    Promise.all([
      authApi.me(),
      patientApi.get(id),
      patientApi.history(id),
      handoverApi.byPatient(id),
    ]).then(([meRes, pRes, hRes, hoRes]) => {
      setMe(meRes.payload)
      setPatient(pRes.payload)
      setHistory(hRes.payload ?? [])
      setHandovers(hoRes.payload ?? [])
    }).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!me || (me.role !== 'admin' && me.role !== 'interpreter')) return
    adminApi.patientMemos(id)
      .then(res => setMemos(res.payload ?? []))
      .catch(() => setMemos([]))
  }, [id, me])

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
      setMemoError(e instanceof Error ? e.message : '메모 저장에 실패했습니다.')
    } finally {
      setMemoSaving(false)
    }
  }

  if (loading) return <AppShell><Spinner /></AppShell>
  if (!patient) return <AppShell><p className="text-center py-10 text-gray-400">이주민 정보를 찾을 수 없습니다.</p></AppShell>

  return (
    <AppShell>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.back()} className="text-gray-400">←</button>
        <h1 className="text-lg font-bold">{patient.name}</h1>
      </div>

      {/* 기본 정보 */}
      <div className="card mb-4">
        <h2 className="text-sm font-semibold text-gray-500 mb-3">기본 정보</h2>
        {[
          ['국적', NATIONALITY_LABEL[patient.nationality]],
          ['성별', GENDER_LABEL[patient.gender]],
          ['비자', VISA_LABEL[patient.visaType]],
          ['생년월일', patient.birthDate],
          ['연락처', patient.phone],
          ['거주지역', patient.region],
          ['사업장', patient.workplaceName],
        ].filter(([, v]) => v).map(([label, value]) => (
          <div key={label as string} className="flex gap-2 mb-2">
            <span className="text-xs text-gray-500 w-16 flex-shrink-0">{label}</span>
            <span className="text-sm">{value}</span>
          </div>
        ))}
      </div>

      {/* 퀵 액션 */}
      {me?.role === 'interpreter' && (
        <div className="flex gap-2 mb-4">
          <Link href={`/consultations/new?patientId=${id}`} className="btn-primary flex-1 text-center text-sm">
            보고서 작성
          </Link>
          <Link href={`/scripts/patient/${id}`} className="btn-secondary flex-1 text-center text-sm">
            의료 대본
          </Link>
        </div>
      )}

      {/* 상담 이력 */}
      <section className="mb-4">
        <h2 className="font-semibold text-sm mb-2">상담 이력 ({history.length}건)</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">상담 기록이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {history.map(c => (
              <Link key={c.id} href={`/consultations/${c.id}`}
                className="card flex items-center justify-between hover:border-primary-200 transition-colors">
                <div>
                  <p className="text-sm font-medium">{c.consultationDate}</p>
                  <p className="text-xs text-gray-400">{ISSUE_LABEL[c.issueType]}{c.hospitalName && ` · ${c.hospitalName}`}</p>
                </div>
                {c.confirmed ? <Badge variant="green">확인</Badge> : <Badge variant="yellow">미확인</Badge>}
              </Link>
            ))}
          </div>
        )}
      </section>

      {(me?.role === 'admin' || me?.role === 'interpreter') && (
        <section className="mb-4">
          <h2 className="font-semibold text-sm mb-2">센터 메모</h2>

          {me?.role === 'admin' && (
            <form onSubmit={handleMemoCreate} className="card mb-3 space-y-3">
              <div>
                <label className="label">공개용 메모</label>
                <textarea
                  className="input min-h-20"
                  value={publicMemo}
                  onChange={e => setPublicMemo(e.target.value)}
                  placeholder="통번역가에게 공유할 수 있는 메모"
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={interpreterVisible}
                  onChange={e => setInterpreterVisible(e.target.checked)}
                />
                통번역가에게 공개
              </label>
              <div>
                <label className="label">비공개 메모</label>
                <textarea
                  className="input min-h-20"
                  value={privateMemo}
                  onChange={e => setPrivateMemo(e.target.value)}
                  placeholder="센터 관리자만 볼 수 있는 메모"
                />
              </div>
              {memoError && <p className="text-red-500 text-xs">{memoError}</p>}
              <button type="submit" className="btn-secondary w-full" disabled={memoSaving}>
                {memoSaving ? '저장 중...' : '센터 메모 저장'}
              </button>
            </form>
          )}

          {memos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">센터 메모가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {memos.map(memo => (
                <div key={memo.id} className="card text-sm space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-400">{new Date(memo.createdAt).toLocaleString()}</p>
                    {memo.interpreterVisible
                      ? <Badge variant="green">통번역가 공개</Badge>
                      : <Badge variant="yellow">관리자 전용</Badge>}
                  </div>
                  {memo.publicMemo && <p className="whitespace-pre-wrap">{memo.publicMemo}</p>}
                  {me?.role === 'admin' && memo.privateMemo && (
                    <div className="rounded bg-gray-50 p-2">
                      <p className="text-xs text-gray-500 mb-1">비공개 메모</p>
                      <p className="whitespace-pre-wrap">{memo.privateMemo}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 인수인계 이력 */}
      {handovers.length > 0 && (
        <section className="mb-4">
          <h2 className="font-semibold text-sm mb-2">인수인계 이력</h2>
          <div className="space-y-2">
            {handovers.map(h => (
              <div key={h.id} className="card text-sm">
                <p className="text-gray-500 text-xs">{new Date(h.createdAt).toLocaleDateString()}</p>
                <p>{h.fromInterpreterName} → {h.toInterpreterName ?? '(배정 대기)'}</p>
                <p className="text-xs text-gray-400 mt-1">{h.reason}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  )
}
