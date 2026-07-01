import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_READY_STATUS,
  buildGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput,
  validateGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput,
  type GstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput,
} from './rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1'

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_PACKET =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-CONTROLLED-WORKER-RUNTIME-EXECUTION-PACKET-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_DECISION =
  'completed_gstreamer_mkvtoolnix_agent_controlled_worker_runtime_execution_packet_generated_fixture_only' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_EXECUTION =
  'completed_confirmation_gated_agent_controlled_worker_runtime_execution_packet_generated_fixture_only_no_route_or_worker_dispatch' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_READY_STATUS =
  'ready_for_agent_controlled_worker_runtime_qa_rollup' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_EXECUTION' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_NEXT_MILESTONE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-CONTROLLED-WORKER-RUNTIME-QA-ROLLUP-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_ALLOWED_TEMPLATES = [
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
] as const

type AllowedTemplate =
  typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_ALLOWED_TEMPLATES[number]

export type GstreamerMkvtoolnixAgentControlledWorkerRuntimeStatus =
  | 'completed_controlled_worker_runtime_execution_packet_generated_fixture_only'
  | 'blocked_missing_controlled_worker_runtime_execution_confirmation'
  | 'blocked_controlled_worker_dispatch_dry_run_validation_failed'
  | 'blocked_missing_controlled_worker_runtime_execution_reference'
  | 'blocked_invalid_controlled_worker_runtime_execution_state'
  | 'blocked_controlled_worker_runtime_execution_idempotency_mismatch'
  | 'blocked_guarded_runtime_execution_result_failed'
  | 'blocked_unapproved_runtime_execution_scope'
  | 'blocked_runtime_execution_not_enabled'

export interface GuardedRuntimeCommandResultSummary {
  templateId: string
  ok: boolean
  exitStatus: number | null
  mediaInput: false | 'generated_srt_fixture_only'
  mediaOutput: false | 'generated_subtitle_only_mkv_fixture'
}

export interface GuardedRuntimeExecutionSummary {
  packet: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-IMPLEMENTATION-1'
  decision: 'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_controlled_generated_fixture'
  execution: 'completed_confirmation_gated_local_render_worker_runtime_execution_generated_fixture_only'
  runId: string
  outputDir: string
  imageTag: string
  commandResults: GuardedRuntimeCommandResultSummary[]
  runtimeExecution: {
    status: 'completed_controlled_generated_fixture_runtime_execution'
    dockerNetwork: 'none'
    routeExecution: 'not_run_runtime_runner_only'
    workerDispatch: 'not_run_runtime_runner_only'
    workerExecution: 'not_run_runtime_runner_only'
    gstreamerExecution: 'completed_controlled_generated_fixture_only'
    mkvtoolnixExecution: 'completed_controlled_generated_fixture_only'
    mediaProcessing: 'controlled_generated_fixture_only'
    privateMediaProcessing: false
    userMediaProcessing: false
  }
  safety: Record<string, unknown>
  productReadyEndToEndLocalOssTools: 0
  packageLock: 'unchanged'
  generatedArtifactsCommitted: 'none'
  validation: 'passed'
}

export interface GstreamerMkvtoolnixAgentControlledWorkerRuntimeInput {
  confirmation: boolean
  controlledWorkerDispatchDryRunInput: GstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput
  runtimePacketId?: string | null
  runtimeExecutionId?: string | null
  runtimeExecutionIdempotencyKey?: string | null
  runtimeExecutionMode?: 'controlled_generated_fixture_runtime_execution' | 'broad_runtime_execution' | null
  fixtureScope?: 'generated_srt_and_generated_subtitle_only_mkv_fixture' | 'private_or_user_media' | null
  workerRuntimeMode?: 'runner_invoked_guarded_runtime_no_route_dispatch' | 'service_route_worker_dispatch' | null
  guardedRuntime: GuardedRuntimeExecutionSummary
  routeExecutionRequestedNow?: boolean
  workerDispatchRequestedNow?: boolean
  workerExecutionRequestedNow?: boolean
  workerLeaseClaimRequestedNow?: boolean
  persistentJobQueueWriteRequestedNow?: boolean
  privateMediaProcessingRequestedNow?: boolean
  userMediaProcessingRequestedNow?: boolean
  supabaseMutationRequestedNow?: boolean
  sqlExecutionRequestedNow?: boolean
  signedUrlCreationRequestedNow?: boolean
  publicArtifactRequestedNow?: boolean
  finalRenderExportRequestedNow?: boolean
  externalBetaExpansionRequestedNow?: boolean
  paidProductionUnlockRequestedNow?: boolean
  productionUnlockRequestedNow?: boolean
}

export interface GstreamerMkvtoolnixAgentControlledWorkerRuntimeResult {
  packet: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_PACKET
  decision: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_DECISION
  execution: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_EXECUTION
  ok: boolean
  status: GstreamerMkvtoolnixAgentControlledWorkerRuntimeStatus
  blockers: GstreamerMkvtoolnixAgentControlledWorkerRuntimeStatus[]
  confirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_CONFIRM_ENV
  confirmationRequired: true
  controlledWorkerDispatchDryRunStatus: string
  sanitizedRuntimePacket: {
    runtimePacketId: string
    runtimeExecutionId: string
    runtimeExecutionMode: 'controlled_generated_fixture_runtime_execution'
    runtimeExecutionIdempotencyKey: string
    fixtureScope: 'generated_srt_and_generated_subtitle_only_mkv_fixture'
    workerRuntimeMode: 'runner_invoked_guarded_runtime_no_route_dispatch'
    dispatchDryRunId: string
    dispatchDryRunIdempotencyKey: string
    queueId: string
    queueIdempotencyKey: string
    dispatchId: string
    dispatchIdempotencyKey: string
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
    outputManifestSchemaId: string
    qaReportSchemaId: string
    cleanupPolicyId: string
    retentionPolicyId: string
    failurePolicyId: string
    retryPolicyId: string
    nonPublicArtifactPolicyId: string
    guardedRuntimeRunId: string
    guardedRuntimeOutputDir: string
    dockerImageTag: string
    dockerNetwork: 'none'
    allowedCommandTemplates: AllowedTemplate[]
    commandResults: GuardedRuntimeCommandResultSummary[]
    runtimePacketAccepted: boolean
    nextRuntimeQaRollup: 'pending_next_milestone'
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    workerLeaseClaim: false
    persistentJobQueueWrite: false
    privateMediaProcessing: false
    userMediaProcessing: false
    supabaseMutation: false
    sqlExecution: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
  }
  safety: {
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    workerLeaseClaim: false
    persistentJobQueueWrite: false
    gstreamerExecution: 'completed_controlled_generated_fixture_only'
    mkvtoolnixExecution: 'completed_controlled_generated_fixture_only'
    mediaProcessing: 'controlled_generated_fixture_only'
    privateMediaProcessing: false
    userMediaProcessing: false
    ffmpegFfprobeExecution: false
    dockerExecution: 'completed_local_image_only_network_disabled_no_push_no_deploy'
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
  nextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_NEXT_MILESTONE
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function blank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function expectedRuntimeExecutionIdempotencyKey(
  input: GstreamerMkvtoolnixAgentControlledWorkerRuntimeInput,
): string {
  const dispatch = validateGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput(
    input.controlledWorkerDispatchDryRunInput,
  )
  return [
    'gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution',
    dispatch.sanitizedDispatchDryRun.workspaceId,
    dispatch.sanitizedDispatchDryRun.projectId,
    dispatch.sanitizedDispatchDryRun.approvedSnapshotId,
    dispatch.sanitizedDispatchDryRun.jobId,
    dispatch.sanitizedDispatchDryRun.dispatchDryRunId,
    input.guardedRuntime.runId,
    input.runtimeExecutionId ?? '',
  ].join(':')
}

function unsafeRequest(input: GstreamerMkvtoolnixAgentControlledWorkerRuntimeInput): boolean {
  return [
    input.routeExecutionRequestedNow,
    input.workerDispatchRequestedNow,
    input.workerExecutionRequestedNow,
    input.workerLeaseClaimRequestedNow,
    input.persistentJobQueueWriteRequestedNow,
    input.privateMediaProcessingRequestedNow,
    input.userMediaProcessingRequestedNow,
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

function templateSetValid(commandResults: GuardedRuntimeCommandResultSummary[]): boolean {
  const ids = commandResults.map((result) => result.templateId)
  return (
    ids.length === RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_ALLOWED_TEMPLATES.length &&
    RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_ALLOWED_TEMPLATES.every((template) =>
      ids.includes(template),
    )
  )
}

function guardedRuntimeValid(guardedRuntime: GuardedRuntimeExecutionSummary): boolean {
  return (
    guardedRuntime.packet === 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-IMPLEMENTATION-1' &&
    guardedRuntime.decision === 'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_controlled_generated_fixture' &&
    guardedRuntime.execution === 'completed_confirmation_gated_local_render_worker_runtime_execution_generated_fixture_only' &&
    guardedRuntime.runtimeExecution?.status === 'completed_controlled_generated_fixture_runtime_execution' &&
    guardedRuntime.runtimeExecution?.dockerNetwork === 'none' &&
    guardedRuntime.runtimeExecution?.routeExecution === 'not_run_runtime_runner_only' &&
    guardedRuntime.runtimeExecution?.workerDispatch === 'not_run_runtime_runner_only' &&
    guardedRuntime.runtimeExecution?.workerExecution === 'not_run_runtime_runner_only' &&
    guardedRuntime.runtimeExecution?.gstreamerExecution === 'completed_controlled_generated_fixture_only' &&
    guardedRuntime.runtimeExecution?.mkvtoolnixExecution === 'completed_controlled_generated_fixture_only' &&
    guardedRuntime.runtimeExecution?.mediaProcessing === 'controlled_generated_fixture_only' &&
    guardedRuntime.runtimeExecution?.privateMediaProcessing === false &&
    guardedRuntime.runtimeExecution?.userMediaProcessing === false &&
    guardedRuntime.validation === 'passed' &&
    guardedRuntime.productReadyEndToEndLocalOssTools === 0 &&
    guardedRuntime.packageLock === 'unchanged' &&
    guardedRuntime.generatedArtifactsCommitted === 'none' &&
    templateSetValid(guardedRuntime.commandResults) &&
    guardedRuntime.commandResults.every((result) => result.ok && result.exitStatus === 0)
  )
}

export function buildGstreamerMkvtoolnixAgentControlledWorkerRuntimeInput(
  guardedRuntime: GuardedRuntimeExecutionSummary,
  overrides: Partial<Omit<GstreamerMkvtoolnixAgentControlledWorkerRuntimeInput, 'guardedRuntime'>> = {},
): GstreamerMkvtoolnixAgentControlledWorkerRuntimeInput {
  const runtimeExecutionId =
    overrides.runtimeExecutionId ?? 'runtime-execution-gstreamer-mkvtoolnix-agent-controlled-worker-1'
  const input = {
    confirmation: true,
    controlledWorkerDispatchDryRunInput:
      overrides.controlledWorkerDispatchDryRunInput ?? buildGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput(),
    runtimePacketId: 'runtime-packet-gstreamer-mkvtoolnix-agent-controlled-worker-1',
    runtimeExecutionId,
    runtimeExecutionMode: 'controlled_generated_fixture_runtime_execution',
    fixtureScope: 'generated_srt_and_generated_subtitle_only_mkv_fixture',
    workerRuntimeMode: 'runner_invoked_guarded_runtime_no_route_dispatch',
    guardedRuntime,
    ...overrides,
  } satisfies GstreamerMkvtoolnixAgentControlledWorkerRuntimeInput

  return {
    ...input,
    runtimeExecutionIdempotencyKey:
      overrides.runtimeExecutionIdempotencyKey ?? expectedRuntimeExecutionIdempotencyKey(input),
  }
}

function sanitizedRuntimePacket(
  input: GstreamerMkvtoolnixAgentControlledWorkerRuntimeInput,
  ok: boolean,
): GstreamerMkvtoolnixAgentControlledWorkerRuntimeResult['sanitizedRuntimePacket'] {
  const dispatch = validateGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput(
    input.controlledWorkerDispatchDryRunInput,
  )
  const dryRun = dispatch.sanitizedDispatchDryRun

  return {
    runtimePacketId: input.runtimePacketId ?? '',
    runtimeExecutionId: input.runtimeExecutionId ?? '',
    runtimeExecutionMode: 'controlled_generated_fixture_runtime_execution',
    runtimeExecutionIdempotencyKey: input.runtimeExecutionIdempotencyKey ?? '',
    fixtureScope: 'generated_srt_and_generated_subtitle_only_mkv_fixture',
    workerRuntimeMode: 'runner_invoked_guarded_runtime_no_route_dispatch',
    dispatchDryRunId: dryRun.dispatchDryRunId,
    dispatchDryRunIdempotencyKey: dryRun.dispatchDryRunIdempotencyKey,
    queueId: dryRun.queueId,
    queueIdempotencyKey: dryRun.queueIdempotencyKey,
    dispatchId: dryRun.dispatchId,
    dispatchIdempotencyKey: dryRun.dispatchIdempotencyKey,
    workspaceId: dryRun.workspaceId,
    projectId: dryRun.projectId,
    editSessionId: dryRun.editSessionId,
    approvedSnapshotId: dryRun.approvedSnapshotId,
    approvalRecordId: dryRun.approvalRecordId,
    creditPolicyRef: dryRun.creditPolicyRef,
    creditPolicyMode: dryRun.creditPolicyMode,
    jobId: dryRun.jobId,
    workerLeaseId: dryRun.workerLeaseId,
    routeIdempotencyKey: dryRun.routeIdempotencyKey,
    commandTemplateId: dryRun.commandTemplateId,
    privateInputManifestId: dryRun.privateInputManifestId,
    outputManifestSchemaId: dryRun.outputManifestSchemaId,
    qaReportSchemaId: dryRun.qaReportSchemaId,
    cleanupPolicyId: dryRun.cleanupPolicyId,
    retentionPolicyId: dryRun.retentionPolicyId,
    failurePolicyId: dryRun.failurePolicyId,
    retryPolicyId: dryRun.retryPolicyId,
    nonPublicArtifactPolicyId: dryRun.nonPublicArtifactPolicyId,
    guardedRuntimeRunId: input.guardedRuntime.runId,
    guardedRuntimeOutputDir: input.guardedRuntime.outputDir,
    dockerImageTag: input.guardedRuntime.imageTag,
    dockerNetwork: 'none',
    allowedCommandTemplates: [...RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_ALLOWED_TEMPLATES],
    commandResults: input.guardedRuntime.commandResults,
    runtimePacketAccepted: ok,
    nextRuntimeQaRollup: 'pending_next_milestone',
    routeExecution: false,
    workerDispatch: false,
    workerExecution: false,
    workerLeaseClaim: false,
    persistentJobQueueWrite: false,
    privateMediaProcessing: false,
    userMediaProcessing: false,
    supabaseMutation: false,
    sqlExecution: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    finalRenderExport: false,
  }
}

function safety(): GstreamerMkvtoolnixAgentControlledWorkerRuntimeResult['safety'] {
  return {
    routeExecution: false,
    workerDispatch: false,
    workerExecution: false,
    workerLeaseClaim: false,
    persistentJobQueueWrite: false,
    gstreamerExecution: 'completed_controlled_generated_fixture_only',
    mkvtoolnixExecution: 'completed_controlled_generated_fixture_only',
    mediaProcessing: 'controlled_generated_fixture_only',
    privateMediaProcessing: false,
    userMediaProcessing: false,
    ffmpegFfprobeExecution: false,
    dockerExecution: 'completed_local_image_only_network_disabled_no_push_no_deploy',
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
  }
}

export function validateGstreamerMkvtoolnixAgentControlledWorkerRuntimeInput(
  input: GstreamerMkvtoolnixAgentControlledWorkerRuntimeInput,
): GstreamerMkvtoolnixAgentControlledWorkerRuntimeResult {
  const blockers: GstreamerMkvtoolnixAgentControlledWorkerRuntimeStatus[] = []
  const dispatch = validateGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput(
    input.controlledWorkerDispatchDryRunInput,
  )

  if (!input.confirmation) pushOnce(blockers, 'blocked_missing_controlled_worker_runtime_execution_confirmation')
  if (
    !dispatch.ok ||
    dispatch.nextMilestone !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_NEXT_MILESTONE
  ) {
    pushOnce(blockers, 'blocked_controlled_worker_dispatch_dry_run_validation_failed')
  }
  if (
    blank(input.runtimePacketId) ||
    blank(input.runtimeExecutionId) ||
    blank(input.runtimeExecutionIdempotencyKey)
  ) {
    pushOnce(blockers, 'blocked_missing_controlled_worker_runtime_execution_reference')
  }
  if (
    input.runtimeExecutionMode !== 'controlled_generated_fixture_runtime_execution' ||
    input.fixtureScope !== 'generated_srt_and_generated_subtitle_only_mkv_fixture' ||
    input.workerRuntimeMode !== 'runner_invoked_guarded_runtime_no_route_dispatch'
  ) {
    pushOnce(blockers, 'blocked_invalid_controlled_worker_runtime_execution_state')
  }
  if (
    !blank(input.runtimeExecutionIdempotencyKey) &&
    input.runtimeExecutionIdempotencyKey !== expectedRuntimeExecutionIdempotencyKey(input)
  ) {
    pushOnce(blockers, 'blocked_controlled_worker_runtime_execution_idempotency_mismatch')
  }
  if (!guardedRuntimeValid(input.guardedRuntime)) {
    pushOnce(blockers, 'blocked_guarded_runtime_execution_result_failed')
  }
  if (input.fixtureScope !== 'generated_srt_and_generated_subtitle_only_mkv_fixture') {
    pushOnce(blockers, 'blocked_unapproved_runtime_execution_scope')
  }
  if (unsafeRequest(input)) {
    pushOnce(blockers, 'blocked_runtime_execution_not_enabled')
  }

  const ok = blockers.length === 0

  return {
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_PACKET,
    decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_DECISION,
    execution: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_EXECUTION,
    ok,
    status: ok
      ? 'completed_controlled_worker_runtime_execution_packet_generated_fixture_only'
      : blockers[0] ?? 'blocked_invalid_controlled_worker_runtime_execution_state',
    blockers,
    confirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_CONFIRM_ENV,
    confirmationRequired: true,
    controlledWorkerDispatchDryRunStatus: dispatch.ok
      ? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_READY_STATUS
      : dispatch.status,
    sanitizedRuntimePacket: sanitizedRuntimePacket(input, ok),
    safety: safety(),
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_NEXT_MILESTONE,
  }
}

export function summarizeGstreamerMkvtoolnixAgentControlledWorkerRuntimeBoundary(): string[] {
  return [
    'Agent controlled worker runtime execution packet consumes a passed controlled worker dispatch dry-run envelope.',
    'Runtime execution is bounded to the existing guarded generated-fixture runner with Docker network disabled.',
    'Route execution, worker dispatch, worker execution, worker lease claim, persistent queue writes, private/user media, signed/public artifacts, Supabase, SQL, and final render/export remain disabled.',
    'GStreamer and MKVToolNix execution is limited to approved generated fixture command templates only.',
  ]
}
