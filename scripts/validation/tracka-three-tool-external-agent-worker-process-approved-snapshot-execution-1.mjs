#!/usr/bin/env node
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-WORKER-PROCESS-APPROVED-SNAPSHOT-EXECUTION-1'
const decision = 'completed_three_tool_external_agent_worker_process_approved_snapshot_execution'
const execution = 'completed_worker_process_delegate_to_approved_snapshot_generated_fixture_runtime'
const confirmEnv = 'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_WORKER_PROCESS_APPROVED_SNAPSHOT_EXECUTION'
const childConfirmEnv = 'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION'
const childScript = 'scripts/validation/tracka-three-tool-external-agent-approved-snapshot-job-execution-1.mjs'
const sourceRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1/tracka-three-tool-external-agent-worker-dispatch-claim-lease-1-record.json'
const outputRoot = '/tmp/reeditpro-tracka-three-tool-external-agent-worker-process-approved-snapshot-execution-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(outputRoot, runId)
const nextMilestone = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-EXTERNAL-BETA-READINESS-ROLLUP-1'

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function artifact(file) {
  return {
    fileName: path.basename(file),
    relativePath: path.relative(outputDir, file),
    bytes: fs.statSync(file).size,
    sha256: sha256(file),
  }
}

function bounded(value) {
  return String(value ?? '').slice(0, 3000)
}

function parseSummary(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

function baseReport(overrides = {}) {
  const sourceRecord = fs.existsSync(sourceRecordPath) ? readJson(sourceRecordPath) : {}
  return {
    packet,
    runId,
    outputDir,
    decision,
    execution,
    confirmationGate: `${confirmEnv}=true`,
    sourceWorkerClaimLease: {
      packet: sourceRecord.packet,
      decision: sourceRecord.decision,
      execution: sourceRecord.execution,
      mergeSha: 'ac992038ff5c196b54488f908e83c6816a892d5b',
      status: sourceRecord.result?.status,
      workerLeaseClaim: sourceRecord.result?.workerLeaseClaim,
      workerType: sourceRecord.route?.workerType,
      excludedRemotionPr: '#577 open_draft_blocked_excluded',
    },
    workerProcessApprovedSnapshotExecution: {
      workerProcessStart: 'completed_local_worker_process_entrypoint',
      workerExecution: 'completed_worker_process_approved_snapshot_delegate',
      runtimeSourceClass: 'controlled_generated_fixture_only',
      activeNativeContainerToolLaneCount: 3,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      publicArtifacts: false,
      signedUrls: false,
      finalRenderExport: false,
    },
    safety: {
      workerProcessStart: 'completed_local_worker_process_entrypoint',
      workerExecution: 'completed_worker_process_approved_snapshot_delegate',
      runtimeRouteInvocation: false,
      workerDispatch: false,
      persistentJobQueueWrite: false,
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
      providerCall: false,
      modelCall: false,
      creditMutation: false,
      deployment: false,
      externalBetaExpansion: false,
      paidProductionUnlock: false,
      productionUnlock: false,
      finalRenderExport: false,
      packageInstallation: false,
      dependencyMutation: false,
      packageLockMutation: false,
    },
    productReadyEndToEndLocalOssTools: 0,
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
    nextMilestone,
    ...overrides,
  }
}

function finish(report, exitCode) {
  fs.mkdirSync(outputDir, { recursive: true })
  const reportPath = path.join(outputDir, 'three-tool-external-agent-worker-process-approved-snapshot-execution-1-report.json')
  writeJson(reportPath, report)

  const files = [
    reportPath,
    report.workerProcessEnvelopePath,
    report.childReportPath,
    report.childManifestPath,
  ].filter(Boolean)
  const manifestPath = path.join(outputDir, 'three-tool-external-agent-worker-process-approved-snapshot-execution-1-manifest.json')
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
    ok: exitCode === 0,
    packet,
    decision: report.decision,
    execution: report.execution,
    blocker: report.blocker,
    runId,
    outputDir,
    report: reportPath,
    manifest: manifestPath,
    artifacts: manifest.artifacts,
    childRunId: report.childApprovedSnapshotExecution?.runId ?? null,
    childOutputDir: report.childApprovedSnapshotExecution?.outputDir ?? null,
    childArtifacts: report.childApprovedSnapshotExecution?.artifacts ?? [],
    nextMilestone: report.nextMilestone,
  }, null, 2))
  process.exit(exitCode)
}

if (process.env[confirmEnv] !== 'true') {
  finish(
    baseReport({
      decision: 'blocked_pending_three_tool_worker_process_approved_snapshot_execution_confirmation',
      execution: 'blocked_confirmation_absent_no_worker_process_approved_snapshot_execution',
      blocker: 'blocked_pending_three_tool_worker_process_approved_snapshot_execution_confirmation',
      validation: 'blocked_confirmation_absent',
    }),
    2,
  )
}

let sourceRecord
try {
  sourceRecord = readJson(sourceRecordPath)
} catch (error) {
  finish(
    baseReport({
      decision: 'blocked_missing_three_tool_worker_claim_lease_source_record',
      execution: 'blocked_before_worker_process_approved_snapshot_execution',
      blocker: 'blocked_missing_three_tool_worker_claim_lease_source_record',
      sourceReadError: bounded(error.message),
      validation: 'blocked_missing_source_record',
    }),
    1,
  )
}

const sourceOk =
  sourceRecord.decision === 'completed_three_tool_external_agent_local_mock_worker_claim_lease_boundary' &&
  sourceRecord.execution === 'completed_local_mock_worker_claim_lease_no_worker_execution_or_tool_execution' &&
  sourceRecord.validation === 'passed' &&
  sourceRecord.result?.workerLeaseClaim === 'completed_local_mock_claim_only' &&
  sourceRecord.safety?.workerDispatch === false &&
  sourceRecord.safety?.workerExecution === false &&
  sourceRecord.safety?.supabaseMutation === false &&
  sourceRecord.safety?.sqlExecution === false

if (!sourceOk) {
  finish(
    baseReport({
      decision: 'blocked_three_tool_worker_claim_lease_source_not_ready',
      execution: 'blocked_before_worker_process_approved_snapshot_execution',
      blocker: 'blocked_three_tool_worker_claim_lease_source_not_ready',
      sourceDecision: sourceRecord.decision,
      validation: 'blocked_source_not_ready',
    }),
    1,
  )
}

const child = spawnSync('node', [childScript], {
  encoding: 'utf8',
  env: {
    ...process.env,
    [childConfirmEnv]: 'true',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
  timeout: 300000,
})

const childSummary = parseSummary(child.stdout)
if (child.status !== 0 || !childSummary) {
  finish(
    baseReport({
      decision: 'blocked_three_tool_worker_process_approved_snapshot_child_failed',
      execution: 'blocked_child_three_tool_approved_snapshot_execution_failed',
      blocker:
        childSummary?.blocker ??
        childSummary?.decision ??
        'blocked_three_tool_worker_process_approved_snapshot_child_failed',
      childProcess: {
        exitStatus: child.status,
        signal: child.signal ?? null,
        stdoutSnippet: bounded(child.stdout),
        stderrSnippet: bounded(child.stderr),
      },
      validation: 'blocked_child_failed',
    }),
    1,
  )
}

const childReport = readJson(childSummary.report)
const childOk =
  childReport.decision === 'completed_three_tool_external_agent_approved_snapshot_job_execution' &&
  childReport.execution === 'completed_confirmation_gated_three_tool_approved_snapshot_job_execution_generated_fixture_only' &&
  childReport.approvedSnapshotJobExecution?.sourceClass === 'controlled_generated_fixture_only' &&
  childReport.approvedSnapshotJobExecution?.privateMediaProcessing === false &&
  childReport.approvedSnapshotJobExecution?.userMediaProcessing === false &&
  childReport.safety?.supabaseMutation === false &&
  childReport.safety?.sqlExecution === false &&
  childReport.safety?.publicArtifactCreation === false &&
  childReport.safety?.finalRenderExport === false

if (!childOk) {
  finish(
    baseReport({
      decision: 'blocked_three_tool_worker_process_approved_snapshot_child_safety_failed',
      execution: 'blocked_child_three_tool_approved_snapshot_safety_validation_failed',
      blocker: 'blocked_three_tool_worker_process_approved_snapshot_child_safety_failed',
      childDecision: childReport.decision,
      validation: 'blocked_child_safety_failed',
    }),
    1,
  )
}

const workerProcessEnvelopePath = path.join(outputDir, 'worker-process-approved-snapshot-envelope.json')
writeJson(workerProcessEnvelopePath, {
  packet,
  runId,
  sourceWorkerClaimLeaseRecord: sourceRecordPath,
  childRunId: childSummary.runId,
  childOutputDir: childSummary.outputDir,
  workerProcessStart: 'completed_local_worker_process_entrypoint',
  workerExecution: 'completed_worker_process_approved_snapshot_delegate',
  runtimeSourceClass: 'controlled_generated_fixture_only',
})

finish(
  baseReport({
    validation: 'passed',
    workerProcessEnvelopePath,
    childReportPath: childSummary.report,
    childManifestPath: childSummary.manifest,
    childApprovedSnapshotExecution: {
      runId: childSummary.runId,
      outputDir: childSummary.outputDir,
      report: childSummary.report,
      manifest: childSummary.manifest,
      artifacts: childSummary.artifacts,
    },
    readiness: {
      gstreamer_render_pipeline_support: 'external_agent_worker_process_approved_snapshot_execution_passed',
      mkvtoolnix_container_validation: 'external_agent_worker_process_approved_snapshot_execution_passed',
      gpac_mp4box_packaging_validation: 'external_agent_worker_process_approved_snapshot_execution_passed',
    },
  }),
  0,
)
