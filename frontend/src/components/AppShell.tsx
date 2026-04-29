'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
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

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: me } = useMe()

  async function handleLogout() {
    await createClient().auth.signOut()
    router.replace('/login')
    router.refresh()
  }

  const visibleNav = me ? NAV.filter(n => n.roles.includes(me.role)) : []
  const needsProfile = !!me && me.role !== 'admin' && !me.entityId && !pathname.startsWith('/auth/')

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
