import { spawn } from 'node:child_process'
import fs from 'node:fs'

export const TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_PACKET =
  'TRACKA-GPAC-MP4BOX-EXECUTION-READY-ROUTE-WORKER-BRIDGE-1' as const

export const TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_DECISION =
  'completed_gpac_mp4box_execution_ready_route_worker_bridge' as const

export const TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_EXECUTION =
  'completed_backend_route_worker_bridge_source_for_gpac_mp4box_generated_fixture_runtime_execution' as const

export const TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE' as const

export const TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH =
  '/v1/external-beta/gpac-mp4box/generated-fixture-runtime/execute' as const

export const TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_NEXT_MILESTONE =
  'TRACKA-GPAC-MP4BOX-EXECUTION-READY-ROUTE-WORKER-BRIDGE-QA-ROLLUP-1' as const

export const TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES = [
  'mp4box_add_generated_subtitle_only_v1',
  'mp4box_info_generated_subtitle_only_v1',
] as const

const runtimeScript = 'scripts/validation/tracka-gpac-mp4box-generated-fixture-runtime-execution-1.mjs'
const runtimeConfirmEnv = 'REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GENERATED_FIXTURE_RUNTIME_EXECUTION'

export type GpacMp4boxExecutionReadyCommandTemplate =
  typeof TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES[number]

export type GpacMp4boxExecutionReadyRouteWorkerBridgeStatus =
  | 'completed_gpac_mp4box_execution_ready_route_worker_bridge_generated_fixture_runtime_delegate'
  | 'blocked_missing_gpac_mp4box_execution_ready_route_worker_bridge_confirmation'
  | 'blocked_missing_gpac_mp4box_execution_ready_route_worker_bridge_reference'
  | 'blocked_invalid_gpac_mp4box_execution_ready_route_worker_bridge_state'
  | 'blocked_unapproved_gpac_mp4box_execution_ready_scope'
  | 'blocked_unapproved_gpac_mp4box_command_template'
  | 'blocked_unsupported_gpac_mp4box_runtime_request_payload'
  | 'blocked_gpac_mp4box_generated_fixture_runtime_runner_failed'
  | 'blocked_gpac_mp4box_generated_fixture_runtime_runner_summary_invalid'
  | 'blocked_gpac_mp4box_generated_fixture_runtime_runner_timed_out'

export interface GpacMp4boxExecutionReadyRouteWorkerBridgeInput {
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
  fixtureScope: 'generated_srt_to_subtitle_only_mp4_fixture' | string
  routeOwner: 'backend_service_role_only' | string
  routeBridgeMode: 'delegates_existing_gpac_mp4box_generated_fixture_runtime_packet' | string
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

export interface GpacMp4boxExecutionReadyRouteWorkerBridgeRunnerSummary {
  packet: string
  decision: string
  execution: string
  runId: string
  outputDir: string
  report?: string
  manifest?: string
  artifacts?: Array<{ fileName: string; bytes: number; sha256: string }>
}

export interface GpacMp4boxExecutionReadyRouteWorkerBridgeResult {
  packet: typeof TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_PACKET
  decision: typeof TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_DECISION
  execution: typeof TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_EXECUTION
  ok: boolean
  status: GpacMp4boxExecutionReadyRouteWorkerBridgeStatus
  blockers: GpacMp4boxExecutionReadyRouteWorkerBridgeStatus[]
  confirmationGate: typeof TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV
  confirmationRequired: true
  routePath: typeof TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH
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
    fixtureScope: 'generated_srt_to_subtitle_only_mp4_fixture'
    routeOwner: 'backend_service_role_only'
    routeBridgeMode: 'delegates_existing_gpac_mp4box_generated_fixture_runtime_packet'
    allowedCommandTemplates: GpacMp4boxExecutionReadyCommandTemplate[]
    privateInputManifestId: string
    outputManifestSchemaId: string
    qaReportSchemaId: string
    cleanupPolicyId: string
    retentionPolicyId: string
    failurePolicyId: string
    nonPublicArtifactPolicyId: string
    routeHandlerInvocation: 'completed_guarded_route_handler' | 'not_run_blocked_before_runtime_delegate'
    runtimeDelegate: 'completed_existing_gpac_mp4box_generated_fixture_runtime_packet' | 'not_run_blocked_before_runtime_delegate'
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
    gpacMp4boxExecution: 'completed_controlled_generated_fixture_only' | false
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
  nextMilestone: typeof TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_NEXT_MILESTONE
}

export interface GpacMp4boxExecutionReadyRouteWorkerBridgeDependencies {
  env?: NodeJS.ProcessEnv
  runtimeRunner?: () => Promise<GpacMp4boxExecutionReadyRouteWorkerBridgeRunnerSummary>
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

function unsupportedPayload(input: GpacMp4boxExecutionReadyRouteWorkerBridgeInput): boolean {
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

function unsafeRequest(input: GpacMp4boxExecutionReadyRouteWorkerBridgeInput): boolean {
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
    commandTemplates.length === TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES.length &&
    TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES.every(
      (template, index) => commandTemplates[index] === template,
    )
  )
}

function blockedResult(
  input: GpacMp4boxExecutionReadyRouteWorkerBridgeInput,
  blockers: GpacMp4boxExecutionReadyRouteWorkerBridgeStatus[],
): GpacMp4boxExecutionReadyRouteWorkerBridgeResult {
  return buildResult(
    input,
    false,
    blockers[0] ?? 'blocked_invalid_gpac_mp4box_execution_ready_route_worker_bridge_state',
    blockers,
  )
}

function buildResult(
  input: GpacMp4boxExecutionReadyRouteWorkerBridgeInput,
  ok: boolean,
  status: GpacMp4boxExecutionReadyRouteWorkerBridgeStatus,
  blockers: GpacMp4boxExecutionReadyRouteWorkerBridgeStatus[],
  runner?: GpacMp4boxExecutionReadyRouteWorkerBridgeRunnerSummary,
): GpacMp4boxExecutionReadyRouteWorkerBridgeResult {
  const routeHandlerInvocation = ok ? 'completed_guarded_route_handler' : 'not_run_blocked_before_runtime_delegate'
  const runtimeDelegate = ok
    ? 'completed_existing_gpac_mp4box_generated_fixture_runtime_packet'
    : 'not_run_blocked_before_runtime_delegate'

  return {
    packet: TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_PACKET,
    decision: TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_DECISION,
    execution: TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_EXECUTION,
    ok,
    status,
    blockers,
    confirmationGate: TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV,
    confirmationRequired: true,
    routePath: TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ROUTE_PATH,
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
      fixtureScope: 'generated_srt_to_subtitle_only_mp4_fixture',
      routeOwner: 'backend_service_role_only',
      routeBridgeMode: 'delegates_existing_gpac_mp4box_generated_fixture_runtime_packet',
      allowedCommandTemplates: [
        ...TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES,
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
      gpacMp4boxExecution: ok ? 'completed_controlled_generated_fixture_only' : false,
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
    nextMilestone: TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_NEXT_MILESTONE,
  }
}

export function buildGpacMp4boxExecutionReadyRouteWorkerBridgeInput(
  overrides: Partial<GpacMp4boxExecutionReadyRouteWorkerBridgeInput> = {},
): GpacMp4boxExecutionReadyRouteWorkerBridgeInput {
  return {
    workspaceId: 'workspace-gpac-mp4box-execution-ready-bridge',
    projectId: 'project-gpac-mp4box-execution-ready-bridge',
    approvedSnapshotId: 'approved-snapshot-gpac-mp4box-execution-ready-bridge',
    approvalRecordId: 'approval-gpac-mp4box-execution-ready-bridge',
    creditOrNoSpendPolicyId: 'no-spend-policy-gpac-mp4box-execution-ready-bridge',
    jobId: 'job-gpac-mp4box-execution-ready-bridge',
    workerLeaseId: 'worker-lease-gpac-mp4box-execution-ready-bridge',
    workerEnvelopeId: 'worker-envelope-gpac-mp4box-execution-ready-bridge',
    routeIdempotencyKey: 'idem-gpac-mp4box-execution-ready-bridge',
    runtimePacketId: 'runtime-packet-gpac-mp4box-execution-ready-bridge',
    runtimeExecutionId: 'runtime-execution-gpac-mp4box-execution-ready-bridge',
    runtimeExecutionMode: 'controlled_generated_fixture_runtime_execution',
    fixtureScope: 'generated_srt_to_subtitle_only_mp4_fixture',
    routeOwner: 'backend_service_role_only',
    routeBridgeMode: 'delegates_existing_gpac_mp4box_generated_fixture_runtime_packet',
    commandTemplates: [
      ...TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_ALLOWED_TEMPLATES,
    ],
    privateInputManifestId: 'generated-fixture-input-manifest-gpac-mp4box-execution-ready-bridge',
    outputManifestSchemaId: 'output-manifest-schema-gpac-mp4box-execution-ready-bridge',
    qaReportSchemaId: 'qa-report-schema-gpac-mp4box-execution-ready-bridge',
    cleanupPolicyId: 'cleanup-policy-gpac-mp4box-execution-ready-bridge',
    retentionPolicyId: 'retention-policy-gpac-mp4box-execution-ready-bridge',
    failurePolicyId: 'failure-policy-gpac-mp4box-execution-ready-bridge',
    nonPublicArtifactPolicyId: 'non-public-artifact-policy-gpac-mp4box-execution-ready-bridge',
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

export function validateGpacMp4boxExecutionReadyRouteWorkerBridgeInput(
  input: GpacMp4boxExecutionReadyRouteWorkerBridgeInput,
): GpacMp4boxExecutionReadyRouteWorkerBridgeStatus[] {
  const blockers: GpacMp4boxExecutionReadyRouteWorkerBridgeStatus[] = []

  if (!input.confirmation) {
    pushOnce(blockers, 'blocked_missing_gpac_mp4box_execution_ready_route_worker_bridge_confirmation')
  }
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
    if (blank(value)) pushOnce(blockers, 'blocked_missing_gpac_mp4box_execution_ready_route_worker_bridge_reference')
  }
  if (
    input.runtimeExecutionMode !== 'controlled_generated_fixture_runtime_execution' ||
    input.fixtureScope !== 'generated_srt_to_subtitle_only_mp4_fixture' ||
    input.routeOwner !== 'backend_service_role_only' ||
    input.routeBridgeMode !== 'delegates_existing_gpac_mp4box_generated_fixture_runtime_packet'
  ) {
    pushOnce(blockers, 'blocked_invalid_gpac_mp4box_execution_ready_route_worker_bridge_state')
  }
  if (input.fixtureScope !== 'generated_srt_to_subtitle_only_mp4_fixture') {
    pushOnce(blockers, 'blocked_unapproved_gpac_mp4box_execution_ready_scope')
  }
  if (!commandTemplatesAllowed(input.commandTemplates)) {
    pushOnce(blockers, 'blocked_unapproved_gpac_mp4box_command_template')
  }
  if (unsupportedPayload(input)) pushOnce(blockers, 'blocked_unsupported_gpac_mp4box_runtime_request_payload')
  if (unsafeRequest(input)) pushOnce(blockers, 'blocked_unapproved_gpac_mp4box_execution_ready_scope')

  return blockers
}

export async function runGpacMp4boxExecutionReadyRouteWorkerBridge(
  input: GpacMp4boxExecutionReadyRouteWorkerBridgeInput,
  dependencies: GpacMp4boxExecutionReadyRouteWorkerBridgeDependencies = {},
): Promise<GpacMp4boxExecutionReadyRouteWorkerBridgeResult> {
  const blockers = validateGpacMp4boxExecutionReadyRouteWorkerBridgeInput(input)
  const env = dependencies.env ?? process.env

  if (env[TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE_CONFIRM_ENV] !== 'true') {
    pushOnce(blockers, 'blocked_missing_gpac_mp4box_execution_ready_route_worker_bridge_confirmation')
  }
  if (blockers.length > 0) return blockedResult(input, blockers)

  const runner = dependencies.runtimeRunner ?? runGeneratedFixtureRuntimeExecutionPacket
  let summary: GpacMp4boxExecutionReadyRouteWorkerBridgeRunnerSummary
  try {
    summary = await runner()
  } catch (error) {
    const status =
      error instanceof Error && error.message === 'runtime_runner_timed_out'
        ? 'blocked_gpac_mp4box_generated_fixture_runtime_runner_timed_out'
        : 'blocked_gpac_mp4box_generated_fixture_runtime_runner_failed'
    return blockedResult(input, [status])
  }

  if (!runtimeRunnerSummaryValid(summary)) {
    return blockedResult(input, ['blocked_gpac_mp4box_generated_fixture_runtime_runner_summary_invalid'])
  }

  return buildResult(
    input,
    true,
    'completed_gpac_mp4box_execution_ready_route_worker_bridge_generated_fixture_runtime_delegate',
    [],
    summary,
  )
}

function runtimeRunnerSummaryValid(summary: GpacMp4boxExecutionReadyRouteWorkerBridgeRunnerSummary): boolean {
  if (
    summary.packet !== 'TRACKA-GPAC-MP4BOX-GENERATED-FIXTURE-RUNTIME-EXECUTION-1' ||
    summary.decision !== 'completed_gpac_mp4box_generated_fixture_runtime_execution' ||
    summary.execution !== 'completed_confirmation_gated_local_render_worker_runtime_execution_generated_fixture_only' ||
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

function runGeneratedFixtureRuntimeExecutionPacket(): Promise<GpacMp4boxExecutionReadyRouteWorkerBridgeRunnerSummary> {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [runtimeScript], {
      env: {
        ...process.env,
        [runtimeConfirmEnv]: 'true',
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
        const summary = JSON.parse(stdout) as GpacMp4boxExecutionReadyRouteWorkerBridgeRunnerSummary
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

export function summarizeGpacMp4boxExecutionReadyRouteWorkerBridgeBoundary(): string[] {
  return [
    'Registers a backend route for the narrow GPAC/MP4Box controlled generated-fixture runtime bridge.',
    'Fails closed unless the route body and REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_EXECUTION_READY_ROUTE_WORKER_BRIDGE=true are present.',
    'Delegates only to the generated-fixture runtime packet, which is limited to generated SRT/subtitle-only MP4 fixtures.',
    'Rejects raw commands, raw chat, arbitrary paths, private/user media, public URLs, signed URLs, Supabase mutation, SQL, public artifacts, and final render/export.',
  ]
}
