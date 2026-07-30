import type {
  LivingFrameSkillActivation,
  LivingFrameTimingPhase,
} from '../../src/types/living-frame'
import type {
  LivingFrameComponentGeometryBundle,
  LivingFrameCompiledGeometryComponent,
} from '../../src/types/living-frame-component-geometry'
import {
  verifyLivingFrameComponentGeometryBundleDigest,
} from './living-frame-component-geometry'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import type {
  LivingFrameSelectedSceneSelectiveMotionReconciliation,
} from '../../src/types/living-frame-selected-scene-selective-motion-reconciliation'
import type {
  CanonicalLivingFrameTimingBinding,
} from '../../src/types/living-frame-timing-binding'
import {
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_CANDIDATE_OPERATION_ID,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_CURRENT_OPERATION_ID,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_MISMATCH_CODES,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPEN_GATES,
  LIVING_FRAME_ENVIRONMENTAL_PARTICLE_TOOL_ID,
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_ADMISSION_CLASS,
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_ADMISSION_STATE,
  LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_ADMISSION_VERSION,
  type LivingFrameEnvironmentalParticleAdmission,
  type LivingFrameEnvironmentalParticleAdmissionDraft,
  type LivingFrameEnvironmentalParticleAdmissionIssue,
  type LivingFrameEnvironmentalParticleAuthority,
  type LivingFrameEnvironmentalParticleIssueCode,
} from '../../src/types/living-frame-selected-scene-environmental-particle-admission'
import {
  validateLivingFrameProfessionalSkillComponent,
} from '../../src/lib/living-frame/living-frame-contract'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u

const AUTHORITY_BOUNDARY:
  LivingFrameEnvironmentalParticleAuthority =
  deepFreeze({
    readOnlyAdmissionCandidateAuthority: true,
    selectedSceneAuthority: false,
    environmentalProfileSelectionAuthority: false,
    motionPlanningAuthority: false,
    motionBudgetAuthority: false,
    timingAuthority: false,
    geometryAuthority: false,
    operationRegistryAuthority: false,
    toolRegistryAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    dispatchAuthority: false,
    runtimeAuthority: false,
    artifactAuthority: false,
    assetManifestAuthority: false,
    rendererAuthority: false,
    privateReviewAuthority: false,
    qaApprovalAuthority: false,
    costAuthority: false,
    billingAuthority: false,
    productionAuthority: false,
  })

export interface InspectLivingFrameEnvironmentalParticleAdmissionInput {
  readonly admissionCandidateId: string
  readonly sceneId: string
  readonly componentId: string
  readonly publication:
    CanonicalLivingFrameSelectedScenePublication
  readonly timingBinding:
    CanonicalLivingFrameTimingBinding
  readonly componentGeometryBundle:
    LivingFrameComponentGeometryBundle
  readonly selectiveMotionReconciliation:
    LivingFrameSelectedSceneSelectiveMotionReconciliation
}

export class LivingFrameEnvironmentalParticleAdmissionError
  extends Error {
  readonly issues:
    readonly LivingFrameEnvironmentalParticleAdmissionIssue[]

  constructor(
    issues:
      readonly LivingFrameEnvironmentalParticleAdmissionIssue[],
  ) {
    super(
      'Living Frame environmental-particle admission inspection failed.',
    )
    this.name =
      'LivingFrameEnvironmentalParticleAdmissionError'
    this.issues = issues
  }
}

export async function inspectLivingFrameEnvironmentalParticleAdmission(
  input: InspectLivingFrameEnvironmentalParticleAdmissionInput,
): Promise<LivingFrameEnvironmentalParticleAdmission> {
  assertInput(input)
  const validation =
    await validateLivingFrameProfessionalSkillComponent(
      input.publication.binding.selectedComponent,
    )
  if (!validation.ok) {
    throw invalid(
      'selected_component_invalid',
      '$.publication.binding.selectedComponent',
    )
  }
  const selectedComponent = validation.component
  const scene = selectedComponent.scenePlans.find(
    (candidate) => candidate.sceneId === input.sceneId,
  )
  const component = scene?.components.find(
    (candidate) =>
      candidate.componentId === input.componentId,
  )
  if (
    !scene
    || !component
    || !['environmental_effect', 'atmosphere']
      .includes(component.role)
  ) {
    throw invalid(
      'scene_or_component_mismatch',
      '$.sceneId',
    )
  }
  assertLineage(input, selectedComponent.contractDigestSha256)
  const activation = selectEnvironmentalActivation(
    scene.skillActivations,
    component.componentId,
  )
  if (!activation) {
    throw invalid(
      'environmental_activation_missing',
      '$.publication.binding.selectedComponent.scenePlans.skillActivations',
    )
  }
  if (
    !component.capabilityKeys.includes(
      'deterministic_particle_effects',
    )
  ) {
    throw invalid(
      'particle_capability_missing',
      '$.publication.binding.selectedComponent.scenePlans.components.capabilityKeys',
    )
  }
  const geometry = selectGeometry(
    input.componentGeometryBundle,
    component.componentId,
    component.role,
  )
  const timing = deriveTiming({
    scene,
    activation,
    timingBinding: input.timingBinding,
  })
  const reconciliationUnit =
    input.selectiveMotionReconciliation.units.find(
      (candidate) =>
        candidate.sceneId === scene.sceneId
        && candidate.componentId === component.componentId,
    )
  if (
    !reconciliationUnit
    || reconciliationUnit.role !== component.role
    || !reconciliationUnit.selectedMotionIntent
      .environmentalMotionSelected
    || !reconciliationUnit.selectedMotionIntent
      .environmentalParticleOrApprovedFallbackRequired
  ) {
    throw invalid(
      'selective_motion_reconciliation_invalid',
      '$.selectiveMotionReconciliation.units',
    )
  }
  const sourceBindings = {
    selectedSceneBindingDigestSha256:
      input.publication.binding.bindingDigestSha256,
    livingFrameComponentDigestSha256:
      selectedComponent.contractDigestSha256,
    currentMasterTimingDigestSha256:
      input.timingBinding.sourceBindings
        .currentMasterTimingDigestSha256,
    timingBindingDigestSha256:
      input.timingBinding.timingBindingDigestSha256,
    componentGeometryBundleDigestSha256:
      input.componentGeometryBundle.bundleDigestSha256,
    selectiveMotionReconciliationDigestSha256:
      input.selectiveMotionReconciliation
        .reconciliationDigestSha256,
    confirmedOutputFrameDigestSha256:
      input.componentGeometryBundle.outputFrameExpectation
        .outputFrameDigestSha256,
  }
  const deterministicServerSeedDigestSha256 =
    sha256AuthorityValue({
      purpose:
        'living_frame_environmental_particle_server_seed_v1',
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
      candidateOperationId:
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_CANDIDATE_OPERATION_ID,
    })
  const outputFrame =
    input.componentGeometryBundle.outputFrameExpectation
  const draft:
    LivingFrameEnvironmentalParticleAdmissionDraft = {
      contractVersion:
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_ADMISSION_VERSION,
      resultClass:
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_ADMISSION_CLASS,
      admissionState:
        LIVING_FRAME_SELECTED_SCENE_ENVIRONMENTAL_PARTICLE_ADMISSION_STATE,
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
      selectedEnvironmentalIntent: {
        componentRole: component.role,
        focalRole: component.focalRole,
        depthBand: component.depthBand,
        environmentalMotionActivationId:
          activation.activationId,
        deterministicParticleCapabilityConfirmed: true,
        linkedSemanticTimingRequestIds:
          [...activation.linkedTimingRequestIds],
        linkedSemanticPhases: timing.phases,
        motionBudgetRole: 'ambient',
        oneEnvironmentalMotionGroupMaximum: true,
        boundedParticleCountRequired: true,
        stillnessOutsideBoundFrameRangeRequired: true,
      },
      exactFrameAndGeometryBinding: {
        widthPixels: outputFrame.widthPixels,
        heightPixels: outputFrame.heightPixels,
        fps: input.timingBinding.fps,
        startFrame: timing.startFrame,
        endFrameExclusive: timing.endFrameExclusive,
        durationFrames:
          timing.endFrameExclusive - timing.startFrame,
        rect: { ...geometry.rect! },
        pivot: { ...geometry.pivot! },
        anchorPoint: { ...geometry.anchorPoint! },
      },
      requiredPrimitiveContract: {
        motionProperty:
          'particle_emission_normalized',
        sceneArtifactKind:
          'procedural_alpha_primitive',
        rendererLayerPrimitive:
          'procedural_alpha_layer',
        alphaExpectation:
          'time_sampled_transparent_rgba_or_equivalent_deterministic_primitive',
        exactConfirmedFrameRequired: true,
        frameAccurateMasterTimingRequired: true,
        deterministicServerSeedDigestSha256,
        callerSeedForbidden: true,
        callerParticleSettingsForbidden: true,
        callerDimensionsForbidden: true,
        callerPromptPathsUrlsBytesCredentialsCommandsOrEnvironmentForbidden:
          true,
      },
      typedEffectProfileBinding: {
        status:
          'missing_from_current_selected_scene_component_contract',
        componentSummaryParsingForbidden: true,
        componentIdParsingForbidden: true,
        subjectOrGenreInferenceForbidden: true,
        immutableApprovedProfileRefRequired: true,
        exactPhysicsAndAppearanceValuesRemainCanonicalOwnerDecision:
          true,
      },
      toolOperationDisposition: {
        existingToolId:
          LIVING_FRAME_ENVIRONMENTAL_PARTICLE_TOOL_ID,
        existingOperationId:
          LIVING_FRAME_ENVIRONMENTAL_PARTICLE_CURRENT_OPERATION_ID,
        candidateOperationId:
          LIVING_FRAME_ENVIRONMENTAL_PARTICLE_CANDIDATE_OPERATION_ID,
        separateToolIdentityRequired: false,
        currentOperationOutput:
          'one_opaque_640x360_motion_card_png',
        requiredOutput:
          'private_time_sampled_transparent_particle_primitive',
        oneApprovedPrimitiveWorkItemPerAttemptRequired: true,
        remotionRemainsFinalCanvas: true,
        mismatchCodes:
          LIVING_FRAME_ENVIRONMENTAL_PARTICLE_MISMATCH_CODES,
      },
      currentSharedInterfaceConflictObserved: true,
      materializationAllowed: false,
      operationRegistered: false,
      dispatchGranted: false,
      runtimeExecuted: false,
      artifactPersisted: false,
      assetManifestMutated: false,
      remotionAdapterMutated: false,
      qaApproved: false,
      privateReviewApproved: false,
      actualCostCreated: false,
      customerCharged: false,
      openGateCodes:
        LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPEN_GATES,
      authorityBoundary: AUTHORITY_BOUNDARY,
      containsRawChatTranscriptMediaBytesPathsUrlsCredentialsCommandsOrEnvironment:
        false,
      subjectSpecificRouting: false,
      productionReady: false,
    }
  assertDraft(draft)
  return deepFreeze({
    ...draft,
    admissionDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export async function verifyLivingFrameEnvironmentalParticleAdmission(
  value: unknown,
  input: InspectLivingFrameEnvironmentalParticleAdmissionInput,
): Promise<boolean> {
  try {
    if (
      !isRecord(value)
      || typeof value.admissionDigestSha256 !== 'string'
      || !SHA256.test(value.admissionDigestSha256)
      || value.admissionDigestSha256 !==
        sha256AuthorityValue(withoutDigest(value))
    ) return false
    const expected =
      await inspectLivingFrameEnvironmentalParticleAdmission(input)
    return stableAuthorityStringify(value) ===
      stableAuthorityStringify(expected)
  } catch {
    return false
  }
}

function assertInput(
  input: InspectLivingFrameEnvironmentalParticleAdmissionInput,
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
      'selectiveMotionReconciliation',
    ])
    || !SAFE_ID.test(input.admissionCandidateId)
    || !SAFE_ID.test(input.sceneId)
    || !SAFE_ID.test(input.componentId)
    || !verifyLivingFrameComponentGeometryBundleDigest(
      input.componentGeometryBundle,
    )
  ) {
    throw invalid('input_invalid', '$')
  }
}

function assertLineage(
  input: InspectLivingFrameEnvironmentalParticleAdmissionInput,
  selectedComponentDigestSha256: string,
): void {
  const publication = input.publication.binding
  const timing = input.timingBinding
  const geometry = input.componentGeometryBundle
  const reconciliation =
    input.selectiveMotionReconciliation
  if (
    !SHA256.test(publication.bindingDigestSha256)
    || publication.sourceBindings
      .confirmedOutputFrameDigestSha256
      !== geometry.outputFrameExpectation
        .outputFrameDigestSha256
    || publication.selectedComponent.inputBindings.outputFrame
      .expectedDigestSha256
      !== geometry.outputFrameExpectation
        .outputFrameDigestSha256
    || publication.sourceBindings
      .currentMasterTimingDigestSha256
      !== timing.sourceBindings
        .currentMasterTimingDigestSha256
    || timing.sourceBindings.selectedSceneBindingDigestSha256
      !== publication.bindingDigestSha256
    || reconciliation.sourceBindings
      .selectedSceneBindingDigestSha256
      !== publication.bindingDigestSha256
    || reconciliation.sourceBindings
      .livingFrameComponentDigestSha256
      !== selectedComponentDigestSha256
    || reconciliation.sourceBindings
      .currentMasterTimingDigestSha256
      !== timing.sourceBindings
        .currentMasterTimingDigestSha256
    || reconciliation.sourceBindings
      .timingBindingDigestSha256
      !== timing.timingBindingDigestSha256
    || reconciliation.canonicalScope.sceneId !== input.sceneId
    || reconciliation.reconciliationDigestSha256 !==
      sha256AuthorityValue(withoutDigest(reconciliation))
    || geometry.motionBinding.motionSceneId !== input.sceneId
  ) {
    throw invalid(
      'source_lineage_mismatch',
      '$.sourceBindings',
    )
  }
}

function selectEnvironmentalActivation(
  activations: readonly LivingFrameSkillActivation[],
  componentId: string,
): LivingFrameSkillActivation | undefined {
  const candidates = activations.filter(
    (activation) =>
      activation.miniSkillKey === 'environmental_motion'
      && activation.linkedComponentIds.includes(componentId)
      && ['use_full', 'use_subtle', 'use_optional']
        .includes(activation.decision),
  )
  return candidates.length === 1
    ? candidates[0]
    : undefined
}

function selectGeometry(
  bundle: LivingFrameComponentGeometryBundle,
  componentId: string,
  expectedRole: 'environmental_effect' | 'atmosphere',
): LivingFrameCompiledGeometryComponent {
  const geometry = bundle.components.find(
    (candidate) =>
      candidate.componentId === componentId,
  )
  if (
    !geometry
    || geometry.role !== expectedRole
    || geometry.kind !== 'visual_component'
    || geometry.rect == null
    || geometry.pivot == null
    || geometry.anchorPoint == null
    || geometry.transparencyExpectation !==
      'procedural_alpha'
    || geometry.alphaSourceExpectation !==
      'procedural_alpha_requires_qa'
    || geometry.maskExpectation !==
      'procedural_alpha_artifact_required'
  ) {
    throw invalid(
      'procedural_geometry_missing',
      '$.componentGeometryBundle.components',
    )
  }
  return geometry
}

function deriveTiming(input: {
  readonly scene:
    CanonicalLivingFrameSelectedScenePublication['binding']['selectedComponent']['scenePlans'][number]
  readonly activation: LivingFrameSkillActivation
  readonly timingBinding: CanonicalLivingFrameTimingBinding
}): {
  readonly phases: readonly LivingFrameTimingPhase[]
  readonly startFrame: number
  readonly endFrameExclusive: number
} {
  const timingScene = input.timingBinding.scenes.find(
    (candidate) =>
      candidate.sceneId === input.scene.sceneId,
  )
  const requestById = new Map(
    input.scene.semanticTimingRequests.map(
      (request) => [request.timingRequestId, request],
    ),
  )
  const phaseByName = new Map(
    timingScene?.semanticPhaseBindings.map(
      (binding) => [binding.phase, binding],
    ) ?? [],
  )
  const selected = input.activation
    .linkedTimingRequestIds
    .map((requestId) => requestById.get(requestId))
  if (
    !timingScene
    || selected.length < 1
    || selected.some((request) => request == null)
  ) {
    throw invalid(
      'timing_binding_missing',
      '$.timingBinding.scenes',
    )
  }
  const phases = [...new Set(
    selected.map((request) => request!.phase),
  )]
  const bindings = phases.map(
    (phase) => phaseByName.get(phase),
  )
  if (
    bindings.some((binding) => binding == null)
  ) {
    throw invalid(
      'timing_binding_missing',
      '$.timingBinding.scenes.semanticPhaseBindings',
    )
  }
  const startFrame = Math.min(
    ...bindings.map((binding) =>
      binding!.frameRange.startFrame),
  )
  const endFrameExclusive = Math.max(
    ...bindings.map((binding) =>
      binding!.frameRange.endFrameExclusive),
  )
  if (
    startFrame < timingScene.visualTiming.frameRange.startFrame
    || endFrameExclusive >
      timingScene.visualTiming.frameRange.endFrameExclusive
    || endFrameExclusive <= startFrame
  ) {
    throw invalid(
      'timing_binding_missing',
      '$.timingBinding.scenes.visualTiming',
    )
  }
  return {
    phases,
    startFrame,
    endFrameExclusive,
  }
}

function assertDraft(
  draft: LivingFrameEnvironmentalParticleAdmissionDraft,
): void {
  if (
    draft.materializationAllowed
    || draft.operationRegistered
    || draft.dispatchGranted
    || draft.runtimeExecuted
    || draft.artifactPersisted
    || draft.assetManifestMutated
    || draft.remotionAdapterMutated
    || draft.qaApproved
    || draft.privateReviewApproved
    || draft.actualCostCreated
    || draft.customerCharged
    || draft.productionReady
    || !draft.currentSharedInterfaceConflictObserved
    || draft.toolOperationDisposition
      .separateToolIdentityRequired
    || draft.toolOperationDisposition.existingToolId !==
      LIVING_FRAME_ENVIRONMENTAL_PARTICLE_TOOL_ID
    || draft.toolOperationDisposition.existingOperationId !==
      LIVING_FRAME_ENVIRONMENTAL_PARTICLE_CURRENT_OPERATION_ID
    || draft.toolOperationDisposition.candidateOperationId !==
      LIVING_FRAME_ENVIRONMENTAL_PARTICLE_CANDIDATE_OPERATION_ID
    || stableAuthorityStringify(
      draft.toolOperationDisposition.mismatchCodes,
    ) !== stableAuthorityStringify(
      LIVING_FRAME_ENVIRONMENTAL_PARTICLE_MISMATCH_CODES,
    )
    || stableAuthorityStringify(
      draft.openGateCodes,
    ) !== stableAuthorityStringify(
      LIVING_FRAME_ENVIRONMENTAL_PARTICLE_OPEN_GATES,
    )
    || Object.entries(draft.authorityBoundary)
      .some(([key, value]) =>
        key === 'readOnlyAdmissionCandidateAuthority'
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
  delete copy.reconciliationDigestSha256
  return copy
}

function invalid(
  code: LivingFrameEnvironmentalParticleIssueCode,
  path: string,
): LivingFrameEnvironmentalParticleAdmissionError {
  return new LivingFrameEnvironmentalParticleAdmissionError([
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
  return Object.keys(value).sort().join('|') ===
    [...keys].sort().join('|')
}

function deepFreeze<T>(value: T): T {
  if (
    value
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (
      const nested of Object.values(
        value as Record<string, unknown>,
      )
    ) {
      deepFreeze(nested)
    }
  }
  return value
}
