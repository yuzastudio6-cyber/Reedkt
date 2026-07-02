import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_NEXT_MILESTONE,
  buildGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateInput,
  runGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGate,
  type GstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateResult,
} from './rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-source-gate-1'

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_PACKET =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-DRY-RUN-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_DECISION =
  'completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_dry_run' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_EXECUTION =
  'completed_confirmation_gated_worker_dispatch_dry_run_no_worker_start_or_tool_execution' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_SOURCE_GATE_MERGE_SHA =
  '488df755ef9f9954e8696ed336f9106bada06319' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_NEXT_MILESTONE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXECUTION-PACKET-1' as const

export type GstreamerMkvtoolnixWorkerDispatchRuntimeDryRunStatus =
  | 'completed_worker_dispatch_runtime_dry_run'
  | 'blocked_missing_worker_dispatch_runtime_dry_run_confirmation'
  | 'blocked_missing_worker_dispatch_runtime_dry_run_reference'
  | 'blocked_invalid_worker_dispatch_runtime_dry_run_source_gate'
  | 'blocked_invalid_worker_dispatch_runtime_dry_run_state'
  | 'blocked_worker_dispatch_runtime_dry_run_idempotency_mismatch'
  | 'blocked_unsafe_worker_dispatch_runtime_dry_run_request'

export interface GstreamerMkvtoolnixWorkerDispatchRuntimeDryRunInput {
  dryRunId: string
  dryRunMode: 'worker_dispatch_handoff_dry_run_no_worker_start' | string
  sourceGateMergeSha: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_SOURCE_GATE_MERGE_SHA | string
  sourceGateDecision: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_DECISION | string
  sourceGateResult: GstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateResult
  dryRunDispatchEnvelopeId: string
  dryRunDispatchEnvelopeMode: 'dry_run_dispatch_envelope_no_route_no_worker_start' | string
  dryRunIdempotencyKey: string
  dryRunConfirmed: boolean
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

export interface GstreamerMkvtoolnixWorkerDispatchRuntimeDryRunResult {
  packet: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_PACKET
  decision: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_DECISION
  execution: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_EXECUTION
  ok: boolean
  status: GstreamerMkvtoolnixWorkerDispatchRuntimeDryRunStatus
  blockers: GstreamerMkvtoolnixWorkerDispatchRuntimeDryRunStatus[]
  confirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_CONFIRM_ENV
  sourceGateConfirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_CONFIRM_ENV
  sanitizedWorkerDispatchDryRun: {
    dryRunId: string
    dryRunMode: 'worker_dispatch_handoff_dry_run_no_worker_start'
    sourceGateMergeSha: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_SOURCE_GATE_MERGE_SHA
    sourceGateDecision: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_DECISION
    sourceGateNextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_NEXT_MILESTONE
    stagingTargetProjectRef: 'wmyyttnynmteqgcdishd'
    stagingTargetProjectName: 'Reeditpro'
    stagingTargetClass: 'staging'
    persistedJobId: string
    persistedJobType: 'quality_check'
    persistedJobPayloadKind: 'gstreamer_mkvtoolnix_generated_fixture_runtime'
    workerType: 'gstreamer_mkvtoolnix_generated_fixture_worker'
    claimLeaseMode: 'remote_supabase_worker_claim_lease_no_worker_execution'
    claimedJobCannotBeReclaimedBeforeDispatch: true
    rollbackResidueVerified: true
    sourceGateDispatchEnvelopeId: string
    sourceGateDispatchEnvelopeMode: 'source_gate_ready_for_confirmation_gated_dispatch_dry_run'
    dryRunDispatchEnvelopeId: string
    dryRunDispatchEnvelopeMode: 'dry_run_dispatch_envelope_no_route_no_worker_start'
    dryRunDispatchEnvelopeReady: boolean
    dryRunIdempotencyKey: string
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
    supabaseMutation: false
    sqlExecution: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
  }
  safety: {
    dryRunEvaluation: 'completed_worker_dispatch_runtime_dry_run_validation' | 'not_run_blocked_before_dry_run'
    dryRunDispatchEnvelopeCreated: 'completed_metadata_only_dry_run_dispatch_envelope' | false
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
  nextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_NEXT_MILESTONE
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function blank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function expectedDryRunIdempotencyKey(input: Pick<GstreamerMkvtoolnixWorkerDispatchRuntimeDryRunInput, 'dryRunId' | 'dryRunDispatchEnvelopeId' | 'sourceGateResult'>): string {
  const sourceGate = input.sourceGateResult.sanitizedDispatchSourceGate
  return [
    'gstreamer-mkvtoolnix',
    'worker-dispatch-runtime-dry-run-1',
    sourceGate.stagingTargetProjectRef,
    sourceGate.persistedJobId,
    sourceGate.dispatchEnvelopeId,
    input.dryRunId,
    input.dryRunDispatchEnvelopeId,
  ].join(':')
}

export function buildGstreamerMkvtoolnixWorkerDispatchRuntimeDryRunInput(
  overrides: Partial<GstreamerMkvtoolnixWorkerDispatchRuntimeDryRunInput> = {},
): GstreamerMkvtoolnixWorkerDispatchRuntimeDryRunInput {
  const sourceGateResult = overrides.sourceGateResult ?? runGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGate(
    buildGstreamerMkvtoolnixWorkerDispatchRuntimeSourceGateInput(),
    { [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_CONFIRM_ENV]: 'true' },
  )
  const dryRunId = overrides.dryRunId ?? 'dry-run-gstreamer-mkvtoolnix-worker-dispatch-runtime-1'
  const dryRunDispatchEnvelopeId =
    overrides.dryRunDispatchEnvelopeId ?? 'dispatch-envelope-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1'
  const base = {
    dryRunId,
    dryRunMode: overrides.dryRunMode ?? 'worker_dispatch_handoff_dry_run_no_worker_start',
    sourceGateMergeSha: overrides.sourceGateMergeSha ?? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_SOURCE_GATE_MERGE_SHA,
    sourceGateDecision: overrides.sourceGateDecision ?? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_DECISION,
    sourceGateResult,
    dryRunDispatchEnvelopeId,
    dryRunDispatchEnvelopeMode: overrides.dryRunDispatchEnvelopeMode ?? 'dry_run_dispatch_envelope_no_route_no_worker_start',
    dryRunConfirmed: overrides.dryRunConfirmed ?? true,
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
    dryRunIdempotencyKey: overrides.dryRunIdempotencyKey ?? expectedDryRunIdempotencyKey(base),
  }
}

export function validateGstreamerMkvtoolnixWorkerDispatchRuntimeDryRunInput(
  input: GstreamerMkvtoolnixWorkerDispatchRuntimeDryRunInput,
): GstreamerMkvtoolnixWorkerDispatchRuntimeDryRunStatus[] {
  const blockers: GstreamerMkvtoolnixWorkerDispatchRuntimeDryRunStatus[] = []
  const sourceGate = input.sourceGateResult?.sanitizedDispatchSourceGate

  for (const value of [
    input.dryRunId,
    input.sourceGateMergeSha,
    input.sourceGateDecision,
    input.dryRunDispatchEnvelopeId,
    input.dryRunIdempotencyKey,
    sourceGate?.dispatchEnvelopeId,
    sourceGate?.persistedJobId,
  ]) {
    if (blank(value)) pushOnce(blockers, 'blocked_missing_worker_dispatch_runtime_dry_run_reference')
  }

  if (!input.dryRunConfirmed) {
    pushOnce(blockers, 'blocked_missing_worker_dispatch_runtime_dry_run_confirmation')
  }

  if (
    input.sourceGateMergeSha !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_SOURCE_GATE_MERGE_SHA ||
    input.sourceGateDecision !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_DECISION ||
    input.sourceGateResult?.ok !== true ||
    input.sourceGateResult?.decision !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_DECISION ||
    sourceGate?.dispatchEnvelopeReady !== true ||
    sourceGate?.dispatchEnvelopeMode !== 'source_gate_ready_for_confirmation_gated_dispatch_dry_run' ||
    sourceGate?.stagingTargetProjectRef !== 'wmyyttnynmteqgcdishd' ||
    sourceGate?.persistedJobType !== 'quality_check' ||
    sourceGate?.persistedJobPayloadKind !== 'gstreamer_mkvtoolnix_generated_fixture_runtime' ||
    sourceGate?.workerType !== 'gstreamer_mkvtoolnix_generated_fixture_worker' ||
    sourceGate?.claimLeaseMode !== 'remote_supabase_worker_claim_lease_no_worker_execution' ||
    sourceGate?.claimedJobCannotBeReclaimedBeforeDispatch !== true ||
    sourceGate?.rollbackResidueVerified !== true
  ) {
    pushOnce(blockers, 'blocked_invalid_worker_dispatch_runtime_dry_run_source_gate')
  }

  if (
    input.dryRunMode !== 'worker_dispatch_handoff_dry_run_no_worker_start' ||
    input.dryRunDispatchEnvelopeMode !== 'dry_run_dispatch_envelope_no_route_no_worker_start'
  ) {
    pushOnce(blockers, 'blocked_invalid_worker_dispatch_runtime_dry_run_state')
  }

  if (input.dryRunIdempotencyKey !== expectedDryRunIdempotencyKey(input)) {
    pushOnce(blockers, 'blocked_worker_dispatch_runtime_dry_run_idempotency_mismatch')
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
    pushOnce(blockers, 'blocked_unsafe_worker_dispatch_runtime_dry_run_request')
  }

  return blockers
}

function buildResult(
  input: GstreamerMkvtoolnixWorkerDispatchRuntimeDryRunInput,
  ok: boolean,
  status: GstreamerMkvtoolnixWorkerDispatchRuntimeDryRunStatus,
  blockers: GstreamerMkvtoolnixWorkerDispatchRuntimeDryRunStatus[],
): GstreamerMkvtoolnixWorkerDispatchRuntimeDryRunResult {
  const sourceGate = input.sourceGateResult.sanitizedDispatchSourceGate
  return {
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_PACKET,
    decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_DECISION,
    execution: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_EXECUTION,
    ok,
    status,
    blockers,
    confirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_CONFIRM_ENV,
    sourceGateConfirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_CONFIRM_ENV,
    sanitizedWorkerDispatchDryRun: {
      dryRunId: input.dryRunId,
      dryRunMode: 'worker_dispatch_handoff_dry_run_no_worker_start',
      sourceGateMergeSha: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_SOURCE_GATE_MERGE_SHA,
      sourceGateDecision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_DECISION,
      sourceGateNextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_SOURCE_GATE_NEXT_MILESTONE,
      stagingTargetProjectRef: 'wmyyttnynmteqgcdishd',
      stagingTargetProjectName: 'Reeditpro',
      stagingTargetClass: 'staging',
      persistedJobId: sourceGate.persistedJobId,
      persistedJobType: 'quality_check',
      persistedJobPayloadKind: 'gstreamer_mkvtoolnix_generated_fixture_runtime',
      workerType: 'gstreamer_mkvtoolnix_generated_fixture_worker',
      claimLeaseMode: 'remote_supabase_worker_claim_lease_no_worker_execution',
      claimedJobCannotBeReclaimedBeforeDispatch: true,
      rollbackResidueVerified: true,
      sourceGateDispatchEnvelopeId: sourceGate.dispatchEnvelopeId,
      sourceGateDispatchEnvelopeMode: 'source_gate_ready_for_confirmation_gated_dispatch_dry_run',
      dryRunDispatchEnvelopeId: input.dryRunDispatchEnvelopeId,
      dryRunDispatchEnvelopeMode: 'dry_run_dispatch_envelope_no_route_no_worker_start',
      dryRunDispatchEnvelopeReady: ok,
      dryRunIdempotencyKey: input.dryRunIdempotencyKey,
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
      supabaseMutation: false,
      sqlExecution: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
    },
    safety: {
      dryRunEvaluation: ok ? 'completed_worker_dispatch_runtime_dry_run_validation' : 'not_run_blocked_before_dry_run',
      dryRunDispatchEnvelopeCreated: ok ? 'completed_metadata_only_dry_run_dispatch_envelope' : false,
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
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_NEXT_MILESTONE,
  }
}

export function runGstreamerMkvtoolnixWorkerDispatchRuntimeDryRun(
  input: GstreamerMkvtoolnixWorkerDispatchRuntimeDryRunInput,
  env: NodeJS.ProcessEnv = process.env,
): GstreamerMkvtoolnixWorkerDispatchRuntimeDryRunResult {
  const blockers = validateGstreamerMkvtoolnixWorkerDispatchRuntimeDryRunInput(input)

  if (env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_CONFIRM_ENV] !== 'true') {
    pushOnce(blockers, 'blocked_missing_worker_dispatch_runtime_dry_run_confirmation')
  }

  return buildResult(
    input,
    blockers.length === 0,
    blockers[0] ?? 'completed_worker_dispatch_runtime_dry_run',
    blockers,
  )
}

export function summarizeGstreamerMkvtoolnixWorkerDispatchRuntimeDryRunBoundary(): string[] {
  return [
    'Consumes the merged #2158 source-gate evidence and the #2155 remote worker claim/lease rollback proof.',
    'Validates a confirmation-gated worker dispatch handoff envelope without invoking a route handler.',
    'Keeps worker dispatch, worker execution, worker process start, worker lease mutation, and persistent queue writes false.',
    'Does not run GStreamer/MKVToolNix, process media, run FFmpeg/FFprobe, run Docker/Remotion, mutate Supabase/SQL, create artifacts beyond local /tmp evidence, or unlock beta/production/final export.',
  ]
}
