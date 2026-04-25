import { get, post, put } from './client'
import { schemas } from '../schemas'

export const patientApi = {
  list:      (page = 0) => get(`/patients?page=${page}&size=20`, schemas.patients),
  get:       (id: string) => get(`/patients/${id}`, schemas.patient),
  create:    (body: unknown) => post('/patients', body, schemas.patient),
  update:    (id: string, body: unknown) => put(`/patients/${id}`, body, schemas.patient),
  history:   (id: string, page = 0) =>
    get(`/patients/${id}/history?page=${page}&size=20`, schemas.consultations),
  myRecords: (id: string, page = 0) =>
    get(`/patients/${id}/my-records?page=${page}&size=20`, schemas.consultations),
}
