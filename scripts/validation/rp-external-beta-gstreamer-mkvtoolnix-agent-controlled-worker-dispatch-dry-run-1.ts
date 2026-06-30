import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { createMockDatabase } from '../../src/backend/mock/mock-database'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_EXECUTION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_NEXT_MILESTONE,
  buildGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput,
  createGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunMetadata,
  summarizeGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunBoundary,
} from '../../server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-CONTROLLED-WORKER-DISPATCH-DRY-RUN-1'
const blockedDecision = 'blocked_pending_gstreamer_mkvtoolnix_agent_controlled_worker_dispatch_dry_run_confirmation'
const integrationBase = 'cc18a07622a3107c589d2d2957432026da27b8cd'
const queuePr = 1902
const queueMergeSha = 'cc18a07622a3107c589d2d2957432026da27b8cd'
const queueRunId = '2026-06-30T19-45-59-915Z-af80c9f8'
const controlledDispatchPr = 1896
const controlledDispatchMergeSha = '30b06246fe4a3b2834217279816777dc1d721b53'
const controlledDispatchRunId = '2026-06-30T18-50-40-467Z-7ae8262d'
const outputRoot = '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1'
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
  controlledWorkerDispatchDryRunMetadataOnly: true,
  routeExecution: false,
  workerDispatch: false,
  workerExecution: false,
  workerLeaseClaim: false,
  gstreamerExecutionInThisDispatchDryRun: false,
  mkvtoolnixExecutionInThisDispatchDryRun: false,
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
      env: `${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_CONFIRM_ENV}=true`,
      observed:
        process.env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_CONFIRM_ENV] === 'true'
          ? 'present_true'
          : 'absent_or_not_true',
    },
    sourceChain: {
      agentControlledWorkerQueuePr: queuePr,
      agentControlledWorkerQueueMergeSha: queueMergeSha,
      agentControlledWorkerQueueRunId: queueRunId,
      agentControlledWorkerQueueDecision: 'completed_gstreamer_mkvtoolnix_agent_controlled_worker_queue_integration_metadata_only',
      agentControlledDispatchPr: controlledDispatchPr,
      agentControlledDispatchMergeSha: controlledDispatchMergeSha,
      agentControlledDispatchRunId: controlledDispatchRunId,
      agentControlledDispatchDecision: 'completed_gstreamer_mkvtoolnix_agent_execution_bridge_controlled_dispatch_boundary',
      excludedRemotionPr: '#577 open_draft_blocked_excluded',
    },
    safety,
    productReadyEndToEndLocalOssTools: 0,
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_NEXT_MILESTONE,
    ...overrides,
  }
}

function finish(report: Record<string, unknown>, exitCode: number): void {
  fs.mkdirSync(outputDir, { recursive: true })
  const reportPath = path.join(outputDir, 'gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1-report.json')
  writeJson(reportPath, report)

  const files = [
    reportPath,
    typeof report.dispatchDryRunEnvelopePath === 'string' ? report.dispatchDryRunEnvelopePath : undefined,
    typeof report.outputManifestPath === 'string' ? report.outputManifestPath : undefined,
    typeof report.qaReportPath === 'string' ? report.qaReportPath : undefined,
  ].filter((file): file is string => Boolean(file))

  const manifestPath = path.join(outputDir, 'gstreamer-mkvtoolnix-agent-controlled-worker-dispatch-dry-run-1-manifest.json')
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

if (process.env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_CONFIRM_ENV] !== 'true') {
  finish(
    baseReport({
      decision: blockedDecision,
      execution: 'blocked_confirmation_absent_no_controlled_worker_dispatch_dry_run',
      workerDispatchDryRun: {
        status: 'not_run_confirmation_absent',
        blocker: blockedDecision,
        dispatchDryRunEnvelope: 'not_run_confirmation_absent',
        routeExecution: 'not_run_confirmation_absent',
        workerDispatch: 'not_run_confirmation_absent',
        workerExecution: 'not_run_confirmation_absent',
        workerLeaseClaim: 'not_run_confirmation_absent',
        toolExecution: 'not_run_confirmation_absent',
      },
      validation: 'blocked_confirmation_absent',
    }),
    2,
  )
}

const dryRunInput = buildGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunInput()
const dryRunResult = createGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunMetadata(
  createMockDatabase(),
  dryRunInput,
)

const dispatchDryRunEnvelope = {
  envelopeId: 'agent-controlled-worker-dispatch-dry-run-1-envelope',
  status: dryRunResult.ok
    ? 'dispatched_controlled_worker_dispatch_dry_run_metadata_only'
    : 'blocked_controlled_worker_dispatch_dry_run_boundary_validation',
  sanitizedDispatchDryRun: dryRunResult.sanitizedDispatchDryRun,
  queueItem: dryRunResult.queueItem
    ? {
      id: dryRunResult.queueItem.id,
      jobId: dryRunResult.queueItem.jobId,
      workerKind: dryRunResult.queueItem.workerKind,
      queueStatus: dryRunResult.queueItem.queueStatus,
      gateStatus: dryRunResult.queueItem.gateCheck.gateStatus,
      gateMessage: dryRunResult.queueItem.gateCheck.message,
      mockOnly: dryRunResult.queueItem.mockOnly,
      payloadMockOnly: dryRunResult.queueItem.payload.mockOnly,
    }
    : null,
  blockers: dryRunResult.blockers,
  boundary: summarizeGstreamerMkvtoolnixAgentControlledWorkerDispatchDryRunBoundary(),
  routeExecuted: false,
  workerDispatched: false,
  workerExecuted: false,
  workerLeaseClaimed: false,
  toolsExecuted: false,
  persistentQueueWrite: false,
}
const dispatchDryRunEnvelopePath = path.join(outputDir, 'dispatch-dry-run-envelope.json')
writeJson(dispatchDryRunEnvelopePath, dispatchDryRunEnvelope)

const outputManifest = {
  manifestId: 'output-manifest-agent-controlled-worker-dispatch-dry-run-1',
  status: 'validated_schema_only_no_runtime_outputs_created',
  controlledWorkerDispatchDryRunMetadataOnly: true,
  workerDispatch: false,
  workerExecution: false,
  workerLeaseClaim: false,
  publicArtifacts: false,
  signedUrls: false,
  finalRenderExport: false,
  files: [],
}
const outputManifestPath = path.join(outputDir, 'output-manifest.json')
writeJson(outputManifestPath, outputManifest)

const qaReport = {
  reportId: 'qa-report-agent-controlled-worker-dispatch-dry-run-1',
  status: dryRunResult.ok
    ? 'passed_controlled_worker_dispatch_dry_run_metadata_boundary_validation_only'
    : 'blocked_controlled_worker_dispatch_dry_run_metadata_boundary_validation',
  checks: [
    'confirmation_gate_present',
    'controlled_worker_queue_source_present',
    'queued_local_mock_queue_item_present',
    'approved_snapshot_reference_present',
    'approval_record_reference_present',
    'credit_or_no_spend_policy_reference_present',
    'job_reference_present',
    'worker_lease_reference_preserved_not_claimed',
    'route_idempotency_key_present',
    'dispatch_idempotency_key_present',
    'queue_idempotency_key_present',
    'dispatch_dry_run_idempotency_key_present',
    'dispatch_contract_present',
    'output_manifest_schema_present',
    'qa_report_schema_present',
    'cleanup_retention_failure_retry_policy_refs_present',
    'non_public_artifact_policy_present',
    'no_persistent_queue_write',
    'no_worker_dispatch_worker_execution_or_tool_execution',
  ],
  blockers: dryRunResult.blockers,
}
const qaReportPath = path.join(outputDir, 'qa-report.json')
writeJson(qaReportPath, qaReport)

const validationStatus = dryRunResult.ok ? 'passed' : 'blocked_controlled_worker_dispatch_dry_run_validation'
finish(
  baseReport({
    decision: dryRunResult.ok ? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_DECISION : dryRunResult.status,
    execution: dryRunResult.ok
      ? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_EXECUTION
      : 'blocked_controlled_worker_dispatch_dry_run_boundary_validation',
    workerDispatchDryRun: {
      status: dryRunResult.status,
      controlledWorkerQueueStatus: dryRunResult.controlledWorkerQueueStatus,
      confirmationGate: `${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_WORKER_DISPATCH_DRY_RUN_CONFIRM_ENV}=true`,
      dispatchDryRunId: dryRunResult.sanitizedDispatchDryRun.dispatchDryRunId,
      dispatchDryRunMode: dryRunResult.sanitizedDispatchDryRun.dispatchDryRunMode,
      dispatchDryRunIdempotencyKey: dryRunResult.sanitizedDispatchDryRun.dispatchDryRunIdempotencyKey,
      dispatchContractId: dryRunResult.sanitizedDispatchDryRun.dispatchContractId,
      dispatchAuditEventId: dryRunResult.sanitizedDispatchDryRun.dispatchAuditEventId,
      workerRuntimeMode: dryRunResult.sanitizedDispatchDryRun.workerRuntimeMode,
      workerRuntimePacketId: dryRunResult.sanitizedDispatchDryRun.workerRuntimePacketId,
      queueStatusAtDryRun: dryRunResult.sanitizedDispatchDryRun.queueStatusAtDryRun,
      queueItemId: dryRunResult.sanitizedDispatchDryRun.queueItemId,
      queueId: dryRunResult.sanitizedDispatchDryRun.queueId,
      queueIdempotencyKey: dryRunResult.sanitizedDispatchDryRun.queueIdempotencyKey,
      approvedSnapshotId: dryRunResult.sanitizedDispatchDryRun.approvedSnapshotId,
      approvalRecordId: dryRunResult.sanitizedDispatchDryRun.approvalRecordId,
      creditPolicyRef: dryRunResult.sanitizedDispatchDryRun.creditPolicyRef,
      creditPolicyMode: dryRunResult.sanitizedDispatchDryRun.creditPolicyMode,
      jobId: dryRunResult.sanitizedDispatchDryRun.jobId,
      workerLeaseId: dryRunResult.sanitizedDispatchDryRun.workerLeaseId,
      routeIdempotencyKey: dryRunResult.sanitizedDispatchDryRun.routeIdempotencyKey,
      commandTemplateId: dryRunResult.sanitizedDispatchDryRun.commandTemplateId,
      privateInputManifestId: dryRunResult.sanitizedDispatchDryRun.privateInputManifestId,
      outputManifestSchemaId: dryRunResult.sanitizedDispatchDryRun.outputManifestSchemaId,
      qaReportSchemaId: dryRunResult.sanitizedDispatchDryRun.qaReportSchemaId,
      dryRunDispatchEnvelopeCreated: dryRunResult.sanitizedDispatchDryRun.dryRunDispatchEnvelopeCreated,
      dryRunDispatchAccepted: dryRunResult.sanitizedDispatchDryRun.dryRunDispatchAccepted,
      routeExecution: 'not_run_controlled_worker_dispatch_dry_run_metadata_only',
      workerDispatch: 'not_run_controlled_worker_dispatch_dry_run_metadata_only',
      workerExecution: 'not_run_controlled_worker_dispatch_dry_run_metadata_only',
      workerLeaseClaim: 'not_run_controlled_worker_dispatch_dry_run_metadata_only',
      toolExecution: 'not_run_controlled_worker_dispatch_dry_run_metadata_only',
      persistentJobQueueWrite: 'not_run_controlled_worker_dispatch_dry_run_metadata_only',
      nextSourceStatus: 'ready_for_agent_controlled_worker_runtime_execution_packet',
    },
    queueItem: dryRunResult.queueItem
      ? {
        id: dryRunResult.queueItem.id,
        jobId: dryRunResult.queueItem.jobId,
        workerKind: dryRunResult.queueItem.workerKind,
        queueStatus: dryRunResult.queueItem.queueStatus,
        gateStatus: dryRunResult.queueItem.gateCheck.gateStatus,
        mockOnly: dryRunResult.queueItem.mockOnly,
        payloadMockOnly: dryRunResult.queueItem.payload.mockOnly,
      }
      : null,
    dispatchDryRunEnvelopePath,
    outputManifestPath,
    qaReportPath,
    validation: validationStatus,
  }),
  dryRunResult.ok ? 0 : 1,
)
