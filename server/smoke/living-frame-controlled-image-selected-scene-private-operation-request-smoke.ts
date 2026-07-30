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
  LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationError,
  consumeLivingFrameControlledImageSelectedSceneCanonicalComfyUiCandidateInputLease,
  createLivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReader,
  reconcileLivingFrameControlledImageSelectedSceneCanonicalComfyUiCandidateInput,
  type LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationPacket,
  verifyLivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReceipt,
} from '../living-frame/living-frame-controlled-image-selected-scene-canonical-comfyui-input-reconciliation'
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
    privateAlias: 'sd_xl_base_1.0.safetensors',
    artifactByteLength: 6_938_078_334,
    artifactContentSha256:
      '31e35c80fc4829d14f90153f4c74cd59c90b779f6afe05a74cd6120b893f7e5b',
  },
  {
    role: 'controlnet_checkpoint',
    slotKind: 'controlnet_checkpoint_artifact',
    privateAlias:
      'diffusion_pytorch_model.fp16.safetensors',
    artifactByteLength: 320_237_179,
    artifactContentSha256:
      'fde4888a5f0a5648118991cc50e0ac4d60a2356dbaddf5e0649dd69c1119a2f9',
  },
  {
    role: 'lora_adapter',
    slotKind: 'lora_adapter_artifact',
    privateAlias:
      'sd_xl_offset_example-lora_1.0.safetensors',
    artifactByteLength: 49_553_604,
    artifactContentSha256:
      '4852686128f953d0277d0793e2f0335352f96a919c9c16a09787d77f55cbdf6f',
  },
  {
    role: 'generic_ipadapter_checkpoint',
    slotKind: 'generic_ipadapter_checkpoint_artifact',
    privateAlias: 'ip-adapter_sdxl.safetensors',
    artifactByteLength: 702_585_376,
    artifactContentSha256:
      'ba1002529e783604c5f326d49f0122025392d1d20ac8d573b3eeb3e6dea4ebb6',
  },
  {
    role: 'clip_vision_checkpoint',
    slotKind: 'clip_vision_checkpoint_artifact',
    privateAlias: 'model.safetensors',
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

const reconciliationFixture = await createFixture()
const reconciliationOperationResult =
  await compileLivingFrameControlledImageSelectedScenePrivateOperationRequest(
    reconciliationFixture.input,
  )
const reconciliationPacket =
  createCanonicalReconciliationPacket({
    selectedSceneRequest:
      livingFrameControlledImageSelectedSceneSmokeRequest,
    operationRequestReceipt:
      reconciliationOperationResult.receipt,
  })
const reconciliationReader =
  createLivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReader(
    async () => structuredClone(reconciliationPacket),
  )
const reconciliationResult =
  await reconcileLivingFrameControlledImageSelectedSceneCanonicalComfyUiCandidateInput({
    serverOwnedReconciliationLocatorId:
      `selected-canonical-comfyui-input.${nextId()}`,
    selectedSceneRequest:
      livingFrameControlledImageSelectedSceneSmokeRequest,
    selectedSceneRequestInput:
      livingFrameControlledImageSelectedSceneSmokeInput,
    operationRequestReceipt:
      reconciliationOperationResult.receipt,
    privateOperationRequestLease:
      reconciliationOperationResult.privateOperationRequestLease,
    reader: reconciliationReader,
  })
assert.equal(
  verifyLivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReceipt(
    reconciliationResult.receipt,
  ),
  true,
)
assert.equal(
  reconciliationResult.receipt.canonicalTarget
    .requestCandidateVersion,
  'canonical-comfyui-gpu-runtime-request-candidate-v1',
)
assert.equal(
  reconciliationResult.receipt.canonicalTarget
    .exactCanonicalModelAndImageAliasesVerified,
  true,
)
assert.equal(
  reconciliationResult.receipt.canonicalTarget
    .exactInputImageMetadataVerified,
  true,
)
assert.equal(
  reconciliationResult.receipt.canonicalTarget.width,
  1920,
)
assert.equal(
  reconciliationResult.receipt.canonicalTarget.height,
  1080,
)
assert.equal(
  reconciliationResult.receipt
    .canonicalRuntimeCompilerInvoked,
  false,
)
assert.equal(reconciliationResult.receipt.dispatchGranted, false)
assert.equal(reconciliationResult.receipt.runtimeExecuted, false)
assert.equal(reconciliationResult.receipt.productionReady, false)
assert.equal(
  JSON.stringify(reconciliationResult.receipt).includes(
    'Premium editorial illustration',
  ),
  false,
)
assert.equal(
  JSON.stringify(reconciliationResult.receipt).includes(
    'sd_xl_base_1.0.safetensors',
  ),
  false,
)
const canonicalCandidateInput =
  consumeLivingFrameControlledImageSelectedSceneCanonicalComfyUiCandidateInputLease(
    reconciliationResult.privateCandidateInputLease,
  )
assert.equal(
  canonicalCandidateInput.selectedScene.requestBindingId,
  livingFrameControlledImageSelectedSceneSmokeRequest
    .requestBindingId,
)
assert.equal(
  canonicalCandidateInput.selectedScene.workItemHash,
  reconciliationPacket.workItemHash,
)
assert.equal(
  canonicalCandidateInput.prompt.outputNodeId,
  String(
    Object.keys(canonicalCandidateInput.prompt.graph)
      .length,
  ),
)
assert.equal(
  canonicalCandidateInput.inputImages.length,
  1,
)
assert.equal(
  canonicalCandidateInput.inputImages[0]?.fileName,
  'control-image.png',
)
assert.equal(
  canonicalCandidateInput.output.canvasClass,
  'confirmed_full_frame_ratio',
)
assert.equal(canonicalCandidateInput.output.width, 1920)
assert.equal(canonicalCandidateInput.output.height, 1080)
assert.throws(
  () =>
    consumeLivingFrameControlledImageSelectedSceneCanonicalComfyUiCandidateInputLease(
      reconciliationResult.privateCandidateInputLease,
    ),
  (error) =>
    hasCanonicalReconciliationIssue(
      error,
      'candidate_input_lease_reused',
    ),
)

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

await rejectsCanonicalReconciliationPacketMutation(
  (packet) => {
    packet.workItemHash = 'not-a-digest'
  },
  'canonical_work_item_hash_missing',
)
await rejectsCanonicalReconciliationPacketMutation(
  (packet) => {
    const image = packet.inputImages[0] as {
      width: number
    }
    image.width = 8_192
  },
  'canonical_input_image_metadata_mismatch',
)
await rejectsCanonicalReconciliationPacketMutation(
  (packet) => {
    packet.dispatch.dispatchAuthority = true
  },
  'canonical_dispatch_binding_missing',
)
await rejectsCanonicalReconciliationPacketMutation(
  (packet) => {
    packet.outputKey = 'output.cross-scene-substitution'
  },
  'cross_scene_work_item_or_output_substitution',
)
await rejectsCanonicalReconciliationPacketMutation(
  (packet) => {
    ;(packet as Record<string, unknown>)
      .finalCanvasAuthority = true
  },
  'packet_invalid',
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
  canonicalCandidateInputReconciled:
    reconciliationResult.receipt
      .canonicalCandidateInputProjected,
  canonicalTargetVersion:
    reconciliationResult.receipt.canonicalTarget
      .requestCandidateVersion,
  canonicalAliasesVerified:
    reconciliationResult.receipt.canonicalTarget
      .exactCanonicalModelAndImageAliasesVerified,
  canonicalRuntimeCompilerInvoked:
    reconciliationResult.receipt
      .canonicalRuntimeCompilerInvoked,
  operationRegistered: result.receipt.operationRegistered,
  dispatchGranted: result.receipt.dispatchGranted,
  adversarialAssertions: 41,
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
      'sd_xl_base_1.0.safetensors',
    ],
    controlnet_checkpoint_artifact: [
      'private_model_alias',
      'diffusion_pytorch_model.fp16.safetensors',
    ],
    lora_adapter_artifact: [
      'private_model_alias',
      'sd_xl_offset_example-lora_1.0.safetensors',
    ],
    generic_ipadapter_checkpoint_artifact: [
      'private_model_alias',
      'ip-adapter_sdxl.safetensors',
    ],
    clip_vision_checkpoint_artifact: [
      'private_model_alias',
      'model.safetensors',
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
      'control-image.png',
    ],
    reference_image_artifact: [
      'private_image_alias',
      'reference-image.png',
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
        ? 'control-image.png'
        : 'reference-image.png'
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

function createCanonicalReconciliationPacket(input: {
  readonly selectedSceneRequest:
    typeof livingFrameControlledImageSelectedSceneSmokeRequest
  readonly operationRequestReceipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt
}): LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationPacket {
  const receipt = input.operationRequestReceipt
  const inputImages =
    receipt.requestSummary.artifactReceipts
      .filter(
        (artifact) =>
          artifact.artifactClass ===
            'private_selected_scene_input_image_artifact',
      )
      .map((artifact, order) => {
        const slotId = artifact.slotKind as
          | 'control_image_artifact'
          | 'reference_image_artifact'
        return {
          canonicalOrder: order as 0 | 1,
          slotId,
          fileName:
            slotId === 'control_image_artifact'
              ? 'control-image.png' as const
              : 'reference-image.png' as const,
          artifactId: artifact.artifactRecordId,
          contentSha256:
            artifact.artifactContentSha256,
          byteLength: artifact.artifactByteLength,
          width: 1_024,
          height: 1_024,
          sourceBindingDigestSha256:
            artifact.artifactSourceBindingDigestSha256,
          readOnlyMountRequired: true as const,
        }
      })
  const draft = {
    packetClass:
      'server_owned_selected_scene_canonical_comfyui_candidate_input_binding_packet_v1',
    targetContractVersion:
      'canonical-comfyui-gpu-runtime-request-candidate-v1',
    targetOperationId:
      'tool.comfyui.generate_controlled_image.v1',
    selectedSceneRequestBindingDigestSha256:
      input.selectedSceneRequest.requestBindingDigestSha256,
    operationRequestReceiptDigestSha256:
      receipt.operationRequestReceiptDigestSha256,
    privateOperationRequestDigestSha256:
      receipt.requestSummary
        .privateOperationRequestDigestSha256,
    materializationUnitId:
      receipt.exactOutputLineage.materializationUnitId,
    requestUnitId:
      receipt.exactOutputLineage.requestUnitId,
    sceneId: receipt.canonicalScope.sceneId,
    workItemId:
      receipt.exactOutputLineage.approvedWorkItemId,
    workItemKey:
      receipt.exactOutputLineage.approvedWorkItemKey,
    workItemHash: digest({
      canonicalWorkGraphProjectionDigestSha256:
        receipt.sourceBindings
          .canonicalWorkGraphProjectionDigestSha256,
      workItemId:
        receipt.exactOutputLineage.approvedWorkItemId,
      workItemKey:
        receipt.exactOutputLineage.approvedWorkItemKey,
      outputKey:
        receipt.exactOutputLineage.outputKey,
    }),
    outputKey: receipt.exactOutputLineage.outputKey,
    plannedAssetManifestEntryId:
      receipt.exactOutputLineage
        .approvedPlannedAssetManifestEntryId,
    confirmedOutputFrameExpectationDigestSha256:
      receipt.sourceBindings
        .confirmedOutputFrameExpectationDigestSha256,
    dispatch: {
      dispatchIntentId:
        `dispatch-intent-living-frame.${nextId()}`,
      dispatchBindingHash: digest({
        operationRequestReceiptDigestSha256:
          receipt.operationRequestReceiptDigestSha256,
        binding: 'pending-private-dispatch',
      }),
      attemptPlanHash: digest({
        privateOperationRequestDigestSha256:
          receipt.requestSummary
            .privateOperationRequestDigestSha256,
        attempt: 'one-request-one-attempt',
      }),
      runtimeRegion: 'europe-west1',
      dispatchAuthority: false,
      workerLeaseAuthority: false,
      gpuAttemptAuthority: false,
    },
    inputImages,
    callerPacketAccepted: false,
    callerPromptSeedDimensionsModelPathUrlBytesCredentialCommandOrEnvironmentAccepted:
      false,
    canonicalRuntimeCompilerAuthority: false,
    dispatchAuthority: false,
    runtimeAuthority: false,
    productionReady: false,
  } as const
  return {
    ...draft,
    packetDigestSha256: digest(draft),
  }
}

async function rejectsCanonicalReconciliationPacketMutation(
  mutate: (
    packet:
      MutableLivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationPacket,
  ) => void,
  issueCode: string,
): Promise<void> {
  const current = await createFixture()
  const operationResult =
    await compileLivingFrameControlledImageSelectedScenePrivateOperationRequest(
      current.input,
    )
  const packet =
    structuredClone(
      createCanonicalReconciliationPacket({
        selectedSceneRequest:
          livingFrameControlledImageSelectedSceneSmokeRequest,
        operationRequestReceipt:
          operationResult.receipt,
      }),
    ) as unknown as
      MutableLivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationPacket
  mutate(packet)
  resignCanonicalReconciliationPacket(packet)
  const reader =
    createLivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReader(
      async () => structuredClone(packet),
    )
  let caught: unknown
  try {
    await reconcileLivingFrameControlledImageSelectedSceneCanonicalComfyUiCandidateInput({
      serverOwnedReconciliationLocatorId:
        `selected-canonical-comfyui-rejection.${nextId()}`,
      selectedSceneRequest:
        livingFrameControlledImageSelectedSceneSmokeRequest,
      selectedSceneRequestInput:
        livingFrameControlledImageSelectedSceneSmokeInput,
      operationRequestReceipt: operationResult.receipt,
      privateOperationRequestLease:
        operationResult.privateOperationRequestLease,
      reader,
    })
  } catch (error) {
    caught = error
  }
  assert.equal(
    hasCanonicalReconciliationIssue(caught, issueCode),
    true,
  )
}

type MutableLivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationPacket =
  {
    -readonly [Key in keyof
      LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationPacket]:
      Key extends 'inputImages'
        ? Array<Record<string, unknown>>
        : Key extends 'dispatch'
          ? Record<string, unknown>
          : LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationPacket[Key]
  }

function resignCanonicalReconciliationPacket(
  packet:
    MutableLivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationPacket,
): void {
  const draft =
    structuredClone(packet) as unknown as
      Record<string, unknown>
  delete draft.packetDigestSha256
  packet.packetDigestSha256 = digest(draft)
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

function hasCanonicalReconciliationIssue(
  value: unknown,
  code: string,
): boolean {
  return (
    value instanceof
      LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationError
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
