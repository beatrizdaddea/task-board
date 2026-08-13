import { By, Key, until, type WebDriver } from 'selenium-webdriver'

import { seleniumConfig } from '../config/selenium.config.ts'
import { waitForAction } from '../utils/actionDelay.ts'

export class TaskFormModal {
  constructor(private readonly driver: WebDriver) {}

  async createTask(input: {
    title: string
    description: string
    category: string
  }) {
    const form = await this.driver.wait(
      until.elementLocated(By.css('[data-testid="task-form"]')),
      seleniumConfig.waitTimeout,
    )
    await form.findElement(By.id('task-title')).sendKeys(input.title)
    await waitForAction()
    await form
      .findElement(By.id('task-description'))
      .sendKeys(input.description)
    await waitForAction()
    await form.findElement(By.id('task-category-field')).click()
    await waitForAction()

    const categoryOption = await this.driver.wait(
      until.elementLocated(
        By.xpath(
          `//*[@role="option" and normalize-space(.)="${input.category}"]`,
        ),
      ),
      seleniumConfig.waitTimeout,
    )
    await this.driver.wait(
      until.elementIsVisible(categoryOption),
      seleniumConfig.waitTimeout,
    )
    await categoryOption.click()
    await waitForAction()
    await form.findElement(By.css('[data-testid="task-form-submit"]')).click()
    await waitForAction()
    await this.driver.wait(until.stalenessOf(form), seleniumConfig.waitTimeout)
  }

  async updateTask(input: { title: string; description: string }) {
    const form = await this.driver.wait(
      until.elementLocated(By.css('[data-testid="task-form"]')),
      seleniumConfig.waitTimeout,
    )
    const title = await form.findElement(By.id('task-title'))
    await title.sendKeys(Key.chord(Key.CONTROL, 'a'), input.title)
    await waitForAction()

    const description = await form.findElement(By.id('task-description'))
    await description.sendKeys(Key.chord(Key.CONTROL, 'a'), input.description)
    await waitForAction()
    await form.findElement(By.css('[data-testid="task-form-submit"]')).click()
    await waitForAction()
    await this.driver.wait(until.stalenessOf(form), seleniumConfig.waitTimeout)
  }
}
