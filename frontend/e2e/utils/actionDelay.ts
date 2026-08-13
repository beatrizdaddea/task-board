import { setTimeout } from 'node:timers/promises'

import { seleniumConfig } from '../config/selenium.config.ts'

export async function waitForAction() {
  if (seleniumConfig.actionDelay > 0) {
    await setTimeout(seleniumConfig.actionDelay)
  }
}
