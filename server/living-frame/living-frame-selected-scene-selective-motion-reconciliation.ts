import type {
  LivingFrameComponentPlan,
  LivingFrameMiniSkillKey,
  LivingFrameScenePlan,
} from '../../src/types/living-frame'
import type {
  CanonicalLivingFrameMotionSpec,
} from '../../src/types/living-frame-canonical-motion'
import type {
  CanonicalLivingFrameSelectedScenePublication,
} from '../../src/types/living-frame-selected-scene-binding'
import {
  LIVING_FRAME_SELECTED_SCENE_SELECTIVE_MOTION_RECONCILIATION_CLASS,
  LIVING_FRAME_SELECTED_SCENE_SELECTIVE_MOTION_RECONCILIATION_OPEN_GATES,
  LIVING_FRAME_SELECTED_SCENE_SELECTIVE_MOTION_RECONCILIATION_STATE,
  LIVING_FRAME_SELECTED_SCENE_SELECTIVE_MOTION_RECONCILIATION_VERSION,
  type LivingFrameSelectedSceneSelectiveMotionObservation,
  type LivingFrameSelectedSceneSelectiveMotionReconciliation,
  type LivingFrameSelectedSceneSelectiveMotionReconciliationAuthority,
  type LivingFrameSelectedSceneSelectiveMotionReconciliationDraft,
  type LivingFrameSelectedSceneSelectiveMotionReconciliationIssue,
  type LivingFrameSelectedSceneSelectiveMotionReconciliationIssueCode,
  type LivingFrameSelectedSceneSelectiveMotionReconciliationStatus,
  type LivingFrameSelectedSceneSelectiveMotionReconciliationUnit,
} from '../../src/types/living-frame-selected-scene-selective-motion-reconciliation'
import type {
  CanonicalLivingFrameTimingBinding,
} from '../../src/types/living-frame-timing-binding'
import {
  validateLivingFrameProfessionalSkillComponent,
} from '../../src/lib/living-frame/living-frame-contract'
import type {
  CanonicalPlanComponentsInput,
} from '../validation/edit-planning-authority-schemas'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  compileCanonicalLivingFrameMotionSpec,
  verifyCanonicalLivingFrameMotionSpec,
} from './canonical-living-frame-motion'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u

const AUTHORITY_BOUNDARY:
  LivingFrameSelectedSceneSelectiveMotionReconciliationAuthority =
  deepFreeze({
    readOnlySelectiveMotionReconciliationAuthority: true,
    selectedSceneAuthority: false,
    miniSkillSelectionAuthority: false,
    motionPlanningAuthority: false,
    motionSpecMutationAuthority: false,
    componentRigAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workGraphAuthority: false,
    rendererAuthority: false,
    privateReviewAuthority: false,
    operationRegistryAuthority: false,
    toolRegistryAuthority: false,
    queueAuthority: false,
    dispatchAuthority: false,
    runtimeAuthority: false,
    artifactAuthority: false,
    assetManifestAuthority: false,
    qaApprovalAuthority: false,
    costAuthority: false,
    billingAuthority: false,
    productionAuthority: false,
  })

export interface ReconcileLivingFrameSelectedSceneSelectiveMotionInput {
  readonly reconciliationId: string
  readonly sceneId: string
  readonly publication:
    CanonicalLivingFrameSelectedScenePublication
  readonly timingBinding:
    CanonicalLivingFrameTimingBinding
  readonly components:
    CanonicalPlanComponentsInput
  readonly canonicalMotionSpecs:
    readonly CanonicalLivingFrameMotionSpec[]
}

export class LivingFrameSelectedSceneSelectiveMotionReconciliationError
  extends Error {
  readonly issues:
    readonly LivingFrameSelectedSceneSelectiveMotionReconciliationIssue[]

  constructor(
    issues:
      readonly LivingFrameSelectedSceneSelectiveMotionReconciliationIssue[],
  ) {
    super(
      'Living Frame selected-scene selective-motion reconciliation failed.',
    )
    this.name =
      'LivingFrameSelectedSceneSelectiveMotionReconciliationError'
    this.issues = issues
  }
}

export async function reconcileLivingFrameSelectedSceneSelectiveMotion(
  input:
    ReconcileLivingFrameSelectedSceneSelectiveMotionInput,
): Promise<LivingFrameSelectedSceneSelectiveMotionReconciliation> {
  assertInput(input)
  const componentValidation =
    await validateLivingFrameProfessionalSkillComponent(
      input.publication.binding.selectedComponent,
    )
  if (!componentValidation.ok) {
    throw invalid(
      'selected_component_invalid',
      '$.publication.binding.selectedComponent',
    )
  }
  const selectedComponent = componentValidation.component
  const scene = selectedComponent.scenePlans.find(
    (candidate) => candidate.sceneId === input.sceneId,
  )
  const timingScene = input.timingBinding.scenes.find(
    (candidate) => candidate.sceneId === input.sceneId,
  )
  if (!scene || !timingScene) {
    throw invalid(
      'scene_or_component_mismatch',
      '$.sceneId',
    )
  }
  assertSourceLineage(input, selectedComponent.contractDigestSha256)
  const motionByComponent = new Map(
    input.canonicalMotionSpecs.map((spec) => [
      spec.componentId,
      spec,
    ]),
  )
  if (
    motionByComponent.size !==
      input.canonicalMotionSpecs.length
  ) {
    throw invalid(
      'duplicate_motion_spec',
      '$.canonicalMotionSpecs',
    )
  }
  const units = scene.components.map((component, order) => {
    const motionSpec = motionByComponent.get(
      component.componentId,
    )
    if (!motionSpec) {
      throw invalid(
        'missing_motion_spec',
        `$.canonicalMotionSpecs.${component.componentId}`,
      )
    }
    assertCanonicalMotionSpec({
      input,
      scene,
      component,
      motionSpec,
      order,
    })
    return compileUnit({
      scene,
      component,
      motionSpec,
      order,
    })
  })
  if (motionByComponent.size !== units.length) {
    throw invalid(
      'scene_or_component_mismatch',
      '$.canonicalMotionSpecs',
    )
  }
  const exactMatchCount = units.filter(
    (unit) =>
      unit.reconciliationStatus ===
        'exact_role_activation_match',
  ).length
  const rotationTrackCount = units.reduce(
    (total, unit) =>
      total +
      unit.canonicalMotionObservation.currentRotationTrackCount,
    0,
  )
  const expectedMechanicalRotationComponentCount =
    units.filter(
      (unit) =>
        unit.selectedMotionIntent.mechanicalRotationRequired,
    ).length
  const unexpectedRotationComponentCount = units.filter(
    (unit) =>
      unit.requiredCanonicalCorrection.removeMechanicalRotation,
  ).length
  const missingMechanicalRotationComponentCount =
    units.filter(
      (unit) =>
        unit.requiredCanonicalCorrection.addMechanicalRotation,
    ).length
  const environmentalRuntimeGapCount = units.filter(
    (unit) =>
      unit.selectedMotionIntent
        .environmentalParticleOrApprovedFallbackRequired,
  ).length
  const blockedCount = units.length - exactMatchCount
  const draft:
    LivingFrameSelectedSceneSelectiveMotionReconciliationDraft =
    {
      contractVersion:
        LIVING_FRAME_SELECTED_SCENE_SELECTIVE_MOTION_RECONCILIATION_VERSION,
      resultClass:
        LIVING_FRAME_SELECTED_SCENE_SELECTIVE_MOTION_RECONCILIATION_CLASS,
      reconciliationState:
        LIVING_FRAME_SELECTED_SCENE_SELECTIVE_MOTION_RECONCILIATION_STATE,
      reconciliationId: input.reconciliationId,
      canonicalScope: {
        workspaceId:
          input.publication.binding.identity.workspaceId,
        projectId:
          input.publication.binding.identity.projectId,
        editSessionId:
          input.publication.binding.identity.editSessionId,
        sceneId: scene.sceneId,
      },
      sourceBindings: {
        selectedSceneBindingDigestSha256:
          input.publication.binding.bindingDigestSha256,
        livingFrameComponentDigestSha256:
          selectedComponent.contractDigestSha256,
        currentMasterTimingDigestSha256:
          input.timingBinding.sourceBindings
            .currentMasterTimingDigestSha256,
        timingBindingDigestSha256:
          input.timingBinding.timingBindingDigestSha256,
      },
      units,
      metrics: {
        unitCount: units.length,
        exactMatchCount,
        blockedCount,
        rotationTrackCount,
        expectedMechanicalRotationComponentCount,
        unexpectedRotationComponentCount,
        missingMechanicalRotationComponentCount,
        environmentalRuntimeGapCount,
      },
      allUnitsRoleActivationMatched:
        exactMatchCount === units.length,
      canonicalSceneVerbBroadcastConflictObserved:
        unexpectedRotationComponentCount > 0,
      staticAnchorRotationConflictObserved:
        units.some((unit) =>
          unit.observationCodes.includes(
            'static_anchor_receives_mechanical_rotation',
          )),
      environmentalMotionRuntimeGapObserved:
        environmentalRuntimeGapCount > 0,
      canonicalSelectiveMotionCanProceedByThisReconciliation:
        false,
      canonicalSelectedSceneOrMotionInterfaceMutated:
        false,
      operationRegistered: false,
      dispatchGranted: false,
      runtimeExecuted: false,
      artifactPersisted: false,
      assetManifestMutated: false,
      qaApproved: false,
      privateReviewApproved: false,
      renderAuthorized: false,
      actualCostCreated: false,
      customerCharged: false,
      openGateCodes:
        LIVING_FRAME_SELECTED_SCENE_SELECTIVE_MOTION_RECONCILIATION_OPEN_GATES,
      authorityBoundary: AUTHORITY_BOUNDARY,
      containsRawChatTranscriptMediaBytesPathsUrlsCredentialsCommandsOrEnvironment:
        false,
      subjectSpecificRouting: false,
      productionReady: false,
    }
  assertDraft(draft)
  return deepFreeze({
    ...draft,
    reconciliationDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export async function verifyLivingFrameSelectedSceneSelectiveMotionReconciliation(
  value: unknown,
  input:
    ReconcileLivingFrameSelectedSceneSelectiveMotionInput,
): Promise<boolean> {
  try {
    if (
      !isRecord(value)
      || typeof value.reconciliationDigestSha256 !== 'string'
      || !SHA256.test(value.reconciliationDigestSha256)
      || value.reconciliationDigestSha256 !==
        sha256AuthorityValue(withoutDigest(value))
    ) return false
    const expected =
      await reconcileLivingFrameSelectedSceneSelectiveMotion(input)
    return stableAuthorityStringify(value) ===
      stableAuthorityStringify(expected)
  } catch {
    return false
  }
}

function compileUnit(input: {
  readonly scene: LivingFrameScenePlan
  readonly component: LivingFrameComponentPlan
  readonly motionSpec: CanonicalLivingFrameMotionSpec
  readonly order: number
}): LivingFrameSelectedSceneSelectiveMotionReconciliationUnit {
  const linkedMiniSkillKeys =
    deriveLinkedMiniSkillKeys(input.scene, input.component)
  const mechanicalPartMotionSelected =
    linkedMiniSkillKeys.includes('mechanical_part_motion')
  const environmentalMotionSelected =
    linkedMiniSkillKeys.includes('environmental_motion')
  const staticAnchor =
    input.component.focalRole === 'static_anchor'
  const mechanicalRotationAllowed =
    input.component.role === 'mechanical_component'
      && mechanicalPartMotionSelected
  const mechanicalRotationRequired =
    mechanicalRotationAllowed
      && input.scene.visualVerb === 'rotate'
  const environmentalParticleOrApprovedFallbackRequired =
    input.component.role === 'environmental_effect'
      && environmentalMotionSelected
  const rotationTracks = input.motionSpec.tracks.filter(
    (track) =>
      track.target === 'layer'
      && track.property === 'rotation_degrees',
  )
  const observationCodes:
    LivingFrameSelectedSceneSelectiveMotionObservation[] = []
  if (
    rotationTracks.length > 0
    && !mechanicalRotationAllowed
  ) {
    observationCodes.push(
      'scene_level_rotation_broadcast_to_unselected_component',
    )
    if (staticAnchor) {
      observationCodes.push(
        'static_anchor_receives_mechanical_rotation',
      )
    }
    if (input.component.role === 'environmental_effect') {
      observationCodes.push(
        'environmental_component_receives_mechanical_rotation',
      )
    }
  }
  if (
    mechanicalRotationRequired
    && rotationTracks.length === 0
  ) {
    observationCodes.push(
      'required_mechanical_component_rotation_missing',
    )
  }
  if (environmentalParticleOrApprovedFallbackRequired) {
    observationCodes.push(
      'environmental_particle_motion_not_renderable',
    )
  }
  const reconciliationStatus = deriveStatus({
    mechanicalRotationRequired,
    environmentalParticleOrApprovedFallbackRequired,
    rotationTrackCount: rotationTracks.length,
    mechanicalRotationAllowed,
  })
  const removeMechanicalRotation =
    rotationTracks.length > 0
      && !mechanicalRotationAllowed
  const addMechanicalRotation =
    mechanicalRotationRequired
      && rotationTracks.length === 0
  const unitDraft = {
    order: input.order,
    reconciliationUnitId:
      `living-frame.selective-motion.${
        sha256AuthorityValue({
          sceneId: input.scene.sceneId,
          componentId: input.component.componentId,
          motionSpec:
            input.motionSpec.motionSpecDigestSha256,
        }).slice(0, 28)
      }`,
    sceneId: input.scene.sceneId,
    componentId: input.component.componentId,
    role: input.component.role,
    focalRole: input.component.focalRole,
    linkedMiniSkillKeys,
    selectedMotionIntent: {
      mechanicalPartMotionSelected,
      environmentalMotionSelected,
      staticAnchor,
      mechanicalRotationAllowed,
      mechanicalRotationRequired,
      environmentalParticleOrApprovedFallbackRequired,
    },
    canonicalMotionObservation: {
      motionSpecDigestSha256:
        input.motionSpec.motionSpecDigestSha256,
      currentProperties:
        input.motionSpec.tracks.map((track) =>
          track.property),
      currentRotationTrackCount: rotationTracks.length,
      currentParticleEmissionTrackCount: 0 as const,
      componentRoleAndLinkedActivationAppliedAtCompiler:
        true as const,
      sceneVisualVerbAppliedOnlyWhenRoleActivationEligible:
        true as const,
    },
    observationCodes,
    reconciliationStatus,
    requiredCanonicalCorrection: {
      deriveTracksFromComponentRoleAndLinkedActivation:
        true as const,
      keepStaticAnchorUnrotated: staticAnchor,
      removeMechanicalRotation,
      addMechanicalRotation,
      requireEnvironmentalPrimitiveOrApprovedFallback:
        environmentalParticleOrApprovedFallbackRequired,
      requireComponentRigPivotBeforeRotationRender:
        mechanicalRotationRequired,
      exactValuesRemainCanonicalMotionOwnerDecision:
        true as const,
    },
    downstreamCanonicalMotionAdmissionBlocked:
      reconciliationStatus !== 'exact_role_activation_match',
    canonicalMotionSpecMutated: false as const,
    selectedSceneMutated: false as const,
  }
  return {
    ...unitDraft,
    reconciliationUnitDigestSha256:
      sha256AuthorityValue(unitDraft),
  }
}

function deriveStatus(input: {
  readonly mechanicalRotationRequired: boolean
  readonly environmentalParticleOrApprovedFallbackRequired:
    boolean
  readonly rotationTrackCount: number
  readonly mechanicalRotationAllowed: boolean
}): LivingFrameSelectedSceneSelectiveMotionReconciliationStatus {
  if (
    input.environmentalParticleOrApprovedFallbackRequired
    && input.rotationTrackCount > 0
  ) {
    return 'blocked_environmental_component_receives_mechanical_rotation'
  }
  if (input.environmentalParticleOrApprovedFallbackRequired) {
    return 'blocked_environmental_motion_runtime_unsupported'
  }
  if (
    input.rotationTrackCount > 0
    && !input.mechanicalRotationAllowed
  ) {
    return 'blocked_unselected_component_rotation'
  }
  if (
    input.mechanicalRotationRequired
    && input.rotationTrackCount === 0
  ) {
    return 'blocked_required_mechanical_rotation_missing'
  }
  return 'exact_role_activation_match'
}

function deriveLinkedMiniSkillKeys(
  scene: LivingFrameScenePlan,
  component: LivingFrameComponentPlan,
): readonly LivingFrameMiniSkillKey[] {
  return [
    ...new Set(
      scene.skillActivations
        .filter((activation) =>
          activation.linkedComponentIds.includes(
            component.componentId,
          ))
        .sort((left, right) => left.order - right.order)
        .map((activation) => activation.miniSkillKey),
    ),
  ]
}

function assertCanonicalMotionSpec(input: {
  readonly input:
    ReconcileLivingFrameSelectedSceneSelectiveMotionInput
  readonly scene: LivingFrameScenePlan
  readonly component: LivingFrameComponentPlan
  readonly motionSpec: CanonicalLivingFrameMotionSpec
  readonly order: number
}): void {
  if (!verifyCanonicalLivingFrameMotionSpec(input.motionSpec)) {
    throw invalid(
      'canonical_motion_spec_invalid',
      `$.canonicalMotionSpecs.${input.order}`,
    )
  }
  const expected = compileCanonicalLivingFrameMotionSpec({
    publication: input.input.publication,
    timingBinding: input.input.timingBinding,
    components: input.input.components,
    sceneId: input.scene.sceneId,
    componentId: input.component.componentId,
  })
  if (
    stableAuthorityStringify(input.motionSpec) !==
      stableAuthorityStringify(expected)
    || input.motionSpec.sceneId !== input.scene.sceneId
    || input.motionSpec.componentId !==
      input.component.componentId
  ) {
    throw invalid(
      'scene_or_component_mismatch',
      `$.canonicalMotionSpecs.${input.order}`,
    )
  }
}

function assertSourceLineage(
  input:
    ReconcileLivingFrameSelectedSceneSelectiveMotionInput,
  selectedComponentDigestSha256: string,
): void {
  const binding = input.publication.binding
  if (
    !SHA256.test(binding.bindingDigestSha256)
    || binding.selectedComponent.contractDigestSha256 !==
      selectedComponentDigestSha256
    || input.timingBinding.sourceBindings
      .selectedSceneBindingDigestSha256 !==
        binding.bindingDigestSha256
    || input.timingBinding.sourceBindings
      .currentMasterTimingDigestSha256 !==
        binding.sourceBindings.currentMasterTimingDigestSha256
  ) {
    throw invalid(
      'source_lineage_mismatch',
      '$.sourceBindings',
    )
  }
}

function assertInput(
  input:
    ReconcileLivingFrameSelectedSceneSelectiveMotionInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'reconciliationId',
      'sceneId',
      'publication',
      'timingBinding',
      'components',
      'canonicalMotionSpecs',
    ])
    || !SAFE_ID.test(String(input.reconciliationId))
    || !SAFE_ID.test(String(input.sceneId))
    || !isRecord(input.publication)
    || !isRecord(input.publication.binding)
    || !isRecord(input.timingBinding)
    || !isRecord(input.components)
    || !Array.isArray(input.canonicalMotionSpecs)
    || input.canonicalMotionSpecs.length === 0
  ) {
    throw invalid('input_invalid', '$')
  }
}

function assertDraft(
  draft:
    LivingFrameSelectedSceneSelectiveMotionReconciliationDraft,
): void {
  const {
    readOnlySelectiveMotionReconciliationAuthority,
    ...delegated
  } = draft.authorityBoundary
  if (
    readOnlySelectiveMotionReconciliationAuthority !== true
    || Object.values(delegated).some((value) =>
      value !== false)
    || draft.units.length === 0
    || draft.metrics.unitCount !== draft.units.length
    || draft.metrics.exactMatchCount
      + draft.metrics.blockedCount !== draft.units.length
    || draft.canonicalSelectiveMotionCanProceedByThisReconciliation
      !== false
    || draft.canonicalSelectedSceneOrMotionInterfaceMutated
      !== false
    || draft.operationRegistered !== false
    || draft.dispatchGranted !== false
    || draft.runtimeExecuted !== false
    || draft.subjectSpecificRouting !== false
    || draft.productionReady !== false
  ) {
    throw invalid(
      'authority_promotion_forbidden',
      '$.authorityBoundary',
    )
  }
}

function invalid(
  code:
    LivingFrameSelectedSceneSelectiveMotionReconciliationIssueCode,
  path: string,
): LivingFrameSelectedSceneSelectiveMotionReconciliationError {
  return new LivingFrameSelectedSceneSelectiveMotionReconciliationError([{
    code,
    path,
  }])
}

function withoutDigest(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const {
    reconciliationDigestSha256: omitted,
    ...rest
  } = value
  void omitted
  return rest
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) =>
      key === expected[index])
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
}

function deepFreeze<T>(value: T): T {
  if (
    typeof value !== 'object'
    || value === null
    || Object.isFrozen(value)
  ) return value
  for (const nested of Object.values(value)) {
    deepFreeze(nested)
  }
  return Object.freeze(value)
}
