'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { authApi } from '@/lib/api'
import type { AuthMe, UserRole } from '@/lib/types'
import clsx from 'clsx'

interface NavItem { href: string; label: string; icon: string; roles: UserRole[] }

const NAV: NavItem[] = [
  { href: '/dashboard',     label: '홈',       icon: '🏠', roles: ['ADMIN','INTERPRETER','PATIENT'] },
  { href: '/consultations', label: '보고서',   icon: '📝', roles: ['ADMIN','INTERPRETER'] },
  { href: '/patients',      label: '이주민',   icon: '👥', roles: ['ADMIN','INTERPRETER'] },
  { href: '/handovers',     label: '인수인계', icon: '🔄', roles: ['ADMIN','INTERPRETER'] },
  { href: '/matching',      label: '매칭',     icon: '🔀', roles: ['ADMIN'] },
  { href: '/interpreters',  label: '통번역가', icon: '🧑‍💼', roles: ['ADMIN'] },
  { href: '/my-records',   label: '내 기록',  icon: '📋', roles: ['PATIENT'] },
]

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [me, setMe] = useState<AuthMe | null>(null)

  useEffect(() => {
    authApi.me().then(r => setMe(r.payload)).catch(() => {})
  }, [])

  async function handleLogout() {
    await createClient().auth.signOut()
    router.push('/login')
  }

  const visibleNav = me ? NAV.filter(n => n.roles.includes(me.role)) : []

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto bg-white shadow-sm">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-primary-700 text-lg">TFI</span>
        <div className="flex items-center gap-2">
          {me && (
            <span className="text-xs text-gray-500">
              {me.name ?? me.role}
            </span>
          )}
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500">
            로그아웃
          </button>
        </div>
      </header>

      {/* 본문 */}
      <main className="flex-1 pb-20 px-4 pt-4 overflow-y-auto">
        {children}
      </main>

      {/* 하단 네비게이션 */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-gray-100 flex justify-around z-10">
        {visibleNav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex flex-col items-center py-2 px-3 text-xs gap-0.5 flex-1',
              pathname.startsWith(item.href)
                ? 'text-primary-600 font-semibold'
                : 'text-gray-400',
            )}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  )
}
