import { getAccessToken } from '../supabase'
import type { ApiResponse } from '../types'

const BASE = '/api/v1'

async function headers(): Promise<HeadersInit> {
  const token = await getAccessToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...(await headers()), ...options?.headers },
  })
  const data = await res.json()
  if (!data.isSuccess) throw new Error(data.message ?? '요청 실패')
  return data
}

export const get   = <T>(path: string) => request<T>(path, { method: 'GET' })
export const post  = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(body) })
export const put   = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(body) })
export const patch = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined })
export const del   = <T>(path: string) => request<T>(path, { method: 'DELETE' })
