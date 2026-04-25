import { get, post } from './client'
import { schemas } from '../schemas'
import type { RegisterProfileRequest } from '../types'

export const authApi = {
  me:              () => get('/auth/me', schemas.authMe),
  registerProfile: (body: RegisterProfileRequest) => post<void>('/auth/register-profile', body),
}
