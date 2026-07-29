import { createHash } from 'node:crypto'

import type {
  LivingFrameSourceTruthMode,
} from '../../src/types/living-frame'
import type {
  LivingFrameControlledImageSelectedSceneFullFrameContinuityFactAuthority,
  LivingFrameControlledImageSelectedSceneFullFrameContinuityFactIssue,
  LivingFrameControlledImageSelectedSceneFullFrameContinuityFactIssueCode,
  LivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliation,
  LivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliationDraft,
  LivingFrameControlledImageSelectedSceneFullFrameFactEvidenceRequirement,
} from '../../src/types/living-frame-controlled-image-selected-scene-full-frame-continuity-fact-reconciliation'
import {
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_CONTINUITY_FACT_ISSUE_CODES,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_CONTINUITY_FACT_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_CONTINUITY_FACT_RECONCILIATION_CLASS,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_CONTINUITY_FACT_RECONCILIATION_STATE,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_CONTINUITY_FACT_RECONCILIATION_VERSION,
} from '../../src/types/living-frame-controlled-image-selected-scene-full-frame-continuity-fact-reconciliation'
import type {
  LivingFrameControlledImageSelectedSceneFullFrameEvidenceReadiness,
} from '../../src/types/living-frame-controlled-image-selected-scene-full-frame-evidence-readiness'
import {
  type CreateLivingFrameControlledImageSelectedSceneFullFrameEvidenceReadinessInput,
  verifyLivingFrameControlledImageSelectedSceneFullFrameEvidenceReadiness,
} from './living-frame-controlled-image-selected-scene-full-frame-evidence-readiness'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const URL_LIKE = /(?:https?:\/\/|file:\/\/|data:|javascript:)/iu
const SECRET_LIKE =
  /(?:-----BEGIN [A-Z ]+PRIVATE KEY-----|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{16,})/u

const EXACT_FACT_SAFETY_MODES =
  new Set<LivingFrameSourceTruthMode>([
    'exact_geography_verification_required',
    'exact_data_verification_required',
    'documentary_source_verification_required',
  ])

const AUTHORITY_BOUNDARY:
  LivingFrameControlledImageSelectedSceneFullFrameContinuityFactAuthority =
  deepFreeze({
    serverDerivedReadOnlyRequirementReconciliationAuthority: true,
    selectedSceneAuthority: false,
    visualContinuityPackAuthority: false,
    canonicalReferenceArtifactAuthority: false,
    alignmentRegistrationAuthority: false,
    continuityMeasurementAuthority: false,
    semanticVisualQaAuthority: false,
    documentaryFactAuthority: false,
    sourceTruthAuthority: false,
    operationRegistryAuthority: false,
    providerAuthority: false,
    queueAuthority: false,
    dispatchAuthority: false,
    workerLeaseAuthority: false,
    workerCompletionAuthority: false,
    runtimeAuthority: false,
    gpuAttemptAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    actualCostAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemAuthority: false,
    workGraphMutationAuthority: false,
    artifactPersistenceAuthority: false,
    artifactQaAuthority: false,
    sceneEvidencePackageAuthority: false,
    assetManifestAuthority: false,
    privateReviewAuthority: false,
    renderAuthority: false,
    finalCanvasAuthority: false,
    productionAuthority: false,
  })

export interface CreateLivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliationInput {
  readonly fullFrameEvidenceReadiness:
    LivingFrameControlledImageSelectedSceneFullFrameEvidenceReadiness
  readonly fullFrameEvidenceReadinessInput:
    CreateLivingFrameControlledImageSelectedSceneFullFrameEvidenceReadinessInput
}

export class LivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliationError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledImageSelectedSceneFullFrameContinuityFactIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledImageSelectedSceneFullFrameContinuityFactIssue[],
  ) {
    super(
      'Living Frame selected-scene full-frame continuity/fact reconciliation failed.',
    )
    this.name =
      'LivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliationError'
    this.issues = issues
  }
}

export async function compileLivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliation(
  input:
    CreateLivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliationInput,
): Promise<LivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliation> {
  await assertInput(input)
  const readiness = input.fullFrameEvidenceReadiness
  const request =
    input.fullFrameEvidenceReadinessInput.selectedSceneRequest
  const requestUnitCandidates = request.requestUnits.filter(
    (unit) =>
      unit.requestUnitId ===
        readiness.exactOutputLineage.requestUnitId
      && unit.sceneId === readiness.canonicalScope.sceneId
      && unit.componentId ===
        readiness.exactOutputLineage.componentId
      && unit.outputKey === readiness.exactOutputLineage.outputKey
      && unit.approvedWorkItemId ===
        readiness.exactOutputLineage.approvedWorkItemId
      && unit.approvedWorkItemKey ===
        readiness.exactOutputLineage.approvedWorkItemKey
      && unit.approvedPlannedAssetManifestEntryId ===
        readiness.exactOutputLineage
          .approvedPlannedAssetManifestEntryId
      && unit.rendererLayerId ===
        readiness.exactOutputLineage.rendererLayerId,
  )
  if (requestUnitCandidates.length !== 1) {
    throw invalid(
      'selected_request_unit_missing',
      '$.fullFrameEvidenceReadiness.exactOutputLineage',
    )
  }
  const requestUnit = requestUnitCandidates[0]!
  if (
    requestUnit.componentRole !== 'opaque_background_plate'
    && requestUnit.componentRole !==
      'reconstructed_background_plate'
  ) {
    throw invalid(
      'selected_request_unit_missing',
      '$.fullFrameEvidenceReadiness.exactOutputLineage.componentRole',
    )
  }
  const packDigest =
    readiness.sourceBindings.visualContinuityPackDigestSha256
  if (
    requestUnit.continuityDirectionDigestSha256 !== packDigest
    || request.sourceBindings.visualContinuityPackDigestSha256 !==
      packDigest
  ) {
    throw invalid(
      'continuity_direction_mismatch',
      '$.sourceBindings.visualContinuityPackDigestSha256',
    )
  }
  const semanticStyleContinuityQaRequired = packDigest !== null
  const referenceConditioningRequired =
    requestUnit.controlPolicy.referenceConditioningRequired
  const sourceTruthMode =
    readiness.destinationEvidenceExpectation.sourceTruthMode
  const exactFactSafetyRequired =
    EXACT_FACT_SAFETY_MODES.has(sourceTruthMode)
  const factEvidenceRequirement =
    classifyLivingFrameSelectedSceneFullFrameFactEvidenceRequirement(
      sourceTruthMode,
    )

  const draft:
    LivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliationDraft =
    {
      contractVersion:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_CONTINUITY_FACT_RECONCILIATION_VERSION,
      resultClass:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_CONTINUITY_FACT_RECONCILIATION_CLASS,
      reconciliationState:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_CONTINUITY_FACT_RECONCILIATION_STATE,
      reconciliationId:
        `lf-selected-full-frame-continuity-fact.${digest({
          readiness: readiness.readinessDigestSha256,
          requestUnit: requestUnit.requestUnitDigestSha256,
        }).slice(0, 40)}`,
      canonicalScope: readiness.canonicalScope,
      exactOutputLineage: {
        componentId: requestUnit.componentId,
        componentRole: requestUnit.componentRole,
        requestUnitId: requestUnit.requestUnitId,
        outputKey: requestUnit.outputKey,
        approvedWorkItemId: requestUnit.approvedWorkItemId,
        approvedWorkItemKey: requestUnit.approvedWorkItemKey,
        generatedAssetIntentId:
          readiness.exactOutputLineage.generatedAssetIntentId,
        approvedPlannedAssetManifestEntryId:
          requestUnit.approvedPlannedAssetManifestEntryId,
        rendererLayerId: requestUnit.rendererLayerId,
        outputCandidateId:
          readiness.exactOutputLineage.outputCandidateId,
      },
      sourceBindings: {
        fullFrameEvidenceReadinessDigestSha256:
          readiness.readinessDigestSha256,
        selectedSceneRequestBindingDigestSha256:
          request.requestBindingDigestSha256,
        selectedSceneBindingDigestSha256:
          readiness.sourceBindings
            .selectedSceneBindingDigestSha256,
        approvedSnapshotId:
          readiness.sourceBindings.approvedSnapshotId,
        approvedSnapshotHashSha256:
          readiness.sourceBindings.approvedSnapshotHashSha256,
        visualContinuityPackDigestSha256: packDigest,
        currentMasterTimingDigestSha256:
          readiness.sourceBindings.currentMasterTimingDigestSha256,
        confirmedOutputFrameExpectationDigestSha256:
          readiness.sourceBindings
            .confirmedOutputFrameExpectationDigestSha256,
        canonicalWorkGraphProjectionDigestSha256:
          readiness.sourceBindings
            .canonicalWorkGraphProjectionDigestSha256,
      },
      continuityRequirements: {
        continuityQaRequirement:
          semanticStyleContinuityQaRequired
            ? 'semantic_style_continuity_qa_required'
            : 'canonical_continuity_revalidation_then_not_applicable',
        semanticStyleContinuityQaRequired,
        referenceConditioningRequired,
        referenceEvidenceRequirement:
          referenceConditioningRequired
            ? 'canonical_persisted_reference_artifact_required'
            : 'not_required_for_unconditioned_full_frame_plate',
        canonicalPersistedReferenceArtifactRequired:
          referenceConditioningRequired,
        validatedVisualContinuityPackPayloadAvailableInSelectedSceneInterface:
          false,
        canonicalPersistedReferenceArtifactAvailableInSelectedSceneInterface:
          false,
        privatePromptImageAliasIsCanonicalArtifactEvidence: false,
        controlledReferenceViewExpectationIsCanonicalArtifactEvidence:
          false,
        alignedSameViewMeasurementRequiredAtThisStage: false,
        alignedSameViewMeasurementEligibility:
          referenceConditioningRequired
            ? 'canonical_reference_artifact_and_alignment_registration_required'
            : 'not_applicable_without_reference_conditioning',
        alignedSameViewMeasurementContractVersion:
          'living-frame-visual-continuity-measurement-v1',
        generalSemanticStyleQaMustNotBeRelabeledAsAlignedMeasurement:
          true,
      },
      factAndProvenanceRequirements: {
        sourceTruthMode,
        factEvidenceRequirement,
        canonicalDocumentaryFactSafetySnapshotRequired:
          exactFactSafetyRequired,
        documentaryFactSafetyPlanAvailableInCanonicalSelectedSceneComponents:
          false,
        generatedIllustrationMayBePresentedAsAuthenticArchiveOrDocumentaryEvidence:
          false,
        sourceTruthMustBeRevalidatedByCanonicalOwner: true,
      },
      missingCanonicalBridgeInputs: {
        validatedVisualContinuityPackPayloadOrImmutableArtifactBinding:
          true,
        canonicalSemanticStyleContinuityQaOwnerBinding: true,
        canonicalReferenceArtifactSnapshotSceneComponentViewManifestAndAlignmentBinding:
          referenceConditioningRequired,
        documentaryFactSafetyPlanSnapshotOrImmutableClaimBinding:
          exactFactSafetyRequired,
      },
      fixedRuntimeAndRegistryPolicy: {
        expectedCanonicalToolId: 'comfyui',
        expectedCanonicalOperationId:
          'tool.comfyui.generate_controlled_image.v1',
        fixedSupervisedProcessEntrypointRequired: true,
        runtimeConfinementRequirementDigestSha256:
          readiness.fixedRuntimeLineage
            .runtimeConfinementRequirementDigestSha256,
        deniedTopLevelImports: ['sam2'],
        exactModelArtifactCount: 5,
        exactModelArtifactByteLength: 11_700_367_157,
        atomicReadOnlyMountRequiredForOneAttempt: true,
        oneRequestUnitOneImageOneGpuAttemptRequired: true,
        fiveGpuCapabilityRolesCreateOneCostEvent: true,
        auraFaceCpuQaExcludedFromGpuAttempt: true,
        registryExpansionPermittedForReleasedDistinctExecutables:
          true,
        fakeIdentityForWeightAdapterLibraryPreprocessorOrCapabilityAllowed:
          false,
      },
      openGateCodes:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_CONTINUITY_FACT_OPEN_GATES,
      authorityBoundary: AUTHORITY_BOUNDARY,
      fullFrameEvidenceReadinessRevalidated: true,
      exactSelectedOutputAndConfirmedFrameLineagePreserved: true,
      canonicalReferenceArtifactResolved: false,
      alignedSameViewRegistrationResolved: false,
      continuityMeasurementExecuted: false,
      semanticVisualQaExecuted: false,
      documentaryFactSafetyRevalidated: false,
      artifactPersisted: false,
      artifactQaExecuted: false,
      sceneEvidencePackageCompiled: false,
      assetManifestMutated: false,
      privateReviewApproved: false,
      renderAuthorized: false,
      finalCanvasCreatedByComfyUi: false,
      containsBytesPathUrlCredentialPromptSeedDimensionModelCommandOrEnvironment:
        false,
      containsPriceCreditServiceFeeReservationWalletOrLedgerData:
        false,
      productionReady: false,
    }
  assertSafe(draft)
  return deepFreeze({
    ...draft,
    reconciliationDigestSha256: digest(draft),
  })
}

export async function verifyLivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliation(
  value: unknown,
  input:
    CreateLivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliationInput,
): Promise<boolean> {
  try {
    const expected =
      await compileLivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliation(
        input,
      )
    return (
      isRecord(value)
      && typeof value.reconciliationDigestSha256 === 'string'
      && SHA256.test(value.reconciliationDigestSha256)
      && value.reconciliationDigestSha256 ===
        digest(withoutDigest(value))
      && canonicalJson(value) === canonicalJson(expected)
    )
  } catch {
    return false
  }
}

async function assertInput(
  input:
    CreateLivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliationInput,
): Promise<void> {
  if (
    !input
    || !await verifyLivingFrameControlledImageSelectedSceneFullFrameEvidenceReadiness(
      input.fullFrameEvidenceReadiness,
      input.fullFrameEvidenceReadinessInput,
    )
  ) {
    throw invalid(
      'full_frame_evidence_readiness_invalid',
      '$.fullFrameEvidenceReadiness',
    )
  }
  const readiness = input.fullFrameEvidenceReadiness
  const request =
    input.fullFrameEvidenceReadinessInput.selectedSceneRequest
  if (
    canonicalJson(readiness.canonicalScope) !==
      canonicalJson(request.canonicalScope)
    || readiness.sourceBindings
      .selectedSceneRequestBindingDigestSha256 !==
      request.requestBindingDigestSha256
    || readiness.sourceBindings
      .selectedSceneBindingDigestSha256 !==
      request.sourceBindings.selectedSceneBindingDigestSha256
    || readiness.sourceBindings.approvedSnapshotId !==
      request.sourceBindings.approvedSnapshotId
    || readiness.sourceBindings.approvedSnapshotHashSha256 !==
      request.sourceBindings.approvedSnapshotHashSha256
    || readiness.sourceBindings.currentMasterTimingDigestSha256 !==
      request.sourceBindings.currentMasterTimingDigestSha256
    || readiness.sourceBindings
      .confirmedOutputFrameExpectationDigestSha256 !==
      request.sourceBindings.outputFrameExpectationDigestSha256
    || readiness.sourceBindings
      .canonicalWorkGraphProjectionDigestSha256 !==
      request.sourceBindings
        .canonicalWorkGraphProjectionDigestSha256
  ) {
    throw invalid(
      'cross_scene_component_work_or_output_substitution',
      '$.sourceBindings',
    )
  }
}

export function classifyLivingFrameSelectedSceneFullFrameFactEvidenceRequirement(
  sourceTruthMode: LivingFrameSourceTruthMode,
): LivingFrameControlledImageSelectedSceneFullFrameFactEvidenceRequirement {
  if (EXACT_FACT_SAFETY_MODES.has(sourceTruthMode)) {
    return 'canonical_documentary_fact_safety_snapshot_required'
  }
  if (
    sourceTruthMode === 'canonical_illustrative_interpretation'
    || sourceTruthMode === 'fictional_or_stylized'
  ) {
    return 'illustrative_or_fictional_provenance_guard_required'
  }
  if (sourceTruthMode === 'unknown_blocked') {
    return 'unknown_source_truth_blocks_promotion'
  }
  if (sourceTruthMode === 'controlled_source_expectation') {
    return 'controlled_source_revalidation_required'
  }
  return assertNever(sourceTruthMode)
}

function assertSafe(
  draft:
    LivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliationDraft,
): void {
  const {
    serverDerivedReadOnlyRequirementReconciliationAuthority,
    ...delegatedAuthorities
  } = draft.authorityBoundary
  if (
    !SAFE_ID.test(draft.reconciliationId)
    || canonicalJson(draft.openGateCodes) !==
      canonicalJson(
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_CONTINUITY_FACT_OPEN_GATES,
      )
    || serverDerivedReadOnlyRequirementReconciliationAuthority !==
      true
    || Object.values(delegatedAuthorities).some(
      (value) => value !== false,
    )
    || draft.continuityRequirements
      .validatedVisualContinuityPackPayloadAvailableInSelectedSceneInterface
    || draft.continuityRequirements
      .canonicalPersistedReferenceArtifactAvailableInSelectedSceneInterface
    || draft.continuityRequirements
      .privatePromptImageAliasIsCanonicalArtifactEvidence
    || draft.continuityRequirements
      .controlledReferenceViewExpectationIsCanonicalArtifactEvidence
    || draft.continuityRequirements
      .alignedSameViewMeasurementRequiredAtThisStage
    || !draft.continuityRequirements
      .generalSemanticStyleQaMustNotBeRelabeledAsAlignedMeasurement
    || draft.factAndProvenanceRequirements
      .documentaryFactSafetyPlanAvailableInCanonicalSelectedSceneComponents
    || draft.factAndProvenanceRequirements
      .generatedIllustrationMayBePresentedAsAuthenticArchiveOrDocumentaryEvidence
    || !draft.factAndProvenanceRequirements
      .sourceTruthMustBeRevalidatedByCanonicalOwner
    || draft.canonicalReferenceArtifactResolved
    || draft.alignedSameViewRegistrationResolved
    || draft.continuityMeasurementExecuted
    || draft.semanticVisualQaExecuted
    || draft.documentaryFactSafetyRevalidated
    || draft.artifactPersisted
    || draft.artifactQaExecuted
    || draft.sceneEvidencePackageCompiled
    || draft.assetManifestMutated
    || draft.privateReviewApproved
    || draft.renderAuthorized
    || draft.finalCanvasCreatedByComfyUi
    || draft.productionReady
    || containsUnsafeKeyOrValue(draft)
  ) {
    throw invalid('unsafe_reconciliation_forbidden', '$')
  }
}

function containsUnsafeKeyOrValue(value: unknown): boolean {
  const deniedKeys = new Set([
    'bytes',
    'path',
    'url',
    'credential',
    'secret',
    'prompt',
    'seed',
    'modelAlias',
    'command',
    'environment',
    'actualCostMicros',
    'price',
    'credits',
    'serviceFeeAmount',
    'reservation',
    'wallet',
    'ledger',
  ])
  let unsafe = false
  walk(value, (key, child) => {
    if (deniedKeys.has(key)) unsafe = true
    if (
      typeof child === 'string'
      && (URL_LIKE.test(child) || SECRET_LIKE.test(child))
    ) unsafe = true
  })
  return unsafe
}

function walk(
  value: unknown,
  visit: (key: string, child: unknown) => void,
): void {
  if (Array.isArray(value)) {
    value.forEach((child) => walk(child, visit))
    return
  }
  if (!isRecord(value)) return
  for (const [key, child] of Object.entries(value)) {
    visit(key, child)
    walk(child, visit)
  }
}

function withoutDigest(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const clone = structuredClone(value)
  delete clone.reconciliationDigestSha256
  return clone
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value), 'utf8')
    .digest('hex')
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) =>
          left.localeCompare(right))
        .map(([key, child]) => [
          key,
          canonicalize(child),
        ]),
    )
  }
  return value
}

function deepFreeze<T>(value: T): T {
  if (
    value !== null
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (const child of Object.values(
      value as Record<string, unknown>,
    )) deepFreeze(child)
  }
  return value
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
  )
}

function assertNever(value: never): never {
  throw new Error(
    `Unsupported Living Frame source-truth mode: ${String(value)}`,
  )
}

function invalid(
  code:
    LivingFrameControlledImageSelectedSceneFullFrameContinuityFactIssueCode,
  path: string,
): LivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliationError {
  if (
    !(LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_FULL_FRAME_CONTINUITY_FACT_ISSUE_CODES as
      readonly string[]).includes(code)
  ) {
    throw new Error(
      'Unknown full-frame continuity/fact reconciliation issue.',
    )
  }
  return new LivingFrameControlledImageSelectedSceneFullFrameContinuityFactReconciliationError([
    { code, path },
  ])
}
