import axios, { type InternalAxiosRequestConfig } from 'axios'
import { z } from 'zod'
import { getAccessToken, refreshAccessToken } from '../supabase'
import type { ApiResponse } from '../types'

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
  get isUnauthorized() { return this.status === 401 }
  get isForbidden()    { return this.status === 403 }
  get isNotFound()     { return this.status === 404 }
}

const instance = axios.create({ baseURL: '/api/v1' })

type AuthRetryConfig = InternalAxiosRequestConfig & {
  _authRetry?: boolean
}

instance.interceptors.request.use(async config => {
  const token = await getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

instance.interceptors.response.use(
  res => res,
  async err => {
    if (axios.isAxiosError(err)) {
      const status = err.response?.status ?? 0
      const config = err.config as AuthRetryConfig | undefined

      if (status === 401 && config && !config._authRetry) {
        config._authRetry = true
        const token = await refreshAccessToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
          return instance.request(config)
        }
      }

      const message = err.response?.data?.message ?? err.message
      throw new ApiError(message, status)
    }
    throw err
  },
)

const wrapperSchema = z.object({
  statusCode: z.number(),
  isSuccess:  z.boolean(),
  message:    z.string(),
  payload:    z.unknown(),
  pageInfo:   z.object({
    page:          z.number(),
    size:          z.number(),
    hasNext:       z.boolean(),
    totalElements: z.number(),
    totalPages:    z.number(),
  }).optional(),
})

async function request<T>(
  method: string,
  path: string,
  options?: { data?: unknown; schema?: z.ZodType<T> },
): Promise<ApiResponse<T>> {
  const res = await instance.request({ method, url: path, data: options?.data })

  const wrapper = wrapperSchema.safeParse(res.data)
  if (!wrapper.success) throw new ApiError('잘못된 응답 형식', res.status)
  if (!wrapper.data.isSuccess) throw new ApiError(wrapper.data.message, res.status)

  const payload = options?.schema
    ? options.schema.parse(wrapper.data.payload)
    : wrapper.data.payload as T

  return { ...wrapper.data, payload }
}

export const get   = <T>(path: string, schema?: z.ZodType<T>) =>
  request<T>('GET', path, { schema })
export const post  = <T>(path: string, data: unknown, schema?: z.ZodType<T>) =>
  request<T>('POST', path, { data, schema })
export const put   = <T>(path: string, data: unknown, schema?: z.ZodType<T>) =>
  request<T>('PUT', path, { data, schema })
export const patch = <T>(path: string, data?: unknown, schema?: z.ZodType<T>) =>
  request<T>('PATCH', path, { data, schema })
export const del   = <T>(path: string) =>
  request<T>('DELETE', path)
