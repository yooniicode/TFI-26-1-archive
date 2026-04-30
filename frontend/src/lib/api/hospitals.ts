import { get, post } from './client'
import { schemas } from '../schemas'

export const hospitalApi = {
  search: (name?: string, page = 0) =>
    get(`/hospitals?${name ? `name=${encodeURIComponent(name)}&` : ''}page=${page}&size=20`, schemas.hospitals),
  get:    (id: string) => get(`/hospitals/${id}`, schemas.hospital),
  create: (body: { name: string; address?: string; phone?: string }) => post('/hospitals', body, schemas.hospital),
}
