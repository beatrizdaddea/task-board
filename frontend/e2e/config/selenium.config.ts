function numberFromEnvironment(name: string, fallback: number) {
  const value = Number(process.env[name])
  return Number.isFinite(value) ? value : fallback
}

export const seleniumConfig = {
  baseUrl: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5173',
  apiBaseUrl: process.env.E2E_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1',
  headless: process.env.HEADLESS === 'true',
  actionDelay: numberFromEnvironment(
    'E2E_ACTION_DELAY',
    process.env.HEADLESS === 'true' ? 0 : 700,
  ),
  waitTimeout: numberFromEnvironment('E2E_WAIT_TIMEOUT', 10_000),
  testTimeout: numberFromEnvironment(
    'E2E_TEST_TIMEOUT',
    process.env.HEADLESS === 'true' ? 45_000 : 120_000,
  ),
} as const
