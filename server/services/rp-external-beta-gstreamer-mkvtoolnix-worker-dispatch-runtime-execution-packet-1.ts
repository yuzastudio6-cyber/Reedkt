import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
  buildGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput,
  runGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridge,
  type GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput,
  type GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeResult,
} from './rp-external-beta-gstreamer-mkvtoolnix-narrow-execution-ready-route-worker-bridge-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_NEXT_MILESTONE,
  buildGstreamerMkvtoolnixWorkerDispatchRuntimeDryRunInput,
  runGstreamerMkvtoolnixWorkerDispatchRuntimeDryRun,
  type GstreamerMkvtoolnixWorkerDispatchRuntimeDryRunResult,
} from './rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1'
import {
  GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_ID,
  GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_PATH,
} from '../workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered'

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_PACKET =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXECUTION-PACKET-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_DECISION =
  'completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_execution_packet' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_EXECUTION =
  'completed_confirmation_gated_worker_dispatch_runtime_execution_packet_existing_guarded_route_delegate' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_SOURCE_GATE_MERGE_SHA =
  '488df755ef9f9954e8696ed336f9106bada06319' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_DRY_RUN_MERGE_SHA =
  'ef5b15adcf5de407f3083abb64ffc14b298692cc' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_DRY_RUN_RUN_ID =
  '2026-07-02T16-10-17-014Z-eec19f59' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_NEXT_MILESTONE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXECUTION-QA-1' as const

export type GstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketStatus =
  | 'completed_worker_dispatch_runtime_execution_packet'
  | 'blocked_missing_worker_dispatch_runtime_execution_packet_confirmation'
  | 'blocked_missing_worker_dispatch_runtime_execution_packet_reference'
  | 'blocked_invalid_worker_dispatch_runtime_execution_packet_dry_run_source'
  | 'blocked_invalid_worker_dispatch_runtime_execution_packet_state'
  | 'blocked_worker_dispatch_runtime_execution_packet_idempotency_mismatch'
  | 'blocked_worker_dispatch_runtime_execution_packet_route_delegate_failed'
  | 'blocked_worker_dispatch_runtime_execution_packet_route_delegate_safety_invalid'
  | 'blocked_unsafe_worker_dispatch_runtime_execution_packet_request'

export interface GstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketInput {
  executionPacketId: string
  executionMode: 'confirmed_worker_dispatch_runtime_execution_packet_existing_guarded_route_delegate' | string
  sourceGateMergeSha:
    | typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_SOURCE_GATE_MERGE_SHA
    | string
  dryRunMergeSha:
    | typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_DRY_RUN_MERGE_SHA
    | string
  dryRunRunId:
    | typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_DRY_RUN_RUN_ID
    | string
  dryRunDecision:
    | typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_DECISION
    | string
  dryRunResult: GstreamerMkvtoolnixWorkerDispatchRuntimeDryRunResult
  stagingTargetProjectName: 'Reeditpro' | string
  stagingTargetProjectRef: 'wmyyttnynmteqgcdishd' | string
  stagingTargetClass: 'staging' | string
  routePath: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH | string
  workerSourceId: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_ID | string
  workerSourcePath: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_PATH | string
  persistedJobType: 'quality_check' | string
  persistedJobPayloadKind: 'gstreamer_mkvtoolnix_generated_fixture_runtime' | string
  workerType: 'gstreamer_mkvtoolnix_generated_fixture_worker' | string
  claimLeaseMode: 'remote_supabase_worker_claim_lease_no_worker_execution' | string
  dryRunDispatchEnvelopeMode: 'dry_run_dispatch_envelope_no_route_no_worker_start' | string
  runtimeRouteInput: GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput
  executionPacketIdempotencyKey: string
  rollbackPlanId: string
  cleanupPlanId: string
  evidenceDirectory: string
  confirmation: boolean
  routeHandlerInvocationRequestedNow?: boolean
  runtimeRouteDelegateRequestedNow?: boolean
  workerDispatchRequestedNow?: boolean
  workerExecutionRequestedNow?: boolean
  workerProcessStartRequestedNow?: boolean
  workerLeaseMutationRequestedNow?: boolean
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

export interface GstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketResult {
  packet: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_PACKET
  decision: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_DECISION
  execution: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_EXECUTION
  ok: boolean
  status: GstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketStatus
  blockers: GstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketStatus[]
  confirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_CONFIRM_ENV
  dryRunConfirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_CONFIRM_ENV
  routeConfirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV
  routePath: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH
  routeResult?: GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeResult
  sanitizedExecutionPacket: {
    executionPacketId: string
    executionMode: 'confirmed_worker_dispatch_runtime_execution_packet_existing_guarded_route_delegate'
    sourceGateMergeSha: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_SOURCE_GATE_MERGE_SHA
    dryRunMergeSha: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_DRY_RUN_MERGE_SHA
    dryRunRunId: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_DRY_RUN_RUN_ID
    dryRunDecision: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_DECISION
    dryRunNextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_NEXT_MILESTONE
    stagingTargetProjectName: 'Reeditpro'
    stagingTargetProjectRef: 'wmyyttnynmteqgcdishd'
    stagingTargetClass: 'staging'
    routePath: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH
    workerSourceId: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_ID
    workerSourcePath: typeof GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_PATH
    persistedJobId: string
    persistedJobType: 'quality_check'
    persistedJobPayloadKind: 'gstreamer_mkvtoolnix_generated_fixture_runtime'
    workerType: 'gstreamer_mkvtoolnix_generated_fixture_worker'
    claimLeaseMode: 'remote_supabase_worker_claim_lease_no_worker_execution'
    dryRunDispatchEnvelopeMode: 'dry_run_dispatch_envelope_no_route_no_worker_start'
    sourceGateDispatchEnvelopeMode: 'source_gate_ready_for_confirmation_gated_dispatch_dry_run'
    executionPacketIdempotencyKey: string
    runtimeRouteIdempotencyKey: string
    rollbackPlanId: string
    cleanupPlanId: string
    evidenceDirectory: string
    routeHandlerInvocation: 'completed_guarded_route_handler' | 'not_run_blocked_before_route_delegate'
    runtimeRouteDelegate: 'completed_existing_guarded_route_delegate' | false
    runtimeRouteRunnerRunId: string | null
    runtimeRouteRunnerOutputDir: string | null
    runtimeRouteRunnerArtifacts: Array<{ fileName: string; bytes: number; sha256: string }>
    workerDispatch: false
    workerExecution: false
    workerProcessStart: false
    workerLeaseMutation: false
    persistentJobQueueWrite: false
    gstreamerExecution: 'completed_controlled_generated_fixture_only' | false
    mkvtoolnixExecution: 'completed_controlled_generated_fixture_only' | false
    mediaProcessing: 'controlled_generated_fixture_only' | false
    privateMediaProcessing: false
    userMediaProcessing: false
    supabaseMutation: false
    sqlExecution: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
  }
  safety: {
    dryRunEvidenceAccepted: 'completed_dry_run_source_evidence_validation' | false
    routeHandlerInvocation: 'completed_guarded_route_handler' | false
    runtimeRouteDelegate: 'completed_existing_guarded_route_delegate' | false
    realWorkerDispatch: false
    workerExecution: false
    workerProcessStart: false
    workerLeaseMutation: false
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
  nextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_NEXT_MILESTONE
}

export interface GstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketDependencies {
  env?: NodeJS.ProcessEnv
  routeRunner?: (
    input: GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput,
  ) => Promise<GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeResult>
}

function pushOnce<T>(list: T[], value: T): void {
  if (!list.includes(value)) list.push(value)
}

function blank(value: unknown): boolean {
  return typeof value !== 'string' || value.trim().length === 0
}

function expectedExecutionPacketIdempotencyKey(
  input: Pick<
    GstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketInput,
    'executionPacketId' | 'dryRunResult' | 'runtimeRouteInput'
  >,
): string {
  const dryRun = input.dryRunResult.sanitizedWorkerDispatchDryRun
  return [
    'gstreamer-mkvtoolnix',
    'worker-dispatch-runtime-execution-packet-1',
    dryRun.stagingTargetProjectRef,
    dryRun.persistedJobId,
    dryRun.dryRunDispatchEnvelopeId,
    input.executionPacketId,
    input.runtimeRouteInput.routeIdempotencyKey,
  ].join(':')
}

export function buildGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketInput(
  overrides: Partial<GstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketInput> = {},
): GstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketInput {
  const dryRunResult = overrides.dryRunResult ?? runGstreamerMkvtoolnixWorkerDispatchRuntimeDryRun(
    buildGstreamerMkvtoolnixWorkerDispatchRuntimeDryRunInput(),
    { [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_CONFIRM_ENV]: 'true' },
  )
  const runtimeRouteInput = overrides.runtimeRouteInput ?? buildGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput({
    jobId: dryRunResult.sanitizedWorkerDispatchDryRun.persistedJobId,
    workerEnvelopeId: dryRunResult.sanitizedWorkerDispatchDryRun.dryRunDispatchEnvelopeId,
    routeIdempotencyKey: `idem-worker-dispatch-runtime-execution-packet-${dryRunResult.sanitizedWorkerDispatchDryRun.persistedJobId}`,
  })
  const executionPacketId =
    overrides.executionPacketId ?? 'execution-packet-gstreamer-mkvtoolnix-worker-dispatch-runtime-1'
  const base = {
    executionPacketId,
    executionMode: overrides.executionMode ?? 'confirmed_worker_dispatch_runtime_execution_packet_existing_guarded_route_delegate',
    sourceGateMergeSha:
      overrides.sourceGateMergeSha ?? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_SOURCE_GATE_MERGE_SHA,
    dryRunMergeSha:
      overrides.dryRunMergeSha ?? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_DRY_RUN_MERGE_SHA,
    dryRunRunId:
      overrides.dryRunRunId ?? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_DRY_RUN_RUN_ID,
    dryRunDecision: overrides.dryRunDecision ?? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_DECISION,
    dryRunResult,
    stagingTargetProjectName: overrides.stagingTargetProjectName ?? 'Reeditpro',
    stagingTargetProjectRef: overrides.stagingTargetProjectRef ?? 'wmyyttnynmteqgcdishd',
    stagingTargetClass: overrides.stagingTargetClass ?? 'staging',
    routePath: overrides.routePath ?? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
    workerSourceId: overrides.workerSourceId ?? GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_ID,
    workerSourcePath: overrides.workerSourcePath ?? GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_PATH,
    persistedJobType: overrides.persistedJobType ?? 'quality_check',
    persistedJobPayloadKind: overrides.persistedJobPayloadKind ?? 'gstreamer_mkvtoolnix_generated_fixture_runtime',
    workerType: overrides.workerType ?? 'gstreamer_mkvtoolnix_generated_fixture_worker',
    claimLeaseMode: overrides.claimLeaseMode ?? 'remote_supabase_worker_claim_lease_no_worker_execution',
    dryRunDispatchEnvelopeMode: overrides.dryRunDispatchEnvelopeMode ?? 'dry_run_dispatch_envelope_no_route_no_worker_start',
    runtimeRouteInput,
    rollbackPlanId: overrides.rollbackPlanId ?? 'rollback-remote-claim-lease-already-verified-no-persistent-dispatch-residue',
    cleanupPlanId: overrides.cleanupPlanId ?? 'cleanup-tmp-evidence-only-no-persistent-public-artifacts',
    evidenceDirectory:
      overrides.evidenceDirectory ??
      '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1/<runId>',
    confirmation: overrides.confirmation ?? true,
    routeHandlerInvocationRequestedNow: overrides.routeHandlerInvocationRequestedNow ?? true,
    runtimeRouteDelegateRequestedNow: overrides.runtimeRouteDelegateRequestedNow ?? true,
    workerDispatchRequestedNow: overrides.workerDispatchRequestedNow ?? false,
    workerExecutionRequestedNow: overrides.workerExecutionRequestedNow ?? false,
    workerProcessStartRequestedNow: overrides.workerProcessStartRequestedNow ?? false,
    workerLeaseMutationRequestedNow: overrides.workerLeaseMutationRequestedNow ?? false,
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
    executionPacketIdempotencyKey:
      overrides.executionPacketIdempotencyKey ?? expectedExecutionPacketIdempotencyKey(base),
  }
}

export function validateGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketInput(
  input: GstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketInput,
): GstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketStatus[] {
  const blockers: GstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketStatus[] = []
  const dryRun = input.dryRunResult?.sanitizedWorkerDispatchDryRun

  for (const value of [
    input.executionPacketId,
    input.sourceGateMergeSha,
    input.dryRunMergeSha,
    input.dryRunRunId,
    input.dryRunDecision,
    input.routePath,
    input.workerSourceId,
    input.workerSourcePath,
    input.executionPacketIdempotencyKey,
    input.rollbackPlanId,
    input.cleanupPlanId,
    input.evidenceDirectory,
    dryRun?.persistedJobId,
    input.runtimeRouteInput?.routeIdempotencyKey,
  ]) {
    if (blank(value)) pushOnce(blockers, 'blocked_missing_worker_dispatch_runtime_execution_packet_reference')
  }

  if (!input.confirmation) {
    pushOnce(blockers, 'blocked_missing_worker_dispatch_runtime_execution_packet_confirmation')
  }

  if (
    input.dryRunResult?.ok !== true ||
    input.sourceGateMergeSha !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_SOURCE_GATE_MERGE_SHA ||
    input.dryRunMergeSha !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_DRY_RUN_MERGE_SHA ||
    input.dryRunRunId !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_DRY_RUN_RUN_ID ||
    input.dryRunDecision !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_DECISION ||
    input.dryRunResult?.decision !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_DECISION ||
    input.dryRunResult?.nextMilestone !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_NEXT_MILESTONE ||
    dryRun?.sourceGateMergeSha !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_SOURCE_GATE_MERGE_SHA ||
    dryRun?.stagingTargetProjectName !== 'Reeditpro' ||
    dryRun?.stagingTargetProjectRef !== 'wmyyttnynmteqgcdishd' ||
    dryRun?.stagingTargetClass !== 'staging' ||
    dryRun?.persistedJobType !== 'quality_check' ||
    dryRun?.persistedJobPayloadKind !== 'gstreamer_mkvtoolnix_generated_fixture_runtime' ||
    dryRun?.workerType !== 'gstreamer_mkvtoolnix_generated_fixture_worker' ||
    dryRun?.claimLeaseMode !== 'remote_supabase_worker_claim_lease_no_worker_execution' ||
    dryRun?.sourceGateDispatchEnvelopeMode !== 'source_gate_ready_for_confirmation_gated_dispatch_dry_run' ||
    dryRun?.dryRunDispatchEnvelopeMode !== 'dry_run_dispatch_envelope_no_route_no_worker_start' ||
    dryRun?.routeHandlerInvocation !== false ||
    dryRun?.workerDispatch !== false ||
    dryRun?.workerExecution !== false ||
    dryRun?.workerProcessStart !== false ||
    dryRun?.workerLeaseMutation !== false ||
    dryRun?.persistentJobQueueWrite !== false
  ) {
    pushOnce(blockers, 'blocked_invalid_worker_dispatch_runtime_execution_packet_dry_run_source')
  }

  if (
    input.executionMode !== 'confirmed_worker_dispatch_runtime_execution_packet_existing_guarded_route_delegate' ||
    input.stagingTargetProjectName !== 'Reeditpro' ||
    input.stagingTargetProjectRef !== 'wmyyttnynmteqgcdishd' ||
    input.stagingTargetClass !== 'staging' ||
    input.routePath !== RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH ||
    input.workerSourceId !== GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_ID ||
    input.workerSourcePath !== GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_PATH ||
    input.persistedJobType !== 'quality_check' ||
    input.persistedJobPayloadKind !== 'gstreamer_mkvtoolnix_generated_fixture_runtime' ||
    input.workerType !== 'gstreamer_mkvtoolnix_generated_fixture_worker' ||
    input.claimLeaseMode !== 'remote_supabase_worker_claim_lease_no_worker_execution' ||
    input.dryRunDispatchEnvelopeMode !== 'dry_run_dispatch_envelope_no_route_no_worker_start' ||
    input.routeHandlerInvocationRequestedNow !== true ||
    input.runtimeRouteDelegateRequestedNow !== true
  ) {
    pushOnce(blockers, 'blocked_invalid_worker_dispatch_runtime_execution_packet_state')
  }

  if (input.executionPacketIdempotencyKey !== expectedExecutionPacketIdempotencyKey(input)) {
    pushOnce(blockers, 'blocked_worker_dispatch_runtime_execution_packet_idempotency_mismatch')
  }

  if (
    input.workerDispatchRequestedNow ||
    input.workerExecutionRequestedNow ||
    input.workerProcessStartRequestedNow ||
    input.workerLeaseMutationRequestedNow ||
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
    pushOnce(blockers, 'blocked_unsafe_worker_dispatch_runtime_execution_packet_request')
  }

  return blockers
}

function blockedResult(
  input: GstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketInput,
  blockers: GstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketStatus[],
): GstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketResult {
  return buildResult(
    input,
    false,
    blockers[0] ?? 'blocked_invalid_worker_dispatch_runtime_execution_packet_state',
    blockers,
  )
}

function routeDelegateSafetyValid(result: GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeResult): boolean {
  return (
    result.ok === true &&
    result.safety.routeHandlerInvocation === 'completed_guarded_route_handler' &&
    result.safety.realWorkerDispatch === false &&
    result.safety.workerProcessStartedByRoute === false &&
    result.safety.workerExecutionByRoute === false &&
    result.safety.workerLeaseClaim === false &&
    result.safety.persistentJobQueueWrite === false &&
    result.safety.gstreamerExecution === 'completed_controlled_generated_fixture_only' &&
    result.safety.mkvtoolnixExecution === 'completed_controlled_generated_fixture_only' &&
    result.safety.mediaProcessing === 'controlled_generated_fixture_only' &&
    result.safety.privateMediaProcessing === false &&
    result.safety.userMediaProcessing === false &&
    result.safety.ffmpegFfprobeExecution === false &&
    result.safety.dockerExecution === 'completed_local_image_only_network_disabled_no_push_no_deploy' &&
    result.safety.dockerPushDeploy === false &&
    result.safety.remotionExecution === false &&
    result.safety.supabaseMutation === false &&
    result.safety.sqlExecution === false &&
    result.safety.secretPayloadAccess === false &&
    result.safety.serviceRoleSecretPayloadAccess === false &&
    result.safety.signedUrlCreation === false &&
    result.safety.publicArtifactCreation === false &&
    result.safety.finalRenderExport === false &&
    result.safety.externalBetaUnlock === false &&
    result.safety.paidProductionUnlock === false &&
    result.safety.productionUnlock === false
  )
}

function buildResult(
  input: GstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketInput,
  ok: boolean,
  status: GstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketStatus,
  blockers: GstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketStatus[],
  routeResult?: GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeResult,
): GstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketResult {
  const routeCompleted = Boolean(ok && routeResult?.ok)
  const routeHandlerInvocation = routeCompleted
    ? 'completed_guarded_route_handler'
    : 'not_run_blocked_before_route_delegate'
  const runtimeRouteDelegate = routeCompleted ? 'completed_existing_guarded_route_delegate' : false
  const runnerArtifacts = routeResult?.sanitizedBridge.runnerArtifacts ?? []

  return {
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_PACKET,
    decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_DECISION,
    execution: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_EXECUTION,
    ok,
    status,
    blockers,
    confirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_CONFIRM_ENV,
    dryRunConfirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_CONFIRM_ENV,
    routeConfirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV,
    routePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
    routeResult,
    sanitizedExecutionPacket: {
      executionPacketId: input.executionPacketId,
      executionMode: 'confirmed_worker_dispatch_runtime_execution_packet_existing_guarded_route_delegate',
      sourceGateMergeSha: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_SOURCE_GATE_MERGE_SHA,
      dryRunMergeSha: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_DRY_RUN_MERGE_SHA,
      dryRunRunId: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_DRY_RUN_RUN_ID,
      dryRunDecision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_DECISION,
      dryRunNextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_NEXT_MILESTONE,
      stagingTargetProjectName: 'Reeditpro',
      stagingTargetProjectRef: 'wmyyttnynmteqgcdishd',
      stagingTargetClass: 'staging',
      routePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
      workerSourceId: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_ID,
      workerSourcePath: GSTREAMER_MKVTOOLNIX_NARROW_SOURCE_EXECUTION_WORKER_SOURCE_PATH,
      persistedJobId: input.dryRunResult.sanitizedWorkerDispatchDryRun.persistedJobId,
      persistedJobType: 'quality_check',
      persistedJobPayloadKind: 'gstreamer_mkvtoolnix_generated_fixture_runtime',
      workerType: 'gstreamer_mkvtoolnix_generated_fixture_worker',
      claimLeaseMode: 'remote_supabase_worker_claim_lease_no_worker_execution',
      dryRunDispatchEnvelopeMode: 'dry_run_dispatch_envelope_no_route_no_worker_start',
      sourceGateDispatchEnvelopeMode: 'source_gate_ready_for_confirmation_gated_dispatch_dry_run',
      executionPacketIdempotencyKey: input.executionPacketIdempotencyKey,
      runtimeRouteIdempotencyKey: input.runtimeRouteInput.routeIdempotencyKey,
      rollbackPlanId: input.rollbackPlanId,
      cleanupPlanId: input.cleanupPlanId,
      evidenceDirectory: input.evidenceDirectory,
      routeHandlerInvocation,
      runtimeRouteDelegate,
      runtimeRouteRunnerRunId: routeResult?.sanitizedBridge.runnerRunId ?? null,
      runtimeRouteRunnerOutputDir: routeResult?.sanitizedBridge.runnerOutputDir ?? null,
      runtimeRouteRunnerArtifacts: runnerArtifacts,
      workerDispatch: false,
      workerExecution: false,
      workerProcessStart: false,
      workerLeaseMutation: false,
      persistentJobQueueWrite: false,
      gstreamerExecution: routeCompleted ? 'completed_controlled_generated_fixture_only' : false,
      mkvtoolnixExecution: routeCompleted ? 'completed_controlled_generated_fixture_only' : false,
      mediaProcessing: routeCompleted ? 'controlled_generated_fixture_only' : false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      supabaseMutation: false,
      sqlExecution: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
    },
    safety: {
      dryRunEvidenceAccepted: ok ? 'completed_dry_run_source_evidence_validation' : false,
      routeHandlerInvocation: routeCompleted ? 'completed_guarded_route_handler' : false,
      runtimeRouteDelegate,
      realWorkerDispatch: false,
      workerExecution: false,
      workerProcessStart: false,
      workerLeaseMutation: false,
      persistentJobQueueWrite: false,
      gstreamerExecution: routeCompleted ? 'completed_controlled_generated_fixture_only' : false,
      mkvtoolnixExecution: routeCompleted ? 'completed_controlled_generated_fixture_only' : false,
      mediaProcessing: routeCompleted ? 'controlled_generated_fixture_only' : false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      ffmpegFfprobeExecution: false,
      dockerExecution: routeCompleted ? 'completed_local_image_only_network_disabled_no_push_no_deploy' : false,
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
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_NEXT_MILESTONE,
  }
}

export async function runGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacket(
  input: GstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketInput,
  dependencies: GstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketDependencies = {},
): Promise<GstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketResult> {
  const blockers = validateGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketInput(input)
  const env = dependencies.env ?? process.env

  if (env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_CONFIRM_ENV] !== 'true') {
    pushOnce(blockers, 'blocked_missing_worker_dispatch_runtime_execution_packet_confirmation')
  }
  if (blockers.length > 0) return blockedResult(input, blockers)

  const runner = dependencies.routeRunner ?? ((runtimeInput) =>
    runGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridge(runtimeInput, {
      env: {
        ...env,
        [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV]: 'true',
      },
    }))

  let routeResult: GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeResult
  try {
    routeResult = await runner(input.runtimeRouteInput)
  } catch {
    return blockedResult(input, ['blocked_worker_dispatch_runtime_execution_packet_route_delegate_failed'])
  }

  if (!routeResult.ok) {
    return blockedResult(input, ['blocked_worker_dispatch_runtime_execution_packet_route_delegate_failed'])
  }
  if (!routeDelegateSafetyValid(routeResult)) {
    return blockedResult(input, ['blocked_worker_dispatch_runtime_execution_packet_route_delegate_safety_invalid'])
  }

  return buildResult(
    input,
    true,
    'completed_worker_dispatch_runtime_execution_packet',
    [],
    routeResult,
  )
}

export function summarizeGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketBoundary(): string[] {
  return [
    'Consumes the merged #2158 source-gate and #2162 worker-dispatch dry-run source evidence.',
    'Requires REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET=true before route/runtime delegation.',
    'Names the Reeditpro staging target wmyyttnynmteqgcdishd, route path, worker source, idempotency key, rollback/cleanup plan, and /tmp evidence directory.',
    'Delegates only to the existing guarded generated-fixture route/runtime bridge and keeps real worker dispatch, worker execution, worker lease mutation, persistent queue writes, Supabase mutation, SQL, private media, public artifacts, and final export disabled.',
  ]
}
