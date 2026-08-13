import { afterEach, beforeEach } from 'node:test'
import type { WebDriver } from 'selenium-webdriver'

import { resetTestData } from './dbHelper.ts'
import { createDriver } from './driver.ts'

export function useIsolatedBrowser() {
  let driver: WebDriver | undefined

  beforeEach(async () => {
    await resetTestData()
    driver = await createDriver()
  })

  afterEach(async () => {
    await driver?.quit()
    driver = undefined
  })

  return () => {
    if (!driver) throw new Error('WebDriver não foi inicializado.')
    return driver
  }
}
