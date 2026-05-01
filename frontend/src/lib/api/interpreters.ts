import { get, post, put, patch } from './client'
import { schemas } from '../schemas'
import type { InterpreterRole } from '../types'

function listPath(page: number, query?: string, language?: string, size = 20) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (query?.trim()) params.set('query', query.trim())
  if (language?.trim()) params.set('language', language.trim())
  return `/interpreters?${params.toString()}`
}

export const interpreterApi = {
  list:       (page = 0, query?: string, language?: string, size = 20) =>
    get(listPath(page, query, language, size), schemas.interpreters),
  get:        (id: string) => get(`/interpreters/${id}`, schemas.interpreter),
  create:     (body: unknown) => post('/interpreters', body, schemas.interpreter),
  update:     (id: string, body: { name?: string; phone?: string; role?: InterpreterRole; languages?: string[]; availabilityNote?: string }) =>
    put(`/interpreters/${id}`, body, schemas.interpreter),
  deactivate: (id: string) => patch<void>(`/interpreters/${id}/deactivate`),
}
