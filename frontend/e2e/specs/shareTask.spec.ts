import { strict as assert } from 'node:assert'
import { describe, it } from 'node:test'

import testData from '../fixtures/testData.json'
import { LoginPage } from '../pages/LoginPage.ts'
import { ShareDialog } from '../pages/ShareDialog.ts'
import { TasksPage } from '../pages/TasksPage.ts'
import { seleniumConfig } from '../config/selenium.config.ts'
import { useIsolatedBrowser } from '../utils/testLifecycle.ts'

describe('Task sharing', () => {
  const getDriver = useIsolatedBrowser()

  it(
    'shares a task with another registered user',
    { timeout: seleniumConfig.testTimeout },
    async () => {
      const driver = getDriver()
      const loginPage = new LoginPage(driver)
      const tasksPage = new TasksPage(driver)
      const shareDialog = new ShareDialog(driver)

      await loginPage.open()
      await loginPage.login(testData.user.username, testData.user.password)
      await tasksPage.waitUntilReady()
      await tasksPage.openShareDialog(testData.tasks.open)
      await shareDialog.shareWith(testData.shareRecipient.email)

      assert.equal(
        await shareDialog.hasShare(testData.shareRecipient.email),
        true,
      )

      await shareDialog.close()
      await tasksPage.dismissToast()
      await tasksPage.logout()
      await loginPage.login(
        testData.shareRecipient.username,
        testData.shareRecipient.password,
      )
      await tasksPage.waitUntilReady()

      assert.equal(await tasksPage.hasTask(testData.tasks.open), true)
    },
  )
})
