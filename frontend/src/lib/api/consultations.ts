import { get, post, put, patch } from './client'
import { schemas } from '../schemas'

export const consultationApi = {
  list:      (page = 0) => get(`/consultations?page=${page}&size=20`, schemas.consultations),
  get:       (id: string) => get(`/consultations/${id}`, schemas.consultation),
  create:    (body: unknown) => post('/consultations', body, schemas.consultation),
  update:    (id: string, body: unknown) => put(`/consultations/${id}`, body, schemas.consultation),
  confirm:   (id: string, body: unknown) => patch(`/consultations/${id}/confirm`, body, schemas.consultation),
  byPatient: (patientId: string, page = 0) =>
    get(`/consultations/patient/${patientId}?page=${page}&size=20`, schemas.consultations),
}
