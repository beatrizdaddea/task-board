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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function getApiFieldError(error: unknown, field: string) {
  if (!(error instanceof ApiError)) {
    return null
  }

  if (!isRecord(error.details)) {
    return null
  }

  return firstMessage(error.details[field])
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
