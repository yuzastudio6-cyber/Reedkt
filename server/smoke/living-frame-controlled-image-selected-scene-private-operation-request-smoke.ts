import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  LivingFrameControlledSdxlBenchmarkRequestSlotKind,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-request-blueprint'
import type {
  LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
} from '../../src/types/living-frame-controlled-image-selected-scene-private-operation-request'
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
  LivingFrameControlledImageSelectedScenePrivateOperationRequestError,
  compileLivingFrameControlledImageSelectedScenePrivateOperationRequest,
  consumeLivingFrameControlledImageSelectedScenePrivateOperationRequestLease,
  createLivingFrameControlledImageSelectedScenePrivateOperationArtifactReader,
  type CreateLivingFrameControlledImageSelectedScenePrivateOperationRequestInput,
  type LivingFrameControlledImageSelectedScenePrivateOperationArtifactPacket,
  verifyLivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
} from '../living-frame/living-frame-controlled-image-selected-scene-private-operation-request'
import {
  consumeLivingFrameControlledImageSelectedScenePrivatePromptRequestLease,
  createLivingFrameControlledImageSelectedScenePrivatePromptReader,
  materializeLivingFrameControlledImageSelectedScenePrivatePrompt,
  type LivingFrameControlledImageSelectedScenePrivatePromptPacket,
  verifyLivingFrameControlledImageSelectedScenePrivatePromptMaterialization,
} from '../living-frame/living-frame-controlled-image-selected-scene-private-prompt-materialization'
import {
  livingFrameControlledImageSelectedSceneSmokeInput,
  livingFrameControlledImageSelectedSceneSmokeRequest,
} from './living-frame-controlled-image-selected-scene-request-smoke'

const MODEL_ARTIFACTS = [
  {
    role: 'base_checkpoint',
    slotKind: 'base_checkpoint_artifact',
    privateAlias: 'private-base.safetensors',
    artifactByteLength: 6_938_078_334,
    artifactContentSha256:
      '31e35c80fc4829d14f90153f4c74cd59c90b779f6afe05a74cd6120b893f7e5b',
  },
  {
    role: 'controlnet_checkpoint',
    slotKind: 'controlnet_checkpoint_artifact',
    privateAlias: 'private-controlnet.safetensors',
    artifactByteLength: 320_237_179,
    artifactContentSha256:
      'fde4888a5f0a5648118991cc50e0ac4d60a2356dbaddf5e0649dd69c1119a2f9',
  },
  {
    role: 'lora_adapter',
    slotKind: 'lora_adapter_artifact',
    privateAlias: 'private-lora.safetensors',
    artifactByteLength: 49_553_604,
    artifactContentSha256:
      '4852686128f953d0277d0793e2f0335352f96a919c9c16a09787d77f55cbdf6f',
  },
  {
    role: 'generic_ipadapter_checkpoint',
    slotKind: 'generic_ipadapter_checkpoint_artifact',
    privateAlias: 'private-ipadapter.safetensors',
    artifactByteLength: 702_585_376,
    artifactContentSha256:
      'ba1002529e783604c5f326d49f0122025392d1d20ac8d573b3eeb3e6dea4ebb6',
  },
  {
    role: 'clip_vision_checkpoint',
    slotKind: 'clip_vision_checkpoint_artifact',
    privateAlias: 'private-clipvision.safetensors',
    artifactByteLength: 3_689_912_664,
    artifactContentSha256:
      '657723e09f46a7c3957df651601029f66b1748afb12b419816330f16ed45d64d',
  },
] as const

let sequence = 0

const fixture = await createFixture()
const result =
  await compileLivingFrameControlledImageSelectedScenePrivateOperationRequest(
    fixture.input,
  )

assert.equal(
  verifyLivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt(
    result.receipt,
  ),
  true,
)
assert.equal(
  result.receipt.requestState,
  'selected_scene_private_operation_request_lease_created_dispatch_blocked',
)
assert.equal(
  result.receipt.graphProfile.benchmarkCaseOrRecipeUsed,
  false,
)
assert.equal(
  result.receipt.generationCanvas.canvasClass,
  'confirmed_full_frame_ratio',
)
assert.equal(result.receipt.generationCanvas.widthPixels, 1920)
assert.equal(result.receipt.generationCanvas.heightPixels, 1080)
assert.equal(
  result.receipt.requestSummary.exactModelArtifactCount,
  5,
)
assert.equal(
  result.receipt.requestSummary.exactModelArtifactByteLength,
  11_700_367_157,
)
assert.equal(
  result.receipt.requestSummary.inputImageArtifactCount,
  1,
)
assert.equal(
  result.receipt.requestSummary.artifactReceipts.length,
  6,
)
assert.equal(
  result.receipt.registryPolicy.registryExpansionPermitted,
  true,
)
assert.equal(
  result.receipt.registryPolicy.currentObservedCountIsProductCap,
  false,
)
assert.equal(result.receipt.operationRegistered, false)
assert.equal(result.receipt.dispatchGranted, false)
assert.equal(result.receipt.workerLeaseCreated, false)
assert.equal(result.receipt.gpuAttemptCreated, false)
assert.equal(result.receipt.runtimeExecuted, false)
assert.equal(result.receipt.assetCreated, false)
assert.equal(result.receipt.productionReady, false)
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

const privateRequest =
  consumeLivingFrameControlledImageSelectedScenePrivateOperationRequestLease(
    result.privateOperationRequestLease,
  )
assert.equal(
  privateRequest.requestClass,
  'selected_scene_private_comfyui_operation_request_v1',
)
assert.equal(privateRequest.outputExpectation.widthPixels, 1920)
assert.equal(privateRequest.outputExpectation.heightPixels, 1080)
assert.equal(privateRequest.outputExpectation.imageCount, 1)
assert.equal(
  privateRequest.outputExpectation.finalCanvasCreatedByComfyUi,
  false,
)
assert.equal(privateRequest.artifactMountBindings.length, 6)
assert.equal(
  privateRequest.artifactMountBindings.filter(
    (binding) =>
      binding.artifactClass === 'canonical_model_artifact',
  ).length,
  5,
)
assert.deepEqual(
  privateRequest.fixedRuntimePolicy.deniedTopLevelImports,
  ['sam2'],
)
assert.equal(
  privateRequest.fixedRuntimePolicy
    .atomicFiveModelReadOnlyMountRequired,
  true,
)
assert.equal(
  privateRequest.costEventExpectation
    .fiveGpuCapabilitiesCreateOneAttemptCostEvent,
  true,
)
assert.equal(privateRequest.operationRegistered, false)
assert.equal(privateRequest.dispatchAuthority, false)
assert.equal(privateRequest.runtimeAuthority, false)
assert.equal(privateRequest.finalCanvasAuthority, false)
assert.equal(privateRequest.productionReady, false)

const isolatedFixture = await createFixture('isolated')
const isolatedResult =
  await compileLivingFrameControlledImageSelectedScenePrivateOperationRequest(
    isolatedFixture.input,
  )
assert.equal(
  isolatedResult.receipt.generationCanvas.canvasClass,
  'isolated_component_square_1024',
)
assert.equal(
  isolatedResult.receipt.generationCanvas.widthPixels,
  1024,
)
assert.equal(
  isolatedResult.receipt.generationCanvas.heightPixels,
  1024,
)
assert.equal(
  isolatedResult.receipt.sourceBindings
    .fullFrameRatioExtensionUnitDigestSha256,
  null,
)
assert.equal(
  isolatedResult.receipt.requestSummary.inputImageArtifactCount,
  2,
)

assert.throws(
  () =>
    consumeLivingFrameControlledImageSelectedScenePrivateOperationRequestLease(
      result.privateOperationRequestLease,
    ),
  (error) =>
    hasIssue(error, 'wire_request_lease_reused'),
)
assert.throws(
  () =>
    consumeLivingFrameControlledImageSelectedScenePrivateOperationRequestLease({
      ...result.privateOperationRequestLease,
    }),
  (error) =>
    hasIssue(error, 'wire_request_lease_reused'),
)
assert.throws(
  () =>
    consumeLivingFrameControlledImageSelectedScenePrivatePromptRequestLease(
      fixture.promptLease,
    ),
  () => true,
)

await assertRejectsWithIssue(
  fixture.input,
  'reader_reused',
)

const copiedPromptLeaseFixture = await createFixture()
await assertRejectsWithIssue(
  {
    ...copiedPromptLeaseFixture.input,
    privatePromptRequestLease: {
      ...copiedPromptLeaseFixture.promptLease,
    },
  },
  'prompt_lease_reused',
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
  const current = await createFixture()
  await assertRejectsWithIssue(
    {
      ...current.input,
      [callerField]:
        callerField === 'seed' ||
        callerField === 'widthPixels' ||
        callerField === 'heightPixels'
          ? 1024
          : 'caller-controlled',
    } as unknown as
      CreateLivingFrameControlledImageSelectedScenePrivateOperationRequestInput,
    'input_invalid',
  )
}

await rejectsPacketMutation(
  (packet) => {
    ;(packet as Record<string, unknown>).benchmarkCaseId =
      'lf-sdxl-01-load-only'
  },
  'artifact_packet_invalid',
)
await rejectsPacketMutation(
  (packet) => {
    packet.sceneId = 'scene-cross-substituted'
  },
  'cross_scene_work_item_or_output_substitution',
)
await rejectsPacketMutation(
  (packet) => {
    packet.outputKey = 'output.cross-substituted'
    packet.approvedWorkItemId = 'work.cross-substituted'
  },
  'cross_scene_work_item_or_output_substitution',
)
await rejectsPacketMutation(
  (packet) => {
    packet.modelArtifacts.pop()
  },
  'model_artifact_set_invalid',
)
await rejectsPacketMutation(
  (packet) => {
    const artifact =
      packet.modelArtifacts[0] as {
        artifactByteLength: number
      }
    artifact.artifactByteLength -= 1
  },
  'model_artifact_set_invalid',
)
await rejectsPacketMutation(
  (packet) => {
    const artifact =
      packet.modelArtifacts[0] as {
        privateAlias: string
      }
    artifact.privateAlias =
      'caller-base.safetensors'
  },
  'model_artifact_set_invalid',
)
await rejectsPacketMutation(
  (packet) => {
    packet.inputImageArtifacts = []
  },
  'input_image_artifact_set_invalid',
)
await rejectsPacketMutation(
  (packet) => {
    packet.fixedRuntimeExpectation.deniedTopLevelImports = []
  },
  'fixed_runtime_policy_invalid',
)
await rejectsPacketMutation(
  (packet) => {
    packet.fixedRuntimeExpectation.externalNetworkAllowed = true
  },
  'fixed_runtime_policy_invalid',
)
await rejectsPacketMutation(
  (packet) => {
    packet.fixedRuntimeExpectation
      .atomicFiveModelReadOnlyMountRequired = false
  },
  'fixed_runtime_policy_invalid',
)
await rejectsPacketMutation(
  (packet) => {
    const mutable =
      packet as unknown as Record<string, unknown>
    mutable.dispatchAuthority = true
    mutable.runtimeAuthority = true
    mutable.productionReady = true
  },
  'authority_promotion_forbidden',
)

const squareFixture = await createFixture()
const squareSubstitution = resignMaterializationReceipt(
  squareFixture.promptMaterialization,
  1,
  (unit) => {
    const canvas =
      unit.generationCanvas as Record<string, unknown>
    canvas.widthPixels = 1024
    canvas.heightPixels = 1024
    canvas.squareSubstitutionApplied = true
  },
)
assert.equal(
  verifyLivingFrameControlledImageSelectedScenePrivatePromptMaterialization(
    squareSubstitution,
  ),
  false,
)
await assertRejectsWithIssue(
  {
    ...squareFixture.input,
    promptMaterialization:
      squareSubstitution as unknown as
        LivingFrameControlledImageSelectedScenePrivatePromptMaterialization,
  },
  'prompt_materialization_invalid',
)

const unconfirmedFixture = await createFixture()
const unconfirmedFrame =
  resignMaterializationReceipt(
    unconfirmedFixture.promptMaterialization,
    null,
    (_unit, draft) => {
      const sourceBindings =
        draft.sourceBindings as Record<string, unknown>
      sourceBindings
        .confirmedOutputFrameExpectationDigestSha256 =
          '0'.repeat(64)
    },
  )
assert.equal(
  verifyLivingFrameControlledImageSelectedScenePrivatePromptMaterialization(
    unconfirmedFrame,
  ),
  true,
)
await assertRejectsWithIssue(
  {
    ...unconfirmedFixture.input,
    promptMaterialization:
      unconfirmedFrame as unknown as
        LivingFrameControlledImageSelectedScenePrivatePromptMaterialization,
  },
  'source_lineage_mismatch',
)

assert.equal(
  verifyLivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt(
    resignOperationReceipt(result.receipt, (draft) => {
      draft.benchmarkPromptOrRuntimePathUsed = true
    }),
  ),
  false,
)
assert.equal(
  verifyLivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt(
    resignOperationReceipt(result.receipt, (draft) => {
      const canvas =
        draft.generationCanvas as Record<string, unknown>
      canvas.finalCanvasCreatedByComfyUi = true
    }),
  ),
  false,
)
assert.equal(
  verifyLivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt(
    resignOperationReceipt(result.receipt, (draft) => {
      draft.rawPrompt = 'forbidden prompt'
    }),
  ),
  false,
)
assert.equal(
  verifyLivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt(
    resignOperationReceipt(result.receipt, (draft) => {
      const canvas =
        draft.generationCanvas as Record<string, unknown>
      canvas.callerWidthOverride = 1024
    }),
  ),
  false,
)
assert.equal(
  verifyLivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt(
    resignOperationReceipt(result.receipt, (draft) => {
      draft.operationRegistered = true
      draft.dispatchGranted = true
      draft.runtimeExecuted = true
      draft.assetCreated = true
      draft.approvalPromoted = true
      draft.productionReady = true
    }),
  ),
  false,
)

console.log(JSON.stringify({
  status: 'passed',
  contractVersion: result.receipt.contractVersion,
  materializationUnitId:
    result.receipt.exactOutputLineage.materializationUnitId,
  confirmedDimensions: [
    result.receipt.generationCanvas.widthPixels,
    result.receipt.generationCanvas.heightPixels,
  ],
  exactModelArtifactCount:
    result.receipt.requestSummary.exactModelArtifactCount,
  exactModelArtifactByteLength:
    result.receipt.requestSummary.exactModelArtifactByteLength,
  inputImageArtifactCount:
    result.receipt.requestSummary.inputImageArtifactCount,
  oneAttemptCostEvent:
    result.receipt.attemptAndCostBinding
      .fiveGpuCapabilitiesCreateOneAttemptCostEvent,
  benchmarkPromptOrRuntimePathUsed:
    result.receipt.benchmarkPromptOrRuntimePathUsed,
  operationRegistered: result.receipt.operationRegistered,
  dispatchGranted: result.receipt.dispatchGranted,
  adversarialAssertions: 36,
  productionReady: result.receipt.productionReady,
}))

async function createFixture(
  target: 'full_frame' | 'isolated' = 'full_frame',
) {
  const selectedSceneRequest =
    livingFrameControlledImageSelectedSceneSmokeRequest
  const selectedSceneRequestInput =
    livingFrameControlledImageSelectedSceneSmokeInput
  const admissionCandidate =
    await createLivingFrameComfyUiOperationAdmissionCandidate({
      candidateId:
        `living-frame.comfyui.selected-operation.${nextId()}`,
    })
  const fullFrameRatioExtensionInput = {
    extensionId:
      `living-frame.full-frame-ratio.selected-operation.${nextId()}`,
    selectedSceneRequest,
    selectedSceneRequestInput,
    admissionCandidate,
  } as const
  const fullFrameRatioExtension =
    await createLivingFrameControlledImageFullFrameRatioExtension(
      fullFrameRatioExtensionInput,
    )
  const promptPacket = createPromptPacket(
    selectedSceneRequest,
    fullFrameRatioExtension,
  )
  const promptReader =
    createLivingFrameControlledImageSelectedScenePrivatePromptReader(
      async () => structuredClone(promptPacket),
    )
  const promptResult =
    await materializeLivingFrameControlledImageSelectedScenePrivatePrompt({
      materializationBatchId:
        `living-frame.selected-operation-materialization.${nextId()}`,
      serverOwnedMaterializationLocatorId:
        `selected-operation-materialization-locator.${nextId()}`,
      selectedSceneRequest,
      selectedSceneRequestInput,
      fullFrameRatioExtension,
      fullFrameRatioExtensionInput,
      admissionCandidate,
      reader: promptReader,
    })
  const unit =
    promptResult.receipt.materializationUnits.find(
      (candidate) =>
        candidate.generationCanvas.canvasClass ===
          (
            target === 'full_frame'
              ? 'confirmed_full_frame_ratio'
              : 'isolated_component_square_1024'
          ),
    )!
  const promptLease =
    promptResult.privatePromptRequestLeases.find(
      (candidate) =>
        candidate.materializationUnitId ===
          unit.materializationUnitId,
    )!
  const operationPacket = createOperationPacket({
    selectedSceneRequest,
    promptMaterialization: promptResult.receipt,
    unit,
  })
  const artifactReader =
    createLivingFrameControlledImageSelectedScenePrivateOperationArtifactReader(
      async () => structuredClone(operationPacket),
    )
  const input = {
    serverOwnedArtifactLocatorId:
      `selected-operation-artifact-locator.${nextId()}`,
    selectedSceneRequest,
    selectedSceneRequestInput,
    fullFrameRatioExtension,
    fullFrameRatioExtensionInput,
    admissionCandidate,
    promptMaterialization: promptResult.receipt,
    materializationUnitId: unit.materializationUnitId,
    privatePromptRequestLease: promptLease,
    artifactReader,
  } as const
  return {
    input,
    operationPacket,
    promptMaterialization: promptResult.receipt,
    promptLease,
  }
}

function createPromptPacket(
  selectedSceneRequest:
    typeof livingFrameControlledImageSelectedSceneSmokeRequest,
  fullFrameRatioExtension: {
    readonly extensionDigestSha256: string
  },
): LivingFrameControlledImageSelectedScenePrivatePromptPacket {
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
) {
  const values: Record<
    LivingFrameControlledSdxlBenchmarkRequestSlotKind,
    readonly [
      | 'private_model_alias'
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

function createOperationPacket(input: {
  readonly selectedSceneRequest:
    typeof livingFrameControlledImageSelectedSceneSmokeRequest
  readonly promptMaterialization:
    LivingFrameControlledImageSelectedScenePrivatePromptMaterialization
  readonly unit:
    LivingFrameControlledImageSelectedScenePrivatePromptMaterialization[
      'materializationUnits'
    ][number]
}): LivingFrameControlledImageSelectedScenePrivateOperationArtifactPacket {
  const requestUnit =
    input.selectedSceneRequest.requestUnits.find(
      (candidate) =>
        candidate.requestUnitId === input.unit.requestUnitId,
    )!
  const modelArtifacts = MODEL_ARTIFACTS.map(
    (artifact, order) => ({
      order,
      role: artifact.role,
      slotKind: artifact.slotKind,
      artifactRecordId: `model-artifact.${artifact.role}.001`,
      artifactContentSha256:
        artifact.artifactContentSha256,
      artifactByteLength: artifact.artifactByteLength,
      artifactSourceBindingDigestSha256: digest({
        role: artifact.role,
        artifactContentSha256:
          artifact.artifactContentSha256,
      }),
      privateAlias: artifact.privateAlias,
      readOnlyMountRequired: true as const,
    }),
  )
  const imageSlots =
    input.unit.privatePromptRequest.slotReceipts.filter(
      (slot) => slot.valueClass === 'private_image_alias',
    )
  const inputImageArtifacts = imageSlots.map((slot, order) => {
    const privateAlias =
      slot.slotKind === 'control_image_artifact'
        ? 'private-control.png'
        : 'private-reference.png'
    return {
      order: 5 + order,
      promptSlotOrder: slot.order,
      slotKind: slot.slotKind as
        | 'control_image_artifact'
        | 'reference_image_artifact',
      artifactRecordId:
        `input-artifact.${slot.slotKind}.${nextId()}`,
      artifactContentSha256: digest({
        requestUnitId: input.unit.requestUnitId,
        slotKind: slot.slotKind,
      }),
      artifactByteLength: 48_044 + order,
      artifactSourceBindingDigestSha256: digest({
        requestUnitId: input.unit.requestUnitId,
        outputKey: input.unit.outputKey,
        slotKind: slot.slotKind,
      }),
      privateAlias,
      readOnlyMountRequired: true as const,
    }
  })
  const artifactSetDigestSha256 = digest({
    modelArtifacts,
    inputImageArtifacts,
  })
  const draft = {
    packetClass:
      'server_owned_selected_scene_comfyui_operation_artifact_packet_v1',
    evidenceClass:
      'controlled_non_executable_selected_scene_operation_artifact_packet',
    selectedSceneRequestBindingDigestSha256:
      input.selectedSceneRequest.requestBindingDigestSha256,
    promptMaterializationDigestSha256:
      input.promptMaterialization.materializationDigestSha256,
    promptMaterializationUnitDigestSha256:
      input.unit.materializationUnitDigestSha256,
    materializationUnitId: input.unit.materializationUnitId,
    requestUnitId: input.unit.requestUnitId,
    sceneId: input.unit.sceneId,
    outputKey: input.unit.outputKey,
    approvedWorkItemId: input.unit.approvedWorkItemId,
    approvedWorkItemKey: input.unit.approvedWorkItemKey,
    approvedPlannedAssetManifestEntryId:
      input.unit.approvedPlannedAssetManifestEntryId,
    confirmedOutputFrameExpectationDigestSha256:
      requestUnit.generationCanvas
        .finalOutputFrameExpectationDigestSha256,
    modelArtifacts,
    inputImageArtifacts,
    artifactSetDigestSha256,
    fixedRuntimeExpectation: {
      processEntrypointKind:
        'fixed_supervised_python_process',
      runtimeRegion: 'europe-west1',
      accelerator: 'nvidia_l4',
      gpuCount: 1,
      cpuFallbackAllowed: false,
      runtimeConfinementRequirementDigestSha256:
        input.unit.attemptPolicy.confinementDigestSha256,
      deniedTopLevelImports: ['sam2'] as const,
      externalNetworkAllowed: false,
      runtimeDownloadsAllowed: false,
      atomicFiveModelReadOnlyMountRequired: true,
      verifyAllFiveModelsBeforeAndAfterInference: true,
      oneProcessPerAttemptRequired: true,
    },
    callerArtifactPacketAccepted: false,
    callerModelOrImageBytesAccepted: false,
    callerPromptSeedDimensionModelPathUrlCredentialCommandOrEnvironmentAccepted:
      false,
    operationAuthority: false,
    dispatchAuthority: false,
    runtimeAuthority: false,
    productionReady: false,
  } as const
  return {
    ...draft,
    artifactPacketDigestSha256: digest(draft),
  }
}

async function rejectsPacketMutation(
  mutate: (
    packet:
      MutableLivingFrameControlledImageSelectedScenePrivateOperationArtifactPacket,
  ) => void,
  issueCode: string,
): Promise<void> {
  const current = await createFixture()
  const packet = structuredClone(
    current.operationPacket,
  ) as unknown as
    MutableLivingFrameControlledImageSelectedScenePrivateOperationArtifactPacket
  mutate(packet)
  resignPacket(packet)
  const artifactReader =
    createLivingFrameControlledImageSelectedScenePrivateOperationArtifactReader(
      async () => structuredClone(packet),
    )
  await assertRejectsWithIssue(
    {
      ...current.input,
      artifactReader,
    },
    issueCode,
  )
}

type MutableLivingFrameControlledImageSelectedScenePrivateOperationArtifactPacket =
  {
    -readonly [Key in keyof
      LivingFrameControlledImageSelectedScenePrivateOperationArtifactPacket]:
      Key extends 'modelArtifacts'
        ? Array<Record<string, unknown>>
        : Key extends 'inputImageArtifacts'
          ? Array<Record<string, unknown>>
          : Key extends 'fixedRuntimeExpectation'
            ? Record<string, unknown>
            : LivingFrameControlledImageSelectedScenePrivateOperationArtifactPacket[Key]
  }

function resignPacket(
  packet:
    MutableLivingFrameControlledImageSelectedScenePrivateOperationArtifactPacket,
): void {
  packet.artifactSetDigestSha256 = digest({
    modelArtifacts: packet.modelArtifacts,
    inputImageArtifacts: packet.inputImageArtifacts,
  })
  const draft =
    structuredClone(packet) as unknown as
      Record<string, unknown>
  delete draft.artifactPacketDigestSha256
  packet.artifactPacketDigestSha256 = digest(draft)
}

async function assertRejectsWithIssue(
  input:
    CreateLivingFrameControlledImageSelectedScenePrivateOperationRequestInput,
  expectedCode: string,
): Promise<void> {
  let caught: unknown
  try {
    await compileLivingFrameControlledImageSelectedScenePrivateOperationRequest(
      input,
    )
  } catch (error) {
    caught = error
  }
  assert.ok(
    caught instanceof
      LivingFrameControlledImageSelectedScenePrivateOperationRequestError,
  )
  assert.equal(caught.issues[0]?.code, expectedCode)
}

function hasIssue(
  value: unknown,
  code: string,
): boolean {
  return (
    value instanceof
      LivingFrameControlledImageSelectedScenePrivateOperationRequestError
    && value.issues[0]?.code === code
  )
}

function resignOperationReceipt(
  receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
  mutate: (draft: Record<string, unknown>) => void,
): Record<string, unknown> {
  const draft =
    structuredClone(receipt) as unknown as
      Record<string, unknown>
  delete draft.operationRequestReceiptDigestSha256
  mutate(draft)
  return {
    ...draft,
    operationRequestReceiptDigestSha256: digest(draft),
  }
}

function resignMaterializationReceipt(
  receipt:
    LivingFrameControlledImageSelectedScenePrivatePromptMaterialization,
  unitIndex: number | null,
  mutate: (
    unit: Record<string, unknown>,
    draft: Record<string, unknown>,
  ) => void,
): Record<string, unknown> {
  const draft =
    structuredClone(receipt) as unknown as
      Record<string, unknown>
  delete draft.materializationDigestSha256
  const units =
    draft.materializationUnits as
      Array<Record<string, unknown>>
  if (unitIndex === null) {
    mutate({}, draft)
  } else {
    const unit = units[unitIndex]!
    delete unit.materializationUnitDigestSha256
    mutate(unit, draft)
    unit.materializationUnitDigestSha256 = digest(unit)
  }
  return {
    ...draft,
    materializationDigestSha256: digest(draft),
  }
}

function nextId(): string {
  sequence += 1
  return String(sequence).padStart(4, '0')
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)), 'utf8')
    .digest('hex')
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value !== null && typeof value === 'object') {
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
