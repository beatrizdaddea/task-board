import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'

import { authService } from '@/features/auth/api/authService'
import { getTokenExpiration, isAccessTokenValid } from '@/features/auth/api/jwt'
import { authStorageKey, tokenStorage } from '@/features/auth/api/tokenStorage'
import {
  AuthContext,
  type AuthContextValue,
} from '@/features/auth/context/AuthContext'
import { configureHttpAuth } from '@/shared/lib/httpClient'
import { queryClient } from '@/shared/lib/queryClient'

configureHttpAuth({
  getAccessToken: tokenStorage.getAccessToken,
  onUnauthorized: () => {
    authService.logout()
    queryClient.clear()
  },
})

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  const syncStoredToken = useCallback(() => {
    const storedToken = tokenStorage.getAccessToken()

    if (isAccessTokenValid(storedToken)) {
      setToken(storedToken)
    } else {
      if (storedToken) {
        authService.logout()
      }
      setToken(null)
    }

    setIsInitializing(false)
  }, [])

  const login = useCallback((accessToken: string) => {
    tokenStorage.setAccessToken(accessToken)
    setToken(accessToken)
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    queryClient.clear()
    setToken(null)
  }, [])

  useEffect(() => {
    syncStoredToken()
    const unsubscribe = tokenStorage.subscribe(syncStoredToken)
    const syncOtherTabs = (event: StorageEvent) => {
      if (event.key === authStorageKey) {
        syncStoredToken()
      }
    }

    window.addEventListener('storage', syncOtherTabs)

    return () => {
      unsubscribe()
      window.removeEventListener('storage', syncOtherTabs)
    }
  }, [syncStoredToken])

  useEffect(() => {
    if (!token) {
      return
    }

    const expiration = getTokenExpiration(token)
    if (!expiration) {
      logout()
      return
    }

    const remainingTime = expiration - Date.now()
    if (remainingTime <= 0) {
      logout()
      return
    }

    const expirationTimer = window.setTimeout(logout, remainingTime)
    return () => window.clearTimeout(expirationTimer)
  }, [logout, token])

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      isInitializing,
      login,
      logout,
    }),
    [isInitializing, login, logout, token],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
