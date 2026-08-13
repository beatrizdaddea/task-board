import { strict as assert } from 'node:assert'
import { By, until, type WebDriver } from 'selenium-webdriver'

import { seleniumConfig } from '../config/selenium.config.ts'
import { waitForAction } from '../utils/actionDelay.ts'

export type SignupInput = {
  username: string
  email: string
  password: string
}

export class SignupPage {
  constructor(private readonly driver: WebDriver) {}

  async open() {
    await this.driver.get(`${seleniumConfig.baseUrl}/register`)
    await this.driver.wait(
      until.elementLocated(By.css('[data-testid="signup-page"]')),
      seleniumConfig.waitTimeout,
    )
  }

  async submit(input: SignupInput) {
    await this.driver
      .findElement(By.id('register-username'))
      .sendKeys(input.username)
    await waitForAction()
    await this.driver.findElement(By.id('email')).sendKeys(input.email)
    await waitForAction()
    await this.driver
      .findElement(By.id('register-password'))
      .sendKeys(input.password)
    await waitForAction()
    await this.driver
      .findElement(By.id('password-confirmation'))
      .sendKeys(input.password)
    await waitForAction()
    await this.driver
      .findElement(By.css('[data-testid="signup-submit"]'))
      .click()
    await waitForAction()
  }

  async submitEmptyForm() {
    await this.driver
      .findElement(By.css('[data-testid="signup-submit"]'))
      .click()
    await waitForAction()
  }

  async assertRegistrationSucceeded() {
    await this.driver.wait(
      until.urlIs(`${seleniumConfig.baseUrl}/login`),
      seleniumConfig.waitTimeout,
    )
    const success = await this.driver.wait(
      until.elementLocated(By.css('[data-testid="registration-success"]')),
      seleniumConfig.waitTimeout,
    )
    await this.driver.wait(
      until.elementTextContains(success, 'Conta criada'),
      seleniumConfig.waitTimeout,
    )
  }

  async assertEmailConflict() {
    const error = await this.driver.wait(
      until.elementLocated(By.css('[data-testid="signup-email-error"]')),
      seleniumConfig.waitTimeout,
    )
    await this.driver.wait(
      until.elementIsVisible(error),
      seleniumConfig.waitTimeout,
    )
    assert.match(await error.getText(), /existe|cadastrad|uso|unique/i)
    assert.equal(
      await this.driver.getCurrentUrl(),
      `${seleniumConfig.baseUrl}/register`,
    )
  }

  async assertRequiredFieldErrors() {
    const testIds = [
      'signup-username-error',
      'signup-email-error',
      'signup-password-error',
      'signup-password-confirmation-error',
    ]

    for (const testId of testIds) {
      const error = await this.driver.wait(
        until.elementLocated(By.css(`[data-testid="${testId}"]`)),
        seleniumConfig.waitTimeout,
      )
      assert.notEqual(await error.getText(), '')
    }
    assert.equal(
      await this.driver.getCurrentUrl(),
      `${seleniumConfig.baseUrl}/register`,
    )
  }

  async assertWeakPasswordError() {
    const error = await this.driver.wait(
      until.elementLocated(By.css('[data-testid="signup-password-error"]')),
      seleniumConfig.waitTimeout,
    )
    assert.match(await error.getText(), /8 caracteres/i)
    assert.equal(
      await this.driver.getCurrentUrl(),
      `${seleniumConfig.baseUrl}/register`,
    )
  }
}
