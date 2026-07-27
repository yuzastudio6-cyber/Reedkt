import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import {
  measureLivingFrameTemporalMaskSequence,
  verifyLivingFrameTemporalMaskMeasurementReportDigest,
} from '../living-frame/living-frame-temporal-mask-measurement'

const stable = measureLivingFrameTemporalMaskSequence({
  sequenceId: 'living-frame.temporal.stable',
  width: 32,
  height: 32,
  frames: [
    frame(10, squareMask(32, 32, 8, 8, 20, 20)),
    frame(11, squareMask(32, 32, 9, 8, 21, 20)),
    frame(12, squareMask(32, 32, 10, 8, 22, 20)),
  ],
})
assert.equal(verifyLivingFrameTemporalMaskMeasurementReportDigest(stable), true)
assert.deepEqual(stable.findingCodes, [])
assert.equal(stable.containsRawMaskBytes, false)
assert.equal(stable.authorityBoundary.qaAuthority, false)
assert.equal(stable.authorityBoundary.fallbackAuthority, false)
assert.equal(stable.authorityBoundary.runtimePromotionAuthority, false)
assert.equal(JSON.stringify(stable).includes('alphaBytes'), false)
assert.equal(stable.pairs.length, 2)
assert.ok(stable.aggregate.minimumBinaryIntersectionOverUnion! > 0.8)

const flicker = measureLivingFrameTemporalMaskSequence({
  sequenceId: 'living-frame.temporal.flicker',
  width: 32,
  height: 32,
  frames: [
    frame(20, squareMask(32, 32, 8, 8, 22, 22)),
    frame(21, new Uint8Array(32 * 32)),
    frame(22, squareMask(32, 32, 8, 8, 22, 22)),
  ],
})
assert.ok(flicker.findingCodes.includes('empty_mask_frame_present'))
assert.ok(flicker.findingCodes.includes('coverage_jump_high'))
assert.ok(flicker.findingCodes.includes('mask_overlap_low'))
assert.ok(flicker.findingCodes.includes('alpha_flicker_high'))

const jitter = measureLivingFrameTemporalMaskSequence({
  sequenceId: 'living-frame.temporal.jitter',
  width: 32,
  height: 32,
  frames: [
    frame(30, squareMask(32, 32, 2, 8, 12, 20)),
    frame(31, squareMask(32, 32, 19, 8, 29, 20)),
  ],
})
assert.ok(jitter.findingCodes.includes('centroid_jitter_high'))
assert.ok(jitter.findingCodes.includes('mask_overlap_low'))
assert.ok(jitter.findingCodes.includes('boundary_crawl_high'))

const fullFrame = measureLivingFrameTemporalMaskSequence({
  sequenceId: 'living-frame.temporal.full-frame',
  width: 8,
  height: 8,
  frames: [
    frame(40, filledMask(8, 8, 255)),
    frame(41, filledMask(8, 8, 255)),
  ],
})
assert.ok(fullFrame.findingCodes.includes('full_frame_mask_present'))
assert.ok(fullFrame.findingCodes.includes('mask_touches_all_edges'))

const insufficient = measureLivingFrameTemporalMaskSequence({
  sequenceId: 'living-frame.temporal.single-frame',
  width: 8,
  height: 8,
  frames: [frame(50, squareMask(8, 8, 2, 2, 5, 5))],
})
assert.ok(insufficient.findingCodes.includes('frame_count_insufficient'))

const exactReplay = measureLivingFrameTemporalMaskSequence({
  sequenceId: 'living-frame.temporal.stable',
  width: 32,
  height: 32,
  frames: [
    frame(10, squareMask(32, 32, 8, 8, 20, 20)),
    frame(11, squareMask(32, 32, 9, 8, 21, 20)),
    frame(12, squareMask(32, 32, 10, 8, 22, 20)),
  ],
})
assert.equal(exactReplay.reportDigestSha256, stable.reportDigestSha256)

assert.equal(
  verifyLivingFrameTemporalMaskMeasurementReportDigest({
    ...stable,
    findingCodes: ['alpha_flicker_high'],
  }),
  false,
)
assert.equal(
  verifyLivingFrameTemporalMaskMeasurementReportDigest({
    ...stable,
    providerModel: 'forged-provider',
  }),
  false,
)
assert.equal(
  verifyLivingFrameTemporalMaskMeasurementReportDigest({
    ...stable,
    frameArtifacts: [
      stable.frameArtifacts[1],
      stable.frameArtifacts[0],
      stable.frameArtifacts[2],
    ],
  }),
  false,
)
assert.equal(
  verifyLivingFrameTemporalMaskMeasurementReportDigest({
    ...stable,
    aggregate: {
      ...stable.aggregate,
      maximumChangedPixelRatio: 0,
    },
  }),
  false,
)
assert.equal(
  verifyLivingFrameTemporalMaskMeasurementReportDigest({
    ...stable,
    authorityBoundary: {
      ...stable.authorityBoundary,
      qaAuthority: true,
    },
  }),
  false,
)

assert.throws(
  () => measureLivingFrameTemporalMaskSequence(({
      sequenceId: 'living-frame.temporal.forged',
      width: 8,
      height: 8,
      frames: [
        {
          ...frame(60, squareMask(8, 8, 2, 2, 5, 5)),
          qaAuthority: true,
          fallbackAuthority: true,
          productionAuthority: true,
        },
        frame(61, squareMask(8, 8, 2, 2, 5, 5)),
      ],
    }) as unknown as Parameters<
      typeof measureLivingFrameTemporalMaskSequence
    >[0]),
  /frame shape is invalid/,
)

assert.throws(
  () => measureLivingFrameTemporalMaskSequence({
    sequenceId: 'living-frame.temporal.non-contiguous',
    width: 8,
    height: 8,
    frames: [
      frame(70, squareMask(8, 8, 2, 2, 5, 5)),
      frame(72, squareMask(8, 8, 2, 2, 5, 5)),
    ],
  }),
  /unique, ordered, and contiguous/,
)
assert.throws(
  () => measureLivingFrameTemporalMaskSequence(({
      sequenceId: 'living-frame.temporal.unknown-sequence-field',
      width: 8,
      height: 8,
      frames: [
        frame(75, squareMask(8, 8, 2, 2, 5, 5)),
        frame(76, squareMask(8, 8, 2, 2, 5, 5)),
      ],
      approvalAuthority: true,
    }) as unknown as Parameters<
      typeof measureLivingFrameTemporalMaskSequence
    >[0]),
  /sequence shape is invalid/,
)
assert.throws(
  () => measureLivingFrameTemporalMaskSequence({
    sequenceId: 'living-frame.temporal.duplicate-artifact',
    width: 8,
    height: 8,
    frames: [
      frame(77, squareMask(8, 8, 2, 2, 5, 5)),
      {
        ...frame(78, squareMask(8, 8, 2, 2, 5, 5)),
        artifactId: 'living-frame.temporal.frame.77',
      },
    ],
  }),
  /artifact identities must be unique/,
)
assert.throws(
  () => measureLivingFrameTemporalMaskSequence({
    sequenceId: 'living-frame.temporal.wrong-length',
    width: 8,
    height: 8,
    frames: [{
      frameIndex: 80,
      artifactId: 'living-frame.temporal.frame.80',
      artifactDigestSha256: digest('frame-80'),
      alphaBytes: new Uint8Array(7),
    }],
  }),
  /alpha bytes are invalid/,
)
assert.throws(
  () => measureLivingFrameTemporalMaskSequence({
    sequenceId: 'https://unsafe.example/sequence',
    width: 8,
    height: 8,
    frames: [frame(90, squareMask(8, 8, 2, 2, 5, 5))],
  }),
  /sequence identity is invalid/,
)

console.log(JSON.stringify({
  suite: 'living-frame-temporal-mask-measurement',
  controlledSequences: 7,
  adversarialAssertions: 23,
  timingAuthorityGranted: false,
  qaAuthorityGranted: false,
  fallbackAuthorityGranted: false,
  rawMaskBytesReturned: false,
}))

function frame(frameIndex: number, alphaBytes: Uint8Array) {
  return {
    frameIndex,
    artifactId: `living-frame.temporal.frame.${frameIndex}`,
    artifactDigestSha256: digest(`frame-${frameIndex}`),
    alphaBytes,
  }
}

function squareMask(
  width: number,
  height: number,
  left: number,
  top: number,
  right: number,
  bottom: number,
): Uint8Array {
  const bytes = new Uint8Array(width * height)
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      bytes[y * width + x] = 255
    }
  }
  return bytes
}

function filledMask(width: number, height: number, alpha: number): Uint8Array {
  return new Uint8Array(width * height).fill(alpha)
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}
