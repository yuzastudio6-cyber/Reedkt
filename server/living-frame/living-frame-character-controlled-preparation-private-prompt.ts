import {
  LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_PROMPT_CLASS,
  LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_PROMPT_STATE,
  LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_PROMPT_VERSION,
  type LivingFrameCharacterControlledPreparationPrivatePrompt,
  type LivingFrameCharacterControlledPreparationPrivatePromptAuthority,
  type LivingFrameCharacterControlledPreparationPrivatePromptDraft,
  type LivingFrameCharacterControlledPreparationPrivatePromptIssue,
  type LivingFrameCharacterControlledPreparationPrivatePromptIssueCode,
  type LivingFrameCharacterControlledPreparationPrivatePromptSlotReceipt,
  type LivingFrameCharacterControlledPreparationPrivatePromptUnit,
} from '../../src/types/living-frame-character-controlled-preparation-private-prompt'
import type {
  LivingFrameCharacterControlledPreparation,
  LivingFrameCharacterControlledPreparationGraphNodeClass,
  LivingFrameCharacterControlledPreparationPrivateSlotKind,
  LivingFrameCharacterControlledPreparationUnit,
} from '../../src/types/living-frame-character-controlled-preparation'
import {
  sha256AuthorityValue,
} from '../services/private-edit-authority-store'
import {
  LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256,
} from './living-frame-controlled-sdxl-comfyui-canonical-mount-host-session'
import {
  type CreateLivingFrameCharacterControlledPreparationInput,
  verifyLivingFrameCharacterControlledPreparation,
} from './living-frame-character-controlled-preparation'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const REGISTERED_READERS = new WeakSet<object>()
const CONSUMED_READERS = new WeakSet<object>()
const LEASE_STATES = new WeakMap<
  object,
  {
    consumed: boolean
    request:
      LivingFrameCharacterControlledPreparationPrivateComfyUiRequest
  }
>()

const AUTHORITY_BOUNDARY:
  LivingFrameCharacterControlledPreparationPrivatePromptAuthority =
  deepFreeze({
    privatePromptMaterializationAuthority: true,
    characterPreparationProjectionAuthority: false,
    selectedSceneAuthority: false,
    promptPlanningAuthority: false,
    outputFrameAuthority: false,
    timingAuthority: false,
    approvalAuthority: false,
    approvedWorkItemMutationAuthority: false,
    workGraphMutationAuthority: false,
    operationRegistryAuthority: false,
    dispatchAuthority: false,
    runtimeAuthority: false,
    actualCostAuthority: false,
    artifactPersistenceAuthority: false,
    assetManifestAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    billingAuthority: false,
    publicDeliveryAuthority: false,
    productionAuthority: false,
  })

type JsonPrimitive = string | number | boolean | null
type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue }

export interface LivingFrameCharacterControlledPreparationResolvedPrivateSlot {
  readonly order: number
  readonly slotKind:
    LivingFrameCharacterControlledPreparationPrivateSlotKind
  readonly valueClass:
    | 'private_model_alias'
    | 'private_conditioning_text'
    | 'private_image_alias'
  readonly value: string
}

export interface LivingFrameCharacterControlledPreparationPrivatePromptPacket {
  readonly preparationDigestSha256: string
  readonly approvedSnapshotId: string
  readonly approvedSnapshotHashSha256: string
  readonly sceneId: string
  readonly componentId: string
  readonly units: readonly {
    readonly order: number
    readonly preparationUnitId: string
    readonly preparationUnitDigestSha256: string
    readonly sceneId: string
    readonly componentId: string
    readonly approvedWorkItemId: string
    readonly approvedWorkItemKey: string
    readonly approvedPlannedAssetManifestEntryId: string
    readonly outputKey: string
    readonly resolvedSlots:
      readonly LivingFrameCharacterControlledPreparationResolvedPrivateSlot[]
  }[]
}

export interface LivingFrameCharacterControlledPreparationPrivatePromptReader {
  readonly readerClass:
    'server_owned_single_use_character_preparation_packet_reader'
  readonly read: (
    locatorId: string,
  ) => Promise<
    LivingFrameCharacterControlledPreparationPrivatePromptPacket
  >
}

export interface LivingFrameCharacterControlledPreparationPrivatePromptNode {
  readonly class_type:
    LivingFrameCharacterControlledPreparationGraphNodeClass
  readonly inputs: Readonly<Record<string, JsonValue>>
}

export interface LivingFrameCharacterControlledPreparationPrivateComfyUiRequest {
  readonly contractVersion:
    'living-frame-character-controlled-preparation-private-comfyui-request-v1'
  readonly requestClass:
    'server_private_single_character_preparation_comfyui_request'
  readonly promptUnitId: string
  readonly preparationUnitId: string
  readonly approvedWorkItemId: string
  readonly approvedWorkItemKey: string
  readonly outputKey: string
  readonly widthPixels: number
  readonly heightPixels: number
  readonly prompt: Readonly<
    Record<
      string,
      LivingFrameCharacterControlledPreparationPrivatePromptNode
    >
  >
  readonly outputImageCount: 1
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly finalCanvasAuthority: false
  readonly productionReady: false
}

export interface LivingFrameCharacterControlledPreparationPrivatePromptLease {
  readonly leaseClass:
    'process_bound_single_use_character_preparation_prompt_lease'
  readonly leaseId: string
  readonly promptUnitId: string
  readonly preparationUnitId: string
  readonly promptRequestDigestSha256: string
}

export interface MaterializeLivingFrameCharacterControlledPreparationPrivatePromptInput {
  readonly materializationBatchId: string
  readonly serverOwnedPacketLocatorId: string
  readonly preparation:
    LivingFrameCharacterControlledPreparation
  readonly preparationInput:
    CreateLivingFrameCharacterControlledPreparationInput
  readonly reader:
    LivingFrameCharacterControlledPreparationPrivatePromptReader
}

export interface MaterializeLivingFrameCharacterControlledPreparationPrivatePromptResult {
  readonly receipt:
    LivingFrameCharacterControlledPreparationPrivatePrompt
  readonly privatePromptRequestLeases:
    readonly LivingFrameCharacterControlledPreparationPrivatePromptLease[]
}

export class
LivingFrameCharacterControlledPreparationPrivatePromptError
  extends Error {
  readonly issues:
    readonly LivingFrameCharacterControlledPreparationPrivatePromptIssue[]

  constructor(
    issues:
      readonly LivingFrameCharacterControlledPreparationPrivatePromptIssue[],
  ) {
    super(
      'Living Frame character controlled-preparation private prompt materialization failed.',
    )
    this.name =
      'LivingFrameCharacterControlledPreparationPrivatePromptError'
    this.issues = issues
  }
}

export function
createLivingFrameCharacterControlledPreparationPrivatePromptReader(
  loader: (
    locatorId: string,
  ) => Promise<
    LivingFrameCharacterControlledPreparationPrivatePromptPacket
  >,
): LivingFrameCharacterControlledPreparationPrivatePromptReader {
  if (typeof loader !== 'function') throw invalid(
    'reader_invalid',
    '$.loader',
  )
  const reader:
    LivingFrameCharacterControlledPreparationPrivatePromptReader = {
      readerClass:
        'server_owned_single_use_character_preparation_packet_reader',
      read: loader,
    }
  REGISTERED_READERS.add(reader)
  return Object.freeze(reader)
}

export async function
materializeLivingFrameCharacterControlledPreparationPrivatePrompt(
  input:
    MaterializeLivingFrameCharacterControlledPreparationPrivatePromptInput,
): Promise<MaterializeLivingFrameCharacterControlledPreparationPrivatePromptResult> {
  assertInput(input)
  if (
    !await verifyLivingFrameCharacterControlledPreparation(
      input.preparation,
      input.preparationInput,
    )
  ) throw invalid(
    'preparation_candidate_invalid',
    '$.preparation',
  )
  if (!REGISTERED_READERS.has(input.reader)) throw invalid(
    'reader_invalid',
    '$.reader',
  )
  if (CONSUMED_READERS.has(input.reader)) throw invalid(
    'reader_reused',
    '$.reader',
  )
  CONSUMED_READERS.add(input.reader)

  let packet:
    LivingFrameCharacterControlledPreparationPrivatePromptPacket
  try {
    packet = await input.reader.read(
      input.serverOwnedPacketLocatorId,
    )
  } catch {
    throw invalid('reader_failed', '$.reader')
  }
  assertPacket(packet, input.preparation)
  const privatePacketDigestSha256 =
    sha256AuthorityValue(packet)
  const promptUnits:
    LivingFrameCharacterControlledPreparationPrivatePromptUnit[] =
    []
  const leases:
    LivingFrameCharacterControlledPreparationPrivatePromptLease[] =
    []

  for (
    const preparationUnit of
      input.preparation.preparationUnits
  ) {
    const packetUnit = packet.units.find((unit) =>
      unit.preparationUnitId ===
        preparationUnit.preparationUnitId)
    if (!packetUnit) throw invalid(
      'unit_set_invalid',
      '$.packet.units',
    )
    const materialized = materializeUnit({
      materializationBatchId:
        input.materializationBatchId,
      preparationUnit,
      packetUnit,
    })
    promptUnits.push(materialized.receipt)
    leases.push(materialized.lease)
  }

  const draft:
    LivingFrameCharacterControlledPreparationPrivatePromptDraft = {
      contractVersion:
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_PROMPT_VERSION,
      resultClass:
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_PROMPT_CLASS,
      materializationState:
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_PROMPT_STATE,
      materializationBatchId:
        input.materializationBatchId,
      serverOwnedPacketLocatorId:
        input.serverOwnedPacketLocatorId,
      canonicalScope:
        input.preparation.canonicalScope,
      sourceBindings: {
        preparationContractVersion:
          input.preparation.contractVersion,
        preparationDigestSha256:
          input.preparation.preparationDigestSha256,
        characterRouteDecisionDigestSha256:
          input.preparation.sourceBindings
            .characterRouteDecisionDigestSha256,
        selectedSceneRequestBindingDigestSha256:
          input.preparation.sourceBindings
            .selectedSceneRequestBindingDigestSha256,
        fullFrameRatioExtensionDigestSha256:
          input.preparation.sourceBindings
            .fullFrameRatioExtensionDigestSha256,
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
        privatePacketDigestSha256,
      },
      promptUnits,
      metrics: {
        preparationUnitCount:
          input.preparation.preparationUnits.length,
        promptUnitCount: promptUnits.length,
        privateLeaseCount: leases.length,
        maskedInpaintPromptCount:
          promptUnits.filter((unit) =>
            unit.purpose ===
              'reconstruct_exposed_source_plate').length,
        isolatedComponentPromptCount:
          promptUnits.filter((unit) =>
            unit.purpose ===
              'prepare_clean_isolated_component').length,
        anchorKeyposePromptCount:
          promptUnits.filter((unit) =>
            unit.purpose ===
              'generate_controlled_anchor_keypose').length,
        totalPromptNodeCount:
          promptUnits.reduce((sum, unit) =>
            sum + unit.privatePromptRequest.nodeCount, 0),
        totalPrivateSlotCount:
          promptUnits.reduce((sum, unit) =>
            sum +
              unit.privatePromptRequest.slotReceipts.length, 0),
      },
      runtimeBoundary: {
        canonicalToolId: 'comfyui',
        canonicalOperationId:
          'tool.comfyui.generate_controlled_image.v1',
        oneComfyUiIdentityAndOneAttemptCostEventPerOutput:
          true,
        weightsAdaptersLibrariesOrPreprocessorsCreateToolIdentity:
          false,
        exactFiveModelRolesShareOneAtomicReadOnlyMountLifetime:
          true,
        fixedSupervisedEntrypointRequired:
          true,
        sam2ImportDenied: true,
        noRuntimeDownloadOrNetworkFetch:
          true,
      },
      authorityBoundary:
        AUTHORITY_BOUNDARY,
      preparationCandidateRevalidated: true,
      onePromptUnitPerPreparationUnit: true,
      processBoundSingleUsePromptLeasesCreated: true,
      sourceAndMaskValuesExcludedFromReceipt: true,
      callerSeedDimensionsPromptModelPathUrlBytesCredentialCommandOrEnvironmentAllowed:
        false,
      operationRegistered: false,
      dispatchGranted: false,
      workerLeaseCreated: false,
      runtimeExecuted: false,
      actualCostReceiptCreated: false,
      assetCreated: false,
      qaApproved: false,
      finalCanvasClaimAllowed: false,
      publicDeliveryReady: false,
      productionReady: false,
    }
  assertReceipt(draft)
  const receipt = deepFreeze({
    ...draft,
    materializationDigestSha256:
      sha256AuthorityValue(draft),
  })
  return deepFreeze({
    receipt,
    privatePromptRequestLeases: leases,
  })
}

export function
consumeLivingFrameCharacterControlledPreparationPrivatePromptLease(
  lease:
    LivingFrameCharacterControlledPreparationPrivatePromptLease,
): LivingFrameCharacterControlledPreparationPrivateComfyUiRequest {
  const state = LEASE_STATES.get(lease)
  if (!state) throw invalid(
    'lease_invalid',
    '$.lease',
  )
  if (state.consumed) throw invalid(
    'lease_reused',
    '$.lease',
  )
  state.consumed = true
  return state.request
}

export function
verifyLivingFrameCharacterControlledPreparationPrivatePrompt(
  value: unknown,
): value is LivingFrameCharacterControlledPreparationPrivatePrompt {
  try {
    if (
      !isRecord(value)
      || value.contractVersion !==
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_PROMPT_VERSION
      || value.resultClass !==
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_PROMPT_CLASS
      || value.materializationState !==
        LIVING_FRAME_CHARACTER_CONTROLLED_PREPARATION_PRIVATE_PROMPT_STATE
      || typeof value.materializationDigestSha256 !== 'string'
      || !SHA256.test(value.materializationDigestSha256)
    ) return false
    const {
      materializationDigestSha256,
      ...draft
    } = value
    if (
      materializationDigestSha256 !==
        sha256AuthorityValue(draft)
    ) return false
    assertReceipt(
      draft as unknown as
        LivingFrameCharacterControlledPreparationPrivatePromptDraft,
    )
    return true
  } catch {
    return false
  }
}

function materializeUnit(input: {
  readonly materializationBatchId: string
  readonly preparationUnit:
    LivingFrameCharacterControlledPreparationUnit
  readonly packetUnit:
    LivingFrameCharacterControlledPreparationPrivatePromptPacket['units'][number]
}): {
  readonly receipt:
    LivingFrameCharacterControlledPreparationPrivatePromptUnit
  readonly lease:
    LivingFrameCharacterControlledPreparationPrivatePromptLease
} {
  assertUnitPacket(
    input.preparationUnit,
    input.packetUnit,
  )
  const seed = serverSeed(input.preparationUnit)
  const prompt = compilePrompt(
    input.preparationUnit,
    input.packetUnit.resolvedSlots,
    seed,
  )
  const request:
    LivingFrameCharacterControlledPreparationPrivateComfyUiRequest =
    deepFreeze({
      contractVersion:
        'living-frame-character-controlled-preparation-private-comfyui-request-v1',
      requestClass:
        'server_private_single_character_preparation_comfyui_request',
      promptUnitId:
        `lf-character-prompt.${sha256AuthorityValue({
          batchId: input.materializationBatchId,
          preparationUnitId:
            input.preparationUnit.preparationUnitId,
        }).slice(0, 40)}`,
      preparationUnitId:
        input.preparationUnit.preparationUnitId,
      approvedWorkItemId:
        input.preparationUnit.approvedWorkItemId,
      approvedWorkItemKey:
        input.preparationUnit.approvedWorkItemKey,
      outputKey:
        input.preparationUnit.outputKey,
      widthPixels:
        input.preparationUnit.generationCanvas.widthPixels,
      heightPixels:
        input.preparationUnit.generationCanvas.heightPixels,
      prompt,
      outputImageCount: 1,
      dispatchAuthority: false,
      runtimeAuthority: false,
      finalCanvasAuthority: false,
      productionReady: false,
    })
  const serializedRequest =
    JSON.stringify(request)
  const promptRequestDigestSha256 =
    sha256AuthorityValue(request)
  const promptUnitId = request.promptUnitId
  const leaseId =
    `lf-character-prompt-lease.${sha256AuthorityValue({
      promptUnitId,
      promptRequestDigestSha256,
    }).slice(0, 40)}`
  const lease:
    LivingFrameCharacterControlledPreparationPrivatePromptLease =
    Object.freeze({
      leaseClass:
        'process_bound_single_use_character_preparation_prompt_lease',
      leaseId,
      promptUnitId,
      preparationUnitId:
        input.preparationUnit.preparationUnitId,
      promptRequestDigestSha256,
    })
  LEASE_STATES.set(lease, {
    consumed: false,
    request,
  })
  const slotReceipts =
    input.packetUnit.resolvedSlots.map((slot) =>
      deepFreeze({
        order: slot.order,
        slotKind: slot.slotKind,
        valueClass: slot.valueClass,
        valueDigestSha256:
          sha256AuthorityValue(slot.value),
        valueByteLength:
          Buffer.byteLength(slot.value, 'utf8'),
        valueIncluded: false,
      } satisfies
        LivingFrameCharacterControlledPreparationPrivatePromptSlotReceipt))
  const draft = {
    order: input.preparationUnit.order,
    promptUnitId,
    preparationUnitId:
      input.preparationUnit.preparationUnitId,
    preparationUnitDigestSha256:
      input.preparationUnit.preparationUnitDigestSha256,
    purpose: input.preparationUnit.purpose,
    sceneId: input.preparationUnit.sceneId,
    componentId: input.preparationUnit.componentId,
    approvedWorkItemId:
      input.preparationUnit.approvedWorkItemId,
    approvedWorkItemKey:
      input.preparationUnit.approvedWorkItemKey,
    approvedPlannedAssetManifestEntryId:
      input.preparationUnit
        .approvedPlannedAssetManifestEntryId,
    outputKey: input.preparationUnit.outputKey,
    graphProfile: {
      graphFamily:
        input.preparationUnit.graphProfile.graphFamily,
      nodeClasses:
        Object.values(prompt).map((node) =>
          node.class_type),
      graphTopologyDigestSha256:
        sha256AuthorityValue(prompt),
      maskedInpaintUsesVaeEncodeForInpaint:
        Object.values(prompt).some((node) =>
          node.class_type === 'VAEEncodeForInpaint'),
      genericEmptyLatentSubstitutionAllowed:
        false,
      inGraphPreprocessorAllowed: false,
      faceIdOrInsightFaceAllowed: false,
      arbitrarySaveOrPreviewNodeAllowed: false,
      websocketOutputOnly: true,
    },
    generationCanvas: {
      ...input.preparationUnit.generationCanvas,
    },
    deterministicSeedPolicy: {
      policyVersion:
        'living_frame_character_preparation_server_seed_v1',
      seedDigestSha256:
        sha256AuthorityValue(seed),
      seedIncludedInReceipt: false,
      callerSeedAllowed: false,
    },
    attemptPolicy: {
      onePromptUnitPerPreparationUnit: true,
      oneLeaseRepresentsOneFutureGpuAttempt: true,
      oneImagePerAttempt: true,
      outputBatchingAllowed: false,
      fixedSupervisedProcessRequired: true,
      exactModelRoleCount: 5,
      exactModelArtifactByteLength:
        11_700_367_157 as const,
      atomicReadOnlyModelMountLifetimeRequired:
        true,
      confinementDigestSha256:
        LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256,
      deniedTopLevelImports: ['sam2'] as const,
    },
    privatePromptRequest: {
      leaseId,
      promptRequestDigestSha256,
      serializedPromptRequestByteLength:
        Buffer.byteLength(serializedRequest, 'utf8'),
      nodeCount: Object.keys(prompt).length,
      slotReceipts,
      rawPromptIncludedInReceipt: false,
      rawConditioningTextIncludedInReceipt:
        false,
      modelOrImageAliasIncludedInReceipt:
        false,
      modelOrImageBytesIncludedInReceipt:
        false,
      pathUrlCredentialCommandOrEnvironmentIncludedInReceipt:
        false,
      leaseConsumed: false,
    },
    downstreamPolicy: {
      outputContentType: 'image/png',
      outputImageCount: 1,
      outputRemainsIntermediate: true,
      stillAlphaPipelineRequired:
        input.preparationUnit.downstreamPolicy
          .stillAlphaPipelineRequired,
      opaqueRectangleMayReplaceRequiredAlpha:
        false,
      independentPerFrameGenerationAllowed:
        false,
      rerouteAfterQaRequired: true,
      remotionOwnsFinalComposition: true,
    },
    operationRegistered: false,
    dispatched: false,
    gpuAttemptCreated: false,
    runtimeExecuted: false,
    actualCostReceiptCreated: false,
    assetCreated: false,
    qaApproved: false,
  } as const
  const receipt = deepFreeze({
    ...draft,
    promptUnitDigestSha256:
      sha256AuthorityValue(draft),
  })
  return {
    receipt,
    lease,
  }
}

function compilePrompt(
  unit:
    LivingFrameCharacterControlledPreparationUnit,
  slots:
    readonly LivingFrameCharacterControlledPreparationResolvedPrivateSlot[],
  seed: number,
): Readonly<
  Record<
    string,
    LivingFrameCharacterControlledPreparationPrivatePromptNode
  >
> {
  const values = new Map(slots.map((slot) => [
    slot.slotKind,
    slot.value,
  ]))
  const nodes: Record<
    string,
    LivingFrameCharacterControlledPreparationPrivatePromptNode
  > = {}
  let order = 0
  const append = (
    classType:
      LivingFrameCharacterControlledPreparationGraphNodeClass,
    inputs: Readonly<Record<string, JsonValue>>,
  ): string => {
    order += 1
    const nodeId = String(order)
    nodes[nodeId] = {
      class_type: classType,
      inputs,
    }
    return nodeId
  }
  const base = append('CheckpointLoaderSimple', {
    ckpt_name: requireSlot(
      values,
      'base_checkpoint_artifact',
    ),
  })
  const usesLora =
    values.has('lora_adapter_artifact')
  const modelSource = usesLora
    ? append('LoraLoader', {
        model: [base, 0],
        clip: [base, 1],
        lora_name: requireSlot(
          values,
          'lora_adapter_artifact',
        ),
        strength_model: 0.7,
        strength_clip: 0.55,
      })
    : base
  const positive = append('CLIPTextEncode', {
    text: requireSlot(
      values,
      'positive_conditioning_text',
    ),
    clip: [modelSource, 1],
  })
  const negative = append('CLIPTextEncode', {
    text: requireSlot(
      values,
      'negative_conditioning_text',
    ),
    clip: [modelSource, 1],
  })
  let positiveSource = positive
  let negativeSource = negative
  const isInpaint =
    unit.purpose ===
      'reconstruct_exposed_source_plate'
  let sourceImage: string | null = null
  let maskImage: string | null = null
  if (isInpaint) {
    sourceImage = append('LoadImage', {
      image: requireSlot(
        values,
        'source_plate_image_artifact',
      ),
    })
    maskImage = append('LoadImage', {
      image: requireSlot(
        values,
        'source_plate_inpaint_mask_artifact',
      ),
    })
  }
  if (values.has('controlnet_checkpoint_artifact')) {
    const controlNet = append('ControlNetLoader', {
      control_net_name: requireSlot(
        values,
        'controlnet_checkpoint_artifact',
      ),
    })
    const controlImage = append('LoadImage', {
      image: requireSlot(
        values,
        'control_image_artifact',
      ),
    })
    const apply = append('ControlNetApplyAdvanced', {
      positive: [positive, 0],
      negative: [negative, 0],
      control_net: [controlNet, 0],
      image: [controlImage, 0],
      strength: isInpaint ? 0.7 : 0.8,
      start_percent: 0,
      end_percent: 0.9,
    })
    positiveSource = apply
    negativeSource = apply
  }
  let latent: string | null = null
  if (!isInpaint) {
    latent = append('EmptyLatentImage', {
      width:
        unit.generationCanvas.widthPixels,
      height:
        unit.generationCanvas.heightPixels,
      batch_size: 1,
    })
  }
  let finalModel = modelSource
  if (values.has('generic_ipadapter_checkpoint_artifact')) {
    const clipVision = append('CLIPVisionLoader', {
      clip_name: requireSlot(
        values,
        'clip_vision_checkpoint_artifact',
      ),
    })
    const ipAdapter = append('IPAdapterModelLoader', {
      ipadapter_file: requireSlot(
        values,
        'generic_ipadapter_checkpoint_artifact',
      ),
    })
    const reference = append('LoadImage', {
      image: requireSlot(
        values,
        'reference_image_artifact',
      ),
    })
    finalModel = append('IPAdapterAdvanced', {
      model: [modelSource, 0],
      ipadapter: [ipAdapter, 0],
      image: [reference, 0],
      clip_vision: [clipVision, 0],
      weight: 0.85,
      weight_type: 'linear',
      combine_embeds: 'average',
      start_at: 0,
      end_at: 0.9,
      embeds_scaling: 'v_only',
    })
  }
  if (isInpaint) {
    latent = append('VAEEncodeForInpaint', {
      pixels: [sourceImage!, 0],
      vae: [base, 2],
      mask: [maskImage!, 1],
      grow_mask_by: 6,
    })
  }
  if (latent === null) throw invalid(
    'graph_invalid',
    '$.prompt.latent',
  )
  const sampler = append('KSampler', {
    model: [finalModel, 0],
    positive: [positiveSource, 0],
    negative: [
      negativeSource,
      values.has('controlnet_checkpoint_artifact')
        ? 1
        : 0,
    ],
    latent_image: [latent, 0],
    seed,
    steps: 24,
    cfg: 5.5,
    sampler_name: 'dpmpp_2m',
    scheduler: 'karras',
    denoise: isInpaint ? 0.55 : 1,
  })
  const decoded = append('VAEDecode', {
    samples: [sampler, 0],
    vae: [base, 2],
  })
  append('SaveImageWebsocket', {
    images: [decoded, 0],
  })
  assertCompiledPrompt(unit, nodes)
  return deepFreeze(nodes)
}

function assertCompiledPrompt(
  unit:
    LivingFrameCharacterControlledPreparationUnit,
  nodes: Readonly<
    Record<
      string,
      LivingFrameCharacterControlledPreparationPrivatePromptNode
    >
  >,
): void {
  const classes =
    Object.values(nodes).map((node) =>
      node.class_type)
  if (
    classes.at(-1) !== 'SaveImageWebsocket'
    || classes.filter((node) =>
      node === 'SaveImageWebsocket').length !== 1
    || JSON.stringify(classes) !==
      JSON.stringify(
        unit.graphProfile.nodeClasses,
      )
  ) throw invalid('graph_invalid', '$.prompt')
  const inpaint =
    unit.purpose ===
      'reconstruct_exposed_source_plate'
  if (
    inpaint !== classes.includes(
      'VAEEncodeForInpaint',
    )
    || (
      inpaint
      && classes.includes('EmptyLatentImage')
    )
  ) throw invalid('graph_invalid', '$.prompt')
}

function assertInput(
  input:
    MaterializeLivingFrameCharacterControlledPreparationPrivatePromptInput,
): void {
  if (
    !isRecord(input)
    || !SAFE_ID.test(input.materializationBatchId)
    || !SAFE_ID.test(input.serverOwnedPacketLocatorId)
    || Object.keys(input).sort().join('|') !== [
      'materializationBatchId',
      'preparation',
      'preparationInput',
      'reader',
      'serverOwnedPacketLocatorId',
    ].sort().join('|')
  ) throw invalid('input_invalid', '$')
}

function assertPacket(
  packet: unknown,
  preparation:
    LivingFrameCharacterControlledPreparation,
): asserts packet is
  LivingFrameCharacterControlledPreparationPrivatePromptPacket {
  if (
    !isRecord(packet)
    || packet.preparationDigestSha256 !==
      preparation.preparationDigestSha256
    || packet.approvedSnapshotId !==
      preparation.sourceBindings.approvedSnapshotId
    || packet.approvedSnapshotHashSha256 !==
      preparation.sourceBindings.approvedSnapshotHashSha256
    || packet.sceneId !==
      preparation.canonicalScope.sceneId
    || packet.componentId !==
      preparation.canonicalScope.componentId
    || !Array.isArray(packet.units)
    || packet.units.length !==
      preparation.preparationUnits.length
    || Object.keys(packet).sort().join('|') !== [
      'approvedSnapshotHashSha256',
      'approvedSnapshotId',
      'componentId',
      'preparationDigestSha256',
      'sceneId',
      'units',
    ].sort().join('|')
  ) throw invalid('packet_invalid', '$.packet')
  const ids = new Set<string>()
  for (const unit of packet.units) {
    if (
      !isRecord(unit)
      || typeof unit.preparationUnitId !== 'string'
      || ids.has(unit.preparationUnitId)
      || !Array.isArray(unit.resolvedSlots)
      || Object.keys(unit).sort().join('|') !== [
        'approvedPlannedAssetManifestEntryId',
        'approvedWorkItemId',
        'approvedWorkItemKey',
        'componentId',
        'order',
        'outputKey',
        'preparationUnitDigestSha256',
        'preparationUnitId',
        'resolvedSlots',
        'sceneId',
      ].sort().join('|')
    ) throw invalid('packet_invalid', '$.packet.units')
    ids.add(unit.preparationUnitId)
  }
}

function assertUnitPacket(
  unit:
    LivingFrameCharacterControlledPreparationUnit,
  packetUnit:
    LivingFrameCharacterControlledPreparationPrivatePromptPacket['units'][number],
): void {
  if (
    packetUnit.order !== unit.order
    || packetUnit.preparationUnitDigestSha256 !==
      unit.preparationUnitDigestSha256
    || packetUnit.sceneId !== unit.sceneId
    || packetUnit.componentId !== unit.componentId
    || packetUnit.approvedWorkItemId !==
      unit.approvedWorkItemId
    || packetUnit.approvedWorkItemKey !==
      unit.approvedWorkItemKey
    || packetUnit.approvedPlannedAssetManifestEntryId !==
      unit.approvedPlannedAssetManifestEntryId
    || packetUnit.outputKey !== unit.outputKey
  ) throw invalid(
    'unit_substitution_forbidden',
    '$.packet.units',
  )
  const required =
    unit.graphProfile.requiredPrivateSlotKinds
  const actual =
    packetUnit.resolvedSlots.map((slot) =>
      slot.slotKind)
  if (
    required.length !== actual.length
    || required.some((slot, index) =>
      actual[index] !== slot)
  ) throw invalid(
    'slot_set_invalid',
    '$.packet.units.resolvedSlots',
  )
  for (
    let order = 0;
    order < packetUnit.resolvedSlots.length;
    order += 1
  ) {
    const slot =
      packetUnit.resolvedSlots[order]!
    const expectedClass = slot.slotKind.includes(
      'conditioning_text',
    )
      ? 'private_conditioning_text'
      : slot.slotKind.includes('image')
        || slot.slotKind.includes('mask')
        ? 'private_image_alias'
        : 'private_model_alias'
    if (
      slot.order !== order
      || slot.valueClass !== expectedClass
      || typeof slot.value !== 'string'
      || slot.value.length === 0
      || slot.value.length > 16_384
      || Object.keys(slot).sort().join('|') !== [
        'order',
        'slotKind',
        'value',
        'valueClass',
      ].sort().join('|')
    ) throw invalid(
      'slot_value_invalid',
      '$.packet.units.resolvedSlots',
    )
  }
}

function assertReceipt(
  draft:
    LivingFrameCharacterControlledPreparationPrivatePromptDraft,
): void {
  const invalidUnitDigest =
    draft.promptUnits.some((unit) => {
      const {
        promptUnitDigestSha256,
        ...unitDraft
      } = unit
      return (
        !SHA256.test(promptUnitDigestSha256)
        || promptUnitDigestSha256 !==
          sha256AuthorityValue(unitDraft)
      )
    })
  if (
    draft.promptUnits.length === 0
    || invalidUnitDigest
    || draft.metrics.promptUnitCount !==
      draft.promptUnits.length
    || draft.metrics.privateLeaseCount !==
      draft.promptUnits.length
    || draft.promptUnits.some((unit) =>
      unit.graphProfile.nodeClasses.at(-1) !==
        'SaveImageWebsocket'
      || (
        unit.purpose ===
          'reconstruct_exposed_source_plate'
        && (
          !unit.graphProfile
            .maskedInpaintUsesVaeEncodeForInpaint
          || unit.graphProfile.nodeClasses.includes(
            'EmptyLatentImage',
          )
        )
      )
      || unit.privatePromptRequest
        .rawPromptIncludedInReceipt
      || unit.privatePromptRequest
        .rawConditioningTextIncludedInReceipt
      || unit.privatePromptRequest
        .modelOrImageAliasIncludedInReceipt
      || unit.privatePromptRequest
        .modelOrImageBytesIncludedInReceipt
      || unit.generationCanvas
        .finalCanvasCreatedByComfyUi
      || (
        unit.purpose ===
          'reconstruct_exposed_source_plate'
        ? unit.downstreamPolicy
          .stillAlphaPipelineRequired
        : (
            !unit.downstreamPolicy
              .stillAlphaPipelineRequired
            || unit.downstreamPolicy
              .opaqueRectangleMayReplaceRequiredAlpha
          )
      )
      || unit.downstreamPolicy
        .independentPerFrameGenerationAllowed
      || unit.operationRegistered
      || unit.dispatched
      || unit.runtimeExecuted
      || unit.assetCreated
      || unit.qaApproved)
    || draft.operationRegistered
    || draft.dispatchGranted
    || draft.runtimeExecuted
    || draft.assetCreated
    || draft.qaApproved
    || draft.finalCanvasClaimAllowed
    || draft.productionReady
  ) throw invalid(
    'authority_promotion_forbidden',
    '$',
  )
}

function requireSlot(
  values:
    ReadonlyMap<
      LivingFrameCharacterControlledPreparationPrivateSlotKind,
      string
    >,
  slot:
    LivingFrameCharacterControlledPreparationPrivateSlotKind,
): string {
  const value = values.get(slot)
  if (!value) throw invalid(
    'slot_set_invalid',
    `$.resolvedSlots.${slot}`,
  )
  return value
}

function serverSeed(
  unit:
    LivingFrameCharacterControlledPreparationUnit,
): number {
  return Number.parseInt(
    sha256AuthorityValue({
      preparationUnitId: unit.preparationUnitId,
      approvedWorkItemId: unit.approvedWorkItemId,
      outputKey: unit.outputKey,
    }).slice(0, 13),
    16,
  )
}

function invalid(
  code:
    LivingFrameCharacterControlledPreparationPrivatePromptIssueCode,
  path: string,
): LivingFrameCharacterControlledPreparationPrivatePromptError {
  return new LivingFrameCharacterControlledPreparationPrivatePromptError([{
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
