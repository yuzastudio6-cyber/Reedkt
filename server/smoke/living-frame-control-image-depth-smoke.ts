import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  LivingFrameControlImageDepthReport,
  LivingFrameControlImageDepthReportDraft,
} from '../../src/types/living-frame-control-image-depth'
import {
  createLivingFrameControlImageDepth,
  measureLivingFrameDepthSamplePacketDigest,
  verifyLivingFrameControlImageDepthReport,
} from '../living-frame/living-frame-control-image-depth'

const width = 64
const height = 32
const depthSamples = gradientDepth(width, height)
const input = withPacketDigest({
  sourceArtifactId: 'artifact.generic-depth-source',
  sourceArtifactDigestSha256: digest('generic-depth-source'),
  depthSamplePacketId: 'depth-packet.generic-frame',
  width,
  height,
  depthSamples,
})
const result = createLivingFrameControlImageDepth(input)

assert.equal(
  verifyLivingFrameControlImageDepthReport(
    result.report,
    input,
    result.outputRgbaBytes,
  ),
  true,
)
assert.equal(result.outputRgbaBytes.length, width * height * 4)
assert.equal(result.report.outputRaster.alphaMode, 'opaque')
assert.equal(result.report.metrics.pixelCount, width * height)
assert.equal(result.report.metrics.minimumDepthSample, 0)
assert.equal(result.report.metrics.maximumDepthSample, 65_535)
assert.equal(result.report.metrics.dynamicRange, 65_535)
assert.equal(result.report.metrics.nonZeroSampleCount > 0, true)
assert.equal(result.report.metrics.fullScaleSampleCount, height)
assert.equal(result.report.processingContract.channelMapping, 'equal_rgb')
assert.equal(
  result.report.depthSamplePacket.polarity,
  'larger_value_is_nearer',
)
assert.equal(
  result.report.outputRaster.measuredOutputRgbaDigestSha256,
  digest(result.outputRgbaBytes),
)
for (let index = 0; index < depthSamples.length; index += 1) {
  const offset = index * 4
  assert.equal(
    result.outputRgbaBytes[offset],
    result.outputRgbaBytes[offset + 1],
  )
  assert.equal(
    result.outputRgbaBytes[offset + 1],
    result.outputRgbaBytes[offset + 2],
  )
  assert.equal(result.outputRgbaBytes[offset + 3], 255)
}
assert.equal(result.outputRgbaBytes[0], 0)
assert.equal(
  result.outputRgbaBytes[(width - 1) * 4],
  255,
)
const serializedReport = JSON.stringify(result.report)
assert.equal(serializedReport.includes('depthSamples'), false)
assert.equal(result.report.inputDepthSamplesRetained, false)
assert.equal(result.report.reportContainsRawDepthOrPixels, false)
assertAllAuthorityClosed(result.report)

const replay = createLivingFrameControlImageDepth(input)
assert.deepEqual(replay, result)

const reverseInput = withPacketDigest({
  ...input,
  depthSamples: new Uint16Array([...depthSamples].reverse()),
})
const reverse = createLivingFrameControlImageDepth(reverseInput)
assert.notEqual(
  reverse.report.outputRaster.measuredOutputRgbaDigestSha256,
  result.report.outputRaster.measuredOutputRgbaDigestSha256,
)

const invalidInputs: unknown[] = [
  { ...input, depthSamplePacketDigestSha256: digest('stale') },
  { ...input, width: 8 },
  { ...input, depthSamples: new Uint16Array(4) },
  { ...input, depthSamples: new Uint8Array(width * height) },
  withPacketDigest({
    ...input,
    depthSamples: new Uint16Array(width * height).fill(10),
  }),
  { ...input, prompt: 'forbidden' },
  { ...input, filePath: '/tmp/forbidden' },
  { ...input, providerId: 'forbidden' },
]
for (const value of invalidInputs) {
  assert.throws(
    () => createLivingFrameControlImageDepth(value as never),
    /Living Frame depth control image rejected:/,
  )
}

const tamperedPixels = new Uint8Array(result.outputRgbaBytes)
tamperedPixels[0] = 255
assert.equal(
  verifyLivingFrameControlImageDepthReport(
    result.report,
    input,
    tamperedPixels,
  ),
  false,
)

const forgedReports: unknown[] = [
  {
    ...result.report,
    reportDigestSha256: digest('forged'),
  },
  sign({
    ...withoutDigest(result.report),
    rawDepthSamples: [0, 65_535],
  }),
  sign({
    ...withoutDigest(result.report),
    depthSamplePacket: {
      ...result.report.depthSamplePacket,
      polarity: 'smaller_value_is_nearer',
    },
  }),
  sign({
    ...withoutDigest(result.report),
    outputRaster: {
      ...result.report.outputRaster,
      measuredOutputRgbaDigestSha256: digest('wrong-output'),
    },
  }),
  sign({
    ...withoutDigest(result.report),
    metrics: {
      ...result.report.metrics,
      dynamicRange: result.report.metrics.dynamicRange - 1,
    },
  }),
  sign({
    ...withoutDigest(result.report),
    inputDepthSamplesRetained: true as never,
    reportContainsRawDepthOrPixels: true as never,
  }),
  sign({
    ...withoutDigest(result.report),
    authorityBoundary: Object.fromEntries(
      Object.keys(result.report.authorityBoundary)
        .map((key) => [key, true]),
    ),
    depthControlImageArtifactCreated: true,
    passesCanonicalQa: true,
    subjectSpecificRouting: true,
    productionReady: true,
  }),
]
for (const forged of forgedReports) {
  assert.equal(
    verifyLivingFrameControlImageDepthReport(
      forged,
      input,
      result.outputRgbaBytes,
    ),
    false,
  )
}

console.log(JSON.stringify({
  suite: 'living-frame-control-image-depth',
  deterministicUint16DepthRasterCreated: true,
  pixelCount: result.report.metrics.pixelCount,
  dynamicRange: result.report.metrics.dynamicRange,
  meanNormalizedDepth: result.report.metrics.meanNormalizedDepth,
  depthSamplesRetained: result.report.inputDepthSamplesRetained,
  modelOrAuxBundleExecuted: false,
  adversarialAssertions:
    invalidInputs.length + forgedReports.length + 1,
  subjectSpecificRouting: result.report.subjectSpecificRouting,
  depthEstimationAuthorityGranted:
    result.report.authorityBoundary.depthEstimationAuthority,
  toolRouteAuthorityGranted:
    result.report.authorityBoundary.toolRouteAuthority,
  productionAuthorityGranted:
    result.report.authorityBoundary.productionAuthority,
}))

function gradientDepth(
  rasterWidth: number,
  rasterHeight: number,
): Uint16Array {
  const samples = new Uint16Array(rasterWidth * rasterHeight)
  for (let y = 0; y < rasterHeight; y += 1) {
    for (let x = 0; x < rasterWidth; x += 1) {
      samples[y * rasterWidth + x] =
        Math.round((x / (rasterWidth - 1)) * 65_535)
    }
  }
  return samples
}

function withPacketDigest<T extends {
  readonly width: number
  readonly height: number
  readonly depthSamples: Uint16Array
}>(
  value: T,
): T & { readonly depthSamplePacketDigestSha256: string } {
  return {
    ...value,
    depthSamplePacketDigestSha256:
      measureLivingFrameDepthSamplePacketDigest(value),
  }
}

function assertAllAuthorityClosed(
  report: LivingFrameControlImageDepthReport,
): void {
  assert.equal(
    report.authorityBoundary.deterministicReferencePixelProcessingOnly,
    true,
  )
  for (const [key, value] of Object.entries(report.authorityBoundary)) {
    if (key === 'deterministicReferencePixelProcessingOnly') continue
    assert.equal(value, false, `${key} must remain false.`)
  }
  assert.equal(report.depthControlImageArtifactCreated, false)
  assert.equal(report.passesCanonicalQa, false)
  assert.equal(report.subjectSpecificRouting, false)
  assert.equal(report.productionReady, false)
}

function withoutDigest(
  report: LivingFrameControlImageDepthReport,
): LivingFrameControlImageDepthReportDraft {
  const { reportDigestSha256: _digest, ...draft } = report
  void _digest
  return draft
}

function sign(
  draft: Record<string, unknown>,
): unknown {
  return {
    ...draft,
    reportDigestSha256: digest(canonicalJson(draft)),
  }
}

function digest(value: Uint8Array | string): string {
  return createHash('sha256').update(value).digest('hex')
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
