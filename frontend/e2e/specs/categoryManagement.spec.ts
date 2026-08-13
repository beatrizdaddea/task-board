import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

import testData from '../fixtures/testData.json'
import { CategoriesPage } from '../pages/CategoriesPage.ts'
import { LoginPage } from '../pages/LoginPage.ts'
import { seleniumConfig } from '../config/selenium.config.ts'
import { useIsolatedBrowser } from '../utils/testLifecycle.ts'

describe('Category management', () => {
  const getDriver = useIsolatedBrowser()

  it(
    'creates a category and displays it in the list',
    { timeout: seleniumConfig.testTimeout },
    async () => {
      const driver = getDriver()
      const loginPage = new LoginPage(driver)
      const categoriesPage = new CategoriesPage(driver)

      await loginPage.open()
      await loginPage.login(testData.user.username, testData.user.password)
      await categoriesPage.open()
      await categoriesPage.createCategory(testData.categories.created)

      assert.equal(
        await categoriesPage.hasCategory(testData.categories.created),
        true,
      )
    },
  )

  it(
    'edits an existing category and displays the new name',
    { timeout: seleniumConfig.testTimeout },
    async () => {
      const driver = getDriver()
      const loginPage = new LoginPage(driver)
      const categoriesPage = new CategoriesPage(driver)

      await loginPage.open()
      await loginPage.login(testData.user.username, testData.user.password)
      await categoriesPage.open()
      await categoriesPage.editCategory(
        testData.categories.disposable,
        testData.categories.updated,
      )

      assert.equal(
        await categoriesPage.hasCategory(testData.categories.updated),
        true,
      )
      assert.equal(
        await categoriesPage.hasCategory(testData.categories.disposable),
        false,
      )
    },
  )
})
