import { get, post } from './client'
import type { AuthMe, RegisterProfileRequest } from '../types'

export const authApi = {
  me:              () => get<AuthMe>('/auth/me'),
  registerProfile: (body: RegisterProfileRequest) => post<void>('/auth/register-profile', body),
}
