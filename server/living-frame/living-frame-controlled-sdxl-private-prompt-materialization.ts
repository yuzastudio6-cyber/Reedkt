import { createHash } from 'node:crypto'

import { z } from 'zod'

import {
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_NODE_CLASSES,
  type LivingFrameControlledSdxlBenchmarkGraphInputValue,
  type LivingFrameControlledSdxlBenchmarkGraphRecipe,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-graph-blueprint'
import type {
  LivingFrameControlledSdxlBenchmarkRequestSlotKind,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-request-blueprint'
import {
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_SLOT_KINDS,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-request-blueprint'
import {
  LIVING_FRAME_CONTROLLED_SDXL_PRIVATE_PROMPT_MATERIALIZATION_CLASS,
  LIVING_FRAME_CONTROLLED_SDXL_PRIVATE_PROMPT_MATERIALIZATION_ISSUES,
  LIVING_FRAME_CONTROLLED_SDXL_PRIVATE_PROMPT_MATERIALIZATION_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_SDXL_PRIVATE_PROMPT_MATERIALIZATION_VERSION,
  type LivingFrameControlledSdxlPrivatePromptMaterialization,
  type LivingFrameControlledSdxlPrivatePromptMaterializationAuthority,
  type LivingFrameControlledSdxlPrivatePromptMaterializationDraft,
  type LivingFrameControlledSdxlPrivatePromptMaterializationIssue,
  type LivingFrameControlledSdxlPrivatePromptMaterializationIssueCode,
  type LivingFrameControlledSdxlPrivatePromptSlotReceipt,
} from '../../src/types/living-frame-controlled-sdxl-private-prompt-materialization'
import type {
  LivingFrameControlledSdxlCompatibilityBenchmarkCaseId,
} from '../../src/types/living-frame-controlled-sdxl-compatibility-benchmark-spec'
import {
  LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_CASE_IDS,
} from '../../src/types/living-frame-controlled-sdxl-compatibility-benchmark-spec'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const SHA256 = /^[a-f0-9]{64}$/u
const PRIVATE_ALIAS =
  /^[A-Za-z0-9][A-Za-z0-9._-]{0,126}[A-Za-z0-9]$/u
const URL_LIKE = /(?:https?:\/\/|file:\/\/|data:)/iu
const SECRET_LIKE =
  /(?:-----BEGIN [A-Z ]+PRIVATE KEY-----|AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9_-]{16,})/u
const MAX_PROMPT_TEXT_BYTES = 4_096
const MAX_SERIALIZED_PROMPT_BYTES = 128 * 1_024
const ALLOWED_NODE_CLASSES = new Set<string>(
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_NODE_CLASSES,
)
const ISSUE_CODES = new Set<string>(
  LIVING_FRAME_CONTROLLED_SDXL_PRIVATE_PROMPT_MATERIALIZATION_ISSUES,
)

type JsonPrimitive = string | number | boolean | null
type JsonValue =
  | JsonPrimitive
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue }

export interface LivingFramePrivateComfyUiPromptNode {
  readonly class_type: string
  readonly inputs: Readonly<Record<string, JsonValue>>
}

export type LivingFramePrivateComfyUiApiPrompt =
  Readonly<Record<string, LivingFramePrivateComfyUiPromptNode>>

export interface LivingFrameControlledSdxlResolvedPrivateSlot {
  readonly order: number
  readonly slotKind:
    LivingFrameControlledSdxlBenchmarkRequestSlotKind
  readonly valueClass:
    | 'private_model_alias'
    | 'private_conditioning_text'
    | 'private_image_alias'
  readonly value: string
}

export interface LivingFrameControlledSdxlPrivatePromptPacket {
  readonly graphBlueprintId: string
  readonly graphBlueprintDigestSha256: string
  readonly outputFrameExpectationDigestSha256: string
  readonly graphRecipe:
    LivingFrameControlledSdxlBenchmarkGraphRecipe
  readonly resolvedSlots:
    readonly LivingFrameControlledSdxlResolvedPrivateSlot[]
}

export interface LivingFrameControlledSdxlPrivatePromptReaderPort {
  readonly readerClass:
    'process_bound_server_owned_living_frame_private_prompt_reader_v1'
  readonly sourceAuthority:
    'current_graph_blueprint_and_private_slot_repository'
  readonly callerPacketAccepted: false
  readonly callerGraphAccepted: false
  readonly callerSlotValueAccepted: false
  readonly callerPathUrlOrCredentialAccepted: false
  readonly operationAuthority: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly productionReady: false
  readCurrentByServerOwnedLocator(
    serverOwnedLocatorId: string,
  ): Promise<unknown>
}

export interface LivingFrameControlledSdxlPrivatePromptLease {
  readonly leaseClass:
    'process_bound_single_use_comfyui_api_prompt_lease_v1'
  readonly leaseId: string
  readonly materializationDigestSha256: string
  readonly caseId:
    LivingFrameControlledSdxlCompatibilityBenchmarkCaseId
  readonly callerSerializable: false
  readonly callerPathAccepted: false
  readonly callerUrlAccepted: false
  readonly dispatchAuthority: false
  readonly runtimeAuthority: false
  readonly productionReady: false
}

export interface LivingFrameControlledSdxlPrivatePromptMaterializationResult {
  readonly receipt:
    LivingFrameControlledSdxlPrivatePromptMaterialization
  readonly privatePromptLease:
    LivingFrameControlledSdxlPrivatePromptLease
}

const AUTHORITY_BOUNDARY:
  LivingFrameControlledSdxlPrivatePromptMaterializationAuthority =
  deepFreeze({
    processBoundPrivateMaterializationAuthority: true,
    graphBlueprintAuthority: false,
    promptPlanningAuthority: false,
    modelArtifactRepositoryAuthority: false,
    modelArtifactMountAuthority: false,
    fixtureArtifactAuthority: false,
    providerAuthority: false,
    toolRegistryAuthority: false,
    toolRouteAuthority: false,
    operationAuthority: false,
    dispatchAuthority: false,
    selectedSceneAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    customerCreditAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    assetManifestAuthority: false,
    artifactCreationAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

const slotReceiptSchema = z.object({
  order: z.number().int().nonnegative().max(32),
  slotKind: z.enum(
    LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_REQUEST_SLOT_KINDS,
  ),
  valueClass: z.enum([
    'private_model_alias',
    'private_conditioning_text',
    'private_image_alias',
  ]),
  valueDigestSha256: z.string().regex(SHA256),
  valueByteLength: z.number().int().positive()
    .max(MAX_PROMPT_TEXT_BYTES),
  valueIncluded: z.literal(false),
}).strict()

const authorityBoundarySchema = z.object({
  processBoundPrivateMaterializationAuthority: z.literal(true),
  graphBlueprintAuthority: z.literal(false),
  promptPlanningAuthority: z.literal(false),
  modelArtifactRepositoryAuthority: z.literal(false),
  modelArtifactMountAuthority: z.literal(false),
  fixtureArtifactAuthority: z.literal(false),
  providerAuthority: z.literal(false),
  toolRegistryAuthority: z.literal(false),
  toolRouteAuthority: z.literal(false),
  operationAuthority: z.literal(false),
  dispatchAuthority: z.literal(false),
  selectedSceneAuthority: z.literal(false),
  timingAuthority: z.literal(false),
  soundAuthority: z.literal(false),
  estimateAuthority: z.literal(false),
  costAuthority: z.literal(false),
  customerCreditAuthority: z.literal(false),
  approvalAuthority: z.literal(false),
  snapshotAuthority: z.literal(false),
  workItemAuthority: z.literal(false),
  workGraphAuthority: z.literal(false),
  queueAuthority: z.literal(false),
  assetManifestAuthority: z.literal(false),
  artifactCreationAuthority: z.literal(false),
  qaApprovalAuthority: z.literal(false),
  renderAuthority: z.literal(false),
  runtimeAuthority: z.literal(false),
  productionAuthority: z.literal(false),
}).strict()

const receiptDraftSchema = z.object({
  contractVersion: z.literal(
    LIVING_FRAME_CONTROLLED_SDXL_PRIVATE_PROMPT_MATERIALIZATION_VERSION,
  ),
  resultClass: z.literal(
    LIVING_FRAME_CONTROLLED_SDXL_PRIVATE_PROMPT_MATERIALIZATION_CLASS,
  ),
  materializationId: z.string().regex(SAFE_ID),
  serverOwnedLocatorId: z.string().regex(SAFE_ID),
  caseId: z.enum(
    LIVING_FRAME_CONTROLLED_SDXL_COMPATIBILITY_BENCHMARK_CASE_IDS,
  ).exclude(['exact_bundle_load']),
  sourceBindings: z.object({
    graphBlueprintId: z.string().regex(SAFE_ID),
    graphBlueprintDigestSha256: z.string().regex(SHA256),
    graphRecipeDigestSha256: z.string().regex(SHA256),
    requestRecipeDigestSha256: z.string().regex(SHA256),
    outputFrameExpectationDigestSha256: z.string().regex(SHA256),
    privateSlotSetDigestSha256: z.string().regex(SHA256),
  }).strict(),
  graphSummary: z.object({
    topologicalNodeCount:
      z.number().int().positive().max(64),
    edgeReferenceCount:
      z.number().int().nonnegative().max(256),
    externalSlotReferenceCount:
      z.number().int().positive().max(16),
    outputNodeId: z.literal(
      'benchmark.bridge.websocket_image_output',
    ),
    allowedNodeClasses: z.array(z.enum(
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_NODE_CLASSES,
    )).min(1).max(
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_NODE_CLASSES.length,
    ),
    websocketOutputOnly: z.literal(true),
  }).strict(),
  privatePrompt: z.object({
    leaseId: z.string().regex(SAFE_ID),
    promptDigestSha256: z.string().regex(SHA256),
    serializedPromptByteLength:
      z.number().int().positive()
        .max(MAX_SERIALIZED_PROMPT_BYTES),
    nodeCount: z.number().int().positive().max(64),
    slotReceipts:
      z.array(slotReceiptSchema).min(1).max(16),
    rawPromptIncludedInReceipt: z.literal(false),
    rawConditioningTextIncludedInReceipt: z.literal(false),
    modelOrImageAliasIncludedInReceipt: z.literal(false),
    modelOrImageBytesIncludedInReceipt: z.literal(false),
    filesystemPathOrUrlIncludedInReceipt: z.literal(false),
  }).strict(),
  openGateCodes: z.array(z.enum(
    LIVING_FRAME_CONTROLLED_SDXL_PRIVATE_PROMPT_MATERIALIZATION_OPEN_GATES,
  )).length(
    LIVING_FRAME_CONTROLLED_SDXL_PRIVATE_PROMPT_MATERIALIZATION_OPEN_GATES
      .length,
  ),
  authorityBoundary: authorityBoundarySchema,
  currentBlueprintRereadThroughProcessBoundPort: z.literal(true),
  allExternalSlotsResolvedExactlyOnce: z.literal(true),
  allNodeEdgesRemainTopological: z.literal(true),
  exactNodeAllowlistPreserved: z.literal(true),
  privatePromptLeaseCreated: z.literal(true),
  privatePromptLeaseConsumed: z.literal(false),
  canonicalOperationRegistered: z.literal(false),
  dispatchReady: z.literal(false),
  gpuAttemptCreated: z.literal(false),
  actualAttemptCostEvidenceCreated: z.literal(false),
  selectedSceneCreated: z.literal(false),
  artifactCreated: z.literal(false),
  containsCallerPathUrlCredentialCommandProviderToolCostOrCommercialRoute:
    z.literal(false),
  subjectSpecificRouting: z.literal(false),
  productionReady: z.literal(false),
}).strict()

const receiptSchema = receiptDraftSchema.extend({
  materializationDigestSha256: z.string().regex(SHA256),
}).strict()

const readers = new WeakSet<object>()
const consumedReaders = new WeakSet<object>()
const leases = new WeakSet<object>()
const consumedLeases = new WeakSet<object>()
const privatePrompts =
  new WeakMap<object, LivingFramePrivateComfyUiApiPrompt>()

export class LivingFrameControlledSdxlPrivatePromptMaterializationError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledSdxlPrivatePromptMaterializationIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledSdxlPrivatePromptMaterializationIssue[],
  ) {
    super(
      'Living Frame controlled SDXL private prompt materialization failed.',
    )
    this.name =
      'LivingFrameControlledSdxlPrivatePromptMaterializationError'
    this.issues = issues
  }
}

export function createLivingFrameControlledSdxlPrivatePromptReader(
  readCurrentByServerOwnedLocator:
    LivingFrameControlledSdxlPrivatePromptReaderPort[
      'readCurrentByServerOwnedLocator'
    ],
): LivingFrameControlledSdxlPrivatePromptReaderPort {
  if (typeof readCurrentByServerOwnedLocator !== 'function') {
    throw invalid('reader_invalid', '$.reader')
  }
  const reader:
    LivingFrameControlledSdxlPrivatePromptReaderPort =
    Object.freeze({
      readerClass:
        'process_bound_server_owned_living_frame_private_prompt_reader_v1',
      sourceAuthority:
        'current_graph_blueprint_and_private_slot_repository',
      callerPacketAccepted: false,
      callerGraphAccepted: false,
      callerSlotValueAccepted: false,
      callerPathUrlOrCredentialAccepted: false,
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

export async function materializeLivingFrameControlledSdxlPrivatePrompt(
  input: {
    readonly serverOwnedLocatorId: string
    readonly reader:
      LivingFrameControlledSdxlPrivatePromptReaderPort | null
  },
): Promise<
  LivingFrameControlledSdxlPrivatePromptMaterializationResult
> {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'serverOwnedLocatorId',
      'reader',
    ])
    || typeof input.serverOwnedLocatorId !== 'string'
    || !SAFE_ID.test(input.serverOwnedLocatorId)
  ) throw invalid('input_invalid', '$')
  const reader = requireReader(input.reader)
  consumedReaders.add(reader)
  let packet: unknown
  try {
    packet =
      await reader.readCurrentByServerOwnedLocator(
        input.serverOwnedLocatorId,
      )
  } catch {
    throw invalid('reader_failed', '$.reader')
  }
  const current = assertPacket(packet)
  const prompt = compilePrompt(
    current.graphRecipe,
    current.resolvedSlots,
  )
  const serializedPrompt = canonicalJson(prompt)
  const serializedPromptByteLength =
    Buffer.byteLength(serializedPrompt, 'utf8')
  if (
    serializedPromptByteLength < 2
    || serializedPromptByteLength > MAX_SERIALIZED_PROMPT_BYTES
  ) throw invalid(
    'output_policy_invalid',
    '$.privatePrompt.serializedPromptByteLength',
  )
  const slotReceipts = compileSlotReceipts(
    current.resolvedSlots,
  )
  const materializationId =
    `lfprompt_${digest({
      locator: input.serverOwnedLocatorId,
      blueprint: current.graphBlueprintDigestSha256,
      recipe: current.graphRecipe.recipeDigestSha256,
      prompt: digest(prompt),
    }).slice(0, 40)}`
  const leaseId =
    `lfpromptlease_${digest({
      materializationId,
      caseId: current.graphRecipe.caseId,
      prompt: digest(prompt),
    }).slice(0, 40)}`
  const draft:
    LivingFrameControlledSdxlPrivatePromptMaterializationDraft = {
      contractVersion:
        LIVING_FRAME_CONTROLLED_SDXL_PRIVATE_PROMPT_MATERIALIZATION_VERSION,
      resultClass:
        LIVING_FRAME_CONTROLLED_SDXL_PRIVATE_PROMPT_MATERIALIZATION_CLASS,
      materializationId,
      serverOwnedLocatorId: input.serverOwnedLocatorId,
      caseId: current.graphRecipe.caseId,
      sourceBindings: {
        graphBlueprintId: current.graphBlueprintId,
        graphBlueprintDigestSha256:
          current.graphBlueprintDigestSha256,
        graphRecipeDigestSha256:
          current.graphRecipe.recipeDigestSha256,
        requestRecipeDigestSha256:
          current.graphRecipe.requestRecipeDigestSha256,
        outputFrameExpectationDigestSha256:
          current.outputFrameExpectationDigestSha256,
        privateSlotSetDigestSha256:
          digest(slotReceipts),
      },
      graphSummary: {
        topologicalNodeCount:
          current.graphRecipe.graph.nodeCount,
        edgeReferenceCount:
          current.graphRecipe.graph.edgeReferenceCount,
        externalSlotReferenceCount:
          current.graphRecipe.graph.externalSlotReferenceCount,
        outputNodeId:
          'benchmark.bridge.websocket_image_output',
        allowedNodeClasses:
          uniqueSorted(
            current.graphRecipe.graph.nodes.map(
              (node) => node.nodeClass,
            ),
          ),
        websocketOutputOnly: true,
      },
      privatePrompt: {
        leaseId,
        promptDigestSha256: digest(prompt),
        serializedPromptByteLength,
        nodeCount: Object.keys(prompt).length,
        slotReceipts,
        rawPromptIncludedInReceipt: false,
        rawConditioningTextIncludedInReceipt: false,
        modelOrImageAliasIncludedInReceipt: false,
        modelOrImageBytesIncludedInReceipt: false,
        filesystemPathOrUrlIncludedInReceipt: false,
      },
      openGateCodes:
        LIVING_FRAME_CONTROLLED_SDXL_PRIVATE_PROMPT_MATERIALIZATION_OPEN_GATES,
      authorityBoundary: AUTHORITY_BOUNDARY,
      currentBlueprintRereadThroughProcessBoundPort: true,
      allExternalSlotsResolvedExactlyOnce: true,
      allNodeEdgesRemainTopological: true,
      exactNodeAllowlistPreserved: true,
      privatePromptLeaseCreated: true,
      privatePromptLeaseConsumed: false,
      canonicalOperationRegistered: false,
      dispatchReady: false,
      gpuAttemptCreated: false,
      actualAttemptCostEvidenceCreated: false,
      selectedSceneCreated: false,
      artifactCreated: false,
      containsCallerPathUrlCredentialCommandProviderToolCostOrCommercialRoute:
        false,
      subjectSpecificRouting: false,
      productionReady: false,
    }
  assertReceiptSafe(draft)
  const receipt:
    LivingFrameControlledSdxlPrivatePromptMaterialization =
    deepFreeze({
      ...draft,
      materializationDigestSha256: digest(draft),
    })
  const lease:
    LivingFrameControlledSdxlPrivatePromptLease =
    Object.freeze({
      leaseClass:
        'process_bound_single_use_comfyui_api_prompt_lease_v1',
      leaseId,
      materializationDigestSha256:
        receipt.materializationDigestSha256,
      caseId: receipt.caseId,
      callerSerializable: false,
      callerPathAccepted: false,
      callerUrlAccepted: false,
      dispatchAuthority: false,
      runtimeAuthority: false,
      productionReady: false,
    })
  leases.add(lease)
  privatePrompts.set(lease, prompt)
  return Object.freeze({
    receipt,
    privatePromptLease: lease,
  })
}

export function consumeLivingFrameControlledSdxlPrivatePromptLease(
  lease: LivingFrameControlledSdxlPrivatePromptLease,
): LivingFramePrivateComfyUiApiPrompt {
  if (
    !leases.has(lease)
    || consumedLeases.has(lease)
    || lease.leaseClass
      !== 'process_bound_single_use_comfyui_api_prompt_lease_v1'
    || lease.callerSerializable !== false
    || lease.dispatchAuthority !== false
    || lease.runtimeAuthority !== false
    || lease.productionReady !== false
  ) throw invalid('reader_reused', '$.privatePromptLease')
  const prompt = privatePrompts.get(lease)
  if (!prompt) {
    throw invalid('reader_invalid', '$.privatePromptLease')
  }
  consumedLeases.add(lease)
  privatePrompts.delete(lease)
  return prompt
}

export function verifyLivingFrameControlledSdxlPrivatePromptMaterialization(
  value: unknown,
): value is LivingFrameControlledSdxlPrivatePromptMaterialization {
  try {
    const parsed = receiptSchema.safeParse(value)
    if (!parsed.success) return false
    const {
      materializationDigestSha256,
      ...draft
    } = parsed.data
    assertReceiptSafe(draft)
    return digest(draft) === materializationDigestSha256
  } catch {
    return false
  }
}

function requireReader(
  reader:
    LivingFrameControlledSdxlPrivatePromptReaderPort | null,
): LivingFrameControlledSdxlPrivatePromptReaderPort {
  if (
    !reader
    || !readers.has(reader)
    || consumedReaders.has(reader)
    || reader.readerClass
      !==
        'process_bound_server_owned_living_frame_private_prompt_reader_v1'
    || reader.sourceAuthority
      !== 'current_graph_blueprint_and_private_slot_repository'
    || reader.callerPacketAccepted !== false
    || reader.callerGraphAccepted !== false
    || reader.callerSlotValueAccepted !== false
    || reader.callerPathUrlOrCredentialAccepted !== false
    || reader.operationAuthority !== false
    || reader.dispatchAuthority !== false
    || reader.runtimeAuthority !== false
    || reader.productionReady !== false
  ) throw invalid('reader_invalid', '$.reader')
  return reader
}

function assertPacket(
  value: unknown,
): LivingFrameControlledSdxlPrivatePromptPacket {
  if (
    !isRecord(value)
    || !hasExactKeys(value, [
      'graphBlueprintId',
      'graphBlueprintDigestSha256',
      'outputFrameExpectationDigestSha256',
      'graphRecipe',
      'resolvedSlots',
    ])
    || typeof value.graphBlueprintId !== 'string'
    || !SAFE_ID.test(value.graphBlueprintId)
    || typeof value.graphBlueprintDigestSha256 !== 'string'
    || !SHA256.test(value.graphBlueprintDigestSha256)
    || typeof value.outputFrameExpectationDigestSha256 !== 'string'
    || !SHA256.test(value.outputFrameExpectationDigestSha256)
    || !Array.isArray(value.resolvedSlots)
  ) throw invalid('packet_invalid', '$.packet')
  assertRecipe(value.graphRecipe)
  const slots = value.resolvedSlots.map((slot, order) =>
    assertSlot(slot, order))
  const recipe =
    value.graphRecipe as LivingFrameControlledSdxlBenchmarkGraphRecipe
  const expectedSlotKinds =
    externalSlotKinds(recipe)
  if (
    slots.length !== expectedSlotKinds.length
    || slots.some((slot, index) =>
      slot.slotKind !== expectedSlotKinds[index])
  ) throw invalid('slot_set_invalid', '$.packet.resolvedSlots')
  return {
    graphBlueprintId: value.graphBlueprintId,
    graphBlueprintDigestSha256:
      value.graphBlueprintDigestSha256,
    outputFrameExpectationDigestSha256:
      value.outputFrameExpectationDigestSha256,
    graphRecipe: recipe,
    resolvedSlots: slots,
  }
}

function assertRecipe(value: unknown): asserts value is
  LivingFrameControlledSdxlBenchmarkGraphRecipe {
  if (
    !isRecord(value)
    || value.recipeClass
      !== 'case_specific_non_executable_graph_blueprint'
    || typeof value.caseId !== 'string'
    || value.runtimePolicy === null
    || !isRecord(value.graph)
    || !Array.isArray(value.graph.nodes)
    || !Array.isArray(value.graph.topologicalNodeIds)
    || !Array.isArray(value.graph.outputNodeIds)
    || value.graph.outputNodeIds.length !== 1
    || value.graph.outputNodeIds[0]
      !== 'benchmark.bridge.websocket_image_output'
    || value.graph.acyclic !== true
    || value.graph.deterministicOrder !== true
    || value.websocketOutputOnly !== true
    || value.externalValuesMaterialized !== false
    || value.executableGraphPresent !== false
    || typeof value.recipeDigestSha256 !== 'string'
    || !SHA256.test(value.recipeDigestSha256)
    || typeof value.requestRecipeDigestSha256 !== 'string'
    || !SHA256.test(value.requestRecipeDigestSha256)
  ) throw invalid('recipe_invalid', '$.packet.graphRecipe')
  const {
    recipeDigestSha256,
    ...recipeDraft
  } = value
  if (digest(recipeDraft) !== recipeDigestSha256) {
    throw invalid(
      'blueprint_lineage_invalid',
      '$.packet.graphRecipe.recipeDigestSha256',
    )
  }
  const recipe = value as unknown as
    LivingFrameControlledSdxlBenchmarkGraphRecipe
  const nodes = recipe.graph.nodes
  if (
    recipe.graph.nodeCount !== nodes.length
    || recipe.graph.topologicalNodeIds.length !== nodes.length
  ) throw invalid('node_order_invalid', '$.packet.graphRecipe.graph')
  const seen = new Set<string>()
  let edgeCount = 0
  let externalCount = 0
  nodes.forEach((node, order) => {
    if (
      !isRecord(node)
      || node.order !== order
      || typeof node.nodeId !== 'string'
      || !SAFE_ID.test(node.nodeId)
      || seen.has(node.nodeId)
      || recipe.graph.topologicalNodeIds[order] !== node.nodeId
      || typeof node.nodeClass !== 'string'
      || !ALLOWED_NODE_CLASSES.has(node.nodeClass)
      || !Array.isArray(node.inputs)
      || node.executableNode !== false
    ) throw invalid(
      'node_allowlist_violation',
      `$.packet.graphRecipe.graph.nodes.${order}`,
    )
    seen.add(node.nodeId)
    node.inputs.forEach((input, inputOrder) => {
      if (
        !isRecord(input)
        || input.order !== inputOrder
        || typeof input.inputName !== 'string'
        || !isRecord(input.value)
        || typeof input.value.kind !== 'string'
      ) throw invalid(
        'recipe_invalid',
        `$.packet.graphRecipe.graph.nodes.${order}.inputs.${inputOrder}`,
      )
      if (input.value.kind === 'node_output_reference') {
        edgeCount += 1
        const outputIndex = input.value.outputIndex
        if (
          typeof input.value.fromNodeId !== 'string'
          || !seen.has(input.value.fromNodeId)
          || typeof outputIndex !== 'number'
          || !Number.isInteger(outputIndex)
          || outputIndex < 0
          || outputIndex > 15
        ) throw invalid(
          'edge_reference_invalid',
          `$.packet.graphRecipe.graph.nodes.${order}.inputs.${inputOrder}`,
        )
      } else if (
        input.value.kind === 'external_slot_reference'
      ) {
        externalCount += 1
      } else if (![
        'literal_integer',
        'literal_number',
        'literal_enum',
      ].includes(input.value.kind)) {
        throw invalid(
          'recipe_invalid',
          `$.packet.graphRecipe.graph.nodes.${order}.inputs.${inputOrder}`,
        )
      }
    })
  })
  if (
    edgeCount !== recipe.graph.edgeReferenceCount
    || externalCount !== recipe.graph.externalSlotReferenceCount
    || nodes.at(-1)?.nodeId
      !== 'benchmark.bridge.websocket_image_output'
    || nodes.at(-1)?.nodeClass !== 'SaveImageWebsocket'
    || nodes.at(-1)?.outputNode !== true
  ) throw invalid(
    'output_policy_invalid',
    '$.packet.graphRecipe.graph',
  )
}

function assertSlot(
  value: unknown,
  order: number,
): LivingFrameControlledSdxlResolvedPrivateSlot {
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
  const expectedClass = slotValueClass(
    value.slotKind as
      LivingFrameControlledSdxlBenchmarkRequestSlotKind,
  )
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
  return value as unknown as
    LivingFrameControlledSdxlResolvedPrivateSlot
}

function slotValueClass(
  slotKind: LivingFrameControlledSdxlBenchmarkRequestSlotKind,
):
  LivingFrameControlledSdxlResolvedPrivateSlot['valueClass'] {
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

function assertPromptText(value: string, order: number): void {
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

function compilePrompt(
  recipe: LivingFrameControlledSdxlBenchmarkGraphRecipe,
  slots: readonly LivingFrameControlledSdxlResolvedPrivateSlot[],
): LivingFramePrivateComfyUiApiPrompt {
  const slotValues = new Map(
    slots.map((slot) => [slot.slotKind, slot.value]),
  )
  const prompt: Record<string, LivingFramePrivateComfyUiPromptNode> =
    {}
  for (const node of recipe.graph.nodes) {
    const inputs: Record<string, JsonValue> = {}
    for (const input of node.inputs) {
      inputs[input.inputName] = materializeValue(
        input.value,
        slotValues,
      )
    }
    prompt[node.nodeId] = {
      class_type: node.nodeClass,
      inputs,
    }
  }
  return deepFreeze(prompt)
}

function materializeValue(
  value: LivingFrameControlledSdxlBenchmarkGraphInputValue,
  slots: ReadonlyMap<
    LivingFrameControlledSdxlBenchmarkRequestSlotKind,
    string
  >,
): JsonValue {
  if (value.kind === 'external_slot_reference') {
    const resolved = slots.get(value.slotKind)
    if (resolved === undefined) {
      throw invalid('slot_set_invalid', '$.packet.resolvedSlots')
    }
    return resolved
  }
  if (value.kind === 'node_output_reference') {
    return [value.fromNodeId, value.outputIndex]
  }
  return value.value
}

function externalSlotKinds(
  recipe: LivingFrameControlledSdxlBenchmarkGraphRecipe,
): LivingFrameControlledSdxlBenchmarkRequestSlotKind[] {
  const traversedSlotKinds:
    LivingFrameControlledSdxlBenchmarkRequestSlotKind[] = []
  for (const node of recipe.graph.nodes) {
    for (const input of node.inputs) {
      if (input.value.kind === 'external_slot_reference') {
        traversedSlotKinds.push(input.value.slotKind)
      }
    }
  }
  const declaredSlotKinds = [
    ...recipe.graph.referencedSlotKinds,
  ]
  if (
    new Set(traversedSlotKinds).size !==
      traversedSlotKinds.length
    || new Set(declaredSlotKinds).size !==
      declaredSlotKinds.length
    || traversedSlotKinds.length !== declaredSlotKinds.length
    || declaredSlotKinds.some((slotKind) =>
      traversedSlotKinds.filter((value) =>
        value === slotKind).length !== 1)
  ) throw invalid(
    'slot_set_invalid',
    '$.packet.graphRecipe.graph.referencedSlotKinds',
  )
  return declaredSlotKinds
}

function compileSlotReceipts(
  slots: readonly LivingFrameControlledSdxlResolvedPrivateSlot[],
): readonly LivingFrameControlledSdxlPrivatePromptSlotReceipt[] {
  return deepFreeze(slots.map((slot) => ({
    order: slot.order,
    slotKind: slot.slotKind,
    valueClass: slot.valueClass,
    valueDigestSha256: digest(slot.value),
    valueByteLength: Buffer.byteLength(slot.value, 'utf8'),
    valueIncluded: false,
  })))
}

function assertReceiptSafe(
  draft:
    LivingFrameControlledSdxlPrivatePromptMaterializationDraft,
): void {
  if (!receiptDraftSchema.safeParse(draft).success) {
    throw invalid('unsafe_receipt_forbidden', '$')
  }
  if (
    draft.productionReady !== false
    || draft.dispatchReady !== false
    || draft.gpuAttemptCreated !== false
    || draft.actualAttemptCostEvidenceCreated !== false
    || draft.selectedSceneCreated !== false
    || draft.artifactCreated !== false
    || draft.privatePromptLeaseConsumed !== false
    || draft.canonicalOperationRegistered !== false
    || canonicalJson(draft.openGateCodes)
      !== canonicalJson(
        LIVING_FRAME_CONTROLLED_SDXL_PRIVATE_PROMPT_MATERIALIZATION_OPEN_GATES,
      )
    || canonicalJson(draft.authorityBoundary)
      !== canonicalJson(AUTHORITY_BOUNDARY)
    || draft.privatePrompt.rawPromptIncludedInReceipt !== false
    || draft.privatePrompt.rawConditioningTextIncludedInReceipt
      !== false
    || draft.privatePrompt.modelOrImageAliasIncludedInReceipt
      !== false
    || draft.privatePrompt.modelOrImageBytesIncludedInReceipt
      !== false
    || draft.privatePrompt.filesystemPathOrUrlIncludedInReceipt
      !== false
    || draft.privatePrompt.nodeCount
      !== draft.graphSummary.topologicalNodeCount
    || !SHA256.test(draft.privatePrompt.promptDigestSha256)
    || !SHA256.test(
      draft.sourceBindings.privateSlotSetDigestSha256,
    )
    || draft.containsCallerPathUrlCredentialCommandProviderToolCostOrCommercialRoute
      !== false
    || draft.subjectSpecificRouting !== false
    || containsUnsafeReceiptKey(draft)
  ) throw invalid('unsafe_receipt_forbidden', '$')
}

function containsUnsafeReceiptKey(value: unknown): boolean {
  const denied = new Set([
    'prompt',
    'text',
    'value',
    'path',
    'url',
    'credential',
    'secret',
    'command',
    'providerId',
    'toolId',
    'operationId',
    'costMicros',
    'credits',
    'price',
  ])
  let unsafe = false
  walk(value, (key) => {
    if (denied.has(key)) unsafe = true
  })
  return unsafe
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
  throw invalid('packet_invalid', '$')
}

function uniqueSorted<T extends string>(
  values: readonly T[],
): readonly T[] {
  return Object.freeze([
    ...new Set(values),
  ].sort((left, right) => left.localeCompare(right)))
}

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  return canonicalJson(Object.keys(value).sort())
    === canonicalJson([...expected].sort())
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
    for (const child of Object.values(value)) {
      deepFreeze(child)
    }
  }
  return value
}

function invalid(
  code:
    LivingFrameControlledSdxlPrivatePromptMaterializationIssueCode,
  path: string,
): LivingFrameControlledSdxlPrivatePromptMaterializationError {
  if (!ISSUE_CODES.has(code)) {
    throw new TypeError('Unknown materialization issue code.')
  }
  return new LivingFrameControlledSdxlPrivatePromptMaterializationError([
    { code, path },
  ])
}
