import type { ServiceContext } from '../types'
import { createJobService } from './job-service'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_ROUTE_PATH,
  runGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoff,
} from './rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-approved-snapshot-job-queue-handoff-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH,
  buildGstreamerMkvtoolnixQueuedJobRuntimeRouteInvocationInput,
  type GstreamerMkvtoolnixQueuedJobRuntimeRouteInvocationInput,
} from './rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-route-invocation-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
} from './rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1'

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_PACKET =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-PERSISTED-JOB-RUNTIME-HANDOFF-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_DECISION =
  'completed_gstreamer_mkvtoolnix_persisted_job_runtime_handoff' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_EXECUTION =
  'completed_backend_job_service_handoff_no_runtime_execution' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_ROUTE_PATH =
  '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/persisted-handoff' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE =
  'quality_check' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_PAYLOAD_KIND =
  'gstreamer_mkvtoolnix_generated_fixture_runtime' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_NEXT_MILESTONE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-PERSISTED-JOB-RUNTIME-ROUTE-INVOCATION-1' as const

export type GstreamerMkvtoolnixPersistedJobRuntimeHandoffStatus =
  | 'completed_persisted_job_runtime_handoff'
  | 'blocked_missing_gstreamer_mkvtoolnix_persisted_job_runtime_handoff_confirmation'
  | 'blocked_missing_gstreamer_mkvtoolnix_persisted_job_runtime_handoff_reference'
  | 'blocked_invalid_gstreamer_mkvtoolnix_persisted_job_runtime_handoff_state'
  | 'blocked_unsafe_gstreamer_mkvtoolnix_persisted_job_runtime_handoff_request'
  | 'blocked_approved_snapshot_queue_handoff_failed'
  | 'blocked_missing_queue_payload_runtime_route_body'
  | 'blocked_job_service_handoff_failed'

export interface GstreamerMkvtoolnixPersistedJobRuntimeHandoffInput
  extends GstreamerMkvtoolnixQueuedJobRuntimeRouteInvocationInput {
  persistedHandoffId: string
  persistedJobHandoffMode: 'backend_job_service_handoff_no_runtime_execution' | string
  persistedJobWriteConfirmed: boolean
  jobBatchName?: string
  persistedJobWriteRequestedNow?: boolean
  runtimeRouteInvocationRequestedNow?: boolean
}

export interface GstreamerMkvtoolnixPersistedJobRuntimeHandoffResult {
  packet: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_PACKET
  decision: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_DECISION
  execution: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_EXECUTION
  ok: boolean
  status: GstreamerMkvtoolnixPersistedJobRuntimeHandoffStatus
  blockers: GstreamerMkvtoolnixPersistedJobRuntimeHandoffStatus[]
  confirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_CONFIRM_ENV
  queueHandoffConfirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_CONFIRM_ENV
  queuedInvocationConfirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION_CONFIRM_ENV
  runtimeRouteConfirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV
  routePath: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_ROUTE_PATH
  queueRoutePath: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_ROUTE_PATH
  runtimeInvocationRoutePath: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH
  runtimeRoutePath: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH
  warnings: string[]
  jobBatch?: Record<string, unknown>
  job?: Record<string, unknown>
  sanitizedHandoff: {
    persistedHandoffId: string
    persistedJobHandoffMode: 'backend_job_service_handoff_no_runtime_execution'
    workspaceId: string
    projectId: string
    approvedSnapshotId: string
    approvalRecordId: string
    queueReferenceJobId: string
    persistedJobId: string | null
    persistedJobBatchId: string | null
    persistedJobType: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE
    persistedJobPayloadKind: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_PAYLOAD_KIND
    jobServiceMode: 'local_mock_job_service' | 'service_role_job_service'
    routeIdempotencyKey: string
    queueIdempotencyKey: string
    invocationIdempotencyKey: string
    runtimeInvocationRoutePath: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH
    runtimeInvocationBodyAccepted: boolean
    runtimeRouteBodyAccepted: boolean
    externalAgentRuntimeHandoffReady: boolean
    localMockJobServiceWrite: boolean
    serviceRoleJobServiceWrite: boolean
    runtimeRouteInvocation: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
    mediaProcessing: false
    privateMediaProcessing: false
    userMediaProcessing: false
    workerDispatch: false
    workerExecution: false
    supabaseMutation: false | 'service_role_job_batch_and_job_insert_only'
    sqlExecution: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
  }
  safety: {
    routeHandlerInvocation: 'completed_guarded_persisted_job_runtime_handoff_handler' | 'not_run_blocked_before_persisted_handoff'
    persistentJobQueueWrite: false | 'completed_job_service_job_batch_and_job_handoff'
    serviceRoleWriteScope: false | 'job_batch_and_job_records_only'
    localMockJobServiceWrite: boolean
    runtimeRouteInvocation: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
    mediaProcessing: false
    privateMediaProcessing: false
    userMediaProcessing: false
    workerDispatch: false
    workerExecution: false
    workerProcessStart: false
    workerLeaseClaim: false
    ffmpegFfprobeExecution: false
    dockerExecution: false
    remotionExecution: false
    supabaseMutation: false | 'service_role_job_batch_and_job_insert_only'
    sqlExecution: false
    secretPayloadAccess: false
    serviceRoleSecretPayloadAccess: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
    externalBetaUnlock: false
    paidProductionUnlock: false
    productionUnlock: false
  }
  productReadyEndToEndLocalOssTools: 0
  nextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_NEXT_MILESTONE
}

export interface GstreamerMkvtoolnixPersistedJobRuntimeHandoffDependencies {
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

function expectedPersistedHandoffIdempotencyKey(
  input: Pick<
    GstreamerMkvtoolnixPersistedJobRuntimeHandoffInput,
    'workspaceId' | 'projectId' | 'approvedSnapshotId' | 'jobId' | 'queueId' | 'invocationId' | 'persistedHandoffId'
  >,
): string {
  return [
    'gstreamer-mkvtoolnix',
    'persisted-job-runtime-handoff-1',
    input.workspaceId,
    input.projectId,
    input.approvedSnapshotId,
    input.jobId,
    input.queueId,
    input.invocationId,
    input.persistedHandoffId,
  ].join(':')
}

export function buildGstreamerMkvtoolnixPersistedJobRuntimeHandoffInput(
  overrides: Partial<GstreamerMkvtoolnixPersistedJobRuntimeHandoffInput> = {},
): GstreamerMkvtoolnixPersistedJobRuntimeHandoffInput {
  const seed = buildGstreamerMkvtoolnixQueuedJobRuntimeRouteInvocationInput(overrides)
  const persistedHandoffId = overrides.persistedHandoffId ?? 'persisted-handoff-gstreamer-mkvtoolnix-generated-fixture-1'
  const routeIdempotencyKey = overrides.routeIdempotencyKey ?? expectedPersistedHandoffIdempotencyKey({
    ...seed,
    persistedHandoffId,
  })
  const queued = buildGstreamerMkvtoolnixQueuedJobRuntimeRouteInvocationInput({
    ...overrides,
    routeIdempotencyKey,
  })
  const base = {
    ...queued,
    persistedHandoffId,
    persistedJobHandoffMode: overrides.persistedJobHandoffMode ?? 'backend_job_service_handoff_no_runtime_execution',
    persistedJobWriteConfirmed: overrides.persistedJobWriteConfirmed ?? true,
    jobBatchName: overrides.jobBatchName ?? 'GStreamer MKVToolNix generated fixture runtime handoff',
    persistedJobWriteRequestedNow: overrides.persistedJobWriteRequestedNow ?? false,
    runtimeRouteInvocationRequestedNow: overrides.runtimeRouteInvocationRequestedNow ?? false,
  }

  return {
    ...base,
    queueIdempotencyKey: overrides.queueIdempotencyKey ?? queued.queueIdempotencyKey,
    invocationIdempotencyKey: overrides.invocationIdempotencyKey ?? queued.invocationIdempotencyKey,
    routeIdempotencyKey,
  }
}

export function validateGstreamerMkvtoolnixPersistedJobRuntimeHandoffInput(
  input: GstreamerMkvtoolnixPersistedJobRuntimeHandoffInput,
): GstreamerMkvtoolnixPersistedJobRuntimeHandoffStatus[] {
  const blockers: GstreamerMkvtoolnixPersistedJobRuntimeHandoffStatus[] = []

  if (!input.confirmation || !input.persistedJobWriteConfirmed) {
    pushOnce(blockers, 'blocked_missing_gstreamer_mkvtoolnix_persisted_job_runtime_handoff_confirmation')
  }
  for (const value of [
    input.workspaceId,
    input.projectId,
    input.approvedSnapshotId,
    input.approvalRecordId,
    input.creditOrNoSpendPolicyId,
    input.jobId,
    input.queueId,
    input.queueIdempotencyKey,
    input.routeIdempotencyKey,
    input.invocationId,
    input.invocationIdempotencyKey,
    input.persistedHandoffId,
    input.privateInputManifestId,
    input.outputManifestSchemaId,
    input.qaReportSchemaId,
  ]) {
    if (blank(value)) pushOnce(blockers, 'blocked_missing_gstreamer_mkvtoolnix_persisted_job_runtime_handoff_reference')
  }
  if (
    input.approvedSnapshotStatus !== 'approved' ||
    input.approvalRecordStatus !== 'approved' ||
    input.creditPolicyMode !== 'no_spend_generated_fixture_policy' ||
    input.fixtureScope !== 'generated_srt_and_generated_subtitle_only_mkv_fixture' ||
    input.persistedJobHandoffMode !== 'backend_job_service_handoff_no_runtime_execution' ||
    input.invocationMode !== 'queued_job_payload_to_existing_runtime_route_delegate'
  ) {
    pushOnce(blockers, 'blocked_invalid_gstreamer_mkvtoolnix_persisted_job_runtime_handoff_state')
  }
  if (input.routeIdempotencyKey !== expectedPersistedHandoffIdempotencyKey(input)) {
    pushOnce(blockers, 'blocked_invalid_gstreamer_mkvtoolnix_persisted_job_runtime_handoff_state')
  }
  if (
    input.persistedJobWriteRequestedNow ||
    input.runtimeRouteInvocationRequestedNow ||
    input.runtimeRouteExecutionRequestedNow ||
    input.workerDispatchRequestedNow ||
    input.workerExecutionRequestedNow ||
    input.workerProcessStartRequestedNow ||
    input.workerLeaseClaimRequestedNow ||
    input.gstreamerExecutionRequestedNow ||
    input.mkvtoolnixExecutionRequestedNow ||
    input.ffmpegFfprobeExecutionRequestedNow ||
    input.dockerExecutionRequestedNow ||
    input.remotionExecutionRequestedNow ||
    input.mediaProcessingRequestedNow ||
    input.privateMediaProcessingRequestedNow ||
    input.userMediaProcessingRequestedNow ||
    input.supabaseMutationRequestedNow ||
    input.sqlExecutionRequestedNow ||
    input.secretPayloadAccessRequestedNow ||
    input.serviceRoleSecretPayloadAccessRequestedNow ||
    input.signedUrlCreationRequestedNow ||
    input.publicArtifactRequestedNow ||
    input.finalRenderExportRequestedNow ||
    input.externalBetaUnlockRequestedNow ||
    input.paidProductionUnlockRequestedNow ||
    input.productionUnlockRequestedNow
  ) {
    pushOnce(blockers, 'blocked_unsafe_gstreamer_mkvtoolnix_persisted_job_runtime_handoff_request')
  }

  return blockers
}

function blockedResult(
  input: GstreamerMkvtoolnixPersistedJobRuntimeHandoffInput,
  status: GstreamerMkvtoolnixPersistedJobRuntimeHandoffStatus,
  blockers: GstreamerMkvtoolnixPersistedJobRuntimeHandoffStatus[],
): GstreamerMkvtoolnixPersistedJobRuntimeHandoffResult {
  return buildResult(input, false, status, blockers, [], undefined, undefined, false, false)
}

function buildResult(
  input: GstreamerMkvtoolnixPersistedJobRuntimeHandoffInput,
  ok: boolean,
  status: GstreamerMkvtoolnixPersistedJobRuntimeHandoffStatus,
  blockers: GstreamerMkvtoolnixPersistedJobRuntimeHandoffStatus[],
  warnings: string[],
  jobBatch: Record<string, unknown> | undefined,
  job: Record<string, unknown> | undefined,
  runtimeInvocationBodyAccepted: boolean,
  serviceRoleWrite: boolean,
): GstreamerMkvtoolnixPersistedJobRuntimeHandoffResult {
  const localMockWrite = Boolean(ok && !serviceRoleWrite)
  const jobBatchId = idOf(jobBatch)
  const jobId = idOf(job)
  return {
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_PACKET,
    decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_DECISION,
    execution: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_EXECUTION,
    ok,
    status,
    blockers,
    confirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_CONFIRM_ENV,
    queueHandoffConfirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_CONFIRM_ENV,
    queuedInvocationConfirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION_CONFIRM_ENV,
    runtimeRouteConfirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV,
    routePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_ROUTE_PATH,
    queueRoutePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_ROUTE_PATH,
    runtimeInvocationRoutePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH,
    runtimeRoutePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
    warnings,
    jobBatch,
    job,
    sanitizedHandoff: {
      persistedHandoffId: input.persistedHandoffId,
      persistedJobHandoffMode: 'backend_job_service_handoff_no_runtime_execution',
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedSnapshotId: input.approvedSnapshotId,
      approvalRecordId: input.approvalRecordId,
      queueReferenceJobId: input.jobId,
      persistedJobId: jobId,
      persistedJobBatchId: jobBatchId,
      persistedJobType: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE,
      persistedJobPayloadKind: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_PAYLOAD_KIND,
      jobServiceMode: serviceRoleWrite ? 'service_role_job_service' : 'local_mock_job_service',
      routeIdempotencyKey: input.routeIdempotencyKey,
      queueIdempotencyKey: input.queueIdempotencyKey,
      invocationIdempotencyKey: input.invocationIdempotencyKey,
      runtimeInvocationRoutePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH,
      runtimeInvocationBodyAccepted,
      runtimeRouteBodyAccepted: runtimeInvocationBodyAccepted,
      externalAgentRuntimeHandoffReady: ok,
      localMockJobServiceWrite: localMockWrite,
      serviceRoleJobServiceWrite: Boolean(ok && serviceRoleWrite),
      runtimeRouteInvocation: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
      mediaProcessing: false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      workerDispatch: false,
      workerExecution: false,
      supabaseMutation: ok && serviceRoleWrite ? 'service_role_job_batch_and_job_insert_only' : false,
      sqlExecution: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
    },
    safety: {
      routeHandlerInvocation: ok
        ? 'completed_guarded_persisted_job_runtime_handoff_handler'
        : 'not_run_blocked_before_persisted_handoff',
      persistentJobQueueWrite: ok ? 'completed_job_service_job_batch_and_job_handoff' : false,
      serviceRoleWriteScope: ok && serviceRoleWrite ? 'job_batch_and_job_records_only' : false,
      localMockJobServiceWrite: localMockWrite,
      runtimeRouteInvocation: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
      mediaProcessing: false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      workerDispatch: false,
      workerExecution: false,
      workerProcessStart: false,
      workerLeaseClaim: false,
      ffmpegFfprobeExecution: false,
      dockerExecution: false,
      remotionExecution: false,
      supabaseMutation: ok && serviceRoleWrite ? 'service_role_job_batch_and_job_insert_only' : false,
      sqlExecution: false,
      secretPayloadAccess: false,
      serviceRoleSecretPayloadAccess: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
      externalBetaUnlock: false,
      paidProductionUnlock: false,
      productionUnlock: false,
    },
    productReadyEndToEndLocalOssTools: 0,
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_NEXT_MILESTONE,
  }
}

export async function runGstreamerMkvtoolnixPersistedJobRuntimeHandoff(
  input: GstreamerMkvtoolnixPersistedJobRuntimeHandoffInput,
  context: ServiceContext,
  dependencies: GstreamerMkvtoolnixPersistedJobRuntimeHandoffDependencies = {},
): Promise<GstreamerMkvtoolnixPersistedJobRuntimeHandoffResult> {
  const env = dependencies.env ?? process.env
  const blockers = validateGstreamerMkvtoolnixPersistedJobRuntimeHandoffInput(input)
  if (env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_CONFIRM_ENV] !== 'true') {
    pushOnce(blockers, 'blocked_missing_gstreamer_mkvtoolnix_persisted_job_runtime_handoff_confirmation')
  }
  if (env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_CONFIRM_ENV] !== 'true') {
    pushOnce(blockers, 'blocked_missing_gstreamer_mkvtoolnix_persisted_job_runtime_handoff_confirmation')
  }
  if (blockers.length > 0) return blockedResult(input, blockers[0], blockers)

  const queueHandoff = runGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoff(input, {
    env: {
      ...env,
      [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_CONFIRM_ENV]: 'true',
    },
  })
  if (!queueHandoff.ok || !queueHandoff.queueItem) {
    return blockedResult(input, 'blocked_approved_snapshot_queue_handoff_failed', [
      'blocked_approved_snapshot_queue_handoff_failed',
    ])
  }

  const runtimeInvocationBody = buildGstreamerMkvtoolnixQueuedJobRuntimeRouteInvocationInput(input)
  if (!queueHandoff.sanitizedHandoff.runtimeRouteBody) {
    return blockedResult(input, 'blocked_missing_queue_payload_runtime_route_body', [
      'blocked_missing_queue_payload_runtime_route_body',
    ])
  }

  try {
    const jobService = createJobService(context)
    const batchResult = await jobService.createJobBatch({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedPlanSnapshotId: input.approvedSnapshotId,
      name: input.jobBatchName ?? 'GStreamer MKVToolNix generated fixture runtime handoff',
    })
    const batchId = idOf(batchResult.jobBatch)
    const jobResult = await jobService.createJob({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      jobType: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE,
      jobBatchId: batchId ?? undefined,
      approvedPlanSnapshotId: input.approvedSnapshotId,
      payloadJson: {
        persistedHandoffId: input.persistedHandoffId,
        packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_PACKET,
        persistedJobPayloadKind: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_PAYLOAD_KIND,
        runtimeInvocationRoutePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH,
        runtimeInvocationIdempotencyKey: input.routeIdempotencyKey,
        runtimeInvocationBody,
        queueHandoff: queueHandoff.sanitizedHandoff,
        safety: {
          privateMediaProcessing: false,
          userMediaProcessing: false,
          signedUrlCreation: false,
          publicArtifactCreation: false,
          finalRenderExport: false,
        },
      },
    })
    const warnings = [...batchResult.warnings, ...jobResult.warnings]
    const serviceRoleWrite = Boolean(!context.env.mockOnly && context.clients.admin)
    return buildResult(
      input,
      true,
      'completed_persisted_job_runtime_handoff',
      [],
      warnings,
      asRecord(batchResult.jobBatch),
      asRecord(jobResult.job),
      true,
      serviceRoleWrite,
    )
  } catch {
    return blockedResult(input, 'blocked_job_service_handoff_failed', ['blocked_job_service_handoff_failed'])
  }
}

export function summarizeGstreamerMkvtoolnixPersistedJobRuntimeHandoffBoundary(): string[] {
  return [
    'Creates a backend job-service handoff record for the approved generated-fixture GStreamer/MKVToolNix runtime route payload.',
    'The handoff stores the existing queued runtime invocation body for a future external agent route invocation; it does not execute GStreamer, MKVToolNix, Docker, workers, private media, Supabase SQL, signed URLs, public artifacts, or final export.',
    'The route requires explicit persisted handoff and queue handoff confirmation gates plus idempotency before job-service handoff can occur.',
    'In local/mock mode the existing job service returns mock job records; in service-role mode the scope is limited to job batch and job records only.',
  ]
}
