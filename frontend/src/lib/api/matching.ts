import { get, post, del } from './client'
import type { PatientMatch } from '../types'

export const matchApi = {
  list:      (page = 0) => get<PatientMatch[]>(`/matching?page=${page}&size=20`),
  create:    (body: unknown) => post<PatientMatch>('/matching', body),
  byPatient: (patientId: string) => get<PatientMatch>(`/matching/patient/${patientId}`),
  remove:    (id: string) => del<void>(`/matching/${id}`),
}
