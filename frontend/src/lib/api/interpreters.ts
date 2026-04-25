import { get, post, put, patch } from './client'
import { schemas } from '../schemas'
import type { InterpreterRole } from '../types'

export const interpreterApi = {
  list:       (page = 0) => get(`/interpreters?page=${page}&size=20`, schemas.interpreters),
  get:        (id: string) => get(`/interpreters/${id}`, schemas.interpreter),
  create:     (body: unknown) => post('/interpreters', body, schemas.interpreter),
  update:     (id: string, body: { phone?: string; role?: InterpreterRole }) =>
    put(`/interpreters/${id}`, body, schemas.interpreter),
  deactivate: (id: string) => patch<void>(`/interpreters/${id}/deactivate`),
}
