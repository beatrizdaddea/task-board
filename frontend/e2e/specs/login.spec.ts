import { describe, it } from 'node:test'

import testData from '../fixtures/testData.json'
import { LoginPage } from '../pages/LoginPage.ts'
import { seleniumConfig } from '../config/selenium.config.ts'
import { useIsolatedBrowser } from '../utils/testLifecycle.ts'

describe('Login', () => {
  const getDriver = useIsolatedBrowser()

  it(
    'logs in with valid credentials and persists the session',
    { timeout: seleniumConfig.testTimeout },
    async () => {
      const loginPage = new LoginPage(getDriver())

      await loginPage.open()
      await loginPage.login(testData.user.username, testData.user.password)
      await loginPage.assertSessionPersisted()
    },
  )
})
