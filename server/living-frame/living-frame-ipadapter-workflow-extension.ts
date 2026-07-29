import { createHash } from 'node:crypto'

import type {
  LivingFrameIpAdapterCombineEmbeds,
  LivingFrameIpAdapterEmbedsScaling,
  LivingFrameIpAdapterWeightType,
  LivingFrameIpAdapterWorkflowAuthorityBoundary,
  LivingFrameIpAdapterWorkflowExtension,
  LivingFrameIpAdapterWorkflowExtensionDraft,
  LivingFrameIpAdapterWorkflowExtensionEdge,
  LivingFrameIpAdapterWorkflowExtensionNode,
  LivingFrameIpAdapterWorkflowIssue,
  LivingFrameIpAdapterWorkflowIssueCode,
  LivingFrameIpAdapterWorkflowValidationResult,
} from '../../src/types/living-frame-ipadapter-workflow-extension'
import {
  LIVING_FRAME_IPADAPTER_COMBINE_EMBEDS,
  LIVING_FRAME_IPADAPTER_EMBEDS_SCALING,
  LIVING_FRAME_IPADAPTER_WEIGHT_TYPES,
  LIVING_FRAME_IPADAPTER_WORKFLOW_EXTENSION_CLASS,
  LIVING_FRAME_IPADAPTER_WORKFLOW_EXTENSION_VERSION,
  LIVING_FRAME_IPADAPTER_WORKFLOW_NODE_CLASSES,
  LIVING_FRAME_IPADAPTER_WORKFLOW_OPEN_GATES,
} from '../../src/types/living-frame-ipadapter-workflow-extension'
import type {
  LivingFrameIpAdapterExtensionEvaluation,
} from '../../src/types/living-frame-controlled-illustration-ipadapter-extension'
import type {
  LivingFrameControlledComfyUiGraphEdge,
  LivingFrameControlledComfyUiWorkflowExpectation,
} from '../../src/types/living-frame-controlled-illustration-comfyui-workflow'
import {
  validateLivingFrameIpAdapterExtensionEvaluation,
} from './living-frame-controlled-illustration-ipadapter-extension'
import {
  validateLivingFrameControlledComfyUiWorkflowExpectation,
} from './living-frame-controlled-illustration-comfyui-workflow'

const SHA256 = /^[a-f0-9]{64}$/
const SAFE_ID = /^[a-z0-9][a-z0-9._:-]{0,127}$/

const AUTHORITY_BOUNDARY:
  LivingFrameIpAdapterWorkflowAuthorityBoundary = Object.freeze({
    controlledGraphExtensionExpectationOnly: true,
    sourceCurrentTruthAuthority: false,
    legalReviewAuthority: false,
    packageAuthority: false,
    installationAuthority: false,
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

export interface CreateLivingFrameIpAdapterWorkflowExtensionInput {
  readonly extensionId: string
  readonly stockWorkflowExpectation: unknown
  readonly ipAdapterSourceEvaluation: unknown
  readonly genericIpAdapterCheckpointBindingDigestSha256: string
  readonly clipVisionCheckpointBindingDigestSha256: string
  readonly approvedReferenceImageBindingDigestSha256: string
  readonly weight: number
  readonly weightType: LivingFrameIpAdapterWeightType
  readonly combineEmbeds: LivingFrameIpAdapterCombineEmbeds
  readonly startPercent: number
  readonly endPercent: number
  readonly embedsScaling: LivingFrameIpAdapterEmbedsScaling
}

export class LivingFrameIpAdapterWorkflowExtensionError extends Error {
  readonly issues: readonly LivingFrameIpAdapterWorkflowIssue[]

  constructor(issues: readonly LivingFrameIpAdapterWorkflowIssue[]) {
    super('Living Frame generic IP-Adapter workflow extension failed.')
    this.name = 'LivingFrameIpAdapterWorkflowExtensionError'
    this.issues = issues
  }
}

export function createLivingFrameIpAdapterWorkflowExtension(
  input: CreateLivingFrameIpAdapterWorkflowExtensionInput,
): LivingFrameIpAdapterWorkflowExtension {
  const inputIssues = validateCreateInput(input)
  if (inputIssues.length > 0) {
    throw new LivingFrameIpAdapterWorkflowExtensionError(inputIssues)
  }
  const workflowResult =
    validateLivingFrameControlledComfyUiWorkflowExpectation(
      input.stockWorkflowExpectation,
    )
  const evaluationResult =
    validateLivingFrameIpAdapterExtensionEvaluation(
      input.ipAdapterSourceEvaluation,
    )
  if (!workflowResult.ok || !evaluationResult.ok) {
    throw new LivingFrameIpAdapterWorkflowExtensionError([
      ...(!workflowResult.ok
        ? [{
            code: 'stock_workflow_invalid' as const,
            path: '$.stockWorkflowExpectation',
          }]
        : []),
      ...(!evaluationResult.ok
        ? [{
            code: 'extension_evaluation_invalid' as const,
            path: '$.ipAdapterSourceEvaluation',
          }]
        : []),
    ])
  }
  return compileExtension(
    input,
    workflowResult.expectation,
    evaluationResult.evaluation,
  )
}

export function validateLivingFrameIpAdapterWorkflowExtension(
  value: unknown,
): LivingFrameIpAdapterWorkflowValidationResult {
  const issues: LivingFrameIpAdapterWorkflowIssue[] = []
  if (!isRecord(value)) return invalidResult('input_invalid', '$')
  pushExactKeys(value, [
    'contractVersion',
    'resultClass',
    'extensionId',
    'sourceBindings',
    'replacedModelEdgeExpectation',
    'nodes',
    'edges',
    'externalBindings',
    'applyParameters',
    'openGateCodes',
    'authorityBoundary',
    'genericRouteOnly',
    'faceIdRoutePresent',
    'insightFaceRoutePresent',
    'auraFaceGenerationConditioningPresent',
    'rawReferenceImagePresent',
    'filenamePathOrUrlPresent',
    'providerOrToolIdentifierPresent',
    'workOrQueueIdentifierPresent',
    'executableWorkflowPresent',
    'parentContractsRevalidationRequired',
    'subjectSpecificRouting',
    'productionReady',
    'extensionDigestSha256',
  ], '$', issues)
  if (issues.length > 0) return { ok: false, issues }
  const extension = value as unknown as LivingFrameIpAdapterWorkflowExtension
  if (
    extension.contractVersion
      !== LIVING_FRAME_IPADAPTER_WORKFLOW_EXTENSION_VERSION
    || extension.resultClass
      !== LIVING_FRAME_IPADAPTER_WORKFLOW_EXTENSION_CLASS
  ) push(issues, 'input_invalid', '$')
  if (!SAFE_ID.test(extension.extensionId)) {
    push(issues, 'unsafe_input', '$.extensionId')
  }
  validateSourceBindings(extension.sourceBindings, issues)
  validateReplacedEdge(extension.replacedModelEdgeExpectation, issues)
  validateNodes(extension.nodes, issues)
  validateEdges(
    extension.edges,
    extension.replacedModelEdgeExpectation,
    issues,
  )
  validateExternalBindings(extension.externalBindings, issues)
  validateParameters(extension.applyParameters, issues)
  if (
    !Array.isArray(extension.openGateCodes)
    || canonicalJson(extension.openGateCodes)
      !== canonicalJson(LIVING_FRAME_IPADAPTER_WORKFLOW_OPEN_GATES)
  ) push(issues, 'gate_set_invalid', '$.openGateCodes')
  if (
    canonicalJson(extension.authorityBoundary)
      !== canonicalJson(AUTHORITY_BOUNDARY)
  ) push(issues, 'authority_promotion_forbidden', '$.authorityBoundary')
  if (
    extension.genericRouteOnly !== true
    || extension.faceIdRoutePresent !== false
    || extension.insightFaceRoutePresent !== false
    || extension.auraFaceGenerationConditioningPresent !== false
    || extension.rawReferenceImagePresent !== false
    || extension.filenamePathOrUrlPresent !== false
    || extension.providerOrToolIdentifierPresent !== false
    || extension.workOrQueueIdentifierPresent !== false
    || extension.executableWorkflowPresent !== false
    || extension.parentContractsRevalidationRequired !== true
    || extension.productionReady !== false
  ) push(issues, 'authority_promotion_forbidden', '$')
  if (
    extension.faceIdRoutePresent !== false
    || extension.insightFaceRoutePresent !== false
  ) push(issues, 'faceid_route_forbidden', '$')
  if (extension.auraFaceGenerationConditioningPresent !== false) {
    push(issues, 'auraface_generation_route_forbidden', '$')
  }
  if (extension.subjectSpecificRouting !== false) {
    push(issues, 'subject_specific_routing_forbidden', '$.subjectSpecificRouting')
  }
  if (
    typeof extension.extensionDigestSha256 !== 'string'
    || !SHA256.test(extension.extensionDigestSha256)
  ) {
    push(issues, 'digest_mismatch', '$.extensionDigestSha256')
  } else {
    const { extensionDigestSha256, ...draft } = extension
    if (digest(draft) !== extensionDigestSha256) {
      push(issues, 'digest_mismatch', '$.extensionDigestSha256')
    }
  }
  return issues.length > 0
    ? { ok: false, issues }
    : { ok: true, extension }
}

export function verifyLivingFrameIpAdapterWorkflowExtension(
  value: unknown,
): value is LivingFrameIpAdapterWorkflowExtension {
  return validateLivingFrameIpAdapterWorkflowExtension(value).ok
}

function compileExtension(
  input: CreateLivingFrameIpAdapterWorkflowExtensionInput,
  workflow: LivingFrameControlledComfyUiWorkflowExpectation,
  evaluation: LivingFrameIpAdapterExtensionEvaluation,
): LivingFrameIpAdapterWorkflowExtension {
  if (
    evaluation.sourceBindings.stockComfyUiGraphExpectationDigestSha256
      !== workflow.expectationDigestSha256
  ) {
    throw issueError(
      'extension_lineage_mismatch',
      '$.ipAdapterSourceEvaluation.sourceBindings.stockComfyUiGraphExpectationDigestSha256',
    )
  }
  const modelEdges = workflow.edges.filter(
    (edge) => edge.toPort === 'model'
      && workflow.nodes.some(
        (node) =>
          node.nodeId === edge.toNodeId
          && node.nodeRole === 'sampler',
      ),
  )
  if (modelEdges.length === 0) {
    throw issueError('model_edge_missing', '$.stockWorkflowExpectation.edges')
  }
  if (modelEdges.length !== 1) {
    throw issueError('model_edge_duplicate', '$.stockWorkflowExpectation.edges')
  }
  const stockModelEdge = modelEdges[0]
  validateStockModelEdge(stockModelEdge, workflow)
  const nodes: readonly LivingFrameIpAdapterWorkflowExtensionNode[] = [
    {
      nodeId: 'extension.node.01.clip_vision_loader',
      order: 1,
      nodeClass: 'CLIPVisionLoader',
      nodeRole: 'clip_vision_loader',
      builtinStockNode: true,
      reviewedExtensionNode: false,
      executableNode: false,
    },
    {
      nodeId: 'extension.node.02.ipadapter_model_loader',
      order: 2,
      nodeClass: 'IPAdapterModelLoader',
      nodeRole: 'generic_ipadapter_model_loader',
      builtinStockNode: false,
      reviewedExtensionNode: true,
      executableNode: false,
    },
    {
      nodeId: 'extension.node.03.ipadapter_advanced',
      order: 3,
      nodeClass: 'IPAdapterAdvanced',
      nodeRole: 'generic_ipadapter_apply',
      builtinStockNode: false,
      reviewedExtensionNode: true,
      executableNode: false,
    },
  ]
  const applyNodeId = nodes[2].nodeId
  const edges: readonly LivingFrameIpAdapterWorkflowExtensionEdge[] = [
    {
      edgeId: 'extension.edge.01.model_in',
      order: 1,
      fromNodeId: stockModelEdge.fromNodeId,
      fromPort: 'model',
      toNodeId: applyNodeId,
      toPort: 'model',
    },
    {
      edgeId: 'extension.edge.02.ipadapter_in',
      order: 2,
      fromNodeId: nodes[1].nodeId,
      fromPort: 'ipadapter',
      toNodeId: applyNodeId,
      toPort: 'ipadapter',
    },
    {
      edgeId: 'extension.edge.03.clip_vision_in',
      order: 3,
      fromNodeId: nodes[0].nodeId,
      fromPort: 'clip_vision',
      toNodeId: applyNodeId,
      toPort: 'clip_vision',
    },
    {
      edgeId: 'extension.edge.04.model_out',
      order: 4,
      fromNodeId: applyNodeId,
      fromPort: 'model',
      toNodeId: stockModelEdge.toNodeId,
      toPort: 'model',
    },
  ]
  const draft: LivingFrameIpAdapterWorkflowExtensionDraft = {
    contractVersion: LIVING_FRAME_IPADAPTER_WORKFLOW_EXTENSION_VERSION,
    resultClass: LIVING_FRAME_IPADAPTER_WORKFLOW_EXTENSION_CLASS,
    extensionId: input.extensionId,
    sourceBindings: {
      stockWorkflowExpectationId: workflow.workflowExpectationId,
      stockWorkflowExpectationDigestSha256: workflow.expectationDigestSha256,
      ipAdapterSourceEvaluationId: evaluation.evaluationId,
      ipAdapterSourceEvaluationDigestSha256:
        evaluation.evaluationDigestSha256,
    },
    replacedModelEdgeExpectation: {
      stockEdgeId: stockModelEdge.edgeId,
      modelSourceNodeId: stockModelEdge.fromNodeId,
      samplerNodeId: stockModelEdge.toNodeId,
      directModelEdgeMustBeSuperseded: true,
      stockWorkflowMutationPerformed: false,
    },
    nodes,
    edges,
    externalBindings: [
      {
        bindingKind: 'generic_ipadapter_checkpoint_artifact',
        bindingDigestSha256:
          input.genericIpAdapterCheckpointBindingDigestSha256,
        targetNodeId: nodes[1].nodeId,
        targetPort: 'ipadapter_file',
        artifactResolved: false,
      },
      {
        bindingKind: 'clip_vision_checkpoint_artifact',
        bindingDigestSha256:
          input.clipVisionCheckpointBindingDigestSha256,
        targetNodeId: nodes[0].nodeId,
        targetPort: 'clip_name',
        artifactResolved: false,
      },
      {
        bindingKind: 'approved_reference_image_artifact',
        bindingDigestSha256:
          input.approvedReferenceImageBindingDigestSha256,
        targetNodeId: applyNodeId,
        targetPort: 'image',
        artifactResolved: false,
      },
    ],
    applyParameters: {
      weight: input.weight,
      weightType: input.weightType,
      combineEmbeds: input.combineEmbeds,
      startPercent: input.startPercent,
      endPercent: input.endPercent,
      embedsScaling: input.embedsScaling,
    },
    openGateCodes: LIVING_FRAME_IPADAPTER_WORKFLOW_OPEN_GATES,
    authorityBoundary: AUTHORITY_BOUNDARY,
    genericRouteOnly: true,
    faceIdRoutePresent: false,
    insightFaceRoutePresent: false,
    auraFaceGenerationConditioningPresent: false,
    rawReferenceImagePresent: false,
    filenamePathOrUrlPresent: false,
    providerOrToolIdentifierPresent: false,
    workOrQueueIdentifierPresent: false,
    executableWorkflowPresent: false,
    parentContractsRevalidationRequired: true,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  return { ...draft, extensionDigestSha256: digest(draft) }
}

function validateStockModelEdge(
  edge: LivingFrameControlledComfyUiGraphEdge,
  workflow: LivingFrameControlledComfyUiWorkflowExpectation,
): void {
  const source = workflow.nodes.find((node) => node.nodeId === edge.fromNodeId)
  const target = workflow.nodes.find((node) => node.nodeId === edge.toNodeId)
  if (
    edge.fromPort !== 'model'
    || edge.toPort !== 'model'
    || !source
    || !['base_checkpoint_loader', 'lora_loader'].includes(source.nodeRole)
    || !target
    || target.nodeRole !== 'sampler'
  ) throw issueError('model_edge_invalid', '$.stockWorkflowExpectation.edges')
}

function validateCreateInput(
  input: CreateLivingFrameIpAdapterWorkflowExtensionInput,
): readonly LivingFrameIpAdapterWorkflowIssue[] {
  if (!isRecord(input)) return [issue('input_invalid', '$')]
  const issues: LivingFrameIpAdapterWorkflowIssue[] = []
  pushExactKeys(input as unknown as Record<string, unknown>, [
    'extensionId',
    'stockWorkflowExpectation',
    'ipAdapterSourceEvaluation',
    'genericIpAdapterCheckpointBindingDigestSha256',
    'clipVisionCheckpointBindingDigestSha256',
    'approvedReferenceImageBindingDigestSha256',
    'weight',
    'weightType',
    'combineEmbeds',
    'startPercent',
    'endPercent',
    'embedsScaling',
  ], '$', issues)
  if (typeof input.extensionId !== 'string' || !SAFE_ID.test(input.extensionId)) {
    push(issues, 'unsafe_input', '$.extensionId')
  }
  if (
    !validateLivingFrameControlledComfyUiWorkflowExpectation(
      input.stockWorkflowExpectation,
    ).ok
  ) push(issues, 'stock_workflow_invalid', '$.stockWorkflowExpectation')
  if (
    !validateLivingFrameIpAdapterExtensionEvaluation(
      input.ipAdapterSourceEvaluation,
    ).ok
  ) push(issues, 'extension_evaluation_invalid', '$.ipAdapterSourceEvaluation')
  for (const key of [
    'genericIpAdapterCheckpointBindingDigestSha256',
    'clipVisionCheckpointBindingDigestSha256',
    'approvedReferenceImageBindingDigestSha256',
  ] as const) {
    if (typeof input[key] !== 'string' || !SHA256.test(input[key])) {
      push(issues, 'binding_invalid', `$.${key}`)
    }
  }
  if (!validParameters(input as unknown as Record<string, unknown>)) {
    push(issues, 'parameter_invalid', '$')
  }
  return dedupe(issues)
}

function validateSourceBindings(
  value: unknown,
  issues: LivingFrameIpAdapterWorkflowIssue[],
): void {
  const path = '$.sourceBindings'
  if (!isRecord(value)) {
    push(issues, 'extension_lineage_mismatch', path)
    return
  }
  pushExactKeys(value, [
    'stockWorkflowExpectationId',
    'stockWorkflowExpectationDigestSha256',
    'ipAdapterSourceEvaluationId',
    'ipAdapterSourceEvaluationDigestSha256',
  ], path, issues)
  if (
    !SAFE_ID.test(String(value.stockWorkflowExpectationId))
    || !SAFE_ID.test(String(value.ipAdapterSourceEvaluationId))
    || !SHA256.test(String(value.stockWorkflowExpectationDigestSha256))
    || !SHA256.test(String(value.ipAdapterSourceEvaluationDigestSha256))
  ) push(issues, 'extension_lineage_mismatch', path)
}

function validateReplacedEdge(
  value: unknown,
  issues: LivingFrameIpAdapterWorkflowIssue[],
): void {
  const path = '$.replacedModelEdgeExpectation'
  if (!isRecord(value)) {
    push(issues, 'model_edge_invalid', path)
    return
  }
  pushExactKeys(value, [
    'stockEdgeId',
    'modelSourceNodeId',
    'samplerNodeId',
    'directModelEdgeMustBeSuperseded',
    'stockWorkflowMutationPerformed',
  ], path, issues)
  if (
    !SAFE_ID.test(String(value.stockEdgeId))
    || !SAFE_ID.test(String(value.modelSourceNodeId))
    || !SAFE_ID.test(String(value.samplerNodeId))
    || value.directModelEdgeMustBeSuperseded !== true
    || value.stockWorkflowMutationPerformed !== false
  ) push(issues, 'model_edge_invalid', path)
}

function validateNodes(
  value: unknown,
  issues: LivingFrameIpAdapterWorkflowIssue[],
): void {
  if (!Array.isArray(value) || value.length !== 3) {
    push(issues, 'node_set_invalid', '$.nodes')
    return
  }
  const expectedRoles = [
    'clip_vision_loader',
    'generic_ipadapter_model_loader',
    'generic_ipadapter_apply',
  ] as const
  const expectedIds = [
    'extension.node.01.clip_vision_loader',
    'extension.node.02.ipadapter_model_loader',
    'extension.node.03.ipadapter_advanced',
  ] as const
  const expectedClasses = [
    'CLIPVisionLoader',
    'IPAdapterModelLoader',
    'IPAdapterAdvanced',
  ] as const
  for (const [index, node] of value.entries()) {
    const path = `$.nodes[${index}]`
    if (!isRecord(node)) {
      push(issues, 'node_set_invalid', path)
      continue
    }
    pushExactKeys(node, [
      'nodeId',
      'order',
      'nodeClass',
      'nodeRole',
      'builtinStockNode',
      'reviewedExtensionNode',
      'executableNode',
    ], path, issues)
    const expectedBuiltin = index === 0
    if (
      !SAFE_ID.test(String(node.nodeId))
      || node.nodeId !== expectedIds[index]
      || node.order !== index + 1
      || node.nodeRole !== expectedRoles[index]
      || !LIVING_FRAME_IPADAPTER_WORKFLOW_NODE_CLASSES.includes(
        node.nodeClass as never,
      )
      || node.nodeClass !== expectedClasses[index]
      || node.builtinStockNode !== expectedBuiltin
      || node.reviewedExtensionNode !== !expectedBuiltin
      || node.executableNode !== false
    ) push(issues, 'node_set_invalid', path)
  }
}

function validateEdges(
  value: unknown,
  replacement: unknown,
  issues: LivingFrameIpAdapterWorkflowIssue[],
): void {
  if (!Array.isArray(value) || value.length !== 4) {
    push(issues, 'edge_set_invalid', '$.edges')
    return
  }
  const expectedPorts = [
    ['model', 'model'],
    ['ipadapter', 'ipadapter'],
    ['clip_vision', 'clip_vision'],
    ['model', 'model'],
  ] as const
  for (const [index, edge] of value.entries()) {
    const path = `$.edges[${index}]`
    if (!isRecord(edge)) {
      push(issues, 'edge_set_invalid', path)
      continue
    }
    pushExactKeys(edge, [
      'edgeId',
      'order',
      'fromNodeId',
      'fromPort',
      'toNodeId',
      'toPort',
    ], path, issues)
    if (
      !SAFE_ID.test(String(edge.edgeId))
      || !SAFE_ID.test(String(edge.fromNodeId))
      || !SAFE_ID.test(String(edge.toNodeId))
      || edge.order !== index + 1
      || edge.fromPort !== expectedPorts[index][0]
      || edge.toPort !== expectedPorts[index][1]
    ) push(issues, 'edge_set_invalid', path)
  }
  const modelIn = value[0]
  const ipAdapterIn = value[1]
  const clipVisionIn = value[2]
  const modelOut = value[3]
  if (
    !isRecord(modelIn)
    || !isRecord(ipAdapterIn)
    || !isRecord(clipVisionIn)
    || !isRecord(modelOut)
    || modelIn.toNodeId !== ipAdapterIn.toNodeId
    || modelIn.toNodeId !== clipVisionIn.toNodeId
    || modelIn.toNodeId !== modelOut.fromNodeId
  ) push(issues, 'edge_set_invalid', '$.edges')
  if (
    !isRecord(replacement)
    || !isRecord(modelIn)
    || !isRecord(ipAdapterIn)
    || !isRecord(clipVisionIn)
    || !isRecord(modelOut)
    || modelIn.fromNodeId !== replacement.modelSourceNodeId
    || modelIn.toNodeId !== 'extension.node.03.ipadapter_advanced'
    || ipAdapterIn.fromNodeId !== 'extension.node.02.ipadapter_model_loader'
    || ipAdapterIn.toNodeId !== 'extension.node.03.ipadapter_advanced'
    || clipVisionIn.fromNodeId !== 'extension.node.01.clip_vision_loader'
    || clipVisionIn.toNodeId !== 'extension.node.03.ipadapter_advanced'
    || modelOut.fromNodeId !== 'extension.node.03.ipadapter_advanced'
    || modelOut.toNodeId !== replacement.samplerNodeId
  ) push(issues, 'edge_set_invalid', '$.edges')
}

function validateExternalBindings(
  value: unknown,
  issues: LivingFrameIpAdapterWorkflowIssue[],
): void {
  if (!Array.isArray(value) || value.length !== 3) {
    push(issues, 'binding_invalid', '$.externalBindings')
    return
  }
  const expected = [
    [
      'generic_ipadapter_checkpoint_artifact',
      'ipadapter_file',
      'extension.node.02.ipadapter_model_loader',
    ],
    [
      'clip_vision_checkpoint_artifact',
      'clip_name',
      'extension.node.01.clip_vision_loader',
    ],
    [
      'approved_reference_image_artifact',
      'image',
      'extension.node.03.ipadapter_advanced',
    ],
  ] as const
  for (const [index, binding] of value.entries()) {
    const path = `$.externalBindings[${index}]`
    if (!isRecord(binding)) {
      push(issues, 'binding_invalid', path)
      continue
    }
    pushExactKeys(binding, [
      'bindingKind',
      'bindingDigestSha256',
      'targetNodeId',
      'targetPort',
      'artifactResolved',
    ], path, issues)
    if (
      binding.bindingKind !== expected[index][0]
      || binding.targetPort !== expected[index][1]
      || binding.targetNodeId !== expected[index][2]
      || !SAFE_ID.test(String(binding.targetNodeId))
      || !SHA256.test(String(binding.bindingDigestSha256))
      || binding.artifactResolved !== false
    ) push(issues, 'binding_invalid', path)
  }
}

function validateParameters(
  value: unknown,
  issues: LivingFrameIpAdapterWorkflowIssue[],
): void {
  if (!isRecord(value)) {
    push(issues, 'parameter_invalid', '$.applyParameters')
    return
  }
  pushExactKeys(value, [
    'weight',
    'weightType',
    'combineEmbeds',
    'startPercent',
    'endPercent',
    'embedsScaling',
  ], '$.applyParameters', issues)
  if (!validParameters(value)) {
    push(issues, 'parameter_invalid', '$.applyParameters')
  }
}

function validParameters(value: Record<string, unknown>): boolean {
  return finiteBetween(value.weight, -1, 3)
    && includes(LIVING_FRAME_IPADAPTER_WEIGHT_TYPES, value.weightType)
    && includes(LIVING_FRAME_IPADAPTER_COMBINE_EMBEDS, value.combineEmbeds)
    && finiteBetween(value.startPercent, 0, 1)
    && finiteBetween(value.endPercent, 0, 1)
    && Number(value.startPercent) < Number(value.endPercent)
    && includes(LIVING_FRAME_IPADAPTER_EMBEDS_SCALING, value.embedsScaling)
}

function finiteBetween(
  value: unknown,
  minimum: number,
  maximum: number,
): boolean {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= minimum
    && value <= maximum
}

function includes<const T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] {
  return typeof value === 'string' && values.includes(value)
}

function pushExactKeys(
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
  path: string,
  issues: LivingFrameIpAdapterWorkflowIssue[],
): void {
  const expected = new Set(expectedKeys)
  for (const key of Object.keys(value)) {
    if (!expected.has(key)) push(issues, 'unknown_key', `${path}.${key}`)
  }
  for (const key of expectedKeys) {
    if (!Object.hasOwn(value, key)) push(issues, 'input_invalid', `${path}.${key}`)
  }
}

function issue(
  code: LivingFrameIpAdapterWorkflowIssueCode,
  path: string,
): LivingFrameIpAdapterWorkflowIssue {
  return { code, path }
}

function push(
  issues: LivingFrameIpAdapterWorkflowIssue[],
  code: LivingFrameIpAdapterWorkflowIssueCode,
  path: string,
): void {
  issues.push(issue(code, path))
}

function issueError(
  code: LivingFrameIpAdapterWorkflowIssueCode,
  path: string,
): LivingFrameIpAdapterWorkflowExtensionError {
  return new LivingFrameIpAdapterWorkflowExtensionError([issue(code, path)])
}

function invalidResult(
  code: LivingFrameIpAdapterWorkflowIssueCode,
  path: string,
): LivingFrameIpAdapterWorkflowValidationResult {
  return { ok: false, issues: [issue(code, path)] }
}

function dedupe(
  issues: readonly LivingFrameIpAdapterWorkflowIssue[],
): readonly LivingFrameIpAdapterWorkflowIssue[] {
  return [...new Map(
    issues.map((entry) => [`${entry.code}:${entry.path}`, entry]),
  ).values()]
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
