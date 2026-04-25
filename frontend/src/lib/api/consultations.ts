import { get, post, put, patch } from './client'
import type { Consultation } from '../types'

export const consultationApi = {
  list:      (page = 0) => get<Consultation[]>(`/consultations?page=${page}&size=20`),
  get:       (id: string) => get<Consultation>(`/consultations/${id}`),
  create:    (body: unknown) => post<Consultation>('/consultations', body),
  update:    (id: string, body: unknown) => put<Consultation>(`/consultations/${id}`, body),
  confirm:   (id: string, body: unknown) => patch<Consultation>(`/consultations/${id}/confirm`, body),
  byPatient: (patientId: string, page = 0) =>
    get<Consultation[]>(`/consultations/patient/${patientId}?page=${page}&size=20`),
}
