import { createContext } from 'react'

import type { AuthenticatedUser } from '@/features/auth/types/authTypes'

export type AuthContextValue = {
  user: AuthenticatedUser | null
  isAuthenticated: boolean
  isInitializing: boolean
  login: (user: AuthenticatedUser) => void
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
