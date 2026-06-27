import {
  AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GAP_REPORT_DECISION,
  buildAiGraphicsExternalBetaLaunchGapReport,
  type AiGraphicsExternalBetaLaunchGapReport,
} from './ai-graphics-external-beta-launch-gap-report'
import type { AiGraphicsExternalBetaReadinessEvidence } from './ai-graphics-external-beta-readiness-gate'

export const AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GO_NO_GO_DECISION =
  'ai_graphics_external_beta_launch_go_no_go_contract_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaLaunchGoNoGoStatus =
  | 'missing_external_beta_candidate_evidence'
  | 'awaiting_external_beta_launch_go_no_go_approval'
  | 'external_beta_launch_go_no_go_approved_runtime_still_blocked'

export interface AiGraphicsExternalBetaLaunchGoNoGoInput
  extends AiGraphicsExternalBetaReadinessEvidence {
  sourceExternalBetaLaunchGapReportPacket?: AiGraphicsExternalBetaLaunchGapReport
  externalBetaLaunchSwitchApproved?: boolean
  externalBetaLaunchRef?: string
  externalBetaRolloutCohortApproved?: boolean
  externalBetaRolloutCohortRef?: string
  externalBetaCostConcurrencyCeilingApproved?: boolean
  externalBetaCostConcurrencyCeilingRef?: string
  externalBetaRollbackIncidentRunbookApproved?: boolean
  externalBetaRollbackIncidentRunbookRef?: string
  externalBetaPrivateArtifactRetentionSupportApproved?: boolean
  externalBetaPrivateArtifactRetentionSupportRef?: string
  externalBetaLaunchApproverRole?: string
}

export interface AiGraphicsExternalBetaLaunchGoNoGo {
  decision: typeof AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GO_NO_GO_DECISION
  sourceExternalBetaLaunchGapDecision: typeof AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GAP_REPORT_DECISION
  status: AiGraphicsExternalBetaLaunchGoNoGoStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  gpuRuntimeOnDemandOnly: true
  externalBetaLaunchCandidateToolsWithProvidedEvidence: number
  externalBetaLaunchCandidateCapabilitiesWithProvidedEvidence: number
  externalBetaLaunchGoNoGoApprovalRecordAccepted: boolean
  externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence: number
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  sourceLaunchGapReport: AiGraphicsExternalBetaLaunchGapReport
  requiredLaunchApprovalRecord: {
    required: true
    approverRole: 'AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_OWNER'
    launchRefRequired: true
    rolloutCohortRefRequired: true
    costConcurrencyCeilingRefRequired: true
    rollbackIncidentRunbookRefRequired: true
    privateArtifactRetentionSupportRefRequired: true
    approvesRuntimeNow: false
  }
  allowedLaunchGoNoGoActions: string[]
  blockedRuntimeActions: string[]
  missingLaunchGoNoGoEvidence: string[]
  nextMilestones: string[]
  booleans: {
    externalBetaLaunchGoNoGoContractPrepared: true
    sourceExternalBetaLaunchGapAccepted: boolean
    externalBetaLaunchCandidateWithProvidedEvidence: boolean
    externalBetaLaunchGoNoGoApprovalRecordAccepted: boolean
    all21ToolsCovered: true
    all12CapabilitiesCovered: true
    all8GpuToolsTargetGpuRuntime: true
    gpuRuntimeOnDemandOnly: true
    all21ToolsExternalBetaLaunchGoNoGoApprovedWithProvidedEvidence: boolean
    agentCanSelectForPlanning: true
    agentCanExecuteToolsNow: false
    routeExecutionApprovedNow: false
    workerExecutionApprovedNow: false
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

const allowedLaunchGoNoGoActions = [
  'accept all-21 install, mapping, private evidence, and external-beta readiness evidence',
  'record external beta launch switch approval metadata',
  'record external beta rollout cohort approval metadata',
  'record external beta cost and concurrency ceiling approval metadata',
  'record rollback and incident-response runbook approval metadata',
  'record private artifact retention and support ownership approval metadata',
  'return explicit runtime, Tool Route, Worker, GPU, storage, public artifact, and production blockers',
]

const blockedRuntimeActions = [
  'agent/tool execution',
  'Tool Route execution',
  'Worker queue enqueue',
  'Worker execution',
  'provider/model execution',
  'browser/WebGL/canvas runtime execution',
  'GPU/model runtime execution',
  'model weight download or load',
  'media processing',
  'Supabase/GCS mutation',
  'signed URL creation',
  'public artifact creation',
  'external beta user traffic enablement',
  'production unlock',
]

const nextMilestones = [
  'Create an external-beta runtime-admission lane that consumes this go/no-go record and still requires explicit feature-flag scope.',
  'Wire approved tool calls only through backend Tool Route and Worker gates with approved plan snapshot and credit reservation evidence.',
  'Keep GPU workers on-demand only: start GPU runtime only for accepted GPU/model tool jobs, then release it after the job completes.',
  'Add production launch approval only after external-beta runtime soak, support, incident, and cost evidence exists.',
]

function hasNonEmptyRef(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function launchApprovalRecordAccepted(input: AiGraphicsExternalBetaLaunchGoNoGoInput): boolean {
  return input.externalBetaLaunchSwitchApproved === true &&
    hasNonEmptyRef(input.externalBetaLaunchRef) &&
    input.externalBetaRolloutCohortApproved === true &&
    hasNonEmptyRef(input.externalBetaRolloutCohortRef) &&
    input.externalBetaCostConcurrencyCeilingApproved === true &&
    hasNonEmptyRef(input.externalBetaCostConcurrencyCeilingRef) &&
    input.externalBetaRollbackIncidentRunbookApproved === true &&
    hasNonEmptyRef(input.externalBetaRollbackIncidentRunbookRef) &&
    input.externalBetaPrivateArtifactRetentionSupportApproved === true &&
    hasNonEmptyRef(input.externalBetaPrivateArtifactRetentionSupportRef) &&
    (input.externalBetaLaunchApproverRole ?? 'AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_OWNER') ===
      'AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_OWNER'
}

function statusFromInput(input: {
  candidateWithProvidedEvidence: boolean
  approvalRecordAccepted: boolean
}): AiGraphicsExternalBetaLaunchGoNoGoStatus {
  if (!input.candidateWithProvidedEvidence) return 'missing_external_beta_candidate_evidence'
  if (!input.approvalRecordAccepted) return 'awaiting_external_beta_launch_go_no_go_approval'
  return 'external_beta_launch_go_no_go_approved_runtime_still_blocked'
}

export function buildAiGraphicsExternalBetaLaunchGoNoGo(
  input: AiGraphicsExternalBetaLaunchGoNoGoInput = {},
): AiGraphicsExternalBetaLaunchGoNoGo {
  const sourceLaunchGapReport =
    input.sourceExternalBetaLaunchGapReportPacket ??
    buildAiGraphicsExternalBetaLaunchGapReport(input)
  const candidateWithProvidedEvidence =
    sourceLaunchGapReport.externalBetaCandidatesWithProvidedEvidenceTools === 21 &&
    sourceLaunchGapReport.booleans.externalBetaCandidatesWithProvidedEvidence === true &&
    sourceLaunchGapReport.externalBetaReadyNowTools === 0 &&
    sourceLaunchGapReport.productionReadyNowTools === 0
  const approvalRecordAccepted = launchApprovalRecordAccepted(input)
  const status = statusFromInput({
    candidateWithProvidedEvidence,
    approvalRecordAccepted,
  })
  const approvedToolsWithProvidedEvidence =
    status === 'external_beta_launch_go_no_go_approved_runtime_still_blocked' ? 21 : 0
  const missingLaunchGoNoGoEvidence = [
    !candidateWithProvidedEvidence ? 'all_21_external_beta_candidates_with_private_provided_evidence' : undefined,
    !input.externalBetaLaunchSwitchApproved ? 'external_beta_launch_switch_approval' : undefined,
    !hasNonEmptyRef(input.externalBetaLaunchRef) ? 'external_beta_launch_ref' : undefined,
    !input.externalBetaRolloutCohortApproved ? 'external_beta_rollout_cohort_approval' : undefined,
    !hasNonEmptyRef(input.externalBetaRolloutCohortRef) ? 'external_beta_rollout_cohort_ref' : undefined,
    !input.externalBetaCostConcurrencyCeilingApproved ? 'external_beta_cost_concurrency_ceiling_approval' : undefined,
    !hasNonEmptyRef(input.externalBetaCostConcurrencyCeilingRef) ? 'external_beta_cost_concurrency_ceiling_ref' : undefined,
    !input.externalBetaRollbackIncidentRunbookApproved ? 'external_beta_rollback_incident_runbook_approval' : undefined,
    !hasNonEmptyRef(input.externalBetaRollbackIncidentRunbookRef) ? 'external_beta_rollback_incident_runbook_ref' : undefined,
    !input.externalBetaPrivateArtifactRetentionSupportApproved ? 'external_beta_private_artifact_retention_support_approval' : undefined,
    !hasNonEmptyRef(input.externalBetaPrivateArtifactRetentionSupportRef) ? 'external_beta_private_artifact_retention_support_ref' : undefined,
    input.externalBetaLaunchApproverRole &&
      input.externalBetaLaunchApproverRole !== 'AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_OWNER'
      ? 'external_beta_launch_approver_role_must_be_AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_OWNER'
      : undefined,
  ].filter((entry): entry is string => Boolean(entry))

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GO_NO_GO_DECISION,
    sourceExternalBetaLaunchGapDecision: AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GAP_REPORT_DECISION,
    status,
    totalAiGraphicsTools: 21,
    totalProductFacingCapabilities: 12,
    gpuRuntimeTargetedTools: 8,
    gpuRuntimeOnDemandOnly: true,
    externalBetaLaunchCandidateToolsWithProvidedEvidence:
      candidateWithProvidedEvidence ? 21 : 0,
    externalBetaLaunchCandidateCapabilitiesWithProvidedEvidence:
      candidateWithProvidedEvidence ? 12 : 0,
    externalBetaLaunchGoNoGoApprovalRecordAccepted: approvalRecordAccepted,
    externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence: approvedToolsWithProvidedEvidence,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    sourceLaunchGapReport,
    requiredLaunchApprovalRecord: {
      required: true,
      approverRole: 'AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_OWNER',
      launchRefRequired: true,
      rolloutCohortRefRequired: true,
      costConcurrencyCeilingRefRequired: true,
      rollbackIncidentRunbookRefRequired: true,
      privateArtifactRetentionSupportRefRequired: true,
      approvesRuntimeNow: false,
    },
    allowedLaunchGoNoGoActions,
    blockedRuntimeActions,
    missingLaunchGoNoGoEvidence,
    nextMilestones,
    booleans: {
      externalBetaLaunchGoNoGoContractPrepared: true,
      sourceExternalBetaLaunchGapAccepted: candidateWithProvidedEvidence,
      externalBetaLaunchCandidateWithProvidedEvidence: candidateWithProvidedEvidence,
      externalBetaLaunchGoNoGoApprovalRecordAccepted: approvalRecordAccepted,
      all21ToolsCovered: true,
      all12CapabilitiesCovered: true,
      all8GpuToolsTargetGpuRuntime: true,
      gpuRuntimeOnDemandOnly: true,
      all21ToolsExternalBetaLaunchGoNoGoApprovedWithProvidedEvidence:
        approvedToolsWithProvidedEvidence === 21,
      agentCanSelectForPlanning: true,
      agentCanExecuteToolsNow: false,
      routeExecutionApprovedNow: false,
      workerExecutionApprovedNow: false,
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
