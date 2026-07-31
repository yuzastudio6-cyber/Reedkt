import type {
  LivingFrameComponentGeometryBundle,
} from '../../src/types/living-frame-component-geometry'
import {
  verifyLivingFrameComponentGeometryBundleDigest,
} from './living-frame-component-geometry'
import type {
  LivingFrameRigActionPlan,
} from '../../src/types/living-frame-rig-action'
import type {
  LivingFrameRiggingAdapterCandidateRequest,
} from '../../src/types/living-frame-rigging-adapter-candidate'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import type {
  CanonicalLivingFrameTimingBinding,
} from '../../src/types/living-frame-timing-binding'
import {
  LIVING_FRAME_BLENDER_RIG_OPERATION_ID,
  LIVING_FRAME_BLENDER_SELECTED_SCENE_ADMISSION_CLASS,
  LIVING_FRAME_BLENDER_SELECTED_SCENE_ADMISSION_OPEN_GATES,
  LIVING_FRAME_BLENDER_SELECTED_SCENE_ADMISSION_STATE,
  LIVING_FRAME_BLENDER_SELECTED_SCENE_ADMISSION_VERSION,
  LIVING_FRAME_BLENDER_TOOL_ID,
  type LivingFrameBlenderSelectedSceneAdmission,
  type LivingFrameBlenderSelectedSceneAdmissionAuthorityBoundary,
  type LivingFrameBlenderSelectedSceneAdmissionDraft,
  type LivingFrameBlenderSelectedSceneAdmissionIssue,
  type LivingFrameBlenderSelectedSceneAdmissionIssueCode,
  type LivingFrameBlenderSelectedSceneApprovedSnapshotBinding,
  type LivingFrameBlenderSelectedScenePlannedWorkBinding,
} from '../../src/types/living-frame-blender-selected-scene-admission'
import {
  validateLivingFrameProfessionalSkillComponent,
} from '../../src/lib/living-frame/living-frame-contract'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameRigActionPlan,
} from './living-frame-rig-action'
import {
  verifyLivingFrameRiggingAdapterCandidate,
} from './living-frame-rigging-adapter-candidate'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u

const AUTHORITY_BOUNDARY:
  LivingFrameBlenderSelectedSceneAdmissionAuthorityBoundary =
  deepFreeze({
    serverDerivedAdmissionCandidateAuthority: true,
    selectedSceneAuthority: false,
    approvedSnapshotAuthority: false,
    masterTimingAuthority: false,
    exactFrameAuthority: false,
    riggingPlanAuthority: false,
    rigActionAuthority: false,
    toolRegistryAuthority: false,
    operationRegistryAuthority: false,
    estimateAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    dispatchAuthority: false,
    runtimeAuthority: false,
    artifactPersistenceAuthority: false,
    assetManifestAuthority: false,
    qaApprovalAuthority: false,
    privateReviewAuthority: false,
    rendererAuthority: false,
    finalCanvasAuthority: false,
    costAuthority: false,
    billingAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  })

export interface InspectLivingFrameBlenderSelectedSceneAdmissionInput {
  readonly admissionCandidateId: string
  readonly sceneId: string
  readonly componentId: string
  readonly publication:
    CanonicalLivingFrameSelectedScenePublication
  readonly timingBinding:
    CanonicalLivingFrameTimingBinding
  readonly componentGeometryBundle:
    LivingFrameComponentGeometryBundle
  readonly candidateRequest:
    LivingFrameRiggingAdapterCandidateRequest
  readonly actionPlan: LivingFrameRigActionPlan
  readonly approvedSnapshotBinding:
    LivingFrameBlenderSelectedSceneApprovedSnapshotBinding
  readonly plannedWorkBinding:
    LivingFrameBlenderSelectedScenePlannedWorkBinding
}

export class LivingFrameBlenderSelectedSceneAdmissionError
  extends Error {
  readonly issues:
    readonly LivingFrameBlenderSelectedSceneAdmissionIssue[]

  constructor(
    issues:
      readonly LivingFrameBlenderSelectedSceneAdmissionIssue[],
  ) {
    super(
      'Living Frame Blender selected-scene admission inspection failed.',
    )
    this.name =
      'LivingFrameBlenderSelectedSceneAdmissionError'
    this.issues = issues
  }
}

export async function inspectLivingFrameBlenderSelectedSceneAdmission(
  input: InspectLivingFrameBlenderSelectedSceneAdmissionInput,
): Promise<LivingFrameBlenderSelectedSceneAdmission> {
  assertInput(input)
  const validation =
    await validateLivingFrameProfessionalSkillComponent(
      input.publication.binding.selectedComponent,
    )
  if (!validation.ok) {
    throw invalid(
      'selected_scene_or_component_mismatch',
      '$.publication.binding.selectedComponent',
    )
  }
  const selectedComponent = validation.component
  const scene = selectedComponent.scenePlans.find(
    (candidate) =>
      candidate.sceneId === input.sceneId,
  )
  const component = scene?.components.find(
    (candidate) =>
      candidate.componentId === input.componentId,
  )
  if (
    !scene
    || !component
    || ![
      'primary_subject',
      'mechanical_component',
      'supporting_object',
    ].includes(component.role)
  ) {
    throw invalid(
      'selected_scene_or_component_mismatch',
      '$.sceneId',
    )
  }
  const activation = scene.skillActivations.find(
    (candidate) =>
      candidate.miniSkillKey === 'component_rigging'
      && candidate.linkedComponentIds.includes(
        component.componentId,
      )
      && [
        'use_full',
        'use_subtle',
        'use_optional',
      ].includes(candidate.decision),
  )
  if (!activation) {
    throw invalid(
      'component_rigging_activation_missing',
      '$.publication.binding.selectedComponent.scenePlans.skillActivations',
    )
  }
  assertCandidateAndAction(
    input,
    selectedComponent.contractDigestSha256,
  )
  const timingScene =
    input.timingBinding.scenes.find(
      (candidate) =>
        candidate.sceneId === scene.sceneId,
    )
  if (!timingScene) {
    throw invalid(
      'master_timing_mismatch',
      '$.timingBinding.scenes',
    )
  }
  const outputFrame =
    input.componentGeometryBundle.outputFrameExpectation
  const rigPlan = input.candidateRequest.riggingPlan
  if (
    ![
      'deformable_2d_character',
      'armature_2_5d_character',
    ].includes(rigPlan.rigMode)
    ||
    outputFrame.widthPixels !==
      selectedComponent.inputBindings.outputFrame
        .expectedWidth
    || outputFrame.heightPixels !==
      selectedComponent.inputBindings.outputFrame
        .expectedHeight
    || outputFrame.outputFrameDigestSha256 !==
      selectedComponent.inputBindings.outputFrame
        .expectedDigestSha256
    || outputFrame.outputFrameDigestSha256 !==
      rigPlan.sourceBindings.outputFrameDigestSha256
    || rigPlan.outputContract.widthPixels !==
      outputFrame.widthPixels
    || rigPlan.outputContract.heightPixels !==
      outputFrame.heightPixels
  ) {
    throw invalid(
      'confirmed_frame_mismatch',
      '$.componentGeometryBundle.outputFrameExpectation',
    )
  }
  const visualRange =
    timingScene.visualTiming.frameRange
  if (
    input.timingBinding.sourceBindings
      .currentMasterTimingDigestSha256 !==
      rigPlan.sourceBindings
        .masterTimingPlanDigestSha256
    || input.actionPlan.sourceBindings
      .masterTimingPlanDigestSha256 !==
      rigPlan.sourceBindings
        .masterTimingPlanDigestSha256
    || input.actionPlan.sourceBindings.startFrame !==
      visualRange.startFrame
    || input.actionPlan.sourceBindings
      .endFrameExclusive !==
      visualRange.endFrameExclusive
    || rigPlan.outputContract.startFrame !==
      visualRange.startFrame
    || rigPlan.outputContract.endFrameExclusive !==
      visualRange.endFrameExclusive
  ) {
    throw invalid(
      'master_timing_mismatch',
      '$.timingBinding.scenes.visualTiming',
    )
  }
  assertWorkBinding(input)
  const sourceBindings = {
    selectedSceneBindingDigestSha256:
      input.publication.binding.bindingDigestSha256,
    livingFrameComponentDigestSha256:
      selectedComponent.contractDigestSha256,
    confirmedOutputFrameDigestSha256:
      outputFrame.outputFrameDigestSha256,
    currentMasterTimingDigestSha256:
      input.timingBinding.sourceBindings
        .currentMasterTimingDigestSha256,
    timingBindingDigestSha256:
      input.timingBinding.timingBindingDigestSha256,
    componentGeometryBundleDigestSha256:
      input.componentGeometryBundle.bundleDigestSha256,
    riggingDirectionDigestSha256:
      rigPlan.sourceBindings
        .riggingDirectionDigestSha256,
    riggingPlanDigestSha256:
      rigPlan.planDigestSha256,
    actionPlanDigestSha256:
      input.actionPlan.actionDigestSha256,
    adapterCandidateRequestDigestSha256:
      input.candidateRequest.requestDigestSha256,
    approvedSnapshotDigestSha256:
      input.approvedSnapshotBinding
        .approvedSnapshotDigestSha256,
    plannedWorkItemDigestSha256:
      input.plannedWorkBinding
        .workItemDigestSha256,
  }
  const draft:
    LivingFrameBlenderSelectedSceneAdmissionDraft = {
      contractVersion:
        LIVING_FRAME_BLENDER_SELECTED_SCENE_ADMISSION_VERSION,
      resultClass:
        LIVING_FRAME_BLENDER_SELECTED_SCENE_ADMISSION_CLASS,
      admissionState:
        LIVING_FRAME_BLENDER_SELECTED_SCENE_ADMISSION_STATE,
      admissionCandidateId:
        input.admissionCandidateId,
      canonicalScope: {
        workspaceId:
          input.publication.binding.identity.workspaceId,
        projectId:
          input.publication.binding.identity.projectId,
        editSessionId:
          input.publication.binding.identity.editSessionId,
        sceneId: scene.sceneId,
        componentId: component.componentId,
      },
      sourceBindings,
      selectedRigIntent: {
        componentRole:
          component.role as
            | 'primary_subject'
            | 'mechanical_component'
            | 'supporting_object',
        componentRiggingActivationId:
          activation.activationId,
        rigMode:
          rigPlan.rigMode as
            | 'deformable_2d_character'
            | 'armature_2_5d_character',
        primaryActionTrackCount: 1,
        finalPosePolicy:
          input.actionPlan.finalPosePolicy,
        onePrimaryActionAtATime: true,
        masterTimingOwnsEveryFrame: true,
      },
      exactFrameBinding: {
        widthPixels: outputFrame.widthPixels,
        heightPixels: outputFrame.heightPixels,
        fps: input.timingBinding.fps,
        startFrame: visualRange.startFrame,
        endFrameExclusive:
          visualRange.endFrameExclusive,
        durationFrames:
          visualRange.durationFrames,
        visualRangeMatchesRigAction: true,
        squareSubstitutionForbidden: true,
        finalCanvasDelegationForbidden: true,
      },
      operationCandidate: {
        toolId: LIVING_FRAME_BLENDER_TOOL_ID,
        operationId:
          LIVING_FRAME_BLENDER_RIG_OPERATION_ID,
        fixedAdapterProfile:
          'server_owned_fixed_bpy_rig_adapter_v1',
        workItemType: 'build_component_rig',
        executionPlacement:
          'private_isolated_cpu_render_worker',
        oneAttemptOneComponentSequenceOneCostEvent:
          true,
        outputArtifactTypes: [
          'living_frame_rigged_component_rgba_sequence',
          'living_frame_rigged_component_mask_sequence',
          'living_frame_rigged_component_depth_sequence',
          'living_frame_rigged_component_sequence_manifest',
        ],
        remotionRemainsFinalCanvas: true,
      },
      approvedSnapshotBinding:
        structuredClone(
          input.approvedSnapshotBinding,
        ),
      plannedWorkBinding:
        structuredClone(input.plannedWorkBinding),
      canonicalOwnerDisposition: {
        currentEstimateProjectionIncludesBlender:
          false,
        currentWorkGraphProjectionIncludesBlender:
          false,
        currentAssetManifestIncludesRigSequence:
          false,
        canonicalOwnerReconciliationRequired: true,
        noParallelApprovedSnapshotOwnerCreated: true,
        noParallelMasterTimingOwnerCreated: true,
        noParallelWorkGraphOwnerCreated: true,
        noParallelAssetManifestOwnerCreated: true,
        noParallelCostOwnerCreated: true,
        noParallelPrivateReviewOwnerCreated: true,
      },
      authorityBoundary: AUTHORITY_BOUNDARY,
      operationRegistered: false,
      canonicalWorkAdmitted: false,
      dispatchGranted: false,
      runtimeAuthorityGranted: false,
      canonicalArtifactPersistenceGranted:
        false,
      assetManifestMutated: false,
      canonicalQaApproved: false,
      privateReviewApproved: false,
      actualCostCreated: false,
      customerCharged: false,
      publicDeliveryReady: false,
      containsRawChatTranscriptMediaBytesPathsUrlsCredentialsCommandsEnvironmentOrExecutableCode:
        false,
      openGateCodes:
        LIVING_FRAME_BLENDER_SELECTED_SCENE_ADMISSION_OPEN_GATES,
      productionReady: false,
    }
  assertDraft(draft)
  return deepFreeze({
    ...draft,
    admissionDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export async function verifyLivingFrameBlenderSelectedSceneAdmission(
  value: unknown,
  input: InspectLivingFrameBlenderSelectedSceneAdmissionInput,
): Promise<boolean> {
  try {
    if (
      !isRecord(value)
      || typeof value.admissionDigestSha256
        !== 'string'
      || !SHA256.test(
        value.admissionDigestSha256,
      )
      || value.admissionDigestSha256 !==
        sha256AuthorityValue(
          withoutDigest(value),
        )
    ) return false
    const expected =
      await inspectLivingFrameBlenderSelectedSceneAdmission(
        input,
      )
    return stableAuthorityStringify(value)
      === stableAuthorityStringify(expected)
  } catch {
    return false
  }
}

function assertInput(
  input: InspectLivingFrameBlenderSelectedSceneAdmissionInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'admissionCandidateId',
      'sceneId',
      'componentId',
      'publication',
      'timingBinding',
      'componentGeometryBundle',
      'candidateRequest',
      'actionPlan',
      'approvedSnapshotBinding',
      'plannedWorkBinding',
    ])
    || !SAFE_ID.test(input.admissionCandidateId)
    || !SAFE_ID.test(input.sceneId)
    || !SAFE_ID.test(input.componentId)
    || !verifyLivingFrameComponentGeometryBundleDigest(
      input.componentGeometryBundle,
    )
    || !verifyLivingFrameRiggingAdapterCandidate(
      input.candidateRequest,
    )
    || !verifyLivingFrameRigActionPlan(
      input.actionPlan,
      input.candidateRequest.riggingPlan,
    )
    || !validApprovedSnapshotBinding(
      input.approvedSnapshotBinding,
    )
  ) {
    throw invalid('input_invalid', '$')
  }
}

function assertCandidateAndAction(
  input: InspectLivingFrameBlenderSelectedSceneAdmissionInput,
  selectedComponentDigestSha256: string,
): void {
  const publication = input.publication.binding
  const candidate = input.candidateRequest
  const plan = candidate.riggingPlan
  if (
    !SHA256.test(publication.bindingDigestSha256)
    || candidate.adapterBinding.backend !==
      'blender_headless_candidate'
    || candidate.adapterBinding.candidateToolId !==
      LIVING_FRAME_BLENDER_TOOL_ID
    || candidate.adapterBinding.candidateOperationId !==
      LIVING_FRAME_BLENDER_RIG_OPERATION_ID
    || candidate.sourceBindings.sceneId !==
      input.sceneId
    || plan.sourceBindings.sceneId !== input.sceneId
    || input.actionPlan.sourceBindings.sceneId !==
      input.sceneId
    || candidate.sourceBindings.selectedSceneRef
      .digestSha256 !==
      publication.bindingDigestSha256
    || candidate.sourceBindings.approvedSnapshotRef
      .digestSha256 !==
      input.approvedSnapshotBinding
        .approvedSnapshotDigestSha256
    || candidate.sourceBindings.plannedWorkItemRef
      .digestSha256 !==
      input.plannedWorkBinding.workItemDigestSha256
    || plan.sourceBindings.geometryBundleDigestSha256 !==
      input.componentGeometryBundle.bundleDigestSha256
    || candidate.sourceBindings
      .outputFrameDigestSha256 !==
      input.componentGeometryBundle
        .outputFrameExpectation
        .outputFrameDigestSha256
    || publication.selectedComponent
      .contractDigestSha256 !==
      selectedComponentDigestSha256
    || !candidate.outputSelection
      .approvedRiggedComponentIds
      .includes(input.componentId)
    || candidate.outputSelection
      .excludedStaticAnchorComponentIds
      .includes(input.componentId)
    || !plan.partBindings.some((part) =>
      part.componentId === input.componentId
      && part.deformable)
    || !plan.meshBindings.some((mesh) =>
      mesh.componentId === input.componentId)
    || input.actionPlan.tracks.filter(
      (track) => track.role === 'primary',
    ).length !== 1
  ) {
    throw invalid(
      'selected_scene_lineage_mismatch',
      '$.candidateRequest.sourceBindings',
    )
  }
}

function assertWorkBinding(
  input: InspectLivingFrameBlenderSelectedSceneAdmissionInput,
): void {
  const work = input.plannedWorkBinding
  const {
    workItemDigestSha256,
    ...workDraft
  } = work
  if (
    !hasExactKeys(
      work as unknown as Record<string, unknown>,
      [
        'workItemKey',
        'workItemDigestSha256',
        'workItemType',
        'sceneId',
        'componentId',
        'toolId',
        'operationId',
        'approvedSnapshotDigestSha256',
        'selectedSceneBindingDigestSha256',
        'riggingPlanDigestSha256',
        'actionPlanDigestSha256',
        'confirmedOutputFrameDigestSha256',
        'currentMasterTimingDigestSha256',
        'oneComponentSequencePerAttempt',
        'maxAttempts',
        'cpuFallbackAllowed',
        'approvedWorkItem',
        'executablePayloadPresent',
      ],
    )
    ||
    !SAFE_ID.test(work.workItemKey)
    || !SHA256.test(workItemDigestSha256)
    || workItemDigestSha256 !==
      sha256AuthorityValue(workDraft)
    || work.workItemType !==
      'build_component_rig'
    || work.sceneId !== input.sceneId
    || work.componentId !== input.componentId
    || work.toolId !== LIVING_FRAME_BLENDER_TOOL_ID
    || work.operationId !==
      LIVING_FRAME_BLENDER_RIG_OPERATION_ID
    || work.approvedSnapshotDigestSha256 !==
      input.approvedSnapshotBinding
        .approvedSnapshotDigestSha256
    || work.selectedSceneBindingDigestSha256 !==
      input.publication.binding.bindingDigestSha256
    || work.riggingPlanDigestSha256 !==
      input.candidateRequest.riggingPlan
        .planDigestSha256
    || work.actionPlanDigestSha256 !==
      input.actionPlan.actionDigestSha256
    || work.confirmedOutputFrameDigestSha256 !==
      input.componentGeometryBundle
        .outputFrameExpectation
        .outputFrameDigestSha256
    || work.currentMasterTimingDigestSha256 !==
      input.timingBinding.sourceBindings
        .currentMasterTimingDigestSha256
    || work.approvedWorkItem
    || work.executablePayloadPresent
  ) {
    throw invalid(
      'planned_work_binding_mismatch',
      '$.plannedWorkBinding',
    )
  }
}

function validApprovedSnapshotBinding(
  value:
    LivingFrameBlenderSelectedSceneApprovedSnapshotBinding,
): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'approvedSnapshotId',
      'approvedSnapshotDigestSha256',
      'immutableApprovedSnapshot',
      'confirmedFrameIncluded',
      'masterTimingIncluded',
      'exactRiggingPlanIncluded',
      'exactRigActionPlanIncluded',
      'exactCreditEstimateIncluded',
      'exactWorkGraphIncluded',
    ])
    && SAFE_ID.test(value.approvedSnapshotId)
    && SHA256.test(
      value.approvedSnapshotDigestSha256,
    )
    && value.immutableApprovedSnapshot === true
    && value.confirmedFrameIncluded === true
    && value.masterTimingIncluded === true
    && value.exactRiggingPlanIncluded === true
    && value.exactRigActionPlanIncluded === true
    && value.exactCreditEstimateIncluded === true
    && value.exactWorkGraphIncluded === true
}

function assertDraft(
  draft: LivingFrameBlenderSelectedSceneAdmissionDraft,
): void {
  if (
    draft.operationRegistered
    || draft.canonicalWorkAdmitted
    || draft.dispatchGranted
    || draft.runtimeAuthorityGranted
    || draft.canonicalArtifactPersistenceGranted
    || draft.assetManifestMutated
    || draft.canonicalQaApproved
    || draft.privateReviewApproved
    || draft.actualCostCreated
    || draft.customerCharged
    || draft.publicDeliveryReady
    || draft.productionReady
    || draft.operationCandidate.toolId !==
      LIVING_FRAME_BLENDER_TOOL_ID
    || draft.operationCandidate.operationId !==
      LIVING_FRAME_BLENDER_RIG_OPERATION_ID
    || stableAuthorityStringify(
      draft.openGateCodes,
    ) !== stableAuthorityStringify(
      LIVING_FRAME_BLENDER_SELECTED_SCENE_ADMISSION_OPEN_GATES,
    )
    || Object.entries(draft.authorityBoundary)
      .some(([key, value]) =>
        key ===
          'serverDerivedAdmissionCandidateAuthority'
          ? value !== true
          : value !== false)
  ) {
    throw invalid(
      'authority_promotion_forbidden',
      '$.authorityBoundary',
    )
  }
}

function withoutDigest(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const copy = { ...value }
  delete copy.admissionDigestSha256
  return copy
}

function invalid(
  code: LivingFrameBlenderSelectedSceneAdmissionIssueCode,
  path: string,
): LivingFrameBlenderSelectedSceneAdmissionError {
  return new LivingFrameBlenderSelectedSceneAdmissionError([
    { code, path },
  ])
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return value != null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return Object.keys(value).sort().join('|')
    === [...keys].sort().join('|')
}

function deepFreeze<T>(value: T): T {
  if (
    value == null
    || typeof value !== 'object'
    || Object.isFrozen(value)
  ) return value
  Object.freeze(value)
  for (const nested of Object.values(
    value as Record<string, unknown>,
  )) deepFreeze(nested)
  return value
}
