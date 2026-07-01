export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_PACKET =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-BRIDGE-IMPLEMENTATION-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_DECISION =
  'completed_gstreamer_mkvtoolnix_narrow_external_agent_runtime_bridge_implementation_ready_for_qa_rollup' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_EXECUTION =
  'completed_backend_source_narrow_external_agent_runtime_bridge_validation_no_route_worker_tool_or_media_execution' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_READY_STATUS =
  'ready_for_narrow_external_agent_runtime_bridge_qa_rollup' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_NEXT_MILESTONE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-BRIDGE-QA-ROLLUP-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_DRY_RUN_RUN_ID =
  '2026-07-01T07-13-36-296Z-7ebd9826' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_DRY_RUN_MERGE_SHA =
  'aa2a51681c161f3005d5fc1de06370b4f7ed7bb3' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_HANDOFF_MERGE_SHA =
  '8e93c0275e25ba703ddfa7c63c9a6f0403a2ffe7' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_ALLOWED_COMMAND_TEMPLATES =
  [
    'gst_fakesrc_fakesink_no_media_healthcheck_v1',
    'gst_controlled_generated_fixture_pipeline_v1',
    'mkvmerge_generated_subtitle_only_package_v1',
    'mkvmerge_identify_generated_subtitle_only_v1',
  ] as const

export type GstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeCommandTemplateId =
  (typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_ALLOWED_COMMAND_TEMPLATES)[number]

export type GstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeStatus =
  | typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_READY_STATUS
  | 'blocked_missing_narrow_external_agent_runtime_bridge_reference'
  | 'blocked_invalid_narrow_external_agent_runtime_bridge_state'
  | 'blocked_unapproved_narrow_external_agent_runtime_command_template'
  | 'blocked_unsupported_narrow_external_agent_runtime_input'
  | 'blocked_unsafe_narrow_external_agent_runtime_bridge_request'
  | 'blocked_narrow_external_agent_runtime_source_evidence_mismatch'

export interface GstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput {
  externalAgentRequestId?: string | null
  externalAgentHandoffId?: string | null
  dryRunRunId?: string | null
  dryRunDecision?: string | null
  dryRunExecution?: string | null
  dryRunMergeSha?: string | null
  handoffMergeSha?: string | null
  handoffDecision?: string | null
  approvedSnapshotId?: string | null
  approvalRecordId?: string | null
  creditPolicyId?: string | null
  jobId?: string | null
  workerLeaseId?: string | null
  localMockQueueItem?: string | null
  runtimePacketId?: string | null
  runtimeExecutionId?: string | null
  idempotencyKey?: string | null
  privateInputManifestSha256?: string | null
  outputManifestSchemaId?: string | null
  qaReportSchemaId?: string | null
  cleanupPolicyId?: string | null
  retentionPolicyId?: string | null
  failurePolicyId?: string | null
  auditEventParentId?: string | null
  dockerImageTag?: string | null
  dockerNetwork?: 'none' | string | null
  commandTemplateId?: GstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeCommandTemplateId | string | null
  allowedCommandTemplates?: readonly string[] | null
  rawCommand?: string | null
  command?: string | null
  args?: readonly string[] | null
  rawChat?: string | null
  arbitraryFilePath?: string | null
  privateMediaPath?: string | null
  userMediaPath?: string | null
  publicUrl?: string | null
  signedUrl?: string | null
  routeExecutionRequest?: boolean
  workerDispatchRequest?: boolean
  workerExecutionRequest?: boolean
  workerProcessStartRequest?: boolean
  workerLeaseClaimRequest?: boolean
  persistentQueueWriteRequest?: boolean
  gstreamerExecutionRequest?: boolean
  mkvtoolnixExecutionRequest?: boolean
  dockerExecutionRequest?: boolean
  dockerPushDeployRequest?: boolean
  ffmpegFfprobeExecutionRequest?: boolean
  remotionExecutionRequest?: boolean
  mediaProcessingRequest?: boolean
  supabaseMutationRequest?: boolean
  sqlExecutionRequest?: boolean
  signedUrlCreationRequest?: boolean
  publicArtifactCreationRequest?: boolean
  finalRenderExportRequest?: boolean
  broadExternalBetaUnlockRequest?: boolean
  paidProductionUnlockRequest?: boolean
  productionUnlockRequest?: boolean
}

export interface GstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeResult {
  packet: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_PACKET
  decision: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_DECISION
  execution: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_EXECUTION
  ok: boolean
  status: GstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeStatus
  blockers: GstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeStatus[]
  validationMode: 'backend_source_reference_validation_only'
  sanitizedBridge: {
    externalAgentRequestId: string
    externalAgentHandoffId: string
    dryRunRunId: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_DRY_RUN_RUN_ID
    dryRunMergeSha: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_DRY_RUN_MERGE_SHA
    handoffMergeSha: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_HANDOFF_MERGE_SHA
    approvedSnapshotId: string
    approvalRecordId: string
    creditPolicyId: string
    jobId: string
    workerLeaseId: string
    localMockQueueItem: string
    runtimePacketId: string
    runtimeExecutionId: string
    idempotencyKey: string
    privateInputManifestSha256: string
    outputManifestSchemaId: string
    qaReportSchemaId: string
    cleanupPolicyId: string
    retentionPolicyId: string
    failurePolicyId: string
    auditEventParentId: string
    dockerImageTag: string
    dockerNetwork: 'none'
    commandTemplateId: GstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeCommandTemplateId
    allowedCommandTemplates: readonly GstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeCommandTemplateId[]
    bridgeAccepted: boolean
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
    mediaProcessing: false
    finalRenderExport: false
  }
  safety: {
    liveHttpRouteExecution: false
    externalAgentRuntimeExecution: false
    realWorkerDispatch: false
    workerProcessStarted: false
    workerExecution: false
    workerLeaseClaim: false
    persistentJobQueueWrite: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
    dockerExecution: false
    ffmpegFfprobeExecution: false
    remotionExecution: false
    privateMediaProcessing: false
    userMediaProcessing: false
    supabaseMutation: false
    sqlExecution: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
    broadExternalBetaUnlock: false
    paidProductionUnlock: false
    productionUnlock: false
  }
  productReadyEndToEndLocalOssTools: 0
  nextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_NEXT_MILESTONE
}

const EXPECTED = {
  externalAgentHandoffId: 'external-agent-handoff-gstreamer-mkvtoolnix-narrow-runtime-1',
  dryRunRunId: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_DRY_RUN_RUN_ID,
  dryRunDecision: 'completed_gstreamer_mkvtoolnix_narrow_external_agent_runtime_dry_run_reference_validation_only',
  dryRunExecution: 'completed_confirmation_gated_narrow_external_agent_runtime_dry_run_no_route_worker_tool_or_media_execution',
  dryRunMergeSha: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_DRY_RUN_MERGE_SHA,
  handoffMergeSha: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_HANDOFF_MERGE_SHA,
  handoffDecision: 'completed_gstreamer_mkvtoolnix_narrow_external_agent_runtime_handoff_contract_ready_for_confirmation_gated_dry_run',
  approvedSnapshotId: 'approved-snapshot-agent-controlled-dispatch-1',
  approvalRecordId: 'approval-record-agent-controlled-dispatch-1',
  creditPolicyId: 'no-spend-fixture-policy-agent-controlled-dispatch-1',
  jobId: 'job-agent-controlled-dispatch-1',
  workerLeaseId: 'worker-lease-agent-controlled-dispatch-1',
  localMockQueueItem: 'mock-job-runtime-queue-item-0001',
  runtimePacketId: 'runtime-packet-gstreamer-mkvtoolnix-post-dispatch-worker-2',
  runtimeExecutionId: 'runtime-execution-gstreamer-mkvtoolnix-post-dispatch-worker-2',
  idempotencyKey: 'gstreamer-mkvtoolnix:narrow-external-agent-runtime-handoff-1:approved-snapshot:job:template',
  privateInputManifestSha256: '4d25de887e43dec0f54b27f71d8c670d430088d8883fa4cc0b103d15dfdef357',
  outputManifestSchemaId: 'output-manifest-schema-agent-controlled-dispatch-1',
  qaReportSchemaId: 'qa-report-schema-agent-controlled-dispatch-1',
  cleanupPolicyId: 'cleanup-policy-gstreamer-mkvtoolnix-generated-fixture-only',
  retentionPolicyId: 'retention-policy-gstreamer-mkvtoolnix-generated-fixture-only',
  failurePolicyId: 'failure-policy-gstreamer-mkvtoolnix-narrow-runtime-handoff',
  auditEventParentId: 'audit-event-parent-gstreamer-mkvtoolnix-narrow-runtime-handoff-1',
  dockerImageTag: 'reeditpro-tracka-native-container-render-tools-build-proof-3:2026-06-22T01-24-10-232Z-4e862aa8',
  dockerNetwork: 'none',
} as const

const REQUIRED_EXACT_FIELDS = Object.keys(EXPECTED) as (keyof typeof EXPECTED)[]

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function blank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function isAllowedTemplate(
  value: unknown,
): value is GstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeCommandTemplateId {
  return (
    typeof value === 'string' &&
    RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_ALLOWED_COMMAND_TEMPLATES.includes(
      value as GstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeCommandTemplateId,
    )
  )
}

function allowedTemplateListMatches(value: GstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput['allowedCommandTemplates']): boolean {
  if (!Array.isArray(value)) return false
  if (value.length !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_ALLOWED_COMMAND_TEMPLATES.length) {
    return false
  }
  return RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_ALLOWED_COMMAND_TEMPLATES.every(
    (template, index) => value[index] === template,
  )
}

function hasUnsupportedInput(input: GstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput): boolean {
  return [
    input.rawCommand,
    input.command,
    input.rawChat,
    input.arbitraryFilePath,
    input.privateMediaPath,
    input.userMediaPath,
    input.publicUrl,
    input.signedUrl,
  ].some((value) => typeof value === 'string' && value.trim().length > 0) || (Array.isArray(input.args) && input.args.length > 0)
}

function hasUnsafeRuntimeRequest(input: GstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput): boolean {
  return [
    input.routeExecutionRequest,
    input.workerDispatchRequest,
    input.workerExecutionRequest,
    input.workerProcessStartRequest,
    input.workerLeaseClaimRequest,
    input.persistentQueueWriteRequest,
    input.gstreamerExecutionRequest,
    input.mkvtoolnixExecutionRequest,
    input.dockerExecutionRequest,
    input.dockerPushDeployRequest,
    input.ffmpegFfprobeExecutionRequest,
    input.remotionExecutionRequest,
    input.mediaProcessingRequest,
    input.supabaseMutationRequest,
    input.sqlExecutionRequest,
    input.signedUrlCreationRequest,
    input.publicArtifactCreationRequest,
    input.finalRenderExportRequest,
    input.broadExternalBetaUnlockRequest,
    input.paidProductionUnlockRequest,
    input.productionUnlockRequest,
  ].some(Boolean)
}

export function buildGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput(
  overrides: Partial<GstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput> = {},
): GstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput {
  return {
    externalAgentRequestId: 'external-agent-request-gstreamer-mkvtoolnix-narrow-runtime-bridge-implementation-1',
    ...EXPECTED,
    commandTemplateId: 'gst_controlled_generated_fixture_pipeline_v1',
    allowedCommandTemplates: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_ALLOWED_COMMAND_TEMPLATES,
    ...overrides,
  }
}

export function validateGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput(
  input: GstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeInput,
): GstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeResult {
  const blockers: GstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeStatus[] = []

  if (blank(input.externalAgentRequestId)) {
    pushOnce(blockers, 'blocked_missing_narrow_external_agent_runtime_bridge_reference')
  }

  for (const field of REQUIRED_EXACT_FIELDS) {
    if (blank(input[field])) {
      pushOnce(blockers, 'blocked_missing_narrow_external_agent_runtime_bridge_reference')
    }
    if (input[field] !== EXPECTED[field]) {
      pushOnce(blockers, 'blocked_narrow_external_agent_runtime_source_evidence_mismatch')
    }
  }

  if (!allowedTemplateListMatches(input.allowedCommandTemplates)) {
    pushOnce(blockers, 'blocked_invalid_narrow_external_agent_runtime_bridge_state')
  }
  if (!isAllowedTemplate(input.commandTemplateId)) {
    pushOnce(blockers, 'blocked_unapproved_narrow_external_agent_runtime_command_template')
  }
  if (hasUnsupportedInput(input)) {
    pushOnce(blockers, 'blocked_unsupported_narrow_external_agent_runtime_input')
  }
  if (hasUnsafeRuntimeRequest(input)) {
    pushOnce(blockers, 'blocked_unsafe_narrow_external_agent_runtime_bridge_request')
  }

  const commandTemplateId = isAllowedTemplate(input.commandTemplateId)
    ? input.commandTemplateId
    : 'gst_controlled_generated_fixture_pipeline_v1'
  const ok = blockers.length === 0

  return {
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_PACKET,
    decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_DECISION,
    execution: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_EXECUTION,
    ok,
    status: ok ? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_READY_STATUS : blockers[0],
    blockers,
    validationMode: 'backend_source_reference_validation_only',
    sanitizedBridge: {
      externalAgentRequestId: input.externalAgentRequestId ?? '',
      externalAgentHandoffId: EXPECTED.externalAgentHandoffId,
      dryRunRunId: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_DRY_RUN_RUN_ID,
      dryRunMergeSha: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_DRY_RUN_MERGE_SHA,
      handoffMergeSha: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_HANDOFF_MERGE_SHA,
      approvedSnapshotId: EXPECTED.approvedSnapshotId,
      approvalRecordId: EXPECTED.approvalRecordId,
      creditPolicyId: EXPECTED.creditPolicyId,
      jobId: EXPECTED.jobId,
      workerLeaseId: EXPECTED.workerLeaseId,
      localMockQueueItem: EXPECTED.localMockQueueItem,
      runtimePacketId: EXPECTED.runtimePacketId,
      runtimeExecutionId: EXPECTED.runtimeExecutionId,
      idempotencyKey: EXPECTED.idempotencyKey,
      privateInputManifestSha256: EXPECTED.privateInputManifestSha256,
      outputManifestSchemaId: EXPECTED.outputManifestSchemaId,
      qaReportSchemaId: EXPECTED.qaReportSchemaId,
      cleanupPolicyId: EXPECTED.cleanupPolicyId,
      retentionPolicyId: EXPECTED.retentionPolicyId,
      failurePolicyId: EXPECTED.failurePolicyId,
      auditEventParentId: EXPECTED.auditEventParentId,
      dockerImageTag: EXPECTED.dockerImageTag,
      dockerNetwork: 'none',
      commandTemplateId,
      allowedCommandTemplates: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_ALLOWED_COMMAND_TEMPLATES,
      bridgeAccepted: ok,
      routeExecution: false,
      workerDispatch: false,
      workerExecution: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
      mediaProcessing: false,
      finalRenderExport: false,
    },
    safety: {
      liveHttpRouteExecution: false,
      externalAgentRuntimeExecution: false,
      realWorkerDispatch: false,
      workerProcessStarted: false,
      workerExecution: false,
      workerLeaseClaim: false,
      persistentJobQueueWrite: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
      dockerExecution: false,
      ffmpegFfprobeExecution: false,
      remotionExecution: false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      supabaseMutation: false,
      sqlExecution: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
      broadExternalBetaUnlock: false,
      paidProductionUnlock: false,
      productionUnlock: false,
    },
    productReadyEndToEndLocalOssTools: 0,
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_BRIDGE_NEXT_MILESTONE,
  }
}

export function summarizeGstreamerMkvtoolnixNarrowExternalAgentRuntimeBridgeBoundary(): string[] {
  return [
    'The narrow bridge accepts only the exact source-derived handoff and dry-run references for the approved GStreamer/MKVToolNix generated-fixture lane.',
    'The bridge validates backend-source references only; it does not execute an HTTP route, dispatch a worker, start a worker process, claim a lease, write a persistent queue, execute GStreamer, execute MKVToolNix, run Docker, process media, mutate Supabase, run SQL, create signed/public artifacts, or unlock beta/production.',
    'Raw commands, raw chat, arbitrary file paths, private/user media paths, public URLs, signed URLs, unsafe runtime requests, and unapproved command templates fail closed.',
    'The next milestone is a docs/status bridge QA rollup before any later packet can consider a guarded route or worker boundary.',
  ]
}
