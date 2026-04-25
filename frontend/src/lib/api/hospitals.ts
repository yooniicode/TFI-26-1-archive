import { get, post } from './client'
import { schemas } from '../schemas'

export const hospitalApi = {
  search: (name?: string, page = 0) =>
    get(`/hospitals?${name ? `name=${name}&` : ''}page=${page}&size=20`, schemas.hospitals),
  get:    (id: string) => get(`/hospitals/${id}`, schemas.hospital),
  create: (body: unknown) => post('/hospitals', body, schemas.hospital),
}
