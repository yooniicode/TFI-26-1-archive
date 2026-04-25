'use client'

import { useQuery } from '@tanstack/react-query'
import AppShell from '@/components/AppShell'
import { consultationApi } from '@/lib/api'
import { useMe } from '@/hooks/useMe'
import type { Consultation } from '@/lib/types'
import { ISSUE_LABEL } from '@/lib/types'
import Link from 'next/link'
import Spinner from '@/components/ui/Spinner'
import Badge from '@/components/ui/Badge'

export default function DashboardPage() {
  const { data: me, isLoading: meLoading } = useMe()

  const { data: consultations, isLoading: listLoading } = useQuery({
    queryKey: ['consultations', 0],
    queryFn: () => consultationApi.list(0).then(r => (r.payload ?? []) as Consultation[]),
    enabled: !!me,
  })

  if (meLoading || listLoading) return <AppShell><Spinner /></AppShell>

  const recent = (consultations ?? []).slice(0, 5)

  return (
    <AppShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold">
            안녕하세요, {me?.name ?? ''}님 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {me?.role === 'admin' ? '센터장' : me?.role === 'interpreter' ? '통번역가' : '이주민'}
          </p>
        </div>

        {me?.role === 'interpreter' && (
          <div className="grid grid-cols-2 gap-3">
            <Link href="/consultations/new" className="card flex flex-col items-center py-5 gap-2 hover:border-primary-300 transition-colors">
              <span className="text-3xl">📝</span>
              <span className="text-sm font-medium">보고서 작성</span>
            </Link>
            <Link href="/handovers" className="card flex flex-col items-center py-5 gap-2 hover:border-primary-300 transition-colors">
              <span className="text-3xl">🔄</span>
              <span className="text-sm font-medium">인수인계</span>
            </Link>
          </div>
        )}

        {me?.role === 'admin' && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { href: '/consultations', label: '보고서', icon: '📝' },
              { href: '/matching', label: '매칭', icon: '🔀' },
              { href: '/interpreters', label: '통번역가', icon: '🧑‍💼' },
            ].map(item => (
              <Link key={item.href} href={item.href} className="card flex flex-col items-center py-4 gap-1 text-center hover:border-primary-300">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        )}

        {me?.role === 'patient' && (
          <div className="grid grid-cols-2 gap-3">
            <Link href="/my-records" className="card flex flex-col items-center py-5 gap-2 hover:border-primary-300">
              <span className="text-3xl">📋</span>
              <span className="text-sm font-medium">내 진료 기록</span>
            </Link>
            {me.entityId && (
              <Link href={`/scripts/patient/${me.entityId}`} className="card flex flex-col items-center py-5 gap-2 hover:border-primary-300">
                <span className="text-3xl">💬</span>
                <span className="text-sm font-medium">의료 대본</span>
              </Link>
            )}
          </div>
        )}

        {me?.role !== 'patient' && (
          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold">최근 보고서</h2>
              <Link href="/consultations" className="text-sm text-primary-600">전체 보기</Link>
            </div>
            <div className="space-y-2">
              {recent.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">보고서가 없습니다.</p>
              )}
              {recent.map(c => (
                <Link key={c.id} href={`/consultations/${c.id}`} className="card flex items-center gap-3 hover:border-primary-200 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{c.patientName}</p>
                    <p className="text-xs text-gray-400">{c.consultationDate} · {ISSUE_LABEL[c.issueType]}</p>
                  </div>
                  {c.confirmed
                    ? <Badge variant="green">확인완료</Badge>
                    : <Badge variant="yellow">미확인</Badge>}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  )
}
