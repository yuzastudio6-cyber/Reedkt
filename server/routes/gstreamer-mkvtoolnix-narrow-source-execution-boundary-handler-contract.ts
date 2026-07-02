import {
  GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_CONFIRM_ENV,
  GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_PATH,
  GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_SOURCE_ID,
} from './gstreamer-mkvtoolnix-narrow-source-execution-boundary-route-source'

export const GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_ID =
  'externalBeta.gstreamerMkvtoolnix.narrowAgent.sourceExecutionBoundary.failClosedHandlerContract' as const

export const GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_PACKET =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-FAIL-CLOSED-HANDLER-CONTRACT-1' as const

export const GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_DECISION =
  'completed_gstreamer_mkvtoolnix_narrow_fail_closed_handler_contract' as const

export const GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_EXECUTION =
  'completed_source_handler_contract_no_route_worker_tool_or_media_execution' as const

export const GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_NEXT_MILESTONE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-FAIL-CLOSED-HANDLER-CONTRACT-QA-ROLLUP-1' as const

export type GstreamerMkvtoolnixNarrowSourceExecutionHandlerContractStatus =
  | 'accepted_fail_closed_handler_contract'
  | 'blocked_missing_handler_contract_confirmation'
  | 'blocked_invalid_route_registration_metadata'
  | 'blocked_missing_approved_snapshot_reference'
  | 'blocked_missing_approval_record_reference'
  | 'blocked_missing_credit_or_no_spend_policy_reference'
  | 'blocked_missing_job_reference'
  | 'blocked_missing_private_generated_fixture_manifest_reference'
  | 'blocked_missing_worker_envelope_reference'
  | 'blocked_missing_qa_cleanup_or_audit_reference'
  | 'blocked_missing_idempotency_key'
  | 'blocked_idempotency_mismatch'
  | 'blocked_route_worker_or_tool_execution_not_enabled'
  | 'blocked_public_or_signed_artifact_attempt'
  | 'blocked_delivery_or_unlock_attempt'

export interface GstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput {
  confirmation: boolean
  handlerContractId?: string | null
  routeId?: string | null
  method?: 'POST' | string | null
  path?: string | null
  routeRegistryStatus?: 'disabled' | 'backend_required' | 'mock_ready' | 'frontend_safe_ready' | string | null
  runtimeMode?: 'backend_required' | 'mock' | 'frontend_safe' | 'worker' | string | null
  requiresServiceRole?: boolean
  futureHandlerName?: 'handleGstreamerMkvtoolnixNarrowSourceExecutionBoundary' | string | null
  approvedSnapshotId?: string | null
  approvalRecordId?: string | null
  creditOrNoSpendPolicyId?: string | null
  jobId?: string | null
  privateGeneratedFixtureManifestId?: string | null
  workerEnvelopeId?: string | null
  qaPolicyId?: string | null
  cleanupPolicyId?: string | null
  auditRefId?: string | null
  idempotencyKey?: string | null
  routeEnabled?: boolean
  handlerRegisteredAtRuntime?: boolean
  routeExecution?: boolean
  workerDispatch?: boolean
  workerExecution?: boolean
  workerProcessStart?: boolean
  workerLeaseClaim?: boolean
  persistentQueueWrite?: boolean
  gstreamerExecution?: boolean
  mkvtoolnixExecution?: boolean
  dockerExecution?: boolean
  ffmpegFfprobeExecution?: boolean
  remotionExecution?: boolean
  mediaProcessing?: boolean
  privateMediaProcessing?: boolean
  userMediaProcessing?: boolean
  supabaseMutation?: boolean
  sqlExecution?: boolean
  serviceRoleSecretPayloadAccess?: boolean
  frontendCredentialExposure?: boolean
  providerCall?: boolean
  modelCall?: boolean
  signedUrlCreation?: boolean
  publicArtifactCreation?: boolean
  finalRenderExport?: boolean
  broadExternalBetaUnlock?: boolean
  paidProductionUnlock?: boolean
  productionUnlock?: boolean
}

export interface GstreamerMkvtoolnixNarrowSourceExecutionHandlerContractResult {
  packet: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_PACKET
  decision: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_DECISION
  execution: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_EXECUTION
  ok: boolean
  status: GstreamerMkvtoolnixNarrowSourceExecutionHandlerContractStatus
  blockers: GstreamerMkvtoolnixNarrowSourceExecutionHandlerContractStatus[]
  confirmationGate: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_CONFIRM_ENV
  sanitizedHandlerContract: {
    handlerContractId: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_ID
    routeId: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_SOURCE_ID
    method: 'POST'
    path: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_PATH
    routeRegistryStatus: 'disabled'
    runtimeMode: 'backend_required'
    requiresServiceRole: true
    futureHandlerName: 'handleGstreamerMkvtoolnixNarrowSourceExecutionBoundary'
    approvedSnapshotId: string
    approvalRecordId: string
    creditOrNoSpendPolicyId: string
    jobId: string
    privateGeneratedFixtureManifestId: string
    workerEnvelopeId: string
    qaPolicyId: string
    cleanupPolicyId: string
    auditRefId: string
    idempotencyKey: string
    handlerRegisteredAtRuntime: false
    routeEnabled: false
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    gstreamerExecution: false
    mkvtoolnixExecution: false
    mediaProcessing: false
    publicArtifactCreation: false
    finalRenderExport: false
  }
  responseShape: {
    status: 'accepted_fail_closed_handler_contract'
    handlerRegisteredAtRuntime: false
    routeExecution: false
    workerDispatch: false
    workerExecution: false
    toolExecution: false
    nextMilestone: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_NEXT_MILESTONE
  }
  productReadyEndToEndLocalOssTools: 0
  nextMilestone: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_NEXT_MILESTONE
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function blank(value: unknown): value is null | undefined | '' {
  return typeof value !== 'string' || value.trim().length === 0
}

function buildExpectedIdempotencyKey(input: GstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput): string {
  return [
    'gstreamer-mkvtoolnix',
    'narrow-source-execution-fail-closed-handler-contract-1',
    input.routeId ?? '',
    input.approvedSnapshotId ?? '',
    input.approvalRecordId ?? '',
    input.jobId ?? '',
    input.privateGeneratedFixtureManifestId ?? '',
  ].join(':')
}

function runtimeRequested(input: GstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput): boolean {
  return [
    input.routeEnabled,
    input.handlerRegisteredAtRuntime,
    input.routeExecution,
    input.workerDispatch,
    input.workerExecution,
    input.workerProcessStart,
    input.workerLeaseClaim,
    input.persistentQueueWrite,
    input.gstreamerExecution,
    input.mkvtoolnixExecution,
    input.dockerExecution,
    input.ffmpegFfprobeExecution,
    input.remotionExecution,
    input.mediaProcessing,
    input.privateMediaProcessing,
    input.userMediaProcessing,
    input.supabaseMutation,
    input.sqlExecution,
    input.serviceRoleSecretPayloadAccess,
    input.frontendCredentialExposure,
    input.providerCall,
    input.modelCall,
  ].some(Boolean)
}

export function buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput(
  overrides: Partial<GstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput> = {},
): GstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput {
  const input: GstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput = {
    confirmation: true,
    handlerContractId: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_ID,
    routeId: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_SOURCE_ID,
    method: 'POST',
    path: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_PATH,
    routeRegistryStatus: 'disabled',
    runtimeMode: 'backend_required',
    requiresServiceRole: true,
    futureHandlerName: 'handleGstreamerMkvtoolnixNarrowSourceExecutionBoundary',
    approvedSnapshotId: 'approved-snapshot-gstreamer-mkvtoolnix-narrow-source-execution',
    approvalRecordId: 'approval-gstreamer-mkvtoolnix-narrow-source-execution',
    creditOrNoSpendPolicyId: 'no-spend-policy-gstreamer-mkvtoolnix-narrow-source-execution',
    jobId: 'job-gstreamer-mkvtoolnix-narrow-source-execution',
    privateGeneratedFixtureManifestId: 'private-generated-fixture-manifest-gstreamer-mkvtoolnix-narrow-source-execution',
    workerEnvelopeId: 'worker-envelope-gstreamer-mkvtoolnix-narrow-source-execution',
    qaPolicyId: 'qa-policy-gstreamer-mkvtoolnix-narrow-source-execution',
    cleanupPolicyId: 'cleanup-policy-gstreamer-mkvtoolnix-narrow-source-execution',
    auditRefId: 'audit-gstreamer-mkvtoolnix-narrow-source-execution',
    routeEnabled: false,
    handlerRegisteredAtRuntime: false,
    routeExecution: false,
    workerDispatch: false,
    workerExecution: false,
    workerProcessStart: false,
    workerLeaseClaim: false,
    persistentQueueWrite: false,
    gstreamerExecution: false,
    mkvtoolnixExecution: false,
    dockerExecution: false,
    ffmpegFfprobeExecution: false,
    remotionExecution: false,
    mediaProcessing: false,
    privateMediaProcessing: false,
    userMediaProcessing: false,
    supabaseMutation: false,
    sqlExecution: false,
    serviceRoleSecretPayloadAccess: false,
    frontendCredentialExposure: false,
    providerCall: false,
    modelCall: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    finalRenderExport: false,
    broadExternalBetaUnlock: false,
    paidProductionUnlock: false,
    productionUnlock: false,
    ...overrides,
  }

  return {
    ...input,
    idempotencyKey: overrides.idempotencyKey ?? buildExpectedIdempotencyKey(input),
  }
}

export function validateGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput(
  input: GstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput,
): GstreamerMkvtoolnixNarrowSourceExecutionHandlerContractResult {
  const blockers: GstreamerMkvtoolnixNarrowSourceExecutionHandlerContractStatus[] = []

  if (!input.confirmation) {
    pushOnce(blockers, 'blocked_missing_handler_contract_confirmation')
  }

  if (
    input.routeId !== GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_SOURCE_ID ||
    input.method !== 'POST' ||
    input.path !== GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_PATH ||
    input.routeRegistryStatus !== 'disabled' ||
    input.runtimeMode !== 'backend_required' ||
    input.requiresServiceRole !== true ||
    input.futureHandlerName !== 'handleGstreamerMkvtoolnixNarrowSourceExecutionBoundary'
  ) {
    pushOnce(blockers, 'blocked_invalid_route_registration_metadata')
  }

  if (blank(input.approvedSnapshotId)) pushOnce(blockers, 'blocked_missing_approved_snapshot_reference')
  if (blank(input.approvalRecordId)) pushOnce(blockers, 'blocked_missing_approval_record_reference')
  if (blank(input.creditOrNoSpendPolicyId)) pushOnce(blockers, 'blocked_missing_credit_or_no_spend_policy_reference')
  if (blank(input.jobId)) pushOnce(blockers, 'blocked_missing_job_reference')
  if (blank(input.privateGeneratedFixtureManifestId)) {
    pushOnce(blockers, 'blocked_missing_private_generated_fixture_manifest_reference')
  }
  if (blank(input.workerEnvelopeId)) pushOnce(blockers, 'blocked_missing_worker_envelope_reference')
  if (blank(input.qaPolicyId) || blank(input.cleanupPolicyId) || blank(input.auditRefId)) {
    pushOnce(blockers, 'blocked_missing_qa_cleanup_or_audit_reference')
  }
  if (blank(input.idempotencyKey)) pushOnce(blockers, 'blocked_missing_idempotency_key')
  if (input.idempotencyKey !== buildExpectedIdempotencyKey(input)) pushOnce(blockers, 'blocked_idempotency_mismatch')

  if (runtimeRequested(input)) pushOnce(blockers, 'blocked_route_worker_or_tool_execution_not_enabled')
  if (input.signedUrlCreation || input.publicArtifactCreation) {
    pushOnce(blockers, 'blocked_public_or_signed_artifact_attempt')
  }
  if (
    input.finalRenderExport ||
    input.broadExternalBetaUnlock ||
    input.paidProductionUnlock ||
    input.productionUnlock
  ) {
    pushOnce(blockers, 'blocked_delivery_or_unlock_attempt')
  }

  const sanitizedInput = buildGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput()

  return {
    packet: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_PACKET,
    decision: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_DECISION,
    execution: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_EXECUTION,
    ok: blockers.length === 0,
    status: blockers[0] ?? 'accepted_fail_closed_handler_contract',
    blockers,
    confirmationGate: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_CONFIRM_ENV,
    sanitizedHandlerContract: {
      handlerContractId: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_ID,
      routeId: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_SOURCE_ID,
      method: 'POST',
      path: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_PATH,
      routeRegistryStatus: 'disabled',
      runtimeMode: 'backend_required',
      requiresServiceRole: true,
      futureHandlerName: 'handleGstreamerMkvtoolnixNarrowSourceExecutionBoundary',
      approvedSnapshotId: sanitizedInput.approvedSnapshotId ?? '',
      approvalRecordId: sanitizedInput.approvalRecordId ?? '',
      creditOrNoSpendPolicyId: sanitizedInput.creditOrNoSpendPolicyId ?? '',
      jobId: sanitizedInput.jobId ?? '',
      privateGeneratedFixtureManifestId: sanitizedInput.privateGeneratedFixtureManifestId ?? '',
      workerEnvelopeId: sanitizedInput.workerEnvelopeId ?? '',
      qaPolicyId: sanitizedInput.qaPolicyId ?? '',
      cleanupPolicyId: sanitizedInput.cleanupPolicyId ?? '',
      auditRefId: sanitizedInput.auditRefId ?? '',
      idempotencyKey: sanitizedInput.idempotencyKey ?? '',
      handlerRegisteredAtRuntime: false,
      routeEnabled: false,
      routeExecution: false,
      workerDispatch: false,
      workerExecution: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
      mediaProcessing: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
    },
    responseShape: {
      status: 'accepted_fail_closed_handler_contract',
      handlerRegisteredAtRuntime: false,
      routeExecution: false,
      workerDispatch: false,
      workerExecution: false,
      toolExecution: false,
      nextMilestone: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_NEXT_MILESTONE,
    },
    productReadyEndToEndLocalOssTools: 0,
    nextMilestone: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_HANDLER_CONTRACT_NEXT_MILESTONE,
  }
}

export function createGstreamerMkvtoolnixNarrowSourceExecutionBoundaryDisabledResponse(
  input: GstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput,
): GstreamerMkvtoolnixNarrowSourceExecutionHandlerContractResult['responseShape'] {
  return validateGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractInput(input).responseShape
}

export function summarizeGstreamerMkvtoolnixNarrowSourceExecutionHandlerContractBoundary(): string[] {
  return [
    'Fail-closed handler contract source only; no route handler is registered at runtime.',
    'Requires approved snapshot, approval record, no-spend/credit policy, job, private/generated fixture manifest, worker envelope, QA, cleanup, audit, and idempotency references.',
    'Rejects route execution, worker dispatch, worker execution, GStreamer execution, MKVToolNix execution, media processing, Supabase mutation, SQL execution, signed/public artifacts, and unlock attempts.',
    `Confirmation gate: ${GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_ROUTE_CONFIRM_ENV}.`,
  ]
}
