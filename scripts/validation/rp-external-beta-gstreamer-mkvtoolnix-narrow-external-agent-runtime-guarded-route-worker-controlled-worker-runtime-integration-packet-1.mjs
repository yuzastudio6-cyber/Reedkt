#!/usr/bin/env node
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-INTEGRATION-PACKET-1'
const decision =
  'completed_gstreamer_mkvtoolnix_narrow_controlled_worker_runtime_integration_packet_generated_fixture_source_envelope'
const execution =
  'completed_confirmation_gated_narrow_controlled_worker_runtime_integration_packet_metadata_only_no_route_worker_or_tool_execution'
const blockedDecision =
  'blocked_pending_gstreamer_mkvtoolnix_narrow_route_worker_runtime_integration_packet_confirmation'
const confirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_RUNTIME_INTEGRATION_PACKET'
const outputRoot =
  '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-narrow-route-worker-runtime-integration-packet-1'
const planningRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-planning-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-integration-planning-1-record.json'
const runtimeRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-execution-packet-1-record.json'
const runtimeQaRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-qa-rollup-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-runtime-qa-rollup-1-record.json'
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-CONTROLLED-WORKER-RUNTIME-INTEGRATION-PACKET-QA-ROLLUP-1'

function sha256(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function artifact(filePath) {
  return {
    fileName: path.basename(filePath),
    path: filePath,
    bytes: fs.statSync(filePath).size,
    sha256: sha256(filePath),
  }
}

function runId() {
  return `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
}

function finish(summary, exitCode = 0) {
  console.log(JSON.stringify(summary, null, 2))
  process.exit(exitCode)
}

if (process.env[confirmEnv] !== 'true') {
  finish(
    {
      ok: false,
      packet,
      decision: blockedDecision,
      execution: 'blocked_confirmation_absent_no_narrow_route_worker_runtime_integration_packet_metadata',
      requiredGate: `${confirmEnv}=true`,
    },
    2,
  )
}

const id = runId()
const outputDir = path.join(outputRoot, id)
const planning = readJson(planningRecordPath)
const runtime = readJson(runtimeRecordPath)
const qa = readJson(runtimeQaRecordPath)

const blockers = []
if (planning.decision !== 'completed_gstreamer_mkvtoolnix_narrow_controlled_worker_runtime_integration_planning') {
  blockers.push('blocked_runtime_integration_planning_source_mismatch')
}
if (planning.validation !== 'passed') blockers.push('blocked_runtime_integration_planning_validation_not_passed')
if (runtime.decision !== 'completed_gstreamer_mkvtoolnix_narrow_controlled_worker_runtime_execution_packet_generated_fixture_only') {
  blockers.push('blocked_runtime_execution_packet_source_mismatch')
}
if (runtime.validation !== 'passed') blockers.push('blocked_runtime_execution_packet_validation_not_passed')
if (qa.decision !== 'qa_passed_gstreamer_mkvtoolnix_narrow_controlled_worker_runtime_execution_packet_generated_fixture_evidence') {
  blockers.push('blocked_runtime_qa_rollup_source_mismatch')
}
if (qa.validation !== 'passed') blockers.push('blocked_runtime_qa_rollup_validation_not_passed')

const sourceEnvelope = {
  sourceClass: 'generated_fixture_only_narrow_controlled_worker_runtime_source',
  planningPacket: planning.packet,
  planningDecision: planning.decision,
  runtimeExecutionPacketPr: runtime.sourceChain?.runtimeExecutionPacketPr ?? 2044,
  runtimeExecutionPacketMergeSha: planning.sourceChain?.runtimeExecutionPacketMergeSha,
  runtimeExecutionPacketRunId: planning.sourceChain?.runtimeExecutionPacketRunId,
  guardedRuntimeRunId: planning.sourceChain?.guardedRuntimeRunId,
  runtimeQaRollupPr: planning.sourceChain?.runtimeQaRollupPr,
  runtimeQaRollupMergeSha: planning.sourceChain?.runtimeQaRollupMergeSha,
  runtimeQaRollupDecision: planning.sourceChain?.runtimeQaRollupDecision,
  acceptedCommandTemplates: [
    'gst_fakesrc_fakesink_no_media_healthcheck_v1',
    'gst_controlled_generated_fixture_pipeline_v1',
    'mkvmerge_generated_subtitle_only_package_v1',
    'mkvmerge_identify_generated_subtitle_only_v1',
  ],
  routeExecution: false,
  workerDispatch: false,
  workerExecution: false,
  workerProcessStart: false,
  workerLeaseClaim: false,
  persistentJobQueueWrite: false,
  privateMediaProcessing: false,
  userMediaProcessing: false,
  signedUrlCreation: false,
  publicArtifactCreation: false,
  finalRenderExport: false,
}

const integrationEnvelope = {
  envelopeId: 'narrow-controlled-worker-runtime-integration-packet-1-envelope',
  packet,
  decision: blockers.length ? 'blocked_runtime_integration_packet_source_validation_failed' : decision,
  execution: blockers.length
    ? 'blocked_runtime_integration_packet_source_validation_failed'
    : execution,
  runId: id,
  outputDir,
  confirmationGate: `${confirmEnv}=true`,
  routeWorkerIntegrationMode: 'metadata_only_source_envelope_for_future_route_worker_runtime_integration',
  routeSourceId: 'externalBeta.gstreamerMkvtoolnix.narrowControlledWorkerRuntimeIntegrationPacket1',
  sourceIdempotencyKey: [
    'gstreamer-mkvtoolnix',
    'narrow-route-worker-runtime-integration-packet-1',
    sourceEnvelope.runtimeExecutionPacketRunId,
    sourceEnvelope.guardedRuntimeRunId,
  ].join(':'),
  jobId: 'job-gstreamer-mkvtoolnix-narrow-runtime-integration-packet-1',
  workerLeaseReference: 'lease-reference-gstreamer-mkvtoolnix-narrow-runtime-integration-packet-1-not-claimed',
  queueItemReference: 'queue-reference-gstreamer-mkvtoolnix-narrow-runtime-integration-packet-1-not-written',
  sourceEnvelope,
  blockers,
  safety: {
    productionRouteFileCreated: false,
    routeRegisteredAtRuntime: false,
    routeExecution: false,
    workerDispatch: false,
    workerExecution: false,
    workerProcessStart: false,
    workerLeaseClaim: false,
    persistentJobQueueWrite: false,
    gstreamerExecution: false,
    mkvtoolnixExecution: false,
    dockerExecution: false,
    ffmpegFfprobeExecution: false,
    remotionExecution: false,
    privateMediaProcessing: false,
    userMediaProcessing: false,
    mediaProcessing: false,
    supabaseMutation: false,
    sqlExecution: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    finalRenderExport: false,
    broadExternalBetaUnlock: false,
    paidProductionUnlock: false,
    productionUnlock: false,
  },
  productReadyEndToEndLocalOssTools: 0,
  nextMilestone,
}

const inputPath = path.join(outputDir, 'narrow-runtime-integration-packet-input.json')
const envelopePath = path.join(outputDir, 'narrow-runtime-integration-packet-envelope.json')
const qaReportPath = path.join(outputDir, 'narrow-runtime-integration-packet-qa-report.json')
const reportPath = path.join(outputDir, 'narrow-runtime-integration-packet-report.json')
const manifestPath = path.join(outputDir, 'narrow-runtime-integration-packet-manifest.json')

writeJson(inputPath, {
  packet,
  confirmationGate: `${confirmEnv}=true`,
  sourceRecordPaths: [planningRecordPath, runtimeRecordPath, runtimeQaRecordPath],
})
writeJson(envelopePath, integrationEnvelope)
writeJson(qaReportPath, {
  packet,
  runId: id,
  status: blockers.length ? 'blocked_runtime_integration_packet_source_validation_failed' : 'passed_runtime_integration_packet_metadata_only',
  checks: [
    'confirmation_gate_present',
    'planning_source_passed',
    'runtime_execution_packet_source_passed',
    'runtime_qa_rollup_source_passed',
    'generated_fixture_source_envelope_preserved',
    'idempotency_key_present',
    'worker_lease_reference_present_not_claimed',
    'queue_reference_present_not_written',
    'no_route_worker_tool_or_media_execution',
  ],
  blockers,
})
writeJson(reportPath, {
  ok: blockers.length === 0,
  packet,
  decision: integrationEnvelope.decision,
  execution: integrationEnvelope.execution,
  runId: id,
  outputDir,
  routeWorkerIntegrationMode: integrationEnvelope.routeWorkerIntegrationMode,
  sourceIdempotencyKey: integrationEnvelope.sourceIdempotencyKey,
  workerLeaseReference: integrationEnvelope.workerLeaseReference,
  queueItemReference: integrationEnvelope.queueItemReference,
  safety: integrationEnvelope.safety,
  productReadyEndToEndLocalOssTools: 0,
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  nextMilestone,
})

const artifacts = [inputPath, envelopePath, qaReportPath, reportPath].map((filePath) => artifact(filePath))
writeJson(manifestPath, {
  packet,
  runId: id,
  outputDir,
  artifacts,
})
const finalManifest = {
  packet,
  runId: id,
  outputDir,
  artifacts: [...artifacts, artifact(manifestPath)],
}
writeJson(manifestPath, finalManifest)

finish(
  {
    ok: blockers.length === 0,
    packet,
    decision: integrationEnvelope.decision,
    execution: integrationEnvelope.execution,
    runId: id,
    outputDir,
    input: artifact(inputPath),
    envelope: artifact(envelopePath),
    qaReport: artifact(qaReportPath),
    report: artifact(reportPath),
    manifest: artifact(manifestPath),
    nextMilestone,
  },
  blockers.length ? 1 : 0,
)
