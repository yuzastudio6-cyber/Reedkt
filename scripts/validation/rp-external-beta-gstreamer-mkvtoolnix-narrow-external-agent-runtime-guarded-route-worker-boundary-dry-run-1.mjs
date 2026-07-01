#!/usr/bin/env node
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-BOUNDARY-DRY-RUN-1'
const confirmationEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_NARROW_ROUTE_WORKER_BOUNDARY_DRY_RUN'
const blockedDecision = 'blocked_pending_gstreamer_mkvtoolnix_narrow_route_worker_boundary_dry_run_confirmation'
const decision = 'completed_gstreamer_mkvtoolnix_narrow_route_worker_boundary_noop_dry_run'
const execution =
  'completed_confirmation_gated_narrow_route_worker_boundary_noop_dry_run_no_route_worker_tool_or_media_execution'
const sourceRecordPath =
  'docs/external-beta/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1/gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-1-record.json'
const outputRoot =
  '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-narrow-external-agent-runtime-guarded-route-worker-boundary-dry-run-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(outputRoot, runId)
const nextMilestone =
  'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-NARROW-EXTERNAL-AGENT-RUNTIME-GUARDED-ROUTE-WORKER-BOUNDARY-QA-ROLLUP-1'

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

function failClosed(blocker, details = {}) {
  console.error(
    JSON.stringify(
      {
        packet,
        decision: blockedDecision,
        execution: 'blocked_confirmation_absent_no_boundary_dry_run',
        status: 'blocked',
        blocker,
        confirmationGate: `${confirmationEnv}=true`,
        ...details,
      },
      null,
      2,
    ),
  )
  process.exit(2)
}

function readJson(file) {
  if (!fs.existsSync(file)) {
    failClosed('blocked_missing_narrow_route_worker_boundary_source_record', { sourceRecordPath: file })
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

if (process.env[confirmationEnv] !== 'true') {
  failClosed(blockedDecision)
}

const sourceRecord = readJson(sourceRecordPath)
if (sourceRecord.nextMilestone !== packet) {
  failClosed('blocked_narrow_route_worker_boundary_source_not_ready_for_dry_run', {
    observedNextMilestone: sourceRecord.nextMilestone,
  })
}
if (sourceRecord.boundary?.status !== 'ready_for_confirmation_gated_narrow_route_worker_boundary_noop_dry_run') {
  failClosed('blocked_narrow_route_worker_boundary_source_not_ready_for_dry_run', {
    observedBoundaryStatus: sourceRecord.boundary?.status,
  })
}

const safety = {
  routeRegisteredInThisDryRunPhase: false,
  routeEnabledInThisDryRunPhase: false,
  routeExecutionInThisDryRunPhase: false,
  workerDispatchInThisDryRunPhase: false,
  workerExecutionInThisDryRunPhase: false,
  workerProcessStartedInThisDryRunPhase: false,
  workerLeaseClaimInThisDryRunPhase: false,
  persistentJobQueueWriteInThisDryRunPhase: false,
  serviceRoleSecretPayloadAccessInThisDryRunPhase: false,
  frontendCredentialExposureInThisDryRunPhase: false,
  broadServiceRoleHandlerInThisDryRunPhase: false,
  gstreamerExecutionInThisDryRunPhase: false,
  mkvtoolnixExecutionInThisDryRunPhase: false,
  dockerExecutionInThisDryRunPhase: false,
  ffmpegFfprobeExecutionInThisDryRunPhase: false,
  remotionExecutionInThisDryRunPhase: false,
  privateMediaProcessingInThisDryRunPhase: false,
  userMediaProcessingInThisDryRunPhase: false,
  mediaProcessingInThisDryRunPhase: false,
  supabaseMutationInThisDryRunPhase: false,
  sqlExecutionInThisDryRunPhase: false,
  signedUrlCreationInThisDryRunPhase: false,
  publicArtifactCreationInThisDryRunPhase: false,
  finalRenderExportInThisDryRunPhase: false,
  broadExternalBetaUnlockInThisDryRunPhase: false,
  paidProductionUnlockInThisDryRunPhase: false,
  productionUnlockInThisDryRunPhase: false,
  packageLockMutation: false,
  dependencyMutation: false,
}

const requiredBoundaryFields = [
  'status',
  'routeBoundaryMode',
  'workerBoundaryMode',
  'futureDryRunConfirmationGate',
  'proposedRouteId',
  'proposedRoutePath',
  'proposedRouteOwner',
  'boundaryId',
  'boundaryIdempotencyKey',
]

function validateBoundaryEnvelope(envelope) {
  const failures = []
  for (const field of requiredBoundaryFields) {
    if (typeof envelope[field] !== 'string' || envelope[field].trim().length === 0) {
      failures.push(`missing_${field}`)
    }
  }
  if (envelope.status !== 'ready_for_confirmation_gated_narrow_route_worker_boundary_noop_dry_run') {
    failures.push('invalid_boundary_status')
  }
  if (envelope.routeBoundaryMode !== 'noop_validation_only') failures.push('route_boundary_mode_not_noop')
  if (envelope.workerBoundaryMode !== 'not_dispatched_boundary_only') failures.push('worker_boundary_mode_not_boundary_only')
  if (envelope.proposedRouteOwner !== 'backend_service_role_only') failures.push('route_owner_not_backend_service_role_only')
  if (envelope.futureDryRunConfirmationGate !== `${confirmationEnv}=true`) failures.push('confirmation_gate_mismatch')
  for (const flag of [
    'routeRegistered',
    'routeEnabled',
    'routeExecution',
    'workerDispatch',
    'workerExecution',
    'workerProcessStart',
    'workerLeaseClaim',
    'persistentQueueWrite',
    'serviceRoleSecretPayloadAccess',
    'frontendCredentialExposure',
    'broadServiceRoleHandler',
    'gstreamerExecution',
    'mkvtoolnixExecution',
    'dockerExecution',
    'ffmpegFfprobeExecution',
    'remotionExecution',
    'mediaProcessing',
    'privateMediaProcessing',
    'userMediaProcessing',
    'supabaseMutation',
    'sqlExecution',
    'signedUrlCreation',
    'publicArtifactCreation',
    'finalRenderExport',
    'broadExternalBetaUnlock',
    'paidProductionUnlock',
    'productionUnlock',
  ]) {
    if (envelope[flag] === true) failures.push(`${flag}_forbidden`)
  }
  if (envelope.rawCommand || envelope.command || envelope.args) failures.push('raw_command_material_forbidden')
  if (envelope.privateMediaPath || envelope.userMediaPath || envelope.publicUrl || envelope.signedUrl) {
    failures.push('media_or_url_source_forbidden')
  }
  return failures
}

const boundaryEnvelope = {
  dryRunId: `dry-run-${sourceRecord.boundary.boundaryId}`,
  dryRunMode: 'noop_boundary_validation_only',
  confirmationGate: `${confirmationEnv}=true`,
  sourcePacket: sourceRecord.packet,
  sourceDecision: sourceRecord.decision,
  sourceExecution: sourceRecord.execution,
  sourceBoundaryMergeSha: '64ac4a5f8bd02b28533d3e8c1d6e2e65aca430c7',
  sourceChain: sourceRecord.sourceChain,
  ...sourceRecord.boundary,
  workerProcessStart: false,
  workerLeaseClaim: false,
  serviceRoleSecretPayloadAccess: false,
  frontendCredentialExposure: false,
  broadServiceRoleHandler: false,
  gstreamerExecution: false,
  mkvtoolnixExecution: false,
  dockerExecution: false,
  ffmpegFfprobeExecution: false,
  remotionExecution: false,
  mediaProcessing: false,
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
}

const positiveFailures = validateBoundaryEnvelope(boundaryEnvelope)
const rejectionCases = [
  { id: 'reject_missing_boundary_reference', patch: { boundaryId: '' } },
  { id: 'reject_route_registered', patch: { routeRegistered: true } },
  { id: 'reject_route_enabled', patch: { routeEnabled: true } },
  { id: 'reject_route_execution', patch: { routeExecution: true } },
  { id: 'reject_worker_dispatch', patch: { workerDispatch: true } },
  { id: 'reject_worker_execution', patch: { workerExecution: true } },
  { id: 'reject_worker_lease_claim', patch: { workerLeaseClaim: true } },
  { id: 'reject_persistent_queue_write', patch: { persistentQueueWrite: true } },
  { id: 'reject_tool_execution', patch: { gstreamerExecution: true, mkvtoolnixExecution: true } },
  { id: 'reject_supabase_sql', patch: { supabaseMutation: true, sqlExecution: true } },
  { id: 'reject_signed_public_artifact', patch: { signedUrlCreation: true, publicArtifactCreation: true } },
  { id: 'reject_final_export_unlock', patch: { finalRenderExport: true, productionUnlock: true } },
]

const rejectionResults = rejectionCases.map((item) => {
  const failures = validateBoundaryEnvelope({ ...boundaryEnvelope, ...item.patch })
  return {
    id: item.id,
    rejected: failures.length > 0,
    failures,
  }
})

if (positiveFailures.length > 0) {
  failClosed('blocked_narrow_route_worker_boundary_dry_run_positive_validation_failed', {
    runId,
    outputDir,
    positiveFailures,
  })
}

if (rejectionResults.some((item) => !item.rejected)) {
  failClosed('blocked_narrow_route_worker_boundary_dry_run_negative_case_validation_failed', {
    runId,
    outputDir,
    rejectionResults,
  })
}

const envelopePath = path.join(outputDir, 'narrow-route-worker-boundary-dry-run-envelope.json')
const reportPath = path.join(outputDir, 'narrow-route-worker-boundary-dry-run-report.json')
const manifestPath = path.join(outputDir, 'narrow-route-worker-boundary-dry-run-manifest.json')

writeJson(envelopePath, {
  packet,
  runId,
  status: 'passed',
  boundaryEnvelope,
  positiveBoundaryValidation: 'passed',
  negativeBoundaryValidation: rejectionResults,
})

writeJson(reportPath, {
  packet,
  runId,
  outputDir,
  decision,
  execution,
  confirmationGate: `${confirmationEnv}=true`,
  sourceBoundaryMergeSha: '64ac4a5f8bd02b28533d3e8c1d6e2e65aca430c7',
  sourceBoundaryDecision: sourceRecord.decision,
  sourceBoundaryStatus: sourceRecord.boundary.status,
  dryRun: {
    mode: 'noop_boundary_validation_only',
    positiveBoundaryValidation: 'passed',
    negativeBoundaryValidation: 'passed',
    rejectedCases: rejectionResults.map((item) => item.id),
    routeRegistered: false,
    routeEnabled: false,
    routeExecution: false,
    workerDispatch: false,
    workerExecution: false,
    workerProcessStart: false,
    workerLeaseClaim: false,
    persistentQueueWrite: false,
  },
  acceptedBoundary: {
    boundaryId: boundaryEnvelope.boundaryId,
    proposedRouteId: boundaryEnvelope.proposedRouteId,
    proposedRoutePath: boundaryEnvelope.proposedRoutePath,
    proposedRouteOwner: boundaryEnvelope.proposedRouteOwner,
    routeBoundaryMode: boundaryEnvelope.routeBoundaryMode,
    workerBoundaryMode: boundaryEnvelope.workerBoundaryMode,
    boundaryIdempotencyKey: boundaryEnvelope.boundaryIdempotencyKey,
  },
  safety,
  productReadyEndToEndLocalOssTools: 0,
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  nextMilestone,
})

const files = [envelopePath, reportPath]
writeJson(manifestPath, {
  packet,
  runId,
  outputDir,
  decision,
  execution,
  artifacts: files.map((file) => artifact(file)),
  manifestFileChecksumRecordedInCommittedDocs: true,
})

console.log(
  JSON.stringify(
    {
      packet,
      decision,
      execution,
      runId,
      outputDir,
      report: reportPath,
      manifest: manifestPath,
      artifacts: [...files, manifestPath].map((file) => artifact(file)),
    },
    null,
    2,
  ),
)
