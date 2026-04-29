import { get, patch, post } from './client'
import { schemas } from '../schemas'
import type { RegisterProfileRequest, UpdateMemberRoleRequest } from '../types'

export const authApi = {
  me:              () => get('/auth/me', schemas.authMe),
  registerProfile: (body: RegisterProfileRequest) => post<void>('/auth/register-profile', body),
  bootstrapAdmin:  (secretCode: string) => post('/auth/bootstrap-admin', { secretCode }, schemas.authMe),
  members:         () => get('/auth/members', schemas.members),
  updateMemberRole: (authUserId: string, body: UpdateMemberRoleRequest) =>
    patch(`/auth/members/${authUserId}/role`, body, schemas.member),
}
