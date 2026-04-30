'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AppShell from '@/components/AppShell'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { interpreterApi } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { useEnumLabels } from '@/lib/i18n/enumLabels'
import { useTranslation } from '@/lib/i18n/I18nContext'

export default function InterpretersPage() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const labels = useEnumLabels()
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
    if (!confirm(t.interpreter.confirm_deactivate(name))) return
    deactivate(id)
  }

  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-lg font-bold">{t.interpreter.title}</h1>

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
            placeholder={t.interpreter.search_placeholder}
          />
          <button type="submit" className="btn-secondary shrink-0">{t.common.search}</button>
        </form>

        {isLoading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState message={t.interpreter.empty} />
        ) : (
          <div className="space-y-2">
            {items.map(i => (
              <div key={i.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{i.name}</p>
                      {!i.active && <Badge variant="red">{t.interpreter.inactive}</Badge>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {labels.interpreterRole[i.role]} · {i.languages.join(', ') || t.interpreter.no_language}
                    </p>
                    {i.availabilityNote && (
                      <p className="text-xs text-gray-400">{t.interpreter.availability}: {i.availabilityNote}</p>
                    )}
                    {i.centerName && <p className="text-xs text-gray-400">{t.interpreter.work_center}: {i.centerName}</p>}
                    {i.phone && <p className="text-xs text-gray-400">{i.phone}</p>}
                  </div>
                  {i.active && (
                    <button
                      onClick={() => handleDeactivate(i.id, i.name)}
                      className="text-xs text-red-500 hover:text-red-700 shrink-0"
                    >
                      {t.interpreter.deactivate}
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
