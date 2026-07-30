import assert from 'node:assert/strict'

import {
  executeLivingFrameAnimationAwareIllustrationPrivateCompositeInternalTest,
} from '../living-frame/living-frame-animation-aware-illustration-private-composite-internal-test'

const receipt =
  await executeLivingFrameAnimationAwareIllustrationPrivateCompositeInternalTest()

assert.equal(
  receipt.source.illustrativeNotArchivalEvidence,
  true,
)
assert.deepEqual(receipt.alphaQa.blockingFindingCodes, [])
assert.equal(receipt.alphaQa.destinationRasterMeasured, true)
assert.equal(receipt.scene.mode, 'living_still')
assert.equal(receipt.scene.depthStyle, 'deep_multiplane_2_5d')
assert.equal(
  receipt.decomposition.profile,
  'fixture_specific_appendage_cutout_rig_v1',
)
assert.equal(
  receipt.decomposition.hairSelectedPixelCount > 350,
  true,
)
assert.equal(
  receipt.decomposition.robeSelectedPixelCount > 350,
  true,
)
assert.equal(
  receipt.decomposition.articulatedComponentMotionRendered,
  true,
)
assert.equal(
  receipt.decomposition.fixtureSpecificInternalMasking,
  true,
)
assert.deepEqual(receipt.scene.layerOrder, [
  'ink_background',
  'character_base',
  'hair',
  'robe',
  'slash_foreground',
])
assert.deepEqual(receipt.scene.selectiveMotion, [
  'background_parallax',
  'character_anchor_drift',
  'hair_pivot_motion',
  'robe_pivot_motion',
  'slash_reveal_and_settle',
])
assert.equal(receipt.scene.focusHandoffRendered, true)
assert.equal(receipt.scene.captionPlaneAboveLivingFrame, true)
assert.equal(receipt.scene.remotionFinalCanvasOwner, true)
assert.equal(receipt.runtime.actualRemotionEntrypointExecuted, true)
assert.equal(receipt.runtime.actualFfmpegEntrypointExecuted, true)
assert.equal(receipt.runtime.actualFfprobeEntrypointExecuted, true)
assert.equal(receipt.runtime.outputFrameCount, 120)
assert.equal(receipt.runtime.persistedCreateOnly, true)
assert.equal(receipt.runtime.persistedArtifactReopened, true)
assert.equal(
  receipt.renderedQa.distinctSampleFrameDigestCount >= 5,
  true,
)
assert.equal(
  receipt.renderedQa.characterMotionPixelDelta > 8_000,
  true,
)
assert.equal(
  receipt.renderedQa.hairRegionPixelDelta > 400,
  true,
)
assert.equal(
  receipt.renderedQa.robeRegionPixelDelta > 400,
  true,
)
assert.equal(
  receipt.renderedQa.slashCuePixelDelta > 2_500,
  true,
)
assert.equal(
  receipt.renderedQa.captionProtectedPixelCount > 800,
  true,
)
assert.equal(
  receipt.renderedQa.narrationProtectedMixMeasured,
  true,
)
assert.deepEqual(
  receipt.renderedQa.reviewFrameIndexes,
  [20, 35, 82],
)
assert.equal(
  receipt.authorityBoundary.privateInternalExecutionAuthority,
  true,
)
assert.equal(
  receipt.authorityBoundary.canonicalDispatchAuthority,
  false,
)
assert.equal(
  receipt.authorityBoundary.customerBillingAuthority,
  false,
)
assert.equal(
  receipt.authorityBoundary.publicDeliveryAuthority,
  false,
)
assert.equal(
  receipt.authorityBoundary.productionAuthority,
  false,
)

const serialized = JSON.stringify(receipt)
for (const forbidden of [
  'bytesBase64',
  'decodedRgba',
  'https://',
  'file://',
  '/Users/',
  '/Volumes/',
  'customerCredits',
  'serviceFee',
]) {
  assert.equal(serialized.includes(forbidden), false)
}

console.log(JSON.stringify({
  smoke:
    'living_frame_animation_aware_illustration_private_composite_internal_test',
  status: 'passed',
  mode: receipt.scene.mode,
  depthStyle: receipt.scene.depthStyle,
  preparedOverlaySha256:
    receipt.source.preparedOverlaySha256,
  alphaFindingCodes: receipt.alphaQa.findingCodes,
  destinationCompositeMeanEdgeContrast:
    receipt.alphaQa.destinationCompositeMeanEdgeContrast,
  destinationCompositeLowContrastEdgeRatio:
    receipt.alphaQa.destinationCompositeLowContrastEdgeRatio,
  outputSha256: receipt.runtime.outputSha256,
  outputByteLength: receipt.runtime.outputByteLength,
  outputFrameCount: receipt.runtime.outputFrameCount,
  distinctSampleFrameDigestCount:
    receipt.renderedQa.distinctSampleFrameDigestCount,
  characterMotionPixelDelta:
    receipt.renderedQa.characterMotionPixelDelta,
  hairSelectedPixelCount:
    receipt.decomposition.hairSelectedPixelCount,
  robeSelectedPixelCount:
    receipt.decomposition.robeSelectedPixelCount,
  hairRegionPixelDelta:
    receipt.renderedQa.hairRegionPixelDelta,
  robeRegionPixelDelta:
    receipt.renderedQa.robeRegionPixelDelta,
  slashCuePixelDelta:
    receipt.renderedQa.slashCuePixelDelta,
  captionProtectedPixelCount:
    receipt.renderedQa.captionProtectedPixelCount,
  reviewFrameIndexes:
    receipt.renderedQa.reviewFrameIndexes,
  reviewFrameSha256:
    receipt.renderedQa.reviewFrameSha256,
  privateInternalOnly: true,
  customerBillingAuthority: false,
  publicDeliveryAuthority: false,
  productionAuthority: false,
}))
