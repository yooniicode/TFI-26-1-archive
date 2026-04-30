'use client'

import Link from 'next/link'
import clsx from 'clsx'
import LayoutModeToggle from './LayoutModeToggle'
import type { LayoutMode } from '@/hooks/useLayoutMode'
import type { AuthMe } from '@/lib/types'

interface AppHeaderProps {
  me?: AuthMe
  layoutMode: LayoutMode
  onLayoutModeChange: (mode: LayoutMode) => void
}

export default function AppHeader({ me, layoutMode, onLayoutModeChange }: AppHeaderProps) {
  const isDesktopMode = layoutMode === 'desktop'

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 md:px-6 flex items-center justify-between gap-3">
      <Link
        href="/dashboard"
        className={clsx('font-bold text-primary-700 text-lg shrink-0', isDesktopMode && 'md:hidden')}
      >
        LinkUs
      </Link>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        {me && (
          <span className="max-w-[96px] truncate text-xs text-gray-500 md:max-w-xs">
            {me.name ?? me.role}
          </span>
        )}
        <LayoutModeToggle mode={layoutMode} onChange={onLayoutModeChange} />
        <Link href="/mypage" className="flex flex-col gap-1 p-1 rounded hover:bg-gray-100 transition-colors shrink-0" aria-label="마이페이지">
          <span className="block w-5 h-0.5 bg-gray-600 rounded" />
          <span className="block w-5 h-0.5 bg-gray-600 rounded" />
          <span className="block w-5 h-0.5 bg-gray-600 rounded" />
        </Link>
      </div>
    </header>
  )
}
