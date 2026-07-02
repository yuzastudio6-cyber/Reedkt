import {
  GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_CONFIRM_ENV,
  GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_ID,
  buildGstreamerMkvtoolnixNarrowSourceExecutionWorkerSource,
  validateGstreamerMkvtoolnixNarrowSourceExecutionWorkerSource,
  type GstreamerMkvtoolnixNarrowSourceExecutionWorkerSource,
} from '../workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_PAYLOAD_KIND,
} from './rp-external-beta-gstreamer-mkvtoolnix-persisted-job-runtime-handoff-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_ROUTE_PATH,
  buildGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput,
  validateGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput,
  type GstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput,
} from './rp-external-beta-gstreamer-mkvtoolnix-persisted-job-worker-dispatch-claim-lease-1'

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_PACKET =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-SOURCE-GATE-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_DECISION =
  'completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_source_gate' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_EXECUTION =
  'completed_source_gate_dispatch_handoff_no_worker_dispatch_or_tool_execution' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_VALIDATED_MERGE_SHA =
  '1cd82653c437bcc5082ec7b54eb4d06098554a6c' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_VALIDATED_RUN_ID =
  '2026-07-02T15-13-58-300Z-7afbfde3' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_NEXT_MILESTONE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-DRY-RUN-1' as const

export type GstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateStatus =
  | 'completed_worker_dispatch_runtime_source_gate'
  | 'blocked_missing_worker_dispatch_runtime_source_gate_confirmation'
  | 'blocked_missing_worker_dispatch_runtime_source_gate_reference'
  | 'blocked_invalid_worker_dispatch_runtime_source_chain'
  | 'blocked_invalid_worker_dispatch_runtime_claim_lease_payload'
  | 'blocked_invalid_worker_dispatch_runtime_worker_source'
  | 'blocked_unsafe_worker_dispatch_runtime_source_gate_request'

export interface GstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateInput {
  sourceGateId: string
  sourceGateMode: 'dispatch_handoff_source_gate_no_worker_start' | string
  remoteValidationMergeSha: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_VALIDATED_MERGE_SHA | string
  remoteValidationRunId: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_VALIDATED_RUN_ID | string
  stagingTargetProjectRef: 'wmyyttnynmteqgcdishd' | string
  stagingTargetProjectName: 'Reeditpro' | string
  stagingTargetClass: 'staging' | string
  persistedClaimLeaseInput: GstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput
  workerSource: GstreamerMkvtoolnixNarrowSourceExecutionWorkerSource
  dispatchEnvelopeId: string
  dispatchEnvelopeMode: 'source_gate_ready_for_confirmation_gated_dispatch_dry_run' | string
  routeIdempotencyKey: string
  sourceGateConfirmed: boolean
  claimedJobCannotBeReclaimedBeforeDispatch: boolean
  rollbackResidueVerified: boolean
  routeExecutionRequestedNow?: boolean
  workerDispatchRequestedNow?: boolean
  workerExecutionRequestedNow?: boolean
  workerProcessStartRequestedNow?: boolean
  workerLeaseMutationRequestedNow?: boolean
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

export interface GstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateResult {
  packet: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_PACKET
  decision: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_DECISION
  execution: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_EXECUTION
  ok: boolean
  status: GstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateStatus
  blockers: GstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateStatus[]
  confirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_CONFIRM_ENV
  futureWorkerSourceConfirmationGate: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_CONFIRM_ENV
  persistedClaimLeaseRoutePath: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_ROUTE_PATH
  sanitizedDispatchSourceGate: {
    sourceGateId: string
    sourceGateMode: 'dispatch_handoff_source_gate_no_worker_start'
    remoteValidationMergeSha: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_VALIDATED_MERGE_SHA
    remoteValidationRunId: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_VALIDATED_RUN_ID
    stagingTargetProjectRef: 'wmyyttnynmteqgcdishd'
    persistedJobId: string
    persistedJobType: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE
    persistedJobPayloadKind: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_PAYLOAD_KIND
    workerType: 'gstreamer_mkvtoolnix_generated_fixture_worker'
    workerSourceId: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_ID
    workerSourceRegisteredAtRuntime: false
    claimLeaseMode: 'remote_supabase_worker_claim_lease_no_worker_execution'
    claimedJobCannotBeReclaimedBeforeDispatch: true
    rollbackResidueVerified: true
    dispatchEnvelopeId: string
    dispatchEnvelopeMode: 'source_gate_ready_for_confirmation_gated_dispatch_dry_run'
    dispatchEnvelopeReady: boolean
    routeIdempotencyKey: string
    workerDispatch: false
    workerExecution: false
    workerProcessStart: false
    workerLeaseMutation: false
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
    sourceGateEvaluation: 'completed_source_gate_validation' | 'not_run_blocked_before_source_gate'
    dispatchEnvelopeCreated: 'completed_metadata_only_source_envelope' | false
    routeHandlerInvocation: false
    workerDispatch: false
    workerExecution: false
    workerProcessStart: false
    workerLeaseMutation: false
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
  nextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_NEXT_MILESTONE
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function blank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function expectedRouteIdempotencyKey(
  input: Pick<GstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateInput, 'sourceGateId' | 'dispatchEnvelopeId' | 'persistedClaimLeaseInput'>,
): string {
  return [
    'gstreamer-mkvtoolnix',
    'worker-dispatch-runtime-source-gate-1',
    input.persistedClaimLeaseInput.workspaceId,
    input.persistedClaimLeaseInput.projectId,
    input.persistedClaimLeaseInput.approvedSnapshotId,
    input.persistedClaimLeaseInput.persistedJobId,
    input.sourceGateId,
    input.dispatchEnvelopeId,
  ].join(':')
}

export function buildGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateInput(
  overrides: Partial<GstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateInput> = {},
): GstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateInput {
  const sourceGateId = overrides.sourceGateId ?? 'source-gate-gstreamer-mkvtoolnix-worker-dispatch-runtime-1'
  const dispatchEnvelopeId = overrides.dispatchEnvelopeId ?? 'dispatch-envelope-gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1'
  const persistedClaimLeaseInput = overrides.persistedClaimLeaseInput ?? buildGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput({
    persistedJobId: 'job-persisted-gstreamer-mkvtoolnix-generated-fixture-runtime-source-gate-1',
    persistedInvocationId: 'persisted-runtime-invocation-gstreamer-mkvtoolnix-generated-fixture-source-gate-1',
    workerInstanceId: 'remote-gstreamer-mkvtoolnix-source-gate-worker-1',
    claimLeaseMode: 'remote_supabase_worker_claim_lease_no_worker_execution',
    remoteWorkerClaimLeaseConfirmed: true,
  })
  const base = {
    sourceGateId,
    sourceGateMode: overrides.sourceGateMode ?? 'dispatch_handoff_source_gate_no_worker_start',
    remoteValidationMergeSha: overrides.remoteValidationMergeSha ?? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_VALIDATED_MERGE_SHA,
    remoteValidationRunId: overrides.remoteValidationRunId ?? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_VALIDATED_RUN_ID,
    stagingTargetProjectRef: overrides.stagingTargetProjectRef ?? 'wmyyttnynmteqgcdishd',
    stagingTargetProjectName: overrides.stagingTargetProjectName ?? 'Reeditpro',
    stagingTargetClass: overrides.stagingTargetClass ?? 'staging',
    persistedClaimLeaseInput,
    workerSource: overrides.workerSource ?? buildGstreamerMkvtoolnixNarrowSourceExecutionWorkerSource(),
    dispatchEnvelopeId,
    dispatchEnvelopeMode: overrides.dispatchEnvelopeMode ?? 'source_gate_ready_for_confirmation_gated_dispatch_dry_run',
    sourceGateConfirmed: overrides.sourceGateConfirmed ?? true,
    claimedJobCannotBeReclaimedBeforeDispatch: overrides.claimedJobCannotBeReclaimedBeforeDispatch ?? true,
    rollbackResidueVerified: overrides.rollbackResidueVerified ?? true,
    routeExecutionRequestedNow: overrides.routeExecutionRequestedNow ?? false,
    workerDispatchRequestedNow: overrides.workerDispatchRequestedNow ?? false,
    workerExecutionRequestedNow: overrides.workerExecutionRequestedNow ?? false,
    workerProcessStartRequestedNow: overrides.workerProcessStartRequestedNow ?? false,
    workerLeaseMutationRequestedNow: overrides.workerLeaseMutationRequestedNow ?? false,
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

export function validateGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateInput(
  input: GstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateInput,
): GstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateStatus[] {
  const blockers: GstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateStatus[] = []
  const payload = input.persistedClaimLeaseInput.persistedJobPayloadJson

  for (const value of [
    input.sourceGateId,
    input.remoteValidationMergeSha,
    input.remoteValidationRunId,
    input.stagingTargetProjectRef,
    input.dispatchEnvelopeId,
    input.routeIdempotencyKey,
    input.persistedClaimLeaseInput.persistedJobId,
  ]) {
    if (blank(value)) pushOnce(blockers, 'blocked_missing_worker_dispatch_runtime_source_gate_reference')
  }

  if (!input.sourceGateConfirmed) {
    pushOnce(blockers, 'blocked_missing_worker_dispatch_runtime_source_gate_confirmation')
  }

  if (
    input.sourceGateMode !== 'dispatch_handoff_source_gate_no_worker_start' ||
    input.remoteValidationMergeSha !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_VALIDATED_MERGE_SHA ||
    input.remoteValidationRunId !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_VALIDATED_RUN_ID ||
    input.stagingTargetProjectName !== 'Reeditpro' ||
    input.stagingTargetProjectRef !== 'wmyyttnynmteqgcdishd' ||
    input.stagingTargetClass !== 'staging' ||
    input.dispatchEnvelopeMode !== 'source_gate_ready_for_confirmation_gated_dispatch_dry_run' ||
    !input.claimedJobCannotBeReclaimedBeforeDispatch ||
    !input.rollbackResidueVerified
  ) {
    pushOnce(blockers, 'blocked_invalid_worker_dispatch_runtime_source_chain')
  }

  if (
    input.persistedClaimLeaseInput.persistedJobType !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE ||
    payload?.persistedJobPayloadKind !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_PAYLOAD_KIND ||
    input.persistedClaimLeaseInput.claimLeaseMode !== 'remote_supabase_worker_claim_lease_no_worker_execution' ||
    !input.persistedClaimLeaseInput.remoteWorkerClaimLeaseConfirmed ||
    input.persistedClaimLeaseInput.workerType !== 'gstreamer_mkvtoolnix_generated_fixture_worker' ||
    validateGstreamerMkvtoolnixPersistedJobWorkerDispatchClaimLeaseInput(input.persistedClaimLeaseInput).length > 0
  ) {
    pushOnce(blockers, 'blocked_invalid_worker_dispatch_runtime_claim_lease_payload')
  }

  if (
    input.workerSource.sourceId !== GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_ID ||
    !validateGstreamerMkvtoolnixNarrowSourceExecutionWorkerSource(input.workerSource).ok
  ) {
    pushOnce(blockers, 'blocked_invalid_worker_dispatch_runtime_worker_source')
  }

  if (input.routeIdempotencyKey !== expectedRouteIdempotencyKey(input)) {
    pushOnce(blockers, 'blocked_invalid_worker_dispatch_runtime_source_chain')
  }

  if (
    input.routeExecutionRequestedNow ||
    input.workerDispatchRequestedNow ||
    input.workerExecutionRequestedNow ||
    input.workerProcessStartRequestedNow ||
    input.workerLeaseMutationRequestedNow ||
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
    pushOnce(blockers, 'blocked_unsafe_worker_dispatch_runtime_source_gate_request')
  }

  return blockers
}

function buildResult(
  input: GstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateInput,
  ok: boolean,
  status: GstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateStatus,
  blockers: GstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateStatus[],
): GstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateResult {
  return {
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_PACKET,
    decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_DECISION,
    execution: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_EXECUTION,
    ok,
    status,
    blockers,
    confirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_CONFIRM_ENV,
    futureWorkerSourceConfirmationGate: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_CONFIRM_ENV,
    persistedClaimLeaseRoutePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_WORKER_DISPATCH_CLAIM_LEASE_ROUTE_PATH,
    sanitizedDispatchSourceGate: {
      sourceGateId: input.sourceGateId,
      sourceGateMode: 'dispatch_handoff_source_gate_no_worker_start',
      remoteValidationMergeSha: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_VALIDATED_MERGE_SHA,
      remoteValidationRunId: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_VALIDATED_RUN_ID,
      stagingTargetProjectRef: 'wmyyttnynmteqgcdishd',
      persistedJobId: input.persistedClaimLeaseInput.persistedJobId,
      persistedJobType: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_JOB_TYPE,
      persistedJobPayloadKind: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_PERSISTED_JOB_RUNTIME_HANDOFF_PAYLOAD_KIND,
      workerType: 'gstreamer_mkvtoolnix_generated_fixture_worker',
      workerSourceId: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_ID,
      workerSourceRegisteredAtRuntime: false,
      claimLeaseMode: 'remote_supabase_worker_claim_lease_no_worker_execution',
      claimedJobCannotBeReclaimedBeforeDispatch: true,
      rollbackResidueVerified: true,
      dispatchEnvelopeId: input.dispatchEnvelopeId,
      dispatchEnvelopeMode: 'source_gate_ready_for_confirmation_gated_dispatch_dry_run',
      dispatchEnvelopeReady: ok,
      routeIdempotencyKey: input.routeIdempotencyKey,
      workerDispatch: false,
      workerExecution: false,
      workerProcessStart: false,
      workerLeaseMutation: false,
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
      sourceGateEvaluation: ok ? 'completed_source_gate_validation' : 'not_run_blocked_before_source_gate',
      dispatchEnvelopeCreated: ok ? 'completed_metadata_only_source_envelope' : false,
      routeHandlerInvocation: false,
      workerDispatch: false,
      workerExecution: false,
      workerProcessStart: false,
      workerLeaseMutation: false,
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
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_NEXT_MILESTONE,
  }
}

export function runGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGate(
  input: GstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateInput,
  env: NodeJS.ProcessEnv = process.env,
): GstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateResult {
  const blockers = validateGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateInput(input)

  if (env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_CONFIRM_ENV] !== 'true') {
    pushOnce(blockers, 'blocked_missing_worker_dispatch_runtime_source_gate_confirmation')
  }

  return buildResult(
    input,
    blockers.length === 0,
    blockers[0] ?? 'completed_worker_dispatch_runtime_source_gate',
    blockers,
  )
}

export function summarizeGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateBoundary(): string[] {
  return [
    'Consumes the #2155 remote worker claim/lease rollback proof and the persisted job payload compatibility repair.',
    'Requires quality_check as the DB job type and gstreamer_mkvtoolnix_generated_fixture_runtime as the payload kind.',
    'Creates only a metadata dispatch envelope for a future confirmation-gated dispatch dry-run.',
    'Does not invoke a route handler, mutate worker leases, dispatch/start a worker, run GStreamer/MKVToolNix, process media, create artifacts, or unlock beta/production/final export.',
  ]
}
