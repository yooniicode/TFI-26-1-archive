'use client'

import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import AppHeader from '@/components/layout/AppHeader'
import AuthGateOverlays from '@/components/layout/AuthGateOverlays'
import { DesktopSidebar, DesktopTopNav, MobileBottomNav } from '@/components/layout/AppNavigation'
import { getNavItems } from '@/components/layout/navItems'
import { useLayoutMode } from '@/hooks/useLayoutMode'
import { useMe } from '@/hooks/useMe'
import { authApi, chatApi } from '@/lib/api'
import { useTranslation } from '@/lib/i18n/I18nContext'
import { queryKeys } from '@/lib/queryKeys'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { data: me } = useMe()
  const { layoutMode, setLayoutMode } = useLayoutMode()
  const { t } = useTranslation()
  const isDesktopMode = layoutMode === 'desktop'
  const canLoadMemberRequests = me?.role === 'admin' && !!(me.centerId || me.centerName)
  const { data: members = [] } = useQuery({
    queryKey: queryKeys.members,
    queryFn: () => authApi.members().then(r => r.payload ?? []),
    enabled: canLoadMemberRequests,
    refetchInterval: 30000,
  })
  const { data: unreadData } = useQuery({
    queryKey: queryKeys.chat.unreadCount(),
    queryFn: () => chatApi.unreadCount().then(r => r.payload?.total ?? 0),
    enabled: !!me,
    refetchInterval: 30000,
  })
  const unreadChatCount = unreadData ?? 0
  const pendingApprovals = members.filter(member => !member.approved).length
  const visibleNav = me?.role
    ? getNavItems(t)
      .filter(item => item.roles.includes(me.role!))
      .map(item => {
        if (item.href === '/members') return { ...item, badgeCount: pendingApprovals }
        if (item.href === '/chat') return { ...item, badgeCount: unreadChatCount }
        return item
      })
    : []

  return (
    <div className={clsx(
      'min-h-screen bg-gray-50',
      !isDesktopMode && 'max-w-lg mx-auto bg-white shadow-sm',
    )}>
      <AuthGateOverlays me={me} pathname={pathname} />

      <div className={clsx('min-h-screen', isDesktopMode ? 'flex' : 'flex flex-col')}>
        {isDesktopMode && <DesktopSidebar items={visibleNav} pathname={pathname} />}

        <div className="flex min-h-screen flex-1 flex-col bg-white">
          <AppHeader
            me={me}
            layoutMode={layoutMode}
            onLayoutModeChange={setLayoutMode}
            pendingApprovals={pendingApprovals}
            signupRequestLabel={t.common.signup_requests}
          />
          {isDesktopMode && <DesktopTopNav items={visibleNav} pathname={pathname} />}

          <main className={clsx(
            'flex-1 overflow-y-auto',
            isDesktopMode ? 'px-4 py-5 md:px-6 md:py-6' : 'pb-20 px-4 pt-4',
          )}>
            {children}
          </main>
        </div>
      </div>

      {!isDesktopMode && <MobileBottomNav items={visibleNav} pathname={pathname} />}
    </div>
  )
}
