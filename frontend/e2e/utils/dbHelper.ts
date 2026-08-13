import testData from '../fixtures/testData.json'
import { seleniumConfig } from '../config/selenium.config.ts'

type ApiSession = {
  cookieHeader: string
  csrfToken: string
}

type Task = {
  id: number
  permissions: {
    can_delete: boolean
  }
}

type TasksResponse = {
  results: Task[]
}

type Category = {
  id: number
}

type ApiOptions = RequestInit & {
  session?: ApiSession
  expectedStatus?: number
}

async function apiRequest<T>(path: string, options: ApiOptions = {}) {
  const {
    session,
    expectedStatus,
    headers: requestHeaders,
    ...requestOptions
  } = options
  const headers = new Headers(requestHeaders)
  headers.set('Accept', 'application/json')

  if (requestOptions.body) headers.set('Content-Type', 'application/json')
  if (session) {
    headers.set('Cookie', session.cookieHeader)
    if (!['GET', 'HEAD', 'OPTIONS'].includes(requestOptions.method ?? 'GET')) {
      headers.set('X-CSRFToken', session.csrfToken)
    }
  }

  let response: Response
  try {
    response = await fetch(
      `${seleniumConfig.apiBaseUrl}/${path.replace(/^\//, '')}`,
      {
        ...requestOptions,
        headers,
        signal: AbortSignal.timeout(seleniumConfig.waitTimeout),
      },
    )
  } catch (error: unknown) {
    throw new Error(
      `Não foi possível acessar a API E2E em ${seleniumConfig.apiBaseUrl}. ` +
        'Confirme que o backend está em execução e que E2E_API_BASE_URL está correto.',
      { cause: error },
    )
  }

  const body = response.status === 204 ? undefined : await response.json()
  if (expectedStatus ? response.status !== expectedStatus : !response.ok) {
    throw new Error(
      `API E2E respondeu ${response.status} em ${path}: ${JSON.stringify(body)}`,
    )
  }

  return body as T
}

async function ensureUser(user: {
  username: string
  email: string
  password: string
}) {
  let registrationResponse: Response
  try {
    registrationResponse = await fetch(
      `${seleniumConfig.apiBaseUrl}/auth/register/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
        signal: AbortSignal.timeout(seleniumConfig.waitTimeout),
      },
    )
  } catch (error: unknown) {
    throw new Error(
      `Não foi possível acessar a API E2E em ${seleniumConfig.apiBaseUrl}. ` +
        'Confirme que o backend está em execução e que E2E_API_BASE_URL está correto.',
      { cause: error },
    )
  }

  if (registrationResponse.ok || registrationResponse.status === 400) return

  throw new Error(
    `Não foi possível preparar o usuário E2E: HTTP ${registrationResponse.status}`,
  )
}

function getSetCookieHeaders(response: Response) {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[]
  }
  const values = headers.getSetCookie?.()
  if (values?.length) return values

  const combinedValue = response.headers.get('set-cookie')
  return combinedValue ? [combinedValue] : []
}

function readCookie(response: Response, name: string) {
  const prefix = `${name}=`
  const cookie = getSetCookieHeaders(response)
    .map((value) => value.split(';', 1)[0])
    .find((value) => value.startsWith(prefix))

  if (!cookie) throw new Error(`A API E2E não retornou o cookie ${name}.`)
  return cookie
}

async function login(): Promise<ApiSession> {
  const csrfResponse = await fetch(`${seleniumConfig.apiBaseUrl}/auth/csrf/`, {
    signal: AbortSignal.timeout(seleniumConfig.waitTimeout),
  })
  if (!csrfResponse.ok) {
    throw new Error(
      `Não foi possível obter o CSRF E2E: HTTP ${csrfResponse.status}`,
    )
  }

  const csrfCookie = readCookie(csrfResponse, 'csrftoken')
  const csrfToken = decodeURIComponent(csrfCookie.slice('csrftoken='.length))
  const loginResponse = await fetch(
    `${seleniumConfig.apiBaseUrl}/auth/login/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: csrfCookie,
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({
        username: testData.user.username,
        password: testData.user.password,
      }),
      signal: AbortSignal.timeout(seleniumConfig.waitTimeout),
    },
  )

  if (!loginResponse.ok) {
    throw new Error(
      `Não foi possível autenticar o usuário E2E: HTTP ${loginResponse.status}`,
    )
  }

  return {
    cookieHeader: [
      csrfCookie,
      readCookie(loginResponse, 'taskboard_access'),
      readCookie(loginResponse, 'taskboard_refresh'),
    ].join('; '),
    csrfToken,
  }
}

async function removeOwnedTasks(session: ApiSession) {
  while (true) {
    const tasks = await apiRequest<TasksResponse>('tasks/?page=1', {
      session,
    })
    const ownedTasks = tasks.results.filter(
      (task) => task.permissions.can_delete,
    )
    if (ownedTasks.length === 0) return

    await Promise.all(
      ownedTasks.map((task) =>
        apiRequest<void>(`tasks/${task.id}/`, {
          method: 'DELETE',
          session,
          expectedStatus: 204,
        }),
      ),
    )
  }
}

async function removeCategories(session: ApiSession) {
  const categories = await apiRequest<Category[]>('categories/', {
    session,
  })
  await Promise.all(
    categories.map((category) =>
      apiRequest<void>(`categories/${category.id}/`, {
        method: 'DELETE',
        session,
        expectedStatus: 204,
      }),
    ),
  )
}

async function createTask(
  session: ApiSession,
  categoryId: number | null,
  title: string,
  completed: boolean,
) {
  await apiRequest<Task>('tasks/', {
    method: 'POST',
    session,
    expectedStatus: 201,
    body: JSON.stringify({
      title,
      description: completed
        ? 'Tarefa concluída criada pelo reset E2E.'
        : 'Tarefa aberta criada pelo reset E2E.',
      completed,
      priority: completed ? 'high' : 'medium',
      category: categoryId,
      due_date: null,
    }),
  })
}

export async function seedUncategorizedTask(title: string) {
  const session = await login()
  await createTask(session, null, title, false)
}

export async function resetTestData() {
  await ensureUser(testData.user)
  await ensureUser(testData.shareRecipient)
  const session = await login()

  await removeOwnedTasks(session)
  await removeCategories(session)

  const category = await apiRequest<Category>('categories/', {
    method: 'POST',
    session,
    expectedStatus: 201,
    body: JSON.stringify({ name: testData.categories.primary }),
  })
  await apiRequest<Category>('categories/', {
    method: 'POST',
    session,
    expectedStatus: 201,
    body: JSON.stringify({ name: testData.categories.disposable }),
  })

  await createTask(session, category.id, testData.tasks.open, false)
  await createTask(session, category.id, testData.tasks.completed, true)
}
