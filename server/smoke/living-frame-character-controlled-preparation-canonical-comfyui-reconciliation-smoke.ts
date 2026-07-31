import assert from 'node:assert/strict'

import type {
  LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliation,
} from '../../src/types/living-frame-character-controlled-preparation-canonical-comfyui-reconciliation'
import type {
  LivingFrameCharacterControlledPreparationPrivateSlotKind,
} from '../../src/types/living-frame-character-controlled-preparation'
import {
  consumeLivingFrameCharacterCanonicalComfyUiV1CandidateInputLease,
  createLivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationReader,
  LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationError,
  reconcileLivingFrameCharacterControlledPreparationCanonicalComfyUi,
  type LivingFrameCharacterCanonicalComfyUiPrivateInputImageBinding,
  type LivingFrameCharacterCanonicalComfyUiPrivateSlotBinding,
  type LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationPacket,
  type ReconcileLivingFrameCharacterControlledPreparationCanonicalComfyUiInput,
  verifyLivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliation,
} from '../living-frame/living-frame-character-controlled-preparation-canonical-comfyui-reconciliation'
import {
  createLivingFrameCharacterControlledPreparationPrivatePromptReader,
  materializeLivingFrameCharacterControlledPreparationPrivatePrompt,
  type LivingFrameCharacterControlledPreparationPrivatePromptPacket,
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
const promptMaterialization =
  await createPromptMaterialization()
const packet = createReconciliationPacket(
  promptMaterialization.receipt,
)
const input = createInput(
  promptMaterialization,
  packet,
)
const result =
  await reconcileLivingFrameCharacterControlledPreparationCanonicalComfyUi(
    input,
  )

assert.equal(
  verifyLivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliation(
    result.receipt,
  ),
  true,
)
assert.equal(
  result.receipt.metrics.preparationUnitCount,
  2,
)
assert.equal(
  result.receipt.metrics.canonicalV1CompatibleUnitCount,
  1,
)
assert.equal(
  result.receipt.metrics.canonicalV1CandidateInputLeaseCount,
  1,
)
assert.equal(
  result.receipt.metrics.maskedInpaintExtensionBlockedUnitCount,
  1,
)
assert.equal(
  result.canonicalV1CandidateInputLeases.length,
  1,
)

const componentUnit =
  result.receipt.reconciliationUnits.find((unit) =>
    unit.purpose ===
      'prepare_clean_isolated_component')!
const plateUnit =
  result.receipt.reconciliationUnits.find((unit) =>
    unit.purpose ===
      'reconstruct_exposed_source_plate')!

assert.equal(
  componentUnit.disposition,
  'canonical_v1_candidate_input_lease_created',
)
assert.equal(
  componentUnit.canonicalV1Compatibility.compatible,
  true,
)
assert.equal(
  componentUnit.maskedInpaintExtensionRequirement.required,
  false,
)
assert.equal(
  plateUnit.disposition,
  'canonical_v1_incompatible_masked_inpaint_extension_required',
)
assert.equal(
  plateUnit.canonicalV1Compatibility.compatible,
  false,
)
assert.equal(
  plateUnit.maskedInpaintExtensionRequirement.required,
  true,
)
assert.equal(
  plateUnit.maskedInpaintExtensionRequirement
    .requestedTargetContractVersion,
  'canonical-comfyui-gpu-runtime-request-candidate-v2',
)
assert.equal(
  plateUnit.maskedInpaintExtensionRequirement
    .sameCanonicalOperationId,
  'tool.comfyui.generate_controlled_image.v1',
)
assert.equal(
  plateUnit.maskedInpaintExtensionRequirement
    .additionalNodeClass,
  'VAEEncodeForInpaint',
)
assert.equal(
  plateUnit.maskedInpaintExtensionRequirement
    .emptyLatentSubstitutionAllowed,
  false,
)
assert.equal(
  plateUnit.candidateInputReceipt.leaseId,
  null,
)

const candidate =
  consumeLivingFrameCharacterCanonicalComfyUiV1CandidateInputLease(
    result.canonicalV1CandidateInputLeases[0]!,
  )
const classes =
  Object.values(candidate.prompt.graph).map((node) =>
    node.class_type)
assert.equal(
  classes.includes('EmptyLatentImage'),
  true,
)
assert.equal(
  classes.includes('VAEEncodeForInpaint'),
  false,
)
const canonicalControlNet =
  Object.values(candidate.prompt.graph).find((node) =>
    node.class_type ===
      'ControlNetApplyAdvanced')!
assert.equal(
  canonicalControlNet.inputs.strength,
  0.75,
)
assert.equal(
  canonicalControlNet.inputs.start_percent,
  0.1,
)
assert.equal(
  canonicalControlNet.inputs.end_percent,
  1,
)
assert.deepEqual(
  [candidate.output.width, candidate.output.height],
  [1024, 1024],
)
assert.deepEqual(
  candidate.inputImages.map((image) => [
    image.slotKind,
    image.fileName,
  ]),
  [
    ['control_image_artifact', 'control-image.png'],
    ['reference_image_artifact', 'reference-image.png'],
  ],
)
assert.equal(
  JSON.stringify(candidate.prompt.graph).includes(
    'private-control.png',
  ),
  false,
)
assert.equal(
  JSON.stringify(candidate.prompt.graph).includes(
    'control-image.png',
  ),
  true,
)
assert.equal(
  JSON.stringify(result.receipt).includes(
    'private-source-plate.png',
  ),
  false,
)
assert.equal(
  result.receipt.parallelCanonicalCompilerCreated,
  false,
)
assert.equal(
  result.receipt.runtimeBoundary.remotionOwnsFinalCanvas,
  true,
)
assert.equal(result.receipt.operationRegistered, false)
assert.equal(result.receipt.dispatchGranted, false)
assert.equal(result.receipt.runtimeExecuted, false)
assert.equal(result.receipt.assetCreated, false)
assert.equal(result.receipt.qaApproved, false)
assert.equal(result.receipt.productionReady, false)

assert.throws(
  () =>
    consumeLivingFrameCharacterCanonicalComfyUiV1CandidateInputLease(
      result.canonicalV1CandidateInputLeases[0]!,
    ),
  (error) => hasIssue(
    error,
    'candidate_input_lease_reused',
  ),
)
assert.throws(
  () =>
    consumeLivingFrameCharacterCanonicalComfyUiV1CandidateInputLease({
      ...result.canonicalV1CandidateInputLeases[0]!,
    }),
  (error) => hasIssue(
    error,
    'candidate_input_lease_invalid',
  ),
)

await assertRejectsWith(
  input,
  'reader_reused',
)
await assertRejectsWith(
  {
    ...await freshInput(),
    prompt: 'caller prompt forbidden',
  } as unknown as
    ReconcileLivingFrameCharacterControlledPreparationCanonicalComfyUiInput,
  'input_invalid',
)
await assertPacketRejects(
  (draft) => {
    draft.units[0]!.outputKey =
      'output.cross-scene-substitution'
  },
  'cross_scene_work_item_or_output_substitution',
)
await assertPacketRejects(
  (draft) => {
    const plate = draft.units.find((unit) =>
      unit.order === 0)!
    const mask = plate.inputImages.find((image) =>
      image.slotKind ===
        'source_plate_inpaint_mask_artifact')!
    mask.width = 1024
  },
  'masked_inpaint_extension_contract_mismatch',
)
await assertPacketRejects(
  (draft) => {
    const component = draft.units.find((unit) =>
      unit.order === 1)!
    component.inputImages[0]!.fileName =
      'source-plate.png'
  },
  'input_image_binding_invalid',
)
await assertPacketRejects(
  (draft) => {
    const component = draft.units.find((unit) =>
      unit.order === 1)!
    component.privateSlotBindings.find((slot) =>
      slot.slotKind ===
        'control_image_artifact')!.value =
      'private-substituted.png'
    component.inputImages.find((image) =>
      image.slotKind ===
        'control_image_artifact')!.privateAlias =
      'private-substituted.png'
  },
  'private_slot_binding_invalid',
)
await assertPacketRejects(
  (draft) => {
    draft.units.push(structuredClone(draft.units[0]!))
  },
  'packet_invalid',
)

const clonedLeaseBaseInput = await freshInput()
const clonedLeaseInput = {
  ...clonedLeaseBaseInput,
  privatePromptRequestLeases:
    clonedLeaseBaseInput.privatePromptRequestLeases.map((lease) => ({
      ...lease,
    })),
}
await assertRejectsWith(
  clonedLeaseInput,
  'lease_invalid',
)

assert.equal(
  verifyLivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliation(
    resign(result.receipt, (draft) => {
      draft.operationRegistered = true
      draft.dispatchGranted = true
      draft.runtimeExecuted = true
      draft.assetCreated = true
      draft.qaApproved = true
      draft.productionReady = true
    }),
  ),
  false,
)
assert.equal(
  verifyLivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliation(
    resign(result.receipt, (draft) => {
      const observed =
        draft.observedCanonicalV1 as
          Record<string, unknown>
      observed.maskedInpaintNodeAllowed = true
    }),
  ),
  false,
)

console.log(JSON.stringify({
  smoke:
    'living_frame_character_controlled_preparation_canonical_comfyui_reconciliation',
  status: 'passed',
  contractVersion:
    result.receipt.contractVersion,
  observedCanonicalBackendCommit:
    result.receipt.observedCanonicalV1
      .backendReferenceCommit,
  observedCanonicalTarget:
    result.receipt.observedCanonicalV1
      .targetContractVersion,
  preparationUnitCount:
    result.receipt.metrics.preparationUnitCount,
  canonicalV1CompatibleUnitCount:
    result.receipt.metrics
      .canonicalV1CompatibleUnitCount,
  canonicalV1CandidateInputLeaseCount:
    result.receipt.metrics
      .canonicalV1CandidateInputLeaseCount,
  maskedInpaintExtensionBlockedUnitCount:
    result.receipt.metrics
      .maskedInpaintExtensionBlockedUnitCount,
  requestedMaskedInpaintTarget:
    plateUnit.maskedInpaintExtensionRequirement
      .requestedTargetContractVersion,
  componentCandidateDimensions: [
    candidate.output.width,
    candidate.output.height,
  ],
  oneCanonicalComfyUiIdentity:
    result.receipt.runtimeBoundary
      .registryExpansionCreatesNewIdentity === false,
  independentPerFrameGeneration:
    false,
  remotionOwnsFinalCanvas:
    result.receipt.runtimeBoundary.remotionOwnsFinalCanvas,
  adversarialAssertions: 10,
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

async function createPromptMaterialization() {
  const packet = createPrivatePromptPacket()
  return materializeLivingFrameCharacterControlledPreparationPrivatePrompt({
    materializationBatchId:
      `lf-character-prompt-batch.${crypto.randomUUID()}`,
    serverOwnedPacketLocatorId:
      `lf-character-prompt-packet.${crypto.randomUUID()}`,
    preparation,
    preparationInput,
    reader:
      createLivingFrameCharacterControlledPreparationPrivatePromptReader(
        async () =>
          structuredClone(packet),
      ),
  })
}

function createPrivatePromptPacket():
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
): LivingFrameCharacterCanonicalComfyUiPrivateSlotBinding {
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
  return {
    order,
    slotKind,
    valueClass:
      slotKind.includes('conditioning_text')
        ? 'private_conditioning_text'
        : slotKind.includes('image')
          || slotKind.includes('mask')
          ? 'private_image_alias'
          : 'private_model_alias',
    value: values[slotKind],
  }
}

function createReconciliationPacket(
  receipt:
    Awaited<ReturnType<
      typeof createPromptMaterialization
    >>['receipt'],
): LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationPacket {
  return {
    preparationDigestSha256:
      preparation.preparationDigestSha256,
    privatePromptMaterializationDigestSha256:
      receipt.materializationDigestSha256,
    approvedSnapshotId:
      preparation.sourceBindings.approvedSnapshotId,
    approvedSnapshotHashSha256:
      preparation.sourceBindings
        .approvedSnapshotHashSha256,
    approvedWorkGraphDigestSha256:
      preparation.sourceBindings
        .approvedWorkGraphDigestSha256,
    currentMasterTimingDigestSha256:
      preparation.sourceBindings
        .currentMasterTimingDigestSha256,
    confirmedOutputFrameExpectationDigestSha256:
      preparation.sourceBindings
        .confirmedOutputFrameExpectationDigestSha256,
    sceneId: preparation.canonicalScope.sceneId,
    componentId:
      preparation.canonicalScope.componentId,
    units: preparation.preparationUnits.map((unit) => {
      const promptUnit = receipt.promptUnits.find(
        (candidate) =>
          candidate.preparationUnitId ===
            unit.preparationUnitId,
      )!
      const privateSlotBindings =
        unit.graphProfile.requiredPrivateSlotKinds.map(
          (slotKind, order) =>
            privateSlot(slotKind, order),
        )
      const imageSlots =
        privateSlotBindings.filter((slot) =>
          slot.valueClass ===
            'private_image_alias')
      return {
        order: unit.order,
        preparationUnitId:
          unit.preparationUnitId,
        preparationUnitDigestSha256:
          unit.preparationUnitDigestSha256,
        promptUnitId: promptUnit.promptUnitId,
        promptRequestDigestSha256:
          promptUnit.privatePromptRequest
            .promptRequestDigestSha256,
        sceneId: unit.sceneId,
        componentId: unit.componentId,
        approvedWorkItemId:
          unit.approvedWorkItemId,
        approvedWorkItemKey:
          unit.approvedWorkItemKey,
        approvedWorkItemHashSha256:
          sha256AuthorityValue({
            id: unit.approvedWorkItemId,
            key: unit.approvedWorkItemKey,
          }),
        outputKey: unit.outputKey,
        approvedPlannedAssetManifestEntryId:
          unit.approvedPlannedAssetManifestEntryId,
        admissionDigestSha256:
          sha256AuthorityValue({
            unitId: unit.preparationUnitId,
            admission: 'pending',
          }),
        dispatch: {
          dispatchIntentId:
            `dispatch-intent.${unit.order}.character`,
          dispatchBindingHash:
            sha256AuthorityValue({
              unitId: unit.preparationUnitId,
              dispatch: 'pending',
            }),
          attemptPlanHash:
            sha256AuthorityValue({
              unitId: unit.preparationUnitId,
              attempt: 'pending',
            }),
          runtimeRegion:
            'europe-west1' as const,
        },
        modelSourceBindingDigests: [
          sha256AuthorityValue('base'),
          sha256AuthorityValue('controlnet'),
          sha256AuthorityValue('lora'),
          sha256AuthorityValue('ipadapter'),
          sha256AuthorityValue('clipvision'),
        ] as const,
        privateSlotBindings,
        inputImages:
          imageSlots.map((slot, canonicalOrder) =>
            inputImage(
              unit,
              slot,
              canonicalOrder,
            )),
      }
    }),
  }
}

function inputImage(
  unit:
    typeof preparation.preparationUnits[number],
  slot:
    LivingFrameCharacterCanonicalComfyUiPrivateSlotBinding,
  canonicalOrder: number,
): LivingFrameCharacterCanonicalComfyUiPrivateInputImageBinding {
  const dimensions =
    slot.slotKind === 'source_plate_image_artifact'
    || slot.slotKind ===
      'source_plate_inpaint_mask_artifact'
      ? [
          unit.generationCanvas.widthPixels,
          unit.generationCanvas.heightPixels,
        ]
      : [1024, 1024]
  const fileNames = {
    control_image_artifact:
      'control-image.png',
    reference_image_artifact:
      'reference-image.png',
    source_plate_image_artifact:
      'source-plate.png',
    source_plate_inpaint_mask_artifact:
      'source-plate-mask.png',
  } as const
  const slotKind =
    slot.slotKind as
      keyof typeof fileNames
  return {
    canonicalOrder,
    slotKind,
    fileName: fileNames[slotKind],
    privateAlias: slot.value,
    artifactId:
      `artifact.${unit.order}.${canonicalOrder}.private`,
    contentSha256:
      sha256AuthorityValue({
        unitId: unit.preparationUnitId,
        slotKind,
        bytes: 'private',
      }),
    byteLength: 42_000 + canonicalOrder,
    width: dimensions[0]!,
    height: dimensions[1]!,
    sourceBindingDigestSha256:
      sha256AuthorityValue({
        unitId: unit.preparationUnitId,
        slotKind,
        binding: 'private',
      }),
    readOnlyMountRequired: true,
  }
}

function createInput(
  materialization:
    Awaited<ReturnType<
      typeof createPromptMaterialization
    >>,
  reconciliationPacket:
    LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationPacket,
): ReconcileLivingFrameCharacterControlledPreparationCanonicalComfyUiInput {
  return {
    reconciliationId:
      `lf-character-reconciliation.${crypto.randomUUID()}`,
    serverOwnedPacketLocatorId:
      `lf-character-reconciliation-packet.${crypto.randomUUID()}`,
    preparation,
    preparationInput,
    privatePromptReceipt:
      materialization.receipt,
    privatePromptRequestLeases:
      materialization.privatePromptRequestLeases,
    reader:
      createLivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationReader(
        async () =>
          structuredClone(reconciliationPacket),
      ),
  }
}

async function freshInput() {
  const materialization =
    await createPromptMaterialization()
  const reconciliationPacket =
    createReconciliationPacket(
      materialization.receipt,
    )
  return createInput(
    materialization,
    reconciliationPacket,
  )
}

async function assertPacketRejects(
  mutate: (
    draft:
      MutableReconciliationPacket,
  ) => void,
  code: string,
): Promise<void> {
  const materialization =
    await createPromptMaterialization()
  const draft =
    structuredClone(
      createReconciliationPacket(
        materialization.receipt,
      ),
    ) as MutableReconciliationPacket
  mutate(draft)
  await assertRejectsWith(
    createInput(
      materialization,
      draft as
        LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationPacket,
    ),
    code,
  )
}

async function assertRejectsWith(
  candidate:
    ReconcileLivingFrameCharacterControlledPreparationCanonicalComfyUiInput,
  code: string,
): Promise<void> {
  let caught: unknown
  try {
    await reconcileLivingFrameCharacterControlledPreparationCanonicalComfyUi(
      candidate,
    )
  } catch (error) {
    caught = error
  }
  assert.ok(
    caught instanceof
      LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationError,
  )
  assert.equal(caught.issues[0]?.code, code)
}

function hasIssue(
  value: unknown,
  code: string,
): boolean {
  return (
    value instanceof
      LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationError
    && value.issues[0]?.code === code
  )
}

function resign(
  value:
    LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliation,
  mutate:
    (draft: Record<string, unknown>) => void,
): Record<string, unknown> {
  const draft =
    structuredClone(value) as unknown as
      Record<string, unknown>
  delete draft.reconciliationDigestSha256
  mutate(draft)
  return {
    ...draft,
    reconciliationDigestSha256:
      sha256AuthorityValue(draft),
  }
}

type MutableReconciliationPacket = {
  -readonly [Key in keyof LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationPacket]:
    Key extends 'units'
      ? MutableUnit[]
      : LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationPacket[Key]
}

type MutableUnit = {
  -readonly [Key in keyof LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationPacket['units'][number]]:
    Key extends 'inputImages'
      ? MutableImage[]
      : Key extends 'privateSlotBindings'
        ? MutablePrivateSlot[]
        : LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationPacket['units'][number][Key]
}

type MutableImage = {
  -readonly [Key in keyof LivingFrameCharacterCanonicalComfyUiPrivateInputImageBinding]:
    LivingFrameCharacterCanonicalComfyUiPrivateInputImageBinding[Key]
}

type MutablePrivateSlot = {
  -readonly [Key in keyof LivingFrameCharacterCanonicalComfyUiPrivateSlotBinding]:
    LivingFrameCharacterCanonicalComfyUiPrivateSlotBinding[Key]
}
