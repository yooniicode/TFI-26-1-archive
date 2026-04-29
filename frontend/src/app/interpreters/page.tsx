'use client'

import { useState } from 'react'
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
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')

  const { data: items = [], isLoading } = useQuery({
    queryKey: queryKeys.interpreters.list(0, submittedQuery),
    queryFn: () => interpreterApi.list(0, submittedQuery).then(r => r.payload ?? []),
  })

  const { mutate: deactivate } = useMutation({
    mutationFn: (id: string) => interpreterApi.deactivate(id),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: queryKeys.interpreters.list(0, submittedQuery),
    }),
  })

  function handleDeactivate(id: string, name: string) {
    if (!confirm(`${name} 통번역가를 비활성화하시겠습니까?`)) return
    deactivate(id)
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-lg font-bold">통번역가 관리</h1>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSubmittedQuery(query.trim())
          }}
          className="flex gap-2"
        >
          <input
            className="input flex-1"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="이름, 연락처, 언어 검색"
          />
          <button type="submit" className="btn-secondary shrink-0">검색</button>
        </form>

        {isLoading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState message="등록된 통번역가가 없습니다." />
        ) : (
          <div className="space-y-2">
            {items.map(i => (
              <div key={i.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{i.name}</p>
                      {!i.active && <Badge variant="red">비활성</Badge>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {INTERPRETER_ROLE_LABEL[i.role]} · {i.languages.join(', ') || '언어 미등록'}
                    </p>
                    {i.centerName && <p className="text-xs text-gray-400">근무 센터: {i.centerName}</p>}
                    {i.phone && <p className="text-xs text-gray-400">{i.phone}</p>}
                  </div>
                  {i.active && (
                    <button
                      onClick={() => handleDeactivate(i.id, i.name)}
                      className="text-xs text-red-500 hover:text-red-700 shrink-0"
                    >
                      비활성화
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
