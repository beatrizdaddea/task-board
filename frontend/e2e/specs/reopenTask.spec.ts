import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

import testData from '../fixtures/testData.json'
import { LoginPage } from '../pages/LoginPage.ts'
import { TasksPage } from '../pages/TasksPage.ts'
import { seleniumConfig } from '../config/selenium.config.ts'
import { useIsolatedBrowser } from '../utils/testLifecycle.ts'

describe('Task reopening', () => {
  const getDriver = useIsolatedBrowser()

  it(
    'reopens a completed task and updates its visual status',
    { timeout: seleniumConfig.testTimeout },
    async () => {
      const driver = getDriver()
      const loginPage = new LoginPage(driver)
      const tasksPage = new TasksPage(driver)

      await loginPage.open()
      await loginPage.login(testData.user.username, testData.user.password)
      await tasksPage.waitUntilReady()
      assert.equal(
        await tasksPage.taskStatus(testData.tasks.completed),
        'Concluída',
      )

      await tasksPage.reopenTask(testData.tasks.completed)

      assert.equal(
        await tasksPage.taskStatus(testData.tasks.completed),
        'Em aberto',
      )
    },
  )
})
