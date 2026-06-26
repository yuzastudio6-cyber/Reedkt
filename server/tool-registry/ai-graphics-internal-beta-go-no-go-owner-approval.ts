import {
  AI_GRAPHICS_INTERNAL_BETA_GO_NO_GO_DECISION,
  buildAiGraphicsInternalBetaGoNoGo,
  type AiGraphicsInternalBetaGoNoGo,
  type AiGraphicsInternalBetaGoNoGoInput,
} from './ai-graphics-internal-beta-go-no-go'

export const AI_GRAPHICS_INTERNAL_BETA_GO_NO_GO_OWNER_APPROVAL_DECISION =
  'ai_graphics_internal_beta_go_no_go_owner_approved_with_runtime_blocks'

export type AiGraphicsInternalBetaGoNoGoOwnerApprovalStatus =
  | 'missing_technical_evidence'
  | 'awaiting_internal_beta_go_no_go_owner_approval'
  | 'internal_beta_go_no_go_owner_approved_runtime_still_blocked'

export interface AiGraphicsInternalBetaGoNoGoOwnerApprovalInput
  extends AiGraphicsInternalBetaGoNoGoInput {
  internalBetaGoNoGoOwnerApprovalGranted?: boolean
  internalBetaGoNoGoOwnerApprovalRef?: string
  internalBetaGoNoGoOwnerApproverRole?: string
}

export interface AiGraphicsInternalBetaGoNoGoOwnerApproval {
  decision: typeof AI_GRAPHICS_INTERNAL_BETA_GO_NO_GO_OWNER_APPROVAL_DECISION
  sourceInternalBetaGoNoGoDecision: typeof AI_GRAPHICS_INTERNAL_BETA_GO_NO_GO_DECISION
  status: AiGraphicsInternalBetaGoNoGoOwnerApprovalStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  ownerApprovedToolsWithProvidedEvidence: number
  ownerApprovedCapabilitiesWithProvidedEvidence: number
  internalBetaReadyNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  sourceGoNoGo: AiGraphicsInternalBetaGoNoGo
  ownerApprovalRecord: {
    accepted: boolean
    approverRole: 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER'
    approvalRef: string | null
    approvesRuntimeNow: false
  }
  approvedScope: string[]
  blockedRuntimeActions: string[]
  nextMilestones: string[]
  booleans: {
    internalBetaGoNoGoOwnerApprovalPrepared: true
    sourceInternalBetaGoNoGoAccepted: boolean
    internalBetaGoNoGoOwnerApprovalRecordAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all21ToolsInternalBetaGoNoGoOwnerApprovedWithProvidedEvidence: boolean
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

const approvedScope = [
  'owner-approve the all-21 AI graphics internal beta go/no-go evidence record',
  'confirm all 21 tools remain installed or represented for their planned ReeditPro surface',
  'confirm eight heavy/model tools remain targeted to GPU worker runtime lanes',
  'confirm duplicate production tool mappings remain absent across owner lanes',
  'authorize only a future runtime-enqueue approval packet to evaluate internal beta runtime scope',
]

const blockedRuntimeActions = [
  'agent/tool execution',
  'Tool Route execution',
  'Worker queue enqueue',
  'Worker execution',
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
  'external beta unlock',
  'production unlock',
]

const nextMilestones = [
  'Create a runtime-enqueue approval contract that consumes this owner approval and names exact internal beta worker enqueue scope.',
  'Require reviewed private model-weight manifests and native NVIDIA runtime proof before any runtime enqueue is allowed.',
  'Keep external beta and production launch gates separate until internal beta runtime evidence exists.',
]

function ownerApprovalRecordAccepted(
  input: AiGraphicsInternalBetaGoNoGoOwnerApprovalInput,
): boolean {
  return input.internalBetaGoNoGoOwnerApprovalGranted === true &&
    typeof input.internalBetaGoNoGoOwnerApprovalRef === 'string' &&
    input.internalBetaGoNoGoOwnerApprovalRef.trim().length > 0 &&
    (input.internalBetaGoNoGoOwnerApproverRole ?? 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER') ===
      'AI_TOOLS_CREATIVE_GRAPHICS_OWNER'
}

function statusFromInput(input: {
  sourceAccepted: boolean
  ownerApprovalAccepted: boolean
}): AiGraphicsInternalBetaGoNoGoOwnerApprovalStatus {
  if (!input.sourceAccepted) return 'missing_technical_evidence'
  if (!input.ownerApprovalAccepted) return 'awaiting_internal_beta_go_no_go_owner_approval'
  return 'internal_beta_go_no_go_owner_approved_runtime_still_blocked'
}

export function buildAiGraphicsInternalBetaGoNoGoOwnerApproval(
  input: AiGraphicsInternalBetaGoNoGoOwnerApprovalInput = {},
): AiGraphicsInternalBetaGoNoGoOwnerApproval {
  const ownerApprovalAccepted = ownerApprovalRecordAccepted(input)
  const sourceGoNoGo = buildAiGraphicsInternalBetaGoNoGo({
    ...input,
    internalBetaGoNoGoApproved:
      input.internalBetaGoNoGoApproved ?? input.internalBetaGoNoGoOwnerApprovalGranted,
    internalBetaGoNoGoRef:
      input.internalBetaGoNoGoRef ?? input.internalBetaGoNoGoOwnerApprovalRef,
    internalBetaGoNoGoApproverRole:
      input.internalBetaGoNoGoApproverRole ?? input.internalBetaGoNoGoOwnerApproverRole,
  })
  const sourceAccepted =
    sourceGoNoGo.status === 'internal_beta_go_no_go_approved_runtime_still_blocked' &&
    sourceGoNoGo.booleans.all21ToolsInternalBetaGoNoGoApprovedWithProvidedEvidence
  const status = statusFromInput({
    sourceAccepted,
    ownerApprovalAccepted,
  })
  const approved = status === 'internal_beta_go_no_go_owner_approved_runtime_still_blocked'

  return {
    decision: AI_GRAPHICS_INTERNAL_BETA_GO_NO_GO_OWNER_APPROVAL_DECISION,
    sourceInternalBetaGoNoGoDecision: AI_GRAPHICS_INTERNAL_BETA_GO_NO_GO_DECISION,
    status,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    ownerApprovedToolsWithProvidedEvidence: approved ? 21 : 0,
    ownerApprovedCapabilitiesWithProvidedEvidence: approved ? 12 : 0,
    internalBetaReadyNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    sourceGoNoGo,
    ownerApprovalRecord: {
      accepted: ownerApprovalAccepted,
      approverRole: 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER',
      approvalRef: input.internalBetaGoNoGoOwnerApprovalRef ?? null,
      approvesRuntimeNow: false,
    },
    approvedScope,
    blockedRuntimeActions,
    nextMilestones,
    booleans: {
      internalBetaGoNoGoOwnerApprovalPrepared: true,
      sourceInternalBetaGoNoGoAccepted: sourceAccepted,
      internalBetaGoNoGoOwnerApprovalRecordAccepted: ownerApprovalAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21ToolsInternalBetaGoNoGoOwnerApprovedWithProvidedEvidence: approved,
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
