import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import sharp from 'sharp'
import { playwrightSharpCaptureConfig } from './playwright-sharp-capture-policy'
import type { LocalHtmlFixtureResult, PlaywrightCaptureMetadata } from './playwright-sharp-capture-types'

export async function runPlaywrightLocalFixtureCapture(input: {
  localFixture: LocalHtmlFixtureResult
  outputRoot: string
}): Promise<PlaywrightCaptureMetadata> {
  const fixtureUrl = pathToFileURL(input.localFixture.fixturePath).toString()
  if (!fixtureUrl.startsWith('file://')) throw new Error(`Phase 49C fixture URL must be file://, got ${fixtureUrl}`)

  const screenshotPath = path.join(input.outputRoot, 'screenshot-original.png')
  const publicNetworkRequests: string[] = []
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({
      viewport: {
        width: playwrightSharpCaptureConfig.viewport.width,
        height: playwrightSharpCaptureConfig.viewport.height,
      },
      deviceScaleFactor: playwrightSharpCaptureConfig.viewport.deviceScaleFactor,
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
      sourceCardCount: document.querySelectorAll('.source-card').length,
      policyLabelCount: document.querySelectorAll('.label').length,
    }))
    await context.close()
    const metadata = await sharp(screenshotPath).metadata()
    return {
      browser: 'chromium',
      urlType: 'local_fixture',
      fixtureUrl,
      pageTitle,
      viewport: playwrightSharpCaptureConfig.viewport,
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
