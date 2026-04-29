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

type MemberRoleOption = 'admin' | 'activist' | 'freelancer'

const roleLabels: Record<MemberRoleOption, string> = {
  admin: '센터 직원',
  activist: '통번역가',
  freelancer: '프리랜서',
}

export default function MembersPage() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Record<string, UpdateMemberRoleRequest>>({})

  const { data: members = [], isLoading } = useQuery({
    queryKey: queryKeys.members,
    queryFn: () => authApi.members().then(r => r.payload ?? []),
  })

  const { mutate: saveRole, isPending, error } = useMutation({
    mutationFn: ({ authUserId, body }: { authUserId: string; body: UpdateMemberRoleRequest }) =>
      authApi.updateMemberRole(authUserId, body),
    onSuccess: () => {
      setEditing({})
      queryClient.invalidateQueries({ queryKey: queryKeys.members })
      queryClient.invalidateQueries({ queryKey: queryKeys.me })
    },
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
    return draft.interpreterRole === 'FREELANCER' ? 'freelancer' : 'activist'
  }

  function rolePatch(value: MemberRoleOption): Pick<UpdateMemberRoleRequest, 'role' | 'interpreterRole'> {
    if (value === 'admin') return { role: 'admin', interpreterRole: 'STAFF' }
    if (value === 'freelancer') return { role: 'interpreter', interpreterRole: 'FREELANCER' }
    return { role: 'interpreter', interpreterRole: 'ACTIVIST' }
  }

  function updateDraft(member: Member, patch: Partial<UpdateMemberRoleRequest>) {
    setEditing(prev => ({
      ...prev,
      [member.authUserId]: { ...draftFor(member), ...patch } as UpdateMemberRoleRequest,
    }))
  }

  if (isLoading) return <AppShell><Spinner /></AppShell>

  return (
    <AppShell>
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-bold">비이주민 회원 관리</h1>
          <p className="text-xs text-gray-500 mt-1">
            센터 직원만 회원의 센터/통번역가/프리랜서 구분을 변경할 수 있습니다.
          </p>
        </div>

        {error && <p className="text-xs text-red-500">{error instanceof Error ? error.message : '저장에 실패했습니다.'}</p>}

        {members.length === 0 ? (
          <EmptyState message="관리할 비이주민 회원이 없습니다." />
        ) : (
          <div className="space-y-3">
            {members.map(member => {
              const draft = draftFor(member)
              return (
                <div key={member.authUserId} className="card space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{member.name || member.email || member.authUserId}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{member.email ?? member.authUserId}</p>
                      {member.phone && <p className="text-xs text-gray-400">{member.phone}</p>}
                      {member.centerName && <p className="text-xs text-gray-400">근무 센터: {member.centerName}</p>}
                    </div>
                    <Badge variant={member.approved ? 'green' : 'yellow'}>
                      {member.approved ? '승인됨' : '승인 대기'}
                    </Badge>
                  </div>

                  {!member.profileRegistered && (
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="input"
                        value={draft.name ?? ''}
                        onChange={e => updateDraft(member, { name: e.target.value })}
                        placeholder="이름"
                      />
                      <input
                        className="input"
                        value={draft.phone ?? ''}
                        onChange={e => updateDraft(member, { phone: e.target.value })}
                        placeholder="연락처"
                      />
                    </div>
                  )}

                  <div>
                    <label className="label">역할</label>
                    <select
                      className="input"
                      value={roleValue(draft)}
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
                    disabled={isPending}
                    onClick={() => saveRole({ authUserId: member.authUserId, body: draft })}
                  >
                    {isPending ? '저장 중...' : '역할 저장'}
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
