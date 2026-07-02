import type { JobRuntimeQueueItem } from '../../src/types/job-runtime'
import type { MockDatabase } from '../../src/backend/mock/mock-database'
import { createMockDatabase } from '../../src/backend/mock/mock-database'
import { queueMockJob } from '../../src/backend/services/job-queue-runtime-service'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
  buildGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput,
  type GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput,
} from './rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1'

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_PACKET =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GENERATED-FIXTURE-TO-APPROVED-SNAPSHOT-JOB-QUEUE-HANDOFF-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_DECISION =
  'completed_gstreamer_mkvtoolnix_generated_fixture_to_approved_snapshot_job_queue_handoff' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_EXECUTION =
  'completed_backend_approved_snapshot_queue_handoff_source_for_existing_generated_fixture_runtime_route' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GENERATED_FIXTURE_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_ROUTE_PATH =
  '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/approved-snapshot/jobs/enqueue' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_NEXT_MILESTONE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GENERATED-FIXTURE-QUEUED-JOB-TO-RUNTIME-ROUTE-INVOCATION-1' as const

export type GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffStatus =
  | 'queued_generated_fixture_approved_snapshot_job_queue_handoff'
  | 'blocked_missing_generated_fixture_approved_snapshot_job_queue_handoff_confirmation'
  | 'blocked_missing_generated_fixture_approved_snapshot_job_queue_handoff_reference'
  | 'blocked_invalid_generated_fixture_approved_snapshot_job_queue_handoff_state'
  | 'blocked_approved_snapshot_not_approved'
  | 'blocked_unapproved_generated_fixture_command_template'
  | 'blocked_unsupported_generated_fixture_queue_handoff_payload'
  | 'blocked_runtime_or_remote_execution_not_enabled_for_queue_handoff'
  | 'blocked_generated_fixture_queue_handoff_idempotency_mismatch'
  | 'blocked_local_mock_queue_gate_failed'

export interface GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffInput {
  workspaceId: string
  projectId: string
  approvedSnapshotId: string
  approvedSnapshotStatus: 'approved' | string
  approvalRecordId: string
  approvalRecordStatus: 'approved' | string
  creditOrNoSpendPolicyId: string
  creditPolicyMode: 'no_spend_generated_fixture_policy' | string
  jobId: string
  queueId: string
  queueIdempotencyKey: string
  routeIdempotencyKey: string
  workerLeaseId: string
  workerEnvelopeId: string
  runtimePacketId: string
  runtimeExecutionId: string
  fixtureScope: 'generated_srt_and_generated_subtitle_only_mkv_fixture' | string
  queueHandoffMode: 'local_mock_queue_handoff_only' | string
  routeOwner: 'backend_service_role_only' | string
  routeBridgeMode: 'queued_handoff_to_existing_guarded_runtime_route' | string
  commandTemplates: readonly string[]
  privateInputManifestId: string
  outputManifestSchemaId: string
  qaReportSchemaId: string
  cleanupPolicyId: string
  retentionPolicyId: string
  failurePolicyId: string
  nonPublicArtifactPolicyId: string
  confirmation: boolean
  rawCommand?: string | null
  rawChat?: string | null
  arbitraryFilePath?: string | null
  privateMediaPath?: string | null
  userMediaPath?: string | null
  publicUrl?: string | null
  signedUrl?: string | null
  runtimeRouteExecutionRequestedNow?: boolean
  workerDispatchRequestedNow?: boolean
  workerExecutionRequestedNow?: boolean
  workerProcessStartRequestedNow?: boolean
  workerLeaseClaimRequestedNow?: boolean
  persistentJobQueueWriteRequestedNow?: boolean
  gstreamerExecutionRequestedNow?: boolean
  mkvtoolnixExecutionRequestedNow?: boolean
  ffmpegFfprobeExecutionRequestedNow?: boolean
  dockerExecutionRequestedNow?: boolean
  remotionExecutionRequestedNow?: boolean
  mediaProcessingRequestedNow?: boolean
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

export interface GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffResult {
  packet: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_PACKET
  decision: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_DECISION
  execution: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_EXECUTION
  ok: boolean
  status: GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffStatus
  blockers: GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffStatus[]
  confirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_CONFIRM_ENV
  confirmationRequired: true
  routePath: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_ROUTE_PATH
  runtimeRoutePath: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH
  queueItem?: JobRuntimeQueueItem
  sanitizedHandoff: {
    workspaceId: string
    projectId: string
    approvedSnapshotId: string
    approvedSnapshotStatus: 'approved'
    approvalRecordId: string
    approvalRecordStatus: 'approved'
    creditOrNoSpendPolicyId: string
    creditPolicyMode: 'no_spend_generated_fixture_policy'
    jobId: string
    queueId: string
    queueIdempotencyKey: string
    routeIdempotencyKey: string
    workerLeaseId: string
    workerEnvelopeId: string
    runtimePacketId: string
    runtimeExecutionId: string
    fixtureScope: 'generated_srt_and_generated_subtitle_only_mkv_fixture'
    queueHandoffMode: 'local_mock_queue_handoff_only'
    routeOwner: 'backend_service_role_only'
    routeBridgeMode: 'queued_handoff_to_existing_guarded_runtime_route'
    commandTemplates: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES
    privateInputManifestId: string
    outputManifestSchemaId: string
    qaReportSchemaId: string
    cleanupPolicyId: string
    retentionPolicyId: string
    failurePolicyId: string
    nonPublicArtifactPolicyId: string
    runtimeRoutePath: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH
    runtimeRouteBody: GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput
    localMockQueueItemCreated: boolean
    queueStatus: 'pending_validation' | 'queued'
    nextRouteInvocation: 'pending_next_milestone'
    runtimeRouteExecution: false
    workerDispatch: false
    workerExecution: false
    persistentJobQueueWrite: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
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
    routeHandlerInvocation: 'completed_guarded_queue_handoff_route_handler' | 'not_run_blocked_before_queue_handoff'
    localMockQueueItemCreated: boolean
    runtimeRouteExecution: false
    workerDispatch: false
    workerExecution: false
    workerProcessStart: false
    workerLeaseClaim: false
    persistentJobQueueWrite: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
    ffmpegFfprobeExecution: false
    dockerExecution: false
    dockerPushDeploy: false
    remotionExecution: false
    mediaProcessing: false
    privateMediaProcessing: false
    userMediaProcessing: false
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
  nextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_NEXT_MILESTONE
}

export interface GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffDependencies {
  db?: MockDatabase
  env?: NodeJS.ProcessEnv
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function blank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function hasText(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

function commandTemplatesAllowed(commandTemplates: readonly string[]): boolean {
  return (
    commandTemplates.length === RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES.length &&
    RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES.every(
      (template, index) => commandTemplates[index] === template,
    )
  )
}

function expectedQueueIdempotencyKey(
  input: Pick<
    GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffInput,
    'workspaceId' | 'projectId' | 'approvedSnapshotId' | 'jobId' | 'queueId' | 'routeIdempotencyKey'
  >,
): string {
  return [
    'gstreamer-mkvtoolnix',
    'generated-fixture-approved-snapshot-job-queue-handoff-1',
    input.workspaceId,
    input.projectId,
    input.approvedSnapshotId,
    input.jobId,
    input.queueId,
    input.routeIdempotencyKey,
  ].join(':')
}

function unsupportedPayload(input: GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffInput): boolean {
  return [
    input.rawCommand,
    input.rawChat,
    input.arbitraryFilePath,
    input.privateMediaPath,
    input.userMediaPath,
    input.publicUrl,
    input.signedUrl,
  ].some(hasText)
}

function unsafeRequest(input: GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffInput): boolean {
  return [
    input.runtimeRouteExecutionRequestedNow,
    input.workerDispatchRequestedNow,
    input.workerExecutionRequestedNow,
    input.workerProcessStartRequestedNow,
    input.workerLeaseClaimRequestedNow,
    input.persistentJobQueueWriteRequestedNow,
    input.gstreamerExecutionRequestedNow,
    input.mkvtoolnixExecutionRequestedNow,
    input.ffmpegFfprobeExecutionRequestedNow,
    input.dockerExecutionRequestedNow,
    input.remotionExecutionRequestedNow,
    input.mediaProcessingRequestedNow,
    input.privateMediaProcessingRequestedNow,
    input.userMediaProcessingRequestedNow,
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

function buildRuntimeRouteBody(
  input: GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffInput,
): GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput {
  return buildGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    approvedSnapshotId: input.approvedSnapshotId,
    approvalRecordId: input.approvalRecordId,
    creditOrNoSpendPolicyId: input.creditOrNoSpendPolicyId,
    jobId: input.jobId,
    workerLeaseId: input.workerLeaseId,
    workerEnvelopeId: input.workerEnvelopeId,
    routeIdempotencyKey: input.routeIdempotencyKey,
    runtimePacketId: input.runtimePacketId,
    runtimeExecutionId: input.runtimeExecutionId,
    fixtureScope: 'generated_srt_and_generated_subtitle_only_mkv_fixture',
    commandTemplates: [
      ...RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES,
    ],
    privateInputManifestId: input.privateInputManifestId,
    outputManifestSchemaId: input.outputManifestSchemaId,
    qaReportSchemaId: input.qaReportSchemaId,
    cleanupPolicyId: input.cleanupPolicyId,
    retentionPolicyId: input.retentionPolicyId,
    failurePolicyId: input.failurePolicyId,
    nonPublicArtifactPolicyId: input.nonPublicArtifactPolicyId,
    confirmation: true,
    routeExecutionRequestedNow: true,
    workerDispatchRequestedNow: false,
    workerExecutionRequestedNow: false,
    workerProcessStartRequestedNow: false,
    workerLeaseClaimRequestedNow: false,
    persistentJobQueueWriteRequestedNow: false,
    privateMediaProcessingRequestedNow: false,
    userMediaProcessingRequestedNow: false,
    supabaseMutationRequestedNow: false,
    sqlExecutionRequestedNow: false,
    signedUrlCreationRequestedNow: false,
    publicArtifactRequestedNow: false,
    finalRenderExportRequestedNow: false,
    externalBetaUnlockRequestedNow: false,
    paidProductionUnlockRequestedNow: false,
    productionUnlockRequestedNow: false,
  })
}

export function buildGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffInput(
  overrides: Partial<GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffInput> = {},
): GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffInput {
  const base = {
    workspaceId: 'workspace-gstreamer-mkvtoolnix-generated-fixture-approved-snapshot-handoff',
    projectId: 'project-gstreamer-mkvtoolnix-generated-fixture-approved-snapshot-handoff',
    approvedSnapshotId: 'approved-snapshot-gstreamer-mkvtoolnix-generated-fixture-handoff',
    approvedSnapshotStatus: 'approved',
    approvalRecordId: 'approval-gstreamer-mkvtoolnix-generated-fixture-handoff',
    approvalRecordStatus: 'approved',
    creditOrNoSpendPolicyId: 'no-spend-generated-fixture-policy-gstreamer-mkvtoolnix-handoff',
    creditPolicyMode: 'no_spend_generated_fixture_policy',
    jobId: 'job-gstreamer-mkvtoolnix-generated-fixture-handoff',
    queueId: 'queue-gstreamer-mkvtoolnix-generated-fixture-handoff',
    routeIdempotencyKey: 'idem-route-gstreamer-mkvtoolnix-generated-fixture-handoff',
    workerLeaseId: 'worker-lease-gstreamer-mkvtoolnix-generated-fixture-handoff',
    workerEnvelopeId: 'worker-envelope-gstreamer-mkvtoolnix-generated-fixture-handoff',
    runtimePacketId: 'runtime-packet-gstreamer-mkvtoolnix-generated-fixture-handoff',
    runtimeExecutionId: 'runtime-execution-gstreamer-mkvtoolnix-generated-fixture-handoff',
    fixtureScope: 'generated_srt_and_generated_subtitle_only_mkv_fixture',
    queueHandoffMode: 'local_mock_queue_handoff_only',
    routeOwner: 'backend_service_role_only',
    routeBridgeMode: 'queued_handoff_to_existing_guarded_runtime_route',
    commandTemplates: [
      ...RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES,
    ],
    privateInputManifestId: 'generated-fixture-input-manifest-gstreamer-mkvtoolnix-handoff',
    outputManifestSchemaId: 'output-manifest-schema-gstreamer-mkvtoolnix-handoff',
    qaReportSchemaId: 'qa-report-schema-gstreamer-mkvtoolnix-handoff',
    cleanupPolicyId: 'cleanup-policy-gstreamer-mkvtoolnix-handoff',
    retentionPolicyId: 'retention-policy-gstreamer-mkvtoolnix-handoff',
    failurePolicyId: 'failure-policy-gstreamer-mkvtoolnix-handoff',
    nonPublicArtifactPolicyId: 'non-public-artifact-policy-gstreamer-mkvtoolnix-handoff',
    confirmation: true,
    runtimeRouteExecutionRequestedNow: false,
    workerDispatchRequestedNow: false,
    workerExecutionRequestedNow: false,
    workerProcessStartRequestedNow: false,
    workerLeaseClaimRequestedNow: false,
    persistentJobQueueWriteRequestedNow: false,
    gstreamerExecutionRequestedNow: false,
    mkvtoolnixExecutionRequestedNow: false,
    ffmpegFfprobeExecutionRequestedNow: false,
    dockerExecutionRequestedNow: false,
    remotionExecutionRequestedNow: false,
    mediaProcessingRequestedNow: false,
    privateMediaProcessingRequestedNow: false,
    userMediaProcessingRequestedNow: false,
    supabaseMutationRequestedNow: false,
    sqlExecutionRequestedNow: false,
    secretPayloadAccessRequestedNow: false,
    serviceRoleSecretPayloadAccessRequestedNow: false,
    signedUrlCreationRequestedNow: false,
    publicArtifactRequestedNow: false,
    finalRenderExportRequestedNow: false,
    externalBetaUnlockRequestedNow: false,
    paidProductionUnlockRequestedNow: false,
    productionUnlockRequestedNow: false,
    ...overrides,
  } satisfies Omit<GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffInput, 'queueIdempotencyKey'> & {
    queueIdempotencyKey?: string
  }

  return {
    ...base,
    queueIdempotencyKey: overrides.queueIdempotencyKey ?? expectedQueueIdempotencyKey(base),
  }
}

export function validateGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffInput(
  input: GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffInput,
): GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffStatus[] {
  const blockers: GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffStatus[] = []

  if (!input.confirmation) {
    pushOnce(blockers, 'blocked_missing_generated_fixture_approved_snapshot_job_queue_handoff_confirmation')
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
    input.workerLeaseId,
    input.workerEnvelopeId,
    input.runtimePacketId,
    input.runtimeExecutionId,
    input.privateInputManifestId,
    input.outputManifestSchemaId,
    input.qaReportSchemaId,
    input.cleanupPolicyId,
    input.retentionPolicyId,
    input.failurePolicyId,
    input.nonPublicArtifactPolicyId,
  ]) {
    if (blank(value)) {
      pushOnce(blockers, 'blocked_missing_generated_fixture_approved_snapshot_job_queue_handoff_reference')
    }
  }
  if (input.approvedSnapshotStatus !== 'approved' || input.approvalRecordStatus !== 'approved') {
    pushOnce(blockers, 'blocked_approved_snapshot_not_approved')
  }
  if (
    input.creditPolicyMode !== 'no_spend_generated_fixture_policy' ||
    input.fixtureScope !== 'generated_srt_and_generated_subtitle_only_mkv_fixture' ||
    input.queueHandoffMode !== 'local_mock_queue_handoff_only' ||
    input.routeOwner !== 'backend_service_role_only' ||
    input.routeBridgeMode !== 'queued_handoff_to_existing_guarded_runtime_route'
  ) {
    pushOnce(blockers, 'blocked_invalid_generated_fixture_approved_snapshot_job_queue_handoff_state')
  }
  if (!commandTemplatesAllowed(input.commandTemplates)) {
    pushOnce(blockers, 'blocked_unapproved_generated_fixture_command_template')
  }
  if (input.queueIdempotencyKey !== expectedQueueIdempotencyKey(input)) {
    pushOnce(blockers, 'blocked_generated_fixture_queue_handoff_idempotency_mismatch')
  }
  if (unsupportedPayload(input)) {
    pushOnce(blockers, 'blocked_unsupported_generated_fixture_queue_handoff_payload')
  }
  if (unsafeRequest(input)) {
    pushOnce(blockers, 'blocked_runtime_or_remote_execution_not_enabled_for_queue_handoff')
  }

  return blockers
}

function buildResult(
  input: GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffInput,
  ok: boolean,
  status: GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffStatus,
  blockers: GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffStatus[],
  queueItem?: JobRuntimeQueueItem,
): GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffResult {
  const localMockQueueItemCreated = Boolean(ok && queueItem)
  const routeHandlerInvocation = ok
    ? 'completed_guarded_queue_handoff_route_handler'
    : 'not_run_blocked_before_queue_handoff'

  return {
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_PACKET,
    decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_DECISION,
    execution: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_EXECUTION,
    ok,
    status,
    blockers,
    confirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_CONFIRM_ENV,
    confirmationRequired: true,
    routePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_ROUTE_PATH,
    runtimeRoutePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
    queueItem,
    sanitizedHandoff: {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      approvedSnapshotId: input.approvedSnapshotId,
      approvedSnapshotStatus: 'approved',
      approvalRecordId: input.approvalRecordId,
      approvalRecordStatus: 'approved',
      creditOrNoSpendPolicyId: input.creditOrNoSpendPolicyId,
      creditPolicyMode: 'no_spend_generated_fixture_policy',
      jobId: input.jobId,
      queueId: input.queueId,
      queueIdempotencyKey: input.queueIdempotencyKey,
      routeIdempotencyKey: input.routeIdempotencyKey,
      workerLeaseId: input.workerLeaseId,
      workerEnvelopeId: input.workerEnvelopeId,
      runtimePacketId: input.runtimePacketId,
      runtimeExecutionId: input.runtimeExecutionId,
      fixtureScope: 'generated_srt_and_generated_subtitle_only_mkv_fixture',
      queueHandoffMode: 'local_mock_queue_handoff_only',
      routeOwner: 'backend_service_role_only',
      routeBridgeMode: 'queued_handoff_to_existing_guarded_runtime_route',
      commandTemplates: [
        ...RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES,
      ],
      privateInputManifestId: input.privateInputManifestId,
      outputManifestSchemaId: input.outputManifestSchemaId,
      qaReportSchemaId: input.qaReportSchemaId,
      cleanupPolicyId: input.cleanupPolicyId,
      retentionPolicyId: input.retentionPolicyId,
      failurePolicyId: input.failurePolicyId,
      nonPublicArtifactPolicyId: input.nonPublicArtifactPolicyId,
      runtimeRoutePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
      runtimeRouteBody: buildRuntimeRouteBody(input),
      localMockQueueItemCreated,
      queueStatus: queueItem?.queueStatus === 'queued' ? 'queued' : 'pending_validation',
      nextRouteInvocation: 'pending_next_milestone',
      runtimeRouteExecution: false,
      workerDispatch: false,
      workerExecution: false,
      persistentJobQueueWrite: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
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
      routeHandlerInvocation,
      localMockQueueItemCreated,
      runtimeRouteExecution: false,
      workerDispatch: false,
      workerExecution: false,
      workerProcessStart: false,
      workerLeaseClaim: false,
      persistentJobQueueWrite: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
      ffmpegFfprobeExecution: false,
      dockerExecution: false,
      dockerPushDeploy: false,
      remotionExecution: false,
      mediaProcessing: false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
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
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_NEXT_MILESTONE,
  }
}

function blockedResult(
  input: GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffInput,
  blockers: GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffStatus[],
): GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffResult {
  return buildResult(
    input,
    false,
    blockers[0] ?? 'blocked_invalid_generated_fixture_approved_snapshot_job_queue_handoff_state',
    blockers,
  )
}

export function runGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoff(
  input: GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffInput,
  dependencies: GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffDependencies = {},
): GstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffResult {
  const blockers = validateGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffInput(input)
  const env = dependencies.env ?? process.env
  if (env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_CONFIRM_ENV] !== 'true') {
    pushOnce(blockers, 'blocked_missing_generated_fixture_approved_snapshot_job_queue_handoff_confirmation')
  }
  if (blockers.length > 0) return blockedResult(input, blockers)

  const db = dependencies.db ?? createMockDatabase()
  const queueItem = queueMockJob(db, {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.approvedSnapshotId,
    jobId: input.jobId,
    workerKind: 'custom',
    mockSafe: true,
    requiresEditPlanApproval: false,
    requiresCreditEstimateApproval: false,
    requiresCreditReservation: false,
    requiresGenerationRequest: false,
    requiresProvider: false,
    requiresRequiredAssets: false,
    requiresTimingReadiness: false,
    requiresBackendRuntime: false,
    payload: {
      packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF_PACKET,
      queueHandoffMode: 'local_mock_queue_handoff_only',
      queueId: input.queueId,
      queueIdempotencyKey: input.queueIdempotencyKey,
      runtimeRoutePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
      runtimeRouteBody: buildRuntimeRouteBody(input),
      runtimeRouteExecution: false,
      workerDispatch: false,
      workerExecution: false,
      persistentJobQueueWrite: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
      mediaProcessing: false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      supabaseMutation: false,
      sqlExecution: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
    },
  })

  if (queueItem.queueStatus !== 'queued' || !queueItem.mockOnly || queueItem.payload.mockOnly !== true) {
    return buildResult(input, false, 'blocked_local_mock_queue_gate_failed', ['blocked_local_mock_queue_gate_failed'], queueItem)
  }

  return buildResult(input, true, 'queued_generated_fixture_approved_snapshot_job_queue_handoff', [], queueItem)
}

export function summarizeGstreamerMkvtoolnixApprovedSnapshotJobQueueHandoffBoundary(): string[] {
  return [
    'Creates a backend route for approved-snapshot generated-fixture queue handoff to the existing GStreamer/MKVToolNix runtime route bridge.',
    'Fails closed unless approved snapshot and approval refs are approved, command templates are allowlisted, idempotency matches, and REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GENERATED_FIXTURE_APPROVED_SNAPSHOT_JOB_QUEUE_HANDOFF=true is present.',
    'Creates a local mock queue item only; it does not persist queue rows, claim leases, dispatch workers, execute the runtime route, run GStreamer/MKVToolNix, process media, mutate Supabase, run SQL, or create artifacts.',
    'The queue payload contains the sanitized existing runtime route path and body so the next milestone can invoke the already guarded generated-fixture runtime route from a queued job envelope.',
  ]
}
