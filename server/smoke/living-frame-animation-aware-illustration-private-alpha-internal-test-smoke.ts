import assert from 'node:assert/strict'

import {
  executeLivingFrameAnimationAwareIllustrationPrivateAlphaInternalTest,
} from '../living-frame/living-frame-animation-aware-illustration-private-alpha-internal-test'

const receipt =
  await executeLivingFrameAnimationAwareIllustrationPrivateAlphaInternalTest()

assert.equal(
  receipt.source.generationRole,
  'modern_illustrative_depiction_not_archival_evidence',
)
assert.equal(receipt.source.animationAware, true)
assert.equal(receipt.source.opaqueRgbPngVerified, true)
assert.equal(receipt.rembg.actualPackageEntrypointExecuted, true)
assert.equal(receipt.rembg.executionDevice, 'cpu')
assert.equal(
  receipt.rembg.cpuSubstituteNotCanonicalGpuEquivalent,
  true,
)
assert.equal(receipt.rembg.transparentPixelCount > 0, true)
assert.equal(receipt.rembg.partialPixelCount > 0, true)
assert.equal(receipt.rembg.opaquePixelCount > 0, true)
assert.equal(receipt.sharp.actualPackageEntrypointExecuted, true)
assert.equal(
  receipt.sharp.transparentPixelCount,
  receipt.rembg.transparentPixelCount,
)
assert.equal(
  receipt.sharp.partialAlphaPixelCount,
  receipt.rembg.partialPixelCount,
)
assert.equal(
  receipt.sharp.opaquePixelCount,
  receipt.rembg.opaquePixelCount,
)
assert.equal(
  receipt.decontamination.processingProfile,
  'srgb8_known_matte_unmix_v1',
)
assert.equal(receipt.decontamination.changedPixelCount > 0, true)
assert.equal(
  receipt.decontamination.cleanedAlphaPngByteLength > 0,
  true,
)
assert.equal(
  receipt.alphaMeasurement.findingCodes.includes(
    'alpha_channel_variation_present',
  ),
  true,
)
assert.equal(receipt.privateArtifacts.createOnly, true)
assert.equal(receipt.privateArtifacts.publicUrlCreated, false)
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
  'sourcePng',
  'maskPng',
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
    'living_frame_animation_aware_illustration_private_alpha_internal_test',
  status: 'passed',
  sourceArtifactId: receipt.source.artifactId,
  sourceSha256: receipt.source.normalizedSourceSha256,
  rembgMaskSha256: receipt.rembg.maskSha256,
  firstPassAlphaPngSha256: receipt.sharp.alphaPngSha256,
  cleanedAlphaPngSha256:
    receipt.decontamination.cleanedAlphaPngSha256,
  decontaminationFindingCodes:
    receipt.decontamination.findingCodes,
  alphaFindingCodes:
    receipt.alphaMeasurement.findingCodes,
  privateInternalOnly: true,
  canonicalGpuEquivalentClaimed: false,
  customerBillingAuthority: false,
  publicDeliveryAuthority: false,
  productionAuthority: false,
}))
