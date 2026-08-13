import { describe, it } from 'node:test'

import testData from '../fixtures/testData.json'
import { SignupPage, type SignupInput } from '../pages/SignupPage.ts'
import { seleniumConfig } from '../config/selenium.config.ts'
import { useIsolatedBrowser } from '../utils/testLifecycle.ts'

function uniqueSignupInput(): SignupInput {
  const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  return {
    username: `${testData.signup.usernamePrefix}${suffix}`,
    email: `${testData.signup.emailPrefix}${suffix}@taskboard.local`,
    password: testData.signup.password,
  }
}

describe('User signup', () => {
  const getDriver = useIsolatedBrowser()

  it(
    'registers a valid user and redirects to the login page',
    { timeout: seleniumConfig.testTimeout },
    async () => {
      const signupPage = new SignupPage(getDriver())

      await signupPage.open()
      await signupPage.submit(uniqueSignupInput())
      await signupPage.assertRegistrationSucceeded()
    },
  )

  it(
    'displays an error when the email is already registered',
    { timeout: seleniumConfig.testTimeout },
    async () => {
      const signupPage = new SignupPage(getDriver())
      const input = uniqueSignupInput()

      await signupPage.open()
      await signupPage.submit({ ...input, email: testData.user.email })
      await signupPage.assertEmailConflict()
    },
  )

  it(
    'validates required fields without submitting the form',
    { timeout: seleniumConfig.testTimeout },
    async () => {
      const signupPage = new SignupPage(getDriver())

      await signupPage.open()
      await signupPage.submitEmptyForm()
      await signupPage.assertRequiredFieldErrors()
    },
  )

  it(
    'rejects a password shorter than eight characters',
    { timeout: seleniumConfig.testTimeout },
    async () => {
      const signupPage = new SignupPage(getDriver())

      await signupPage.open()
      await signupPage.submit({
        ...uniqueSignupInput(),
        password: testData.signup.weakPassword,
      })
      await signupPage.assertWeakPasswordError()
    },
  )
})
