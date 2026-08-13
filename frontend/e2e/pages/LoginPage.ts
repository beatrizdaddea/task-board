import { strict as assert } from 'node:assert'
import { By, until, type WebDriver } from 'selenium-webdriver'

import { seleniumConfig } from '../config/selenium.config.ts'
import { waitForAction } from '../utils/actionDelay.ts'

export class LoginPage {
  constructor(private readonly driver: WebDriver) {}

  async open() {
    await this.driver.get(`${seleniumConfig.baseUrl}/login`)
    await this.driver.wait(
      until.elementLocated(By.css('[data-testid="login-submit"]')),
      seleniumConfig.waitTimeout,
    )
  }

  async login(username: string, password: string) {
    await this.driver.findElement(By.id('username')).sendKeys(username)
    await waitForAction()
    await this.driver.findElement(By.id('password')).sendKeys(password)
    await waitForAction()
    await this.driver
      .findElement(By.css('[data-testid="login-submit"]'))
      .click()
    await waitForAction()
    try {
      await this.driver.wait(
        until.urlIs(`${seleniumConfig.baseUrl}/dashboard`),
        seleniumConfig.waitTimeout,
      )
    } catch (error: unknown) {
      const alerts = await this.driver.findElements(By.css('[role="alert"]'))
      const alertText = alerts.length > 0 ? await alerts[0].getText() : ''
      throw new Error(
        `O login E2E não redirecionou para o dashboard.${
          alertText ? ` Mensagem exibida: ${alertText}` : ''
        } Verifique E2E_API_BASE_URL e o CORS do backend.`,
        { cause: error },
      )
    }
    await this.driver.wait(
      until.elementLocated(By.css('[data-testid="tasks-page"]')),
      seleniumConfig.waitTimeout,
    )
  }

  async assertSessionPersisted() {
    await this.driver.navigate().refresh()
    await this.driver.wait(
      until.elementLocated(By.css('[data-testid="tasks-page"]')),
      seleniumConfig.waitTimeout,
    )
    assert.equal(
      await this.driver.getCurrentUrl(),
      `${seleniumConfig.baseUrl}/dashboard`,
    )
  }
}
