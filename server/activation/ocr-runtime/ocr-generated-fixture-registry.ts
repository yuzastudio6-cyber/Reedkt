import { ocrRuntimeConfig } from './ocr-runtime-policy'
import type { OcrGeneratedFixtureSpec } from './ocr-runtime-types'

const w = ocrRuntimeConfig.fixtureWidth
const h = ocrRuntimeConfig.fixtureHeight

export const ocrGeneratedFixtureSpecs: OcrGeneratedFixtureSpec[] = [
  {
    fixtureId: 'basic-ui-text',
    width: w,
    height: h,
    generatedOnly: true,
    riskCategory: 'required_pass',
    seed: 'phase37c-basic-ui-text-v1',
    expectedTokens: ['REEDITPRO', 'UPLOAD', 'APPROVE', 'EXPORT'],
    criticalTokens: ['REEDITPRO', 'UPLOAD', 'APPROVE', 'EXPORT'],
    expectedRegions: [
      { regionId: 'brand-header', label: 'ReeditPro header text', x: 80, y: 56, width: 360, height: 78, required: true },
      { regionId: 'upload-action', label: 'Upload action button text', x: 92, y: 220, width: 260, height: 72, required: true },
      { regionId: 'approve-action', label: 'Approve action button text', x: 474, y: 220, width: 310, height: 72, required: true },
      { regionId: 'export-action', label: 'Export action button text', x: 886, y: 220, width: 260, height: 72, required: true },
    ],
    passCriteria: [
      'critical token recall >= 0.80',
      'average OCR confidence >= 0.60 when reported',
      'at least one OCR box center inside each required expected broad region',
    ],
    warningCriteria: [],
  },
  {
    fixtureId: 'caption-safe-zone-conflict',
    width: w,
    height: h,
    generatedOnly: true,
    riskCategory: 'required_pass',
    seed: 'phase37c-caption-safe-zone-conflict-v1',
    expectedTokens: ['CAPTION', 'SAFE', 'ZONE', 'ALERT'],
    criticalTokens: ['CAPTION', 'SAFE', 'ZONE', 'ALERT'],
    expectedRegions: [
      { regionId: 'lower-caption-conflict-text', label: 'Text inside lower caption conflict zone', x: 340, y: 584, width: 604, height: 86, required: true },
    ],
    captionConflictZone: { regionId: 'lower-caption-conflict-zone', label: 'Expected lower caption conflict zone', x: 256, y: 560, width: 768, height: 126, required: true },
    passCriteria: [
      'critical token recall >= 0.80',
      'average OCR confidence >= 0.60 when reported',
      'at least one detected OCR text region intersects the expected lower caption conflict zone',
    ],
    warningCriteria: [],
  },
  {
    fixtureId: 'multi-region-ui',
    width: w,
    height: h,
    generatedOnly: true,
    riskCategory: 'required_pass',
    seed: 'phase37c-multi-region-ui-v1',
    expectedTokens: ['SOURCE', 'PREVIEW', 'TIMELINE', 'CREDITS'],
    criticalTokens: ['SOURCE', 'PREVIEW', 'TIMELINE', 'CREDITS'],
    expectedRegions: [
      { regionId: 'source-panel-label', label: 'Source panel label', x: 74, y: 102, width: 260, height: 74, required: true },
      { regionId: 'preview-panel-label', label: 'Preview panel label', x: 858, y: 102, width: 300, height: 74, required: true },
      { regionId: 'timeline-label', label: 'Timeline label', x: 80, y: 574, width: 330, height: 78, required: true },
      { regionId: 'credits-label', label: 'Credits label', x: 906, y: 574, width: 250, height: 78, required: true },
    ],
    passCriteria: [
      'critical token recall >= 0.80',
      'average OCR confidence >= 0.60 when reported',
      'at least one OCR box center inside each required expected broad region',
    ],
    warningCriteria: [],
  },
  {
    fixtureId: 'low-contrast-warning',
    width: w,
    height: h,
    generatedOnly: true,
    riskCategory: 'warning_only',
    seed: 'phase37c-low-contrast-warning-v1',
    expectedTokens: ['LOW', 'CONTRAST', 'WARNING'],
    criticalTokens: ['LOW', 'CONTRAST', 'WARNING'],
    expectedRegions: [
      { regionId: 'low-contrast-label', label: 'Low contrast label', x: 350, y: 318, width: 582, height: 86, required: false },
    ],
    passCriteria: [],
    warningCriteria: ['warning fixture records recall/confidence misses without blocking Phase 37C'],
  },
  {
    fixtureId: 'small-text-warning',
    width: w,
    height: h,
    generatedOnly: true,
    riskCategory: 'warning_only',
    seed: 'phase37c-small-text-warning-v1',
    expectedTokens: ['SMALL', 'TEXT', 'WARNING'],
    criticalTokens: ['SMALL', 'TEXT', 'WARNING'],
    expectedRegions: [
      { regionId: 'small-text-label', label: 'Small text label', x: 512, y: 356, width: 256, height: 42, required: false },
    ],
    passCriteria: [],
    warningCriteria: ['warning fixture records recall/confidence misses without blocking Phase 37C'],
  },
  {
    fixtureId: 'rotated-text-blocked-or-warning',
    width: w,
    height: h,
    generatedOnly: true,
    riskCategory: 'orientation_deferred',
    seed: 'phase37c-rotated-text-deferred-v1',
    expectedTokens: ['ROTATED', 'TEXT', 'DEFERRED'],
    criticalTokens: ['ROTATED', 'TEXT', 'DEFERRED'],
    expectedRegions: [
      { regionId: 'rotated-text-label', label: 'Rotated text label', x: 502, y: 256, width: 296, height: 210, required: false },
    ],
    passCriteria: [],
    warningCriteria: ['PP-LCNet_x1_0_textline_ori is deferred, so rotated text remains warning/skipped and does not block Phase 37C.'],
  },
]

export function buildOcrGeneratedFixtureManifest(createdAt = new Date().toISOString()) {
  return {
    phase: '37C' as const,
    createdAt,
    generatedOnly: true as const,
    fixtureCount: ocrGeneratedFixtureSpecs.length,
    fixtureWidth: w,
    fixtureHeight: h,
    specs: ocrGeneratedFixtureSpecs.map((spec) => ({
      ...spec,
      expectedRegions: spec.expectedRegions.map((region) => ({ ...region })),
      captionConflictZone: spec.captionConflictZone ? { ...spec.captionConflictZone } : undefined,
    })),
    blocked: {
      realMedia: true,
      realVideo: true,
      textlineOrientationClassifier: true,
    },
  }
}
