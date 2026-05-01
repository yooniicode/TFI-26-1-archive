'use client'

import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import Badge from '@/components/ui/Badge'
import Spinner from '@/components/ui/Spinner'
import { announcementApi, consultationApi } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { useMe } from '@/hooks/useMe'
import type { Announcement, AnnouncementCategory, Consultation } from '@/lib/types'
import { useEnumLabels } from '@/lib/i18n/enumLabels'
import { useTranslation } from '@/lib/i18n/I18nContext'

export default function DashboardPage() {
  const queryClient = useQueryClient()
  const { data: me, isLoading: meLoading } = useMe()
  const { t } = useTranslation()
  const labels = useEnumLabels()
  const canViewConsultations = me?.role === 'interpreter' || (me?.role === 'admin' && !!(me.centerId || me.centerName))
  const canLoadAnnouncements = me?.role === 'patient' || (me?.role === 'admin' && !!(me.centerId || me.centerName))
  const [announcementCategory, setAnnouncementCategory] = useState<AnnouncementCategory>('NOTICE')
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementContent, setAnnouncementContent] = useState('')
  const [announcementLinkUrl, setAnnouncementLinkUrl] = useState('')
  const [announcementPinned, setAnnouncementPinned] = useState(false)

  const { data: consultations, isLoading: listLoading } = useQuery({
    queryKey: queryKeys.consultations.list(0),
    queryFn: () => consultationApi.list(0).then(r => (r.payload ?? []) as Consultation[]),
    enabled: canViewConsultations,
  })

  const { data: announcementResponse, isLoading: announcementsLoading, error: announcementsError } = useQuery({
    queryKey: queryKeys.announcements.list(0),
    queryFn: () => announcementApi.list(0),
    enabled: canLoadAnnouncements,
  })

  const createAnnouncement = useMutation({
    mutationFn: () => announcementApi.create({
      category: announcementCategory,
      title: announcementTitle.trim(),
      content: announcementContent.trim(),
      linkUrl: announcementLinkUrl.trim(),
      pinned: announcementPinned,
    }),
    onSuccess: () => {
      setAnnouncementCategory('NOTICE')
      setAnnouncementTitle('')
      setAnnouncementContent('')
      setAnnouncementLinkUrl('')
      setAnnouncementPinned(false)
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
  })

  const deleteAnnouncement = useMutation({
    mutationFn: (id: string) => announcementApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['announcements'] }),
  })

  if (meLoading || (canViewConsultations && listLoading)) return <AppShell><Spinner /></AppShell>

  const recent = (consultations ?? []).slice(0, 5)
  const announcements = announcementResponse?.payload ?? []

  const roleLabel =
    me?.role === 'admin' ? t.dashboard.role_admin
    : me?.role === 'interpreter' ? t.dashboard.role_interpreter
    : t.dashboard.role_patient

  const policyResources = [
    {
      href: 'https://www.hikorea.go.kr/',
      icon: 'H',
      title: t.dashboard.resource_hikorea_title,
      description: t.dashboard.resource_hikorea_desc,
    },
    {
      href: 'https://www.socinet.go.kr/soci/main/main.jsp?MENU_TYPE=S_TOP_SY',
      icon: 'S',
      title: t.dashboard.resource_socinet_title,
      description: t.dashboard.resource_socinet_desc,
    },
    {
      href: 'https://www.eps.go.kr/eo/eps_intro.eo',
      icon: 'E',
      title: t.dashboard.resource_eps_title,
      description: t.dashboard.resource_eps_desc,
    },
  ]

  const announcementCategoryLabels: Record<AnnouncementCategory, string> = {
    NOTICE: t.dashboard.announcement_category_notice,
    POLICY: t.dashboard.announcement_category_policy,
    RESOURCE: t.dashboard.announcement_category_resource,
  }

  function handleCreateAnnouncement(e: FormEvent) {
    e.preventDefault()
    if (!announcementTitle.trim() || !announcementContent.trim()) return
    createAnnouncement.mutate()
  }

  function handleDeleteAnnouncement(id: string) {
    if (!confirm(t.dashboard.announcement_delete_confirm)) return
    deleteAnnouncement.mutate(id)
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold">
            {t.dashboard.welcome(me?.name ?? '')}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{roleLabel}</p>
        </div>

        {me?.role === 'interpreter' && (
          <div className="grid grid-cols-2 gap-3">
            <Link href="/consultations/new" className="card flex flex-col items-center py-5 gap-2 hover:border-primary-300 transition-colors">
              <span className="text-3xl font-bold text-primary-600">R</span>
              <span className="text-sm font-medium">{t.dashboard.write_report}</span>
            </Link>
            <Link href="/handovers" className="card flex flex-col items-center py-5 gap-2 hover:border-primary-300 transition-colors">
              <span className="text-3xl font-bold text-primary-600">T</span>
              <span className="text-sm font-medium">{t.dashboard.handover}</span>
            </Link>
          </div>
        )}

        {me?.role === 'admin' && (
          <div className="grid grid-cols-3 gap-2">
            {[
              { href: '/patients', label: t.nav.patients, icon: 'P' },
              { href: '/interpreters', label: t.nav.interpreters, icon: 'I' },
              { href: '/matching', label: t.nav.matching, icon: 'M' },
            ].map(item => (
              <Link key={item.href} href={item.href} className="card flex flex-col items-center py-4 gap-1 text-center hover:border-primary-300">
                <span className="text-2xl font-bold text-primary-600">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        )}

        {me?.role === 'admin' && (
          <AdminAnnouncementSection
            announcements={announcements}
            category={announcementCategory}
            categoryLabels={announcementCategoryLabels}
            title={announcementTitle}
            content={announcementContent}
            linkUrl={announcementLinkUrl}
            pinned={announcementPinned}
            loading={announcementsLoading}
            saving={createAnnouncement.isPending}
            deletingId={deleteAnnouncement.variables}
            error={createAnnouncement.error ?? announcementsError}
            hasCenter={!!(me.centerId || me.centerName)}
            locale={t.locale}
            t={t}
            onCategoryChange={setAnnouncementCategory}
            onTitleChange={setAnnouncementTitle}
            onContentChange={setAnnouncementContent}
            onLinkUrlChange={setAnnouncementLinkUrl}
            onPinnedChange={setAnnouncementPinned}
            onSubmit={handleCreateAnnouncement}
            onDelete={handleDeleteAnnouncement}
          />
        )}

        {me?.role === 'patient' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/my-records" className="card flex flex-col items-center py-5 gap-2 hover:border-primary-300">
                <span className="text-3xl font-bold text-primary-600">R</span>
                <span className="text-sm font-medium">{t.dashboard.my_records}</span>
              </Link>
              {me.entityId && (
                <Link href={`/scripts/patient/${me.entityId}`} className="card flex flex-col items-center py-5 gap-2 hover:border-primary-300">
                  <span className="text-3xl font-bold text-primary-600">S</span>
                  <span className="text-sm font-medium">{t.dashboard.medical_scripts}</span>
                </Link>
              )}
            </div>

            <AnnouncementFeedSection
              announcements={announcements}
              categoryLabels={announcementCategoryLabels}
              loading={announcementsLoading}
              error={announcementsError}
              locale={t.locale}
              t={t}
            />

            <section className="space-y-3">
              <div>
                <h2 className="font-semibold">{t.dashboard.policy_resources}</h2>
                <p className="mt-0.5 text-xs text-gray-500">{t.dashboard.policy_resources_desc}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {policyResources.map(resource => (
                  <a
                    key={resource.href}
                    href={resource.href}
                    target="_blank"
                    rel="noreferrer"
                    className="card flex min-h-24 items-start gap-3 transition-colors hover:border-primary-300"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-sm font-bold text-primary-700">
                      {resource.icon}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-900">{resource.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-gray-500">{resource.description}</span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-primary-600">{t.dashboard.resource_open}</span>
                  </a>
                ))}
              </div>
            </section>
          </>
        )}

        {canViewConsultations && (
          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-semibold">{t.dashboard.recent_reports}</h2>
              <Link href="/consultations" className="text-sm text-primary-600">{t.dashboard.view_all}</Link>
            </div>
            <div className="space-y-2">
              {recent.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">{t.dashboard.no_reports}</p>
              )}
              {recent.map(c => (
                <Link key={c.id} href={`/consultations/${c.id}`} className="card flex items-center gap-3 hover:border-primary-200 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{c.patientName}</p>
                    <p className="text-xs text-gray-400">{c.consultationDate} / {labels.issue[c.issueType]}</p>
                  </div>
                  {c.confirmed
                    ? <Badge variant="green">{t.common.confirmed}</Badge>
                    : <Badge variant="yellow">{t.common.unconfirmed}</Badge>}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  )
}

function AdminAnnouncementSection({
  announcements,
  category,
  categoryLabels,
  title,
  content,
  linkUrl,
  pinned,
  loading,
  saving,
  deletingId,
  error,
  hasCenter,
  locale,
  t,
  onCategoryChange,
  onTitleChange,
  onContentChange,
  onLinkUrlChange,
  onPinnedChange,
  onSubmit,
  onDelete,
}: {
  announcements: Announcement[]
  category: AnnouncementCategory
  categoryLabels: Record<AnnouncementCategory, string>
  title: string
  content: string
  linkUrl: string
  pinned: boolean
  loading: boolean
  saving: boolean
  deletingId?: string
  error: unknown
  hasCenter: boolean
  locale: string
  t: ReturnType<typeof useTranslation>['t']
  onCategoryChange: (value: AnnouncementCategory) => void
  onTitleChange: (value: string) => void
  onContentChange: (value: string) => void
  onLinkUrlChange: (value: string) => void
  onPinnedChange: (value: boolean) => void
  onSubmit: (e: FormEvent) => void
  onDelete: (id: string) => void
}) {
  if (!hasCenter) {
    return (
      <section className="rounded-lg border border-yellow-100 bg-yellow-50 p-4">
        <h2 className="text-sm font-semibold text-yellow-900">{t.common.admin_center_required}</h2>
        <p className="mt-1 text-xs text-yellow-800">{t.common.admin_center_required_desc}</p>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-semibold">{t.dashboard.announcement_manage_title}</h2>
        <p className="mt-0.5 text-xs text-gray-500">{t.dashboard.announcement_manage_desc}</p>
      </div>

      <form onSubmit={onSubmit} className="card space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">{t.dashboard.announcement_category}</label>
            <select
              className="input"
              value={category}
              onChange={e => onCategoryChange(e.target.value as AnnouncementCategory)}
            >
              {(Object.entries(categoryLabels) as [AnnouncementCategory, string][]).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={pinned}
              onChange={e => onPinnedChange(e.target.checked)}
            />
            {t.dashboard.announcement_pinned}
          </label>
        </div>
        <div>
          <label className="label">{t.dashboard.announcement_title}</label>
          <input
            className="input"
            value={title}
            onChange={e => onTitleChange(e.target.value)}
            placeholder={t.dashboard.announcement_title_placeholder}
            maxLength={120}
            required
          />
        </div>
        <div>
          <label className="label">{t.dashboard.announcement_content}</label>
          <textarea
            className="input min-h-24"
            value={content}
            onChange={e => onContentChange(e.target.value)}
            placeholder={t.dashboard.announcement_content_placeholder}
            required
          />
        </div>
        <div>
          <label className="label">{t.dashboard.announcement_link_url}</label>
          <input
            className="input"
            value={linkUrl}
            onChange={e => onLinkUrlChange(e.target.value)}
            placeholder={t.dashboard.announcement_link_placeholder}
            maxLength={500}
          />
        </div>
        {!!error && <p className="text-xs text-red-500">{error instanceof Error ? error.message : t.dashboard.announcement_err_save}</p>}
        <button type="submit" className="btn-primary w-full sm:w-auto sm:px-5" disabled={saving}>
          {saving ? t.common.saving : t.common.save}
        </button>
      </form>

      <AnnouncementList
        announcements={announcements}
        categoryLabels={categoryLabels}
        loading={loading}
        locale={locale}
        t={t}
        admin
        deletingId={deletingId}
        onDelete={onDelete}
      />
    </section>
  )
}

function AnnouncementFeedSection({
  announcements,
  categoryLabels,
  loading,
  error,
  locale,
  t,
}: {
  announcements: Announcement[]
  categoryLabels: Record<AnnouncementCategory, string>
  loading: boolean
  error: unknown
  locale: string
  t: ReturnType<typeof useTranslation>['t']
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-semibold">{t.dashboard.announcement_feed_title}</h2>
        <p className="mt-0.5 text-xs text-gray-500">{t.dashboard.announcement_feed_desc}</p>
      </div>
      {!!error && <p className="text-xs text-red-500">{error instanceof Error ? error.message : t.dashboard.announcement_err_save}</p>}
      <AnnouncementList
        announcements={announcements}
        categoryLabels={categoryLabels}
        loading={loading}
        locale={locale}
        t={t}
      />
    </section>
  )
}

function AnnouncementList({
  announcements,
  categoryLabels,
  loading,
  locale,
  t,
  admin = false,
  deletingId,
  onDelete,
}: {
  announcements: Announcement[]
  categoryLabels: Record<AnnouncementCategory, string>
  loading: boolean
  locale: string
  t: ReturnType<typeof useTranslation>['t']
  admin?: boolean
  deletingId?: string
  onDelete?: (id: string) => void
}) {
  if (loading) {
    return <p className="text-sm text-gray-400">{t.common.loading}</p>
  }

  if (announcements.length === 0) {
    return <p className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-4 text-center text-sm text-gray-400">{t.dashboard.announcement_empty}</p>
  }

  return (
    <div className="space-y-2">
      {announcements.map(item => (
        <article key={item.id} className="card space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                <Badge variant={item.category === 'POLICY' ? 'blue' : item.category === 'RESOURCE' ? 'green' : 'yellow'}>
                  {categoryLabels[item.category]}
                </Badge>
                {item.pinned && <Badge variant="red">{t.dashboard.announcement_pinned_badge}</Badge>}
                <span className="text-xs text-gray-400">{formatDateTime(item.createdAt, locale)}</span>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600">{item.content}</p>
              <p className="mt-1 text-xs text-gray-400">{item.centerName}</p>
            </div>
            {admin && onDelete && (
              <button
                type="button"
                className="shrink-0 text-xs font-medium text-red-500 hover:text-red-700"
                disabled={deletingId === item.id}
                onClick={() => onDelete(item.id)}
              >
                {t.common.delete}
              </button>
            )}
          </div>
          {item.linkUrl && (
            <a
              href={item.linkUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-xs font-semibold text-primary-600 hover:text-primary-700"
            >
              {t.dashboard.announcement_open_link}
            </a>
          )}
        </article>
      ))}
    </div>
  )
}

function formatDateTime(value: string, locale: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
