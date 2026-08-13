import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

import testData from '../fixtures/testData.json'
import { LoginPage } from '../pages/LoginPage.ts'
import { TaskFormModal } from '../pages/TaskFormModal.ts'
import { TasksPage } from '../pages/TasksPage.ts'
import { seleniumConfig } from '../config/selenium.config.ts'
import { useIsolatedBrowser } from '../utils/testLifecycle.ts'

describe('Task editing', () => {
  const getDriver = useIsolatedBrowser()

  it(
    'updates the task title and description',
    { timeout: seleniumConfig.testTimeout },
    async () => {
      const driver = getDriver()
      const loginPage = new LoginPage(driver)
      const tasksPage = new TasksPage(driver)

      await loginPage.open()
      await loginPage.login(testData.user.username, testData.user.password)
      await tasksPage.waitUntilReady()
      await tasksPage.openEditForm(testData.tasks.open)
      await new TaskFormModal(driver).updateTask({
        title: testData.tasks.updated,
        description: testData.tasks.updatedDescription,
      })

      assert.equal(await tasksPage.hasTask(testData.tasks.open), false)
      assert.equal(
        await tasksPage.taskDescription(testData.tasks.updated),
        testData.tasks.updatedDescription,
      )
    },
  )
})
