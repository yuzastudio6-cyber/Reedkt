export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_PACKET =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-BRIDGE-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_DECISION =
  'completed_gstreamer_mkvtoolnix_agent_execution_bridge_ready_for_confirmation_gated_bridge_dry_run' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_EXECUTION =
  'completed_backend_source_agent_execution_bridge_no_route_worker_dispatch_or_tool_execution' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_READY_STATUS =
  'ready_for_confirmation_gated_agent_execution_bridge_dry_run' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_NEXT_MILESTONE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-BRIDGE-DRY-RUN-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_DRY_RUN' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_RUNTIME_EXECUTION_RUN_ID =
  '2026-06-30T16-19-10-513Z-a91246d2' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_RUNTIME_EXECUTION_MERGE_SHA =
  '4dec43f1edce87531eee61a7704b58545afd50b9' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_ALLOWED_AGENT_COMMAND_TEMPLATES = [
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
] as const

export type GstreamerMkvtoolnixAgentExecutionBridgeCommandTemplateId =
  (typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_ALLOWED_AGENT_COMMAND_TEMPLATES)[number]

export type GstreamerMkvtoolnixAgentExecutionBridgeStatus =
  | typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_READY_STATUS
  | 'blocked_missing_agent_execution_bridge_reference'
  | 'blocked_invalid_agent_execution_bridge_state'
  | 'blocked_unapproved_command_template'
  | 'blocked_unsupported_external_agent_input'
  | 'blocked_unsafe_agent_execution_bridge_request'

export interface GstreamerMkvtoolnixAgentExecutionBridgeInput {
  workspaceId?: string | null
  projectId?: string | null
  editSessionId?: string | null
  approvedSnapshotId?: string | null
  approvedSnapshotStatus?: 'approved' | 'draft' | 'superseded' | 'rejected' | null
  approvalRecordId?: string | null
  approvalRecordStatus?: 'approved' | 'pending' | 'revoked' | null
  creditPolicyRef?: string | null
  creditPolicyMode?: 'no_spend_fixture_policy' | 'credit_reservation' | null
  creditPolicyStatus?: 'approved' | 'reserved' | 'pending' | 'spent' | 'released' | 'refunded' | null
  jobId?: string | null
  jobStatus?: 'queued' | 'leased' | 'planned' | 'running' | 'completed' | 'failed' | null
  workerLeaseId?: string | null
  workerLeaseStatus?: 'claimed' | 'disabled' | 'planned' | 'expired' | 'released' | null
  routeIdempotencyKey?: string | null
  commandTemplateId?: GstreamerMkvtoolnixAgentExecutionBridgeCommandTemplateId | string | null
  privateInputManifestId?: string | null
  privateInputManifestSha256?: string | null
  privateInputManifestStatus?: 'approved' | 'approved_fixture_reference' | 'missing' | 'public' | null
  outputManifestSchemaId?: string | null
  qaReportSchemaId?: string | null
  cleanupPolicyId?: string | null
  retentionPolicyId?: string | null
  failurePolicyId?: string | null
  auditEventParentId?: string | null
  runtimeExecutionRunId?: string | null
  runtimeExecutionDecision?: string | null
  runtimeExecutionMergeSha?: string | null
  rawCommandString?: string | null
  rawChat?: string | null
  arbitraryFilePath?: string | null
  publicUrlSourceOfTruth?: string | null
  signedUrlSourceOfTruth?: string | null
  arbitraryPrivateMediaRef?: string | null
  ffmpegFfprobeExpansionRequested?: boolean
  routeExecutionRequestedNow?: boolean
  workerDispatchRequestedNow?: boolean
  workerExecutionRequestedNow?: boolean
  gstreamerExecutionRequestedNow?: boolean
  mkvtoolnixExecutionRequestedNow?: boolean
  dockerPushDeployRequestedNow?: boolean
  remotionRenderRequestedNow?: boolean
  supabaseMutationRequestedNow?: boolean
  sqlExecutionRequestedNow?: boolean
  signedUrlCreationRequestedNow?: boolean
  publicArtifactRequestedNow?: boolean
  finalRenderExportRequestedNow?: boolean
  externalBetaExpansionRequestedNow?: boolean
  paidProductionUnlockRequestedNow?: boolean
  productionUnlockRequestedNow?: boolean
}

export interface GstreamerMkvtoolnixAgentExecutionBridgeResult {
  packet: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_PACKET
  decision: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_DECISION
  execution: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_EXECUTION
  ok: boolean
  status: GstreamerMkvtoolnixAgentExecutionBridgeStatus
  blockers: GstreamerMkvtoolnixAgentExecutionBridgeStatus[]
  confirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_CONFIRM_ENV
  confirmationRequiredForFutureDryRun: true
  directRuntimeExecutionInThisBridge: false
  sanitizedRequest: {
    workspaceId: string
    projectId: string
    editSessionId: string
    approvedSnapshotId: string
    approvalRecordId: string
    creditPolicyRef: string
    creditPolicyMode: 'no_spend_fixture_policy' | 'credit_reservation'
    jobId: string
    jobStatus: 'queued' | 'leased' | 'planned'
    workerLeaseId: string
    workerLeaseStatus: 'claimed' | 'disabled' | 'planned'
    routeIdempotencyKey: string
    commandTemplateId: GstreamerMkvtoolnixAgentExecutionBridgeCommandTemplateId
    privateInputManifestId: string
    privateInputManifestSha256: string
    outputManifestSchemaId: string
    qaReportSchemaId: string
    cleanupPolicyId: string
    retentionPolicyId: string
    failurePolicyId: string
    auditEventParentId: string
    runtimeExecutionRunId: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_RUNTIME_EXECUTION_RUN_ID
    runtimeExecutionMergeSha: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_RUNTIME_EXECUTION_MERGE_SHA
  }
  safety: {
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    gstreamerExecutionInThisBridge: false
    mkvtoolnixExecutionInThisBridge: false
    privateMediaProcessing: false
    userMediaProcessing: false
    ffmpegFfprobeExecution: false
    dockerPushDeploy: false
    remotionExecution: false
    supabaseMutation: false
    sqlExecution: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
    externalBetaExpansion: false
    paidProductionUnlock: false
    productionUnlock: false
  }
  nextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_NEXT_MILESTONE
}

const REQUIRED_REF_FIELDS = [
  'workspaceId',
  'projectId',
  'editSessionId',
  'approvedSnapshotId',
  'approvalRecordId',
  'creditPolicyRef',
  'jobId',
  'workerLeaseId',
  'routeIdempotencyKey',
  'privateInputManifestId',
  'privateInputManifestSha256',
  'outputManifestSchemaId',
  'qaReportSchemaId',
  'cleanupPolicyId',
  'retentionPolicyId',
  'failurePolicyId',
  'auditEventParentId',
] as const

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function isBlank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function isAllowedTemplate(
  value: unknown,
): value is GstreamerMkvtoolnixAgentExecutionBridgeCommandTemplateId {
  return (
    typeof value === 'string' &&
    RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_ALLOWED_AGENT_COMMAND_TEMPLATES.includes(
      value as GstreamerMkvtoolnixAgentExecutionBridgeCommandTemplateId,
    )
  )
}

function hasUnsafeRequest(input: GstreamerMkvtoolnixAgentExecutionBridgeInput): boolean {
  return [
    input.ffmpegFfprobeExpansionRequested,
    input.routeExecutionRequestedNow,
    input.workerDispatchRequestedNow,
    input.workerExecutionRequestedNow,
    input.gstreamerExecutionRequestedNow,
    input.mkvtoolnixExecutionRequestedNow,
    input.dockerPushDeployRequestedNow,
    input.remotionRenderRequestedNow,
    input.supabaseMutationRequestedNow,
    input.sqlExecutionRequestedNow,
    input.signedUrlCreationRequestedNow,
    input.publicArtifactRequestedNow,
    input.finalRenderExportRequestedNow,
    input.externalBetaExpansionRequestedNow,
    input.paidProductionUnlockRequestedNow,
    input.productionUnlockRequestedNow,
  ].some(Boolean)
}

function hasUnsupportedExternalAgentInput(input: GstreamerMkvtoolnixAgentExecutionBridgeInput): boolean {
  return [
    input.rawCommandString,
    input.rawChat,
    input.arbitraryFilePath,
    input.publicUrlSourceOfTruth,
    input.signedUrlSourceOfTruth,
    input.arbitraryPrivateMediaRef,
  ].some((value) => typeof value === 'string' && value.trim().length > 0)
}

export function buildGstreamerMkvtoolnixAgentExecutionBridgeInput(
  overrides: Partial<GstreamerMkvtoolnixAgentExecutionBridgeInput> = {},
): GstreamerMkvtoolnixAgentExecutionBridgeInput {
  return {
    workspaceId: 'workspace-gstreamer-mkvtoolnix-agent-bridge',
    projectId: 'project-gstreamer-mkvtoolnix-agent-bridge',
    editSessionId: 'edit-session-gstreamer-mkvtoolnix-agent-bridge',
    approvedSnapshotId: 'approved-snapshot-gstreamer-mkvtoolnix-agent-bridge',
    approvedSnapshotStatus: 'approved',
    approvalRecordId: 'approval-record-gstreamer-mkvtoolnix-agent-bridge',
    approvalRecordStatus: 'approved',
    creditPolicyRef: 'no-spend-fixture-policy-gstreamer-mkvtoolnix-agent-bridge',
    creditPolicyMode: 'no_spend_fixture_policy',
    creditPolicyStatus: 'approved',
    jobId: 'job-gstreamer-mkvtoolnix-agent-bridge',
    jobStatus: 'queued',
    workerLeaseId: 'worker-lease-gstreamer-mkvtoolnix-agent-bridge',
    workerLeaseStatus: 'claimed',
    routeIdempotencyKey: 'gstreamer-mkvtoolnix:workspace:project:snapshot:job:template',
    commandTemplateId: 'gst_controlled_generated_fixture_pipeline_v1',
    privateInputManifestId: 'private-input-manifest-gstreamer-mkvtoolnix-agent-bridge',
    privateInputManifestSha256: '4d25de887e43dec0f54b27f71d8c670d430088d8883fa4cc0b103d15dfdef357',
    privateInputManifestStatus: 'approved_fixture_reference',
    outputManifestSchemaId: 'output-manifest-schema-gstreamer-mkvtoolnix-agent-bridge',
    qaReportSchemaId: 'qa-report-schema-gstreamer-mkvtoolnix-agent-bridge',
    cleanupPolicyId: 'cleanup-policy-gstreamer-mkvtoolnix-agent-bridge',
    retentionPolicyId: 'retention-policy-gstreamer-mkvtoolnix-agent-bridge',
    failurePolicyId: 'failure-policy-gstreamer-mkvtoolnix-agent-bridge',
    auditEventParentId: 'audit-parent-gstreamer-mkvtoolnix-agent-bridge',
    runtimeExecutionRunId: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_RUNTIME_EXECUTION_RUN_ID,
    runtimeExecutionDecision: 'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_controlled_generated_fixture',
    runtimeExecutionMergeSha: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_RUNTIME_EXECUTION_MERGE_SHA,
    ...overrides,
  }
}

export function validateGstreamerMkvtoolnixAgentExecutionBridgeInput(
  input: GstreamerMkvtoolnixAgentExecutionBridgeInput,
): GstreamerMkvtoolnixAgentExecutionBridgeResult {
  const blockers: GstreamerMkvtoolnixAgentExecutionBridgeStatus[] = []

  for (const field of REQUIRED_REF_FIELDS) {
    if (isBlank(input[field])) pushOnce(blockers, 'blocked_missing_agent_execution_bridge_reference')
  }

  if (input.approvedSnapshotStatus !== 'approved') {
    pushOnce(blockers, 'blocked_invalid_agent_execution_bridge_state')
  }
  if (input.approvalRecordStatus !== 'approved') {
    pushOnce(blockers, 'blocked_invalid_agent_execution_bridge_state')
  }
  if (!['approved', 'reserved'].includes(input.creditPolicyStatus ?? '')) {
    pushOnce(blockers, 'blocked_invalid_agent_execution_bridge_state')
  }
  if (!['no_spend_fixture_policy', 'credit_reservation'].includes(input.creditPolicyMode ?? '')) {
    pushOnce(blockers, 'blocked_invalid_agent_execution_bridge_state')
  }
  if (!['queued', 'leased', 'planned'].includes(input.jobStatus ?? '')) {
    pushOnce(blockers, 'blocked_invalid_agent_execution_bridge_state')
  }
  if (!['claimed', 'disabled', 'planned'].includes(input.workerLeaseStatus ?? '')) {
    pushOnce(blockers, 'blocked_invalid_agent_execution_bridge_state')
  }
  if (!['approved', 'approved_fixture_reference'].includes(input.privateInputManifestStatus ?? '')) {
    pushOnce(blockers, 'blocked_invalid_agent_execution_bridge_state')
  }
  if (input.runtimeExecutionRunId !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_RUNTIME_EXECUTION_RUN_ID) {
    pushOnce(blockers, 'blocked_invalid_agent_execution_bridge_state')
  }
  if (input.runtimeExecutionMergeSha !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_RUNTIME_EXECUTION_MERGE_SHA) {
    pushOnce(blockers, 'blocked_invalid_agent_execution_bridge_state')
  }
  if (
    input.runtimeExecutionDecision !==
    'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_controlled_generated_fixture'
  ) {
    pushOnce(blockers, 'blocked_invalid_agent_execution_bridge_state')
  }
  if (!isAllowedTemplate(input.commandTemplateId)) {
    pushOnce(blockers, 'blocked_unapproved_command_template')
  }
  if (hasUnsupportedExternalAgentInput(input)) {
    pushOnce(blockers, 'blocked_unsupported_external_agent_input')
  }
  if (hasUnsafeRequest(input)) {
    pushOnce(blockers, 'blocked_unsafe_agent_execution_bridge_request')
  }

  const commandTemplateId = isAllowedTemplate(input.commandTemplateId)
    ? input.commandTemplateId
    : 'gst_controlled_generated_fixture_pipeline_v1'
  const ok = blockers.length === 0

  return {
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_PACKET,
    decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_DECISION,
    execution: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_EXECUTION,
    ok,
    status: ok ? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_READY_STATUS : blockers[0],
    blockers,
    confirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_CONFIRM_ENV,
    confirmationRequiredForFutureDryRun: true,
    directRuntimeExecutionInThisBridge: false,
    sanitizedRequest: {
      workspaceId: input.workspaceId ?? '',
      projectId: input.projectId ?? '',
      editSessionId: input.editSessionId ?? '',
      approvedSnapshotId: input.approvedSnapshotId ?? '',
      approvalRecordId: input.approvalRecordId ?? '',
      creditPolicyRef: input.creditPolicyRef ?? '',
      creditPolicyMode: input.creditPolicyMode === 'credit_reservation' ? 'credit_reservation' : 'no_spend_fixture_policy',
      jobId: input.jobId ?? '',
      jobStatus: ['leased', 'planned'].includes(input.jobStatus ?? '') ? (input.jobStatus as 'leased' | 'planned') : 'queued',
      workerLeaseId: input.workerLeaseId ?? '',
      workerLeaseStatus: ['disabled', 'planned'].includes(input.workerLeaseStatus ?? '')
        ? (input.workerLeaseStatus as 'disabled' | 'planned')
        : 'claimed',
      routeIdempotencyKey: input.routeIdempotencyKey ?? '',
      commandTemplateId,
      privateInputManifestId: input.privateInputManifestId ?? '',
      privateInputManifestSha256: input.privateInputManifestSha256 ?? '',
      outputManifestSchemaId: input.outputManifestSchemaId ?? '',
      qaReportSchemaId: input.qaReportSchemaId ?? '',
      cleanupPolicyId: input.cleanupPolicyId ?? '',
      retentionPolicyId: input.retentionPolicyId ?? '',
      failurePolicyId: input.failurePolicyId ?? '',
      auditEventParentId: input.auditEventParentId ?? '',
      runtimeExecutionRunId: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_RUNTIME_EXECUTION_RUN_ID,
      runtimeExecutionMergeSha: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_RUNTIME_EXECUTION_MERGE_SHA,
    },
    safety: {
      routeExecution: false,
      workerDispatch: false,
      workerExecution: false,
      gstreamerExecutionInThisBridge: false,
      mkvtoolnixExecutionInThisBridge: false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      ffmpegFfprobeExecution: false,
      dockerPushDeploy: false,
      remotionExecution: false,
      supabaseMutation: false,
      sqlExecution: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
      externalBetaExpansion: false,
      paidProductionUnlock: false,
      productionUnlock: false,
    },
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_NEXT_MILESTONE,
  }
}

export function summarizeGstreamerMkvtoolnixAgentExecutionBridgeBoundary(): string[] {
  return [
    'External agents may submit only structured approved-snapshot, approval, credit/no-spend, job, lease, idempotency, command-template, manifest, QA, cleanup, retention, failure, and audit references.',
    'The bridge rejects raw commands, raw chat, arbitrary file paths, public URL source-of-truth, signed URL source-of-truth, arbitrary private media, FFmpeg/FFprobe expansion, Docker push/deploy, Remotion rendering, Supabase mutation, SQL, public artifacts, final render/export, broad external beta expansion, paid production, and production unlock requests.',
    'This packet validates source contracts only. Route execution, worker dispatch, worker execution, GStreamer execution, MKVToolNix execution, Docker execution, and media processing remain disabled until a separate confirmation-gated bridge dry run.',
  ]
}
