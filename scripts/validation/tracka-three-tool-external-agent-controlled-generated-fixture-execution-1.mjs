#!/usr/bin/env node
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-CONTROLLED-GENERATED-FIXTURE-EXECUTION-1'
const confirmEnv = 'REEDITPRO_CONFIRM_TRACKA_THREE_TOOL_EXTERNAL_AGENT_CONTROLLED_GENERATED_FIXTURE_EXECUTION'
const outputRoot = '/tmp/reeditpro-tracka-three-tool-external-agent-controlled-generated-fixture-execution-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(outputRoot, runId)
const handoffRecordPath =
  'docs/external-beta/tracka-three-tool-external-agent-controlled-generated-fixture-handoff-1/tracka-three-tool-external-agent-controlled-generated-fixture-handoff-1-record.json'
const gstreamerMkvtoolnixScript =
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2.mjs'
const gstreamerMkvtoolnixConfirmEnv =
  'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_POST_DISPATCH_WORKER_RUNTIME_EXECUTION'
const gpacMp4boxScript = 'scripts/validation/tracka-gpac-mp4box-generated-fixture-runtime-execution-1.mjs'
const gpacMp4boxConfirmEnv = 'REEDITPRO_CONFIRM_TRACKA_GPAC_MP4BOX_GENERATED_FIXTURE_RUNTIME_EXECUTION'

const decision = 'completed_three_tool_external_agent_controlled_generated_fixture_execution'
const execution = 'completed_confirmation_gated_three_tool_controlled_generated_fixture_runtime_execution'
const blockedConfirmation = 'blocked_pending_three_tool_external_agent_controlled_generated_fixture_execution_confirmation'
const nextMilestone = 'TRACKA-THREE-TOOL-EXTERNAL-AGENT-CONTROLLED-GENERATED-FIXTURE-QA-ROLLUP-1'

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
  externalBetaExpansion: false,
  paidProductionUnlock: false,
  productionUnlock: false,
  finalRenderExport: false,
  dependencyMutation: false,
  packageLockMutation: false,
  dockerfileInstallSourceChange: false,
  requirementsInstallSourceChange: false,
  broadServiceRoleHandler: false,
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

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
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

function parseChildSummary(child, label) {
  try {
    return JSON.parse(child.stdout)
  } catch (error) {
    return {
      parseError: true,
      label,
      error: bounded(error.message),
      stdoutSnippet: bounded(child.stdout),
      stderrSnippet: bounded(child.stderr),
    }
  }
}

function loadHandoffRecord() {
  return readJson(handoffRecordPath)
}

function baseReport(overrides = {}) {
  const handoff = fs.existsSync(handoffRecordPath) ? loadHandoffRecord() : {}
  return {
    packet,
    runId,
    outputDir,
    confirmationGate: {
      env: `${confirmEnv}=true`,
      observed: process.env[confirmEnv] === 'true' ? 'present_true' : 'absent_or_not_true',
    },
    sourceChain: {
      threeToolHandoffDecision: handoff.decision,
      threeToolHandoffExecution: handoff.execution,
      threeToolRuntimeReadyRollupMergeSha: handoff.sourceChain?.threeToolRuntimeReadyRollupMergeSha,
      gstreamerMkvtoolnixConfirmedRuntimeRunId: handoff.sourceChain?.gstreamerMkvtoolnixConfirmedRuntimeRunId,
      gpacMp4boxConfirmedRuntimeRunId: handoff.sourceChain?.gpacMp4boxConfirmedRuntimeRunId,
      excludedRemotionPr: '#577 open_draft_blocked_excluded',
    },
    childRunners: {
      gstreamerMkvtoolnix: {
        script: gstreamerMkvtoolnixScript,
        confirmationGate: `${gstreamerMkvtoolnixConfirmEnv}=true`,
      },
      gpacMp4box: {
        script: gpacMp4boxScript,
        confirmationGate: `${gpacMp4boxConfirmEnv}=true`,
      },
    },
    safety: {
      ...baseSafety,
      dockerExecution: false,
      gstreamerExecution: false,
      mkvtoolnixExecution: false,
      gpacMp4boxExecution: false,
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
  const reportPath = path.join(outputDir, 'three-tool-external-agent-controlled-generated-fixture-execution-1-report.json')
  writeJson(reportPath, report)

  const files = [
    reportPath,
    report.threeToolRuntimeEnvelopePath,
    report.outputManifestPath,
    report.qaReportPath,
  ].filter(Boolean)

  const manifestPath = path.join(outputDir, 'three-tool-external-agent-controlled-generated-fixture-execution-1-manifest.json')
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
  }, null, 2))
  process.exit(exitCode)
}

try {
  loadHandoffRecord()
} catch (error) {
  finish(
    {
      packet,
      runId,
      outputDir,
      decision: 'blocked_missing_three_tool_handoff_source_record',
      execution: 'blocked_before_three_tool_generated_fixture_execution',
      blocker: 'blocked_missing_three_tool_handoff_source_record',
      sourceReadError: bounded(error.message),
      safety: {
        ...baseSafety,
        dockerExecution: false,
        gstreamerExecution: false,
        mkvtoolnixExecution: false,
        gpacMp4boxExecution: false,
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
      execution: 'blocked_confirmation_absent_no_three_tool_runtime_execution',
      blocker: blockedConfirmation,
      runtimeExecution: {
        status: 'not_run_confirmation_absent',
        gstreamerExecution: 'not_run_confirmation_absent',
        mkvtoolnixExecution: 'not_run_confirmation_absent',
        gpacMp4boxExecution: 'not_run_confirmation_absent',
        dockerExecution: 'not_run_confirmation_absent',
      },
      validation: 'blocked_confirmation_absent',
      nextMilestone: packet,
    }),
    2,
  )
}

const gstreamerMkvtoolnixProcess = spawnSync('node', [gstreamerMkvtoolnixScript], {
  encoding: 'utf8',
  env: {
    ...process.env,
    [gstreamerMkvtoolnixConfirmEnv]: 'true',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
  timeout: 180000,
})

if (gstreamerMkvtoolnixProcess.status !== 0) {
  finish(
    baseReport({
      decision: 'blocked_gstreamer_mkvtoolnix_generated_fixture_runtime_execution_failed',
      execution: 'blocked_before_three_tool_packet_acceptance',
      blocker: 'blocked_gstreamer_mkvtoolnix_generated_fixture_runtime_execution_failed',
      gstreamerMkvtoolnixProcess: {
        exitStatus: gstreamerMkvtoolnixProcess.status,
        signal: gstreamerMkvtoolnixProcess.signal ?? null,
        stdoutSnippet: bounded(gstreamerMkvtoolnixProcess.stdout),
        stderrSnippet: bounded(gstreamerMkvtoolnixProcess.stderr),
      },
      safety: {
        ...baseSafety,
        dockerExecution: 'attempted_local_image_only_network_disabled_no_push_no_deploy',
        gstreamerExecution: 'blocked_or_incomplete_controlled_generated_fixture_only',
        mkvtoolnixExecution: 'blocked_or_incomplete_controlled_generated_fixture_only',
        gpacMp4boxExecution: false,
        mediaProcessing: 'blocked_or_incomplete_controlled_generated_fixture_only',
      },
      validation: 'blocked_gstreamer_mkvtoolnix_generated_fixture_runtime_execution_failed',
      nextMilestone: packet,
    }),
    1,
  )
}

const gstreamerMkvtoolnixSummary = parseChildSummary(gstreamerMkvtoolnixProcess, 'gstreamer_mkvtoolnix')
if (gstreamerMkvtoolnixSummary.parseError) {
  finish(
    baseReport({
      decision: 'blocked_gstreamer_mkvtoolnix_summary_parse_failed',
      execution: 'blocked_before_three_tool_packet_acceptance',
      blocker: 'blocked_gstreamer_mkvtoolnix_summary_parse_failed',
      gstreamerMkvtoolnixSummary,
      validation: 'blocked_gstreamer_mkvtoolnix_summary_parse_failed',
      nextMilestone: packet,
    }),
    1,
  )
}

const gpacMp4boxProcess = spawnSync('node', [gpacMp4boxScript], {
  encoding: 'utf8',
  env: {
    ...process.env,
    [gpacMp4boxConfirmEnv]: 'true',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
  timeout: 120000,
})

if (gpacMp4boxProcess.status !== 0) {
  finish(
    baseReport({
      decision: 'blocked_gpac_mp4box_generated_fixture_runtime_execution_failed',
      execution: 'blocked_before_three_tool_packet_acceptance',
      blocker: 'blocked_gpac_mp4box_generated_fixture_runtime_execution_failed',
      gstreamerMkvtoolnix: gstreamerMkvtoolnixSummary,
      gpacMp4boxProcess: {
        exitStatus: gpacMp4boxProcess.status,
        signal: gpacMp4boxProcess.signal ?? null,
        stdoutSnippet: bounded(gpacMp4boxProcess.stdout),
        stderrSnippet: bounded(gpacMp4boxProcess.stderr),
      },
      safety: {
        ...baseSafety,
        dockerExecution: 'attempted_local_image_only_network_disabled_no_push_no_deploy',
        gstreamerExecution: 'completed_controlled_generated_fixture_only',
        mkvtoolnixExecution: 'completed_controlled_generated_fixture_only',
        gpacMp4boxExecution: 'blocked_or_incomplete_controlled_generated_fixture_only',
        mediaProcessing: 'blocked_or_incomplete_controlled_generated_fixture_only',
      },
      validation: 'blocked_gpac_mp4box_generated_fixture_runtime_execution_failed',
      nextMilestone: packet,
    }),
    1,
  )
}

const gpacMp4boxSummary = parseChildSummary(gpacMp4boxProcess, 'gpac_mp4box')
if (gpacMp4boxSummary.parseError) {
  finish(
    baseReport({
      decision: 'blocked_gpac_mp4box_summary_parse_failed',
      execution: 'blocked_before_three_tool_packet_acceptance',
      blocker: 'blocked_gpac_mp4box_summary_parse_failed',
      gstreamerMkvtoolnix: gstreamerMkvtoolnixSummary,
      gpacMp4boxSummary,
      validation: 'blocked_gpac_mp4box_summary_parse_failed',
      nextMilestone: packet,
    }),
    1,
  )
}

const gstreamerMkvtoolnixReport = readJson(gstreamerMkvtoolnixSummary.report)
const gpacMp4boxReport = readJson(gpacMp4boxSummary.report)
const gstreamerMkvtoolnixOk =
  gstreamerMkvtoolnixReport.decision ===
    'completed_gstreamer_mkvtoolnix_post_dispatch_worker_runtime_execution_packet_generated_fixture_only' &&
  gstreamerMkvtoolnixReport.execution ===
    'completed_confirmation_gated_post_dispatch_worker_runtime_execution_packet_generated_fixture_only_no_route_or_worker_dispatch' &&
  gstreamerMkvtoolnixReport.guardedRuntime?.decision ===
    'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_controlled_generated_fixture' &&
  gstreamerMkvtoolnixReport.postDispatchRuntimePacket?.dockerNetwork === 'none'
const gpacMp4boxOk =
  gpacMp4boxReport.decision === 'completed_gpac_mp4box_generated_fixture_runtime_execution' &&
  gpacMp4boxReport.execution ===
    'completed_confirmation_gated_local_render_worker_runtime_execution_generated_fixture_only' &&
  gpacMp4boxReport.runtimeExecution?.dockerNetwork === 'none'

if (!gstreamerMkvtoolnixOk || !gpacMp4boxOk) {
  finish(
    baseReport({
      decision: 'blocked_three_tool_child_runtime_matrix_validation_failed',
      execution: 'blocked_three_tool_child_runtime_matrix_validation_failed',
      blocker: 'blocked_three_tool_child_runtime_matrix_validation_failed',
      gstreamerMkvtoolnix: {
        ok: gstreamerMkvtoolnixOk,
        decision: gstreamerMkvtoolnixReport.decision,
        execution: gstreamerMkvtoolnixReport.execution,
        guardedRuntimeDecision: gstreamerMkvtoolnixReport.guardedRuntime?.decision,
      },
      gpacMp4box: {
        ok: gpacMp4boxOk,
        decision: gpacMp4boxReport.decision,
        execution: gpacMp4boxReport.execution,
      },
      validation: 'blocked_three_tool_child_runtime_matrix_validation_failed',
      nextMilestone: packet,
    }),
    1,
  )
}

const threeToolRuntimeEnvelope = {
  envelopeId: 'three-tool-external-agent-controlled-generated-fixture-execution-1-envelope',
  status: 'accepted_three_tool_external_agent_controlled_generated_fixture_execution',
  runtimeExecutionMode: 'controlled_generated_fixture_runtime_execution',
  fixtureScope: 'generated_fakesrc_videotestsrc_srt_mkv_mp4_fixtures_only',
  childRuntimeReferences: {
    gstreamerMkvtoolnix: {
      packet: gstreamerMkvtoolnixSummary.packet,
      runId: gstreamerMkvtoolnixSummary.runId,
      outputDir: gstreamerMkvtoolnixSummary.outputDir,
      report: gstreamerMkvtoolnixSummary.report,
      manifest: gstreamerMkvtoolnixSummary.manifest,
      guardedRuntimeRunId: gstreamerMkvtoolnixReport.guardedRuntime?.runId,
      guardedRuntimeOutputDir: gstreamerMkvtoolnixReport.guardedRuntime?.outputDir,
    },
    gpacMp4box: {
      packet: gpacMp4boxSummary.packet,
      runId: gpacMp4boxSummary.runId,
      outputDir: gpacMp4boxSummary.outputDir,
      report: gpacMp4boxSummary.report,
      manifest: gpacMp4boxSummary.manifest,
    },
  },
  tools: {
    gstreamer_render_pipeline_support: 'completed_controlled_generated_fixture_runtime_execution',
    mkvtoolnix_container_validation: 'completed_controlled_generated_fixture_runtime_execution',
    gpac_mp4box_packaging_validation: 'completed_controlled_generated_fixture_runtime_execution',
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
threeToolRuntimeEnvelope.sha256 = sha256Text(JSON.stringify(threeToolRuntimeEnvelope))
const threeToolRuntimeEnvelopePath = path.join(outputDir, 'three-tool-runtime-envelope.json')
writeJson(threeToolRuntimeEnvelopePath, threeToolRuntimeEnvelope)

const outputManifest = {
  manifestId: 'output-manifest-three-tool-external-agent-controlled-generated-fixture-execution-1',
  status: 'completed_three_tool_controlled_generated_fixture_manifest_reference_only',
  controlledGeneratedFixtureOnly: true,
  childManifests: [
    {
      toolGroup: 'gstreamer_mkvtoolnix',
      runId: gstreamerMkvtoolnixSummary.runId,
      manifest: gstreamerMkvtoolnixSummary.manifest,
    },
    {
      toolGroup: 'gpac_mp4box',
      runId: gpacMp4boxSummary.runId,
      manifest: gpacMp4boxSummary.manifest,
    },
  ],
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
  reportId: 'qa-report-three-tool-external-agent-controlled-generated-fixture-execution-1',
  status: 'passed_three_tool_controlled_generated_fixture_runtime_execution',
  checks: [
    'combined_confirmation_gate_present',
    'gstreamer_mkvtoolnix_child_runtime_packet_passed',
    'gpac_mp4box_child_runtime_packet_passed',
    'docker_network_disabled_in_child_runners',
    'allowed_child_command_templates_only',
    'generated_fixture_scope_only',
    'no_route_execution_worker_dispatch_worker_process_or_persistent_queue_write',
    'no_private_user_media_public_artifacts_or_final_export',
    'no_ffmpeg_ffprobe_supabase_sql_or_secret_payload_access',
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
    gstreamerMkvtoolnix: {
      runId: gstreamerMkvtoolnixSummary.runId,
      outputDir: gstreamerMkvtoolnixSummary.outputDir,
      report: gstreamerMkvtoolnixSummary.report,
      manifest: gstreamerMkvtoolnixSummary.manifest,
      artifacts: gstreamerMkvtoolnixSummary.artifacts,
      decision: gstreamerMkvtoolnixReport.decision,
      execution: gstreamerMkvtoolnixReport.execution,
      guardedRuntimeRunId: gstreamerMkvtoolnixReport.guardedRuntime?.runId,
      guardedRuntimeOutputDir: gstreamerMkvtoolnixReport.guardedRuntime?.outputDir,
    },
    gpacMp4box: {
      runId: gpacMp4boxSummary.runId,
      outputDir: gpacMp4boxSummary.outputDir,
      report: gpacMp4boxSummary.report,
      manifest: gpacMp4boxSummary.manifest,
      artifacts: gpacMp4boxSummary.artifacts,
      decision: gpacMp4boxReport.decision,
      execution: gpacMp4boxReport.execution,
    },
    threeToolRuntimeEnvelopePath,
    outputManifestPath,
    qaReportPath,
    runtimeExecution: {
      status: 'completed_three_tool_controlled_generated_fixture_runtime_execution',
      dockerExecution: 'completed_local_images_only_network_disabled_no_push_no_deploy',
      routeExecution: 'not_run_runtime_runners_only',
      workerDispatch: 'not_run_runtime_runners_only',
      workerExecution: 'not_run_runtime_runners_only',
      gstreamerExecution: 'completed_controlled_generated_fixture_only',
      mkvtoolnixExecution: 'completed_controlled_generated_fixture_only',
      gpacMp4boxExecution: 'completed_controlled_generated_fixture_only',
      mediaProcessing: 'controlled_generated_fixture_only',
      privateMediaProcessing: false,
      userMediaProcessing: false,
    },
    readiness: {
      gstreamer_render_pipeline_support: 'ready_for_external_agent_three_tool_runtime_qa_rollup',
      mkvtoolnix_container_validation: 'ready_for_external_agent_three_tool_runtime_qa_rollup',
      gpac_mp4box_packaging_validation: 'ready_for_external_agent_three_tool_runtime_qa_rollup',
    },
    safety: {
      ...baseSafety,
      dockerExecution: 'completed_local_images_only_network_disabled_no_push_no_deploy',
      gstreamerExecution: 'completed_controlled_generated_fixture_only',
      mkvtoolnixExecution: 'completed_controlled_generated_fixture_only',
      gpacMp4boxExecution: 'completed_controlled_generated_fixture_only',
      mediaProcessing: 'controlled_generated_fixture_only',
    },
    validation: 'passed',
    nextMilestone,
  }),
  0,
)
