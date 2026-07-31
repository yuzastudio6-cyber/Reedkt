import assert from 'node:assert/strict'

import type {
  LivingFrameCharacterControlledPreparationPrivatePrompt,
} from '../../src/types/living-frame-character-controlled-preparation-private-prompt'
import type {
  LivingFrameCharacterControlledPreparationPrivateSlotKind,
} from '../../src/types/living-frame-character-controlled-preparation'
import {
  consumeLivingFrameCharacterControlledPreparationPrivatePromptLease,
  createLivingFrameCharacterControlledPreparationPrivatePromptReader,
  LivingFrameCharacterControlledPreparationPrivatePromptError,
  materializeLivingFrameCharacterControlledPreparationPrivatePrompt,
  type LivingFrameCharacterControlledPreparationPrivatePromptPacket,
  type MaterializeLivingFrameCharacterControlledPreparationPrivatePromptInput,
  verifyLivingFrameCharacterControlledPreparationPrivatePrompt,
} from '../living-frame/living-frame-character-controlled-preparation-private-prompt'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  livingFrameCharacterControlledPreparationSmokeInput,
  livingFrameCharacterControlledPreparationSmokeResult,
} from './living-frame-character-controlled-preparation-smoke'

const preparation =
  livingFrameCharacterControlledPreparationSmokeResult
const preparationInput =
  livingFrameCharacterControlledPreparationSmokeInput
const packet = createPacket()
const reader =
  createLivingFrameCharacterControlledPreparationPrivatePromptReader(
    async (locatorId) => {
      assert.equal(
        locatorId,
        'character-preparation-packet-locator.001',
      )
      return structuredClone(packet)
    },
  )
const input = {
  materializationBatchId:
    'living-frame.character-preparation-prompt-batch.001',
  serverOwnedPacketLocatorId:
    'character-preparation-packet-locator.001',
  preparation,
  preparationInput,
  reader,
} as const

const result =
  await materializeLivingFrameCharacterControlledPreparationPrivatePrompt(
    input,
  )

assert.equal(
  verifyLivingFrameCharacterControlledPreparationPrivatePrompt(
    result.receipt,
  ),
  true,
)
assert.equal(result.receipt.promptUnits.length, 2)
assert.equal(
  result.privatePromptRequestLeases.length,
  2,
)
assert.equal(
  result.receipt.metrics.maskedInpaintPromptCount,
  1,
)
assert.equal(
  result.receipt.metrics.isolatedComponentPromptCount,
  1,
)
assert.equal(
  result.receipt.metrics.anchorKeyposePromptCount,
  0,
)
assert.equal(
  result.receipt.runtimeBoundary.canonicalToolId,
  'comfyui',
)
assert.equal(
  result.receipt.runtimeBoundary.canonicalOperationId,
  'tool.comfyui.generate_controlled_image.v1',
)
assert.equal(
  result.receipt.runtimeBoundary
    .oneComfyUiIdentityAndOneAttemptCostEventPerOutput,
  true,
)
assert.equal(
  result.receipt.runtimeBoundary
    .weightsAdaptersLibrariesOrPreprocessorsCreateToolIdentity,
  false,
)

const plateReceipt =
  result.receipt.promptUnits.find((unit) =>
    unit.purpose ===
      'reconstruct_exposed_source_plate')!
const componentReceipt =
  result.receipt.promptUnits.find((unit) =>
    unit.purpose ===
      'prepare_clean_isolated_component')!
assert.equal(
  plateReceipt.graphProfile
    .maskedInpaintUsesVaeEncodeForInpaint,
  true,
)
assert.equal(
  plateReceipt.graphProfile.nodeClasses.includes(
    'VAEEncodeForInpaint',
  ),
  true,
)
assert.equal(
  plateReceipt.graphProfile.nodeClasses.includes(
    'EmptyLatentImage',
  ),
  false,
)
assert.deepEqual([
  plateReceipt.generationCanvas.widthPixels,
  plateReceipt.generationCanvas.heightPixels,
], [1920, 1080])
assert.equal(
  componentReceipt.graphProfile.nodeClasses.includes(
    'EmptyLatentImage',
  ),
  true,
)
assert.deepEqual([
  componentReceipt.generationCanvas.widthPixels,
  componentReceipt.generationCanvas.heightPixels,
], [1024, 1024])
assert.equal(
  plateReceipt.downstreamPolicy
    .stillAlphaPipelineRequired,
  false,
)
assert.equal(
  componentReceipt.downstreamPolicy
    .stillAlphaPipelineRequired,
  true,
)
assert.equal(
  componentReceipt.downstreamPolicy
    .opaqueRectangleMayReplaceRequiredAlpha,
  false,
)
assert.equal(
  JSON.stringify(result.receipt).includes(
    'private-source-plate.png',
  ),
  false,
)
assert.equal(
  JSON.stringify(result.receipt).includes(
    'private-inpaint-mask.png',
  ),
  false,
)
assert.equal(
  JSON.stringify(result.receipt).includes(
    'reconstruct only the hidden plate',
  ),
  false,
)

const requests =
  result.privatePromptRequestLeases.map((lease) =>
    consumeLivingFrameCharacterControlledPreparationPrivatePromptLease(
      lease,
    ))
assert.equal(requests.length, 2)
const plateRequest = requests.find((request) =>
  request.preparationUnitId ===
    plateReceipt.preparationUnitId)!
const componentRequest = requests.find((request) =>
  request.preparationUnitId ===
    componentReceipt.preparationUnitId)!
const plateNodes =
  Object.values(plateRequest.prompt)
const inpaint = plateNodes.find((node) =>
  node.class_type === 'VAEEncodeForInpaint')!
assert.equal(inpaint.inputs.grow_mask_by, 6)
assert.deepEqual(inpaint.inputs.mask, ['5', 1])
const plateSampler = plateNodes.find((node) =>
  node.class_type === 'KSampler')!
assert.equal(plateSampler.inputs.denoise, 0.55)
assert.equal(
  plateNodes.filter((node) =>
    node.class_type ===
      'SaveImageWebsocket').length,
  1,
)
const componentNodes =
  Object.values(componentRequest.prompt)
const componentSampler =
  componentNodes.find((node) =>
    node.class_type === 'KSampler')!
assert.equal(componentSampler.inputs.denoise, 1)
assert.equal(
  componentNodes.some((node) =>
    node.class_type === 'VAEEncodeForInpaint'),
  false,
)
for (const request of requests) {
  assert.equal(request.outputImageCount, 1)
  assert.equal(request.dispatchAuthority, false)
  assert.equal(request.runtimeAuthority, false)
  assert.equal(request.finalCanvasAuthority, false)
  assert.equal(request.productionReady, false)
}

assert.throws(
  () =>
    consumeLivingFrameCharacterControlledPreparationPrivatePromptLease(
      result.privatePromptRequestLeases[0]!,
    ),
  (error) => hasIssue(error, 'lease_reused'),
)
assert.throws(
  () =>
    consumeLivingFrameCharacterControlledPreparationPrivatePromptLease({
      ...result.privatePromptRequestLeases[1]!,
    }),
  (error) => hasIssue(error, 'lease_invalid'),
)
await assertRejectsWith(input, 'reader_reused')

await assertRejectsWith(
  {
    ...freshInput(),
    prompt: 'caller-controlled prompt',
  } as unknown as
    MaterializeLivingFrameCharacterControlledPreparationPrivatePromptInput,
  'input_invalid',
)

await assertRejectsWith(
  freshInput({
    ...packet,
    rawPrompt: 'forbidden packet prompt',
  }),
  'packet_invalid',
)

await assertRejectsWith(
  freshInput({
    ...packet,
    units: packet.units.map((unit, order) =>
      order === 0
        ? {
            ...unit,
            outputKey:
              'output.cross-substituted',
          }
        : unit),
  }),
  'unit_substitution_forbidden',
)

await assertRejectsWith(
  freshInput({
    ...packet,
    units: packet.units.map((unit, order) =>
      order === 0
        ? {
            ...unit,
            resolvedSlots:
              unit.resolvedSlots.filter((slot) =>
                slot.slotKind !==
                  'source_plate_inpaint_mask_artifact'),
          }
        : unit),
  }),
  'slot_set_invalid',
)

assert.equal(
  verifyLivingFrameCharacterControlledPreparationPrivatePrompt(
    resign(result.receipt, (draft) => {
      const units =
        draft.promptUnits as
          Array<Record<string, unknown>>
      const graph =
        units[0]!.graphProfile as
          Record<string, unknown>
      graph.maskedInpaintUsesVaeEncodeForInpaint =
        false
      graph.nodeClasses = [
        'CheckpointLoaderSimple',
        'CLIPTextEncode',
        'CLIPTextEncode',
        'EmptyLatentImage',
        'KSampler',
        'VAEDecode',
        'SaveImageWebsocket',
      ]
    }),
  ),
  false,
)

assert.equal(
  verifyLivingFrameCharacterControlledPreparationPrivatePrompt(
    resign(result.receipt, (draft) => {
      draft.operationRegistered = true
      draft.dispatchGranted = true
      draft.runtimeExecuted = true
      draft.assetCreated = true
      draft.qaApproved = true
      draft.finalCanvasClaimAllowed = true
      draft.productionReady = true
    }),
  ),
  false,
)

console.log(JSON.stringify({
  smoke:
    'living_frame_character_controlled_preparation_private_prompt',
  status: 'passed',
  contractVersion:
    result.receipt.contractVersion,
  promptUnitCount:
    result.receipt.metrics.promptUnitCount,
  privateLeaseCount:
    result.receipt.metrics.privateLeaseCount,
  maskedInpaintPromptCount:
    result.receipt.metrics.maskedInpaintPromptCount,
  isolatedComponentPromptCount:
    result.receipt.metrics.isolatedComponentPromptCount,
  plateNodeCount:
    plateReceipt.privatePromptRequest.nodeCount,
  componentNodeCount:
    componentReceipt.privatePromptRequest.nodeCount,
  plateDimensions: [
    plateRequest.widthPixels,
    plateRequest.heightPixels,
  ],
  componentDimensions: [
    componentRequest.widthPixels,
    componentRequest.heightPixels,
  ],
  privateSourceAndMaskExcludedFromReceipt:
    result.receipt.sourceAndMaskValuesExcludedFromReceipt,
  independentPerFrameGeneration:
    false,
  remotionOwnsFinalCanvas:
    plateReceipt.downstreamPolicy
      .remotionOwnsFinalComposition,
  adversarialAssertions: 9,
  operationRegistered:
    result.receipt.operationRegistered,
  dispatchGranted:
    result.receipt.dispatchGranted,
  runtimeExecuted:
    result.receipt.runtimeExecuted,
  assetCreated:
    result.receipt.assetCreated,
  qaApproved:
    result.receipt.qaApproved,
  productionReady:
    result.receipt.productionReady,
}))

function createPacket():
LivingFrameCharacterControlledPreparationPrivatePromptPacket {
  return {
    preparationDigestSha256:
      preparation.preparationDigestSha256,
    approvedSnapshotId:
      preparation.sourceBindings.approvedSnapshotId,
    approvedSnapshotHashSha256:
      preparation.sourceBindings
        .approvedSnapshotHashSha256,
    sceneId: preparation.canonicalScope.sceneId,
    componentId:
      preparation.canonicalScope.componentId,
    units: preparation.preparationUnits.map((unit) => ({
      order: unit.order,
      preparationUnitId:
        unit.preparationUnitId,
      preparationUnitDigestSha256:
        unit.preparationUnitDigestSha256,
      sceneId: unit.sceneId,
      componentId: unit.componentId,
      approvedWorkItemId:
        unit.approvedWorkItemId,
      approvedWorkItemKey:
        unit.approvedWorkItemKey,
      approvedPlannedAssetManifestEntryId:
        unit.approvedPlannedAssetManifestEntryId,
      outputKey: unit.outputKey,
      resolvedSlots:
        unit.graphProfile.requiredPrivateSlotKinds.map(
          (slotKind, order) =>
            privateSlot(slotKind, order),
        ),
    })),
  }
}

function privateSlot(
  slotKind:
    LivingFrameCharacterControlledPreparationPrivateSlotKind,
  order: number,
): {
  readonly order: number
  readonly slotKind:
    LivingFrameCharacterControlledPreparationPrivateSlotKind
  readonly valueClass:
    | 'private_model_alias'
    | 'private_conditioning_text'
    | 'private_image_alias'
  readonly value: string
} {
  const values:
    Record<
      LivingFrameCharacterControlledPreparationPrivateSlotKind,
      string
    > = {
      base_checkpoint_artifact:
        'private-base.safetensors',
      controlnet_checkpoint_artifact:
        'private-controlnet.safetensors',
      lora_adapter_artifact:
        'private-lora.safetensors',
      generic_ipadapter_checkpoint_artifact:
        'private-ipadapter.safetensors',
      clip_vision_checkpoint_artifact:
        'private-clipvision.safetensors',
      positive_conditioning_text:
        'reconstruct only the hidden plate or prepare the isolated component while preserving the approved illustration',
      negative_conditioning_text:
        'no text, no watermark, no extra limbs, no fused prop, no final canvas',
      control_image_artifact:
        'private-control.png',
      reference_image_artifact:
        'private-reference.png',
      source_plate_image_artifact:
        'private-source-plate.png',
      source_plate_inpaint_mask_artifact:
        'private-inpaint-mask.png',
    }
  const valueClass =
    slotKind.includes('conditioning_text')
      ? 'private_conditioning_text'
      : slotKind.includes('image')
        || slotKind.includes('mask')
        ? 'private_image_alias'
        : 'private_model_alias'
  return {
    order,
    slotKind,
    valueClass,
    value: values[slotKind],
  }
}

function freshInput(
  packetOverride:
    LivingFrameCharacterControlledPreparationPrivatePromptPacket
    | Record<string, unknown> = packet,
): MaterializeLivingFrameCharacterControlledPreparationPrivatePromptInput {
  return {
    ...input,
    reader:
      createLivingFrameCharacterControlledPreparationPrivatePromptReader(
        async () =>
          structuredClone(packetOverride) as
            LivingFrameCharacterControlledPreparationPrivatePromptPacket,
      ),
  }
}

async function assertRejectsWith(
  candidate:
    MaterializeLivingFrameCharacterControlledPreparationPrivatePromptInput,
  code: string,
): Promise<void> {
  let caught: unknown
  try {
    await materializeLivingFrameCharacterControlledPreparationPrivatePrompt(
      candidate,
    )
  } catch (error) {
    caught = error
  }
  assert.ok(
    caught instanceof
      LivingFrameCharacterControlledPreparationPrivatePromptError,
  )
  assert.equal(caught.issues[0]?.code, code)
}

function hasIssue(
  value: unknown,
  code: string,
): boolean {
  return (
    value instanceof
      LivingFrameCharacterControlledPreparationPrivatePromptError
    && value.issues[0]?.code === code
  )
}

function resign(
  value:
    LivingFrameCharacterControlledPreparationPrivatePrompt,
  mutate:
    (draft: Record<string, unknown>) => void,
): Record<string, unknown> {
  const draft =
    structuredClone(value) as unknown as
      Record<string, unknown>
  delete draft.materializationDigestSha256
  mutate(draft)
  return {
    ...draft,
    materializationDigestSha256:
      sha256AuthorityValue(draft),
  }
}
