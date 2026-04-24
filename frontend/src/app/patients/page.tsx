'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { patientApi } from '@/lib/api'
import type { Patient } from '@/lib/types'
import { NATIONALITY_LABEL, GENDER_LABEL, VISA_LABEL } from '@/lib/types'

export default function PatientsPage() {
  const [items, setItems] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    patientApi.list().then(r => setItems(r.payload ?? [])).finally(() => setLoading(false))
  }, [])

  if (loading) return <AppShell><Spinner /></AppShell>

  return (
    <AppShell>
      <h1 className="text-lg font-bold mb-4">이주민 목록</h1>

      {items.length === 0 ? (
        <EmptyState message="등록된 이주민이 없습니다." />
      ) : (
        <div className="space-y-2">
          {items.map(p => (
            <Link
              key={p.id}
              href={`/patients/${p.id}`}
              className="card block hover:border-primary-200 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {NATIONALITY_LABEL[p.nationality]} · {GENDER_LABEL[p.gender]} · {VISA_LABEL[p.visaType]}
                  </p>
                  {p.region && <p className="text-xs text-gray-400">{p.region}</p>}
                </div>
                <span className="text-gray-300 text-sm">›</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  )
}
