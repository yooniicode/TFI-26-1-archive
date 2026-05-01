'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AppShell from '@/components/AppShell'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Spinner from '@/components/ui/Spinner'
import { authApi } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { Member, UpdateMemberRoleRequest } from '@/lib/types'
import { useMe } from '@/hooks/useMe'
import { useTranslation } from '@/lib/i18n/I18nContext'

type MemberRoleOption = 'admin' | 'activist'

export default function MembersPage() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  const { data: me, isLoading: meLoading } = useMe()
  const [editing, setEditing] = useState<Record<string, UpdateMemberRoleRequest>>({})
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null)
  const needsAdminCenter = me?.role === 'admin' && !me.centerId && !me.centerName

  const roleLabels: Record<MemberRoleOption, string> = {
    admin: t.member.role_admin,
    activist: t.member.role_activist,
  }

  const { data: members = [], isLoading } = useQuery({
    queryKey: queryKeys.members,
    queryFn: () => authApi.members().then(r => r.payload ?? []),
    enabled: !meLoading && !!me && !needsAdminCenter,
  })

  const { mutate: saveRole, error } = useMutation({
    mutationFn: ({ authUserId, body }: { authUserId: string; body: UpdateMemberRoleRequest }) =>
      authApi.updateMemberRole(authUserId, body),
    onSuccess: (_data, variables) => {
      setEditing(prev => {
        const next = { ...prev }
        delete next[variables.authUserId]
        return next
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.members })
      queryClient.invalidateQueries({ queryKey: queryKeys.me })
    },
    onSettled: () => setSavingMemberId(null),
  })

  function draftFor(member: Member): UpdateMemberRoleRequest {
    return editing[member.authUserId] ?? {
      role: member.role,
      interpreterRole: member.interpreterRole ?? 'ACTIVIST',
      name: member.name ?? '',
      phone: member.phone ?? '',
    }
  }

  function roleValue(draft: UpdateMemberRoleRequest): MemberRoleOption {
    if (draft.role === 'admin') return 'admin'
    return 'activist'
  }

  function rolePatch(value: MemberRoleOption): Pick<UpdateMemberRoleRequest, 'role' | 'interpreterRole'> {
    if (value === 'admin') return { role: 'admin', interpreterRole: 'STAFF' }
    return { role: 'interpreter', interpreterRole: 'ACTIVIST' }
  }

  function updateDraft(member: Member, patch: Partial<UpdateMemberRoleRequest>) {
    setEditing(prev => ({
      ...prev,
      [member.authUserId]: { ...draftFor(member), ...patch } as UpdateMemberRoleRequest,
    }))
  }

  if (meLoading || isLoading) return <AppShell><Spinner /></AppShell>

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold">{t.member.title}</h1>
          <p className="text-xs text-gray-500 mt-1">{t.member.subtitle}</p>
        </div>

        {error && <p className="text-xs text-red-500">{error instanceof Error ? error.message : t.member.err_save}</p>}

        {needsAdminCenter ? (
          <EmptyState message={t.common.admin_center_required} />
        ) : members.length === 0 ? (
          <EmptyState message={t.member.empty} />
        ) : (
          <div className="space-y-3">
            {members.map(member => {
              const draft = draftFor(member)
              const rowSaving = savingMemberId === member.authUserId
              return (
                <div key={member.authUserId} className="card space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{member.name || member.email || member.authUserId}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{member.email ?? member.authUserId}</p>
                      {member.phone && <p className="text-xs text-gray-400">{member.phone}</p>}
                      {member.centerName && <p className="text-xs text-gray-400">{t.member.work_center}: {member.centerName}</p>}
                    </div>
                    <Badge variant={member.approved ? 'green' : 'yellow'}>
                      {member.approved ? t.member.approved : t.member.pending}
                    </Badge>
                  </div>

                  {!member.profileRegistered && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="input"
                        value={draft.name ?? ''}
                        onChange={e => updateDraft(member, { name: e.target.value })}
                        placeholder={t.member.name_placeholder}
                      />
                      <input
                        className="input"
                        value={draft.phone ?? ''}
                        onChange={e => updateDraft(member, { phone: e.target.value })}
                        placeholder={t.member.phone_placeholder}
                      />
                    </div>
                  )}

                  <div>
                    <label className="label">
                      {t.member.role_label} {me?.authUserId === member.authUserId && <span className="text-xs text-red-500 font-normal ml-1">{t.member.self_role_note}</span>}
                    </label>
                    <select
                      className="input"
                      value={roleValue(draft)}
                      disabled={me?.authUserId === member.authUserId}
                      onChange={e => updateDraft(member, rolePatch(e.target.value as MemberRoleOption))}
                    >
                      {(Object.entries(roleLabels) as [MemberRoleOption, string][]).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    className="btn-primary w-full"
                    disabled={rowSaving || me?.authUserId === member.authUserId}
                    onClick={() => {
                      setSavingMemberId(member.authUserId)
                      saveRole({ authUserId: member.authUserId, body: draft })
                    }}
                  >
                    {rowSaving ? t.common.saving : t.member.role_save}
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
