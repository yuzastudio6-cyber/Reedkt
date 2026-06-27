import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import type { Page } from '@playwright/test'

export async function captureDocScreenshot(page: Page, relativePath: string) {
  const screenshotPath = resolve(process.cwd(), relativePath)
  const viewport = page.viewportSize()
  if (viewport) {
    await page.mouse.move(Math.max(viewport.width - 4, 0), 4)
    await page.waitForTimeout(150)
  }
  await mkdir(dirname(screenshotPath), { recursive: true })
  await page.screenshot({ path: screenshotPath, fullPage: false })
}
