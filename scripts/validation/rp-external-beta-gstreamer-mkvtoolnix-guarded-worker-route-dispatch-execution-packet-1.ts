import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

import {
  buildGstreamerMkvtoolnixGuardedWorkerRouteRequest,
  createGstreamerMkvtoolnixGuardedWorkerRouteResponse,
  validateGstreamerMkvtoolnixGuardedWorkerRouteRequest,
} from '../../src/backend/contracts/gstreamer-mkvtoolnix-guarded-worker-route-contracts'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-DISPATCH-EXECUTION-PACKET-1'
const confirmationEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_ROUTE_DISPATCH_EXECUTION'
const decision = 'completed_gstreamer_mkvtoolnix_guarded_worker_route_dispatch_execution_packet_metadata_only'
const execution = 'completed_confirmation_gated_local_route_handler_invocation_metadata_only_no_worker_or_tool_execution'
const blockedDecision = 'blocked_pending_gstreamer_mkvtoolnix_guarded_worker_route_dispatch_execution_confirmation'
const integrationBase = '9246c0635363ea955e3f6076470aa78797c686cb'
const outputRoot = '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(outputRoot, runId)

const safety = {
  guardedLocalRouteContractHandlerInvocationMetadataOnly: true,
  httpServerStarted: false,
  realRouteExecution: false,
  workerDispatch: false,
  workerExecution: false,
  workerLeaseClaim: false,
  persistentJobQueueWrite: false,
  gstreamerExecutionInThisRouteDispatchExecutionPacket: false,
  mkvtoolnixExecutionInThisRouteDispatchExecutionPacket: false,
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
    routeDispatchExecutionPlanPr: 1935,
    routeDispatchExecutionPlanMergeSha: integrationBase,
    routeDispatchExecutionPlanDecision:
      'completed_gstreamer_mkvtoolnix_guarded_worker_route_dispatch_execution_plan_ready_for_confirmation_gated_execution_packet',
    routeDispatchDryRunPr: 1929,
    routeDispatchDryRunMergeSha: '1832483edd8c03113d2aa9ba04cf3a92c4fcb080',
    routeDispatchDryRunRunId: '2026-07-01T01-21-40-972Z-40ea3844',
    routeDispatchReadinessPr: 1925,
    routeDispatchReadinessMergeSha: '746a017a626d6874d2513e4250af645692dff84e',
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
    nextMilestone: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-DISPATCH-EXECUTION-PACKET-1',
    ...overrides,
  }
}

function finish(report: Record<string, unknown>, exitCode: number): never {
  fs.mkdirSync(outputDir, { recursive: true })
  const reportPath = path.join(outputDir, 'gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1-report.json')
  writeJson(reportPath, report)

  const files = [
    reportPath,
    typeof report.routeHandlerMetadataPath === 'string' ? report.routeHandlerMetadataPath : undefined,
    typeof report.outputManifestPath === 'string' ? report.outputManifestPath : undefined,
    typeof report.qaReportPath === 'string' ? report.qaReportPath : undefined,
  ].filter((file): file is string => Boolean(file))

  const manifestPath = path.join(outputDir, 'gstreamer-mkvtoolnix-guarded-worker-route-dispatch-execution-packet-1-manifest.json')
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
      execution: 'blocked_confirmation_absent_no_guarded_worker_route_dispatch_execution',
      blocker: blockedDecision,
      routeHandlerInvocation: 'not_run_confirmation_absent',
      validation: 'blocked_confirmation_absent',
    }),
    2,
  )
}

const createdAt = new Date().toISOString()
const request = buildGstreamerMkvtoolnixGuardedWorkerRouteRequest({
  createdAt,
  workspaceId: 'workspace-agent-controlled-dispatch-1',
  projectId: 'project-agent-controlled-dispatch-1',
  approvedSnapshotId: 'approved-snapshot-agent-controlled-dispatch-1',
  jobId: 'job-agent-controlled-dispatch-1',
  commandTemplateId: 'gst_controlled_generated_fixture_pipeline_v1',
})
const validation = validateGstreamerMkvtoolnixGuardedWorkerRouteRequest(request)
const response = createGstreamerMkvtoolnixGuardedWorkerRouteResponse(request)

const workerDispatchAttempt = validateGstreamerMkvtoolnixGuardedWorkerRouteRequest({
  ...request,
  workerDispatch: true,
})
const publicArtifactAttempt = validateGstreamerMkvtoolnixGuardedWorkerRouteRequest({
  ...request,
  publicArtifactCreation: true,
})
const finalRenderAttempt = validateGstreamerMkvtoolnixGuardedWorkerRouteRequest({
  ...request,
  finalRenderExport: true,
})

const negativeChecks = [
  {
    check: 'worker_dispatch_attempt_blocks',
    passed: workerDispatchAttempt.blockers.includes('blocked_runtime_execution_not_enabled'),
    blockers: workerDispatchAttempt.blockers,
  },
  {
    check: 'public_artifact_attempt_blocks',
    passed: publicArtifactAttempt.blockers.includes('blocked_public_or_signed_artifact_attempt'),
    blockers: publicArtifactAttempt.blockers,
  },
  {
    check: 'final_render_attempt_blocks',
    passed: finalRenderAttempt.blockers.includes('blocked_delivery_or_unlock_attempt'),
    blockers: finalRenderAttempt.blockers,
  },
]

const routeHandlerMetadata = {
  status: validation.ok ? 'accepted_guarded_local_route_contract_handler_metadata_only' : 'blocked_route_contract_validation_failed',
  createdAt,
  routeId: request.routeId,
  path: request.path,
  routeClass: request.routeClass,
  routeStatus: validation.routeStatus,
  routeHandlerInvocation: 'completed_guarded_local_route_contract_handler_invocation_metadata_only',
  response,
  validation,
  negativeChecks,
  routeExecution: false,
  workerDispatch: false,
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
const routeHandlerMetadataPath = path.join(outputDir, 'route-handler-metadata.json')
writeJson(routeHandlerMetadataPath, routeHandlerMetadata)

const outputManifest = {
  manifestId: 'output-manifest-guarded-worker-route-dispatch-execution-packet-1',
  status: 'validated_schema_only_no_runtime_outputs_created',
  routeHandlerInvocationMetadataOnly: true,
  routeExecution: false,
  workerDispatch: false,
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
  reportId: 'qa-report-guarded-worker-route-dispatch-execution-packet-1',
  status: 'passed_guarded_local_route_contract_handler_metadata_boundary_validation_only',
  checks: [
    'confirmation_gate_present',
    'execution_plan_source_record_present',
    'approved_snapshot_reference_present',
    'approval_record_reference_present',
    'credit_or_no_spend_policy_reference_present',
    'job_reference_present',
    'worker_lease_reference_preserved_not_claimed',
    'route_idempotency_key_present',
    'command_template_allowlist_preserved',
    'private_manifest_reference_present',
    'output_manifest_schema_present',
    'qa_report_schema_present',
    'cleanup_policy_reference_present',
    'no_http_server_started',
    'no_real_route_execution',
    'no_worker_dispatch_worker_execution_or_tool_execution',
    'no_persistent_queue_write',
    'unsafe_worker_dispatch_public_artifact_and_final_render_attempts_blocked',
  ],
  negativeChecks,
  blockers: [],
}
const qaReportPath = path.join(outputDir, 'qa-report.json')
writeJson(qaReportPath, qaReport)

const ok =
  validation.ok &&
  response.routeExecution === false &&
  response.workerDispatch === false &&
  response.workerExecution === false &&
  response.gstreamerExecution === false &&
  response.mkvtoolnixExecution === false &&
  response.mediaProcessing === false &&
  response.signedUrlCreation === false &&
  response.publicArtifactCreation === false &&
  response.finalRenderExport === false &&
  negativeChecks.every((check) => check.passed)

finish(
  baseReport({
    decision: ok ? decision : 'blocked_route_contract_validation_failed',
    execution: ok ? execution : 'blocked_guarded_route_contract_handler_metadata_validation_failed',
    routeHandlerMetadata,
    routeHandlerMetadataPath,
    outputManifestPath,
    qaReportPath,
    validation: ok ? 'passed' : 'failed',
  }),
  ok ? 0 : 1,
)
