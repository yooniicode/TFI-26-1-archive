import { get, post, patch } from './client'
import type { Handover } from '../types'

export const handoverApi = {
  create:    (body: unknown) => post<Handover>('/handovers', body),
  byPatient: (patientId: string, page = 0) =>
    get<Handover[]>(`/handovers/patient/${patientId}?page=${page}&size=20`),
  assign:    (id: string, body: unknown) => patch<Handover>(`/handovers/${id}/assign`, body),
}
