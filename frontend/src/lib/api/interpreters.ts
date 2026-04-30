import { get, post, put, patch } from './client'
import { schemas } from '../schemas'
import type { InterpreterRole } from '../types'

function listPath(page: number, query?: string) {
  const params = new URLSearchParams({ page: String(page), size: '20' })
  if (query?.trim()) params.set('query', query.trim())
  return `/interpreters?${params.toString()}`
}

export const interpreterApi = {
  list:       (page = 0, query?: string) => get(listPath(page, query), schemas.interpreters),
  get:        (id: string) => get(`/interpreters/${id}`, schemas.interpreter),
  create:     (body: unknown) => post('/interpreters', body, schemas.interpreter),
  update:     (id: string, body: { name?: string; phone?: string; role?: InterpreterRole; languages?: string[]; availabilityNote?: string }) =>
    put(`/interpreters/${id}`, body, schemas.interpreter),
  deactivate: (id: string) => patch<void>(`/interpreters/${id}/deactivate`),
}
