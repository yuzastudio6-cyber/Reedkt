import { createHash } from 'node:crypto'

import type {
  LivingFrameIpAdapterMergedWorkflow,
  LivingFrameIpAdapterMergedWorkflowAuthorityBoundary,
  LivingFrameIpAdapterMergedWorkflowBinding,
  LivingFrameIpAdapterMergedWorkflowDraft,
  LivingFrameIpAdapterMergedWorkflowEdge,
  LivingFrameIpAdapterMergedWorkflowNode,
} from '../../src/types/living-frame-ipadapter-merged-workflow'
import {
  LIVING_FRAME_IPADAPTER_MERGED_WORKFLOW_CLASS,
  LIVING_FRAME_IPADAPTER_MERGED_WORKFLOW_OPEN_GATES,
  LIVING_FRAME_IPADAPTER_MERGED_WORKFLOW_VERSION,
} from '../../src/types/living-frame-ipadapter-merged-workflow'
import {
  validateLivingFrameControlledComfyUiWorkflowExpectation,
} from './living-frame-controlled-illustration-comfyui-workflow'
import {
  validateLivingFrameIpAdapterWorkflowExtension,
} from './living-frame-ipadapter-workflow-extension'

const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/

const AUTHORITY_BOUNDARY:
  LivingFrameIpAdapterMergedWorkflowAuthorityBoundary =
  Object.freeze({
    deterministicGraphMaterializationOnly: true,
    sourceCurrentTruthAuthority: false,
    legalReviewAuthority: false,
    packageAuthority: false,
    installationAuthority: false,
    modelCompatibilityAuthority: false,
    modelWeightAuthority: false,
    referenceImageAuthority: false,
    identityDecisionAuthority: false,
    semanticRouteAuthority: false,
    selectedSceneAuthority: false,
    promptAuthority: false,
    providerAuthority: false,
    toolRegistryAuthority: false,
    toolRouteAuthority: false,
    operationAuthority: false,
    dispatchAuthority: false,
    artifactCreationAuthority: false,
    assetManifestAuthority: false,
    workItemAuthority: false,
    workGraphAuthority: false,
    queueAuthority: false,
    timingAuthority: false,
    soundAuthority: false,
    estimateAuthority: false,
    costAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

export interface CreateLivingFrameIpAdapterMergedWorkflowInput {
  readonly mergedWorkflowId: string
  readonly stockWorkflowExpectation: unknown
  readonly ipAdapterWorkflowExtension: unknown
}

export function createLivingFrameIpAdapterMergedWorkflow(
  input: CreateLivingFrameIpAdapterMergedWorkflowInput,
): LivingFrameIpAdapterMergedWorkflow {
  assertInput(input)
  const workflowResult =
    validateLivingFrameControlledComfyUiWorkflowExpectation(
      input.stockWorkflowExpectation,
    )
  const extensionResult =
    validateLivingFrameIpAdapterWorkflowExtension(
      input.ipAdapterWorkflowExtension,
    )
  if (!workflowResult.ok || !extensionResult.ok) {
    throw invalid('parent contract validation failed.')
  }
  const workflow = workflowResult.expectation
  const extension = extensionResult.extension
  if (
    extension.sourceBindings.stockWorkflowExpectationId
      !== workflow.workflowExpectationId
    || extension.sourceBindings.stockWorkflowExpectationDigestSha256
      !== workflow.expectationDigestSha256
  ) throw invalid('extension does not bind the current stock workflow.')
  const beforeWorkflow = canonicalJson(workflow)
  const beforeExtension = canonicalJson(extension)
  const superseded = workflow.edges.filter(
    (edge) =>
      edge.edgeId ===
        extension.replacedModelEdgeExpectation.stockEdgeId
      && edge.fromNodeId ===
        extension.replacedModelEdgeExpectation.modelSourceNodeId
      && edge.toNodeId ===
        extension.replacedModelEdgeExpectation.samplerNodeId
      && edge.fromPort === 'model'
      && edge.toPort === 'model',
  )
  if (superseded.length !== 1) {
    throw invalid('exactly one stock model edge must be superseded.')
  }
  const nodeSeeds = [
    ...workflow.nodes.map((node) => ({
      nodeId: node.nodeId,
      nodeOrigin: 'stock_workflow' as const,
      sourceOrder: node.order,
      nodeClass: node.nodeClass,
      nodeRole: node.nodeRole,
      executableNode: false as const,
    })),
    ...extension.nodes.map((node) => ({
      nodeId: node.nodeId,
      nodeOrigin: 'ipadapter_extension' as const,
      sourceOrder: node.order,
      nodeClass: node.nodeClass,
      nodeRole: node.nodeRole,
      executableNode: false as const,
    })),
  ]
  assertUnique(nodeSeeds.map((node) => node.nodeId), 'node')
  const effectiveEdges: readonly LivingFrameIpAdapterMergedWorkflowEdge[] = [
    ...workflow.edges
      .filter((edge) => edge.edgeId !== superseded[0].edgeId)
      .map((edge) => ({
        edgeId: edge.edgeId,
        edgeOrigin: 'stock_workflow' as const,
        sourceOrder: Number(edge.edgeId.split('.')[1] ?? 0),
        fromNodeId: edge.fromNodeId,
        fromPort: edge.fromPort,
        toNodeId: edge.toNodeId,
        toPort: edge.toPort,
      })),
    ...extension.edges.map((edge) => ({
      edgeId: edge.edgeId,
      edgeOrigin: 'ipadapter_extension' as const,
      sourceOrder: edge.order,
      fromNodeId: edge.fromNodeId,
      fromPort: edge.fromPort,
      toNodeId: edge.toNodeId,
      toPort: edge.toPort,
    })),
  ]
  assertUnique(effectiveEdges.map((edge) => edge.edgeId), 'edge')
  assertAllEdgesBound(
    nodeSeeds.map((node) => node.nodeId),
    effectiveEdges,
  )
  const topologicalNodeIds = topologicalSort(
    nodeSeeds,
    effectiveEdges,
  )
  const orderById = new Map(
    topologicalNodeIds.map((nodeId, index) => [nodeId, index + 1]),
  )
  const nodes: readonly LivingFrameIpAdapterMergedWorkflowNode[] =
    nodeSeeds.map((node) => ({
      ...node,
      topologicalOrder: orderById.get(node.nodeId)!,
    })).sort((left, right) =>
      left.topologicalOrder - right.topologicalOrder)
  const externalBindings: readonly LivingFrameIpAdapterMergedWorkflowBinding[] =
    [
      ...workflow.externalBindingExpectations.map((binding) => ({
        bindingId: binding.bindingExpectationId,
        bindingOrigin: 'stock_workflow' as const,
        bindingKind: binding.bindingKind,
        bindingDigestSha256: binding.bindingDigestSha256,
        targetNodeId: binding.targetNodeId,
        targetPort: binding.targetPort,
        artifactResolved: false as const,
      })),
      ...extension.externalBindings.map((binding, index) => ({
        bindingId:
          `extension.binding.${String(index + 1).padStart(2, '0')}.${binding.bindingKind}`,
        bindingOrigin: 'ipadapter_extension' as const,
        bindingKind: binding.bindingKind,
        bindingDigestSha256: binding.bindingDigestSha256,
        targetNodeId: binding.targetNodeId,
        targetPort: binding.targetPort,
        artifactResolved: false as const,
      })),
    ]
  assertUnique(externalBindings.map((binding) => binding.bindingId), 'binding')
  assertAllBindingsBound(
    nodes.map((node) => node.nodeId),
    externalBindings,
  )
  if (
    beforeWorkflow !== canonicalJson(workflow)
    || beforeExtension !== canonicalJson(extension)
  ) throw invalid('parent contracts were mutated.')
  const draft: LivingFrameIpAdapterMergedWorkflowDraft = {
    contractVersion: LIVING_FRAME_IPADAPTER_MERGED_WORKFLOW_VERSION,
    resultClass: LIVING_FRAME_IPADAPTER_MERGED_WORKFLOW_CLASS,
    mergedWorkflowId: input.mergedWorkflowId,
    profile: workflow.profile,
    sourceBindings: {
      stockWorkflowExpectationId: workflow.workflowExpectationId,
      stockWorkflowExpectationDigestSha256:
        workflow.expectationDigestSha256,
      stockWorkflowGateSetDigestSha256:
        digest(workflow.openGateCodes),
      ipAdapterExtensionId: extension.extensionId,
      ipAdapterExtensionDigestSha256:
        extension.extensionDigestSha256,
      ipAdapterExtensionGateSetDigestSha256:
        digest(extension.openGateCodes),
    },
    graph: {
      nodes,
      effectiveEdges,
      externalBindings,
      topologicalNodeIds,
      terminalImageNodeId: workflow.terminalImageNodeId,
      supersededStockModelEdgeId: superseded[0].edgeId,
      directStockModelEdgePresent: false,
      acyclic: true,
      deterministicOrder: true,
    },
    metrics: {
      stockNodeCount: workflow.nodes.length,
      extensionNodeCount: extension.nodes.length,
      effectiveNodeCount: nodes.length,
      stockEdgeCountBeforeSupersession: workflow.edges.length,
      supersededStockEdgeCount: 1,
      extensionEdgeCount: extension.edges.length,
      effectiveEdgeCount: effectiveEdges.length,
      externalBindingCount: externalBindings.length,
    },
    openGateCodes: LIVING_FRAME_IPADAPTER_MERGED_WORKFLOW_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    parentContractsRevalidated: true,
    parentObjectsMutated: false,
    genericRouteOnly: true,
    faceIdRoutePresent: false,
    insightFaceRoutePresent: false,
    auraFaceGenerationConditioningPresent: false,
    rawPromptOrReferenceImagePresent: false,
    filenamePathOrUrlPresent: false,
    providerOrToolIdentifierPresent: false,
    executableWorkflowPresent: false,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  return {
    ...draft,
    mergedWorkflowDigestSha256: digest(draft),
  }
}

export function verifyLivingFrameIpAdapterMergedWorkflow(
  value: unknown,
  input: CreateLivingFrameIpAdapterMergedWorkflowInput,
): value is LivingFrameIpAdapterMergedWorkflow {
  try {
    if (!isRecord(value) || !hasExactKeys(value, [
      'contractVersion',
      'resultClass',
      'mergedWorkflowId',
      'profile',
      'sourceBindings',
      'graph',
      'metrics',
      'openGateCodes',
      'authorityBoundary',
      'parentContractsRevalidated',
      'parentObjectsMutated',
      'genericRouteOnly',
      'faceIdRoutePresent',
      'insightFaceRoutePresent',
      'auraFaceGenerationConditioningPresent',
      'rawPromptOrReferenceImagePresent',
      'filenamePathOrUrlPresent',
      'providerOrToolIdentifierPresent',
      'executableWorkflowPresent',
      'subjectSpecificRouting',
      'productionReady',
      'mergedWorkflowDigestSha256',
    ])) return false
    const expected = createLivingFrameIpAdapterMergedWorkflow(input)
    return canonicalJson(expected) === canonicalJson(value)
  } catch {
    return false
  }
}

function topologicalSort(
  nodes: readonly {
    readonly nodeId: string
    readonly nodeOrigin: 'stock_workflow' | 'ipadapter_extension'
    readonly sourceOrder: number
  }[],
  edges: readonly LivingFrameIpAdapterMergedWorkflowEdge[],
): readonly string[] {
  const nodeIds = new Set(nodes.map((node) => node.nodeId))
  const indegree = new Map([...nodeIds].map((id) => [id, 0]))
  const adjacency = new Map([...nodeIds].map((id) => [id, [] as string[]]))
  edges.forEach((edge) => {
    indegree.set(edge.toNodeId, indegree.get(edge.toNodeId)! + 1)
    adjacency.get(edge.fromNodeId)!.push(edge.toNodeId)
  })
  const rank = new Map(nodes.map((node) => [
    node.nodeId,
    `${node.nodeOrigin === 'stock_workflow' ? '0' : '1'}:${String(node.sourceOrder).padStart(4, '0')}:${node.nodeId}`,
  ]))
  const ready = [...nodeIds]
    .filter((id) => indegree.get(id) === 0)
    .sort((left, right) => rank.get(left)!.localeCompare(rank.get(right)!))
  const ordered: string[] = []
  while (ready.length > 0) {
    const nodeId = ready.shift()!
    ordered.push(nodeId)
    for (const next of adjacency.get(nodeId)!.sort()) {
      indegree.set(next, indegree.get(next)! - 1)
      if (indegree.get(next) === 0) {
        ready.push(next)
        ready.sort((left, right) =>
          rank.get(left)!.localeCompare(rank.get(right)!))
      }
    }
  }
  if (ordered.length !== nodes.length) {
    throw invalid('merged graph is cyclic.')
  }
  return ordered
}

function assertInput(
  input: CreateLivingFrameIpAdapterMergedWorkflowInput,
): void {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'mergedWorkflowId',
      'stockWorkflowExpectation',
      'ipAdapterWorkflowExtension',
    ])
    || typeof input.mergedWorkflowId !== 'string'
    || !SAFE_ID.test(input.mergedWorkflowId)
  ) throw invalid('input shape is invalid.')
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw invalid(`merged ${label} identifiers are not unique.`)
  }
}

function assertAllEdgesBound(
  nodeIds: readonly string[],
  edges: readonly LivingFrameIpAdapterMergedWorkflowEdge[],
): void {
  const ids = new Set(nodeIds)
  if (edges.some((edge) =>
    !ids.has(edge.fromNodeId) || !ids.has(edge.toNodeId))) {
    throw invalid('merged graph contains a dangling edge.')
  }
}

function assertAllBindingsBound(
  nodeIds: readonly string[],
  bindings: readonly LivingFrameIpAdapterMergedWorkflowBinding[],
): void {
  const ids = new Set(nodeIds)
  if (bindings.some((binding) => !ids.has(binding.targetNodeId))) {
    throw invalid('merged graph contains a dangling binding.')
  }
}

function invalid(message: string): Error {
  return new Error(`Living Frame IP-Adapter merge rejected: ${message}`)
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
}

function digest(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex')
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalize(value[key])]),
    )
  }
  return value
}
