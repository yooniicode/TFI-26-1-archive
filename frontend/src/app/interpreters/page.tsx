'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AppShell from '@/components/AppShell'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { interpreterApi, chatApi } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { useTranslation } from '@/lib/i18n/I18nContext'
import { useMe } from '@/hooks/useMe'
import { INTERPRETER_LANGUAGE_OPTIONS } from '@/lib/constants'

export default function InterpretersPage() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { t } = useTranslation()
  const { data: me, isLoading: meLoading } = useMe()
  const [query, setQuery] = useState('')
  const [submittedQuery, setSubmittedQuery] = useState('')
  const [language, setLanguage] = useState('')
  const [chatLoading, setChatLoading] = useState<string | null>(null)
  const needsAdminCenter = me?.role === 'admin' && !me.centerId && !me.centerName

  async function handleOpenChat(interpreterId: string) {
    setChatLoading(interpreterId)
    try {
      const res = await chatApi.roomWithInterpreter(interpreterId)
      if (res.payload) router.push(`/chat/${res.payload.id}`)
    } catch { /* ignore */ } finally {
      setChatLoading(null)
    }
  }

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: queryKeys.interpreters.list(0, submittedQuery, language),
    queryFn: () => interpreterApi.list(0, submittedQuery, language).then(r => r.payload ?? []),
    enabled: !meLoading && !!me && !needsAdminCenter,
  })

  const totalMonthlyHours = useMemo(
    () => items.reduce((sum, item) => sum + (item.monthlyWorkHours ?? 0), 0),
    [items],
  )

  const { mutate: deactivate } = useMutation({
    mutationFn: (id: string) => interpreterApi.deactivate(id),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: queryKeys.interpreters.list(0, submittedQuery, language),
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

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
              !language ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500'
            }`}
            onClick={() => setLanguage('')}
          >
            {t.interpreter.language_all}
          </button>
          {INTERPRETER_LANGUAGE_OPTIONS.map(option => (
            <button
              key={option}
              type="button"
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${
                language === option ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-500'
              }`}
              onClick={() => setLanguage(prev => prev === option ? '' : option)}
            >
              {option}
            </button>
          ))}
        </div>

        {meLoading || isLoading ? (
          <Spinner />
        ) : needsAdminCenter ? (
          <EmptyState message={t.common.admin_center_required} />
        ) : error ? (
          <EmptyState message={error instanceof Error ? error.message : t.interpreter.empty} />
        ) : items.length === 0 ? (
          <EmptyState message={t.interpreter.empty} />
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-100 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500">
                <tr>
                  <th className="px-3 py-2">{t.auth.name}</th>
                  <th className="px-3 py-2">{t.login.phone}</th>
                  <th className="px-3 py-2">{t.auth_complete.languages}</th>
                  <th className="px-3 py-2">{t.interpreter.availability}</th>
                  <th className="px-3 py-2 text-right">{t.interpreter.monthly_hours}</th>
                  <th className="px-3 py-2 text-right">{t.common.edit}</th>
                  <th className="px-3 py-2 text-right">{t.chat.open_chat}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(i => (
                  <tr key={i.id} className="align-top">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{i.name}</span>
                        {!i.active && <Badge variant="red">{t.interpreter.inactive}</Badge>}
                      </div>
                      {i.centerName && <p className="mt-1 text-xs text-gray-400">{i.centerName}</p>}
                    </td>
                    <td className="px-3 py-3 text-gray-500">{i.phone || '-'}</td>
                    <td className="px-3 py-3 text-gray-500">{i.languages.join(', ') || t.interpreter.no_language}</td>
                    <td className="px-3 py-3 text-gray-500">{i.availabilityNote || '-'}</td>
                    <td className="px-3 py-3 text-right font-medium text-gray-900">{formatHours(i.monthlyWorkHours ?? 0)}</td>
                    <td className="px-3 py-3 text-right">
                      {i.active && (
                        <button
                          onClick={() => handleDeactivate(i.id, i.name)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          {t.interpreter.deactivate}
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        disabled={chatLoading === i.id}
                        onClick={() => handleOpenChat(i.id)}
                        className="text-xs font-semibold text-primary-600 hover:text-primary-700"
                      >
                        {chatLoading === i.id ? '...' : t.chat.open_chat}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 text-sm font-semibold text-gray-900">
                <tr>
                  <td className="px-3 py-2" colSpan={4}>{t.interpreter.total_hours}</td>
                  <td className="px-3 py-2 text-right">{formatHours(totalMonthlyHours)}</td>
                  <td />
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  )
}

function formatHours(value: number) {
  return `${Number(value.toFixed(1))}h`
}
