import { get, post, put, patch } from './client'
import type { Interpreter, InterpreterRole } from '../types'

export const interpreterApi = {
  list:       (page = 0) => get<Interpreter[]>(`/interpreters?page=${page}&size=20`),
  get:        (id: string) => get<Interpreter>(`/interpreters/${id}`),
  create:     (body: unknown) => post<Interpreter>('/interpreters', body),
  update:     (id: string, body: { phone?: string; role?: InterpreterRole }) =>
    put<Interpreter>(`/interpreters/${id}`, body),
  deactivate: (id: string) => patch<void>(`/interpreters/${id}/deactivate`),
}
