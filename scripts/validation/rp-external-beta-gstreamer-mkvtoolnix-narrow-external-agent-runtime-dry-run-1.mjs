#!/usr/bin/env node
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-DRY-RUN-1'
const confirmationEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_EXTERNAL_AGENT_RUNTIME_DRY_RUN'
const blockerMissingConfirmation = 'blocked_pending_narrow_external_agent_runtime_dry_run_confirmation'
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-handoff-1-record.json'

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex')
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function failClosed(blocker, details = {}) {
  console.error(JSON.stringify({ packet, status: 'blocked', blocker, ...details }, null, 2))
  process.exit(1)
}

if (process.env[confirmationEnv] !== 'true') {
  failClosed(blockerMissingConfirmation, {
    confirmationGate: `${confirmationEnv}=true`,
  })
}

if (!fs.existsSync(sourceRecordPath)) {
  failClosed('blocked_missing_narrow_external_agent_runtime_handoff_source', { sourceRecordPath })
}

const sourceRecord = JSON.parse(fs.readFileSync(sourceRecordPath, 'utf8'))
if (sourceRecord.handoffStatus !== 'ready_for_confirmation_gated_narrow_external_agent_runtime_dry_run') {
  failClosed('blocked_handoff_not_ready_for_narrow_external_agent_runtime_dry_run', {
    observed: sourceRecord.handoffStatus,
  })
}

const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(
  '/tmp',
  'reeditpro-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-dry-run-1',
  runId,
)
fs.mkdirSync(outputDir, { recursive: true })

const handoffEnvelope = {
  dryRunId: `dry-run-${sourceRecord.handoffEnvelope.externalAgentHandoffId}`,
  dryRunMode: 'reference_validation_only',
  confirmationGate: `${confirmationEnv}=true`,
  sourcePacket: sourceRecord.packet,
  sourceDecision: sourceRecord.decision,
  sourceHandoffStatus: sourceRecord.handoffStatus,
  runtimeQaRollupMergeSha: sourceRecord.sourceChain.runtimeQaRollupMergeSha,
  packet2RunId: sourceRecord.sourceChain.packet2RunId,
  guardedRuntimeRunId: sourceRecord.sourceChain.guardedRuntimeRunId,
  ...sourceRecord.handoffEnvelope,
  allowedCommandTemplates: sourceRecord.allowedCommandTemplates,
}

const requiredStringFields = [
  'approvedSnapshotId',
  'approvalRecordId',
  'creditPolicyId',
  'jobId',
  'workerLeaseId',
  'localMockQueueItem',
  'runtimePacketId',
  'runtimeExecutionId',
  'idempotencyKey',
  'privateInputManifestSha256',
  'outputManifestSchemaId',
  'qaReportSchemaId',
  'cleanupPolicyId',
  'retentionPolicyId',
  'failurePolicyId',
  'auditEventParentId',
  'dockerImageTag',
  'dockerNetwork',
]

const acceptedCommandTemplates = new Set([
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
])

function validateEnvelope(envelope) {
  const failures = []
  for (const field of requiredStringFields) {
    if (typeof envelope[field] !== 'string' || envelope[field].length === 0) {
      failures.push(`missing_${field}`)
    }
  }
  if (envelope.dockerNetwork !== 'none') failures.push('docker_network_must_be_none')
  if (!Array.isArray(envelope.allowedCommandTemplates)) failures.push('missing_allowed_command_templates')
  for (const template of envelope.allowedCommandTemplates ?? []) {
    if (!acceptedCommandTemplates.has(template)) failures.push(`unapproved_template_${template}`)
  }
  if (envelope.rawCommand || envelope.command || envelope.args) failures.push('raw_command_material_forbidden')
  if (envelope.routeExecutionRequest) failures.push('route_execution_request_forbidden')
  if (envelope.workerDispatchRequest) failures.push('worker_dispatch_request_forbidden')
  if (envelope.persistentQueueWriteRequest) failures.push('persistent_queue_write_request_forbidden')
  if (envelope.privateMediaPath || envelope.userMediaPath || envelope.publicUrl || envelope.signedUrl) {
    failures.push('unapproved_media_or_url_source_forbidden')
  }
  if (envelope.supabaseMutationRequest || envelope.sqlExecutionRequest) failures.push('supabase_sql_forbidden')
  if (envelope.finalRenderExportRequest || envelope.productionUnlockRequest) failures.push('final_export_or_production_forbidden')
  return failures
}

const positiveFailures = validateEnvelope(handoffEnvelope)
const rejectionCases = [
  { id: 'reject_raw_command', patch: { rawCommand: 'gst-launch-1.0 arbitrary ! fakesink' } },
  { id: 'reject_arbitrary_private_media', patch: { privateMediaPath: '/private/user/media/input.mov' } },
  { id: 'reject_route_execution', patch: { routeExecutionRequest: true } },
  { id: 'reject_worker_dispatch', patch: { workerDispatchRequest: true } },
  { id: 'reject_persistent_queue_write', patch: { persistentQueueWriteRequest: true } },
  { id: 'reject_supabase_sql', patch: { supabaseMutationRequest: true, sqlExecutionRequest: true } },
  { id: 'reject_signed_public_artifact', patch: { signedUrl: 'https://example.invalid/signed', publicUrl: 'https://example.invalid/public' } },
  { id: 'reject_final_export_production', patch: { finalRenderExportRequest: true, productionUnlockRequest: true } },
]

const rejectionResults = rejectionCases.map((item) => {
  const failures = validateEnvelope({ ...handoffEnvelope, ...item.patch })
  return {
    id: item.id,
    rejected: failures.length > 0,
    failures,
  }
})

if (positiveFailures.length > 0) {
  failClosed('blocked_narrow_external_agent_runtime_handoff_envelope_validation_failed', {
    runId,
    outputDir,
    positiveFailures,
  })
}

if (rejectionResults.some((item) => !item.rejected)) {
  failClosed('blocked_narrow_external_agent_runtime_negative_case_validation_failed', {
    runId,
    outputDir,
    rejectionResults,
  })
}

const envelopePath = path.join(outputDir, 'narrow-external-agent-runtime-handoff-envelope-validation.json')
const reportPath = path.join(outputDir, 'narrow-external-agent-runtime-dry-run-report.json')
const manifestPath = path.join(outputDir, 'narrow-external-agent-runtime-dry-run-manifest.json')

writeJson(envelopePath, {
  packet,
  runId,
  status: 'passed',
  envelope: handoffEnvelope,
  positiveValidation: 'passed',
  negativeValidation: rejectionResults,
})

writeJson(reportPath, {
  packet,
  runId,
  outputDir,
  decision: 'completed_gstreamer_mkvtoolnix_narrow_external_agent_runtime_dry_run_reference_validation_only',
  execution: 'completed_confirmation_gated_narrow_external_agent_runtime_dry_run_no_route_worker_tool_or_media_execution',
  confirmationGate: `${confirmationEnv}=true`,
  sourceHandoffMergeSha: '8e93c0275e25ba703ddfa7c63c9a6f0403a2ffe7',
  sourceHandoffDecision: sourceRecord.decision,
  handoffStatus: sourceRecord.handoffStatus,
  acceptedEnvelope: {
    externalAgentHandoffId: handoffEnvelope.externalAgentHandoffId,
    approvedSnapshotId: handoffEnvelope.approvedSnapshotId,
    approvalRecordId: handoffEnvelope.approvalRecordId,
    creditPolicyId: handoffEnvelope.creditPolicyId,
    jobId: handoffEnvelope.jobId,
    workerLeaseId: handoffEnvelope.workerLeaseId,
    runtimePacketId: handoffEnvelope.runtimePacketId,
    runtimeExecutionId: handoffEnvelope.runtimeExecutionId,
    idempotencyKey: handoffEnvelope.idempotencyKey,
    dockerNetwork: handoffEnvelope.dockerNetwork,
    allowedCommandTemplates: handoffEnvelope.allowedCommandTemplates,
  },
  rejectionResults,
  safety: {
    liveHttpRouteExecution: false,
    externalAgentRuntimeExecution: false,
    realWorkerDispatch: false,
    workerProcessStarted: false,
    workerExecution: false,
    workerLeaseClaim: false,
    persistentJobQueueWrite: false,
    gstreamerExecution: false,
    mkvtoolnixExecution: false,
    dockerExecution: false,
    ffmpegFfprobeExecution: false,
    remotionExecution: false,
    privateMediaProcessing: false,
    userMediaProcessing: false,
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
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  nextMilestone: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-BRIDGE-IMPLEMENTATION-1',
})

const manifestEntries = [envelopePath, reportPath].map((filePath) => ({
  fileName: path.basename(filePath),
  bytes: fs.statSync(filePath).size,
  sha256: sha256File(filePath),
}))

writeJson(manifestPath, {
  packet,
  runId,
  outputDir,
  files: manifestEntries,
})

const completeManifestEntries = [envelopePath, reportPath, manifestPath].map((filePath) => ({
  fileName: path.basename(filePath),
  bytes: fs.statSync(filePath).size,
  sha256: sha256File(filePath),
}))

writeJson(manifestPath, {
  packet,
  runId,
  outputDir,
  files: completeManifestEntries,
})

console.log(
  JSON.stringify(
    {
      packet,
      decision: 'completed_gstreamer_mkvtoolnix_narrow_external_agent_runtime_dry_run_reference_validation_only',
      runId,
      outputDir,
      report: reportPath,
      manifest: manifestPath,
      files: completeManifestEntries,
    },
    null,
    2,
  ),
)
