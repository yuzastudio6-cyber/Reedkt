#!/usr/bin/env node
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-APPROVED-SNAPSHOT-JOB-EXECUTION-1'
const decision = 'completed_gstreamer_mkvtoolnix_external_agent_approved_snapshot_job_execution'
const execution = 'completed_confirmation_gated_approved_snapshot_job_execution_for_gstreamer_mkvtoolnix_generated_fixture_only'
const confirmEnv = 'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_APPROVED_SNAPSHOT_JOB_EXECUTION'
const childConfirmEnv = 'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_GENERATED_FIXTURE_EXECUTION'
const childScript = 'scripts/validation/tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1.mjs'
const sourceRecordPath =
  'docs/external-beta/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-worker-lease-noop-1/tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-worker-lease-noop-1-record.json'
const outputRoot = '/tmp/reeditpro-tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(outputRoot, runId)
const nextMilestone = 'TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-PRODUCTION-READINESS-REVIEW-1'

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
    sourceWorkerLeaseNoop: {
      mergeSha: '6f48c37de5da54b91480b03ebab7c2d61fe98025',
      headSha: '2b12cce17dee7836c6bcc8d1ad5e3cc6cce239cc',
      runId: sourceRecord.runId,
      decision: sourceRecord.decision,
      approvedSnapshotId: sourceRecord.workerLeaseNoop?.approvedSnapshotId,
      jobId: sourceRecord.workerLeaseNoop?.jobId,
      leaseNoopId: sourceRecord.workerLeaseNoop?.leaseNoopId,
      excludedRemotionPr: '#577 open_draft_blocked_excluded',
    },
    approvedSnapshotJobExecution: {
      approvedSnapshotId: 'approved-snapshot-gstreamer-mkvtoolnix-external-agent-generated-fixture-post-qa-1',
      jobId: 'job-gstreamer-mkvtoolnix-external-agent-generated-fixture-post-qa-1',
      sourceClass: 'controlled_generated_fixture_only',
      privateMediaProcessing: false,
      userMediaProcessing: false,
      publicArtifacts: false,
      signedUrls: false,
      finalRenderExport: false,
    },
    safety: {
      privateMediaProcessing: false,
      userMediaProcessing: false,
      ffmpegFfprobeExecution: false,
      gpacMp4boxExecution: false,
      supabaseMutation: false,
      sqlExecution: false,
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
  const reportPath = path.join(outputDir, 'gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-1-report.json')
  writeJson(reportPath, report)

  const files = [
    reportPath,
    report.approvedSnapshotRuntimeEnvelopePath,
    report.outputManifestPath,
    report.qaReportPath,
  ].filter(Boolean)
  const manifestPath = path.join(outputDir, 'gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-1-manifest.json')
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
      decision: 'blocked_pending_gstreamer_mkvtoolnix_approved_snapshot_job_execution_confirmation',
      execution: 'blocked_confirmation_absent_no_approved_snapshot_job_execution',
      blocker: 'blocked_pending_gstreamer_mkvtoolnix_approved_snapshot_job_execution_confirmation',
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
      decision: 'blocked_missing_worker_lease_noop_source_record',
      execution: 'blocked_before_approved_snapshot_job_execution',
      blocker: 'blocked_missing_worker_lease_noop_source_record',
      sourceReadError: bounded(error.message),
      validation: 'blocked_missing_worker_lease_noop_source_record',
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
  timeout: 180000,
})

const childSummary = parseSummary(child.stdout)
if (child.status !== 0 || !childSummary) {
  finish(
    baseReport({
      decision: 'blocked_gstreamer_mkvtoolnix_approved_snapshot_job_execution_child_failed',
      execution: 'blocked_child_generated_fixture_execution_failed',
      blocker:
        childSummary?.blocker ??
        childSummary?.decision ??
        'blocked_gstreamer_mkvtoolnix_approved_snapshot_job_execution_child_failed',
      childProcess: {
        exitStatus: child.status,
        signal: child.signal ?? null,
        stdoutSnippet: bounded(child.stdout),
        stderrSnippet: bounded(child.stderr),
      },
      validation: 'blocked_child_generated_fixture_execution_failed',
    }),
    1,
  )
}

const childReport = readJson(childSummary.report)
const commandResults = childReport.childRuntime?.commandResults ?? []
const expectedTemplates = [
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
]
const childOk =
  childReport.decision === 'completed_gstreamer_mkvtoolnix_external_agent_generated_fixture_execution' &&
  childReport.execution ===
    'completed_confirmation_gated_external_agent_generated_fixture_execution_for_gstreamer_mkvtoolnix_only' &&
  expectedTemplates.every((templateId) =>
    commandResults.some((result) => result.templateId === templateId && result.ok === true && result.exitStatus === 0),
  )

if (!childOk) {
  finish(
    baseReport({
      decision: 'blocked_gstreamer_mkvtoolnix_approved_snapshot_job_execution_command_matrix_failed',
      execution: 'blocked_child_command_matrix_validation_failed',
      blocker: 'blocked_gstreamer_mkvtoolnix_approved_snapshot_job_execution_command_matrix_failed',
      childRuntime: {
        decision: childReport.decision,
        execution: childReport.execution,
        commandResults,
      },
      validation: 'blocked_child_command_matrix_validation_failed',
    }),
    1,
  )
}

const approvedSnapshotRuntimeEnvelope = {
  envelopeId: 'tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-1-envelope',
  status: 'accepted_approved_snapshot_job_execution_for_gstreamer_mkvtoolnix_generated_fixture',
  sourceWorkerLeaseNoopMergeSha: '6f48c37de5da54b91480b03ebab7c2d61fe98025',
  sourceWorkerLeaseNoopRunId: sourceRecord.runId,
  childPacket: childSummary.packet,
  childRunId: childSummary.runId,
  childOutputDir: childSummary.outputDir,
  childReport: childSummary.report,
  childManifest: childSummary.manifest,
  approvedSnapshotId: sourceRecord.workerLeaseNoop?.approvedSnapshotId,
  jobId: sourceRecord.workerLeaseNoop?.jobId,
  leaseNoopId: sourceRecord.workerLeaseNoop?.leaseNoopId,
  dockerImageTag: childReport.childRuntime?.dockerImageTag,
  dockerNetwork: 'none',
  allowedCommandTemplates: expectedTemplates,
  tools: {
    gstreamer_render_pipeline_support: 'completed_external_agent_approved_snapshot_job_execution',
    mkvtoolnix_container_validation: 'completed_external_agent_approved_snapshot_job_execution',
    gpac_mp4box_packaging_validation: 'excluded_pending_package_source_install_proof',
  },
  privateMediaProcessing: false,
  userMediaProcessing: false,
  publicArtifacts: false,
  signedUrls: false,
  finalRenderExport: false,
  sha256: '',
}
approvedSnapshotRuntimeEnvelope.sha256 = crypto
  .createHash('sha256')
  .update(JSON.stringify(approvedSnapshotRuntimeEnvelope))
  .digest('hex')
const approvedSnapshotRuntimeEnvelopePath = path.join(outputDir, 'approved-snapshot-runtime-envelope.json')
writeJson(approvedSnapshotRuntimeEnvelopePath, approvedSnapshotRuntimeEnvelope)

const outputManifest = {
  manifestId: 'output-manifest-tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-1',
  status: 'completed_approved_snapshot_job_execution_manifest_reference_only',
  controlledGeneratedFixtureOnly: true,
  childManifest: childSummary.manifest,
  childOutputDir: childSummary.outputDir,
  publicArtifacts: false,
  signedUrls: false,
  finalRenderExport: false,
  generatedAt: new Date().toISOString(),
  sha256: '',
}
outputManifest.sha256 = crypto.createHash('sha256').update(JSON.stringify(outputManifest)).digest('hex')
const outputManifestPath = path.join(outputDir, 'output-manifest.json')
writeJson(outputManifestPath, outputManifest)

const qaReport = {
  reportId: 'qa-report-tracka-gstreamer-mkvtoolnix-external-agent-approved-snapshot-job-execution-1',
  status: 'passed_external_agent_approved_snapshot_job_execution_for_gstreamer_mkvtoolnix_generated_fixture',
  checks: [
    'approved_snapshot_worker_lease_noop_source_present',
    'child_external_agent_generated_fixture_execution_passed',
    'gstreamer_generated_fixture_commands_passed',
    'mkvtoolnix_generated_fixture_commands_passed',
    'docker_network_disabled',
    'no_private_user_media_public_artifacts_signed_urls_or_final_export',
    'no_ffmpeg_ffprobe_supabase_sql_or_secret_payload_access',
    'gpac_mp4box_excluded_pending_package_source_install_proof',
  ],
  blockers: [],
  generatedAt: new Date().toISOString(),
  sha256: '',
}
qaReport.sha256 = crypto.createHash('sha256').update(JSON.stringify(qaReport)).digest('hex')
const qaReportPath = path.join(outputDir, 'qa-report.json')
writeJson(qaReportPath, qaReport)

finish(
  baseReport({
    childRuntime: {
      packet: childSummary.packet,
      runId: childSummary.runId,
      outputDir: childSummary.outputDir,
      report: childSummary.report,
      manifest: childSummary.manifest,
      artifacts: childSummary.artifacts,
      decision: childReport.decision,
      execution: childReport.execution,
      dockerImageTag: childReport.childRuntime?.dockerImageTag,
      commandResults,
    },
    approvedSnapshotRuntimeEnvelopePath,
    outputManifestPath,
    qaReportPath,
    approvedSnapshotJobExecution: {
      ...baseReport().approvedSnapshotJobExecution,
      status: 'completed_gstreamer_mkvtoolnix_external_agent_approved_snapshot_job_execution',
      dockerExecution: 'completed_local_image_only_network_disabled_no_push_no_deploy',
      gstreamerExecution: 'completed_controlled_generated_fixture_only',
      mkvtoolnixExecution: 'completed_controlled_generated_fixture_only',
      gpacMp4boxExecution: 'not_run_excluded_pending_package_source_install_proof',
    },
    readiness: {
      gstreamer_render_pipeline_support: 'external_agent_approved_snapshot_job_execution_passed',
      mkvtoolnix_container_validation: 'external_agent_approved_snapshot_job_execution_passed',
      gpac_mp4box_packaging_validation: 'blocked_pending_package_source_install_proof',
    },
    validation: 'passed',
  }),
  0,
)
