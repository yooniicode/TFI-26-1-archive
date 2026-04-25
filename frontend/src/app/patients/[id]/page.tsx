'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { patientApi, authApi, handoverApi } from '@/lib/api'
import type { Patient, Consultation, AuthMe, Handover } from '@/lib/types'
import { NATIONALITY_LABEL, GENDER_LABEL, VISA_LABEL, ISSUE_LABEL } from '@/lib/types'

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [history, setHistory] = useState<Consultation[]>([])
  const [handovers, setHandovers] = useState<Handover[]>([])
  const [me, setMe] = useState<AuthMe | null>(null)
  const [loading, setLoading] = useState(true)

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
