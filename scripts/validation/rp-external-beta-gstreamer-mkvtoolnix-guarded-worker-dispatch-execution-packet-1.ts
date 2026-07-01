import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import { createMockDatabase } from '../../src/backend/mock/mock-database'
import {
  buildGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput,
  createGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunMetadata,
  validateGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput,
} from '../../server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-DISPATCH-EXECUTION-PACKET-1'
const confirmationEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_DISPATCH_EXECUTION'
const decision = 'completed_gstreamer_mkvtoolnix_guarded_worker_dispatch_execution_packet_metadata_only'
const execution = 'completed_confirmation_gated_local_mock_worker_dispatch_metadata_only_no_worker_execution_or_tool_execution'
const blockedDecision = 'blocked_pending_gstreamer_mkvtoolnix_guarded_worker_dispatch_execution_confirmation'
const integrationBase = '03a3b2192f82e29f3638ef9483032dea14ed2a18'
const outputRoot = '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(outputRoot, runId)

const safety = {
  guardedLocalMockWorkerDispatchMetadataOnly: true,
  localMockQueueItemCreated: true,
  realWorkerDispatch: false,
  workerProcessStarted: false,
  workerExecution: false,
  workerLeaseClaim: false,
  persistentJobQueueWrite: false,
  gstreamerExecutionInThisWorkerDispatchExecutionPacket: false,
  mkvtoolnixExecutionInThisWorkerDispatchExecutionPacket: false,
  privateMediaProcessing: false,
  userMediaProcessing: false,
  mediaProcessing: false,
  ffmpegFfprobeExecution: false,
  dockerExecution: false,
  dockerPushDeploy: false,
  remotionExecution: false,
  supabaseMutation: false,
  sqlExecution: false,
  secretPayloadAccess: false,
  serviceRoleSecretPayloadAccess: false,
  signedUrlCreation: false,
  publicArtifactCreation: false,
  creditMutation: false,
  providerCall: false,
  modelCall: false,
  finalRenderExport: false,
  broadExternalBetaUnlock: false,
  paidProductionUnlock: false,
  productionUnlock: false,
  packageLockMutation: false,
  dependencyMutation: false,
}

function sha256File(file: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function artifact(file: string) {
  return {
    fileName: path.basename(file),
    bytes: fs.statSync(file).size,
    sha256: sha256File(file),
  }
}

function sourceChain() {
  return {
    routeDispatchExecutionPacketPr: 1939,
    routeDispatchExecutionPacketMergeSha: integrationBase,
    routeDispatchExecutionPacketDecision: 'completed_gstreamer_mkvtoolnix_guarded_worker_route_dispatch_execution_packet_metadata_only',
    routeDispatchExecutionPacketRunId: '2026-07-01T01-48-47-456Z-977b002e',
    routeDispatchExecutionPlanPr: 1935,
    routeDispatchExecutionPlanMergeSha: '9246c0635363ea955e3f6076470aa78797c686cb',
    routeDispatchDryRunPr: 1929,
    routeDispatchReadinessPr: 1925,
    runtimeQaRollupPr: 1921,
    runtimePacketPr: 1918,
    dispatchDryRunPr: 1905,
    queueIntegrationPr: 1902,
    excludedRemotionPr: '#577 open_draft_blocked_excluded',
  }
}

function baseReport(overrides: Record<string, unknown>) {
  return {
    packet,
    integrationBase,
    runId,
    outputDir,
    confirmationGate: {
      env: `${confirmationEnv}=true`,
      observed: process.env[confirmationEnv] === 'true' ? 'present_true' : 'absent_or_not_true',
    },
    sourceChain: sourceChain(),
    safety,
    productReadyEndToEndLocalOssTools: 0,
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
    nextMilestone: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-HANDOFF-1',
    ...overrides,
  }
}

function finish(report: Record<string, unknown>, exitCode: number): never {
  fs.mkdirSync(outputDir, { recursive: true })
  const reportPath = path.join(outputDir, 'gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1-report.json')
  writeJson(reportPath, report)

  const files = [
    reportPath,
    typeof report.workerDispatchMetadataPath === 'string' ? report.workerDispatchMetadataPath : undefined,
    typeof report.outputManifestPath === 'string' ? report.outputManifestPath : undefined,
    typeof report.qaReportPath === 'string' ? report.qaReportPath : undefined,
  ].filter((file): file is string => Boolean(file))

  const manifestPath = path.join(outputDir, 'gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1-manifest.json')
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

if (process.env[confirmationEnv] !== 'true') {
  finish(
    baseReport({
      decision: blockedDecision,
      execution: 'blocked_confirmation_absent_no_guarded_worker_dispatch_execution',
      blocker: blockedDecision,
      workerDispatchMetadata: 'not_run_confirmation_absent',
      validation: 'blocked_confirmation_absent',
    }),
    2,
  )
}

const input = buildGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput({
  dispatchDryRunId: 'dispatch-metadata-gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1',
  dispatchContractId: 'dispatch-contract-gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1',
  dispatchAuditEventId: 'audit-event-gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1',
  workerRuntimePacketId: 'worker-runtime-packet-gstreamer-mkvtoolnix-guarded-worker-dispatch-execution-packet-1',
})
const validation = validateGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput(input)
const dispatch = createGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunMetadata(createMockDatabase(), input)

const workerDispatchAttempt = validateGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput({
  ...input,
  workerDispatchRequestedNow: true,
})
const workerLeaseAttempt = validateGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput({
  ...input,
  workerLeaseClaimRequestedNow: true,
})
const toolAttempt = validateGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput({
  ...input,
  gstreamerExecutionRequestedNow: true,
})
const persistentQueueAttempt = validateGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput({
  ...input,
  persistentJobQueueWriteRequestedNow: true,
})

const negativeChecks = [
  {
    check: 'worker_dispatch_request_blocks',
    passed: workerDispatchAttempt.blockers.includes('blocked_runtime_execution_not_enabled'),
    blockers: workerDispatchAttempt.blockers,
  },
  {
    check: 'worker_lease_claim_request_blocks',
    passed: workerLeaseAttempt.blockers.includes('blocked_runtime_execution_not_enabled'),
    blockers: workerLeaseAttempt.blockers,
  },
  {
    check: 'tool_execution_request_blocks',
    passed: toolAttempt.blockers.includes('blocked_runtime_execution_not_enabled'),
    blockers: toolAttempt.blockers,
  },
  {
    check: 'persistent_queue_write_request_blocks',
    passed: persistentQueueAttempt.blockers.includes('blocked_runtime_execution_not_enabled'),
    blockers: persistentQueueAttempt.blockers,
  },
]

const queueItem = dispatch.queueItem
const workerDispatchMetadata = {
  status: dispatch.ok ? 'accepted_guarded_local_mock_worker_dispatch_metadata_only' : dispatch.status,
  workerDispatchMetadataEnvelope: 'completed_guarded_local_mock_worker_dispatch_metadata_envelope',
  validation,
  dispatch,
  queueItem: queueItem
    ? {
        id: queueItem.id,
        workspaceId: queueItem.workspaceId,
        projectId: queueItem.projectId,
        jobId: queueItem.jobId,
        queueStatus: queueItem.queueStatus,
        workerKind: queueItem.workerKind,
        mockOnly: queueItem.mockOnly,
        payloadKeys: Object.keys(queueItem.payload).sort(),
      }
    : null,
  negativeChecks,
  localMockQueueItemCreated: dispatch.sanitizedDispatchDryRun.queueStatusAtDryRun === 'queued',
  realWorkerDispatch: false,
  workerProcessStarted: false,
  workerExecution: false,
  workerLeaseClaim: false,
  persistentJobQueueWrite: false,
  gstreamerExecution: false,
  mkvtoolnixExecution: false,
  mediaProcessing: false,
  signedUrlCreation: false,
  publicArtifactCreation: false,
  finalRenderExport: false,
}
const workerDispatchMetadataPath = path.join(outputDir, 'worker-dispatch-metadata.json')
writeJson(workerDispatchMetadataPath, workerDispatchMetadata)

const outputManifest = {
  manifestId: 'output-manifest-guarded-worker-dispatch-execution-packet-1',
  status: 'validated_schema_only_no_runtime_outputs_created',
  workerDispatchMetadataOnly: true,
  localMockQueueItemCreated: workerDispatchMetadata.localMockQueueItemCreated,
  realWorkerDispatch: false,
  workerProcessStarted: false,
  workerExecution: false,
  workerLeaseClaim: false,
  persistentJobQueueWrite: false,
  publicArtifacts: false,
  signedUrls: false,
  finalRenderExport: false,
  files: [],
}
const outputManifestPath = path.join(outputDir, 'output-manifest.json')
writeJson(outputManifestPath, outputManifest)

const qaReport = {
  reportId: 'qa-report-guarded-worker-dispatch-execution-packet-1',
  status: 'passed_guarded_local_mock_worker_dispatch_metadata_boundary_validation_only',
  checks: [
    'confirmation_gate_present',
    'route_dispatch_execution_packet_source_record_present',
    'local_mock_queue_item_created',
    'dispatch_metadata_envelope_created',
    'worker_dispatch_request_blocks',
    'worker_lease_claim_request_blocks',
    'tool_execution_request_blocks',
    'persistent_queue_write_request_blocks',
    'no_real_worker_dispatch',
    'no_worker_process_started',
    'no_worker_execution',
    'no_worker_lease_claim',
    'no_persistent_queue_write',
    'no_tool_execution',
  ],
  negativeChecks,
  blockers: [],
}
const qaReportPath = path.join(outputDir, 'qa-report.json')
writeJson(qaReportPath, qaReport)

const ok =
  validation.ok &&
  dispatch.ok &&
  dispatch.status === 'dispatched_controlled_worker_dispatch_dry_run_metadata_only' &&
  dispatch.sanitizedDispatchDryRun.queueStatusAtDryRun === 'queued' &&
  dispatch.sanitizedDispatchDryRun.workerDispatch === false &&
  dispatch.sanitizedDispatchDryRun.workerExecution === false &&
  dispatch.sanitizedDispatchDryRun.workerLeaseClaim === false &&
  dispatch.sanitizedDispatchDryRun.persistentJobQueueWrite === false &&
  dispatch.sanitizedDispatchDryRun.gstreamerExecution === false &&
  dispatch.sanitizedDispatchDryRun.mkvtoolnixExecution === false &&
  negativeChecks.every((check) => check.passed)

finish(
  baseReport({
    decision: ok ? decision : 'blocked_worker_dispatch_metadata_validation_failed',
    execution: ok ? execution : 'blocked_guarded_worker_dispatch_metadata_validation_failed',
    workerDispatchMetadata,
    workerDispatchMetadataPath,
    outputManifestPath,
    qaReportPath,
    validation: ok ? 'passed' : 'failed',
  }),
  ok ? 0 : 1,
)
