import { get, post } from './client'
import type { Hospital } from '../types'

export const hospitalApi = {
  search: (name?: string, page = 0) =>
    get<Hospital[]>(`/hospitals?${name ? `name=${name}&` : ''}page=${page}&size=20`),
  get:    (id: string) => get<Hospital>(`/hospitals/${id}`),
  create: (body: unknown) => post<Hospital>('/hospitals', body),
}
