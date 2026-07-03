import type { ServiceContext } from '../types'
import { createWorkerClaimService } from './worker-claim-service'
import {
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_PACKET,
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_PAYLOAD_KIND,
} from './tracka-three-tool-external-agent-persisted-job-runtime-handoff-1'
import {
  TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_ROUTE_PATH,
  buildThreeToolExternalAgentPersistedJobRouteInvocationInput,
  type ThreeToolExternalAgentPersistedJobPayload,
} from './tracka-three-tool-external-agent-persisted-job-route-invocation-1'

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_PACKET =
  'TRACKA-THREE-TOOL-EXTERNAL-AGENT-WORKER-DISPATCH-CLAIM-LEASE-1' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_DECISION =
  'completed_three_tool_external_agent_local_mock_worker_claim_lease_boundary' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_EXECUTION =
  'completed_local_mock_worker_claim_lease_no_worker_execution_or_tool_execution' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_ROUTE_PATH =
  '/v1/external-beta/tracka/three-tool/generated-fixture-runtime/approved-snapshot/jobs/persisted-claim-lease' as const

export const TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_NEXT_MILESTONE =
  'TRACKA-THREE-TOOL-EXTERNAL-AGENT-WORKER-PROCESS-APPROVED-SNAPSHOT-EXECUTION-1' as const

export type ThreeToolExternalAgentWorkerDispatchClaimLeaseStatus =
  | 'completed_three_tool_worker_claim_lease_boundary'
  | 'blocked_missing_three_tool_worker_claim_lease_confirmation'
  | 'blocked_missing_three_tool_worker_claim_lease_reference'
  | 'blocked_invalid_three_tool_worker_claim_lease_state'
  | 'blocked_missing_three_tool_worker_claim_lease_payload'
  | 'blocked_unsafe_three_tool_worker_claim_lease_request'
  | 'blocked_remote_worker_claim_requires_separate_owner_confirmation'
  | 'blocked_worker_claim_lease_service_failed'

export interface ThreeToolExternalAgentWorkerDispatchClaimLeaseInput {
  workspaceId: string
  projectId: string
  approvedSnapshotId: string
  persistedInvocationId: string
  persistedJobId: string
  persistedJobType: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE | string
  persistedJobPayloadMode: 'persisted_job_payload_to_worker_claim_lease' | string
  persistedJobPayloadJson: ThreeToolExternalAgentPersistedJobPayload
  persistedJobWorkerClaimLeaseConfirmed: boolean
  workerType: 'tracka_three_tool_external_agent_generated_fixture_worker' | string
  workerInstanceId: string
  leaseExpiresAt: string
  claimLeaseMode: 'local_mock_claim_lease_no_worker_execution' | string
  routeIdempotencyKey: string
  runtimeRouteInvocationRequestedNow?: boolean
  workerDispatchRequestedNow?: boolean
  workerExecutionRequestedNow?: boolean
  workerProcessStartRequestedNow?: boolean
  persistentJobQueueWriteRequestedNow?: boolean
  privateMediaProcessingRequestedNow?: boolean
  userMediaProcessingRequestedNow?: boolean
  gstreamerExecutionRequestedNow?: boolean
  mkvtoolnixExecutionRequestedNow?: boolean
  gpacMp4boxExecutionRequestedNow?: boolean
  ffmpegFfprobeExecutionRequestedNow?: boolean
  dockerExecutionRequestedNow?: boolean
  dockerPushDeployRequestedNow?: boolean
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

export interface ThreeToolExternalAgentWorkerDispatchClaimLeaseResult {
  packet: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_PACKET
  decision: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_DECISION
  execution: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_EXECUTION
  ok: boolean
  status: ThreeToolExternalAgentWorkerDispatchClaimLeaseStatus
  blockers: ThreeToolExternalAgentWorkerDispatchClaimLeaseStatus[]
  confirmationGate: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_CONFIRM_ENV
  routePath: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_ROUTE_PATH
  persistedRuntimeRouteInvocationRoutePath: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_ROUTE_PATH
  claim?: unknown
  warnings: string[]
  sanitizedClaimLease: {
    workspaceId: string
    projectId: string
    approvedSnapshotId: string
    persistedInvocationId: string
    persistedJobId: string
    persistedJobType: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE
    persistedJobPayloadMode: 'persisted_job_payload_to_worker_claim_lease'
    workerType: 'tracka_three_tool_external_agent_generated_fixture_worker'
    workerInstanceId: string
    leaseExpiresAt: string
    routeIdempotencyKey: string
    persistedPayloadAccepted: boolean
    claimLeaseMode: 'local_mock_claim_lease_no_worker_execution' | string
    workerLeaseClaim: 'completed_local_mock_claim_only' | false
    runtimeRouteInvocation: false
    workerDispatch: false
    workerExecution: false
    workerProcessStart: false
    persistentJobQueueWrite: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
    gpacMp4boxExecution: false
    mediaProcessing: false
    privateMediaProcessing: false
    userMediaProcessing: false
    supabaseMutation: false
    sqlExecution: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
  }
  safety: {
    routeHandlerInvocation: 'completed_guarded_three_tool_worker_claim_lease_handler' | 'not_run_blocked_before_claim'
    localMockWorkerLeaseClaim: 'completed' | false
    runtimeRouteInvocation: false
    workerDispatch: false
    workerExecution: false
    workerProcessStart: false
    persistentJobQueueWrite: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
    gpacMp4boxExecution: false
    mediaProcessing: false
    privateMediaProcessing: false
    userMediaProcessing: false
    ffmpegFfprobeExecution: false
    dockerExecution: false
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
  nextMilestone: typeof TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_NEXT_MILESTONE
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function blank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function expectedRouteIdempotencyKey(
  input: Pick<
    ThreeToolExternalAgentWorkerDispatchClaimLeaseInput,
    'workspaceId' | 'projectId' | 'approvedSnapshotId' | 'persistedJobId' | 'persistedInvocationId' | 'workerInstanceId'
  >,
): string {
  return [
    'tracka-three-tool',
    'worker-dispatch-claim-lease-1',
    input.workspaceId,
    input.projectId,
    input.approvedSnapshotId,
    input.persistedJobId,
    input.persistedInvocationId,
    input.workerInstanceId,
  ].join(':')
}

export function buildThreeToolExternalAgentWorkerDispatchClaimLeaseInput(
  overrides: Partial<ThreeToolExternalAgentWorkerDispatchClaimLeaseInput> = {},
): ThreeToolExternalAgentWorkerDispatchClaimLeaseInput {
  const persistedRouteInvocation = buildThreeToolExternalAgentPersistedJobRouteInvocationInput(
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
    persistedJobType: overrides.persistedJobType ?? TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE,
    persistedJobPayloadMode: overrides.persistedJobPayloadMode ?? 'persisted_job_payload_to_worker_claim_lease',
    persistedJobPayloadJson: overrides.persistedJobPayloadJson ?? persistedRouteInvocation.persistedJobPayloadJson,
    persistedJobWorkerClaimLeaseConfirmed: overrides.persistedJobWorkerClaimLeaseConfirmed ?? true,
    workerType: overrides.workerType ?? 'tracka_three_tool_external_agent_generated_fixture_worker',
    workerInstanceId: overrides.workerInstanceId ?? 'local-tracka-three-tool-external-agent-generated-fixture-worker-1',
    leaseExpiresAt: overrides.leaseExpiresAt ?? '2026-07-03T14:00:00.000Z',
    claimLeaseMode: overrides.claimLeaseMode ?? 'local_mock_claim_lease_no_worker_execution',
    runtimeRouteInvocationRequestedNow: overrides.runtimeRouteInvocationRequestedNow ?? false,
    workerDispatchRequestedNow: overrides.workerDispatchRequestedNow ?? false,
    workerExecutionRequestedNow: overrides.workerExecutionRequestedNow ?? false,
    workerProcessStartRequestedNow: overrides.workerProcessStartRequestedNow ?? false,
    persistentJobQueueWriteRequestedNow: overrides.persistentJobQueueWriteRequestedNow ?? false,
    privateMediaProcessingRequestedNow: overrides.privateMediaProcessingRequestedNow ?? false,
    userMediaProcessingRequestedNow: overrides.userMediaProcessingRequestedNow ?? false,
    gstreamerExecutionRequestedNow: overrides.gstreamerExecutionRequestedNow ?? false,
    mkvtoolnixExecutionRequestedNow: overrides.mkvtoolnixExecutionRequestedNow ?? false,
    gpacMp4boxExecutionRequestedNow: overrides.gpacMp4boxExecutionRequestedNow ?? false,
    ffmpegFfprobeExecutionRequestedNow: overrides.ffmpegFfprobeExecutionRequestedNow ?? false,
    dockerExecutionRequestedNow: overrides.dockerExecutionRequestedNow ?? false,
    dockerPushDeployRequestedNow: overrides.dockerPushDeployRequestedNow ?? false,
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

function unsafeRequested(input: ThreeToolExternalAgentWorkerDispatchClaimLeaseInput): boolean {
  return [
    input.runtimeRouteInvocationRequestedNow,
    input.workerDispatchRequestedNow,
    input.workerExecutionRequestedNow,
    input.workerProcessStartRequestedNow,
    input.persistentJobQueueWriteRequestedNow,
    input.privateMediaProcessingRequestedNow,
    input.userMediaProcessingRequestedNow,
    input.gstreamerExecutionRequestedNow,
    input.mkvtoolnixExecutionRequestedNow,
    input.gpacMp4boxExecutionRequestedNow,
    input.ffmpegFfprobeExecutionRequestedNow,
    input.dockerExecutionRequestedNow,
    input.dockerPushDeployRequestedNow,
    input.remotionExecutionRequestedNow,
    input.supabaseMutationRequestedNow,
    input.sqlExecutionRequestedNow,
    input.secretPayloadAccessRequestedNow,
    input.serviceRoleSecretPayloadAccessRequestedNow,
    input.signedUrlCreationRequestedNow,
    input.publicArtifactRequestedNow,
    input.finalRenderExportRequestedNow,
    input.externalBetaUnlockRequestedNow,
    input.paidProductionUnlockRequestedNow,
    input.productionUnlockRequestedNow,
  ].some(Boolean)
}

export function validateThreeToolExternalAgentWorkerDispatchClaimLeaseInput(
  input: ThreeToolExternalAgentWorkerDispatchClaimLeaseInput,
): ThreeToolExternalAgentWorkerDispatchClaimLeaseStatus[] {
  const blockers: ThreeToolExternalAgentWorkerDispatchClaimLeaseStatus[] = []
  const payload = input.persistedJobPayloadJson
  const envelope = payload?.approvedSnapshotRuntimeEnvelope
  if (!input.persistedJobWorkerClaimLeaseConfirmed) {
    pushOnce(blockers, 'blocked_missing_three_tool_worker_claim_lease_confirmation')
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
    if (blank(value)) pushOnce(blockers, 'blocked_missing_three_tool_worker_claim_lease_reference')
  }
  if (!payload || !envelope) pushOnce(blockers, 'blocked_missing_three_tool_worker_claim_lease_payload')
  if (
    input.persistedJobType !== TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE ||
    input.persistedJobPayloadMode !== 'persisted_job_payload_to_worker_claim_lease' ||
    input.workerType !== 'tracka_three_tool_external_agent_generated_fixture_worker' ||
    input.claimLeaseMode !== 'local_mock_claim_lease_no_worker_execution' ||
    payload?.packet !== TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_PACKET ||
    payload?.persistedJobPayloadKind !== TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_PAYLOAD_KIND ||
    payload?.sourceApprovedSnapshotJobExecution?.runId !== '2026-07-03T03-41-30-494Z-41a3b873' ||
    payload?.sourceApprovedSnapshotJobExecution?.childRunId !== '2026-07-03T03-41-30-650Z-41ce5185' ||
    payload?.sourceApprovedSnapshotJobExecution?.decision !==
      'completed_three_tool_external_agent_approved_snapshot_job_execution' ||
    envelope?.workspaceId !== input.workspaceId ||
    envelope?.projectId !== input.projectId ||
    envelope?.approvedSnapshotId !== input.approvedSnapshotId
  ) {
    pushOnce(blockers, 'blocked_invalid_three_tool_worker_claim_lease_state')
  }
  if (input.routeIdempotencyKey !== expectedRouteIdempotencyKey(input)) {
    pushOnce(blockers, 'blocked_invalid_three_tool_worker_claim_lease_state')
  }
  if (unsafeRequested(input)) {
    pushOnce(blockers, 'blocked_unsafe_three_tool_worker_claim_lease_request')
  }
  return blockers
}

function buildResult(
  input: ThreeToolExternalAgentWorkerDispatchClaimLeaseInput,
  ok: boolean,
  status: ThreeToolExternalAgentWorkerDispatchClaimLeaseStatus,
  blockers: ThreeToolExternalAgentWorkerDispatchClaimLeaseStatus[],
  claim?: unknown,
  warnings: string[] = [],
): ThreeToolExternalAgentWorkerDispatchClaimLeaseResult {
  return {
    packet: TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_PACKET,
    decision: TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_DECISION,
    execution: TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_EXECUTION,
    ok,
    status,
    blockers,
    confirmationGate: TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_CONFIRM_ENV,
    routePath: TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_ROUTE_PATH,
    persistedRuntimeRouteInvocationRoutePath: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_ROUTE_INVOCATION_ROUTE_PATH,
    claim,
    warnings,
    sanitizedClaimLease: {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedSnapshotId: input.approvedSnapshotId,
      persistedInvocationId: input.persistedInvocationId,
      persistedJobId: input.persistedJobId,
      persistedJobType: TRACKA_THREE_TOOL_EXTERNAL_AGENT_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE,
      persistedJobPayloadMode: 'persisted_job_payload_to_worker_claim_lease',
      workerType: 'tracka_three_tool_external_agent_generated_fixture_worker',
      workerInstanceId: input.workerInstanceId,
      leaseExpiresAt: input.leaseExpiresAt,
      routeIdempotencyKey: input.routeIdempotencyKey,
      persistedPayloadAccepted: ok,
      claimLeaseMode: input.claimLeaseMode,
      workerLeaseClaim: ok ? 'completed_local_mock_claim_only' : false,
      runtimeRouteInvocation: false,
      workerDispatch: false,
      workerExecution: false,
      workerProcessStart: false,
      persistentJobQueueWrite: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
      gpacMp4boxExecution: false,
      mediaProcessing: false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      supabaseMutation: false,
      sqlExecution: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
    },
    safety: {
      routeHandlerInvocation: ok ? 'completed_guarded_three_tool_worker_claim_lease_handler' : 'not_run_blocked_before_claim',
      localMockWorkerLeaseClaim: ok ? 'completed' : false,
      runtimeRouteInvocation: false,
      workerDispatch: false,
      workerExecution: false,
      workerProcessStart: false,
      persistentJobQueueWrite: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
      gpacMp4boxExecution: false,
      mediaProcessing: false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      ffmpegFfprobeExecution: false,
      dockerExecution: false,
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
    nextMilestone: TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_NEXT_MILESTONE,
  }
}

export async function runThreeToolExternalAgentWorkerDispatchClaimLease(
  input: ThreeToolExternalAgentWorkerDispatchClaimLeaseInput,
  context: ServiceContext,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ThreeToolExternalAgentWorkerDispatchClaimLeaseResult> {
  const blockers = validateThreeToolExternalAgentWorkerDispatchClaimLeaseInput(input)
  if (env[TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE_CONFIRM_ENV] !== 'true') {
    pushOnce(blockers, 'blocked_missing_three_tool_worker_claim_lease_confirmation')
  }
  if (context.clients.admin && !context.env.mockOnly) {
    pushOnce(blockers, 'blocked_remote_worker_claim_requires_separate_owner_confirmation')
  }
  if (blockers.length > 0) return buildResult(input, false, blockers[0], blockers)

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
    return buildResult(input, true, 'completed_three_tool_worker_claim_lease_boundary', [], result.claim, result.warnings)
  } catch {
    return buildResult(input, false, 'blocked_worker_claim_lease_service_failed', [
      'blocked_worker_claim_lease_service_failed',
    ])
  }
}

export function summarizeThreeToolExternalAgentWorkerDispatchClaimLeaseBoundary(): string[] {
  return [
    'Consumes the three-tool persisted generated-fixture job payload and validates a local/mock worker lease claim boundary.',
    'Requires REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_DISPATCH_CLAIM_LEASE=true before claim-lease validation runs.',
    'Remote Supabase worker-claim mutation remains blocked and requires a separate owner-approved remote claim packet.',
    'Does not invoke the runtime route, dispatch or execute a worker, run GStreamer/MKVToolNix/GPAC/MP4Box, process private/user media, create public artifacts, or unlock beta/production/final export.',
  ]
}
