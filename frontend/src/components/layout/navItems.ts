import type { AppTranslation } from '@/lib/i18n/ko'
import type { UserRole } from '@/lib/types'

export interface NavItem {
  href: string
  label: string
  icon: string
  roles: UserRole[]
  badgeCount?: number
}

export function getNavItems(t: AppTranslation): NavItem[] {
  return [
    { href: '/dashboard',         label: t.nav.home,             icon: 'H', roles: ['admin', 'interpreter', 'patient'] },
    { href: '/consultations',     label: t.nav.consultations,    icon: 'R', roles: ['admin', 'interpreter'] },
    { href: '/patients',          label: t.nav.patients,         icon: 'P', roles: ['admin', 'interpreter'] },
    { href: '/handovers',         label: t.nav.handovers,        icon: 'T', roles: ['interpreter'] },
    { href: '/matching',          label: t.nav.matching,         icon: 'M', roles: ['admin'] },
    { href: '/interpreters',      label: t.nav.interpreters,     icon: 'I', roles: ['admin'] },
    { href: '/members',           label: t.nav.members,          icon: 'S', roles: ['admin'] },
    { href: '/consultations/new', label: t.nav.new_consultation, icon: 'N', roles: ['interpreter'] },
    { href: '/my-records',        label: t.nav.my_records,       icon: 'Y', roles: ['patient'] },
    { href: '/chat',              label: t.nav.chat,             icon: 'C', roles: ['admin', 'interpreter', 'patient'] },
  ]
}
