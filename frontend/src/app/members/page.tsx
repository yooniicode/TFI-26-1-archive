'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AppShell from '@/components/AppShell'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Spinner from '@/components/ui/Spinner'
import { authApi } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import type { InterpreterRole, Member, UpdateMemberRoleRequest, UserRole } from '@/lib/types'
import { INTERPRETER_ROLE_LABEL } from '@/lib/types'

const roleLabels: Record<Extract<UserRole, 'admin' | 'interpreter'>, string> = {
  admin: '센터 직원',
  interpreter: '통번역가',
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
      interpreterRole: member.interpreterRole ?? 'FREELANCER',
      name: member.name ?? '',
      phone: member.phone ?? '',
    }
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
              const isInterpreter = draft.role === 'interpreter'
              return (
                <div key={member.authUserId} className="card space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{member.name || member.email || member.authUserId}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{member.email ?? member.authUserId}</p>
                      {member.phone && <p className="text-xs text-gray-400">{member.phone}</p>}
                    </div>
                    <Badge variant={member.profileRegistered ? 'green' : 'yellow'}>
                      {member.profileRegistered ? '프로필 있음' : '프로필 없음'}
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

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="label">권한</label>
                      <select
                        className="input"
                        value={draft.role}
                        onChange={e => updateDraft(member, {
                          role: e.target.value as Extract<UserRole, 'admin' | 'interpreter'>,
                        })}
                      >
                        <option value="admin">{roleLabels.admin}</option>
                        <option value="interpreter">{roleLabels.interpreter}</option>
                      </select>
                    </div>

                    <div>
                      <label className="label">통번역가 구분</label>
                      <select
                        className="input"
                        value={draft.interpreterRole ?? 'FREELANCER'}
                        onChange={e => updateDraft(member, { interpreterRole: e.target.value as InterpreterRole })}
                        disabled={!isInterpreter}
                      >
                        {(Object.entries(INTERPRETER_ROLE_LABEL) as [InterpreterRole, string][]).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
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
