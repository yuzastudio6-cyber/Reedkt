import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { assertOutputPathInsideRoot } from '../workers/media/media-path-safety'
import type { InternalTestingCaptionCue } from './real-video-whole-edit-spec'

export interface PrivateCaptionOverlayInput {
  localPath: string
  startSeconds: number
  endSeconds: number
  x: number
  y: number
}

export async function renderPrivateCaptionOverlays(input: {
  cues: InternalTestingCaptionCue[]
  outputDirectory: string
  outputCanvas: { width: number; height: number }
}): Promise<PrivateCaptionOverlayInput[]> {
  const overlayDirectory = assertOutputPathInsideRoot(path.join(input.outputDirectory, 'caption-overlays'), input.outputDirectory)
  await mkdir(overlayDirectory, { recursive: true })
  const overlayWidth = Math.min(884, Math.max(320, input.outputCanvas.width - 120))
  const overlayHeight = 260
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({
      viewport: { width: overlayWidth, height: overlayHeight },
      deviceScaleFactor: 1,
    })
    const overlays: PrivateCaptionOverlayInput[] = []
    for (const [index, cue] of input.cues.entries()) {
      const localPath = assertOutputPathInsideRoot(
        path.join(overlayDirectory, `caption-${String(index + 1).padStart(3, '0')}.png`),
        input.outputDirectory,
      )
      const compact = cue.text.length > 44
      await page.setContent(buildCaptionDocument(cue.text, compact), { waitUntil: 'load' })
      await page.screenshot({ path: localPath, omitBackground: true })
      overlays.push({
        localPath,
        startSeconds: cue.startSeconds,
        endSeconds: cue.endSeconds,
        x: Math.round((input.outputCanvas.width - overlayWidth) / 2),
        y: Math.round(input.outputCanvas.height * 0.665),
      })
    }
    return overlays
  } finally {
    await browser.close()
  }
}

function buildCaptionDocument(text: string, compact: boolean): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      html, body { width: 100%; height: 100%; margin: 0; background: transparent; }
      body {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 12px 18px;
        font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
      }
      .caption {
        display: inline-block;
        max-width: 100%;
        padding: 16px 24px 18px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 16px;
        background: rgba(5, 8, 16, 0.78);
        color: #ffffff;
        font-size: ${compact ? 48 : 56}px;
        font-weight: 800;
        line-height: 1.08;
        letter-spacing: 0;
        text-align: center;
        text-wrap: balance;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9);
      }
    </style>
  </head>
  <body><div class="caption">${escapeHtml(text)}</div></body>
</html>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
