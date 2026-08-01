import { createHash } from 'node:crypto'

import type {
  CanonicalLivingFrameControlledIllustrationGenerationWorkItem,
  CanonicalLivingFrameProjectedCanonicalWorkItem,
  CanonicalLivingFrameRembgGpuMaskWorkItem,
  CanonicalLivingFrameSharpComponentWorkItem,
  CanonicalLivingFrameWorkGraphProjection,
} from '../../src/types/living-frame-canonical-work-graph-projection'
import {
  CANONICAL_LIVING_FRAME_GENERATED_OPAQUE_STILL_OUTPUT_ROLE,
  CANONICAL_LIVING_FRAME_PENDING_OPERATION,
  CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS,
  CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_TOOL_OPERATION,
  CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORKER_CLASS,
  CANONICAL_LIVING_FRAME_SHARP_COMPONENT_TOOL_OPERATION,
  CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORKER_CLASS,
  CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_SOURCE,
  CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_VERSION,
} from '../../src/types/living-frame-canonical-work-graph-projection'
import type {
  LivingFrameControlledImageSelectedSceneAlphaWorkChainAuthority,
  LivingFrameControlledImageSelectedSceneAlphaWorkChainConflictCode,
  LivingFrameControlledImageSelectedSceneAlphaWorkChainIssue,
  LivingFrameControlledImageSelectedSceneAlphaWorkChainIssueCode,
  LivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation,
  LivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliationDraft,
} from '../../src/types/living-frame-controlled-image-selected-scene-alpha-work-chain-reconciliation'
import {
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_ALPHA_WORK_CHAIN_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_ALPHA_WORK_CHAIN_RECONCILIATION_CLASS,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_ALPHA_WORK_CHAIN_RECONCILIATION_VERSION,
} from '../../src/types/living-frame-controlled-image-selected-scene-alpha-work-chain-reconciliation'
import type {
  LivingFrameControlledImageSelectedScenePrivateOutputObservation,
} from '../../src/types/living-frame-controlled-image-selected-scene-private-output-observation'
import type {
  LivingFrameControlledImageSelectedSceneRequest,
} from '../../src/types/living-frame-controlled-image-selected-scene-request'
import {
  verifyLivingFrameControlledImageSelectedScenePrivateOutputObservation,
} from './living-frame-controlled-image-selected-scene-private-output-observation'
import {
  type CreateLivingFrameControlledImageSelectedSceneRequestInput,
  verifyLivingFrameControlledImageSelectedSceneRequest,
} from './living-frame-controlled-image-selected-scene-request'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const URL_LIKE = /(?:https?:\/\/|file:\/\/|data:|javascript:)/iu
const SECRET_LIKE =
  /(?:-----BEGIN [A-Z ]+PRIVATE KEY-----|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{16,})/u

const AUTHORITY_BOUNDARY:
  LivingFrameControlledImageSelectedSceneAlphaWorkChainAuthority =
  deepFreeze({
    serverDerivedReadOnlyReconciliationAuthority: true,
    selectedSceneAuthority: false,
    outputFrameAuthority: false,
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
    assetManifestAuthority: false,
    maskArtifactAuthority: false,
    alphaComponentAuthority: false,
    qaApprovalAuthority: false,
    privateReviewAuthority: false,
    renderAuthority: false,
    finalCanvasAuthority: false,
    productionAuthority: false,
  })

export interface CreateLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliationInput {
  readonly selectedSceneRequest:
    LivingFrameControlledImageSelectedSceneRequest
  readonly selectedSceneRequestInput:
    CreateLivingFrameControlledImageSelectedSceneRequestInput
  readonly privateOutputObservation:
    LivingFrameControlledImageSelectedScenePrivateOutputObservation
  readonly canonicalWorkGraphProjection:
    CanonicalLivingFrameWorkGraphProjection
}

export class LivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliationError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledImageSelectedSceneAlphaWorkChainIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledImageSelectedSceneAlphaWorkChainIssue[],
  ) {
    super(
      'Living Frame selected-scene alpha work-chain reconciliation failed.',
    )
    this.name =
      'LivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliationError'
    this.issues = issues
  }
}

export function compileLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation(
  input:
    CreateLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliationInput,
): LivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation {
  assertInput(input)
  const request = input.selectedSceneRequest
  const observation = input.privateOutputObservation
  const projection = input.canonicalWorkGraphProjection
  const requestUnit = request.requestUnits.find(
    (unit) =>
      unit.componentId ===
        observation.exactOutputLineage.componentId
      && unit.outputKey ===
        observation.exactOutputLineage.outputKey
      && unit.approvedWorkItemKey ===
        observation.exactOutputLineage.approvedWorkItemKey,
  )
  if (
    !requestUnit
    || requestUnit.sceneId !== observation.canonicalScope.sceneId
    || requestUnit.approvedWorkItemId !==
      observation.exactOutputLineage.approvedWorkItemId
    || requestUnit.approvedPlannedAssetManifestEntryId !==
      observation.exactOutputLineage
        .approvedPlannedAssetManifestEntryId
    || requestUnit.rendererLayerId !==
      observation.exactOutputLineage.rendererLayerId
  ) {
    throw invalid(
      'cross_scene_work_item_or_output_substitution',
      '$.privateOutputObservation.exactOutputLineage',
    )
  }

  const generationCandidates = projection.workItems
    .filter(isControlledGenerationWorkItem)
    .filter((item) =>
      item.workItemKey === requestUnit.approvedWorkItemKey
    )
  const generation =
    generationCandidates.length === 1
      ? generationCandidates[0]
      : undefined
  const generationOutputIndex =
    generation?.expectedOutputs.findIndex(
      (output) =>
        output.outputKey === requestUnit.outputKey
        && output.artifactType ===
          CANONICAL_LIVING_FRAME_GENERATED_OPAQUE_STILL_OUTPUT_ROLE
        && output.contentType === 'image/png',
    ) ?? -1
  const generatedAssetIntentId =
    generationOutputIndex >= 0
      ? generation?.executionInput
        .pendingOperationAuthority
        .generatedAssetIntentIds[generationOutputIndex]
      : undefined
  const generationOutput =
    generationOutputIndex >= 0
      ? generation?.expectedOutputs[generationOutputIndex]
      : undefined

  const isIsolated =
    observation.verifiedOutput.canvasClass ===
      'isolated_component_square_1024'
  if (
    !isIsolated
    && observation.verifiedOutput.stillAlphaPipelineRequired
  ) {
    throw invalid(
      'full_frame_alpha_chain_forbidden',
      '$.privateOutputObservation.verifiedOutput',
    )
  }

  const rembgCandidates = !isIsolated
    ? []
    : projection.workItems
      .filter(isRembgMaskWorkItem)
      .filter((item) => {
        const source =
          item.executionInput.structuredPayload.sourceDependency
        return (
          source.sourceVariant ===
            'living_frame_generated_opaque_still'
          && source.workItemKey === generation?.workItemKey
          && source.outputKey === generationOutput?.outputKey
          && source.assetIntentId === generatedAssetIntentId
          && item.dependencyKeys.includes(
            generation?.workItemKey ?? '',
          )
        )
      })
  const rembg =
    rembgCandidates.length === 1
      ? rembgCandidates[0]
      : undefined
  const maskOutput =
    rembg?.expectedOutputs.length === 1
    && rembg.expectedOutputs[0]?.artifactType ===
      'living_frame_alpha_mask_png'
    && rembg.expectedOutputs[0]?.contentType === 'image/png'
      ? rembg.expectedOutputs[0]
      : undefined

  const sharpCandidates = !isIsolated || !rembg
    ? []
    : projection.workItems
      .filter(isSharpComponentWorkItem)
      .filter((item) =>
        item.dependencyKeys.includes(rembg.workItemKey)
        && item.dependencyKeys.includes(
          generation?.workItemKey ?? '',
        ))
  const sharp =
    sharpCandidates.length === 1
      ? sharpCandidates[0]
      : undefined
  const rgbaOutput =
    sharp?.expectedOutputs.length === 1
    && sharp.expectedOutputs[0]?.artifactType ===
      'living_frame_component_rgba_png'
    && sharp.expectedOutputs[0]?.contentType === 'image/png'
      ? sharp.expectedOutputs[0]
      : undefined

  const conflictCodes:
    LivingFrameControlledImageSelectedSceneAlphaWorkChainConflictCode[] =
    []
  if (!generation) {
    conflictCodes.push('canonical_generation_work_item_missing')
  }
  if (!generationOutput) {
    conflictCodes.push('canonical_generation_output_missing')
  }
  if (!generatedAssetIntentId) {
    conflictCodes.push('canonical_generated_asset_intent_missing')
  }
  if (isIsolated && !rembg) {
    conflictCodes.push('canonical_rembg_work_item_missing')
    if (
      generation
      && generation.expectedOutputs.length > 1
      && generationOutput
      && generatedAssetIntentId
    ) {
      conflictCodes.push(
        'canonical_multi_output_generation_not_admitted_to_rembg',
      )
    }
  }
  if (
    isIsolated
    && rembg
    && (
      rembg.executionInput.structuredPayload
        .sourceDependency.sourceVariant !==
          'living_frame_generated_opaque_still'
      || rembg.executionInput.structuredPayload
        .sourceDependency.outputKey !==
          generationOutput?.outputKey
      || rembg.executionInput.structuredPayload
        .sourceDependency.assetIntentId !==
          generatedAssetIntentId
    )
  ) {
    conflictCodes.push('canonical_rembg_source_lineage_mismatch')
  }
  if (isIsolated && !maskOutput) {
    conflictCodes.push('canonical_rembg_mask_output_missing')
  }
  if (isIsolated && !sharp) {
    conflictCodes.push('canonical_sharp_work_item_missing')
  }
  if (
    isIsolated
    && sharp
    && (
      !sharp.dependencyKeys.includes(rembg?.workItemKey ?? '')
      || !sharp.dependencyKeys.includes(
        generation?.workItemKey ?? '',
      )
    )
  ) {
    conflictCodes.push(
      'canonical_sharp_dependency_lineage_mismatch',
    )
  }
  if (isIsolated && !rgbaOutput) {
    conflictCodes.push('canonical_sharp_rgba_output_missing')
  }

  const exactChainReconciled =
    isIsolated
    && conflictCodes.length === 0
    && Boolean(
      generation
      && generationOutput
      && generatedAssetIntentId
      && rembg
      && maskOutput
      && sharp
      && rgbaOutput,
    )
  const reconciliationState = !isIsolated
    ? 'not_applicable_to_confirmed_full_frame_plate'
    : exactChainReconciled
      ? 'exact_canonical_generated_alpha_work_chain_reconciled'
      : 'blocked_by_missing_canonical_generated_alpha_work_chain'

  const draft:
    LivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliationDraft =
    {
      contractVersion:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_ALPHA_WORK_CHAIN_RECONCILIATION_VERSION,
      resultClass:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_ALPHA_WORK_CHAIN_RECONCILIATION_CLASS,
      reconciliationState,
      reconciliationId:
        `lf-selected-alpha-chain.${digest({
          observation:
            observation.observationDigestSha256,
          workGraph: projection.projectionDigestSha256,
        }).slice(0, 40)}`,
      canonicalScope: observation.canonicalScope,
      exactOutputLineage: {
        componentId: requestUnit.componentId,
        outputKey: requestUnit.outputKey,
        approvedWorkItemId:
          requestUnit.approvedWorkItemId,
        approvedWorkItemKey:
          requestUnit.approvedWorkItemKey,
        approvedPlannedAssetManifestEntryId:
          requestUnit.approvedPlannedAssetManifestEntryId,
        rendererLayerId: requestUnit.rendererLayerId,
        generationWorkItemKey:
          generation?.workItemKey ?? null,
        generatedAssetIntentId:
          generatedAssetIntentId ?? null,
        rembgWorkItemKey: rembg?.workItemKey ?? null,
        rembgMaskOutputKey:
          maskOutput?.outputKey ?? null,
        sharpWorkItemKey: sharp?.workItemKey ?? null,
        rgbaComponentOutputKey:
          rgbaOutput?.outputKey ?? null,
      },
      sourceBindings: {
        selectedSceneRequestBindingDigestSha256:
          request.requestBindingDigestSha256,
        privateOutputObservationDigestSha256:
          observation.observationDigestSha256,
        canonicalWorkGraphProjectionDigestSha256:
          projection.projectionDigestSha256,
        approvedSnapshotId:
          observation.sourceBindings.approvedSnapshotId,
        approvedSnapshotHashSha256:
          observation.sourceBindings
            .approvedSnapshotHashSha256,
        selectedSceneBindingDigestSha256:
          observation.sourceBindings
            .selectedSceneBindingDigestSha256,
        currentMasterTimingDigestSha256:
          observation.sourceBindings
            .currentMasterTimingDigestSha256,
        controlledIllustrationCostWorkBindingDigestSha256:
          observation.sourceBindings
            .controlledIllustrationCostWorkBindingDigestSha256,
        confirmedOutputFrameExpectationDigestSha256:
          observation.sourceBindings
            .confirmedOutputFrameExpectationDigestSha256,
      },
      workGraphEvidence: {
        generationWorkItemMatched: Boolean(generation),
        generationOutputMatched: Boolean(generationOutput),
        exactGeneratedAssetIntentMatched:
          Boolean(generatedAssetIntentId),
        exactRembgGeneratedSourceDependencyMatched:
          Boolean(rembg),
        rembgMaskExpectedOutputMatched:
          Boolean(maskOutput),
        sharpDependsOnExactGenerationAndMask:
          Boolean(sharp),
        sharpRgbaExpectedOutputMatched:
          Boolean(rgbaOutput),
        generationWorkItemExpectedOutputCount:
          generation?.expectedOutputs.length ?? 0,
        sourceOutputMaterializationIsPerExactIntent: true,
      },
      alphaPipelineExpectation: {
        appliesToIsolatedComponentOnly: true,
        fullFramePlateMustNotEnterAlphaPipeline: true,
        sourceCanvasClass:
          observation.verifiedOutput.canvasClass,
        sourceWidthPixels:
          observation.verifiedOutput.widthPixels,
        sourceHeightPixels:
          observation.verifiedOutput.heightPixels,
        sourceMustRemainOpaqueUntilRembg: true,
        canonicalRembgToolId: 'rembg',
        canonicalRembgOperationId:
          CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_TOOL_OPERATION,
        canonicalSharpToolId: 'sharp',
        canonicalSharpOperationId:
          CANONICAL_LIVING_FRAME_SHARP_COMPONENT_TOOL_OPERATION,
        remotionRemainsFinalCanvasOwner: true,
      },
      costLineage: {
        comfyUiGpuAttemptMustNotBeChargedAgain: true,
        rembgAndSharpKeepExistingIndependentCostOwners: true,
        costAmountIncluded: false,
        customerPriceOrCreditIncluded: false,
        serviceFeeIncluded: false,
      },
      registryPolicy: {
        currentObservedCountIsProductCap: false,
        registryExpansionPermitted: true,
        postAdmissionCountDerivedFromReleasedDistinctIdentities:
          true,
        oneComfyUiIdentityForSharedGpuAttempt: true,
        fakeIdentityForModelWeightAdapterLibraryOrPreprocessorAllowed:
          false,
      },
      conflictCodes: uniqueSorted(conflictCodes),
      openGateCodes:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_ALPHA_WORK_CHAIN_OPEN_GATES,
      authorityBoundary: AUTHORITY_BOUNDARY,
      selectedSceneRequestRevalidated: true,
      privateOutputObservationRevalidated: true,
      workGraphIntegrityRevalidated: true,
      exactSceneComponentWorkItemAndOutputLineageMatched:
        Boolean(generation && generationOutput),
      canonicalWorkGraphMutated: false,
      rembgRequestCreated: false,
      rembgInferenceExecuted: false,
      maskArtifactCreated: false,
      transparentComponentCreated: false,
      assetManifestMutated: false,
      qaApproved: false,
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

export function verifyLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation(
  value: unknown,
  input:
    CreateLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliationInput,
): value is LivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation {
  try {
    const expected =
      compileLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliation(
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

function assertInput(
  input:
    CreateLivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliationInput,
): void {
  if (
    !input
    || !verifyLivingFrameControlledImageSelectedSceneRequest(
      input.selectedSceneRequest,
      input.selectedSceneRequestInput,
    )
  ) {
    throw invalid(
      'selected_scene_request_invalid',
      '$.selectedSceneRequest',
    )
  }
  if (
    !verifyLivingFrameControlledImageSelectedScenePrivateOutputObservation(
      input.privateOutputObservation,
    )
  ) {
    throw invalid(
      'output_observation_invalid',
      '$.privateOutputObservation',
    )
  }
  const request = input.selectedSceneRequest
  const observation = input.privateOutputObservation
  const projection = input.canonicalWorkGraphProjection
  if (
    !projection
    || projection.schemaVersion !==
      CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_VERSION
    || projection.source !==
      CANONICAL_LIVING_FRAME_WORK_GRAPH_PROJECTION_SOURCE
    || projection.projectionDigestSha256 !==
      digest(withoutProjectionDigest(projection))
    || projection.containsRawChatTranscriptMediaBytesPathsUrlsOrCredentials
      !== false
    || projection.containsProviderPrompt !== false
    || projection.containsControlledIllustrationExecutablePayload
      !== false
    || projection.createsApprovedWorkItems !== false
    || projection.createsAssetManifestEntries !== false
    || projection.currentResourcePlacementExecutionReady !== false
    || projection.productionReady !== false
  ) {
    throw invalid(
      'work_graph_integrity_invalid',
      '$.canonicalWorkGraphProjection',
    )
  }
  if (
    canonicalJson(request.canonicalScope) !==
      canonicalJson(observation.canonicalScope)
    || canonicalJson(projection.identity) !==
      canonicalJson({
        workspaceId: observation.canonicalScope.workspaceId,
        projectId: observation.canonicalScope.projectId,
        editSessionId:
          observation.canonicalScope.editSessionId,
      })
    || request.requestBindingDigestSha256 !==
      observation.sourceBindings
        .selectedSceneRequestBindingDigestSha256
    || request.sourceBindings
      .canonicalWorkGraphProjectionDigestSha256 !==
      projection.projectionDigestSha256
    || observation.sourceBindings
      .canonicalWorkGraphProjectionDigestSha256 !==
      projection.projectionDigestSha256
    || request.sourceBindings.approvedSnapshotId !==
      observation.sourceBindings.approvedSnapshotId
    || request.sourceBindings.approvedSnapshotHashSha256 !==
      observation.sourceBindings.approvedSnapshotHashSha256
    || request.sourceBindings.selectedSceneBindingDigestSha256 !==
      observation.sourceBindings.selectedSceneBindingDigestSha256
    || request.sourceBindings.currentMasterTimingDigestSha256 !==
      observation.sourceBindings.currentMasterTimingDigestSha256
    || request.sourceBindings
      .controlledIllustrationCostWorkBindingDigestSha256 !==
      observation.sourceBindings
        .controlledIllustrationCostWorkBindingDigestSha256
    || request.sourceBindings.outputFrameExpectationDigestSha256 !==
      observation.sourceBindings
        .confirmedOutputFrameExpectationDigestSha256
  ) {
    throw invalid(
      'cross_scene_work_item_or_output_substitution',
      '$.sourceBindings',
    )
  }
}

function assertSafe(
  draft:
    LivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliationDraft,
): void {
  const isolated =
    draft.alphaPipelineExpectation.sourceCanvasClass ===
      'isolated_component_square_1024'
  const ready =
    draft.reconciliationState ===
      'exact_canonical_generated_alpha_work_chain_reconciled'
  const notApplicable =
    draft.reconciliationState ===
      'not_applicable_to_confirmed_full_frame_plate'
  if (
    !SAFE_ID.test(draft.reconciliationId)
    || canonicalJson(draft.openGateCodes) !==
      canonicalJson(
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_ALPHA_WORK_CHAIN_OPEN_GATES,
      )
    || canonicalJson(draft.authorityBoundary) !==
      canonicalJson(AUTHORITY_BOUNDARY)
    || (isolated && (
      draft.alphaPipelineExpectation.sourceWidthPixels !== 1_024
      || draft.alphaPipelineExpectation.sourceHeightPixels !== 1_024
    ))
    || (notApplicable && isolated)
    || (ready && (
      !isolated
      || draft.conflictCodes.length !== 0
      || !draft.workGraphEvidence.generationWorkItemMatched
      || !draft.workGraphEvidence.generationOutputMatched
      || !draft.workGraphEvidence.exactGeneratedAssetIntentMatched
      || !draft.workGraphEvidence
        .exactRembgGeneratedSourceDependencyMatched
      || !draft.workGraphEvidence.rembgMaskExpectedOutputMatched
      || !draft.workGraphEvidence
        .sharpDependsOnExactGenerationAndMask
      || !draft.workGraphEvidence.sharpRgbaExpectedOutputMatched
    ))
    || (
      isolated
      && !ready
      && draft.conflictCodes.length === 0
    )
    || draft.canonicalWorkGraphMutated
    || draft.rembgRequestCreated
    || draft.rembgInferenceExecuted
    || draft.maskArtifactCreated
    || draft.transparentComponentCreated
    || draft.assetManifestMutated
    || draft.qaApproved
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
    'dimension',
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

function withoutProjectionDigest(
  value: CanonicalLivingFrameWorkGraphProjection,
): Record<string, unknown> {
  const clone =
    structuredClone(value) as unknown as Record<string, unknown>
  delete clone.projectionDigestSha256
  return clone
}

function isControlledGenerationWorkItem(
  item: CanonicalLivingFrameProjectedCanonicalWorkItem,
): item is CanonicalLivingFrameControlledIllustrationGenerationWorkItem {
  return (
    item.workItemType === 'generate_image_asset'
    && item.workerClass ===
      CANONICAL_LIVING_FRAME_PENDING_OPERATION_WORKER_CLASS
    && item.executionInput.operation ===
      CANONICAL_LIVING_FRAME_PENDING_OPERATION
  )
}

function isRembgMaskWorkItem(
  item: CanonicalLivingFrameProjectedCanonicalWorkItem,
): item is CanonicalLivingFrameRembgGpuMaskWorkItem {
  return (
    item.workItemType === 'generate_mask_asset'
    && item.workerClass ===
      CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_WORKER_CLASS
    && item.executionInput.operation ===
      'generate_approved_living_frame_rembg_mask_png'
    && item.executionInput.approvedToolOperationIds[0] ===
      CANONICAL_LIVING_FRAME_REMBG_GPU_MASK_TOOL_OPERATION
  )
}

function isSharpComponentWorkItem(
  item: CanonicalLivingFrameProjectedCanonicalWorkItem,
): item is CanonicalLivingFrameSharpComponentWorkItem {
  return (
    item.workItemType === 'process_image_asset'
    && item.workerClass ===
      CANONICAL_LIVING_FRAME_SHARP_COMPONENT_WORKER_CLASS
    && item.executionInput.operation ===
      'prepare_approved_living_frame_rgba_component'
    && item.executionInput.approvedToolOperationIds[0] ===
      CANONICAL_LIVING_FRAME_SHARP_COMPONENT_TOOL_OPERATION
  )
}

function withoutDigest(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const clone = structuredClone(value)
  delete clone.reconciliationDigestSha256
  return clone
}

function uniqueSorted<T extends string>(
  values: readonly T[],
): T[] {
  return [...new Set(values)].sort()
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

function invalid(
  code:
    LivingFrameControlledImageSelectedSceneAlphaWorkChainIssueCode,
  path: string,
): LivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliationError {
  return new LivingFrameControlledImageSelectedSceneAlphaWorkChainReconciliationError([
    { code, path },
  ])
}
