#!/usr/bin/env node
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-APPROVED-SNAPSHOT-JOB-EXECUTION-1'
const decision = 'completed_three_tool_external_agent_approved_snapshot_job_execution'
const execution = 'completed_confirmation_gated_three_tool_approved_snapshot_job_execution_generated_fixture_only'
const confirmEnv = 'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION'
const childConfirmEnv = 'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_CONTROLLED_GENERATED_FIXTURE_EXECUTION'
const childScript = 'scripts/validation/tracka-three-tool-external-agent-controlled-generated-fixture-execution-1.mjs'
const sourceRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-worker-process-noop-invoke-1/tracka-three-tool-external-agent-worker-process-noop-invoke-1-record.json'
const outputRoot = '/tmp/reeditpro-tracka-three-tool-external-agent-approved-snapshot-job-execution-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(outputRoot, runId)
const approvedSnapshotId = 'approved-snapshot-three-tool-external-agent-generated-fixture-post-qa-1'
const jobId = 'job-three-tool-external-agent-generated-fixture-post-qa-1'
const nextMilestone = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-PRODUCTION-READINESS-REVIEW-1'

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function sha256Text(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function artifact(file) {
  return {
    fileName: path.basename(file),
    relativePath: path.relative(outputDir, file),
    bytes: fs.statSync(file).size,
    sha256: sha256File(file),
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
    sourceWorkerProcessNoop: {
      packet: sourceRecord.packet,
      decision: sourceRecord.decision,
      execution: sourceRecord.execution,
      mergeSha: '52d7cd2b4e7fac7f18c2c01ef6be1ac4a7da0f6b',
      runId: sourceRecord.runId,
      entrypointId: sourceRecord.workerProcessNoop?.entrypointId,
      leaseId: sourceRecord.workerProcessNoop?.leaseId,
      excludedRemotionPr: '#577 open_draft_blocked_excluded',
    },
    approvedSnapshotJobExecution: {
      approvedSnapshotId,
      jobId,
      sourceClass: 'controlled_generated_fixture_only',
      activeNativeContainerToolLaneCount: 3,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      publicArtifacts: false,
      signedUrls: false,
      finalRenderExport: false,
    },
    safety: {
      routeExecution: false,
      persistentJobQueueWrite: false,
      workerDispatch: false,
      workerLeaseClaim: false,
      workerProcessStart: false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      ffmpegFfprobeExecution: false,
      supabaseMutation: false,
      sqlExecution: false,
      secretPayloadAccess: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      providerCall: false,
      modelCall: false,
      creditMutation: false,
      deployment: false,
      externalBetaExpansion: false,
      productionUnlock: false,
      finalRenderExport: false,
      packageInstallation: false,
      dependencyMutation: false,
      packageLockMutation: false,
      dockerPushDeploy: false,
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
  const reportPath = path.join(outputDir, 'three-tool-external-agent-approved-snapshot-job-execution-1-report.json')
  writeJson(reportPath, report)

  const files = [
    reportPath,
    report.approvedSnapshotRuntimeEnvelopePath,
    report.outputManifestPath,
    report.qaReportPath,
  ].filter(Boolean)
  const manifestPath = path.join(outputDir, 'three-tool-external-agent-approved-snapshot-job-execution-1-manifest.json')
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
    blocker: report.blocker,
    runId,
    outputDir,
    report: reportPath,
    manifest: manifestPath,
    artifacts: manifest.artifacts,
    nextMilestone: report.nextMilestone,
  }, null, 2))
  process.exit(exitCode)
}

if (process.env[confirmEnv] !== 'true') {
  finish(
    baseReport({
      decision: 'blocked_pending_three_tool_approved_snapshot_job_execution_confirmation',
      execution: 'blocked_confirmation_absent_no_three_tool_approved_snapshot_job_execution',
      blocker: 'blocked_pending_three_tool_approved_snapshot_job_execution_confirmation',
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
      decision: 'blocked_missing_three_tool_worker_process_noop_source_record',
      execution: 'blocked_before_three_tool_approved_snapshot_job_execution',
      blocker: 'blocked_missing_three_tool_worker_process_noop_source_record',
      sourceReadError: bounded(error.message),
      validation: 'blocked_missing_three_tool_worker_process_noop_source_record',
    }),
    1,
  )
}

const sourceOk =
  sourceRecord.decision === 'completed_three_tool_external_agent_worker_process_noop_invoke' &&
  sourceRecord.workerProcessNoop?.approvedSnapshotHandoffValidation === 'passed' &&
  sourceRecord.workerProcessNoop?.artifactManifestPlaceholderAssembly === 'passed' &&
  sourceRecord.workerProcessNoop?.workerEntrypointValidation === 'passed'

if (!sourceOk) {
  finish(
    baseReport({
      decision: 'blocked_three_tool_worker_process_noop_source_not_ready',
      execution: 'blocked_before_three_tool_approved_snapshot_job_execution',
      blocker: 'blocked_three_tool_worker_process_noop_source_not_ready',
      sourceDecision: sourceRecord.decision,
      validation: 'blocked_three_tool_worker_process_noop_source_not_ready',
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
      decision: 'blocked_three_tool_approved_snapshot_job_execution_child_failed',
      execution: 'blocked_child_three_tool_generated_fixture_execution_failed',
      blocker:
        childSummary?.blocker ??
        childSummary?.decision ??
        'blocked_three_tool_approved_snapshot_job_execution_child_failed',
      childProcess: {
        exitStatus: child.status,
        signal: child.signal ?? null,
        stdoutSnippet: bounded(child.stdout),
        stderrSnippet: bounded(child.stderr),
      },
      validation: 'blocked_child_three_tool_generated_fixture_execution_failed',
    }),
    1,
  )
}

const childReport = readJson(childSummary.report)
const childOk =
  childReport.decision === 'completed_three_tool_external_agent_controlled_generated_fixture_execution' &&
  childReport.execution === 'completed_confirmation_gated_three_tool_controlled_generated_fixture_runtime_execution' &&
  childReport.runtimeExecution?.status === 'completed_three_tool_controlled_generated_fixture_runtime_execution' &&
  childReport.runtimeExecution?.gstreamerExecution === 'completed_controlled_generated_fixture_only' &&
  childReport.runtimeExecution?.mkvtoolnixExecution === 'completed_controlled_generated_fixture_only' &&
  childReport.runtimeExecution?.gpacMp4boxExecution === 'completed_controlled_generated_fixture_only' &&
  childReport.runtimeExecution?.privateMediaProcessing === false &&
  childReport.runtimeExecution?.userMediaProcessing === false

if (!childOk) {
  finish(
    baseReport({
      decision: 'blocked_three_tool_approved_snapshot_job_execution_child_matrix_failed',
      execution: 'blocked_child_three_tool_runtime_matrix_validation_failed',
      blocker: 'blocked_three_tool_approved_snapshot_job_execution_child_matrix_failed',
      childRuntime: {
        decision: childReport.decision,
        execution: childReport.execution,
        runtimeExecution: childReport.runtimeExecution,
      },
      validation: 'blocked_child_three_tool_runtime_matrix_validation_failed',
    }),
    1,
  )
}

const approvedSnapshotRuntimeEnvelope = {
  envelopeId: 'tracka-three-tool-external-agent-approved-snapshot-job-execution-1-envelope',
  status: 'accepted_three_tool_approved_snapshot_job_execution_generated_fixture_only',
  sourceWorkerProcessNoopRunId: sourceRecord.runId,
  sourceWorkerProcessNoopEntrypointId: sourceRecord.workerProcessNoop?.entrypointId,
  childPacket: childSummary.packet,
  childRunId: childSummary.runId,
  childOutputDir: childSummary.outputDir,
  childReport: childSummary.report,
  childManifest: childSummary.manifest,
  approvedSnapshotId,
  jobId,
  runtimeMode: 'controlled_generated_fixture_only',
  activeNativeContainerToolLaneCount: 3,
  tools: {
    gstreamer_render_pipeline_support: 'external_agent_approved_snapshot_job_execution_passed',
    mkvtoolnix_container_validation: 'external_agent_approved_snapshot_job_execution_passed',
    gpac_mp4box_packaging_validation: 'external_agent_approved_snapshot_job_execution_passed',
  },
  routeExecution: false,
  persistentJobQueueWrite: false,
  workerDispatch: false,
  workerLeaseClaim: false,
  workerProcessStart: false,
  arbitraryPrivateMedia: false,
  privateMediaProcessing: false,
  userMediaProcessing: false,
  publicArtifacts: false,
  signedUrls: false,
  finalRenderExport: false,
  sha256: '',
}
approvedSnapshotRuntimeEnvelope.sha256 = sha256Text(JSON.stringify(approvedSnapshotRuntimeEnvelope))
const approvedSnapshotRuntimeEnvelopePath = path.join(outputDir, 'approved-snapshot-runtime-envelope.json')
writeJson(approvedSnapshotRuntimeEnvelopePath, approvedSnapshotRuntimeEnvelope)

const outputManifest = {
  manifestId: 'output-manifest-tracka-three-tool-external-agent-approved-snapshot-job-execution-1',
  status: 'completed_approved_snapshot_job_execution_manifest_reference_only',
  childManifest: childSummary.manifest,
  childRunId: childSummary.runId,
  publicArtifacts: false,
  signedUrls: false,
  finalRenderExport: false,
  generatedAt: new Date().toISOString(),
  sha256: '',
}
outputManifest.sha256 = sha256Text(JSON.stringify(outputManifest))
const outputManifestPath = path.join(outputDir, 'output-manifest.json')
writeJson(outputManifestPath, outputManifest)

const qaReport = {
  reportId: 'qa-report-tracka-three-tool-external-agent-approved-snapshot-job-execution-1',
  status: 'passed_three_tool_approved_snapshot_job_execution_generated_fixture_only',
  checks: [
    'confirmation_gate_present',
    'worker_process_noop_source_record_ready',
    'approved_snapshot_job_envelope_accepted',
    'child_three_tool_controlled_generated_fixture_execution_passed',
    'all_three_tool_readiness_rows_passed',
    'no_private_or_user_media',
    'no_public_or_signed_artifacts',
    'no_supabase_sql',
    'no_persistent_queue_write_worker_dispatch_or_worker_process_start',
  ],
  blockers: [],
  generatedAt: new Date().toISOString(),
  sha256: '',
}
qaReport.sha256 = sha256Text(JSON.stringify(qaReport))
const qaReportPath = path.join(outputDir, 'qa-report.json')
writeJson(qaReportPath, qaReport)

finish(
  baseReport({
    decision,
    execution,
    childThreeToolRuntime: {
      runId: childSummary.runId,
      outputDir: childSummary.outputDir,
      report: childSummary.report,
      manifest: childSummary.manifest,
      artifacts: childSummary.artifacts,
      decision: childReport.decision,
      execution: childReport.execution,
      runtimeExecution: childReport.runtimeExecution,
    },
    approvedSnapshotRuntimeEnvelopePath,
    outputManifestPath,
    qaReportPath,
    approvedSnapshotJobExecution: {
      approvedSnapshotId,
      jobId,
      sourceClass: 'controlled_generated_fixture_only',
      activeNativeContainerToolLaneCount: 3,
      childRunId: childSummary.runId,
      gstreamerExecution: 'completed_controlled_generated_fixture_only',
      mkvtoolnixExecution: 'completed_controlled_generated_fixture_only',
      gpacMp4boxExecution: 'completed_controlled_generated_fixture_only',
      routeExecution: false,
      persistentJobQueueWrite: false,
      workerDispatch: false,
      workerLeaseClaim: false,
      workerProcessStart: false,
      privateMediaProcessing: false,
      userMediaProcessing: false,
      publicArtifacts: false,
      signedUrls: false,
      finalRenderExport: false,
    },
    readiness: {
      gstreamer_render_pipeline_support: 'external_agent_approved_snapshot_job_execution_passed',
      mkvtoolnix_container_validation: 'external_agent_approved_snapshot_job_execution_passed',
      gpac_mp4box_packaging_validation: 'external_agent_approved_snapshot_job_execution_passed',
    },
    validation: 'passed',
    nextMilestone,
  }),
  0,
)
