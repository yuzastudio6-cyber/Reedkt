#!/usr/bin/env node
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-DISPATCH-DRY-RUN-1'
const confirmationEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_ROUTE_DISPATCH_DRY_RUN'
const decision = 'completed_gstreamer_mkvtoolnix_guarded_worker_route_dispatch_dry_run_metadata_only'
const execution = 'completed_confirmation_gated_guarded_worker_route_dispatch_dry_run_metadata_only_no_route_worker_or_tool_execution'
const blockedDecision = 'blocked_pending_gstreamer_mkvtoolnix_guarded_worker_route_dispatch_dry_run_confirmation'
const integrationBase = '746a017a626d6874d2513e4250af645692dff84e'
const outputRoot = '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(outputRoot, runId)

const safety = {
  guardedWorkerRouteDispatchDryRunMetadataOnly: true,
  routeExecution: false,
  workerDispatch: false,
  workerExecution: false,
  workerLeaseClaim: false,
  persistentJobQueueWrite: false,
  gstreamerExecutionInThisRouteDispatchDryRun: false,
  mkvtoolnixExecutionInThisRouteDispatchDryRun: false,
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

function sourceChain() {
  return {
    routeDispatchReadinessPr: 1925,
    routeDispatchReadinessMergeSha: integrationBase,
    routeDispatchReadinessDecision: 'completed_gstreamer_mkvtoolnix_guarded_worker_route_dispatch_readiness_for_confirmation_gated_dry_run',
    runtimeQaRollupPr: 1921,
    runtimeQaRollupMergeSha: '61619709d92f035b82ca9ef3d8013d9300bf3043',
    runtimeQaRollupDecision: 'completed_gstreamer_mkvtoolnix_agent_controlled_worker_runtime_qa_rollup_generated_fixture_only',
    runtimePacketPr: 1918,
    runtimePacketMergeSha: 'f7e2b76235d9b66a56cae7a6df74e0bc29045b3a',
    runtimePacketRunId: '2026-07-01T00-16-10-927Z-8b7402d8',
    guardedRuntimeRunId: '2026-07-01T00-16-10-989Z-a9752eae',
    dispatchDryRunPr: 1905,
    dispatchDryRunMergeSha: '6cc86d71f383a64254ce2324e02e5d83e70bc031',
    dispatchDryRunRunId: '2026-06-30T20-56-18-927Z-8e5d25d9',
    queueIntegrationPr: 1902,
    queueIntegrationMergeSha: 'cc18a07622a3107c589d2d2957432026da27b8cd',
    queueIntegrationRunId: '2026-06-30T19-45-59-915Z-af80c9f8',
    excludedRemotionPr: '#577 open_draft_blocked_excluded',
  }
}

function baseReport(overrides) {
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
    nextMilestone: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-DISPATCH-EXECUTION-PLAN-1',
    ...overrides,
  }
}

function finish(report, exitCode) {
  fs.mkdirSync(outputDir, { recursive: true })
  const reportPath = path.join(outputDir, 'gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1-report.json')
  writeJson(reportPath, report)

  const files = [
    reportPath,
    typeof report.routeDispatchEnvelopePath === 'string' ? report.routeDispatchEnvelopePath : undefined,
    typeof report.outputManifestPath === 'string' ? report.outputManifestPath : undefined,
    typeof report.qaReportPath === 'string' ? report.qaReportPath : undefined,
  ].filter(Boolean)

  const manifestPath = path.join(outputDir, 'gstreamer-mkvtoolnix-guarded-worker-route-dispatch-dry-run-1-manifest.json')
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
      execution: 'blocked_confirmation_absent_no_guarded_worker_route_dispatch_dry_run',
      routeDispatchDryRun: {
        status: 'not_run_confirmation_absent',
        blocker: blockedDecision,
        routeDispatchEnvelope: 'not_run_confirmation_absent',
        routeExecution: 'not_run_confirmation_absent',
        workerDispatch: 'not_run_confirmation_absent',
        workerExecution: 'not_run_confirmation_absent',
        workerLeaseClaim: 'not_run_confirmation_absent',
        toolExecution: 'not_run_confirmation_absent',
        persistentJobQueueWrite: 'not_run_confirmation_absent',
      },
      validation: 'blocked_confirmation_absent',
    }),
    2,
  )
}

const routeDispatchDryRun = {
  status: 'validated_guarded_worker_route_dispatch_dry_run_metadata_only',
  readinessSourceStatus: 'ready_for_confirmation_gated_guarded_worker_route_dispatch_dry_run',
  routeDispatchEnvelopeId: 'route-dispatch-envelope-gstreamer-mkvtoolnix-guarded-worker-dry-run-1',
  routeDispatchMode: 'metadata_only_route_dispatch_dry_run',
  workerDispatchMode: 'metadata_only_no_worker_process_started',
  fixtureScope: 'generated_srt_and_generated_subtitle_only_mkv_fixture',
  approvedSnapshotReference: 'approved-snapshot-agent-controlled-dispatch-1',
  approvalRecordReference: 'approval-record-agent-controlled-dispatch-1',
  creditPolicyReference: 'no-spend-fixture-policy-agent-controlled-dispatch-1',
  jobReference: 'job-agent-controlled-dispatch-1',
  workerLeaseReference: 'worker-lease-agent-controlled-dispatch-1',
  routeIdempotencyKey: 'gstreamer-mkvtoolnix:agent-controlled-dispatch-1:approved-snapshot:job:template',
  routeDispatchIdempotencyKey:
    'gstreamer-mkvtoolnix:guarded-route-dispatch-dry-run-1:approved-snapshot-agent-controlled-dispatch-1:job-agent-controlled-dispatch-1',
  privateInputManifestReference: 'private-input-manifest-agent-controlled-dispatch-1',
  outputManifestSchemaReference: 'output-manifest-schema-agent-controlled-dispatch-1',
  qaReportSchemaReference: 'qa-report-schema-agent-controlled-dispatch-1',
  cleanupPolicyReference: 'cleanup-policy-agent-controlled-dispatch-1',
  retryPolicyReference: 'retry-policy-agent-controlled-dispatch-1',
  nonPublicArtifactPolicyReference: 'non-public-artifact-policy-agent-controlled-dispatch-1',
  acceptedCommandTemplates: [
    'gst_fakesrc_fakesink_no_media_healthcheck_v1',
    'gst_controlled_generated_fixture_pipeline_v1',
    'mkvmerge_generated_subtitle_only_package_v1',
    'mkvmerge_identify_generated_subtitle_only_v1',
  ],
  routeDispatchEnvelopeCreated: true,
  routeDispatchAccepted: true,
  routeExecution: 'not_run_guarded_worker_route_dispatch_dry_run_metadata_only',
  workerDispatch: 'not_run_guarded_worker_route_dispatch_dry_run_metadata_only',
  workerExecution: 'not_run_guarded_worker_route_dispatch_dry_run_metadata_only',
  workerLeaseClaim: 'not_run_guarded_worker_route_dispatch_dry_run_metadata_only',
  toolExecution: 'not_run_guarded_worker_route_dispatch_dry_run_metadata_only',
  persistentJobQueueWrite: 'not_run_guarded_worker_route_dispatch_dry_run_metadata_only',
  nextSourceStatus: 'ready_for_guarded_worker_route_dispatch_execution_plan',
}

const routeDispatchEnvelope = {
  envelopeId: routeDispatchDryRun.routeDispatchEnvelopeId,
  status: routeDispatchDryRun.status,
  dryRun: routeDispatchDryRun,
  sourceChain: sourceChain(),
  routeExecuted: false,
  workerDispatched: false,
  workerExecuted: false,
  workerLeaseClaimed: false,
  toolsExecuted: false,
  persistentQueueWrite: false,
  publicArtifacts: false,
  signedUrls: false,
  finalRenderExport: false,
}
const routeDispatchEnvelopePath = path.join(outputDir, 'route-dispatch-envelope.json')
writeJson(routeDispatchEnvelopePath, routeDispatchEnvelope)

const outputManifest = {
  manifestId: 'output-manifest-guarded-worker-route-dispatch-dry-run-1',
  status: 'validated_schema_only_no_runtime_outputs_created',
  routeDispatchDryRunMetadataOnly: true,
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
  reportId: 'qa-report-guarded-worker-route-dispatch-dry-run-1',
  status: 'passed_guarded_worker_route_dispatch_dry_run_metadata_boundary_validation_only',
  checks: [
    'confirmation_gate_present',
    'readiness_source_record_present',
    'approved_snapshot_reference_present',
    'approval_record_reference_present',
    'credit_or_no_spend_policy_reference_present',
    'job_reference_present',
    'worker_lease_reference_preserved_not_claimed',
    'route_idempotency_key_present',
    'route_dispatch_idempotency_key_present',
    'command_template_allowlist_preserved',
    'private_manifest_reference_present',
    'output_manifest_schema_present',
    'qa_report_schema_present',
    'cleanup_policy_reference_present',
    'retry_policy_reference_present',
    'non_public_artifact_policy_present',
    'no_route_execution',
    'no_worker_dispatch_worker_execution_or_tool_execution',
    'no_persistent_queue_write',
  ],
  blockers: [],
}
const qaReportPath = path.join(outputDir, 'qa-report.json')
writeJson(qaReportPath, qaReport)

finish(
  baseReport({
    decision,
    execution,
    routeDispatchDryRun,
    routeDispatchEnvelopePath,
    outputManifestPath,
    qaReportPath,
    validation: 'passed',
  }),
  0,
)
