'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, clearAuthState } from '@/lib/auth/auth-token'
import type { AuthMe } from '@/lib/types'

interface AuthGateOverlaysProps {
  me?: AuthMe | null
  pathname: string
}

export default function AuthGateOverlays({ me: _me, pathname: _pathname }: AuthGateOverlaysProps) {
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated()) {
      clearAuthState()
      router.replace('/')
    }
  }, [router])

  return null
}
