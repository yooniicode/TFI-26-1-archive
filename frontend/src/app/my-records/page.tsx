'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { authApi, patientApi, scriptApi } from '@/lib/api'
import type { AuthMe, Consultation, MedicalScript } from '@/lib/types'
import { SCRIPT_LABEL } from '@/lib/types'

export default function MyRecordsPage() {
  const [me, setMe] = useState<AuthMe | null>(null)
  const [records, setRecords] = useState<Consultation[]>([])
  const [scripts, setScripts] = useState<MedicalScript[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authApi.me().then(meRes => {
      setMe(meRes.payload)
      const patientId = meRes.payload.entityId
      if (!patientId) { setLoading(false); return }
      Promise.all([
        patientApi.myRecords(patientId),
        scriptApi.byPatient(patientId),
      ]).then(([rRes, sRes]) => {
        setRecords(rRes.payload ?? [])
        setScripts(sRes.payload ?? [])
      }).finally(() => setLoading(false))
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <AppShell><Spinner /></AppShell>

  return (
    <AppShell>
      <h1 className="text-lg font-bold mb-4">내 진료 기록</h1>

      {/* 진료 요약 */}
      <section className="mb-5">
        <h2 className="font-semibold text-sm text-gray-600 mb-2">진료 방문 기록</h2>
        {records.length === 0 ? (
          <EmptyState message="진료 기록이 없습니다." />
        ) : (
          <div className="space-y-2">
            {records.map(c => (
              <div key={c.id} className="card">
                <p className="text-sm font-medium">{c.consultationDate}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {c.hospitalName ?? '병원 미기록'}
                  {c.department && ` · ${c.department}`}
                </p>
                {c.nextAppointmentDate && (
                  <p className="text-xs text-primary-600 mt-1">
                    📅 다음 예약: {c.nextAppointmentDate}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 의료 대본 */}
      <section>
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold text-sm text-gray-600">저장된 대본</h2>
          {me?.entityId && (
            <Link href={`/scripts/patient/${me.entityId}`}
              className="text-xs text-primary-600">
              새 대본 생성
            </Link>
          )}
        </div>
        {scripts.length === 0 ? (
          <EmptyState message="저장된 대본이 없습니다." />
        ) : (
          <div className="space-y-2">
            {scripts.map(s => (
              <div key={s.id} className="card">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-primary-600 font-medium">
                    {SCRIPT_LABEL[s.scriptType]}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2">{s.contentKo}</p>
                <Link href={`/scripts/${s.id}/present`}
                  className="mt-2 block text-center py-2 rounded-lg bg-primary-50 text-primary-700 text-sm font-medium">
                  📱 의사에게 보여주기
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  )
}
