import { del, get, post, put } from './client'
import { schemas } from '../schemas'
import type { UpsertAnnouncementRequest } from '../types'

function announcementPath(page = 0) {
  const params = new URLSearchParams({ page: String(page), size: '20' })
  return `/announcements?${params.toString()}`
}

export const announcementApi = {
  list: (page = 0) => get(announcementPath(page), schemas.announcements),
  create: (body: UpsertAnnouncementRequest) => post('/announcements', body, schemas.announcement),
  update: (id: string, body: UpsertAnnouncementRequest) =>
    put(`/announcements/${id}`, body, schemas.announcement),
  delete: (id: string) => del<void>(`/announcements/${id}`),
}
