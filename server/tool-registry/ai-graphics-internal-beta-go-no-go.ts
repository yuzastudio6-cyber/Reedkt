import {
  AI_GRAPHICS_BETA_PRODUCTION_READINESS_ROLLUP_DECISION,
  buildAiGraphicsBetaProductionReadinessRollup,
  type AiGraphicsBetaProductionReadinessRollup,
  type AiGraphicsBetaProductionReadinessRollupInput,
} from './ai-graphics-beta-production-readiness-rollup'

export const AI_GRAPHICS_INTERNAL_BETA_GO_NO_GO_DECISION =
  'ai_graphics_internal_beta_go_no_go_contract_prepared_with_runtime_blocks'

export type AiGraphicsInternalBetaGoNoGoStatus =
  | 'missing_technical_evidence'
  | 'awaiting_internal_beta_go_no_go_approval'
  | 'internal_beta_go_no_go_approved_runtime_still_blocked'

export interface AiGraphicsInternalBetaGoNoGoInput extends AiGraphicsBetaProductionReadinessRollupInput {
  internalBetaGoNoGoApproved?: boolean
  internalBetaGoNoGoRef?: string
  internalBetaGoNoGoApproverRole?: string
}

export interface AiGraphicsInternalBetaGoNoGo {
  decision: typeof AI_GRAPHICS_INTERNAL_BETA_GO_NO_GO_DECISION
  sourceBetaProductionReadinessRollupDecision: typeof AI_GRAPHICS_BETA_PRODUCTION_READINESS_ROLLUP_DECISION
  status: AiGraphicsInternalBetaGoNoGoStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  goNoGoCandidateToolsWithProvidedEvidence: number
  goNoGoCandidateCapabilitiesWithProvidedEvidence: number
  internalBetaGoNoGoReadyWithProvidedEvidence: boolean
  internalBetaGoNoGoApprovalRecordAccepted: boolean
  internalBetaGoNoGoApprovedToolsWithProvidedEvidence: number
  internalBetaReadyNowTools: 0
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  sourceRollup: AiGraphicsBetaProductionReadinessRollup
  requiredApprovalRecord: {
    required: true
    approverRole: 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER'
    goNoGoRefRequired: true
    approvesRuntimeNow: false
  }
  allowedGoNoGoActions: string[]
  blockedRuntimeActions: string[]
  missingGoNoGoEvidence: string[]
  nextMilestones: string[]
  booleans: {
    internalBetaGoNoGoContractPrepared: true
    sourceBetaProductionReadinessRollupAccepted: boolean
    internalBetaGoNoGoReadyWithProvidedEvidence: boolean
    internalBetaGoNoGoApprovalRecordAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all21ToolsInternalBetaGoNoGoApprovedWithProvidedEvidence: boolean
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

const allowedGoNoGoActions = [
  'accept all-21 install, ranking, GPU targeting, and cross-owner coordination evidence',
  'accept all-21 production worker gate checks with provided evidence and zero hard failures',
  'record owner go/no-go approval metadata for the future internal beta runtime lane',
  'return explicit runtime, Tool Route, Worker, artifact, external beta, and production blockers',
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
  'Create a narrow runtime-enqueue approval lane that consumes this go/no-go record and names exact allowed internal beta scope.',
  'Run real native GPU proof and model-weight manifest validation with private evidence before any runtime enqueue approval.',
  'Add external beta and production launch approvals only after internal beta runtime evidence exists.',
]

function goNoGoApprovalRecordAccepted(input: AiGraphicsInternalBetaGoNoGoInput): boolean {
  return input.internalBetaGoNoGoApproved === true &&
    typeof input.internalBetaGoNoGoRef === 'string' &&
    input.internalBetaGoNoGoRef.trim().length > 0 &&
    (input.internalBetaGoNoGoApproverRole ?? 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER') ===
      'AI_TOOLS_CREATIVE_GRAPHICS_OWNER'
}

function statusFromInput(input: {
  readyWithProvidedEvidence: boolean
  approvalRecordAccepted: boolean
}): AiGraphicsInternalBetaGoNoGoStatus {
  if (!input.readyWithProvidedEvidence) return 'missing_technical_evidence'
  if (!input.approvalRecordAccepted) return 'awaiting_internal_beta_go_no_go_approval'
  return 'internal_beta_go_no_go_approved_runtime_still_blocked'
}

export function buildAiGraphicsInternalBetaGoNoGo(
  input: AiGraphicsInternalBetaGoNoGoInput = {},
): AiGraphicsInternalBetaGoNoGo {
  const sourceRollup = buildAiGraphicsBetaProductionReadinessRollup(input)
  const internalBetaGoNoGoReadyWithProvidedEvidence =
    sourceRollup.booleans.internalBetaGoNoGoReadyWithProvidedEvidence
  const approvalRecordAccepted = goNoGoApprovalRecordAccepted(input)
  const status = statusFromInput({
    readyWithProvidedEvidence: internalBetaGoNoGoReadyWithProvidedEvidence,
    approvalRecordAccepted,
  })
  const internalBetaGoNoGoApprovedToolsWithProvidedEvidence =
    status === 'internal_beta_go_no_go_approved_runtime_still_blocked' ? 21 : 0
  const missingGoNoGoEvidence = [
    !internalBetaGoNoGoReadyWithProvidedEvidence ? 'all_21_beta_production_readiness_rollup_ready_with_provided_evidence' : undefined,
    !approvalRecordAccepted ? 'internal_beta_go_no_go_approval_record' : undefined,
    !input.internalBetaGoNoGoRef ? 'internal_beta_go_no_go_ref' : undefined,
    input.internalBetaGoNoGoApproverRole &&
      input.internalBetaGoNoGoApproverRole !== 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER'
      ? 'internal_beta_go_no_go_approver_role_must_be_AI_TOOLS_CREATIVE_GRAPHICS_OWNER'
      : undefined,
  ].filter((entry): entry is string => Boolean(entry))

  return {
    decision: AI_GRAPHICS_INTERNAL_BETA_GO_NO_GO_DECISION,
    sourceBetaProductionReadinessRollupDecision:
      AI_GRAPHICS_BETA_PRODUCTION_READINESS_ROLLUP_DECISION,
    status,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    goNoGoCandidateToolsWithProvidedEvidence:
      internalBetaGoNoGoReadyWithProvidedEvidence ? 21 : 0,
    goNoGoCandidateCapabilitiesWithProvidedEvidence:
      internalBetaGoNoGoReadyWithProvidedEvidence ? 12 : 0,
    internalBetaGoNoGoReadyWithProvidedEvidence,
    internalBetaGoNoGoApprovalRecordAccepted: approvalRecordAccepted,
    internalBetaGoNoGoApprovedToolsWithProvidedEvidence,
    internalBetaReadyNowTools: 0,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    sourceRollup,
    requiredApprovalRecord: {
      required: true,
      approverRole: 'AI_TOOLS_CREATIVE_GRAPHICS_OWNER',
      goNoGoRefRequired: true,
      approvesRuntimeNow: false,
    },
    allowedGoNoGoActions,
    blockedRuntimeActions,
    missingGoNoGoEvidence,
    nextMilestones,
    booleans: {
      internalBetaGoNoGoContractPrepared: true,
      sourceBetaProductionReadinessRollupAccepted:
        internalBetaGoNoGoReadyWithProvidedEvidence,
      internalBetaGoNoGoReadyWithProvidedEvidence,
      internalBetaGoNoGoApprovalRecordAccepted: approvalRecordAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all21ToolsInternalBetaGoNoGoApprovedWithProvidedEvidence:
        internalBetaGoNoGoApprovedToolsWithProvidedEvidence === 21,
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
