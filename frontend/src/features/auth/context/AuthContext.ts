import { createContext } from 'react'

export type AuthContextValue = {
  token: string | null
  isAuthenticated: boolean
  isInitializing: boolean
  login: (accessToken: string) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
