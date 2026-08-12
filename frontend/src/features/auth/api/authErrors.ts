import { ApiError } from '@/shared/lib/http/ApiError'

function firstMessage(value: unknown): string | null {
  if (typeof value === 'string') {
    return value
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    return value[0]
  }

  return null
}

export function getApiFieldError(error: unknown, field: string) {
  if (!(error instanceof ApiError)) {
    return null
  }

  if (typeof error.details !== 'object' || error.details === null) {
    return null
  }

  return firstMessage((error.details as Record<string, unknown>)[field])
}

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    return 'Nome de usuário ou senha inválidos.'
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Não foi possível concluir a autenticação.'
}
