import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import sharp from 'sharp'
import { privateWebE2EConfig } from './private-web-search-capture-e2e-policy'
import type { PrivateFixturePage, PrivateWebCaptureMetadata } from './private-web-search-capture-e2e-types'

export async function runPrivateFixturePageCapture(input: {
  page: PrivateFixturePage
  outputRoot: string
}): Promise<PrivateWebCaptureMetadata> {
  const fixtureUrl = pathToFileURL(input.page.fixturePath).toString()
  if (!fixtureUrl.startsWith('file://')) throw new Error(`Phase 49E fixture URL must be file://, got ${fixtureUrl}`)
  const captureDir = path.join(input.outputRoot, 'captures', input.page.sourceId)
  await mkdir(captureDir, { recursive: true })
  const screenshotPath = path.join(captureDir, 'screenshot-original.png')
  const publicNetworkRequests: string[] = []
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({
      viewport: privateWebE2EConfig.viewport,
      deviceScaleFactor: privateWebE2EConfig.viewport.deviceScaleFactor,
    })
    await context.route('**/*', async (route) => {
      const requestUrl = route.request().url()
      if (requestUrl.startsWith('file://') || requestUrl.startsWith('data:') || requestUrl === 'about:blank') {
        await route.continue()
        return
      }
      publicNetworkRequests.push(requestUrl)
      await route.abort()
    })
    const page = await context.newPage()
    await page.goto(fixtureUrl, { waitUntil: 'load' })
    await page.screenshot({ path: screenshotPath, fullPage: true, type: 'png' })
    const pageTitle = await page.title()
    const dom = await page.evaluate(() => ({
      h1: document.querySelector('h1')?.textContent?.trim() ?? '',
      policyLabelCount: document.querySelectorAll('.label').length,
      articleParagraphCount: document.querySelectorAll('article p').length,
    }))
    await context.close()
    const metadata = await sharp(screenshotPath).metadata()
    return {
      sourceId: input.page.sourceId,
      browser: 'chromium',
      urlType: 'phase_fixture_file_url',
      fixtureUrl,
      pageTitle,
      viewport: privateWebE2EConfig.viewport,
      screenshotPath,
      fullPage: true,
      publicWebCaptureUsed: false,
      publicNetworkRequests,
      capturedAt: new Date().toISOString(),
      dom,
      screenshotDimensions: {
        width: metadata.width ?? 0,
        height: metadata.height ?? 0,
      },
    }
  } finally {
    await browser.close()
  }
}
