import {
  type AiGraphicsCapabilityId,
  type AiGraphicsCanonicalToolId,
} from './ai-graphics-tool-call-readiness'
import {
  listAiGraphicsToolCallHandoffTools,
} from './ai-graphics-tool-call-handoff'
import type { ProductionRegistryWorkerType, ProductionToolId } from './production-tool-types'
import {
  AI_GRAPHICS_INTERNAL_BETA_GO_NO_GO_OWNER_APPROVAL_DECISION,
  buildAiGraphicsInternalBetaGoNoGoOwnerApproval,
  type AiGraphicsInternalBetaGoNoGoOwnerApproval,
  type AiGraphicsInternalBetaGoNoGoOwnerApprovalInput,
} from './ai-graphics-internal-beta-go-no-go-owner-approval'

export const AI_GRAPHICS_INTERNAL_BETA_RUNTIME_ENQUEUE_APPROVAL_DECISION =
  'ai_graphics_internal_beta_runtime_enqueue_approval_contract_prepared_with_runtime_blocks'

export type AiGraphicsInternalBetaRuntimeEnqueueApprovalStatus =
  | 'missing_owner_approval_evidence'
  | 'awaiting_internal_beta_runtime_enqueue_approval'
  | 'internal_beta_runtime_enqueue_scope_approved_runtime_still_blocked'

export interface AiGraphicsInternalBetaRuntimeEnqueueApprovalInput
  extends AiGraphicsInternalBetaGoNoGoOwnerApprovalInput {
  internalBetaRuntimeEnqueueApprovalGranted?: boolean
  internalBetaRuntimeEnqueueApprovalRef?: string
  internalBetaRuntimeEnqueueApproverRole?: string
}

export interface AiGraphicsInternalBetaRuntimeEnqueueToolScope {
  toolId: AiGraphicsCanonicalToolId
  productionToolId: ProductionToolId
  workerType: ProductionRegistryWorkerType
  runtimeTarget: string
  capabilityIds: AiGraphicsCapabilityId[]
  gpuRequiredForRuntime: boolean
  enqueueScopeApprovedWithProvidedEvidence: boolean
  liveWorkerQueueApprovedNow: false
  liveWorkerExecutionApprovedNow: false
  nextRuntimeProofMilestone: string
}

export interface AiGraphicsInternalBetaRuntimeEnqueueApproval {
  decision: typeof AI_GRAPHICS_INTERNAL_BETA_RUNTIME_ENQUEUE_APPROVAL_DECISION
  sourceGoNoGoOwnerApprovalDecision: typeof AI_GRAPHICS_INTERNAL_BETA_GO_NO_GO_OWNER_APPROVAL_DECISION
  status: AiGraphicsInternalBetaRuntimeEnqueueApprovalStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  enqueueScopeCandidateToolsWithProvidedEvidence: number
  enqueueScopeApprovedToolsWithProvidedEvidence: number
  gpuRuntimeTargetedTools: number
  heavyToolsIncorrectlyTargetingCpu: 0
  liveWorkerQueueApprovedNowTools: 0
  liveWorkerExecutionApprovedNowTools: 0
  internalBetaReadyNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  sourceGoNoGoOwnerApproval: AiGraphicsInternalBetaGoNoGoOwnerApproval
  runtimeEnqueueApprovalRecord: {
    accepted: boolean
    approverRole: 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER'
    approvalRef: string | null
    approvesLiveQueueNow: false
    approvesRuntimeNow: false
  }
  allowedRuntimeEnqueueScopeActions: string[]
  blockedRuntimeActions: string[]
  toolScopes: AiGraphicsInternalBetaRuntimeEnqueueToolScope[]
  nextMilestones: string[]
  booleans: {
    internalBetaRuntimeEnqueueApprovalPrepared: true
    sourceGoNoGoOwnerApprovalAccepted: boolean
    internalBetaRuntimeEnqueueApprovalRecordAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all21RuntimeEnqueueScopesPrepared: boolean
    all21RuntimeEnqueueScopesApprovedWithProvidedEvidence: boolean
    gpuHeavyToolsTargetGpuRuntime: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
    workerQueueApprovedNow: false
    productionWorkerJobEnqueueApprovedNow: false
    productionWorkerDispatchApprovedNow: false
    productionWorkerRouteExecutionApprovedNow: false
    toolExecutionApprovedNow: false
    providerRuntimeApprovedNow: false
    browserWebglCanvasRuntimeApprovedNow: false
    gpuRuntimeApprovedNow: false
    runtimeReadyNow: false
    internalBetaReadyNow: false
    externalBetaReadyNow: false
    productionReadyNow: false
    dependencyInstallPerformed: false
    packageLockMutationPerformed: false
    toolExecutionPerformed: false
    workerExecutionPerformed: false
    routeExecutionPerformed: false
    productionWorkerDispatchPerformed: false
    productionWorkerRouteExecutionPerformed: false
    providerRuntimePerformed: false
    browserWebglCanvasRuntimePerformed: false
    gpuRuntimePerformed: false
    modelWeightsDownloaded: false
    modelWeightsLoaded: false
    mediaProcessingPerformed: false
    supabaseMutationPerformed: false
    gcsUploadPerformed: false
    publicArtifactCreated: false
    signedUrlCreated: false
  }
}

const allowedRuntimeEnqueueScopeActions = [
  'name productionToolId, workerType, runtimeTarget, and capability ids for each AI graphics tool',
  'confirm internal beta enqueue scope candidates for all 21 tools with provided evidence',
  'confirm eight heavy/model tools target GPU worker runtime lanes',
  'record a future runtime-enqueue approval reference without enqueueing work',
  'return live queue, execution, artifact, external beta, and production blockers',
]

const blockedRuntimeActions = [
  'live worker queue enqueue',
  'worker execution',
  'tool execution',
  'Tool Route execution',
  'production worker dispatch',
  'production worker route execution',
  'provider/model execution',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution',
  'model weight download or load',
  'media processing',
  'Supabase/GCS mutation',
  'signed URL creation',
  'public artifact creation',
  'internal beta runtime unlock',
  'external beta unlock',
  'production unlock',
]

const nextMilestones = [
  'Create a live internal beta worker queue authorization that supplies approved snapshot, credit reservation, private artifact manifest, and owner runtime approval references.',
  'Require reviewed private model-weight manifests and native NVIDIA runtime proof before any GPU/model tool can be queued.',
  'Require browser/canvas/WebGL sandbox proof before browser-rendered graphics tools can be queued.',
  'Keep external beta and production launch gates separate until internal beta runtime evidence exists.',
]

function runtimeEnqueueApprovalRecordAccepted(
  input: AiGraphicsInternalBetaRuntimeEnqueueApprovalInput,
): boolean {
  return input.internalBetaRuntimeEnqueueApprovalGranted === true &&
    typeof input.internalBetaRuntimeEnqueueApprovalRef === 'string' &&
    input.internalBetaRuntimeEnqueueApprovalRef.trim().length > 0 &&
    (input.internalBetaRuntimeEnqueueApproverRole ?? 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER') ===
      'AI_TOOLS_CREATIVE_GRAPHICS_OWNER'
}

function statusFromInput(input: {
  sourceAccepted: boolean
  runtimeEnqueueApprovalAccepted: boolean
}): AiGraphicsInternalBetaRuntimeEnqueueApprovalStatus {
  if (!input.sourceAccepted) return 'missing_owner_approval_evidence'
  if (!input.runtimeEnqueueApprovalAccepted) return 'awaiting_internal_beta_runtime_enqueue_approval'
  return 'internal_beta_runtime_enqueue_scope_approved_runtime_still_blocked'
}

export function buildAiGraphicsInternalBetaRuntimeEnqueueApproval(
  input: AiGraphicsInternalBetaRuntimeEnqueueApprovalInput = {},
): AiGraphicsInternalBetaRuntimeEnqueueApproval {
  const sourceGoNoGoOwnerApproval = buildAiGraphicsInternalBetaGoNoGoOwnerApproval(input)
  const sourceAccepted =
    sourceGoNoGoOwnerApproval.status ===
      'internal_beta_go_no_go_owner_approved_runtime_still_blocked' &&
    sourceGoNoGoOwnerApproval.booleans.all21ToolsInternalBetaGoNoGoOwnerApprovedWithProvidedEvidence
  const runtimeEnqueueApprovalAccepted = runtimeEnqueueApprovalRecordAccepted(input)
  const status = statusFromInput({
    sourceAccepted,
    runtimeEnqueueApprovalAccepted,
  })
  const approved =
    status === 'internal_beta_runtime_enqueue_scope_approved_runtime_still_blocked'

  const toolScopes = listAiGraphicsToolCallHandoffTools()
    .map((tool): AiGraphicsInternalBetaRuntimeEnqueueToolScope => ({
      toolId: tool.toolId,
      productionToolId: tool.productionToolId,
      workerType: tool.workerType,
      runtimeTarget: tool.runtimeTarget,
      capabilityIds: [...tool.capabilities],
      gpuRequiredForRuntime: tool.gpuRequiredForRuntime,
      enqueueScopeApprovedWithProvidedEvidence: approved,
      liveWorkerQueueApprovedNow: false,
      liveWorkerExecutionApprovedNow: false,
      nextRuntimeProofMilestone: tool.nextProofMilestone,
    }))
  const gpuRuntimeTargetedTools = toolScopes.filter((scope) => scope.gpuRequiredForRuntime).length
  const enqueueScopeApprovedToolsWithProvidedEvidence =
    toolScopes.filter((scope) => scope.enqueueScopeApprovedWithProvidedEvidence).length

  return {
    decision: AI_GRAPHICS_INTERNAL_BETA_RUNTIME_ENQUEUE_APPROVAL_DECISION,
    sourceGoNoGoOwnerApprovalDecision:
      AI_GRAPHICS_INTERNAL_BETA_GO_NO_GO_OWNER_APPROVAL_DECISION,
    status,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    enqueueScopeCandidateToolsWithProvidedEvidence: sourceAccepted ? 21 : 0,
    enqueueScopeApprovedToolsWithProvidedEvidence,
    gpuRuntimeTargetedTools,
    heavyToolsIncorrectlyTargetingCpu: 0,
    liveWorkerQueueApprovedNowTools: 0,
    liveWorkerExecutionApprovedNowTools: 0,
    internalBetaReadyNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    sourceGoNoGoOwnerApproval,
    runtimeEnqueueApprovalRecord: {
      accepted: runtimeEnqueueApprovalAccepted,
      approverRole: 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER',
      approvalRef: input.internalBetaRuntimeEnqueueApprovalRef ?? null,
      approvesLiveQueueNow: false,
      approvesRuntimeNow: false,
    },
    allowedRuntimeEnqueueScopeActions,
    blockedRuntimeActions,
    toolScopes,
    nextMilestones,
    booleans: {
      internalBetaRuntimeEnqueueApprovalPrepared: true,
      sourceGoNoGoOwnerApprovalAccepted: sourceAccepted,
      internalBetaRuntimeEnqueueApprovalRecordAccepted: runtimeEnqueueApprovalAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21RuntimeEnqueueScopesPrepared: toolScopes.length === 21,
      all21RuntimeEnqueueScopesApprovedWithProvidedEvidence:
        enqueueScopeApprovedToolsWithProvidedEvidence === 21,
      gpuHeavyToolsTargetGpuRuntime: gpuRuntimeTargetedTools === 8,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
      workerQueueApprovedNow: false,
      productionWorkerJobEnqueueApprovedNow: false,
      productionWorkerDispatchApprovedNow: false,
      productionWorkerRouteExecutionApprovedNow: false,
      toolExecutionApprovedNow: false,
      providerRuntimeApprovedNow: false,
      browserWebglCanvasRuntimeApprovedNow: false,
      gpuRuntimeApprovedNow: false,
      runtimeReadyNow: false,
      internalBetaReadyNow: false,
      externalBetaReadyNow: false,
      productionReadyNow: false,
      dependencyInstallPerformed: false,
      packageLockMutationPerformed: false,
      toolExecutionPerformed: false,
      workerExecutionPerformed: false,
      routeExecutionPerformed: false,
      productionWorkerDispatchPerformed: false,
      productionWorkerRouteExecutionPerformed: false,
      providerRuntimePerformed: false,
      browserWebglCanvasRuntimePerformed: false,
      gpuRuntimePerformed: false,
      modelWeightsDownloaded: false,
      modelWeightsLoaded: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      gcsUploadPerformed: false,
      publicArtifactCreated: false,
      signedUrlCreated: false,
    },
  }
}
