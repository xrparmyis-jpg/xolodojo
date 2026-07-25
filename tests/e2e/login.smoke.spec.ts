import { expect, test } from '@playwright/test'

import { getTestUser } from '../helpers/credentials'

test.describe('auth smoke', () => {
  test('signs in with seeded email credentials', async ({ page }) => {
    const user = getTestUser('emailUser')

    await page.goto('/')

    await page.getByRole('button', { name: 'Get Started' }).click()
    await page.getByRole('button', { name: 'XoloDojo Account' }).click()

    await page.locator('#login-email').fill(user.email)
    await page.locator('#login-password').fill(user.password)
    await page.getByRole('button', { name: 'Sign in' }).click()

    const error = page.locator('.text-red-200')
    await Promise.race([
      page.getByRole('button', { name: 'Get Started' }).waitFor({
        state: 'hidden',
        timeout: 15_000,
      }),
      error.waitFor({ state: 'visible', timeout: 15_000 }),
    ]).catch(() => {})

    if (await error.isVisible().catch(() => false)) {
      throw new Error(`Sign-in failed: ${await error.textContent()}`)
    }

    await expect(
      page.getByRole('button', { name: 'Get Started' }),
    ).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'User menu' })).toBeVisible()
  })
})
