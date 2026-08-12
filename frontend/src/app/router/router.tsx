import { createBrowserRouter, Navigate } from 'react-router-dom'

import { TaskBoardHome } from '@/app/pages/TaskBoardHome'
import { LoginPage } from '@/features/auth/pages/LoginPage'

export const router = createBrowserRouter([
  { path: '/', element: <TaskBoardHome /> },
  { path: '/login', element: <LoginPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
])
