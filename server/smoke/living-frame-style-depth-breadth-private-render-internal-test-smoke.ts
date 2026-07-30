import assert from 'node:assert/strict'

import {
  executeLivingFrameStyleDepthBreadthPrivateRenderInternalTest,
} from '../living-frame/living-frame-style-depth-breadth-private-render-internal-test'

const receipt =
  await executeLivingFrameStyleDepthBreadthPrivateRenderInternalTest()

assert.equal(
  receipt.schemaVersion,
  'living-frame-style-depth-breadth-private-render-internal-test-v1',
)
assert.equal(
  receipt.evidenceClass,
  'actual_private_internal_style_adaptive_flat_and_shallow_2_5d_render',
)
assert.equal(
  receipt.generatedFixtureEvidence.fixtures.length,
  2,
)
assert.deepEqual(
  receipt.generatedFixtureEvidence.fixtures.map(
    (fixture) => fixture.assetTreatment,
  ),
  ['flat_editorial_cutout', 'paper_collage'],
)
assert.deepEqual(
  receipt.scenes.map((scene) => scene.depthStyle),
  ['flat', 'shallow_2_5d'],
)
assert.equal(
  receipt.scenes[0].spatialParallaxAllowed,
  false,
)
assert.equal(
  receipt.scenes[1].spatialParallaxAllowed,
  true,
)
assert.equal(
  receipt.adaptiveDepthQa.flatSceneDidNotReceiveParallax,
  true,
)
assert.equal(
  receipt.adaptiveDepthQa
    .shallowSceneDifferentialParallaxMeasured,
  true,
)
assert.equal(
  receipt.adaptiveDepthQa
    .shallowForegroundMovedMoreThanFarPlane,
  true,
)
assert.equal(
  receipt.adaptiveDepthQa
    .captionPlaneObservedAboveBothStyles,
  true,
)
assert.equal(
  receipt.runtime.actualRemotionEntrypointExecuted,
  true,
)
assert.equal(
  receipt.runtime.actualFfmpegEntrypointExecuted,
  true,
)
assert.equal(
  receipt.runtime.actualFfprobeEntrypointExecuted,
  true,
)
assert.equal(receipt.runtime.outputFrameCount, 120)
assert.equal(
  receipt.runtime.persistedArtifactReopened,
  true,
)
assert.equal(
  receipt.authorityBoundary
    .fixtureGenerationIsNotCanonicalProviderEvidence,
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
assert.match(
  receipt.receiptDigestSha256,
  /^[a-f0-9]{64}$/,
)

process.stdout.write(`${JSON.stringify({
  smoke:
    'living_frame_style_depth_breadth_private_render_internal_test',
  status: 'passed',
  privateInternalOnly: true,
  generatedFixtures:
    receipt.generatedFixtureEvidence.fixtures.map(
      (fixture) => ({
        artifactId: fixture.artifactId,
        assetTreatment: fixture.assetTreatment,
        sourceSha256: fixture.sourceSha256,
      }),
    ),
  renderedStyles: receipt.scenes.map((scene) => ({
    assetTreatment: scene.assetTreatment,
    depthStyle: scene.depthStyle,
    spatialParallaxAllowed:
      scene.spatialParallaxAllowed,
  })),
  flatCharacterCentroidDriftPixels:
    receipt.scenes[0].renderedCharacterCentroidDriftPixels,
  flatAnchorCentroidDriftPixels:
    receipt.scenes[0].flatAnchorCentroidDriftPixels,
  shallowFarPlaneDisplacementPixels:
    receipt.scenes[1].farPlaneDisplacementPixels,
  shallowForegroundDisplacementPixels:
    receipt.scenes[1].foregroundDisplacementPixels,
  shallowSmokeVerticalDisplacementPixels:
    receipt.scenes[1].smokeVerticalDisplacementPixels,
  reviewFrameSha256:
    receipt.privateArtifacts.reviewFrameSha256,
  actualRemotionRuntimeExecuted:
    receipt.runtime.actualRemotionEntrypointExecuted,
  actualFfmpegRuntimeExecuted:
    receipt.runtime.actualFfmpegEntrypointExecuted,
  actualFfprobeRuntimeExecuted:
    receipt.runtime.actualFfprobeEntrypointExecuted,
  customerBillingAuthority:
    receipt.authorityBoundary.customerBillingAuthority,
  publicDeliveryAuthority:
    receipt.authorityBoundary.publicDeliveryAuthority,
  productionAuthority:
    receipt.authorityBoundary.productionAuthority,
})}\n`)
