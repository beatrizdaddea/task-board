import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { AuthRouteSkeleton } from '@/features/auth/components/AuthRouteSkeleton'
import { useAuth } from '@/features/auth/hooks/useAuth'

export function ProtectedRoute() {
  const { isAuthenticated, isInitializing } = useAuth()
  const location = useLocation()

  if (isInitializing) {
    return <AuthRouteSkeleton />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
