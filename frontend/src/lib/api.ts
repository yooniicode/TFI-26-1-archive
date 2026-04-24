import { getAccessToken } from './supabase'
import type { ApiResponse } from './types'

const BASE = '/api/v1'

async function headers(): Promise<HeadersInit> {
  const token = await getAccessToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...(await headers()), ...options?.headers },
  })
  const data = await res.json()
  if (!data.isSuccess) throw new Error(data.message ?? '요청 실패')
  return data
}

const get  = <T>(path: string) => request<T>(path, { method: 'GET' })
const post = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) })
const put  = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(body) })
const patch = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined })
const del  = <T>(path: string) => request<T>(path, { method: 'DELETE' })

// Auth
export const authApi = {
  me: () => get<import('./types').AuthMe>('/auth/me'),
  registerProfile: (body: import('./types').RegisterProfileRequest) => post<void>('/auth/register-profile', body),
}

// Patients
export const patientApi = {
  list:   (page = 0) => get<import('./types').Patient[]>(`/patients?page=${page}&size=20`),
  get:    (id: string) => get<import('./types').Patient>(`/patients/${id}`),
  create: (body: unknown) => post<import('./types').Patient>('/patients', body),
  update: (id: string, body: unknown) => put<import('./types').Patient>(`/patients/${id}`, body),
  history: (id: string, page = 0) =>
    get<import('./types').Consultation[]>(`/patients/${id}/history?page=${page}&size=20`),
  myRecords: (id: string, page = 0) =>
    get<import('./types').Consultation[]>(`/patients/${id}/my-records?page=${page}&size=20`),
}

// Interpreters
export const interpreterApi = {
  list:       (page = 0) => get<import('./types').Interpreter[]>(`/interpreters?page=${page}&size=20`),
  get:        (id: string) => get<import('./types').Interpreter>(`/interpreters/${id}`),
  create:     (body: unknown) => post<import('./types').Interpreter>('/interpreters', body),
  deactivate: (id: string) => patch<void>(`/interpreters/${id}/deactivate`),
}

// Hospitals
export const hospitalApi = {
  search: (name?: string, page = 0) =>
    get<import('./types').Hospital[]>(`/hospitals?${name ? `name=${name}&` : ''}page=${page}&size=20`),
  get:    (id: string) => get<import('./types').Hospital>(`/hospitals/${id}`),
  create: (body: unknown) => post<import('./types').Hospital>('/hospitals', body),
}

// Consultations
export const consultationApi = {
  list:    (page = 0) => get<import('./types').Consultation[]>(`/consultations?page=${page}&size=20`),
  get:     (id: string) => get<import('./types').Consultation>(`/consultations/${id}`),
  create:  (body: unknown) => post<import('./types').Consultation>('/consultations', body),
  update:  (id: string, body: unknown) => put<import('./types').Consultation>(`/consultations/${id}`, body),
  confirm: (id: string, body: unknown) => patch<import('./types').Consultation>(`/consultations/${id}/confirm`, body),
  byPatient: (patientId: string, page = 0) =>
    get<import('./types').Consultation[]>(`/consultations/patient/${patientId}?page=${page}&size=20`),
}

// Handovers
export const handoverApi = {
  create:    (body: unknown) => post<import('./types').Handover>('/handovers', body),
  byPatient: (patientId: string, page = 0) =>
    get<import('./types').Handover[]>(`/handovers/patient/${patientId}?page=${page}&size=20`),
  assign:    (id: string, body: unknown) => patch<import('./types').Handover>(`/handovers/${id}/assign`, body),
}

// Matching
export const matchApi = {
  list:   (page = 0) => get<import('./types').PatientMatch[]>(`/matching?page=${page}&size=20`),
  create: (body: unknown) => post<import('./types').PatientMatch>('/matching', body),
  byPatient: (patientId: string) => get<import('./types').PatientMatch>(`/matching/patient/${patientId}`),
  remove: (id: string) => del<void>(`/matching/${id}`),
}

// Medical Scripts
export const scriptApi = {
  generate:  (body: unknown) => post<import('./types').MedicalScript>('/scripts/generate', body),
  byPatient: (patientId: string, page = 0) =>
    get<import('./types').MedicalScript[]>(`/scripts/patient/${patientId}?page=${page}&size=20`),
  get:       (id: string) => get<import('./types').MedicalScript>(`/scripts/${id}`),
}
