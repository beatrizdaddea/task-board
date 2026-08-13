import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'

import { authService } from '@/features/auth/api/authService'
import {
  AuthContext,
  type AuthContextValue,
} from '@/features/auth/context/AuthContext'
import type { AuthenticatedUser } from '@/features/auth/types/authTypes'
import { configureHttpAuth } from '@/shared/lib/httpClient'
import { queryClient } from '@/shared/lib/queryClient'

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  const clearSession = useCallback(() => {
    setUser(null)
    queryClient.clear()
  }, [])

  const login = useCallback((authenticatedUser: AuthenticatedUser) => {
    setUser(authenticatedUser)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      clearSession()
    }
  }, [clearSession])

  useEffect(() => {
    let isMounted = true
    configureHttpAuth({ onUnauthorized: clearSession })

    async function restoreSession() {
      try {
        await authService.prepareCsrf()
        const authenticatedUser = await authService.me()
        if (isMounted) setUser(authenticatedUser)
      } catch {
        if (isMounted) clearSession()
      } finally {
        if (isMounted) setIsInitializing(false)
      }
    }

    void restoreSession()
    return () => {
      isMounted = false
      configureHttpAuth({ onUnauthorized: () => undefined })
    }
  }, [clearSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isInitializing,
      login,
      logout,
    }),
    [isInitializing, login, logout, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
