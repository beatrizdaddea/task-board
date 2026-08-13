import { afterEach, describe, it } from 'node:test'
import { strict as assert } from 'node:assert'

import { configureHttpAuth, httpClient } from './httpClient'

const originalFetch = globalThis.fetch
const originalDocument = globalThis.document

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function setDocumentCookie(cookie = 'csrftoken=csrf-token') {
  Object.defineProperty(globalThis, 'document', {
    value: { cookie },
    configurable: true,
  })
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })
  return { promise, resolve }
}

afterEach(() => {
  globalThis.fetch = originalFetch
  Object.defineProperty(globalThis, 'document', {
    value: originalDocument,
    configurable: true,
  })
  configureHttpAuth({ onUnauthorized: () => undefined })
})

describe('httpClient cookie authentication', { concurrency: false }, () => {
  it('includes credentials and retries the original request after refresh', async () => {
    setDocumentCookie()
    const calls: Array<{ url: string; init?: RequestInit }> = []
    const responses = [
      jsonResponse(401, { detail: 'expired' }),
      jsonResponse(200, { detail: 'refreshed' }),
      jsonResponse(200, { id: 1 }),
    ]
    globalThis.fetch = async (url, init) => {
      calls.push({ url: String(url), init })
      return responses.shift() as Response
    }

    const result = await httpClient.get<{ id: number }>('tasks/1/')

    assert.deepEqual(result, { id: 1 })
    assert.equal(calls.length, 3)
    assert.match(calls[0].url, /tasks\/1\/$/)
    assert.match(calls[1].url, /auth\/refresh\/$/)
    assert.match(calls[2].url, /tasks\/1\/$/)
    assert.equal(
      calls.every(({ init }) => init?.credentials === 'include'),
      true,
    )
    assert.equal(
      new Headers(calls[1].init?.headers).get('X-CSRFToken'),
      'csrf-token',
    )
  })

  it('restores the authenticated user after refreshing an expired session', async () => {
    setDocumentCookie()
    const calls: string[] = []
    const responses = [
      jsonResponse(401, { detail: 'expired access' }),
      jsonResponse(200, { detail: 'refreshed' }),
      jsonResponse(200, {
        id: 7,
        username: 'beatriz',
        email: 'beatriz@example.com',
      }),
    ]
    globalThis.fetch = async (url) => {
      calls.push(new URL(String(url)).pathname)
      return responses.shift() as Response
    }

    const user = await httpClient.get<{
      id: number
      username: string
      email: string
    }>('auth/me/')

    assert.deepEqual(user, {
      id: 7,
      username: 'beatriz',
      email: 'beatriz@example.com',
    })
    assert.deepEqual(calls, [
      '/api/v1/auth/me/',
      '/api/v1/auth/refresh/',
      '/api/v1/auth/me/',
    ])
  })

  it('shares one refresh across simultaneous unauthorized requests', async () => {
    setDocumentCookie()
    const refreshResponse = deferred<Response>()
    const attempts = new Map<string, number>()
    let refreshCalls = 0

    globalThis.fetch = async (url) => {
      const path = new URL(String(url)).pathname
      if (path.endsWith('/auth/refresh/')) {
        refreshCalls++
        return refreshResponse.promise
      }

      const attempt = (attempts.get(path) ?? 0) + 1
      attempts.set(path, attempt)
      return attempt === 1
        ? jsonResponse(401, { detail: 'expired' })
        : jsonResponse(200, { path })
    }

    const requests = [
      httpClient.get<{ path: string }>('tasks/'),
      httpClient.get<{ path: string }>('categories/'),
      httpClient.get<{ path: string }>('profile/'),
    ]
    await new Promise((resolve) => setTimeout(resolve, 0))

    assert.equal(refreshCalls, 1)
    refreshResponse.resolve(jsonResponse(200, { detail: 'refreshed' }))
    const results = await Promise.all(requests)

    assert.equal(refreshCalls, 1)
    assert.deepEqual(
      results.map(({ path }) => path),
      ['/api/v1/tasks/', '/api/v1/categories/', '/api/v1/profile/'],
    )
    assert.equal(
      [...attempts.values()].every((attempt) => attempt === 2),
      true,
    )
  })

  it('rejects all waiting requests when the shared refresh fails', async () => {
    setDocumentCookie()
    const refreshResponse = deferred<Response>()
    let refreshCalls = 0
    let unauthorizedCalls = 0
    configureHttpAuth({ onUnauthorized: () => unauthorizedCalls++ })
    globalThis.fetch = async (url) => {
      const path = new URL(String(url)).pathname
      if (path.endsWith('/auth/refresh/')) {
        refreshCalls++
        return refreshResponse.promise
      }
      return jsonResponse(401, { detail: 'expired' })
    }

    const requests = [
      httpClient.get('tasks/'),
      httpClient.get('categories/'),
      httpClient.get('profile/'),
    ]
    const resultsPromise = Promise.allSettled(requests)
    await new Promise((resolve) => setTimeout(resolve, 0))

    assert.equal(refreshCalls, 1)
    refreshResponse.resolve(jsonResponse(401, { detail: 'invalid refresh' }))
    const results = await resultsPromise

    assert.equal(
      results.every(({ status }) => status === 'rejected'),
      true,
    )
    assert.equal(refreshCalls, 1)
    assert.equal(unauthorizedCalls, 1)
  })

  it('clears authentication when refresh fails', async () => {
    setDocumentCookie()
    let unauthorizedCalls = 0
    let fetchCalls = 0
    configureHttpAuth({ onUnauthorized: () => unauthorizedCalls++ })
    globalThis.fetch = async () => {
      fetchCalls++
      return fetchCalls === 1
        ? jsonResponse(401, { detail: 'expired' })
        : jsonResponse(401, { detail: 'invalid refresh' })
    }

    await assert.rejects(() => httpClient.get('tasks/'))

    assert.equal(fetchCalls, 2)
    assert.equal(unauthorizedCalls, 1)
  })

  it('retries each request at most once', async () => {
    setDocumentCookie()
    let unauthorizedCalls = 0
    const responses = [
      jsonResponse(401, { detail: 'expired' }),
      jsonResponse(200, { detail: 'refreshed' }),
      jsonResponse(401, { detail: 'still unauthorized' }),
    ]
    configureHttpAuth({ onUnauthorized: () => unauthorizedCalls++ })
    globalThis.fetch = async () => responses.shift() as Response

    await assert.rejects(() => httpClient.get('tasks/'))

    assert.equal(responses.length, 0)
    assert.equal(unauthorizedCalls, 1)
  })

  it('does not refresh public authentication requests', async () => {
    setDocumentCookie()
    let fetchCalls = 0
    globalThis.fetch = async () => {
      fetchCalls++
      return jsonResponse(401, { detail: 'invalid credentials' })
    }

    await assert.rejects(() =>
      httpClient.post('auth/login/', {}, { authenticated: false }),
    )

    assert.equal(fetchCalls, 1)
  })

  it('does not refresh logout requests', async () => {
    setDocumentCookie()
    let fetchCalls = 0
    globalThis.fetch = async () => {
      fetchCalls++
      return jsonResponse(401, { detail: 'already logged out' })
    }

    await assert.rejects(() =>
      httpClient.post('auth/logout/', undefined, { authenticated: false }),
    )

    assert.equal(fetchCalls, 1)
  })
})
