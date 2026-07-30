import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  createLivingFrameContractFixtures,
} from '../../src/lib/living-frame/living-frame-fixtures'
import {
  createLivingFrameVisualContinuityFixtureDrafts,
} from '../../src/lib/living-frame/living-frame-visual-continuity-fixtures'
import {
  createLivingFrameVisualContinuityPack,
} from '../../src/lib/living-frame/living-frame-visual-continuity-contract'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import type {
  CanonicalLivingFrameTimingBinding,
} from '../../src/types/living-frame-timing-binding'
import {
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_INTERNAL_TEST_VERSION,
} from '../../src/types/living-frame-selected-scene-environmental-particle-internal-test'
import {
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_REMOTION_FULL_TIMELINE_INTERNAL_TEST_VERSION,
} from '../../src/types/living-frame-selected-scene-environmental-particle-remotion-full-timeline-internal-test'
import {
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_PERSISTENCE_INTERNAL_TEST_VERSION,
} from '../../src/types/living-frame-selected-scene-environmental-particle-private-persistence-internal-test'
import {
  compileLivingFrameComponentGeometry,
} from '../living-frame/living-frame-component-geometry'
import {
  compileLivingFrameDeterministicMotion,
} from '../living-frame/living-frame-deterministic-motion'
import {
  executeLivingFrameSelectedSceneEnvironmentalParticleInternalTest,
} from '../living-frame/living-frame-selected-scene-environmental-particle-internal-test'
import {
  consumeLivingFrameSelectedSceneEnvironmentalParticleRemotionPrivateReviewOutputLease,
  executeLivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTest,
  executeLivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestWithPrivateReviewOutput,
} from '../living-frame/living-frame-environmental-particle-remotion-internal-composite'
import {
  executeLivingFrameSelectedSceneEnvironmentalParticlePrivatePersistenceInternalTest,
} from '../living-frame/living-frame-selected-scene-environmental-particle-private-persistence-internal-test'
import {
  inspectLivingFrameEnvironmentalParticleAdmission,
  type InspectLivingFrameEnvironmentalParticleAdmissionInput,
} from '../living-frame/living-frame-selected-scene-environmental-particle-admission'
import {
  reconcileLivingFrameSelectedSceneSelectiveMotion,
} from '../living-frame/living-frame-selected-scene-selective-motion-reconciliation'
import {
  compileCanonicalLivingFrameMotionSpec,
} from '../living-frame/canonical-living-frame-motion'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'

const contractFixtures =
  await createLivingFrameContractFixtures()
const selectedComponent =
  contractFixtures.helicopterSelectiveMotion
const scene = selectedComponent.scenePlans[0]!
const componentId = 'helicopter.downwash'
const currentMasterTimingDigestSha256 =
  sha256AuthorityValue(
    'selected-scene-environmental-internal-master-timing',
  )

const baseContinuityDraft =
  createLivingFrameVisualContinuityFixtureDrafts()
    .helicopter
const continuityDraft = {
  ...baseContinuityDraft,
  canonicalBindings: {
    ...baseContinuityDraft.canonicalBindings,
    workspaceId: 'workspace.helicopter',
    projectId: 'project.helicopter',
    editSessionId: 'edit.helicopter',
    deferredLivingFrameComponentDigestSha256:
      selectedComponent.contractDigestSha256,
    outputFrameDigestSha256:
      selectedComponent.inputBindings.outputFrame
        .expectedDigestSha256,
  },
}
const visualContinuityPack =
  await createLivingFrameVisualContinuityPack(
    continuityDraft,
  )

const selectedSceneBindingDigestSha256 =
  sha256AuthorityValue({
    selectedComponent:
      selectedComponent.contractDigestSha256,
    sceneId: scene.sceneId,
    visualContinuityPackDigestSha256:
      visualContinuityPack.contractDigestSha256,
  })
const timingBindingDigestSha256 =
  sha256AuthorityValue({
    selectedSceneBindingDigestSha256,
    currentMasterTimingDigestSha256,
  })
const publication = {
  binding: {
    identity: {
      workspaceId: 'workspace.helicopter',
      projectId: 'project.helicopter',
      editSessionId: 'edit.helicopter',
    },
    sourceBindings: {
      visualContinuityPackDigestSha256:
        visualContinuityPack
          .contractDigestSha256,
      confirmedOutputFrameDigestSha256:
        selectedComponent.inputBindings.outputFrame
          .expectedDigestSha256,
      currentMasterTimingDigestSha256,
    },
    selectedComponent,
    bindingDigestSha256:
      selectedSceneBindingDigestSha256,
  },
  admission: {},
  semanticPlanProjection: {},
} as unknown as CanonicalLivingFrameSelectedScenePublication
const timingBinding = {
  timingBindingDigestSha256,
  sourceBindings: {
    selectedSceneBindingDigestSha256,
    currentMasterTimingDigestSha256,
  },
  fps: 30,
  scenes: [{
    sceneId: scene.sceneId,
    semanticPhaseBindings: [
      phase('prepare', 0, 15),
      phase('activate', 15, 30),
      phase('demonstrate', 30, 105),
      phase('resolve', 105, 135),
      phase('settle', 135, 150),
    ],
    visualTiming: {
      frameRange: {
        startFrame: 0,
        endFrameExclusive: 150,
        durationFrames: 150,
      },
    },
  }],
} as unknown as CanonicalLivingFrameTimingBinding
const components = {
  masterTimingPlan: {
    id:
      'master-timing.selected-scene-environmental-internal',
  },
} as unknown as CanonicalPlanComponentsInput
const canonicalMotionSpecs = scene.components.map(
  (component) =>
    compileCanonicalLivingFrameMotionSpec({
      publication,
      timingBinding,
      components,
      sceneId: scene.sceneId,
      componentId: component.componentId,
    }),
)
const selectiveMotionReconciliation =
  await reconcileLivingFrameSelectedSceneSelectiveMotion({
    reconciliationId:
      'living-frame.selected-scene-environmental-internal.selective-motion',
    sceneId: scene.sceneId,
    publication,
    timingBinding,
    components,
    canonicalMotionSpecs,
  })
const motionBundle =
  compileLivingFrameDeterministicMotion({
    timingExpectation: {
      masterTimingPlanId:
        'master-timing.selected-scene-environmental-internal',
      masterTimingPlanDigestSha256:
        currentMasterTimingDigestSha256,
      outputFrameId:
        selectedComponent.inputBindings.outputFrame
          .expectationRefId,
      outputFrameDigestSha256:
        selectedComponent.inputBindings.outputFrame
          .expectedDigestSha256,
      sceneId: scene.sceneId,
      sceneStartFrame: 0,
      sceneEndFrame: 149,
      fpsNumerator: 30,
      fpsDenominator: 1,
      timingAuthorityRevalidationRequired: true,
    },
    tracks: [{
      trackId:
        'track.selected-scene-environmental-internal.emission',
      order: 0,
      motionGroupId:
        'motion.selected-scene-environmental-internal',
      componentId,
      property:
        'particle_emission_normalized',
      role: 'ambient',
      restorationExpectation:
        'required_return_to_initial',
      keyframes: [
        {
          frame: 30,
          value: 0,
          easingToNext: 'ease_out_quad',
        },
        {
          frame: 45,
          value: 0.75,
          easingToNext: 'ease_in_out_cubic',
        },
        {
          frame: 105,
          value: 0.75,
          easingToNext: 'ease_in_out_cubic',
        },
        {
          frame: 135,
          value: 0,
          easingToNext: 'hold',
        },
      ],
    }],
  })
const componentGeometryBundle =
  compileLivingFrameComponentGeometry({
    outputFrameExpectation: {
      outputFrameId:
        selectedComponent.inputBindings.outputFrame
          .expectationRefId,
      outputFrameDigestSha256:
        selectedComponent.inputBindings.outputFrame
          .expectedDigestSha256,
      widthPixels: 1_920,
      heightPixels: 1_080,
      pixelAspectRatioNumerator: 1,
      pixelAspectRatioDenominator: 1,
      confirmedOutputFrameRevalidationRequired: true,
    },
    motionBundle,
    safeRegions: [],
    components: [
      {
        componentId: 'helicopter.background',
        order: 0,
        kind: 'visual_component',
        role: 'opaque_background_plate',
        focalRole: 'static_anchor',
        depthBand: 'background',
        rect: {
          x: 0,
          y: 0,
          width: 1,
          height: 1,
        },
        pivot: { x: 0.5, y: 0.5 },
        parentComponentId: null,
        anchorComponentId: null,
        anchorPoint: { x: 0.5, y: 0.5 },
        collisionPolicy:
          'base_layer_coverage',
        transparencyExpectation:
          'opaque_plate',
        alphaSourceExpectation:
          'opaque_plate',
        maskExpectation: 'opaque',
      },
      {
        componentId: 'helicopter.body',
        order: 1,
        kind: 'visual_component',
        role: 'primary_subject',
        focalRole: 'primary',
        depthBand: 'subject_plane',
        rect: {
          x: 0.2,
          y: 0.2,
          width: 0.6,
          height: 0.55,
        },
        pivot: { x: 0.5, y: 0.48 },
        parentComponentId: null,
        anchorComponentId:
          'helicopter.background',
        anchorPoint: { x: 0.5, y: 0.48 },
        collisionPolicy:
          'avoid_all_protected_regions',
        transparencyExpectation:
          'still_alpha_required',
        alphaSourceExpectation:
          'postprocessed_still_mask_requires_qa',
        maskExpectation:
          'still_alpha_artifact_required',
      },
      {
        componentId,
        order: 2,
        kind: 'visual_component',
        role: 'environmental_effect',
        focalRole: 'secondary',
        depthBand: 'foreground',
        rect: {
          x: 0.18,
          y: 0.62,
          width: 0.64,
          height: 0.3,
        },
        pivot: { x: 0.5, y: 0.65 },
        parentComponentId: null,
        anchorComponentId:
          'helicopter.body',
        anchorPoint: { x: 0.5, y: 0.65 },
        collisionPolicy:
          'avoid_all_protected_regions',
        transparencyExpectation:
          'procedural_alpha',
        alphaSourceExpectation:
          'procedural_alpha_requires_qa',
        maskExpectation:
          'procedural_alpha_artifact_required',
      },
    ],
    occlusionExpectations: [{
      relationId:
        'occlusion.selected-scene-environmental-internal',
      order: 0,
      kind: 'in_front_of',
      foregroundComponentId: componentId,
      backgroundComponentId:
        'helicopter.body',
      downstreamDepthTransitionCompilationRequired:
        false,
    }],
  })
const admissionInput:
  InspectLivingFrameEnvironmentalParticleAdmissionInput = {
    admissionCandidateId:
      'living-frame.selected-scene-environmental-internal.admission',
    sceneId: scene.sceneId,
    componentId,
    publication,
    timingBinding,
    componentGeometryBundle,
    selectiveMotionReconciliation,
  }
const admission =
  await inspectLivingFrameEnvironmentalParticleAdmission(
    admissionInput,
  )

const execution =
  await executeLivingFrameSelectedSceneEnvironmentalParticleInternalTest({
    qualificationId:
      'living-frame.selected-scene-environmental-internal.actual-v1',
    admission,
    admissionInput,
    profileBindingId:
      'internal-test.environmental-particle.restrained-airborne-dust-settle.v1',
    visualContinuityPack,
    sceneDesignSheetId:
      visualContinuityPack
        .sceneDesignSheets[0]!
        .sceneDesignSheetId,
    environmentSheetId:
      visualContinuityPack
        .environmentSheets[0]!
        .environmentSheetId,
  })
const report = execution.report

assert.equal(
  report.contractVersion,
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_INTERNAL_TEST_VERSION,
)
assert.equal(
  report.canonicalScope.sceneId,
  scene.sceneId,
)
assert.equal(
  report.canonicalScope.componentId,
  componentId,
)
assert.equal(
  report.exactExecutionRange.widthPixels,
  1_920,
)
assert.equal(
  report.exactExecutionRange.heightPixels,
  1_080,
)
assert.equal(
  report.exactExecutionRange.startFrame,
  30,
)
assert.equal(
  report.exactExecutionRange
    .endFrameExclusive,
  135,
)
assert.equal(
  report.exactExecutionRange.durationFrames,
  105,
)
assert.equal(
  execution.privateSequenceOutputLease
    .frameImageCount,
  105,
)
assert.equal(
  report.runtimeIdentity.toolId,
  'pixijs',
)
assert.equal(
  report.runtimeIdentity.packageVersion,
  '8.19.0',
)
assert.equal(
  report.runtimeIdentity
    .actualPackageEntrypointExecuted,
  true,
)
assert.equal(report.selectedSceneBound, true)
assert.equal(report.canonicalTimingBound, true)
assert.equal(
  report.fullSelectedEnvironmentalRangeExecuted,
  true,
)
assert.equal(
  report.remotionCompositeExecuted,
  false,
)
assert.equal(
  report.internalTestReadyForRemotion,
  true,
)
assert.equal(report.customerCharged, false)
assert.equal(report.productionReady, false)

const fullTimelineExecution =
  await executeLivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTestWithPrivateReviewOutput({
    qualificationId:
      'living-frame.selected-scene-environmental-internal.remotion-full-timeline-v1',
    selectedSceneInternalTestReport:
      report,
    pixiJsRuntimeReport:
      execution.pixiJsRuntimeReport,
    privateSequenceOutputLease:
      execution.privateSequenceOutputLease,
  })
const fullTimelineReport =
  fullTimelineExecution.report

assert.equal(
  fullTimelineReport.contractVersion,
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_REMOTION_FULL_TIMELINE_INTERNAL_TEST_VERSION,
)
assert.equal(
  fullTimelineReport.canonicalScope.sceneId,
  scene.sceneId,
)
assert.equal(
  fullTimelineReport.canonicalScope.componentId,
  componentId,
)
assert.equal(
  fullTimelineReport.compositionIdentity
    .selectedDurationFrames,
  105,
)
assert.equal(
  fullTimelineReport.compositionIdentity
    .finalReviewDurationFrames,
  105,
)
assert.equal(
  fullTimelineReport.compositionIdentity
    .frameImageCount,
  105,
)
assert.equal(
  fullTimelineReport.compositionIdentity
    .remotionChunkCount,
  7,
)
assert.equal(
  fullTimelineReport.compositionIdentity
    .maximumOverlaysPerChunk,
  16,
)
assert.equal(
  fullTimelineReport.compositionIdentity
    .everyFinalFrameCompositedByRemotion,
  true,
)
assert.equal(
  fullTimelineReport.compositionIdentity
    .packagingOnly,
  true,
)
assert.equal(
  fullTimelineReport.compositionIdentity
    .remotionRemainsFinalCanvas,
  true,
)
assert.equal(
  fullTimelineReport.compositionIdentity
    .finalCustomerCanvas,
  false,
)
assert.equal(
  fullTimelineReport.runtimeIdentity
    .actualRemotionRenderCount,
  7,
)
assert.equal(
  fullTimelineReport.aggregateMeasurement
    .everyParticleFrameTimeSampled,
  true,
)
assert.equal(
  fullTimelineReport.aggregateMeasurement
    .captionPlaneVisibleAboveParticlesAcrossTimeline,
  true,
)
assert.ok(
  fullTimelineReport.aggregateMeasurement
    .perceptibleParticleFrameCount > 2,
)
assert.ok(
  fullTimelineReport.aggregateMeasurement
    .subPerceptualTransitionFrameCount > 0,
)
assert.equal(
  fullTimelineReport.aggregateMeasurement
    .subPerceptualTransitionFramesPreserved,
  true,
)
assert.equal(
  fullTimelineReport.frameMeasurements.every(
    (frame) =>
      !frame.expectedPerceptiblyVisible
      || frame.particleVisible,
  ),
  true,
)
assert.equal(
  fullTimelineReport
    .fullSelectedEnvironmentalRangeComposited,
  true,
)
assert.equal(
  fullTimelineReport
    .internalTestReadyForPersistenceAndReview,
  true,
)
assert.equal(
  fullTimelineReport.artifactPersisted,
  false,
)
assert.equal(
  fullTimelineReport.qaApproved,
  false,
)
assert.equal(
  fullTimelineReport.privateReviewApproved,
  false,
)
assert.equal(
  fullTimelineReport.customerCharged,
  false,
)
assert.equal(
  fullTimelineReport.productionReady,
  false,
)

const persistenceReport = await (async () => {
  const localStorageRoot =
    await mkdtemp(
      join(
        tmpdir(),
        'reeditpro-lf-particle-persistence-',
      ),
    )
  try {
    return await executeLivingFrameSelectedSceneEnvironmentalParticlePrivatePersistenceInternalTest({
      qualificationId:
        'living-frame.selected-scene-environmental-internal.private-persistence-v1',
      localStorageRoot,
      fullTimelineReport,
      privateReviewOutputLease:
        fullTimelineExecution
          .privateReviewOutputLease,
    })
  } finally {
    await rm(localStorageRoot, {
      recursive: true,
      force: true,
    })
  }
})()

assert.equal(
  persistenceReport.contractVersion,
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_PRIVATE_PERSISTENCE_INTERNAL_TEST_VERSION,
)
assert.equal(
  persistenceReport.canonicalScope.sceneId,
  scene.sceneId,
)
assert.equal(
  persistenceReport.canonicalScope.componentId,
  componentId,
)
assert.equal(
  persistenceReport.persistedArtifact
    .storageOwner,
  'persistCanonicalPrivateRemotionArtifactStream',
)
assert.equal(
  persistenceReport.persistedArtifact
    .inspectionOwner,
  'inspectCanonicalPrivateRemotionArtifact',
)
assert.equal(
  persistenceReport.persistedArtifact
    .sha256,
  fullTimelineReport.sourceBindings
    .finalPackagedReviewDigestSha256,
)
assert.equal(
  persistenceReport.persistedArtifact
    .byteLength,
  fullTimelineReport.compositionIdentity
    .finalPackagedReviewByteLength,
)
assert.equal(
  persistenceReport.persistedArtifact
    .createOnlyPersistenceUsed,
  true,
)
assert.equal(
  persistenceReport.persistedArtifact
    .exactReadbackVerified,
  true,
)
assert.equal(
  persistenceReport.privateOutputLeaseConsumedExactlyOnce,
  true,
)
assert.equal(
  persistenceReport.artifactPersisted,
  true,
)
assert.equal(
  persistenceReport.assetManifestMutated,
  false,
)
assert.equal(
  persistenceReport.qaApproved,
  false,
)
assert.equal(
  persistenceReport.privateReviewApproved,
  false,
)
assert.equal(
  persistenceReport.customerCharged,
  false,
)
assert.equal(
  persistenceReport.internalTestReadyForSceneEvidenceAndPrivateReview,
  true,
)
assert.equal(
  persistenceReport.productionReady,
  false,
)
assert.throws(
  () =>
    consumeLivingFrameSelectedSceneEnvironmentalParticleRemotionPrivateReviewOutputLease(
      fullTimelineExecution
        .privateReviewOutputLease,
    ),
  /unknown or already consumed/u,
)

let adversarialAssertions = 0
const mismatchedPack = {
  ...visualContinuityPack,
  canonicalBindings: {
    ...visualContinuityPack.canonicalBindings,
    outputFrameDigestSha256:
      sha256AuthorityValue(
        'forged-output-frame',
      ),
  },
}
await assert.rejects(
  executeLivingFrameSelectedSceneEnvironmentalParticleInternalTest({
    qualificationId:
      'living-frame.selected-scene-environmental-internal.forged-frame',
    admission,
    admissionInput,
    profileBindingId:
      'internal-test.environmental-particle.restrained-airborne-dust-settle.v1',
    visualContinuityPack: mismatchedPack,
    sceneDesignSheetId:
      visualContinuityPack
        .sceneDesignSheets[0]!
        .sceneDesignSheetId,
    environmentSheetId:
      visualContinuityPack
        .environmentSheets[0]!
        .environmentSheetId,
  }),
)
adversarialAssertions += 1

await assert.rejects(
  executeLivingFrameSelectedSceneEnvironmentalParticleInternalTest({
    qualificationId:
      'living-frame.selected-scene-environmental-internal.caller-profile',
    admission,
    admissionInput,
    profileBindingId:
      'caller-selected-profile',
    visualContinuityPack,
    sceneDesignSheetId:
      visualContinuityPack
        .sceneDesignSheets[0]!
        .sceneDesignSheetId,
    environmentSheetId:
      visualContinuityPack
        .environmentSheets[0]!
        .environmentSheetId,
  } as unknown as Parameters<
    typeof executeLivingFrameSelectedSceneEnvironmentalParticleInternalTest
  >[0]),
)
adversarialAssertions += 1

await assert.rejects(
  executeLivingFrameSelectedSceneEnvironmentalParticleRemotionFullTimelineInternalTest({
    qualificationId:
      'living-frame.selected-scene-environmental-internal.remotion-reuse',
    selectedSceneInternalTestReport:
      report,
    pixiJsRuntimeReport:
      execution.pixiJsRuntimeReport,
    privateSequenceOutputLease:
      execution.privateSequenceOutputLease,
  }),
)
adversarialAssertions += 1

const serializedReport = JSON.stringify(report)
const serializedFullTimelineReport =
  JSON.stringify(fullTimelineReport)
const serializedPersistenceReport =
  JSON.stringify(persistenceReport)
for (const forbidden of [
  'pngBytes',
  'rgbaBytes',
  'stateTracks',
  'rawTranscript',
  'callerPrompt',
  'OPENAI_API_KEY',
  'https://',
  '/Users/',
]) {
  assert.equal(
    serializedReport.includes(forbidden),
    false,
  )
  assert.equal(
    serializedFullTimelineReport.includes(
      forbidden,
    ),
    false,
  )
  assert.equal(
    serializedPersistenceReport.includes(
      forbidden,
    ),
    false,
  )
}

process.stdout.write(`${JSON.stringify({
  smoke:
    'living_frame_selected_scene_environmental_particle_internal_test',
  status: 'passed',
  sceneId: report.canonicalScope.sceneId,
  componentId:
    report.canonicalScope.componentId,
  widthPixels:
    report.exactExecutionRange.widthPixels,
  heightPixels:
    report.exactExecutionRange.heightPixels,
  startFrame:
    report.exactExecutionRange.startFrame,
  endFrameExclusive:
    report.exactExecutionRange
      .endFrameExclusive,
  frameImageCount:
    execution.privateSequenceOutputLease
      .frameImageCount,
  actualPackageEntrypointExecuted:
    report.runtimeIdentity
      .actualPackageEntrypointExecuted,
  selectedSceneBound:
    report.selectedSceneBound,
  canonicalTimingBound:
    report.canonicalTimingBound,
  internalTestReadyForRemotion:
    report.internalTestReadyForRemotion,
  remotionChunkCount:
    fullTimelineReport.compositionIdentity
      .remotionChunkCount,
  fullTimelineFrameCount:
    fullTimelineReport.compositionIdentity
      .finalReviewDurationFrames,
  everyParticleFrameTimeSampled:
    fullTimelineReport.aggregateMeasurement
      .everyParticleFrameTimeSampled,
  captionPlaneVisibleAboveParticles:
    fullTimelineReport.aggregateMeasurement
      .captionPlaneVisibleAboveParticlesAcrossTimeline,
  internalTestReadyForPersistenceAndReview:
    fullTimelineReport
      .internalTestReadyForPersistenceAndReview,
  artifactPersisted:
    persistenceReport.artifactPersisted,
  canonicalPrivateRemotionStorageReused:
    persistenceReport.persistedArtifact
      .storageOwner ===
      'persistCanonicalPrivateRemotionArtifactStream',
  assetManifestMutated:
    persistenceReport.assetManifestMutated,
  privateReviewApproved:
    persistenceReport.privateReviewApproved,
  customerCharged: report.customerCharged,
  productionReady: report.productionReady,
  adversarialAssertions,
})}\n`)

function phase(
  phaseValue:
    'prepare'
    | 'activate'
    | 'demonstrate'
    | 'resolve'
    | 'settle',
  startFrame: number,
  endFrameExclusive: number,
) {
  return {
    phase: phaseValue,
    frameRange: {
      startFrame,
      endFrameExclusive,
      durationFrames:
        endFrameExclusive - startFrame,
    },
  }
}
