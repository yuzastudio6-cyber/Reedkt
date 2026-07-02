import { spawn } from 'node:child_process'
import fs from 'node:fs'

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_PACKET =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXECUTION-READY-ROUTE-WORKER-BRIDGE-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_DECISION =
  'completed_gstreamer_mkvtoolnix_narrow_execution_ready_route_worker_bridge' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_EXECUTION =
  'completed_backend_route_worker_bridge_source_for_controlled_generated_fixture_runtime_execution' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH =
  '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_NEXT_MILESTONE =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXECUTION-READY-ROUTE-WORKER-BRIDGE-QA-ROLLUP-1' as const

export const RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES = [
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
] as const

const postDispatchRuntimeScript =
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2.mjs'
const postDispatchRuntimeConfirmEnv =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_POST_DISPATCH_WORKER_RUNTIME_EXECUTION'

export type GstreamerMkvtoolnixNarrowExecutionReadyCommandTemplate =
  typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES[number]

export type GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeStatus =
  | 'completed_narrow_execution_ready_route_worker_bridge_controlled_generated_fixture_runtime_delegate'
  | 'blocked_missing_narrow_execution_ready_route_worker_bridge_confirmation'
  | 'blocked_missing_narrow_execution_ready_route_worker_bridge_reference'
  | 'blocked_invalid_narrow_execution_ready_route_worker_bridge_state'
  | 'blocked_unapproved_narrow_execution_ready_scope'
  | 'blocked_unapproved_command_template'
  | 'blocked_unsupported_runtime_request_payload'
  | 'blocked_controlled_generated_fixture_runtime_runner_failed'
  | 'blocked_controlled_generated_fixture_runtime_runner_summary_invalid'
  | 'blocked_controlled_generated_fixture_runtime_runner_timed_out'

export interface GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput {
  workspaceId: string
  projectId: string
  approvedSnapshotId: string
  approvalRecordId: string
  creditOrNoSpendPolicyId: string
  jobId: string
  workerLeaseId: string
  workerEnvelopeId: string
  routeIdempotencyKey: string
  runtimePacketId: string
  runtimeExecutionId: string
  runtimeExecutionMode: 'controlled_generated_fixture_runtime_execution' | string
  fixtureScope: 'generated_srt_and_generated_subtitle_only_mkv_fixture' | string
  routeOwner: 'backend_service_role_only' | string
  routeBridgeMode: 'delegates_existing_guarded_runtime_packet' | string
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
  routeExecutionRequestedNow?: boolean
  workerDispatchRequestedNow?: boolean
  workerExecutionRequestedNow?: boolean
  workerProcessStartRequestedNow?: boolean
  workerLeaseClaimRequestedNow?: boolean
  persistentJobQueueWriteRequestedNow?: boolean
  privateMediaProcessingRequestedNow?: boolean
  userMediaProcessingRequestedNow?: boolean
  supabaseMutationRequestedNow?: boolean
  sqlExecutionRequestedNow?: boolean
  signedUrlCreationRequestedNow?: boolean
  publicArtifactRequestedNow?: boolean
  finalRenderExportRequestedNow?: boolean
  externalBetaUnlockRequestedNow?: boolean
  paidProductionUnlockRequestedNow?: boolean
  productionUnlockRequestedNow?: boolean
}

export interface GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeRunnerSummary {
  packet: string
  decision: string
  execution: string
  runId: string
  outputDir: string
  report?: string
  manifest?: string
  artifacts?: Array<{ fileName: string; bytes: number; sha256: string }>
}

export interface GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeResult {
  packet: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_PACKET
  decision: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_DECISION
  execution: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_EXECUTION
  ok: boolean
  status: GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeStatus
  blockers: GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeStatus[]
  confirmationGate: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV
  confirmationRequired: true
  routePath: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH
  sanitizedBridge: {
    workspaceId: string
    projectId: string
    approvedSnapshotId: string
    approvalRecordId: string
    creditOrNoSpendPolicyId: string
    jobId: string
    workerLeaseId: string
    workerEnvelopeId: string
    routeIdempotencyKey: string
    runtimePacketId: string
    runtimeExecutionId: string
    runtimeExecutionMode: 'controlled_generated_fixture_runtime_execution'
    fixtureScope: 'generated_srt_and_generated_subtitle_only_mkv_fixture'
    routeOwner: 'backend_service_role_only'
    routeBridgeMode: 'delegates_existing_guarded_runtime_packet'
    allowedCommandTemplates: GstreamerMkvtoolnixNarrowExecutionReadyCommandTemplate[]
    privateInputManifestId: string
    outputManifestSchemaId: string
    qaReportSchemaId: string
    cleanupPolicyId: string
    retentionPolicyId: string
    failurePolicyId: string
    nonPublicArtifactPolicyId: string
    routeHandlerInvocation: 'completed_guarded_route_handler' | 'not_run_blocked_before_runtime_delegate'
    runtimeDelegate: 'completed_existing_guarded_runtime_packet_2' | 'not_run_blocked_before_runtime_delegate'
    runnerRunId: string | null
    runnerOutputDir: string | null
    runnerReport: string | null
    runnerManifest: string | null
    runnerArtifacts: Array<{ fileName: string; bytes: number; sha256: string }>
  }
  safety: {
    routeHandlerInvocation: 'completed_guarded_route_handler' | 'not_run_blocked_before_runtime_delegate'
    realWorkerDispatch: false
    workerProcessStartedByRoute: false
    workerExecutionByRoute: false
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
    providerCall: false
    modelCall: false
    signedUrlCreation: false
    publicArtifactCreation: false
    finalRenderExport: false
    externalBetaUnlock: false
    paidProductionUnlock: false
    productionUnlock: false
  }
  productReadyEndToEndLocalOssTools: 0
  nextMilestone: typeof RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_NEXT_MILESTONE
}

export interface GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeDependencies {
  env?: NodeJS.ProcessEnv
  runtimeRunner?: () => Promise<GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeRunnerSummary>
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

function unsupportedPayload(input: GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput): boolean {
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

function unsafeRequest(input: GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput): boolean {
  return [
    input.workerDispatchRequestedNow,
    input.workerExecutionRequestedNow,
    input.workerProcessStartRequestedNow,
    input.workerLeaseClaimRequestedNow,
    input.persistentJobQueueWriteRequestedNow,
    input.privateMediaProcessingRequestedNow,
    input.userMediaProcessingRequestedNow,
    input.supabaseMutationRequestedNow,
    input.sqlExecutionRequestedNow,
    input.signedUrlCreationRequestedNow,
    input.publicArtifactRequestedNow,
    input.finalRenderExportRequestedNow,
    input.externalBetaUnlockRequestedNow,
    input.paidProductionUnlockRequestedNow,
    input.productionUnlockRequestedNow,
  ].some(Boolean)
}

function commandTemplatesAllowed(commandTemplates: readonly string[]): boolean {
  return (
    commandTemplates.length ===
      RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES.length &&
    RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES.every(
      (template, index) => commandTemplates[index] === template,
    )
  )
}

function blockedResult(
  input: GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput,
  blockers: GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeStatus[],
): GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeResult {
  return buildResult(input, false, blockers[0] ?? 'blocked_invalid_narrow_execution_ready_route_worker_bridge_state', blockers)
}

function buildResult(
  input: GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput,
  ok: boolean,
  status: GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeStatus,
  blockers: GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeStatus[],
  runner?: GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeRunnerSummary,
): GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeResult {
  const routeHandlerInvocation = ok ? 'completed_guarded_route_handler' : 'not_run_blocked_before_runtime_delegate'
  const runtimeDelegate = ok ? 'completed_existing_guarded_runtime_packet_2' : 'not_run_blocked_before_runtime_delegate'

  return {
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_PACKET,
    decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_DECISION,
    execution: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_EXECUTION,
    ok,
    status,
    blockers,
    confirmationGate: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV,
    confirmationRequired: true,
    routePath: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
    sanitizedBridge: {
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
      runtimeExecutionMode: 'controlled_generated_fixture_runtime_execution',
      fixtureScope: 'generated_srt_and_generated_subtitle_only_mkv_fixture',
      routeOwner: 'backend_service_role_only',
      routeBridgeMode: 'delegates_existing_guarded_runtime_packet',
      allowedCommandTemplates: [
        ...RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES,
      ],
      privateInputManifestId: input.privateInputManifestId,
      outputManifestSchemaId: input.outputManifestSchemaId,
      qaReportSchemaId: input.qaReportSchemaId,
      cleanupPolicyId: input.cleanupPolicyId,
      retentionPolicyId: input.retentionPolicyId,
      failurePolicyId: input.failurePolicyId,
      nonPublicArtifactPolicyId: input.nonPublicArtifactPolicyId,
      routeHandlerInvocation,
      runtimeDelegate,
      runnerRunId: runner?.runId ?? null,
      runnerOutputDir: runner?.outputDir ?? null,
      runnerReport: runner?.report ?? null,
      runnerManifest: runner?.manifest ?? null,
      runnerArtifacts: runner?.artifacts ?? [],
    },
    safety: {
      routeHandlerInvocation,
      realWorkerDispatch: false,
      workerProcessStartedByRoute: false,
      workerExecutionByRoute: false,
      workerLeaseClaim: false,
      persistentJobQueueWrite: false,
      gstreamerExecution: ok ? 'completed_controlled_generated_fixture_only' : false,
      mkvtoolnixExecution: ok ? 'completed_controlled_generated_fixture_only' : false,
      mediaProcessing: ok ? 'controlled_generated_fixture_only' : false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      ffmpegFfprobeExecution: false,
      dockerExecution: ok ? 'completed_local_image_only_network_disabled_no_push_no_deploy' : false,
      dockerPushDeploy: false,
      remotionExecution: false,
      supabaseMutation: false,
      sqlExecution: false,
      secretPayloadAccess: false,
      serviceRoleSecretPayloadAccess: false,
      providerCall: false,
      modelCall: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      finalRenderExport: false,
      externalBetaUnlock: false,
      paidProductionUnlock: false,
      productionUnlock: false,
    },
    productReadyEndToEndLocalOssTools: 0,
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_NEXT_MILESTONE,
  }
}

export function buildGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput(
  overrides: Partial<GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput> = {},
): GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput {
  return {
    workspaceId: 'workspace-gstreamer-mkvtoolnix-narrow-execution-ready-bridge',
    projectId: 'project-gstreamer-mkvtoolnix-narrow-execution-ready-bridge',
    approvedSnapshotId: 'approved-snapshot-gstreamer-mkvtoolnix-narrow-execution-ready-bridge',
    approvalRecordId: 'approval-gstreamer-mkvtoolnix-narrow-execution-ready-bridge',
    creditOrNoSpendPolicyId: 'no-spend-policy-gstreamer-mkvtoolnix-narrow-execution-ready-bridge',
    jobId: 'job-gstreamer-mkvtoolnix-narrow-execution-ready-bridge',
    workerLeaseId: 'worker-lease-gstreamer-mkvtoolnix-narrow-execution-ready-bridge',
    workerEnvelopeId: 'worker-envelope-gstreamer-mkvtoolnix-narrow-execution-ready-bridge',
    routeIdempotencyKey: 'idem-gstreamer-mkvtoolnix-narrow-execution-ready-bridge',
    runtimePacketId: 'runtime-packet-gstreamer-mkvtoolnix-narrow-execution-ready-bridge',
    runtimeExecutionId: 'runtime-execution-gstreamer-mkvtoolnix-narrow-execution-ready-bridge',
    runtimeExecutionMode: 'controlled_generated_fixture_runtime_execution',
    fixtureScope: 'generated_srt_and_generated_subtitle_only_mkv_fixture',
    routeOwner: 'backend_service_role_only',
    routeBridgeMode: 'delegates_existing_guarded_runtime_packet',
    commandTemplates: [
      ...RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES,
    ],
    privateInputManifestId: 'generated-fixture-input-manifest-gstreamer-mkvtoolnix-narrow-execution-ready-bridge',
    outputManifestSchemaId: 'output-manifest-schema-gstreamer-mkvtoolnix-narrow-execution-ready-bridge',
    qaReportSchemaId: 'qa-report-schema-gstreamer-mkvtoolnix-narrow-execution-ready-bridge',
    cleanupPolicyId: 'cleanup-policy-gstreamer-mkvtoolnix-narrow-execution-ready-bridge',
    retentionPolicyId: 'retention-policy-gstreamer-mkvtoolnix-narrow-execution-ready-bridge',
    failurePolicyId: 'failure-policy-gstreamer-mkvtoolnix-narrow-execution-ready-bridge',
    nonPublicArtifactPolicyId: 'non-public-artifact-policy-gstreamer-mkvtoolnix-narrow-execution-ready-bridge',
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
    ...overrides,
  }
}

export function validateGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput(
  input: GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput,
): GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeStatus[] {
  const blockers: GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeStatus[] = []

  if (!input.confirmation) pushOnce(blockers, 'blocked_missing_narrow_execution_ready_route_worker_bridge_confirmation')
  for (const value of [
    input.workspaceId,
    input.projectId,
    input.approvedSnapshotId,
    input.approvalRecordId,
    input.creditOrNoSpendPolicyId,
    input.jobId,
    input.workerLeaseId,
    input.workerEnvelopeId,
    input.routeIdempotencyKey,
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
    if (blank(value)) pushOnce(blockers, 'blocked_missing_narrow_execution_ready_route_worker_bridge_reference')
  }
  if (
    input.runtimeExecutionMode !== 'controlled_generated_fixture_runtime_execution' ||
    input.fixtureScope !== 'generated_srt_and_generated_subtitle_only_mkv_fixture' ||
    input.routeOwner !== 'backend_service_role_only' ||
    input.routeBridgeMode !== 'delegates_existing_guarded_runtime_packet'
  ) {
    pushOnce(blockers, 'blocked_invalid_narrow_execution_ready_route_worker_bridge_state')
  }
  if (input.fixtureScope !== 'generated_srt_and_generated_subtitle_only_mkv_fixture') {
    pushOnce(blockers, 'blocked_unapproved_narrow_execution_ready_scope')
  }
  if (!commandTemplatesAllowed(input.commandTemplates)) {
    pushOnce(blockers, 'blocked_unapproved_command_template')
  }
  if (unsupportedPayload(input)) pushOnce(blockers, 'blocked_unsupported_runtime_request_payload')
  if (unsafeRequest(input)) pushOnce(blockers, 'blocked_unapproved_narrow_execution_ready_scope')

  return blockers
}

export async function runGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridge(
  input: GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput,
  dependencies: GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeDependencies = {},
): Promise<GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeResult> {
  const blockers = validateGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeInput(input)
  const env = dependencies.env ?? process.env

  if (env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV] !== 'true') {
    pushOnce(blockers, 'blocked_missing_narrow_execution_ready_route_worker_bridge_confirmation')
  }
  if (blockers.length > 0) return blockedResult(input, blockers)

  const runner = dependencies.runtimeRunner ?? runPostDispatchRuntimeExecutionPacket
  let summary: GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeRunnerSummary
  try {
    summary = await runner()
  } catch (error) {
    const status =
      error instanceof Error && error.message === 'runtime_runner_timed_out'
        ? 'blocked_controlled_generated_fixture_runtime_runner_timed_out'
        : 'blocked_controlled_generated_fixture_runtime_runner_failed'
    return blockedResult(input, [status])
  }

  if (!runtimeRunnerSummaryValid(summary)) {
    return blockedResult(input, ['blocked_controlled_generated_fixture_runtime_runner_summary_invalid'])
  }

  return buildResult(
    input,
    true,
    'completed_narrow_execution_ready_route_worker_bridge_controlled_generated_fixture_runtime_delegate',
    [],
    summary,
  )
}

function runtimeRunnerSummaryValid(
  summary: GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeRunnerSummary,
): boolean {
  if (
    summary.packet !== 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-PACKET-2' ||
    summary.decision !==
      'completed_gstreamer_mkvtoolnix_post_dispatch_worker_runtime_execution_packet_generated_fixture_only' ||
    summary.execution !==
      'completed_confirmation_gated_post_dispatch_worker_runtime_execution_packet_generated_fixture_only_no_route_or_worker_dispatch' ||
    blank(summary.runId) ||
    blank(summary.outputDir)
  ) {
    return false
  }
  return (summary.artifacts ?? []).every((artifact) =>
    hasText(artifact.fileName) &&
    Number.isFinite(artifact.bytes) &&
    artifact.bytes > 0 &&
    /^[a-f0-9]{64}$/.test(artifact.sha256),
  )
}

function runPostDispatchRuntimeExecutionPacket(): Promise<GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeRunnerSummary> {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [postDispatchRuntimeScript], {
      env: {
        ...process.env,
        [postDispatchRuntimeConfirmEnv]: 'true',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    const timeout = setTimeout(() => {
      child.kill('SIGTERM')
      reject(new Error('runtime_runner_timed_out'))
    }, 180000)

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk)
    })
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk)
    })
    child.on('error', (error) => {
      clearTimeout(timeout)
      reject(error)
    })
    child.on('close', (code) => {
      clearTimeout(timeout)
      if (code !== 0) {
        reject(new Error(`runtime runner exited ${code}: ${stderr.slice(0, 1000)}`))
        return
      }
      try {
        const summary = JSON.parse(stdout) as GstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeRunnerSummary
        if (summary.report && fs.existsSync(summary.report)) {
          const report = JSON.parse(fs.readFileSync(summary.report, 'utf8'))
          summary.runId = report.runId ?? summary.runId
          summary.outputDir = report.outputDir ?? summary.outputDir
        }
        resolve(summary)
      } catch (error) {
        reject(error)
      }
    })
  })
}

export function summarizeGstreamerMkvtoolnixNarrowExecutionReadyRouteWorkerBridgeBoundary(): string[] {
  return [
    'Registers a backend route for the narrow GStreamer/MKVToolNix controlled generated-fixture runtime bridge.',
    'Fails closed unless the route body and REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_EXECUTION_READY_ROUTE_WORKER_BRIDGE=true are present.',
    'Delegates only to the existing post-dispatch guarded runtime packet, which is limited to generated SRT/subtitle-only MKV fixtures.',
    'Rejects raw commands, raw chat, arbitrary paths, private/user media, public URLs, signed URLs, Supabase mutation, SQL, public artifacts, and final render/export.',
  ]
}
