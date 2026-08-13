import { ApiError } from '@/shared/lib/http/ApiError'

const API_BASE_URL = (
  import.meta.env?.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'
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
}

type HttpAuthConfig = {
  onUnauthorized: () => void
}

let authConfig: HttpAuthConfig = {
  onUnauthorized: () => undefined,
}
let refreshPromise: Promise<boolean> | null = null

export function configureHttpAuth(config: HttpAuthConfig) {
  authConfig = config
}

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

function getCookie(name: string) {
  const prefix = `${encodeURIComponent(name)}=`
  const cookie = document.cookie
    .split(';')
    .map((value) => value.trim())
    .find((value) => value.startsWith(prefix))

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null
}

function isUnsafeMethod(method?: string) {
  return !['GET', 'HEAD', 'OPTIONS'].includes((method ?? 'GET').toUpperCase())
}

function addCsrfHeader(headers: Headers, method?: string) {
  const csrfToken = getCookie('csrftoken')
  if (csrfToken && isUnsafeMethod(method)) {
    headers.set('X-CSRFToken', csrfToken)
  }
}

async function performSessionRefresh() {
  const headers = new Headers({ Accept: 'application/json' })
  addCsrfHeader(headers, 'POST')

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh/`, {
      method: 'POST',
      credentials: 'include',
      headers,
    })
    return response.ok
  } catch {
    return false
  }
}

function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = performSessionRefresh()
      .then((refreshed) => {
        if (!refreshed) {
          authConfig.onUnauthorized()
        }
        return refreshed
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
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

async function request<T>(
  path: string,
  options: RequestOptions = {},
  hasRetried = false,
): Promise<T> {
  const {
    authenticated = true,
    headers: requestHeaders,
    ...requestInit
  } = options
  const headers = new Headers(requestHeaders)

  headers.set('Accept', 'application/json')
  if (requestInit.body && !(requestInit.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  addCsrfHeader(headers, requestInit.method)

  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}/${path.replace(/^\//, '')}`, {
      ...requestInit,
      credentials: 'include',
      headers,
    })
  } catch (error: unknown) {
    throw new ApiError(
      'Não foi possível conectar ao servidor. Verifique sua conexão.',
      0,
      error,
    )
  }

  const body = await parseBody(response)

  if (!response.ok) {
    if (response.status === 401 && authenticated) {
      if (!hasRetried && (await refreshSession())) {
        return request<T>(path, options, true)
      }
      if (hasRetried) {
        authConfig.onUnauthorized()
      }
    }

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
