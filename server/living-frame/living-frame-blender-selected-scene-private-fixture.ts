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
  LivingFrameBlenderSelectedSceneAdmission,
  LivingFrameBlenderSelectedSceneApprovedSnapshotBinding,
  LivingFrameBlenderSelectedScenePlannedWorkBinding,
} from '../../src/types/living-frame-blender-selected-scene-admission'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  buildLivingFrameBlenderFixedAdapterPrivateFixture,
  type LivingFrameBlenderFixedAdapterPrivateFixture,
} from './living-frame-blender-fixed-adapter-private-fixture'
import {
  inspectLivingFrameBlenderSelectedSceneAdmission,
  verifyLivingFrameBlenderSelectedSceneAdmission,
  type InspectLivingFrameBlenderSelectedSceneAdmissionInput,
} from './living-frame-blender-selected-scene-admission'

export interface LivingFrameBlenderSelectedScenePrivateFixture {
  readonly sceneId: 'scene.musashi-strike'
  readonly componentId: 'musashi.body'
  readonly fixture:
    LivingFrameBlenderFixedAdapterPrivateFixture
  readonly admission:
    LivingFrameBlenderSelectedSceneAdmission
  readonly admissionInput:
    InspectLivingFrameBlenderSelectedSceneAdmissionInput
}

export async function buildLivingFrameBlenderSelectedScenePrivateFixture():
Promise<LivingFrameBlenderSelectedScenePrivateFixture> {
  if (arguments.length !== 0) {
    throw new Error(
      'Blender selected-scene private fixture accepts no caller input.',
    )
  }
  const fixtures =
    await createLivingFrameContractFixtures()
  const selectedComponent =
    fixtures.musashiDecisiveStrike
  const scene =
    selectedComponent.scenePlans[0]!
  const componentId = 'musashi.body' as const
  if (scene.sceneId !== 'scene.musashi-strike') {
    throw new Error(
      'Blender selected-scene fixture changed scene identity.',
    )
  }
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
      segmentFrameRange:
        range(0, 150),
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
  if (
    !await verifyLivingFrameBlenderSelectedSceneAdmission(
      admission,
      admissionInput,
    )
  ) {
    throw new Error(
      'Blender selected-scene private fixture admission changed.',
    )
  }
  return {
    sceneId: 'scene.musashi-strike',
    componentId,
    fixture,
    admission,
    admissionInput,
  }
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
