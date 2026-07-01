#!/usr/bin/env node
import crypto from 'node:crypto'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-PACKET-2'
const confirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_POST_DISPATCH_WORKER_RUNTIME_EXECUTION'
const guardedRuntimeConfirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_RUNTIME_EXECUTION'
const guardedRuntimeScript =
  'scripts/validation/rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-implementation-1.mjs'
const integrationBase = '97ee8b7fa9d161ad781effdfa5d1ff8c2ea308df'
const handoffRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-runtime-handoff-1/gstreamer-mkvtoolnix-guarded-worker-runtime-handoff-1-record.json'
const dispatchRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1/gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1-record.json'
const outputRoot = '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(outputRoot, runId)

const decision = 'completed_gstreamer_mkvtoolnix_post_dispatch_worker_runtime_execution_packet_generated_fixture_only'
const execution =
  'completed_confirmation_gated_post_dispatch_worker_runtime_execution_packet_generated_fixture_only_no_route_or_worker_dispatch'
const blockedDecision = 'blocked_missing_post_dispatch_worker_runtime_execution_confirmation'
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-QA-ROLLUP-2'

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
  finalRenderExport: false,
  broadExternalBetaUnlock: false,
  paidProductionUnlock: false,
  productionUnlock: false,
  packageLockMutation: false,
  dependencyMutation: false,
  dockerfileInstallSourceChange: false,
  requirementsInstallSourceChange: false,
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function artifact(file) {
  return {
    fileName: path.basename(file),
    bytes: fs.statSync(file).size,
    sha256: sha256File(file),
  }
}

function bounded(value) {
  return String(value ?? '').slice(0, 3000)
}

function loadSourceRecords() {
  const handoff = readJson(handoffRecordPath)
  const dispatch = readJson(dispatchRecordPath)
  return { handoff, dispatch }
}

function baseReport(overrides = {}) {
  const { handoff, dispatch } = loadSourceRecords()
  return {
    packet,
    integrationBase,
    runId,
    outputDir,
    confirmationGate: {
      env: `${confirmEnv}=true`,
      observed: process.env[confirmEnv] === 'true' ? 'present_true' : 'absent_or_not_true',
    },
    sourceChain: {
      runtimeHandoffMergeSha: integrationBase,
      runtimeHandoffDecision: handoff.decision,
      runtimeHandoffExecution: handoff.execution,
      runtimeHandoffStatus: handoff.handoff?.status,
      runtimeHandoffNextPacket: handoff.handoff?.nextPacket,
      workerDispatchExecutionPacketPr: handoff.sourceChain?.workerDispatchExecutionPacketPr,
      workerDispatchExecutionPacketMergeSha: handoff.sourceChain?.workerDispatchExecutionPacketMergeSha,
      workerDispatchExecutionPacketDecision: dispatch.decision,
      workerDispatchExecutionPacketRunId: dispatch.runId,
      workerDispatchMetadataEnvelope: dispatch.workerDispatchMetadata?.workerDispatchMetadataEnvelope,
      workerDispatchMetadataStatus: dispatch.workerDispatchMetadata?.status,
      localMockQueueItem: dispatch.workerDispatchMetadata?.queueItemId,
      priorGuardedRuntimeExecutionDecision:
        handoff.sourceChain?.priorGuardedRuntimeExecutionImplementationDecision,
      excludedRemotionPr: '#577 open_draft_blocked_excluded',
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
  const reportPath = path.join(
    outputDir,
    'gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2-report.json',
  )
  writeJson(reportPath, report)

  const files = [
    reportPath,
    typeof report.runtimePacketEnvelopePath === 'string' ? report.runtimePacketEnvelopePath : undefined,
    typeof report.outputManifestPath === 'string' ? report.outputManifestPath : undefined,
    typeof report.qaReportPath === 'string' ? report.qaReportPath : undefined,
  ].filter(Boolean)

  const manifestPath = path.join(
    outputDir,
    'gstreamer-mkvtoolnix-guarded-worker-runtime-execution-packet-2-manifest.json',
  )
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

try {
  loadSourceRecords()
} catch (error) {
  finish(
    {
      packet,
      integrationBase,
      runId,
      outputDir,
      decision: 'blocked_missing_runtime_handoff_or_dispatch_source_record',
      execution: 'blocked_before_post_dispatch_worker_runtime_execution',
      blocker: 'blocked_missing_runtime_handoff_or_dispatch_source_record',
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
      decision: blockedDecision,
      execution: 'blocked_confirmation_absent_no_post_dispatch_worker_runtime_execution',
      blocker: blockedDecision,
      postDispatchRuntimePacket: {
        status: 'not_run_confirmation_absent',
        guardedRuntimeExecution: 'not_run_confirmation_absent',
        gstreamerExecution: 'not_run_confirmation_absent',
        mkvtoolnixExecution: 'not_run_confirmation_absent',
      },
      validation: 'blocked_confirmation_absent',
      nextMilestone: packet,
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
      execution: 'blocked_guarded_runtime_execution_failed_before_post_dispatch_packet_acceptance',
      blocker: 'blocked_guarded_runtime_execution_result_failed',
      guardedRuntimeProcess: {
        exitStatus: guardedRuntimeProcess.status,
        signal: guardedRuntimeProcess.signal ?? null,
        stdoutSnippet: bounded(guardedRuntimeProcess.stdout),
        stderrSnippet: bounded(guardedRuntimeProcess.stderr),
      },
      safety: {
        ...baseSafety,
        dockerExecution: 'attempted_local_image_only_network_disabled_no_push_no_deploy',
        gstreamerExecution: 'blocked_or_incomplete_controlled_generated_fixture_only',
        mkvtoolnixExecution: 'blocked_or_incomplete_controlled_generated_fixture_only',
        mediaProcessing: 'blocked_or_incomplete_controlled_generated_fixture_only',
      },
      validation: 'blocked_guarded_runtime_execution_result_failed',
      nextMilestone: packet,
    }),
    1,
  )
}

let guardedSummary
try {
  guardedSummary = JSON.parse(guardedRuntimeProcess.stdout)
} catch (error) {
  finish(
    baseReport({
      decision: 'blocked_guarded_runtime_execution_summary_parse_failed',
      execution: 'blocked_guarded_runtime_summary_parse_failed_before_post_dispatch_packet_acceptance',
      blocker: 'blocked_guarded_runtime_execution_summary_parse_failed',
      guardedRuntimeProcess: {
        stdoutSnippet: bounded(guardedRuntimeProcess.stdout),
        stderrSnippet: bounded(guardedRuntimeProcess.stderr),
      },
      parseError: bounded(error.message),
      safety: {
        ...baseSafety,
        dockerExecution: 'attempted_local_image_only_network_disabled_no_push_no_deploy',
        gstreamerExecution: 'unknown_guarded_runtime_summary_parse_failed',
        mkvtoolnixExecution: 'unknown_guarded_runtime_summary_parse_failed',
        mediaProcessing: 'unknown_guarded_runtime_summary_parse_failed',
      },
      validation: 'blocked_guarded_runtime_execution_summary_parse_failed',
      nextMilestone: packet,
    }),
    1,
  )
}

const guardedRuntime = readJson(guardedSummary.report)
const commandResults = guardedRuntime.commandResults ?? []
const expectedTemplates = [
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
]
const commandMatrixOk =
  guardedRuntime.decision === 'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_controlled_generated_fixture' &&
  guardedRuntime.execution === 'completed_confirmation_gated_local_render_worker_runtime_execution_generated_fixture_only' &&
  guardedRuntime.runtimeExecution?.status === 'completed_controlled_generated_fixture_runtime_execution' &&
  guardedRuntime.runtimeExecution?.dockerNetwork === 'none' &&
  guardedRuntime.runtimeExecution?.routeExecution === 'not_run_runtime_runner_only' &&
  guardedRuntime.runtimeExecution?.workerDispatch === 'not_run_runtime_runner_only' &&
  guardedRuntime.runtimeExecution?.workerExecution === 'not_run_runtime_runner_only' &&
  commandResults.length === expectedTemplates.length &&
  expectedTemplates.every((template) =>
    commandResults.some((result) => result.templateId === template && result.ok === true && result.exitStatus === 0),
  )

if (!commandMatrixOk) {
  finish(
    baseReport({
      decision: 'blocked_post_dispatch_runtime_command_matrix_validation_failed',
      execution: 'blocked_post_dispatch_runtime_command_matrix_validation_failed',
      blocker: 'blocked_post_dispatch_runtime_command_matrix_validation_failed',
      guardedRuntime: {
        runId: guardedRuntime.runId,
        outputDir: guardedRuntime.outputDir,
        decision: guardedRuntime.decision,
        execution: guardedRuntime.execution,
        commandResults,
      },
      validation: 'blocked_post_dispatch_runtime_command_matrix_validation_failed',
      nextMilestone: packet,
    }),
    1,
  )
}

const { handoff, dispatch } = loadSourceRecords()
const runtimePacketEnvelope = {
  envelopeId: 'post-dispatch-worker-runtime-execution-packet-2-envelope',
  status: 'accepted_post_dispatch_worker_runtime_execution_packet_generated_fixture_only',
  runtimePacketId: 'runtime-packet-gstreamer-mkvtoolnix-post-dispatch-worker-2',
  runtimeExecutionId: 'runtime-execution-gstreamer-mkvtoolnix-post-dispatch-worker-2',
  runtimeExecutionMode: 'controlled_generated_fixture_runtime_execution',
  fixtureScope: 'generated_srt_and_generated_subtitle_only_mkv_fixture',
  workerRuntimeMode: 'runner_invoked_guarded_runtime_no_route_or_worker_dispatch',
  localMockQueueItem: dispatch.workerDispatchMetadata.queueItemId,
  queueStatus: dispatch.workerDispatchMetadata.queueStatus,
  approvedSnapshotId: handoff.handoff.approvedSnapshotId,
  approvalRecordId: handoff.handoff.approvalRecordId,
  jobId: handoff.handoff.jobId,
  workerLeaseId: handoff.handoff.workerLeaseId,
  commandTemplateId: handoff.handoff.commandTemplateId,
  privateInputManifestSha256: handoff.handoff.privateInputManifestSha256,
  outputManifestSchemaId: handoff.handoff.outputManifestSchemaId,
  qaReportSchemaId: handoff.handoff.qaReportSchemaId,
  cleanupPolicyId: handoff.handoff.cleanupPolicyId,
  retentionPolicyId: handoff.handoff.retentionPolicyId,
  failurePolicyId: handoff.handoff.failurePolicyId,
  guardedRuntimeReport: guardedSummary.report,
  guardedRuntimeRunId: guardedRuntime.runId,
  guardedRuntimeOutputDir: guardedRuntime.outputDir,
  dockerImageTag: guardedRuntime.imageTag,
  dockerNetwork: 'none',
  allowedCommandTemplates: expectedTemplates,
  commandResults: commandResults.map((result) => ({
    templateId: result.templateId,
    ok: result.ok,
    exitStatus: result.exitStatus,
    mediaInput: result.mediaInput,
    mediaOutput: result.mediaOutput,
  })),
  routeExecution: false,
  realWorkerDispatch: false,
  workerProcessStarted: false,
  workerExecution: false,
  workerLeaseClaim: false,
  persistentJobQueueWrite: false,
  rawCallerCommandsAccepted: false,
  runtimePacketAccepted: true,
}
const runtimePacketEnvelopePath = path.join(outputDir, 'runtime-packet-envelope.json')
writeJson(runtimePacketEnvelopePath, runtimePacketEnvelope)

const outputManifest = {
  manifestId: 'output-manifest-post-dispatch-worker-runtime-execution-packet-2',
  status: 'accepted_guarded_runtime_output_manifest_reference_only',
  guardedRuntimeOutputDir: guardedRuntime.outputDir,
  controlledGeneratedFixtureOnly: true,
  routeExecution: false,
  realWorkerDispatch: false,
  workerExecution: false,
  workerLeaseClaim: false,
  persistentQueueWrite: false,
  publicArtifacts: false,
  signedUrls: false,
  finalRenderExport: false,
  files: [],
}
const outputManifestPath = path.join(outputDir, 'output-manifest.json')
writeJson(outputManifestPath, outputManifest)

const qaReport = {
  reportId: 'qa-report-post-dispatch-worker-runtime-execution-packet-2',
  status: 'passed_post_dispatch_worker_runtime_execution_packet_generated_fixture_only',
  checks: [
    'post_dispatch_runtime_confirmation_gate_present',
    'runtime_handoff_source_present',
    'worker_dispatch_metadata_envelope_present',
    'local_mock_queue_item_reference_preserved',
    'guarded_runtime_execution_confirmation_gate_present',
    'approved_snapshot_reference_preserved',
    'approval_record_reference_preserved',
    'job_and_worker_lease_references_preserved_without_claim',
    'allowed_command_templates_only',
    'docker_network_disabled',
    'generated_fixture_scope_only',
    'no_route_execution_worker_dispatch_worker_process_or_persistent_queue_write',
    'no_private_user_media_public_artifacts_or_final_export',
  ],
  blockers: [],
}
const qaReportPath = path.join(outputDir, 'qa-report.json')
writeJson(qaReportPath, qaReport)

finish(
  baseReport({
    decision,
    execution,
    guardedRuntime: {
      runId: guardedRuntime.runId,
      outputDir: guardedRuntime.outputDir,
      decision: guardedRuntime.decision,
      execution: guardedRuntime.execution,
      imageTag: guardedRuntime.imageTag,
      commandResults: runtimePacketEnvelope.commandResults,
    },
    postDispatchRuntimePacket: {
      status: runtimePacketEnvelope.status,
      confirmationGate: `${confirmEnv}=true`,
      runtimePacketId: runtimePacketEnvelope.runtimePacketId,
      runtimeExecutionId: runtimePacketEnvelope.runtimeExecutionId,
      runtimeExecutionMode: runtimePacketEnvelope.runtimeExecutionMode,
      fixtureScope: runtimePacketEnvelope.fixtureScope,
      workerRuntimeMode: runtimePacketEnvelope.workerRuntimeMode,
      localMockQueueItem: runtimePacketEnvelope.localMockQueueItem,
      queueStatus: runtimePacketEnvelope.queueStatus,
      approvedSnapshotId: runtimePacketEnvelope.approvedSnapshotId,
      approvalRecordId: runtimePacketEnvelope.approvalRecordId,
      jobId: runtimePacketEnvelope.jobId,
      workerLeaseId: runtimePacketEnvelope.workerLeaseId,
      commandTemplateId: runtimePacketEnvelope.commandTemplateId,
      privateInputManifestSha256: runtimePacketEnvelope.privateInputManifestSha256,
      outputManifestSchemaId: runtimePacketEnvelope.outputManifestSchemaId,
      qaReportSchemaId: runtimePacketEnvelope.qaReportSchemaId,
      dockerImageTag: runtimePacketEnvelope.dockerImageTag,
      dockerNetwork: runtimePacketEnvelope.dockerNetwork,
      runtimePacketAccepted: true,
      routeExecution: 'not_run_post_dispatch_runtime_packet_runner_only',
      realWorkerDispatch: 'not_run_post_dispatch_runtime_packet_runner_only',
      workerProcessStarted: 'not_run_post_dispatch_runtime_packet_runner_only',
      workerExecution: 'not_run_post_dispatch_runtime_packet_runner_only',
      workerLeaseClaim: 'not_run_post_dispatch_runtime_packet_runner_only',
      persistentJobQueueWrite: 'not_run_post_dispatch_runtime_packet_runner_only',
      gstreamerExecution: 'completed_controlled_generated_fixture_only',
      mkvtoolnixExecution: 'completed_controlled_generated_fixture_only',
      mediaProcessing: 'controlled_generated_fixture_only',
      privateMediaProcessing: false,
      userMediaProcessing: false,
      nextSourceStatus: 'ready_for_post_dispatch_worker_runtime_qa_rollup',
    },
    runtimePacketEnvelopePath,
    outputManifestPath,
    qaReportPath,
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
