import { test, expect } from '@playwright/test'

test.describe('Admin seed (UI)', () => {
  let adminCreds: any

  test.beforeAll(async () => {
    // Ensure we don't use a stale seed file — remove cached .e2e/seed.json so server will reseed
    try {
      const fs = require('fs')
      const path = '.e2e/seed.json'
      if (fs.existsSync(path)) fs.unlinkSync(path)
    } catch (e) {
      // ignore
    }
    // Try debug seed API, fall back to local seed file (.e2e/seed.json)
    try {
      const res = await fetch('http://localhost:3000/api/debug/seed-accounts', { method: 'POST' })
      const data = await res.json()
      if (data && data.admin) {
        adminCreds = data.admin
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
    } else {
      throw new Error('No seed data available')
    }
  })

  test.afterAll(async () => {
    // cleanup via debug API
    await fetch('http://localhost:3000/api/debug/cleanup-accounts', { method: 'POST', body: JSON.stringify({ adminMobile: adminCreds.mobile }), headers: { 'content-type': 'application/json' } })
  })

  test('admin can sign in with the seeded admin account', async ({ page }) => {
    // sign in
    await page.goto('/login')
    await page.fill('input[name="mobile"]', adminCreds.mobile)
    await page.fill('input[name="password"]', adminCreds.password)
    await page.click('button[type="submit"]')

    await page.goto('/admin')
    await expect(page.locator('h1')).toBeVisible({ timeout: 30000 })
  })
})
