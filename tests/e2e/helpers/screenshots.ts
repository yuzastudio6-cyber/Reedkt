import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import type { Page } from '@playwright/test'

type CaptureDocScreenshotOptions = {
  movePointer?: boolean
  settleMs?: number
}

export async function captureDocScreenshot(
  page: Page,
  relativePath: string,
  options: CaptureDocScreenshotOptions = {},
) {
  const screenshotPath = resolve(process.cwd(), relativePath)
  const viewport = page.viewportSize()
  if (viewport && options.movePointer !== false) {
    await page.mouse.move(Math.max(viewport.width - 4, 0), 4)
  }
  const settleMs = options.settleMs ?? 150
  if (settleMs > 0) {
    await page.waitForTimeout(settleMs)
  }
  await mkdir(dirname(screenshotPath), { recursive: true })
  await page.screenshot({ path: screenshotPath, fullPage: false })
}
