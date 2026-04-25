import { get, post } from './client'
import type { MedicalScript } from '../types'

export const scriptApi = {
  generate:  (body: unknown) => post<MedicalScript>('/scripts/generate', body),
  byPatient: (patientId: string, page = 0) =>
    get<MedicalScript[]>(`/scripts/patient/${patientId}?page=${page}&size=20`),
  get:       (id: string) => get<MedicalScript>(`/scripts/${id}`),
}
