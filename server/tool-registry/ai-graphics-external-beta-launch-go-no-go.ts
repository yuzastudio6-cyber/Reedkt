import {
  AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GAP_REPORT_DECISION,
  buildAiGraphicsExternalBetaLaunchGapReport,
  type AiGraphicsExternalBetaLaunchGapReport,
} from './ai-graphics-external-beta-launch-gap-report'
import {
  AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_ADMISSION_BUNDLE_DECISION,
  type AiGraphicsExternalBetaEvidenceAdmissionBundle,
} from './ai-graphics-external-beta-evidence-admission-bundle'
import {
  AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_PREFLIGHT_DECISION,
  type AiGraphicsExternalBetaServiceRoleQueueSmokePreflight,
} from './ai-graphics-external-beta-service-role-queue-smoke-preflight'
import {
  AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_PROOF_DECISION,
  type AiGraphicsExternalBetaServiceRoleQueueSmokeProof,
} from './ai-graphics-external-beta-service-role-queue-smoke-proof'
import {
  AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_CONTROLS_DECISION,
  acceptedAiGraphicsExternalBetaLaunchControls,
  type AiGraphicsExternalBetaLaunchControls,
} from './ai-graphics-external-beta-launch-controls'
import type { AiGraphicsExternalBetaReadinessEvidence } from './ai-graphics-external-beta-readiness-gate'

export const AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GO_NO_GO_DECISION =
  'ai_graphics_external_beta_launch_go_no_go_contract_prepared_with_runtime_blocks'

export type AiGraphicsExternalBetaLaunchGoNoGoStatus =
  | 'missing_external_beta_candidate_evidence'
  | 'missing_external_beta_service_role_queue_smoke_preflight'
  | 'missing_external_beta_service_role_queue_smoke_proof'
  | 'awaiting_external_beta_launch_go_no_go_approval'
  | 'external_beta_launch_go_no_go_approved_runtime_still_blocked'

export interface AiGraphicsExternalBetaLaunchGoNoGoInput
  extends AiGraphicsExternalBetaReadinessEvidence {
  sourceExternalBetaLaunchGapReportPacket?: AiGraphicsExternalBetaLaunchGapReport
  sourceExternalBetaEvidenceAdmissionBundlePacket?: AiGraphicsExternalBetaEvidenceAdmissionBundle
  sourceExternalBetaServiceRoleQueueSmokePreflightPacket?:
    AiGraphicsExternalBetaServiceRoleQueueSmokePreflight
  sourceExternalBetaServiceRoleQueueSmokeProofPacket?:
    AiGraphicsExternalBetaServiceRoleQueueSmokeProof
  sourceExternalBetaLaunchControlsPacket?: AiGraphicsExternalBetaLaunchControls
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
  sourceExternalBetaEvidenceAdmissionBundleDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_ADMISSION_BUNDLE_DECISION
  sourceExternalBetaServiceRoleQueueSmokePreflightDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_PREFLIGHT_DECISION
  sourceExternalBetaServiceRoleQueueSmokeProofDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_PROOF_DECISION
  sourceExternalBetaLaunchControlsDecision:
    typeof AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_CONTROLS_DECISION
  status: AiGraphicsExternalBetaLaunchGoNoGoStatus
  totalAiGraphicsTools: 21
  totalProductFacingCapabilities: 12
  gpuRuntimeTargetedTools: 8
  gpuRuntimeOnDemandOnly: true
  externalBetaLaunchCandidateToolsWithProvidedEvidence: number
  externalBetaLaunchCandidateCapabilitiesWithProvidedEvidence: number
  externalBetaLaunchGoNoGoApprovalRecordAccepted: boolean
  sourceExternalBetaLaunchGapRuntimeProofBridgeAccepted: boolean
  externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence: number
  externalBetaReadyNowTools: 0
  productionReadyNowTools: 0
  sourceLaunchGapReport: AiGraphicsExternalBetaLaunchGapReport
  sourceEvidenceAdmissionBundle: AiGraphicsExternalBetaEvidenceAdmissionBundle | null
  sourceServiceRoleQueueSmokePreflight:
    AiGraphicsExternalBetaServiceRoleQueueSmokePreflight | null
  sourceServiceRoleQueueSmokeProof: AiGraphicsExternalBetaServiceRoleQueueSmokeProof | null
  sourceLaunchControls: AiGraphicsExternalBetaLaunchControls | null
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
    sourceExternalBetaLaunchGapRuntimeProofBridgeAccepted: boolean
    sourceExternalBetaEvidenceAdmissionBundleAccepted: boolean
    sourceExternalBetaServiceRoleQueueSmokePreflightAccepted: boolean
    sourceExternalBetaServiceRoleQueueSmokeProofAccepted: boolean
    sourceExternalBetaLaunchControlsAccepted: boolean
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
  'accept service-role queue smoke preflight readiness metadata without running the smoke',
  'accept saved service-role queue smoke proof metadata without rerunning the smoke',
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

function hasPrivateEvidenceRef(value: string | undefined): boolean {
  if (!hasNonEmptyRef(value)) return false
  const normalized = value.trim().toLowerCase()
  if (
    normalized.startsWith('http://') ||
    normalized.startsWith('https://') ||
    normalized.startsWith('gs://') ||
    normalized.startsWith('s3://') ||
    normalized.includes('signed-url') ||
    normalized.includes('public-artifact') ||
    normalized.includes('/public/')
  ) {
    return false
  }
  return normalized.startsWith('private://') ||
    normalized.startsWith('backend://') ||
    normalized.startsWith('external-beta-evidence://')
}

function launchApprovalRecordAccepted(input: AiGraphicsExternalBetaLaunchGoNoGoInput): boolean {
  const sourceLaunchControlsAccepted = acceptedAiGraphicsExternalBetaLaunchControls(
    input.sourceExternalBetaLaunchControlsPacket,
  )
  return sourceLaunchControlsAccepted || (
    input.externalBetaLaunchSwitchApproved === true &&
    hasPrivateEvidenceRef(input.externalBetaLaunchRef) &&
    input.externalBetaRolloutCohortApproved === true &&
    hasPrivateEvidenceRef(input.externalBetaRolloutCohortRef) &&
    input.externalBetaCostConcurrencyCeilingApproved === true &&
    hasPrivateEvidenceRef(input.externalBetaCostConcurrencyCeilingRef) &&
    input.externalBetaRollbackIncidentRunbookApproved === true &&
    hasPrivateEvidenceRef(input.externalBetaRollbackIncidentRunbookRef) &&
    input.externalBetaPrivateArtifactRetentionSupportApproved === true &&
    hasPrivateEvidenceRef(input.externalBetaPrivateArtifactRetentionSupportRef) &&
    (input.externalBetaLaunchApproverRole ?? 'AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_OWNER') ===
      'AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_OWNER'
  )
}

function statusFromInput(input: {
  candidateSourceEvidenceAccepted: boolean
  serviceRoleQueueSmokePreflightAccepted: boolean
  serviceRoleQueueSmokeProofAccepted: boolean
  approvalRecordAccepted: boolean
}): AiGraphicsExternalBetaLaunchGoNoGoStatus {
  if (!input.candidateSourceEvidenceAccepted) return 'missing_external_beta_candidate_evidence'
  if (!input.serviceRoleQueueSmokePreflightAccepted) {
    return 'missing_external_beta_service_role_queue_smoke_preflight'
  }
  if (!input.serviceRoleQueueSmokeProofAccepted) {
    return 'missing_external_beta_service_role_queue_smoke_proof'
  }
  if (!input.approvalRecordAccepted) return 'awaiting_external_beta_launch_go_no_go_approval'
  return 'external_beta_launch_go_no_go_approved_runtime_still_blocked'
}

function launchGapCandidateAccepted(
  sourceLaunchGapReport: AiGraphicsExternalBetaLaunchGapReport,
): boolean {
  return sourceLaunchGapReport.externalBetaCandidatesWithProvidedEvidenceTools === 21 &&
    launchGapRuntimeProofBridgeAccepted(sourceLaunchGapReport) &&
    sourceLaunchGapReport.booleans.externalBetaCandidatesWithProvidedEvidence === true &&
    sourceLaunchGapReport.externalBetaReadyNowTools === 0 &&
    sourceLaunchGapReport.productionReadyNowTools === 0
}

function launchGapRuntimeProofBridgeAccepted(
  sourceLaunchGapReport: AiGraphicsExternalBetaLaunchGapReport,
): boolean {
  return sourceLaunchGapReport.runtimeProofBridge?.checkedInRuntimeProofAcceptedWithProvidedEvidenceTools === 13 &&
    sourceLaunchGapReport.runtimeProofBridge?.checkedInBlockedPendingNativeGpuRuntimeProofTools === 8 &&
    sourceLaunchGapReport.runtimeProofBridge?.readyAfterNativeGpuCollectionRuntimeProofAcceptedWithProvidedEvidenceTools === 21 &&
    sourceLaunchGapReport.runtimeProofBridge?.readyAfterNativeGpuCollectionNativeGpuRuntimeProofAcceptedWithProvidedEvidenceTools === 8 &&
    sourceLaunchGapReport.runtimeProofBridge?.readyAfterNativeGpuCollectionBlockedPendingNativeGpuRuntimeProofTools === 0 &&
    sourceLaunchGapReport.runtimeProofBridge?.sourcePacketFlag === '--external-beta-native-gpu-proof-collection-packet' &&
    sourceLaunchGapReport.runtimeProofBridge?.sourceCollectionDecision ===
      'external_beta_native_gpu_proof_collection_ready_for_owner_review_not_beta_ready' &&
    sourceLaunchGapReport.runtimeProofBridge?.perToolRecheckDecision ===
      'external_beta_per_tool_runtime_proof_ready_with_runtime_blocks' &&
    sourceLaunchGapReport.runtimeProofBridge?.gpuRuntimeShouldStartNow === false &&
    sourceLaunchGapReport.launchCohorts?.cpuStaticAndBrowserCohortTools === 13 &&
    sourceLaunchGapReport.launchCohorts?.nativeGpuModelCohortTools === 8 &&
    sourceLaunchGapReport.launchCohorts?.allToolsCandidateAfterFullEvidence === 21
}

function evidenceAdmissionBundleAccepted(
  packet: AiGraphicsExternalBetaEvidenceAdmissionBundle | undefined,
): packet is AiGraphicsExternalBetaEvidenceAdmissionBundle {
  return Boolean(
    packet &&
      packet.decision === AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_ADMISSION_BUNDLE_DECISION &&
      packet.status === 'external_beta_admission_candidate_with_provided_evidence_runtime_still_blocked' &&
      packet.technicalEvidenceSourceMode === 'source_proof_packets' &&
      packet.totalAiGraphicsTools === 21 &&
      packet.totalProductFacingCapabilities === 12 &&
      packet.externalBetaAdmissionCandidateToolsWithProvidedEvidence === 21 &&
      packet.sourceTechnicalProofPacketsRequired === true &&
      packet.sourceTechnicalProofPacketsProvided === true &&
      packet.sourceTechnicalProofPacketsAccepted === true &&
      packet.externalBetaReadyNowTools === 0 &&
      packet.productionReadyNowTools === 0 &&
      packet.booleans?.sourceTechnicalProofPacketsRequiredForAdmission === true &&
      packet.booleans?.sourceTechnicalProofPacketsProvided === true &&
      packet.booleans?.sourceTechnicalProofPacketsAcceptedForAdmission === true &&
      packet.booleans?.externalBetaAdmissionCandidateWithProvidedEvidence === true &&
      packet.booleans?.agentCanExecuteToolsNow === false &&
      packet.booleans?.routeExecutionApprovedNow === false &&
      packet.booleans?.workerExecutionApprovedNow === false &&
      packet.booleans?.gpuRuntimeApprovedNow === false &&
      packet.booleans?.externalBetaReadyNow === false &&
      packet.booleans?.productionReadyNow === false,
  )
}

function serviceRoleQueueSmokePreflightAccepted(
  packet: AiGraphicsExternalBetaServiceRoleQueueSmokePreflight | undefined,
): packet is AiGraphicsExternalBetaServiceRoleQueueSmokePreflight {
  return Boolean(
    packet &&
      packet.decision === AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_PREFLIGHT_DECISION &&
      packet.status === 'ready_to_execute_non_production_service_role_queue_smoke' &&
      packet.toolsCovered === 21 &&
      packet.productFacingCapabilitiesCovered === 12 &&
      packet.gpuRuntimeTargetedTools === 8 &&
      packet.heavyToolsIncorrectlyTargetingCpu === 0 &&
      packet.sourceRuntimeQueueServiceProofBridgeAccepted === true &&
      packet.all21PayloadsPrepared === true &&
      packet.readyToExecuteLiveNonProductionSmoke === true &&
      packet.liveServiceRoleQueueSmokeExecutedNow === false &&
      packet.liveSupabaseQueueWritesNow === 0 &&
      packet.liveWorkerClaimRowsNow === 0 &&
      packet.liveWorkerDispatchesNow === 0 &&
      packet.liveToolExecutionsNow === 0 &&
      packet.gpuRuntimeShouldStartNow === false &&
      packet.externalBetaReadyNowTools === 0 &&
      packet.productionReadyNowTools === 0 &&
      packet.booleans?.sourceRuntimeQueueServiceProofBridgeAccepted === true &&
      packet.booleans?.readyToExecuteLiveNonProductionSmoke === true &&
      packet.booleans?.serviceRoleQueueSmokeApprovedNow === false &&
      packet.booleans?.liveServiceRoleQueueSmokeExecutedNow === false &&
      packet.booleans?.agentCanExecuteToolsNow === false &&
      packet.booleans?.routeExecutionApprovedNow === false &&
      packet.booleans?.workerExecutionApprovedNow === false &&
      packet.booleans?.workerQueueApprovedNow === false &&
      packet.booleans?.gpuRuntimeApprovedNow === false &&
      packet.booleans?.gpuRuntimeShouldStartNow === false &&
      packet.booleans?.externalBetaReadyNow === false &&
      packet.booleans?.productionReadyNow === false,
  )
}

function serviceRoleQueueSmokeProofAccepted(
  packet: AiGraphicsExternalBetaServiceRoleQueueSmokeProof | undefined,
): packet is AiGraphicsExternalBetaServiceRoleQueueSmokeProof {
  return Boolean(
    packet &&
      packet.sourceDecision === AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_PROOF_DECISION &&
      packet.decision === 'external_beta_service_role_queue_smoke_proof_accepted_with_runtime_blocks' &&
      packet.sourceReadinessAccepted === true &&
      packet.proofAcceptedWithProvidedEvidence === true &&
      packet.counts?.toolsCovered === 21 &&
      packet.counts?.productFacingCapabilitiesCovered === 12 &&
      packet.counts?.gpuToolsCovered === 8 &&
      packet.counts?.heavyToolsIncorrectlyTargetingCpu === 0 &&
      packet.counts?.serviceRoleQueueSmokeProofAcceptedToolsWithProvidedEvidence === 21 &&
      packet.counts?.sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence === 21 &&
      packet.counts?.sourceLiveQueueWritesAcceptedWithProvidedEvidence === 21 &&
      packet.counts?.sourceWorkerClaimRowsAcceptedWithProvidedEvidence === 21 &&
      packet.counts?.sourceWorkerDispatchesAcceptedWithProvidedEvidence === 0 &&
      packet.counts?.sourceToolExecutionsAcceptedWithProvidedEvidence === 0 &&
      packet.counts?.cleanupPersistedRowsAfterSmoke === 0 &&
      packet.counts?.externalBetaReadyNowTools === 0 &&
      packet.counts?.productionReadyNowTools === 0 &&
      packet.evidence?.sourceServiceRoleQueueSmokeAuthorizationAcceptedWithProvidedEvidence === true &&
      hasPrivateEvidenceRef(packet.evidence?.serviceRoleQueueSmokeAuthorizationRef ?? undefined) &&
      packet.evidence?.sourceLiveServiceRoleQueueSmokeExecutedWithProvidedEvidence === true &&
      packet.policy?.noLiveSupabaseWriteByProofValidator === true &&
      packet.policy?.noWorkerDispatchByProofValidator === true &&
      packet.policy?.noToolExecutionByProofValidator === true &&
      packet.policy?.noGpuRuntimeStartByProofValidator === true &&
      packet.booleans?.serviceRoleQueueSmokeProofAcceptedWithProvidedEvidence === true &&
      packet.booleans?.sourceServiceRoleQueueSmokeAuthorizationAccepted === true &&
      packet.booleans?.sourceQueueWritesAcceptedWithProvidedEvidence === true &&
      packet.booleans?.sourceWorkerClaimsAcceptedWithProvidedEvidence === true &&
      packet.booleans?.cleanupVerifiedWithProvidedEvidence === true &&
      packet.booleans?.liveServiceRoleQueueSmokeExecutedNow === false &&
      packet.booleans?.agentCanExecuteToolsNow === false &&
      packet.booleans?.routeExecutionApprovedNow === false &&
      packet.booleans?.workerExecutionApprovedNow === false &&
      packet.booleans?.workerQueueApprovedNow === false &&
      packet.booleans?.gpuRuntimeApprovedNow === false &&
      packet.booleans?.gpuRuntimeShouldStartNow === false &&
      packet.booleans?.externalBetaReadyNow === false &&
      packet.booleans?.productionReadyNow === false,
  )
}

export function buildAiGraphicsExternalBetaLaunchGoNoGo(
  input: AiGraphicsExternalBetaLaunchGoNoGoInput = {},
): AiGraphicsExternalBetaLaunchGoNoGo {
  const sourceLaunchGapReport =
    input.sourceExternalBetaLaunchGapReportPacket ??
    buildAiGraphicsExternalBetaLaunchGapReport(input)
  const sourceEvidenceAdmissionBundle = input.sourceExternalBetaEvidenceAdmissionBundlePacket ?? null
  const sourceServiceRoleQueueSmokePreflight =
    input.sourceExternalBetaServiceRoleQueueSmokePreflightPacket ?? null
  const sourceServiceRoleQueueSmokeProof =
    input.sourceExternalBetaServiceRoleQueueSmokeProofPacket ?? null
  const sourceLaunchControls =
    input.sourceExternalBetaLaunchControlsPacket ?? null
  const sourceExternalBetaLaunchGapRuntimeProofBridgeAccepted =
    launchGapRuntimeProofBridgeAccepted(sourceLaunchGapReport)
  const sourceLaunchGapAccepted = launchGapCandidateAccepted(sourceLaunchGapReport)
  const sourceEvidenceAdmissionBundleAccepted = evidenceAdmissionBundleAccepted(
    input.sourceExternalBetaEvidenceAdmissionBundlePacket,
  )
  const sourceExternalBetaServiceRoleQueueSmokePreflightAccepted =
    serviceRoleQueueSmokePreflightAccepted(
      input.sourceExternalBetaServiceRoleQueueSmokePreflightPacket,
    )
  const sourceExternalBetaServiceRoleQueueSmokeProofAccepted =
    serviceRoleQueueSmokeProofAccepted(
      input.sourceExternalBetaServiceRoleQueueSmokeProofPacket,
    )
  const sourceExternalBetaLaunchControlsAccepted =
    acceptedAiGraphicsExternalBetaLaunchControls(input.sourceExternalBetaLaunchControlsPacket)
  const candidateSourceEvidenceAccepted =
    sourceLaunchGapAccepted || sourceEvidenceAdmissionBundleAccepted
  const candidateWithProvidedEvidence =
    candidateSourceEvidenceAccepted &&
    sourceExternalBetaServiceRoleQueueSmokePreflightAccepted &&
    sourceExternalBetaServiceRoleQueueSmokeProofAccepted
  const approvalRecordAccepted = launchApprovalRecordAccepted(input)
  const status = statusFromInput({
    candidateSourceEvidenceAccepted,
    serviceRoleQueueSmokePreflightAccepted:
      sourceExternalBetaServiceRoleQueueSmokePreflightAccepted,
    serviceRoleQueueSmokeProofAccepted:
      sourceExternalBetaServiceRoleQueueSmokeProofAccepted,
    approvalRecordAccepted,
  })
  const approvedToolsWithProvidedEvidence =
    status === 'external_beta_launch_go_no_go_approved_runtime_still_blocked' ? 21 : 0
  const missingLaunchGoNoGoEvidence = [
    !candidateSourceEvidenceAccepted ? 'all_21_external_beta_candidates_with_private_provided_evidence' : undefined,
    !sourceExternalBetaServiceRoleQueueSmokePreflightAccepted
      ? 'external_beta_service_role_queue_smoke_preflight_ready'
      : undefined,
    !sourceExternalBetaServiceRoleQueueSmokeProofAccepted
      ? 'external_beta_service_role_queue_smoke_proof_accepted'
      : undefined,
    !sourceExternalBetaLaunchControlsAccepted
      ? 'external_beta_launch_controls_packet_accepted'
      : undefined,
    !sourceExternalBetaLaunchControlsAccepted && !input.externalBetaLaunchSwitchApproved ? 'external_beta_launch_switch_approval' : undefined,
    !sourceExternalBetaLaunchControlsAccepted && !hasPrivateEvidenceRef(input.externalBetaLaunchRef) ? 'external_beta_launch_ref' : undefined,
    !sourceExternalBetaLaunchControlsAccepted && !input.externalBetaRolloutCohortApproved ? 'external_beta_rollout_cohort_approval' : undefined,
    !sourceExternalBetaLaunchControlsAccepted && !hasPrivateEvidenceRef(input.externalBetaRolloutCohortRef) ? 'external_beta_rollout_cohort_ref' : undefined,
    !sourceExternalBetaLaunchControlsAccepted && !input.externalBetaCostConcurrencyCeilingApproved ? 'external_beta_cost_concurrency_ceiling_approval' : undefined,
    !sourceExternalBetaLaunchControlsAccepted && !hasPrivateEvidenceRef(input.externalBetaCostConcurrencyCeilingRef) ? 'external_beta_cost_concurrency_ceiling_ref' : undefined,
    !sourceExternalBetaLaunchControlsAccepted && !input.externalBetaRollbackIncidentRunbookApproved ? 'external_beta_rollback_incident_runbook_approval' : undefined,
    !sourceExternalBetaLaunchControlsAccepted && !hasPrivateEvidenceRef(input.externalBetaRollbackIncidentRunbookRef) ? 'external_beta_rollback_incident_runbook_ref' : undefined,
    !sourceExternalBetaLaunchControlsAccepted && !input.externalBetaPrivateArtifactRetentionSupportApproved ? 'external_beta_private_artifact_retention_support_approval' : undefined,
    !sourceExternalBetaLaunchControlsAccepted && !hasPrivateEvidenceRef(input.externalBetaPrivateArtifactRetentionSupportRef) ? 'external_beta_private_artifact_retention_support_ref' : undefined,
    input.externalBetaLaunchApproverRole &&
      input.externalBetaLaunchApproverRole !== 'AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_OWNER'
      ? 'external_beta_launch_approver_role_must_be_AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_OWNER'
      : undefined,
  ].filter((entry): entry is string => Boolean(entry))

  return {
    decision: AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GO_NO_GO_DECISION,
    sourceExternalBetaLaunchGapDecision: AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_GAP_REPORT_DECISION,
    sourceExternalBetaEvidenceAdmissionBundleDecision:
      AI_GRAPHICS_EXTERNAL_BETA_EVIDENCE_ADMISSION_BUNDLE_DECISION,
    sourceExternalBetaServiceRoleQueueSmokePreflightDecision:
      AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_PREFLIGHT_DECISION,
    sourceExternalBetaServiceRoleQueueSmokeProofDecision:
      AI_GRAPHICS_EXTERNAL_BETA_SERVICE_ROLE_QUEUE_SMOKE_PROOF_DECISION,
    sourceExternalBetaLaunchControlsDecision:
      AI_GRAPHICS_EXTERNAL_BETA_LAUNCH_CONTROLS_DECISION,
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
    sourceExternalBetaLaunchGapRuntimeProofBridgeAccepted,
    externalBetaLaunchGoNoGoApprovedToolsWithProvidedEvidence: approvedToolsWithProvidedEvidence,
    externalBetaReadyNowTools: 0,
    productionReadyNowTools: 0,
    sourceLaunchGapReport,
    sourceEvidenceAdmissionBundle,
    sourceServiceRoleQueueSmokePreflight,
    sourceServiceRoleQueueSmokeProof,
    sourceLaunchControls,
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
      sourceExternalBetaLaunchGapAccepted: sourceLaunchGapAccepted,
      sourceExternalBetaLaunchGapRuntimeProofBridgeAccepted,
      sourceExternalBetaEvidenceAdmissionBundleAccepted:
        sourceEvidenceAdmissionBundleAccepted,
      sourceExternalBetaServiceRoleQueueSmokePreflightAccepted:
        sourceExternalBetaServiceRoleQueueSmokePreflightAccepted,
      sourceExternalBetaServiceRoleQueueSmokeProofAccepted:
        sourceExternalBetaServiceRoleQueueSmokeProofAccepted,
      sourceExternalBetaLaunchControlsAccepted:
        sourceExternalBetaLaunchControlsAccepted,
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
