'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { authApi } from '@/lib/api'
import { getRequestedMemberRole, type RequestedMemberRole } from '@/lib/authMetadata'
import type { UserRole } from '@/lib/types'
import { useMe } from '@/hooks/useMe'
import clsx from 'clsx'

interface NavItem { href: string; label: string; icon: string; roles: UserRole[] }

const NAV: NavItem[] = [
  { href: '/dashboard',     label: '홈',       icon: '⌂', roles: ['admin','interpreter','patient'] },
  { href: '/consultations', label: '보고서',   icon: '□', roles: ['admin','interpreter'] },
  { href: '/patients',      label: '이주민',   icon: '◇', roles: ['admin','interpreter'] },
  { href: '/handovers',     label: '인수인계', icon: '↔', roles: ['admin','interpreter'] },
  { href: '/matching',      label: '매칭',     icon: '◎', roles: ['admin'] },
  { href: '/interpreters',  label: '통번역가', icon: '▣', roles: ['admin'] },
  { href: '/members',       label: '회원',     icon: '○', roles: ['admin'] },
  { href: '/my-records',    label: '내 기록',  icon: '□', roles: ['patient'] },
]

const requestedRoleLabel = (request: RequestedMemberRole) => {
  if (request.role === 'admin') return '센터 직원'
  if (request.interpreterRole === 'FREELANCER') return '프리랜서'
  if (request.interpreterRole === 'STAFF') return '센터 직원'
  return '통번역가'
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: me } = useMe()
  const [pendingRequest, setPendingRequest] = useState<RequestedMemberRole | null>(null)
  const [bootstrapLoading, setBootstrapLoading] = useState(false)
  const [bootstrapError, setBootstrapError] = useState('')
  const [bootstrapCode, setBootstrapCode] = useState('')

  useEffect(() => {
    createClient().auth.getSession().then(({ data: { session } }) => {
      setPendingRequest(getRequestedMemberRole(session?.user.user_metadata ?? null))
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
      await authApi.bootstrapAdmin(bootstrapCode.trim())
      await createClient().auth.refreshSession()
      router.replace('/dashboard')
      router.refresh()
    } catch (e) {
      setBootstrapError(e instanceof Error ? e.message : '최초 센터 직원 계정 생성에 실패했습니다.')
      setBootstrapLoading(false)
    }
  }

  const visibleNav = me ? NAV.filter(n => n.roles.includes(me.role)) : []
  const needsApproval = !!me && me.role === 'patient' && !!pendingRequest && !pathname.startsWith('/auth/')
  const needsProfile = !!me && me.role !== 'admin' && !me.entityId && !needsApproval && !pathname.startsWith('/auth/')

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-white shadow-sm">
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
            </p>
            {pendingRequest?.role === 'admin' && (
              <>
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
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-primary-700 text-lg">TFI</Link>
        <div className="flex items-center gap-3">
          {me && (
            <span className="text-xs text-gray-500">
              {me.name ?? me.role}
            </span>
          )}
          <Link href="/mypage" className="flex flex-col gap-1 p-1 rounded hover:bg-gray-100 transition-colors" aria-label="마이페이지">
            <span className="block w-5 h-0.5 bg-gray-600 rounded" />
            <span className="block w-5 h-0.5 bg-gray-600 rounded" />
            <span className="block w-5 h-0.5 bg-gray-600 rounded" />
          </Link>
        </div>
      </header>

      <main className="flex-1 pb-20 px-4 pt-4 overflow-y-auto">
        {children}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-gray-100 flex justify-around z-10">
        {visibleNav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex flex-col items-center py-2 px-2 text-xs gap-0.5 flex-1',
              pathname.startsWith(item.href)
                ? 'text-primary-600 font-semibold'
                : 'text-gray-400',
            )}
          >
            <span className="text-base">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
