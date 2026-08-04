import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  decontaminateLivingFrameAlphaEdges,
  verifyLivingFrameAlphaEdgeDecontaminationReportDigest,
} from '../living-frame/living-frame-alpha-edge-decontamination'

const whiteMatte = [255, 255, 255] as const
const intendedForeground = [180, 48, 24] as const
const contaminated = rgba([
  composite(intendedForeground, whiteMatte, 128),
  composite(intendedForeground, whiteMatte, 64),
  [32, 64, 96, 255],
  [255, 255, 255, 0],
])
const recovered = decontaminateLivingFrameAlphaEdges(input({
  artifactId: 'living-frame.alpha.musashi-edge',
  width: 4,
  height: 1,
  rgbaBytes: contaminated,
  knownSourceMatteRgb: whiteMatte,
}))

assert.equal(
  verifyLivingFrameAlphaEdgeDecontaminationReportDigest(recovered.report),
  true,
)
assertRgbNear(recovered.outputRgbaBytes, 0, intendedForeground, 2)
assertRgbNear(recovered.outputRgbaBytes, 1, intendedForeground, 3)
assert.deepEqual([...recovered.outputRgbaBytes.slice(8, 12)], [32, 64, 96, 255])
assert.deepEqual([...recovered.outputRgbaBytes.slice(12, 16)], [0, 0, 0, 0])
assert.equal(recovered.report.metrics.semitransparentPixelCount, 2)
assert.equal(recovered.report.metrics.transparentRgbCleanupPixelCount, 1)
assert.ok(
  recovered.report.findingCodes.includes(
    'transparent_rgb_cleanup_applied',
  ),
)
assert.equal(recovered.report.reportContainsRawPixels, false)
assert.equal(recovered.report.authorityBoundary.artifactQaAuthority, false)
assert.equal(recovered.report.authorityBoundary.approvalAuthority, false)
assert.equal(recovered.report.authorityBoundary.snapshotAuthority, false)
assert.equal(recovered.report.authorityBoundary.toolRouteAuthority, false)
assert.equal(recovered.report.authorityBoundary.workGraphAuthority, false)
assert.equal(recovered.report.authorityBoundary.renderAuthority, false)
assert.equal(recovered.report.authorityBoundary.productionAuthority, false)
assert.equal(JSON.stringify(recovered.report).includes('rgbaBytes'), false)

const blackMatte = [0, 0, 0] as const
const blackContaminated = rgba([
  composite([220, 120, 40], blackMatte, 96),
  [10, 20, 30, 255],
])
const blackRecovered = decontaminateLivingFrameAlphaEdges(input({
  artifactId: 'living-frame.alpha.black-matte',
  width: 2,
  height: 1,
  rgbaBytes: blackContaminated,
  knownSourceMatteRgb: blackMatte,
}))
assertRgbNear(blackRecovered.outputRgbaBytes, 0, [220, 120, 40], 2)
assert.deepEqual(
  [...blackRecovered.outputRgbaBytes.slice(4, 8)],
  [10, 20, 30, 255],
)

const opaque = decontaminateLivingFrameAlphaEdges(input({
  artifactId: 'living-frame.alpha.opaque',
  width: 1,
  height: 1,
  rgbaBytes: rgba([[12, 34, 56, 255]]),
  knownSourceMatteRgb: whiteMatte,
}))
assert.deepEqual([...opaque.outputRgbaBytes], [12, 34, 56, 255])
assert.deepEqual(
  opaque.report.findingCodes,
  ['no_semitransparent_edge_pixels'],
)

const lowAlpha = decontaminateLivingFrameAlphaEdges(input({
  artifactId: 'living-frame.alpha.low-alpha',
  width: 1,
  height: 1,
  rgbaBytes: rgba([[200, 200, 200, 16]]),
  knownSourceMatteRgb: whiteMatte,
}))
assert.ok(lowAlpha.report.findingCodes.includes('low_alpha_recovery_present'))
assert.ok(lowAlpha.report.findingCodes.includes('channel_clamping_observed'))
assert.ok(
  lowAlpha.report.findingCodes.includes(
    'excessive_channel_clamping_observed',
  ),
)

const replay = decontaminateLivingFrameAlphaEdges(input({
  artifactId: 'living-frame.alpha.musashi-edge',
  width: 4,
  height: 1,
  rgbaBytes: contaminated,
  knownSourceMatteRgb: whiteMatte,
}))
assert.equal(
  replay.report.reportDigestSha256,
  recovered.report.reportDigestSha256,
)
assert.deepEqual([...replay.outputRgbaBytes], [...recovered.outputRgbaBytes])

assert.equal(
  verifyLivingFrameAlphaEdgeDecontaminationReportDigest({
    ...recovered.report,
    outputArtifact: {
      ...recovered.report.outputArtifact,
      measuredOutputRgbaDigestSha256: '0'.repeat(64),
    },
  }),
  false,
)
assert.equal(
  verifyLivingFrameAlphaEdgeDecontaminationReportDigest({
    ...recovered.report,
    metrics: {
      ...recovered.report.metrics,
      semitransparentPixelCount: 0,
    },
  }),
  false,
)
assert.equal(
  verifyLivingFrameAlphaEdgeDecontaminationReportDigest({
    ...recovered.report,
    authorityBoundary: {
      ...recovered.report.authorityBoundary,
      artifactQaAuthority: true,
    },
  }),
  false,
)
assert.equal(
  verifyLivingFrameAlphaEdgeDecontaminationReportDigest({
    ...recovered.report,
    providerId: 'forged-provider',
  }),
  false,
)

assert.throws(
  () => decontaminateLivingFrameAlphaEdges(({
      ...input({
        artifactId: 'living-frame.alpha.unknown-field',
        width: 1,
        height: 1,
        rgbaBytes: rgba([[1, 2, 3, 128]]),
        knownSourceMatteRgb: whiteMatte,
      }),
      approvalAuthority: true,
    }) as unknown as Parameters<
      typeof decontaminateLivingFrameAlphaEdges
    >[0]),
  /input shape is invalid/,
)
assert.throws(
  () => decontaminateLivingFrameAlphaEdges(input({
    artifactId: 'https://unsafe.example/asset',
    width: 1,
    height: 1,
    rgbaBytes: rgba([[1, 2, 3, 128]]),
    knownSourceMatteRgb: whiteMatte,
  })),
  /artifact identity is invalid/,
)
assert.throws(
  () => decontaminateLivingFrameAlphaEdges({
    ...input({
      artifactId: 'living-frame.alpha.bad-digest',
      width: 1,
      height: 1,
      rgbaBytes: rgba([[1, 2, 3, 128]]),
      knownSourceMatteRgb: whiteMatte,
    }),
    artifactDigestSha256: 'bad',
  }),
  /artifact identity is invalid/,
)
assert.throws(
  () => decontaminateLivingFrameAlphaEdges(input({
    artifactId: 'living-frame.alpha.wrong-length',
    width: 2,
    height: 1,
    rgbaBytes: rgba([[1, 2, 3, 128]]),
    knownSourceMatteRgb: whiteMatte,
  })),
  /RGBA bytes are invalid/,
)
assert.throws(
  () => decontaminateLivingFrameAlphaEdges(input({
    artifactId: 'living-frame.alpha.bad-matte',
    width: 1,
    height: 1,
    rgbaBytes: rgba([[1, 2, 3, 128]]),
    knownSourceMatteRgb: [256, 0, 0] as unknown as readonly [
      number,
      number,
      number,
    ],
  })),
  /source matte is invalid/,
)

console.log(JSON.stringify({
  suite: 'living-frame-alpha-edge-decontamination',
  controlledArtifacts: 5,
  adversarialAssertions: 16,
  deterministicReplay: true,
  reportContainsRawPixels: false,
  artifactQaAuthorityGranted: false,
  approvalAuthorityGranted: false,
  toolOrWorkAuthorityGranted: false,
  renderOrProductionAuthorityGranted: false,
}))

function input(overrides: {
  readonly artifactId: string
  readonly width: number
  readonly height: number
  readonly rgbaBytes: Uint8Array
  readonly knownSourceMatteRgb: readonly [number, number, number]
}) {
  return {
    ...overrides,
    artifactDigestSha256: digest(overrides.artifactId),
    inputAlphaMode: 'straight_alpha_with_known_matte_contamination' as const,
  }
}

function rgba(
  pixels: readonly (readonly [number, number, number, number])[],
): Uint8Array {
  return Uint8Array.from(pixels.flatMap((pixel) => [...pixel]))
}

function composite(
  foreground: readonly [number, number, number],
  matte: readonly [number, number, number],
  alphaByte: number,
): readonly [number, number, number, number] {
  const alpha = alphaByte / 255
  return [
    Math.round(foreground[0] * alpha + matte[0] * (1 - alpha)),
    Math.round(foreground[1] * alpha + matte[1] * (1 - alpha)),
    Math.round(foreground[2] * alpha + matte[2] * (1 - alpha)),
    alphaByte,
  ]
}

function assertRgbNear(
  bytes: Uint8Array,
  pixelIndex: number,
  expected: readonly [number, number, number],
  tolerance: number,
): void {
  const byteIndex = pixelIndex * 4
  for (let channelIndex = 0; channelIndex < 3; channelIndex += 1) {
    assert.ok(
      Math.abs(bytes[byteIndex + channelIndex]! - expected[channelIndex])
        <= tolerance,
    )
  }
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
