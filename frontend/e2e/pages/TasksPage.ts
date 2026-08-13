import { By, until, type WebDriver, type WebElement } from 'selenium-webdriver'

import { seleniumConfig } from '../config/selenium.config.ts'
import { waitForAction } from '../utils/actionDelay.ts'

export class TasksPage {
  constructor(private readonly driver: WebDriver) {}

  async waitUntilReady() {
    await this.driver.wait(
      until.elementLocated(By.css('[data-testid="tasks-page"]')),
      seleniumConfig.waitTimeout,
    )
    await this.waitForListUpdate()
  }

  async openCreateForm() {
    await this.driver.findElement(By.css('[data-testid="create-task"]')).click()
    await waitForAction()
  }

  async logout() {
    await this.driver.findElement(By.css('[data-testid="logout"]')).click()
    await waitForAction()
    await this.driver.wait(
      until.urlIs(`${seleniumConfig.baseUrl}/login`),
      seleniumConfig.waitTimeout,
    )
  }

  async dismissToast() {
    const closeButtons = await this.driver.findElements(
      By.css('[data-slot="toast-close"]'),
    )
    if (closeButtons.length === 0) return

    const closeButton = closeButtons[0]
    await closeButton.click()
    await waitForAction()
    await this.driver.wait(
      until.stalenessOf(closeButton),
      seleniumConfig.waitTimeout,
    )
  }

  async findTask(title: string): Promise<WebElement> {
    return this.driver.wait(
      until.elementLocated(this.taskLocator(title)),
      seleniumConfig.waitTimeout,
    )
  }

  async hasTask(title: string) {
    return (await this.driver.findElements(this.taskLocator(title))).length > 0
  }

  async taskStatus(title: string) {
    const card = await this.findTask(title)
    return card.findElement(By.css('[data-testid="task-status"]')).getText()
  }

  async completeTask(title: string) {
    await this.toggleTaskStatus(title, 'Concluída')
  }

  async reopenTask(title: string) {
    await this.toggleTaskStatus(title, 'Em aberto')
  }

  async openEditForm(title: string) {
    const card = await this.findTask(title)
    await card.findElement(By.css('[data-testid="edit-task"]')).click()
    await waitForAction()
  }

  async openShareDialog(title: string) {
    const card = await this.findTask(title)
    await card.findElement(By.css('[data-testid="share-task"]')).click()
    await waitForAction()
  }

  async taskDescription(title: string) {
    const card = await this.findTask(title)
    return card
      .findElement(By.css('[data-testid="task-description"]'))
      .getText()
  }

  async filterByCompleted() {
    await this.driver
      .findElement(By.css('[data-testid="desktop-task-status-filter"]'))
      .click()
    await waitForAction()
    const option = await this.driver.wait(
      until.elementLocated(
        By.xpath('//*[@role="option" and normalize-space(.)="Concluídas"]'),
      ),
      seleniumConfig.waitTimeout,
    )
    await this.driver.wait(
      until.elementIsVisible(option),
      seleniumConfig.waitTimeout,
    )
    await option.click()
    await waitForAction()
    await this.waitForListUpdate()
  }

  async deleteTask(title: string) {
    const card = await this.findTask(title)
    await card.findElement(By.css('[data-testid="delete-task"]')).click()
    await waitForAction()
    const confirmation = await this.driver.wait(
      until.elementLocated(By.css('[data-testid="confirm-delete-task"]')),
      seleniumConfig.waitTimeout,
    )
    await this.driver.wait(
      until.elementIsVisible(confirmation),
      seleniumConfig.waitTimeout,
    )
    await confirmation.click()
    await waitForAction()
    await this.driver.wait(
      async () => !(await this.hasTask(title)),
      seleniumConfig.waitTimeout,
    )
  }

  private async toggleTaskStatus(title: string, expectedStatus: string) {
    const card = await this.findTask(title)
    await card.findElement(By.css('[data-testid="task-status-toggle"]')).click()
    await waitForAction()
    await this.driver.wait(
      async () => (await this.taskStatus(title)) === expectedStatus,
      seleniumConfig.waitTimeout,
    )
  }

  private async waitForListUpdate() {
    await this.driver.wait(async () => {
      const region = await this.driver.findElement(
        By.css('[data-testid="tasks-list-region"]'),
      )
      return (await region.getAttribute('data-loading')) === 'false'
    }, seleniumConfig.waitTimeout)
  }

  private taskLocator(title: string) {
    return By.xpath(
      `//*[@data-testid="task-card" and .//*[@data-testid="task-title" and normalize-space(.)="${title}"]]`,
    )
  }
}
