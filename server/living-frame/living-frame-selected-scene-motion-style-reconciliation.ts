import type {
  CanonicalLivingFrameMotionSpec,
} from '../../src/types/living-frame-canonical-motion'
import {
  LIVING_FRAME_SELECTED_SCENE_MOTION_STYLE_RECONCILIATION_CLASS,
  LIVING_FRAME_SELECTED_SCENE_MOTION_STYLE_RECONCILIATION_OPEN_GATES,
  LIVING_FRAME_SELECTED_SCENE_MOTION_STYLE_RECONCILIATION_STATE,
  LIVING_FRAME_SELECTED_SCENE_MOTION_STYLE_RECONCILIATION_VERSION,
  type LivingFrameSelectedSceneMotionStyleReconciliation,
  type LivingFrameSelectedSceneMotionStyleReconciliationAuthority,
  type LivingFrameSelectedSceneMotionStyleReconciliationDraft,
  type LivingFrameSelectedSceneMotionStyleReconciliationIssue,
  type LivingFrameSelectedSceneMotionStyleReconciliationIssueCode,
  type LivingFrameSelectedSceneMotionStyleReconciliationStatus,
  type LivingFrameSelectedSceneMotionStyleReconciliationUnit,
} from '../../src/types/living-frame-selected-scene-motion-style-reconciliation'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  compileCanonicalLivingFrameMotionSpec,
  verifyCanonicalLivingFrameMotionSpec,
} from './canonical-living-frame-motion'
import {
  type CreateLivingFrameControlledImageSelectedScenePrivateConditioningBindingInput,
  verifyLivingFrameControlledImageSelectedScenePrivateConditioningBinding,
} from './living-frame-controlled-image-selected-scene-private-conditioning-binding'
import type {
  LivingFrameControlledImageSelectedScenePrivateConditioningBinding,
} from '../../src/types/living-frame-controlled-image-selected-scene-private-conditioning-binding'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u

const AUTHORITY_BOUNDARY:
  LivingFrameSelectedSceneMotionStyleReconciliationAuthority =
  deepFreeze({
    readOnlyMotionStyleReconciliationAuthority: true,
    selectedSceneAuthority: false,
    visualContinuityPackAuthority: false,
    sceneDesignAuthority: false,
    motionPlanningAuthority: false,
    motionSpecMutationAuthority: false,
    depthDowngradeAuthority: false,
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

export interface ReconcileLivingFrameSelectedSceneMotionStyleInput {
  readonly reconciliationId: string
  readonly privateConditioningBinding:
    LivingFrameControlledImageSelectedScenePrivateConditioningBinding
  readonly privateConditioningBindingInput:
    CreateLivingFrameControlledImageSelectedScenePrivateConditioningBindingInput
  readonly canonicalMotionSpecs:
    readonly CanonicalLivingFrameMotionSpec[]
}

export class LivingFrameSelectedSceneMotionStyleReconciliationError
  extends Error {
  readonly issues:
    readonly LivingFrameSelectedSceneMotionStyleReconciliationIssue[]

  constructor(
    issues:
      readonly LivingFrameSelectedSceneMotionStyleReconciliationIssue[],
  ) {
    super(
      'Living Frame selected-scene motion style reconciliation failed.',
    )
    this.name =
      'LivingFrameSelectedSceneMotionStyleReconciliationError'
    this.issues = issues
  }
}

export async function reconcileLivingFrameSelectedSceneMotionStyle(
  input: ReconcileLivingFrameSelectedSceneMotionStyleInput,
): Promise<LivingFrameSelectedSceneMotionStyleReconciliation> {
  assertInput(input)
  if (
    !await verifyLivingFrameControlledImageSelectedScenePrivateConditioningBinding(
      input.privateConditioningBinding,
      input.privateConditioningBindingInput,
    )
  ) {
    throw invalid(
      'conditioning_binding_invalid',
      '$.privateConditioningBinding',
    )
  }
  assertSourceLineage(input)
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
  const units =
    input.privateConditioningBinding.conditioningUnits.map(
      (conditioningUnit, order) => {
        const motionSpec =
          motionByComponent.get(conditioningUnit.componentId)
        if (!motionSpec) {
          throw invalid(
            'missing_motion_spec',
            `$.canonicalMotionSpecs.${conditioningUnit.componentId}`,
          )
        }
        assertCanonicalMotionSpec({
          input,
          conditioningUnit,
          motionSpec,
          order,
        })
        return compileUnit({
          conditioningUnit,
          motionSpec,
          order,
        })
      },
    )
  if (motionByComponent.size !== units.length) {
    throw invalid(
      'scene_component_or_output_mismatch',
      '$.canonicalMotionSpecs',
    )
  }
  const exactMatchCount = countStatus(
    units,
    'exact_supported_style_match',
  )
  const styleMismatchCount = countStatus(
    units,
    'blocked_canonical_motion_style_mismatch',
  )
  const dimensionalUnsupportedCount = countStatus(
    units,
    'blocked_dimensional_motion_runtime_unsupported',
  )
  const draft:
    LivingFrameSelectedSceneMotionStyleReconciliationDraft =
    {
      contractVersion:
        LIVING_FRAME_SELECTED_SCENE_MOTION_STYLE_RECONCILIATION_VERSION,
      resultClass:
        LIVING_FRAME_SELECTED_SCENE_MOTION_STYLE_RECONCILIATION_CLASS,
      reconciliationState:
        LIVING_FRAME_SELECTED_SCENE_MOTION_STYLE_RECONCILIATION_STATE,
      reconciliationId: input.reconciliationId,
      canonicalScope: {
        ...input.privateConditioningBinding.canonicalScope,
      },
      sourceBindings: {
        privateConditioningBindingDigestSha256:
          input.privateConditioningBinding
            .bindingDigestSha256,
        visualContinuityPackBindingDigestSha256:
          input.privateConditioningBinding.sourceBindings
            .visualContinuityPackBindingDigestSha256,
        visualContinuityPackDigestSha256:
          input.privateConditioningBinding.sourceBindings
            .visualContinuityPackDigestSha256,
        selectedSceneBindingDigestSha256:
          input.privateConditioningBinding.sourceBindings
            .selectedSceneBindingDigestSha256,
        currentMasterTimingDigestSha256:
          input.privateConditioningBinding.sourceBindings
            .currentMasterTimingDigestSha256,
        timingBindingDigestSha256:
          input.privateConditioningBindingInput
            .selectedSceneRequestInput.timingBinding
            .timingBindingDigestSha256,
        approvedSnapshotId:
          input.privateConditioningBinding.sourceBindings
            .approvedSnapshotId,
        approvedSnapshotHashSha256:
          input.privateConditioningBinding.sourceBindings
            .approvedSnapshotHashSha256,
      },
      units,
      metrics: {
        unitCount: units.length,
        exactMatchCount,
        styleMismatchCount,
        dimensionalUnsupportedCount,
        blockedCount:
          styleMismatchCount + dimensionalUnsupportedCount,
      },
      allUnitsExactSupportedStyleMatch:
        exactMatchCount === units.length,
      canonicalMotionCanProceedByThisReconciliation: false,
      canonicalMotionStyleConflictObserved:
        styleMismatchCount + dimensionalUnsupportedCount > 0,
      dimensionalRuntimeGapObserved:
        dimensionalUnsupportedCount > 0,
      explicitApprovedDowngradeRequiredForAnyMismatch:
        true,
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
        LIVING_FRAME_SELECTED_SCENE_MOTION_STYLE_RECONCILIATION_OPEN_GATES,
      authorityBoundary: AUTHORITY_BOUNDARY,
      containsRawPromptPackPayloadMediaBytesPathsUrlsCredentialsCommandsOrEnvironment:
        false,
      productionReady: false,
    }
  assertDraft(draft)
  return deepFreeze({
    ...draft,
    reconciliationDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export async function verifyLivingFrameSelectedSceneMotionStyleReconciliation(
  value: unknown,
  input: ReconcileLivingFrameSelectedSceneMotionStyleInput,
): Promise<boolean> {
  try {
    if (
      !isRecord(value)
      || typeof value.reconciliationDigestSha256 !==
        'string'
      || !SHA256.test(value.reconciliationDigestSha256)
      || value.reconciliationDigestSha256 !==
        sha256AuthorityValue(withoutDigest(value))
    ) return false
    const expected =
      await reconcileLivingFrameSelectedSceneMotionStyle(input)
    return stableAuthorityStringify(value) ===
      stableAuthorityStringify(expected)
  } catch {
    return false
  }
}

function compileUnit(input: {
  readonly conditioningUnit:
    LivingFrameControlledImageSelectedScenePrivateConditioningBinding[
      'conditioningUnits'
    ][number]
  readonly motionSpec: CanonicalLivingFrameMotionSpec
  readonly order: number
}): LivingFrameSelectedSceneMotionStyleReconciliationUnit {
  const approvedDepthStyle =
    input.conditioningUnit.styleDirection.depthStyle
  const canonicalDepthStyle =
    input.motionSpec.depthStyle
  const status: LivingFrameSelectedSceneMotionStyleReconciliationStatus =
    approvedDepthStyle === 'dimensional'
      ? 'blocked_dimensional_motion_runtime_unsupported'
      : approvedDepthStyle === canonicalDepthStyle
        ? 'exact_supported_style_match'
        : 'blocked_canonical_motion_style_mismatch'
  const unitDraft = {
    order: input.order,
    reconciliationUnitId:
      `living-frame.motion-style.${
        sha256AuthorityValue({
          conditioningUnitId:
            input.conditioningUnit.conditioningUnitId,
          motionSpecDigestSha256:
            input.motionSpec.motionSpecDigestSha256,
        }).slice(0, 28)
      }`,
    conditioningUnitId:
      input.conditioningUnit.conditioningUnitId,
    requestUnitId: input.conditioningUnit.requestUnitId,
    sceneId: input.conditioningUnit.sceneId,
    componentId: input.conditioningUnit.componentId,
    outputKey: input.conditioningUnit.outputKey,
    approvedWorkItemId:
      input.conditioningUnit.approvedWorkItemId,
    approvedWorkItemKey:
      input.conditioningUnit.approvedWorkItemKey,
    approvedPlannedAssetManifestEntryId:
      input.conditioningUnit
        .approvedPlannedAssetManifestEntryId,
    approvedStyle: {
      assetTreatment:
        input.conditioningUnit.styleDirection
          .assetTreatment,
      depthStyle: approvedDepthStyle,
      motionPreparationClass:
        input.conditioningUnit.styleDirection
          .motionPreparationClass,
      twoPointFiveDDirected:
        input.conditioningUnit.styleDirection
          .depthStyleSupportsTwoPointFiveD,
    },
    canonicalMotionObservation: {
      motionSpecDigestSha256:
        input.motionSpec.motionSpecDigestSha256,
      depthStyle: canonicalDepthStyle,
      depthBand: input.motionSpec.depthBand,
      parallaxFactor: input.motionSpec.parallaxFactor,
      layerTrackCount:
        input.motionSpec.metrics.layerTrackCount,
      cameraTrackCount:
        input.motionSpec.metrics.cameraTrackCount,
      sourceTrackCount:
        input.motionSpec.metrics.sourceTrackCount,
    },
    reconciliationStatus: status,
    exactDepthStyleMatch:
      approvedDepthStyle === canonicalDepthStyle,
    approvedDepthStyleSupportedByCurrentCanonicalMotion:
      approvedDepthStyle !== 'dimensional',
    explicitApprovedDowngradePresent: false as const,
    downstreamCanonicalMotionAdmissionBlocked:
      status !== 'exact_supported_style_match',
    canonicalMotionSpecMutated: false as const,
    approvedStyleMutated: false as const,
  }
  return {
    ...unitDraft,
    reconciliationUnitDigestSha256:
      sha256AuthorityValue(unitDraft),
  }
}

function assertCanonicalMotionSpec(input: {
  readonly input:
    ReconcileLivingFrameSelectedSceneMotionStyleInput
  readonly conditioningUnit:
    LivingFrameControlledImageSelectedScenePrivateConditioningBinding[
      'conditioningUnits'
    ][number]
  readonly motionSpec: CanonicalLivingFrameMotionSpec
  readonly order: number
}): void {
  if (!verifyCanonicalLivingFrameMotionSpec(input.motionSpec)) {
    throw invalid(
      'canonical_motion_spec_invalid',
      `$.canonicalMotionSpecs.${input.order}`,
    )
  }
  const requestInput =
    input.input.privateConditioningBindingInput
      .selectedSceneRequestInput
  const expected = compileCanonicalLivingFrameMotionSpec({
    publication: requestInput.publication,
    timingBinding: requestInput.timingBinding,
    components: requestInput.components,
    sceneId: input.conditioningUnit.sceneId,
    componentId: input.conditioningUnit.componentId,
  })
  if (
    stableAuthorityStringify(input.motionSpec) !==
      stableAuthorityStringify(expected)
    || input.motionSpec.sceneId !==
      input.conditioningUnit.sceneId
    || input.motionSpec.componentId !==
      input.conditioningUnit.componentId
  ) {
    throw invalid(
      'scene_component_or_output_mismatch',
      `$.canonicalMotionSpecs.${input.order}`,
    )
  }
}

function assertSourceLineage(
  input: ReconcileLivingFrameSelectedSceneMotionStyleInput,
): void {
  const binding = input.privateConditioningBinding
  const requestInput =
    input.privateConditioningBindingInput
      .selectedSceneRequestInput
  if (
    binding.sourceBindings.selectedSceneBindingDigestSha256 !==
      requestInput.publication.binding.bindingDigestSha256
    || binding.sourceBindings.currentMasterTimingDigestSha256 !==
      requestInput.timingBinding.sourceBindings
        .currentMasterTimingDigestSha256
    || binding.canonicalScope.sceneId !==
      input.privateConditioningBindingInput
        .selectedSceneRequest.canonicalScope.sceneId
  ) {
    throw invalid(
      'source_lineage_mismatch',
      '$.sourceBindings',
    )
  }
}

function assertInput(
  input: ReconcileLivingFrameSelectedSceneMotionStyleInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'reconciliationId',
      'privateConditioningBinding',
      'privateConditioningBindingInput',
      'canonicalMotionSpecs',
    ])
    || !SAFE_ID.test(String(input.reconciliationId))
    || !Array.isArray(input.canonicalMotionSpecs)
    || input.canonicalMotionSpecs.length === 0
  ) {
    throw invalid('input_invalid', '$')
  }
}

function assertDraft(
  draft: LivingFrameSelectedSceneMotionStyleReconciliationDraft,
): void {
  const {
    readOnlyMotionStyleReconciliationAuthority,
    ...delegated
  } = draft.authorityBoundary
  if (
    readOnlyMotionStyleReconciliationAuthority !== true
    || Object.values(delegated).some((value) =>
      value !== false)
    || draft.units.length === 0
    || draft.metrics.unitCount !== draft.units.length
    || draft.metrics.exactMatchCount
      + draft.metrics.blockedCount !== draft.units.length
    || draft.canonicalMotionCanProceedByThisReconciliation
      !== false
    || draft.canonicalSelectedSceneOrMotionInterfaceMutated
      !== false
    || draft.operationRegistered !== false
    || draft.dispatchGranted !== false
    || draft.runtimeExecuted !== false
    || draft.productionReady !== false
  ) {
    throw invalid(
      'authority_promotion_forbidden',
      '$.authorityBoundary',
    )
  }
}

function countStatus(
  units:
    readonly LivingFrameSelectedSceneMotionStyleReconciliationUnit[],
  status: LivingFrameSelectedSceneMotionStyleReconciliationStatus,
): number {
  return units.filter((unit) =>
    unit.reconciliationStatus === status).length
}

function invalid(
  code: LivingFrameSelectedSceneMotionStyleReconciliationIssueCode,
  path: string,
): LivingFrameSelectedSceneMotionStyleReconciliationError {
  return new LivingFrameSelectedSceneMotionStyleReconciliationError([{
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
  Object.freeze(value)
  for (const child of Object.values(
    value as Record<string, unknown>,
  )) {
    deepFreeze(child)
  }
  return value
}
