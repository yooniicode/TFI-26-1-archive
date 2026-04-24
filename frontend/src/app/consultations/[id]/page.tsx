'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { consultationApi, authApi } from '@/lib/api'
import type { Consultation, AuthMe } from '@/lib/types'
import { ISSUE_LABEL, METHOD_LABEL } from '@/lib/types'

export default function ConsultationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [data, setData] = useState<Consultation | null>(null)
  const [me, setMe] = useState<AuthMe | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    Promise.all([authApi.me(), consultationApi.get(id)])
      .then(([meRes, cRes]) => { setMe(meRes.payload); setData(cRes.payload) })
      .finally(() => setLoading(false))
  }, [id])

  async function handleConfirm() {
    if (!me || !data) return
    const by = me.name ?? '관리자'
    setConfirming(true)
    try {
      const res = await consultationApi.confirm(id, { confirmedBy: by, confirmedByPhone: '' })
      setData(res.payload)
    } finally {
      setConfirming(false)
    }
  }

  if (loading) return <AppShell><Spinner /></AppShell>
  if (!data) return <AppShell><p className="text-center text-gray-400 py-10">보고서를 찾을 수 없습니다.</p></AppShell>

  const rows: [string, string | undefined | null][] = [
    ['상담일자', data.consultationDate],
    ['이주민', data.patientName],
    ['통번역가', data.interpreterName],
    ['병원', data.hospitalName],
    ['진료과', data.department],
    ['문제유형', ISSUE_LABEL[data.issueType]],
    ['방법', data.method ? METHOD_LABEL[data.method] : null],
    ['통역시간', data.durationHours ? `${data.durationHours}h` : null],
    ['통역비', data.fee ? `${data.fee.toLocaleString()}원` : null],
    ['다음예약', data.nextAppointmentDate],
    ['확인자', data.confirmedBy],
    ['확인일자', data.confirmedAt],
  ]

  return (
    <AppShell>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => router.back()} className="text-gray-400">←</button>
        <h1 className="text-lg font-bold flex-1">보고서 상세</h1>
        {data.confirmed
          ? <Badge variant="green">확인완료</Badge>
          : <Badge variant="yellow">미확인</Badge>}
      </div>

      <div className="card space-y-3 mb-4">
        {rows.filter(([, v]) => v).map(([label, value]) => (
          <div key={label} className="flex gap-2">
            <span className="text-xs text-gray-500 w-20 flex-shrink-0">{label}</span>
            <span className="text-sm font-medium">{value}</span>
          </div>
        ))}
      </div>

      {data.memo && (
        <div className="card mb-4">
          <p className="text-xs text-gray-500 mb-2">상담내용 메모</p>
          <p className="text-sm whitespace-pre-wrap">{data.memo}</p>
        </div>
      )}

      {me?.role === 'ADMIN' && !data.confirmed && (
        <button onClick={handleConfirm} disabled={confirming} className="btn-primary w-full">
          {confirming ? '처리 중...' : '✅ 보고서 확인 (컨펌)'}
        </button>
      )}

      {me?.role === 'INTERPRETER' && !data.confirmed && (
        <button
          onClick={() => router.push(`/consultations/${id}/edit`)}
          className="btn-secondary w-full"
        >
          수정
        </button>
      )}
    </AppShell>
  )
}
