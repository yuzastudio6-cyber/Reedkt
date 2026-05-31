import { ocrCaptionRenderQaConfig } from './ocr-caption-render-qa-policy'
import type {
  OcrCaptionRenderQaBox,
  OcrCaptionRenderQaFixture,
  OcrCaptionRenderQaNormalizationReport,
  OcrCaptionRenderQaTextRegion,
} from './ocr-caption-render-qa-types'

export function buildOcrCaptionRenderQaNormalizationReport(input: {
  runId: string
  fixtures: OcrCaptionRenderQaFixture[]
}): OcrCaptionRenderQaNormalizationReport {
  const blockers: string[] = []
  const warnings: string[] = []
  let invalidRegionCount = 0

  const normalizedFixtures = input.fixtures.map((fixture) => ({
    ...fixture,
    frames: fixture.frames.map((frame) => ({
      ...frame,
      regions: frame.regions.map((region) => {
        const normalizedRegion = normalizeTextRegion(region)
        if (!boxIsValid(normalizedRegion.box)) {
          invalidRegionCount += 1
          normalizedRegion.blockers.push(`Invalid normalized OCR box for region ${region.regionId}.`)
        }
        if (normalizedRegion.confidence !== undefined && normalizedRegion.confidence < ocrCaptionRenderQaConfig.lowConfidenceWarningThreshold) {
          normalizedRegion.warnings.push(`OCR confidence below ${ocrCaptionRenderQaConfig.lowConfidenceWarningThreshold}.`)
        }
        if (normalizedRegion.source === 'phase37d_private_redacted' && normalizedRegion.text) {
          normalizedRegion.blockers.push('Controlled real-media OCR text must be redacted.')
        }
        return normalizedRegion
      }),
    })),
  }))

  if (invalidRegionCount > 0) blockers.push(`${invalidRegionCount} OCR text regions have invalid normalized boxes.`)
  if (normalizedFixtures.some((fixture) => fixture.kind === 'controlled_phase37d_metadata' && fixture.frames.every((frame) => frame.regions.length === 0))) {
    warnings.push('Controlled Phase 37D fixture is using summary-only evidence without private per-region boxes.')
  }

  const frameCount = normalizedFixtures.reduce((count, fixture) => count + fixture.frames.length, 0)
  const textRegionCount = normalizedFixtures.reduce((count, fixture) => count + fixture.frames.reduce((frameCountInner, frame) => frameCountInner + frame.regions.length, 0), 0)

  return {
    phase: '37E',
    runId: input.runId,
    fixtureCount: normalizedFixtures.length,
    frameCount,
    textRegionCount,
    controlledTextRedacted: true,
    invalidRegionCount,
    normalizedFixtures,
    blockers,
    warnings,
  }
}

export function paddedBox(box: OcrCaptionRenderQaBox, padding = ocrCaptionRenderQaConfig.padding): OcrCaptionRenderQaBox {
  const x = clamp01(box.x - padding)
  const y = clamp01(box.y - padding)
  const right = clamp01(box.x + box.width + padding)
  const bottom = clamp01(box.y + box.height + padding)
  return {
    x,
    y,
    width: Math.max(0, right - x),
    height: Math.max(0, bottom - y),
  }
}

export function intersectionArea(a: OcrCaptionRenderQaBox, b: OcrCaptionRenderQaBox): number {
  const left = Math.max(a.x, b.x)
  const top = Math.max(a.y, b.y)
  const right = Math.min(a.x + a.width, b.x + b.width)
  const bottom = Math.min(a.y + a.height, b.y + b.height)
  return Math.max(0, right - left) * Math.max(0, bottom - top)
}

export function boxArea(box: OcrCaptionRenderQaBox): number {
  return Math.max(0, box.width) * Math.max(0, box.height)
}

function normalizeTextRegion(region: OcrCaptionRenderQaTextRegion): OcrCaptionRenderQaTextRegion {
  return {
    ...region,
    box: normalizeBox(region.box),
    warnings: [...region.warnings],
    blockers: [...region.blockers],
    textRedaction: { ...region.textRedaction },
  }
}

function normalizeBox(box: OcrCaptionRenderQaBox): OcrCaptionRenderQaBox {
  const x = clamp01(box.x)
  const y = clamp01(box.y)
  const right = clamp01(box.x + box.width)
  const bottom = clamp01(box.y + box.height)
  return {
    x,
    y,
    width: Math.max(0, right - x),
    height: Math.max(0, bottom - y),
  }
}

function boxIsValid(box: OcrCaptionRenderQaBox): boolean {
  return Number.isFinite(box.x)
    && Number.isFinite(box.y)
    && Number.isFinite(box.width)
    && Number.isFinite(box.height)
    && box.width > 0
    && box.height > 0
    && box.x >= 0
    && box.y >= 0
    && box.x + box.width <= 1
    && box.y + box.height <= 1
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}
