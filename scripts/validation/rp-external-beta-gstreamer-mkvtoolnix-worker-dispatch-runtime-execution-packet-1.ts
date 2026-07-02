import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_EXECUTION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_PACKET,
  buildGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketInput,
  runGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacket,
  summarizeGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketBoundary,
} from '../../server/services/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1'

const blockedDecision = 'blocked_pending_gstreamer_mkvtoolnix_worker_dispatch_runtime_execution_packet_confirmation'
const integrationBase = 'ef5b15adcf5de407f3083abb64ffc14b298692cc'
const sourceGatePr = 2158
const sourceGateMergeSha = '488df755ef9f9954e8696ed336f9106bada06319'
const dryRunPr = 2162
const dryRunMergeSha = 'ef5b15adcf5de407f3083abb64ffc14b298692cc'
const dryRunRunId = '2026-07-02T16-10-17-014Z-eec19f59'
const routePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute'
const workerSourcePath = 'server/workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered.ts'
const outputRoot = '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-execution-packet-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(outputRoot, runId)

function sha256File(file: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function artifact(file: string): { fileName: string; path: string; bytes: number; sha256: string } {
  return {
    fileName: path.basename(file),
    path: file,
    bytes: fs.statSync(file).size,
    sha256: sha256File(file),
  }
}

const baseSafety = {
  workerDispatchRuntimeExecutionPacket: true,
  routeHandlerInvocation: false as false | 'completed_guarded_route_handler',
  runtimeRouteDelegate: false as false | 'completed_existing_guarded_route_delegate',
  realWorkerDispatch: false,
  workerExecution: false,
  workerProcessStart: false,
  workerLeaseMutation: false,
  persistentJobQueueWrite: false,
  gstreamerExecution: false as false | 'completed_controlled_generated_fixture_only',
  mkvtoolnixExecution: false as false | 'completed_controlled_generated_fixture_only',
  mediaProcessing: false as false | 'controlled_generated_fixture_only',
  privateMediaProcessing: false,
  userMediaProcessing: false,
  ffmpegFfprobeExecution: false,
  dockerExecution: false as false | 'completed_local_image_only_network_disabled_no_push_no_deploy',
  dockerPushDeploy: false,
  remotionExecution: false,
  supabaseMutation: false,
  sqlExecution: false,
  secretPayloadAccess: false,
  serviceRoleSecretPayloadAccess: false,
  signedUrlCreation: false,
  publicArtifactCreation: false,
  creditMutation: false,
  providerCall: false,
  modelCall: false,
  finalRenderExport: false,
  externalBetaUnlock: false,
  paidProductionUnlock: false,
  productionUnlock: false,
  packageLockMutation: false,
  dependencyMutation: false,
}

function baseReport(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_PACKET,
    integrationBase,
    runId,
    outputDir,
    confirmationGate: {
      env: `${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_CONFIRM_ENV}=true`,
      observed:
        process.env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_CONFIRM_ENV] === 'true'
          ? 'present_true'
          : 'absent_or_not_true',
    },
    sourceChain: {
      sourceGatePr,
      sourceGateMergeSha,
      sourceGateDecision: 'completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_source_gate',
      dryRunPr,
      dryRunMergeSha,
      dryRunDecision: 'completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_dry_run',
      dryRunRunId,
      dryRunDispatchEnvelopeMode: 'dry_run_dispatch_envelope_no_route_no_worker_start',
      remoteClaimLeaseMode: 'remote_supabase_worker_claim_lease_no_worker_execution',
      excludedRemotionPr: '#577 open_draft_blocked_excluded',
    },
    target: {
      projectName: 'Reeditpro',
      projectRef: 'wmyyttnynmteqgcdishd',
      class: 'staging',
    },
    route: {
      path: routePath,
      workerSourcePath,
      workerSourceId: 'worker.gstreamerMkvtoolnix.narrowSourceExecution.notRegistered',
    },
    safety: baseSafety,
    productReadyEndToEndLocalOssTools: 0,
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_NEXT_MILESTONE,
    ...overrides,
  }
}

function finish(report: Record<string, unknown>, exitCode: number): void {
  fs.mkdirSync(outputDir, { recursive: true })
  const reportPath = path.join(outputDir, 'worker-dispatch-runtime-execution-packet-report.json')
  writeJson(reportPath, report)

  const files = [
    typeof report.executionEnvelopePath === 'string' ? report.executionEnvelopePath : undefined,
    typeof report.routeDelegateSummaryPath === 'string' ? report.routeDelegateSummaryPath : undefined,
    typeof report.outputManifestPath === 'string' ? report.outputManifestPath : undefined,
    typeof report.qaReportPath === 'string' ? report.qaReportPath : undefined,
    reportPath,
  ].filter((file): file is string => Boolean(file))

  const manifestPath = path.join(outputDir, 'worker-dispatch-runtime-execution-packet-manifest.json')
  const manifest = {
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_PACKET,
    runId,
    outputDir,
    decision: report.decision,
    execution: report.execution,
    artifacts: files.map((file) => artifact(file)),
  }
  writeJson(manifestPath, manifest)

  console.log(JSON.stringify({
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_PACKET,
    decision: report.decision,
    execution: report.execution,
    runId,
    outputDir,
    report: artifact(reportPath),
    manifest: artifact(manifestPath),
    artifacts: manifest.artifacts,
  }, null, 2))
  process.exit(exitCode)
}

if (process.env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_CONFIRM_ENV] !== 'true') {
  finish(
    baseReport({
      decision: blockedDecision,
      execution: 'blocked_confirmation_absent_no_worker_dispatch_runtime_execution_packet',
      blocker: blockedDecision,
      workerDispatchRuntimeExecutionPacket: {
        status: 'not_run_confirmation_absent',
        routeHandlerInvocation: 'not_run_confirmation_absent',
        runtimeRouteDelegate: 'not_run_confirmation_absent',
        realWorkerDispatch: 'not_run_confirmation_absent',
        toolExecution: 'not_run_confirmation_absent',
      },
      validation: 'blocked_confirmation_absent',
      nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_PACKET,
    }),
    2,
  )
}

const executionInput = buildGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketInput({
  executionPacketId: `execution-packet-gstreamer-mkvtoolnix-worker-dispatch-runtime-${runId}`,
  evidenceDirectory: outputDir,
  runtimeRouteInput: buildGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketInput().runtimeRouteInput,
})
const executionResult = await runGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacket(executionInput, {
  env: {
    ...process.env,
    [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_CONFIRM_ENV]: 'true',
  },
})

const executionEnvelope = {
  envelopeId: executionInput.executionPacketId,
  status: executionResult.ok
    ? 'completed_worker_dispatch_runtime_execution_packet_existing_guarded_route_delegate'
    : 'blocked_worker_dispatch_runtime_execution_packet',
  sanitizedExecutionPacket: executionResult.sanitizedExecutionPacket,
  blockers: executionResult.blockers,
  boundary: summarizeGstreamerMkvtoolnixWorkerDispatchRuntimeExecutionPacketBoundary(),
}
const executionEnvelopePath = path.join(outputDir, 'worker-dispatch-runtime-execution-packet-envelope.json')
writeJson(executionEnvelopePath, executionEnvelope)

const routeDelegateSummary = {
  routePath,
  routeHandlerInvocation: executionResult.safety.routeHandlerInvocation,
  runtimeRouteDelegate: executionResult.safety.runtimeRouteDelegate,
  runnerRunId: executionResult.sanitizedExecutionPacket.runtimeRouteRunnerRunId,
  runnerOutputDir: executionResult.sanitizedExecutionPacket.runtimeRouteRunnerOutputDir,
  runnerArtifacts: executionResult.sanitizedExecutionPacket.runtimeRouteRunnerArtifacts,
  realWorkerDispatch: false,
  workerExecution: false,
  workerLeaseMutation: false,
  persistentJobQueueWrite: false,
  supabaseMutation: false,
  sqlExecution: false,
}
const routeDelegateSummaryPath = path.join(outputDir, 'worker-dispatch-runtime-execution-packet-route-delegate-summary.json')
writeJson(routeDelegateSummaryPath, routeDelegateSummary)

const outputManifest = {
  manifestId: 'output-manifest-worker-dispatch-runtime-execution-packet-1',
  status: executionResult.ok
    ? 'validated_existing_guarded_generated_fixture_runtime_delegate'
    : 'blocked_before_output_acceptance',
  files: executionResult.sanitizedExecutionPacket.runtimeRouteRunnerArtifacts,
  signedUrls: false,
  publicArtifacts: false,
  finalRenderExport: false,
}
const outputManifestPath = path.join(outputDir, 'worker-dispatch-runtime-execution-packet-output-manifest.json')
writeJson(outputManifestPath, outputManifest)

const qaReport = {
  reportId: 'qa-report-worker-dispatch-runtime-execution-packet-1',
  status: executionResult.ok
    ? 'passed_worker_dispatch_runtime_execution_packet_boundary_validation'
    : 'blocked_worker_dispatch_runtime_execution_packet_boundary_validation',
  checks: [
    'confirmation_gate_present',
    'source_gate_2158_merge_sha_present',
    'dry_run_2162_merge_sha_present',
    'dry_run_run_id_present',
    'route_path_recorded',
    'worker_source_recorded',
    'execution_packet_idempotency_key_recorded',
    'rollback_plan_recorded',
    'cleanup_plan_recorded',
    'evidence_directory_recorded',
    'route_handler_invocation_guarded',
    'runtime_delegate_existing_guarded_route_only',
    'real_worker_dispatch_not_started',
    'worker_lease_not_mutated',
    'persistent_queue_not_written',
    'supabase_sql_not_enabled',
    'public_artifact_final_export_not_enabled',
  ],
  blockers: executionResult.blockers,
}
const qaReportPath = path.join(outputDir, 'worker-dispatch-runtime-execution-packet-qa-report.json')
writeJson(qaReportPath, qaReport)

finish(
  baseReport({
    decision: executionResult.ok
      ? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_DECISION
      : executionResult.status,
    execution: executionResult.ok
      ? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXECUTION_PACKET_EXECUTION
      : 'blocked_worker_dispatch_runtime_execution_packet_boundary_validation',
    workerDispatchRuntimeExecutionPacket: {
      status: executionResult.status,
      routeHandlerInvocation: executionResult.safety.routeHandlerInvocation,
      runtimeRouteDelegate: executionResult.safety.runtimeRouteDelegate,
      realWorkerDispatch: executionResult.safety.realWorkerDispatch,
      workerExecution: executionResult.safety.workerExecution,
      workerProcessStart: executionResult.safety.workerProcessStart,
      workerLeaseMutation: executionResult.safety.workerLeaseMutation,
      persistentJobQueueWrite: executionResult.safety.persistentJobQueueWrite,
      gstreamerExecution: executionResult.safety.gstreamerExecution,
      mkvtoolnixExecution: executionResult.safety.mkvtoolnixExecution,
      mediaProcessing: executionResult.safety.mediaProcessing,
      dockerExecution: executionResult.safety.dockerExecution,
      supabaseMutation: executionResult.safety.supabaseMutation,
      sqlExecution: executionResult.safety.sqlExecution,
      blockers: executionResult.blockers,
    },
    sanitizedExecutionPacket: executionResult.sanitizedExecutionPacket,
    executionEnvelopePath,
    routeDelegateSummaryPath,
    outputManifestPath,
    qaReportPath,
    safety: {
      ...baseSafety,
      routeHandlerInvocation: executionResult.safety.routeHandlerInvocation,
      runtimeRouteDelegate: executionResult.safety.runtimeRouteDelegate,
      gstreamerExecution: executionResult.safety.gstreamerExecution,
      mkvtoolnixExecution: executionResult.safety.mkvtoolnixExecution,
      mediaProcessing: executionResult.safety.mediaProcessing,
      dockerExecution: executionResult.safety.dockerExecution,
    },
    validation: executionResult.ok ? 'passed' : 'blocked_worker_dispatch_runtime_execution_packet_validation',
  }),
  executionResult.ok ? 0 : 1,
)
