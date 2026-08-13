import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

import testData from '../fixtures/testData.json'
import { CategoriesPage } from '../pages/CategoriesPage.ts'
import { LoginPage } from '../pages/LoginPage.ts'
import { seleniumConfig } from '../config/selenium.config.ts'
import { useIsolatedBrowser } from '../utils/testLifecycle.ts'

describe('Category deletion', () => {
  const getDriver = useIsolatedBrowser()

  it(
    'deletes an unused category and removes it from the list',
    { timeout: seleniumConfig.testTimeout },
    async () => {
      const driver = getDriver()
      const loginPage = new LoginPage(driver)
      const categoriesPage = new CategoriesPage(driver)

      await loginPage.open()
      await loginPage.login(testData.user.username, testData.user.password)
      await categoriesPage.open()
      await categoriesPage.deleteCategory(testData.categories.disposable)

      assert.equal(
        await categoriesPage.hasCategory(testData.categories.disposable),
        false,
      )
    },
  )
})
