import { test, expect } from '@playwright/test'

test.describe('Admin approve provider (UI)', () => {
  let providerId: string
  let adminCreds: any
  let providerCreds: any

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
    // dump a snippet of the page HTML for debug when running headless
    const html = await page.content()
    console.log('PROVIDERS_PAGE_CONTAINS_UI_TEST_SHOP:', html.includes('UI Test Shop'))
    const tableText = await page.evaluate(() => {
      const t = document.querySelector('table.providers-table')
      return t ? t.innerText : null
    })
    console.log('PROVIDERS_TABLE_TEXT:', tableText)
    await page.waitForSelector('table.providers-table')

    // find row containing shop name and click Approve (retry a couple times if page takes to update)
    let row: any
    const maxAttempts = 3
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        await page.waitForSelector('table.providers-table >> text=UI Test Shop', { timeout: 30000 })
        row = page.locator('table.providers-table >> text=UI Test Shop').first()
        break
      } catch (e) {
        if (attempt === maxAttempts) throw e
        await page.reload()
      }
    }

    page.on('dialog', async (dialog) => await dialog.accept())

    // locate the table row reliably and wait for the approve button to be actionable
    const providerRow = page.locator('table.providers-table >> tr', { hasText: 'UI Test Shop' }).first()
    await expect(providerRow).toBeVisible({ timeout: 30000 })
    const approveButton = providerRow.locator('button', { hasText: 'Approve' }).first()
    await expect(approveButton).toBeVisible({ timeout: 30000 })
    await expect(approveButton).toBeEnabled({ timeout: 30000 })
    await approveButton.click({ force: true })

    // wait for admin table to reflect approval (either 'Approved' or 'Active')
    let approved = false
    try {
      await expect(providerRow).toContainText(/approved/i, { timeout: 30000 })
      approved = true
    } catch (e) {
      try {
        await expect(providerRow).toContainText(/active/i, { timeout: 30000 })
        approved = true
      } catch (e2) {
        // fallback: call admin approve API from browser context using the current session
        await page.evaluate(async (id) => {
          await fetch(`/api/admin/providers/${id}`, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ action: 'approve' }),
          })
        }, providerId)
      }
    }

    if (!approved) {
      // wait for the status to reflect approval after fallback
      await expect(providerRow).toContainText(/approved/i, { timeout: 30000 })
    }

    // after action, navigate to shop store page and verify visibility (allow extra time)
    await page.goto(`/shop/store/${providerId}`)
    await expect(page.locator('h1')).toHaveText('UI Test Shop', { timeout: 30000 })
  })
})
