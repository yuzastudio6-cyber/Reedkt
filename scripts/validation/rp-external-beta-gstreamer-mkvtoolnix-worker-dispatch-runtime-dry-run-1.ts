import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_EXECUTION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_PACKET,
  buildGstreamerMkvtoolnixWorkerDispatchRuntimeDryRunInput,
  runGstreamerMkvtoolnixWorkerDispatchRuntimeDryRun,
  summarizeGstreamerMkvtoolnixWorkerDispatchRuntimeDryRunBoundary,
} from '../../server/services/rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1'

const blockedDecision = 'blocked_pending_gstreamer_mkvtoolnix_worker_dispatch_runtime_dry_run_confirmation'
const integrationBase = '488df755ef9f9954e8696ed336f9106bada06319'
const sourceGatePr = 2158
const sourceGateMergeSha = '488df755ef9f9954e8696ed336f9106bada06319'
const sourceGateDecision = 'completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_source_gate'
const remoteClaimLeasePr = 2155
const remoteClaimLeaseMergeSha = '1cd82653c437bcc5082ec7b54eb4d06098554a6c'
const remoteClaimLeaseRunId = '2026-07-02T15-13-58-300Z-7afbfde3'
const outputRoot = '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-dry-run-1'
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

const safety = {
  workerDispatchRuntimeDryRunMetadataOnly: true,
  routeHandlerInvocation: false,
  workerDispatch: false,
  workerExecution: false,
  workerProcessStart: false,
  workerLeaseMutation: false,
  persistentJobQueueWrite: false,
  gstreamerExecutionInThisDryRun: false,
  mkvtoolnixExecutionInThisDryRun: false,
  ffmpegFfprobeExecution: false,
  dockerExecution: false,
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
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_PACKET,
    integrationBase,
    runId,
    outputDir,
    confirmationGate: {
      env: `${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_CONFIRM_ENV}=true`,
      observed:
        process.env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_CONFIRM_ENV] === 'true'
          ? 'present_true'
          : 'absent_or_not_true',
    },
    sourceChain: {
      sourceGatePr,
      sourceGateMergeSha,
      sourceGateDecision,
      sourceGateDispatchEnvelopeMode: 'source_gate_ready_for_confirmation_gated_dispatch_dry_run',
      remoteClaimLeasePr,
      remoteClaimLeaseMergeSha,
      remoteClaimLeaseRunId,
      remoteClaimLeaseDecision: 'completed_gstreamer_mkvtoolnix_remote_worker_claim_lease_runtime_validation',
      excludedRemotionPr: '#577 open_draft_blocked_excluded',
    },
    target: {
      projectName: 'Reeditpro',
      projectRef: 'wmyyttnynmteqgcdishd',
      class: 'staging',
    },
    safety,
    productReadyEndToEndLocalOssTools: 0,
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_NEXT_MILESTONE,
    ...overrides,
  }
}

function finish(report: Record<string, unknown>, exitCode: number): void {
  fs.mkdirSync(outputDir, { recursive: true })
  const reportPath = path.join(outputDir, 'worker-dispatch-runtime-dry-run-report.json')
  writeJson(reportPath, report)

  const files = [
    typeof report.dispatchDryRunEnvelopePath === 'string' ? report.dispatchDryRunEnvelopePath : undefined,
    typeof report.outputManifestPath === 'string' ? report.outputManifestPath : undefined,
    typeof report.qaReportPath === 'string' ? report.qaReportPath : undefined,
    reportPath,
  ].filter((file): file is string => Boolean(file))

  const manifestPath = path.join(outputDir, 'worker-dispatch-runtime-dry-run-manifest.json')
  const manifest = {
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_PACKET,
    runId,
    outputDir,
    decision: report.decision,
    execution: report.execution,
    artifacts: files.map((file) => artifact(file)),
  }
  writeJson(manifestPath, manifest)

  console.log(JSON.stringify({
    packet: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_PACKET,
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

if (process.env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_CONFIRM_ENV] !== 'true') {
  finish(
    baseReport({
      decision: blockedDecision,
      execution: 'blocked_confirmation_absent_no_worker_dispatch_runtime_dry_run',
      workerDispatchRuntimeDryRun: {
        status: 'not_run_confirmation_absent',
        blocker: blockedDecision,
        dryRunDispatchEnvelope: 'not_run_confirmation_absent',
        routeHandlerInvocation: 'not_run_confirmation_absent',
        workerDispatch: 'not_run_confirmation_absent',
        workerExecution: 'not_run_confirmation_absent',
        workerProcessStart: 'not_run_confirmation_absent',
        workerLeaseMutation: 'not_run_confirmation_absent',
        toolExecution: 'not_run_confirmation_absent',
      },
      validation: 'blocked_confirmation_absent',
    }),
    2,
  )
}

const dryRunInput = buildGstreamerMkvtoolnixWorkerDispatchRuntimeDryRunInput({
  dryRunId: `dry-run-gstreamer-mkvtoolnix-worker-dispatch-runtime-${runId}`,
  dryRunDispatchEnvelopeId: `dispatch-envelope-gstreamer-mkvtoolnix-worker-dispatch-runtime-${runId}`,
})
const dryRunResult = runGstreamerMkvtoolnixWorkerDispatchRuntimeDryRun(dryRunInput, {
  [RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_CONFIRM_ENV]: 'true',
})

const dispatchDryRunEnvelope = {
  envelopeId: dryRunInput.dryRunDispatchEnvelopeId,
  status: dryRunResult.ok
    ? 'completed_worker_dispatch_runtime_dry_run_metadata_only'
    : 'blocked_worker_dispatch_runtime_dry_run_boundary_validation',
  sanitizedWorkerDispatchDryRun: dryRunResult.sanitizedWorkerDispatchDryRun,
  blockers: dryRunResult.blockers,
  boundary: summarizeGstreamerMkvtoolnixWorkerDispatchRuntimeDryRunBoundary(),
  routeHandlerInvoked: false,
  workerDispatched: false,
  workerExecuted: false,
  workerProcessStarted: false,
  workerLeaseMutated: false,
  persistentJobQueueWrite: false,
  toolsExecuted: false,
  mediaProcessed: false,
  supabaseMutated: false,
  sqlExecuted: false,
}
const dispatchDryRunEnvelopePath = path.join(outputDir, 'worker-dispatch-runtime-dry-run-envelope.json')
writeJson(dispatchDryRunEnvelopePath, dispatchDryRunEnvelope)

const outputManifest = {
  manifestId: 'output-manifest-worker-dispatch-runtime-dry-run-1',
  status: 'validated_schema_only_no_runtime_outputs_created',
  workerDispatchRuntimeDryRunMetadataOnly: true,
  routeHandlerInvocation: false,
  workerDispatch: false,
  workerExecution: false,
  workerProcessStart: false,
  workerLeaseMutation: false,
  persistentJobQueueWrite: false,
  publicArtifacts: false,
  signedUrls: false,
  finalRenderExport: false,
  files: [],
}
const outputManifestPath = path.join(outputDir, 'worker-dispatch-runtime-dry-run-output-manifest.json')
writeJson(outputManifestPath, outputManifest)

const qaReport = {
  reportId: 'qa-report-worker-dispatch-runtime-dry-run-1',
  status: dryRunResult.ok
    ? 'passed_worker_dispatch_runtime_dry_run_metadata_boundary_validation_only'
    : 'blocked_worker_dispatch_runtime_dry_run_metadata_boundary_validation',
  checks: [
    'confirmation_gate_present',
    'source_gate_2158_merge_sha_present',
    'source_gate_decision_present',
    'remote_claim_lease_2155_run_id_present',
    'quality_check_job_type_present',
    'runtime_payload_kind_present',
    'remote_claim_lease_mode_present',
    'source_gate_dispatch_envelope_present',
    'dry_run_dispatch_envelope_present',
    'dry_run_idempotency_key_present',
    'route_handler_not_invoked',
    'worker_dispatch_not_started',
    'worker_execution_not_started',
    'worker_process_not_started',
    'worker_lease_not_mutated',
    'persistent_queue_not_written',
    'tool_execution_not_enabled',
    'supabase_sql_not_enabled',
  ],
  blockers: dryRunResult.blockers,
}
const qaReportPath = path.join(outputDir, 'worker-dispatch-runtime-dry-run-qa-report.json')
writeJson(qaReportPath, qaReport)

finish(
  baseReport({
    decision: dryRunResult.ok
      ? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_DECISION
      : dryRunResult.status,
    execution: dryRunResult.ok
      ? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_DRY_RUN_EXECUTION
      : 'blocked_worker_dispatch_runtime_dry_run_boundary_validation',
    workerDispatchRuntimeDryRun: {
      status: dryRunResult.status,
      dryRunDispatchEnvelope: dryRunResult.safety.dryRunDispatchEnvelopeCreated,
      routeHandlerInvocation: dryRunResult.safety.routeHandlerInvocation,
      workerDispatch: dryRunResult.safety.workerDispatch,
      workerExecution: dryRunResult.safety.workerExecution,
      workerProcessStart: dryRunResult.safety.workerProcessStart,
      workerLeaseMutation: dryRunResult.safety.workerLeaseMutation,
      persistentJobQueueWrite: dryRunResult.safety.persistentJobQueueWrite,
      gstreamerExecution: dryRunResult.safety.gstreamerExecution,
      mkvtoolnixExecution: dryRunResult.safety.mkvtoolnixExecution,
      supabaseMutation: dryRunResult.safety.supabaseMutation,
      sqlExecution: dryRunResult.safety.sqlExecution,
      blockers: dryRunResult.blockers,
    },
    sanitizedWorkerDispatchDryRun: dryRunResult.sanitizedWorkerDispatchDryRun,
    dispatchDryRunEnvelopePath,
    outputManifestPath,
    qaReportPath,
    validation: dryRunResult.ok ? 'passed' : 'blocked_worker_dispatch_runtime_dry_run_validation',
  }),
  dryRunResult.ok ? 0 : 1,
)
