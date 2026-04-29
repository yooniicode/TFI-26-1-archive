import { get, post, put } from './client'
import { schemas } from '../schemas'

function listPath(query?: string) {
  const params = new URLSearchParams({ page: '0', size: '100' })
  if (query?.trim()) params.set('query', query.trim())
  return `/centers?${params.toString()}`
}

export const centerApi = {
  list: (query?: string) => get(listPath(query), schemas.centers),
  create: (body: { name: string; address?: string; phone?: string; active?: boolean }) =>
    post('/centers', body, schemas.center),
  update: (id: string, body: { name: string; address?: string; phone?: string; active?: boolean }) =>
    put(`/centers/${id}`, body, schemas.center),
}
