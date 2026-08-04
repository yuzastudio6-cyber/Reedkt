import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  measureLivingFrameVisualContinuity,
  verifyLivingFrameVisualContinuityMeasurementReportDigest,
} from '../living-frame/living-frame-visual-continuity-measurement'

const reference = component(32, 32, {
  left: 8,
  top: 6,
  right: 23,
  bottom: 25,
  rgba: [176, 36, 24, 255],
})
const identical = measure(reference, reference.slice(), 'identical')
assert.equal(
  verifyLivingFrameVisualContinuityMeasurementReportDigest(identical),
  true,
)
assert.equal(identical.metrics.exactRgbaMatch, true)
assert.equal(identical.metrics.binarySilhouetteIntersectionOverUnion, 1)
assert.equal(identical.metrics.normalizedRgbHistogramDistance, 0)
assert.deepEqual(identical.findingCodes, [])
assert.equal(identical.containsRawPixels, false)
assert.equal(identical.authorityBoundary.identityVerificationAuthority, false)
assert.equal(identical.authorityBoundary.likenessSafetyAuthority, false)
assert.equal(identical.authorityBoundary.documentaryFactAuthority, false)
assert.equal(identical.authorityBoundary.continuityQaAuthority, false)
assert.equal(identical.authorityBoundary.approvalAuthority, false)
assert.equal(identical.authorityBoundary.renderAuthority, false)
assert.equal(identical.authorityBoundary.productionAuthority, false)
assert.equal(JSON.stringify(identical).includes('rgbaBytes'), false)

const shifted = measure(reference, component(32, 32, {
  left: 16,
  top: 6,
  right: 31,
  bottom: 25,
  rgba: [176, 36, 24, 255],
}), 'shifted')
assert.ok(shifted.findingCodes.includes('silhouette_overlap_low'))
assert.ok(shifted.findingCodes.includes('silhouette_centroid_shift_high'))
assert.ok(shifted.findingCodes.includes('alpha_boundary_drift_high'))

const paletteDrift = measure(reference, component(32, 32, {
  left: 8,
  top: 6,
  right: 23,
  bottom: 25,
  rgba: [12, 12, 80, 255],
}), 'palette-drift')
assert.equal(paletteDrift.metrics.binarySilhouetteIntersectionOverUnion, 1)
assert.ok(paletteDrift.findingCodes.includes('palette_drift_high'))
assert.ok(paletteDrift.findingCodes.includes('luminance_drift_high'))
assert.ok(paletteDrift.findingCodes.includes('overlap_color_drift_high'))

const alphaDrift = measure(reference, component(32, 32, {
  left: 8,
  top: 6,
  right: 23,
  bottom: 25,
  rgba: [176, 36, 24, 128],
}), 'alpha-drift')
assert.ok(alphaDrift.findingCodes.includes('alpha_distribution_drift_high'))
assert.ok(alphaDrift.findingCodes.includes('silhouette_coverage_drift_high'))

const empty = measure(reference, new Uint8Array(32 * 32 * 4), 'empty')
assert.ok(empty.findingCodes.includes('empty_reference_or_candidate'))
assert.ok(empty.findingCodes.includes('silhouette_coverage_drift_high'))

const replay = measure(reference, reference.slice(), 'identical')
assert.equal(replay.reportDigestSha256, identical.reportDigestSha256)

assert.equal(
  verifyLivingFrameVisualContinuityMeasurementReportDigest({
    ...identical,
    metrics: {
      ...identical.metrics,
      exactRgbaMatch: false,
    },
  }),
  false,
)
assert.equal(
  verifyLivingFrameVisualContinuityMeasurementReportDigest({
    ...identical,
    authorityBoundary: {
      ...identical.authorityBoundary,
      identityVerificationAuthority: true,
    },
  }),
  false,
)
assert.equal(
  verifyLivingFrameVisualContinuityMeasurementReportDigest({
    ...identical,
    providerId: 'forged-provider',
  }),
  false,
)
assert.equal(
  verifyLivingFrameVisualContinuityMeasurementReportDigest({
    ...identical,
    findingCodes: ['palette_drift_high'],
  }),
  false,
)

assert.throws(
  () => measureLivingFrameVisualContinuity(({
      ...input(reference, reference.slice(), 'unknown-field'),
      approvalAuthority: true,
    }) as unknown as Parameters<typeof measureLivingFrameVisualContinuity>[0]),
  /input shape is invalid/,
)
assert.throws(
  () => measureLivingFrameVisualContinuity(input(
    reference,
    reference.slice(),
    'same-id',
    'living-frame.continuity.reference',
  )),
  /unique identities/,
)
assert.throws(
  () => measureLivingFrameVisualContinuity({
    ...input(reference, reference.slice(), 'wrong-length'),
    candidate: {
      ...input(reference, reference.slice(), 'wrong-length').candidate,
      rgbaBytes: new Uint8Array(7),
    },
  }),
  /candidate RGBA bytes are invalid/,
)
assert.throws(
  () => measureLivingFrameVisualContinuity({
    ...input(reference, reference.slice(), 'unsafe-id'),
    candidate: {
      ...input(reference, reference.slice(), 'unsafe-id').candidate,
      artifactId: 'https://unsafe.example/candidate',
    },
  }),
  /candidate identity is invalid/,
)
assert.throws(
  () => measureLivingFrameVisualContinuity({
    ...input(reference, reference.slice(), 'bad-mode'),
    comparisonMode: 'different_camera_view',
  } as unknown as Parameters<typeof measureLivingFrameVisualContinuity>[0]),
  /comparison mode is invalid/,
)

console.log(JSON.stringify({
  suite: 'living-frame-visual-continuity-measurement',
  controlledComparisons: 6,
  adversarialAssertions: 19,
  deterministicReplay: true,
  identityVerificationAuthorityGranted: false,
  continuityQaAuthorityGranted: false,
  approvalOrRuntimeAuthorityGranted: false,
  rawPixelsReturned: false,
}))

function measure(
  referenceBytes: Uint8Array,
  candidateBytes: Uint8Array,
  suffix: string,
) {
  return measureLivingFrameVisualContinuity(
    input(referenceBytes, candidateBytes, suffix),
  )
}

function input(
  referenceBytes: Uint8Array,
  candidateBytes: Uint8Array,
  suffix: string,
  candidateId = `living-frame.continuity.candidate.${suffix}`,
) {
  return {
    comparisonMode: 'aligned_same_view_component' as const,
    width: 32,
    height: 32,
    reference: {
      artifactId: 'living-frame.continuity.reference',
      artifactDigestSha256: digest('reference'),
      rgbaBytes: referenceBytes,
    },
    candidate: {
      artifactId: candidateId,
      artifactDigestSha256: digest(`candidate-${suffix}`),
      rgbaBytes: candidateBytes,
    },
  }
}

function component(
  width: number,
  height: number,
  bounds: {
    readonly left: number
    readonly top: number
    readonly right: number
    readonly bottom: number
    readonly rgba: readonly [number, number, number, number]
  },
): Uint8Array {
  const bytes = new Uint8Array(width * height * 4)
  for (let y = bounds.top; y <= bounds.bottom; y += 1) {
    for (let x = bounds.left; x <= bounds.right; x += 1) {
      const index = (y * width + x) * 4
      bytes[index] = bounds.rgba[0]
      bytes[index + 1] = bounds.rgba[1]
      bytes[index + 2] = bounds.rgba[2]
      bytes[index + 3] = bounds.rgba[3]
    }
  }
  return bytes
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
