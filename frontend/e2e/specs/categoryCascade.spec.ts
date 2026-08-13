import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

import { seleniumConfig } from '../config/selenium.config.ts'
import testData from '../fixtures/testData.json'
import { CategoriesPage } from '../pages/CategoriesPage.ts'
import { LoginPage } from '../pages/LoginPage.ts'
import { TaskFormModal } from '../pages/TaskFormModal.ts'
import { TasksPage } from '../pages/TasksPage.ts'
import { seedUncategorizedTask } from '../utils/dbHelper.ts'
import { useIsolatedBrowser } from '../utils/testLifecycle.ts'

describe('Category cascade deletion', () => {
  const getDriver = useIsolatedBrowser()

  it(
    'deletes associated tasks while preserving unrelated and uncategorized tasks',
    { timeout: seleniumConfig.testTimeout },
    async () => {
      const driver = getDriver()
      const loginPage = new LoginPage(driver)
      const categoriesPage = new CategoriesPage(driver)
      const tasksPage = new TasksPage(driver)
      const taskForm = new TaskFormModal(driver)

      await seedUncategorizedTask(testData.tasks.uncategorized)
      await loginPage.open()
      await loginPage.login(testData.user.username, testData.user.password)
      await categoriesPage.open()
      await categoriesPage.createCategory(testData.categories.cascade)
      await categoriesPage.createCategory(testData.categories.unaffected)

      await tasksPage.open()
      await tasksPage.openCreateForm()
      await taskForm.createTask({
        title: testData.tasks.cascade,
        description: 'This task must be deleted with its category.',
        category: testData.categories.cascade,
      })
      await tasksPage.findTask(testData.tasks.cascade)

      await tasksPage.openCreateForm()
      await taskForm.createTask({
        title: testData.tasks.unaffected,
        description: 'This task belongs to another category.',
        category: testData.categories.unaffected,
      })
      await categoriesPage.open()
      await categoriesPage.openDeleteConfirmation(testData.categories.cascade)
      assert.match(
        await categoriesPage.deleteConfirmationMessage(),
        /tarefas associadas.*excluídas permanentemente/i,
      )
      await categoriesPage.confirmCategoryDeletion(testData.categories.cascade)

      await tasksPage.open()
      assert.equal(await tasksPage.hasTask(testData.tasks.cascade), false)
      assert.equal(await tasksPage.hasTask(testData.tasks.unaffected), true)
      assert.equal(await tasksPage.hasTask(testData.tasks.uncategorized), true)
    },
  )
})
