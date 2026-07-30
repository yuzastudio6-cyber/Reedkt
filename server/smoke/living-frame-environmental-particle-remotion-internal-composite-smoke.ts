import assert from 'node:assert/strict'

import {
  createLivingFrameVisualContinuityFixtures,
} from '../../src/lib/living-frame/living-frame-visual-continuity-fixtures'
import {
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_REMOTION_INTERNAL_COMPOSITE_VERSION,
} from '../../src/types/living-frame-environmental-particle-remotion-internal-composite'
import type {
  LivingFrameEnvironmentalParticlePixiJsPrivateSequenceOutputLease,
} from '../../src/types/living-frame-environmental-particle-pixijs-internal-runtime'
import {
  compileLivingFrameEnvironmentalParticleKernel,
  type CompileLivingFrameEnvironmentalParticleKernelInput,
} from '../living-frame/living-frame-environmental-particle-kernel'
import {
  createLivingFrameEnvironmentalParticleOperationMaterialization,
} from '../living-frame/living-frame-environmental-particle-operation-materialization'
import {
  executeLivingFrameEnvironmentalParticlePixiJsInternalRuntimeWithPrivateSequenceOutput,
} from '../living-frame/living-frame-environmental-particle-pixijs-internal-runtime'
import {
  executeLivingFrameEnvironmentalParticleRemotionInternalComposite,
} from '../living-frame/living-frame-environmental-particle-remotion-internal-composite'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const WIDTH = 3_840
const HEIGHT = 2_160
const START_FRAME = 20
const END_FRAME_EXCLUSIVE = 28
const fixtures =
  await createLivingFrameVisualContinuityFixtures()
const kernelInput = inputFor()
const kernel =
  await compileLivingFrameEnvironmentalParticleKernel(
    kernelInput,
  )
const materialization =
  await createLivingFrameEnvironmentalParticleOperationMaterialization({
    materializationCandidateId:
      'living-frame.environmental-particle-remotion-internal',
    kernelCandidate: kernel,
    kernelInput,
  })
const pixiExecution =
  await executeLivingFrameEnvironmentalParticlePixiJsInternalRuntimeWithPrivateSequenceOutput({
    qualificationId:
      'living-frame.environmental-particle-remotion-internal.pixi-sequence',
    materialization:
      materialization.receipt,
    privateRequestLease:
      materialization.privateRequestLease,
    kernelCandidate: kernel,
    kernelInput,
  })

let adversarialAssertions = 0
const clonedLease = structuredClone(
  pixiExecution.privateSequenceOutputLease,
) as LivingFrameEnvironmentalParticlePixiJsPrivateSequenceOutputLease
await assert.rejects(
  executeLivingFrameEnvironmentalParticleRemotionInternalComposite({
    qualificationId:
      'living-frame.environmental-particle-remotion-internal.cloned',
    pixiJsRuntimeReport: pixiExecution.report,
    privateSequenceOutputLease: clonedLease,
  }),
)
adversarialAssertions += 1

await assert.rejects(
  executeLivingFrameEnvironmentalParticleRemotionInternalComposite({
    qualificationId:
      'living-frame.environmental-particle-remotion-internal.extra',
    pixiJsRuntimeReport: pixiExecution.report,
    privateSequenceOutputLease:
      pixiExecution.privateSequenceOutputLease,
    callerDimensions: {
      widthPixels: 1_024,
      heightPixels: 1_024,
    },
  } as unknown as Parameters<
    typeof executeLivingFrameEnvironmentalParticleRemotionInternalComposite
  >[0]),
)
adversarialAssertions += 1

const report =
  await executeLivingFrameEnvironmentalParticleRemotionInternalComposite({
    qualificationId:
      'living-frame.environmental-particle-remotion-internal.actual-v1',
    pixiJsRuntimeReport: pixiExecution.report,
    privateSequenceOutputLease:
      pixiExecution.privateSequenceOutputLease,
  })

assert.equal(
  report.contractVersion,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_REMOTION_INTERNAL_COMPOSITE_VERSION,
)
assert.equal(report.runtimeIdentity.toolId, 'remotion')
assert.equal(
  report.runtimeIdentity.operationId,
  'tool.remotion.render_approved_composition.v1',
)
assert.equal(
  report.runtimeIdentity.packageVersion,
  '4.0.487',
)
assert.equal(
  report.runtimeIdentity
    .actualRemotionMediaRenderExecuted,
  true,
)
assert.equal(
  report.runtimeIdentity
    .existingCanonicalRuntimeReused,
  true,
)
assert.equal(
  report.runtimeIdentity.sharedRuntimeSourceMutated,
  false,
)
assert.equal(
  report.compositionIdentity
    .generatedParticleWidthPixels,
  WIDTH,
)
assert.equal(
  report.compositionIdentity
    .generatedParticleHeightPixels,
  HEIGHT,
)
assert.equal(
  report.compositionIdentity
    .internalReviewWidthPixels,
  640,
)
assert.equal(
  report.compositionIdentity
    .internalReviewHeightPixels,
  360,
)
assert.equal(
  report.compositionIdentity
    .confirmedOutputRatioPreservedInInternalReview,
  true,
)
assert.equal(
  report.compositionIdentity.frameImageCount,
  END_FRAME_EXCLUSIVE - START_FRAME,
)
assert.equal(
  report.compositionIdentity.finalCustomerCanvas,
  false,
)
assert.equal(
  report.aggregateMeasurement
    .everyParticleFrameTimeSampled,
  true,
)
assert.equal(
  report.aggregateMeasurement
    .firstParticleFrameTransparentInComposite,
  true,
)
assert.equal(
  report.aggregateMeasurement
    .lastParticleFrameTransparentInComposite,
  true,
)
assert.equal(
  report.aggregateMeasurement
    .activeParticleFramesVisible,
  true,
)
assert.equal(
  report.aggregateMeasurement
    .temporalParticleVariationVisible,
  true,
)
assert.equal(
  report.aggregateMeasurement
    .alphaCentroidMotionPreserved,
  true,
)
assert.equal(
  report.aggregateMeasurement
    .captionPlaneVisibleAboveParticlesAcrossSequence,
  true,
)
assert.equal(
  report.confinementEvidence.networkMode,
  'none',
)
assert.equal(
  report.confinementEvidence
    .readOnlyRootFilesystem,
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
assert.equal(report.selectedSceneBound, false)
assert.equal(report.canonicalTimingBound, false)
assert.equal(report.operationRegistered, false)
assert.equal(report.canonicalDispatchIntegrated, false)
assert.equal(report.artifactPersisted, false)
assert.equal(report.assetManifestMutated, false)
assert.equal(report.qaApproved, false)
assert.equal(report.privateReviewApproved, false)
assert.equal(report.actualCostCreated, false)
assert.equal(report.customerCharged, false)
assert.equal(report.internalTestReady, true)
assert.equal(report.externalBetaReady, false)
assert.equal(report.productionReady, false)

const serializedReport = JSON.stringify(report)
for (const forbidden of [
  'bytesBase64',
  'pngBytes',
  'sourceVideoBytes',
  'renderedVideoBytes',
  'callerPrompt',
  'OPENAI_API_KEY',
  'https://',
  '/Users/',
]) {
  assert.equal(
    serializedReport.includes(forbidden),
    false,
  )
}

await assert.rejects(
  executeLivingFrameEnvironmentalParticleRemotionInternalComposite({
    qualificationId:
      'living-frame.environmental-particle-remotion-internal.reuse',
    pixiJsRuntimeReport: pixiExecution.report,
    privateSequenceOutputLease:
      pixiExecution.privateSequenceOutputLease,
  }),
)
adversarialAssertions += 1

process.stdout.write(`${JSON.stringify({
  smoke:
    'living_frame_environmental_particle_remotion_internal_composite',
  status: 'passed',
  pixiJsSequenceDigestSha256:
    report.sourceBindings
      .pixiJsSequenceDigestSha256,
  remotionArtifactDigestSha256:
    report.sourceBindings
      .remotionArtifactDigestSha256,
  generatedParticleFrame: {
    widthPixels:
      report.compositionIdentity
        .generatedParticleWidthPixels,
    heightPixels:
      report.compositionIdentity
        .generatedParticleHeightPixels,
  },
  internalReviewFrame: {
    widthPixels:
      report.compositionIdentity
        .internalReviewWidthPixels,
    heightPixels:
      report.compositionIdentity
        .internalReviewHeightPixels,
  },
  particleFrameCount:
    report.compositionIdentity.frameImageCount,
  everyParticleFrameTimeSampled:
    report.aggregateMeasurement
      .everyParticleFrameTimeSampled,
  temporalParticleVariationVisible:
    report.aggregateMeasurement
      .temporalParticleVariationVisible,
  captionPlaneVisibleAboveParticles:
    report.aggregateMeasurement
      .captionPlaneVisibleAboveParticlesAcrossSequence,
  operationRegistered: report.operationRegistered,
  artifactPersisted: report.artifactPersisted,
  actualCostCreated: report.actualCostCreated,
  customerCharged: report.customerCharged,
  internalTestReady: report.internalTestReady,
  externalBetaReady: report.externalBetaReady,
  productionReady: report.productionReady,
  adversarialAssertions,
})}\n`)

function inputFor():
CompileLivingFrameEnvironmentalParticleKernelInput {
  const visualContinuityPack = fixtures.musashi
  const sceneDesignSheet =
    visualContinuityPack.sceneDesignSheets[0]!
  return {
    kernelCandidateId:
      'living-frame.environmental-particle-remotion-internal',
    profileId:
      'restrained_airborne_dust_settle_v1',
    sceneDesignSheetId:
      sceneDesignSheet.sceneDesignSheetId,
    environmentSheetId:
      sceneDesignSheet.environmentSheetIds[0]!,
    visualContinuityPack,
    frameBinding: {
      widthPixels: WIDTH,
      heightPixels: HEIGHT,
      fps: 30,
      startFrame: START_FRAME,
      endFrameExclusive: END_FRAME_EXCLUSIVE,
      emitterRect: {
        x: 0.05,
        y: 0.52,
        width: 0.9,
        height: 0.42,
      },
      anchorPoint: {
        x: 0.5,
        y: 0.72,
      },
      confirmedOutputFrameDigestSha256:
        sha256AuthorityValue(
          'confirmed-output-frame-remotion-internal',
        ),
      masterTimingDigestSha256:
        sha256AuthorityValue(
          'master-timing-remotion-internal',
        ),
      serverSeedDigestSha256:
        sha256AuthorityValue(
          'server-seed-remotion-internal',
        ),
      confirmedOutputFrameRevalidationRequired: true,
      masterTimingRevalidationRequired: true,
    },
  }
}
