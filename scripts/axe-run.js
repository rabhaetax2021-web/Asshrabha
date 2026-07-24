// scripts/axe-run.js
// Usage: node scripts/axe-run.js <url>
// Fetches the provided URL and runs axe-core accessibility checks in jsdom.

const fs = require('fs')
const path = require('path')
const { JSDOM } = require('jsdom')
const fetch = require('node-fetch')
const axeCore = require('axe-core')

async function run(url) {
  try {
    console.log('Fetching', url)
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed to fetch ' + url)
    const html = await res.text()
    const dom = new JSDOM(html, { url })
    const { window } = dom
    // inject axe
    const script = window.document.createElement('script')
    script.textContent = axeCore.source
    window.document.head.appendChild(script)

    const results = await window.eval(`(async () => { return await axe.run(document); })()`)
    const out = JSON.stringify(results, null, 2)
    const outPath = path.resolve(process.cwd(), 'test-results', `axe-result-${Date.now()}.json`)
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, out)
    console.log('Axe results written to', outPath)
  } catch (err) {
    console.error('axe-run failed', err)
    process.exit(1)
  }
}

if (require.main === module) {
  const url = process.argv[2] || 'http://localhost:3000/'
  run(url)
}
