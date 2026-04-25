import { get, post, put } from './client'
import type { Patient, Consultation } from '../types'

export const patientApi = {
  list:      (page = 0) => get<Patient[]>(`/patients?page=${page}&size=20`),
  get:       (id: string) => get<Patient>(`/patients/${id}`),
  create:    (body: unknown) => post<Patient>('/patients', body),
  update:    (id: string, body: unknown) => put<Patient>(`/patients/${id}`, body),
  history:   (id: string, page = 0) =>
    get<Consultation[]>(`/patients/${id}/history?page=${page}&size=20`),
  myRecords: (id: string, page = 0) =>
    get<Consultation[]>(`/patients/${id}/my-records?page=${page}&size=20`),
}
