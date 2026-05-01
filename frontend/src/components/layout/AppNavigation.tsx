'use client'

import Link from 'next/link'
import clsx from 'clsx'
import type { NavItem } from './navItems'

interface AppNavigationProps {
  items: NavItem[]
  pathname: string
}

export function DesktopSidebar({ items, pathname }: AppNavigationProps) {
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-gray-100 bg-white px-4 py-4">
      <Link href="/dashboard" className="mb-6 font-bold text-primary-700 text-xl">LinkUs</Link>
      <nav className="space-y-1">
        {items.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
              pathname.startsWith(item.href)
                ? 'bg-primary-50 text-primary-700 font-semibold'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800',
            )}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
            {!!item.badgeCount && (
              <span className="ml-auto rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {item.badgeCount}
              </span>
            )}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

export function DesktopTopNav({ items, pathname }: AppNavigationProps) {
  if (items.length === 0) return null

  return (
    <nav className="md:hidden border-b border-gray-100 bg-white px-4 py-2">
      <div className="flex gap-2 overflow-x-auto">
        {items.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              'shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium',
              pathname.startsWith(item.href)
                ? 'bg-primary-50 text-primary-700'
                : 'text-gray-500',
            )}
        >
            {item.label}
            {!!item.badgeCount && (
              <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                {item.badgeCount}
              </span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  )
}

export function MobileBottomNav({ items, pathname }: AppNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg bg-white border-t border-gray-100 flex justify-around z-10">
      {items.map(item => (
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
          <span className="relative max-w-full truncate">
            {item.label}
            {!!item.badgeCount && (
              <span className="ml-1 rounded-full bg-red-500 px-1 py-0.5 text-[9px] font-semibold text-white">
                {item.badgeCount}
              </span>
            )}
          </span>
        </Link>
      ))}
    </nav>
  )
}
