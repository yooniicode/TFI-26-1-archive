import { get, post, patch } from './client'
import { schemas } from '../schemas'

export const handoverApi = {
  create:    (body: unknown) => post('/handovers', body, schemas.handover),
  byPatient: (patientId: string, page = 0) =>
    get(`/handovers/patient/${patientId}?page=${page}&size=20`, schemas.handovers),
  assign:    (id: string, body: unknown) => patch(`/handovers/${id}/assign`, body, schemas.handover),
}
