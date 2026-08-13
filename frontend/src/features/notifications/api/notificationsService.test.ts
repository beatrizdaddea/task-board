import { strict as assert } from 'node:assert'
import { afterEach, describe, it } from 'node:test'

import { notificationsService } from './notificationsService'

const originalDocument = globalThis.document
const originalFetch = globalThis.fetch

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => {
  globalThis.fetch = originalFetch
  Object.defineProperty(globalThis, 'document', {
    value: originalDocument,
    configurable: true,
  })
})

describe('notificationsService', { concurrency: false }, () => {
  it('lists the authenticated user notifications', async () => {
    Object.defineProperty(globalThis, 'document', {
      value: { cookie: '' },
      configurable: true,
    })
    let requestedPath = ''
    globalThis.fetch = async (url, init) => {
      requestedPath = new URL(String(url)).pathname
      assert.equal(init?.credentials, 'include')
      assert.equal(init?.method, 'GET')
      return jsonResponse([])
    }

    const notifications = await notificationsService.list()

    assert.deepEqual(notifications, [])
    assert.equal(requestedPath, '/api/v1/notifications/')
  })

  it('marks one notification and then all notifications as read', async () => {
    Object.defineProperty(globalThis, 'document', {
      value: { cookie: 'csrftoken=csrf-token' },
      configurable: true,
    })
    const requests: Array<{ path: string; init?: RequestInit }> = []
    globalThis.fetch = async (url, init) => {
      requests.push({ path: new URL(String(url)).pathname, init })
      return requests.length === 1
        ? jsonResponse({
            id: 9,
            type: 'TASK_SHARED',
            task: 4,
            message: 'Uma tarefa foi compartilhada.',
            created_at: '2026-08-13T10:00:00Z',
            read_at: '2026-08-13T10:01:00Z',
          })
        : jsonResponse({ updated: 2 })
    }

    await notificationsService.markAsRead(9)
    const result = await notificationsService.markAllAsRead()

    assert.deepEqual(result, { updated: 2 })
    assert.deepEqual(
      requests.map(({ path }) => path),
      ['/api/v1/notifications/9/read/', '/api/v1/notifications/read-all/'],
    )
    assert.equal(requests[0].init?.method, 'PATCH')
    assert.equal(requests[1].init?.method, 'POST')
    assert.equal(
      requests.every(
        ({ init }) =>
          new Headers(init?.headers).get('X-CSRFToken') === 'csrf-token',
      ),
      true,
    )
  })
})
