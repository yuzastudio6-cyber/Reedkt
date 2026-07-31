import assert from 'node:assert/strict'
import {
  mkdir,
  writeFile,
} from 'node:fs/promises'
import {
  join,
} from 'node:path'

import {
  LIVING_FRAME_CHARACTER_PIXIJS_INTERNAL_RUNTIME_CLASS,
  LIVING_FRAME_CHARACTER_PIXIJS_INTERNAL_RUNTIME_STATE,
  LIVING_FRAME_CHARACTER_PIXIJS_INTERNAL_RUNTIME_VERSION,
} from '../../src/types/living-frame-character-pixijs-internal-runtime'
import {
  consumeLivingFrameCharacterPixiJsPrivateSequenceOutputLease,
  executeLivingFrameCharacterPixiJsInternalRuntime,
} from '../living-frame/living-frame-character-pixijs-internal-runtime'

const reviewRoot =
  '/tmp/reeditpro-living-frame-character-pixijs-internal-runtime'
const execution =
  await executeLivingFrameCharacterPixiJsInternalRuntime()
const {
  report,
  privateSequenceOutputLease,
} = execution

assert.equal(
  report.contractVersion,
  LIVING_FRAME_CHARACTER_PIXIJS_INTERNAL_RUNTIME_VERSION,
)
assert.equal(
  report.resultClass,
  LIVING_FRAME_CHARACTER_PIXIJS_INTERNAL_RUNTIME_CLASS,
)
assert.equal(
  report.runtimeState,
  LIVING_FRAME_CHARACTER_PIXIJS_INTERNAL_RUNTIME_STATE,
)
assert.equal(report.runtimeIdentity.toolId, 'pixijs')
assert.equal(
  report.runtimeIdentity.operationId,
  'tool.pixijs.render_pixi_scene.v1',
)
assert.equal(
  report.runtimeIdentity.packageVersion,
  '8.19.0',
)
assert.equal(
  report.runtimeIdentity.packageEntrypoint,
  'Application.init',
)
assert.equal(
  report.runtimeIdentity.actualPackageEntrypointExecuted,
  true,
)
assert.equal(
  report.runtimeIdentity.fixedSupervisedEntrypointExecuted,
  true,
)
assert.equal(
  report.runtimeIdentity.oneRequestOneAttemptVerified,
  true,
)
assert.equal(
  report.runtimeIdentity.zeroNetworkVerified,
  true,
)
assert.deepEqual(
  report.renderIdentity,
  {
    widthPixels: 640,
    heightPixels: 360,
    fps: 30,
    startFrame: 0,
    endFrameExclusive: 120,
    frameImageCount: 120,
    backgroundMode: 'transparent',
    alphaMode: 'straight_alpha',
    finalVideoCanvas: false,
    remotionOwnsFinalCanvas: true,
  },
)
assert.equal(
  report.aggregateQa.everyPngDecodedFromBytes,
  true,
)
assert.equal(
  report.aggregateQa.everyFrameExactDimension,
  true,
)
assert.equal(
  report.aggregateQa.everyFrameContainsOnlyComponentPixels,
  true,
)
assert.equal(
  report.aggregateQa.sourcePoseRestoredExactly,
  true,
)
assert.equal(
  report.aggregateQa.temporalVariationPresent,
  true,
)
assert.equal(
  report.aggregateQa.subjectAnchorCoverageContinuous,
  true,
)
assert.equal(
  report.aggregateQa
    .protectedFaceRegionBoundedRelativeToSourceComponent,
  true,
)
assert.ok(
  report.aggregateQa.uniqueFramePngDigestCount >= 8,
)
assert.ok(
  report.aggregateQa.middlePoseDifferentPixelCount > 1_000,
)
assert.ok(
  report.aggregateQa
    .maximumProtectedFaceAlphaPixelIncrease <= 600,
)
assert.deepEqual(
  report.selectedSceneSuitability,
  {
    selectedRoute:
      'pixijs_rigid_cutout',
    routeState:
      'qualified_private_pixijs_route',
    pixiJsWholeCharacterAdmissionAllowed:
      true,
    componentRuntimeMechanicsPassed:
      true,
    supportedMotionIntent:
      'restrained_whole_character_drift',
    articulatedSwordActionSupported:
      false,
    articulatedSwordActionRoute:
      'comfyui_controlled_component_preparation',
    articulatedSwordActionFailureCodes: [
      'unreconstructed_hidden_source_plate',
      'component_boundary_not_professionally_prepared',
      'current_motion_path_intersects_protected_face',
    ],
    controlledComponentPreparationRequired:
      true,
    downstreamRouteAfterPreparation:
      'pixijs_rigid_cutout',
    remotionWholeCharacterCompositeMayProceed:
      true,
  },
)
assert.equal(
  report.confinementEvidence.networkMode,
  'none',
)
assert.equal(
  report.confinementEvidence.readOnlyRootFilesystem,
  true,
)
assert.equal(
  report.confinementEvidence.capDropAll,
  true,
)
assert.equal(
  report.confinementEvidence.noNewPrivileges,
  true,
)
assert.equal(
  report.confinementEvidence.user,
  '10001:10001',
)
assert.equal(
  report.confinementEvidence.callerCommandPresent,
  false,
)
assert.equal(
  report.confinementEvidence.callerBindsPresent,
  false,
)
assert.equal(
  report.confinementEvidence.callerMountsPresent,
  false,
)
assert.equal(
  report.confinementEvidence.callerEnvironmentPresent,
  false,
)

for (const authority of Object.values(
  report.authorityBoundary,
)) {
  assert.equal(
    authority,
    authority ===
      report.authorityBoundary
        .privateInternalRuntimeEvidenceAuthority,
  )
}
assert.equal(report.operationRegistered, false)
assert.equal(
  report.canonicalDispatchIntegrated,
  false,
)
assert.equal(report.artifactPersisted, false)
assert.equal(report.assetManifestMutated, false)
assert.equal(report.rendererMutated, false)
assert.equal(report.canonicalQaApproved, false)
assert.equal(report.privateReviewApproved, false)
assert.equal(report.actualCostCreated, false)
assert.equal(report.customerCharged, false)
assert.equal(report.publicDeliveryReady, false)
assert.equal(report.productionReady, false)

const output =
  consumeLivingFrameCharacterPixiJsPrivateSequenceOutputLease(
    privateSequenceOutputLease,
  )
assert.equal(output.frames.length, 120)
assert.equal(
  output.sequenceDigestSha256,
  privateSequenceOutputLease.sequenceDigestSha256,
)
assert.equal(
  output.frames[0]?.pngDigestSha256,
  output.frames.at(-1)?.pngDigestSha256,
)
assert.notEqual(
  output.frames[0]?.pngDigestSha256,
  output.frames[52]?.pngDigestSha256,
)

await mkdir(reviewRoot, {
  recursive: true,
})
const reviewFrames = [
  0,
  40,
  52,
  70,
  119,
] as const
for (const order of reviewFrames) {
  const frame = output.frames[order]
  assert.ok(frame)
  await writeFile(
    join(
      reviewRoot,
      `frame-${order.toString().padStart(3, '0')}.png`,
    ),
    frame.pngBytes,
  )
}

let adversarialAssertions = 0
assert.throws(() =>
  consumeLivingFrameCharacterPixiJsPrivateSequenceOutputLease(
    privateSequenceOutputLease,
  ))
adversarialAssertions += 1
await assert.rejects(
  (
    executeLivingFrameCharacterPixiJsInternalRuntime as unknown as
      (input: unknown) => Promise<unknown>
  )({
    callerCode: 'sprite.rotation = callerValue',
  }),
)
adversarialAssertions += 1

const serializedReport = JSON.stringify(report)
for (const forbidden of [
  'bytesBase64',
  'pngBytes',
  'data:image/',
  'callerCode',
  'OPENAI_API_KEY',
  'https://',
  '/Users/',
]) {
  assert.equal(
    serializedReport.includes(forbidden),
    false,
  )
}

console.log(JSON.stringify({
  contractVersion:
    report.contractVersion,
  resultClass: report.resultClass,
  runtimeState: report.runtimeState,
  toolId: report.runtimeIdentity.toolId,
  operationId:
    report.runtimeIdentity.operationId,
  frameImageCount:
    report.renderIdentity.frameImageCount,
  uniqueFramePngDigestCount:
    report.aggregateQa
      .uniqueFramePngDigestCount,
  middlePoseDifferentPixelCount:
    report.aggregateQa
      .middlePoseDifferentPixelCount,
  maximumProtectedFaceAlphaPixelIncrease:
    report.aggregateQa
      .maximumProtectedFaceAlphaPixelIncrease,
  sourcePoseRestoredExactly:
    report.aggregateQa
      .sourcePoseRestoredExactly,
  subjectAnchorCoverageContinuous:
    report.aggregateQa
      .subjectAnchorCoverageContinuous,
  protectedFaceRegionBoundedRelativeToSourceComponent:
    report.aggregateQa
      .protectedFaceRegionBoundedRelativeToSourceComponent,
  selectedSceneSuitability:
    report.selectedSceneSuitability,
  actualPixiJsApplicationInit:
    report.runtimeIdentity
      .actualPackageEntrypointExecuted,
  remotionOwnsFinalCanvas:
    report.renderIdentity
      .remotionOwnsFinalCanvas,
  operationRegistered:
    report.operationRegistered,
  canonicalDispatchIntegrated:
    report.canonicalDispatchIntegrated,
  productionReady: report.productionReady,
  adversarialAssertions,
  privateReviewFrames: reviewFrames.map(
    (order) =>
      join(
        reviewRoot,
        `frame-${order.toString().padStart(3, '0')}.png`,
      ),
  ),
}, null, 2))
