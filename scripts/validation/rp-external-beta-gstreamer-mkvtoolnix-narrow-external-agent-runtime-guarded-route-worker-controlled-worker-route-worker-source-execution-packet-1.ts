import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_EXECUTION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_PACKET,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_READY_STATUS,
  buildGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput,
  summarizeGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionBoundary,
  validateGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput,
} from '../../server/services/rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-controlled-worker-route-worker-source-execution-packet-1'

const packet = RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_PACKET
const blockedDecision = 'blocked_pending_gstreamer_mkvtoolnix_narrow_route_worker_source_execution_packet_confirmation'
const integrationBase = 'd84252da9b7e09a493110dd24b884c0cb3c7dc8f'
const sourceQaRollupPr = 2074
const sourceQaRollupMergeSha = 'd84252da9b7e09a493110dd24b884c0cb3c7dc8f'
const sourceImplementationPr = 2065
const sourceImplementationMergeSha = '6dc0dee942eedb2e15de741b39d853f9e9ce99ef'
const sourceRunId = '2026-07-02T00-34-22-766Z-c5302439'
const outputRoot =
  '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-narrow-route-worker-source-execution-packet-1'
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

function finish(report: Record<string, unknown>, files: string[], exitCode: number): void {
  const reportPath = path.join(outputDir, 'route-worker-source-execution-packet-report.json')
  writeJson(reportPath, report)
  const manifestPath = path.join(outputDir, 'route-worker-source-execution-packet-manifest.json')
  const artifactFiles = [...files, reportPath]
  const manifest = {
    packet,
    runId,
    outputDir,
    decision: report.decision,
    execution: report.execution,
    artifacts: artifactFiles.map((file) => artifact(file)),
  }
  writeJson(manifestPath, manifest)
  const manifestArtifact = artifact(manifestPath)
  console.log(JSON.stringify({
    packet,
    decision: report.decision,
    execution: report.execution,
    runId,
    outputDir,
    report: artifact(reportPath),
    manifest: manifestArtifact,
    artifacts: [...manifest.artifacts, manifestArtifact],
  }, null, 2))
  process.exit(exitCode)
}

const baseSafety = {
  routeRegisteredAtRuntimeInThisSourceExecutionPacketPhase: false,
  productionRouteFileCreatedInThisSourceExecutionPacketPhase: false,
  routeExecutionInThisSourceExecutionPacketPhase: false,
  workerDispatchInThisSourceExecutionPacketPhase: false,
  workerExecutionInThisSourceExecutionPacketPhase: false,
  workerProcessStartInThisSourceExecutionPacketPhase: false,
  workerLeaseClaimInThisSourceExecutionPacketPhase: false,
  persistentJobQueueWriteInThisSourceExecutionPacketPhase: false,
  gstreamerExecutionInThisSourceExecutionPacketPhase: false,
  mkvtoolnixExecutionInThisSourceExecutionPacketPhase: false,
  dockerExecutionInThisSourceExecutionPacketPhase: false,
  ffmpegFfprobeExecutionInThisSourceExecutionPacketPhase: false,
  remotionExecutionInThisSourceExecutionPacketPhase: false,
  mediaProcessingInThisSourceExecutionPacketPhase: false,
  privateMediaProcessingInThisSourceExecutionPacketPhase: false,
  userMediaProcessingInThisSourceExecutionPacketPhase: false,
  supabaseMutationInThisSourceExecutionPacketPhase: false,
  sqlExecutionInThisSourceExecutionPacketPhase: false,
  secretPayloadAccessInThisSourceExecutionPacketPhase: false,
  serviceRoleSecretPayloadAccessInThisSourceExecutionPacketPhase: false,
  providerCallInThisSourceExecutionPacketPhase: false,
  modelCallInThisSourceExecutionPacketPhase: false,
  signedUrlCreationInThisSourceExecutionPacketPhase: false,
  publicArtifactCreationInThisSourceExecutionPacketPhase: false,
  finalRenderExportInThisSourceExecutionPacketPhase: false,
  broadExternalBetaUnlockInThisSourceExecutionPacketPhase: false,
  paidProductionUnlockInThisSourceExecutionPacketPhase: false,
  productionUnlockInThisSourceExecutionPacketPhase: false,
}

function baseReport(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    packet,
    integrationBase,
    runId,
    outputDir,
    sourceChain: {
      runtimeIntegrationImplementationQaRollupPr: sourceQaRollupPr,
      runtimeIntegrationImplementationQaRollupMergeSha: sourceQaRollupMergeSha,
      runtimeIntegrationImplementationQaRollupDecision:
        'qa_passed_gstreamer_mkvtoolnix_narrow_controlled_worker_runtime_integration_implementation_source_envelope_evidence',
      runtimeIntegrationImplementationPr: sourceImplementationPr,
      runtimeIntegrationImplementationMergeSha: sourceImplementationMergeSha,
      runtimeIntegrationImplementationRunId: sourceRunId,
      excludedRemotionPr: '#577 open_draft_blocked_excluded',
    },
    productReadyEndToEndLocalOssTools: 0,
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_NEXT_MILESTONE,
    ...overrides,
  }
}

if (process.env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_CONFIRM_ENV] !== 'true') {
  finish(
    baseReport({
      decision: blockedDecision,
      execution: 'blocked_confirmation_absent_no_route_worker_source_execution_packet',
      blocker: blockedDecision,
      confirmationGate: `${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_CONFIRM_ENV}=true`,
      safety: baseSafety,
      validation: 'blocked_confirmation_absent',
    }),
    [],
    2,
  )
}

const input = buildGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput()
const result = validateGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput(input)
if (!result.ok) {
  finish(
    baseReport({
      decision: 'blocked_route_worker_source_execution_packet_validation_failed',
      execution: 'blocked_route_worker_source_execution_packet_validation_failed',
      blocker: 'blocked_route_worker_source_execution_packet_validation_failed',
      blockers: result.blockers,
      safety: baseSafety,
      validation: 'blocked_route_worker_source_execution_packet_validation_failed',
    }),
    [],
    1,
  )
}

const negativeCases = [
  { name: 'missing_confirmation', patch: { confirmation: false } },
  { name: 'missing_source_qa', patch: { runtimeIntegrationImplementationQaStatus: 'pending' as const } },
  { name: 'runtime_route_mode', patch: { routeSourceMode: 'runtime_route_registration' as const } },
  { name: 'runtime_worker_mode', patch: { workerSourceMode: 'runtime_worker_process' as const } },
  { name: 'persistent_queue_write', patch: { queueSourceMode: 'persistent_queue_write' as const } },
  { name: 'private_media_source', patch: { sourceClass: 'private_or_user_media' as const } },
  { name: 'route_execution_request', patch: { routeExecutionRequestedNow: true } },
  { name: 'worker_execution_request', patch: { workerExecutionRequestedNow: true } },
  { name: 'tool_execution_request', patch: { gstreamerExecutionRequestedNow: true, mkvtoolnixExecutionRequestedNow: true } },
  { name: 'supabase_sql_request', patch: { supabaseMutationRequestedNow: true, sqlExecutionRequestedNow: true } },
  { name: 'public_artifact_request', patch: { publicArtifactRequestedNow: true } },
  { name: 'idempotency_mismatch', patch: { routeWorkerSourceExecutionPacketIdempotencyKey: 'wrong-key' } },
]

const negativeResults = negativeCases.map((item) => {
  const negative = validateGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionInput({
    ...input,
    ...item.patch,
  })
  return {
    name: item.name,
    rejected: !negative.ok,
    blockers: negative.blockers,
  }
})
if (negativeResults.some((item) => !item.rejected)) {
  finish(
    baseReport({
      decision: 'blocked_route_worker_source_execution_negative_matrix_failed',
      execution: 'blocked_route_worker_source_execution_negative_matrix_failed',
      blocker: 'blocked_route_worker_source_execution_negative_matrix_failed',
      negativeResults,
      safety: baseSafety,
      validation: 'blocked_route_worker_source_execution_negative_matrix_failed',
    }),
    [],
    1,
  )
}

const inputPath = path.join(outputDir, 'route-worker-source-execution-packet-input.json')
const envelopePath = path.join(outputDir, 'route-worker-source-execution-packet-envelope.json')
const qaReportPath = path.join(outputDir, 'route-worker-source-execution-packet-qa-report.json')

writeJson(inputPath, input)
writeJson(envelopePath, {
  packet,
  runId,
  decision: result.decision,
  execution: result.execution,
  sourceChain: baseReport({}).sourceChain,
  sourceExecutionPacket: result.sanitizedSourceExecutionPacket,
  responseShape: result.responseShape,
  safety: result.safety,
  boundary: summarizeGstreamerMkvtoolnixNarrowRouteWorkerSourceExecutionBoundary(),
})
writeJson(qaReportPath, {
  packet,
  runId,
  qa: {
    positiveValidation: 'passed',
    negativeMatrix: 'passed',
    sourceQaRollupReview: 'passed',
    routeWorkerBoundaryReview: 'passed',
    safetyReview: 'passed',
  },
  negativeResults,
})

finish(
  baseReport({
    decision: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_DECISION,
    execution: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_EXECUTION,
    confirmationGate: `${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_CONFIRM_ENV}=true`,
    routeWorkerSourceExecutionPacket: {
      status: result.status,
      responseShape: result.responseShape.status,
      routeSourceMode: result.sanitizedSourceExecutionPacket.routeSourceMode,
      workerSourceMode: result.sanitizedSourceExecutionPacket.workerSourceMode,
      queueSourceMode: result.sanitizedSourceExecutionPacket.queueSourceMode,
      sourceExecutionMode: result.sanitizedSourceExecutionPacket.sourceExecutionMode,
      sourceClass: result.sanitizedSourceExecutionPacket.sourceClass,
      readiness: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_SOURCE_EXECUTION_READY_STATUS,
    },
    inputPath,
    envelopePath,
    qaReportPath,
    safety: baseSafety,
    validation: 'passed',
  }),
  [inputPath, envelopePath, qaReportPath],
  0,
)
