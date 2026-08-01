import assert from 'node:assert/strict'
import {
  mkdtemp,
  rm,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  createLivingFrameContractFixtures,
} from '../../src/lib/living-frame/living-frame-fixtures'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import type {
  CanonicalLivingFrameTimingBinding,
} from '../../src/types/living-frame-timing-binding'
import type {
  LivingFrameBlenderSelectedSceneApprovedSnapshotBinding,
  LivingFrameBlenderSelectedScenePlannedWorkBinding,
} from '../../src/types/living-frame-blender-selected-scene-admission'
import {
  compileLivingFrameBlenderFixedAdapterInternalRequest,
  runLivingFrameBlenderFixedAdapterInternalWithOutputLease,
} from '../living-frame/living-frame-blender-fixed-adapter-internal-test'
import {
  buildLivingFrameBlenderFixedAdapterPrivateFixture,
} from '../living-frame/living-frame-blender-fixed-adapter-private-fixture'
import {
  consumeLivingFrameBlenderRigPrivateRemotionSequenceLease,
  executeLivingFrameBlenderRigComponentQaInternalTest,
} from '../living-frame/living-frame-blender-rig-component-qa-internal-test'
import {
  executeLivingFrameBlenderRigPrivatePersistenceInternalTestWithArtifactSetLease,
} from '../living-frame/living-frame-blender-rig-private-persistence-internal-test'
import {
  executeLivingFrameBlenderSelectedSceneRemotionReviewInternalTest,
} from '../living-frame/living-frame-blender-selected-scene-remotion-review-internal-test'
import {
  inspectLivingFrameBlenderSelectedSceneAdmission,
  verifyLivingFrameBlenderSelectedSceneAdmission,
  type InspectLivingFrameBlenderSelectedSceneAdmissionInput,
} from '../living-frame/living-frame-blender-selected-scene-admission'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'

const fixtures =
  await createLivingFrameContractFixtures()
const selectedComponent =
  fixtures.musashiDecisiveStrike
const scene =
  selectedComponent.scenePlans[0]!
const componentId = 'musashi.body'
const masterTimingPlanId =
  selectedComponent.inputBindings
    .masterTiming.expectationRefId
const currentMasterTimingDigestSha256 =
  selectedComponent.inputBindings
    .masterTiming.expectedDigestSha256
const confirmedOutputFrameDigestSha256 =
  selectedComponent.inputBindings
    .outputFrame.expectedDigestSha256
const selectedSceneBindingDigestSha256 =
  sha256AuthorityValue({
    selectedComponentDigestSha256:
      selectedComponent.contractDigestSha256,
    sceneId: scene.sceneId,
    selectedTreatment: 'use_full',
  })
const publication = {
  binding: {
    identity: {
      workspaceId: 'workspace.musashi',
      projectId: 'project.musashi',
      editSessionId: 'edit.musashi',
    },
    sourceBindings: {
      confirmedOutputFrameDigestSha256,
      currentMasterTimingDigestSha256,
    },
    selectedComponent,
    bindingDigestSha256:
      selectedSceneBindingDigestSha256,
  },
  admission: {},
  semanticPlanProjection: {},
} as unknown as
  CanonicalLivingFrameSelectedScenePublication
const timingBindingDraft = {
  sourceBindings: {
    selectedSceneBindingDigestSha256,
    currentMasterTimingDigestSha256,
    confirmedOutputFrameDigestSha256,
  },
  fps: 30,
  scenes: [{
    sceneId: scene.sceneId,
    segmentFrameRange: range(0, 150),
    semanticPhaseBindings: [
      phase('prepare', 0, 12),
      phase('activate', 12, 20),
      phase('demonstrate', 20, 64),
      phase('resolve', 64, 72),
      phase('settle', 72, 150),
    ],
    visualTiming: {
      frameRange: range(12, 72),
      revealFrames: 8,
      holdFrames: 44,
      exitFrames: 8,
    },
  }],
}
const timingBinding = {
  ...timingBindingDraft,
  timingBindingDigestSha256:
    sha256AuthorityValue(
      timingBindingDraft,
    ),
} as unknown as
  CanonicalLivingFrameTimingBinding
const approvedSnapshotBinding:
  LivingFrameBlenderSelectedSceneApprovedSnapshotBinding = {
    approvedSnapshotId:
      'approved-snapshot.musashi.blender-rig',
    approvedSnapshotDigestSha256:
      sha256AuthorityValue(
        'approved-snapshot.musashi.blender-rig.v1',
      ),
    immutableApprovedSnapshot: true,
    confirmedFrameIncluded: true,
    masterTimingIncluded: true,
    exactRiggingPlanIncluded: true,
    exactRigActionPlanIncluded: true,
    exactCreditEstimateIncluded: true,
    exactWorkGraphIncluded: true,
  }
const provisionalFixture =
  buildLivingFrameBlenderFixedAdapterPrivateFixture({
    sceneId: scene.sceneId,
    backgroundComponentId:
      'musashi.background',
    primaryComponentId: componentId,
    virtualCameraComponentId:
      'musashi.virtual-camera',
    outputFrameId:
      selectedComponent.inputBindings
        .outputFrame.expectationRefId,
    outputFrameDigestSha256:
      confirmedOutputFrameDigestSha256,
    masterTimingPlanId,
    masterTimingPlanDigestSha256:
      currentMasterTimingDigestSha256,
    approvedSnapshotRef: {
      refId:
        approvedSnapshotBinding
          .approvedSnapshotId,
      digestSha256:
        approvedSnapshotBinding
          .approvedSnapshotDigestSha256,
    },
    selectedSceneRef: {
      refId: scene.sceneId,
      digestSha256:
        selectedSceneBindingDigestSha256,
    },
  })
const workDraft = {
  workItemKey:
    'work.living-frame.musashi.blender-rig.v1',
  workItemType:
    'build_component_rig' as const,
  sceneId: scene.sceneId,
  componentId,
  toolId: 'blender' as const,
  operationId:
    'tool.blender.render_living_frame_component_rig.v1' as const,
  approvedSnapshotDigestSha256:
    approvedSnapshotBinding
      .approvedSnapshotDigestSha256,
  selectedSceneBindingDigestSha256,
  riggingPlanDigestSha256:
    provisionalFixture.candidateRequest
      .riggingPlan.planDigestSha256,
  actionPlanDigestSha256:
    provisionalFixture.actionPlan
      .actionDigestSha256,
  confirmedOutputFrameDigestSha256,
  currentMasterTimingDigestSha256,
  oneComponentSequencePerAttempt:
    true as const,
  maxAttempts: 1 as const,
  cpuFallbackAllowed: true as const,
  approvedWorkItem: false as const,
  executablePayloadPresent:
    false as const,
}
const plannedWorkBinding:
  LivingFrameBlenderSelectedScenePlannedWorkBinding = {
    ...workDraft,
    workItemDigestSha256:
      sha256AuthorityValue(workDraft),
  }
const fixture =
  buildLivingFrameBlenderFixedAdapterPrivateFixture({
    sceneId: scene.sceneId,
    backgroundComponentId:
      'musashi.background',
    primaryComponentId: componentId,
    virtualCameraComponentId:
      'musashi.virtual-camera',
    outputFrameId:
      selectedComponent.inputBindings
        .outputFrame.expectationRefId,
    outputFrameDigestSha256:
      confirmedOutputFrameDigestSha256,
    masterTimingPlanId,
    masterTimingPlanDigestSha256:
      currentMasterTimingDigestSha256,
    approvedSnapshotRef: {
      refId:
        approvedSnapshotBinding
          .approvedSnapshotId,
      digestSha256:
        approvedSnapshotBinding
          .approvedSnapshotDigestSha256,
    },
    selectedSceneRef: {
      refId: scene.sceneId,
      digestSha256:
        selectedSceneBindingDigestSha256,
    },
    plannedWorkItemRef: {
      refId:
        plannedWorkBinding.workItemKey,
      digestSha256:
        plannedWorkBinding
          .workItemDigestSha256,
    },
  })
const admissionInput:
  InspectLivingFrameBlenderSelectedSceneAdmissionInput = {
    admissionCandidateId:
      'admission.musashi.blender-rig.private-review-v1',
    sceneId: scene.sceneId,
    componentId,
    publication,
    timingBinding,
    componentGeometryBundle:
      fixture.componentGeometryBundle,
    candidateRequest:
      fixture.candidateRequest,
    actionPlan: fixture.actionPlan,
    approvedSnapshotBinding,
    plannedWorkBinding,
  }
const admission =
  await inspectLivingFrameBlenderSelectedSceneAdmission(
    admissionInput,
  )
assert.equal(
  await verifyLivingFrameBlenderSelectedSceneAdmission(
    admission,
    admissionInput,
  ),
  true,
)
const compiled =
  compileLivingFrameBlenderFixedAdapterInternalRequest({
    candidateRequest:
      fixture.candidateRequest,
    actionPlan: fixture.actionPlan,
    componentId,
    mesh: fixture.mesh,
    material: {
      baseColorRgba:
        [0.18, 0.16, 0.13, 1],
      roughness: 0.7,
    },
    fps: 30,
    renderProfile: 'full',
  })
const adapterRun =
  runLivingFrameBlenderFixedAdapterInternalWithOutputLease(
    compiled,
  )
const persistenceRoot =
  await mkdtemp(
    join(
      tmpdir(),
      'reeditpro-lf-blender-persistence-',
    ),
  )
const reviewRoot =
  await mkdtemp(
    join(
      tmpdir(),
      'reeditpro-lf-blender-remotion-review-',
    ),
  )

try {
  const persistence =
    await executeLivingFrameBlenderRigPrivatePersistenceInternalTestWithArtifactSetLease({
      qualificationId:
        'qualification.musashi.blender-rig.review-persistence-v1',
      localStorageRoot:
        persistenceRoot,
      admission,
      admissionInput,
      adapterRun,
    })
  await assert.rejects(
    () =>
      executeLivingFrameBlenderRigComponentQaInternalTest({
        qualificationId:
          'qualification.musashi.blender-rig.forged-persistence-v1',
        admission,
        admissionInput,
        persistenceReport: {
          ...persistence.report,
          reportDigestSha256:
            '0'.repeat(64),
        },
        persistedArtifactSetLease:
          persistence
            .persistedArtifactSetLease,
      }),
    /persistence report is invalid/,
  )
  const componentQa =
    await executeLivingFrameBlenderRigComponentQaInternalTest({
      qualificationId:
        'qualification.musashi.blender-rig.component-qa-v1',
      admission,
      admissionInput,
      persistenceReport:
        persistence.report,
      persistedArtifactSetLease:
        persistence
          .persistedArtifactSetLease,
    })
  const qa = componentQa.report
  assert.equal(
    qa.exactSequenceIdentity.fileCount,
    180,
  )
  assert.equal(
    qa.decodedSampleQa
      .everySampleMaskBinarySupportExactlyMatchesRgbaAlpha,
    true,
  )
  assert.equal(
    qa.decodedSampleQa
      .everySampleMaskMatchesRgbaAlphaWithinOneCodeValue,
    true,
  )
  assert.equal(
    qa.decodedSampleQa
      .requiredReturnToInitialPoseVerified,
    true,
  )
  assert.ok(
    qa.decodedSampleQa
      .middlePoseDifferentPixelCount >
      1_000,
  )
  assert.ok(
    qa.decodedSampleQa
      .primaryMotionCentroidDisplacementPixels >
      3,
  )
  assert.equal(
    qa.authorityBoundary
      .canonicalQaApprovalAuthority,
    false,
  )

  await assert.rejects(
    () =>
      executeLivingFrameBlenderSelectedSceneRemotionReviewInternalTest({
        qualificationId:
          'qualification.musashi.blender-rig.broad-review-root-v1',
        localStorageRoot: '/',
        componentQaReport:
          qa,
        persistenceReport:
          persistence.report,
        privateRemotionSequenceLease:
          componentQa
            .privateRemotionSequenceLease,
      }),
    /owned bounded internal-test directory/,
  )
  await assert.rejects(
    () =>
      executeLivingFrameBlenderSelectedSceneRemotionReviewInternalTest({
        qualificationId:
          'qualification.musashi.blender-rig.forged-qa-v1',
        localStorageRoot: reviewRoot,
        componentQaReport: {
          ...qa,
          reportDigestSha256:
            '1'.repeat(64),
        },
        persistenceReport:
          persistence.report,
        privateRemotionSequenceLease:
          componentQa
            .privateRemotionSequenceLease,
      }),
    /component QA lineage is invalid/,
  )
  await assert.rejects(
    () =>
      executeLivingFrameBlenderSelectedSceneRemotionReviewInternalTest({
        qualificationId:
          'qualification.musashi.blender-rig.forged-lease-v1',
        localStorageRoot: reviewRoot,
        componentQaReport: qa,
        persistenceReport:
          persistence.report,
        privateRemotionSequenceLease: {
          ...componentQa
            .privateRemotionSequenceLease,
        },
      }),
    /lease is invalid, unknown, or already consumed/,
  )
  const review =
    await executeLivingFrameBlenderSelectedSceneRemotionReviewInternalTest({
      qualificationId:
        'qualification.musashi.blender-rig.remotion-review-v1',
      localStorageRoot: reviewRoot,
      componentQaReport: qa,
      persistenceReport:
        persistence.report,
      privateRemotionSequenceLease:
        componentQa
          .privateRemotionSequenceLease,
    })
  assert.equal(
    review.compositionIdentity
      .sourceComponentWidthPixels,
    1_920,
  )
  assert.equal(
    review.compositionIdentity
      .internalReviewWidthPixels,
    640,
  )
  assert.equal(
    review.compositionIdentity
      .exactConfirmedAspectRatioPreserved,
    true,
  )
  assert.equal(
    review.compositionIdentity
      .internalReviewIsFinalCustomerCanvas,
    false,
  )
  assert.equal(
    review.runtimeIdentity
      .actualRemotionRenderCount,
    4,
  )
  assert.equal(
    review.persistedMediaQa
      .readFrameCount,
    60,
  )
  assert.equal(
    review.renderedVisualQa
      .primaryMotionVisible,
    true,
  )
  assert.equal(
    review.renderedVisualQa
      .requiredReturnToInitialPoseVisible,
    true,
  )
  assert.equal(
    review.authorityBoundary
      .privateReviewApprovalAuthority,
    false,
  )
  assert.equal(
    review.authorityBoundary
      .billingAuthority,
    false,
  )
  assert.equal(
    review.productionReady,
    false,
  )
  assert.equal(
    JSON.stringify(review).includes(
      persistenceRoot,
    ),
    false,
  )
  assert.equal(
    JSON.stringify(review).includes(
      reviewRoot,
    ),
    false,
  )
  await assert.rejects(
    async () => {
      consumeLivingFrameBlenderRigPrivateRemotionSequenceLease(
        componentQa
          .privateRemotionSequenceLease,
      )
    },
    /lease is invalid, unknown, or already consumed/,
  )
  await assert.rejects(
    () =>
      executeLivingFrameBlenderRigComponentQaInternalTest({
        qualificationId:
          'qualification.musashi.blender-rig.qa-replay-v1',
        admission,
        admissionInput,
        persistenceReport:
          persistence.report,
        persistedArtifactSetLease:
          persistence
            .persistedArtifactSetLease,
      }),
    /invalid, unknown, or already consumed/,
  )
  assert.throws(
    () =>
      runLivingFrameBlenderFixedAdapterInternalWithOutputLease(
        {
          ...compiled,
          payload: {
            ...compiled.payload,
            output: {
              ...compiled.payload.output,
              widthPixels: 1_024,
              heightPixels: 1_024,
            },
          },
        },
      ),
    /compiled request integrity is invalid/,
  )

  console.log(JSON.stringify({
    smoke:
      'living_frame_blender_selected_scene_private_review_internal_test',
    status:
      'passed_private_internal_component_qa_and_remotion_review',
    sceneId: scene.sceneId,
    componentId,
    rigMode:
      qa.rigSemanticsQa.rigMode,
    sourceFrame:
      `${qa.exactSequenceIdentity.sourceWidthPixels}x${qa.exactSequenceIdentity.sourceHeightPixels}`,
    reviewFrame:
      `${review.compositionIdentity.internalReviewWidthPixels}x${review.compositionIdentity.internalReviewHeightPixels}`,
    frameRange: {
      startFrame:
        qa.exactSequenceIdentity.startFrame,
      endFrameExclusive:
        qa.exactSequenceIdentity
          .endFrameExclusive,
      durationFrames:
        qa.exactSequenceIdentity
          .durationFrames,
    },
    persistedFileCount:
      persistence.report
        .persistedArtifactSet.fileCount,
    middlePoseDifferentPixelCount:
      qa.decodedSampleQa
        .middlePoseDifferentPixelCount,
    primaryMotionCentroidDisplacementPixels:
      qa.decodedSampleQa
        .primaryMotionCentroidDisplacementPixels,
    firstFinalMeanAbsoluteDifference:
      review.renderedVisualQa
        .firstFinalMeanAbsoluteDifference,
    remotionRenderCount:
      review.runtimeIdentity
        .actualRemotionRenderCount,
    privateReviewByteLength:
      review.persistedPrivateReviewArtifact
        .byteLength,
    adversarialAssertions: 7,
    maximumAlphaMaskQuantizationPixelCount:
      Math.max(
        ...qa.decodedSampleQa.samples.map(
          (sample) =>
            sample
              .alphaMaskDifferentPixelCount,
        ),
      ),
    maximumAlphaMaskCodeValueDifference:
      Math.max(
        ...qa.decodedSampleQa.samples.map(
          (sample) =>
            sample
              .alphaMaskMaximumAbsoluteDifferenceCodeValues,
        ),
      ),
    depthSampleFiniteSubjectPixelCounts:
      qa.decodedSampleQa.samples.map(
        (sample) =>
          sample
            .finiteSubjectDepthPixelCount,
      ),
    boundedAlphaMaskAndDepthQaPassed:
      true,
    requiredReturnToInitialPosePassed:
      true,
    createOnlyPrivateReviewPersistencePassed:
      true,
    canonicalAssetManifestMutated:
      false,
    canonicalQaApproved: false,
    privateReviewApproved: false,
    actualCostCreated: false,
    customerCharged: false,
    remotionRemainsFinalCanvas: true,
    publicDeliveryReady: false,
    productionReady: false,
  }))
} finally {
  await Promise.all([
    rm(persistenceRoot, {
      recursive: true,
      force: true,
    }),
    rm(reviewRoot, {
      recursive: true,
      force: true,
    }),
  ])
}

function range(
  startFrame: number,
  endFrameExclusive: number,
) {
  return {
    startFrame,
    endFrameExclusive,
    durationFrames:
      endFrameExclusive - startFrame,
  }
}

function phase(
  phaseName:
    | 'prepare'
    | 'activate'
    | 'demonstrate'
    | 'resolve'
    | 'settle',
  startFrame: number,
  endFrameExclusive: number,
) {
  return {
    phase: phaseName,
    frameRange:
      range(
        startFrame,
        endFrameExclusive,
      ),
  }
}
