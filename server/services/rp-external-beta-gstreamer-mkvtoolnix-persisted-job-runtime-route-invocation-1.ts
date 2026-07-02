import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_CONFIRM_ENV,
} from './rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-approved-snapshot-job-queue-handoff-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH,
  buildGstreamerMkvtoolnixQueuedJobRuntimeRouteInvocationInput,
  runGstreamerMkvtoolnixQueuedJobRuntimeRouteInvocation,
  type GstreamerMkvtoolnixQueuedJobRuntimeRouteInvocationDependencies,
  type GstreamerMkvtoolnixQueuedJobRuntimeRouteInvocationInput,
  type GstreamerMkvtoolnixQueuedJobRuntimeRouteInvocationResult,
} from './rp-external-beta-gstreamer-mkvtoolnix-generated-fixture-queued-job-runtime-route-invocation-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV,
} from './rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_PACKET,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_PAYLOAD_KIND,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_ROUTE_PATH,
} from './rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1'

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_PACKET =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-PERSISTED-JOB-RUNTIME-ROUTE-INVOCATION-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_DECISION =
  'completed_gstreamer_mkvtoolnix_persisted_job_payload_to_runtime_route_invocation' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_EXECUTION =
  'completed_persisted_job_payload_to_existing_generated_fixture_runtime_route_delegate' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH =
  '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/persisted-invoke' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_NEXT_MILESTONE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-PERSISTED-JOB-RUNTIME-ROUTE-INVOCATION-QA-ROLLUP-1' as const

export type GstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationStatus =
  | 'completed_persisted_job_runtime_route_invocation'
  | 'blocked_missing_gstreamer_mkvtoolnix_persisted_job_runtime_route_invocation_confirmation'
  | 'blocked_missing_gstreamer_mkvtoolnix_persisted_job_runtime_route_invocation_reference'
  | 'blocked_invalid_gstreamer_mkvtoolnix_persisted_job_runtime_route_invocation_state'
  | 'blocked_unsafe_gstreamer_mkvtoolnix_persisted_job_runtime_route_invocation_request'
  | 'blocked_missing_persisted_job_runtime_invocation_payload'
  | 'blocked_runtime_route_invocation_delegate_failed'
  | 'blocked_runtime_route_invocation_delegate_safety_invalid'

export interface GstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationPayload {
  persistedHandoffId: string
  packet: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_PACKET | string
  persistedJobPayloadKind?: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_PAYLOAD_KIND | string
  runtimeInvocationRoutePath: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH | string
  runtimeInvocationIdempotencyKey: string
  runtimeInvocationBody: GstreamerMkvtoolnixQueuedJobRuntimeRouteInvocationInput
  queueHandoff?: Record<string, unknown>
  safety?: Record<string, unknown>
}

export interface GstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationInput {
  workspaceId: string
  projectId: string
  approvedSnapshotId: string
  persistedInvocationId: string
  persistedJobId: string
  persistedJobType: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE | string
  persistedJobPayloadMode: 'persisted_job_payload_to_existing_runtime_route_delegate' | string
  persistedJobPayloadJson: GstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationPayload
  persistedJobRuntimeRouteInvocationConfirmed: boolean
  routeIdempotencyKey: string
  workerDispatchRequestedNow?: boolean
  workerExecutionRequestedNow?: boolean
  workerProcessStartRequestedNow?: boolean
  workerLeaseClaimRequestedNow?: boolean
  persistentJobQueueWriteRequestedNow?: boolean
  privateMediaProcessingRequestedNow?: boolean
  userMediaProcessingRequestedNow?: boolean
  supabaseMutationRequestedNow?: boolean
  sqlExecutionRequestedNow?: boolean
  secretPayloadAccessRequestedNow?: boolean
  serviceRoleSecretPayloadAccessRequestedNow?: boolean
  signedUrlCreationRequestedNow?: boolean
  publicArtifactRequestedNow?: boolean
  finalRenderExportRequestedNow?: boolean
  externalBetaUnlockRequestedNow?: boolean
  paidProductionUnlockRequestedNow?: boolean
  productionUnlockRequestedNow?: boolean
}

export interface GstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationResult {
  packet: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_PACKET
  decision: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_DECISION
  execution: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_EXECUTION
  ok: boolean
  status: GstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationStatus
  blockers: GstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationStatus[]
  confirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_CONFIRM_ENV
  routePath: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH
  persistedHandoffRoutePath: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_ROUTE_PATH
  queuedRuntimeInvocationRoutePath: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH
  runtimeRouteInvocationResult?: GstreamerMkvtoolnixQueuedJobRuntimeRouteInvocationResult
  sanitizedInvocation: {
    persistedInvocationId: string
    persistedJobId: string
    persistedJobType: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE
    persistedJobPayloadMode: 'persisted_job_payload_to_existing_runtime_route_delegate'
    routeIdempotencyKey: string
    runtimeInvocationBodyAccepted: boolean
    runtimeInvocationId: string | null
    runtimeInvocationRoutePath: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH
    runtimeRouteRunnerRunId: string | null
    runtimeRouteRunnerOutputDir: string | null
    runtimeRouteRunnerArtifacts: Array<{ fileName: string; bytes: number; sha256: string }>
    runtimeRouteInvocation: 'completed_existing_guarded_runtime_route_delegate' | false
    gstreamerExecution: 'completed_controlled_generated_fixture_only' | false
    mkvtoolnixExecution: 'completed_controlled_generated_fixture_only' | false
    mediaProcessing: 'controlled_generated_fixture_only' | false
    privateMediaProcessing: false
    userMediaProcessing: false
    workerDispatch: false
    workerExecution: false
    persistentJobQueueWrite: false
    supabaseMutation: false
    sqlExecution: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
  }
  safety: {
    routeHandlerInvocation: 'completed_guarded_persisted_job_runtime_route_invocation_handler' | 'not_run_blocked_before_invocation'
    persistedJobPayloadRead: 'completed_local_payload_read_only' | false
    runtimeRouteInvocation: 'completed_existing_guarded_runtime_route_delegate' | false
    workerDispatch: false
    workerExecution: false
    workerProcessStart: false
    workerLeaseClaim: false
    persistentJobQueueWrite: false
    gstreamerExecution: 'completed_controlled_generated_fixture_only' | false
    mkvtoolnixExecution: 'completed_controlled_generated_fixture_only' | false
    mediaProcessing: 'controlled_generated_fixture_only' | false
    privateMediaProcessing: false
    userMediaProcessing: false
    ffmpegFfprobeExecution: false
    dockerExecution: 'completed_local_image_only_network_disabled_no_push_no_deploy' | false
    dockerPushDeploy: false
    remotionExecution: false
    supabaseMutation: false
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
  nextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_NEXT_MILESTONE
}

export type GstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationDependencies =
  GstreamerMkvtoolnixQueuedJobRuntimeRouteInvocationDependencies

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function blank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function expectedRouteIdempotencyKey(
  input: Pick<
    GstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationInput,
    'persistedInvocationId' | 'persistedJobId' | 'persistedJobPayloadJson'
  >,
): string {
  const runtimeBody = input.persistedJobPayloadJson.runtimeInvocationBody
  return [
    'gstreamer-mkvtoolnix',
    'persisted-job-runtime-route-invocation-1',
    runtimeBody.workspaceId,
    runtimeBody.projectId,
    runtimeBody.approvedSnapshotId,
    input.persistedJobId,
    input.persistedInvocationId,
    input.persistedJobPayloadJson.runtimeInvocationIdempotencyKey,
  ].join(':')
}

export function buildGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationInput(
  overrides: Partial<GstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationInput> = {},
): GstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationInput {
  const runtimeInvocationBody = buildGstreamerMkvtoolnixQueuedJobRuntimeRouteInvocationInput(
    overrides.persistedJobPayloadJson?.runtimeInvocationBody,
  )
  const persistedJobPayloadJson = overrides.persistedJobPayloadJson ?? {
    persistedHandoffId: 'persisted-handoff-gstreamer-mkvtoolnix-generated-fixture-1',
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_PACKET,
    persistedJobPayloadKind: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_PAYLOAD_KIND,
    runtimeInvocationRoutePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH,
    runtimeInvocationIdempotencyKey: runtimeInvocationBody.routeIdempotencyKey,
    runtimeInvocationBody,
    safety: {
      privateMediaProcessing: false,
      userMediaProcessing: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
    },
  }
  const runtimeBody = persistedJobPayloadJson.runtimeInvocationBody
  const base = {
    workspaceId: overrides.workspaceId ?? runtimeBody.workspaceId,
    projectId: overrides.projectId ?? runtimeBody.projectId,
    approvedSnapshotId: overrides.approvedSnapshotId ?? runtimeBody.approvedSnapshotId,
    persistedInvocationId: overrides.persistedInvocationId ?? 'persisted-runtime-invocation-gstreamer-mkvtoolnix-generated-fixture-1',
    persistedJobId: overrides.persistedJobId ?? 'job-persisted-gstreamer-mkvtoolnix-generated-fixture-runtime-1',
    persistedJobType: overrides.persistedJobType ?? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE,
    persistedJobPayloadMode: overrides.persistedJobPayloadMode ?? 'persisted_job_payload_to_existing_runtime_route_delegate',
    persistedJobPayloadJson,
    persistedJobRuntimeRouteInvocationConfirmed: overrides.persistedJobRuntimeRouteInvocationConfirmed ?? true,
    workerDispatchRequestedNow: overrides.workerDispatchRequestedNow ?? false,
    workerExecutionRequestedNow: overrides.workerExecutionRequestedNow ?? false,
    workerProcessStartRequestedNow: overrides.workerProcessStartRequestedNow ?? false,
    workerLeaseClaimRequestedNow: overrides.workerLeaseClaimRequestedNow ?? false,
    persistentJobQueueWriteRequestedNow: overrides.persistentJobQueueWriteRequestedNow ?? false,
    privateMediaProcessingRequestedNow: overrides.privateMediaProcessingRequestedNow ?? false,
    userMediaProcessingRequestedNow: overrides.userMediaProcessingRequestedNow ?? false,
    supabaseMutationRequestedNow: overrides.supabaseMutationRequestedNow ?? false,
    sqlExecutionRequestedNow: overrides.sqlExecutionRequestedNow ?? false,
    secretPayloadAccessRequestedNow: overrides.secretPayloadAccessRequestedNow ?? false,
    serviceRoleSecretPayloadAccessRequestedNow: overrides.serviceRoleSecretPayloadAccessRequestedNow ?? false,
    signedUrlCreationRequestedNow: overrides.signedUrlCreationRequestedNow ?? false,
    publicArtifactRequestedNow: overrides.publicArtifactRequestedNow ?? false,
    finalRenderExportRequestedNow: overrides.finalRenderExportRequestedNow ?? false,
    externalBetaUnlockRequestedNow: overrides.externalBetaUnlockRequestedNow ?? false,
    paidProductionUnlockRequestedNow: overrides.paidProductionUnlockRequestedNow ?? false,
    productionUnlockRequestedNow: overrides.productionUnlockRequestedNow ?? false,
  }
  return {
    ...base,
    routeIdempotencyKey: overrides.routeIdempotencyKey ?? expectedRouteIdempotencyKey(base),
  }
}

export function validateGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationInput(
  input: GstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationInput,
): GstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationStatus[] {
  const blockers: GstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationStatus[] = []
  const payload = input.persistedJobPayloadJson
  const runtimeBody = payload?.runtimeInvocationBody

  if (!input.persistedJobRuntimeRouteInvocationConfirmed) {
    pushOnce(blockers, 'blocked_missing_gstreamer_mkvtoolnix_persisted_job_runtime_route_invocation_confirmation')
  }
  for (const value of [
    input.workspaceId,
    input.projectId,
    input.approvedSnapshotId,
    input.persistedInvocationId,
    input.persistedJobId,
    input.routeIdempotencyKey,
  ]) {
    if (blank(value)) pushOnce(blockers, 'blocked_missing_gstreamer_mkvtoolnix_persisted_job_runtime_route_invocation_reference')
  }
  if (!payload || !runtimeBody) {
    pushOnce(blockers, 'blocked_missing_persisted_job_runtime_invocation_payload')
  }
  if (
    input.persistedJobType !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE ||
    input.persistedJobPayloadMode !== 'persisted_job_payload_to_existing_runtime_route_delegate' ||
    payload?.packet !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_PACKET ||
    payload?.persistedJobPayloadKind !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_PAYLOAD_KIND ||
    payload?.runtimeInvocationRoutePath !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH ||
    runtimeBody?.invocationMode !== 'queued_job_payload_to_existing_runtime_route_delegate' ||
    runtimeBody?.workspaceId !== input.workspaceId ||
    runtimeBody?.projectId !== input.projectId ||
    runtimeBody?.approvedSnapshotId !== input.approvedSnapshotId
  ) {
    pushOnce(blockers, 'blocked_invalid_gstreamer_mkvtoolnix_persisted_job_runtime_route_invocation_state')
  }
  if (payload && runtimeBody && input.routeIdempotencyKey !== expectedRouteIdempotencyKey(input)) {
    pushOnce(blockers, 'blocked_invalid_gstreamer_mkvtoolnix_persisted_job_runtime_route_invocation_state')
  }
  if (
    input.workerDispatchRequestedNow ||
    input.workerExecutionRequestedNow ||
    input.workerProcessStartRequestedNow ||
    input.workerLeaseClaimRequestedNow ||
    input.persistentJobQueueWriteRequestedNow ||
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
    pushOnce(blockers, 'blocked_unsafe_gstreamer_mkvtoolnix_persisted_job_runtime_route_invocation_request')
  }
  return blockers
}

function delegateSafetyValid(result: GstreamerMkvtoolnixQueuedJobRuntimeRouteInvocationResult): boolean {
  return (
    result.ok &&
    result.safety.runtimeRouteInvocation === 'completed_existing_guarded_runtime_route_delegate' &&
    result.safety.workerDispatch === false &&
    result.safety.workerExecution === false &&
    result.safety.persistentJobQueueWrite === false &&
    result.safety.gstreamerExecution === 'completed_controlled_generated_fixture_only' &&
    result.safety.mkvtoolnixExecution === 'completed_controlled_generated_fixture_only' &&
    result.safety.mediaProcessing === 'controlled_generated_fixture_only' &&
    result.safety.privateMediaProcessing === false &&
    result.safety.userMediaProcessing === false &&
    result.safety.ffmpegFfprobeExecution === false &&
    result.safety.supabaseMutation === false &&
    result.safety.sqlExecution === false &&
    result.safety.signedUrlCreation === false &&
    result.safety.publicArtifactCreation === false &&
    result.safety.finalRenderExport === false &&
    result.productReadyEndToEndLocalOssTools === 0
  )
}

function buildResult(
  input: GstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationInput,
  ok: boolean,
  status: GstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationStatus,
  blockers: GstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationStatus[],
  runtimeRouteInvocationResult?: GstreamerMkvtoolnixQueuedJobRuntimeRouteInvocationResult,
): GstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationResult {
  const runtimeCompleted = Boolean(ok && runtimeRouteInvocationResult?.ok)
  const artifacts = runtimeRouteInvocationResult?.sanitizedInvocation.runtimeRouteRunnerArtifacts ?? []
  return {
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_PACKET,
    decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_DECISION,
    execution: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_EXECUTION,
    ok,
    status,
    blockers,
    confirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_CONFIRM_ENV,
    routePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH,
    persistedHandoffRoutePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_ROUTE_PATH,
    queuedRuntimeInvocationRoutePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH,
    runtimeRouteInvocationResult,
    sanitizedInvocation: {
      persistedInvocationId: input.persistedInvocationId,
      persistedJobId: input.persistedJobId,
      persistedJobType: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE,
      persistedJobPayloadMode: 'persisted_job_payload_to_existing_runtime_route_delegate',
      routeIdempotencyKey: input.routeIdempotencyKey,
      runtimeInvocationBodyAccepted: Boolean(input.persistedJobPayloadJson.runtimeInvocationBody),
      runtimeInvocationId: input.persistedJobPayloadJson.runtimeInvocationBody?.invocationId ?? null,
      runtimeInvocationRoutePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH,
      runtimeRouteRunnerRunId: runtimeRouteInvocationResult?.sanitizedInvocation.runtimeRouteRunnerRunId ?? null,
      runtimeRouteRunnerOutputDir: runtimeRouteInvocationResult?.sanitizedInvocation.runtimeRouteRunnerOutputDir ?? null,
      runtimeRouteRunnerArtifacts: artifacts,
      runtimeRouteInvocation: runtimeCompleted ? 'completed_existing_guarded_runtime_route_delegate' : false,
      gstreamerExecution: runtimeCompleted ? 'completed_controlled_generated_fixture_only' : false,
      mkvtoolnixExecution: runtimeCompleted ? 'completed_controlled_generated_fixture_only' : false,
      mediaProcessing: runtimeCompleted ? 'controlled_generated_fixture_only' : false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      workerDispatch: false,
      workerExecution: false,
      persistentJobQueueWrite: false,
      supabaseMutation: false,
      sqlExecution: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
    },
    safety: {
      routeHandlerInvocation: ok
        ? 'completed_guarded_persisted_job_runtime_route_invocation_handler'
        : 'not_run_blocked_before_invocation',
      persistedJobPayloadRead: ok ? 'completed_local_payload_read_only' : false,
      runtimeRouteInvocation: runtimeCompleted ? 'completed_existing_guarded_runtime_route_delegate' : false,
      workerDispatch: false,
      workerExecution: false,
      workerProcessStart: false,
      workerLeaseClaim: false,
      persistentJobQueueWrite: false,
      gstreamerExecution: runtimeCompleted ? 'completed_controlled_generated_fixture_only' : false,
      mkvtoolnixExecution: runtimeCompleted ? 'completed_controlled_generated_fixture_only' : false,
      mediaProcessing: runtimeCompleted ? 'controlled_generated_fixture_only' : false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      ffmpegFfprobeExecution: false,
      dockerExecution: runtimeCompleted ? 'completed_local_image_only_network_disabled_no_push_no_deploy' : false,
      dockerPushDeploy: false,
      remotionExecution: false,
      supabaseMutation: false,
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
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_NEXT_MILESTONE,
  }
}

export async function runGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocation(
  input: GstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationInput,
  dependencies: GstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationDependencies = {},
): Promise<GstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationResult> {
  const blockers = validateGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationInput(input)
  const env = dependencies.env ?? process.env
  if (env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_CONFIRM_ENV] !== 'true') {
    pushOnce(blockers, 'blocked_missing_gstreamer_mkvtoolnix_persisted_job_runtime_route_invocation_confirmation')
  }
  if (env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_QUEUED_JOB_RUNTIME_ROUTE_INVOCATION_CONFIRM_ENV] !== 'true') {
    pushOnce(blockers, 'blocked_missing_gstreamer_mkvtoolnix_persisted_job_runtime_route_invocation_confirmation')
  }
  if (env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_CONFIRM_ENV] !== 'true') {
    pushOnce(blockers, 'blocked_missing_gstreamer_mkvtoolnix_persisted_job_runtime_route_invocation_confirmation')
  }
  if (env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV] !== 'true') {
    pushOnce(blockers, 'blocked_missing_gstreamer_mkvtoolnix_persisted_job_runtime_route_invocation_confirmation')
  }
  if (blockers.length > 0) return buildResult(input, false, blockers[0], blockers)

  const runtimeBody = input.persistedJobPayloadJson.runtimeInvocationBody
  if (!runtimeBody.invocationId) {
    return buildResult(input, false, 'blocked_missing_persisted_job_runtime_invocation_payload', [
      'blocked_missing_persisted_job_runtime_invocation_payload',
    ])
  }

  const delegated = await runGstreamerMkvtoolnixQueuedJobRuntimeRouteInvocation(
    runtimeBody,
    dependencies,
  )
  if (!delegated.ok) {
    return buildResult(input, false, 'blocked_runtime_route_invocation_delegate_failed', [
      'blocked_runtime_route_invocation_delegate_failed',
    ], delegated)
  }
  if (!delegateSafetyValid(delegated)) {
    return buildResult(input, false, 'blocked_runtime_route_invocation_delegate_safety_invalid', [
      'blocked_runtime_route_invocation_delegate_safety_invalid',
    ], delegated)
  }

  return buildResult(input, true, 'completed_persisted_job_runtime_route_invocation', [], delegated)
}

export function summarizeGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationBoundary(): string[] {
  return [
    'Consumes an already-created persisted generated-fixture job payload with an approved-snapshot reference and delegates its stored runtime invocation body to the existing queued runtime invocation service.',
    'Requires persisted route invocation, queued invocation, queue handoff, and runtime bridge confirmation gates before the controlled generated-fixture runtime delegate can run.',
    'The route rejects raw job execution controls, broad worker dispatch, Supabase mutation requests, SQL, private/user media, signed/public artifacts, final export, and production unlock requests.',
    'Runtime execution remains limited to the existing controlled generated SRT/subtitle-only MKV fixture path.',
  ]
}
