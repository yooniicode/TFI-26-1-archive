'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AppShell from '@/components/AppShell'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { interpreterApi } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { INTERPRETER_ROLE_LABEL } from '@/lib/types'

export default function InterpretersPage() {
  const queryClient = useQueryClient()

  const { data: items = [], isLoading } = useQuery({
    queryKey: queryKeys.interpreters.list(0),
    queryFn: () => interpreterApi.list().then(r => r.payload ?? []),
  })

  const { mutate: deactivate } = useMutation({
    mutationFn: (id: string) => interpreterApi.deactivate(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.interpreters.list(0) }),
  })

  function handleDeactivate(id: string, name: string) {
    if (!confirm(`${name} 통번역가를 비활성화하시겠습니까?`)) return
    deactivate(id)
  }

  if (isLoading) return <AppShell><Spinner /></AppShell>

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
                    {INTERPRETER_ROLE_LABEL[i.role]} · {i.languages.join(', ') || '언어 미등록'}
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
