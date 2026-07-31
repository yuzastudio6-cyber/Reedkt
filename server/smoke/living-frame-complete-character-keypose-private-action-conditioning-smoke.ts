import assert from 'node:assert/strict'

import type {
  LivingFrameControlledSdxlBenchmarkRequestSlotKind,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-request-blueprint'
import type {
  LivingFrameCompleteCharacterKeyposePrivateActionConditioning,
} from '../../src/types/living-frame-complete-character-keypose-private-action-conditioning'
import type {
  LivingFrameCompleteCharacterKeyposeActionPromptMergeEvidence,
} from '../../src/types/living-frame-complete-character-keypose-action-prompt-binding'
import {
  compileLivingFrameCompleteCharacterKeyposeActionPromptBinding,
  LivingFrameCompleteCharacterKeyposeActionPromptBindingError,
  type CreateLivingFrameCompleteCharacterKeyposeActionPromptBindingInput,
  verifyLivingFrameCompleteCharacterKeyposeActionPromptBinding,
  verifyLivingFrameCompleteCharacterKeyposeActionPromptMergeEvidence,
} from '../living-frame/living-frame-complete-character-keypose-action-prompt-binding'
import {
  compileLivingFrameCompleteCharacterKeyposePrivateActionConditioning,
  createLivingFrameCompleteCharacterKeyposeActionConditionedPrivatePromptReaderWithEvidence,
  LivingFrameCompleteCharacterKeyposePrivateActionConditioningError,
  type CreateLivingFrameCompleteCharacterKeyposePrivateActionConditioningInput,
  verifyLivingFrameCompleteCharacterKeyposePrivateActionConditioning,
} from '../living-frame/living-frame-complete-character-keypose-private-action-conditioning'
import {
  consumeLivingFrameControlledImageSelectedScenePrivatePromptRequestLease,
  createLivingFrameControlledImageSelectedScenePrivatePromptReader,
  materializeLivingFrameControlledImageSelectedScenePrivatePrompt,
  type LivingFrameControlledImageSelectedScenePrivatePromptPacket,
} from '../living-frame/living-frame-controlled-image-selected-scene-private-prompt-materialization'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  livingFrameCompleteCharacterKeyposeAdmissionCandidate as admissionCandidate,
  livingFrameCompleteCharacterKeyposeControlledImageBinding as controlledImageBinding,
  livingFrameCompleteCharacterKeyposeControlledImageBindingInput as controlledImageBindingInput,
  livingFrameCompleteCharacterKeyposeFullFrameRatioExtension as fullFrameRatioExtension,
  livingFrameCompleteCharacterKeyposeFullFrameRatioExtensionInput as fullFrameRatioExtensionInput,
  livingFrameCompleteCharacterKeyposeSelectedSceneRequest as selectedSceneRequest,
  livingFrameCompleteCharacterKeyposeSelectedSceneRequestInput as selectedSceneRequestInput,
} from './living-frame-complete-character-keypose-controlled-image-binding-smoke'

const input = {
  conditioningId:
    'conditioning.character-action-keyposes.v1',
  controlledImageBinding,
  controlledImageBindingInput,
} as const
const actionConditioning =
  await compileLivingFrameCompleteCharacterKeyposePrivateActionConditioning(
    input,
  )

assert.equal(
  await verifyLivingFrameCompleteCharacterKeyposePrivateActionConditioning(
    actionConditioning.receipt,
    input,
  ),
  true,
)
assert.equal(
  actionConditioning.receipt.conditioningUnits.length,
  4,
)
assert.equal(
  actionConditioning.privateActionConditioningLeases.length,
  4,
)
assert.deepEqual(
  actionConditioning.receipt.conditioningUnits.map((unit) =>
    unit.actionPhase.role),
  ['start', 'anticipation', 'contact', 'settle'],
)
assert.deepEqual(
  actionConditioning.receipt.conditioningUnits.map((unit) =>
    unit.actionPhase.storyTimingFrame),
  [12, 17, 24, 38],
)
assert.equal(
  JSON.stringify(actionConditioning.receipt).includes(
    'Body mechanics:',
  ),
  false,
)
assert.equal(
  JSON.stringify(actionConditioning.receipt).includes(
    'Generate one complete-character',
  ),
  false,
)

const packet = createPacket()
const baseReader =
  createLivingFrameControlledImageSelectedScenePrivatePromptReader(
    async (locatorId) => {
      assert.equal(
        locatorId,
        'locator.character-action-keyposes.v1',
      )
      return structuredClone(packet)
    },
  )
const actionReaderWithEvidence =
  createLivingFrameCompleteCharacterKeyposeActionConditionedPrivatePromptReaderWithEvidence({
    actionConditioning: actionConditioning.receipt,
    privateActionConditioningLeases:
      actionConditioning.privateActionConditioningLeases,
    baseSelectedSceneReader: baseReader,
  })
const materialization =
  await materializeLivingFrameControlledImageSelectedScenePrivatePrompt({
    materializationBatchId:
      'materialization.character-action-keyposes.v1',
    serverOwnedMaterializationLocatorId:
      'locator.character-action-keyposes.v1',
    selectedSceneRequest,
    selectedSceneRequestInput,
    fullFrameRatioExtension,
    fullFrameRatioExtensionInput,
    admissionCandidate,
    reader: actionReaderWithEvidence.reader,
  })
const promptMergeEvidence =
  actionReaderWithEvidence.readMergeEvidence()

assert.equal(
  verifyLivingFrameCompleteCharacterKeyposeActionPromptMergeEvidence(
    promptMergeEvidence,
  ),
  true,
)
assert.equal(promptMergeEvidence.units.length, 4)
assert.equal(promptMergeEvidence.nonKeyposeSelectedSceneUnitCount, 1)
assert.equal(
  JSON.stringify(promptMergeEvidence).includes(
    'Action phase role:',
  ),
  false,
)

const promptBindingInput = {
  promptBindingId:
    'binding.character-action-keypose-prompts.v1',
  actionConditioning: actionConditioning.receipt,
  actionConditioningInput: input,
  promptMergeEvidence,
  promptMaterialization: materialization.receipt,
} as const
const promptBinding =
  await compileLivingFrameCompleteCharacterKeyposeActionPromptBinding(
    promptBindingInput,
  )

assert.equal(
  await verifyLivingFrameCompleteCharacterKeyposeActionPromptBinding(
    promptBinding,
    promptBindingInput,
  ),
  true,
)
assert.equal(promptBinding.promptBindingUnits.length, 4)
assert.equal(
  promptBinding.metrics.exactPositiveDigestMatchCount,
  4,
)
assert.equal(
  promptBinding.metrics.exactNegativeDigestMatchCount,
  4,
)
assert.equal(promptBinding.metrics.controlNetUnitCount, 4)
assert.equal(promptBinding.metrics.genericIpAdapterUnitCount, 4)
assert.equal(
  promptBinding.promptBindingUnits.every((unit) =>
    unit.generationCanvas.widthPixels === 1_024
    && unit.generationCanvas.heightPixels === 1_024
    && unit.generationCanvas.finalCanvasCreatedByComfyUi === false),
  true,
)
assert.equal(
  JSON.stringify(promptBinding).includes('Body mechanics:'),
  false,
)

assert.equal(
  materialization.receipt.materializationUnits.length,
  5,
)
assert.equal(
  materialization.receipt.metrics.controlNetUnitCount,
  5,
)
assert.equal(
  materialization.receipt.metrics.genericIpAdapterUnitCount,
  4,
)
assert.equal(
  materialization.receipt.operationRegistered,
  false,
)
assert.equal(
  materialization.receipt.dispatchGranted,
  false,
)
assert.equal(
  materialization.receipt.runtimeExecuted,
  false,
)
assert.equal(
  materialization.receipt.productionReady,
  false,
)

const privateRequests =
  materialization.privatePromptRequestLeases.map((lease) =>
    consumeLivingFrameControlledImageSelectedScenePrivatePromptRequestLease(
      lease,
    ))
const actionRequests = privateRequests.filter((request) =>
  controlledImageBinding.bindingUnits.some((unit) =>
    unit.selectedSceneRequestUnitId === request.requestUnitId))
assert.equal(actionRequests.length, 4)
for (const [order, request] of actionRequests.entries()) {
  const positiveTexts = Object.values(request.prompt)
    .filter((node) => node.class_type === 'CLIPTextEncode')
    .map((node) => String(node.inputs.text))
    .filter((text) => text.includes('Action phase role:'))
  assert.equal(positiveTexts.length, 1)
  assert.match(
    positiveTexts[0]!,
    new RegExp(
      `Action phase role: ${[
        'start',
        'anticipation',
        'contact',
        'settle',
      ][order]}\\.`,
      'u',
    ),
  )
  assert.match(
    positiveTexts[0]!,
    /Body mechanics:/u,
  )
  assert.match(
    positiveTexts[0]!,
    /Prop and attachment constraint:/u,
  )
  assert.match(
    positiveTexts[0]!,
    /StoryTiming planning anchor: frame/u,
  )
  assert.equal(request.widthPixels, 1024)
  assert.equal(request.heightPixels, 1024)
  assert.equal(request.outputImageCount, 1)
  assert.equal(request.dispatchAuthority, false)
  assert.equal(request.runtimeAuthority, false)
  assert.equal(request.finalCanvasAuthority, false)
  assert.equal(request.productionReady, false)
}
const plateRequest = privateRequests.find((request) =>
  !controlledImageBinding.bindingUnits.some((unit) =>
    unit.selectedSceneRequestUnitId === request.requestUnitId))!
const plateTexts = Object.values(plateRequest.prompt)
  .filter((node) => node.class_type === 'CLIPTextEncode')
  .map((node) => String(node.inputs.text))
assert.equal(
  plateTexts.some((text) =>
    text.includes('Action phase role:')),
  false,
)
assert.equal(plateRequest.widthPixels, 1920)
assert.equal(plateRequest.heightPixels, 1080)

await assertRejectsWith({
  ...input,
  rawPrompt: 'caller action prompt is forbidden',
} as unknown as
  CreateLivingFrameCompleteCharacterKeyposePrivateActionConditioningInput,
'input_invalid')

const authorityForgery = resign(
  actionConditioning.receipt,
  (draft) => {
    draft.privatePromptMaterialized = true
    draft.operationRegistered = true
    draft.dispatchGranted = true
    draft.runtimeExecuted = true
    draft.assetCreated = true
    draft.canonicalQaApproved = true
    draft.productionReady = true
  },
)
assert.equal(
  await verifyLivingFrameCompleteCharacterKeyposePrivateActionConditioning(
    authorityForgery,
    input,
  ),
  false,
)

await assert.rejects(
  createLivingFrameCompleteCharacterKeyposeActionConditionedPrivatePromptReaderWithEvidence({
      actionConditioning:
        actionConditioning.receipt,
      privateActionConditioningLeases:
        actionConditioning.privateActionConditioningLeases,
      baseSelectedSceneReader:
        createLivingFrameControlledImageSelectedScenePrivatePromptReader(
          async () => createPacket(),
        ),
    }).reader.readCurrentByServerOwnedLocator(
    'locator.character-action-keyposes.v1',
  ),
)

const forgedMergeEvidence = resignMergeEvidence(
  promptMergeEvidence,
  (draft) => {
    const units = draft.units as Array<Record<string, unknown>>
    units[0]!.mergedPositiveConditioningDigestSha256 =
      'f'.repeat(64)
  },
)
assert.equal(
  verifyLivingFrameCompleteCharacterKeyposeActionPromptMergeEvidence(
    forgedMergeEvidence,
  ),
  true,
)
await assertPromptBindingRejectsWith({
  ...promptBindingInput,
  promptMergeEvidence: forgedMergeEvidence,
}, 'prompt_merge_evidence_invalid')

const crossOutputMergeEvidence = resignMergeEvidence(
  promptMergeEvidence,
  (draft) => {
    const units = draft.units as Array<Record<string, unknown>>
    const firstOutput = units[0]!.outputKey
    units[0]!.outputKey = units[1]!.outputKey
    units[1]!.outputKey = firstOutput
  },
)
await assertPromptBindingRejectsWith({
  ...promptBindingInput,
  promptMergeEvidence: crossOutputMergeEvidence,
}, 'prompt_merge_evidence_invalid')

console.log(JSON.stringify({
  smoke:
    'living_frame_complete_character_keypose_private_action_conditioning',
  status: 'passed_source_only',
  actionConditioningUnitCount:
    actionConditioning.receipt.metrics
      .actionConditioningUnitCount,
  actionRoles:
    actionConditioning.receipt.conditioningUnits.map(
      (unit) => unit.actionPhase.role,
    ),
  storyTimingFrames:
    actionConditioning.receipt.conditioningUnits.map(
      (unit) => unit.actionPhase.storyTimingFrame,
    ),
  privateActionTextExcludedFromReceipt: true,
  actionTextPresentOnlyInPrivatePrompt: true,
  exactPositivePromptDigestMatches: 4,
  exactNegativePromptDigestMatches: 4,
  actionPromptLineageReconciled: true,
  nonKeyposePlateUnchanged: true,
  oneImagePerKeyposeAttempt: true,
  independentPerFrameGeneration: false,
  professionalVisualAcceptanceStillRequired: true,
  remotionOwnsFinalCanvas: true,
  operationRegistered: false,
  dispatchGranted: false,
  runtimeExecuted: false,
  assetCreated: false,
  productionReady: false,
  adversarialAssertions: 5,
}))

function createPacket():
LivingFrameControlledImageSelectedScenePrivatePromptPacket {
  return {
    selectedSceneRequestBindingDigestSha256:
      selectedSceneRequest.requestBindingDigestSha256,
    fullFrameRatioExtensionDigestSha256:
      fullFrameRatioExtension.extensionDigestSha256,
    approvedSnapshotId:
      selectedSceneRequest.sourceBindings.approvedSnapshotId,
    approvedSnapshotHashSha256:
      selectedSceneRequest.sourceBindings
        .approvedSnapshotHashSha256,
    sceneId: selectedSceneRequest.canonicalScope.sceneId,
    units: selectedSceneRequest.requestUnits.map((unit) => ({
      order: unit.order,
      requestUnitId: unit.requestUnitId,
      requestUnitDigestSha256:
        unit.requestUnitDigestSha256,
      sceneId: unit.sceneId,
      outputKey: unit.outputKey,
      approvedWorkItemId:
        unit.approvedWorkItemId,
      approvedWorkItemKey:
        unit.approvedWorkItemKey,
      approvedPlannedAssetManifestEntryId:
        unit.approvedPlannedAssetManifestEntryId,
      serverOwnedConditioningLocatorId:
        unit.serverOwnedConditioningLocatorId,
      resolvedSlots: unit.privateSlotKinds.map(
        (slotKind, order) => ({
          order,
          slotKind,
          ...slotValue(unit.requestUnitId, slotKind),
        }),
      ),
    })),
  }
}

function slotValue(
  requestUnitId: string,
  slotKind:
    LivingFrameControlledSdxlBenchmarkRequestSlotKind,
): {
  readonly valueClass:
    | 'private_model_alias'
    | 'private_conditioning_text'
    | 'private_image_alias'
  readonly value: string
} {
  switch (slotKind) {
    case 'positive_conditioning_text':
      return {
        valueClass: 'private_conditioning_text',
        value:
          'Validated selected-scene style, continuity, and complete-character composition.',
      }
    case 'negative_conditioning_text':
      return {
        valueClass: 'private_conditioning_text',
        value:
          'no text; no watermark; no final canvas',
      }
    case 'control_image_artifact':
      return {
        valueClass: 'private_image_alias',
        value: `control-${requestUnitId}.png`,
      }
    case 'reference_image_artifact':
      return {
        valueClass: 'private_image_alias',
        value: `reference-${requestUnitId}.png`,
      }
    case 'base_checkpoint_artifact':
      return {
        valueClass: 'private_model_alias',
        value: 'base.safetensors',
      }
    case 'controlnet_checkpoint_artifact':
      return {
        valueClass: 'private_model_alias',
        value: 'controlnet.safetensors',
      }
    case 'lora_adapter_artifact':
      return {
        valueClass: 'private_model_alias',
        value: 'style-lora.safetensors',
      }
    case 'generic_ipadapter_checkpoint_artifact':
      return {
        valueClass: 'private_model_alias',
        value: 'ipadapter.safetensors',
      }
    case 'clip_vision_checkpoint_artifact':
      return {
        valueClass: 'private_model_alias',
        value: 'clip-vision.safetensors',
      }
    default:
      throw new Error(`Unsupported slot ${slotKind}`)
  }
}

async function assertRejectsWith(
  candidate:
    CreateLivingFrameCompleteCharacterKeyposePrivateActionConditioningInput,
  code: string,
): Promise<void> {
  let caught: unknown
  try {
    await compileLivingFrameCompleteCharacterKeyposePrivateActionConditioning(
      candidate,
    )
  } catch (error) {
    caught = error
  }
  assert.ok(
    caught instanceof
      LivingFrameCompleteCharacterKeyposePrivateActionConditioningError,
  )
  assert.equal(caught.issues[0]?.code, code)
}

function resign(
  value:
    LivingFrameCompleteCharacterKeyposePrivateActionConditioning,
  mutate: (draft: Record<string, unknown>) => void,
): Record<string, unknown> {
  const draft = structuredClone(value) as unknown as
    Record<string, unknown>
  delete draft.conditioningDigestSha256
  mutate(draft)
  return {
    ...draft,
    conditioningDigestSha256:
      sha256AuthorityValue(draft),
  }
}

function resignMergeEvidence(
  value:
    LivingFrameCompleteCharacterKeyposeActionPromptMergeEvidence,
  mutate: (draft: Record<string, unknown>) => void,
): LivingFrameCompleteCharacterKeyposeActionPromptMergeEvidence {
  const draft = structuredClone(value) as unknown as
    Record<string, unknown>
  delete draft.mergeEvidenceDigestSha256
  mutate(draft)
  return {
    ...draft,
    mergeEvidenceDigestSha256:
      sha256AuthorityValue(draft),
  } as unknown as
    LivingFrameCompleteCharacterKeyposeActionPromptMergeEvidence
}

async function assertPromptBindingRejectsWith(
  candidate:
    CreateLivingFrameCompleteCharacterKeyposeActionPromptBindingInput,
  code: string,
): Promise<void> {
  let caught: unknown
  try {
    await compileLivingFrameCompleteCharacterKeyposeActionPromptBinding(
      candidate,
    )
  } catch (error) {
    caught = error
  }
  assert.ok(
    caught instanceof
      LivingFrameCompleteCharacterKeyposeActionPromptBindingError,
  )
  assert.equal(caught.issues[0]?.code, code)
}
