import {
  LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PRIVATE_ACTION_CONDITIONING_CLASS,
  LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PRIVATE_ACTION_CONDITIONING_STATE,
  LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PRIVATE_ACTION_CONDITIONING_VERSION,
  type LivingFrameCompleteCharacterKeyposePrivateActionConditioning,
  type LivingFrameCompleteCharacterKeyposePrivateActionConditioningAuthority,
  type LivingFrameCompleteCharacterKeyposePrivateActionConditioningDraft,
  type LivingFrameCompleteCharacterKeyposePrivateActionConditioningIssue,
  type LivingFrameCompleteCharacterKeyposePrivateActionConditioningIssueCode,
  type LivingFrameCompleteCharacterKeyposePrivateActionConditioningLease,
  type LivingFrameCompleteCharacterKeyposePrivateActionConditioningResult,
  type LivingFrameCompleteCharacterKeyposePrivateActionConditioningUnit,
} from '../../src/types/living-frame-complete-character-keypose-private-action-conditioning'
import type {
  LivingFrameCompleteCharacterKeyposeControlledImageBinding,
} from '../../src/types/living-frame-complete-character-keypose-controlled-image-binding'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  type CreateLivingFrameCompleteCharacterKeyposeControlledImageBindingInput,
  verifyLivingFrameCompleteCharacterKeyposeControlledImageBinding,
} from './living-frame-complete-character-keypose-controlled-image-binding'
import {
  createLivingFrameControlledImageSelectedScenePrivatePromptReader,
  type LivingFrameControlledImageSelectedScenePrivatePromptPacket,
  type LivingFrameControlledImageSelectedScenePrivatePromptPacketUnit,
  type LivingFrameControlledImageSelectedScenePrivatePromptReaderPort,
} from './living-frame-controlled-image-selected-scene-private-prompt-materialization'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const URL_PATH_OR_SECRET =
  /(?:https?:\/\/|file:\/\/|data:|javascript:|(?:^|[\s"'`])(?:\/|~\/|\.\.\/|[A-Za-z]:[\\/])|-----BEGIN [A-Z ]+PRIVATE KEY-----|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{16,})/iu
const MAX_DIRECTIVE_BYTES = 2_048
const MAX_MERGED_CONDITIONING_BYTES = 4_096

const AUTHORITY_BOUNDARY:
  LivingFrameCompleteCharacterKeyposePrivateActionConditioningAuthority =
  deepFreeze({
    privateActionConditioningAuthority: true,
    actionChoreographyAuthority: false,
    storyTimingAuthority: false,
    selectedSceneAuthority: false,
    selectedSceneConditioningAuthority: false,
    privateAliasRepositoryAuthority: false,
    promptMaterializationAuthority: false,
    modelSelectionAuthority: false,
    operationRegistryAuthority: false,
    dispatchAuthority: false,
    runtimeAuthority: false,
    artifactPersistenceAuthority: false,
    assetManifestAuthority: false,
    qaApprovalAuthority: false,
    privateReviewAuthority: false,
    renderAuthority: false,
    finalCanvasAuthority: false,
    actualCostAuthority: false,
    billingAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  })

export interface CreateLivingFrameCompleteCharacterKeyposePrivateActionConditioningInput {
  readonly conditioningId: string
  readonly controlledImageBinding:
    import('../../src/types/living-frame-complete-character-keypose-controlled-image-binding').LivingFrameCompleteCharacterKeyposeControlledImageBinding
  readonly controlledImageBindingInput:
    CreateLivingFrameCompleteCharacterKeyposeControlledImageBindingInput
}

interface PrivateActionDirective {
  readonly conditioningUnitId: string
  readonly bindingUnitId: string
  readonly selectedSceneRequestUnitId: string
  readonly positiveDirective: string
  readonly negativeDirective: string
}

const leases = new WeakSet<object>()
const consumedLeases = new WeakSet<object>()
const privateDirectives = new WeakMap<
  object,
  PrivateActionDirective
>()

export class LivingFrameCompleteCharacterKeyposePrivateActionConditioningError
  extends Error {
  readonly issues:
    readonly LivingFrameCompleteCharacterKeyposePrivateActionConditioningIssue[]

  constructor(
    issues:
      readonly LivingFrameCompleteCharacterKeyposePrivateActionConditioningIssue[],
  ) {
    super(
      'Living Frame complete-character keypose private action conditioning failed.',
    )
    this.name =
      'LivingFrameCompleteCharacterKeyposePrivateActionConditioningError'
    this.issues = issues
  }
}

export async function compileLivingFrameCompleteCharacterKeyposePrivateActionConditioning(
  input:
    CreateLivingFrameCompleteCharacterKeyposePrivateActionConditioningInput,
): Promise<LivingFrameCompleteCharacterKeyposePrivateActionConditioningResult> {
  assertInput(input)
  if (!await verifyLivingFrameCompleteCharacterKeyposeControlledImageBinding(
    input.controlledImageBinding,
    input.controlledImageBindingInput,
  )) throw invalid(
    'controlled_image_binding_invalid',
    '$.controlledImageBinding',
  )
  const compiled =
    input.controlledImageBinding.bindingUnits.map(
      (unit, order) => compileUnit(input, unit, order),
    )
  const units = compiled.map((entry) => entry.unit)
  const count = units.length
  const draft:
    LivingFrameCompleteCharacterKeyposePrivateActionConditioningDraft = {
      contractVersion:
        LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PRIVATE_ACTION_CONDITIONING_VERSION,
      resultClass:
        LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PRIVATE_ACTION_CONDITIONING_CLASS,
      conditioningState:
        LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PRIVATE_ACTION_CONDITIONING_STATE,
      conditioningId: input.conditioningId,
      canonicalScope: {
        ...input.controlledImageBinding.canonicalScope,
      },
      sourceBindings: {
        controlledImageBindingVersion:
          input.controlledImageBinding.contractVersion,
        controlledImageBindingId:
          input.controlledImageBinding.bindingId,
        controlledImageBindingDigestSha256:
          input.controlledImageBinding.bindingDigestSha256,
        keyposePlanId:
          input.controlledImageBinding.sourceBindings
            .keyposePlanId,
        keyposePlanDigestSha256:
          input.controlledImageBinding.sourceBindings
            .keyposePlanDigestSha256,
        actionChoreographyDigestSha256:
          input.controlledImageBinding.sourceBindings
            .actionChoreographyDigestSha256,
        authoritativeActionTimingArtifactId:
          input.controlledImageBinding.sourceBindings
            .authoritativeActionTimingArtifactId,
        authoritativeActionTimingDigestSha256:
          input.controlledImageBinding.sourceBindings
            .authoritativeActionTimingDigestSha256,
        selectedSceneRequestBindingDigestSha256:
          input.controlledImageBinding.sourceBindings
            .selectedSceneRequestBindingDigestSha256,
        approvedSnapshotId:
          input.controlledImageBinding.sourceBindings
            .approvedSnapshotId,
        approvedSnapshotHashSha256:
          input.controlledImageBinding.sourceBindings
            .approvedSnapshotHashSha256,
        currentMasterTimingDigestSha256:
          input.controlledImageBinding.sourceBindings
            .currentMasterTimingDigestSha256,
        confirmedOutputFrameExpectationDigestSha256:
          input.controlledImageBinding.sourceBindings
            .confirmedOutputFrameExpectationDigestSha256,
      },
      conditioningUnits: units,
      metrics: {
        actionConditioningUnitCount: count as 3 | 4,
        privateLeaseCount: count,
        distinctActionPhaseCount:
          new Set(units.map((unit) =>
            unit.actionPhase.actionPhaseId)).size,
        exactBodyMechanicDirectiveCount: count,
        exactPropConstraintDirectiveCount: count,
      },
      mergeBoundary: {
        sourceReaderMustBeServerOwnedSelectedSceneReader:
          true,
        nonKeyposeSelectedSceneUnitsRemainUnchanged:
          true,
        positiveAndNegativeSlotsMustAlreadyBePrivateConditioningText:
          true,
        oneActionLeaseConsumedPerExactKeyposeUnit:
          true,
        crossSceneWorkItemOutputOrKeyposeSubstitutionAllowed:
          false,
        mergedReaderRemainsSingleUseAtPromptMaterializer:
          true,
      },
      authorityBoundary: AUTHORITY_BOUNDARY,
      controlledImageBindingRevalidated: true,
      privateActionConditioningReconciled: true,
      rawActionConditioningExcludedFromReceipt: true,
      privatePromptMaterialized: false,
      operationRegistered: false,
      dispatchGranted: false,
      runtimeExecuted: false,
      assetCreated: false,
      canonicalQaApproved: false,
      actualCostReceiptCreated: false,
      customerCharged: false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  assertReceipt(draft)
  const receipt = deepFreeze({
    ...draft,
    conditioningDigestSha256:
      sha256AuthorityValue(draft),
  })
  const finalizedLeases = compiled.map((entry) => {
    const lease = Object.freeze({
      ...entry.lease,
      conditioningDigestSha256:
        receipt.conditioningDigestSha256,
    })
    leases.add(lease)
    privateDirectives.set(lease, entry.directive)
    return lease
  })
  return Object.freeze({
    receipt,
    privateActionConditioningLeases:
      Object.freeze(finalizedLeases),
  })
}

export async function verifyLivingFrameCompleteCharacterKeyposePrivateActionConditioning(
  value: unknown,
  input:
    CreateLivingFrameCompleteCharacterKeyposePrivateActionConditioningInput,
): Promise<boolean> {
  try {
    if (
      !isRecord(value)
      || value.contractVersion !==
        LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PRIVATE_ACTION_CONDITIONING_VERSION
      || value.resultClass !==
        LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PRIVATE_ACTION_CONDITIONING_CLASS
      || value.conditioningState !==
        LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PRIVATE_ACTION_CONDITIONING_STATE
      || typeof value.conditioningDigestSha256 !== 'string'
      || !SHA256.test(value.conditioningDigestSha256)
    ) return false
    const {
      conditioningDigestSha256,
      ...draft
    } = value
    if (
      conditioningDigestSha256 !==
        sha256AuthorityValue(draft)
    ) return false
    const expected =
      await compileLivingFrameCompleteCharacterKeyposePrivateActionConditioning(
        input,
      )
    return stableAuthorityStringify(value) ===
      stableAuthorityStringify(expected.receipt)
  } catch {
    return false
  }
}

export function createLivingFrameCompleteCharacterKeyposeActionConditionedPrivatePromptReader(
  input: {
    readonly actionConditioning:
      LivingFrameCompleteCharacterKeyposePrivateActionConditioning
    readonly privateActionConditioningLeases:
      readonly LivingFrameCompleteCharacterKeyposePrivateActionConditioningLease[]
    readonly baseSelectedSceneReader:
      LivingFrameControlledImageSelectedScenePrivatePromptReaderPort
  },
): LivingFrameControlledImageSelectedScenePrivatePromptReaderPort {
  assertReaderInput(input)
  return createLivingFrameControlledImageSelectedScenePrivatePromptReader(
    async (locatorId) => {
      let raw: unknown
      try {
        raw = await input.baseSelectedSceneReader
          .readCurrentByServerOwnedLocator(locatorId)
      } catch {
        throw invalid('reader_failed', '$.baseSelectedSceneReader')
      }
      return mergeActionConditioning({
        raw,
        actionConditioning: input.actionConditioning,
        privateActionConditioningLeases:
          input.privateActionConditioningLeases,
      })
    },
  )
}

function compileUnit(
  input:
    CreateLivingFrameCompleteCharacterKeyposePrivateActionConditioningInput,
  bindingUnit:
    LivingFrameCompleteCharacterKeyposeControlledImageBinding['bindingUnits'][number],
  order: number,
): {
  readonly unit:
    LivingFrameCompleteCharacterKeyposePrivateActionConditioningUnit
  readonly lease:
    LivingFrameCompleteCharacterKeyposePrivateActionConditioningLease
  readonly directive: PrivateActionDirective
} {
  if (bindingUnit.order !== order) throw invalid(
    'unit_set_mismatch',
    `$.controlledImageBinding.bindingUnits.${order}`,
  )
  const positiveDirective = [
    'Generate one complete-character still for this exact approved action keypose.',
    `Action phase role: ${bindingUnit.role}.`,
    `Action-phase purpose: ${bindingUnit.actionDescription}`,
    `Why this pose is required: ${bindingUnit.keyposeSelectionReason}`,
    `Body mechanics: ${bindingUnit.bodyMechanicIntent}`,
    `Prop and attachment constraint: ${bindingUnit.propConstraint}.`,
    `StoryTiming planning anchor: frame ${bindingUnit.storyTimingFrame}; minimum readable hold ${bindingUnit.minimumHoldFrames} frames.`,
    'Preserve the complete figure, correct anatomy, hands, limb count, costume, identity, prop attachment, secondary-part attachment, and a clean isolated silhouette.',
    'This is one accepted-keypose candidate only; do not generate an animation frame sequence or the final video canvas.',
  ].join(' ')
  const negativeDirective = [
    `do not substitute a neutral, generic, or different action for ${bindingUnit.role}`,
    'no detached limb, severed hand, floating prop, visible puppet joint, broken anatomy, extra limb, missing limb, cropped body, or costume drift',
    'no loss of required prop contact or attachment continuity',
    'no interpolation, multi-frame strip, contact sheet, motion blur, speed line, baked camera motion, or final composite',
    'no FaceID, InsightFace, caller prompt, caller dimensions, caller seed, model path, URL, command, credential, or runtime instruction',
  ].join('; ')
  assertDirective(positiveDirective)
  assertDirective(negativeDirective)
  const identity = {
    conditioningId: input.conditioningId,
    bindingUnitDigestSha256:
      bindingUnit.bindingUnitDigestSha256,
    positiveActionDirectiveDigestSha256:
      sha256AuthorityValue(positiveDirective),
    negativeActionDirectiveDigestSha256:
      sha256AuthorityValue(negativeDirective),
  }
  const conditioningUnitId =
    `lf-keypose-action.${sha256AuthorityValue(identity).slice(0, 40)}`
  const leaseId =
    `lf-keypose-action-lease.${sha256AuthorityValue({
      conditioningUnitId,
      bindingUnitId: bindingUnit.bindingUnitId,
    }).slice(0, 40)}`
  const unitDraft = {
    order,
    conditioningUnitId,
    bindingUnitId: bindingUnit.bindingUnitId,
    bindingUnitDigestSha256:
      bindingUnit.bindingUnitDigestSha256,
    keyposeUnitId: bindingUnit.keyposeUnitId,
    keyposeUnitDigestSha256:
      bindingUnit.keyposeUnitDigestSha256,
    selectedSceneRequestUnitId:
      bindingUnit.selectedSceneRequestUnitId,
    selectedSceneRequestUnitDigestSha256:
      bindingUnit.selectedSceneRequestUnitDigestSha256,
    sceneId: bindingUnit.sceneId,
    componentId: bindingUnit.componentId,
    approvedWorkItemId:
      bindingUnit.approvedWorkItemId,
    approvedWorkItemKey:
      bindingUnit.approvedWorkItemKey,
    approvedPlannedAssetManifestEntryId:
      bindingUnit.approvedPlannedAssetManifestEntryId,
    outputKey: bindingUnit.outputKey,
    actionPhase: {
      role: bindingUnit.role,
      actionPhaseId: bindingUnit.actionPhaseId,
      storyTimingFrame:
        bindingUnit.storyTimingFrame,
      minimumHoldFrames:
        bindingUnit.minimumHoldFrames,
      propConstraint: bindingUnit.propConstraint,
    },
    privateConditioningReceipt: {
      leaseId,
      positiveActionDirectiveDigestSha256:
        sha256AuthorityValue(positiveDirective),
      positiveActionDirectiveByteLength:
        Buffer.byteLength(positiveDirective, 'utf8'),
      negativeActionDirectiveDigestSha256:
        sha256AuthorityValue(negativeDirective),
      negativeActionDirectiveByteLength:
        Buffer.byteLength(negativeDirective, 'utf8'),
      rawActionDirectiveIncluded: false,
      rawChatTranscriptOrCallerPromptIncluded: false,
      imageModelPathUrlBytesCredentialCommandOrEnvironmentIncluded:
        false,
      leaseConsumed: false,
    },
    conditioningPolicy: {
      appendsToValidatedServerOwnedSelectedSceneConditioning:
        true,
      replacesSelectedSceneStyleOrContinuityConditioning:
        false,
      exactActionPhaseSemanticsIncluded: true,
      exactBodyMechanicsIncluded: true,
      exactPropConstraintIncluded: true,
      storyTimingFrameIncludedAsPlanningContextOnly:
        true,
      genericNeutralPoseSubstitutionAllowed: false,
      independentlyInventedActionAllowed: false,
      bakedMotionOrMultiFrameOutputRequested: false,
      completeCharacterAndCleanSilhouetteRequired:
        true,
    },
    conditioningState:
      'private_action_directive_lease_created_prompt_packet_merge_pending',
    promptPacketMerged: false,
    operationRegistered: false,
    dispatched: false,
    runtimeExecuted: false,
    assetCreated: false,
    qaApproved: false,
  } as const
  const unit = deepFreeze({
    ...unitDraft,
    conditioningUnitDigestSha256:
      sha256AuthorityValue(unitDraft),
  })
  const lease = {
    leaseClass:
      'process_bound_single_use_complete_character_keypose_action_conditioning_lease_v1',
    leaseId,
    conditioningDigestSha256: '',
    conditioningUnitId,
    bindingUnitId: bindingUnit.bindingUnitId,
    selectedSceneRequestUnitId:
      bindingUnit.selectedSceneRequestUnitId,
    callerSerializable: false,
    promptPacketMergeAuthority: false,
    dispatchAuthority: false,
    runtimeAuthority: false,
    productionReady: false,
  } as const
  return {
    unit,
    lease,
    directive: deepFreeze({
      conditioningUnitId,
      bindingUnitId: bindingUnit.bindingUnitId,
      selectedSceneRequestUnitId:
        bindingUnit.selectedSceneRequestUnitId,
      positiveDirective,
      negativeDirective,
    }),
  }
}

function mergeActionConditioning(input: {
  readonly raw: unknown
  readonly actionConditioning:
    LivingFrameCompleteCharacterKeyposePrivateActionConditioning
  readonly privateActionConditioningLeases:
    readonly LivingFrameCompleteCharacterKeyposePrivateActionConditioningLease[]
}): LivingFrameControlledImageSelectedScenePrivatePromptPacket {
  const packet = assertPacket(input.raw)
  const conditioning = input.actionConditioning
  if (
    packet.selectedSceneRequestBindingDigestSha256 !==
      conditioning.sourceBindings
        .selectedSceneRequestBindingDigestSha256
    || packet.approvedSnapshotId !==
      conditioning.sourceBindings.approvedSnapshotId
    || packet.approvedSnapshotHashSha256 !==
      conditioning.sourceBindings.approvedSnapshotHashSha256
    || packet.sceneId !== conditioning.canonicalScope.sceneId
  ) throw invalid(
    'source_lineage_mismatch',
    '$.baseSelectedScenePacket',
  )
  const leaseByConditioningUnit = new Map(
    input.privateActionConditioningLeases.map((lease) => [
      lease.conditioningUnitId,
      lease,
    ]),
  )
  if (
    leaseByConditioningUnit.size !==
      conditioning.conditioningUnits.length
    || input.privateActionConditioningLeases.some((lease) =>
      lease.conditioningDigestSha256 !==
        conditioning.conditioningDigestSha256)
  ) throw invalid('lease_invalid', '$.privateActionConditioningLeases')

  const unitByRequestId = new Map(
    conditioning.conditioningUnits.map((unit) => [
      unit.selectedSceneRequestUnitId,
      unit,
    ]),
  )
  if (unitByRequestId.size !== conditioning.conditioningUnits.length) {
    throw invalid('unit_set_mismatch', '$.conditioningUnits')
  }
  let matched = 0
  const units = packet.units.map((packetUnit, order) => {
    const conditioningUnit =
      unitByRequestId.get(packetUnit.requestUnitId)
    if (!conditioningUnit) return packetUnit
    matched += 1
    const lease = leaseByConditioningUnit.get(
      conditioningUnit.conditioningUnitId,
    )
    if (
      !lease
      || packetUnit.order !== order
      || packetUnit.requestUnitDigestSha256 !==
        conditioningUnit.selectedSceneRequestUnitDigestSha256
      || packetUnit.sceneId !== conditioningUnit.sceneId
      || packetUnit.outputKey !== conditioningUnit.outputKey
      || packetUnit.approvedWorkItemId !==
        conditioningUnit.approvedWorkItemId
      || packetUnit.approvedWorkItemKey !==
        conditioningUnit.approvedWorkItemKey
      || packetUnit.approvedPlannedAssetManifestEntryId !==
        conditioningUnit.approvedPlannedAssetManifestEntryId
      || lease.bindingUnitId !== conditioningUnit.bindingUnitId
      || lease.selectedSceneRequestUnitId !==
        conditioningUnit.selectedSceneRequestUnitId
    ) throw invalid(
      'cross_keypose_work_item_or_output_substitution',
      `$.baseSelectedScenePacket.units.${order}`,
    )
    const directive = consumeDirective(lease)
    const conditioningSlots = packetUnit.resolvedSlots.filter((slot) =>
      slot.slotKind === 'positive_conditioning_text'
      || slot.slotKind === 'negative_conditioning_text')
    if (
      conditioningSlots.length !== 2
      || conditioningSlots.some((slot) =>
        slot.valueClass !== 'private_conditioning_text'
        || !slot.value.trim())
    ) throw invalid(
      'conditioning_slot_invalid',
      `$.baseSelectedScenePacket.units.${order}.resolvedSlots`,
    )
    return {
      ...packetUnit,
      resolvedSlots: packetUnit.resolvedSlots.map((slot) => {
        if (slot.slotKind === 'positive_conditioning_text') {
          return {
            ...slot,
            value: mergeText(
              slot.value,
              directive.positiveDirective,
            ),
          }
        }
        if (slot.slotKind === 'negative_conditioning_text') {
          return {
            ...slot,
            value: mergeText(
              slot.value,
              directive.negativeDirective,
            ),
          }
        }
        return { ...slot }
      }),
    }
  })
  if (matched !== conditioning.conditioningUnits.length) {
    throw invalid('unit_set_mismatch', '$.baseSelectedScenePacket.units')
  }
  return {
    ...packet,
    units,
  }
}

function consumeDirective(
  lease:
    LivingFrameCompleteCharacterKeyposePrivateActionConditioningLease,
): PrivateActionDirective {
  if (
    !leases.has(lease)
    || consumedLeases.has(lease)
    || lease.leaseClass !==
      'process_bound_single_use_complete_character_keypose_action_conditioning_lease_v1'
    || lease.callerSerializable !== false
    || lease.promptPacketMergeAuthority !== false
    || lease.dispatchAuthority !== false
    || lease.runtimeAuthority !== false
    || lease.productionReady !== false
  ) throw invalid(
    consumedLeases.has(lease)
      ? 'lease_reused'
      : 'lease_invalid',
    '$.privateActionConditioningLease',
  )
  const directive = privateDirectives.get(lease)
  if (!directive) throw invalid('lease_invalid', '$.privateActionConditioningLease')
  consumedLeases.add(lease)
  privateDirectives.delete(lease)
  return directive
}

function assertReaderInput(input: {
  readonly actionConditioning:
    LivingFrameCompleteCharacterKeyposePrivateActionConditioning
  readonly privateActionConditioningLeases:
    readonly LivingFrameCompleteCharacterKeyposePrivateActionConditioningLease[]
  readonly baseSelectedSceneReader:
    LivingFrameControlledImageSelectedScenePrivatePromptReaderPort
}): void {
  if (
    !isRecord(input)
    || !isRecord(input.actionConditioning)
    || !Array.isArray(input.privateActionConditioningLeases)
    || !isRecord(input.baseSelectedSceneReader)
    || input.baseSelectedSceneReader.readerClass !==
      'process_bound_server_owned_selected_scene_private_prompt_reader_v1'
    || input.baseSelectedSceneReader.sourceAuthority !==
      'current_selected_scene_conditioning_and_private_alias_repository'
    || input.baseSelectedSceneReader.callerPacketAccepted !== false
    || input.baseSelectedSceneReader.callerPromptAccepted !== false
    || input.baseSelectedSceneReader.callerSlotValueAccepted !== false
    || input.baseSelectedSceneReader.operationAuthority !== false
    || input.baseSelectedSceneReader.dispatchAuthority !== false
    || input.baseSelectedSceneReader.runtimeAuthority !== false
    || input.baseSelectedSceneReader.productionReady !== false
  ) throw invalid('reader_invalid', '$')
  assertReceiptValue(input.actionConditioning)
}

function assertReceiptValue(
  value:
    LivingFrameCompleteCharacterKeyposePrivateActionConditioning,
): void {
  if (
    value.contractVersion !==
      LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PRIVATE_ACTION_CONDITIONING_VERSION
    || value.resultClass !==
      LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PRIVATE_ACTION_CONDITIONING_CLASS
    || value.conditioningState !==
      LIVING_FRAME_COMPLETE_CHARACTER_KEYPOSE_PRIVATE_ACTION_CONDITIONING_STATE
    || !SHA256.test(value.conditioningDigestSha256)
  ) throw invalid('reader_invalid', '$.actionConditioning')
  const {
    conditioningDigestSha256,
    ...draft
  } = value
  assertReceipt(draft)
  if (
    conditioningDigestSha256 !==
      sha256AuthorityValue(draft)
  ) throw invalid('digest_mismatch', '$.actionConditioning')
}

function assertPacket(
  value: unknown,
): LivingFrameControlledImageSelectedScenePrivatePromptPacket {
  if (
    !isRecord(value)
    || typeof value.selectedSceneRequestBindingDigestSha256 !== 'string'
    || !SHA256.test(value.selectedSceneRequestBindingDigestSha256)
    || typeof value.fullFrameRatioExtensionDigestSha256 !== 'string'
    || !SHA256.test(value.fullFrameRatioExtensionDigestSha256)
    || typeof value.approvedSnapshotId !== 'string'
    || !SAFE_ID.test(value.approvedSnapshotId)
    || typeof value.approvedSnapshotHashSha256 !== 'string'
    || !SHA256.test(value.approvedSnapshotHashSha256)
    || typeof value.sceneId !== 'string'
    || !SAFE_ID.test(value.sceneId)
    || !Array.isArray(value.units)
    || value.units.length < 1
    || value.units.some((unit, order) =>
      !isPacketUnit(unit, order))
  ) throw invalid('packet_invalid', '$.baseSelectedScenePacket')
  return value as unknown as
    LivingFrameControlledImageSelectedScenePrivatePromptPacket
}

function isPacketUnit(
  value: unknown,
  order: number,
): value is LivingFrameControlledImageSelectedScenePrivatePromptPacketUnit {
  return isRecord(value)
    && value.order === order
    && typeof value.requestUnitId === 'string'
    && SAFE_ID.test(value.requestUnitId)
    && typeof value.requestUnitDigestSha256 === 'string'
    && SHA256.test(value.requestUnitDigestSha256)
    && typeof value.sceneId === 'string'
    && SAFE_ID.test(value.sceneId)
    && typeof value.outputKey === 'string'
    && SAFE_ID.test(value.outputKey)
    && typeof value.approvedWorkItemId === 'string'
    && SAFE_ID.test(value.approvedWorkItemId)
    && typeof value.approvedWorkItemKey === 'string'
    && SAFE_ID.test(value.approvedWorkItemKey)
    && typeof value.approvedPlannedAssetManifestEntryId === 'string'
    && SAFE_ID.test(value.approvedPlannedAssetManifestEntryId)
    && typeof value.serverOwnedConditioningLocatorId === 'string'
    && SAFE_ID.test(value.serverOwnedConditioningLocatorId)
    && Array.isArray(value.resolvedSlots)
}

function mergeText(base: string, directive: string): string {
  const merged = `${base.trim()} ${directive}`
  if (
    Buffer.byteLength(merged, 'utf8') >
      MAX_MERGED_CONDITIONING_BYTES
    || URL_PATH_OR_SECRET.test(merged)
  ) throw invalid('action_conditioning_invalid', '$.mergedConditioningText')
  return merged
}

function assertDirective(value: string): void {
  if (
    !value.trim()
    || Buffer.byteLength(value, 'utf8') >
      MAX_DIRECTIVE_BYTES
    || URL_PATH_OR_SECRET.test(value)
    || containsForbiddenControlCharacter(value)
  ) throw invalid('action_conditioning_invalid', '$.privateActionDirective')
}

function containsForbiddenControlCharacter(
  value: string,
): boolean {
  for (const character of value) {
    const code = character.codePointAt(0) ?? 0
    if (
      code === 127
      || (code < 32 && code !== 9 && code !== 10 && code !== 13)
    ) return true
  }
  return false
}

function assertReceipt(
  draft:
    LivingFrameCompleteCharacterKeyposePrivateActionConditioningDraft,
): void {
  if (
    (draft.conditioningUnits.length !== 3
      && draft.conditioningUnits.length !== 4)
    || draft.metrics.actionConditioningUnitCount !==
      draft.conditioningUnits.length
    || draft.metrics.privateLeaseCount !==
      draft.conditioningUnits.length
    || draft.metrics.distinctActionPhaseCount !==
      draft.conditioningUnits.length
    || !draft.privateActionConditioningReconciled
    || !draft.rawActionConditioningExcludedFromReceipt
    || draft.privatePromptMaterialized
    || draft.conditioningUnits.some((unit) =>
      unit.promptPacketMerged
      || unit.operationRegistered
      || unit.dispatched
      || unit.runtimeExecuted
      || unit.assetCreated
      || unit.qaApproved
      || unit.privateConditioningReceipt.rawActionDirectiveIncluded
      || unit.privateConditioningReceipt.rawChatTranscriptOrCallerPromptIncluded)
    || draft.operationRegistered
    || draft.dispatchGranted
    || draft.runtimeExecuted
    || draft.assetCreated
    || draft.canonicalQaApproved
    || draft.actualCostReceiptCreated
    || draft.customerCharged
    || draft.publicDeliveryReady
    || draft.productionReady
    || JSON.stringify(draft).includes('Body mechanics:')
    || JSON.stringify(draft).includes('Generate one complete-character')
  ) throw invalid('unsafe_receipt_forbidden', '$')
}

function assertInput(
  input:
    CreateLivingFrameCompleteCharacterKeyposePrivateActionConditioningInput,
): void {
  if (
    !isRecord(input)
    || Object.keys(input).sort().join('|') !== [
      'conditioningId',
      'controlledImageBinding',
      'controlledImageBindingInput',
    ].sort().join('|')
    || typeof input.conditioningId !== 'string'
    || !SAFE_ID.test(input.conditioningId)
  ) throw invalid('input_invalid', '$')
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
    LivingFrameCompleteCharacterKeyposePrivateActionConditioningIssueCode,
  path: string,
): LivingFrameCompleteCharacterKeyposePrivateActionConditioningError {
  return new LivingFrameCompleteCharacterKeyposePrivateActionConditioningError([{
    code,
    path,
  }])
}
