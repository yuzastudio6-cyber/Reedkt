import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import sharp from 'sharp'
import { isAllowedCaptureDomain, isSafeAllowlistedCaptureUrl } from './allowlisted-capture-policy'
import { controlledLiveSearchConfig } from './controlled-live-search-capture-policy'
import type {
  ControlledLiveSearchCaptureRecord,
  ControlledLiveSearchCaptureTarget,
} from './controlled-live-search-capture-types'

export async function runAllowlistedPageCapture(input: {
  target: ControlledLiveSearchCaptureTarget
  outputRoot: string
}): Promise<ControlledLiveSearchCaptureRecord> {
  if (!isSafeAllowlistedCaptureUrl(input.target.url)) throw new Error(`Capture target is not allowlisted: ${input.target.url}`)
  const captureDir = path.join(input.outputRoot, 'captures', input.target.sourceId)
  await mkdir(captureDir, { recursive: true })
  const screenshotPath = path.join(captureDir, 'screenshot-original.png')
  const htmlPath = path.join(captureDir, 'captured-page.html')
  const blockedRequests: string[] = []
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({
      viewport: controlledLiveSearchConfig.viewport,
      deviceScaleFactor: controlledLiveSearchConfig.viewport.deviceScaleFactor,
      ignoreHTTPSErrors: false,
    })
    await context.route('**/*', async (route) => {
      const request = route.request()
      const requestUrl = request.url()
      if (requestUrl === 'about:blank' || requestUrl.startsWith('data:') || requestUrl.startsWith('blob:')) {
        await route.continue()
        return
      }
      try {
        const url = new URL(requestUrl)
        const allowed = ['http:', 'https:'].includes(url.protocol) && isAllowedCaptureDomain(url.hostname)
        if (allowed) {
          await route.continue()
          return
        }
      } catch {
        // Non-URL requests are treated as blocked by the allowlist policy.
      }
      blockedRequests.push(requestUrl)
      await route.abort()
    })
    const page = await context.newPage()
    const response = await page.goto(input.target.url, { waitUntil: 'domcontentloaded', timeout: 25_000 })
    await page.waitForLoadState('networkidle', { timeout: 8_000 }).catch(() => undefined)
    const finalUrl = page.url()
    const finalDomain = new URL(finalUrl).hostname.toLowerCase()
    if (!isSafeAllowlistedCaptureUrl(finalUrl)) {
      throw new Error(`Capture target redirected outside the Phase 49G allowlist: ${finalUrl}`)
    }
    const html = await page.content()
    const htmlBytes = Buffer.byteLength(html, 'utf8')
    if (htmlBytes > controlledLiveSearchConfig.maxHtmlBytes) {
      throw new Error(`Captured page HTML for ${input.target.sourceId} exceeded ${controlledLiveSearchConfig.maxHtmlBytes} bytes.`)
    }
    await writeFile(htmlPath, html, 'utf8')
    await page.screenshot({ path: screenshotPath, fullPage: false, type: 'png' })
    const pageTitle = await page.title()
    const dom = await page.evaluate(() => ({
      h1: document.querySelector('h1')?.textContent?.trim() ?? '',
      articleCount: document.querySelectorAll('article').length,
      paragraphCount: document.querySelectorAll('p').length,
    }))
    await context.close()
    const metadata = await sharp(screenshotPath).metadata()
    const width = metadata.width ?? 0
    const height = metadata.height ?? 0
    if (width > controlledLiveSearchConfig.maxScreenshotWidth || height > controlledLiveSearchConfig.maxScreenshotHeight) {
      throw new Error(`Screenshot dimensions ${width}x${height} exceed the Phase 49G bounded viewport.`)
    }
    return {
      sourceId: input.target.sourceId,
      requestedUrl: input.target.url,
      finalUrl,
      finalDomain,
      status: response?.status(),
      pageTitle,
      browser: 'chromium',
      viewport: controlledLiveSearchConfig.viewport,
      screenshotPath,
      htmlPath,
      fullPage: false,
      allowlistedDomain: true,
      loginBypassUsed: false,
      captchaBypassUsed: false,
      paywallBypassUsed: false,
      linkClickUsed: false,
      publicWebCaptureUsed: true,
      capturedAt: new Date().toISOString(),
      blockedRequests: Array.from(new Set(blockedRequests)).slice(0, 50),
      dom,
      screenshotDimensions: { width, height },
      warnings: blockedRequests.length > 0 ? ['Non-allowlisted subresource requests were aborted during Playwright capture.'] : [],
    }
  } finally {
    await browser.close()
  }
}
