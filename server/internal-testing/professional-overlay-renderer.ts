import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { assertOutputPathInsideRoot } from '../workers/media/media-path-safety'
import type { TimedRasterOverlayInput } from '../workers/render/render-execution-types'
import type { ProfessionalGraphicCue, ProfessionalKineticCaptionCue } from './professional-real-video-edit-v2-spec'

export async function renderProfessionalKineticCaptionOverlays(input: {
  cues: ProfessionalKineticCaptionCue[]
  outputDirectory: string
  outputCanvas: { width: number; height: number }
}): Promise<TimedRasterOverlayInput[]> {
  const overlayDirectory = assertOutputPathInsideRoot(path.join(input.outputDirectory, 'kinetic-caption-overlays'), input.outputDirectory)
  await mkdir(overlayDirectory, { recursive: true })
  const width = Math.min(960, input.outputCanvas.width - 88)
  const height = 290
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
    const overlays: TimedRasterOverlayInput[] = []
    for (const [index, cue] of input.cues.entries()) {
      const localPath = assertOutputPathInsideRoot(
        path.join(overlayDirectory, `kinetic-caption-${String(index + 1).padStart(3, '0')}.png`),
        input.outputDirectory,
      )
      await page.setContent(buildKineticCaptionDocument(cue), { waitUntil: 'load' })
      await page.screenshot({ path: localPath, omitBackground: true })
      overlays.push({
        localPath,
        startSeconds: cue.startSeconds,
        endSeconds: cue.endSeconds,
        x: Math.round((input.outputCanvas.width - width) / 2),
        y: Math.round(input.outputCanvas.height * 0.625),
        fadeInSeconds: 0.035,
        fadeOutSeconds: 0.035,
      })
    }
    return overlays
  } finally {
    await browser.close()
  }
}

export async function renderProfessionalGraphicOverlays(input: {
  cues: ProfessionalGraphicCue[]
  outputDirectory: string
  outputCanvas: { width: number; height: number }
}): Promise<TimedRasterOverlayInput[]> {
  const overlayDirectory = assertOutputPathInsideRoot(path.join(input.outputDirectory, 'professional-graphic-overlays'), input.outputDirectory)
  await mkdir(overlayDirectory, { recursive: true })
  const width = 780
  const height = 220
  const browser = await chromium.launch({ headless: true })
  try {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
    const overlays: TimedRasterOverlayInput[] = []
    for (const [index, cue] of input.cues.entries()) {
      const localPath = assertOutputPathInsideRoot(
        path.join(overlayDirectory, `graphic-${String(index + 1).padStart(3, '0')}.png`),
        input.outputDirectory,
      )
      await page.setContent(buildGraphicDocument(cue), { waitUntil: 'load' })
      await page.screenshot({ path: localPath, omitBackground: true })
      overlays.push({
        localPath,
        startSeconds: cue.startSeconds,
        endSeconds: cue.endSeconds,
        x: Math.round((input.outputCanvas.width - width) / 2),
        y: cue.layout === 'brand_bug' ? 96 : 118,
        fadeInSeconds: 0.12,
        fadeOutSeconds: 0.12,
      })
    }
    return overlays
  } finally {
    await browser.close()
  }
}

function buildKineticCaptionDocument(cue: ProfessionalKineticCaptionCue): string {
  const emphasized = new Set(cue.emphasizedWords.map(normalizeWord))
  const words = cue.text.split(/\s+/).filter(Boolean)
  const content = words.map((word) => emphasized.has(normalizeWord(word))
    ? `<span class="emphasis">${escapeHtml(word)}</span>`
    : `<span>${escapeHtml(word)}</span>`).join(' ')
  const compact = cue.text.length > 20
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: transparent; }
      body { display: flex; align-items: center; justify-content: center; padding: 18px 22px 34px; }
      .caption {
        max-width: 100%;
        color: #fff;
        font-family: "Arial Rounded MT Bold", "Arial Black", Inter, sans-serif;
        font-size: ${compact ? 76 : 88}px;
        font-weight: 900;
        line-height: 0.98;
        letter-spacing: 0;
        text-align: center;
        text-transform: uppercase;
        text-wrap: balance;
        -webkit-text-stroke: 3px rgba(3, 7, 18, 0.94);
        paint-order: stroke fill;
        text-shadow:
          -4px -4px 0 rgba(3, 7, 18, 0.92),
           4px -4px 0 rgba(3, 7, 18, 0.92),
          -4px  4px 0 rgba(3, 7, 18, 0.92),
           4px  4px 0 rgba(3, 7, 18, 0.92),
           0 10px 18px rgba(0, 0, 0, 0.72);
      }
      .emphasis { color: #ff681f; }
    </style>
  </head>
  <body><div class="caption">${content}</div></body>
</html>`
}

function buildGraphicDocument(cue: ProfessionalGraphicCue): string {
  const accent = cue.accent === 'cyan' ? '#16c7ff' : cue.accent === 'violet' ? '#8b5cf6' : '#ff681f'
  const brand = cue.layout === 'brand_bug'
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      * { box-sizing: border-box; }
      html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: transparent; }
      body { display: flex; align-items: center; justify-content: center; padding: 18px; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .callout {
        position: relative;
        display: inline-flex;
        min-width: ${brand ? 430 : 580}px;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: ${brand ? '18px 34px 20px' : '16px 32px 19px'};
        border: 1px solid rgba(255,255,255,0.18);
        border-radius: 8px;
        background: rgba(4, 8, 18, 0.82);
        box-shadow: 0 12px 30px rgba(0,0,0,0.35);
      }
      .callout::before { content: ""; position: absolute; left: 18%; right: 18%; top: 0; height: 4px; background: ${accent}; }
      .eyebrow { color: ${accent}; font-size: 22px; font-weight: 800; line-height: 1; text-transform: uppercase; }
      .title { color: #fff; font-size: ${brand ? 54 : 42}px; font-weight: 850; line-height: 1.03; letter-spacing: 0; text-align: center; }
    </style>
  </head>
  <body>
    <div class="callout">
      <div class="eyebrow">${escapeHtml(cue.eyebrow)}</div>
      <div class="title">${escapeHtml(cue.title)}</div>
    </div>
  </body>
</html>`
}

function normalizeWord(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
