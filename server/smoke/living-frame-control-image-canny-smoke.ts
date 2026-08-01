import assert from 'node:assert/strict'

import type {
  LivingFrameControlImageCannyReport,
  LivingFrameControlImageCannyReportDraft,
} from '../../src/types/living-frame-control-image-canny'
import {
  createLivingFrameControlImageCanny,
  verifyLivingFrameControlImageCannyReport,
} from '../living-frame/living-frame-control-image-canny'
import { sha256AuthorityValue } from '../services/private-edit-authority-store'

const width = 32
const height = 24
const source = squareFixture(width, height)
const sourceBefore = new Uint8Array(source)
const input = {
  sourceArtifactId: 'artifact.generic-control-source',
  sourceArtifactDigestSha256: sha256AuthorityValue('source-artifact'),
  width,
  height,
  sourceRgbaBytes: source,
  lowThreshold: 30,
  highThreshold: 80,
}
const result = createLivingFrameControlImageCanny(input)

assert.equal(verifyLivingFrameControlImageCannyReport(result.report), true)
assert.deepEqual([...source], [...sourceBefore])
assert.equal(result.outputRgbaBytes.length, width * height * 4)
assert.equal(result.report.outputRaster.alphaMode, 'opaque')
assert.equal(result.report.processingContract.gradientOperator, 'sobel_3x3')
assert.equal(result.report.processingContract.nonMaximumSuppression, true)
assert.equal(result.report.processingContract.hysteresisConnectivity, 8)
assert.ok(result.report.metrics.finalEdgePixelCount > 0)
assert.ok(result.report.metrics.finalEdgeCoverageRatio > 0)
assert.equal(
  result.report.metrics.transparentInputPixelCount,
  0,
)
assert.equal(
  result.report.outputRaster.measuredOutputRgbaDigestSha256,
  'c7235b77d0b31f792eac40ac6965d0726525f71a82a00a268284ec8d15a9e805',
)
for (let index = 0; index < width * height; index += 1) {
  const offset = index * 4
  assert.ok(
    result.outputRgbaBytes[offset] === 0
      || result.outputRgbaBytes[offset] === 255,
  )
  assert.equal(
    result.outputRgbaBytes[offset],
    result.outputRgbaBytes[offset + 1],
  )
  assert.equal(
    result.outputRgbaBytes[offset],
    result.outputRgbaBytes[offset + 2],
  )
  assert.equal(result.outputRgbaBytes[offset + 3], 255)
}
assertAllAuthorityClosed(result.report)

const replay = createLivingFrameControlImageCanny(input)
assert.deepEqual(replay, result)

const blank = new Uint8Array(width * height * 4)
for (let index = 0; index < width * height; index += 1) {
  blank[index * 4 + 3] = 255
}
const blankResult = createLivingFrameControlImageCanny({
  ...input,
  sourceArtifactId: 'artifact.blank',
  sourceArtifactDigestSha256: sha256AuthorityValue('blank'),
  sourceRgbaBytes: blank,
})
assert.equal(blankResult.report.metrics.finalEdgePixelCount, 0)
assert.ok(blankResult.outputRgbaBytes.every(
  (value, index) => index % 4 === 3 ? value === 255 : value === 0,
))

const hidden = squareFixture(width, height)
for (let index = 0; index < width * height; index += 1) {
  hidden[index * 4 + 3] = 0
}
const hiddenResult = createLivingFrameControlImageCanny({
  ...input,
  sourceArtifactId: 'artifact.transparent-hidden-rgb',
  sourceArtifactDigestSha256: sha256AuthorityValue('hidden'),
  sourceRgbaBytes: hidden,
})
assert.equal(hiddenResult.report.metrics.transparentInputPixelCount, width * height)
assert.equal(hiddenResult.report.metrics.finalEdgePixelCount, 0)

const semitransparent = squareFixture(width, height)
semitransparent[3] = 128
const semiResult = createLivingFrameControlImageCanny({
  ...input,
  sourceArtifactId: 'artifact.semitransparent',
  sourceArtifactDigestSha256: sha256AuthorityValue('semi'),
  sourceRgbaBytes: semitransparent,
})
assert.equal(semiResult.report.metrics.semitransparentInputPixelCount, 1)

const invalidInputs: unknown[] = [
  { ...input, lowThreshold: 80, highThreshold: 80 },
  { ...input, lowThreshold: 100, highThreshold: 80 },
  { ...input, lowThreshold: -1 },
  { ...input, highThreshold: 256 },
  { ...input, width: 2 },
  {
    ...input,
    sourceRgbaBytes: input.sourceRgbaBytes.subarray(0, 10),
  },
  { ...input, sourceArtifactDigestSha256: 'bad' },
  { ...input, prompt: 'forbidden' },
  { ...input, filePath: '/tmp/forbidden' },
  { ...input, providerId: 'forbidden' },
]
for (const value of invalidInputs) {
  assert.throws(
    () => createLivingFrameControlImageCanny(value as never),
    /Living Frame Canny control image rejected:/,
  )
}

const forgedReports: unknown[] = [
  {
    ...result.report,
    reportDigestSha256: sha256AuthorityValue('forged'),
  },
  sign({
    ...withoutDigest(result.report),
    thresholds: { low: 100, high: 80 },
  }),
  sign({
    ...withoutDigest(result.report),
    processingContract: {
      ...result.report.processingContract,
      borderPolicy: 'wrap',
    },
  }),
  sign({
    ...withoutDigest(result.report),
    metrics: {
      ...result.report.metrics,
      finalEdgePixelCount:
        result.report.metrics.finalEdgePixelCount + 1,
    },
  }),
  sign({
    ...withoutDigest(result.report),
    authorityBoundary: Object.fromEntries(
      Object.keys(result.report.authorityBoundary).map((key) => [key, true]),
    ),
    controlImageArtifactCreated: true,
    passesCanonicalQa: true,
    subjectSpecificRouting: true,
    productionReady: true,
  }),
  sign({
    ...withoutDigest(result.report),
    rawPixels: [...result.outputRgbaBytes],
  }),
]
for (const forged of forgedReports) {
  assert.equal(verifyLivingFrameControlImageCannyReport(forged), false)
}

function squareFixture(widthPixels: number, heightPixels: number): Uint8Array {
  const bytes = new Uint8Array(widthPixels * heightPixels * 4)
  for (let y = 0; y < heightPixels; y += 1) {
    for (let x = 0; x < widthPixels; x += 1) {
      const offset = (y * widthPixels + x) * 4
      const inside = x >= 8 && x < 24 && y >= 6 && y < 18
      const value = inside ? 245 : 20
      bytes[offset] = value
      bytes[offset + 1] = value
      bytes[offset + 2] = value
      bytes[offset + 3] = 255
    }
  }
  return bytes
}

function assertAllAuthorityClosed(
  report: LivingFrameControlImageCannyReport,
): void {
  assert.equal(
    report.authorityBoundary.deterministicReferencePixelProcessingOnly,
    true,
  )
  for (const [key, value] of Object.entries(report.authorityBoundary)) {
    if (key === 'deterministicReferencePixelProcessingOnly') continue
    assert.equal(value, false, `${key} must remain false.`)
  }
  assert.equal(report.outputPixelsReturnedOutOfBand, true)
  assert.equal(report.sourcePixelsUnmodified, true)
  assert.equal(report.reportContainsRawPixels, false)
  assert.equal(report.controlImageArtifactCreated, false)
  assert.equal(report.passesCanonicalQa, false)
  assert.equal(report.subjectSpecificRouting, false)
  assert.equal(report.productionReady, false)
}

function withoutDigest(
  report: LivingFrameControlImageCannyReport,
): LivingFrameControlImageCannyReportDraft {
  const { reportDigestSha256: _digest, ...draft } = report
  void _digest
  return draft
}

function sign(draft: Record<string, unknown>): unknown {
  return {
    ...draft,
    reportDigestSha256: sha256AuthorityValue(canonicalJson(draft)),
  }
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (
    typeof value !== 'object'
    || value === null
    || Array.isArray(value)
  ) return value
  return Object.fromEntries(
    Object.keys(value as Record<string, unknown>)
      .sort()
      .map((key) => [
        key,
        canonicalize((value as Record<string, unknown>)[key]),
      ]),
  )
}

console.log(
  'Living Frame Canny control-image smoke passed: '
    + 'deterministic RGBA-to-edge pixels, alpha safety, '
    + `${invalidInputs.length + forgedReports.length} adversarial cases.`,
)
