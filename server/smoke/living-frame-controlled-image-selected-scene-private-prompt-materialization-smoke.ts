import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  LivingFrameControlledSdxlBenchmarkRequestSlotKind,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-request-blueprint'
import type {
  LivingFrameControlledImageSelectedScenePrivatePromptMaterialization,
} from '../../src/types/living-frame-controlled-image-selected-scene-private-prompt-materialization'
import {
  createLivingFrameComfyUiOperationAdmissionCandidate,
} from '../living-frame/living-frame-comfyui-operation-admission-candidate'
import {
  createLivingFrameControlledImageFullFrameRatioExtension,
} from '../living-frame/living-frame-controlled-image-full-frame-ratio-extension'
import {
  LivingFrameControlledImageSelectedScenePrivatePromptMaterializationError,
  consumeLivingFrameControlledImageSelectedScenePrivatePromptRequestLease,
  createLivingFrameControlledImageSelectedScenePrivatePromptReader,
  materializeLivingFrameControlledImageSelectedScenePrivatePrompt,
  type CreateLivingFrameControlledImageSelectedScenePrivatePromptMaterializationInput,
  type LivingFrameControlledImageSelectedScenePrivatePromptPacket,
  verifyLivingFrameControlledImageSelectedScenePrivatePromptMaterialization,
} from '../living-frame/living-frame-controlled-image-selected-scene-private-prompt-materialization'
import {
  livingFrameControlledImageSelectedSceneSmokeInput,
  livingFrameControlledImageSelectedSceneSmokeRequest,
} from './living-frame-controlled-image-selected-scene-request-smoke'

const admissionCandidate =
  await createLivingFrameComfyUiOperationAdmissionCandidate({
    candidateId:
      'living-frame.comfyui.selected-scene-materialization.001',
  })

const selectedSceneRequest =
  livingFrameControlledImageSelectedSceneSmokeRequest
const selectedSceneRequestInput =
  livingFrameControlledImageSelectedSceneSmokeInput
const fullFrameRatioExtensionInput = {
  extensionId:
    'living-frame.full-frame-ratio.materialization.001',
  selectedSceneRequest,
  selectedSceneRequestInput,
  admissionCandidate,
} as const
const fullFrameRatioExtension =
  await createLivingFrameControlledImageFullFrameRatioExtension(
    fullFrameRatioExtensionInput,
  )
const packet = createPacket()
const reader =
  createLivingFrameControlledImageSelectedScenePrivatePromptReader(
    async (locatorId) => {
      assert.equal(
        locatorId,
        'selected-scene-materialization-locator.001',
      )
      return structuredClone(packet)
    },
  )
const input = {
  materializationBatchId:
    'living-frame.selected-scene-materialization-batch.001',
  serverOwnedMaterializationLocatorId:
    'selected-scene-materialization-locator.001',
  selectedSceneRequest,
  selectedSceneRequestInput,
  fullFrameRatioExtension,
  fullFrameRatioExtensionInput,
  admissionCandidate,
  reader,
} as const

const result =
  await materializeLivingFrameControlledImageSelectedScenePrivatePrompt(
    input,
  )

assert.equal(
  verifyLivingFrameControlledImageSelectedScenePrivatePromptMaterialization(
    result.receipt,
  ),
  true,
)
assert.equal(result.receipt.materializationUnits.length, 2)
assert.equal(result.privatePromptRequestLeases.length, 2)
assert.equal(
  result.receipt.metrics.materializationUnitCount,
  selectedSceneRequest.requestUnits.length,
)
assert.equal(
  result.receipt.metrics.approvedGeneratedOutputCount,
  selectedSceneRequest.requestUnits.length,
)
assert.equal(result.receipt.metrics.isolatedComponentUnitCount, 1)
assert.equal(result.receipt.metrics.fullFrameRatioUnitCount, 1)
assert.equal(result.receipt.metrics.loraUnitCount, 1)
assert.equal(result.receipt.metrics.controlNetUnitCount, 2)
assert.equal(result.receipt.metrics.genericIpAdapterUnitCount, 1)
assert.equal(result.receipt.metrics.totalPromptNodeCount, 25)
assert.equal(result.receipt.benchmarkPromptPathUsed, false)
assert.equal(result.receipt.benchmarkSubstitutionAllowed, false)
assert.equal(
  result.receipt.registryPolicy.registryExpansionPermitted,
  true,
)
assert.equal(
  result.receipt.registryPolicy
    .postAdmissionCountDerivedFromReleasedDistinctIdentities,
  true,
)
assert.equal(
  result.receipt.registryPolicy.currentObservedCountIsProductCap,
  false,
)
assert.equal(result.receipt.operationRegistered, false)
assert.equal(result.receipt.dispatchGranted, false)
assert.equal(result.receipt.runtimeExecuted, false)
assert.equal(result.receipt.productionReady, false)

const primaryReceipt = result.receipt.materializationUnits.find(
  (unit) => unit.componentId === 'component-lf-primary',
)!
const plateReceipt = result.receipt.materializationUnits.find(
  (unit) => unit.componentId === 'component-lf-plate',
)!
assert.deepEqual(
  primaryReceipt.graphProfile.enabledFeatures,
  ['base', 'lora', 'controlnet', 'generic_ipadapter'],
)
assert.equal(primaryReceipt.privatePromptRequest.nodeCount, 15)
assert.equal(
  primaryReceipt.generationCanvas.canvasClass,
  'isolated_component_square_1024',
)
assert.equal(primaryReceipt.generationCanvas.widthPixels, 1024)
assert.equal(primaryReceipt.generationCanvas.heightPixels, 1024)
assert.equal(
  primaryReceipt.fullFrameRatioExtensionUnitId,
  null,
)
assert.deepEqual(
  plateReceipt.graphProfile.enabledFeatures,
  ['base', 'controlnet'],
)
assert.equal(plateReceipt.privatePromptRequest.nodeCount, 10)
assert.equal(
  plateReceipt.generationCanvas.canvasClass,
  'confirmed_full_frame_ratio',
)
assert.equal(plateReceipt.generationCanvas.widthPixels, 1920)
assert.equal(plateReceipt.generationCanvas.heightPixels, 1080)
assert.ok(plateReceipt.fullFrameRatioExtensionUnitId)
assert.equal(
  JSON.stringify(result.receipt).includes(
    'private-base.safetensors',
  ),
  false,
)
assert.equal(
  JSON.stringify(result.receipt).includes(
    'Premium editorial illustration',
  ),
  false,
)

const privateRequests =
  result.privatePromptRequestLeases.map((lease) =>
    consumeLivingFrameControlledImageSelectedScenePrivatePromptRequestLease(
      lease,
    ))
assert.equal(privateRequests.length, 2)
for (const request of privateRequests) {
  assert.equal(request.dispatchAuthority, false)
  assert.equal(request.runtimeAuthority, false)
  assert.equal(request.finalCanvasAuthority, false)
  assert.equal(request.productionReady, false)
  assert.equal(request.outputImageCount, 1)
  const nodes = Object.values(request.prompt)
  assert.equal(
    nodes.filter((node) =>
      node.class_type === 'SaveImageWebsocket').length,
    1,
  )
  assert.equal(
    nodes.some((node) =>
      [
        'PreviewImage',
        'SaveImage',
        'IPAdapterFaceID',
        'IPAdapterInsightFaceLoader',
        'AIO_Preprocessor',
        'OpenposePreprocessor',
      ].includes(node.class_type)),
    false,
  )
  const latent = nodes.find((node) =>
    node.class_type === 'EmptyLatentImage')!
  assert.equal(latent.inputs.width, request.widthPixels)
  assert.equal(latent.inputs.height, request.heightPixels)
  const sampler = nodes.find((node) =>
    node.class_type === 'KSampler')!
  assert.equal(typeof sampler.inputs.seed, 'number')
  assert.equal(sampler.inputs.steps, 24)
  assert.equal(sampler.inputs.cfg, 5.5)
  assert.equal(sampler.inputs.sampler_name, 'dpmpp_2m')
  assert.equal(sampler.inputs.scheduler, 'karras')
}
const privatePrimary = privateRequests.find((request) =>
  request.requestUnitId === primaryReceipt.requestUnitId)!
const privatePlate = privateRequests.find((request) =>
  request.requestUnitId === plateReceipt.requestUnitId)!
assert.equal(privatePrimary.widthPixels, 1024)
assert.equal(privatePrimary.heightPixels, 1024)
assert.equal(privatePlate.widthPixels, 1920)
assert.equal(privatePlate.heightPixels, 1080)

assert.throws(
  () =>
    consumeLivingFrameControlledImageSelectedScenePrivatePromptRequestLease(
      result.privatePromptRequestLeases[0]!,
    ),
  (error) =>
    hasIssue(error, 'lease_reused'),
)
assert.throws(
  () =>
    consumeLivingFrameControlledImageSelectedScenePrivatePromptRequestLease({
      ...result.privatePromptRequestLeases[1]!,
    }),
  (error) =>
    hasIssue(error, 'lease_reused'),
)
await assertRejectsWithIssue(
  input,
  'reader_reused',
)

for (const callerField of [
  'seed',
  'widthPixels',
  'heightPixels',
  'prompt',
  'model',
  'path',
  'url',
  'bytes',
  'credential',
  'command',
  'environment',
] as const) {
  await assertRejectsWithIssue(
    {
      ...freshInput(),
      [callerField]:
        callerField === 'widthPixels'
        || callerField === 'heightPixels'
        || callerField === 'seed'
          ? 1024
          : 'caller-controlled',
    } as unknown as
      CreateLivingFrameControlledImageSelectedScenePrivatePromptMaterializationInput,
    'input_invalid',
  )
}

await assertRejectsWithIssue(
  freshInput({
    ...packet,
    benchmarkCaseId: 'lf-sdxl-01-load-only',
  }),
  'packet_invalid',
)
await assertRejectsWithIssue(
  freshInput({
    ...packet,
    units: packet.units.map((unit, order) =>
      order === 0
        ? {
            ...unit,
            sceneId: 'scene-cross-substituted',
          }
        : unit),
  }),
  'cross_scene_work_item_or_output_substitution',
)
await assertRejectsWithIssue(
  freshInput({
    ...packet,
    units: packet.units.map((unit, order) =>
      order === 1
        ? {
            ...unit,
            outputKey: 'output.cross-substituted',
            approvedWorkItemId: 'work.cross-substituted',
          }
        : unit),
  }),
  'cross_scene_work_item_or_output_substitution',
)

assert.equal(
  verifyLivingFrameControlledImageSelectedScenePrivatePromptMaterialization(
    resignReceipt(result.receipt, (draft) => {
      draft.benchmarkPromptPathUsed = true
    }),
  ),
  false,
)
assert.equal(
  verifyLivingFrameControlledImageSelectedScenePrivatePromptMaterialization(
    resignUnitReceipt(result.receipt, 0, (unit) => {
      const graphProfile =
        unit.graphProfile as Record<string, unknown>
      graphProfile.nodeClasses = [
        ...(graphProfile.nodeClasses as unknown[]),
        'IPAdapterFaceID',
      ]
    }),
  ),
  false,
)
assert.equal(
  verifyLivingFrameControlledImageSelectedScenePrivatePromptMaterialization(
    resignUnitReceipt(result.receipt, 1, (unit) => {
      const graphProfile =
        unit.graphProfile as Record<string, unknown>
      graphProfile.nodeClasses = [
        ...(graphProfile.nodeClasses as unknown[]).slice(0, -1),
        'AIO_Preprocessor',
        'SaveImageWebsocket',
      ]
    }),
  ),
  false,
)
assert.equal(
  verifyLivingFrameControlledImageSelectedScenePrivatePromptMaterialization(
    resignUnitReceipt(result.receipt, 1, (unit) => {
      const graphProfile =
        unit.graphProfile as Record<string, unknown>
      graphProfile.nodeClasses = [
        ...(graphProfile.nodeClasses as unknown[]).slice(0, -1),
        'SaveImage',
      ]
    }),
  ),
  false,
)
assert.equal(
  verifyLivingFrameControlledImageSelectedScenePrivatePromptMaterialization(
    resignUnitReceipt(result.receipt, 1, (unit) => {
      const canvas =
        unit.generationCanvas as Record<string, unknown>
      canvas.widthPixels = 1024
      canvas.heightPixels = 1024
      canvas.squareSubstitutionApplied = true
    }),
  ),
  false,
)
assert.equal(
  verifyLivingFrameControlledImageSelectedScenePrivatePromptMaterialization(
    resignUnitReceipt(result.receipt, 1, (unit) => {
      const canvas =
        unit.generationCanvas as Record<string, unknown>
      canvas.finalCanvasCreatedByComfyUi = true
    }),
  ),
  false,
)
assert.equal(
  verifyLivingFrameControlledImageSelectedScenePrivatePromptMaterialization(
    resignUnitReceipt(result.receipt, 0, (unit) => {
      const attempt =
        unit.attemptPolicy as Record<string, unknown>
      attempt.confinementDigestSha256 = '0'.repeat(64)
      attempt.deniedTopLevelImports = []
    }),
  ),
  false,
)
assert.equal(
  verifyLivingFrameControlledImageSelectedScenePrivatePromptMaterialization(
    resignReceipt(result.receipt, (draft) => {
      draft.dispatchGranted = true
      draft.runtimeExecuted = true
      draft.assetCreated = true
      draft.approvalPromoted = true
      draft.productionReady = true
    }),
  ),
  false,
)
assert.equal(
  verifyLivingFrameControlledImageSelectedScenePrivatePromptMaterialization(
    resignReceipt(result.receipt, (draft) => {
      draft.rawPrompt = 'forbidden raw prompt'
    }),
  ),
  false,
)

console.log(JSON.stringify({
  status: 'passed',
  contractVersion: result.receipt.contractVersion,
  materializationUnitCount:
    result.receipt.metrics.materializationUnitCount,
  privateLeaseCount:
    result.receipt.metrics.privateLeaseCount,
  isolatedDimensions: [
    primaryReceipt.generationCanvas.widthPixels,
    primaryReceipt.generationCanvas.heightPixels,
  ],
  confirmedFullFrameDimensions: [
    plateReceipt.generationCanvas.widthPixels,
    plateReceipt.generationCanvas.heightPixels,
  ],
  totalPromptNodeCount:
    result.receipt.metrics.totalPromptNodeCount,
  benchmarkPromptPathUsed:
    result.receipt.benchmarkPromptPathUsed,
  registryExpansionPermitted:
    result.receipt.registryPolicy.registryExpansionPermitted,
  operationRegistered: result.receipt.operationRegistered,
  dispatchGranted: result.receipt.dispatchGranted,
  adversarialAssertions: 26,
  productionReady: result.receipt.productionReady,
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
      approvedWorkItemId: unit.approvedWorkItemId,
      approvedWorkItemKey: unit.approvedWorkItemKey,
      approvedPlannedAssetManifestEntryId:
        unit.approvedPlannedAssetManifestEntryId,
      serverOwnedConditioningLocatorId:
        unit.serverOwnedConditioningLocatorId,
      resolvedSlots: unit.privateSlotKinds.map(
        (slotKind, order) =>
          privateSlot(slotKind, order),
      ),
    })),
  }
}

function privateSlot(
  slotKind:
    LivingFrameControlledSdxlBenchmarkRequestSlotKind,
  order: number,
): {
  readonly order: number
  readonly slotKind:
    LivingFrameControlledSdxlBenchmarkRequestSlotKind
  readonly valueClass:
    | 'private_model_alias'
    | 'private_conditioning_text'
    | 'private_image_alias'
  readonly value: string
} {
  const values: Record<
    LivingFrameControlledSdxlBenchmarkRequestSlotKind,
    readonly [
      'private_model_alias'
      | 'private_conditioning_text'
      | 'private_image_alias',
      string,
    ]
  > = {
    base_checkpoint_artifact: [
      'private_model_alias',
      'private-base.safetensors',
    ],
    controlnet_checkpoint_artifact: [
      'private_model_alias',
      'private-controlnet.safetensors',
    ],
    lora_adapter_artifact: [
      'private_model_alias',
      'private-lora.safetensors',
    ],
    generic_ipadapter_checkpoint_artifact: [
      'private_model_alias',
      'private-ipadapter.safetensors',
    ],
    clip_vision_checkpoint_artifact: [
      'private_model_alias',
      'private-clipvision.safetensors',
    ],
    positive_conditioning_text: [
      'private_conditioning_text',
      'Premium editorial illustration with animation-aware layer separation.',
    ],
    negative_conditioning_text: [
      'private_conditioning_text',
      'No text, no watermark, no fused moving components.',
    ],
    control_image_artifact: [
      'private_image_alias',
      'private-control.png',
    ],
    reference_image_artifact: [
      'private_image_alias',
      'private-reference.png',
    ],
  }
  const [valueClass, value] = values[slotKind]
  return {
    order,
    slotKind,
    valueClass,
    value,
  }
}

function freshInput(
  packetOverride:
    LivingFrameControlledImageSelectedScenePrivatePromptPacket
    | Record<string, unknown> = packet,
): CreateLivingFrameControlledImageSelectedScenePrivatePromptMaterializationInput {
  const freshReader =
    createLivingFrameControlledImageSelectedScenePrivatePromptReader(
      async () => structuredClone(packetOverride),
    )
  return {
    ...input,
    reader: freshReader,
  }
}

async function assertRejectsWithIssue(
  candidate:
    CreateLivingFrameControlledImageSelectedScenePrivatePromptMaterializationInput,
  expectedCode: string,
): Promise<void> {
  let caught: unknown
  try {
    await materializeLivingFrameControlledImageSelectedScenePrivatePrompt(
      candidate,
    )
  } catch (error) {
    caught = error
  }
  assert.ok(
    caught instanceof
      LivingFrameControlledImageSelectedScenePrivatePromptMaterializationError,
  )
  assert.equal(caught.issues[0]?.code, expectedCode)
}

function hasIssue(
  value: unknown,
  code: string,
): boolean {
  return (
    value instanceof
      LivingFrameControlledImageSelectedScenePrivatePromptMaterializationError
    && value.issues[0]?.code === code
  )
}

function resignReceipt(
  receipt:
    LivingFrameControlledImageSelectedScenePrivatePromptMaterialization,
  mutate: (draft: Record<string, unknown>) => void,
): Record<string, unknown> {
  const draft =
    structuredClone(receipt) as unknown as
      Record<string, unknown>
  delete draft.materializationDigestSha256
  mutate(draft)
  return {
    ...draft,
    materializationDigestSha256: digest(draft),
  }
}

function resignUnitReceipt(
  receipt:
    LivingFrameControlledImageSelectedScenePrivatePromptMaterialization,
  unitIndex: number,
  mutateUnit: (unit: Record<string, unknown>) => void,
): Record<string, unknown> {
  return resignReceipt(receipt, (draft) => {
    const units =
      draft.materializationUnits as
        Array<Record<string, unknown>>
    const unit = units[unitIndex]!
    delete unit.materializationUnitDigestSha256
    mutateUnit(unit)
    unit.materializationUnitDigestSha256 = digest(unit)
  })
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)), 'utf8')
    .digest('hex')
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (
    value !== null
    && typeof value === 'object'
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) =>
          left.localeCompare(right))
        .map(([key, nested]) => [
          key,
          canonicalize(nested),
        ]),
    )
  }
  return value
}
