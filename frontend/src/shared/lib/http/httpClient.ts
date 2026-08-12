import { tokenStorage } from '@/shared/lib/auth/tokenStorage'
import { ApiError } from '@/shared/lib/http/ApiError'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'
).replace(/\/$/, '')

const STATUS_MESSAGES: Readonly<Record<number, string>> = {
  400: 'Revise os dados enviados e tente novamente.',
  401: 'Sua sessão expirou ou as credenciais são inválidas.',
  403: 'Você não tem permissão para realizar esta ação.',
  404: 'O recurso solicitado não foi encontrado.',
  409: 'Não foi possível concluir a operação por causa de um conflito.',
  429: 'Muitas tentativas. Aguarde um momento e tente novamente.',
  500: 'O servidor encontrou um erro. Tente novamente em instantes.',
}

type RequestOptions = RequestInit & {
  authenticated?: boolean
  retryOnUnauthorized?: boolean
}

type RefreshResponse = { access: string }

let refreshRequest: Promise<string | null> | null = null

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getErrorMessage(status: number, body: unknown) {
  if (STATUS_MESSAGES[status]) {
    return STATUS_MESSAGES[status]
  }

  if (isRecord(body) && typeof body.detail === 'string') {
    return body.detail
  }

  return 'Não foi possível concluir a solicitação.'
}

async function parseBody(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return undefined
  }

  const contentType = response.headers.get('content-type') ?? ''
  return contentType.includes('application/json')
    ? response.json()
    : response.text()
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken()

  if (!refreshToken) {
    return null
  }

  if (!refreshRequest) {
    refreshRequest = fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken }),
    })
      .then(async (response) => {
        if (!response.ok) {
          tokenStorage.clear()
          return null
        }

        const body = (await response.json()) as RefreshResponse
        tokenStorage.setTokens(body.access)
        return body.access
      })
      .catch(() => {
        tokenStorage.clear()
        return null
      })
      .finally(() => {
        refreshRequest = null
      })
  }

  return refreshRequest
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    authenticated = true,
    retryOnUnauthorized = true,
    headers: requestHeaders,
    ...requestInit
  } = options
  const headers = new Headers(requestHeaders)

  headers.set('Accept', 'application/json')
  if (requestInit.body && !(requestInit.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  const accessToken = tokenStorage.getAccessToken()
  if (authenticated && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`)
  }

  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/${path.replace(/^\//, '')}`, {
      ...requestInit,
      headers,
    })
  } catch (error: unknown) {
    throw new ApiError(
      'Não foi possível conectar ao servidor. Verifique sua conexão.',
      0,
      error,
    )
  }

  if (response.status === 401 && authenticated && retryOnUnauthorized) {
    const refreshedToken = await refreshAccessToken()

    if (refreshedToken) {
      return request<T>(path, { ...options, retryOnUnauthorized: false })
    }
  }

  const body = await parseBody(response)

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(response.status, body),
      response.status,
      body,
    )
  }

  return body as T
}

export const httpClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  put: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}
