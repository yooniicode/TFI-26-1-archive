'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import AppShell from '@/components/layout/AppShell'
import PageHeader from '@/components/ui/PageHeader'
import { useMe } from '@/hooks/useMe'
import { patientApi } from '@/lib/api'
import { useTranslation } from '@/lib/i18n/I18nContext'
import type { AppTranslation } from '@/lib/i18n/ko'

function PhoneIcon({ size = 24, color = '#2592FF' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M6.6 10.8a15.4 15.4 0 006.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2a11.5 11.5 0 003.6 1.2c.4.1.7.4.7.8V20a2 2 0 01-2 2A18 18 0 012 4a2 2 0 012-2h3c.4 0 .8.3.8.7.1 1.3.4 2.5 1.2 3.6.1.3.1.7-.2 1L6.6 10.8z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function MessageIcon() {
  return (
    <svg width={28} height={28} viewBox="0 0 24 24" fill="none">
      <path
        d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"
        stroke="#808080"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 10h8M8 14h5" stroke="#808080" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ChevronDown() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <path d="M6 9l6 6 6-6" stroke="#808080" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChevronUp() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <path d="M18 15l-6-6-6 6" stroke="#808080" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const NATIONALITY_FLAG: Record<string, string> = {
  VIETNAM: '🇻🇳',
  CHINA: '🇨🇳',
  CAMBODIA: '🇰🇭',
  MYANMAR: '🇲🇲',
  PHILIPPINES: '🇵🇭',
  INDONESIA: '🇮🇩',
  THAILAND: '🇹🇭',
  NEPAL: '🇳🇵',
  MONGOLIA: '🇲🇳',
  UZBEKISTAN: '🇺🇿',
  SRI_LANKA: '🇱🇰',
  BANGLADESH: '🇧🇩',
  PAKISTAN: '🇵🇰',
  UNITED_STATES: '🇺🇸',
}

type ContactKey = keyof AppTranslation['emergency']['contacts']

interface EmergencyContact {
  id: string
  key: ContactKey
  number: string
  hoursRange?: { startHour: number; endHour: number; weekdayOnly?: boolean }
  supportedNationalities?: string[]
  hasSms: boolean
}

const CONTACTS: EmergencyContact[] = [
  {
    id: '119',
    key: 'fire',
    number: '119',
    // 119 다국어 통역 서비스: 11~14개 언어 지원
    supportedNationalities: [
      'VIETNAM', 'CHINA', 'UNITED_STATES', 'MONGOLIA', 'CAMBODIA',
      'MYANMAR', 'PHILIPPINES', 'INDONESIA', 'THAILAND', 'NEPAL',
      'UZBEKISTAN', 'BANGLADESH', 'PAKISTAN', 'SRI_LANKA',
    ],
    hasSms: true,
  },
  {
    id: '112',
    key: 'police',
    number: '112',
    // 영어·중국어 전담, 그 외 언어 3자 통화 연결
    supportedNationalities: [
      'UNITED_STATES', 'CHINA', 'VIETNAM', 'MONGOLIA', 'CAMBODIA',
      'MYANMAR', 'PHILIPPINES', 'INDONESIA', 'THAILAND', 'NEPAL',
      'UZBEKISTAN', 'BANGLADESH', 'PAKISTAN',
    ],
    hasSms: true,
  },
  {
    id: '1339',
    key: 'medicalInfo',
    number: '1339',
    hasSms: false,
  },
  {
    id: '1577-1366',
    key: 'danuri',
    number: '1577-1366',
    // 다누리 13개 언어 지원
    supportedNationalities: [
      'VIETNAM', 'CHINA', 'UNITED_STATES', 'MONGOLIA', 'CAMBODIA',
      'MYANMAR', 'PHILIPPINES', 'INDONESIA', 'THAILAND', 'NEPAL',
      'UZBEKISTAN', 'BANGLADESH',
    ],
    hasSms: false,
  },
  {
    id: '1345',
    key: 'immigration',
    number: '1345',
    hoursRange: { startHour: 9, endHour: 22, weekdayOnly: true },
    // 1345: 20개 언어 지원
    supportedNationalities: [
      'VIETNAM', 'CHINA', 'UNITED_STATES', 'MONGOLIA', 'CAMBODIA',
      'MYANMAR', 'PHILIPPINES', 'INDONESIA', 'THAILAND', 'NEPAL',
      'UZBEKISTAN', 'BANGLADESH', 'PAKISTAN', 'SRI_LANKA',
    ],
    hasSms: false,
  },
  {
    id: 'nhis',
    key: 'nhis',
    number: '1588-1250',
    hoursRange: { startHour: 9, endHour: 18, weekdayOnly: true },
    hasSms: false,
  },
]

function isOpen(contact: EmergencyContact): boolean {
  if (!contact.hoursRange) return true
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()
  if (contact.hoursRange.weekdayOnly && (day === 0 || day === 6)) return false
  return hour >= contact.hoursRange.startHour && hour < contact.hoursRange.endHour
}

function CallItem({
  contact,
  isExpanded,
  onToggle,
  userNationality,
  t,
}: {
  contact: EmergencyContact
  isExpanded: boolean
  onToggle: () => void
  userNationality?: string | null
  t: AppTranslation
}) {
  const numDialable = contact.number.replace(/-/g, '')
  const info = t.emergency.contacts[contact.key]
  const supported = userNationality && contact.supportedNationalities?.includes(userNationality)
  const interpretation = supported
    ? {
        flag: NATIONALITY_FLAG[userNationality],
        text: t.emergency.call_available_in(t.emergency.language_names[userNationality as keyof typeof t.emergency.language_names]),
      }
    : undefined
  const category = 'category' in info ? info.category : undefined
  const interpreterNote = 'interpreterNote' in info ? info.interpreterNote : undefined

  if (!isExpanded) {
    return (
      <div className="flex items-center justify-between py-[16px] border-b border-[#eee]">
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-col items-start justify-center gap-[2px] flex-1 min-w-0 active:opacity-70 transition-opacity text-left"
        >
          <p className="text-[20px] font-semibold text-[#161616] leading-[1.4]">{info.name}</p>
          {interpretation && (
            <div className="flex items-center gap-[2px]">
              <span className="text-[16px] leading-none">{interpretation.flag}</span>
              <p className="text-[16px] font-medium text-[#808080] leading-[1.4] ml-1">{interpretation.text}</p>
            </div>
          )}
        </button>
        <div className="flex items-center gap-[20px] shrink-0 ml-4">
          <a
            href={`tel:${numDialable}`}
            onClick={e => e.stopPropagation()}
            className="bg-[#f3f9ff] p-[6px] rounded-full flex items-center justify-center active:opacity-70 transition-opacity"
            aria-label={`${info.name} ${t.emergency.call_action}`}
          >
            <PhoneIcon size={34} color="#2592FF" />
          </a>
          <button type="button" onClick={onToggle} className="active:opacity-70 transition-opacity">
            <ChevronDown />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-[16px] py-[24px] border-b border-[#eee]">
      <div className="flex items-center justify-between w-full">
        <p className="text-[20px] font-semibold text-[#161616] leading-[1.4] flex-1 min-w-0 pr-4">{info.name}</p>
        <button type="button" onClick={onToggle} className="shrink-0 active:opacity-70 transition-opacity">
          <ChevronUp />
        </button>
      </div>

      <div className="flex flex-col gap-[4px]">
        {interpretation && (
          <div className="flex items-center gap-[2px]">
            <span className="text-[16px] leading-none">{interpretation.flag}</span>
            <p className="text-[16px] font-medium text-[#808080] leading-[1.4] ml-1">{interpretation.text}</p>
          </div>
        )}
        <div className="flex items-center gap-[4px] text-[16px] font-medium text-[#808080] leading-[1.4]">
          <span>{info.hoursLabel}</span>
          {category && (
            <>
              <span>|</span>
              <span>{category}</span>
            </>
          )}
        </div>
        {interpreterNote && (
          <p className="text-[14px] font-medium text-[#808080] leading-[1.5]">{interpreterNote}</p>
        )}
      </div>

      <div className={`flex items-center py-[8px] w-full ${contact.hasSms ? 'gap-[10px]' : ''}`}>
        {contact.hasSms && (
          <a
            href={`sms:${numDialable}`}
            className="bg-[#f0f1f5] h-[52px] w-[80px] rounded-[40px] flex items-center justify-center shrink-0 active:opacity-70 transition-opacity"
            aria-label={`${info.name} ${t.emergency.sms_action}`}
          >
            <MessageIcon />
          </a>
        )}
        <a
          href={`tel:${numDialable}`}
          className="bg-[#f3f9ff] flex-1 h-[52px] rounded-full flex gap-[4px] items-center justify-center active:opacity-70 transition-opacity"
          aria-label={`${info.name} ${t.emergency.call_action}`}
        >
          <PhoneIcon size={28} color="#2592FF" />
          <p className="text-[22px] font-semibold text-[#2592FF] leading-[1.4]">{contact.number}</p>
        </a>
      </div>
    </div>
  )
}

export default function EmergencyCallPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const { t } = useTranslation()
  const { data: me } = useMe()
  const { data: patient } = useQuery({
    queryKey: ['patients', me?.entityId],
    queryFn: () => patientApi.get(me!.entityId!).then(r => r.payload),
    enabled: !!me?.entityId,
  })
  const userNationality = patient?.nationality ?? null

  const openContacts = CONTACTS.filter(isOpen)

  function toggleItem(key: string) {
    setExpandedId(prev => (prev === key ? null : key))
  }

  return (
    <AppShell noPadding>
      <PageHeader title={t.emergency.page_title} />

      <div className="bg-[#f6fff3] px-[16px] py-[20px] flex flex-col gap-[8px]">
        <p className="text-[18px] font-semibold text-[#30c100] leading-normal">{t.emergency.banner_title}</p>
        <p className="text-[16px] font-medium text-[#161616] leading-[1.6]">
          {t.emergency.banner_desc}
        </p>
      </div>

      <div className="bg-white px-[16px] pb-10">
        {openContacts.length > 0 && (
          <>
            <p className="text-[20px] font-semibold text-[#161616] leading-[1.4] pt-[20px] pb-[4px]">
              {t.emergency.section_open}
            </p>
            {openContacts.map(contact => {
              const key = `open-${contact.id}`
              return (
                <CallItem
                  key={key}
                  contact={contact}
                  isExpanded={expandedId === key}
                  onToggle={() => toggleItem(key)}
                  userNationality={userNationality}
                  t={t}
                />
              )
            })}
            <p className="text-[20px] font-semibold text-[#161616] leading-[1.4] pt-[28px] pb-[4px]">{t.emergency.section_all}</p>
          </>
        )}

        {openContacts.length === 0 && (
          <p className="text-[20px] font-semibold text-[#161616] leading-[1.4] pt-[20px] pb-[4px]">{t.emergency.section_all}</p>
        )}

        {CONTACTS.map(contact => {
          const key = `all-${contact.id}`
          return (
            <CallItem
              key={key}
              contact={contact}
              isExpanded={expandedId === key}
              onToggle={() => toggleItem(key)}
              userNationality={userNationality}
              t={t}
            />
          )
        })}
      </div>
    </AppShell>
  )
}
