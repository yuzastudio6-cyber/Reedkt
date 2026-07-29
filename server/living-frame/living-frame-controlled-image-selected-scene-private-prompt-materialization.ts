import { createHash } from 'node:crypto'

import {
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_DENIED_NODE_CLASSES,
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_NODE_CLASSES,
  type LivingFrameControlledSdxlBenchmarkGraphNodeClass,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-graph-blueprint'
import type {
  LivingFrameControlledSdxlBenchmarkRequestSlotKind,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-request-blueprint'
import {
  LIVING_FRAME_CONTROLLED_MODEL_FAMILY_ROLES,
} from '../../src/types/living-frame-controlled-model-family-binding'
import type {
  LivingFrameComfyUiOperationAdmissionCandidate,
} from '../../src/types/living-frame-comfyui-operation-admission-candidate'
import type {
  LivingFrameControlledImageFullFrameRatioExtension,
  LivingFrameControlledImageFullFrameRatioUnit,
} from '../../src/types/living-frame-controlled-image-full-frame-ratio-extension'
import type {
  LivingFrameControlledImageSelectedSceneRequest,
  LivingFrameControlledImageSelectedSceneRequestUnit,
} from '../../src/types/living-frame-controlled-image-selected-scene-request'
import {
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_ISSUE_CODES,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_MATERIALIZATION_CLASS,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_MATERIALIZATION_STATE,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_MATERIALIZATION_VERSION,
  LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_OPEN_GATES,
  type LivingFrameControlledImageSelectedSceneGraphFeature,
  type LivingFrameControlledImageSelectedScenePrivatePromptAuthority,
  type LivingFrameControlledImageSelectedScenePrivatePromptIssue,
  type LivingFrameControlledImageSelectedScenePrivatePromptIssueCode,
  type LivingFrameControlledImageSelectedScenePrivatePromptMaterialization,
  type LivingFrameControlledImageSelectedScenePrivatePromptMaterializationDraft,
  type LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit,
  type LivingFrameControlledImageSelectedScenePrivatePromptSlotReceipt,
} from '../../src/types/living-frame-controlled-image-selected-scene-private-prompt-materialization'
import {
  LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256,
} from './living-frame-controlled-sdxl-comfyui-canonical-mount-host-session'
import {
  type CreateLivingFrameControlledImageFullFrameRatioExtensionInput,
  verifyLivingFrameControlledImageFullFrameRatioExtension,
} from './living-frame-controlled-image-full-frame-ratio-extension'
import {
  type CreateLivingFrameControlledImageSelectedSceneRequestInput,
  verifyLivingFrameControlledImageSelectedSceneRequest,
} from './living-frame-controlled-image-selected-scene-request'
import {
  verifyLivingFrameComfyUiOperationAdmissionCandidate,
} from './living-frame-comfyui-operation-admission-candidate'

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,239}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const PRIVATE_ALIAS =
  /^[A-Za-z0-9][A-Za-z0-9._-]{0,126}[A-Za-z0-9]$/u
const URL_LIKE =
  /(?:https?:\/\/|file:\/\/|data:|javascript:)/iu
const SECRET_LIKE =
  /(?:-----BEGIN [A-Z ]+PRIVATE KEY-----|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{16,})/u
const MAX_PROMPT_TEXT_BYTES = 4_096
const MAX_PRIVATE_REQUEST_BYTES = 256 * 1_024
const EXACT_MODEL_ARTIFACT_BYTE_LENGTH = 11_700_367_157

const ALLOWED_NODE_CLASSES = new Set<string>(
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_NODE_CLASSES,
)
const DENIED_NODE_CLASSES = new Set<string>(
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_DENIED_NODE_CLASSES,
)
const FULL_FRAME_COMPONENT_ROLES = new Set([
  'source_still',
  'opaque_background_plate',
  'reconstructed_background_plate',
])

type JsonPrimitive = string | number | boolean | null
type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue }

export interface LivingFrameControlledImageSelectedScenePrivatePromptNode {
  readonly class_type:
    LivingFrameControlledSdxlBenchmarkGraphNodeClass
  readonly inputs: Readonly<Record<string, JsonValue>>
}

export type LivingFrameControlledImageSelectedScenePrivateComfyUiPrompt =
  Readonly<
    Record<
      string,
      LivingFrameControlledImageSelectedScenePrivatePromptNode
    >
  >

export interface LivingFrameControlledImageSelectedSceneResolvedPrivateSlot {
  readonly order: number
  readonly slotKind:
    LivingFrameControlledSdxlBenchmarkRequestSlotKind
  readonly valueClass:
    | 'private_model_alias'
    | 'private_conditioning_text'
    | 'private_image_alias'
  readonly value: string
}

export interface LivingFrameControlledImageSelectedScenePrivatePromptPacketUnit {
  readonly order: number
  readonly requestUnitId: string
  readonly requestUnitDigestSha256: string
  readonly sceneId: string
  readonly outputKey: string
  readonly approvedWorkItemId: string
  readonly approvedWorkItemKey: string
  readonly approvedPlannedAssetManifestEntryId: string
  readonly serverOwnedConditioningLocatorId: string
  readonly resolvedSlots:
    readonly LivingFrameControlledImageSelectedSceneResolvedPrivateSlot[]
}

export interface LivingFrameControlledImageSelectedScenePrivatePromptPacket {
  readonly selectedSceneRequestBindingDigestSha256: string
  readonly fullFrameRatioExtensionDigestSha256: string
  readonly approvedSnapshotId: string
  readonly approvedSnapshotHashSha256: string
  readonly sceneId: string
  readonly units:
    readonly LivingFrameControlledImageSelectedScenePrivatePromptPacketUnit[]
}

export interface LivingFrameControlledImageSelectedScenePrivatePromptReaderPort {
  readonly readerClass:
    'process_bound_server_owned_selected_scene_private_prompt_reader_v1'
  readonly sourceAuthority:
    'current_selected_scene_conditioning_and_private_alias_repository'
  readonly callerPacketAccepted: false
  readonly callerPromptAccepted: false
  readonly callerSlotValueAccepted: false
  readonly callerSeedDimensionsModelPathUrlBytesCredentialCommandOrEnvironmentAccepted:
    false
  readonly operationAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly productionReady: false
  readCurrentByServerOwnedLocator(
    serverOwnedMaterializationLocatorId: string,
  ): Promise<unknown>
}

export interface LivingFrameControlledImageSelectedScenePrivatePromptRequest {
  readonly requestClass:
    'selected_scene_private_comfyui_prompt_request_v1'
  readonly materializationBatchId: string
  readonly materializationUnitId: string
  readonly requestUnitId: string
  readonly sceneId: string
  readonly outputKey: string
  readonly approvedWorkItemId: string
  readonly approvedWorkItemKey: string
  readonly approvedPlannedAssetManifestEntryId: string
  readonly widthPixels: number
  readonly heightPixels: number
  readonly outputContentType: 'image/png'
  readonly outputImageCount: 1
  readonly prompt:
    LivingFrameControlledImageSelectedScenePrivateComfyUiPrompt
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly finalCanvasAuthority: false
  readonly productionReady: false
}

export interface LivingFrameControlledImageSelectedScenePrivatePromptRequestLease {
  readonly leaseClass:
    'process_bound_single_use_selected_scene_comfyui_prompt_request_lease_v1'
  readonly leaseId: string
  readonly materializationDigestSha256: string
  readonly materializationUnitId: string
  readonly requestUnitId: string
  readonly callerSerializable: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly finalCanvasAuthority: false
  readonly productionReady: false
}

export interface LivingFrameControlledImageSelectedScenePrivatePromptMaterializationResult {
  readonly receipt:
    LivingFrameControlledImageSelectedScenePrivatePromptMaterialization
  readonly privatePromptRequestLeases:
    readonly LivingFrameControlledImageSelectedScenePrivatePromptRequestLease[]
}

export interface CreateLivingFrameControlledImageSelectedScenePrivatePromptMaterializationInput {
  readonly materializationBatchId: string
  readonly serverOwnedMaterializationLocatorId: string
  readonly selectedSceneRequest:
    LivingFrameControlledImageSelectedSceneRequest
  readonly selectedSceneRequestInput:
    CreateLivingFrameControlledImageSelectedSceneRequestInput
  readonly fullFrameRatioExtension:
    LivingFrameControlledImageFullFrameRatioExtension
  readonly fullFrameRatioExtensionInput:
    CreateLivingFrameControlledImageFullFrameRatioExtensionInput
  readonly admissionCandidate:
    LivingFrameComfyUiOperationAdmissionCandidate
  readonly reader:
    LivingFrameControlledImageSelectedScenePrivatePromptReaderPort | null
}

const AUTHORITY_BOUNDARY:
  LivingFrameControlledImageSelectedScenePrivatePromptAuthority =
  deepFreeze({
    selectedScenePrivatePromptMaterializationAuthority: true,
    selectedSceneAuthority: false,
    visualContinuityPackAuthority: false,
    outputFrameAuthority: false,
    promptPlanningAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    customerPriceAuthority: false,
    customerCreditAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    approvedWorkItemMutationAuthority: false,
    workGraphMutationAuthority: false,
    toolRegistryAuthority: false,
    operationRegistryAuthority: false,
    modelArtifactAuthority: false,
    artifactMountAuthority: false,
    queueAuthority: false,
    dispatchAuthority: false,
    workerLeaseAuthority: false,
    actualCostAuthority: false,
    artifactPersistenceAuthority: false,
    assetManifestAuthority: false,
    qaApprovalAuthority: false,
    privateReviewAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

const readers = new WeakSet<object>()
const consumedReaders = new WeakSet<object>()
const leases = new WeakSet<object>()
const consumedLeases = new WeakSet<object>()
const privateRequests = new WeakMap<
  object,
  LivingFrameControlledImageSelectedScenePrivatePromptRequest
>()

export class LivingFrameControlledImageSelectedScenePrivatePromptMaterializationError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledImageSelectedScenePrivatePromptIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledImageSelectedScenePrivatePromptIssue[],
  ) {
    super(
      'Living Frame selected-scene private prompt materialization failed.',
    )
    this.name =
      'LivingFrameControlledImageSelectedScenePrivatePromptMaterializationError'
    this.issues = issues
  }
}

export function createLivingFrameControlledImageSelectedScenePrivatePromptReader(
  readCurrentByServerOwnedLocator:
    LivingFrameControlledImageSelectedScenePrivatePromptReaderPort[
      'readCurrentByServerOwnedLocator'
    ],
): LivingFrameControlledImageSelectedScenePrivatePromptReaderPort {
  if (typeof readCurrentByServerOwnedLocator !== 'function') {
    throw invalid('reader_invalid', '$.reader')
  }
  const reader:
    LivingFrameControlledImageSelectedScenePrivatePromptReaderPort =
    Object.freeze({
      readerClass:
        'process_bound_server_owned_selected_scene_private_prompt_reader_v1',
      sourceAuthority:
        'current_selected_scene_conditioning_and_private_alias_repository',
      callerPacketAccepted: false,
      callerPromptAccepted: false,
      callerSlotValueAccepted: false,
      callerSeedDimensionsModelPathUrlBytesCredentialCommandOrEnvironmentAccepted:
        false,
      operationAuthority: false,
      dispatchAuthority: false,
      runtimeAuthority: false,
      productionReady: false,
      readCurrentByServerOwnedLocator:
        readCurrentByServerOwnedLocator.bind(undefined),
    })
  readers.add(reader)
  return reader
}

export async function materializeLivingFrameControlledImageSelectedScenePrivatePrompt(
  input:
    CreateLivingFrameControlledImageSelectedScenePrivatePromptMaterializationInput,
): Promise<
  LivingFrameControlledImageSelectedScenePrivatePromptMaterializationResult
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
    !await verifyLivingFrameControlledImageFullFrameRatioExtension(
      input.fullFrameRatioExtension,
      input.fullFrameRatioExtensionInput,
    )
  ) throw invalid(
    'full_frame_ratio_extension_invalid',
    '$.fullFrameRatioExtension',
  )
  if (
    !await verifyLivingFrameComfyUiOperationAdmissionCandidate(
      input.admissionCandidate,
      { candidateId: input.admissionCandidate.candidateId },
    )
  ) throw invalid(
    'admission_candidate_invalid',
    '$.admissionCandidate',
  )
  assertSourceLineage(input)
  const reader = requireReader(input.reader)
  consumedReaders.add(reader)
  let packet: unknown
  try {
    packet =
      await reader.readCurrentByServerOwnedLocator(
        input.serverOwnedMaterializationLocatorId,
      )
  } catch {
    throw invalid('reader_failed', '$.reader')
  }
  const current = assertPacket(
    packet,
    input.selectedSceneRequest,
    input.fullFrameRatioExtension,
  )
  const leasesForUnit: Array<{
    readonly unit:
      LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit
    readonly lease:
      LivingFrameControlledImageSelectedScenePrivatePromptRequestLease
    readonly privateRequest:
      LivingFrameControlledImageSelectedScenePrivatePromptRequest
  }> = []
  for (
    const [
      order,
      requestUnit,
    ] of input.selectedSceneRequest.requestUnits.entries()
  ) {
    const packetUnit = current.units[order]
    if (!packetUnit) {
      throw invalid(
        'materialization_unit_set_invalid',
        `$.packet.units.${order}`,
      )
    }
    leasesForUnit.push(compileMaterializationUnit({
      order,
      input,
      requestUnit,
      packetUnit,
    }))
  }
  const draft =
    compileReceiptDraft(
      input,
      current,
      leasesForUnit.map((entry) => entry.unit),
    )
  assertReceiptSemantics(draft)
  assertSafeReceipt(draft)
  const receipt =
    deepFreeze({
      ...draft,
      materializationDigestSha256: digest(draft),
    })
  const finalizedLeases =
    leasesForUnit.map((entry) => {
      const lease =
        Object.freeze({
          ...entry.lease,
          materializationDigestSha256:
            receipt.materializationDigestSha256,
        })
      leases.add(lease)
      privateRequests.set(lease, entry.privateRequest)
      return lease
    })
  return Object.freeze({
    receipt,
    privatePromptRequestLeases:
      Object.freeze(finalizedLeases),
  })
}

export function consumeLivingFrameControlledImageSelectedScenePrivatePromptRequestLease(
  lease:
    LivingFrameControlledImageSelectedScenePrivatePromptRequestLease,
): LivingFrameControlledImageSelectedScenePrivatePromptRequest {
  if (
    !leases.has(lease)
    || consumedLeases.has(lease)
    || lease.leaseClass !==
      'process_bound_single_use_selected_scene_comfyui_prompt_request_lease_v1'
    || lease.callerSerializable !== false
    || lease.dispatchAuthority !== false
    || lease.runtimeAuthority !== false
    || lease.finalCanvasAuthority !== false
    || lease.productionReady !== false
  ) throw invalid('lease_reused', '$.lease')
  const privateRequest = privateRequests.get(lease)
  if (!privateRequest) {
    throw invalid('lease_invalid', '$.lease')
  }
  consumedLeases.add(lease)
  privateRequests.delete(lease)
  return privateRequest
}

export function verifyLivingFrameControlledImageSelectedScenePrivatePromptMaterialization(
  value: unknown,
): value is
  LivingFrameControlledImageSelectedScenePrivatePromptMaterialization {
  try {
    if (
      !isRecord(value)
      || value.contractVersion !==
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_MATERIALIZATION_VERSION
      || value.resultClass !==
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_MATERIALIZATION_CLASS
      || value.materializationState !==
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_MATERIALIZATION_STATE
      || typeof value.materializationDigestSha256 !== 'string'
      || !SHA256.test(value.materializationDigestSha256)
    ) return false
    const {
      materializationDigestSha256,
      ...draft
    } = value
    assertReceiptSemantics(
      draft as unknown as
        LivingFrameControlledImageSelectedScenePrivatePromptMaterializationDraft,
    )
    assertSafeReceipt(draft)
    return digest(draft) === materializationDigestSha256
  } catch {
    return false
  }
}

function compileMaterializationUnit(input: {
  readonly order: number
  readonly input:
    CreateLivingFrameControlledImageSelectedScenePrivatePromptMaterializationInput
  readonly requestUnit:
    LivingFrameControlledImageSelectedSceneRequestUnit
  readonly packetUnit:
    LivingFrameControlledImageSelectedScenePrivatePromptPacketUnit
}): {
  readonly unit:
    LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit
  readonly lease:
    LivingFrameControlledImageSelectedScenePrivatePromptRequestLease
  readonly privateRequest:
    LivingFrameControlledImageSelectedScenePrivatePromptRequest
} {
  assertPacketUnitLineage(input.requestUnit, input.packetUnit)
  const fullFrameRatioUnit =
    fullFrameRatioUnitFor(
      input.requestUnit,
      input.input.fullFrameRatioExtension,
    )
  const canvas = generationCanvas(
    input.requestUnit,
    fullFrameRatioUnit,
  )
  const enabledFeatures =
    graphFeatures(input.requestUnit)
  const seed = deterministicSeed(input.requestUnit)
  const prompt = compilePrompt({
    requestUnit: input.requestUnit,
    resolvedSlots: input.packetUnit.resolvedSlots,
    enabledFeatures,
    widthPixels: canvas.widthPixels,
    heightPixels: canvas.heightPixels,
    seed,
  })
  const nodeClasses =
    Object.values(prompt).map((node) => node.class_type)
  assertNodePolicy(nodeClasses)
  const identity = {
    materializationBatchId:
      input.input.materializationBatchId,
    requestUnitId: input.requestUnit.requestUnitId,
    requestUnitDigestSha256:
      input.requestUnit.requestUnitDigestSha256,
    outputKey: input.requestUnit.outputKey,
    approvedWorkItemId:
      input.requestUnit.approvedWorkItemId,
    approvedWorkItemKey:
      input.requestUnit.approvedWorkItemKey,
    approvedPlannedAssetManifestEntryId:
      input.requestUnit.approvedPlannedAssetManifestEntryId,
    canvas,
  }
  const materializationUnitId =
    `lf-selected-prompt-unit.${digest(identity).slice(0, 40)}`
  const privateRequest =
    deepFreeze({
      requestClass:
        'selected_scene_private_comfyui_prompt_request_v1',
      materializationBatchId:
        input.input.materializationBatchId,
      materializationUnitId,
      requestUnitId: input.requestUnit.requestUnitId,
      sceneId: input.requestUnit.sceneId,
      outputKey: input.requestUnit.outputKey,
      approvedWorkItemId:
        input.requestUnit.approvedWorkItemId,
      approvedWorkItemKey:
        input.requestUnit.approvedWorkItemKey,
      approvedPlannedAssetManifestEntryId:
        input.requestUnit.approvedPlannedAssetManifestEntryId,
      widthPixels: canvas.widthPixels,
      heightPixels: canvas.heightPixels,
      outputContentType: 'image/png',
      outputImageCount: 1,
      prompt,
      dispatchAuthority: false,
      runtimeAuthority: false,
      finalCanvasAuthority: false,
      productionReady: false,
    } as const)
  const promptRequestDigestSha256 =
    digest(privateRequest)
  const leaseId =
    `lf-selected-prompt-lease.${digest({
      materializationUnitId,
      promptRequestDigestSha256,
    }).slice(0, 40)}`
  const unitDraft = {
    order: input.order,
    materializationUnitId,
    requestUnitId: input.requestUnit.requestUnitId,
    requestUnitDigestSha256:
      input.requestUnit.requestUnitDigestSha256,
    fullFrameRatioExtensionUnitId:
      fullFrameRatioUnit?.extensionUnitId ?? null,
    fullFrameRatioExtensionUnitDigestSha256:
      fullFrameRatioUnit?.extensionUnitDigestSha256 ?? null,
    sceneId: input.requestUnit.sceneId,
    componentId: input.requestUnit.componentId,
    componentRole: input.requestUnit.componentRole,
    assetIntentId: input.requestUnit.assetIntentId,
    outputKey: input.requestUnit.outputKey,
    approvedWorkItemId:
      input.requestUnit.approvedWorkItemId,
    approvedWorkItemKey:
      input.requestUnit.approvedWorkItemKey,
    approvedPlannedAssetManifestEntryId:
      input.requestUnit.approvedPlannedAssetManifestEntryId,
    rendererLayerId: input.requestUnit.rendererLayerId,
    serverOwnedConditioningLocatorId:
      input.requestUnit.serverOwnedConditioningLocatorId,
    semanticDirectionDigestSha256:
      input.requestUnit.semanticDirectionDigestSha256,
    componentDirectionDigestSha256:
      input.requestUnit.componentDirectionDigestSha256,
    continuityDirectionDigestSha256:
      input.requestUnit.continuityDirectionDigestSha256,
    graphProfile: {
      qualifiedGraphFamily:
        'controlled_sdxl_selected_scene_v1',
      enabledFeatures,
      nodeClasses,
      graphTopologyDigestSha256: digest({
        enabledFeatures,
        nodeClasses,
        edges: graphEdges(prompt),
      }),
      benchmarkCaseOrRecipeUsed: false,
      baseRequired: true,
      loraOptional: true,
      deterministicControlNetInputOptional: true,
      genericIpAdapterAndClipVisionReferenceOptional: true,
      faceIdOrInsightFaceAllowed: false,
      inGraphPreprocessorAllowed: false,
      arbitrarySaveOrPreviewNodeAllowed: false,
      websocketOutputOnly: true,
    },
    generationCanvas: {
      ...canvas,
      confirmedOutputFrameExpectationDigestSha256:
        input.requestUnit.generationCanvas
          .finalOutputFrameExpectationDigestSha256,
      callerSelectedDimensionsAllowed: false,
      squareSubstitutionApplied: false,
      finalCanvasCreatedByComfyUi: false,
    },
    deterministicSeedPolicy: {
      policyVersion:
        'living_frame_selected_scene_server_seed_v1',
      seedDigestSha256: digest(seed),
      seedIncludedInReceipt: false,
      callerSeedAllowed: false,
    },
    atomicModelMountPolicy: {
      exactModelRoleCount: 5,
      exactModelRoles:
        LIVING_FRAME_CONTROLLED_MODEL_FAMILY_ROLES,
      exactModelArtifactByteLength:
        EXACT_MODEL_ARTIFACT_BYTE_LENGTH,
      allRolesMountedReadOnlyForAttempt: true,
      allRolesVerifiedBeforeAndAfterInference: true,
      modelArtifactsTravelInPromptOrRequest: false,
    },
    attemptPolicy: {
      oneMaterializationUnitPerApprovedGeneratedOutput: true,
      oneLeaseRepresentsOneFutureGpuAttempt: true,
      oneImagePerAttempt: true,
      outputBatchingAllowed: false,
      exactMaximumSceneAttemptCount:
        input.requestUnit.attemptPolicy.maximumSceneAttemptCount,
      fixedSupervisedProcessRequired: true,
      confinementDigestSha256:
        LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256,
      deniedTopLevelImports: ['sam2'] as const,
    },
    privatePromptRequest: {
      leaseId,
      promptRequestDigestSha256,
      serializedPromptRequestByteLength:
        Buffer.byteLength(
          canonicalJson(privateRequest),
          'utf8',
        ),
      nodeCount: Object.keys(prompt).length,
      slotReceipts:
        compileSlotReceipts(
          input.packetUnit.resolvedSlots,
        ),
      rawPromptIncludedInReceipt: false,
      rawConditioningTextIncludedInReceipt: false,
      modelOrImageAliasIncludedInReceipt: false,
      modelOrImageBytesIncludedInReceipt: false,
      pathUrlCredentialCommandOrEnvironmentIncludedInReceipt:
        false,
      leaseConsumed: false,
    },
    downstreamPolicy: {
      outputContentType: 'image/png',
      outputImageCount: 1,
      generatedArtifactType:
        input.requestUnit.downstreamPolicy
          .generatedArtifactType,
      stillAlphaPipelineRequired:
        input.requestUnit.downstreamPolicy
          .stillAlphaPipelineRequired,
      aiVideoFallbackAllowed: false,
      generatedAssetRemainsInputToRemotion: true,
      remotionOwnsFinalComposition: true,
    },
    materializationUnitState:
      'private_prompt_request_lease_created_dispatch_blocked',
    operationRegistered: false,
    dispatched: false,
    gpuAttemptCreated: false,
    actualCostReceiptCreated: false,
    assetCreated: false,
  } as const
  if (
    unitDraft.privatePromptRequest
      .serializedPromptRequestByteLength < 2
    || unitDraft.privatePromptRequest
      .serializedPromptRequestByteLength >
        MAX_PRIVATE_REQUEST_BYTES
  ) throw invalid(
    'unsafe_receipt_forbidden',
    `$.materializationUnits.${input.order}.privatePromptRequest`,
  )
  const unit =
    deepFreeze({
      ...unitDraft,
      materializationUnitDigestSha256:
        digest(unitDraft),
    })
  const lease = {
    leaseClass:
      'process_bound_single_use_selected_scene_comfyui_prompt_request_lease_v1',
    leaseId,
    materializationDigestSha256: '',
    materializationUnitId,
    requestUnitId: input.requestUnit.requestUnitId,
    callerSerializable: false,
    dispatchAuthority: false,
    runtimeAuthority: false,
    finalCanvasAuthority: false,
    productionReady: false,
  } as const
  return { unit, lease, privateRequest }
}

function compileReceiptDraft(
  input:
    CreateLivingFrameControlledImageSelectedScenePrivatePromptMaterializationInput,
  packet:
    LivingFrameControlledImageSelectedScenePrivatePromptPacket,
  units:
    readonly LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit[],
): LivingFrameControlledImageSelectedScenePrivatePromptMaterializationDraft {
  const request = input.selectedSceneRequest
  const projectedLineage = request.requestUnits.map((unit) => ({
    requestUnitId: unit.requestUnitId,
    outputKey: unit.outputKey,
    approvedWorkItemId: unit.approvedWorkItemId,
    approvedWorkItemKey: unit.approvedWorkItemKey,
    approvedPlannedAssetManifestEntryId:
      unit.approvedPlannedAssetManifestEntryId,
    rendererLayerId: unit.rendererLayerId,
  }))
  return {
    contractVersion:
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_MATERIALIZATION_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_MATERIALIZATION_CLASS,
    materializationState:
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_MATERIALIZATION_STATE,
    materializationBatchId: input.materializationBatchId,
    serverOwnedMaterializationLocatorId:
      input.serverOwnedMaterializationLocatorId,
    canonicalScope: { ...request.canonicalScope },
    sourceBindings: {
      selectedSceneRequestContractVersion:
        request.contractVersion,
      selectedSceneRequestBindingId:
        request.requestBindingId,
      selectedSceneRequestBindingDigestSha256:
        request.requestBindingDigestSha256,
      fullFrameRatioExtensionContractVersion:
        input.fullFrameRatioExtension.contractVersion,
      fullFrameRatioExtensionId:
        input.fullFrameRatioExtension.extensionId,
      fullFrameRatioExtensionDigestSha256:
        input.fullFrameRatioExtension
          .extensionDigestSha256,
      admissionCandidateContractVersion:
        input.admissionCandidate.contractVersion,
      admissionCandidateDigestSha256:
        input.admissionCandidate.candidateDigestSha256,
      approvedSnapshotId:
        request.sourceBindings.approvedSnapshotId,
      approvedSnapshotHashSha256:
        request.sourceBindings.approvedSnapshotHashSha256,
      selectedSceneBindingDigestSha256:
        request.sourceBindings
          .selectedSceneBindingDigestSha256,
      visualContinuityPackDigestSha256:
        request.sourceBindings
          .visualContinuityPackDigestSha256,
      currentMasterTimingDigestSha256:
        request.sourceBindings
          .currentMasterTimingDigestSha256,
      canonicalWorkGraphProjectionDigestSha256:
        request.sourceBindings
          .canonicalWorkGraphProjectionDigestSha256,
      plannedAssetAndApprovedOutputLineageDigestSha256:
        digest(projectedLineage),
      controlledIllustrationCostWorkBindingDigestSha256:
        request.sourceBindings
          .controlledIllustrationCostWorkBindingDigestSha256,
      confirmedOutputFrameExpectationDigestSha256:
        request.sourceBindings
          .outputFrameExpectationDigestSha256,
      fixedLaunchSpecDigestSha256:
        input.admissionCandidate.sourceBindings
          .fixedLaunchSpecDigestSha256,
      runtimeConfinementRequirementDigestSha256:
        LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256,
      privatePacketDigestSha256: digest(packet),
    },
    materializationUnits: units,
    metrics: {
      approvedGeneratedOutputCount:
        request.requestUnits.length,
      materializationUnitCount: units.length,
      privateLeaseCount: units.length,
      isolatedComponentUnitCount:
        units.filter((unit) =>
          unit.generationCanvas.canvasClass ===
            'isolated_component_square_1024').length,
      fullFrameRatioUnitCount:
        units.filter((unit) =>
          unit.generationCanvas.canvasClass ===
            'confirmed_full_frame_ratio').length,
      loraUnitCount:
        units.filter((unit) =>
          unit.graphProfile.enabledFeatures
            .includes('lora')).length,
      controlNetUnitCount:
        units.filter((unit) =>
          unit.graphProfile.enabledFeatures
            .includes('controlnet')).length,
      genericIpAdapterUnitCount:
        units.filter((unit) =>
          unit.graphProfile.enabledFeatures
            .includes('generic_ipadapter')).length,
      totalPromptNodeCount:
        units.reduce(
          (total, unit) =>
            total + unit.privatePromptRequest.nodeCount,
          0,
        ),
      totalPrivateSlotCount:
        units.reduce(
          (total, unit) =>
            total +
              unit.privatePromptRequest.slotReceipts.length,
          0,
        ),
    },
    registryPolicy: {
      currentObservedProductionToolIdentityCount:
        input.admissionCandidate.currentRegistryObservation
          .productionToolIdentityCount,
      currentObservedCountIsProductCap: false,
      registryExpansionPermitted: true,
      postAdmissionCountDerivedFromReleasedDistinctIdentities:
        true,
      oneComfyUiIdentityForSharedGpuAttempt: true,
      fakeIdentityForModelWeightAdapterOrLibraryAllowed:
        false,
      auraFaceMayUseDistinctReleasedCpuQaIdentity: true,
    },
    openGateCodes:
      LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    selectedSceneRequestRevalidated: true,
    fullFrameRatioExtensionRevalidated: true,
    admissionCandidateRevalidated: true,
    approvedSnapshotSceneContinuityTimingWorkAssetAndCostRevalidated:
      true,
    oneMaterializationUnitPerApprovedGeneratedOutput: true,
    benchmarkPromptPathUsed: false,
    benchmarkSubstitutionAllowed: false,
    callerSeedDimensionsPromptModelPathUrlBytesCredentialCommandOrEnvironmentAllowed:
      false,
    processBoundSingleUsePromptRequestLeasesCreated: true,
    allPrivateValuesExcludedFromReceipt: true,
    operationRegistered: false,
    dispatchGranted: false,
    workerLeaseCreated: false,
    runtimeExecuted: false,
    actualCostReceiptCreated: false,
    assetCreated: false,
    approvalPromoted: false,
    finalCanvasClaimAllowed: false,
    productionReady: false,
  }
}

function compilePrompt(input: {
  readonly requestUnit:
    LivingFrameControlledImageSelectedSceneRequestUnit
  readonly resolvedSlots:
    readonly LivingFrameControlledImageSelectedSceneResolvedPrivateSlot[]
  readonly enabledFeatures:
    readonly LivingFrameControlledImageSelectedSceneGraphFeature[]
  readonly widthPixels: number
  readonly heightPixels: number
  readonly seed: number
}): LivingFrameControlledImageSelectedScenePrivateComfyUiPrompt {
  assertResolvedSlots(
    input.requestUnit,
    input.resolvedSlots,
  )
  const values = new Map(
    input.resolvedSlots.map((slot) => [
      slot.slotKind,
      slot.value,
    ]),
  )
  const usesLora = input.enabledFeatures.includes('lora')
  const usesControlNet =
    input.enabledFeatures.includes('controlnet')
  const usesIpAdapter =
    input.enabledFeatures.includes('generic_ipadapter')
  const nodes: Record<
    string,
    LivingFrameControlledImageSelectedScenePrivatePromptNode
  > = {}
  let order = 0
  const append = (
    classType:
      LivingFrameControlledSdxlBenchmarkGraphNodeClass,
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
  if (usesControlNet) {
    const controlLoader = append('ControlNetLoader', {
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
    const controlApply = append('ControlNetApplyAdvanced', {
      positive: [positive, 0],
      negative: [negative, 0],
      control_net: [controlLoader, 0],
      image: [controlImage, 0],
      strength: usesLora ? 0.75 : 0.85,
      start_percent: usesLora ? 0.1 : 0,
      end_percent: usesLora ? 1 : 0.9,
    })
    positiveSource = controlApply
    negativeSource = controlApply
  }
  const latent = append('EmptyLatentImage', {
    width: input.widthPixels,
    height: input.heightPixels,
    batch_size: 1,
  })
  let finalModelSource = modelSource
  if (usesIpAdapter) {
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
    const referenceImage = append('LoadImage', {
      image: requireSlot(
        values,
        'reference_image_artifact',
      ),
    })
    finalModelSource = append('IPAdapterAdvanced', {
      model: [modelSource, 0],
      ipadapter: [ipAdapter, 0],
      image: [referenceImage, 0],
      clip_vision: [clipVision, 0],
      weight: 0.85,
      weight_type: 'linear',
      combine_embeds: 'average',
      start_at: 0,
      end_at: 0.9,
      embeds_scaling: 'v_only',
    })
  }
  const sampler = append('KSampler', {
    model: [finalModelSource, 0],
    positive: [positiveSource, 0],
    negative: [
      negativeSource,
      usesControlNet ? 1 : 0,
    ],
    latent_image: [latent, 0],
    seed: input.seed,
    steps: 24,
    cfg: 5.5,
    sampler_name: 'dpmpp_2m',
    scheduler: 'karras',
    denoise: 1,
  })
  const vae = append('VAEDecode', {
    samples: [sampler, 0],
    vae: [base, 2],
  })
  append('SaveImageWebsocket', {
    images: [vae, 0],
  })
  return deepFreeze(nodes)
}

function graphFeatures(
  unit: LivingFrameControlledImageSelectedSceneRequestUnit,
): readonly LivingFrameControlledImageSelectedSceneGraphFeature[] {
  const features:
    LivingFrameControlledImageSelectedSceneGraphFeature[] =
    ['base']
  if (unit.controlPolicy.loraAdapterRequired) {
    features.push('lora')
  }
  if (unit.controlPolicy.structureConditioningRequired) {
    features.push('controlnet')
  }
  if (unit.controlPolicy.referenceConditioningRequired) {
    features.push('generic_ipadapter')
  }
  if (
    unit.controlPolicy.genericIpAdapterOnly !== true
    || unit.controlPolicy
      .faceIdOrUnapprovedIdentityAdapterAllowed !== false
    || (
      unit.controlPolicy.structureConditioningRequired
      && unit.controlPolicy
        .controlImagePreparedOutsideComfyUi !== true
    )
    || (
      unit.controlPolicy.referenceConditioningRequired
      && unit.controlPolicy
        .referenceImageMustComeFromApprovedContinuityPack
          !== true
    )
  ) throw invalid(
    'graph_family_not_qualified',
    `$.requestUnits.${unit.order}.controlPolicy`,
  )
  return Object.freeze(features)
}

function generationCanvas(
  unit: LivingFrameControlledImageSelectedSceneRequestUnit,
  ratioUnit:
    LivingFrameControlledImageFullFrameRatioUnit | null,
): {
  readonly canvasClass:
    | 'isolated_component_square_1024'
    | 'confirmed_full_frame_ratio'
  readonly widthPixels: number
  readonly heightPixels: number
  readonly dimensionSource:
    | 'selected_scene_isolated_component_policy'
    | 'confirmed_full_frame_ratio_extension'
} {
  const fullFrame =
    FULL_FRAME_COMPONENT_ROLES.has(unit.componentRole)
  if (fullFrame) {
    if (
      !ratioUnit
      || ratioUnit.frameProfile
        .confirmedOutputFrameExpectationDigestSha256 !==
          unit.generationCanvas
            .finalOutputFrameExpectationDigestSha256
      || ratioUnit.frameProfile
        .sourceGenerationCanvasMatchesConfirmedRatio !== true
      || ratioUnit.frameProfile.squareSubstitutionApplied !== false
      || ratioUnit.frameProfile.finalCanvasCreatedByComfyUi !== false
    ) throw invalid(
      'full_frame_ratio_unit_missing',
      `$.requestUnits.${unit.order}`,
    )
    return {
      canvasClass: 'confirmed_full_frame_ratio',
      widthPixels: ratioUnit.frameProfile.widthPixels,
      heightPixels: ratioUnit.frameProfile.heightPixels,
      dimensionSource:
        'confirmed_full_frame_ratio_extension',
    }
  }
  if (
    ratioUnit !== null
    || unit.requestUnitState !==
      'ready_for_exact_operation_binding'
    || unit.generationCanvas.canvasClass !==
      'isolated_component_square_1024'
    || unit.generationCanvas.widthPixels !== 1_024
    || unit.generationCanvas.heightPixels !== 1_024
  ) throw invalid(
    'generation_canvas_invalid',
    `$.requestUnits.${unit.order}.generationCanvas`,
  )
  return {
    canvasClass: 'isolated_component_square_1024',
    widthPixels: 1_024,
    heightPixels: 1_024,
    dimensionSource:
      'selected_scene_isolated_component_policy',
  }
}

function fullFrameRatioUnitFor(
  unit: LivingFrameControlledImageSelectedSceneRequestUnit,
  extension:
    LivingFrameControlledImageFullFrameRatioExtension,
): LivingFrameControlledImageFullFrameRatioUnit | null {
  const matches =
    extension.fullFrameRequestUnits.filter((candidate) =>
      candidate.selectedSceneRequestUnitId ===
        unit.requestUnitId)
  if (matches.length > 1) {
    throw invalid(
      'full_frame_ratio_unit_missing',
      `$.fullFrameRatioExtension.fullFrameRequestUnits.${unit.requestUnitId}`,
    )
  }
  return matches[0] ?? null
}

function deterministicSeed(
  unit: LivingFrameControlledImageSelectedSceneRequestUnit,
): number {
  return Number.parseInt(
    digest({
      policy:
        'living_frame_selected_scene_server_seed_v1',
      requestUnitDigestSha256:
        unit.requestUnitDigestSha256,
      approvedWorkItemId: unit.approvedWorkItemId,
      outputKey: unit.outputKey,
    }).slice(0, 12),
    16,
  )
}

function assertResolvedSlots(
  unit: LivingFrameControlledImageSelectedSceneRequestUnit,
  slots:
    readonly LivingFrameControlledImageSelectedSceneResolvedPrivateSlot[],
): void {
  if (
    slots.length !== unit.privateSlotKinds.length
    || slots.some((slot, order) =>
      slot.order !== order
      || slot.slotKind !== unit.privateSlotKinds[order])
  ) throw invalid(
    'slot_set_invalid',
    `$.packet.units.${unit.order}.resolvedSlots`,
  )
}

function requireSlot(
  slots: ReadonlyMap<
    LivingFrameControlledSdxlBenchmarkRequestSlotKind,
    string
  >,
  slotKind: LivingFrameControlledSdxlBenchmarkRequestSlotKind,
): string {
  const value = slots.get(slotKind)
  if (value === undefined) {
    throw invalid('slot_set_invalid', '$.packet.units')
  }
  return value
}

function compileSlotReceipts(
  slots:
    readonly LivingFrameControlledImageSelectedSceneResolvedPrivateSlot[],
): readonly LivingFrameControlledImageSelectedScenePrivatePromptSlotReceipt[] {
  return deepFreeze(slots.map((slot) => ({
    order: slot.order,
    slotKind: slot.slotKind,
    valueClass: slot.valueClass,
    valueDigestSha256: digest(slot.value),
    valueByteLength: Buffer.byteLength(slot.value, 'utf8'),
    valueIncluded: false,
  })))
}

function assertPacket(
  value: unknown,
  request: LivingFrameControlledImageSelectedSceneRequest,
  extension:
    LivingFrameControlledImageFullFrameRatioExtension,
): LivingFrameControlledImageSelectedScenePrivatePromptPacket {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'selectedSceneRequestBindingDigestSha256',
      'fullFrameRatioExtensionDigestSha256',
      'approvedSnapshotId',
      'approvedSnapshotHashSha256',
      'sceneId',
      'units',
    ])
    || value.selectedSceneRequestBindingDigestSha256 !==
      request.requestBindingDigestSha256
    || value.fullFrameRatioExtensionDigestSha256 !==
      extension.extensionDigestSha256
    || value.approvedSnapshotId !==
      request.sourceBindings.approvedSnapshotId
    || value.approvedSnapshotHashSha256 !==
      request.sourceBindings.approvedSnapshotHashSha256
    || value.sceneId !== request.canonicalScope.sceneId
    || !Array.isArray(value.units)
    || value.units.length !== request.requestUnits.length
  ) throw invalid('packet_invalid', '$.packet')
  const units =
    value.units.map((unit, order) =>
      assertPacketUnit(
        unit,
        order,
        request.requestUnits[order]!,
      ))
  return {
    selectedSceneRequestBindingDigestSha256:
      value.selectedSceneRequestBindingDigestSha256,
    fullFrameRatioExtensionDigestSha256:
      value.fullFrameRatioExtensionDigestSha256,
    approvedSnapshotId: value.approvedSnapshotId,
    approvedSnapshotHashSha256:
      value.approvedSnapshotHashSha256,
    sceneId: value.sceneId,
    units,
  }
}

function assertPacketUnit(
  value: unknown,
  order: number,
  requestUnit:
    LivingFrameControlledImageSelectedSceneRequestUnit,
): LivingFrameControlledImageSelectedScenePrivatePromptPacketUnit {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'order',
      'requestUnitId',
      'requestUnitDigestSha256',
      'sceneId',
      'outputKey',
      'approvedWorkItemId',
      'approvedWorkItemKey',
      'approvedPlannedAssetManifestEntryId',
      'serverOwnedConditioningLocatorId',
      'resolvedSlots',
    ])
    || value.order !== order
    || typeof value.requestUnitId !== 'string'
    || typeof value.requestUnitDigestSha256 !== 'string'
    || typeof value.sceneId !== 'string'
    || typeof value.outputKey !== 'string'
    || typeof value.approvedWorkItemId !== 'string'
    || typeof value.approvedWorkItemKey !== 'string'
    || typeof value.approvedPlannedAssetManifestEntryId !==
      'string'
    || typeof value.serverOwnedConditioningLocatorId !==
      'string'
    || !Array.isArray(value.resolvedSlots)
  ) throw invalid(
    'packet_invalid',
    `$.packet.units.${order}`,
  )
  const resolvedSlots =
    value.resolvedSlots.map((slot, slotOrder) =>
      assertSlot(slot, slotOrder))
  const packetUnit = {
    order,
    requestUnitId: value.requestUnitId,
    requestUnitDigestSha256:
      value.requestUnitDigestSha256,
    sceneId: value.sceneId,
    outputKey: value.outputKey,
    approvedWorkItemId:
      value.approvedWorkItemId,
    approvedWorkItemKey:
      value.approvedWorkItemKey,
    approvedPlannedAssetManifestEntryId:
      value.approvedPlannedAssetManifestEntryId,
    serverOwnedConditioningLocatorId:
      value.serverOwnedConditioningLocatorId,
    resolvedSlots,
  }
  assertPacketUnitLineage(requestUnit, packetUnit)
  return packetUnit
}

function assertPacketUnitLineage(
  requestUnit:
    LivingFrameControlledImageSelectedSceneRequestUnit,
  packetUnit:
    LivingFrameControlledImageSelectedScenePrivatePromptPacketUnit,
): void {
  if (
    packetUnit.order !== requestUnit.order
    || packetUnit.requestUnitId !== requestUnit.requestUnitId
    || packetUnit.requestUnitDigestSha256 !==
      requestUnit.requestUnitDigestSha256
    || packetUnit.sceneId !== requestUnit.sceneId
    || packetUnit.outputKey !== requestUnit.outputKey
    || packetUnit.approvedWorkItemId !==
      requestUnit.approvedWorkItemId
    || packetUnit.approvedWorkItemKey !==
      requestUnit.approvedWorkItemKey
    || packetUnit.approvedPlannedAssetManifestEntryId !==
      requestUnit.approvedPlannedAssetManifestEntryId
    || packetUnit.serverOwnedConditioningLocatorId !==
      requestUnit.serverOwnedConditioningLocatorId
  ) throw invalid(
    'cross_scene_work_item_or_output_substitution',
    `$.packet.units.${requestUnit.order}`,
  )
}

function assertSlot(
  value: unknown,
  order: number,
): LivingFrameControlledImageSelectedSceneResolvedPrivateSlot {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'order',
      'slotKind',
      'valueClass',
      'value',
    ])
    || value.order !== order
    || typeof value.slotKind !== 'string'
    || typeof value.valueClass !== 'string'
    || typeof value.value !== 'string'
  ) throw invalid(
    'slot_value_invalid',
    `$.packet.resolvedSlots.${order}`,
  )
  const slotKind =
    value.slotKind as
      LivingFrameControlledSdxlBenchmarkRequestSlotKind
  const expectedClass = slotValueClass(slotKind)
  if (value.valueClass !== expectedClass) {
    throw invalid(
      'slot_value_invalid',
      `$.packet.resolvedSlots.${order}`,
    )
  }
  if (expectedClass === 'private_conditioning_text') {
    assertPromptText(value.value, order)
  } else {
    assertPrivateAlias(
      value.value,
      expectedClass === 'private_model_alias'
        ? 'model'
        : 'image',
      order,
    )
  }
  return {
    order,
    slotKind,
    valueClass: expectedClass,
    value: value.value,
  }
}

function slotValueClass(
  slotKind: LivingFrameControlledSdxlBenchmarkRequestSlotKind,
):
  LivingFrameControlledImageSelectedSceneResolvedPrivateSlot[
    'valueClass'
  ] {
  if ([
    'base_checkpoint_artifact',
    'controlnet_checkpoint_artifact',
    'lora_adapter_artifact',
    'generic_ipadapter_checkpoint_artifact',
    'clip_vision_checkpoint_artifact',
  ].includes(slotKind)) return 'private_model_alias'
  if ([
    'positive_conditioning_text',
    'negative_conditioning_text',
  ].includes(slotKind)) return 'private_conditioning_text'
  if ([
    'control_image_artifact',
    'reference_image_artifact',
  ].includes(slotKind)) return 'private_image_alias'
  throw invalid('slot_value_invalid', '$.packet.resolvedSlots')
}

function assertPromptText(
  value: string,
  order: number,
): void {
  const byteLength = Buffer.byteLength(value, 'utf8')
  if (
    value.length < 1
    || byteLength > MAX_PROMPT_TEXT_BYTES
    || hasControlCharacter(value)
    || URL_LIKE.test(value)
    || SECRET_LIKE.test(value)
  ) throw invalid(
    'prompt_text_invalid',
    `$.packet.resolvedSlots.${order}`,
  )
}

function assertPrivateAlias(
  value: string,
  kind: 'model' | 'image',
  order: number,
): void {
  const allowedSuffix = kind === 'model'
    ? value.endsWith('.safetensors')
    : value.endsWith('.png')
  if (
    value.length < 3
    || value.length > 128
    || !PRIVATE_ALIAS.test(value)
    || value.includes('..')
    || value.includes('/')
    || value.includes('\\')
    || URL_LIKE.test(value)
    || SECRET_LIKE.test(value)
    || !allowedSuffix
  ) throw invalid(
    'private_alias_invalid',
    `$.packet.resolvedSlots.${order}`,
  )
}

function assertSourceLineage(
  input:
    CreateLivingFrameControlledImageSelectedScenePrivatePromptMaterializationInput,
): void {
  const request = input.selectedSceneRequest
  const ratio = input.fullFrameRatioExtension
  if (
    ratio.sourceBindings
      .selectedSceneRequestBindingDigestSha256 !==
        request.requestBindingDigestSha256
    || ratio.canonicalScope.sceneId !==
      request.canonicalScope.sceneId
    || ratio.sourceBindings.approvedSnapshotId !==
      request.sourceBindings.approvedSnapshotId
    || ratio.sourceBindings.approvedSnapshotHashSha256 !==
      request.sourceBindings.approvedSnapshotHashSha256
    || ratio.sourceBindings
      .confirmedOutputFrameExpectationDigestSha256 !==
        request.sourceBindings
          .outputFrameExpectationDigestSha256
    || ratio.sourceBindings
      .currentMasterTimingDigestSha256 !==
        request.sourceBindings
          .currentMasterTimingDigestSha256
    || input.fullFrameRatioExtensionInput
      .selectedSceneRequest.requestBindingDigestSha256 !==
        request.requestBindingDigestSha256
    || input.fullFrameRatioExtensionInput
      .admissionCandidate.candidateDigestSha256 !==
        input.admissionCandidate.candidateDigestSha256
    || input.admissionCandidate
      .admissionDecision.registryExpansionPermitted !== true
    || input.admissionCandidate
      .admissionDecision
      .postAdmissionToolIdentityCountDerivedFromReleasedDistinctIdentities
        !== true
    || input.admissionCandidate
      .admissionDecision
      .fakeIdentityForModelWeightAdapterOrLibraryAllowed !== false
    || input.admissionCandidate
      .workerRuntimeExpectation.processEntrypointKind !==
        'fixed_supervised_python_process'
    || input.admissionCandidate
      .sourceBindings.deniedTopLevelImports.length !== 1
    || input.admissionCandidate
      .sourceBindings.deniedTopLevelImports[0] !== 'sam2'
    || input.admissionCandidate.operationRegistered !== false
    || input.admissionCandidate.dispatchGranted !== false
    || input.admissionCandidate.productionReady !== false
  ) throw invalid('source_lineage_mismatch', '$')
  const ratioRequestIds = new Set(
    ratio.fullFrameRequestUnits.map((unit) =>
      unit.selectedSceneRequestUnitId),
  )
  const fullFrameRequestIds =
    request.requestUnits.filter((unit) =>
      FULL_FRAME_COMPONENT_ROLES.has(unit.componentRole))
      .map((unit) => unit.requestUnitId)
  if (
    ratioRequestIds.size !== fullFrameRequestIds.length
    || fullFrameRequestIds.some((id) =>
      !ratioRequestIds.has(id))
    || ratio.isolatedComponentBoundary
      .isolatedUnitCount !==
        request.requestUnits.length -
          fullFrameRequestIds.length
  ) throw invalid(
    'full_frame_ratio_extension_invalid',
    '$.fullFrameRatioExtension',
  )
}

function requireReader(
  reader:
    LivingFrameControlledImageSelectedScenePrivatePromptReaderPort | null,
): LivingFrameControlledImageSelectedScenePrivatePromptReaderPort {
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
      'process_bound_server_owned_selected_scene_private_prompt_reader_v1'
    || reader.sourceAuthority !==
      'current_selected_scene_conditioning_and_private_alias_repository'
    || reader.callerPacketAccepted !== false
    || reader.callerPromptAccepted !== false
    || reader.callerSlotValueAccepted !== false
    || reader
      .callerSeedDimensionsModelPathUrlBytesCredentialCommandOrEnvironmentAccepted
        !== false
    || reader.operationAuthority !== false
    || reader.dispatchAuthority !== false
    || reader.runtimeAuthority !== false
    || reader.productionReady !== false
  ) throw invalid('reader_invalid', '$.reader')
  return reader
}

function assertInput(
  input:
    CreateLivingFrameControlledImageSelectedScenePrivatePromptMaterializationInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'materializationBatchId',
      'serverOwnedMaterializationLocatorId',
      'selectedSceneRequest',
      'selectedSceneRequestInput',
      'fullFrameRatioExtension',
      'fullFrameRatioExtensionInput',
      'admissionCandidate',
      'reader',
    ])
    || typeof input.materializationBatchId !== 'string'
    || !SAFE_ID.test(input.materializationBatchId)
    || typeof input.serverOwnedMaterializationLocatorId !==
      'string'
    || !SAFE_ID.test(
      input.serverOwnedMaterializationLocatorId,
    )
    || !isRecord(input.selectedSceneRequest)
    || !isRecord(input.selectedSceneRequestInput)
    || !isRecord(input.fullFrameRatioExtension)
    || !isRecord(input.fullFrameRatioExtensionInput)
    || !isRecord(input.admissionCandidate)
  ) throw invalid('input_invalid', '$')
}

function assertNodePolicy(
  nodeClasses:
    readonly LivingFrameControlledSdxlBenchmarkGraphNodeClass[],
): void {
  if (
    nodeClasses.length < 7
    || nodeClasses.length > 15
    || nodeClasses.some((nodeClass) =>
      !ALLOWED_NODE_CLASSES.has(nodeClass))
    || nodeClasses.some((nodeClass) =>
      DENIED_NODE_CLASSES.has(nodeClass))
    || nodeClasses.at(-1) !== 'SaveImageWebsocket'
    || nodeClasses.filter((nodeClass) =>
      nodeClass === 'SaveImageWebsocket').length !== 1
  ) throw invalid('node_allowlist_violation', '$.prompt')
}

function graphEdges(
  prompt:
    LivingFrameControlledImageSelectedScenePrivateComfyUiPrompt,
): readonly {
  readonly targetNodeId: string
  readonly inputName: string
  readonly sourceNodeId: string
  readonly outputIndex: number
}[] {
  const edges: Array<{
    readonly targetNodeId: string
    readonly inputName: string
    readonly sourceNodeId: string
    readonly outputIndex: number
  }> = []
  const nodeOrder = new Map(
    Object.keys(prompt).map((nodeId, index) => [
      nodeId,
      index,
    ]),
  )
  for (const [targetNodeId, node] of
    Object.entries(prompt)) {
    for (const [inputName, value] of
      Object.entries(node.inputs)) {
      if (
        !Array.isArray(value)
        || value.length !== 2
        || typeof value[0] !== 'string'
        || typeof value[1] !== 'number'
      ) continue
      const sourceOrder = nodeOrder.get(value[0])
      const targetOrder = nodeOrder.get(targetNodeId)
      if (
        sourceOrder === undefined
        || targetOrder === undefined
        || sourceOrder >= targetOrder
        || !Number.isInteger(value[1])
        || value[1] < 0
        || value[1] > 15
      ) throw invalid(
        'edge_reference_invalid',
        `$.prompt.${targetNodeId}.inputs.${inputName}`,
      )
      edges.push({
        targetNodeId,
        inputName,
        sourceNodeId: value[0],
        outputIndex: value[1],
      })
    }
  }
  return deepFreeze(edges)
}

function assertReceiptSemantics(
  draft:
    LivingFrameControlledImageSelectedScenePrivatePromptMaterializationDraft,
): void {
  draft.materializationUnits.forEach((unit) =>
    assertNodePolicyForReceipt(
      unit.graphProfile.nodeClasses,
    ))
  const {
    selectedScenePrivatePromptMaterializationAuthority,
    ...delegatedAuthorities
  } = draft.authorityBoundary
  if (
    !hasExactKeys(draft as unknown as Record<string, unknown>, [
      'contractVersion',
      'resultClass',
      'materializationState',
      'materializationBatchId',
      'serverOwnedMaterializationLocatorId',
      'canonicalScope',
      'sourceBindings',
      'materializationUnits',
      'metrics',
      'registryPolicy',
      'openGateCodes',
      'authorityBoundary',
      'selectedSceneRequestRevalidated',
      'fullFrameRatioExtensionRevalidated',
      'admissionCandidateRevalidated',
      'approvedSnapshotSceneContinuityTimingWorkAssetAndCostRevalidated',
      'oneMaterializationUnitPerApprovedGeneratedOutput',
      'benchmarkPromptPathUsed',
      'benchmarkSubstitutionAllowed',
      'callerSeedDimensionsPromptModelPathUrlBytesCredentialCommandOrEnvironmentAllowed',
      'processBoundSingleUsePromptRequestLeasesCreated',
      'allPrivateValuesExcludedFromReceipt',
      'operationRegistered',
      'dispatchGranted',
      'workerLeaseCreated',
      'runtimeExecuted',
      'actualCostReceiptCreated',
      'assetCreated',
      'approvalPromoted',
      'finalCanvasClaimAllowed',
      'productionReady',
    ])
    || draft.materializationUnits.length < 1
    || draft.materializationUnits.length !==
      draft.metrics.approvedGeneratedOutputCount
    || draft.materializationUnits.length !==
      draft.metrics.materializationUnitCount
    || draft.materializationUnits.length !==
      draft.metrics.privateLeaseCount
    || new Set(
      draft.materializationUnits.map((unit) =>
        unit.materializationUnitId),
    ).size !== draft.materializationUnits.length
    || new Set(
      draft.materializationUnits.map((unit) =>
        unit.requestUnitId),
    ).size !== draft.materializationUnits.length
    || new Set(
      draft.materializationUnits.map((unit) =>
        unit.outputKey),
    ).size !== draft.materializationUnits.length
    || draft.materializationUnits.some((unit, order) =>
      unit.order !== order
      || unit.graphProfile.enabledFeatures[0] !== 'base'
      || new Set(unit.graphProfile.enabledFeatures).size !==
        unit.graphProfile.enabledFeatures.length
      || unit.graphProfile.enabledFeatures.some((feature) =>
        ![
          'base',
          'lora',
          'controlnet',
          'generic_ipadapter',
        ].includes(feature))
      || unit.graphProfile.benchmarkCaseOrRecipeUsed !== false
      || unit.graphProfile.faceIdOrInsightFaceAllowed !== false
      || unit.graphProfile.inGraphPreprocessorAllowed !== false
      || unit.graphProfile.arbitrarySaveOrPreviewNodeAllowed !== false
      || unit.graphProfile.websocketOutputOnly !== true
      || unit.generationCanvas
        .callerSelectedDimensionsAllowed !== false
      || unit.generationCanvas.squareSubstitutionApplied !== false
      || unit.generationCanvas.finalCanvasCreatedByComfyUi !== false
      || (
        unit.generationCanvas.canvasClass ===
          'isolated_component_square_1024'
        && (
          unit.generationCanvas.widthPixels !== 1_024
          || unit.generationCanvas.heightPixels !== 1_024
          || unit.fullFrameRatioExtensionUnitId !== null
          || unit.fullFrameRatioExtensionUnitDigestSha256 !== null
        )
      )
      || (
        unit.generationCanvas.canvasClass ===
          'confirmed_full_frame_ratio'
        && (
          unit.generationCanvas.widthPixels < 64
          || unit.generationCanvas.heightPixels < 64
          || !unit.fullFrameRatioExtensionUnitId
          || !unit.fullFrameRatioExtensionUnitDigestSha256
        )
      )
      || unit.deterministicSeedPolicy.callerSeedAllowed !== false
      || unit.deterministicSeedPolicy.seedIncludedInReceipt !== false
      || unit.atomicModelMountPolicy.exactModelRoleCount !== 5
      || unit.atomicModelMountPolicy.exactModelArtifactByteLength !==
        EXACT_MODEL_ARTIFACT_BYTE_LENGTH
      || canonicalJson(
        unit.atomicModelMountPolicy.exactModelRoles,
      ) !== canonicalJson(
        LIVING_FRAME_CONTROLLED_MODEL_FAMILY_ROLES,
      )
      || unit.attemptPolicy.deniedTopLevelImports.length !== 1
      || unit.attemptPolicy.deniedTopLevelImports[0] !== 'sam2'
      || unit.attemptPolicy.confinementDigestSha256 !==
        LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256
      || unit.privatePromptRequest.rawPromptIncludedInReceipt !== false
      || unit.privatePromptRequest
        .rawConditioningTextIncludedInReceipt !== false
      || unit.privatePromptRequest
        .modelOrImageAliasIncludedInReceipt !== false
      || unit.privatePromptRequest
        .modelOrImageBytesIncludedInReceipt !== false
      || unit.privatePromptRequest
        .pathUrlCredentialCommandOrEnvironmentIncludedInReceipt
          !== false
      || unit.privatePromptRequest.leaseConsumed !== false
      || unit.privatePromptRequest.nodeCount !==
        unit.graphProfile.nodeClasses.length
      || unit.downstreamPolicy.remotionOwnsFinalComposition !== true
      || unit.operationRegistered !== false
      || unit.dispatched !== false
      || unit.gpuAttemptCreated !== false
      || unit.actualCostReceiptCreated !== false
      || unit.assetCreated !== false
      || unit.materializationUnitDigestSha256 !==
        digest(withoutUnitDigest(unit)))
    || draft.metrics.isolatedComponentUnitCount !==
      draft.materializationUnits.filter((unit) =>
        unit.generationCanvas.canvasClass ===
          'isolated_component_square_1024').length
    || draft.metrics.fullFrameRatioUnitCount !==
      draft.materializationUnits.filter((unit) =>
        unit.generationCanvas.canvasClass ===
          'confirmed_full_frame_ratio').length
    || draft.metrics.loraUnitCount !==
      draft.materializationUnits.filter((unit) =>
        unit.graphProfile.enabledFeatures.includes('lora')).length
    || draft.metrics.controlNetUnitCount !==
      draft.materializationUnits.filter((unit) =>
        unit.graphProfile.enabledFeatures.includes('controlnet')).length
    || draft.metrics.genericIpAdapterUnitCount !==
      draft.materializationUnits.filter((unit) =>
        unit.graphProfile.enabledFeatures
          .includes('generic_ipadapter')).length
    || draft.metrics.totalPromptNodeCount !==
      draft.materializationUnits.reduce(
        (total, unit) =>
          total + unit.privatePromptRequest.nodeCount,
        0,
      )
    || draft.metrics.totalPrivateSlotCount !==
      draft.materializationUnits.reduce(
        (total, unit) =>
          total +
            unit.privatePromptRequest.slotReceipts.length,
        0,
      )
    || canonicalJson(draft.openGateCodes) !==
      canonicalJson(
        LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_OPEN_GATES,
      )
    || draft.sourceBindings
      .runtimeConfinementRequirementDigestSha256 !==
        LIVING_FRAME_COMFYUI_RUNTIME_CONFINEMENT_REQUIREMENT_DIGEST_SHA256
    || draft.registryPolicy.currentObservedCountIsProductCap !== false
    || draft.registryPolicy.registryExpansionPermitted !== true
    || draft.registryPolicy
      .postAdmissionCountDerivedFromReleasedDistinctIdentities
        !== true
    || draft.registryPolicy
      .oneComfyUiIdentityForSharedGpuAttempt !== true
    || draft.registryPolicy
      .fakeIdentityForModelWeightAdapterOrLibraryAllowed !== false
    || selectedScenePrivatePromptMaterializationAuthority !== true
    || Object.values(delegatedAuthorities).some(
      (value) => value !== false,
    )
    || draft.selectedSceneRequestRevalidated !== true
    || draft.fullFrameRatioExtensionRevalidated !== true
    || draft.admissionCandidateRevalidated !== true
    || draft.oneMaterializationUnitPerApprovedGeneratedOutput !== true
    || draft.benchmarkPromptPathUsed !== false
    || draft.benchmarkSubstitutionAllowed !== false
    || draft
      .callerSeedDimensionsPromptModelPathUrlBytesCredentialCommandOrEnvironmentAllowed
        !== false
    || draft.processBoundSingleUsePromptRequestLeasesCreated !== true
    || draft.allPrivateValuesExcludedFromReceipt !== true
    || draft.operationRegistered !== false
    || draft.dispatchGranted !== false
    || draft.workerLeaseCreated !== false
    || draft.runtimeExecuted !== false
    || draft.actualCostReceiptCreated !== false
    || draft.assetCreated !== false
    || draft.approvalPromoted !== false
    || draft.finalCanvasClaimAllowed !== false
    || draft.productionReady !== false
  ) throw invalid('authority_promotion_forbidden', '$')
}

function assertNodePolicyForReceipt(
  nodeClasses: unknown,
): void {
  if (
    !Array.isArray(nodeClasses)
    || nodeClasses.some((nodeClass) =>
      typeof nodeClass !== 'string')
  ) throw invalid('node_allowlist_violation', '$')
  assertNodePolicy(
    nodeClasses as
      LivingFrameControlledSdxlBenchmarkGraphNodeClass[],
  )
}

function assertSafeReceipt(value: unknown): void {
  const serialized = canonicalJson(value)
  if (
    URL_LIKE.test(serialized)
    || SECRET_LIKE.test(serialized)
    || serialized.includes('/Users/')
    || serialized.includes('/Volumes/')
    || serialized.includes('/private/tmp/')
    || containsUnsafeReceiptKey(value)
  ) throw invalid('unsafe_receipt_forbidden', '$')
}

function containsUnsafeReceiptKey(value: unknown): boolean {
  const denied = new Set([
    'prompt',
    'rawPrompt',
    'text',
    'value',
    'modelAlias',
    'imageAlias',
    'modelPath',
    'path',
    'url',
    'bytes',
    'credential',
    'secret',
    'command',
    'environment',
    'callerSeed',
    'callerWidth',
    'callerHeight',
    'benchmarkCaseId',
    'benchmarkRecipe',
  ])
  let unsafe = false
  walk(value, (key) => {
    if (denied.has(key)) unsafe = true
  })
  return unsafe
}

function withoutUnitDigest(
  unit:
    LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit,
): Omit<
  LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit,
  'materializationUnitDigestSha256'
> {
  return Object.fromEntries(
    Object.entries(unit).filter(
      ([key]) => key !== 'materializationUnitDigestSha256',
    ),
  ) as Omit<
    LivingFrameControlledImageSelectedScenePrivatePromptMaterializationUnit,
    'materializationUnitDigestSha256'
  >
}

function walk(
  value: unknown,
  visit: (key: string) => void,
): void {
  if (Array.isArray(value)) {
    value.forEach((entry) => walk(entry, visit))
    return
  }
  if (!isRecord(value)) return
  for (const [key, child] of Object.entries(value)) {
    visit(key)
    walk(child, visit)
  }
}

function hasControlCharacter(value: string): boolean {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code < 32 || code === 127) return true
  }
  return false
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const sortedExpected = [...expected].sort()
  return canonicalJson(actual) ===
    canonicalJson(sortedExpected)
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(canonicalJson(value), 'utf8')
    .digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry))
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort((left, right) => left.localeCompare(right))
        .map((key) => [key, canonicalize(value[key])]),
    )
  }
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'boolean'
    || (
      typeof value === 'number'
      && Number.isFinite(value)
    )
  ) return value
  throw invalid('input_invalid', '$')
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
    Object.values(value).forEach((child) => deepFreeze(child))
  }
  return value
}

function invalid(
  code:
    LivingFrameControlledImageSelectedScenePrivatePromptIssueCode,
  path: string,
): LivingFrameControlledImageSelectedScenePrivatePromptMaterializationError {
  if (
    !(LIVING_FRAME_CONTROLLED_IMAGE_SELECTED_SCENE_PRIVATE_PROMPT_ISSUE_CODES as
      readonly string[]).includes(code)
  ) throw new Error(
    'Unknown Living Frame selected-scene prompt issue.',
  )
  return new LivingFrameControlledImageSelectedScenePrivatePromptMaterializationError(
    [{ code, path }],
  )
}
