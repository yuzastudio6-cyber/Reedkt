#!/usr/bin/env node
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-GENERATED-FIXTURE-EXECUTION-1'
const confirmEnv = 'REEDITPRO_CONFIRM_TRACKA_GSTREAMER_MKVTOOLNIX_EXTERNAL_AGENT_GENERATED_FIXTURE_EXECUTION'
const childConfirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_POST_DISPATCH_WORKER_RUNTIME_EXECUTION'
const childScript = 'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2.mjs'
const sourceRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-worker-process-noop-invoke-1/tracka-three-tool-external-agent-worker-process-noop-invoke-1-record.json'
const outputRoot = '/tmp/reeditpro-tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(outputRoot, runId)
const decision = 'completed_gstreamer_mkvtoolnix_external_agent_generated_fixture_execution'
const execution = 'completed_confirmation_gated_external_agent_generated_fixture_execution_for_gstreamer_mkvtoolnix_only'
const blockedConfirmation = 'blocked_pending_gstreamer_mkvtoolnix_external_agent_generated_fixture_execution_confirmation'
const nextMilestone = 'TRACKA-GSTREAMER-MKVTOOLNIX-EXTERNAL-AGENT-GENERATED-FIXTURE-QA-ROLLUP-1'

const baseSafety = {
  routeExecution: false,
  realWorkerDispatch: false,
  workerProcessStarted: false,
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
  stripePaymentProcessing: false,
  deployment: false,
  internalBetaUnlock: false,
  externalBetaExpansion: false,
  paidProductionUnlock: false,
  productionUnlock: false,
  finalRenderExport: false,
  dependencyMutation: false,
  packageLockMutation: false,
  dockerfileInstallSourceChange: false,
  requirementsInstallSourceChange: false,
  gpacMp4boxExecution: false,
  broadServiceRoleHandler: false,
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
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

function loadSourceRecord() {
  return readJson(sourceRecordPath)
}

function baseReport(overrides = {}) {
  const sourceRecord = fs.existsSync(sourceRecordPath) ? loadSourceRecord() : {}
  return {
    packet,
    runId,
    outputDir,
    confirmationGate: {
      env: `${confirmEnv}=true`,
      observed: process.env[confirmEnv] === 'true' ? 'present_true' : 'absent_or_not_true',
    },
    childRunner: {
      script: childScript,
      confirmationGate: `${childConfirmEnv}=true`,
    },
    sourceChain: {
      workerProcessNoopMergeSha: '4f5d526e27973ca130d12139a586e2c2a997458f',
      workerProcessNoopDecision: sourceRecord.decision,
      workerProcessNoopExecution: sourceRecord.execution,
      workerProcessNoopRunId: sourceRecord.runId,
      excludedRemotionPr: '#577 open_draft_blocked_excluded',
      gpacMp4boxExecutionStatus: 'excluded_pending_package_source_install_proof',
    },
    safety: {
      ...baseSafety,
      dockerExecution: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
      mediaProcessing: false,
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
  const reportPath = path.join(outputDir, 'gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1-report.json')
  writeJson(reportPath, report)

  const files = [
    reportPath,
    report.externalAgentRuntimeEnvelopePath,
    report.outputManifestPath,
    report.qaReportPath,
  ].filter(Boolean)
  const manifestPath = path.join(outputDir, 'gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1-manifest.json')
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

  console.log(
    JSON.stringify(
      {
        packet,
        decision: report.decision,
        execution: report.execution,
        blocker: report.blocker,
        runId,
        outputDir,
        report: reportPath,
        manifest: manifestPath,
        artifacts: manifest.artifacts,
      },
      null,
      2,
    ),
  )
  process.exit(exitCode)
}

try {
  loadSourceRecord()
} catch (error) {
  finish(
    {
      packet,
      runId,
      outputDir,
      decision: 'blocked_missing_worker_process_noop_source_record',
      execution: 'blocked_before_external_agent_generated_fixture_execution',
      blocker: 'blocked_missing_worker_process_noop_source_record',
      sourceReadError: bounded(error.message),
      safety: {
        ...baseSafety,
        dockerExecution: false,
        gstreamerExecution: false,
        mkvtoolnixExecution: false,
        mediaProcessing: false,
      },
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
      nextMilestone: packet,
    },
    1,
  )
}

if (process.env[confirmEnv] !== 'true') {
  finish(
    baseReport({
      decision: blockedConfirmation,
      execution: 'blocked_confirmation_absent_no_external_agent_generated_fixture_execution',
      blocker: blockedConfirmation,
      runtimeExecution: {
        status: 'not_run_confirmation_absent',
        dockerExecution: 'not_run_confirmation_absent',
        gstreamerExecution: 'not_run_confirmation_absent',
        mkvtoolnixExecution: 'not_run_confirmation_absent',
        gpacMp4boxExecution: 'not_run_excluded_pending_package_source_install_proof',
      },
      validation: 'blocked_confirmation_absent',
      nextMilestone: packet,
    }),
    2,
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
if (child.status !== 0) {
  finish(
    baseReport({
      decision: 'blocked_gstreamer_mkvtoolnix_external_agent_generated_fixture_execution_failed',
      execution: 'blocked_child_generated_fixture_runtime_execution_failed',
      blocker:
        childSummary?.blocker ??
        childSummary?.decision ??
        'blocked_gstreamer_mkvtoolnix_external_agent_generated_fixture_execution_failed',
      childProcess: {
        exitStatus: child.status,
        signal: child.signal ?? null,
        stdoutSnippet: bounded(child.stdout),
        stderrSnippet: bounded(child.stderr),
      },
      childSummary,
      safety: {
        ...baseSafety,
        dockerExecution: 'attempted_local_image_only_network_disabled_no_push_no_deploy',
        gstreamerExecution: 'blocked_or_incomplete_controlled_generated_fixture_only',
        mkvtoolnixExecution: 'blocked_or_incomplete_controlled_generated_fixture_only',
        mediaProcessing: 'blocked_or_incomplete_controlled_generated_fixture_only',
      },
      validation: 'blocked_gstreamer_mkvtoolnix_external_agent_generated_fixture_execution_failed',
      nextMilestone: packet,
    }),
    1,
  )
}

if (!childSummary) {
  finish(
    baseReport({
      decision: 'blocked_gstreamer_mkvtoolnix_external_agent_generated_fixture_summary_parse_failed',
      execution: 'blocked_child_generated_fixture_summary_parse_failed',
      blocker: 'blocked_gstreamer_mkvtoolnix_external_agent_generated_fixture_summary_parse_failed',
      childProcess: {
        stdoutSnippet: bounded(child.stdout),
        stderrSnippet: bounded(child.stderr),
      },
      validation: 'blocked_gstreamer_mkvtoolnix_external_agent_generated_fixture_summary_parse_failed',
      nextMilestone: packet,
    }),
    1,
  )
}

const childReport = readJson(childSummary.report)
const commandResults = childReport.guardedRuntime?.commandResults ?? []
const expectedTemplates = [
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
]
const childOk =
  childReport.decision ===
    'completed_gstreamer_mkvtoolnix_post_dispatch_worker_runtime_execution_packet_generated_fixture_only' &&
  childReport.execution ===
    'completed_confirmation_gated_post_dispatch_worker_runtime_execution_packet_generated_fixture_only_no_route_or_worker_dispatch' &&
  childReport.guardedRuntime?.decision ===
    'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_controlled_generated_fixture' &&
  childReport.postDispatchRuntimePacket?.dockerNetwork === 'none' &&
  expectedTemplates.every((template) =>
    commandResults.some((result) => result.templateId === template && result.ok === true && result.exitStatus === 0),
  )

if (!childOk) {
  finish(
    baseReport({
      decision: 'blocked_gstreamer_mkvtoolnix_external_agent_generated_fixture_child_matrix_failed',
      execution: 'blocked_child_runtime_command_matrix_validation_failed',
      blocker: 'blocked_gstreamer_mkvtoolnix_external_agent_generated_fixture_child_matrix_failed',
      childRuntime: {
        decision: childReport.decision,
        execution: childReport.execution,
        guardedRuntimeDecision: childReport.guardedRuntime?.decision,
        dockerNetwork: childReport.postDispatchRuntimePacket?.dockerNetwork,
        commandResults,
      },
      validation: 'blocked_gstreamer_mkvtoolnix_external_agent_generated_fixture_child_matrix_failed',
      nextMilestone: packet,
    }),
    1,
  )
}

const externalAgentRuntimeEnvelope = {
  envelopeId: 'tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1-envelope',
  status: 'accepted_external_agent_generated_fixture_execution_for_gstreamer_mkvtoolnix',
  sourceWorkerProcessNoopMergeSha: '4f5d526e27973ca130d12139a586e2c2a997458f',
  childPacket: childSummary.packet,
  childRunId: childSummary.runId,
  childOutputDir: childSummary.outputDir,
  childReport: childSummary.report,
  childManifest: childSummary.manifest,
  guardedRuntimeRunId: childReport.guardedRuntime?.runId,
  guardedRuntimeOutputDir: childReport.guardedRuntime?.outputDir,
  dockerImageTag: childReport.guardedRuntime?.imageTag,
  dockerNetwork: 'none',
  allowedCommandTemplates: expectedTemplates,
  tools: {
    gstreamer_render_pipeline_support: 'completed_external_agent_generated_fixture_execution',
    mkvtoolnix_container_validation: 'completed_external_agent_generated_fixture_execution',
    gpac_mp4box_packaging_validation: 'excluded_pending_package_source_install_proof',
  },
  routeExecution: false,
  realWorkerDispatch: false,
  workerProcessStarted: false,
  workerExecution: false,
  workerLeaseClaim: false,
  persistentJobQueueWrite: false,
  rawCallerCommandsAccepted: false,
  arbitraryPrivateMedia: false,
  publicArtifacts: false,
  signedUrls: false,
  finalRenderExport: false,
  sha256: '',
}
externalAgentRuntimeEnvelope.sha256 = sha256Text(JSON.stringify(externalAgentRuntimeEnvelope))
const externalAgentRuntimeEnvelopePath = path.join(outputDir, 'external-agent-runtime-envelope.json')
writeJson(externalAgentRuntimeEnvelopePath, externalAgentRuntimeEnvelope)

const outputManifest = {
  manifestId: 'output-manifest-tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1',
  status: 'completed_external_agent_generated_fixture_manifest_reference_only',
  controlledGeneratedFixtureOnly: true,
  childManifest: childSummary.manifest,
  guardedRuntimeOutputDir: childReport.guardedRuntime?.outputDir,
  routeExecution: false,
  realWorkerDispatch: false,
  workerExecution: false,
  workerLeaseClaim: false,
  persistentQueueWrite: false,
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
  reportId: 'qa-report-tracka-gstreamer-mkvtoolnix-external-agent-generated-fixture-execution-1',
  status: 'passed_external_agent_generated_fixture_execution_for_gstreamer_mkvtoolnix',
  checks: [
    'external_agent_confirmation_gate_present',
    'worker_process_noop_source_present',
    'child_post_dispatch_generated_fixture_packet_passed',
    'gstreamer_fakesrc_fakesink_passed',
    'gstreamer_videotestsrc_fakesink_passed',
    'mkvmerge_generated_subtitle_only_package_passed',
    'mkvmerge_identify_generated_subtitle_only_passed',
    'docker_network_disabled',
    'no_route_execution_worker_dispatch_worker_process_or_persistent_queue_write',
    'no_private_user_media_public_artifacts_signed_urls_or_final_export',
    'no_ffmpeg_ffprobe_supabase_sql_or_secret_payload_access',
    'gpac_mp4box_excluded_pending_package_source_install_proof',
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
    childRuntime: {
      packet: childSummary.packet,
      runId: childSummary.runId,
      outputDir: childSummary.outputDir,
      report: childSummary.report,
      manifest: childSummary.manifest,
      artifacts: childSummary.artifacts,
      decision: childReport.decision,
      execution: childReport.execution,
      guardedRuntimeRunId: childReport.guardedRuntime?.runId,
      guardedRuntimeOutputDir: childReport.guardedRuntime?.outputDir,
      dockerImageTag: childReport.guardedRuntime?.imageTag,
      commandResults,
    },
    externalAgentRuntimeEnvelopePath,
    outputManifestPath,
    qaReportPath,
    runtimeExecution: {
      status: 'completed_gstreamer_mkvtoolnix_external_agent_generated_fixture_execution',
      dockerExecution: 'completed_local_image_only_network_disabled_no_push_no_deploy',
      routeExecution: 'not_run_runtime_runner_only',
      workerDispatch: 'not_run_runtime_runner_only',
      workerProcessStarted: 'not_run_runtime_runner_only',
      workerExecution: 'not_run_runtime_runner_only',
      workerLeaseClaim: 'not_run_runtime_runner_only',
      persistentJobQueueWrite: 'not_run_runtime_runner_only',
      gstreamerExecution: 'completed_controlled_generated_fixture_only',
      mkvtoolnixExecution: 'completed_controlled_generated_fixture_only',
      gpacMp4boxExecution: 'not_run_excluded_pending_package_source_install_proof',
      mediaProcessing: 'controlled_generated_fixture_only',
      privateMediaProcessing: false,
      userMediaProcessing: false,
    },
    readiness: {
      gstreamer: 'ready_for_external_agent_generated_fixture_qa_rollup',
      mkvtoolnix: 'ready_for_external_agent_generated_fixture_qa_rollup',
      gpacMp4box: 'blocked_pending_package_source_install_proof',
    },
    safety: {
      ...baseSafety,
      dockerExecution: 'completed_local_image_only_network_disabled_no_push_no_deploy',
      gstreamerExecution: 'completed_controlled_generated_fixture_only',
      mkvtoolnixExecution: 'completed_controlled_generated_fixture_only',
      mediaProcessing: 'controlled_generated_fixture_only',
    },
    validation: 'passed',
  }),
  0,
)
