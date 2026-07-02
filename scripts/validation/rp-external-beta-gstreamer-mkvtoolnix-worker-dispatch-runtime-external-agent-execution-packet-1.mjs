#!/usr/bin/env node
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXTERNAL-AGENT-EXECUTION-PACKET-1'
const confirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXTERNAL_AGENT_EXECUTION_PACKET'
const outputRoot =
  '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-worker-dispatch-runtime-external-agent-execution-packet-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(outputRoot, runId)

const sourceChain = {
  sourceGatePr: 2158,
  sourceGateMergeSha: '488df755ef9f9954e8696ed336f9106bada06319',
  dryRunPr: 2162,
  dryRunMergeSha: 'ef5b15adcf5de407f3083abb64ffc14b298692cc',
  executionPacketPr: 2166,
  executionPacketMergeSha: 'fc0706786e3413fdfc364d62a87adb45cc64ca36',
  executionQaPr: 2169,
  executionQaMergeSha: 'b5e0177750f2fdaef0a3e8780e31026838b17d23',
  externalAgentHandoffPr: 2170,
  externalAgentHandoffMergeSha: '3b96c009902fe72265446264398018b489401880',
  externalAgentDryRunPr: 2175,
  externalAgentDryRunMergeSha: '85805fe2055f893a8e32f689d842c1ecafd7f6ff',
  externalAgentDryRunRunId: '2026-07-02T17-27-30-594Z-c3ff4d53',
  executionPacketRunId: '2026-07-02T16-27-38-186Z-1ce73813',
  runtimeDelegateRunId: '2026-07-02T16-27-38-291Z-a5f6a279',
  excludedRemotionPr: '#577 open_draft_blocked_excluded',
}

const routePath = '/v1/external-beta/gstreamer-mkvtoolnix/narrow-agent/generated-fixture-runtime/execute'
const workerSourcePath = 'server/workers/gstreamer-mkvtoolnix-narrow-source-execution-worker-not-registered.ts'
const target = { projectName: 'Reeditpro', projectRef: 'wmyyttnynmteqgcdishd', class: 'staging' }

const safetyFalse = {
  routeExecution: false,
  externalAgentRuntimeInvocation: false,
  realWorkerDispatch: false,
  workerProcessStarted: false,
  workerExecution: false,
  workerLeaseClaim: false,
  workerLeaseMutation: false,
  persistentJobQueueWrite: false,
  serviceRoleRouteExecution: false,
  serviceRoleSecretPayloadAccess: false,
  secretPayloadAccess: false,
  gstreamerExecution: false,
  mkvtoolnixExecution: false,
  ffmpegFfprobeExecution: false,
  dockerExecution: false,
  remotionExecution: false,
  mediaProcessing: false,
  privateMediaProcessing: false,
  userMediaProcessing: false,
  supabaseMutation: false,
  sqlExecution: false,
  signedUrlCreation: false,
  publicArtifactCreation: false,
  creditMutation: false,
  providerCall: false,
  modelCall: false,
  deployment: false,
  externalBetaUnlock: false,
  paidProductionUnlock: false,
  productionUnlock: false,
  finalRenderExport: false,
  dependencyMutation: false,
  packageLockMutation: false,
  broadServiceRoleHandler: false,
}

fs.mkdirSync(outputDir, { recursive: true })

function sha256Bytes(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
}

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function artifact(file) {
  return { fileName: path.basename(file), bytes: fs.statSync(file).size, sha256: sha256File(file) }
}

function baseReport(overrides) {
  return {
    packet,
    runId,
    outputDir,
    confirmationGate: {
      env: `${confirmEnv}=true`,
      observed: process.env[confirmEnv] === 'true' ? 'present_true' : 'absent_or_not_true',
    },
    sourceChain,
    target,
    routePath,
    workerSourcePath,
    safety: safetyFalse,
    productReadyEndToEndLocalOssTools: 0,
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
    ...overrides,
  }
}

function finish(report, exitCode) {
  const reportPath = path.join(outputDir, 'external-agent-execution-packet-report.json')
  writeJson(reportPath, report)
  const manifestPath = path.join(outputDir, 'external-agent-execution-packet-manifest.json')
  const manifest = {
    packet,
    runId,
    outputDir,
    decision: report.decision,
    execution: report.execution,
    artifacts: [
      artifact(reportPath),
      ...(report.envelopePath ? [artifact(report.envelopePath)] : []),
      ...(report.qaReportPath ? [artifact(report.qaReportPath)] : []),
    ],
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

if (process.env[confirmEnv] !== 'true') {
  finish(
    baseReport({
      decision: 'blocked_pending_gstreamer_mkvtoolnix_worker_dispatch_runtime_external_agent_execution_packet_confirmation',
      execution: 'blocked_confirmation_absent_no_route_worker_tool_or_media_execution',
      blocker: 'blocked_pending_gstreamer_mkvtoolnix_worker_dispatch_runtime_external_agent_execution_packet_confirmation',
      nextMilestone: packet,
    }),
    2,
  )
}

const envelope = {
  envelopeId: 'external-agent-execution-packet-gstreamer-mkvtoolnix-worker-dispatch-runtime-1',
  packet,
  runId,
  mode: 'confirmation_gated_external_agent_execution_packet_metadata_only',
  sourceChain,
  target,
  routePath,
  workerSourcePath,
  workerSourceId: 'worker.gstreamerMkvtoolnix.narrowSourceExecution.notRegistered',
  persistedJobId: 'job-persisted-gstreamer-mkvtoolnix-generated-fixture-runtime-source-gate-1',
  persistedJobType: 'quality_check',
  persistedJobPayloadKind: 'gstreamer_mkvtoolnix_generated_fixture_runtime',
  workerType: 'gstreamer_mkvtoolnix_generated_fixture_worker',
  dryRunEnvelopeRef: {
    runId: sourceChain.externalAgentDryRunRunId,
    mergeSha: sourceChain.externalAgentDryRunMergeSha,
    status: 'completed_confirmation_gated_external_agent_dry_run_metadata_only',
  },
  idempotencyKey: `external-agent-execution-packet:${sourceChain.externalAgentDryRunMergeSha}:${runId}`,
  fixtureScope: 'controlled_generated_fixture_only',
  executionPacketPlan: {
    routeExecutionRequestedNow: false,
    externalAgentRuntimeInvocationRequestedNow: false,
    workerDispatchRequestedNow: false,
    workerProcessStartRequestedNow: false,
    workerLeaseClaimRequestedNow: false,
    persistentQueueWriteRequestedNow: false,
    toolExecutionRequestedNow: false,
    mediaProcessingRequestedNow: false,
    acceptedForFutureGuardedExecution: true,
  },
  requiredFutureRuntimeGate:
    'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_WORKER_DISPATCH_RUNTIME_EXTERNAL_AGENT_RUNTIME_EXECUTION',
  rollbackPlanId: 'rollback-remote-claim-lease-already-verified-no-persistent-dispatch-residue',
  cleanupPlanId: 'cleanup-tmp-evidence-only-no-persistent-public-artifacts',
  safety: safetyFalse,
}
envelope.sha256 = sha256Bytes(JSON.stringify(envelope))

const envelopePath = path.join(outputDir, 'external-agent-execution-packet-envelope.json')
writeJson(envelopePath, envelope)

const qaReport = {
  packet,
  runId,
  qaScope: 'execution_packet_integrity_only',
  status: 'passed',
  checks: {
    confirmationGateObserved: process.env[confirmEnv] === 'true',
    dryRunSourceRecorded: envelope.dryRunEnvelopeRef.status === 'completed_confirmation_gated_external_agent_dry_run_metadata_only',
    routeExecutionRequestedNow: envelope.executionPacketPlan.routeExecutionRequestedNow === false,
    externalAgentRuntimeInvocationRequestedNow: envelope.executionPacketPlan.externalAgentRuntimeInvocationRequestedNow === false,
    workerDispatchRequestedNow: envelope.executionPacketPlan.workerDispatchRequestedNow === false,
    workerProcessStartRequestedNow: envelope.executionPacketPlan.workerProcessStartRequestedNow === false,
    workerLeaseClaimRequestedNow: envelope.executionPacketPlan.workerLeaseClaimRequestedNow === false,
    persistentQueueWriteRequestedNow: envelope.executionPacketPlan.persistentQueueWriteRequestedNow === false,
    toolExecutionRequestedNow: envelope.executionPacketPlan.toolExecutionRequestedNow === false,
    mediaProcessingRequestedNow: envelope.executionPacketPlan.mediaProcessingRequestedNow === false,
    envelopeChecksumPresent: envelope.sha256.length === 64,
  },
  safety: safetyFalse,
}
qaReport.sha256 = sha256Bytes(JSON.stringify(qaReport))
const qaReportPath = path.join(outputDir, 'external-agent-execution-packet-qa-report.json')
writeJson(qaReportPath, qaReport)

const blockers = Object.entries(qaReport.checks)
  .filter(([, passed]) => passed !== true)
  .map(([key]) => `blocked_${key}`)

if (blockers.length > 0) {
  finish(
    baseReport({
      decision: 'blocked_external_agent_execution_packet_validation_failed',
      execution: 'blocked_external_agent_execution_packet_no_route_worker_tool_or_media_execution',
      blocker: blockers[0],
      envelopePath,
      qaReportPath,
      envelope,
      qaReport,
      blockers,
      nextMilestone: packet,
    }),
    1,
  )
}

finish(
  baseReport({
    decision: 'completed_gstreamer_mkvtoolnix_worker_dispatch_runtime_external_agent_execution_packet',
    execution: 'completed_confirmation_gated_external_agent_execution_packet_no_route_worker_tool_or_media_execution',
    envelopePath,
    qaReportPath,
    envelope,
    qaReport,
    blockers,
    executionPacket: {
      status: 'completed_confirmation_gated_external_agent_execution_packet_metadata_only',
      routeExecution: 'not_run_execution_packet_only',
      externalAgentRuntimeInvocation: 'not_run_execution_packet_only',
      workerDispatch: 'not_run_execution_packet_only',
      workerExecution: 'not_run_execution_packet_only',
      workerLeaseClaim: 'not_run_execution_packet_only',
      persistentQueueWrite: 'not_run_execution_packet_only',
      toolExecution: 'not_run_execution_packet_only',
      mediaProcessing: 'not_run_execution_packet_only',
    },
    readiness: {
      externalAgentRuntimeExecution:
        'ready_for_separate_confirmation_gated_external_agent_runtime_execution_packet',
      gstreamer: 'ready_for_separate_confirmation_gated_external_agent_runtime_execution_packet',
      mkvtoolnix: 'ready_for_separate_confirmation_gated_external_agent_runtime_execution_packet',
    },
    nextMilestone:
      'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-WORKER-DISPATCH-RUNTIME-EXTERNAL-AGENT-EXECUTION-QA-1',
  }),
  0,
)
