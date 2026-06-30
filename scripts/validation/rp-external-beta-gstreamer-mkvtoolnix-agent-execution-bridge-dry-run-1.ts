import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_NEXT_MILESTONE,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_READY_STATUS,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_RUNTIME_EXECUTION_MERGE_SHA,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_RUNTIME_EXECUTION_RUN_ID,
  buildGstreamerMkvtoolnixAgentExecutionBridgeInput,
  summarizeGstreamerMkvtoolnixAgentExecutionBridgeBoundary,
  validateGstreamerMkvtoolnixAgentExecutionBridgeInput,
} from '../../server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-BRIDGE-DRY-RUN-1'
const decision = 'completed_gstreamer_mkvtoolnix_agent_execution_bridge_dry_run_envelope_validation'
const execution = 'completed_confirmation_gated_agent_execution_bridge_dry_run_no_route_worker_dispatch_or_tool_execution'
const blockedDecision = 'blocked_pending_gstreamer_mkvtoolnix_agent_execution_bridge_dry_run_confirmation'
const confirmEnv = RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_CONFIRM_ENV
const integrationBase = '4effa512450664c648db9cf9e95b0653de41e96d'
const outputRoot = '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(outputRoot, runId)
const nextMilestone = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-BRIDGE-CONTROLLED-DISPATCH-1'

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
  routeExecution: false,
  workerDispatch: false,
  workerExecution: false,
  gstreamerExecutionInThisDryRun: false,
  mkvtoolnixExecutionInThisDryRun: false,
  privateMediaProcessing: false,
  userMediaProcessing: false,
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
  externalBetaExpansion: false,
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
      env: `${confirmEnv}=true`,
      observed: process.env[confirmEnv] === 'true' ? 'present_true' : 'absent_or_not_true',
    },
    sourceChain: {
      agentExecutionBridgePr: 1887,
      agentExecutionBridgeMergeSha: integrationBase,
      agentExecutionBridgeDecision: 'completed_gstreamer_mkvtoolnix_agent_execution_bridge_ready_for_confirmation_gated_bridge_dry_run',
      runtimeExecutionImplementationPr: 1882,
      runtimeExecutionImplementationMergeSha: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_RUNTIME_EXECUTION_MERGE_SHA,
      runtimeExecutionRunId: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_RUNTIME_EXECUTION_RUN_ID,
      excludedRemotionPr: '#577 open_draft_blocked_excluded',
    },
    safety,
    productReadyEndToEndLocalOssTools: 0,
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
    nextMilestone,
    ...overrides,
  }
}

function finish(report: Record<string, unknown>, exitCode: number): void {
  fs.mkdirSync(outputDir, { recursive: true })
  const reportPath = path.join(outputDir, 'gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1-report.json')
  writeJson(reportPath, report)

  const files = [
    reportPath,
    typeof report.requestEnvelopePath === 'string' ? report.requestEnvelopePath : undefined,
    typeof report.outputManifestPath === 'string' ? report.outputManifestPath : undefined,
    typeof report.qaReportPath === 'string' ? report.qaReportPath : undefined,
  ].filter((file): file is string => Boolean(file))

  const manifestPath = path.join(outputDir, 'gstreamer-mkvtoolnix-agent-execution-bridge-dry-run-1-manifest.json')
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

if (process.env[confirmEnv] !== 'true') {
  finish(
    baseReport({
      decision: blockedDecision,
      execution: 'blocked_confirmation_absent_no_bridge_dry_run',
      bridgeDryRun: {
        status: 'not_run_confirmation_absent',
        blocker: blockedDecision,
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

const bridgeInput = buildGstreamerMkvtoolnixAgentExecutionBridgeInput({
  workspaceId: 'workspace-agent-execution-bridge-dry-run-1',
  projectId: 'project-agent-execution-bridge-dry-run-1',
  editSessionId: 'edit-session-agent-execution-bridge-dry-run-1',
  approvedSnapshotId: 'approved-snapshot-agent-execution-bridge-dry-run-1',
  approvalRecordId: 'approval-record-agent-execution-bridge-dry-run-1',
  creditPolicyRef: 'no-spend-fixture-policy-agent-execution-bridge-dry-run-1',
  jobId: 'job-agent-execution-bridge-dry-run-1',
  workerLeaseId: 'worker-lease-agent-execution-bridge-dry-run-1',
  routeIdempotencyKey: 'gstreamer-mkvtoolnix:agent-bridge-dry-run-1:approved-snapshot:job:template',
  privateInputManifestId: 'private-input-manifest-agent-execution-bridge-dry-run-1',
  outputManifestSchemaId: 'output-manifest-schema-agent-execution-bridge-dry-run-1',
  qaReportSchemaId: 'qa-report-schema-agent-execution-bridge-dry-run-1',
  cleanupPolicyId: 'cleanup-policy-agent-execution-bridge-dry-run-1',
  retentionPolicyId: 'retention-policy-agent-execution-bridge-dry-run-1',
  failurePolicyId: 'failure-policy-agent-execution-bridge-dry-run-1',
  auditEventParentId: 'audit-parent-agent-execution-bridge-dry-run-1',
})
const bridgeResult = validateGstreamerMkvtoolnixAgentExecutionBridgeInput(bridgeInput)

const requestEnvelope = {
  envelopeId: 'agent-execution-bridge-dry-run-1-request-envelope',
  status: bridgeResult.ok ? 'validated_by_backend_source_bridge' : 'blocked_by_backend_source_bridge',
  sanitizedRequest: bridgeResult.sanitizedRequest,
  blockers: bridgeResult.blockers,
  boundary: summarizeGstreamerMkvtoolnixAgentExecutionBridgeBoundary(),
  rawCommandsAccepted: false,
  rawChatAccepted: false,
  arbitraryFilePathsAccepted: false,
  publicUrlSourceOfTruthAccepted: false,
  signedUrlSourceOfTruthAccepted: false,
  arbitraryPrivateMediaAccepted: false,
}
const requestEnvelopePath = path.join(outputDir, 'request-envelope.json')
writeJson(requestEnvelopePath, requestEnvelope)

const outputManifest = {
  manifestId: 'output-manifest-agent-execution-bridge-dry-run-1',
  status: 'validated_schema_only_no_runtime_outputs_created',
  publicArtifacts: false,
  signedUrls: false,
  finalRenderExport: false,
  files: [],
}
const outputManifestPath = path.join(outputDir, 'output-manifest.json')
writeJson(outputManifestPath, outputManifest)

const qaReport = {
  reportId: 'qa-report-agent-execution-bridge-dry-run-1',
  status: bridgeResult.ok ? 'passed_bridge_dry_run_envelope_validation_only' : 'blocked_bridge_dry_run_envelope_validation',
  checks: [
    'confirmation_gate_present',
    'backend_source_bridge_imported',
    'approved_snapshot_reference_present',
    'approval_record_reference_present',
    'credit_or_no_spend_policy_reference_present',
    'job_reference_present',
    'worker_lease_reference_present',
    'idempotency_key_present',
    'command_template_allowlist_enforced',
    'private_manifest_reference_present',
    'output_manifest_schema_present',
    'qa_report_schema_present',
    'cleanup_retention_failure_policy_refs_present',
    'audit_parent_present',
    'runtime_execution_evidence_present',
    'no_route_worker_or_tool_execution',
  ],
  blockers: bridgeResult.blockers,
}
const qaReportPath = path.join(outputDir, 'qa-report.json')
writeJson(qaReportPath, qaReport)

const validationStatus = bridgeResult.ok ? 'passed' : 'blocked_bridge_validation'
finish(
  baseReport({
    decision: bridgeResult.ok ? decision : bridgeResult.status,
    execution: bridgeResult.ok ? execution : 'blocked_backend_source_bridge_validation',
    bridgeDryRun: {
      status: bridgeResult.ok ? 'completed_agent_execution_bridge_dry_run_envelope_validation' : bridgeResult.status,
      bridgeStatus: bridgeResult.status,
      confirmationGate: `${confirmEnv}=true`,
      directRuntimeExecutionInThisBridge: bridgeResult.directRuntimeExecutionInThisBridge,
      confirmationRequiredForFutureDispatch: true,
      routeExecution: 'not_run_bridge_dry_run_envelope_validation_only',
      workerDispatch: 'not_run_bridge_dry_run_envelope_validation_only',
      workerExecution: 'not_run_bridge_dry_run_envelope_validation_only',
      toolExecution: 'not_run_bridge_dry_run_envelope_validation_only',
      nextSourceStatus: bridgeResult.ok ? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_READY_STATUS : bridgeResult.status,
      priorBridgeNextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_EXECUTION_BRIDGE_NEXT_MILESTONE,
    },
    requestEnvelopePath,
    outputManifestPath,
    qaReportPath,
    requestEnvelopeSha256: sha256File(requestEnvelopePath),
    outputManifestSha256: sha256File(outputManifestPath),
    qaReportSha256: sha256File(qaReportPath),
    validation: validationStatus,
  }),
  bridgeResult.ok ? 0 : 1,
)
