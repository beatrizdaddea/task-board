import {
  By,
  Key,
  until,
  type WebDriver,
  type WebElement,
} from 'selenium-webdriver'

import { seleniumConfig } from '../config/selenium.config.ts'
import { waitForAction } from '../utils/actionDelay.ts'

export class CategoriesPage {
  constructor(private readonly driver: WebDriver) {}

  async open() {
    await this.driver.get(`${seleniumConfig.baseUrl}/categories`)
    await this.driver.wait(
      until.elementLocated(By.css('[data-testid="categories-page"]')),
      seleniumConfig.waitTimeout,
    )
  }

  async findCategory(name: string): Promise<WebElement> {
    return this.driver.wait(
      until.elementLocated(this.categoryLocator(name)),
      seleniumConfig.waitTimeout,
    )
  }

  async hasCategory(name: string) {
    return (
      (await this.driver.findElements(this.categoryLocator(name))).length > 0
    )
  }

  async createCategory(name: string) {
    await this.driver
      .findElement(By.css('[data-testid="create-category"]'))
      .click()
    await waitForAction()
    await this.submitCategoryForm(name)
    await this.findCategory(name)
  }

  async editCategory(currentName: string, nextName: string) {
    const card = await this.findCategory(currentName)
    await card.findElement(By.css('[data-testid="edit-category"]')).click()
    await waitForAction()
    await this.submitCategoryForm(nextName, true)
    await this.findCategory(nextName)
  }

  async deleteCategory(name: string) {
    const card = await this.findCategory(name)
    await card.findElement(By.css('[data-testid="delete-category"]')).click()
    await waitForAction()
    const confirmation = await this.driver.wait(
      until.elementLocated(By.css('[data-testid="confirm-delete-category"]')),
      seleniumConfig.waitTimeout,
    )
    await this.driver.wait(
      until.elementIsVisible(confirmation),
      seleniumConfig.waitTimeout,
    )
    await confirmation.click()
    await waitForAction()
    await this.driver.wait(
      async () => !(await this.hasCategory(name)),
      seleniumConfig.waitTimeout,
    )
  }

  private async submitCategoryForm(name: string, replaceValue = false) {
    const form = await this.driver.wait(
      until.elementLocated(By.css('[data-testid="category-form"]')),
      seleniumConfig.waitTimeout,
    )
    const input = await form.findElement(By.id('category-name'))
    if (replaceValue) {
      await input.sendKeys(Key.chord(Key.CONTROL, 'a'), name)
    } else {
      await input.sendKeys(name)
    }
    await waitForAction()
    await form
      .findElement(By.css('[data-testid="category-form-submit"]'))
      .click()
    await waitForAction()
    await this.driver.wait(until.stalenessOf(form), seleniumConfig.waitTimeout)
  }

  private categoryLocator(name: string) {
    return By.xpath(
      `//*[@data-testid="category-card" and .//*[@data-testid="category-name" and normalize-space(.)="${name}"]]`,
    )
  }
}
