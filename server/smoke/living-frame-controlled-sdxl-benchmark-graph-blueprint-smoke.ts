import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'

import type {
  LivingFrameControlledSdxlBenchmarkGraphBlueprint,
  LivingFrameControlledSdxlBenchmarkGraphBlueprintAuthority,
  LivingFrameControlledSdxlBenchmarkGraphNode,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-graph-blueprint'
import {
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_DENIED_NODE_CLASSES,
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_NODE_CLASSES,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-graph-blueprint'
import {
  createLivingFrameControlledSdxlBenchmarkAdmissionAudit,
} from '../living-frame/living-frame-controlled-sdxl-benchmark-admission-audit'
import {
  createLivingFrameControlledSdxlBenchmarkGraphBlueprint,
  verifyLivingFrameControlledSdxlBenchmarkGraphBlueprint,
} from '../living-frame/living-frame-controlled-sdxl-benchmark-graph-blueprint'
import {
  createLivingFrameControlledSdxlBenchmarkRequestBlueprint,
} from '../living-frame/living-frame-controlled-sdxl-benchmark-request-blueprint'
import {
  createLivingFrameControlledSdxlCompatibilityBenchmarkSpec,
} from '../living-frame/living-frame-controlled-sdxl-compatibility-benchmark-spec'
import {
  controlledSdxlArtifactCandidateSetSmokeFixture,
} from './living-frame-controlled-sdxl-artifact-candidate-set-smoke'

const benchmarkSpecificationInput = {
  specificationId:
    'spec.sdxl.graph-blueprint.001',
  candidateSet:
    controlledSdxlArtifactCandidateSetSmokeFixture.candidateSet,
  candidateSetInput:
    controlledSdxlArtifactCandidateSetSmokeFixture.input,
}
const benchmarkSpecification =
  await createLivingFrameControlledSdxlCompatibilityBenchmarkSpec(
    benchmarkSpecificationInput,
  )
const benchmarkAdmissionAuditInput = {
  auditId: 'audit.sdxl.graph-blueprint.001',
  benchmarkSpecification,
  benchmarkSpecificationInput,
  exactArtifactEvidence: {
    state: 'not_injected',
  } as const,
}
const benchmarkAdmissionAudit =
  await createLivingFrameControlledSdxlBenchmarkAdmissionAudit(
    benchmarkAdmissionAuditInput,
  )
const requestBlueprintInput = {
  blueprintId: 'blueprint.sdxl.graph-request.001',
  benchmarkSpecification,
  benchmarkSpecificationInput,
  benchmarkAdmissionAudit,
  benchmarkAdmissionAuditInput,
}
const requestBlueprint =
  await createLivingFrameControlledSdxlBenchmarkRequestBlueprint(
    requestBlueprintInput,
  )
const input = {
  graphBlueprintId: 'graph-blueprint.sdxl.001',
  requestBlueprint,
  requestBlueprintInput,
}
const graphBlueprint =
  await createLivingFrameControlledSdxlBenchmarkGraphBlueprint(
    input,
  )

assert.equal(
  await verifyLivingFrameControlledSdxlBenchmarkGraphBlueprint(
    graphBlueprint,
    input,
  ),
  true,
)
assert.deepEqual(
  graphBlueprint.recipes.map((recipe) => recipe.graph.nodeCount),
  [0, 7, 8, 10, 11, 15, 15],
)
assert.deepEqual(
  graphBlueprint.recipes.map((recipe) =>
    recipe.graph.externalSlotReferenceCount),
  [0, 3, 4, 5, 6, 9, 9],
)
assert.equal(graphBlueprint.metrics.caseCount, 7)
assert.equal(graphBlueprint.metrics.loadOnlyRecipeCount, 1)
assert.equal(graphBlueprint.metrics.graphRecipeCount, 6)
assert.equal(graphBlueprint.metrics.distinctGraphTopologyCount, 5)
assert.equal(graphBlueprint.metrics.totalGraphNodeCount, 66)
assert.equal(
  graphBlueprint.metrics.totalExternalSlotReferenceCount,
  36,
)
assert.equal(graphBlueprint.recipes[0]?.graph.nodes.length, 0)
assert.equal(
  graphBlueprint.recipes[0]?.recipeClass,
  'exact_bundle_load_without_graph',
)
assert.equal(
  graphBlueprint.recipes[0]?.slotReferencePolicy,
  'load_only_slots_remain_request_blueprint_only',
)

const combined = requireRecipe(
  graphBlueprint,
  'full_combined_primary',
)
const replay = requireRecipe(
  graphBlueprint,
  'full_combined_replay',
)
assert.deepEqual(
  combined.graph.nodes.map((node) => node.nodeClass),
  [
    'CheckpointLoaderSimple',
    'LoraLoader',
    'CLIPTextEncode',
    'CLIPTextEncode',
    'ControlNetLoader',
    'LoadImage',
    'ControlNetApplyAdvanced',
    'EmptyLatentImage',
    'CLIPVisionLoader',
    'IPAdapterModelLoader',
    'LoadImage',
    'IPAdapterAdvanced',
    'KSampler',
    'VAEDecode',
    'SaveImageWebsocket',
  ],
)
assert.deepEqual(combined.graph.nodes, replay.graph.nodes)
assert.deepEqual(
  combined.graph.referencedSlotKinds,
  requestBlueprint.recipes[5]?.requiredBindingSlots
    .map((slot) => slot.slotKind),
)
assert.equal(
  combined.graph.nodes.filter((node) => node.outputNode).length,
  1,
)
assert.equal(
  combined.graph.nodes.at(-1)?.nodeClass,
  'SaveImageWebsocket',
)
assert.equal(
  combined.graph.nodes.every((node) =>
    (LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_NODE_CLASSES as
      readonly string[]).includes(node.nodeClass)
    && !(LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_DENIED_NODE_CLASSES as
      readonly string[]).includes(node.nodeClass)),
  true,
)
for (const recipe of graphBlueprint.recipes.slice(1)) {
  assertTopological(recipe.graph.nodes)
  assert.equal(
    recipe.slotReferencePolicy,
    'every_generation_request_slot_referenced_exactly_once',
  )
  assert.equal(recipe.everyEdgeTargetsEarlierNode, true)
  assert.equal(recipe.websocketOutputOnly, true)
  assert.equal(recipe.apiFormatPromptPresent, false)
  assert.equal(recipe.externalValuesMaterialized, false)
  assert.equal(recipe.executableGraphPresent, false)
}
assertRewiredModelSource(
  requireRecipe(graphBlueprint, 'base_only_baseline').graph.nodes,
  'base_checkpoint_loader',
)
assertRewiredModelSource(
  requireRecipe(graphBlueprint, 'lora_effect_probe').graph.nodes,
  'lora_loader',
)
assertRewiredModelSource(
  requireRecipe(graphBlueprint, 'ipadapter_effect_probe').graph.nodes,
  'generic_ipadapter_apply',
)
assert.equal(graphBlueprint.requestMaterialized, false)
assert.equal(graphBlueprint.dispatchReady, false)
assert.equal(graphBlueprint.benchmarkExecuted, false)
assert.equal(graphBlueprint.artifactCreated, false)
assert.equal(graphBlueprint.selectedSceneCreated, false)
assert.equal(graphBlueprint.productionReady, false)
assertAuthority(graphBlueprint.authorityBoundary)

const serialized = JSON.stringify(graphBlueprint).toLowerCase()
for (const forbidden of [
  'musashi',
  'hormuz',
  'helicopter',
  'providerid',
  'toolid',
  'operationid',
  'queueid',
  'jobid',
  'https://',
  'file://',
  '/tmp/',
]) {
  assert.equal(serialized.includes(forbidden), false)
}

let adversarialAssertions = 0
for (const forged of [
  {
    ...graphBlueprint,
    productionReady: true,
  },
  {
    ...graphBlueprint,
    requestMaterialized: true,
    dispatchReady: true,
    benchmarkExecuted: true,
    artifactCreated: true,
    selectedSceneCreated: true,
  },
  {
    ...graphBlueprint,
    graphBlueprintDigestSha256: 'a'.repeat(64),
  },
  {
    ...graphBlueprint,
    recipes: [...graphBlueprint.recipes].reverse(),
  },
  mutateCombined(graphBlueprint, (nodes) =>
    [...nodes].reverse()),
  mutateCombined(graphBlueprint, (nodes) =>
    nodes.map((node) =>
      node.nodeRole === 'generic_ipadapter_apply'
        ? { ...node, nodeClass: 'IPAdapterFaceID' }
        : node)),
  mutateCombined(graphBlueprint, (nodes) =>
    nodes.map((node) =>
      node.outputNode
        ? { ...node, nodeClass: 'PreviewImage' }
        : node)),
  mutateCombined(graphBlueprint, (nodes) =>
    nodes.map((node) =>
      node.nodeRole === 'sampler'
        ? {
            ...node,
            inputs: node.inputs.map((entry) =>
              entry.inputName === 'model'
                ? {
                    ...entry,
                    value: {
                      kind: 'node_output_reference',
                      fromNodeId: 'node.missing',
                      outputIndex: 0,
                    },
                  }
                : entry),
          }
        : node)),
  mutateCombined(graphBlueprint, (nodes) =>
    nodes.map((node) =>
      node.nodeRole === 'sampler'
        ? {
            ...node,
            inputs: node.inputs.map((entry) =>
              entry.inputName === 'model'
                ? {
                    ...entry,
                    value: {
                      kind: 'node_output_reference',
                      fromNodeId:
                        'benchmark.bridge.websocket_image_output',
                      outputIndex: 0,
                    },
                  }
                : entry),
          }
        : node)),
  mutateCombined(graphBlueprint, (nodes) =>
    nodes.map((node) =>
      node.nodeRole === 'base_checkpoint_loader'
        ? {
            ...node,
            inputs: node.inputs.map((entry) => ({
              ...entry,
              value: {
                kind: 'external_slot_reference',
                slotKind: 'reference_image_artifact',
              },
            })),
          }
        : node)),
  {
    ...graphBlueprint,
    authorityBoundary: {
      ...graphBlueprint.authorityBoundary,
      operationAuthority: true,
      dispatchAuthority: true,
      runtimeAuthority: true,
      productionAuthority: true,
    },
  },
  {
    ...graphBlueprint,
    subjectSpecificRouting: true,
  },
  {
    ...graphBlueprint,
    promptText: 'caller text',
    modelPath: '/tmp/model.safetensors',
    operationId: 'caller-operation',
  },
  {
    ...graphBlueprint,
    recipes: graphBlueprint.recipes.map((recipe) =>
      recipe.caseId === 'base_only_baseline'
        ? {
            ...recipe,
            externalValuesMaterialized: true,
            executableGraphPresent: true,
          }
        : recipe),
  },
  {
    ...graphBlueprint,
    sourceBindings: {
      ...graphBlueprint.sourceBindings,
      requestBlueprintDigestSha256: 'b'.repeat(64),
    },
  },
] as const) {
  assert.equal(
    await verifyLivingFrameControlledSdxlBenchmarkGraphBlueprint(
      forged,
      input,
    ),
    false,
  )
  adversarialAssertions += 1
}

const forgedAllGreen = resign({
  ...graphBlueprint,
  requestMaterialized: true,
  dispatchReady: true,
  benchmarkExecuted: true,
  artifactCreated: true,
  selectedSceneCreated: true,
  productionReady: true,
  authorityBoundary: Object.fromEntries(
    Object.keys(graphBlueprint.authorityBoundary)
      .map((key) => [key, true]),
  ),
})
assert.equal(
  await verifyLivingFrameControlledSdxlBenchmarkGraphBlueprint(
    forgedAllGreen,
    input,
  ),
  false,
)
adversarialAssertions += 1

await assert.rejects(
  () =>
    createLivingFrameControlledSdxlBenchmarkGraphBlueprint({
      ...input,
      approved: true,
    } as never),
  /benchmark graph blueprint failed/u,
)
adversarialAssertions += 1

console.log(JSON.stringify({
  suite:
    'living-frame-controlled-sdxl-benchmark-graph-blueprint',
  controlledFixtures: 1,
  adversarialAssertions,
  caseCount: graphBlueprint.metrics.caseCount,
  graphRecipeCount: graphBlueprint.metrics.graphRecipeCount,
  distinctGraphTopologyCount:
    graphBlueprint.metrics.distinctGraphTopologyCount,
  totalGraphNodeCount:
    graphBlueprint.metrics.totalGraphNodeCount,
  totalExternalSlotReferenceCount:
    graphBlueprint.metrics.totalExternalSlotReferenceCount,
  requestMaterialized: false,
  dispatchReady: false,
  benchmarkExecuted: false,
  productionReady: false,
}))

function requireRecipe(
  value: LivingFrameControlledSdxlBenchmarkGraphBlueprint,
  caseId:
    LivingFrameControlledSdxlBenchmarkGraphBlueprint[
      'recipes'
    ][number]['caseId'],
) {
  const recipe = value.recipes.find((entry) =>
    entry.caseId === caseId)
  assert.ok(recipe)
  return recipe
}

function assertTopological(
  nodes:
    readonly LivingFrameControlledSdxlBenchmarkGraphNode[],
): void {
  const order = new Map(
    nodes.map((node, index) => [node.nodeId, index]),
  )
  for (const [targetIndex, node] of nodes.entries()) {
    assert.equal(node.order, targetIndex)
    for (const input of node.inputs) {
      assert.equal(input.order >= 0, true)
      if (input.value.kind !== 'node_output_reference') continue
      const sourceIndex = order.get(input.value.fromNodeId)
      assert.notEqual(sourceIndex, undefined)
      assert.equal(sourceIndex! < targetIndex, true)
    }
  }
}

function assertRewiredModelSource(
  nodes:
    readonly LivingFrameControlledSdxlBenchmarkGraphNode[],
  expectedRole:
    LivingFrameControlledSdxlBenchmarkGraphNode['nodeRole'],
): void {
  const sampler = nodes.find((node) =>
    node.nodeRole === 'sampler')
  assert.ok(sampler)
  const modelInput = sampler.inputs.find((entry) =>
    entry.inputName === 'model')
  assert.equal(
    modelInput?.value.kind,
    'node_output_reference',
  )
  if (modelInput?.value.kind !== 'node_output_reference') return
  const sourceNodeId = modelInput.value.fromNodeId
  assert.equal(
    nodes.find((node) =>
      node.nodeId === sourceNodeId)?.nodeRole,
    expectedRole,
  )
}

function assertAuthority(
  authority:
    LivingFrameControlledSdxlBenchmarkGraphBlueprintAuthority,
): void {
  for (const [key, value] of Object.entries(authority)) {
    assert.equal(
      value,
      key === 'deterministicGraphBlueprintAuthority',
      `Unexpected authority value for ${key}.`,
    )
  }
}

function mutateCombined(
  value: LivingFrameControlledSdxlBenchmarkGraphBlueprint,
  mutate:
    (
      nodes:
        readonly LivingFrameControlledSdxlBenchmarkGraphNode[],
    ) => readonly unknown[],
): Record<string, unknown> {
  return {
    ...value,
    recipes: value.recipes.map((recipe) =>
      recipe.caseId === 'full_combined_primary'
        ? {
            ...recipe,
            graph: {
              ...recipe.graph,
              nodes: mutate(recipe.graph.nodes),
            },
          }
        : recipe),
  }
}

function resign(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const draft = { ...value }
  Reflect.deleteProperty(
    draft,
    'graphBlueprintDigestSha256',
  )
  return {
    ...draft,
    graphBlueprintDigestSha256: createHash('sha256')
      .update(canonicalJson(draft), 'utf8')
      .digest('hex'),
  }
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
  ) return value
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, canonicalize(record[key])]),
    )
  }
  throw new Error('Unsupported canonical JSON value.')
}
