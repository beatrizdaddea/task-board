import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

import testData from '../fixtures/testData.json'
import { LoginPage } from '../pages/LoginPage.ts'
import { TasksPage } from '../pages/TasksPage.ts'
import { seleniumConfig } from '../config/selenium.config.ts'
import { useIsolatedBrowser } from '../utils/testLifecycle.ts'

describe('Task filtering', () => {
  const getDriver = useIsolatedBrowser()

  it(
    'displays only completed tasks when the status filter is applied',
    { timeout: seleniumConfig.testTimeout },
    async () => {
      const driver = getDriver()
      const loginPage = new LoginPage(driver)
      const tasksPage = new TasksPage(driver)

      await loginPage.open()
      await loginPage.login(testData.user.username, testData.user.password)
      await tasksPage.waitUntilReady()
      await tasksPage.filterByCompleted()

      assert.equal(await tasksPage.hasTask(testData.tasks.completed), true)
      assert.equal(await tasksPage.hasTask(testData.tasks.open), false)
    },
  )
})
