import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_EXECUTION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_NEXT_MILESTONE,
  buildGstreamerMkvtoolnixAgentControlledWorkerRuntimeInput,
  summarizeGstreamerMkvtoolnixAgentControlledWorkerRuntimeBoundary,
  validateGstreamerMkvtoolnixAgentControlledWorkerRuntimeInput,
  type GuardedRuntimeExecutionSummary,
} from '../../server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-CONTROLLED-WORKER-RUNTIME-EXECUTION-PACKET-1'
const blockedDecision = 'blocked_pending_gstreamer_mkvtoolnix_agent_controlled_worker_runtime_execution_confirmation'
const integrationBase = '6cc86d71f383a64254ce2324e02e5d83e70bc031'
const dispatchDryRunPr = 1905
const dispatchDryRunMergeSha = '6cc86d71f383a64254ce2324e02e5d83e70bc031'
const dispatchDryRunRunId = '2026-06-30T20-56-18-927Z-8e5d25d9'
const queuePr = 1902
const queueMergeSha = 'cc18a07622a3107c589d2d2957432026da27b8cd'
const queueRunId = '2026-06-30T19-45-59-915Z-af80c9f8'
const guardedRuntimeScript = 'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1.mjs'
const guardedRuntimeConfirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_RUNTIME_EXECUTION'
const outputRoot = '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(outputRoot, runId)

function sha256File(file: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function artifact(file: string): { fileName: string; bytes: number; sha256: string } {
  return {
    fileName: path.basename(file),
    bytes: fs.statSync(file).size,
    sha256: sha256File(file),
  }
}

function bounded(value: unknown): string {
  return String(value ?? '').slice(0, 3000)
}

const noScopeSafety = {
  routeExecution: false,
  workerDispatch: false,
  workerExecution: false,
  workerLeaseClaim: false,
  persistentJobQueueWrite: false,
  privateMediaProcessing: false,
  userMediaProcessing: false,
  ffmpegFfprobeExecution: false,
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
  creditMutation: false,
  finalRenderExport: false,
  broadExternalBetaUnlock: false,
  paidProductionUnlock: false,
  productionUnlock: false,
  packageLockMutation: false,
  dependencyMutation: false,
}

function baseReport(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    packet,
    integrationBase,
    runId,
    outputDir,
    confirmationGate: {
      env: `${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_CONFIRM_ENV}=true`,
      observed:
        process.env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_CONFIRM_ENV] === 'true'
          ? 'present_true'
          : 'absent_or_not_true',
    },
    sourceChain: {
      agentControlledWorkerDispatchDryRunPr: dispatchDryRunPr,
      agentControlledWorkerDispatchDryRunMergeSha: dispatchDryRunMergeSha,
      agentControlledWorkerDispatchDryRunRunId: dispatchDryRunRunId,
      agentControlledWorkerDispatchDryRunDecision:
        'completed_gstreamer_mkvtoolnix_agent_controlled_worker_dispatch_dry_run_metadata_only',
      agentControlledWorkerQueuePr: queuePr,
      agentControlledWorkerQueueMergeSha: queueMergeSha,
      agentControlledWorkerQueueRunId: queueRunId,
      agentControlledWorkerQueueDecision:
        'completed_gstreamer_mkvtoolnix_agent_controlled_worker_queue_integration_metadata_only',
      guardedRuntimeScript,
      excludedRemotionPr: '#577 open_draft_blocked_excluded',
    },
    productReadyEndToEndLocalOssTools: 0,
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_NEXT_MILESTONE,
    ...overrides,
  }
}

function finish(report: Record<string, unknown>, exitCode: number): void {
  fs.mkdirSync(outputDir, { recursive: true })
  const reportPath = path.join(outputDir, 'gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1-report.json')
  writeJson(reportPath, report)

  const files = [
    reportPath,
    typeof report.runtimePacketEnvelopePath === 'string' ? report.runtimePacketEnvelopePath : undefined,
    typeof report.outputManifestPath === 'string' ? report.outputManifestPath : undefined,
    typeof report.qaReportPath === 'string' ? report.qaReportPath : undefined,
  ].filter((file): file is string => Boolean(file))

  const manifestPath = path.join(outputDir, 'gstreamer-mkvtoolnix-agent-controlled-worker-runtime-execution-packet-1-manifest.json')
  const manifest = {
    packet,
    runId,
    outputDir,
    decision: report.decision,
    execution: report.execution,
    artifacts: files.map((file) => artifact(file)),
  }
  writeJson(manifestPath, manifest)
  manifest.artifacts.push(artifact(manifestPath))
  writeJson(manifestPath, manifest)

  console.log(JSON.stringify({
    packet,
    decision: report.decision,
    execution: report.execution,
    runId,
    outputDir,
    report: reportPath,
    manifest: manifestPath,
    artifacts: manifest.artifacts,
  }, null, 2))
  process.exit(exitCode)
}

if (process.env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_CONFIRM_ENV] !== 'true') {
  finish(
    baseReport({
      decision: blockedDecision,
      execution: 'blocked_confirmation_absent_no_agent_controlled_worker_runtime_execution',
      workerRuntimeExecutionPacket: {
        status: 'not_run_confirmation_absent',
        blocker: blockedDecision,
        guardedRuntimeExecution: 'not_run_confirmation_absent',
        gstreamerExecution: 'not_run_confirmation_absent',
        mkvtoolnixExecution: 'not_run_confirmation_absent',
      },
      safety: {
        ...noScopeSafety,
        dockerExecution: false,
        gstreamerExecution: false,
        mkvtoolnixExecution: false,
        mediaProcessing: false,
      },
      validation: 'blocked_confirmation_absent',
    }),
    2,
  )
}

const guardedRuntimeProcess = spawnSync('node', [guardedRuntimeScript], {
  encoding: 'utf8',
  env: {
    ...process.env,
    [guardedRuntimeConfirmEnv]: 'true',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
  timeout: 120000,
})

if (guardedRuntimeProcess.status !== 0) {
  finish(
    baseReport({
      decision: 'blocked_guarded_runtime_execution_result_failed',
      execution: 'blocked_guarded_runtime_execution_failed_before_agent_runtime_packet_acceptance',
      blocker: 'blocked_guarded_runtime_execution_result_failed',
      guardedRuntimeProcess: {
        exitStatus: guardedRuntimeProcess.status,
        signal: guardedRuntimeProcess.signal ?? null,
        stdoutSnippet: bounded(guardedRuntimeProcess.stdout),
        stderrSnippet: bounded(guardedRuntimeProcess.stderr),
      },
      safety: {
        ...noScopeSafety,
        dockerExecution: 'attempted_local_image_only_network_disabled_no_push_no_deploy',
        gstreamerExecution: 'blocked_or_incomplete_controlled_generated_fixture_only',
        mkvtoolnixExecution: 'blocked_or_incomplete_controlled_generated_fixture_only',
        mediaProcessing: 'blocked_or_incomplete_controlled_generated_fixture_only',
      },
      validation: 'blocked_guarded_runtime_execution_result_failed',
    }),
    1,
  )
}

let guardedSummary: { report: string }
try {
  guardedSummary = JSON.parse(guardedRuntimeProcess.stdout) as { report: string }
} catch {
  finish(
    baseReport({
      decision: 'blocked_guarded_runtime_execution_result_failed',
      execution: 'blocked_guarded_runtime_summary_parse_failed',
      blocker: 'blocked_guarded_runtime_execution_result_failed',
      guardedRuntimeProcess: {
        stdoutSnippet: bounded(guardedRuntimeProcess.stdout),
        stderrSnippet: bounded(guardedRuntimeProcess.stderr),
      },
      safety: {
        ...noScopeSafety,
        dockerExecution: 'attempted_local_image_only_network_disabled_no_push_no_deploy',
        gstreamerExecution: 'unknown_guarded_runtime_summary_parse_failed',
        mkvtoolnixExecution: 'unknown_guarded_runtime_summary_parse_failed',
        mediaProcessing: 'unknown_guarded_runtime_summary_parse_failed',
      },
      validation: 'blocked_guarded_runtime_execution_result_failed',
    }),
    1,
  )
}

const guardedRuntimeReport = JSON.parse(fs.readFileSync(guardedSummary.report, 'utf8')) as GuardedRuntimeExecutionSummary
const guardedRuntime = {
  ...guardedRuntimeReport,
  validation: guardedRuntimeReport.validation ?? 'passed',
} satisfies GuardedRuntimeExecutionSummary
const runtimeInput = buildGstreamerMkvtoolnixAgentControlledWorkerRuntimeInput(guardedRuntime)
const runtimeResult = validateGstreamerMkvtoolnixAgentControlledWorkerRuntimeInput(runtimeInput)

const runtimePacketEnvelope = {
  envelopeId: 'agent-controlled-worker-runtime-execution-packet-1-envelope',
  status: runtimeResult.status,
  sanitizedRuntimePacket: runtimeResult.sanitizedRuntimePacket,
  blockers: runtimeResult.blockers,
  boundary: summarizeGstreamerMkvtoolnixAgentControlledWorkerRuntimeBoundary(),
  guardedRuntimeReport: guardedSummary.report,
  routeExecuted: false,
  workerDispatched: false,
  workerExecuted: false,
  workerLeaseClaimed: false,
  persistentQueueWrite: false,
}
const runtimePacketEnvelopePath = path.join(outputDir, 'runtime-packet-envelope.json')
writeJson(runtimePacketEnvelopePath, runtimePacketEnvelope)

const outputManifest = {
  manifestId: 'output-manifest-agent-controlled-worker-runtime-execution-packet-1',
  status: runtimeResult.ok
    ? 'accepted_guarded_runtime_output_manifest_reference_only'
    : 'blocked_agent_runtime_packet_validation',
  guardedRuntimeOutputDir: guardedRuntime.outputDir,
  controlledGeneratedFixtureOnly: true,
  routeExecution: false,
  workerDispatch: false,
  workerExecution: false,
  workerLeaseClaim: false,
  publicArtifacts: false,
  signedUrls: false,
  finalRenderExport: false,
  files: [],
}
const outputManifestPath = path.join(outputDir, 'output-manifest.json')
writeJson(outputManifestPath, outputManifest)

const qaReport = {
  reportId: 'qa-report-agent-controlled-worker-runtime-execution-packet-1',
  status: runtimeResult.ok
    ? 'passed_agent_controlled_worker_runtime_execution_packet_generated_fixture_only'
    : 'blocked_agent_controlled_worker_runtime_execution_packet_validation',
  checks: [
    'agent_runtime_confirmation_gate_present',
    'controlled_worker_dispatch_dry_run_source_present',
    'guarded_runtime_execution_confirmation_gate_present',
    'approved_snapshot_reference_preserved',
    'approval_record_reference_preserved',
    'credit_or_no_spend_policy_reference_preserved',
    'job_and_worker_lease_references_preserved_without_claim',
    'route_dispatch_queue_runtime_idempotency_refs_preserved',
    'allowed_command_templates_only',
    'docker_network_disabled',
    'generated_fixture_scope_only',
    'no_route_worker_dispatch_or_persistent_queue_write',
    'no_private_user_media_public_artifacts_or_final_export',
  ],
  blockers: runtimeResult.blockers,
}
const qaReportPath = path.join(outputDir, 'qa-report.json')
writeJson(qaReportPath, qaReport)

finish(
  baseReport({
    decision: runtimeResult.ok ? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_DECISION : runtimeResult.status,
    execution: runtimeResult.ok
      ? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_EXECUTION
      : 'blocked_agent_controlled_worker_runtime_execution_packet_validation',
    guardedRuntime: {
      runId: guardedRuntime.runId,
      outputDir: guardedRuntime.outputDir,
      decision: guardedRuntime.decision,
      execution: guardedRuntime.execution,
      imageTag: guardedRuntime.imageTag,
      commandResults: guardedRuntime.commandResults.map((result) => ({
        templateId: result.templateId,
        ok: result.ok,
        exitStatus: result.exitStatus,
        mediaInput: result.mediaInput,
        mediaOutput: result.mediaOutput,
      })),
    },
    workerRuntimeExecutionPacket: {
      status: runtimeResult.status,
      confirmationGate: `${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_RUNTIME_CONFIRM_ENV}=true`,
      runtimePacketId: runtimeResult.sanitizedRuntimePacket.runtimePacketId,
      runtimeExecutionId: runtimeResult.sanitizedRuntimePacket.runtimeExecutionId,
      runtimeExecutionMode: runtimeResult.sanitizedRuntimePacket.runtimeExecutionMode,
      runtimeExecutionIdempotencyKey: runtimeResult.sanitizedRuntimePacket.runtimeExecutionIdempotencyKey,
      fixtureScope: runtimeResult.sanitizedRuntimePacket.fixtureScope,
      workerRuntimeMode: runtimeResult.sanitizedRuntimePacket.workerRuntimeMode,
      dispatchDryRunId: runtimeResult.sanitizedRuntimePacket.dispatchDryRunId,
      dispatchDryRunIdempotencyKey: runtimeResult.sanitizedRuntimePacket.dispatchDryRunIdempotencyKey,
      approvedSnapshotId: runtimeResult.sanitizedRuntimePacket.approvedSnapshotId,
      approvalRecordId: runtimeResult.sanitizedRuntimePacket.approvalRecordId,
      creditPolicyRef: runtimeResult.sanitizedRuntimePacket.creditPolicyRef,
      creditPolicyMode: runtimeResult.sanitizedRuntimePacket.creditPolicyMode,
      jobId: runtimeResult.sanitizedRuntimePacket.jobId,
      workerLeaseId: runtimeResult.sanitizedRuntimePacket.workerLeaseId,
      routeIdempotencyKey: runtimeResult.sanitizedRuntimePacket.routeIdempotencyKey,
      commandTemplateId: runtimeResult.sanitizedRuntimePacket.commandTemplateId,
      privateInputManifestId: runtimeResult.sanitizedRuntimePacket.privateInputManifestId,
      outputManifestSchemaId: runtimeResult.sanitizedRuntimePacket.outputManifestSchemaId,
      qaReportSchemaId: runtimeResult.sanitizedRuntimePacket.qaReportSchemaId,
      dockerImageTag: runtimeResult.sanitizedRuntimePacket.dockerImageTag,
      dockerNetwork: runtimeResult.sanitizedRuntimePacket.dockerNetwork,
      runtimePacketAccepted: runtimeResult.sanitizedRuntimePacket.runtimePacketAccepted,
      routeExecution: 'not_run_agent_runtime_packet_runner_only',
      workerDispatch: 'not_run_agent_runtime_packet_runner_only',
      workerExecution: 'not_run_agent_runtime_packet_runner_only',
      workerLeaseClaim: 'not_run_agent_runtime_packet_runner_only',
      persistentJobQueueWrite: 'not_run_agent_runtime_packet_runner_only',
      gstreamerExecution: 'completed_controlled_generated_fixture_only',
      mkvtoolnixExecution: 'completed_controlled_generated_fixture_only',
      mediaProcessing: 'controlled_generated_fixture_only',
      privateMediaProcessing: false,
      userMediaProcessing: false,
      nextSourceStatus: 'ready_for_agent_controlled_worker_runtime_qa_rollup',
    },
    runtimePacketEnvelopePath,
    outputManifestPath,
    qaReportPath,
    safety: runtimeResult.safety,
    validation: runtimeResult.ok ? 'passed' : 'blocked_agent_runtime_packet_validation',
  }),
  runtimeResult.ok ? 0 : 1,
)
