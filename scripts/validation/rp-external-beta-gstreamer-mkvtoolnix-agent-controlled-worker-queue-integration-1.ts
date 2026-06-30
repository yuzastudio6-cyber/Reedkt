import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { createMockDatabase } from '../../src/backend/mock/mock-database'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_EXECUTION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_NEXT_MILESTONE,
  buildGstreamerMkvtoolnixAgentControlledWorkerQueueInput,
  queueGstreamerMkvtoolnixAgentControlledWorkerQueueMetadataMock,
  summarizeGstreamerMkvtoolnixAgentControlledWorkerQueueBoundary,
} from '../../server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-CONTROLLED-WORKER-QUEUE-INTEGRATION-1'
const blockedDecision = 'blocked_pending_gstreamer_mkvtoolnix_agent_controlled_worker_queue_confirmation'
const integrationBase = '30b06246fe4a3b2834217279816777dc1d721b53'
const controlledDispatchRunId = '2026-06-30T18-50-40-467Z-7ae8262d'
const controlledDispatchMergeSha = '30b06246fe4a3b2834217279816777dc1d721b53'
const dryRunMergeSha = 'd5d0ab318eb98f5b08f3e6dce9c1e87cb5d6bc7f'
const bridgeMergeSha = '4effa512450664c648db9cf9e95b0653de41e96d'
const runtimeMergeSha = '4dec43f1edce87531eee61a7704b58545afd50b9'
const runtimeRunId = '2026-06-30T16-19-10-513Z-a91246d2'
const outputRoot = '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(outputRoot, runId)

function sha256File(file: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function writeJson(file: string, value: unknown): void {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function artifact(file: string): { fileName: string; bytes: number; sha256: string } {
  return {
    fileName: path.basename(file),
    bytes: fs.statSync(file).size,
    sha256: sha256File(file),
  }
}

const safety = {
  localMockQueueMetadataOnly: true,
  routeExecution: false,
  workerDispatch: false,
  workerExecution: false,
  gstreamerExecutionInThisQueueIntegration: false,
  mkvtoolnixExecutionInThisQueueIntegration: false,
  privateMediaProcessing: false,
  userMediaProcessing: false,
  mediaProcessing: false,
  persistentJobQueueWrite: false,
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

function baseReport(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    packet,
    integrationBase,
    runId,
    outputDir,
    confirmationGate: {
      env: `${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_CONFIRM_ENV}=true`,
      observed:
        process.env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_CONFIRM_ENV] === 'true'
          ? 'present_true'
          : 'absent_or_not_true',
    },
    sourceChain: {
      agentControlledWorkerQueueBase: integrationBase,
      agentControlledDispatchPr: 1896,
      agentControlledDispatchMergeSha: controlledDispatchMergeSha,
      agentControlledDispatchRunId: controlledDispatchRunId,
      agentControlledDispatchDecision: 'completed_gstreamer_mkvtoolnix_agent_execution_bridge_controlled_dispatch_boundary',
      agentExecutionBridgeDryRunPr: 1892,
      agentExecutionBridgeDryRunMergeSha: dryRunMergeSha,
      agentExecutionBridgePr: 1887,
      agentExecutionBridgeMergeSha: bridgeMergeSha,
      runtimeExecutionImplementationPr: 1882,
      runtimeExecutionImplementationMergeSha: runtimeMergeSha,
      runtimeExecutionRunId: runtimeRunId,
      excludedRemotionPr: '#577 open_draft_blocked_excluded',
    },
    safety,
    productReadyEndToEndLocalOssTools: 0,
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_NEXT_MILESTONE,
    ...overrides,
  }
}

function finish(report: Record<string, unknown>, exitCode: number): void {
  fs.mkdirSync(outputDir, { recursive: true })
  const reportPath = path.join(outputDir, 'gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1-report.json')
  writeJson(reportPath, report)

  const files = [
    reportPath,
    typeof report.queueEnvelopePath === 'string' ? report.queueEnvelopePath : undefined,
    typeof report.outputManifestPath === 'string' ? report.outputManifestPath : undefined,
    typeof report.qaReportPath === 'string' ? report.qaReportPath : undefined,
  ].filter((file): file is string => Boolean(file))

  const manifestPath = path.join(outputDir, 'gstreamer-mkvtoolnix-agent-controlled-worker-queue-integration-1-manifest.json')
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

if (process.env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_CONFIRM_ENV] !== 'true') {
  finish(
    baseReport({
      decision: blockedDecision,
      execution: 'blocked_confirmation_absent_no_controlled_worker_queue_integration',
      workerQueueIntegration: {
        status: 'not_run_confirmation_absent',
        blocker: blockedDecision,
        localMockQueueMetadata: 'not_run_confirmation_absent',
        routeExecution: 'not_run_confirmation_absent',
        workerDispatch: 'not_run_confirmation_absent',
        workerExecution: 'not_run_confirmation_absent',
        toolExecution: 'not_run_confirmation_absent',
      },
      validation: 'blocked_confirmation_absent',
    }),
    2,
  )
}

const queueInput = buildGstreamerMkvtoolnixAgentControlledWorkerQueueInput()
const queueResult = queueGstreamerMkvtoolnixAgentControlledWorkerQueueMetadataMock(createMockDatabase(), queueInput)

const queueEnvelope = {
  envelopeId: 'agent-controlled-worker-queue-integration-1-envelope',
  status: queueResult.ok
    ? 'queued_controlled_worker_queue_metadata_only'
    : 'blocked_controlled_worker_queue_boundary_validation',
  sanitizedQueue: queueResult.sanitizedQueue,
  queueItem: queueResult.queueItem
    ? {
      id: queueResult.queueItem.id,
      jobId: queueResult.queueItem.jobId,
      workerKind: queueResult.queueItem.workerKind,
      queueStatus: queueResult.queueItem.queueStatus,
      gateStatus: queueResult.queueItem.gateCheck.gateStatus,
      gateMessage: queueResult.queueItem.gateCheck.message,
      mockOnly: queueResult.queueItem.mockOnly,
      payloadMockOnly: queueResult.queueItem.payload.mockOnly,
    }
    : null,
  blockers: queueResult.blockers,
  boundary: summarizeGstreamerMkvtoolnixAgentControlledWorkerQueueBoundary(),
  routeExecuted: false,
  workerDispatched: false,
  workerExecuted: false,
  toolsExecuted: false,
  persistentQueueWrite: false,
}
const queueEnvelopePath = path.join(outputDir, 'queue-envelope.json')
writeJson(queueEnvelopePath, queueEnvelope)

const outputManifest = {
  manifestId: 'output-manifest-agent-controlled-worker-queue-integration-1',
  status: 'validated_schema_only_no_runtime_outputs_created',
  localMockQueueMetadataOnly: true,
  workerDispatch: false,
  publicArtifacts: false,
  signedUrls: false,
  finalRenderExport: false,
  files: [],
}
const outputManifestPath = path.join(outputDir, 'output-manifest.json')
writeJson(outputManifestPath, outputManifest)

const qaReport = {
  reportId: 'qa-report-agent-controlled-worker-queue-integration-1',
  status: queueResult.ok
    ? 'passed_controlled_worker_queue_metadata_boundary_validation_only'
    : 'blocked_controlled_worker_queue_metadata_boundary_validation',
  checks: [
    'confirmation_gate_present',
    'controlled_dispatch_source_present',
    'approved_snapshot_reference_present',
    'approval_record_reference_present',
    'credit_or_no_spend_policy_reference_present',
    'job_reference_present',
    'worker_lease_reference_present',
    'route_idempotency_key_present',
    'dispatch_idempotency_key_present',
    'queue_idempotency_key_present',
    'queue_contract_present',
    'retry_failure_audit_policy_refs_present',
    'non_public_artifact_policy_present',
    'local_mock_queue_item_created',
    'no_persistent_queue_write',
    'no_worker_dispatch_or_tool_execution',
  ],
  blockers: queueResult.blockers,
}
const qaReportPath = path.join(outputDir, 'qa-report.json')
writeJson(qaReportPath, qaReport)

const validationStatus = queueResult.ok ? 'passed' : 'blocked_controlled_worker_queue_validation'
finish(
  baseReport({
    decision: queueResult.ok ? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_DECISION : queueResult.status,
    execution: queueResult.ok
      ? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_EXECUTION
      : 'blocked_controlled_worker_queue_boundary_validation',
    workerQueueIntegration: {
      status: queueResult.status,
      controlledDispatchStatus: queueResult.controlledDispatchStatus,
      confirmationGate: `${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_QUEUE_CONFIRM_ENV}=true`,
      localMockQueueItemCreated: queueResult.sanitizedQueue.localMockQueueItemCreated,
      queueStatus: queueResult.sanitizedQueue.queueStatus,
      queueId: queueResult.sanitizedQueue.queueId,
      queueMode: queueResult.sanitizedQueue.queueMode,
      queueIdempotencyKey: queueResult.sanitizedQueue.queueIdempotencyKey,
      queueContractId: queueResult.sanitizedQueue.queueContractId,
      retryPolicyId: queueResult.sanitizedQueue.retryPolicyId,
      failurePolicyId: queueResult.sanitizedQueue.failurePolicyId,
      auditEventId: queueResult.sanitizedQueue.auditEventId,
      nonPublicArtifactPolicyId: queueResult.sanitizedQueue.nonPublicArtifactPolicyId,
      routeExecution: 'not_run_controlled_worker_queue_metadata_only',
      workerDispatch: 'not_run_controlled_worker_queue_metadata_only',
      workerExecution: 'not_run_controlled_worker_queue_metadata_only',
      toolExecution: 'not_run_controlled_worker_queue_metadata_only',
      persistentJobQueueWrite: 'not_run_local_mock_queue_metadata_only',
      nextSourceStatus: queueResult.ok
        ? 'ready_for_agent_controlled_worker_dispatch_dry_run'
        : queueResult.status,
    },
    queueEnvelopePath,
    outputManifestPath,
    qaReportPath,
    queueEnvelopeSha256: sha256File(queueEnvelopePath),
    outputManifestSha256: sha256File(outputManifestPath),
    qaReportSha256: sha256File(qaReportPath),
    validation: validationStatus,
  }),
  queueResult.ok ? 0 : 1,
)
