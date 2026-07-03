import type { ServiceContext } from '../types'
import { createJobService } from './job-service'
import {
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_TOOLS,
  buildThreeToolExternalAgentExecutionBridgeInput,
  validateThreeToolExternalAgentExecutionBridgeInput,
  type ThreeToolExternalAgentExecutionBridgeInput,
} from './tracka-three-tool-external-agent-execution-bridge-1'

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_PACKET =
  'TRACKA-THREE-TOOL-EXTERNAL-AGENT-PERSISTED-JOB-RUNTIME-HANDOFF-1' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_DECISION =
  'completed_three_tool_external_agent_persisted_job_runtime_handoff' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_EXECUTION =
  'completed_local_mock_job_service_handoff_no_route_worker_tool_media_execution' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_ROUTE_PATH =
  '/v1/external-beta/tracka/three-tool/generated-fixture-runtime/approved-snapshot/jobs/persisted-handoff' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE =
  'quality_check' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_PAYLOAD_KIND =
  'tracka_three_tool_external_agent_generated_fixture_runtime' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_SOURCE_MERGE_SHA =
  '47a3a5f358f7a00f451b9fef277ed0b66251c9e0' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_SOURCE_RUN_ID =
  '2026-07-03T03-41-30-494Z-41a3b873' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_SOURCE_CHILD_RUN_ID =
  '2026-07-03T03-41-30-650Z-41ce5185' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_NEXT_MILESTONE =
  'TRACKA-THREE-TOOL-EXTERNAL-AGENT-PERSISTED-JOB-ROUTE-INVOCATION-1' as const

export type ThreeToolExternalAgentPersistedJobRuntimeHandoffStatus =
  | 'completed_persisted_job_runtime_handoff'
  | 'blocked_pending_three_tool_persisted_job_runtime_handoff_confirmation'
  | 'blocked_missing_three_tool_persisted_job_runtime_handoff_reference'
  | 'blocked_invalid_three_tool_persisted_job_runtime_handoff_state'
  | 'blocked_three_tool_approved_snapshot_execution_source_invalid'
  | 'blocked_three_tool_persisted_job_runtime_handoff_unsafe_request'
  | 'blocked_remote_job_service_write_not_approved_for_three_tool_handoff'
  | 'blocked_three_tool_local_mock_job_service_handoff_failed'

export interface ThreeToolExternalAgentPersistedJobRuntimeHandoffInput
  extends ThreeToolExternalAgentExecutionBridgeInput {
  confirmation?: boolean
  persistedHandoffId?: string | null
  persistedJobHandoffMode?:
    | 'local_mock_job_service_handoff_no_remote_mutation'
    | 'service_role_job_service_handoff'
    | string
    | null
  persistedJobWriteConfirmed?: boolean
  jobBatchName?: string | null
  approvedSnapshotJobExecutionRunId?: string | null
  approvedSnapshotJobExecutionChildRunId?: string | null
  approvedSnapshotJobExecutionDecision?: string | null
  approvedSnapshotJobExecutionRecordPath?: string | null
  persistentJobQueueWriteRequestedNow?: boolean
  workerProcessStartRequestedNow?: boolean
  workerLeaseClaimRequestedNow?: boolean
  privateMediaProcessingRequestedNow?: boolean
  userMediaProcessingRequestedNow?: boolean
  ffmpegFfprobeExecutionRequestedNow?: boolean
  secretPayloadAccessRequestedNow?: boolean
  serviceRoleSecretPayloadAccessRequestedNow?: boolean
  packageInstallationRequestedNow?: boolean
  dependencyMutationRequestedNow?: boolean
}

export interface ThreeToolExternalAgentPersistedJobRuntimeHandoffResult {
  packet: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_PACKET
  decision: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_DECISION
  execution: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_EXECUTION
  ok: boolean
  status: ThreeToolExternalAgentPersistedJobRuntimeHandoffStatus
  blockers: ThreeToolExternalAgentPersistedJobRuntimeHandoffStatus[]
  confirmationGate: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_CONFIRM_ENV
  routePath: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_ROUTE_PATH
  warnings: string[]
  jobBatch?: Record<string, unknown>
  job?: Record<string, unknown>
  sanitizedHandoff: {
    persistedHandoffId: string
    persistedJobHandoffMode: 'local_mock_job_service_handoff_no_remote_mutation'
    workspaceId: string
    projectId: string
    approvedSnapshotId: string
    approvalRecordId: string
    sourceApprovedSnapshotJobExecutionRunId: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_SOURCE_RUN_ID
    sourceApprovedSnapshotJobExecutionChildRunId:
      typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_SOURCE_CHILD_RUN_ID
    sourceApprovedSnapshotJobExecutionMergeSha:
      typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_SOURCE_MERGE_SHA
    persistedJobId: string | null
    persistedJobBatchId: string | null
    persistedJobType: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE
    persistedJobPayloadKind: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_PAYLOAD_KIND
    jobServiceMode: 'local_mock_job_service'
    localMockJobServiceWrite: boolean
    serviceRoleJobServiceWrite: false
    runtimeRouteInvocation: false
    persistentJobQueueWrite: false
    workerDispatch: false
    workerLeaseClaim: false
    workerProcessStart: false
    workerExecution: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
    gpacMp4boxExecution: false
    privateMediaProcessing: false
    userMediaProcessing: false
    supabaseMutation: false
    sqlExecution: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
  }
  safety: {
    routeHandlerInvocation: 'completed_guarded_three_tool_persisted_job_runtime_handoff_handler' | 'not_run_blocked_before_three_tool_persisted_handoff'
    localMockJobServiceHandoff: boolean
    serviceRoleJobServiceWrite: false
    persistentJobQueueWrite: false
    runtimeRouteInvocation: false
    routeExecution: false
    workerDispatch: false
    workerLeaseClaim: false
    workerProcessStart: false
    workerExecution: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
    gpacMp4boxExecution: false
    privateMediaProcessing: false
    userMediaProcessing: false
    ffmpegFfprobeExecution: false
    dockerExecution: false
    remotionExecution: false
    supabaseMutation: false
    sqlExecution: false
    secretPayloadAccess: false
    serviceRoleSecretPayloadAccess: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
    externalBetaExpansion: false
    paidProductionUnlock: false
    productionUnlock: false
  }
  productReadyEndToEndLocalOssTools: 0
  nextMilestone: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_NEXT_MILESTONE
}

export interface ThreeToolExternalAgentPersistedJobRuntimeHandoffDependencies {
  env?: NodeJS.ProcessEnv
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function blank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function idOf(value: unknown): string | null {
  const record = asRecord(value)
  return typeof record.id === 'string' ? record.id : null
}

function unsafeRequested(input: ThreeToolExternalAgentPersistedJobRuntimeHandoffInput): boolean {
  return [
    input.routeExecutionRequestedNow,
    input.workerDispatchRequestedNow,
    input.workerExecutionRequestedNow,
    input.workerProcessStartRequestedNow,
    input.workerLeaseClaimRequestedNow,
    input.persistentJobQueueWriteRequestedNow,
    input.gstreamerExecutionRequestedNow,
    input.mkvtoolnixExecutionRequestedNow,
    input.gpacMp4boxExecutionRequestedNow,
    input.dockerExecutionRequestedNow,
    input.dockerPushDeployRequestedNow,
    input.remotionRenderRequestedNow,
    input.privateMediaProcessingRequestedNow,
    input.userMediaProcessingRequestedNow,
    input.ffmpegFfprobeExecutionRequestedNow,
    input.supabaseMutationRequestedNow,
    input.sqlExecutionRequestedNow,
    input.secretPayloadAccessRequestedNow,
    input.serviceRoleSecretPayloadAccessRequestedNow,
    input.signedUrlCreationRequestedNow,
    input.publicArtifactRequestedNow,
    input.finalRenderExportRequestedNow,
    input.externalBetaExpansionRequestedNow,
    input.paidProductionUnlockRequestedNow,
    input.productionUnlockRequestedNow,
    input.packageInstallationRequestedNow,
    input.dependencyMutationRequestedNow,
  ].some(Boolean)
}

export function buildThreeToolExternalAgentPersistedJobRuntimeHandoffInput(
  overrides: Partial<ThreeToolExternalAgentPersistedJobRuntimeHandoffInput> = {},
): ThreeToolExternalAgentPersistedJobRuntimeHandoffInput {
  const bridge = buildThreeToolExternalAgentExecutionBridgeInput(overrides)
  return {
    ...bridge,
    confirmation: overrides.confirmation ?? true,
    persistedHandoffId: overrides.persistedHandoffId ?? 'persisted-handoff-three-tool-external-agent-generated-fixture-1',
    persistedJobHandoffMode:
      overrides.persistedJobHandoffMode ?? 'local_mock_job_service_handoff_no_remote_mutation',
    persistedJobWriteConfirmed: overrides.persistedJobWriteConfirmed ?? true,
    jobBatchName: overrides.jobBatchName ?? 'Track A three-tool external agent generated fixture runtime handoff',
    approvedSnapshotJobExecutionRunId:
      overrides.approvedSnapshotJobExecutionRunId ??
      TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_SOURCE_RUN_ID,
    approvedSnapshotJobExecutionChildRunId:
      overrides.approvedSnapshotJobExecutionChildRunId ??
      TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_SOURCE_CHILD_RUN_ID,
    approvedSnapshotJobExecutionDecision:
      overrides.approvedSnapshotJobExecutionDecision ??
      'completed_three_tool_external_agent_approved_snapshot_job_execution',
    approvedSnapshotJobExecutionRecordPath:
      overrides.approvedSnapshotJobExecutionRecordPath ??
      'docs/external-beta/tracka-three-tool-external-agent-approved-snapshot-job-execution-1/tracka-three-tool-external-agent-approved-snapshot-job-execution-1-record.json',
    persistentJobQueueWriteRequestedNow: overrides.persistentJobQueueWriteRequestedNow ?? false,
    workerProcessStartRequestedNow: overrides.workerProcessStartRequestedNow ?? false,
    workerLeaseClaimRequestedNow: overrides.workerLeaseClaimRequestedNow ?? false,
    privateMediaProcessingRequestedNow: overrides.privateMediaProcessingRequestedNow ?? false,
    userMediaProcessingRequestedNow: overrides.userMediaProcessingRequestedNow ?? false,
    ffmpegFfprobeExecutionRequestedNow: overrides.ffmpegFfprobeExecutionRequestedNow ?? false,
    secretPayloadAccessRequestedNow: overrides.secretPayloadAccessRequestedNow ?? false,
    serviceRoleSecretPayloadAccessRequestedNow: overrides.serviceRoleSecretPayloadAccessRequestedNow ?? false,
    packageInstallationRequestedNow: overrides.packageInstallationRequestedNow ?? false,
    dependencyMutationRequestedNow: overrides.dependencyMutationRequestedNow ?? false,
  }
}

export function validateThreeToolExternalAgentPersistedJobRuntimeHandoffInput(
  input: ThreeToolExternalAgentPersistedJobRuntimeHandoffInput,
): ThreeToolExternalAgentPersistedJobRuntimeHandoffStatus[] {
  const blockers: ThreeToolExternalAgentPersistedJobRuntimeHandoffStatus[] = []
  const bridgeValidation = validateThreeToolExternalAgentExecutionBridgeInput(input)

  if (!bridgeValidation.ok) {
    pushOnce(blockers, 'blocked_three_tool_approved_snapshot_execution_source_invalid')
  }
  if (!input.confirmation || !input.persistedJobWriteConfirmed) {
    pushOnce(blockers, 'blocked_pending_three_tool_persisted_job_runtime_handoff_confirmation')
  }
  for (const value of [
    input.persistedHandoffId,
    input.workspaceId,
    input.projectId,
    input.approvedSnapshotId,
    input.approvalRecordId,
    input.jobId,
    input.approvedSnapshotJobExecutionRunId,
    input.approvedSnapshotJobExecutionChildRunId,
    input.approvedSnapshotJobExecutionRecordPath,
  ]) {
    if (blank(value)) pushOnce(blockers, 'blocked_missing_three_tool_persisted_job_runtime_handoff_reference')
  }
  if (
    input.persistedJobHandoffMode !== 'local_mock_job_service_handoff_no_remote_mutation' ||
    input.approvedSnapshotJobExecutionRunId !==
      TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_SOURCE_RUN_ID ||
    input.approvedSnapshotJobExecutionChildRunId !==
      TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_SOURCE_CHILD_RUN_ID ||
    input.approvedSnapshotJobExecutionDecision !== 'completed_three_tool_external_agent_approved_snapshot_job_execution'
  ) {
    pushOnce(blockers, 'blocked_invalid_three_tool_persisted_job_runtime_handoff_state')
  }
  if (unsafeRequested(input)) {
    pushOnce(blockers, 'blocked_three_tool_persisted_job_runtime_handoff_unsafe_request')
  }

  return blockers
}

function buildResult(
  input: ThreeToolExternalAgentPersistedJobRuntimeHandoffInput,
  ok: boolean,
  status: ThreeToolExternalAgentPersistedJobRuntimeHandoffStatus,
  blockers: ThreeToolExternalAgentPersistedJobRuntimeHandoffStatus[],
  warnings: string[],
  jobBatch: Record<string, unknown> | undefined,
  job: Record<string, unknown> | undefined,
): ThreeToolExternalAgentPersistedJobRuntimeHandoffResult {
  const jobBatchId = idOf(jobBatch)
  const jobId = idOf(job)
  const localMockWrite = Boolean(ok)
  return {
    packet: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_PACKET,
    decision: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_DECISION,
    execution: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_EXECUTION,
    ok,
    status,
    blockers,
    confirmationGate: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_CONFIRM_ENV,
    routePath: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_ROUTE_PATH,
    warnings,
    jobBatch,
    job,
    sanitizedHandoff: {
      persistedHandoffId: input.persistedHandoffId ?? '',
      persistedJobHandoffMode: 'local_mock_job_service_handoff_no_remote_mutation',
      workspaceId: input.workspaceId ?? '',
      projectId: input.projectId ?? '',
      approvedSnapshotId: input.approvedSnapshotId ?? '',
      approvalRecordId: input.approvalRecordId ?? '',
      sourceApprovedSnapshotJobExecutionRunId:
        TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_SOURCE_RUN_ID,
      sourceApprovedSnapshotJobExecutionChildRunId:
        TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_SOURCE_CHILD_RUN_ID,
      sourceApprovedSnapshotJobExecutionMergeSha:
        TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_SOURCE_MERGE_SHA,
      persistedJobId: jobId,
      persistedJobBatchId: jobBatchId,
      persistedJobType: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE,
      persistedJobPayloadKind: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_PAYLOAD_KIND,
      jobServiceMode: 'local_mock_job_service',
      localMockJobServiceWrite: localMockWrite,
      serviceRoleJobServiceWrite: false,
      runtimeRouteInvocation: false,
      persistentJobQueueWrite: false,
      workerDispatch: false,
      workerLeaseClaim: false,
      workerProcessStart: false,
      workerExecution: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
      gpacMp4boxExecution: false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      supabaseMutation: false,
      sqlExecution: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
    },
    safety: {
      routeHandlerInvocation: ok
        ? 'completed_guarded_three_tool_persisted_job_runtime_handoff_handler'
        : 'not_run_blocked_before_three_tool_persisted_handoff',
      localMockJobServiceHandoff: localMockWrite,
      serviceRoleJobServiceWrite: false,
      persistentJobQueueWrite: false,
      runtimeRouteInvocation: false,
      routeExecution: false,
      workerDispatch: false,
      workerLeaseClaim: false,
      workerProcessStart: false,
      workerExecution: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
      gpacMp4boxExecution: false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      ffmpegFfprobeExecution: false,
      dockerExecution: false,
      remotionExecution: false,
      supabaseMutation: false,
      sqlExecution: false,
      secretPayloadAccess: false,
      serviceRoleSecretPayloadAccess: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
      externalBetaExpansion: false,
      paidProductionUnlock: false,
      productionUnlock: false,
    },
    productReadyEndToEndLocalOssTools: 0,
    nextMilestone: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_NEXT_MILESTONE,
  }
}

function blockedResult(
  input: ThreeToolExternalAgentPersistedJobRuntimeHandoffInput,
  status: ThreeToolExternalAgentPersistedJobRuntimeHandoffStatus,
  blockers: ThreeToolExternalAgentPersistedJobRuntimeHandoffStatus[],
): ThreeToolExternalAgentPersistedJobRuntimeHandoffResult {
  return buildResult(input, false, status, blockers, [], undefined, undefined)
}

export async function runThreeToolExternalAgentPersistedJobRuntimeHandoff(
  input: ThreeToolExternalAgentPersistedJobRuntimeHandoffInput,
  context: ServiceContext,
  dependencies: ThreeToolExternalAgentPersistedJobRuntimeHandoffDependencies = {},
): Promise<ThreeToolExternalAgentPersistedJobRuntimeHandoffResult> {
  const env = dependencies.env ?? process.env
  const blockers = validateThreeToolExternalAgentPersistedJobRuntimeHandoffInput(input)
  if (env[TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_CONFIRM_ENV] !== 'true') {
    pushOnce(blockers, 'blocked_pending_three_tool_persisted_job_runtime_handoff_confirmation')
  }
  if (context.clients.admin && !context.env.mockOnly) {
    pushOnce(blockers, 'blocked_remote_job_service_write_not_approved_for_three_tool_handoff')
  }
  if (blockers.length > 0) return blockedResult(input, blockers[0], blockers)

  try {
    const jobService = createJobService(context)
    const batchResult = await jobService.createJobBatch({
      workspaceId: input.workspaceId ?? '',
      projectId: input.projectId ?? '',
      approvedPlanSnapshotId: input.approvedSnapshotId ?? undefined,
      name: input.jobBatchName ?? 'Track A three-tool external agent generated fixture runtime handoff',
    })
    const batchId = idOf(batchResult.jobBatch)
    const jobResult = await jobService.createJob({
      workspaceId: input.workspaceId ?? '',
      projectId: input.projectId ?? '',
      jobType: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE,
      jobBatchId: batchId ?? undefined,
      approvedPlanSnapshotId: input.approvedSnapshotId ?? undefined,
      payloadJson: {
        persistedHandoffId: input.persistedHandoffId,
        packet: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_PACKET,
        persistedJobPayloadKind: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_PAYLOAD_KIND,
        sourceApprovedSnapshotJobExecution: {
          mergeSha: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_SOURCE_MERGE_SHA,
          runId: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_SOURCE_RUN_ID,
          childRunId: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_SOURCE_CHILD_RUN_ID,
          recordPath: input.approvedSnapshotJobExecutionRecordPath,
          decision: input.approvedSnapshotJobExecutionDecision,
        },
        tools: [...TRACKA_THREE_TOOL_EXTERNAL_AGENT_EXECUTION_BRIDGE_TOOLS],
        approvedSnapshotRuntimeEnvelope: {
          workspaceId: input.workspaceId,
          projectId: input.projectId,
          editSessionId: input.editSessionId,
          approvedSnapshotId: input.approvedSnapshotId,
          approvalRecordId: input.approvalRecordId,
          creditPolicyRef: input.creditPolicyRef,
          jobId: input.jobId,
          runtimePacketId: input.runtimePacketId,
          runtimeExecutionId: input.runtimeExecutionId,
          privateInputManifestId: input.privateInputManifestId,
          outputManifestSchemaId: input.outputManifestSchemaId,
          qaReportSchemaId: input.qaReportSchemaId,
          cleanupPolicyId: input.cleanupPolicyId,
          retentionPolicyId: input.retentionPolicyId,
          failurePolicyId: input.failurePolicyId,
        },
        safety: {
          routeExecution: false,
          persistentJobQueueWrite: false,
          workerDispatch: false,
          workerLeaseClaim: false,
          workerProcessStart: false,
          workerExecution: false,
          toolExecution: false,
          privateMediaProcessing: false,
          userMediaProcessing: false,
          signedUrlCreation: false,
          publicArtifactCreation: false,
          finalRenderExport: false,
        },
      },
    })
    const warnings = [...batchResult.warnings, ...jobResult.warnings]
    return buildResult(
      input,
      true,
      'completed_persisted_job_runtime_handoff',
      [],
      warnings,
      asRecord(batchResult.jobBatch),
      asRecord(jobResult.job),
    )
  } catch {
    return blockedResult(input, 'blocked_three_tool_local_mock_job_service_handoff_failed', [
      'blocked_three_tool_local_mock_job_service_handoff_failed',
    ])
  }
}

export function summarizeThreeToolExternalAgentPersistedJobRuntimeHandoffBoundary(): string[] {
  return [
    'Creates a local/mock backend job-service handoff record for the already-approved three-tool generated-fixture runtime envelope.',
    'The handoff includes GStreamer, MKVToolNix, and GPAC/MP4Box source evidence from the approved-snapshot job execution packet.',
    'This packet does not perform route runtime invocation, persistent remote queue writes, worker dispatch, worker lease claim, worker process start, tool execution, private media processing, Supabase mutation, SQL, signed URLs, public artifacts, or final render/export.',
    'Remote service-role job-service writes deliberately fail closed until a later explicitly approved source packet unlocks them.',
  ]
}
