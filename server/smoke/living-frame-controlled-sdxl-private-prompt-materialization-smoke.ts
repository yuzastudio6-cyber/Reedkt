import { createHash } from 'node:crypto'

import type {
  LivingFrameControlledSdxlBenchmarkGraphRecipe,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-graph-blueprint'
import {
  consumeLivingFrameControlledSdxlPrivatePromptLease,
  createLivingFrameControlledSdxlPrivatePromptReader,
  LivingFrameControlledSdxlPrivatePromptMaterializationError,
  materializeLivingFrameControlledSdxlPrivatePrompt,
  verifyLivingFrameControlledSdxlPrivatePromptMaterialization,
  type LivingFrameControlledSdxlPrivatePromptPacket,
} from '../living-frame/living-frame-controlled-sdxl-private-prompt-materialization'

const HASH_A = 'a'.repeat(64)
const HASH_B = 'b'.repeat(64)
const HASH_C = 'c'.repeat(64)

async function main(): Promise<void> {
  const controlledPacket = packet()
  const reader =
    createLivingFrameControlledSdxlPrivatePromptReader(
      async () => controlledPacket,
    )
  const result =
    await materializeLivingFrameControlledSdxlPrivatePrompt({
      serverOwnedLocatorId: 'lf.prompt.fixture.base.v1',
      reader,
    })
  assert(
    verifyLivingFrameControlledSdxlPrivatePromptMaterialization(
      result.receipt,
    ),
    'Controlled prompt materialization receipt must verify.',
  )
  assert(
    result.receipt.privatePrompt.nodeCount === 7
    && result.receipt.privatePrompt.slotReceipts.length === 3
    && result.receipt.privatePrompt.rawConditioningTextIncludedInReceipt
      === false
    && JSON.stringify(result.receipt)
      .includes('subject-neutral editorial illustration')
      === false,
    'The receipt must bind seven nodes and three private slots without leaking private values.',
  )
  const prompt =
    consumeLivingFrameControlledSdxlPrivatePromptLease(
      result.privatePromptLease,
    )
  assert(
    Object.keys(prompt).length === 7
    && prompt['benchmark.stock.base']?.inputs.ckpt_name
      === 'sdxl_base_private.safetensors'
    && prompt['benchmark.stock.positive']?.inputs.text
      === 'subject-neutral editorial illustration',
    'The process-bound lease must expose the exact materialized prompt once.',
  )
  expectIssue(
    () => consumeLivingFrameControlledSdxlPrivatePromptLease(
      result.privatePromptLease,
    ),
    'reader_reused',
  )
  await expectAsyncIssue(
    () => materializeLivingFrameControlledSdxlPrivatePrompt({
      serverOwnedLocatorId: 'lf.prompt.fixture.base.v1',
      reader,
    }),
    'reader_invalid',
  )
  await expectAsyncIssue(
    () => materializePacketMutation((value) => {
      value.resolvedSlots[0]!.value = '../model.safetensors'
    }),
    'private_alias_invalid',
  )
  await expectAsyncIssue(
    () => materializePacketMutation((value) => {
      value.resolvedSlots[1]!.value =
        'https://example.invalid/raw-prompt'
    }),
    'prompt_text_invalid',
  )
  await expectAsyncIssue(
    () => materializePacketMutation((value) => {
      value.resolvedSlots.pop()
    }),
    'slot_set_invalid',
  )
  await expectAsyncIssue(
    () => materializePacketMutation((value) => {
      value.resolvedSlots[1]!.order = 2
    }),
    'slot_value_invalid',
  )
  await expectAsyncIssue(
    () => materializePacketMutation((value) => {
      ;(value.graphRecipe.graph.nodes[0] as unknown as {
        nodeClass: string
      }).nodeClass = 'IPAdapterFaceID'
      refreshRecipeDigest(value)
    }),
    'node_allowlist_violation',
  )
  await expectAsyncIssue(
    () => materializePacketMutation((value) => {
      value.graphRecipe.graph.nodes[1]!.inputs[1]!.value = {
        kind: 'node_output_reference',
        fromNodeId: 'benchmark.stock.sampler',
        outputIndex: 0,
      }
      refreshRecipeDigest(value)
    }),
    'edge_reference_invalid',
  )
  await expectAsyncIssue(
    () => materializePacketMutation((value) => {
      value.graphRecipe.recipeDigestSha256 = HASH_C
    }),
    'blueprint_lineage_invalid',
  )
  await expectAsyncIssue(
    () => materializePacketMutation((value) => {
      ;(value as unknown as Record<string, unknown>).toolId =
        'comfyui'
    }),
    'packet_invalid',
  )

  const tamperedDigest = structuredClone(result.receipt)
  ;(tamperedDigest as {
    materializationDigestSha256: string
  }).materializationDigestSha256 = HASH_C
  assert(
    !verifyLivingFrameControlledSdxlPrivatePromptMaterialization(
      tamperedDigest,
    ),
    'Tampered receipt digest must fail verification.',
  )
  const promoted = structuredClone(result.receipt)
  ;(promoted as {
    productionReady: boolean
  }).productionReady = true
  assert(
    !verifyLivingFrameControlledSdxlPrivatePromptMaterialization(
      promoted,
    ),
    'Forged production promotion must fail verification.',
  )
  const rawLeak = structuredClone(result.receipt) as unknown as
    Record<string, unknown>
  rawLeak.prompt = 'leak'
  assert(
    !verifyLivingFrameControlledSdxlPrivatePromptMaterialization(
      rawLeak,
    ),
    'A receipt with a raw prompt field must fail verification.',
  )

  process.stdout.write(JSON.stringify({
    status: 'passed',
    controlledFixtures: 1,
    adversarialAssertions: 13,
    caseId: result.receipt.caseId,
    nodeCount: result.receipt.privatePrompt.nodeCount,
    externalSlotCount:
      result.receipt.privatePrompt.slotReceipts.length,
    singleUseLeaseConsumed: true,
    receiptContainsPrivateValues: false,
    canonicalOperationRegistered: false,
    gpuAttemptCreated: false,
    actualAttemptCostEvidenceCreated: false,
    productionReady: false,
  }, null, 2))
  process.stdout.write('\n')
}

async function materializePacketMutation(
  mutate: (value: MutablePacket) => void,
): Promise<void> {
  const value =
    structuredClone(packet()) as unknown as MutablePacket
  mutate(value)
  const reader =
    createLivingFrameControlledSdxlPrivatePromptReader(
      async () => value,
    )
  await materializeLivingFrameControlledSdxlPrivatePrompt({
    serverOwnedLocatorId: 'lf.prompt.fixture.adversarial.v1',
    reader,
  })
}

type DeepMutable<T> = {
  -readonly [Key in keyof T]:
    T[Key] extends readonly (infer Entry)[]
      ? DeepMutable<Entry>[]
      : T[Key] extends object
        ? DeepMutable<T[Key]>
        : T[Key]
}

type MutablePacket =
  DeepMutable<LivingFrameControlledSdxlPrivatePromptPacket>

function refreshRecipeDigest(value: MutablePacket): void {
  const {
    recipeDigestSha256: _omitted,
    ...draft
  } = value.graphRecipe
  void _omitted
  value.graphRecipe.recipeDigestSha256 = digest(draft)
}

function packet():
  LivingFrameControlledSdxlPrivatePromptPacket {
  return {
    graphBlueprintId: 'lf.sdxl.graph.fixture.v1',
    graphBlueprintDigestSha256: HASH_A,
    outputFrameExpectationDigestSha256: HASH_B,
    graphRecipe: recipe(),
    resolvedSlots: [
      {
        order: 0,
        slotKind: 'base_checkpoint_artifact',
        valueClass: 'private_model_alias',
        value: 'sdxl_base_private.safetensors',
      },
      {
        order: 1,
        slotKind: 'positive_conditioning_text',
        valueClass: 'private_conditioning_text',
        value: 'subject-neutral editorial illustration',
      },
      {
        order: 2,
        slotKind: 'negative_conditioning_text',
        valueClass: 'private_conditioning_text',
        value: 'illegible text, watermark, distorted geometry',
      },
    ],
  }
}

function recipe():
  LivingFrameControlledSdxlBenchmarkGraphRecipe {
  const nodes:
    LivingFrameControlledSdxlBenchmarkGraphRecipe[
      'graph'
    ]['nodes'] = [
      node(
        'benchmark.stock.base',
        0,
        'CheckpointLoaderSimple',
        'base_checkpoint_loader',
        [
          input(0, 'ckpt_name', {
            kind: 'external_slot_reference',
            slotKind: 'base_checkpoint_artifact',
          }),
        ],
      ),
      node(
        'benchmark.stock.positive',
        1,
        'CLIPTextEncode',
        'positive_conditioning_encoder',
        [
          input(0, 'text', {
            kind: 'external_slot_reference',
            slotKind: 'positive_conditioning_text',
          }),
          input(1, 'clip', edge('benchmark.stock.base', 1)),
        ],
      ),
      node(
        'benchmark.stock.negative',
        2,
        'CLIPTextEncode',
        'negative_conditioning_encoder',
        [
          input(0, 'text', {
            kind: 'external_slot_reference',
            slotKind: 'negative_conditioning_text',
          }),
          input(1, 'clip', edge('benchmark.stock.base', 1)),
        ],
      ),
      node(
        'benchmark.stock.latent',
        3,
        'EmptyLatentImage',
        'empty_latent',
        [
          input(0, 'width', {
            kind: 'literal_integer',
            value: 1024,
          }),
          input(1, 'height', {
            kind: 'literal_integer',
            value: 1024,
          }),
          input(2, 'batch_size', {
            kind: 'literal_integer',
            value: 1,
          }),
        ],
      ),
      node(
        'benchmark.stock.sampler',
        4,
        'KSampler',
        'sampler',
        [
          input(0, 'model', edge('benchmark.stock.base', 0)),
          input(1, 'positive', edge('benchmark.stock.positive', 0)),
          input(2, 'negative', edge('benchmark.stock.negative', 0)),
          input(3, 'latent_image', edge('benchmark.stock.latent', 0)),
          input(4, 'seed', {
            kind: 'literal_integer',
            value: 19_791_104,
          }),
          input(5, 'steps', {
            kind: 'literal_integer',
            value: 24,
          }),
          input(6, 'cfg', {
            kind: 'literal_number',
            value: 5.5,
          }),
          input(7, 'sampler_name', {
            kind: 'literal_enum',
            value: 'dpmpp_2m',
          }),
          input(8, 'scheduler', {
            kind: 'literal_enum',
            value: 'karras',
          }),
          input(9, 'denoise', {
            kind: 'literal_number',
            value: 1,
          }),
        ],
      ),
      node(
        'benchmark.stock.vae',
        5,
        'VAEDecode',
        'vae_decoder',
        [
          input(0, 'samples', edge('benchmark.stock.sampler', 0)),
          input(1, 'vae', edge('benchmark.stock.base', 2)),
        ],
      ),
      node(
        'benchmark.bridge.websocket_image_output',
        6,
        'SaveImageWebsocket',
        'websocket_image_output',
        [
          input(0, 'images', edge('benchmark.stock.vae', 0)),
        ],
        true,
        'benchmark_graph_bridge',
      ),
    ]
  const draft: Omit<
    LivingFrameControlledSdxlBenchmarkGraphRecipe,
    'recipeDigestSha256'
  > = {
    order: 1,
    caseId: 'base_only_baseline',
    recipeClass:
      'case_specific_non_executable_graph_blueprint',
    comparisonCaseId: null,
    enabledComponents: ['base_checkpoint'],
    disabledComponents: [
      'controlnet_checkpoint',
      'lora_adapter',
      'generic_ipadapter_checkpoint',
      'clip_vision_checkpoint',
    ],
    runtimePolicy: {
      seed: 19_791_104,
      widthPixels: 1024,
      heightPixels: 1024,
      batchSize: 1,
      sampler: 'dpmpp_2m',
      scheduler: 'karras',
      stepCount: 24,
      cfg: 5.5,
      denoise: 1,
    },
    graph: {
      topologicalNodeIds: nodes.map((entry) => entry.nodeId),
      nodes,
      outputNodeIds: [
        'benchmark.bridge.websocket_image_output',
      ],
      referencedSlotKinds: [
        'base_checkpoint_artifact',
        'positive_conditioning_text',
        'negative_conditioning_text',
      ],
      nodeCount: 7,
      edgeReferenceCount: 9,
      externalSlotReferenceCount: 3,
      acyclic: true,
      deterministicOrder: true,
    },
    requestRecipeDigestSha256: HASH_C,
    parentGraphParametersReused: true,
    disabledCapabilitiesRemovedAndRewired: true,
    slotReferencePolicy:
      'every_generation_request_slot_referenced_exactly_once',
    everyEdgeTargetsEarlierNode: true,
    websocketOutputOnly: true,
    apiFormatPromptPresent: false,
    externalValuesMaterialized: false,
    executableGraphPresent: false,
  }
  return {
    ...draft,
    recipeDigestSha256: digest(draft),
  }
}

function node(
  nodeId: string,
  order: number,
  nodeClass:
    LivingFrameControlledSdxlBenchmarkGraphRecipe[
      'graph'
    ]['nodes'][number]['nodeClass'],
  nodeRole:
    LivingFrameControlledSdxlBenchmarkGraphRecipe[
      'graph'
    ]['nodes'][number]['nodeRole'],
  inputs:
    LivingFrameControlledSdxlBenchmarkGraphRecipe[
      'graph'
    ]['nodes'][number]['inputs'],
  outputNode = false,
  nodeOrigin:
    LivingFrameControlledSdxlBenchmarkGraphRecipe[
      'graph'
    ]['nodes'][number]['nodeOrigin'] =
      'stock_workflow',
):
  LivingFrameControlledSdxlBenchmarkGraphRecipe[
    'graph'
  ]['nodes'][number] {
  return {
    nodeId,
    order,
    nodeOrigin,
    nodeClass,
    nodeRole,
    inputs,
    outputNode,
    executableNode: false,
  }
}

function input(
  order: number,
  inputName:
    LivingFrameControlledSdxlBenchmarkGraphRecipe[
      'graph'
    ]['nodes'][number]['inputs'][number]['inputName'],
  value:
    LivingFrameControlledSdxlBenchmarkGraphRecipe[
      'graph'
    ]['nodes'][number]['inputs'][number]['value'],
):
  LivingFrameControlledSdxlBenchmarkGraphRecipe[
    'graph'
  ]['nodes'][number]['inputs'][number] {
  return { order, inputName, value }
}

function edge(
  fromNodeId: string,
  outputIndex: number,
): {
  readonly kind: 'node_output_reference'
  readonly fromNodeId: string
  readonly outputIndex: number
} {
  return {
    kind: 'node_output_reference',
    fromNodeId,
    outputIndex,
  }
}

function digest(value: unknown): string {
  return createHash('sha256')
    .update(JSON.stringify(canonicalize(value)), 'utf8')
    .digest('hex')
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => canonicalize(entry))
  }
  if (
    value !== null
    && typeof value === 'object'
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    )
  }
  return value
}

function expectIssue(
  operation: () => unknown,
  expected: string,
): void {
  let observed = false
  try {
    operation()
  } catch (error) {
    observed =
      error instanceof
        LivingFrameControlledSdxlPrivatePromptMaterializationError
      && error.issues[0]?.code === expected
  }
  assert(observed, `Expected ${expected}.`)
}

async function expectAsyncIssue(
  operation: () => Promise<unknown>,
  expected: string,
): Promise<void> {
  let observed = false
  try {
    await operation()
  } catch (error) {
    observed =
      error instanceof
        LivingFrameControlledSdxlPrivatePromptMaterializationError
      && error.issues[0]?.code === expected
  }
  assert(observed, `Expected ${expected}.`)
}

function assert(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) throw new Error(message)
}

await main()
