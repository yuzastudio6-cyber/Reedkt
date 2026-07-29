import { createHash } from 'node:crypto'

import type {
  LivingFrameControlledSdxlBenchmarkGraphBlueprint,
  LivingFrameControlledSdxlBenchmarkGraphBlueprintAuthority,
  LivingFrameControlledSdxlBenchmarkGraphBlueprintDraft,
  LivingFrameControlledSdxlBenchmarkGraphBlueprintIssue,
  LivingFrameControlledSdxlBenchmarkGraphBlueprintIssueCode,
  LivingFrameControlledSdxlBenchmarkGraphInputName,
  LivingFrameControlledSdxlBenchmarkGraphInputValue,
  LivingFrameControlledSdxlBenchmarkGraphLiteralEnum,
  LivingFrameControlledSdxlBenchmarkGraphNode,
  LivingFrameControlledSdxlBenchmarkGraphNodeInput,
  LivingFrameControlledSdxlBenchmarkGraphRecipe,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-graph-blueprint'
import {
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_BLUEPRINT_CLASS,
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_BLUEPRINT_ISSUES,
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_BLUEPRINT_OPEN_GATES,
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_BLUEPRINT_STATE,
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_BLUEPRINT_VERSION,
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_DENIED_NODE_CLASSES,
  LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_NODE_CLASSES,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-graph-blueprint'
import type {
  LivingFrameControlledSdxlBenchmarkRequestBlueprint,
  LivingFrameControlledSdxlBenchmarkRequestRecipe,
  LivingFrameControlledSdxlBenchmarkRequestSlotKind,
} from '../../src/types/living-frame-controlled-sdxl-benchmark-request-blueprint'
import type {
  LivingFrameControlledComfyUiGraphNode,
  LivingFrameControlledComfyUiWorkflowExpectation,
} from '../../src/types/living-frame-controlled-illustration-comfyui-workflow'
import type {
  LivingFrameIpAdapterMergedWorkflow,
} from '../../src/types/living-frame-ipadapter-merged-workflow'
import type {
  LivingFrameIpAdapterWorkflowExtension,
  LivingFrameIpAdapterWorkflowExtensionNode,
} from '../../src/types/living-frame-ipadapter-workflow-extension'
import type {
  CreateLivingFrameControlledSdxlBenchmarkRequestBlueprintInput,
} from './living-frame-controlled-sdxl-benchmark-request-blueprint'
import {
  verifyLivingFrameControlledSdxlBenchmarkRequestBlueprint,
} from './living-frame-controlled-sdxl-benchmark-request-blueprint'
import {
  validateLivingFrameControlledComfyUiWorkflowExpectation,
} from './living-frame-controlled-illustration-comfyui-workflow'
import {
  verifyLivingFrameIpAdapterMergedWorkflow,
} from './living-frame-ipadapter-merged-workflow'
import {
  validateLivingFrameIpAdapterWorkflowExtension,
} from './living-frame-ipadapter-workflow-extension'

export interface CreateLivingFrameControlledSdxlBenchmarkGraphBlueprintInput {
  readonly graphBlueprintId: string
  readonly requestBlueprint:
    LivingFrameControlledSdxlBenchmarkRequestBlueprint
  readonly requestBlueprintInput:
    CreateLivingFrameControlledSdxlBenchmarkRequestBlueprintInput
}

interface ParentGraphs {
  readonly stock:
    LivingFrameControlledComfyUiWorkflowExpectation
  readonly extension:
    LivingFrameIpAdapterWorkflowExtension
  readonly merged:
    LivingFrameIpAdapterMergedWorkflow
}

interface ParentNodeSet {
  readonly base:
    LivingFrameControlledComfyUiGraphNode
  readonly lora:
    LivingFrameControlledComfyUiGraphNode
  readonly positive:
    LivingFrameControlledComfyUiGraphNode
  readonly negative:
    LivingFrameControlledComfyUiGraphNode
  readonly controlLoader:
    LivingFrameControlledComfyUiGraphNode
  readonly controlApply:
    LivingFrameControlledComfyUiGraphNode
  readonly latent:
    LivingFrameControlledComfyUiGraphNode
  readonly sampler:
    LivingFrameControlledComfyUiGraphNode
  readonly vae:
    LivingFrameControlledComfyUiGraphNode
  readonly clipVision:
    LivingFrameIpAdapterWorkflowExtensionNode
  readonly ipAdapterLoader:
    LivingFrameIpAdapterWorkflowExtensionNode
  readonly ipAdapterApply:
    LivingFrameIpAdapterWorkflowExtensionNode
}

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/u
const SHA256 = /^[a-f0-9]{64}$/u

const CONTROL_IMAGE_NODE_ID =
  'benchmark.bridge.control_image_loader' as const
const REFERENCE_IMAGE_NODE_ID =
  'benchmark.bridge.reference_image_loader' as const
const OUTPUT_NODE_ID =
  'benchmark.bridge.websocket_image_output' as const

const NODE_POLICY = deepFreeze({
  allowedNodeClasses:
    LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_NODE_CLASSES,
  deniedNodeClasses:
    LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_DENIED_NODE_CLASSES,
  exactAllowlistOnly: true as const,
  faceIdInsightFaceAndUnifiedLoadersForbidden: true as const,
  inGraphPreprocessorsForbidden: true as const,
  arbitrarySaveAndPreviewNodesForbidden: true as const,
  websocketOutputOnly: true as const,
})

const AUTHORITY_BOUNDARY:
  LivingFrameControlledSdxlBenchmarkGraphBlueprintAuthority =
  deepFreeze({
    deterministicGraphBlueprintAuthority: true,
    requestBlueprintAuthority: false,
    currentNodeSchemaAuthority: false,
    artifactRepositoryAuthority: false,
    artifactMountAuthority: false,
    fixtureArtifactAuthority: false,
    promptAuthority: false,
    requestMaterializationAuthority: false,
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

export class LivingFrameControlledSdxlBenchmarkGraphBlueprintError
  extends Error {
  readonly issues:
    readonly LivingFrameControlledSdxlBenchmarkGraphBlueprintIssue[]

  constructor(
    issues:
      readonly LivingFrameControlledSdxlBenchmarkGraphBlueprintIssue[],
  ) {
    super(
      'Living Frame controlled SDXL benchmark graph blueprint failed.',
    )
    this.name =
      'LivingFrameControlledSdxlBenchmarkGraphBlueprintError'
    this.issues = issues
  }
}

export async function createLivingFrameControlledSdxlBenchmarkGraphBlueprint(
  input:
    CreateLivingFrameControlledSdxlBenchmarkGraphBlueprintInput,
): Promise<LivingFrameControlledSdxlBenchmarkGraphBlueprint> {
  assertInput(input)
  if (
    !await verifyLivingFrameControlledSdxlBenchmarkRequestBlueprint(
      input.requestBlueprint,
      input.requestBlueprintInput,
    )
  ) throw invalid(
    'request_blueprint_invalid',
    '$.requestBlueprint',
  )
  const parents = readAndValidateParents(input)
  assertSourceLineage(input, parents)
  const parentNodes = readParentNodes(parents)
  const recipes = input.requestBlueprint.recipes.map(
    (requestRecipe, expectedOrder) =>
      buildRecipe(
        requestRecipe,
        expectedOrder,
        parentNodes,
        parents.extension,
      ),
  )
  assertRecipeSet(input.requestBlueprint, recipes)
  const graphRecipes = recipes.filter((recipe) =>
    recipe.recipeClass ===
      'case_specific_non_executable_graph_blueprint')
  const distinctGraphTopologyCount = new Set(
    graphRecipes.map((recipe) =>
      digest(recipe.graph.nodes.map((node) => node.nodeRole))),
  ).size
  const totalGraphNodeCount = graphRecipes.reduce(
    (total, recipe) => total + recipe.graph.nodeCount,
    0,
  )
  const totalExternalSlotReferenceCount = graphRecipes.reduce(
    (total, recipe) =>
      total + recipe.graph.externalSlotReferenceCount,
    0,
  )
  if (
    distinctGraphTopologyCount !== 5
    || totalGraphNodeCount !== 66
    || totalExternalSlotReferenceCount !== 36
  ) throw invalid(
    'case_set_or_order_mismatch',
    '$.recipes',
  )

  const specification =
    input.requestBlueprintInput.benchmarkSpecification
  const draft:
    LivingFrameControlledSdxlBenchmarkGraphBlueprintDraft = {
    contractVersion:
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_BLUEPRINT_VERSION,
    resultClass:
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_BLUEPRINT_CLASS,
    graphBlueprintId: input.graphBlueprintId,
    graphBlueprintState:
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_BLUEPRINT_STATE,
    sourceBindings: {
      requestBlueprintId:
        input.requestBlueprint.blueprintId,
      requestBlueprintDigestSha256:
        input.requestBlueprint.blueprintDigestSha256,
      benchmarkSpecificationId:
        specification.specificationId,
      benchmarkSpecificationDigestSha256:
        specification.specificationDigestSha256,
      stockWorkflowExpectationId:
        parents.stock.workflowExpectationId,
      stockWorkflowExpectationDigestSha256:
        parents.stock.expectationDigestSha256,
      ipAdapterExtensionId:
        parents.extension.extensionId,
      ipAdapterExtensionDigestSha256:
        parents.extension.extensionDigestSha256,
      ipAdapterMergedWorkflowId:
        parents.merged.mergedWorkflowId,
      ipAdapterMergedWorkflowDigestSha256:
        parents.merged.mergedWorkflowDigestSha256,
      outputFrameExpectationDigestSha256:
        specification.sourceBindings
          .outputFrameExpectationDigestSha256,
      nodePolicyDigestSha256: digest(NODE_POLICY),
    },
    nodePolicy: NODE_POLICY,
    recipes,
    metrics: {
      caseCount: 7,
      loadOnlyRecipeCount: 1,
      graphRecipeCount: 6,
      isolatedCapabilityRecipeCount: 3,
      combinedRecipeCount: 2,
      distinctGraphTopologyCount: 5,
      totalGraphNodeCount: 66,
      totalExternalSlotReferenceCount: 36,
    },
    openGateCodes:
      LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_BLUEPRINT_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    requestBlueprintRevalidated: true,
    stockWorkflowRevalidated: true,
    ipAdapterExtensionRevalidated: true,
    mergedWorkflowRevalidated: true,
    sourceLineageMatched: true,
    exactCaseGraphsProjected: true,
    everyGenerationCaseHasExactGraph: true,
    everyGraphUsesClosedNodeAllowlist: true,
    everyGraphIsAcyclicAndTopological: true,
    everyGenerationGraphReferencesExactRequestSlots: true,
    loadOnlyCaseHasNoGraph: true,
    currentRuntimeNodeSchemaRevalidationStillRequired: true,
    containsRawPromptImagePixelsModelBytesAliasPathUrlFilenameCredentialOrCommand:
      false,
    containsProviderToolOperationWorkQueueCostOrCommercialRoute:
      false,
    requestMaterialized: false,
    dispatchReady: false,
    benchmarkExecuted: false,
    artifactCreated: false,
    selectedSceneCreated: false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  assertSafeOutput(draft)
  return deepFreeze({
    ...draft,
    graphBlueprintDigestSha256: digest(draft),
  })
}

export async function verifyLivingFrameControlledSdxlBenchmarkGraphBlueprint(
  value: unknown,
  input:
    CreateLivingFrameControlledSdxlBenchmarkGraphBlueprintInput,
): Promise<boolean> {
  try {
    if (
      !isRecord(value)
      || value.contractVersion
        !==
        LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_BLUEPRINT_VERSION
      || value.resultClass
        !==
        LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_BLUEPRINT_CLASS
      || value.productionReady !== false
      || typeof value.graphBlueprintDigestSha256 !== 'string'
      || !SHA256.test(value.graphBlueprintDigestSha256)
    ) return false
    const {
      graphBlueprintDigestSha256,
      ...draft
    } = value
    if (digest(draft) !== graphBlueprintDigestSha256) return false
    return canonicalJson(value) === canonicalJson(
      await createLivingFrameControlledSdxlBenchmarkGraphBlueprint(
        input,
      ),
    )
  } catch {
    return false
  }
}

function readAndValidateParents(
  input:
    CreateLivingFrameControlledSdxlBenchmarkGraphBlueprintInput,
): ParentGraphs {
  const familyInput =
    input.requestBlueprintInput.benchmarkSpecificationInput
      .candidateSetInput.requirementsInput
      .controlledModelFamilyBindingInput
  const stockResult =
    validateLivingFrameControlledComfyUiWorkflowExpectation(
      familyInput.stockWorkflowExpectation,
    )
  if (!stockResult.ok) {
    throw invalid(
      'stock_workflow_invalid',
      '$.requestBlueprintInput.parents.stockWorkflowExpectation',
    )
  }
  const extensionResult =
    validateLivingFrameIpAdapterWorkflowExtension(
      familyInput.ipAdapterWorkflowExtension,
    )
  if (!extensionResult.ok) {
    throw invalid(
      'ipadapter_extension_invalid',
      '$.requestBlueprintInput.parents.ipAdapterWorkflowExtension',
    )
  }
  if (!isRecord(familyInput.ipAdapterMergedWorkflow)) {
    throw invalid(
      'merged_workflow_invalid',
      '$.requestBlueprintInput.parents.ipAdapterMergedWorkflow',
    )
  }
  const mergedWorkflowId =
    familyInput.ipAdapterMergedWorkflow.mergedWorkflowId
  if (
    typeof mergedWorkflowId !== 'string'
    || !SAFE_ID.test(mergedWorkflowId)
    || !verifyLivingFrameIpAdapterMergedWorkflow(
      familyInput.ipAdapterMergedWorkflow,
      {
        mergedWorkflowId,
        stockWorkflowExpectation: stockResult.expectation,
        ipAdapterWorkflowExtension: extensionResult.extension,
      },
    )
  ) throw invalid(
    'merged_workflow_invalid',
    '$.requestBlueprintInput.parents.ipAdapterMergedWorkflow',
  )
  return {
    stock: stockResult.expectation,
    extension: extensionResult.extension,
    merged:
      familyInput.ipAdapterMergedWorkflow as
        LivingFrameIpAdapterMergedWorkflow,
  }
}

function assertSourceLineage(
  input:
    CreateLivingFrameControlledSdxlBenchmarkGraphBlueprintInput,
  parents: ParentGraphs,
): void {
  const specification =
    input.requestBlueprintInput.benchmarkSpecification
  if (
    input.requestBlueprint.sourceBindings
      .benchmarkSpecificationId
      !== specification.specificationId
    || input.requestBlueprint.sourceBindings
      .benchmarkSpecificationDigestSha256
      !== specification.specificationDigestSha256
    || specification.sourceBindings
      .stockWorkflowExpectationId
      !== parents.stock.workflowExpectationId
    || specification.sourceBindings
      .stockWorkflowExpectationDigestSha256
      !== parents.stock.expectationDigestSha256
    || specification.sourceBindings
      .ipAdapterMergedWorkflowId
      !== parents.merged.mergedWorkflowId
    || specification.sourceBindings
      .ipAdapterMergedWorkflowDigestSha256
      !== parents.merged.mergedWorkflowDigestSha256
    || parents.extension.sourceBindings
      .stockWorkflowExpectationId
      !== parents.stock.workflowExpectationId
    || parents.extension.sourceBindings
      .stockWorkflowExpectationDigestSha256
      !== parents.stock.expectationDigestSha256
    || parents.merged.sourceBindings
      .ipAdapterExtensionId
      !== parents.extension.extensionId
    || parents.merged.sourceBindings
      .ipAdapterExtensionDigestSha256
      !== parents.extension.extensionDigestSha256
    || parents.stock.profile !== 'controlnet_lora_txt2img'
  ) throw invalid(
    'source_lineage_mismatch',
    '$.sourceBindings',
  )
}

function readParentNodes(
  parents: ParentGraphs,
): ParentNodeSet {
  return {
    base: requireStockNode(
      parents.stock,
      'base_checkpoint_loader',
      'CheckpointLoaderSimple',
    ),
    lora: requireStockNode(
      parents.stock,
      'lora_loader',
      'LoraLoader',
    ),
    positive: requireStockNode(
      parents.stock,
      'positive_conditioning_encoder',
      'CLIPTextEncode',
    ),
    negative: requireStockNode(
      parents.stock,
      'negative_conditioning_encoder',
      'CLIPTextEncode',
    ),
    controlLoader: requireStockNode(
      parents.stock,
      'controlnet_loader',
      'ControlNetLoader',
    ),
    controlApply: requireStockNode(
      parents.stock,
      'controlnet_conditioning',
      'ControlNetApplyAdvanced',
    ),
    latent: requireStockNode(
      parents.stock,
      'empty_latent',
      'EmptyLatentImage',
    ),
    sampler: requireStockNode(
      parents.stock,
      'sampler',
      'KSampler',
    ),
    vae: requireStockNode(
      parents.stock,
      'vae_decoder',
      'VAEDecode',
    ),
    clipVision: requireExtensionNode(
      parents.extension,
      'clip_vision_loader',
      'CLIPVisionLoader',
    ),
    ipAdapterLoader: requireExtensionNode(
      parents.extension,
      'generic_ipadapter_model_loader',
      'IPAdapterModelLoader',
    ),
    ipAdapterApply: requireExtensionNode(
      parents.extension,
      'generic_ipadapter_apply',
      'IPAdapterAdvanced',
    ),
  }
}

function buildRecipe(
  request:
    LivingFrameControlledSdxlBenchmarkRequestRecipe,
  expectedOrder: number,
  parents: ParentNodeSet,
  extension: LivingFrameIpAdapterWorkflowExtension,
): LivingFrameControlledSdxlBenchmarkGraphRecipe {
  if (request.order !== expectedOrder) {
    throw invalid(
      'case_set_or_order_mismatch',
      `$.requestBlueprint.recipes.${expectedOrder}`,
    )
  }
  if (request.recipeClass === 'load_only_bundle_probe') {
    if (request.runtimePolicy !== null || expectedOrder !== 0) {
      throw invalid(
        'case_runtime_policy_mismatch',
        `$.requestBlueprint.recipes.${expectedOrder}`,
      )
    }
    return recipeWithDigest({
      order: expectedOrder,
      caseId: request.caseId,
      recipeClass: 'exact_bundle_load_without_graph',
      comparisonCaseId: request.comparisonCaseId,
      enabledComponents: request.enabledComponents,
      disabledComponents: request.disabledComponents,
      runtimePolicy: null,
      graph: {
        topologicalNodeIds: [],
        nodes: [],
        outputNodeIds: [],
        referencedSlotKinds: [],
        nodeCount: 0,
        edgeReferenceCount: 0,
        externalSlotReferenceCount: 0,
        acyclic: true,
        deterministicOrder: true,
      },
      requestRecipeDigestSha256: request.recipeDigestSha256,
      parentGraphParametersReused: true,
      disabledCapabilitiesRemovedAndRewired: true,
      slotReferencePolicy:
        'load_only_slots_remain_request_blueprint_only',
      everyEdgeTargetsEarlierNode: true,
      websocketOutputOnly: true,
      apiFormatPromptPresent: false,
      externalValuesMaterialized: false,
      executableGraphPresent: false,
    })
  }
  if (request.runtimePolicy === null) {
    throw invalid(
      'case_runtime_policy_mismatch',
      `$.requestBlueprint.recipes.${expectedOrder}.runtimePolicy`,
    )
  }
  const enabled = new Set(request.enabledComponents)
  const usesLora = enabled.has('lora_adapter')
  const usesControlNet =
    enabled.has('controlnet_checkpoint')
  const usesIpAdapter =
    enabled.has('generic_ipadapter_checkpoint')
    || enabled.has('clip_vision_checkpoint')
  if (
    !enabled.has('base_checkpoint')
    || enabled.has('generic_ipadapter_checkpoint')
      !== enabled.has('clip_vision_checkpoint')
  ) throw invalid(
    'case_component_mismatch',
    `$.requestBlueprint.recipes.${expectedOrder}.enabledComponents`,
  )
  const nodes = buildGraphNodes({
    request,
    parents,
    extension,
    usesLora,
    usesControlNet,
    usesIpAdapter,
  })
  assertNodePolicy(nodes)
  assertTopologicalEdges(nodes)
  assertOutputPolicy(nodes)
  const referencedSlotKinds =
    assertExactSlotReferences(request, nodes)
  const graph = {
    topologicalNodeIds:
      nodes.map((node) => node.nodeId),
    nodes,
    outputNodeIds: [OUTPUT_NODE_ID] as const,
    referencedSlotKinds,
    nodeCount: nodes.length,
    edgeReferenceCount:
      nodes.flatMap((node) => node.inputs)
        .filter((entry) =>
          entry.value.kind === 'node_output_reference')
        .length,
    externalSlotReferenceCount:
      nodes.flatMap((node) => node.inputs)
        .filter((entry) =>
          entry.value.kind === 'external_slot_reference')
        .length,
    acyclic: true as const,
    deterministicOrder: true as const,
  }
  assertCaseTopology(request, graph.nodes)
  return recipeWithDigest({
    order: expectedOrder,
    caseId: request.caseId,
    recipeClass:
      'case_specific_non_executable_graph_blueprint',
    comparisonCaseId: request.comparisonCaseId,
    enabledComponents: request.enabledComponents,
    disabledComponents: request.disabledComponents,
    runtimePolicy: {
      seed: request.runtimePolicy.seed,
      widthPixels: request.runtimePolicy.outputWidthPixels,
      heightPixels: request.runtimePolicy.outputHeightPixels,
      batchSize: 1,
      sampler: request.runtimePolicy.sampler,
      scheduler: request.runtimePolicy.scheduler,
      stepCount: request.runtimePolicy.stepCount,
      cfg: request.runtimePolicy.cfg,
      denoise: request.runtimePolicy.denoise,
    },
    graph,
    requestRecipeDigestSha256: request.recipeDigestSha256,
    parentGraphParametersReused: true,
    disabledCapabilitiesRemovedAndRewired: true,
    slotReferencePolicy:
      'every_generation_request_slot_referenced_exactly_once',
    everyEdgeTargetsEarlierNode: true,
    websocketOutputOnly: true,
    apiFormatPromptPresent: false,
    externalValuesMaterialized: false,
    executableGraphPresent: false,
  })
}

function buildGraphNodes(input: {
  readonly request:
    LivingFrameControlledSdxlBenchmarkRequestRecipe
  readonly parents: ParentNodeSet
  readonly extension:
    LivingFrameIpAdapterWorkflowExtension
  readonly usesLora: boolean
  readonly usesControlNet: boolean
  readonly usesIpAdapter: boolean
}): readonly LivingFrameControlledSdxlBenchmarkGraphNode[] {
  const nodes: LivingFrameControlledSdxlBenchmarkGraphNode[] = []
  const append = (
    source: {
      readonly nodeId: string
      readonly nodeClass:
        LivingFrameControlledSdxlBenchmarkGraphNode['nodeClass']
      readonly nodeRole:
        LivingFrameControlledSdxlBenchmarkGraphNode['nodeRole']
      readonly nodeOrigin:
        LivingFrameControlledSdxlBenchmarkGraphNode['nodeOrigin']
    },
    inputs:
      readonly LivingFrameControlledSdxlBenchmarkGraphNodeInput[],
    outputNode = false,
  ): void => {
    nodes.push({
      nodeId: source.nodeId,
      order: nodes.length,
      nodeOrigin: source.nodeOrigin,
      nodeClass: source.nodeClass,
      nodeRole: source.nodeRole,
      inputs,
      outputNode,
      executableNode: false,
    })
  }
  const stock = (
    source: LivingFrameControlledComfyUiGraphNode,
  ) => ({
    nodeId: source.nodeId,
    nodeClass: source.nodeClass,
    nodeRole: (
      source.nodeRole === 'controlnet_conditioning'
        ? 'controlnet_apply'
        : source.nodeRole
    ) as LivingFrameControlledSdxlBenchmarkGraphNode['nodeRole'],
    nodeOrigin: 'stock_workflow' as const,
  })
  const extensionNode = (
    source: LivingFrameIpAdapterWorkflowExtensionNode,
  ) => ({
    nodeId: source.nodeId,
    nodeClass: source.nodeClass,
    nodeRole: source.nodeRole,
    nodeOrigin: 'generic_ipadapter_extension' as const,
  })
  const loraLiteral = input.parents.lora.literalInputs
  const controlLiteral =
    input.parents.controlApply.literalInputs
  if (
    loraLiteral.kind !== 'lora_strength'
    || controlLiteral.kind !== 'controlnet_application'
  ) throw invalid(
    'parent_graph_policy_mismatch',
    '$.parentGraphs.literalInputs',
  )
  const runtime = input.request.runtimePolicy!
  const clipSource = input.usesLora
    ? input.parents.lora.nodeId
    : input.parents.base.nodeId

  append(stock(input.parents.base), [
    graphInput(
      'ckpt_name',
      slot('base_checkpoint_artifact'),
      0,
    ),
  ])
  if (input.usesLora) {
    append(stock(input.parents.lora), [
      graphInput(
        'model',
        edge(input.parents.base.nodeId, 0),
        0,
      ),
      graphInput(
        'clip',
        edge(input.parents.base.nodeId, 1),
        1,
      ),
      graphInput(
        'lora_name',
        slot('lora_adapter_artifact'),
        2,
      ),
      graphInput(
        'strength_model',
        literalNumber(loraLiteral.strengthModel),
        3,
      ),
      graphInput(
        'strength_clip',
        literalNumber(loraLiteral.strengthClip),
        4,
      ),
    ])
  }
  append(stock(input.parents.positive), [
    graphInput(
      'text',
      slot('positive_conditioning_text'),
      0,
    ),
    graphInput('clip', edge(clipSource, 1), 1),
  ])
  append(stock(input.parents.negative), [
    graphInput(
      'text',
      slot('negative_conditioning_text'),
      0,
    ),
    graphInput('clip', edge(clipSource, 1), 1),
  ])
  if (input.usesControlNet) {
    append(stock(input.parents.controlLoader), [
      graphInput(
        'control_net_name',
        slot('controlnet_checkpoint_artifact'),
        0,
      ),
    ])
    append({
      nodeId: CONTROL_IMAGE_NODE_ID,
      nodeClass: 'LoadImage',
      nodeRole: 'control_image_loader',
      nodeOrigin: 'benchmark_graph_bridge',
    }, [
      graphInput(
        'image',
        slot('control_image_artifact'),
        0,
      ),
    ])
    append(stock(input.parents.controlApply), [
      graphInput(
        'positive',
        edge(input.parents.positive.nodeId, 0),
        0,
      ),
      graphInput(
        'negative',
        edge(input.parents.negative.nodeId, 0),
        1,
      ),
      graphInput(
        'control_net',
        edge(input.parents.controlLoader.nodeId, 0),
        2,
      ),
      graphInput(
        'image',
        edge(CONTROL_IMAGE_NODE_ID, 0),
        3,
      ),
      graphInput(
        'strength',
        literalNumber(controlLiteral.strength),
        4,
      ),
      graphInput(
        'start_percent',
        literalNumber(controlLiteral.startPercent),
        5,
      ),
      graphInput(
        'end_percent',
        literalNumber(controlLiteral.endPercent),
        6,
      ),
    ])
  }
  append(stock(input.parents.latent), [
    graphInput(
      'width',
      literalInteger(runtime.outputWidthPixels),
      0,
    ),
    graphInput(
      'height',
      literalInteger(runtime.outputHeightPixels),
      1,
    ),
    graphInput('batch_size', literalInteger(1), 2),
  ])
  if (input.usesIpAdapter) {
    append(extensionNode(input.parents.clipVision), [
      graphInput(
        'clip_name',
        slot('clip_vision_checkpoint_artifact'),
        0,
      ),
    ])
    append(extensionNode(input.parents.ipAdapterLoader), [
      graphInput(
        'ipadapter_file',
        slot('generic_ipadapter_checkpoint_artifact'),
        0,
      ),
    ])
    append({
      nodeId: REFERENCE_IMAGE_NODE_ID,
      nodeClass: 'LoadImage',
      nodeRole: 'reference_image_loader',
      nodeOrigin: 'benchmark_graph_bridge',
    }, [
      graphInput(
        'image',
        slot('reference_image_artifact'),
        0,
      ),
    ])
    const apply = input.extension.applyParameters
    append(extensionNode(input.parents.ipAdapterApply), [
      graphInput(
        'model',
        edge(
          input.usesLora
            ? input.parents.lora.nodeId
            : input.parents.base.nodeId,
          0,
        ),
        0,
      ),
      graphInput(
        'ipadapter',
        edge(input.parents.ipAdapterLoader.nodeId, 0),
        1,
      ),
      graphInput(
        'image',
        edge(REFERENCE_IMAGE_NODE_ID, 0),
        2,
      ),
      graphInput(
        'clip_vision',
        edge(input.parents.clipVision.nodeId, 0),
        3,
      ),
      graphInput(
        'weight',
        literalNumber(apply.weight),
        4,
      ),
      graphInput(
        'weight_type',
        literalEnum(apply.weightType),
        5,
      ),
      graphInput(
        'combine_embeds',
        literalEnum(apply.combineEmbeds),
        6,
      ),
      graphInput(
        'start_at',
        literalNumber(apply.startPercent),
        7,
      ),
      graphInput(
        'end_at',
        literalNumber(apply.endPercent),
        8,
      ),
      graphInput(
        'embeds_scaling',
        literalEnum(apply.embedsScaling),
        9,
      ),
    ])
  }
  const modelSource = input.usesIpAdapter
    ? input.parents.ipAdapterApply.nodeId
    : input.usesLora
      ? input.parents.lora.nodeId
      : input.parents.base.nodeId
  const positiveSource = input.usesControlNet
    ? input.parents.controlApply.nodeId
    : input.parents.positive.nodeId
  const negativeSource = input.usesControlNet
    ? input.parents.controlApply.nodeId
    : input.parents.negative.nodeId
  append(stock(input.parents.sampler), [
    graphInput('model', edge(modelSource, 0), 0),
    graphInput('positive', edge(positiveSource, 0), 1),
    graphInput(
      'negative',
      edge(negativeSource, input.usesControlNet ? 1 : 0),
      2,
    ),
    graphInput(
      'latent_image',
      edge(input.parents.latent.nodeId, 0),
      3,
    ),
    graphInput('seed', literalInteger(runtime.seed), 4),
    graphInput('steps', literalInteger(runtime.stepCount), 5),
    graphInput('cfg', literalNumber(runtime.cfg), 6),
    graphInput(
      'sampler_name',
      literalEnum(runtime.sampler),
      7,
    ),
    graphInput(
      'scheduler',
      literalEnum(runtime.scheduler),
      8,
    ),
    graphInput('denoise', literalNumber(runtime.denoise), 9),
  ])
  append(stock(input.parents.vae), [
    graphInput(
      'samples',
      edge(input.parents.sampler.nodeId, 0),
      0,
    ),
    graphInput(
      'vae',
      edge(input.parents.base.nodeId, 2),
      1,
    ),
  ])
  append({
    nodeId: OUTPUT_NODE_ID,
    nodeClass: 'SaveImageWebsocket',
    nodeRole: 'websocket_image_output',
    nodeOrigin: 'benchmark_graph_bridge',
  }, [
    graphInput(
      'images',
      edge(input.parents.vae.nodeId, 0),
      0,
    ),
  ], true)
  return deepFreeze(nodes)
}

function graphInput(
  inputName:
    LivingFrameControlledSdxlBenchmarkGraphInputName,
  value:
    LivingFrameControlledSdxlBenchmarkGraphInputValue,
  order: number,
): LivingFrameControlledSdxlBenchmarkGraphNodeInput {
  return { order, inputName, value }
}

function slot(
  slotKind:
    LivingFrameControlledSdxlBenchmarkRequestSlotKind,
): LivingFrameControlledSdxlBenchmarkGraphInputValue {
  return { kind: 'external_slot_reference', slotKind }
}

function edge(
  fromNodeId: string,
  outputIndex: number,
): LivingFrameControlledSdxlBenchmarkGraphInputValue {
  return {
    kind: 'node_output_reference',
    fromNodeId,
    outputIndex,
  }
}

function literalInteger(
  value: number,
): LivingFrameControlledSdxlBenchmarkGraphInputValue {
  return { kind: 'literal_integer', value }
}

function literalNumber(
  value: number,
): LivingFrameControlledSdxlBenchmarkGraphInputValue {
  return { kind: 'literal_number', value }
}

function literalEnum(
  value:
    LivingFrameControlledSdxlBenchmarkGraphLiteralEnum,
): LivingFrameControlledSdxlBenchmarkGraphInputValue {
  return { kind: 'literal_enum', value }
}

function assertExactSlotReferences(
  request:
    LivingFrameControlledSdxlBenchmarkRequestRecipe,
  nodes:
    readonly LivingFrameControlledSdxlBenchmarkGraphNode[],
): readonly LivingFrameControlledSdxlBenchmarkRequestSlotKind[] {
  const referenced = nodes.flatMap((node) =>
    node.inputs.flatMap((input) =>
      input.value.kind === 'external_slot_reference'
        ? [input.value.slotKind]
        : []))
  const required = request.requiredBindingSlots
    .map((binding) => binding.slotKind)
  if (
    new Set(referenced).size !== referenced.length
    || referenced.length !== required.length
    || required.some((slotKind) =>
      referenced.filter((value) => value === slotKind).length !== 1)
  ) throw invalid(
    'slot_reference_mismatch',
    `$.recipes.${request.order}.graph`,
  )
  return deepFreeze([...required])
}

function assertNodePolicy(
  nodes:
    readonly LivingFrameControlledSdxlBenchmarkGraphNode[],
): void {
  for (const [index, node] of nodes.entries()) {
    if (
      !(LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_NODE_CLASSES as
        readonly string[]).includes(node.nodeClass)
    ) throw invalid(
      'node_allowlist_violation',
      `$.nodes.${index}.nodeClass`,
    )
    if (
      (LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_DENIED_NODE_CLASSES as
        readonly string[]).includes(node.nodeClass)
    ) throw invalid(
      'node_denylist_violation',
      `$.nodes.${index}.nodeClass`,
    )
    if (
      node.order !== index
      || node.inputs.some((entry, inputIndex) =>
        entry.order !== inputIndex)
      || node.executableNode !== false
    ) throw invalid(
      'node_set_or_order_mismatch',
      `$.nodes.${index}`,
    )
  }
}

function assertTopologicalEdges(
  nodes:
    readonly LivingFrameControlledSdxlBenchmarkGraphNode[],
): void {
  const orderById = new Map(
    nodes.map((node, index) => [node.nodeId, index]),
  )
  if (orderById.size !== nodes.length) {
    throw invalid('node_set_or_order_mismatch', '$.nodes')
  }
  for (const [targetIndex, node] of nodes.entries()) {
    for (const input of node.inputs) {
      if (input.value.kind !== 'node_output_reference') continue
      const sourceIndex =
        orderById.get(input.value.fromNodeId)
      if (sourceIndex === undefined) {
        throw invalid(
          'edge_reference_dangling',
          `$.nodes.${targetIndex}.inputs`,
        )
      }
      if (
        sourceIndex >= targetIndex
        || !Number.isInteger(input.value.outputIndex)
        || input.value.outputIndex < 0
        || input.value.outputIndex > 8
      ) throw invalid(
        'edge_reference_not_topological',
        `$.nodes.${targetIndex}.inputs`,
      )
    }
  }
}

function assertOutputPolicy(
  nodes:
    readonly LivingFrameControlledSdxlBenchmarkGraphNode[],
): void {
  const outputs = nodes.filter((node) => node.outputNode)
  if (
    outputs.length !== 1
    || outputs[0]?.nodeId !== OUTPUT_NODE_ID
    || outputs[0]?.nodeClass !== 'SaveImageWebsocket'
  ) throw invalid(
    'output_node_policy_violation',
    '$.nodes',
  )
}

function assertCaseTopology(
  request:
    LivingFrameControlledSdxlBenchmarkRequestRecipe,
  nodes:
    readonly LivingFrameControlledSdxlBenchmarkGraphNode[],
): void {
  const roles = new Set(nodes.map((node) => node.nodeRole))
  const enabled = new Set(request.enabledComponents)
  const expected = [
    ['lora_loader', enabled.has('lora_adapter')],
    [
      'controlnet_loader',
      enabled.has('controlnet_checkpoint'),
    ],
    [
      'control_image_loader',
      enabled.has('controlnet_checkpoint'),
    ],
    [
      'controlnet_apply',
      enabled.has('controlnet_checkpoint'),
    ],
    [
      'clip_vision_loader',
      enabled.has('clip_vision_checkpoint'),
    ],
    [
      'generic_ipadapter_model_loader',
      enabled.has('generic_ipadapter_checkpoint'),
    ],
    [
      'reference_image_loader',
      enabled.has('generic_ipadapter_checkpoint'),
    ],
    [
      'generic_ipadapter_apply',
      enabled.has('generic_ipadapter_checkpoint'),
    ],
  ] as const
  if (
    expected.some(([role, present]) =>
      roles.has(role) !== present)
  ) throw invalid(
    'case_component_mismatch',
    `$.recipes.${request.order}.graph`,
  )
  const expectedCount =
    request.caseId === 'base_only_baseline'
      ? 7
      : request.caseId === 'lora_effect_probe'
        ? 8
        : request.caseId === 'controlnet_effect_probe'
          ? 10
          : request.caseId === 'ipadapter_effect_probe'
            ? 11
            : 15
  if (nodes.length !== expectedCount) {
    throw invalid(
      'case_set_or_order_mismatch',
      `$.recipes.${request.order}.graph.nodes`,
    )
  }
}

function assertRecipeSet(
  requestBlueprint:
    LivingFrameControlledSdxlBenchmarkRequestBlueprint,
  recipes:
    readonly LivingFrameControlledSdxlBenchmarkGraphRecipe[],
): void {
  if (
    recipes.length !== 7
    || recipes.some((recipe, index) => {
      const source = requestBlueprint.recipes[index]
      return (
        source === undefined
        || recipe.order !== index
        || recipe.caseId !== source.caseId
        || recipe.comparisonCaseId !== source.comparisonCaseId
        || recipe.requestRecipeDigestSha256
          !== source.recipeDigestSha256
      )
    })
    || recipes[0]?.recipeClass
      !== 'exact_bundle_load_without_graph'
    || recipes.slice(1).some((recipe) =>
      recipe.recipeClass
        !== 'case_specific_non_executable_graph_blueprint')
  ) throw invalid(
    'case_set_or_order_mismatch',
    '$.recipes',
  )
}

function recipeWithDigest(
  draft: Omit<
    LivingFrameControlledSdxlBenchmarkGraphRecipe,
    'recipeDigestSha256'
  >,
): LivingFrameControlledSdxlBenchmarkGraphRecipe {
  return deepFreeze({
    ...draft,
    recipeDigestSha256: digest(draft),
  })
}

function requireStockNode(
  workflow:
    LivingFrameControlledComfyUiWorkflowExpectation,
  role:
    LivingFrameControlledComfyUiGraphNode['nodeRole'],
  nodeClass:
    LivingFrameControlledComfyUiGraphNode['nodeClass'],
): LivingFrameControlledComfyUiGraphNode {
  const matches = workflow.nodes.filter((node) =>
    node.nodeRole === role && node.nodeClass === nodeClass)
  if (matches.length !== 1) {
    throw invalid(
      'parent_graph_policy_mismatch',
      `$.parentGraphs.stock.${role}`,
    )
  }
  return matches[0]!
}

function requireExtensionNode(
  extension:
    LivingFrameIpAdapterWorkflowExtension,
  role:
    LivingFrameIpAdapterWorkflowExtensionNode['nodeRole'],
  nodeClass:
    LivingFrameIpAdapterWorkflowExtensionNode['nodeClass'],
): LivingFrameIpAdapterWorkflowExtensionNode {
  const matches = extension.nodes.filter((node) =>
    node.nodeRole === role && node.nodeClass === nodeClass)
  if (matches.length !== 1) {
    throw invalid(
      'parent_graph_policy_mismatch',
      `$.parentGraphs.extension.${role}`,
    )
  }
  return matches[0]!
}

function assertInput(
  input:
    CreateLivingFrameControlledSdxlBenchmarkGraphBlueprintInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'graphBlueprintId',
      'requestBlueprint',
      'requestBlueprintInput',
    ])
    || typeof input.graphBlueprintId !== 'string'
    || !SAFE_ID.test(input.graphBlueprintId)
    || !isRecord(input.requestBlueprint)
    || !isRecord(input.requestBlueprintInput)
  ) throw invalid('input_invalid', '$')
}

function assertSafeOutput(
  draft:
    LivingFrameControlledSdxlBenchmarkGraphBlueprintDraft,
): void {
  if (
    draft.requestMaterialized !== false
    || draft.dispatchReady !== false
    || draft.benchmarkExecuted !== false
    || draft.artifactCreated !== false
    || draft.selectedSceneCreated !== false
    || draft.subjectSpecificRouting !== false
    || draft.productionReady !== false
    || Object.entries(draft.authorityBoundary).some(
      ([key, value]) =>
        value !== (
          key === 'deterministicGraphBlueprintAuthority'
        ),
    )
  ) throw invalid(
    'authority_promotion_forbidden',
    '$.authorityBoundary',
  )
  const serialized = canonicalJson(draft).toLowerCase()
  for (const forbidden of [
    'https://',
    'http://',
    'file://',
    '/tmp/',
    '../',
    'sk-proj-',
    'begin private key',
    'musashi',
    'hormuz',
    'helicopter',
  ]) {
    if (serialized.includes(forbidden)) {
      throw invalid('unsafe_payload_forbidden', '$')
    }
  }
}

function invalid(
  code:
    LivingFrameControlledSdxlBenchmarkGraphBlueprintIssueCode,
  path: string,
): LivingFrameControlledSdxlBenchmarkGraphBlueprintError {
  if (
    !LIVING_FRAME_CONTROLLED_SDXL_BENCHMARK_GRAPH_BLUEPRINT_ISSUES
      .includes(code)
  ) throw new Error(
    'Unknown Living Frame benchmark graph blueprint issue code.',
  )
  return new LivingFrameControlledSdxlBenchmarkGraphBlueprintError([
    { code, path },
  ])
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
  if (
    value === null
    || typeof value === 'string'
    || typeof value === 'number'
    || typeof value === 'boolean'
  ) return value
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    )
  }
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

function hasExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const sortedExpected = [...expected].sort()
  return canonicalJson(actual) === canonicalJson(sortedExpected)
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') {
    Object.freeze(value)
    for (const child of Object.values(value)) {
      deepFreeze(child)
    }
  }
  return value
}
