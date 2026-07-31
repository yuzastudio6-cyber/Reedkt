import {
  LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_CANONICAL_COMFYUI_RECONCILIATION_CLASS,
  LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_CANONICAL_COMFYUI_RECONCILIATION_STATE,
  LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_CANONICAL_COMFYUI_RECONCILIATION_VERSION,
  type LivingFrameCharacterCanonicalComfyUiInputImageBinding,
  type LivingFrameCharacterCanonicalComfyUiInputImageSlotKind,
  type LivingFrameCharacterCanonicalComfyUiPromptGraph,
  type LivingFrameCharacterCanonicalComfyUiV1CandidateInput,
  type LivingFrameCharacterCanonicalComfyUiV1CandidateInputLease,
  type LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliation,
  type LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationAuthority,
  type LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationDraft,
  type LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationIssue,
  type LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationIssueCode,
  type LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationResult,
  type LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationUnit,
} from '../../src/types/living-frame-character-controlled-preparation-canonical-comfyui-reconciliation'
import type {
  LivingFrameCharacterControlledPreparation,
  LivingFrameCharacterControlledPreparationPrivateSlotKind,
  LivingFrameCharacterControlledPreparationUnit,
} from '../../src/types/living-frame-character-controlled-preparation'
import type {
  LivingFrameCharacterControlledPreparationPrivatePrompt,
  LivingFrameCharacterControlledPreparationPrivatePromptSlotReceipt,
} from '../../src/types/living-frame-character-controlled-preparation-private-prompt'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  type CreateLivingFrameCharacterControlledPreparationInput,
  verifyLivingFrameCharacterControlledPreparation,
} from './living-frame-character-controlled-preparation'
import {
  consumeLivingFrameCharacterControlledPreparationPrivatePromptLease,
  type LivingFrameCharacterControlledPreparationPrivateComfyUiRequest,
  LivingFrameCharacterControlledPreparationPrivatePromptError,
  type LivingFrameCharacterControlledPreparationPrivatePromptLease,
  verifyLivingFrameCharacterControlledPreparationPrivatePrompt,
} from './living-frame-character-controlled-preparation-private-prompt'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const MAX_INPUT_BYTES = 512 * 1_024

const CANONICAL_MODEL_ALIASES = {
  base_checkpoint_artifact:
    'sd_xl_base_1.0.safetensors',
  controlnet_checkpoint_artifact:
    'diffusion_pytorch_model.fp16.safetensors',
  lora_adapter_artifact:
    'sd_xl_offset_example-lora_1.0.safetensors',
  generic_ipadapter_checkpoint_artifact:
    'ip-adapter_sdxl.safetensors',
  clip_vision_checkpoint_artifact:
    'model.safetensors',
} as const

const CANONICAL_IMAGE_ALIASES = {
  control_image_artifact:
    'control-image.png',
  reference_image_artifact:
    'reference-image.png',
  source_plate_image_artifact:
    'source-plate.png',
  source_plate_inpaint_mask_artifact:
    'source-plate-mask.png',
} as const

const CANONICAL_V1_ALLOWED_NODE_CLASSES = new Set([
  'CheckpointLoaderSimple',
  'LoraLoader',
  'CLIPTextEncode',
  'ControlNetLoader',
  'LoadImage',
  'ControlNetApplyAdvanced',
  'EmptyLatentImage',
  'CLIPVisionLoader',
  'IPAdapterModelLoader',
  'IPAdapterAdvanced',
  'KSampler',
  'VAEDecode',
  'SaveImageWebsocket',
])

const AUTHORITY_BOUNDARY:
  LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationAuthority =
  deepFreeze({
    characterCanonicalReconciliationAuthority: true,
    canonicalRuntimeCompilerAuthority: false,
    canonicalContractMutationAuthority: false,
    toolRegistryAuthority: false,
    operationRegistryAuthority: false,
    providerAuthority: false,
    modelArtifactAuthority: false,
    inputArtifactAuthority: false,
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
    billingAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  })

export interface LivingFrameCharacterCanonicalComfyUiPrivateSlotBinding {
  readonly order: number
  readonly slotKind:
    LivingFrameCharacterControlledPreparationPrivateSlotKind
  readonly valueClass:
    | 'private_model_alias'
    | 'private_conditioning_text'
    | 'private_image_alias'
  readonly value: string
}

export interface LivingFrameCharacterCanonicalComfyUiPrivateInputImageBinding
  extends LivingFrameCharacterCanonicalComfyUiInputImageBinding {
  readonly privateAlias: string
}

export interface LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationPacket {
  readonly preparationDigestSha256: string
  readonly privatePromptMaterializationDigestSha256: string
  readonly approvedSnapshotId: string
  readonly approvedSnapshotHashSha256: string
  readonly approvedWorkGraphDigestSha256: string
  readonly currentMasterTimingDigestSha256: string
  readonly confirmedOutputFrameExpectationDigestSha256: string
  readonly sceneId: string
  readonly componentId: string
  readonly units: readonly {
    readonly order: number
    readonly preparationUnitId: string
    readonly preparationUnitDigestSha256: string
    readonly promptUnitId: string
    readonly promptRequestDigestSha256: string
    readonly sceneId: string
    readonly componentId: string
    readonly approvedWorkItemId: string
    readonly approvedWorkItemKey: string
    readonly approvedWorkItemHashSha256: string
    readonly outputKey: string
    readonly approvedPlannedAssetManifestEntryId: string
    readonly admissionDigestSha256: string
    readonly dispatch: {
      readonly dispatchIntentId: string
      readonly dispatchBindingHash: string
      readonly attemptPlanHash: string
      readonly runtimeRegion: 'europe-west1'
    }
    readonly modelSourceBindingDigests: readonly [
      string,
      string,
      string,
      string,
      string,
    ]
    readonly privateSlotBindings:
      readonly LivingFrameCharacterCanonicalComfyUiPrivateSlotBinding[]
    readonly inputImages:
      readonly LivingFrameCharacterCanonicalComfyUiPrivateInputImageBinding[]
  }[]
}

export interface LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationReader {
  readonly readerClass:
    'server_owned_single_use_character_canonical_comfyui_reconciliation_packet_reader'
  readonly read: (
    locatorId: string,
  ) => Promise<
    LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationPacket
  >
}

export interface ReconcileLivingFrameCharacterControlledPreparationCanonicalComfyUiInput {
  readonly reconciliationId: string
  readonly serverOwnedPacketLocatorId: string
  readonly preparation:
    LivingFrameCharacterControlledPreparation
  readonly preparationInput:
    CreateLivingFrameCharacterControlledPreparationInput
  readonly privatePromptReceipt:
    LivingFrameCharacterControlledPreparationPrivatePrompt
  readonly privatePromptRequestLeases:
    readonly LivingFrameCharacterControlledPreparationPrivatePromptLease[]
  readonly reader:
    LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationReader
}

const readers = new WeakSet<object>()
const consumedReaders = new WeakSet<object>()
const candidateLeases = new WeakSet<object>()
const consumedCandidateLeases = new WeakSet<object>()
const privateCandidateInputs = new WeakMap<
  object,
  LivingFrameCharacterCanonicalComfyUiV1CandidateInput
>()

export class LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationError
  extends Error {
  readonly issues:
    readonly LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationIssue[]

  constructor(
    issues:
      readonly LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationIssue[],
  ) {
    super(
      'Living Frame character controlled-preparation canonical ComfyUI reconciliation failed.',
    )
    this.name =
      'LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationError'
    this.issues = issues
  }
}

export function createLivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationReader(
  loader: (
    locatorId: string,
  ) => Promise<
    LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationPacket
  >,
): LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationReader {
  if (typeof loader !== 'function') throw invalid(
    'reader_invalid',
    '$.loader',
  )
  const reader:
    LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationReader = {
      readerClass:
        'server_owned_single_use_character_canonical_comfyui_reconciliation_packet_reader',
      read: loader,
    }
  readers.add(reader)
  return Object.freeze(reader)
}

export async function reconcileLivingFrameCharacterControlledPreparationCanonicalComfyUi(
  input:
    ReconcileLivingFrameCharacterControlledPreparationCanonicalComfyUiInput,
): Promise<
  LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationResult
> {
  assertInput(input)
  if (
    !await verifyLivingFrameCharacterControlledPreparation(
      input.preparation,
      input.preparationInput,
    )
  ) throw invalid('preparation_invalid', '$.preparation')
  if (
    !verifyLivingFrameCharacterControlledPreparationPrivatePrompt(
      input.privatePromptReceipt,
    )
  ) throw invalid(
    'private_prompt_receipt_invalid',
    '$.privatePromptReceipt',
  )
  assertSourceLineage(input)
  assertLeaseSet(input)
  if (!readers.has(input.reader)) throw invalid(
    'reader_invalid',
    '$.reader',
  )
  if (consumedReaders.has(input.reader)) throw invalid(
    'reader_reused',
    '$.reader',
  )
  consumedReaders.add(input.reader)

  let packet:
    LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationPacket
  try {
    packet = await input.reader.read(
      input.serverOwnedPacketLocatorId,
    )
  } catch {
    throw invalid('reader_failed', '$.reader')
  }
  assertPacket(packet, input)

  const units:
    LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationUnit[] =
    []
  const canonicalV1CandidateInputLeases:
    LivingFrameCharacterCanonicalComfyUiV1CandidateInputLease[] =
    []

  for (const preparationUnit of input.preparation.preparationUnits) {
    const promptReceipt =
      input.privatePromptReceipt.promptUnits.find((unit) =>
        unit.preparationUnitId ===
          preparationUnit.preparationUnitId)
    const privatePromptLease =
      input.privatePromptRequestLeases.find((lease) =>
        lease.preparationUnitId ===
          preparationUnit.preparationUnitId)
    const packetUnit = packet.units.find((unit) =>
      unit.preparationUnitId ===
        preparationUnit.preparationUnitId)
    if (!promptReceipt || !privatePromptLease || !packetUnit) {
      throw invalid('unit_set_invalid', '$.units')
    }
    assertUnitBinding(
      preparationUnit,
      promptReceipt,
      privatePromptLease,
      packetUnit,
    )
    let privateRequest:
      LivingFrameCharacterControlledPreparationPrivateComfyUiRequest
    try {
      privateRequest =
        consumeLivingFrameCharacterControlledPreparationPrivatePromptLease(
          privatePromptLease,
        )
    } catch (error) {
      if (
        error instanceof
          LivingFrameCharacterControlledPreparationPrivatePromptError
        && error.issues[0]?.code === 'lease_reused'
      ) throw invalid(
        'lease_reused',
        `$.privatePromptRequestLeases.${preparationUnit.preparationUnitId}`,
      )
      throw invalid(
        'lease_invalid',
        `$.privatePromptRequestLeases.${preparationUnit.preparationUnitId}`,
      )
    }
    if (
      sha256AuthorityValue(privateRequest) !==
        promptReceipt.privatePromptRequest
          .promptRequestDigestSha256
    ) throw invalid(
      'private_request_digest_mismatch',
      `$.units.${preparationUnit.preparationUnitId}`,
    )
    const canonicalGraph = remapPrivateGraph({
      privateRequest,
      promptReceiptSlots:
        promptReceipt.privatePromptRequest.slotReceipts,
      privateSlotBindings:
        packetUnit.privateSlotBindings,
    })
    if (
      preparationUnit.purpose ===
        'reconstruct_exposed_source_plate'
    ) {
      assertMaskedInpaintExtension({
        preparationUnit,
        privateRequest,
        canonicalGraph,
        inputImages: packetUnit.inputImages,
      })
      units.push(createBlockedMaskedInpaintUnit({
        preparationUnit,
        promptReceipt,
        packetUnit,
      }))
      continue
    }
    const candidateInput = createCanonicalV1CandidateInput({
      input,
      preparationUnit,
      privateRequest,
      packetUnit,
      canonicalGraph,
    })
    assertCanonicalV1CompatibleComponent({
      preparationUnit,
      privateRequest,
      candidateInput,
    })
    const candidateInputDigestSha256 =
      sha256AuthorityValue(candidateInput)
    const leaseId =
      `lf-character-canonical-v1.${sha256AuthorityValue({
        reconciliationId: input.reconciliationId,
        preparationUnitId:
          preparationUnit.preparationUnitId,
        candidateInputDigestSha256,
      }).slice(0, 40)}`
    const candidateLease:
      LivingFrameCharacterCanonicalComfyUiV1CandidateInputLease =
      Object.freeze({
        leaseClass:
          'process_bound_single_use_character_canonical_comfyui_v1_candidate_input_lease',
        leaseId,
        preparationUnitId:
          preparationUnit.preparationUnitId,
        candidateInputDigestSha256,
      })
    candidateLeases.add(candidateLease)
    privateCandidateInputs.set(
      candidateLease,
      deepFreeze(candidateInput),
    )
    canonicalV1CandidateInputLeases.push(candidateLease)
    units.push(createCompatibleUnit({
      preparationUnit,
      promptReceipt,
      packetUnit,
      leaseId,
      candidateInputDigestSha256,
    }))
  }

  const draft:
    LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationDraft =
    {
      contractVersion:
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_CANONICAL_COMFYUI_RECONCILIATION_VERSION,
      resultClass:
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_CANONICAL_COMFYUI_RECONCILIATION_CLASS,
      reconciliationState:
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_CANONICAL_COMFYUI_RECONCILIATION_STATE,
      reconciliationId: input.reconciliationId,
      serverOwnedPacketLocatorId:
        input.serverOwnedPacketLocatorId,
      canonicalScope:
        input.preparation.canonicalScope,
      sourceBindings: {
        preparationContractVersion:
          input.preparation.contractVersion,
        preparationDigestSha256:
          input.preparation.preparationDigestSha256,
        privatePromptContractVersion:
          input.privatePromptReceipt.contractVersion,
        privatePromptMaterializationDigestSha256:
          input.privatePromptReceipt
            .materializationDigestSha256,
        selectedSceneRequestBindingDigestSha256:
          input.preparation.sourceBindings
            .selectedSceneRequestBindingDigestSha256,
        approvedSnapshotId:
          input.preparation.sourceBindings.approvedSnapshotId,
        approvedSnapshotHashSha256:
          input.preparation.sourceBindings
            .approvedSnapshotHashSha256,
        approvedWorkGraphDigestSha256:
          input.preparation.sourceBindings
            .approvedWorkGraphDigestSha256,
        currentMasterTimingDigestSha256:
          input.preparation.sourceBindings
            .currentMasterTimingDigestSha256,
        confirmedOutputFrameExpectationDigestSha256:
          input.preparation.sourceBindings
            .confirmedOutputFrameExpectationDigestSha256,
      },
      observedCanonicalV1: {
        backendReferenceCommit: 'b6eb48277cbd',
        targetContractVersion:
          'canonical-comfyui-gpu-runtime-request-candidate-v1',
        typeFilePath:
          'server/model-artifacts/canonical-comfyui-gpu-runtime-request-types.ts',
        typeFileGitBlobSha1:
          '212ae080049cee583131f869a42beccb6e09bff2',
        typeFileSha256:
          'e127cdcf31872498b442bf9c1af834a6408ea2f56c862582b62f9dd436bec2b5',
        compilerFilePath:
          'server/model-artifacts/canonical-comfyui-gpu-runtime-request.ts',
        compilerFileGitBlobSha1:
          '20b6e7f5ab1ef228fd06ed92db2bac7de749b866',
        compilerFileSha256:
          '72b81aac5decd59cf7977fc75443c0e41fa7182732eae6b6eab769ae3d884043',
        emptyLatentOnly: true,
        maskedInpaintNodeAllowed: false,
        sourcePlateAndMaskSlotsAllowed: false,
      },
      reconciliationUnits: units,
      metrics: {
        preparationUnitCount: units.length,
        canonicalV1CompatibleUnitCount:
          units.filter((unit) =>
            unit.canonicalV1Compatibility.compatible).length,
        canonicalV1CandidateInputLeaseCount:
          canonicalV1CandidateInputLeases.length,
        maskedInpaintExtensionBlockedUnitCount:
          units.filter((unit) =>
            unit.maskedInpaintExtensionRequirement.required).length,
      },
      runtimeBoundary: {
        canonicalToolId: 'comfyui',
        canonicalOperationId:
          'tool.comfyui.generate_controlled_image.v1',
        registryExpansionCreatesNewIdentity: false,
        modelWeightsAdaptersLibrariesOrCapabilitiesCreateIdentity:
          false,
        exactFiveModelRolesShareOneAtomicReadOnlyMountLifetime:
          true,
        oneRequestOneSupervisedProcessOneImageOneAttemptOneCostEventPerOutput:
          true,
        fixedSupervisedEntrypointRequired: true,
        sam2ImportDenied: true,
        runtimeDownloadOrNetworkFetchAllowed: false,
        remotionOwnsFinalCanvas: true,
      },
      authorityBoundary: AUTHORITY_BOUNDARY,
      sourcePreparationRevalidated: true,
      sourcePrivatePromptRevalidated: true,
      canonicalV1ComponentCompatibilityProven: true,
      canonicalV1MaskedInpaintIncompatibilityProven: true,
      parallelCanonicalCompilerCreated: false,
      operationRegistered: false,
      dispatchGranted: false,
      workerLeaseCreated: false,
      gpuAttemptCreated: false,
      runtimeExecuted: false,
      actualCostReceiptCreated: false,
      assetCreated: false,
      qaApproved: false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  assertReceipt(draft)
  const receipt = deepFreeze({
    ...draft,
    reconciliationDigestSha256:
      sha256AuthorityValue(draft),
  })
  return deepFreeze({
    receipt,
    canonicalV1CandidateInputLeases,
  })
}

export function consumeLivingFrameCharacterCanonicalComfyUiV1CandidateInputLease(
  lease:
    LivingFrameCharacterCanonicalComfyUiV1CandidateInputLease,
): LivingFrameCharacterCanonicalComfyUiV1CandidateInput {
  if (!candidateLeases.has(lease)) throw invalid(
    'candidate_input_lease_invalid',
    '$.lease',
  )
  if (consumedCandidateLeases.has(lease)) throw invalid(
    'candidate_input_lease_reused',
    '$.lease',
  )
  const candidate = privateCandidateInputs.get(lease)
  if (!candidate) throw invalid(
    'candidate_input_lease_invalid',
    '$.lease',
  )
  consumedCandidateLeases.add(lease)
  privateCandidateInputs.delete(lease)
  return candidate
}

export function verifyLivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliation(
  value: unknown,
): value is
  LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliation {
  try {
    if (
      !isRecord(value)
      || value.contractVersion !==
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_CANONICAL_COMFYUI_RECONCILIATION_VERSION
      || value.resultClass !==
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_CANONICAL_COMFYUI_RECONCILIATION_CLASS
      || value.reconciliationState !==
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_CANONICAL_COMFYUI_RECONCILIATION_STATE
      || typeof value.reconciliationDigestSha256 !== 'string'
      || !SHA256.test(value.reconciliationDigestSha256)
    ) return false
    const {
      reconciliationDigestSha256,
      ...draft
    } = value
    if (
      reconciliationDigestSha256 !==
        sha256AuthorityValue(draft)
    ) return false
    assertReceipt(
      draft as unknown as
        LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationDraft,
    )
    return true
  } catch {
    return false
  }
}

function createCanonicalV1CandidateInput(input: {
  readonly input:
    ReconcileLivingFrameCharacterControlledPreparationCanonicalComfyUiInput
  readonly preparationUnit:
    LivingFrameCharacterControlledPreparationUnit
  readonly privateRequest:
    LivingFrameCharacterControlledPreparationPrivateComfyUiRequest
  readonly packetUnit:
    LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationPacket['units'][number]
  readonly canonicalGraph:
    LivingFrameCharacterCanonicalComfyUiPromptGraph
}): LivingFrameCharacterCanonicalComfyUiV1CandidateInput {
  const outputNodeId =
    Object.entries(input.canonicalGraph).find(([, node]) =>
      node.class_type === 'SaveImageWebsocket')?.[0]
  if (!outputNodeId) throw invalid(
    'canonical_v1_component_graph_mismatch',
    '$.prompt.outputNodeId',
  )
  return {
    admissionDigestSha256:
      input.packetUnit.admissionDigestSha256,
    dispatch: input.packetUnit.dispatch,
    selectedScene: {
      requestBindingId:
        input.input.preparationInput
          .selectedSceneRequest.requestBindingId,
      requestBindingDigestSha256:
        input.input.preparation.sourceBindings
          .selectedSceneRequestBindingDigestSha256,
      approvedSnapshotId:
        input.input.preparation.sourceBindings
          .approvedSnapshotId,
      approvedSnapshotHash:
        input.input.preparation.sourceBindings
          .approvedSnapshotHashSha256,
      workItemId:
        input.preparationUnit.approvedWorkItemId,
      workItemHash:
        input.packetUnit.approvedWorkItemHashSha256,
      outputKey:
        input.preparationUnit.outputKey,
      plannedAssetManifestEntryId:
        input.preparationUnit
          .approvedPlannedAssetManifestEntryId,
      confirmedOutputFrameExpectationDigestSha256:
        input.preparationUnit.generationCanvas
          .confirmedOutputFrameExpectationDigestSha256,
    },
    prompt: {
      graph: input.canonicalGraph,
      outputNodeId,
    },
    modelSourceBindingDigests:
      input.packetUnit.modelSourceBindingDigests,
    inputImages:
      input.packetUnit.inputImages.map(
        stripPrivateAlias,
      ),
    output: {
      canvasClass:
        input.preparationUnit.generationCanvas.canvasClass,
      width:
        input.privateRequest.widthPixels,
      height:
        input.privateRequest.heightPixels,
    },
  }
}

function createCompatibleUnit(input: {
  readonly preparationUnit:
    LivingFrameCharacterControlledPreparationUnit
  readonly promptReceipt:
    LivingFrameCharacterControlledPreparationPrivatePrompt['promptUnits'][number]
  readonly packetUnit:
    LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationPacket['units'][number]
  readonly leaseId: string
  readonly candidateInputDigestSha256: string
}): LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationUnit {
  return createUnit({
    ...input,
    disposition:
      'canonical_v1_candidate_input_lease_created',
    compatible: true,
    leaseId: input.leaseId,
    candidateInputDigestSha256:
      input.candidateInputDigestSha256,
    extensionRequired: false,
  })
}

function createBlockedMaskedInpaintUnit(input: {
  readonly preparationUnit:
    LivingFrameCharacterControlledPreparationUnit
  readonly promptReceipt:
    LivingFrameCharacterControlledPreparationPrivatePrompt['promptUnits'][number]
  readonly packetUnit:
    LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationPacket['units'][number]
}): LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationUnit {
  return createUnit({
    ...input,
    disposition:
      'canonical_v1_incompatible_masked_inpaint_extension_required',
    compatible: false,
    leaseId: null,
    candidateInputDigestSha256: null,
    extensionRequired: true,
  })
}

function createUnit(input: {
  readonly preparationUnit:
    LivingFrameCharacterControlledPreparationUnit
  readonly promptReceipt:
    LivingFrameCharacterControlledPreparationPrivatePrompt['promptUnits'][number]
  readonly packetUnit:
    LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationPacket['units'][number]
  readonly disposition:
    LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationUnit['disposition']
  readonly compatible: boolean
  readonly leaseId: string | null
  readonly candidateInputDigestSha256: string | null
  readonly extensionRequired: boolean
}): LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationUnit {
  const draft = {
    order: input.preparationUnit.order,
    preparationUnitId:
      input.preparationUnit.preparationUnitId,
    preparationUnitDigestSha256:
      input.preparationUnit.preparationUnitDigestSha256,
    promptUnitId: input.promptReceipt.promptUnitId,
    promptRequestDigestSha256:
      input.promptReceipt.privatePromptRequest
        .promptRequestDigestSha256,
    purpose: input.preparationUnit.purpose,
    sceneId: input.preparationUnit.sceneId,
    componentId: input.preparationUnit.componentId,
    approvedWorkItemId:
      input.preparationUnit.approvedWorkItemId,
    approvedWorkItemKey:
      input.preparationUnit.approvedWorkItemKey,
    approvedWorkItemHashSha256:
      input.packetUnit.approvedWorkItemHashSha256,
    outputKey: input.preparationUnit.outputKey,
    approvedPlannedAssetManifestEntryId:
      input.preparationUnit
        .approvedPlannedAssetManifestEntryId,
    confirmedOutputFrameExpectationDigestSha256:
      input.preparationUnit.generationCanvas
        .confirmedOutputFrameExpectationDigestSha256,
    graphFamily:
      input.preparationUnit.graphProfile.graphFamily,
    graphTopologyDigestSha256:
      input.promptReceipt.graphProfile
        .graphTopologyDigestSha256,
    inputImageBindingCount:
      input.packetUnit.inputImages.length,
    disposition: input.disposition,
    canonicalV1Compatibility: {
      targetContractVersion:
        'canonical-comfyui-gpu-runtime-request-candidate-v1',
      compatible: input.compatible,
      candidateInputLeaseCreated:
        input.leaseId !== null,
      exactEmptyLatentRequired: true,
      exactDenoiseOneRequired: true,
      acceptedInputSlotKinds: [
        'control_image_artifact',
        'reference_image_artifact',
      ] as const,
    },
    maskedInpaintExtensionRequirement: {
      required: input.extensionRequired,
      requestedTargetContractVersion:
        'canonical-comfyui-gpu-runtime-request-candidate-v2',
      sameCanonicalToolId: 'comfyui',
      sameCanonicalOperationId:
        'tool.comfyui.generate_controlled_image.v1',
      additionalNodeClass:
        'VAEEncodeForInpaint',
      additionalInputSlotKinds: [
        'source_plate_image_artifact',
        'source_plate_inpaint_mask_artifact',
      ] as const,
      sourcePlateFileName:
        'source-plate.png',
      sourcePlateMaskFileName:
        'source-plate-mask.png',
      growMaskBy: 6,
      samplerDenoise: 0.55,
      emptyLatentSubstitutionAllowed: false,
      arbitraryNodeOrSlotExpansionAllowed: false,
      canonicalOneWriterImplementationRequired:
        input.extensionRequired,
    },
    candidateInputReceipt: {
      leaseId: input.leaseId,
      candidateInputDigestSha256:
        input.candidateInputDigestSha256,
      promptGraphIncluded: false,
      conditioningTextIncluded: false,
      privateAliasesIncluded: false,
      pathUrlBytesCredentialsCommandOrEnvironmentIncluded:
        false,
    },
    operationRegistered: false,
    dispatched: false,
    gpuAttemptCreated: false,
    runtimeExecuted: false,
    actualCostReceiptCreated: false,
    assetCreated: false,
    qaApproved: false,
  } as const
  return deepFreeze({
    ...draft,
    unitDigestSha256:
      sha256AuthorityValue(draft),
  })
}

function remapPrivateGraph(input: {
  readonly privateRequest:
    LivingFrameCharacterControlledPreparationPrivateComfyUiRequest
  readonly promptReceiptSlots:
    readonly LivingFrameCharacterControlledPreparationPrivatePromptSlotReceipt[]
  readonly privateSlotBindings:
    readonly LivingFrameCharacterCanonicalComfyUiPrivateSlotBinding[]
}): LivingFrameCharacterCanonicalComfyUiPromptGraph {
  assertPrivateSlotBindings(
    input.promptReceiptSlots,
    input.privateSlotBindings,
  )
  const replacements = new Map<string, string>()
  for (const binding of input.privateSlotBindings) {
    if (binding.valueClass === 'private_conditioning_text') continue
    const target =
      binding.slotKind in CANONICAL_MODEL_ALIASES
        ? CANONICAL_MODEL_ALIASES[
            binding.slotKind as
              keyof typeof CANONICAL_MODEL_ALIASES
          ]
        : CANONICAL_IMAGE_ALIASES[
            binding.slotKind as
              keyof typeof CANONICAL_IMAGE_ALIASES
          ]
    if (typeof target !== 'string') throw invalid(
      'private_slot_binding_invalid',
      `$.privateSlotBindings.${binding.slotKind}`,
    )
    replacements.set(binding.value, target)
  }
  return deepFreeze(
    mapValue(
      input.privateRequest.prompt,
      replacements,
    ) as LivingFrameCharacterCanonicalComfyUiPromptGraph,
  )
}

function assertCanonicalV1CompatibleComponent(input: {
  readonly preparationUnit:
    LivingFrameCharacterControlledPreparationUnit
  readonly privateRequest:
    LivingFrameCharacterControlledPreparationPrivateComfyUiRequest
  readonly candidateInput:
    LivingFrameCharacterCanonicalComfyUiV1CandidateInput
}): void {
  const graph = input.candidateInput.prompt.graph
  const nodes = Object.values(graph)
  const classes = nodes.map((node) =>
    node.class_type)
  const latent = nodes.find((node) =>
    node.class_type === 'EmptyLatentImage')
  const sampler = nodes.find((node) =>
    node.class_type === 'KSampler')
  if (
    input.preparationUnit.purpose ===
      'reconstruct_exposed_source_plate'
    || input.privateRequest.widthPixels !== 1024
    || input.privateRequest.heightPixels !== 1024
    || input.candidateInput.output.canvasClass !==
      'isolated_component_square_1024'
    || input.candidateInput.output.width !== 1024
    || input.candidateInput.output.height !== 1024
    || classes.some((nodeClass) =>
      !CANONICAL_V1_ALLOWED_NODE_CLASSES.has(nodeClass))
    || classes.includes('VAEEncodeForInpaint')
    || classes.filter((nodeClass) =>
      nodeClass === 'EmptyLatentImage').length !== 1
    || latent?.inputs.width !== 1024
    || latent.inputs.height !== 1024
    || latent.inputs.batch_size !== 1
    || sampler?.inputs.denoise !== 1
    || classes.filter((nodeClass) =>
      nodeClass === 'SaveImageWebsocket').length !== 1
    || input.candidateInput.inputImages.some((image) =>
      image.slotKind !== 'control_image_artifact'
      && image.slotKind !== 'reference_image_artifact')
  ) throw invalid(
    'canonical_v1_component_graph_mismatch',
    `$.units.${input.preparationUnit.preparationUnitId}`,
  )
  assertPromptImageAliases(
    graph,
    input.candidateInput.inputImages,
  )
  assertCanonicalV1ExactTopology({
    graph,
    outputNodeId:
      input.candidateInput.prompt.outputNodeId,
    inputImages:
      input.candidateInput.inputImages,
    width: input.candidateInput.output.width,
    height: input.candidateInput.output.height,
  })
}

function assertCanonicalV1ExactTopology(input: {
  readonly graph:
    LivingFrameCharacterCanonicalComfyUiPromptGraph
  readonly outputNodeId: string
  readonly inputImages:
    readonly LivingFrameCharacterCanonicalComfyUiInputImageBinding[]
  readonly width: number
  readonly height: number
}): void {
  const nodeIds = Object.keys(input.graph)
  if (
    stable(nodeIds) !== stable(
      Array.from(
        { length: nodeIds.length },
        (_, index) => String(index + 1),
      ),
    )
  ) throw invalid(
    'canonical_v1_component_graph_mismatch',
    '$.prompt.nodeOrder',
  )
  let cursor = 1
  const base = String(cursor)
  requireExactNode(input.graph, base, 'CheckpointLoaderSimple', {
    ckpt_name:
      'sd_xl_base_1.0.safetensors',
  })
  cursor += 1

  let modelSource = base
  const usesLora =
    input.graph[String(cursor)]?.class_type === 'LoraLoader'
  if (usesLora) {
    modelSource = String(cursor)
    requireExactNode(input.graph, modelSource, 'LoraLoader', {
      model: [base, 0],
      clip: [base, 1],
      lora_name:
        'sd_xl_offset_example-lora_1.0.safetensors',
      strength_model: 0.7,
      strength_clip: 0.55,
    })
    cursor += 1
  }

  const positive = String(cursor)
  const positiveInputs =
    requireNode(input.graph, positive, 'CLIPTextEncode')
  assertTextConditioning(
    positiveInputs,
    modelSource,
  )
  cursor += 1

  const negative = String(cursor)
  const negativeInputs =
    requireNode(input.graph, negative, 'CLIPTextEncode')
  assertTextConditioning(
    negativeInputs,
    modelSource,
  )
  cursor += 1

  let positiveSource = positive
  let negativeSource = negative
  const usesControlNet =
    input.graph[String(cursor)]?.class_type ===
      'ControlNetLoader'
  if (usesControlNet) {
    const controlLoader = String(cursor)
    requireExactNode(
      input.graph,
      controlLoader,
      'ControlNetLoader',
      {
        control_net_name:
          'diffusion_pytorch_model.fp16.safetensors',
      },
    )
    cursor += 1
    const controlImage = String(cursor)
    requireExactNode(
      input.graph,
      controlImage,
      'LoadImage',
      { image: 'control-image.png' },
    )
    cursor += 1
    const controlApply = String(cursor)
    requireExactNode(
      input.graph,
      controlApply,
      'ControlNetApplyAdvanced',
      {
        positive: [positive, 0],
        negative: [negative, 0],
        control_net: [controlLoader, 0],
        image: [controlImage, 0],
        strength: usesLora ? 0.75 : 0.85,
        start_percent: usesLora ? 0.1 : 0,
        end_percent: usesLora ? 1 : 0.9,
      },
    )
    cursor += 1
    positiveSource = controlApply
    negativeSource = controlApply
  }

  const latent = String(cursor)
  requireExactNode(
    input.graph,
    latent,
    'EmptyLatentImage',
    {
      width: input.width,
      height: input.height,
      batch_size: 1,
    },
  )
  cursor += 1

  let finalModelSource = modelSource
  const usesIpAdapter =
    input.graph[String(cursor)]?.class_type ===
      'CLIPVisionLoader'
  if (usesIpAdapter) {
    const clipVision = String(cursor)
    requireExactNode(
      input.graph,
      clipVision,
      'CLIPVisionLoader',
      { clip_name: 'model.safetensors' },
    )
    cursor += 1
    const ipAdapterModel = String(cursor)
    requireExactNode(
      input.graph,
      ipAdapterModel,
      'IPAdapterModelLoader',
      {
        ipadapter_file:
          'ip-adapter_sdxl.safetensors',
      },
    )
    cursor += 1
    const referenceImage = String(cursor)
    requireExactNode(
      input.graph,
      referenceImage,
      'LoadImage',
      { image: 'reference-image.png' },
    )
    cursor += 1
    finalModelSource = String(cursor)
    requireExactNode(
      input.graph,
      finalModelSource,
      'IPAdapterAdvanced',
      {
        model: [modelSource, 0],
        ipadapter: [ipAdapterModel, 0],
        image: [referenceImage, 0],
        clip_vision: [clipVision, 0],
        weight: 0.85,
        weight_type: 'linear',
        combine_embeds: 'average',
        start_at: 0,
        end_at: 0.9,
        embeds_scaling: 'v_only',
      },
    )
    cursor += 1
  }

  const sampler = String(cursor)
  const samplerInputs =
    requireNode(input.graph, sampler, 'KSampler')
  if (
    stable(Object.keys(samplerInputs).sort()) !==
      stable([
        'cfg',
        'denoise',
        'latent_image',
        'model',
        'negative',
        'positive',
        'sampler_name',
        'scheduler',
        'seed',
        'steps',
      ])
    || stable(samplerInputs.model) !==
      stable([finalModelSource, 0])
    || stable(samplerInputs.positive) !==
      stable([positiveSource, 0])
    || stable(samplerInputs.negative) !==
      stable([
        negativeSource,
        usesControlNet ? 1 : 0,
      ])
    || stable(samplerInputs.latent_image) !==
      stable([latent, 0])
    || !Number.isSafeInteger(samplerInputs.seed)
    || Number(samplerInputs.seed) < 0
    || samplerInputs.steps !== 24
    || samplerInputs.cfg !== 5.5
    || samplerInputs.sampler_name !== 'dpmpp_2m'
    || samplerInputs.scheduler !== 'karras'
    || samplerInputs.denoise !== 1
  ) throw invalid(
    'canonical_v1_component_graph_mismatch',
    '$.prompt.sampler',
  )
  cursor += 1

  const vae = String(cursor)
  requireExactNode(
    input.graph,
    vae,
    'VAEDecode',
    {
      samples: [sampler, 0],
      vae: [base, 2],
    },
  )
  cursor += 1

  const output = String(cursor)
  requireExactNode(
    input.graph,
    output,
    'SaveImageWebsocket',
    { images: [vae, 0] },
  )
  cursor += 1
  if (
    cursor !== nodeIds.length + 1
    || input.outputNodeId !== output
  ) throw invalid(
    'canonical_v1_component_graph_mismatch',
    '$.prompt.output',
  )

  const expectedSlots: string[] = []
  if (usesControlNet) {
    expectedSlots.push('control_image_artifact')
  }
  if (usesIpAdapter) {
    expectedSlots.push('reference_image_artifact')
  }
  if (
    stable(input.inputImages.map((image) =>
      image.slotKind)) !==
      stable(expectedSlots)
  ) throw invalid(
    'canonical_v1_component_graph_mismatch',
    '$.inputImages.slotOrder',
  )
}

function assertTextConditioning(
  inputs: Readonly<Record<string, unknown>>,
  modelSource: string,
): void {
  if (
    stable(Object.keys(inputs).sort()) !==
      stable(['clip', 'text'])
    || typeof inputs.text !== 'string'
    || stable(inputs.clip) !==
      stable([modelSource, 1])
  ) throw invalid(
    'canonical_v1_component_graph_mismatch',
    '$.prompt.conditioning',
  )
}

function requireNode(
  graph:
    LivingFrameCharacterCanonicalComfyUiPromptGraph,
  nodeId: string,
  classType: string,
): Readonly<Record<string, unknown>> {
  const node = graph[nodeId]
  if (node?.class_type !== classType) throw invalid(
    'canonical_v1_component_graph_mismatch',
    `$.prompt.${nodeId}`,
  )
  return node.inputs
}

function requireExactNode(
  graph:
    LivingFrameCharacterCanonicalComfyUiPromptGraph,
  nodeId: string,
  classType: string,
  expectedInputs: Readonly<Record<string, unknown>>,
): void {
  const inputs =
    requireNode(graph, nodeId, classType)
  if (stable(inputs) !== stable(expectedInputs)) {
    throw invalid(
      'canonical_v1_component_graph_mismatch',
      `$.prompt.${nodeId}.inputs`,
    )
  }
}

function assertMaskedInpaintExtension(input: {
  readonly preparationUnit:
    LivingFrameCharacterControlledPreparationUnit
  readonly privateRequest:
    LivingFrameCharacterControlledPreparationPrivateComfyUiRequest
  readonly canonicalGraph:
    LivingFrameCharacterCanonicalComfyUiPromptGraph
  readonly inputImages:
    readonly LivingFrameCharacterCanonicalComfyUiPrivateInputImageBinding[]
}): void {
  const entries = Object.entries(input.canonicalGraph)
  const nodes = entries.map(([, node]) => node)
  const classes = nodes.map((node) =>
    node.class_type)
  const sourceEntry = entries.find(([, node]) =>
    node.class_type === 'LoadImage'
    && node.inputs.image === 'source-plate.png')
  const maskEntry = entries.find(([, node]) =>
    node.class_type === 'LoadImage'
    && node.inputs.image === 'source-plate-mask.png')
  const baseEntry = entries.find(([, node]) =>
    node.class_type === 'CheckpointLoaderSimple')
  const inpaint = nodes.find((node) =>
    node.class_type === 'VAEEncodeForInpaint')
  const sampler = nodes.find((node) =>
    node.class_type === 'KSampler')
  const sourceImage = input.inputImages.find((image) =>
    image.slotKind === 'source_plate_image_artifact')
  const maskImage = input.inputImages.find((image) =>
    image.slotKind ===
      'source_plate_inpaint_mask_artifact')
  if (
    classes.filter((nodeClass) =>
      nodeClass === 'VAEEncodeForInpaint').length !== 1
    || classes.includes('EmptyLatentImage')
    || !sourceEntry
    || !maskEntry
    || !baseEntry
    || !inpaint
    || stable(inpaint.inputs) !== stable({
      pixels: [sourceEntry[0], 0],
      vae: [baseEntry[0], 2],
      mask: [maskEntry[0], 1],
      grow_mask_by: 6,
    })
    || sampler?.inputs.denoise !== 0.55
    || input.privateRequest.widthPixels !==
      input.preparationUnit.generationCanvas.widthPixels
    || input.privateRequest.heightPixels !==
      input.preparationUnit.generationCanvas.heightPixels
    || !sourceImage
    || !maskImage
    || sourceImage.width !== input.privateRequest.widthPixels
    || sourceImage.height !== input.privateRequest.heightPixels
    || maskImage.width !== input.privateRequest.widthPixels
    || maskImage.height !== input.privateRequest.heightPixels
    || classes.filter((nodeClass) =>
      nodeClass === 'SaveImageWebsocket').length !== 1
  ) throw invalid(
    'masked_inpaint_extension_contract_mismatch',
    `$.units.${input.preparationUnit.preparationUnitId}`,
  )
  assertPromptImageAliases(
    input.canonicalGraph,
    input.inputImages,
  )
}

function assertPromptImageAliases(
  graph:
    LivingFrameCharacterCanonicalComfyUiPromptGraph,
  inputImages:
    readonly LivingFrameCharacterCanonicalComfyUiInputImageBinding[],
): void {
  const serialized = JSON.stringify(graph)
  for (const image of inputImages) {
    if (countOccurrences(serialized, image.fileName) !== 1) {
      throw invalid(
        'input_image_binding_invalid',
        `$.inputImages.${image.slotKind}`,
      )
    }
  }
  const expected = Object.values(graph).filter((node) =>
    node.class_type === 'LoadImage').length
  if (expected !== inputImages.length) throw invalid(
    'input_image_binding_invalid',
    '$.inputImages',
  )
}

function assertPrivateSlotBindings(
  receipts:
    readonly LivingFrameCharacterControlledPreparationPrivatePromptSlotReceipt[],
  bindings:
    readonly LivingFrameCharacterCanonicalComfyUiPrivateSlotBinding[],
): void {
  if (
    receipts.length !== bindings.length
    || new Set(bindings.map((binding) =>
      binding.slotKind)).size !== bindings.length
  ) throw invalid(
    'private_slot_binding_invalid',
    '$.privateSlotBindings',
  )
  for (const receipt of receipts) {
    const binding = bindings.find((candidate) =>
      candidate.slotKind === receipt.slotKind)
    if (
      !binding
      || binding.order !== receipt.order
      || binding.valueClass !== receipt.valueClass
      || sha256AuthorityValue(binding.value) !==
        receipt.valueDigestSha256
      || Buffer.byteLength(binding.value, 'utf8') !==
        receipt.valueByteLength
      || !isSafePrivateValue(binding)
      || Object.keys(binding).sort().join('|') !== [
        'order',
        'slotKind',
        'value',
        'valueClass',
      ].sort().join('|')
    ) throw invalid(
      'private_slot_binding_invalid',
      `$.privateSlotBindings.${receipt.slotKind}`,
    )
  }
}

function isSafePrivateValue(
  binding:
    LivingFrameCharacterCanonicalComfyUiPrivateSlotBinding,
): boolean {
  return (
    typeof binding.value === 'string'
    && binding.value.length > 0
    && Buffer.byteLength(binding.value, 'utf8') <= 16_384
    && !binding.value.includes('\0')
  )
}

function assertInput(
  input:
    ReconcileLivingFrameCharacterControlledPreparationCanonicalComfyUiInput,
): void {
  if (
    !isRecord(input)
    || !SAFE_ID.test(input.reconciliationId)
    || !SAFE_ID.test(input.serverOwnedPacketLocatorId)
    || Object.keys(input).sort().join('|') !== [
      'preparation',
      'preparationInput',
      'privatePromptReceipt',
      'privatePromptRequestLeases',
      'reader',
      'reconciliationId',
      'serverOwnedPacketLocatorId',
    ].sort().join('|')
  ) throw invalid('input_invalid', '$')
}

function assertSourceLineage(
  input:
    ReconcileLivingFrameCharacterControlledPreparationCanonicalComfyUiInput,
): void {
  const prompt = input.privatePromptReceipt
  const preparation = input.preparation
  if (
    prompt.sourceBindings.preparationDigestSha256 !==
      preparation.preparationDigestSha256
    || prompt.sourceBindings.approvedSnapshotId !==
      preparation.sourceBindings.approvedSnapshotId
    || prompt.sourceBindings.approvedSnapshotHashSha256 !==
      preparation.sourceBindings.approvedSnapshotHashSha256
    || prompt.sourceBindings.approvedWorkGraphDigestSha256 !==
      preparation.sourceBindings.approvedWorkGraphDigestSha256
    || prompt.sourceBindings.currentMasterTimingDigestSha256 !==
      preparation.sourceBindings.currentMasterTimingDigestSha256
    || prompt.sourceBindings
      .confirmedOutputFrameExpectationDigestSha256 !==
      preparation.sourceBindings
        .confirmedOutputFrameExpectationDigestSha256
    || prompt.canonicalScope.sceneId !==
      preparation.canonicalScope.sceneId
    || prompt.canonicalScope.componentId !==
      preparation.canonicalScope.componentId
  ) throw invalid(
    'source_lineage_mismatch',
    '$.sourceBindings',
  )
}

function assertLeaseSet(
  input:
    ReconcileLivingFrameCharacterControlledPreparationCanonicalComfyUiInput,
): void {
  if (
    input.privatePromptRequestLeases.length !==
      input.preparation.preparationUnits.length
    || new Set(
      input.privatePromptRequestLeases.map((lease) =>
        lease.preparationUnitId),
    ).size !== input.privatePromptRequestLeases.length
  ) throw invalid(
    'lease_set_invalid',
    '$.privatePromptRequestLeases',
  )
}

function assertPacket(
  packet: unknown,
  input:
    ReconcileLivingFrameCharacterControlledPreparationCanonicalComfyUiInput,
): asserts packet is
  LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationPacket {
  if (
    !isRecord(packet)
    || packet.preparationDigestSha256 !==
      input.preparation.preparationDigestSha256
    || packet.privatePromptMaterializationDigestSha256 !==
      input.privatePromptReceipt.materializationDigestSha256
    || packet.approvedSnapshotId !==
      input.preparation.sourceBindings.approvedSnapshotId
    || packet.approvedSnapshotHashSha256 !==
      input.preparation.sourceBindings.approvedSnapshotHashSha256
    || packet.approvedWorkGraphDigestSha256 !==
      input.preparation.sourceBindings.approvedWorkGraphDigestSha256
    || packet.currentMasterTimingDigestSha256 !==
      input.preparation.sourceBindings.currentMasterTimingDigestSha256
    || packet.confirmedOutputFrameExpectationDigestSha256 !==
      input.preparation.sourceBindings
        .confirmedOutputFrameExpectationDigestSha256
    || packet.sceneId !== input.preparation.canonicalScope.sceneId
    || packet.componentId !==
      input.preparation.canonicalScope.componentId
    || !Array.isArray(packet.units)
    || packet.units.length !==
      input.preparation.preparationUnits.length
    || Buffer.byteLength(JSON.stringify(packet), 'utf8') >
      MAX_INPUT_BYTES
    || Object.keys(packet).sort().join('|') !== [
      'approvedSnapshotHashSha256',
      'approvedSnapshotId',
      'approvedWorkGraphDigestSha256',
      'componentId',
      'confirmedOutputFrameExpectationDigestSha256',
      'currentMasterTimingDigestSha256',
      'preparationDigestSha256',
      'privatePromptMaterializationDigestSha256',
      'sceneId',
      'units',
    ].sort().join('|')
  ) throw invalid('packet_invalid', '$.packet')
}

function assertUnitBinding(
  preparationUnit:
    LivingFrameCharacterControlledPreparationUnit,
  promptReceipt:
    LivingFrameCharacterControlledPreparationPrivatePrompt['promptUnits'][number],
  lease:
    LivingFrameCharacterControlledPreparationPrivatePromptLease,
  packetUnit:
    LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationPacket['units'][number],
): void {
  if (
    promptReceipt.preparationUnitDigestSha256 !==
      preparationUnit.preparationUnitDigestSha256
    || promptReceipt.promptUnitId !== lease.promptUnitId
    || promptReceipt.privatePromptRequest
      .promptRequestDigestSha256 !==
      lease.promptRequestDigestSha256
    || packetUnit.order !== preparationUnit.order
    || packetUnit.preparationUnitDigestSha256 !==
      preparationUnit.preparationUnitDigestSha256
    || packetUnit.promptUnitId !== promptReceipt.promptUnitId
    || packetUnit.promptRequestDigestSha256 !==
      lease.promptRequestDigestSha256
    || packetUnit.sceneId !== preparationUnit.sceneId
    || packetUnit.componentId !== preparationUnit.componentId
    || packetUnit.approvedWorkItemId !==
      preparationUnit.approvedWorkItemId
    || packetUnit.approvedWorkItemKey !==
      preparationUnit.approvedWorkItemKey
    || packetUnit.outputKey !== preparationUnit.outputKey
    || packetUnit.approvedPlannedAssetManifestEntryId !==
      preparationUnit.approvedPlannedAssetManifestEntryId
    || !SHA256.test(packetUnit.approvedWorkItemHashSha256)
    || !SHA256.test(packetUnit.admissionDigestSha256)
    || !validDispatch(packetUnit.dispatch)
    || packetUnit.modelSourceBindingDigests.length !== 5
    || packetUnit.modelSourceBindingDigests.some((digest) =>
      !SHA256.test(digest))
    || Object.keys(packetUnit).sort().join('|') !== [
      'admissionDigestSha256',
      'approvedPlannedAssetManifestEntryId',
      'approvedWorkItemHashSha256',
      'approvedWorkItemId',
      'approvedWorkItemKey',
      'componentId',
      'dispatch',
      'inputImages',
      'modelSourceBindingDigests',
      'order',
      'outputKey',
      'preparationUnitDigestSha256',
      'preparationUnitId',
      'privateSlotBindings',
      'promptRequestDigestSha256',
      'promptUnitId',
      'sceneId',
    ].sort().join('|')
  ) throw invalid(
    'cross_scene_work_item_or_output_substitution',
    `$.units.${preparationUnit.preparationUnitId}`,
  )
  assertInputImages(
    preparationUnit,
    packetUnit.inputImages,
    packetUnit.privateSlotBindings,
  )
}

function assertInputImages(
  preparationUnit:
    LivingFrameCharacterControlledPreparationUnit,
  images:
    readonly LivingFrameCharacterCanonicalComfyUiPrivateInputImageBinding[],
  privateSlotBindings:
    readonly LivingFrameCharacterCanonicalComfyUiPrivateSlotBinding[],
): void {
  const expectedSlots =
    preparationUnit.graphProfile.requiredPrivateSlotKinds
      .filter(isInputImageSlotKind)
  if (
    images.length !== expectedSlots.length
    || new Set(images.map((image) =>
      image.slotKind)).size !== images.length
  ) throw invalid(
    'input_image_binding_invalid',
    `$.units.${preparationUnit.preparationUnitId}.inputImages`,
  )
  for (const [order, slotKind] of expectedSlots.entries()) {
    const image = images.find((candidate) =>
      candidate.slotKind === slotKind)
    const privateSlot = privateSlotBindings.find(
      (candidate) =>
        candidate.slotKind === slotKind,
    )
    if (
      !image
      || !privateSlot
      || image.canonicalOrder !== order
      || image.fileName !==
        CANONICAL_IMAGE_ALIASES[slotKind]
      || image.privateAlias !== privateSlot.value
      || !SAFE_ID.test(image.artifactId)
      || !SHA256.test(image.contentSha256)
      || !SHA256.test(image.sourceBindingDigestSha256)
      || !Number.isSafeInteger(image.byteLength)
      || image.byteLength <= 0
      || !Number.isSafeInteger(image.width)
      || !Number.isSafeInteger(image.height)
      || image.width <= 0
      || image.height <= 0
      || image.width > 4096
      || image.height > 4096
      || image.readOnlyMountRequired !== true
      || typeof image.privateAlias !== 'string'
      || image.privateAlias.length === 0
      || Object.keys(image).sort().join('|') !== [
        'artifactId',
        'byteLength',
        'canonicalOrder',
        'contentSha256',
        'fileName',
        'height',
        'privateAlias',
        'readOnlyMountRequired',
        'slotKind',
        'sourceBindingDigestSha256',
        'width',
      ].sort().join('|')
    ) throw invalid(
      'input_image_binding_invalid',
      `$.units.${preparationUnit.preparationUnitId}.inputImages.${slotKind}`,
    )
  }
}

function assertReceipt(
  draft:
    LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationDraft,
): void {
  const compatible =
    draft.reconciliationUnits.filter((unit) =>
      unit.canonicalV1Compatibility.compatible)
  const blocked =
    draft.reconciliationUnits.filter((unit) =>
      unit.maskedInpaintExtensionRequirement.required)
  if (
    draft.reconciliationUnits.length !== 2
    || compatible.length !== 1
    || blocked.length !== 1
    || draft.metrics.preparationUnitCount !== 2
    || draft.metrics.canonicalV1CompatibleUnitCount !== 1
    || draft.metrics.canonicalV1CandidateInputLeaseCount !== 1
    || draft.metrics.maskedInpaintExtensionBlockedUnitCount !== 1
    || compatible[0]?.purpose !==
      'prepare_clean_isolated_component'
    || blocked[0]?.purpose !==
      'reconstruct_exposed_source_plate'
    || blocked[0]?.candidateInputReceipt.leaseId !== null
    || blocked[0]?.candidateInputReceipt
      .candidateInputDigestSha256 !== null
    || compatible[0]?.candidateInputReceipt.leaseId === null
    || draft.observedCanonicalV1.maskedInpaintNodeAllowed
    || draft.observedCanonicalV1.sourcePlateAndMaskSlotsAllowed
    || draft.parallelCanonicalCompilerCreated
    || draft.operationRegistered
    || draft.dispatchGranted
    || draft.workerLeaseCreated
    || draft.gpuAttemptCreated
    || draft.runtimeExecuted
    || draft.actualCostReceiptCreated
    || draft.assetCreated
    || draft.qaApproved
    || draft.publicDeliveryReady
    || draft.productionReady
    || draft.reconciliationUnits.some((unit) =>
      unit.operationRegistered
      || unit.dispatched
      || unit.gpuAttemptCreated
      || unit.runtimeExecuted
      || unit.actualCostReceiptCreated
      || unit.assetCreated
      || unit.qaApproved)
    || stable(draft.authorityBoundary) !==
      stable(AUTHORITY_BOUNDARY)
    || stable(draft.observedCanonicalV1) !==
      stable({
        backendReferenceCommit: 'b6eb48277cbd',
        targetContractVersion:
          'canonical-comfyui-gpu-runtime-request-candidate-v1',
        typeFilePath:
          'server/model-artifacts/canonical-comfyui-gpu-runtime-request-types.ts',
        typeFileGitBlobSha1:
          '212ae080049cee583131f869a42beccb6e09bff2',
        typeFileSha256:
          'e127cdcf31872498b442bf9c1af834a6408ea2f56c862582b62f9dd436bec2b5',
        compilerFilePath:
          'server/model-artifacts/canonical-comfyui-gpu-runtime-request.ts',
        compilerFileGitBlobSha1:
          '20b6e7f5ab1ef228fd06ed92db2bac7de749b866',
        compilerFileSha256:
          '72b81aac5decd59cf7977fc75443c0e41fa7182732eae6b6eab769ae3d884043',
        emptyLatentOnly: true,
        maskedInpaintNodeAllowed: false,
        sourcePlateAndMaskSlotsAllowed: false,
      })
    || stable(draft.runtimeBoundary) !==
      stable({
        canonicalToolId: 'comfyui',
        canonicalOperationId:
          'tool.comfyui.generate_controlled_image.v1',
        registryExpansionCreatesNewIdentity: false,
        modelWeightsAdaptersLibrariesOrCapabilitiesCreateIdentity:
          false,
        exactFiveModelRolesShareOneAtomicReadOnlyMountLifetime:
          true,
        oneRequestOneSupervisedProcessOneImageOneAttemptOneCostEventPerOutput:
          true,
        fixedSupervisedEntrypointRequired: true,
        sam2ImportDenied: true,
        runtimeDownloadOrNetworkFetchAllowed: false,
        remotionOwnsFinalCanvas: true,
      })
    || draft.reconciliationUnits.some((unit) =>
      !validReconciliationUnit(unit))
  ) throw invalid(
    'authority_promotion_forbidden',
    '$',
  )
  const serialized = JSON.stringify(draft)
  const forbidden = [
    'private-base.safetensors',
    'private-controlnet.safetensors',
    'private-lora.safetensors',
    'private-ipadapter.safetensors',
    'private-clipvision.safetensors',
    'private-source-plate.png',
    'private-inpaint-mask.png',
    'reconstruct only the hidden plate',
  ]
  if (forbidden.some((value) =>
    serialized.includes(value))) throw invalid(
    'unsafe_receipt_forbidden',
    '$',
  )
}

function validReconciliationUnit(
  unit:
    LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationUnit,
): boolean {
  const {
    unitDigestSha256,
    ...draft
  } = unit
  const isPlate =
    unit.purpose ===
      'reconstruct_exposed_source_plate'
  const isComponent =
    unit.purpose ===
      'prepare_clean_isolated_component'
  return (
    SHA256.test(unitDigestSha256)
    && unitDigestSha256 ===
      sha256AuthorityValue(draft)
    && (
      isPlate
      || isComponent
    )
    && unit.canonicalV1Compatibility
      .targetContractVersion ===
        'canonical-comfyui-gpu-runtime-request-candidate-v1'
    && unit.canonicalV1Compatibility
      .exactEmptyLatentRequired === true
    && unit.canonicalV1Compatibility
      .exactDenoiseOneRequired === true
    && stable(
      unit.canonicalV1Compatibility
        .acceptedInputSlotKinds,
    ) === stable([
      'control_image_artifact',
      'reference_image_artifact',
    ])
    && unit.maskedInpaintExtensionRequirement
      .requestedTargetContractVersion ===
        'canonical-comfyui-gpu-runtime-request-candidate-v2'
    && unit.maskedInpaintExtensionRequirement
      .sameCanonicalToolId === 'comfyui'
    && unit.maskedInpaintExtensionRequirement
      .sameCanonicalOperationId ===
        'tool.comfyui.generate_controlled_image.v1'
    && unit.maskedInpaintExtensionRequirement
      .additionalNodeClass ===
        'VAEEncodeForInpaint'
    && stable(
      unit.maskedInpaintExtensionRequirement
        .additionalInputSlotKinds,
    ) === stable([
      'source_plate_image_artifact',
      'source_plate_inpaint_mask_artifact',
    ])
    && unit.maskedInpaintExtensionRequirement
      .sourcePlateFileName ===
        'source-plate.png'
    && unit.maskedInpaintExtensionRequirement
      .sourcePlateMaskFileName ===
        'source-plate-mask.png'
    && unit.maskedInpaintExtensionRequirement
      .growMaskBy === 6
    && unit.maskedInpaintExtensionRequirement
      .samplerDenoise === 0.55
    && unit.maskedInpaintExtensionRequirement
      .emptyLatentSubstitutionAllowed === false
    && unit.maskedInpaintExtensionRequirement
      .arbitraryNodeOrSlotExpansionAllowed === false
    && unit.candidateInputReceipt.promptGraphIncluded ===
      false
    && unit.candidateInputReceipt.conditioningTextIncluded ===
      false
    && unit.candidateInputReceipt.privateAliasesIncluded ===
      false
    && unit.candidateInputReceipt
      .pathUrlBytesCredentialsCommandOrEnvironmentIncluded ===
        false
    && (
      isPlate
        ? (
            unit.disposition ===
              'canonical_v1_incompatible_masked_inpaint_extension_required'
            && unit.canonicalV1Compatibility.compatible ===
              false
            && unit.canonicalV1Compatibility
              .candidateInputLeaseCreated === false
            && unit.maskedInpaintExtensionRequirement
              .required === true
            && unit.maskedInpaintExtensionRequirement
              .canonicalOneWriterImplementationRequired ===
                true
            && unit.candidateInputReceipt.leaseId === null
            && unit.candidateInputReceipt
              .candidateInputDigestSha256 === null
          )
        : (
            unit.disposition ===
              'canonical_v1_candidate_input_lease_created'
            && unit.canonicalV1Compatibility.compatible ===
              true
            && unit.canonicalV1Compatibility
              .candidateInputLeaseCreated === true
            && unit.maskedInpaintExtensionRequirement
              .required === false
            && unit.maskedInpaintExtensionRequirement
              .canonicalOneWriterImplementationRequired ===
                false
            && typeof unit.candidateInputReceipt.leaseId ===
              'string'
            && SAFE_ID.test(
              unit.candidateInputReceipt.leaseId,
            )
            && typeof unit.candidateInputReceipt
              .candidateInputDigestSha256 === 'string'
            && SHA256.test(
              unit.candidateInputReceipt
                .candidateInputDigestSha256,
            )
          )
    )
  )
}

function stripPrivateAlias(
  image:
    LivingFrameCharacterCanonicalComfyUiPrivateInputImageBinding,
): LivingFrameCharacterCanonicalComfyUiInputImageBinding {
  return {
    canonicalOrder: image.canonicalOrder,
    slotKind: image.slotKind,
    fileName: image.fileName,
    artifactId: image.artifactId,
    contentSha256: image.contentSha256,
    byteLength: image.byteLength,
    width: image.width,
    height: image.height,
    sourceBindingDigestSha256:
      image.sourceBindingDigestSha256,
    readOnlyMountRequired:
      image.readOnlyMountRequired,
  }
}

function isInputImageSlotKind(
  value:
    LivingFrameCharacterControlledPreparationPrivateSlotKind,
): value is
  LivingFrameCharacterCanonicalComfyUiInputImageSlotKind {
  return value in CANONICAL_IMAGE_ALIASES
}

function mapValue(
  value: unknown,
  replacements: ReadonlyMap<string, string>,
): unknown {
  if (typeof value === 'string') {
    return replacements.get(value) ?? value
  }
  if (Array.isArray(value)) {
    return value.map((nested) =>
      mapValue(nested, replacements))
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        mapValue(nested, replacements),
      ]),
    )
  }
  return value
}

function validDispatch(
  value: unknown,
): value is {
  readonly dispatchIntentId: string
  readonly dispatchBindingHash: string
  readonly attemptPlanHash: string
  readonly runtimeRegion: 'europe-west1'
} {
  return (
    isRecord(value)
    && SAFE_ID.test(String(value.dispatchIntentId))
    && SHA256.test(String(value.dispatchBindingHash))
    && SHA256.test(String(value.attemptPlanHash))
    && value.runtimeRegion === 'europe-west1'
    && Object.keys(value).sort().join('|') === [
      'attemptPlanHash',
      'dispatchBindingHash',
      'dispatchIntentId',
      'runtimeRegion',
    ].sort().join('|')
  )
}

function countOccurrences(
  input: string,
  value: string,
): number {
  if (value.length === 0) return 0
  return input.split(value).length - 1
}

function stable(value: unknown): string {
  return JSON.stringify(sortValue(value))
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue)
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [
        key,
        sortValue(value[key]),
      ]),
    )
  }
  return value
}

function invalid(
  code:
    LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationIssueCode,
  path: string,
): LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationError {
  return new LivingFrameCharacterControlledPreparationCanonicalComfyUiReconciliationError([{
    code,
    path,
  }])
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null
    && typeof value === 'object'
    && !Array.isArray(value)
  )
}

function deepFreeze<T>(value: T): T {
  if (
    value !== null
    && typeof value === 'object'
    && !Object.isFrozen(value)
  ) {
    Object.freeze(value)
    for (const nested of Object.values(value)) {
      deepFreeze(nested)
    }
  }
  return value
}
