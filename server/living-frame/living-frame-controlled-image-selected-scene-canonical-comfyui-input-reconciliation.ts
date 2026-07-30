import { createHash } from 'node:crypto'

import {
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_CLASS,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_ISSUE_CODES,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_STATE,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_VERSION,
  type LivingFrameCanonicalComfyUiInputImageFileName,
  type LivingFrameCanonicalComfyUiInputImageSlotId,
  type LivingFrameControlledImageSelectedSceneCanonicalComfyUiCandidateInput,
  type LivingFrameControlledImageSelectedSceneCanonicalComfyUiCandidateInputLease,
  type LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputImageBinding,
  type LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationAuthority,
  type LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationIssue,
  type LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationIssueCode,
  type LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationPacket,
  type LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReceipt,
  type LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReceiptDraft,
  type LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationResult,
} from '../../src/types/living-frame-controlled-image-selected-scene-canonical-comfyui-input-reconciliation'
import type {
  LivingFrameControlledImageSelectedSceneRequest,
} from '../../src/types/living-frame-controlled-image-selected-scene-request'
import type {
  LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
} from '../../src/types/living-frame-controlled-image-selected-scene-private-operation-request'
import {
  type CreateLivingFrameControlledImageSelectedSceneRequestInput,
  verifyLivingFrameControlledImageSelectedSceneRequest,
} from './living-frame-controlled-image-selected-scene-request'
import {
  consumeLivingFrameControlledImageSelectedScenePrivateOperationRequestLease,
  type LivingFrameControlledImageSelectedScenePrivateOperationRequest,
  type LivingFrameControlledImageSelectedScenePrivateOperationRequestLease,
  verifyLivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
} from './living-frame-controlled-image-selected-scene-private-operation-request'

const SHA256 = /^[a-f0-9]{64}$/u
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,239}$/u
const MAX_CANDIDATE_INPUT_BYTES = 256 * 1_024
const MAX_OUTPUT_PIXELS = 8_294_400

const CANONICAL_MODEL_BINDINGS = [
  {
    order: 0,
    role: 'base_checkpoint',
    slotKind: 'base_checkpoint_artifact',
    fileName: 'sd_xl_base_1.0.safetensors',
    byteLength: 6_938_078_334,
    contentSha256:
      '31e35c80fc4829d14f90153f4c74cd59c90b779f6afe05a74cd6120b893f7e5b',
  },
  {
    order: 1,
    role: 'controlnet_checkpoint',
    slotKind: 'controlnet_checkpoint_artifact',
    fileName: 'diffusion_pytorch_model.fp16.safetensors',
    byteLength: 320_237_179,
    contentSha256:
      'fde4888a5f0a5648118991cc50e0ac4d60a2356dbaddf5e0649dd69c1119a2f9',
  },
  {
    order: 2,
    role: 'lora_adapter',
    slotKind: 'lora_adapter_artifact',
    fileName: 'sd_xl_offset_example-lora_1.0.safetensors',
    byteLength: 49_553_604,
    contentSha256:
      '4852686128f953d0277d0793e2f0335352f96a919c9c16a09787d77f55cbdf6f',
  },
  {
    order: 3,
    role: 'generic_ipadapter_checkpoint',
    slotKind: 'generic_ipadapter_checkpoint_artifact',
    fileName: 'ip-adapter_sdxl.safetensors',
    byteLength: 702_585_376,
    contentSha256:
      'ba1002529e783604c5f326d49f0122025392d1d20ac8d573b3eeb3e6dea4ebb6',
  },
  {
    order: 4,
    role: 'clip_vision_checkpoint',
    slotKind: 'clip_vision_checkpoint_artifact',
    fileName: 'model.safetensors',
    byteLength: 3_689_912_664,
    contentSha256:
      '657723e09f46a7c3957df651601029f66b1748afb12b419816330f16ed45d64d',
  },
] as const

const AUTHORITY_BOUNDARY:
  LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationAuthority =
  deepFreeze({
    canonicalCandidateInputReconciliationAuthority: true,
    selectedSceneAuthority: false,
    promptPlanningAuthority: false,
    promptMaterializationAuthority: false,
    operationRequestAuthority: false,
    canonicalRuntimeCompilerAuthority: false,
    toolRegistryAuthority: false,
    operationRegistryAuthority: false,
    providerAuthority: false,
    modelArtifactAuthority: false,
    inputArtifactAuthority: false,
    artifactMountAuthority: false,
    timingAuthority: false,
    estimateAuthority: false,
    actualCostAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workGraphMutationAuthority: false,
    queueAuthority: false,
    dispatchAuthority: false,
    workerLeaseAuthority: false,
    gpuAttemptAuthority: false,
    runtimeAuthority: false,
    artifactPersistenceAuthority: false,
    assetManifestAuthority: false,
    qaApprovalAuthority: false,
    privateReviewAuthority: false,
    renderAuthority: false,
    finalCanvasAuthority: false,
    productionAuthority: false,
  })

export interface LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReaderPort {
  readonly readerClass:
    'process_bound_server_owned_canonical_comfyui_candidate_input_binding_reader_v1'
  readonly sourceAuthority:
    'current_canonical_work_dispatch_and_private_input_artifact_repository'
  readonly callerPacketAccepted: false
  readonly callerPromptSeedDimensionsModelPathUrlBytesCredentialCommandOrEnvironmentAccepted:
    false
  readonly canonicalRuntimeCompilerAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly productionReady: false
  readCurrentByServerOwnedLocator(
    serverOwnedReconciliationLocatorId: string,
  ): Promise<unknown>
}

export interface CreateLivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationInput {
  readonly serverOwnedReconciliationLocatorId: string
  readonly selectedSceneRequest:
    LivingFrameControlledImageSelectedSceneRequest
  readonly selectedSceneRequestInput:
    CreateLivingFrameControlledImageSelectedSceneRequestInput
  readonly operationRequestReceipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt
  readonly privateOperationRequestLease:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestLease
  readonly reader:
    LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReaderPort | null
}

const readers = new WeakSet<object>()
const consumedReaders = new WeakSet<object>()
const candidateInputLeases = new WeakSet<object>()
const consumedCandidateInputLeases = new WeakSet<object>()
const privateCandidateInputs = new WeakMap<
  object,
  LivingFrameControlledImageSelectedSceneCanonicalComfyUiCandidateInput
>()

export class LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationIssue[],
  ) {
    super(
      'Living Frame selected-scene canonical ComfyUI input reconciliation failed.',
    )
    this.name =
      'LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationError'
    this.issues = issues
  }
}

export function createLivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReader(
  readCurrentByServerOwnedLocator:
    LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReaderPort[
      'readCurrentByServerOwnedLocator'
    ],
): LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReaderPort {
  if (typeof readCurrentByServerOwnedLocator !== 'function') {
    throw invalid('reader_invalid', '$.reader')
  }
  const reader =
    Object.freeze<LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReaderPort>({
      readerClass:
        'process_bound_server_owned_canonical_comfyui_candidate_input_binding_reader_v1',
      sourceAuthority:
        'current_canonical_work_dispatch_and_private_input_artifact_repository',
      callerPacketAccepted: false,
      callerPromptSeedDimensionsModelPathUrlBytesCredentialCommandOrEnvironmentAccepted:
        false,
      canonicalRuntimeCompilerAuthority: false,
      dispatchAuthority: false,
      runtimeAuthority: false,
      productionReady: false,
      readCurrentByServerOwnedLocator:
        readCurrentByServerOwnedLocator.bind(undefined),
    })
  readers.add(reader)
  return reader
}

export async function reconcileLivingFrameControlledImageSelectedSceneCanonicalComfyUiCandidateInput(
  input:
    CreateLivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationInput,
): Promise<
  LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationResult
> {
  assertInput(input)
  if (
    !verifyLivingFrameControlledImageSelectedSceneRequest(
      input.selectedSceneRequest,
      input.selectedSceneRequestInput,
    )
  ) throw invalid(
    'selected_scene_request_invalid',
    '$.selectedSceneRequest',
  )
  if (
    !verifyLivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt(
      input.operationRequestReceipt,
    )
  ) throw invalid(
    'operation_request_receipt_invalid',
    '$.operationRequestReceipt',
  )
  assertReceiptLineage(
    input.selectedSceneRequest,
    input.operationRequestReceipt,
  )
  const reader = requireReader(input.reader)
  consumedReaders.add(reader)
  let packetValue: unknown
  try {
    packetValue =
      await reader.readCurrentByServerOwnedLocator(
        input.serverOwnedReconciliationLocatorId,
      )
  } catch {
    throw invalid('reader_failed', '$.reader')
  }
  const packet = assertPacket(
    packetValue,
    input.selectedSceneRequest,
    input.operationRequestReceipt,
  )
  let operationRequest:
    LivingFrameControlledImageSelectedScenePrivateOperationRequest
  try {
    operationRequest =
      consumeLivingFrameControlledImageSelectedScenePrivateOperationRequestLease(
        input.privateOperationRequestLease,
      )
  } catch {
    throw invalid(
      'operation_request_lease_reused',
      '$.privateOperationRequestLease',
    )
  }
  assertPrivateOperationRequest(
    operationRequest,
    input.operationRequestReceipt,
  )
  const outputNodeId =
    assertCanonicalGraphAndAliases(
      operationRequest,
      input.operationRequestReceipt,
    )
  const candidateInput =
    compileCandidateInput({
      request: input.selectedSceneRequest,
      receipt: input.operationRequestReceipt,
      operationRequest,
      packet,
      outputNodeId,
    })
  const serializedCandidateInputByteLength =
    Buffer.byteLength(canonicalJson(candidateInput), 'utf8')
  if (
    serializedCandidateInputByteLength < 2
    || serializedCandidateInputByteLength >
      MAX_CANDIDATE_INPUT_BYTES
  ) throw invalid(
    'unsafe_receipt_forbidden',
    '$.privateCandidateInput',
  )
  const candidateInputDigestSha256 = digest(candidateInput)
  const reconciliationId =
    `lf-selected-canonical-comfyui-input.${digest({
      operationRequestReceiptDigestSha256:
        input.operationRequestReceipt
          .operationRequestReceiptDigestSha256,
      packetDigestSha256: packet.packetDigestSha256,
      candidateInputDigestSha256,
    }).slice(0, 40)}`
  const leaseId =
    `lf-selected-canonical-comfyui-input-lease.${digest({
      reconciliationId,
      candidateInputDigestSha256,
    }).slice(0, 40)}`
  const draft = compileReceiptDraft({
    reconciliationId,
    leaseId,
    request: input.selectedSceneRequest,
    receipt: input.operationRequestReceipt,
    packet,
    candidateInput,
    candidateInputDigestSha256,
    serializedCandidateInputByteLength,
    outputNodeId,
  })
  assertReceiptSemantics(draft)
  assertSafeReceipt(draft)
  const receipt =
    deepFreeze({
      ...draft,
      reconciliationDigestSha256: digest(draft),
    })
  const lease =
    Object.freeze<LivingFrameControlledImageSelectedSceneCanonicalComfyUiCandidateInputLease>({
      leaseClass:
        'process_bound_single_use_non_dispatched_canonical_comfyui_candidate_input_lease_v1',
      leaseId,
      reconciliationDigestSha256:
        receipt.reconciliationDigestSha256,
      materializationUnitId:
        receipt.exactOutputLineage.materializationUnitId,
      requestUnitId:
        receipt.exactOutputLineage.requestUnitId,
      callerSerializable: false,
      canonicalRuntimeCompilerAuthority: false,
      dispatchAuthority: false,
      workerLeaseAuthority: false,
      runtimeAuthority: false,
      assetAuthority: false,
      finalCanvasAuthority: false,
      productionReady: false,
    })
  candidateInputLeases.add(lease)
  privateCandidateInputs.set(lease, candidateInput)
  return Object.freeze({
    receipt,
    privateCandidateInputLease: lease,
  })
}

export function consumeLivingFrameControlledImageSelectedSceneCanonicalComfyUiCandidateInputLease(
  lease:
    LivingFrameControlledImageSelectedSceneCanonicalComfyUiCandidateInputLease,
): LivingFrameControlledImageSelectedSceneCanonicalComfyUiCandidateInput {
  if (
    !candidateInputLeases.has(lease)
    || consumedCandidateInputLeases.has(lease)
    || lease.leaseClass !==
      'process_bound_single_use_non_dispatched_canonical_comfyui_candidate_input_lease_v1'
    || lease.callerSerializable !== false
    || lease.canonicalRuntimeCompilerAuthority !== false
    || lease.dispatchAuthority !== false
    || lease.workerLeaseAuthority !== false
    || lease.runtimeAuthority !== false
    || lease.assetAuthority !== false
    || lease.finalCanvasAuthority !== false
    || lease.productionReady !== false
  ) throw invalid(
    'candidate_input_lease_reused',
    '$.privateCandidateInputLease',
  )
  const candidateInput = privateCandidateInputs.get(lease)
  if (!candidateInput) {
    throw invalid(
      'candidate_input_lease_invalid',
      '$.privateCandidateInputLease',
    )
  }
  consumedCandidateInputLeases.add(lease)
  privateCandidateInputs.delete(lease)
  return candidateInput
}

export function verifyLivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReceipt(
  value: unknown,
): value is
  LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReceipt {
  try {
    if (
      !isRecord(value)
      || value.contractVersion !==
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_VERSION
      || value.resultClass !==
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_CLASS
      || value.reconciliationState !==
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_STATE
      || typeof value.reconciliationDigestSha256 !== 'string'
      || !SHA256.test(value.reconciliationDigestSha256)
    ) return false
    const {
      reconciliationDigestSha256,
      ...draft
    } = value
    assertReceiptSemantics(
      draft as unknown as
        LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReceiptDraft,
    )
    assertSafeReceipt(draft)
    return digest(draft) === reconciliationDigestSha256
  } catch {
    return false
  }
}

function assertReceiptLineage(
  request: LivingFrameControlledImageSelectedSceneRequest,
  receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
): void {
  if (
    receipt.canonicalScope.workspaceId !==
      request.canonicalScope.workspaceId
    || receipt.canonicalScope.projectId !==
      request.canonicalScope.projectId
    || receipt.canonicalScope.editSessionId !==
      request.canonicalScope.editSessionId
    || receipt.canonicalScope.sceneId !==
      request.canonicalScope.sceneId
    || receipt.sourceBindings
      .selectedSceneRequestBindingDigestSha256 !==
        request.requestBindingDigestSha256
    || receipt.sourceBindings.approvedSnapshotId !==
      request.sourceBindings.approvedSnapshotId
    || receipt.sourceBindings.approvedSnapshotHashSha256 !==
      request.sourceBindings.approvedSnapshotHashSha256
    || receipt.sourceBindings
      .canonicalWorkGraphProjectionDigestSha256 !==
        request.sourceBindings
          .canonicalWorkGraphProjectionDigestSha256
    || receipt.sourceBindings
      .confirmedOutputFrameExpectationDigestSha256 !==
        request.sourceBindings.outputFrameExpectationDigestSha256
    || receipt.operationRegistered !== false
    || receipt.dispatchGranted !== false
    || receipt.workerLeaseCreated !== false
    || receipt.gpuAttemptCreated !== false
    || receipt.runtimeExecuted !== false
    || receipt.assetCreated !== false
    || receipt.finalCanvasClaimAllowed !== false
    || receipt.productionReady !== false
  ) throw invalid('source_lineage_mismatch', '$')
}

function requireReader(
  reader:
    LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReaderPort | null,
): LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReaderPort {
  if (
    reader
    && readers.has(reader)
    && consumedReaders.has(reader)
  ) throw invalid('reader_reused', '$.reader')
  if (
    !reader
    || !readers.has(reader)
    || consumedReaders.has(reader)
    || reader.readerClass !==
      'process_bound_server_owned_canonical_comfyui_candidate_input_binding_reader_v1'
    || reader.sourceAuthority !==
      'current_canonical_work_dispatch_and_private_input_artifact_repository'
    || reader.callerPacketAccepted !== false
    || reader
      .callerPromptSeedDimensionsModelPathUrlBytesCredentialCommandOrEnvironmentAccepted !==
        false
    || reader.canonicalRuntimeCompilerAuthority !== false
    || reader.dispatchAuthority !== false
    || reader.runtimeAuthority !== false
    || reader.productionReady !== false
  ) throw invalid('reader_invalid', '$.reader')
  return reader
}

function assertPacket(
  value: unknown,
  request: LivingFrameControlledImageSelectedSceneRequest,
  receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
): LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationPacket {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'packetClass',
      'targetContractVersion',
      'targetOperationId',
      'selectedSceneRequestBindingDigestSha256',
      'operationRequestReceiptDigestSha256',
      'privateOperationRequestDigestSha256',
      'materializationUnitId',
      'requestUnitId',
      'sceneId',
      'workItemId',
      'workItemKey',
      'workItemHash',
      'outputKey',
      'plannedAssetManifestEntryId',
      'confirmedOutputFrameExpectationDigestSha256',
      'dispatch',
      'inputImages',
      'callerPacketAccepted',
      'callerPromptSeedDimensionsModelPathUrlBytesCredentialCommandOrEnvironmentAccepted',
      'canonicalRuntimeCompilerAuthority',
      'dispatchAuthority',
      'runtimeAuthority',
      'productionReady',
      'packetDigestSha256',
    ])
    || value.packetClass !==
      'server_owned_selected_scene_canonical_comfyui_candidate_input_binding_packet_v1'
    || value.targetContractVersion !==
      'canonical-comfyui-gpu-runtime-request-candidate-v1'
    || value.targetOperationId !==
      'tool.comfyui.generate_controlled_image.v1'
    || !Array.isArray(value.inputImages)
    || typeof value.packetDigestSha256 !== 'string'
    || !SHA256.test(value.packetDigestSha256)
  ) throw invalid('packet_invalid', '$.packet')
  const {
    packetDigestSha256,
    ...draft
  } = value
  if (digest(draft) !== packetDigestSha256) {
    throw invalid('packet_digest_mismatch', '$.packet')
  }
  if (
    value.selectedSceneRequestBindingDigestSha256 !==
      request.requestBindingDigestSha256
    || value.operationRequestReceiptDigestSha256 !==
      receipt.operationRequestReceiptDigestSha256
    || value.privateOperationRequestDigestSha256 !==
      receipt.requestSummary.privateOperationRequestDigestSha256
    || value.materializationUnitId !==
      receipt.exactOutputLineage.materializationUnitId
    || value.requestUnitId !==
      receipt.exactOutputLineage.requestUnitId
    || value.sceneId !== receipt.canonicalScope.sceneId
    || value.workItemId !==
      receipt.exactOutputLineage.approvedWorkItemId
    || value.workItemKey !==
      receipt.exactOutputLineage.approvedWorkItemKey
    || value.outputKey !==
      receipt.exactOutputLineage.outputKey
    || value.plannedAssetManifestEntryId !==
      receipt.exactOutputLineage
        .approvedPlannedAssetManifestEntryId
    || value.confirmedOutputFrameExpectationDigestSha256 !==
      receipt.sourceBindings
        .confirmedOutputFrameExpectationDigestSha256
  ) throw invalid(
    'cross_scene_work_item_or_output_substitution',
    '$.packet',
  )
  if (
    typeof value.workItemHash !== 'string'
    || !SHA256.test(value.workItemHash)
  ) throw invalid(
    'canonical_work_item_hash_missing',
    '$.packet.workItemHash',
  )
  assertDispatch(value.dispatch)
  assertInputImageMetadata(
    value.inputImages,
    receipt,
  )
  if (
    value.callerPacketAccepted !== false
    || value
      .callerPromptSeedDimensionsModelPathUrlBytesCredentialCommandOrEnvironmentAccepted !==
        false
    || value.canonicalRuntimeCompilerAuthority !== false
    || value.dispatchAuthority !== false
    || value.runtimeAuthority !== false
    || value.productionReady !== false
  ) throw invalid(
    'authority_promotion_forbidden',
    '$.packet',
  )
  return deepFreeze(
    value as unknown as
      LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationPacket,
  )
}

function assertDispatch(value: unknown): void {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'dispatchIntentId',
      'dispatchBindingHash',
      'attemptPlanHash',
      'runtimeRegion',
      'dispatchAuthority',
      'workerLeaseAuthority',
      'gpuAttemptAuthority',
    ])
    || typeof value.dispatchIntentId !== 'string'
    || !SAFE_ID.test(value.dispatchIntentId)
    || typeof value.dispatchBindingHash !== 'string'
    || !SHA256.test(value.dispatchBindingHash)
    || typeof value.attemptPlanHash !== 'string'
    || !SHA256.test(value.attemptPlanHash)
    || value.runtimeRegion !== 'europe-west1'
    || value.dispatchAuthority !== false
    || value.workerLeaseAuthority !== false
    || value.gpuAttemptAuthority !== false
  ) throw invalid(
    'canonical_dispatch_binding_missing',
    '$.packet.dispatch',
  )
}

function assertInputImageMetadata(
  value: unknown[],
  receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
): void {
  const expected =
    receipt.requestSummary.artifactReceipts.filter(
      (artifact) =>
        artifact.artifactClass ===
          'private_selected_scene_input_image_artifact',
    )
  if (
    value.length !== expected.length
    || value.length > 2
  ) throw invalid(
    'canonical_input_image_metadata_mismatch',
    '$.packet.inputImages',
  )
  value.forEach((candidate, order) => {
    const artifact = expected[order]
    const expectedSlot = artifact?.slotKind
    const expectedFileName =
      fileNameForInputSlot(expectedSlot)
    if (
      !artifact
      || !isRecord(candidate)
      || !hasExactKeys(candidate, [
        'canonicalOrder',
        'slotId',
        'fileName',
        'artifactId',
        'contentSha256',
        'byteLength',
        'width',
        'height',
        'sourceBindingDigestSha256',
        'readOnlyMountRequired',
      ])
      || candidate.canonicalOrder !== order
      || candidate.slotId !== artifact.slotKind
      || candidate.fileName !== expectedFileName
      || candidate.artifactId !== artifact.artifactRecordId
      || candidate.contentSha256 !== artifact.artifactContentSha256
      || candidate.byteLength !== artifact.artifactByteLength
      || candidate.sourceBindingDigestSha256 !==
        artifact.artifactSourceBindingDigestSha256
      || !Number.isInteger(candidate.width)
      || Number(candidate.width) < 16
      || Number(candidate.width) > 4_096
      || !Number.isInteger(candidate.height)
      || Number(candidate.height) < 16
      || Number(candidate.height) > 4_096
      || candidate.readOnlyMountRequired !== true
    ) throw invalid(
      'canonical_input_image_metadata_mismatch',
      `$.packet.inputImages.${order}`,
    )
  })
}

function assertPrivateOperationRequest(
  request:
    LivingFrameControlledImageSelectedScenePrivateOperationRequest,
  receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
): void {
  // The process-bound lease proves request identity; the receipt verifier
  // independently proves its stored digest and approved lineage.
  if (
    request.requestClass !==
      'selected_scene_private_comfyui_operation_request_v1'
    || request.expectedOperation.operationId !==
      'tool.comfyui.generate_controlled_image.v1'
    || request.exactOutputLineage.materializationUnitId !==
      receipt.exactOutputLineage.materializationUnitId
    || request.exactOutputLineage.requestUnitId !==
      receipt.exactOutputLineage.requestUnitId
    || request.exactOutputLineage.sceneId !==
      receipt.canonicalScope.sceneId
    || request.exactOutputLineage.outputKey !==
      receipt.exactOutputLineage.outputKey
    || request.exactOutputLineage.approvedWorkItemId !==
      receipt.exactOutputLineage.approvedWorkItemId
    || request.exactOutputLineage.approvedWorkItemKey !==
      receipt.exactOutputLineage.approvedWorkItemKey
    || request.exactOutputLineage
      .approvedPlannedAssetManifestEntryId !==
        receipt.exactOutputLineage
          .approvedPlannedAssetManifestEntryId
    || request.operationRegistered !== false
    || request.dispatchAuthority !== false
    || request.workerLeaseAuthority !== false
    || request.runtimeAuthority !== false
    || request.assetAuthority !== false
    || request.finalCanvasAuthority !== false
    || request.productionReady !== false
  ) throw invalid(
    'operation_request_lease_invalid',
    '$.privateOperationRequestLease',
  )
}

function assertCanonicalGraphAndAliases(
  request:
    LivingFrameControlledImageSelectedScenePrivateOperationRequest,
  receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
): string {
  const modelBindings =
    request.artifactMountBindings.filter(
      (binding) =>
        binding.artifactClass ===
          'canonical_model_artifact',
    )
  if (modelBindings.length !== 5) {
    throw invalid(
      'canonical_alias_mismatch',
      '$.privateOperationRequest.artifactMountBindings',
    )
  }
  CANONICAL_MODEL_BINDINGS.forEach((expected, order) => {
    const binding = modelBindings[order]
    const artifact =
      receipt.requestSummary.artifactReceipts.find(
        (candidate) =>
          candidate.artifactClass ===
            'canonical_model_artifact'
          && candidate.order === order,
      )
    if (
      !binding
      || !artifact
      || binding.order !== expected.order
      || binding.modelRole !== expected.role
      || binding.slotKind !== expected.slotKind
      || binding.privateAlias !== expected.fileName
      || binding.artifactContentSha256 !==
        expected.contentSha256
      || artifact.artifactContentSha256 !==
        expected.contentSha256
      || artifact.artifactByteLength !==
        expected.byteLength
      || binding.artifactSourceBindingDigestSha256 !==
        artifact.artifactSourceBindingDigestSha256
      || binding.readOnlyMountRequired !== true
    ) throw invalid(
      'canonical_alias_mismatch',
      `$.privateOperationRequest.artifactMountBindings.${order}`,
    )
  })
  const imageBindings =
    request.artifactMountBindings.filter(
      (binding) =>
        binding.artifactClass ===
          'private_selected_scene_input_image_artifact',
    )
  imageBindings.forEach((binding, order) => {
    const fileName = fileNameForInputSlot(binding.slotKind)
    if (
      binding.order !== 5 + order
      || binding.privateAlias !== fileName
      || binding.readOnlyMountRequired !== true
    ) throw invalid(
      'canonical_alias_mismatch',
      `$.privateOperationRequest.artifactMountBindings.${5 + order}`,
    )
  })
  const graphEntries = Object.entries(request.prompt)
  const expectedNodeIds =
    graphEntries.map((_, index) => String(index + 1))
  if (
    canonicalJson(graphEntries.map(([nodeId]) => nodeId))
      !== canonicalJson(expectedNodeIds)
    || graphEntries.length !==
      receipt.requestSummary.promptNodeCount
  ) throw invalid(
    'canonical_graph_mismatch',
    '$.privateOperationRequest.prompt',
  )
  const outputs =
    graphEntries.filter(
      ([, node]) =>
        node.class_type === 'SaveImageWebsocket',
    )
  if (outputs.length !== 1) {
    throw invalid(
      'canonical_graph_mismatch',
      '$.privateOperationRequest.prompt',
    )
  }
  const outputNodeId = outputs[0]![0]
  const flattened = canonicalJson(request.prompt)
  for (const expected of CANONICAL_MODEL_BINDINGS) {
    const used =
      receipt.graphProfile.enabledFeatures.includes(
        featureForModelRole(expected.role),
      )
      || expected.role === 'base_checkpoint'
    const occurrences =
      countOccurrences(flattened, expected.fileName)
    if (occurrences !== (used ? 1 : 0)) {
      throw invalid(
        'canonical_graph_mismatch',
        '$.privateOperationRequest.prompt',
      )
    }
  }
  imageBindings.forEach((binding) => {
    if (
      countOccurrences(
        flattened,
        String(binding.privateAlias),
      ) !== 1
    ) throw invalid(
      'canonical_graph_mismatch',
      '$.privateOperationRequest.prompt',
    )
  })
  const latent =
    graphEntries.find(
      ([, node]) =>
        node.class_type === 'EmptyLatentImage',
    )?.[1]
  if (
    latent?.inputs.width !==
      request.outputExpectation.widthPixels
    || latent.inputs.height !==
      request.outputExpectation.heightPixels
    || latent.inputs.batch_size !== 1
    || request.outputExpectation.transport !==
      'websocket_image_output'
    || request.outputExpectation.contentType !== 'image/png'
    || request.outputExpectation.imageCount !== 1
    || request.outputExpectation
      .finalCanvasCreatedByComfyUi !== false
  ) throw invalid(
    'canonical_graph_mismatch',
    '$.privateOperationRequest.prompt',
  )
  assertCanonicalCanvas(request, receipt)
  return outputNodeId
}

function assertCanonicalCanvas(
  request:
    LivingFrameControlledImageSelectedScenePrivateOperationRequest,
  receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt,
): void {
  const width = request.outputExpectation.widthPixels
  const height = request.outputExpectation.heightPixels
  if (
    width !== receipt.generationCanvas.widthPixels
    || height !== receipt.generationCanvas.heightPixels
    || !Number.isInteger(width)
    || !Number.isInteger(height)
    || width < 256
    || height < 256
    || width > 4_096
    || height > 4_096
    || width % 8 !== 0
    || height % 8 !== 0
    || width * height > MAX_OUTPUT_PIXELS
    || (
      receipt.generationCanvas.canvasClass ===
        'isolated_component_square_1024'
      && (width !== 1_024 || height !== 1_024)
    )
    || receipt.generationCanvas
      .callerSelectedDimensionsAllowed !== false
    || receipt.generationCanvas
      .squareSubstitutionApplied !== false
    || receipt.generationCanvas
      .finalCanvasCreatedByComfyUi !== false
  ) throw invalid(
    'canonical_canvas_mismatch',
    '$.generationCanvas',
  )
}

function compileCandidateInput(input: {
  readonly request:
    LivingFrameControlledImageSelectedSceneRequest
  readonly receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt
  readonly operationRequest:
    LivingFrameControlledImageSelectedScenePrivateOperationRequest
  readonly packet:
    LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationPacket
  readonly outputNodeId: string
}): LivingFrameControlledImageSelectedSceneCanonicalComfyUiCandidateInput {
  const modelBindings =
    input.operationRequest.artifactMountBindings.filter(
      (binding) =>
        binding.artifactClass ===
          'canonical_model_artifact',
    )
  const modelSourceBindingDigests =
    modelBindings.map(
      (binding) =>
        binding.artifactSourceBindingDigestSha256,
    ) as unknown as readonly [
      string,
      string,
      string,
      string,
      string,
    ]
  return deepFreeze({
    admissionDigestSha256:
      input.receipt.sourceBindings
        .admissionCandidateDigestSha256,
    dispatch: {
      dispatchIntentId:
        input.packet.dispatch.dispatchIntentId,
      dispatchBindingHash:
        input.packet.dispatch.dispatchBindingHash,
      attemptPlanHash:
        input.packet.dispatch.attemptPlanHash,
      runtimeRegion: 'europe-west1',
    },
    selectedScene: {
      requestBindingId:
        input.request.requestBindingId,
      requestBindingDigestSha256:
        input.request.requestBindingDigestSha256,
      approvedSnapshotId:
        input.request.sourceBindings.approvedSnapshotId,
      approvedSnapshotHash:
        input.request.sourceBindings
          .approvedSnapshotHashSha256,
      workItemId:
        input.receipt.exactOutputLineage
          .approvedWorkItemId,
      workItemHash: input.packet.workItemHash,
      outputKey:
        input.receipt.exactOutputLineage.outputKey,
      plannedAssetManifestEntryId:
        input.receipt.exactOutputLineage
          .approvedPlannedAssetManifestEntryId,
      confirmedOutputFrameExpectationDigestSha256:
        input.receipt.sourceBindings
          .confirmedOutputFrameExpectationDigestSha256,
    },
    prompt: {
      graph: input.operationRequest.prompt,
      outputNodeId: input.outputNodeId,
    },
    modelSourceBindingDigests,
    inputImages: input.packet.inputImages,
    output: {
      canvasClass:
        input.receipt.generationCanvas.canvasClass,
      width:
        input.receipt.generationCanvas.widthPixels,
      height:
        input.receipt.generationCanvas.heightPixels,
    },
  })
}

function compileReceiptDraft(input: {
  readonly reconciliationId: string
  readonly leaseId: string
  readonly request:
    LivingFrameControlledImageSelectedSceneRequest
  readonly receipt:
    LivingFrameControlledImageSelectedScenePrivateOperationRequestReceipt
  readonly packet:
    LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationPacket
  readonly candidateInput:
    LivingFrameControlledImageSelectedSceneCanonicalComfyUiCandidateInput
  readonly candidateInputDigestSha256: string
  readonly serializedCandidateInputByteLength: number
  readonly outputNodeId: string
}): LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReceiptDraft {
  return deepFreeze({
    contractVersion:
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_CLASS,
    reconciliationState:
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_STATE,
    reconciliationId: input.reconciliationId,
    canonicalScope: input.request.canonicalScope,
    exactOutputLineage: {
      materializationUnitId:
        input.receipt.exactOutputLineage
          .materializationUnitId,
      requestUnitId:
        input.receipt.exactOutputLineage.requestUnitId,
      componentId:
        input.receipt.exactOutputLineage.componentId,
      workItemId:
        input.receipt.exactOutputLineage
          .approvedWorkItemId,
      workItemKey:
        input.receipt.exactOutputLineage
          .approvedWorkItemKey,
      workItemHash: input.packet.workItemHash,
      outputKey:
        input.receipt.exactOutputLineage.outputKey,
      plannedAssetManifestEntryId:
        input.receipt.exactOutputLineage
          .approvedPlannedAssetManifestEntryId,
    },
    sourceBindings: {
      selectedSceneRequestBindingId:
        input.request.requestBindingId,
      selectedSceneRequestBindingDigestSha256:
        input.request.requestBindingDigestSha256,
      operationRequestReceiptId:
        input.receipt.operationRequestReceiptId,
      operationRequestReceiptDigestSha256:
        input.receipt
          .operationRequestReceiptDigestSha256,
      privateOperationRequestDigestSha256:
        input.receipt.requestSummary
          .privateOperationRequestDigestSha256,
      admissionCandidateDigestSha256:
        input.receipt.sourceBindings
          .admissionCandidateDigestSha256,
      approvedSnapshotId:
        input.receipt.sourceBindings.approvedSnapshotId,
      approvedSnapshotHashSha256:
        input.receipt.sourceBindings
          .approvedSnapshotHashSha256,
      canonicalWorkGraphProjectionDigestSha256:
        input.receipt.sourceBindings
          .canonicalWorkGraphProjectionDigestSha256,
      confirmedOutputFrameExpectationDigestSha256:
        input.receipt.sourceBindings
          .confirmedOutputFrameExpectationDigestSha256,
      packetDigestSha256: input.packet.packetDigestSha256,
    },
    canonicalTarget: {
      requestCandidateVersion:
        'canonical-comfyui-gpu-runtime-request-candidate-v1',
      operationId:
        'tool.comfyui.generate_controlled_image.v1',
      outputNodeId: input.outputNodeId,
      promptGraphDigestSha256:
        digest(input.candidateInput.prompt.graph),
      promptNodeCount:
        Object.keys(input.candidateInput.prompt.graph).length,
      modelSourceBindingDigests:
        input.candidateInput.modelSourceBindingDigests,
      inputImages: input.candidateInput.inputImages,
      canvasClass:
        input.candidateInput.output.canvasClass,
      width: input.candidateInput.output.width,
      height: input.candidateInput.output.height,
      exactCanonicalModelAndImageAliasesVerified: true,
      exactCanonicalGraphFamilyVerified: true,
      exactInputImageMetadataVerified: true,
      exactWorkItemHashBound: true,
      pendingDispatchAndAttemptLineageBound: true,
      oneRequestOneProcessOneImageOneAttempt: true,
      remotionFinalCanvasRequired: true,
    },
    privateCandidateInput: {
      leaseId: input.leaseId,
      candidateInputDigestSha256:
        input.candidateInputDigestSha256,
      serializedCandidateInputByteLength:
        input.serializedCandidateInputByteLength,
      rawPromptIncludedInReceipt: false,
      privateCandidateInputIncludedInReceipt: false,
      callerSerializable: false,
      leaseConsumed: false,
    },
    openGateCodes:
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    selectedSceneRequestRevalidated: true,
    operationRequestReceiptRevalidated: true,
    privateOperationRequestLeaseConsumedExactlyOnce: true,
    reconciliationPacketReadThroughProcessBoundPort: true,
    canonicalCandidateInputProjected: true,
    canonicalRuntimeCompilerInvoked: false,
    benchmarkRequestPathUsed: false,
    operationRegistered: false,
    dispatchGranted: false,
    workerLeaseCreated: false,
    gpuAttemptCreated: false,
    runtimeExecuted: false,
    actualCostReceiptCreated: false,
    assetCreated: false,
    assetManifestMutated: false,
    qaApproved: false,
    privateReviewApproved: false,
    renderAuthorized: false,
    finalCanvasCreatedByComfyUi: false,
    containsRawPromptAliasPathUrlModelOrImageBytesCredentialCommandOrEnvironment:
      false,
    containsPriceCreditServiceFeeReservationWalletOrLedgerData:
      false,
    productionReady: false,
  })
}

function assertReceiptSemantics(
  draft:
    LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationReceiptDraft,
): void {
  if (
    draft.contractVersion !==
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_VERSION
    || draft.resultClass !==
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_CLASS
    || draft.reconciliationState !==
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_STATE
    || !SAFE_ID.test(draft.reconciliationId)
    || draft.canonicalTarget.requestCandidateVersion !==
      'canonical-comfyui-gpu-runtime-request-candidate-v1'
    || draft.canonicalTarget.operationId !==
      'tool.comfyui.generate_controlled_image.v1'
    || !/^[1-9][0-9]{0,2}$/u.test(
      draft.canonicalTarget.outputNodeId,
    )
    || !SHA256.test(
      draft.canonicalTarget.promptGraphDigestSha256,
    )
    || draft.canonicalTarget.modelSourceBindingDigests
      .length !== 5
    || draft.canonicalTarget
      .exactCanonicalModelAndImageAliasesVerified !== true
    || draft.canonicalTarget
      .exactCanonicalGraphFamilyVerified !== true
    || draft.canonicalTarget
      .exactInputImageMetadataVerified !== true
    || draft.canonicalTarget.exactWorkItemHashBound !== true
    || draft.canonicalTarget
      .pendingDispatchAndAttemptLineageBound !== true
    || draft.canonicalTarget
      .oneRequestOneProcessOneImageOneAttempt !== true
    || draft.canonicalTarget.remotionFinalCanvasRequired !== true
    || draft.privateCandidateInput
      .rawPromptIncludedInReceipt !== false
    || draft.privateCandidateInput
      .privateCandidateInputIncludedInReceipt !== false
    || draft.canonicalRuntimeCompilerInvoked !== false
    || draft.benchmarkRequestPathUsed !== false
    || draft.operationRegistered !== false
    || draft.dispatchGranted !== false
    || draft.workerLeaseCreated !== false
    || draft.gpuAttemptCreated !== false
    || draft.runtimeExecuted !== false
    || draft.actualCostReceiptCreated !== false
    || draft.assetCreated !== false
    || draft.assetManifestMutated !== false
    || draft.qaApproved !== false
    || draft.privateReviewApproved !== false
    || draft.renderAuthorized !== false
    || draft.finalCanvasCreatedByComfyUi !== false
    || draft.productionReady !== false
    || canonicalJson(draft.openGateCodes) !==
      canonicalJson(
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_OPEN_GATES,
      )
    || canonicalJson(draft.authorityBoundary) !==
      canonicalJson(AUTHORITY_BOUNDARY)
  ) throw invalid(
    'authority_promotion_forbidden',
    '$',
  )
}

function assertSafeReceipt(value: unknown): void {
  const serialized = canonicalJson(value)
  for (const forbidden of [
    'positive_conditioning_text',
    'negative_conditioning_text',
    'CheckpointLoaderSimple',
    'KSampler',
    'SaveImageWebsocket',
    'privateAlias',
    'artifactBytes',
    'credential',
    'reservationId',
    'walletId',
    'ledgerId',
  ]) {
    if (serialized.includes(forbidden)) {
      throw invalid('unsafe_receipt_forbidden', '$')
    }
  }
}

function assertInput(
  input:
    CreateLivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'serverOwnedReconciliationLocatorId',
      'selectedSceneRequest',
      'selectedSceneRequestInput',
      'operationRequestReceipt',
      'privateOperationRequestLease',
      'reader',
    ])
    || typeof input.serverOwnedReconciliationLocatorId !==
      'string'
    || !SAFE_ID.test(input.serverOwnedReconciliationLocatorId)
    || !isRecord(input.selectedSceneRequest)
    || !isRecord(input.selectedSceneRequestInput)
    || !isRecord(input.operationRequestReceipt)
    || !isRecord(input.privateOperationRequestLease)
  ) throw invalid('input_invalid', '$')
}

function fileNameForInputSlot(
  slot: unknown,
): LivingFrameCanonicalComfyUiInputImageFileName {
  if (slot === 'control_image_artifact') {
    return 'control-image.png'
  }
  if (slot === 'reference_image_artifact') {
    return 'reference-image.png'
  }
  throw invalid(
    'canonical_input_image_metadata_mismatch',
    '$.packet.inputImages',
  )
}

function featureForModelRole(
  role: string,
): 'base' | 'lora' | 'controlnet' | 'generic_ipadapter' {
  if (role === 'lora_adapter') return 'lora'
  if (role === 'controlnet_checkpoint') return 'controlnet'
  if (
    role === 'generic_ipadapter_checkpoint'
    || role === 'clip_vision_checkpoint'
  ) return 'generic_ipadapter'
  return 'base'
}

function countOccurrences(
  text: string,
  value: string,
): number {
  let count = 0
  let cursor = 0
  while (true) {
    const next = text.indexOf(value, cursor)
    if (next < 0) return count
    count += 1
    cursor = next + value.length
  }
}

function invalid(
  code:
    LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationIssueCode,
  path: string,
): LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationError {
  if (
    !LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_CANONICAL_COMFYUI_INPUT_RECONCILIATION_ISSUE_CODES.includes(
      code,
    )
  ) {
    throw new Error(
      'Unknown Living Frame canonical ComfyUI input reconciliation issue code.',
    )
  }
  return new LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationError([
    { code, path },
  ])
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return canonicalJson(actual) === canonicalJson(expected)
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
    value
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (const child of Object.values(
      value as Record<string, unknown>,
    )) {
      deepFreeze(child)
    }
  }
  return value
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`
  }
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map(
      (key) =>
        `${JSON.stringify(key)}:${canonicalJson(value[key])}`,
    ).join(',')}}`
  }
  return JSON.stringify(value)
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value))
    .digest('hex')
}

export type {
  LivingFrameCanonicalComfyUiInputImageSlotId,
  LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputImageBinding,
  LivingFrameControlledImageSelectedSceneCanonicalComfyUiInputReconciliationPacket,
}
