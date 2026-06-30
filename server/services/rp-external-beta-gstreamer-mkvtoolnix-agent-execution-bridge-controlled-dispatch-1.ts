import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_READY_STATUS,
  buildGstreamerMkvtoolnixAgentExecutionBridgeInput,
  validateGstreamerMkvtoolnixAgentExecutionBridgeInput,
  type GstreamerMkvtoolnixAgentExecutionBridgeInput,
} from './rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1'

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_PACKET =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-BRIDGE-CONTROLLED-DISPATCH-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_DECISION =
  'completed_gstreamer_mkvtoolnix_agent_execution_bridge_controlled_dispatch_boundary' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_EXECUTION =
  'completed_confirmation_gated_agent_execution_bridge_controlled_dispatch_metadata_only_no_route_worker_or_tool_execution' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_READY_STATUS =
  'ready_for_agent_controlled_worker_queue_integration' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_NEXT_MILESTONE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-CONTROLLED-WORKER-QUEUE-INTEGRATION-1' as const

export type GstreamerMkvtoolnixAgentControlledDispatchStatus =
  | 'accepted_controlled_dispatch_metadata_only'
  | 'blocked_missing_controlled_dispatch_confirmation'
  | 'blocked_bridge_validation_failed'
  | 'blocked_missing_controlled_dispatch_reference'
  | 'blocked_invalid_controlled_dispatch_state'
  | 'blocked_controlled_dispatch_idempotency_mismatch'
  | 'blocked_runtime_execution_not_enabled'

export interface GstreamerMkvtoolnixAgentControlledDispatchInput {
  confirmation: boolean
  dispatchId?: string | null
  dispatchIdempotencyKey?: string | null
  dispatchMode?: 'metadata_only_controlled_dispatch' | 'runtime_worker_dispatch' | null
  externalAgentRequestId?: string | null
  bridgeInput: GstreamerMkvtoolnixAgentExecutionBridgeInput
  routeExecutionRequestedNow?: boolean
  workerDispatchRequestedNow?: boolean
  workerExecutionRequestedNow?: boolean
  gstreamerExecutionRequestedNow?: boolean
  mkvtoolnixExecutionRequestedNow?: boolean
  mediaProcessingRequestedNow?: boolean
  supabaseMutationRequestedNow?: boolean
  sqlExecutionRequestedNow?: boolean
  signedUrlCreationRequestedNow?: boolean
  publicArtifactRequestedNow?: boolean
  finalRenderExportRequestedNow?: boolean
  externalBetaExpansionRequestedNow?: boolean
  paidProductionUnlockRequestedNow?: boolean
  productionUnlockRequestedNow?: boolean
}

export interface GstreamerMkvtoolnixAgentControlledDispatchResult {
  packet: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_PACKET
  decision: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_DECISION
  execution: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_EXECUTION
  ok: boolean
  status: GstreamerMkvtoolnixAgentControlledDispatchStatus
  blockers: GstreamerMkvtoolnixAgentControlledDispatchStatus[]
  confirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_CONFIRM_ENV
  confirmationRequired: true
  bridgeStatus: string
  sanitizedDispatch: {
    dispatchId: string
    dispatchMode: 'metadata_only_controlled_dispatch'
    dispatchIdempotencyKey: string
    externalAgentRequestId: string
    workspaceId: string
    projectId: string
    editSessionId: string
    approvedSnapshotId: string
    approvalRecordId: string
    creditPolicyRef: string
    creditPolicyMode: 'no_spend_fixture_policy' | 'credit_reservation'
    jobId: string
    workerLeaseId: string
    routeIdempotencyKey: string
    commandTemplateId: string
    privateInputManifestId: string
    privateInputManifestSha256: string
    outputManifestSchemaId: string
    qaReportSchemaId: string
    cleanupPolicyId: string
    retentionPolicyId: string
    failurePolicyId: string
    auditEventParentId: string
    controlledDispatchAccepted: boolean
    queueIntegration: 'pending_next_milestone'
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
    mediaProcessing: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
  }
  safety: {
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    gstreamerExecutionInThisDispatch: false
    mkvtoolnixExecutionInThisDispatch: false
    mediaProcessing: false
    privateMediaProcessing: false
    userMediaProcessing: false
    ffmpegFfprobeExecution: false
    dockerExecution: false
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
  nextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_NEXT_MILESTONE
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function blank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function expectedDispatchIdempotencyKey(input: GstreamerMkvtoolnixAgentControlledDispatchInput): string {
  const bridge = validateGstreamerMkvtoolnixAgentExecutionBridgeInput(input.bridgeInput)
  return [
    'gstreamer-mkvtoolnix-agent-controlled-dispatch',
    bridge.sanitizedRequest.workspaceId,
    bridge.sanitizedRequest.projectId,
    bridge.sanitizedRequest.approvedSnapshotId,
    bridge.sanitizedRequest.jobId,
    bridge.sanitizedRequest.commandTemplateId,
    input.dispatchId ?? '',
  ].join(':')
}

function unsafeRequest(input: GstreamerMkvtoolnixAgentControlledDispatchInput): boolean {
  return [
    input.routeExecutionRequestedNow,
    input.workerDispatchRequestedNow,
    input.workerExecutionRequestedNow,
    input.gstreamerExecutionRequestedNow,
    input.mkvtoolnixExecutionRequestedNow,
    input.mediaProcessingRequestedNow,
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

export function buildGstreamerMkvtoolnixAgentControlledDispatchInput(
  overrides: Partial<GstreamerMkvtoolnixAgentControlledDispatchInput> = {},
): GstreamerMkvtoolnixAgentControlledDispatchInput {
  const dispatchId = overrides.dispatchId ?? 'dispatch-gstreamer-mkvtoolnix-agent-controlled-dispatch-1'
  const bridgeInput = overrides.bridgeInput ?? buildGstreamerMkvtoolnixAgentExecutionBridgeInput({
    workspaceId: 'workspace-agent-controlled-dispatch-1',
    projectId: 'project-agent-controlled-dispatch-1',
    editSessionId: 'edit-session-agent-controlled-dispatch-1',
    approvedSnapshotId: 'approved-snapshot-agent-controlled-dispatch-1',
    approvalRecordId: 'approval-record-agent-controlled-dispatch-1',
    creditPolicyRef: 'no-spend-fixture-policy-agent-controlled-dispatch-1',
    jobId: 'job-agent-controlled-dispatch-1',
    workerLeaseId: 'worker-lease-agent-controlled-dispatch-1',
    routeIdempotencyKey: 'gstreamer-mkvtoolnix:agent-controlled-dispatch-1:approved-snapshot:job:template',
    privateInputManifestId: 'private-input-manifest-agent-controlled-dispatch-1',
    outputManifestSchemaId: 'output-manifest-schema-agent-controlled-dispatch-1',
    qaReportSchemaId: 'qa-report-schema-agent-controlled-dispatch-1',
    cleanupPolicyId: 'cleanup-policy-agent-controlled-dispatch-1',
    retentionPolicyId: 'retention-policy-agent-controlled-dispatch-1',
    failurePolicyId: 'failure-policy-agent-controlled-dispatch-1',
    auditEventParentId: 'audit-parent-agent-controlled-dispatch-1',
  })

  const input = {
    confirmation: true,
    dispatchId,
    dispatchMode: 'metadata_only_controlled_dispatch',
    externalAgentRequestId: 'external-agent-request-gstreamer-mkvtoolnix-controlled-dispatch-1',
    bridgeInput,
    ...overrides,
  } satisfies GstreamerMkvtoolnixAgentControlledDispatchInput

  return {
    ...input,
    dispatchIdempotencyKey:
      overrides.dispatchIdempotencyKey ?? expectedDispatchIdempotencyKey(input),
  }
}

export function validateGstreamerMkvtoolnixAgentControlledDispatchInput(
  input: GstreamerMkvtoolnixAgentControlledDispatchInput,
): GstreamerMkvtoolnixAgentControlledDispatchResult {
  const blockers: GstreamerMkvtoolnixAgentControlledDispatchStatus[] = []
  const bridge = validateGstreamerMkvtoolnixAgentExecutionBridgeInput(input.bridgeInput)

  if (!input.confirmation) pushOnce(blockers, 'blocked_missing_controlled_dispatch_confirmation')
  if (!bridge.ok || bridge.status !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_READY_STATUS) {
    pushOnce(blockers, 'blocked_bridge_validation_failed')
  }
  if (blank(input.dispatchId) || blank(input.dispatchIdempotencyKey) || blank(input.externalAgentRequestId)) {
    pushOnce(blockers, 'blocked_missing_controlled_dispatch_reference')
  }
  if (input.dispatchMode !== 'metadata_only_controlled_dispatch') {
    pushOnce(blockers, 'blocked_invalid_controlled_dispatch_state')
  }
  if (!blank(input.dispatchIdempotencyKey) && input.dispatchIdempotencyKey !== expectedDispatchIdempotencyKey(input)) {
    pushOnce(blockers, 'blocked_controlled_dispatch_idempotency_mismatch')
  }
  if (unsafeRequest(input)) {
    pushOnce(blockers, 'blocked_runtime_execution_not_enabled')
  }

  const ok = blockers.length === 0
  const sanitized = bridge.sanitizedRequest

  return {
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_PACKET,
    decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_DECISION,
    execution: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_EXECUTION,
    ok,
    status: ok ? 'accepted_controlled_dispatch_metadata_only' : blockers[0] ?? 'blocked_invalid_controlled_dispatch_state',
    blockers,
    confirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_CONFIRM_ENV,
    confirmationRequired: true,
    bridgeStatus: bridge.status,
    sanitizedDispatch: {
      dispatchId: input.dispatchId ?? '',
      dispatchMode: 'metadata_only_controlled_dispatch',
      dispatchIdempotencyKey: input.dispatchIdempotencyKey ?? '',
      externalAgentRequestId: input.externalAgentRequestId ?? '',
      workspaceId: sanitized.workspaceId,
      projectId: sanitized.projectId,
      editSessionId: sanitized.editSessionId,
      approvedSnapshotId: sanitized.approvedSnapshotId,
      approvalRecordId: sanitized.approvalRecordId,
      creditPolicyRef: sanitized.creditPolicyRef,
      creditPolicyMode: sanitized.creditPolicyMode,
      jobId: sanitized.jobId,
      workerLeaseId: sanitized.workerLeaseId,
      routeIdempotencyKey: sanitized.routeIdempotencyKey,
      commandTemplateId: sanitized.commandTemplateId,
      privateInputManifestId: sanitized.privateInputManifestId,
      privateInputManifestSha256: sanitized.privateInputManifestSha256,
      outputManifestSchemaId: sanitized.outputManifestSchemaId,
      qaReportSchemaId: sanitized.qaReportSchemaId,
      cleanupPolicyId: sanitized.cleanupPolicyId,
      retentionPolicyId: sanitized.retentionPolicyId,
      failurePolicyId: sanitized.failurePolicyId,
      auditEventParentId: sanitized.auditEventParentId,
      controlledDispatchAccepted: ok,
      queueIntegration: 'pending_next_milestone',
      routeExecution: false,
      workerDispatch: false,
      workerExecution: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
      mediaProcessing: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
    },
    safety: {
      routeExecution: false,
      workerDispatch: false,
      workerExecution: false,
      gstreamerExecutionInThisDispatch: false,
      mkvtoolnixExecutionInThisDispatch: false,
      mediaProcessing: false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      ffmpegFfprobeExecution: false,
      dockerExecution: false,
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
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_NEXT_MILESTONE,
  }
}

export function summarizeGstreamerMkvtoolnixAgentControlledDispatchBoundary(): string[] {
  return [
    'Controlled dispatch accepts only bridge-validated structured refs plus a dispatch id and dispatch idempotency key.',
    'The confirmation gate is required before dispatch metadata can be accepted.',
    'This boundary does not execute a route, dispatch a worker, execute GStreamer, execute MKVToolNix, process media, create signed/public artifacts, mutate Supabase, run SQL, or unlock beta/production.',
    'The next milestone must integrate the accepted dispatch metadata with a controlled worker queue boundary before any actual worker dispatch is considered.',
  ]
}
