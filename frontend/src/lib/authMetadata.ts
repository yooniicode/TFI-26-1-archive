import type { InterpreterRole } from './types'

export type RequestedMemberRole = {
  role: 'admin' | 'interpreter'
  interpreterRole?: InterpreterRole
  centerName?: string
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeRole(value: unknown): 'admin' | 'interpreter' | 'patient' | null {
  const role = text(value)?.toLowerCase()
  if (role === 'admin' || role === 'interpreter' || role === 'patient') return role
  return null
}

function normalizeInterpreterRole(value: unknown): InterpreterRole | undefined {
  const role = text(value)?.toUpperCase()
  if (role === 'STAFF' || role === 'ACTIVIST' || role === 'FREELANCER') return role
  return undefined
}

export function getRequestedMemberRole(metadata?: Record<string, unknown> | null): RequestedMemberRole | null {
  if (!metadata) return null

  const requestedRole =
    normalizeRole(metadata.requested_role) ??
    normalizeRole(metadata.app_role) ??
    normalizeRole(metadata.role)

  const interpreterRole =
    normalizeInterpreterRole(metadata.requested_interpreter_role) ??
    normalizeInterpreterRole(metadata.interpreter_role)

  const centerName = text(metadata.requested_center_name) ?? text(metadata.center_name) ?? undefined

  if (requestedRole === 'admin') return { role: 'admin', centerName }
  if (requestedRole === 'interpreter') return { role: 'interpreter', interpreterRole, centerName }
  if (interpreterRole) return { role: 'interpreter', interpreterRole, centerName }
  return null
}
