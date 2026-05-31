import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.goto('https://www.wevity.com/?c=find&s=1&gub=1', { waitUntil: 'networkidle', timeout: 30000 })

// Check total count display
const totalText = await page.textContent('.total') ?? await page.textContent('.count') ?? 'N/A'
console.log('Total text:', totalText)

// Find all buttons/links that look like pagination
const navLinks = await page.evaluate(() => {
  const links: string[] = []
  document.querySelectorAll('a, button').forEach(el => {
    const text = el.textContent?.trim() ?? ''
    if (text === '다음' || text === '이전' || text === '>' || text === '<' || /^\d+$/.test(text)) {
      links.push(`[${el.tagName}] "${text}" href=${(el as HTMLAnchorElement).href ?? 'N/A'}`)
    }
  })
  return links
})
console.log('Nav elements:', navLinks)

// Count all contest items
const count = await page.locator('ul.list li:not(.top)').count()
console.log('Contest items on page:', count)

// Check if there's an AJAX-loaded section
const totalCount = await page.evaluate(() => {
  const all = document.querySelectorAll('*')
  for (const el of all) {
    if (el.textContent?.includes('총') && el.textContent.includes('건')) {
      return el.textContent?.trim()
    }
  }
  return null
})
console.log('Total count:', totalCount?.substring(0, 200))

await browser.close()