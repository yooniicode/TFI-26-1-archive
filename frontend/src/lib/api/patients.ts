import { get, post, put, del } from './client'
import { schemas } from '../schemas'

function listPath(page: number, query?: string, size = 20) {
  const params = new URLSearchParams({ page: String(page), size: String(size) })
  if (query?.trim()) params.set('query', query.trim())
  return `/patients?${params.toString()}`
}

export const patientApi = {
  list:      (page = 0, query?: string, size = 20) => get(listPath(page, query, size), schemas.patients),
  get:       (id: string) => get(`/patients/${id}`, schemas.patient),
  create:    (body: unknown) => post('/patients', body, schemas.patient),
  update:    (id: string, body: unknown) => put(`/patients/${id}`, body, schemas.patient),
  history:     (id: string, page = 0) =>
    get(`/patients/${id}/history?page=${page}&size=20`, schemas.consultations),
  myRecords:   (id: string, page = 0) =>
    get(`/patients/${id}/my-records?page=${page}&size=20`, schemas.patientReports),
  addMyCenter: (centerId: string) =>
    post(`/patients/me/centers/${centerId}`, undefined, schemas.patient),
  addCenter:    (id: string, centerId: string) =>
    post(`/patients/${id}/centers/${centerId}`, undefined, schemas.patient),
  removeCenter: (id: string, centerId: string) =>
    del(`/patients/${id}/centers/${centerId}`),
}
