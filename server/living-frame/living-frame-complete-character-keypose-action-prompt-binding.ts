import {
  LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_ACTION_PROMPT_BINDING_VERSION,
  LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_ACTION_PROMPT_MERGE_EVIDENCE_VERSION,
  type LivingFrameCompleteCharacterKeyposeActionPromptBinding,
  type LivingFrameCompleteCharacterKeyposeActionPromptBindingDraft,
  type LivingFrameCompleteCharacterKeyposeActionPromptBindingIssue,
  type LivingFrameCompleteCharacterKeyposeActionPromptBindingIssueCode,
  type LivingFrameCompleteCharacterKeyposeActionPromptBindingUnit,
  type LivingFrameCompleteCharacterKeyposeActionPromptMergeEvidence,
  type LivingFrameCompleteCharacterKeyposeActionPromptMergeEvidenceDraft,
  type LivingFrameCompleteCharacterKeyposeActionPromptMergeEvidenceUnit,
} from '../../src/types/living-frame-complete-character-keypose-action-prompt-binding'
import type {
  LivingFrameCompleteCharacterKeyposePrivateActionConditioning,
} from '../../src/types/living-frame-complete-character-keypose-private-action-conditioning'
import type {
  LivingFrameControlledImageSelectedScenePrivatePromptMaterialization,
  LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit,
} from '../../src/types/living-frame-controlled-image-selected-scene-private-prompt-materialization'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  type CreateLivingFrameCompleteCharacterKeyposePrivateActionConditioningInput,
  isLivingFrameCompleteCharacterKeyposeActionPromptMergeEvidenceProcessBound,
  verifyLivingFrameCompleteCharacterKeyposePrivateActionConditioning,
} from './living-frame-complete-character-keypose-private-action-conditioning'
import {
  verifyLivingFrameControlledImageSelectedScenePrivatePromptMaterialization,
} from './living-frame-controlled-image-selected-scene-private-prompt-materialization'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u

export interface CreateLivingFrameCompleteCharacterKeyposeActionPromptBindingInput {
  readonly promptBindingId: string
  readonly actionConditioning:
    LivingFrameCompleteCharacterKeyposePrivateActionConditioning
  readonly actionConditioningInput:
    CreateLivingFrameCompleteCharacterKeyposePrivateActionConditioningInput
  readonly promptMergeEvidence:
    LivingFrameCompleteCharacterKeyposeActionPromptMergeEvidence
  readonly promptMaterialization:
    LivingFrameControlledImageSelectedScenePrivatePromptMaterialization
}

export class LivingFrameCompleteCharacterKeyposeActionPromptBindingError
  extends Error {
  readonly issues:
    readonly LivingFrameCompleteCharacterKeyposeActionPromptBindingIssue[]

  constructor(
    issues:
      readonly LivingFrameCompleteCharacterKeyposeActionPromptBindingIssue[],
  ) {
    super(
      'Living Frame complete-character keypose action prompt binding failed.',
    )
    this.name =
      'LivingFrameCompleteCharacterKeyposeActionPromptBindingError'
    this.issues = issues
  }
}

export async function compileLivingFrameCompleteCharacterKeyposeActionPromptBinding(
  input:
    CreateLivingFrameCompleteCharacterKeyposeActionPromptBindingInput,
): Promise<LivingFrameCompleteCharacterKeyposeActionPromptBinding> {
  assertInput(input)
  if (
    !await verifyLivingFrameCompleteCharacterKeyposePrivateActionConditioning(
      input.actionConditioning,
      input.actionConditioningInput,
    )
  ) throw invalid(
    'action_conditioning_invalid',
    '$.actionConditioning',
  )
  if (
    !verifyLivingFrameCompleteCharacterKeyposeActionPromptMergeEvidence(
      input.promptMergeEvidence,
    )
    || !isLivingFrameCompleteCharacterKeyposeActionPromptMergeEvidenceProcessBound(
      input.promptMergeEvidence,
    )
  ) throw invalid(
    'prompt_merge_evidence_invalid',
    '$.promptMergeEvidence',
  )
  if (!verifyLivingFrameControlledImageSelectedScenePrivatePromptMaterialization(
    input.promptMaterialization,
  )) throw invalid(
    'prompt_materialization_invalid',
    '$.promptMaterialization',
  )
  assertSourceLineage(input)

  const mergeByRequestId = uniqueMap(
    input.promptMergeEvidence.units,
    (unit) => unit.selectedSceneRequestUnitId,
    '$.promptMergeEvidence.units',
  )
  const materializationByRequestId = uniqueMap(
    input.promptMaterialization.materializationUnits,
    (unit) => unit.requestUnitId,
    '$.promptMaterialization.materializationUnits',
  )
  const promptBindingUnits =
    input.actionConditioning.conditioningUnits.map(
      (conditioningUnit, order) => compileUnit({
        promptBindingId: input.promptBindingId,
        order,
        conditioningUnit,
        mergeUnit: mergeByRequestId.get(
          conditioningUnit.selectedSceneRequestUnitId,
        ),
        materializationUnit: materializationByRequestId.get(
          conditioningUnit.selectedSceneRequestUnitId,
        ),
      }),
    )

  const draft:
    LivingFrameCompleteCharacterKeyposeActionPromptBindingDraft = {
      contractVersion:
        LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_ACTION_PROMPT_BINDING_VERSION,
      resultClass:
        'server_derived_non_executable_complete_character_action_prompt_binding',
      bindingState:
        'every_action_keypose_exactly_bound_to_private_materialized_prompt_runtime_blocked',
      promptBindingId: input.promptBindingId,
      canonicalScope: {
        ...input.actionConditioning.canonicalScope,
      },
      sourceBindings: {
        actionConditioningId:
          input.actionConditioning.conditioningId,
        actionConditioningDigestSha256:
          input.actionConditioning.conditioningDigestSha256,
        promptMergeEvidenceId:
          input.promptMergeEvidence.mergeEvidenceId,
        promptMergeEvidenceDigestSha256:
          input.promptMergeEvidence.mergeEvidenceDigestSha256,
        promptMaterializationVersion:
          input.promptMaterialization.contractVersion,
        promptMaterializationBatchId:
          input.promptMaterialization.materializationBatchId,
        promptMaterializationDigestSha256:
          input.promptMaterialization.materializationDigestSha256,
        selectedSceneRequestBindingDigestSha256:
          input.actionConditioning.sourceBindings
            .selectedSceneRequestBindingDigestSha256,
        approvedSnapshotId:
          input.actionConditioning.sourceBindings.approvedSnapshotId,
        approvedSnapshotHashSha256:
          input.actionConditioning.sourceBindings
            .approvedSnapshotHashSha256,
        currentMasterTimingDigestSha256:
          input.actionConditioning.sourceBindings
            .currentMasterTimingDigestSha256,
      },
      promptBindingUnits,
      metrics: {
        actionKeyposeCount:
          promptBindingUnits.length as 3 | 4,
        exactPositiveDigestMatchCount:
          promptBindingUnits.length,
        exactNegativeDigestMatchCount:
          promptBindingUnits.length,
        controlNetUnitCount:
          promptBindingUnits.filter((unit) =>
            unit.graphPolicy.controlNetEnabled).length,
        genericIpAdapterUnitCount:
          promptBindingUnits.filter((unit) =>
            unit.graphPolicy.genericIpAdapterEnabled).length,
      },
      proofBoundary: {
        actionTextRemainsPrivate: true,
        receiptContainsOnlyDigestsCountsAndLineage: true,
        everyActionKeyposeHasOneMaterializedPrompt: true,
        everyMaterializedActionPromptHasOneKeypose: true,
        promptMaterializerRemainsCanonicalOwner: true,
        operationRequestMayUseOnlyExactBoundMaterializationUnit:
          true,
        independentPerFrameGenerationAllowed: false,
        professionalVisualAcceptanceRequiredAfterGeneration:
          true,
        remotionOwnsFinalCanvas: true,
      },
      privatePromptMaterializationReconciled: true,
      operationRegistered: false,
      dispatchGranted: false,
      runtimeExecuted: false,
      assetCreated: false,
      canonicalQaApproved: false,
      actualCostReceiptCreated: false,
      productionReady: false,
    }
  assertBindingDraft(draft)
  return deepFreeze({
    ...draft,
    promptBindingDigestSha256:
      sha256AuthorityValue(draft),
  })
}

export async function verifyLivingFrameCompleteCharacterKeyposeActionPromptBinding(
  value: unknown,
  input:
    CreateLivingFrameCompleteCharacterKeyposeActionPromptBindingInput,
): Promise<boolean> {
  try {
    if (
      !isRecord(value)
      || value.contractVersion !==
        LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_ACTION_PROMPT_BINDING_VERSION
      || typeof value.promptBindingDigestSha256 !== 'string'
      || !SHA256.test(value.promptBindingDigestSha256)
    ) return false
    const { promptBindingDigestSha256, ...draft } = value
    if (
      promptBindingDigestSha256 !==
        sha256AuthorityValue(draft)
    ) return false
    const expected =
      await compileLivingFrameCompleteCharacterKeyposeActionPromptBinding(
        input,
      )
    return stableAuthorityStringify(value) ===
      stableAuthorityStringify(expected)
  } catch {
    return false
  }
}

export function verifyLivingFrameCompleteCharacterKeyposeActionPromptMergeEvidence(
  value: unknown,
): value is LivingFrameCompleteCharacterKeyposeActionPromptMergeEvidence {
  try {
    if (
      !isRecord(value)
      || value.contractVersion !==
        LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_ACTION_PROMPT_MERGE_EVIDENCE_VERSION
      || typeof value.mergeEvidenceDigestSha256 !== 'string'
      || !SHA256.test(value.mergeEvidenceDigestSha256)
    ) return false
    const { mergeEvidenceDigestSha256, ...draft } = value
    assertMergeEvidenceDraft(
      draft as unknown as
        LivingFrameCompleteCharacterKeyposeActionPromptMergeEvidenceDraft,
    )
    return mergeEvidenceDigestSha256 ===
      sha256AuthorityValue(draft)
  } catch {
    return false
  }
}

function compileUnit(input: {
  readonly promptBindingId: string
  readonly order: number
  readonly conditioningUnit:
    LivingFrameCompleteCharacterKeyposePrivateActionConditioning[
      'conditioningUnits'
    ][number]
  readonly mergeUnit:
    LivingFrameCompleteCharacterKeyposeActionPromptMergeEvidenceUnit | undefined
  readonly materializationUnit:
    LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit | undefined
}): LivingFrameCompleteCharacterKeyposeActionPromptBindingUnit {
  const {
    conditioningUnit,
    mergeUnit,
    materializationUnit,
  } = input
  if (!mergeUnit || !materializationUnit) throw invalid(
    'unit_set_mismatch',
    `$.promptBindingUnits.${input.order}`,
  )
  if (
    conditioningUnit.order !== input.order
    || mergeUnit.order !== input.order
    || mergeUnit.conditioningUnitId !==
      conditioningUnit.conditioningUnitId
    || mergeUnit.conditioningUnitDigestSha256 !==
      conditioningUnit.conditioningUnitDigestSha256
    || mergeUnit.selectedSceneRequestUnitId !==
      conditioningUnit.selectedSceneRequestUnitId
    || mergeUnit.selectedSceneRequestUnitDigestSha256 !==
      conditioningUnit.selectedSceneRequestUnitDigestSha256
    || materializationUnit.requestUnitId !==
      conditioningUnit.selectedSceneRequestUnitId
    || materializationUnit.requestUnitDigestSha256 !==
      conditioningUnit.selectedSceneRequestUnitDigestSha256
    || mergeUnit.approvedWorkItemId !==
      conditioningUnit.approvedWorkItemId
    || mergeUnit.approvedWorkItemKey !==
      conditioningUnit.approvedWorkItemKey
    || mergeUnit.approvedPlannedAssetManifestEntryId !==
      conditioningUnit.approvedPlannedAssetManifestEntryId
    || mergeUnit.outputKey !== conditioningUnit.outputKey
    || materializationUnit.approvedWorkItemId !==
      conditioningUnit.approvedWorkItemId
    || materializationUnit.approvedWorkItemKey !==
      conditioningUnit.approvedWorkItemKey
    || materializationUnit.approvedPlannedAssetManifestEntryId !==
      conditioningUnit.approvedPlannedAssetManifestEntryId
    || materializationUnit.outputKey !== conditioningUnit.outputKey
  ) throw invalid(
    'cross_keypose_work_item_or_output_substitution',
    `$.promptBindingUnits.${input.order}`,
  )
  if (
    mergeUnit.positiveActionDirectiveDigestSha256 !==
      conditioningUnit.privateConditioningReceipt
        .positiveActionDirectiveDigestSha256
    || mergeUnit.negativeActionDirectiveDigestSha256 !==
      conditioningUnit.privateConditioningReceipt
        .negativeActionDirectiveDigestSha256
  ) throw invalid(
    'conditioning_digest_mismatch',
    `$.promptBindingUnits.${input.order}`,
  )
  const positiveSlot = exactConditioningSlot(
    materializationUnit,
    'positive_conditioning_text',
    input.order,
  )
  const negativeSlot = exactConditioningSlot(
    materializationUnit,
    'negative_conditioning_text',
    input.order,
  )
  if (
    positiveSlot.valueDigestSha256 !==
      mergeUnit.mergedPositiveConditioningDigestSha256
    || negativeSlot.valueDigestSha256 !==
      mergeUnit.mergedNegativeConditioningDigestSha256
  ) throw invalid(
    'conditioning_digest_mismatch',
    `$.promptBindingUnits.${input.order}`,
  )
  if (
    materializationUnit.graphProfile.qualifiedGraphFamily !==
      'controlled_sdxl_selected_scene_v1'
    || !materializationUnit.graphProfile.enabledFeatures.includes(
      'controlnet',
    )
    || !materializationUnit.graphProfile.enabledFeatures.includes(
      'generic_ipadapter',
    )
    || materializationUnit.graphProfile.faceIdOrInsightFaceAllowed
    || materializationUnit.graphProfile.inGraphPreprocessorAllowed
    || materializationUnit.graphProfile.arbitrarySaveOrPreviewNodeAllowed
    || !materializationUnit.graphProfile.websocketOutputOnly
  ) throw invalid(
    'graph_policy_invalid',
    `$.promptBindingUnits.${input.order}.graphPolicy`,
  )
  if (
    materializationUnit.generationCanvas.canvasClass !==
      'isolated_component_square_1024'
    || materializationUnit.generationCanvas.widthPixels !== 1_024
    || materializationUnit.generationCanvas.heightPixels !== 1_024
    || materializationUnit.generationCanvas.finalCanvasCreatedByComfyUi
  ) throw invalid(
    'generation_canvas_invalid',
    `$.promptBindingUnits.${input.order}.generationCanvas`,
  )
  const identity = {
    promptBindingId: input.promptBindingId,
    conditioningUnitId: conditioningUnit.conditioningUnitId,
    materializationUnitId: materializationUnit.materializationUnitId,
    requestUnitId: conditioningUnit.selectedSceneRequestUnitId,
    outputKey: conditioningUnit.outputKey,
  }
  const promptBindingUnitId =
    `lf-keypose-prompt-binding.${sha256AuthorityValue(identity).slice(0, 40)}`
  const draft = {
    order: input.order,
    promptBindingUnitId,
    conditioningUnitId: conditioningUnit.conditioningUnitId,
    conditioningUnitDigestSha256:
      conditioningUnit.conditioningUnitDigestSha256,
    materializationUnitId:
      materializationUnit.materializationUnitId,
    materializationUnitDigestSha256:
      materializationUnit.materializationUnitDigestSha256,
    selectedSceneRequestUnitId:
      conditioningUnit.selectedSceneRequestUnitId,
    selectedSceneRequestUnitDigestSha256:
      conditioningUnit.selectedSceneRequestUnitDigestSha256,
    approvedWorkItemId: conditioningUnit.approvedWorkItemId,
    approvedWorkItemKey: conditioningUnit.approvedWorkItemKey,
    approvedPlannedAssetManifestEntryId:
      conditioningUnit.approvedPlannedAssetManifestEntryId,
    outputKey: conditioningUnit.outputKey,
    positiveConditioning: {
      actionDirectiveDigestSha256:
        mergeUnit.positiveActionDirectiveDigestSha256,
      mergedConditioningDigestSha256:
        mergeUnit.mergedPositiveConditioningDigestSha256,
      materializedPromptSlotDigestSha256:
        positiveSlot.valueDigestSha256,
      exactDigestMatch: true,
    },
    negativeConditioning: {
      actionDirectiveDigestSha256:
        mergeUnit.negativeActionDirectiveDigestSha256,
      mergedConditioningDigestSha256:
        mergeUnit.mergedNegativeConditioningDigestSha256,
      materializedPromptSlotDigestSha256:
        negativeSlot.valueDigestSha256,
      exactDigestMatch: true,
    },
    graphPolicy: {
      graphFamily: 'controlled_sdxl_selected_scene_v1',
      controlNetEnabled: true,
      genericIpAdapterEnabled: true,
      faceIdOrInsightFaceAllowed: false,
      inGraphPreprocessorAllowed: false,
      arbitrarySaveOrPreviewNodeAllowed: false,
      websocketOutputOnly: true,
    },
    generationCanvas: {
      widthPixels: 1_024,
      heightPixels: 1_024,
      finalCanvasCreatedByComfyUi: false,
    },
    operationRegistered: false,
    dispatched: false,
    runtimeExecuted: false,
    assetCreated: false,
    qaApproved: false,
  } as const
  return deepFreeze({
    ...draft,
    promptBindingUnitDigestSha256:
      sha256AuthorityValue(draft),
  })
}

function exactConditioningSlot(
  unit:
    LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit,
  slotKind:
    | 'positive_conditioning_text'
    | 'negative_conditioning_text',
  order: number,
) {
  const slots = unit.privatePromptRequest.slotReceipts.filter((slot) =>
    slot.slotKind === slotKind)
  if (
    slots.length !== 1
    || slots[0]!.valueClass !== 'private_conditioning_text'
    || !SHA256.test(slots[0]!.valueDigestSha256)
    || slots[0]!.valueIncluded
  ) throw invalid(
    'conditioning_digest_mismatch',
    `$.promptBindingUnits.${order}.${slotKind}`,
  )
  return slots[0]!
}

function assertSourceLineage(
  input:
    CreateLivingFrameCompleteCharacterKeyposeActionPromptBindingInput,
): void {
  const conditioning = input.actionConditioning
  const evidence = input.promptMergeEvidence
  const materialization = input.promptMaterialization
  if (
    evidence.sourceBindings.actionConditioningId !==
      conditioning.conditioningId
    || evidence.sourceBindings.actionConditioningDigestSha256 !==
      conditioning.conditioningDigestSha256
    || evidence.sourceBindings.selectedSceneRequestBindingDigestSha256 !==
      conditioning.sourceBindings.selectedSceneRequestBindingDigestSha256
    || materialization.sourceBindings
      .selectedSceneRequestBindingDigestSha256 !==
        conditioning.sourceBindings.selectedSceneRequestBindingDigestSha256
    || evidence.sourceBindings.approvedSnapshotId !==
      conditioning.sourceBindings.approvedSnapshotId
    || evidence.sourceBindings.approvedSnapshotHashSha256 !==
      conditioning.sourceBindings.approvedSnapshotHashSha256
    || materialization.sourceBindings.approvedSnapshotId !==
      conditioning.sourceBindings.approvedSnapshotId
    || materialization.sourceBindings.approvedSnapshotHashSha256 !==
      conditioning.sourceBindings.approvedSnapshotHashSha256
    || materialization.sourceBindings.currentMasterTimingDigestSha256 !==
      conditioning.sourceBindings.currentMasterTimingDigestSha256
    || materialization.canonicalScope.workspaceId !==
      conditioning.canonicalScope.workspaceId
    || materialization.canonicalScope.projectId !==
      conditioning.canonicalScope.projectId
    || materialization.canonicalScope.editSessionId !==
      conditioning.canonicalScope.editSessionId
    || materialization.canonicalScope.sceneId !==
      conditioning.canonicalScope.sceneId
  ) throw invalid('source_lineage_mismatch', '$')
  if (
    evidence.units.length !== conditioning.conditioningUnits.length
    || evidence.keyposeUnitCount !== conditioning.conditioningUnits.length
    || materialization.materializationUnits.length - evidence.units.length !==
      evidence.nonKeyposeSelectedSceneUnitCount
  ) throw invalid('unit_set_mismatch', '$')
}

function assertMergeEvidenceDraft(
  draft:
    LivingFrameCompleteCharacterKeyposeActionPromptMergeEvidenceDraft,
): void {
  if (
    !hasExactKeys(draft as unknown as Record<string, unknown>, [
      'contractVersion',
      'evidenceClass',
      'mergeState',
      'mergeEvidenceId',
      'serverOwnedLocatorDigestSha256',
      'sourceBindings',
      'units',
      'keyposeUnitCount',
      'nonKeyposeSelectedSceneUnitCount',
      'everyActionLeaseConsumedExactlyOnce',
      'nonKeyposeSelectedSceneUnitsUnchanged',
      'rawPromptConditioningAliasImageModelPathUrlBytesCredentialCommandOrEnvironmentIncluded',
      'operationRegistered',
      'dispatchGranted',
      'runtimeExecuted',
      'productionReady',
    ])
    || draft.contractVersion !==
      LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_ACTION_PROMPT_MERGE_EVIDENCE_VERSION
    || draft.evidenceClass !==
      'process_bound_byte_free_action_conditioning_prompt_merge_evidence'
    || draft.mergeState !==
      'exact_private_action_conditioning_merged_into_selected_scene_packet'
    || !SAFE_ID.test(draft.mergeEvidenceId)
    || !SHA256.test(draft.serverOwnedLocatorDigestSha256)
    || !isRecord(draft.sourceBindings)
    || !hasExactKeys(
      draft.sourceBindings as unknown as Record<string, unknown>,
      [
        'actionConditioningVersion',
        'actionConditioningId',
        'actionConditioningDigestSha256',
        'selectedSceneRequestBindingDigestSha256',
        'approvedSnapshotId',
        'approvedSnapshotHashSha256',
      ],
    )
    || draft.sourceBindings.actionConditioningVersion !==
      'living-frame-complete-character-keypose-private-action-conditioning-v1'
    || !SAFE_ID.test(draft.sourceBindings.actionConditioningId)
    || !SHA256.test(draft.sourceBindings.actionConditioningDigestSha256)
    || !SHA256.test(
      draft.sourceBindings.selectedSceneRequestBindingDigestSha256,
    )
    || !SAFE_ID.test(draft.sourceBindings.approvedSnapshotId)
    || !SHA256.test(draft.sourceBindings.approvedSnapshotHashSha256)
    || !Array.isArray(draft.units)
    || (draft.units.length !== 3 && draft.units.length !== 4)
    || draft.keyposeUnitCount !== draft.units.length
    || !Number.isInteger(draft.nonKeyposeSelectedSceneUnitCount)
    || draft.nonKeyposeSelectedSceneUnitCount < 0
    || new Set(draft.units.map((unit) =>
      unit.conditioningUnitId)).size !== draft.units.length
    || new Set(draft.units.map((unit) =>
      unit.selectedSceneRequestUnitId)).size !== draft.units.length
    || new Set(draft.units.map((unit) =>
      unit.outputKey)).size !== draft.units.length
    || draft.units.some((unit, order) =>
      !isValidMergeEvidenceUnit(unit, order))
    || !draft.everyActionLeaseConsumedExactlyOnce
    || !draft.nonKeyposeSelectedSceneUnitsUnchanged
    || draft
      .rawPromptConditioningAliasImageModelPathUrlBytesCredentialCommandOrEnvironmentIncluded
    || draft.operationRegistered
    || draft.dispatchGranted
    || draft.runtimeExecuted
    || draft.productionReady
  ) throw invalid('prompt_merge_evidence_invalid', '$.promptMergeEvidence')
}

function isValidMergeEvidenceUnit(
  unit:
    LivingFrameCompleteCharacterKeyposeActionPromptMergeEvidenceUnit,
  order: number,
): boolean {
  if (!isRecord(unit)) return false
  if (!hasExactKeys(unit as unknown as Record<string, unknown>, [
    'order',
    'conditioningUnitId',
    'conditioningUnitDigestSha256',
    'selectedSceneRequestUnitId',
    'selectedSceneRequestUnitDigestSha256',
    'approvedWorkItemId',
    'approvedWorkItemKey',
    'approvedPlannedAssetManifestEntryId',
    'outputKey',
    'basePositiveConditioningDigestSha256',
    'positiveActionDirectiveDigestSha256',
    'mergedPositiveConditioningDigestSha256',
    'baseNegativeConditioningDigestSha256',
    'negativeActionDirectiveDigestSha256',
    'mergedNegativeConditioningDigestSha256',
    'rawBaseConditioningIncluded',
    'rawActionDirectiveIncluded',
    'rawMergedConditioningIncluded',
  ])) return false
  return unit.order === order
    && SAFE_ID.test(unit.conditioningUnitId)
    && SHA256.test(unit.conditioningUnitDigestSha256)
    && SAFE_ID.test(unit.selectedSceneRequestUnitId)
    && SHA256.test(unit.selectedSceneRequestUnitDigestSha256)
    && SAFE_ID.test(unit.approvedWorkItemId)
    && SAFE_ID.test(unit.approvedWorkItemKey)
    && SAFE_ID.test(unit.approvedPlannedAssetManifestEntryId)
    && SAFE_ID.test(unit.outputKey)
    && SHA256.test(unit.basePositiveConditioningDigestSha256)
    && SHA256.test(unit.positiveActionDirectiveDigestSha256)
    && SHA256.test(unit.mergedPositiveConditioningDigestSha256)
    && SHA256.test(unit.baseNegativeConditioningDigestSha256)
    && SHA256.test(unit.negativeActionDirectiveDigestSha256)
    && SHA256.test(unit.mergedNegativeConditioningDigestSha256)
    && !unit.rawBaseConditioningIncluded
    && !unit.rawActionDirectiveIncluded
    && !unit.rawMergedConditioningIncluded
}

function assertBindingDraft(
  draft:
    LivingFrameCompleteCharacterKeyposeActionPromptBindingDraft,
): void {
  const count = draft.promptBindingUnits.length
  if (
    (count !== 3 && count !== 4)
    || draft.metrics.actionKeyposeCount !== count
    || draft.metrics.exactPositiveDigestMatchCount !== count
    || draft.metrics.exactNegativeDigestMatchCount !== count
    || draft.metrics.controlNetUnitCount !== count
    || draft.metrics.genericIpAdapterUnitCount !== count
    || new Set(draft.promptBindingUnits.map((unit) =>
      unit.promptBindingUnitId)).size !== count
    || new Set(draft.promptBindingUnits.map((unit) =>
      unit.materializationUnitId)).size !== count
    || new Set(draft.promptBindingUnits.map((unit) =>
      unit.outputKey)).size !== count
    || draft.promptBindingUnits.some((unit, order) =>
      unit.order !== order
      || !unit.positiveConditioning.exactDigestMatch
      || !unit.negativeConditioning.exactDigestMatch
      || unit.operationRegistered
      || unit.dispatched
      || unit.runtimeExecuted
      || unit.assetCreated
      || unit.qaApproved
      || unit.promptBindingUnitDigestSha256 !==
        sha256AuthorityValue(withoutBindingUnitDigest(unit)))
    || !draft.privatePromptMaterializationReconciled
    || draft.operationRegistered
    || draft.dispatchGranted
    || draft.runtimeExecuted
    || draft.assetCreated
    || draft.canonicalQaApproved
    || draft.actualCostReceiptCreated
    || draft.productionReady
  ) throw invalid('unsafe_receipt_forbidden', '$')
}

function withoutBindingUnitDigest(
  unit:
    LivingFrameCompleteCharacterKeyposeActionPromptBindingUnit,
) {
  const draft = {
    ...unit,
  } as Partial<LivingFrameCompleteCharacterKeyposeActionPromptBindingUnit>
  delete draft.promptBindingUnitDigestSha256
  return draft
}

function uniqueMap<T>(
  values: readonly T[],
  key: (value: T) => string,
  path: string,
): Map<string, T> {
  const result = new Map<string, T>()
  for (const value of values) {
    const identity = key(value)
    if (result.has(identity)) throw invalid('unit_set_mismatch', path)
    result.set(identity, value)
  }
  return result
}

function assertInput(
  input:
    CreateLivingFrameCompleteCharacterKeyposeActionPromptBindingInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'promptBindingId',
      'actionConditioning',
      'actionConditioningInput',
      'promptMergeEvidence',
      'promptMaterialization',
    ])
    || typeof input.promptBindingId !== 'string'
    || !SAFE_ID.test(input.promptBindingId)
  ) throw invalid('input_invalid', '$')
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, order) => key === expected[order])
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value),
  )
}

function deepFreeze<T>(value: T): T {
  if (
    value
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}

function invalid(
  code:
    LivingFrameCompleteCharacterKeyposeActionPromptBindingIssueCode,
  path: string,
): LivingFrameCompleteCharacterKeyposeActionPromptBindingError {
  return new LivingFrameCompleteCharacterKeyposeActionPromptBindingError([{
    code,
    path,
  }])
}
