'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { interpreterApi } from '@/lib/api'
import type { Interpreter } from '@/lib/types'

const ROLE_LABEL: Record<string, string> = {
  ACTIVIST: '통번역활동가', FREELANCER: '프리랜서', STAFF: '센터직원',
}

export default function InterpretersPage() {
  const [items, setItems] = useState<Interpreter[]>([])
  const [loading, setLoading] = useState(true)

  function load() {
    return interpreterApi.list().then(r => setItems(r.payload ?? []))
  }

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  async function handleDeactivate(id: string, name: string) {
    if (!confirm(`${name} 통번역가를 비활성화하시겠습니까?`)) return
    await interpreterApi.deactivate(id)
    await load()
  }

  if (loading) return <AppShell><Spinner /></AppShell>

  return (
    <AppShell>
      <h1 className="text-lg font-bold mb-4">통번역가 관리</h1>

      {items.length === 0 ? (
        <EmptyState message="등록된 통번역가가 없습니다." />
      ) : (
        <div className="space-y-2">
          {items.map(i => (
            <div key={i.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{i.name}</p>
                    {!i.active && <Badge variant="red">비활성</Badge>}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {ROLE_LABEL[i.role]} · {i.languages.join(', ') || '언어 미등록'}
                  </p>
                  {i.phone && <p className="text-xs text-gray-400">{i.phone}</p>}
                </div>
                {i.active && (
                  <button
                    onClick={() => handleDeactivate(i.id, i.name)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    비활성화
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
