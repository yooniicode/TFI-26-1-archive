import { get, post } from './client'
import { schemas } from '../schemas'

export const scriptApi = {
  generate:  (body: unknown) => post('/scripts/generate', body, schemas.script),
  byPatient: (patientId: string, page = 0) =>
    get(`/scripts/patient/${patientId}?page=${page}&size=20`, schemas.scripts),
  get:       (id: string) => get(`/scripts/${id}`, schemas.script),
}
