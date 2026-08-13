import testData from '../fixtures/testData.json'
import { seleniumConfig } from '../config/selenium.config.ts'

type AuthTokens = {
  access: string
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
  accessToken?: string
  expectedStatus?: number
}

async function apiRequest<T>(path: string, options: ApiOptions = {}) {
  const {
    accessToken,
    expectedStatus,
    headers: requestHeaders,
    ...requestOptions
  } = options
  const headers = new Headers(requestHeaders)
  headers.set('Accept', 'application/json')

  if (requestOptions.body) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

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

async function login() {
  return apiRequest<AuthTokens>('auth/login/', {
    method: 'POST',
    body: JSON.stringify({
      username: testData.user.username,
      password: testData.user.password,
    }),
  })
}

async function removeOwnedTasks(accessToken: string) {
  while (true) {
    const tasks = await apiRequest<TasksResponse>('tasks/?page=1', {
      accessToken,
    })
    const ownedTasks = tasks.results.filter(
      (task) => task.permissions.can_delete,
    )
    if (ownedTasks.length === 0) return

    await Promise.all(
      ownedTasks.map((task) =>
        apiRequest<void>(`tasks/${task.id}/`, {
          method: 'DELETE',
          accessToken,
          expectedStatus: 204,
        }),
      ),
    )
  }
}

async function removeCategories(accessToken: string) {
  const categories = await apiRequest<Category[]>('categories/', {
    accessToken,
  })
  await Promise.all(
    categories.map((category) =>
      apiRequest<void>(`categories/${category.id}/`, {
        method: 'DELETE',
        accessToken,
        expectedStatus: 204,
      }),
    ),
  )
}

async function createTask(
  accessToken: string,
  categoryId: number | null,
  title: string,
  completed: boolean,
) {
  await apiRequest<Task>('tasks/', {
    method: 'POST',
    accessToken,
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
  const { access } = await login()
  await createTask(access, null, title, false)
}

export async function resetTestData() {
  await ensureUser(testData.user)
  await ensureUser(testData.shareRecipient)
  const { access } = await login()

  await removeOwnedTasks(access)
  await removeCategories(access)

  const category = await apiRequest<Category>('categories/', {
    method: 'POST',
    accessToken: access,
    expectedStatus: 201,
    body: JSON.stringify({ name: testData.categories.primary }),
  })
  await apiRequest<Category>('categories/', {
    method: 'POST',
    accessToken: access,
    expectedStatus: 201,
    body: JSON.stringify({ name: testData.categories.disposable }),
  })

  await createTask(access, category.id, testData.tasks.open, false)
  await createTask(access, category.id, testData.tasks.completed, true)
}
