import type {
  LivingFrameSourceTruthMode,
} from '../../src/types/living-frame'
import type {
  LivingFrameControlledImageFullFrameRatioExtension,
  LivingFrameControlledImageFullFrameRatioUnit,
} from '../../src/types/living-frame-controlled-image-full-frame-ratio-extension'
import type {
  LivingFrameControlledImageSelectedSceneRequest,
  LivingFrameControlledImageSelectedSceneRequestUnit,
} from '../../src/types/living-frame-controlled-image-selected-scene-request'
import {
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_BINDING_CLASS,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_BINDING_STATE,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_BINDING_VERSION,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_ISSUE_CODES,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_OPEN_GATES,
  type LivingFrameControlledImageSelectedScenePrivateConditioningAuthority,
  type LivingFrameControlledImageSelectedScenePrivateConditioningBindingDraft,
  type LivingFrameControlledImageSelectedScenePrivateConditioningBrief,
  type LivingFrameControlledImageSelectedScenePrivateConditioningIssue,
  type LivingFrameControlledImageSelectedScenePrivateConditioningIssueCode,
  type LivingFrameControlledImageSelectedScenePrivateConditioningLease,
  type LivingFrameControlledImageSelectedScenePrivateConditioningResult,
  type LivingFrameControlledImageSelectedScenePrivateConditioningUnit,
} from '../../src/types/living-frame-controlled-image-selected-scene-private-conditioning-binding'
import type {
  LivingFrameControlledImageSelectedSceneVisualContinuityPackBinding,
} from '../../src/types/living-frame-controlled-image-selected-scene-visual-continuity-pack-binding'
import type {
  LivingFrameSemanticSceneProposal,
} from '../../src/types/living-frame-semantic-reasoning-request'
import type {
  LivingFrameVisualContinuityCharacterSheet,
  LivingFrameVisualContinuityEnvironmentSheet,
  LivingFrameVisualContinuityObjectSheet,
  LivingFrameVisualContinuityPack,
  LivingFrameVisualContinuitySceneDesignSheet,
} from '../../src/types/living-frame-visual-continuity'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  type CreateLivingFrameControlledImageFullFrameRatioExtensionInput,
  verifyLivingFrameControlledImageFullFrameRatioExtension,
} from './living-frame-controlled-image-full-frame-ratio-extension'
import {
  type CreateLivingFrameControlledImageSelectedSceneRequestInput,
  verifyLivingFrameControlledImageSelectedSceneRequest,
} from './living-frame-controlled-image-selected-scene-request'
import {
  createLivingFrameControlledImageSelectedScenePrivatePromptReader,
  type LivingFrameControlledImageSelectedScenePrivatePromptPacket,
  type LivingFrameControlledImageSelectedScenePrivatePromptReaderPort,
} from './living-frame-controlled-image-selected-scene-private-prompt-materialization'
import {
  LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256,
} from './living-frame-controlled-sdxl-comfyui-canonical-mount-host-session'
import {
  type CreateLivingFrameControlledImageSelectedSceneVisualContinuityPackBindingInput,
  verifyLivingFrameControlledImageSelectedSceneVisualContinuityPackBinding,
} from './living-frame-controlled-image-selected-scene-visual-continuity-pack-binding'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const URL_OR_PATH_LIKE =
  /(?:https?:\/\/|file:\/\/|data:|javascript:|(?:^|[\s"'`])(?:\/|~\/|\.\.\/|[A-Za-z]:[\\/]))/iu
const SECRET_LIKE =
  /(?:-----BEGIN [A-Z ]+PRIVATE KEY-----|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{16,})/u
const MAX_CONDITIONING_TEXT_BYTES = 4_096
const EXACT_MODEL_ARTIFACT_BYTE_LENGTH = 11_700_367_157
const CONDITIONING_PENDING_SENTINEL =
  'server-owned-conditioning-pending'

const FULL_FRAME_COMPONENT_ROLES = new Set([
  'source_still',
  'opaque_background_plate',
  'reconstructed_background_plate',
])
const SUBJECT_COMPONENT_ROLES = new Set([
  'primary_subject',
  'mechanical_component',
  'editorial_graphic',
  'map_component',
  'data_component',
])
const ENVIRONMENT_COMPONENT_ROLES = new Set([
  'source_still',
  'background_plate',
  'opaque_background_plate',
  'reconstructed_background_plate',
  'environmental_effect',
  'atmosphere',
  'foreground_occluder',
])
const EXACT_FACT_SAFETY_MODES =
  new Set<LivingFrameSourceTruthMode>([
    'exact_geography_verification_required',
    'exact_data_verification_required',
    'documentary_source_verification_required',
  ])

const AUTHORITY_BOUNDARY:
  LivingFrameControlledImageSelectedScenePrivateConditioningAuthority =
  deepFreeze({
    privateConditioningCompilationAuthority: true,
    canonicalSelectedSceneMutationAuthority: false,
    visualContinuityPackCreationAuthority: false,
    promptPacketRepositoryAuthority: false,
    promptMaterializationAuthority: false,
    modelSelectionAuthority: false,
    referenceArtifactAuthority: false,
    documentaryFactAuthority: false,
    sourceTruthAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemMutationAuthority: false,
    workGraphMutationAuthority: false,
    operationRegistryAuthority: false,
    toolRegistryAuthority: false,
    queueAuthority: false,
    dispatchAuthority: false,
    workerLeaseAuthority: false,
    gpuAttemptAuthority: false,
    actualCostAuthority: false,
    artifactPersistenceAuthority: false,
    assetManifestAuthority: false,
    artifactQaAuthority: false,
    semanticStyleQaAuthority: false,
    privateReviewAuthority: false,
    renderAuthority: false,
    finalCanvasAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

export interface CreateLivingFrameControlledImageSelectedScenePrivateConditioningBindingInput {
  readonly bindingId: string
  readonly selectedSceneRequest:
    LivingFrameControlledImageSelectedSceneRequest
  readonly selectedSceneRequestInput:
    CreateLivingFrameControlledImageSelectedSceneRequestInput
  readonly fullFrameRatioExtension:
    LivingFrameControlledImageFullFrameRatioExtension
  readonly fullFrameRatioExtensionInput:
    CreateLivingFrameControlledImageFullFrameRatioExtensionInput
  readonly visualContinuityPackBinding:
    LivingFrameControlledImageSelectedSceneVisualContinuityPackBinding
  readonly visualContinuityPackBindingInput:
    CreateLivingFrameControlledImageSelectedSceneVisualContinuityPackBindingInput
}

const leases = new WeakSet<object>()
const consumedLeases = new WeakSet<object>()
const privateBriefs = new WeakMap<
  object,
  LivingFrameControlledImageSelectedScenePrivateConditioningBrief
>()

export class LivingFrameControlledImageSelectedScenePrivateConditioningBindingError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledImageSelectedScenePrivateConditioningIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledImageSelectedScenePrivateConditioningIssue[],
  ) {
    super(
      'Living Frame selected-scene private conditioning binding failed.',
    )
    this.name =
      'LivingFrameControlledImageSelectedScenePrivateConditioningBindingError'
    this.issues = issues
  }
}

export function createLivingFrameControlledImageSelectedSceneAnimationAwarePrivatePromptReader(
  input: {
    readonly conditioningBinding:
      LivingFrameControlledImageSelectedScenePrivateConditioningBindingDraft & {
        readonly bindingDigestSha256: string
      }
    readonly privateConditioningBriefLeases:
      readonly LivingFrameControlledImageSelectedScenePrivateConditioningLease[]
    readonly readCurrentServerOwnedAliasPacketByLocator:
      (
        serverOwnedMaterializationLocatorId: string,
      ) => Promise<unknown>
  },
): LivingFrameControlledImageSelectedScenePrivatePromptReaderPort {
  assertConditionedReaderInput(input)
  return createLivingFrameControlledImageSelectedScenePrivatePromptReader(
    async (serverOwnedMaterializationLocatorId) => {
      const raw =
        await input.readCurrentServerOwnedAliasPacketByLocator(
          serverOwnedMaterializationLocatorId,
        )
      return mergeConditioningIntoPrivatePromptPacket({
        raw,
        conditioningBinding: input.conditioningBinding,
        privateConditioningBriefLeases:
          input.privateConditioningBriefLeases,
      })
    },
  )
}

export async function compileLivingFrameControlledImageSelectedScenePrivateConditioningBinding(
  input:
    CreateLivingFrameControlledImageSelectedScenePrivateConditioningBindingInput,
): Promise<LivingFrameControlledImageSelectedScenePrivateConditioningResult> {
  assertInput(input)
  if (!verifyLivingFrameControlledImageSelectedSceneRequest(
    input.selectedSceneRequest,
    input.selectedSceneRequestInput,
  )) {
    throw invalid(
      'selected_scene_request_invalid',
      '$.selectedSceneRequest',
    )
  }
  if (!await verifyLivingFrameControlledImageFullFrameRatioExtension(
    input.fullFrameRatioExtension,
    input.fullFrameRatioExtensionInput,
  )) {
    throw invalid(
      'full_frame_ratio_extension_invalid',
      '$.fullFrameRatioExtension',
    )
  }
  if (!await verifyLivingFrameControlledImageSelectedSceneVisualContinuityPackBinding(
    input.visualContinuityPackBinding,
    input.visualContinuityPackBindingInput,
  )) {
    throw invalid(
      'visual_continuity_pack_binding_invalid',
      '$.visualContinuityPackBinding',
    )
  }
  const prepared = prepareSources(input)
  const compiled = input.selectedSceneRequest.requestUnits.map(
    (requestUnit, order) => compileUnit({
      order,
      input,
      requestUnit,
      ...prepared,
    }),
  )
  const units = compiled.map((entry) => entry.unit)
  const draft:
    LivingFrameControlledImageSelectedScenePrivateConditioningBindingDraft =
    {
      contractVersion:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_BINDING_VERSION,
      resultClass:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_BINDING_CLASS,
      bindingState:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_BINDING_STATE,
      bindingId: input.bindingId,
      canonicalScope: {
        ...input.selectedSceneRequest.canonicalScope,
      },
      sourceBindings: {
        selectedSceneRequestBindingDigestSha256:
          input.selectedSceneRequest.requestBindingDigestSha256,
        fullFrameRatioExtensionDigestSha256:
          input.fullFrameRatioExtension.extensionDigestSha256,
        visualContinuityPackBindingDigestSha256:
          input.visualContinuityPackBinding.bindingDigestSha256,
        semanticProposalBindingDigestSha256:
          input.visualContinuityPackBinding.sourceBindings
            .semanticProposalBindingDigestSha256,
        semanticPlanProjectionDigestSha256:
          input.visualContinuityPackBinding.sourceBindings
            .semanticPlanProjectionDigestSha256,
        selectedSceneBindingDigestSha256:
          input.visualContinuityPackBinding.sourceBindings
            .selectedSceneBindingDigestSha256,
        visualContinuityPackDigestSha256:
          prepared.pack.contractDigestSha256,
        confirmedOutputFrameDigestSha256:
          input.selectedSceneRequest.sourceBindings
            .outputFrameExpectationDigestSha256,
        currentMasterTimingDigestSha256:
          input.selectedSceneRequest.sourceBindings
            .currentMasterTimingDigestSha256,
        approvedSnapshotId:
          input.selectedSceneRequest.sourceBindings.approvedSnapshotId,
        approvedSnapshotHashSha256:
          input.selectedSceneRequest.sourceBindings
            .approvedSnapshotHashSha256,
      },
      conditioningUnits: units,
      metrics: {
        conditioningUnitCount: units.length,
        isolatedComponentUnitCount:
          units.filter((unit) =>
            unit.generationCanvas.canvasClass ===
              'isolated_component_square_1024').length,
        confirmedFullFrameUnitCount:
          units.filter((unit) =>
            unit.generationCanvas.canvasClass ===
              'confirmed_full_frame_ratio').length,
        referenceConditionedUnitCount:
          input.selectedSceneRequest.requestUnits.filter((unit) =>
            unit.controlPolicy.referenceConditioningRequired).length,
        structureConditionedUnitCount:
          input.selectedSceneRequest.requestUnits.filter((unit) =>
            unit.controlPolicy.structureConditioningRequired).length,
        exactFactRevalidationUnitCount:
          units.filter((unit) =>
            unit.sourceTruthPolicy
              .exactDocumentaryFactSafetyRevalidationRequired).length,
        twoPointFiveDDirectedUnitCount:
          units.filter((unit) =>
            unit.styleDirection.depthStyleSupportsTwoPointFiveD).length,
      },
      openGateCodes:
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_OPEN_GATES,
      authorityBoundary: AUTHORITY_BOUNDARY,
      selectedSceneRequestRevalidated: true,
      fullFrameRatioExtensionRevalidated: true,
      visualContinuityPackBindingRevalidated: true,
      selectedSceneSemanticComponentAndDesignSheetMappingRevalidated:
        true,
      animationAwareConditioningDerivedServerSide: true,
      conditioningDerivedFromRawChat: false,
      controlledReferenceExpectationsPromotedToArtifacts: false,
      callerConditioningPromptSeedDimensionsModelPathUrlBytesCredentialCommandOrEnvironmentAccepted:
        false,
      promptPacketMerged: false,
      promptMaterializationChanged: false,
      operationRegistered: false,
      dispatchGranted: false,
      workerLeaseCreated: false,
      runtimeExecuted: false,
      gpuAttemptCreated: false,
      actualCostReceiptCreated: false,
      artifactPersisted: false,
      assetManifestMutated: false,
      semanticStyleQaExecuted: false,
      documentaryFactSafetyRevalidated: false,
      privateReviewApproved: false,
      renderAuthorized: false,
      finalCanvasCreatedByComfyUi: false,
      containsRawConditioningTextPackPayloadOrSubjectSpecificSummaries:
        false,
      containsPrivateBytesPathUrlCredentialSeedModelCommandOrEnvironmentOrCallerSelectedDimension:
        false,
      containsPriceCreditServiceFeeReservationWalletOrLedgerData:
        false,
      productionReady: false,
    }
  assertReceipt(draft, compiled.map((entry) => entry.privateBrief))
  const receipt = deepFreeze({
    ...draft,
    bindingDigestSha256: digest(draft),
  })
  const finalizedLeases = compiled.map((entry) => {
    const lease = Object.freeze({
      ...entry.lease,
      conditioningBindingDigestSha256:
        receipt.bindingDigestSha256,
    })
    leases.add(lease)
    privateBriefs.set(lease, entry.privateBrief)
    return lease
  })
  return Object.freeze({
    receipt,
    privateConditioningBriefLeases:
      Object.freeze(finalizedLeases),
  })
}

export async function verifyLivingFrameControlledImageSelectedScenePrivateConditioningBinding(
  value: unknown,
  input:
    CreateLivingFrameControlledImageSelectedScenePrivateConditioningBindingInput,
): Promise<boolean> {
  try {
    if (
      !isRecord(value)
      || typeof value.bindingDigestSha256 !== 'string'
      || !SHA256.test(value.bindingDigestSha256)
      || value.bindingDigestSha256 !== digest(withoutDigest(value))
    ) return false
    const expected =
      await compileLivingFrameControlledImageSelectedScenePrivateConditioningBinding(
        input,
      )
    return stableAuthorityStringify(value) ===
      stableAuthorityStringify(expected.receipt)
  } catch {
    return false
  }
}

export function consumeLivingFrameControlledImageSelectedScenePrivateConditioningLease(
  lease:
    LivingFrameControlledImageSelectedScenePrivateConditioningLease,
): LivingFrameControlledImageSelectedScenePrivateConditioningBrief {
  if (
    !leases.has(lease)
    || consumedLeases.has(lease)
    || lease.leaseClass !==
      'process_bound_single_use_selected_scene_private_conditioning_brief_lease_v1'
    || lease.callerSerializable !== false
    || lease.promptPacketMergeAuthority !== false
    || lease.dispatchAuthority !== false
    || lease.runtimeAuthority !== false
    || lease.productionReady !== false
  ) {
    throw invalid(
      consumedLeases.has(lease) ? 'lease_reused' : 'lease_invalid',
      '$.lease',
    )
  }
  const brief = privateBriefs.get(lease)
  if (!brief) throw invalid('lease_invalid', '$.lease')
  consumedLeases.add(lease)
  privateBriefs.delete(lease)
  return brief
}

function mergeConditioningIntoPrivatePromptPacket(input: {
  readonly raw: unknown
  readonly conditioningBinding:
    LivingFrameControlledImageSelectedScenePrivateConditioningBindingDraft & {
      readonly bindingDigestSha256: string
    }
  readonly privateConditioningBriefLeases:
    readonly LivingFrameControlledImageSelectedScenePrivateConditioningLease[]
}): LivingFrameControlledImageSelectedScenePrivatePromptPacket {
  if (!isPrivatePromptPacketShape(input.raw)) {
    throw invalid(
      'caller_conditioning_or_runtime_input_forbidden',
      '$.serverOwnedAliasPacket',
    )
  }
  const packet = input.raw
  const binding = input.conditioningBinding
  if (
    packet.selectedSceneRequestBindingDigestSha256 !==
      binding.sourceBindings
        .selectedSceneRequestBindingDigestSha256
    || packet.fullFrameRatioExtensionDigestSha256 !==
      binding.sourceBindings.fullFrameRatioExtensionDigestSha256
    || packet.approvedSnapshotId !==
      binding.sourceBindings.approvedSnapshotId
    || packet.approvedSnapshotHashSha256 !==
      binding.sourceBindings.approvedSnapshotHashSha256
    || packet.sceneId !== binding.canonicalScope.sceneId
    || packet.units.length !== binding.conditioningUnits.length
  ) {
    throw invalid(
      'cross_scene_work_item_or_output_substitution',
      '$.serverOwnedAliasPacket',
    )
  }
  const leaseByUnit = new Map(
    input.privateConditioningBriefLeases.map((lease) => [
      lease.conditioningUnitId,
      lease,
    ]),
  )
  if (
    leaseByUnit.size !== binding.conditioningUnits.length
    || input.privateConditioningBriefLeases.some((lease) =>
      lease.conditioningBindingDigestSha256 !==
        binding.bindingDigestSha256)
  ) {
    throw invalid(
      'lease_invalid',
      '$.privateConditioningBriefLeases',
    )
  }
  const validatedUnits = binding.conditioningUnits.map(
    (conditioningUnit, order) => {
      const packetUnit = packet.units[order]
      const lease =
        leaseByUnit.get(conditioningUnit.conditioningUnitId)
      if (
        !packetUnit
        || !lease
        || packetUnit.order !== order
        || packetUnit.requestUnitId !==
          conditioningUnit.requestUnitId
        || packetUnit.requestUnitDigestSha256 !==
          conditioningUnit.requestUnitDigestSha256
        || packetUnit.sceneId !== conditioningUnit.sceneId
        || packetUnit.outputKey !== conditioningUnit.outputKey
        || packetUnit.approvedWorkItemId !==
          conditioningUnit.approvedWorkItemId
        || packetUnit.approvedWorkItemKey !==
          conditioningUnit.approvedWorkItemKey
        || packetUnit.approvedPlannedAssetManifestEntryId !==
          conditioningUnit.approvedPlannedAssetManifestEntryId
        || packetUnit.serverOwnedConditioningLocatorId !==
          conditioningUnit.serverOwnedConditioningLocatorId
        || lease.conditioningUnitId !==
          conditioningUnit.conditioningUnitId
        || lease.requestUnitId !==
          conditioningUnit.requestUnitId
        || !leases.has(lease)
        || consumedLeases.has(lease)
        || !privateBriefs.has(lease)
      ) {
        throw invalid(
          'cross_scene_work_item_or_output_substitution',
          `$.serverOwnedAliasPacket.units.${order}`,
        )
      }
      const conditioningSlots =
        packetUnit.resolvedSlots.filter((slot) =>
          slot.slotKind === 'positive_conditioning_text'
          || slot.slotKind === 'negative_conditioning_text')
      if (
        conditioningSlots.length !== 2
        || conditioningSlots.some((slot) =>
          slot.valueClass !== 'private_conditioning_text'
          || slot.value !== CONDITIONING_PENDING_SENTINEL)
      ) {
        throw invalid(
          'caller_conditioning_or_runtime_input_forbidden',
          `$.serverOwnedAliasPacket.units.${order}.resolvedSlots`,
        )
      }
      return {
        conditioningUnit,
        packetUnit,
        lease,
        order,
      }
    },
  )
  const mergedUnits = validatedUnits.map(
    ({
      conditioningUnit,
      packetUnit,
      lease,
      order,
    }) => {
      const brief =
        consumeLivingFrameControlledImageSelectedScenePrivateConditioningLease(
          lease,
        )
      if (
        brief.conditioningUnitId !==
          conditioningUnit.conditioningUnitId
        || brief.requestUnitId !==
          conditioningUnit.requestUnitId
        || brief.sceneId !== conditioningUnit.sceneId
        || brief.componentId !== conditioningUnit.componentId
        || brief.outputKey !== conditioningUnit.outputKey
        || brief.approvedWorkItemId !==
          conditioningUnit.approvedWorkItemId
        || brief.approvedWorkItemKey !==
          conditioningUnit.approvedWorkItemKey
        || brief.approvedPlannedAssetManifestEntryId !==
          conditioningUnit.approvedPlannedAssetManifestEntryId
        || brief.serverOwnedConditioningLocatorId !==
          conditioningUnit.serverOwnedConditioningLocatorId
      ) {
        throw invalid(
          'cross_scene_work_item_or_output_substitution',
          `$.privateConditioningBriefLeases.${order}`,
        )
      }
      return {
        ...packetUnit,
        resolvedSlots: packetUnit.resolvedSlots.map((slot) => {
          if (slot.slotKind === 'positive_conditioning_text') {
            return {
              ...slot,
              value: brief.positiveConditioningText,
            }
          }
          if (slot.slotKind === 'negative_conditioning_text') {
            return {
              ...slot,
              value: brief.negativeConditioningText,
            }
          }
          return { ...slot }
        }),
      }
    },
  )
  return {
    ...packet,
    units: mergedUnits,
  }
}

function assertConditionedReaderInput(input: {
  readonly conditioningBinding:
    LivingFrameControlledImageSelectedScenePrivateConditioningBindingDraft & {
      readonly bindingDigestSha256: string
    }
  readonly privateConditioningBriefLeases:
    readonly LivingFrameControlledImageSelectedScenePrivateConditioningLease[]
  readonly readCurrentServerOwnedAliasPacketByLocator:
    (
      serverOwnedMaterializationLocatorId: string,
    ) => Promise<unknown>
}): void {
  const binding = input.conditioningBinding
  if (
    binding.contractVersion !==
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_BINDING_VERSION
    || binding.resultClass !==
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_BINDING_CLASS
    || binding.bindingState !==
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_BINDING_STATE
    || !SHA256.test(binding.bindingDigestSha256)
    || binding.bindingDigestSha256 !== digest(withoutDigest(
      binding as unknown as Record<string, unknown>,
    ))
    || typeof input.readCurrentServerOwnedAliasPacketByLocator !==
      'function'
    || input.privateConditioningBriefLeases.length !==
      binding.conditioningUnits.length
  ) {
    throw invalid('input_invalid', '$.conditionedPromptReader')
  }
}

function isPrivatePromptPacketShape(
  value: unknown,
): value is
  LivingFrameControlledImageSelectedScenePrivatePromptPacket {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'selectedSceneRequestBindingDigestSha256',
      'fullFrameRatioExtensionDigestSha256',
      'approvedSnapshotId',
      'approvedSnapshotHashSha256',
      'sceneId',
      'units',
    ])
    || !Array.isArray(value.units)
  ) return false
  return value.units.every((unit) =>
    isRecord(unit)
    && hasExactKeys(unit, [
      'order',
      'requestUnitId',
      'requestUnitDigestSha256',
      'sceneId',
      'outputKey',
      'approvedWorkItemId',
      'approvedWorkItemKey',
      'approvedPlannedAssetManifestEntryId',
      'serverOwnedConditioningLocatorId',
      'resolvedSlots',
    ])
    && Array.isArray(unit.resolvedSlots)
    && unit.resolvedSlots.every((slot) =>
      isRecord(slot)
      && hasExactKeys(slot, [
        'order',
        'slotKind',
        'valueClass',
        'value',
      ])
      && typeof slot.value === 'string'))
}

function prepareSources(
  input:
    CreateLivingFrameControlledImageSelectedScenePrivateConditioningBindingInput,
): {
  readonly pack: LivingFrameVisualContinuityPack
  readonly semanticScene: LivingFrameSemanticSceneProposal
  readonly selectedScene:
    CreateLivingFrameControlledImageSelectedSceneRequestInput[
      'publication'
    ]['binding']['selectedComponent']['scenePlans'][number]
  readonly designSheet:
    LivingFrameVisualContinuitySceneDesignSheet
  readonly continuityBinding:
    LivingFrameControlledImageSelectedSceneVisualContinuityPackBinding[
      'selectedSceneContinuityBindings'
    ][number]
} {
  const request = input.selectedSceneRequest
  const selectedBinding =
    input.visualContinuityPackBindingInput.selectedSceneBinding
  const pack =
    input.visualContinuityPackBindingInput.semanticProposalBinding
      .continuityPack
  if (!pack) {
    throw invalid(
      'continuity_payload_mismatch',
      '$.visualContinuityPackBindingInput.semanticProposalBinding.continuityPack',
    )
  }
  if (
    request.canonicalScope.workspaceId !==
      selectedBinding.identity.workspaceId
    || request.canonicalScope.projectId !==
      selectedBinding.identity.projectId
    || request.canonicalScope.editSessionId !==
      selectedBinding.identity.editSessionId
    || request.sourceBindings.selectedSceneBindingDigestSha256 !==
      selectedBinding.bindingDigestSha256
    || request.sourceBindings.visualContinuityPackDigestSha256 !==
      pack.contractDigestSha256
    || input.visualContinuityPackBinding.sourceBindings
      .visualContinuityPackDigestSha256 !==
      pack.contractDigestSha256
    || request.sourceBindings.outputFrameExpectationDigestSha256 !==
      selectedBinding.sourceBindings.confirmedOutputFrameDigestSha256
    || request.sourceBindings.currentMasterTimingDigestSha256 !==
      selectedBinding.sourceBindings.currentMasterTimingDigestSha256
  ) {
    throw invalid(
      'source_lineage_mismatch',
      '$.sourceBindings',
    )
  }
  const selectedScenes =
    selectedBinding.selectedComponent.scenePlans.filter(
      (scene) => scene.sceneId === request.canonicalScope.sceneId,
    )
  const semanticScenes =
    input.visualContinuityPackBindingInput.semanticProposalBinding
      .normalizedResult.sceneProposals.filter(
        (scene) => scene.sceneProposalKey ===
          request.canonicalScope.sceneId,
      )
  if (selectedScenes.length !== 1 || semanticScenes.length !== 1) {
    throw invalid(
      'selected_scene_mismatch',
      '$.canonicalScope.sceneId',
    )
  }
  const selectedScene = selectedScenes[0]!
  const semanticScene = semanticScenes[0]!
  if (
    request.sourceBindings.selectedSceneContractDigestSha256 !==
      digest(selectedScene)
    || request.selectedSceneSummary.mode !== selectedScene.mode
    || request.selectedSceneSummary.sourceTruthMode !==
      selectedScene.sourceTruthMode
    || semanticScene.mode !== selectedScene.mode
    || semanticScene.sourceTruthMode !== selectedScene.sourceTruthMode
  ) {
    throw invalid(
      'selected_scene_mismatch',
      '$.selectedSceneSummary',
    )
  }
  const designSheets = pack.sceneDesignSheets.filter(
    (sheet) =>
      sheet.semanticCandidateDecisionId ===
        semanticScene.semanticDecisionKey
      && sheet.mode === semanticScene.mode
      && sheet.sourceTruthMode === semanticScene.sourceTruthMode,
  )
  const continuityBindings =
    input.visualContinuityPackBinding
      .selectedSceneContinuityBindings.filter(
        (binding) =>
          binding.mode === semanticScene.mode
          && binding.sourceTruthMode === semanticScene.sourceTruthMode
          && binding.sceneDesignSheetDigestSha256 ===
            (designSheets[0] ? digest(designSheets[0]) : ''),
      )
  if (designSheets.length !== 1 || continuityBindings.length !== 1) {
    throw invalid(
      'continuity_payload_mismatch',
      '$.visualContinuityPackBinding.selectedSceneContinuityBindings',
    )
  }
  return {
    pack,
    semanticScene,
    selectedScene,
    designSheet: designSheets[0]!,
    continuityBinding: continuityBindings[0]!,
  }
}

function compileUnit(input: {
  readonly order: number
  readonly input:
    CreateLivingFrameControlledImageSelectedScenePrivateConditioningBindingInput
  readonly requestUnit:
    LivingFrameControlledImageSelectedSceneRequestUnit
  readonly pack: LivingFrameVisualContinuityPack
  readonly semanticScene: LivingFrameSemanticSceneProposal
  readonly selectedScene:
    CreateLivingFrameControlledImageSelectedSceneRequestInput[
      'publication'
    ]['binding']['selectedComponent']['scenePlans'][number]
  readonly designSheet:
    LivingFrameVisualContinuitySceneDesignSheet
  readonly continuityBinding:
    LivingFrameControlledImageSelectedSceneVisualContinuityPackBinding[
      'selectedSceneContinuityBindings'
    ][number]
}): {
  readonly unit:
    LivingFrameControlledImageSelectedScenePrivateConditioningUnit
  readonly lease:
    LivingFrameControlledImageSelectedScenePrivateConditioningLease
  readonly privateBrief:
    LivingFrameControlledImageSelectedScenePrivateConditioningBrief
} {
  const selectedComponents = input.selectedScene.components.filter(
    (component) =>
      component.componentId === input.requestUnit.componentId,
  )
  const semanticComponents = input.semanticScene.components.filter(
    (component) =>
      component.componentKey === input.requestUnit.componentId,
  )
  if (
    selectedComponents.length !== 1
    || semanticComponents.length !== 1
  ) {
    throw invalid(
      'component_mismatch',
      `$.requestUnits.${input.requestUnit.requestUnitId}.componentId`,
    )
  }
  const selectedComponent = selectedComponents[0]!
  const semanticComponent = semanticComponents[0]!
  const semanticDirectionDigestSha256 = digest({
    mode: input.selectedScene.mode,
    sourceTruthMode: input.selectedScene.sourceTruthMode,
    narrativePurposeCode: input.selectedScene.narrativePurposeCode,
    visualVerb: input.selectedScene.visualVerb,
    importance: input.selectedScene.importance,
    summary: input.selectedScene.summary,
  })
  const componentDirectionDigestSha256 = digest({
    componentId: selectedComponent.componentId,
    role: selectedComponent.role,
    focalRole: selectedComponent.focalRole,
    summary: selectedComponent.summary,
    depthBand: selectedComponent.depthBand,
    transparencyExpectation:
      selectedComponent.transparencyExpectation,
    provenanceExpectation:
      selectedComponent.provenanceExpectation,
    capabilityKeys: [...new Set(
      selectedComponent.capabilityKeys,
    )].sort(),
    continuityRefIds: selectedComponent.continuityRefIds,
  })
  if (
    input.requestUnit.sceneId !== input.selectedScene.sceneId
    || input.requestUnit.semanticDirectionDigestSha256 !==
      semanticDirectionDigestSha256
    || input.requestUnit.componentDirectionDigestSha256 !==
      componentDirectionDigestSha256
    || input.requestUnit.continuityDirectionDigestSha256 !==
      input.pack.contractDigestSha256
    || stableAuthorityStringify(
      input.requestUnit.activeCapabilityKeys,
    ) !== stableAuthorityStringify(
      [...new Set(selectedComponent.capabilityKeys)].sort(),
    )
  ) {
    throw invalid(
      'cross_scene_work_item_or_output_substitution',
      `$.requestUnits.${input.requestUnit.requestUnitId}`,
    )
  }
  const characterSheets = resolveSheets(
    input.designSheet.characterSheetIds,
    input.pack.characterSheets,
    'characterSheetId',
  )
  const objectSheets = resolveSheets(
    input.designSheet.objectSheetIds,
    input.pack.objectSheets,
    'objectSheetId',
  )
  const environmentSheets = resolveSheets(
    input.designSheet.environmentSheetIds,
    input.pack.environmentSheets,
    'environmentSheetId',
  )
  assertContinuityDigests({
    input,
    characterSheets,
    objectSheets,
    environmentSheets,
  })
  const fullFrameUnit = findFullFrameUnit(
    input.input.fullFrameRatioExtension,
    input.requestUnit,
  )
  const generationCanvas = fullFrameUnit
    ? {
        canvasClass: 'confirmed_full_frame_ratio' as const,
        frameClass: fullFrameUnit.frameProfile.frameClass,
        widthPixels: fullFrameUnit.frameProfile.widthPixels,
        heightPixels: fullFrameUnit.frameProfile.heightPixels,
        confirmedOutputFrameExpectationDigestSha256:
          fullFrameUnit.frameProfile
            .confirmedOutputFrameExpectationDigestSha256,
        dimensionsDerivedFromApprovedPolicyOnly: true as const,
        squareSubstitutionApplied: false as const,
        finalCanvasCreatedByComfyUi: false as const,
      }
    : {
        canvasClass: 'isolated_component_square_1024' as const,
        frameClass: 'isolated_component' as const,
        widthPixels: 1_024,
        heightPixels: 1_024,
        confirmedOutputFrameExpectationDigestSha256:
          input.requestUnit.generationCanvas
            .finalOutputFrameExpectationDigestSha256,
        dimensionsDerivedFromApprovedPolicyOnly: true as const,
        squareSubstitutionApplied: false as const,
        finalCanvasCreatedByComfyUi: false as const,
      }
  const positiveConditioningText = buildPositiveConditioning({
    requestUnit: input.requestUnit,
    semanticScene: input.semanticScene,
    semanticComponent,
    designSheet: input.designSheet,
    pack: input.pack,
    characterSheets,
    objectSheets,
    environmentSheets,
    generationCanvas,
  })
  const negativeConditioningText = buildNegativeConditioning({
    requestUnit: input.requestUnit,
    sourceTruthMode: input.semanticScene.sourceTruthMode,
    pack: input.pack,
    fullFrame: Boolean(fullFrameUnit),
  })
  assertConditioningText(
    positiveConditioningText,
    '$.positiveConditioningText',
  )
  assertConditioningText(
    negativeConditioningText,
    '$.negativeConditioningText',
  )
  const unitIdentity = {
    requestUnitId: input.requestUnit.requestUnitId,
    requestUnitDigestSha256:
      input.requestUnit.requestUnitDigestSha256,
    visualContinuityPackBindingDigestSha256:
      input.input.visualContinuityPackBinding.bindingDigestSha256,
    outputKey: input.requestUnit.outputKey,
  }
  const conditioningUnitId =
    `lf-conditioning-unit.${digest(unitIdentity).slice(0, 40)}`
  const leaseId =
    `lf-conditioning-lease.${digest({
      conditioningUnitId,
      positiveConditioningDigestSha256:
        digest(positiveConditioningText),
      negativeConditioningDigestSha256:
        digest(negativeConditioningText),
    }).slice(0, 40)}`
  const privateBrief =
    deepFreeze({
      briefClass:
        'process_bound_selected_scene_animation_aware_conditioning_brief_v1',
      conditioningUnitId,
      requestUnitId: input.requestUnit.requestUnitId,
      sceneId: input.requestUnit.sceneId,
      componentId: input.requestUnit.componentId,
      outputKey: input.requestUnit.outputKey,
      approvedWorkItemId:
        input.requestUnit.approvedWorkItemId,
      approvedWorkItemKey:
        input.requestUnit.approvedWorkItemKey,
      approvedPlannedAssetManifestEntryId:
        input.requestUnit.approvedPlannedAssetManifestEntryId,
      serverOwnedConditioningLocatorId:
        input.requestUnit.serverOwnedConditioningLocatorId,
      positiveConditioningText,
      negativeConditioningText,
      textDerivedOnlyFromValidatedSelectedSceneAndContinuityPack:
        true,
      callerConditioningTextAccepted: false,
      callerSeedDimensionsModelPathUrlBytesCredentialCommandOrEnvironmentAccepted:
        false,
      referenceExpectationIsArtifactEvidence: false,
      operationAuthority: false,
      dispatchAuthority: false,
      runtimeAuthority: false,
      finalCanvasAuthority: false,
      productionReady: false,
    } satisfies
      LivingFrameControlledImageSelectedScenePrivateConditioningBrief)
  const unitDraft: Omit<
    LivingFrameControlledImageSelectedScenePrivateConditioningUnit,
    'conditioningUnitDigestSha256'
  > = {
    order: input.order,
    conditioningUnitId,
    requestUnitId: input.requestUnit.requestUnitId,
    requestUnitDigestSha256:
      input.requestUnit.requestUnitDigestSha256,
    sceneId: input.requestUnit.sceneId,
    componentId: input.requestUnit.componentId,
    componentRole: input.requestUnit.componentRole,
    assetIntentId: input.requestUnit.assetIntentId,
    outputKey: input.requestUnit.outputKey,
    approvedWorkItemId:
      input.requestUnit.approvedWorkItemId,
    approvedWorkItemKey:
      input.requestUnit.approvedWorkItemKey,
    approvedPlannedAssetManifestEntryId:
      input.requestUnit.approvedPlannedAssetManifestEntryId,
    rendererLayerId: input.requestUnit.rendererLayerId,
    serverOwnedConditioningLocatorId:
      input.requestUnit.serverOwnedConditioningLocatorId,
    semanticDirectionDigestSha256,
    componentDirectionDigestSha256,
    visualContinuityPackDigestSha256:
      input.pack.contractDigestSha256,
    selectedSceneContinuityBindingDigestSha256:
      digest(input.continuityBinding),
    semanticSceneProposalDigestSha256:
      digest(input.semanticScene),
    semanticComponentProposalDigestSha256:
      digest(semanticComponent),
    sceneDesignSheetDigestSha256:
      digest(input.designSheet),
    styleBibleDigestSha256:
      digest(input.pack.styleBible),
    linkedCharacterSheetDigestsSha256:
      characterSheets.map((sheet) => digest(sheet)),
    linkedObjectSheetDigestsSha256:
      objectSheets.map((sheet) => digest(sheet)),
    linkedEnvironmentSheetDigestsSha256:
      environmentSheets.map((sheet) => digest(sheet)),
    motionLanguageSheetDigestSha256:
      digest(input.pack.motionLanguageSheet),
    alphaEdgeRulesDigestSha256:
      digest(input.pack.alphaEdgeRules),
    animationAwareIllustrationDirection: {
      stillImageSourceOnly: true,
      frameByFrameOrAiVideoRequested: false,
      selectiveMotionPreparedForDownstream: true,
      movablePartsRemainSeparable: true,
      foregroundAndBackgroundRemainSeparable: true,
      noBakedMotionBlur: true,
      noBakedText: true,
      downstreamRemotionOwnsMotionCameraAndFinalComposition:
        true,
    },
    styleDirection: {
      assetTreatment:
        input.pack.styleBible.assetTreatment,
      depthStyle: input.designSheet.depthStyle,
      depthStyleSupportsTwoPointFiveD:
        input.designSheet.depthStyle !== 'flat',
      styleRuleCount: styleRuleCount(input.pack),
      avoidanceRuleCount:
        input.pack.styleBible.avoidanceCodes.length,
    },
    sourceTruthPolicy: {
      sourceTruthMode: input.semanticScene.sourceTruthMode,
      generatedImageIsIllustrativeSourceOnly: true,
      generatedImageMayClaimAuthenticArchiveOrVerifiedEvidence:
        false,
      unsupportedActionMayBeImplied: false,
      exactDocumentaryFactSafetyRevalidationRequired:
        EXACT_FACT_SAFETY_MODES.has(
          input.semanticScene.sourceTruthMode,
        ),
    },
    generationCanvas,
    privateConditioningReceipt: {
      leaseId,
      positiveConditioningDigestSha256:
        digest(positiveConditioningText),
      positiveConditioningByteLength:
        byteLength(positiveConditioningText),
      negativeConditioningDigestSha256:
        digest(negativeConditioningText),
      negativeConditioningByteLength:
        byteLength(negativeConditioningText),
      rawConditioningTextIncludedInReceipt: false,
      rawPackPayloadIncludedInReceipt: false,
      subjectSpecificSummaryIncludedInReceipt: false,
      referenceArtifactIncludedInReceipt: false,
      privateBytesPathUrlCredentialSeedModelCommandOrEnvironmentOrCallerSelectedDimensionIncludedInReceipt:
        false,
      leaseConsumed: false,
    },
    runtimeAndRegistryPolicy: {
      canonicalToolId: 'comfyui',
      canonicalOperationId:
        'tool.comfyui.generate_controlled_image.v1',
      fixedSupervisedProcessEntrypointRequired: true,
      runtimeConfinementRequirementDigestSha256:
        LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256,
      deniedTopLevelImports: ['sam2'] as const,
      exactModelArtifactRoleCount: 5,
      exactModelArtifactByteLength:
        EXACT_MODEL_ARTIFACT_BYTE_LENGTH,
      atomicReadOnlyMountRequiredForOneAttempt: true,
      oneRequestUnitOneImageOneGpuAttemptOneCostEvent:
        true,
      registryExpansionPermittedForReleasedDistinctExecutables:
        true,
      fakeIdentityForWeightAdapterLibraryPreprocessorOrCapabilityAllowed:
        false,
      auraFaceRemainsSeparateOptionalCpuContinuityQa:
        true,
    },
    conditioningUnitState:
      'private_conditioning_brief_lease_created_prompt_packet_merge_blocked' as const,
    promptPacketMerged: false as const,
    operationRegistered: false as const,
    dispatched: false as const,
    gpuAttemptCreated: false as const,
    actualCostReceiptCreated: false as const,
    assetCreated: false as const,
  }
  const unit = deepFreeze({
    ...unitDraft,
    conditioningUnitDigestSha256: digest(unitDraft),
  } satisfies
      LivingFrameControlledImageSelectedScenePrivateConditioningUnit)
  const lease = {
    leaseClass:
      'process_bound_single_use_selected_scene_private_conditioning_brief_lease_v1',
    leaseId,
    conditioningBindingDigestSha256: '',
    conditioningUnitId,
    requestUnitId: input.requestUnit.requestUnitId,
    callerSerializable: false,
    promptPacketMergeAuthority: false,
    dispatchAuthority: false,
    runtimeAuthority: false,
    productionReady: false,
  } satisfies
    LivingFrameControlledImageSelectedScenePrivateConditioningLease
  return {
    unit,
    lease,
    privateBrief,
  }
}

function findFullFrameUnit(
  extension:
    LivingFrameControlledImageFullFrameRatioExtension,
  requestUnit:
    LivingFrameControlledImageSelectedSceneRequestUnit,
): LivingFrameControlledImageFullFrameRatioUnit | null {
  const matches = extension.fullFrameRequestUnits.filter(
    (unit) =>
      unit.selectedSceneRequestUnitId ===
        requestUnit.requestUnitId
      && unit.selectedSceneRequestUnitDigestSha256 ===
        requestUnit.requestUnitDigestSha256
      && unit.sceneId === requestUnit.sceneId
      && unit.componentId === requestUnit.componentId
      && unit.outputKey === requestUnit.outputKey
      && unit.approvedWorkItemId ===
        requestUnit.approvedWorkItemId
      && unit.approvedWorkItemKey ===
        requestUnit.approvedWorkItemKey
      && unit.approvedPlannedAssetManifestEntryId ===
        requestUnit.approvedPlannedAssetManifestEntryId,
  )
  if (FULL_FRAME_COMPONENT_ROLES.has(requestUnit.componentRole)) {
    if (matches.length !== 1) {
      throw invalid(
        'cross_scene_work_item_or_output_substitution',
        `$.fullFrameRatioExtension.${requestUnit.requestUnitId}`,
      )
    }
    return matches[0]!
  }
  if (
    matches.length !== 0
    || !extension.isolatedComponentBoundary
      .isolatedRequestUnitIds.includes(
        requestUnit.requestUnitId,
      )
  ) {
    throw invalid(
      'cross_scene_work_item_or_output_substitution',
      `$.fullFrameRatioExtension.${requestUnit.requestUnitId}`,
    )
  }
  return null
}

function buildPositiveConditioning(input: {
  readonly requestUnit:
    LivingFrameControlledImageSelectedSceneRequestUnit
  readonly semanticScene: LivingFrameSemanticSceneProposal
  readonly semanticComponent:
    LivingFrameSemanticSceneProposal['components'][number]
  readonly designSheet:
    LivingFrameVisualContinuitySceneDesignSheet
  readonly pack: LivingFrameVisualContinuityPack
  readonly characterSheets:
    readonly LivingFrameVisualContinuityCharacterSheet[]
  readonly objectSheets:
    readonly LivingFrameVisualContinuityObjectSheet[]
  readonly environmentSheets:
    readonly LivingFrameVisualContinuityEnvironmentSheet[]
  readonly generationCanvas: {
    readonly canvasClass:
      | 'isolated_component_square_1024'
      | 'confirmed_full_frame_ratio'
    readonly widthPixels: number
    readonly heightPixels: number
  }
}): string {
  const style = input.pack.styleBible
  const palette = style.palette
    .map((color) => `${color.role} ${color.hex}`)
    .join(', ')
  const parts = [
    'Create one still illustration source for a professionally directed Living Frame scene.',
    `Narrative direction: ${input.semanticScene.derivedSummary}`,
    `Visual action to communicate: ${input.semanticScene.visualVerb}.`,
    `Exact component direction: ${input.semanticComponent.derivedSummary}`,
    `Component role and depth: ${input.semanticComponent.role}, ${input.semanticComponent.depthBand}.`,
    `Scene composition: ${input.designSheet.summary}`,
    `Composition strategy and depth: ${input.designSheet.compositionStrategy}, ${input.designSheet.depthStyle}.`,
    `Style: ${style.summary}`,
    `Asset treatment: ${style.assetTreatment}; line language: ${style.lineLanguage}; edge treatment: ${style.edgeTreatment}; texture: ${style.textureTreatment}; detail density: ${style.detailDensity}.`,
    `Lighting: ${style.lightingDirection}, ${style.lightingCharacter}.`,
    `Controlled palette: ${style.paletteMode}${palette ? `; ${palette}` : ''}.`,
    `Animation preparation: preserve a clean readable silhouette, separable foreground and background, independently isolatable moving parts, complete component geometry, and usable layer boundaries for selective 2.5D motion.`,
    `Motion language for downstream preparation only: ${input.pack.motionLanguageSheet.summary}; ${input.pack.motionLanguageSheet.motionCharacter}, ${input.pack.motionLanguageSheet.motionDensity}, camera ${input.pack.motionLanguageSheet.cameraCharacter}.`,
    `Generate at exactly ${input.generationCanvas.widthPixels} by ${input.generationCanvas.heightPixels} pixels as an opaque still source; downstream deterministic matting, rigging, camera, motion, sound, and final Remotion composition remain separate.`,
  ]
  if (SUBJECT_COMPONENT_ROLES.has(input.requestUnit.componentRole)) {
    for (const sheet of input.characterSheets) {
      parts.push(
        `Character continuity: ${sheet.canonicalAppearanceSummary} ${sheet.outfitSummary} ${sheet.silhouetteSummary} ${sheet.expressionRangeSummary}`,
      )
    }
    for (const sheet of input.objectSheets) {
      parts.push(
        `Object continuity: ${sheet.canonicalDesignSummary} ${sheet.materialAndColorSummary} Separability: ${sheet.separabilityCodes.join(', ')}.`,
      )
    }
  }
  if (ENVIRONMENT_COMPONENT_ROLES.has(
    input.requestUnit.componentRole,
  )) {
    for (const sheet of input.environmentSheets) {
      parts.push(
        `Environment continuity: ${sheet.canonicalEnvironmentSummary} ${sheet.atmosphereSummary} Depth: ${sheet.depthStyle}.`,
      )
    }
  }
  if (input.generationCanvas.canvasClass ===
    'isolated_component_square_1024') {
    parts.push(
      'Isolated-component source policy: center the complete component on a plain, uniform, easily separable opaque field; preserve every contour and leave room around the silhouette.',
    )
  } else {
    parts.push(
      `Full-frame source-plate policy: compose for the exact confirmed ${input.generationCanvas.widthPixels}:${input.generationCanvas.heightPixels} frame, preserve downstream caption, face, and gesture-safe-region revalidation, and do not treat this source plate as the finished video canvas.`,
    )
  }
  if (EXACT_FACT_SAFETY_MODES.has(
    input.semanticScene.sourceTruthMode,
  )) {
    parts.push(
      'Fact-safety policy: this generated source is illustrative only and remains blocked pending canonical documentary, geography, or data verification; do not invent exact evidence.',
    )
  } else if (
    input.semanticScene.sourceTruthMode ===
      'canonical_illustrative_interpretation'
  ) {
    parts.push(
      'Identity policy: present a canonical illustrative interpretation only; do not claim verified likeness, authentic archive, or documented action.',
    )
  }
  return parts.join(' ')
}

function buildNegativeConditioning(input: {
  readonly requestUnit:
    LivingFrameControlledImageSelectedSceneRequestUnit
  readonly sourceTruthMode: LivingFrameSourceTruthMode
  readonly pack: LivingFrameVisualContinuityPack
  readonly fullFrame: boolean
}): string {
  const avoid = [
    'no text, captions, labels, typography, watermark, signature, logo, UI, or border',
    'no baked motion blur, sword trail, smoke, dust, particles, glow, sound visualization, camera movement, or animation frames',
    'no fused moving parts, cropped silhouette, missing limbs or parts, merged foreground and background, or irreversible composite effects',
    'no transparent checkerboard claim, fake alpha, premultiplied fringe, or opaque rectangle presented as final alpha',
    'no final video canvas, finished edit, provider routing, model choice, file path, URL, command, credential, or runtime instruction',
    'no FaceID, InsightFace, unapproved likeness reconstruction, or unsupported identity claim',
    'no authentic archival-evidence claim, verified-fact claim, or unsupported historical action',
    ...input.pack.styleBible.avoidanceCodes.map(
      (code) => `avoid ${code.replaceAll('_', ' ')}`,
    ),
  ]
  if (!input.fullFrame) {
    avoid.push(
      'no environmental scene, complex background, fused contact shadow, foreground occluder, or full-frame composition around the isolated component',
    )
  } else {
    avoid.push(
      'no square-canvas substitution, aspect-ratio distortion, final-caption placement, final speaker composite, or final Remotion ownership claim',
    )
  }
  if (EXACT_FACT_SAFETY_MODES.has(input.sourceTruthMode)) {
    avoid.push(
      'no fabricated map geometry, data value, document, insignia, date, quotation, location, or event evidence',
    )
  }
  if (!input.requestUnit.controlPolicy.referenceConditioningRequired) {
    avoid.push(
      'no invented reference-image or identity-match claim',
    )
  }
  return avoid.join('; ')
}

function assertContinuityDigests(input: {
  readonly input: {
    readonly pack: LivingFrameVisualContinuityPack
    readonly designSheet:
      LivingFrameVisualContinuitySceneDesignSheet
    readonly continuityBinding:
      LivingFrameControlledImageSelectedSceneVisualContinuityPackBinding[
        'selectedSceneContinuityBindings'
      ][number]
  }
  readonly characterSheets:
    readonly LivingFrameVisualContinuityCharacterSheet[]
  readonly objectSheets:
    readonly LivingFrameVisualContinuityObjectSheet[]
  readonly environmentSheets:
    readonly LivingFrameVisualContinuityEnvironmentSheet[]
}): void {
  const { pack, designSheet, continuityBinding } = input.input
  if (
    continuityBinding.sceneDesignSheetDigestSha256 !==
      digest(designSheet)
    || continuityBinding.styleBibleDigestSha256 !==
      digest(pack.styleBible)
    || continuityBinding.motionLanguageSheetDigestSha256 !==
      digest(pack.motionLanguageSheet)
    || continuityBinding.alphaEdgeRulesDigestSha256 !==
      digest(pack.alphaEdgeRules)
    || stableAuthorityStringify(
      continuityBinding.characterSheetDigestsSha256,
    ) !== stableAuthorityStringify(
      input.characterSheets.map((sheet) => digest(sheet)),
    )
    || stableAuthorityStringify(
      continuityBinding.objectSheetDigestsSha256,
    ) !== stableAuthorityStringify(
      input.objectSheets.map((sheet) => digest(sheet)),
    )
    || stableAuthorityStringify(
      continuityBinding.environmentSheetDigestsSha256,
    ) !== stableAuthorityStringify(
      input.environmentSheets.map((sheet) => digest(sheet)),
    )
  ) {
    throw invalid(
      'continuity_payload_mismatch',
      '$.visualContinuityPackBinding.selectedSceneContinuityBindings',
    )
  }
}

function resolveSheets<
  T extends Record<K, string>,
  K extends keyof T,
>(
  ids: readonly string[],
  sheets: readonly T[],
  key: K,
): T[] {
  return ids.map((id) => {
    const matches = sheets.filter((sheet) => sheet[key] === id)
    if (matches.length !== 1) {
      throw invalid(
        'continuity_payload_mismatch',
        '$.visualContinuityPackBindingInput.semanticProposalBinding.continuityPack',
      )
    }
    return matches[0]!
  })
}

function styleRuleCount(
  pack: LivingFrameVisualContinuityPack,
): number {
  return 9
    + pack.styleBible.palette.length
    + pack.styleBible.avoidanceCodes.length
    + pack.motionLanguageSheet.stillnessPolicies.length
}

function assertInput(
  input:
    CreateLivingFrameControlledImageSelectedScenePrivateConditioningBindingInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'bindingId',
      'selectedSceneRequest',
      'selectedSceneRequestInput',
      'fullFrameRatioExtension',
      'fullFrameRatioExtensionInput',
      'visualContinuityPackBinding',
      'visualContinuityPackBindingInput',
    ])
    || !SAFE_ID.test(String(input.bindingId))
  ) {
    throw invalid('input_invalid', '$')
  }
}

function assertConditioningText(
  value: string,
  path: string,
): void {
  if (
    typeof value !== 'string'
    || value.trim() !== value
    || value.length < 24
    || URL_OR_PATH_LIKE.test(value)
    || SECRET_LIKE.test(value)
    || containsForbiddenControlCharacter(value)
  ) {
    throw invalid('conditioning_text_unsafe', path)
  }
  if (byteLength(value) > MAX_CONDITIONING_TEXT_BYTES) {
    throw invalid('conditioning_text_too_large', path)
  }
}

function containsForbiddenControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.charCodeAt(index)
    if (
      (codePoint >= 0 && codePoint <= 8)
      || codePoint === 11
      || codePoint === 12
      || (codePoint >= 14 && codePoint <= 31)
      || codePoint === 127
    ) return true
  }
  return false
}

function assertReceipt(
  draft:
    LivingFrameControlledImageSelectedScenePrivateConditioningBindingDraft,
  privateValues:
    readonly LivingFrameControlledImageSelectedScenePrivateConditioningBrief[],
): void {
  const {
    privateConditioningCompilationAuthority,
    ...delegatedAuthorities
  } = draft.authorityBoundary
  const serialized = stableAuthorityStringify(draft)
  if (
    privateConditioningCompilationAuthority !== true
    || Object.values(delegatedAuthorities).some(
      (value) => value !== false,
    )
    || draft.conditioningUnits.length < 1
    || draft.metrics.conditioningUnitCount !==
      draft.conditioningUnits.length
    || new Set(
      draft.conditioningUnits.map((unit) =>
        unit.requestUnitId),
    ).size !== draft.conditioningUnits.length
    || stableAuthorityStringify(draft.openGateCodes) !==
      stableAuthorityStringify(
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_OPEN_GATES,
      )
    || privateValues.some((brief) =>
      serialized.includes(brief.positiveConditioningText)
      || serialized.includes(brief.negativeConditioningText))
    || draft.promptPacketMerged
    || draft.promptMaterializationChanged
    || draft.operationRegistered
    || draft.dispatchGranted
    || draft.workerLeaseCreated
    || draft.runtimeExecuted
    || draft.gpuAttemptCreated
    || draft.actualCostReceiptCreated
    || draft.artifactPersisted
    || draft.assetManifestMutated
    || draft.semanticStyleQaExecuted
    || draft.documentaryFactSafetyRevalidated
    || draft.privateReviewApproved
    || draft.renderAuthorized
    || draft.finalCanvasCreatedByComfyUi
    || draft.productionReady
  ) {
    throw invalid('authority_promotion_forbidden', '$')
  }
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength
}

function digest(value: unknown): string {
  return sha256AuthorityValue(value)
}

function withoutDigest(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const {
    bindingDigestSha256: _bindingDigestSha256,
    ...rest
  } = value
  void _bindingDigestSha256
  return rest
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  return stableAuthorityStringify(actual) ===
    stableAuthorityStringify(wanted)
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value),
  )
}

function deepFreeze<T>(value: T): T {
  if (
    !value
    || typeof value !== 'object'
    || Object.isFrozen(value)
  ) return value
  Object.freeze(value)
  for (const entry of Object.values(value)) {
    deepFreeze(entry)
  }
  return value
}

function invalid(
  code:
    LivingFrameControlledImageSelectedScenePrivateConditioningIssueCode,
  path: string,
): LivingFrameControlledImageSelectedScenePrivateConditioningBindingError {
  if (!LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_CONDITIONING_ISSUE_CODES.includes(
    code,
  )) {
    throw new Error(`Unknown Living Frame conditioning issue: ${code}`)
  }
  return new LivingFrameControlledImageSelectedScenePrivateConditioningBindingError([
    { code, path },
  ])
}
