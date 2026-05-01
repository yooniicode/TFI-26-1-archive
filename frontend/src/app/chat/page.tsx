'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import Spinner from '@/components/ui/Spinner'
import { chatApi } from '@/lib/api'
import { queryKeys } from '@/lib/queryKeys'
import { useMe } from '@/hooks/useMe'
import { useTranslation } from '@/lib/i18n/I18nContext'
import type { ChatRoom } from '@/lib/types'

export default function ChatListPage() {
  const { t } = useTranslation()
  const { data: me, isLoading: meLoading } = useMe()

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: queryKeys.chat.rooms(),
    queryFn: () => chatApi.rooms().then(r => r.payload ?? []),
    enabled: !!me,
    refetchInterval: 15000,
  })

  if (meLoading || isLoading) return <AppShell><Spinner /></AppShell>

  return (
    <AppShell>
      <div className="space-y-4">
        <h1 className="text-lg font-bold">{t.chat.title}</h1>

        {rooms.length === 0 ? (
          <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-8 text-center">
            <p className="text-sm font-medium text-gray-600">{t.chat.empty}</p>
            <p className="mt-1 text-xs text-gray-400">{t.chat.empty_desc}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rooms.map(room => (
              <ChatRoomCard key={room.id} room={room} myAuthUserId={me?.authUserId} t={t} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}

function ChatRoomCard({
  room,
  myAuthUserId,
  t,
}: {
  room: ChatRoom
  myAuthUserId?: string
  t: ReturnType<typeof useTranslation>['t']
}) {
  const otherMember = room.members.find(m => m.authUserId !== myAuthUserId)
  const displayName = room.name
    ?? otherMember?.memberName
    ?? t.chat.no_name

  return (
    <Link
      href={`/chat/${room.id}`}
      className="card flex items-center gap-3 hover:border-primary-200 transition-colors"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
        {displayName.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold truncate">{displayName}</p>
          {room.lastMessageAt && (
            <span className="shrink-0 text-xs text-gray-400">
              {formatTime(room.lastMessageAt)}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {room.lastMessage ?? t.chat.last_message_none}
        </p>
      </div>
      {room.unreadCount > 0 && (
        <span className="shrink-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-600 px-1 text-xs font-bold text-white">
          {room.unreadCount > 99 ? '99+' : room.unreadCount}
        </span>
      )}
    </Link>
  )
}

function formatTime(iso: string) {
  const date = new Date(iso)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })
}
