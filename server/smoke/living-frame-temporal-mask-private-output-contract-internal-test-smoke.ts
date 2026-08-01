import assert from 'node:assert/strict'

import {
  executeLivingFrameTemporalMaskPrivateOutputContractInternalTest,
} from '../living-frame/living-frame-temporal-mask-private-output-contract-internal-test'

const receipt =
  await executeLivingFrameTemporalMaskPrivateOutputContractInternalTest()

assert.equal(
  receipt.source.groundTruthNotModelInference,
  true,
)
assert.equal(receipt.source.sam2InferenceClaimed, false)
assert.equal(receipt.source.contactObjectIncluded, true)
assert.equal(receipt.encodedArtifact.codecName, 'ffv1')
assert.equal(receipt.encodedArtifact.pixelFormat, 'gray')
assert.equal(receipt.encodedArtifact.frameCount, 48)
assert.equal(receipt.encodedArtifact.frameRate, '24/1')
assert.equal(
  receipt.encodedArtifact.losslessFrameReplayVerified,
  true,
)
assert.deepEqual(
  receipt.temporalMeasurement.findingCodes,
  [],
)
assert.equal(
  receipt.temporalMeasurement.pairCount,
  47,
)
assert.equal(
  receipt.temporalMeasurement
    .minimumBinaryIntersectionOverUnion > 0.9,
  true,
)
assert.equal(
  receipt.temporalMeasurement
    .maximumNormalizedCentroidShift < 0.01,
  true,
)
assert.equal(
  receipt.privateArtifacts.persistedCreateOnly,
  true,
)
assert.equal(
  receipt.privateArtifacts.persistedArtifactReopened,
  true,
)
assert.equal(
  receipt.authorityBoundary.sam2InferenceAuthority,
  false,
)
assert.equal(
  receipt.authorityBoundary.canonicalWorkGraphAuthority,
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
  'alphaBytes',
  'bytesBase64',
  'file://',
  'https://',
  '/Users/',
  '/Volumes/',
  'customerCredits',
  'serviceFee',
]) {
  assert.equal(serialized.includes(forbidden), false)
}

console.log(JSON.stringify({
  smoke:
    'living_frame_temporal_mask_private_output_contract_internal_test',
  status: 'passed',
  evidenceClass: receipt.evidenceClass,
  encodingProfile:
    receipt.encodedArtifact.encodingProfile,
  codecName: receipt.encodedArtifact.codecName,
  pixelFormat: receipt.encodedArtifact.pixelFormat,
  widthPixels: receipt.encodedArtifact.widthPixels,
  heightPixels: receipt.encodedArtifact.heightPixels,
  frameCount: receipt.encodedArtifact.frameCount,
  byteLength: receipt.encodedArtifact.byteLength,
  outputSha256: receipt.encodedArtifact.sha256,
  losslessFrameReplayVerified:
    receipt.encodedArtifact.losslessFrameReplayVerified,
  findingCodes:
    receipt.temporalMeasurement.findingCodes,
  minimumBinaryIntersectionOverUnion:
    receipt.temporalMeasurement
      .minimumBinaryIntersectionOverUnion,
  maximumNormalizedCentroidShift:
    receipt.temporalMeasurement
      .maximumNormalizedCentroidShift,
  maximumBoundaryDisagreementRatio:
    receipt.temporalMeasurement
      .maximumBoundaryDisagreementRatio,
  sam2InferenceClaimed:
    receipt.source.sam2InferenceClaimed,
  persistedCreateOnly:
    receipt.privateArtifacts.persistedCreateOnly,
  privateInternalOnly: true,
  customerBillingAuthority: false,
  publicDeliveryAuthority: false,
  productionAuthority: false,
}))
