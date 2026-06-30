import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_CONFIRM_ENV,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_DECISION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_EXECUTION,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_NEXT_MILESTONE,
  buildGstreamerMkvtoolnixAgentControlledDispatchInput,
  summarizeGstreamerMkvtoolnixAgentControlledDispatchBoundary,
  validateGstreamerMkvtoolnixAgentControlledDispatchInput,
} from '../../server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1'
import {
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_RUNTIME_EXECUTION_MERGE_SHA,
  RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_RUNTIME_EXECUTION_RUN_ID,
} from '../../server/services/rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-1'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-AGENT-EXECUTION-BRIDGE-CONTROLLED-DISPATCH-1'
const blockedDecision = 'blocked_pending_gstreamer_mkvtoolnix_agent_controlled_dispatch_confirmation'
const integrationBase = 'd5d0ab318eb98f5b08f3e6dce9c1e87cb5d6bc7f'
const dryRunId = '2026-06-30T18-13-47-512Z-1707fbec'
const dryRunMergeSha = 'd5d0ab318eb98f5b08f3e6dce9c1e87cb5d6bc7f'
const bridgeMergeSha = '4effa512450664c648db9cf9e95b0653de41e96d'
const outputRoot = '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1'
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
  routeExecution: false,
  workerDispatch: false,
  workerExecution: false,
  gstreamerExecutionInThisDispatch: false,
  mkvtoolnixExecutionInThisDispatch: false,
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

function baseReport(overrides: Record<string, unknown>): Record<string, unknown> {
  return {
    packet,
    integrationBase,
    runId,
    outputDir,
    confirmationGate: {
      env: `${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_CONFIRM_ENV}=true`,
      observed:
        process.env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_CONFIRM_ENV] === 'true'
          ? 'present_true'
          : 'absent_or_not_true',
    },
    sourceChain: {
      agentControlledDispatchBase: integrationBase,
      agentExecutionBridgeDryRunPr: 1892,
      agentExecutionBridgeDryRunMergeSha: dryRunMergeSha,
      agentExecutionBridgeDryRunRunId: dryRunId,
      agentExecutionBridgeDryRunDecision: 'completed_gstreamer_mkvtoolnix_agent_execution_bridge_dry_run_envelope_validation',
      agentExecutionBridgePr: 1887,
      agentExecutionBridgeMergeSha: bridgeMergeSha,
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
    nextMilestone: RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_NEXT_MILESTONE,
    ...overrides,
  }
}

function finish(report: Record<string, unknown>, exitCode: number): void {
  fs.mkdirSync(outputDir, { recursive: true })
  const reportPath = path.join(outputDir, 'gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1-report.json')
  writeJson(reportPath, report)

  const files = [
    reportPath,
    typeof report.dispatchEnvelopePath === 'string' ? report.dispatchEnvelopePath : undefined,
    typeof report.outputManifestPath === 'string' ? report.outputManifestPath : undefined,
    typeof report.qaReportPath === 'string' ? report.qaReportPath : undefined,
  ].filter((file): file is string => Boolean(file))

  const manifestPath = path.join(outputDir, 'gstreamer-mkvtoolnix-agent-execution-bridge-controlled-dispatch-1-manifest.json')
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

if (process.env[RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_CONFIRM_ENV] !== 'true') {
  finish(
    baseReport({
      decision: blockedDecision,
      execution: 'blocked_confirmation_absent_no_controlled_dispatch',
      controlledDispatch: {
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

const dispatchInput = buildGstreamerMkvtoolnixAgentControlledDispatchInput()
const dispatchResult = validateGstreamerMkvtoolnixAgentControlledDispatchInput(dispatchInput)

const dispatchEnvelope = {
  envelopeId: 'agent-execution-bridge-controlled-dispatch-1-envelope',
  status: dispatchResult.ok
    ? 'accepted_controlled_dispatch_metadata_only'
    : 'blocked_controlled_dispatch_boundary_validation',
  sanitizedDispatch: dispatchResult.sanitizedDispatch,
  blockers: dispatchResult.blockers,
  boundary: summarizeGstreamerMkvtoolnixAgentControlledDispatchBoundary(),
  rawCommandsAccepted: false,
  rawChatAccepted: false,
  arbitraryFilePathsAccepted: false,
  publicUrlSourceOfTruthAccepted: false,
  signedUrlSourceOfTruthAccepted: false,
  arbitraryPrivateMediaAccepted: false,
  routeExecuted: false,
  workerDispatched: false,
  workerExecuted: false,
  toolsExecuted: false,
}
const dispatchEnvelopePath = path.join(outputDir, 'dispatch-envelope.json')
writeJson(dispatchEnvelopePath, dispatchEnvelope)

const outputManifest = {
  manifestId: 'output-manifest-agent-execution-bridge-controlled-dispatch-1',
  status: 'validated_schema_only_no_runtime_outputs_created',
  queueIntegration: 'pending_next_milestone',
  publicArtifacts: false,
  signedUrls: false,
  finalRenderExport: false,
  files: [],
}
const outputManifestPath = path.join(outputDir, 'output-manifest.json')
writeJson(outputManifestPath, outputManifest)

const qaReport = {
  reportId: 'qa-report-agent-execution-bridge-controlled-dispatch-1',
  status: dispatchResult.ok
    ? 'passed_controlled_dispatch_metadata_boundary_validation_only'
    : 'blocked_controlled_dispatch_metadata_boundary_validation',
  checks: [
    'confirmation_gate_present',
    'bridge_validated_request_present',
    'approved_snapshot_reference_present',
    'approval_record_reference_present',
    'credit_or_no_spend_policy_reference_present',
    'job_reference_present',
    'worker_lease_reference_present',
    'route_idempotency_key_present',
    'dispatch_id_present',
    'dispatch_idempotency_key_present',
    'command_template_allowlist_preserved',
    'private_manifest_reference_present',
    'output_manifest_schema_present',
    'qa_report_schema_present',
    'cleanup_retention_failure_policy_refs_present',
    'audit_parent_present',
    'no_route_worker_or_tool_execution',
    'queue_integration_pending_next_milestone',
  ],
  blockers: dispatchResult.blockers,
}
const qaReportPath = path.join(outputDir, 'qa-report.json')
writeJson(qaReportPath, qaReport)

const validationStatus = dispatchResult.ok ? 'passed' : 'blocked_controlled_dispatch_validation'
finish(
  baseReport({
    decision: dispatchResult.ok ? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_DECISION : dispatchResult.status,
    execution: dispatchResult.ok
      ? RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_EXECUTION
      : 'blocked_controlled_dispatch_boundary_validation',
    controlledDispatch: {
      status: dispatchResult.status,
      bridgeStatus: dispatchResult.bridgeStatus,
      confirmationGate: `${RP_EXTERNAL_BETA_GSTREAMER_MKVTOOLNIX_AGENT_CONTROLLED_DISPATCH_CONFIRM_ENV}=true`,
      controlledDispatchAccepted: dispatchResult.sanitizedDispatch.controlledDispatchAccepted,
      queueIntegration: dispatchResult.sanitizedDispatch.queueIntegration,
      dispatchId: dispatchResult.sanitizedDispatch.dispatchId,
      dispatchMode: dispatchResult.sanitizedDispatch.dispatchMode,
      dispatchIdempotencyKey: dispatchResult.sanitizedDispatch.dispatchIdempotencyKey,
      externalAgentRequestId: dispatchResult.sanitizedDispatch.externalAgentRequestId,
      routeExecution: 'not_run_controlled_dispatch_metadata_only',
      workerDispatch: 'not_run_controlled_dispatch_metadata_only',
      workerExecution: 'not_run_controlled_dispatch_metadata_only',
      toolExecution: 'not_run_controlled_dispatch_metadata_only',
      nextSourceStatus: dispatchResult.ok
        ? 'ready_for_agent_controlled_worker_queue_integration'
        : dispatchResult.status,
    },
    dispatchEnvelopePath,
    outputManifestPath,
    qaReportPath,
    dispatchEnvelopeSha256: sha256File(dispatchEnvelopePath),
    outputManifestSha256: sha256File(outputManifestPath),
    qaReportSha256: sha256File(qaReportPath),
    validation: validationStatus,
  }),
  dispatchResult.ok ? 0 : 1,
)
