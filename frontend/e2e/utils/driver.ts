import { Builder, type WebDriver } from 'selenium-webdriver'
import { Options } from 'selenium-webdriver/chrome.js'

import { seleniumConfig } from '../config/selenium.config.ts'

export async function createDriver(): Promise<WebDriver> {
  const options = new Options()
  options.addArguments(
    '--window-size=1440,1000',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-dev-shm-usage',
    '--disable-sync',
    '--no-first-run',
    '--no-sandbox',
  )
  options.excludeSwitches('enable-logging')

  if (seleniumConfig.headless) {
    options.addArguments('--headless=new')
  }

  return new Builder().forBrowser('chrome').setChromeOptions(options).build()
}
