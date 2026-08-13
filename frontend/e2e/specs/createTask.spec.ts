import { describe, it } from 'node:test'

import testData from '../fixtures/testData.json'
import { LoginPage } from '../pages/LoginPage.ts'
import { TaskFormModal } from '../pages/TaskFormModal.ts'
import { TasksPage } from '../pages/TasksPage.ts'
import { seleniumConfig } from '../config/selenium.config.ts'
import { useIsolatedBrowser } from '../utils/testLifecycle.ts'

describe('Task creation', () => {
  const getDriver = useIsolatedBrowser()

  it(
    'creates a task through the form and displays it in the list',
    { timeout: seleniumConfig.testTimeout },
    async () => {
      const driver = getDriver()
      const loginPage = new LoginPage(driver)
      const tasksPage = new TasksPage(driver)

      await loginPage.open()
      await loginPage.login(testData.user.username, testData.user.password)
      await tasksPage.waitUntilReady()
      await tasksPage.openCreateForm()
      await new TaskFormModal(driver).createTask({
        title: testData.tasks.created,
        description: testData.tasks.createdDescription,
        category: testData.categories.primary,
      })

      await tasksPage.findTask(testData.tasks.created)
    },
  )
})
