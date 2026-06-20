import { test, expect } from '@playwright/test'

test.describe('Admin approve provider (UI)', () => {
  let providerId: string
  let adminCreds: any
  let providerCreds: any

  test.beforeAll(async () => {
    // Try debug seed API, fall back to local seed file (.e2e/seed.json)
    try {
      const res = await fetch('http://localhost:3000/api/debug/seed-accounts', { method: 'POST' })
      const data = await res.json()
      if (data && data.admin && data.provider) {
        adminCreds = data.admin
        providerCreds = data.provider
        providerId = providerCreds.id
        return
      }
    } catch (e) {
      // ignore and fall back to local seed file
    }

    // Fallback: read seed file created by scripts/seed-e2e.js
    const fs = require('fs')
    const path = '.e2e/seed.json'
    if (fs.existsSync(path)) {
      const d = JSON.parse(fs.readFileSync(path, 'utf8'))
      adminCreds = d.admin
      providerCreds = d.provider
      providerId = providerCreds.id
    } else {
      throw new Error('No seed data available')
    }
  })

  test.afterAll(async () => {
    // cleanup via debug API
    await fetch('http://localhost:3000/api/debug/cleanup-accounts', { method: 'POST', body: JSON.stringify({ providerId, providerMobile: providerCreds.mobile, adminMobile: adminCreds.mobile }), headers: { 'content-type': 'application/json' } })
  })

  test('admin can sign in and approve provider', async ({ page }) => {
    // sign in
    await page.goto('/login')
    await page.fill('input[name="mobile"]', adminCreds.mobile)
    await page.fill('input[name="password"]', adminCreds.password)
    await page.click('button[type="submit"]')

    // navigate to providers list
    await page.goto('/admin/accounts/providers')
    await page.waitForSelector('table.providers-table')

    // find row containing shop name and click Approve
    const row = page.locator('table.providers-table >> text=UI Test Shop').first()
    await expect(row).toBeVisible()

    const approveButton = row.locator('xpath=..').locator('button', { hasText: 'Approve' }).first()
    await approveButton.click()

    page.on('dialog', async (dialog) => {
      await dialog.accept()
    })

    // after action, navigate to shop store page and verify visibility
    await page.goto(`/shop/store/${providerId}`)
    await expect(page.locator('h1')).toHaveText('UI Test Shop')
  })
})
