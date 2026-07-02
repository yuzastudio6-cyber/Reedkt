import type { ServiceContext } from '../types'
import { createWorkerClaimService } from './worker-claim-service'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_PACKET,
} from './rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH,
  buildGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationInput,
  validateGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationInput,
  type GstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationPayload,
} from './rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-route-invocation-1'

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_PACKET =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-PERSISTED-JOB-WORKER-DISPATCH-CLAIM-LEASE-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_DECISION =
  'completed_gstreamer_mkvtoolnix_persisted_job_worker_claim_lease_boundary' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_EXECUTION =
  'completed_local_mock_worker_claim_lease_no_worker_execution_or_tool_execution' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_REMOTE_WORKER_CLAIM_LEASE_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_REMOTE_WORKER_CLAIM_LEASE' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_ROUTE_PATH =
  '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/persisted-claim-lease' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_NEXT_MILESTONE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-REMOTE-WORKER-CLAIM-LEASE-OWNER-GATE-1' as const

export type GstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseStatus =
  | 'completed_persisted_job_worker_claim_lease_boundary'
  | 'blocked_missing_gstreamer_mkvtoolnix_persisted_job_worker_claim_lease_confirmation'
  | 'blocked_missing_gstreamer_mkvtoolnix_remote_worker_claim_lease_confirmation'
  | 'blocked_missing_gstreamer_mkvtoolnix_persisted_job_worker_claim_lease_reference'
  | 'blocked_invalid_gstreamer_mkvtoolnix_persisted_job_worker_claim_lease_state'
  | 'blocked_missing_persisted_job_worker_claim_lease_payload'
  | 'blocked_unsafe_gstreamer_mkvtoolnix_persisted_job_worker_claim_lease_request'
  | 'blocked_remote_worker_claim_requires_separate_owner_confirmation'
  | 'blocked_worker_claim_lease_service_failed'

export type GstreamerMkvtoolnixPersistedJobWorkerClaimLeaseMode =
  | 'local_mock_claim_lease_no_worker_execution'
  | 'remote_supabase_worker_claim_lease_no_worker_execution'

export interface GstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput {
  workspaceId: string
  projectId: string
  approvedSnapshotId: string
  persistedInvocationId: string
  persistedJobId: string
  persistedJobType: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE | string
  persistedJobPayloadMode: 'persisted_job_payload_to_worker_claim_lease' | string
  persistedJobPayloadJson: GstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationPayload
  persistedJobWorkerClaimLeaseConfirmed: boolean
  remoteWorkerClaimLeaseConfirmed?: boolean
  workerType: 'gstreamer_mkvtoolnix_generated_fixture_worker' | string
  workerInstanceId: string
  leaseExpiresAt: string
  claimLeaseMode: GstreamerMkvtoolnixPersistedJobWorkerClaimLeaseMode | string
  routeIdempotencyKey: string
  routeExecutionRequestedNow?: boolean
  workerDispatchRequestedNow?: boolean
  workerExecutionRequestedNow?: boolean
  workerProcessStartRequestedNow?: boolean
  persistentJobQueueWriteRequestedNow?: boolean
  privateMediaProcessingRequestedNow?: boolean
  userMediaProcessingRequestedNow?: boolean
  gstreamerExecutionRequestedNow?: boolean
  mkvtoolnixExecutionRequestedNow?: boolean
  ffmpegFfprobeExecutionRequestedNow?: boolean
  dockerExecutionRequestedNow?: boolean
  remotionExecutionRequestedNow?: boolean
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

export interface GstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseResult {
  packet: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_PACKET
  decision: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_DECISION
  execution: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_EXECUTION
  ok: boolean
  status: GstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseStatus
  blockers: GstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseStatus[]
  confirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_CONFIRM_ENV
  routePath: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_ROUTE_PATH
  persistedRuntimeRouteInvocationRoutePath: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH
  claim?: unknown
  warnings: string[]
  sanitizedClaimLease: {
    workspaceId: string
    projectId: string
    approvedSnapshotId: string
    persistedInvocationId: string
    persistedJobId: string
    persistedJobType: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE
    persistedJobPayloadMode: 'persisted_job_payload_to_worker_claim_lease'
    workerType: 'gstreamer_mkvtoolnix_generated_fixture_worker'
    workerInstanceId: string
    leaseExpiresAt: string
    routeIdempotencyKey: string
    persistedPayloadAccepted: boolean
    runtimeInvocationBodyAccepted: boolean
    claimLeaseMode: GstreamerMkvtoolnixPersistedJobWorkerClaimLeaseMode | string
    workerLeaseClaim: 'completed_local_mock_claim_only' | 'completed_remote_worker_claim_only' | false
    workerDispatch: false
    workerExecution: false
    workerProcessStart: false
    persistentJobQueueWrite: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
    mediaProcessing: false
    privateMediaProcessing: false
    userMediaProcessing: false
    supabaseMutation: 'worker_claim_lease_only' | false
    sqlExecution: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
  }
  safety: {
    routeHandlerInvocation: 'completed_guarded_persisted_job_worker_claim_lease_handler' | 'not_run_blocked_before_claim'
    localMockWorkerLeaseClaim: 'completed' | false
    remoteWorkerClaim: 'completed' | false
    workerDispatch: false
    workerExecution: false
    workerProcessStart: false
    persistentJobQueueWrite: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
    mediaProcessing: false
    privateMediaProcessing: false
    userMediaProcessing: false
    ffmpegFfprobeExecution: false
    dockerExecution: false
    dockerPushDeploy: false
    remotionExecution: false
    supabaseMutation: 'worker_claim_lease_only' | false
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
  nextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_NEXT_MILESTONE
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function blank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function expectedRouteIdempotencyKey(
  input: Pick<
    GstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput,
    'workspaceId' | 'projectId' | 'approvedSnapshotId' | 'persistedJobId' | 'persistedInvocationId' | 'workerInstanceId'
  >,
): string {
  return [
    'gstreamer-mkvtoolnix',
    'persisted-job-worker-dispatch-claim-lease-1',
    input.workspaceId,
    input.projectId,
    input.approvedSnapshotId,
    input.persistedJobId,
    input.persistedInvocationId,
    input.workerInstanceId,
  ].join(':')
}

export function buildGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput(
  overrides: Partial<GstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput> = {},
): GstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput {
  const persistedRouteInvocation = buildGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationInput(
    overrides.persistedJobPayloadJson
      ? {
          persistedJobPayloadJson: overrides.persistedJobPayloadJson,
          persistedInvocationId: overrides.persistedInvocationId,
          persistedJobId: overrides.persistedJobId,
        }
      : {},
  )
  const base = {
    workspaceId: overrides.workspaceId ?? persistedRouteInvocation.workspaceId,
    projectId: overrides.projectId ?? persistedRouteInvocation.projectId,
    approvedSnapshotId: overrides.approvedSnapshotId ?? persistedRouteInvocation.approvedSnapshotId,
    persistedInvocationId: overrides.persistedInvocationId ?? persistedRouteInvocation.persistedInvocationId,
    persistedJobId: overrides.persistedJobId ?? persistedRouteInvocation.persistedJobId,
    persistedJobType: overrides.persistedJobType ?? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE,
    persistedJobPayloadMode: overrides.persistedJobPayloadMode ?? 'persisted_job_payload_to_worker_claim_lease',
    persistedJobPayloadJson: overrides.persistedJobPayloadJson ?? persistedRouteInvocation.persistedJobPayloadJson,
    persistedJobWorkerClaimLeaseConfirmed: overrides.persistedJobWorkerClaimLeaseConfirmed ?? true,
    remoteWorkerClaimLeaseConfirmed: overrides.remoteWorkerClaimLeaseConfirmed ?? false,
    workerType: overrides.workerType ?? 'gstreamer_mkvtoolnix_generated_fixture_worker',
    workerInstanceId: overrides.workerInstanceId ?? 'local-gstreamer-mkvtoolnix-generated-fixture-worker-1',
    leaseExpiresAt: overrides.leaseExpiresAt ?? '2026-07-02T13:45:00.000Z',
    claimLeaseMode: overrides.claimLeaseMode ?? 'local_mock_claim_lease_no_worker_execution',
    routeExecutionRequestedNow: overrides.routeExecutionRequestedNow ?? false,
    workerDispatchRequestedNow: overrides.workerDispatchRequestedNow ?? false,
    workerExecutionRequestedNow: overrides.workerExecutionRequestedNow ?? false,
    workerProcessStartRequestedNow: overrides.workerProcessStartRequestedNow ?? false,
    persistentJobQueueWriteRequestedNow: overrides.persistentJobQueueWriteRequestedNow ?? false,
    privateMediaProcessingRequestedNow: overrides.privateMediaProcessingRequestedNow ?? false,
    userMediaProcessingRequestedNow: overrides.userMediaProcessingRequestedNow ?? false,
    gstreamerExecutionRequestedNow: overrides.gstreamerExecutionRequestedNow ?? false,
    mkvtoolnixExecutionRequestedNow: overrides.mkvtoolnixExecutionRequestedNow ?? false,
    ffmpegFfprobeExecutionRequestedNow: overrides.ffmpegFfprobeExecutionRequestedNow ?? false,
    dockerExecutionRequestedNow: overrides.dockerExecutionRequestedNow ?? false,
    remotionExecutionRequestedNow: overrides.remotionExecutionRequestedNow ?? false,
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

export function validateGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput(
  input: GstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput,
): GstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseStatus[] {
  const blockers: GstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseStatus[] = []
  const payload = input.persistedJobPayloadJson
  const runtimeBody = payload?.runtimeInvocationBody

  if (!input.persistedJobWorkerClaimLeaseConfirmed) {
    pushOnce(blockers, 'blocked_missing_gstreamer_mkvtoolnix_persisted_job_worker_claim_lease_confirmation')
  }
  for (const value of [
    input.workspaceId,
    input.projectId,
    input.approvedSnapshotId,
    input.persistedInvocationId,
    input.persistedJobId,
    input.workerType,
    input.workerInstanceId,
    input.leaseExpiresAt,
    input.routeIdempotencyKey,
  ]) {
    if (blank(value)) pushOnce(blockers, 'blocked_missing_gstreamer_mkvtoolnix_persisted_job_worker_claim_lease_reference')
  }
  if (!payload || !runtimeBody) {
    pushOnce(blockers, 'blocked_missing_persisted_job_worker_claim_lease_payload')
  }
  if (
    input.persistedJobType !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE ||
    input.persistedJobPayloadMode !== 'persisted_job_payload_to_worker_claim_lease' ||
    input.workerType !== 'gstreamer_mkvtoolnix_generated_fixture_worker' ||
    ![
      'local_mock_claim_lease_no_worker_execution',
      'remote_supabase_worker_claim_lease_no_worker_execution',
    ].includes(input.claimLeaseMode) ||
    payload?.packet !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_PACKET ||
    payload?.runtimeInvocationRoutePath !== '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/invoke' ||
    runtimeBody?.workspaceId !== input.workspaceId ||
    runtimeBody?.projectId !== input.projectId ||
    runtimeBody?.approvedSnapshotId !== input.approvedSnapshotId ||
    validateGstreamerMkvtoolnixPersistedJobRuntimeRouteInvocationInput({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedSnapshotId: input.approvedSnapshotId,
      persistedInvocationId: input.persistedInvocationId,
      persistedJobId: input.persistedJobId,
      persistedJobType: input.persistedJobType,
      persistedJobPayloadMode: 'persisted_job_payload_to_existing_runtime_route_delegate',
      persistedJobPayloadJson: payload,
      persistedJobRuntimeRouteInvocationConfirmed: true,
      routeIdempotencyKey: [
        'gstreamer-mkvtoolnix',
        'persisted-job-runtime-route-invocation-1',
        input.workspaceId,
        input.projectId,
        input.approvedSnapshotId,
        input.persistedJobId,
        input.persistedInvocationId,
        payload?.runtimeInvocationIdempotencyKey ?? '',
      ].join(':'),
    }).length > 0
  ) {
    pushOnce(blockers, 'blocked_invalid_gstreamer_mkvtoolnix_persisted_job_worker_claim_lease_state')
  }
  if (input.routeIdempotencyKey !== expectedRouteIdempotencyKey(input)) {
    pushOnce(blockers, 'blocked_invalid_gstreamer_mkvtoolnix_persisted_job_worker_claim_lease_state')
  }
  if (
    input.routeExecutionRequestedNow ||
    input.workerDispatchRequestedNow ||
    input.workerExecutionRequestedNow ||
    input.workerProcessStartRequestedNow ||
    input.persistentJobQueueWriteRequestedNow ||
    input.privateMediaProcessingRequestedNow ||
    input.userMediaProcessingRequestedNow ||
    input.gstreamerExecutionRequestedNow ||
    input.mkvtoolnixExecutionRequestedNow ||
    input.ffmpegFfprobeExecutionRequestedNow ||
    input.dockerExecutionRequestedNow ||
    input.remotionExecutionRequestedNow ||
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
    pushOnce(blockers, 'blocked_unsafe_gstreamer_mkvtoolnix_persisted_job_worker_claim_lease_request')
  }
  return blockers
}

function buildResult(
  input: GstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput,
  ok: boolean,
  status: GstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseStatus,
  blockers: GstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseStatus[],
  claim?: unknown,
  warnings: string[] = [],
): GstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseResult {
  const remoteClaimMode = input.claimLeaseMode === 'remote_supabase_worker_claim_lease_no_worker_execution'
  const completedLocalClaim = ok && !remoteClaimMode
  const completedRemoteClaim = ok && remoteClaimMode
  return {
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_PACKET,
    decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_DECISION,
    execution: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_EXECUTION,
    ok,
    status,
    blockers,
    confirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_CONFIRM_ENV,
    routePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_ROUTE_PATH,
    persistedRuntimeRouteInvocationRoutePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_ROUTE_INVOCATION_ROUTE_PATH,
    claim,
    warnings,
    sanitizedClaimLease: {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedSnapshotId: input.approvedSnapshotId,
      persistedInvocationId: input.persistedInvocationId,
      persistedJobId: input.persistedJobId,
      persistedJobType: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE,
      persistedJobPayloadMode: 'persisted_job_payload_to_worker_claim_lease',
      workerType: 'gstreamer_mkvtoolnix_generated_fixture_worker',
      workerInstanceId: input.workerInstanceId,
      leaseExpiresAt: input.leaseExpiresAt,
      routeIdempotencyKey: input.routeIdempotencyKey,
      persistedPayloadAccepted: ok,
      runtimeInvocationBodyAccepted: ok,
      claimLeaseMode: input.claimLeaseMode,
      workerLeaseClaim: completedRemoteClaim
        ? 'completed_remote_worker_claim_only'
        : completedLocalClaim
          ? 'completed_local_mock_claim_only'
          : false,
      workerDispatch: false,
      workerExecution: false,
      workerProcessStart: false,
      persistentJobQueueWrite: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
      mediaProcessing: false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      supabaseMutation: completedRemoteClaim ? 'worker_claim_lease_only' : false,
      sqlExecution: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
    },
    safety: {
      routeHandlerInvocation: ok ? 'completed_guarded_persisted_job_worker_claim_lease_handler' : 'not_run_blocked_before_claim',
      localMockWorkerLeaseClaim: completedLocalClaim ? 'completed' : false,
      remoteWorkerClaim: completedRemoteClaim ? 'completed' : false,
      workerDispatch: false,
      workerExecution: false,
      workerProcessStart: false,
      persistentJobQueueWrite: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
      mediaProcessing: false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      ffmpegFfprobeExecution: false,
      dockerExecution: false,
      dockerPushDeploy: false,
      remotionExecution: false,
      supabaseMutation: completedRemoteClaim ? 'worker_claim_lease_only' : false,
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
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_NEXT_MILESTONE,
  }
}

export async function runGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLease(
  input: GstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput,
  context: ServiceContext,
  env: NodeJS.ProcessEnv = process.env,
): Promise<GstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseResult> {
  const blockers = validateGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput(input)
  const remoteClaimMode = input.claimLeaseMode === 'remote_supabase_worker_claim_lease_no_worker_execution'
  const hasRemoteAdminContext = Boolean(context.clients.admin && !context.env.mockOnly)

  if (env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_CONFIRM_ENV] !== 'true') {
    pushOnce(blockers, 'blocked_missing_gstreamer_mkvtoolnix_persisted_job_worker_claim_lease_confirmation')
  }
  if (remoteClaimMode) {
    if (
      !input.remoteWorkerClaimLeaseConfirmed ||
      env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_REMOTE_WORKER_CLAIM_LEASE_CONFIRM_ENV] !== 'true'
    ) {
      pushOnce(blockers, 'blocked_missing_gstreamer_mkvtoolnix_remote_worker_claim_lease_confirmation')
    }
    if (!hasRemoteAdminContext) {
      pushOnce(blockers, 'blocked_remote_worker_claim_requires_separate_owner_confirmation')
    }
  } else if (hasRemoteAdminContext) {
    pushOnce(blockers, 'blocked_remote_worker_claim_requires_separate_owner_confirmation')
  }
  if (blockers.length > 0) {
    return buildResult(input, false, blockers[0] ?? 'blocked_invalid_gstreamer_mkvtoolnix_persisted_job_worker_claim_lease_state', blockers)
  }

  try {
    const result = await createWorkerClaimService(context).claimJob({
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      jobId: input.persistedJobId,
      workerType: input.workerType,
      workerInstanceId: input.workerInstanceId,
      leaseExpiresAt: input.leaseExpiresAt,
      idempotencyKey: input.routeIdempotencyKey,
    })
    return buildResult(input, true, 'completed_persisted_job_worker_claim_lease_boundary', [], result.claim, result.warnings)
  } catch {
    return buildResult(input, false, 'blocked_worker_claim_lease_service_failed', [
      'blocked_worker_claim_lease_service_failed',
    ])
  }
}

export function summarizeGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseBoundary(): string[] {
  return [
    'Consumes the persisted generated-fixture job payload and validates a local/mock worker lease claim boundary.',
    'Requires REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE=true before claim-lease validation runs.',
    'Remote Supabase worker-claim mutation is limited to claimLeaseMode=remote_supabase_worker_claim_lease_no_worker_execution and requires REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_REMOTE_WORKER_CLAIM_LEASE=true plus payload confirmation.',
    'Does not dispatch or execute a worker, run GStreamer/MKVToolNix, process private/user media, create public artifacts, or unlock beta/production/final export.',
  ]
}
