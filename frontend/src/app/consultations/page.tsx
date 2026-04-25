'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { consultationApi, authApi } from '@/lib/api'
import type { Consultation, AuthMe } from '@/lib/types'
import { ISSUE_LABEL } from '@/lib/types'

export default function ConsultationsPage() {
  const [items, setItems] = useState<Consultation[]>([])
  const [me, setMe] = useState<AuthMe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([authApi.me(), consultationApi.list(0)])
      .then(([meRes, cRes]) => {
        setMe(meRes.payload)
        setItems(cRes.payload ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <AppShell><Spinner /></AppShell>

  return (
    <AppShell>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-bold">상담 보고서</h1>
        {me?.role === 'interpreter' && (
          <Link href="/consultations/new" className="btn-primary text-sm py-1.5 px-3">
            + 작성
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState message="보고서가 없습니다." />
      ) : (
        <div className="space-y-2">
          {items.map(c => (
            <Link
              key={c.id}
              href={`/consultations/${c.id}`}
              className="card block hover:border-primary-200 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{c.patientName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {c.consultationDate}
                    {c.hospitalName && ` · ${c.hospitalName}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{ISSUE_LABEL[c.issueType]}</p>
                </div>
                {c.confirmed
                  ? <Badge variant="green">확인완료</Badge>
                  : <Badge variant="yellow">미확인</Badge>}
              </div>
              {c.nextAppointmentDate && (
                <p className="text-xs text-primary-600 mt-2">
                  📅 다음 예약: {c.nextAppointmentDate}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  )
}
