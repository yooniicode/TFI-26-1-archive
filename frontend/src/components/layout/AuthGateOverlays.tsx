'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { authApi } from '@/lib/api'
import { getRequestedMemberRole, type RequestedMemberRole } from '@/lib/authMetadata'
import type { AuthMe } from '@/lib/types'

interface AuthGateOverlaysProps {
  me?: AuthMe
  pathname: string
}

const requestedRoleLabel = (request: RequestedMemberRole) => {
  if (request.role === 'admin') return '센터 직원'
  if (request.interpreterRole === 'FREELANCER') return '프리랜서'
  if (request.interpreterRole === 'STAFF') return '센터 직원'
  return '통번역가'
}

export default function AuthGateOverlays({ me, pathname }: AuthGateOverlaysProps) {
  const router = useRouter()
  const [pendingRequest, setPendingRequest] = useState<RequestedMemberRole | null>(null)
  const [bootstrapLoading, setBootstrapLoading] = useState(false)
  const [bootstrapError, setBootstrapError] = useState('')
  const [bootstrapCode, setBootstrapCode] = useState('')
  const [bootstrapCenterName, setBootstrapCenterName] = useState('')

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      const request = getRequestedMemberRole(session?.user.user_metadata ?? null)
      setPendingRequest(request)
      if (request?.centerName) setBootstrapCenterName(request.centerName)
    })
  }, [])

  async function handleLogout() {
    await createClient().auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  async function handleBootstrapAdmin() {
    setBootstrapLoading(true)
    setBootstrapError('')
    try {
      if (!bootstrapCode.trim()) {
        setBootstrapError('관리자 초기 가입 코드를 입력해주세요.')
        setBootstrapLoading(false)
        return
      }
      if (!bootstrapCenterName.trim()) {
        setBootstrapError('근무 센터를 입력해주세요.')
        setBootstrapLoading(false)
        return
      }
      await authApi.bootstrapAdmin(bootstrapCode.trim(), bootstrapCenterName.trim())
      await createClient().auth.refreshSession()
      router.replace('/dashboard')
      router.refresh()
    } catch (e) {
      setBootstrapError(e instanceof Error ? e.message : '최초 센터 직원 계정 생성에 실패했습니다.')
      setBootstrapLoading(false)
    }
  }

  const needsApproval = !!me && me.role === 'patient' && !!pendingRequest && !pathname.startsWith('/auth/')
  const needsProfile = !!me && me.role !== 'admin' && !me.entityId && !needsApproval && !pathname.startsWith('/auth/')

  return (
    <>
      {needsProfile && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-10">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <p className="text-lg mb-1">반갑습니다</p>
            <h2 className="text-base font-bold mb-2">기본 정보를 입력해 주세요</h2>
            <p className="text-sm text-gray-500 mb-5">
              서비스 이용을 위해 이름과 역할 정보를 먼저 등록해 주세요.
            </p>
            <button
              onClick={() => router.push('/auth/complete')}
              className="btn-primary w-full"
            >
              정보 입력하러 가기
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="btn-secondary w-full mt-2"
            >
              로그아웃
            </button>
          </div>
        </div>
      )}

      {needsApproval && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-10">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <p className="text-lg mb-1">승인 대기 중</p>
            <h2 className="text-base font-bold mb-2">
              {pendingRequest ? requestedRoleLabel(pendingRequest) : '회원'} 권한 승인이 필요합니다
            </h2>
            <p className="text-sm text-gray-500 mb-5">
              센터 직원이 회원 관리에서 권한을 승인하면 이 계정으로 이용할 수 있습니다.
              {pendingRequest?.centerName ? ` 근무 센터: ${pendingRequest.centerName}.` : ''}
            </p>
            {pendingRequest?.role === 'admin' && (
              <>
                <input
                  className="input mb-2"
                  value={bootstrapCenterName}
                  onChange={e => setBootstrapCenterName(e.target.value)}
                  placeholder="근무 센터"
                />
                <input
                  className="input mb-2"
                  type="password"
                  value={bootstrapCode}
                  onChange={e => setBootstrapCode(e.target.value)}
                  placeholder="관리자 초기 가입 코드"
                />
                <button
                  type="button"
                  onClick={handleBootstrapAdmin}
                  disabled={bootstrapLoading}
                  className="btn-primary w-full mb-2"
                >
                  {bootstrapLoading ? '확인 중...' : '최초 센터 직원 계정 만들기'}
                </button>
              </>
            )}
            <button
              onClick={async () => {
                await createClient().auth.refreshSession()
                window.location.reload()
              }}
              disabled={bootstrapLoading}
              className={pendingRequest?.role === 'admin' ? 'btn-secondary w-full' : 'btn-primary w-full'}
            >
              승인 상태 다시 확인
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="btn-secondary w-full mt-2"
            >
              로그아웃
            </button>
            {bootstrapError && <p className="text-xs text-red-500 mt-3">{bootstrapError}</p>}
          </div>
        </div>
      )}
    </>
  )
}
