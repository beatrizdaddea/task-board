import { By, Key, until, type WebDriver } from 'selenium-webdriver'

import { seleniumConfig } from '../config/selenium.config.ts'
import { waitForAction } from '../utils/actionDelay.ts'

export class ShareDialog {
  constructor(private readonly driver: WebDriver) {}

  async shareWith(email: string) {
    const dialog = await this.driver.wait(
      until.elementLocated(By.css('[data-testid="share-dialog"]')),
      seleniumConfig.waitTimeout,
    )
    await dialog.findElement(By.id('share-user-email')).sendKeys(email)
    await waitForAction()
    await dialog.findElement(By.css('[data-testid="share-submit"]')).click()
    await waitForAction()
    await this.driver.wait(
      until.elementLocated(this.shareLocator(email)),
      seleniumConfig.waitTimeout,
    )
  }

  async hasShare(email: string) {
    return (await this.driver.findElements(this.shareLocator(email))).length > 0
  }

  async close() {
    const dialog = await this.driver.findElement(
      By.css('[data-testid="share-dialog"]'),
    )
    await this.driver.actions().sendKeys(Key.ESCAPE).perform()
    await waitForAction()
    await this.driver.wait(
      until.stalenessOf(dialog),
      seleniumConfig.waitTimeout,
    )
  }

  private shareLocator(email: string) {
    return By.xpath(
      `//*[@data-testid="share-list-item" and .//*[@data-testid="share-user-email" and normalize-space(.)="${email}"]]`,
    )
  }
}
