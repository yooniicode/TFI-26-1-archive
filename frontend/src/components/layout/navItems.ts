import type { UserRole } from '@/lib/types'

export interface NavItem {
  href: string
  label: string
  icon: string
  roles: UserRole[]
}

export const APP_NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',     label: '홈',       icon: '⌂', roles: ['admin','interpreter','patient'] },
  { href: '/consultations', label: '보고서',   icon: '□', roles: ['admin','interpreter'] },
  { href: '/patients',      label: '이주민',   icon: '◇', roles: ['admin','interpreter'] },
  { href: '/handovers',     label: '인수인계', icon: '↔', roles: ['admin','interpreter'] },
  { href: '/matching',      label: '매칭',     icon: '◎', roles: ['admin'] },
  { href: '/interpreters',  label: '통번역가', icon: '▣', roles: ['admin'] },
  { href: '/members',       label: '회원',     icon: '○', roles: ['admin'] },
  { href: '/centers',       label: '센터',     icon: '⌘', roles: ['admin'] },
  { href: '/my-records',    label: '내 기록',  icon: '□', roles: ['patient'] },
]
