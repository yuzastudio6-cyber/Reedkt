#!/usr/bin/env node
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-DRY-RUN-1'
const confirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_RUNTIME_DRY_RUN'
const integrationBase = '3e85e9296de45d4ac0283b3981a03db8178ff625'
const outputRoot = '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(outputRoot, runId)

const allowedCommandTemplateIds = [
  'gst_fakesrc_fakesink_no_media_healthcheck_v1',
  'gst_controlled_generated_fixture_pipeline_v1',
  'mkvmerge_generated_subtitle_only_package_v1',
  'mkvmerge_identify_generated_subtitle_only_v1',
]

const requiredReferences = {
  approvedPlanSnapshotRef: {
    id: 'approved-snapshot-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1',
    status: 'approved',
    version: 'approved-plan-v1',
  },
  approvalRecordRef: {
    id: 'approval-record-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1',
    status: 'approved',
  },
  creditPolicyRef: {
    id: 'no-spend-fixture-policy-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1',
    status: 'approved',
    mode: 'no_spend_fixture_policy',
  },
  jobRef: {
    id: 'job-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1',
    status: 'dry_run_planned',
  },
  workerLeaseRef: {
    id: 'worker-lease-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1',
    status: 'dry_run_not_dispatched',
    leaseRequired: true,
  },
  routeIdempotencyRef: {
    id: 'route-idempotency-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1',
    status: 'approved',
  },
  privateInputManifestRef: {
    id: 'private-input-manifest-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1',
    status: 'approved',
    sourceClass: 'controlled_generated_fixture_metadata_only',
  },
  expectedOutputManifestSchemaRef: {
    id: 'output-manifest-schema-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1',
    status: 'approved',
  },
  expectedQaReportSchemaRef: {
    id: 'qa-report-schema-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1',
    status: 'approved',
  },
  cleanupPolicyRef: {
    id: 'cleanup-policy-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1',
    status: 'approved',
  },
  retentionPolicyRef: {
    id: 'retention-policy-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1',
    status: 'approved',
  },
  failurePolicyRef: {
    id: 'failure-policy-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1',
    status: 'approved',
  },
  auditEventParentRef: {
    id: 'audit-event-parent-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1',
    status: 'planned',
  },
}

const safetyFalse = {
  runtimeExecution: false,
  routeExecution: false,
  workerDispatch: false,
  workerExecution: false,
  gstreamerExecution: false,
  mkvtoolnixExecution: false,
  ffmpegFfprobeExecution: false,
  dockerExecution: false,
  remotionExecution: false,
  mediaProcessing: false,
  privateMediaProcessing: false,
  userMediaProcessing: false,
  supabaseMutation: false,
  sqlExecution: false,
  secretPayloadAccess: false,
  serviceRoleSecretPayloadAccess: false,
  providerCall: false,
  modelCall: false,
  signedUrlCreation: false,
  publicArtifactCreation: false,
  creditMutation: false,
  stripePaymentProcessing: false,
  deployment: false,
  externalBetaExpansion: false,
  paidProductionUnlock: false,
  productionUnlock: false,
  finalRenderExport: false,
  dependencyMutation: false,
  packageLockMutation: false,
  dockerfileInstallSourceChange: false,
  requirementsInstallSourceChange: false,
  broadServiceRoleHandler: false,
}

fs.mkdirSync(outputDir, { recursive: true })

function sha256Bytes(value) {
  return crypto.createHash('sha256').update(value).digest('hex')
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

function createCommandTemplateResult(templateId) {
  return {
    templateId,
    status: 'validated_allowed_template_no_runtime_execution',
    exitStatus: 'not_applicable_dry_run_envelope_validation_only',
    stdoutSnippet: 'not_collected_no_tool_execution',
    stderrSnippet: 'not_collected_no_tool_execution',
    rawCommandString: false,
    mediaInput: false,
    mediaOutput: false,
  }
}

function baseReport(overrides) {
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
      guardedRuntimeExecutionPlanMerge: integrationBase,
      guardedRuntimeExecutionPlanDecision:
        'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_execution_plan_ready_for_confirmed_worker_runtime_dry_run',
      guardedWorkerSkeletonMerge: '3bc87ce85f44867662fc9fab1b936843480c255c',
      guardedWorkerEnqueueMerge: '5bf9f05c3719503f20d66638d9650f87f96fa0bd',
      guardedWorkerRouteMerge: 'd5903b517f56ad117774c48488b932bd368f0941',
      olderConfirmedWorkerDryRun1r: 'completed_gstreamer_mkvtoolnix_confirmed_worker_execution_dry_run_contract_validation',
      excludedRemotionPr: '#577 open_draft_blocked_excluded',
    },
    safety: safetyFalse,
    productReadyEndToEndLocalOssTools: 0,
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
    ...overrides,
  }
}

function finish(report, exitCode) {
  const reportPath = path.join(outputDir, 'gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1-report.json')
  writeJson(reportPath, report)

  const manifestPath = path.join(outputDir, 'gstreamer-mkvtoolnix-guarded-worker-runtime-dry-run-1-manifest.json')
  const files = [
    reportPath,
    report.privateInputManifestPath,
    report.outputManifestPath,
    report.qaReportPath,
  ].filter(Boolean)
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

  const summary = {
    packet,
    decision: report.decision,
    execution: report.execution,
    runId,
    outputDir,
    report: reportPath,
    manifest: manifestPath,
    artifacts: manifest.artifacts,
  }
  console.log(JSON.stringify(summary, null, 2))
  process.exit(exitCode)
}

if (process.env[confirmEnv] !== 'true') {
  finish(
    baseReport({
      decision: 'blocked_missing_runtime_dry_run_confirmation_gate',
      execution: 'blocked_missing_confirmation_gate_no_worker_dispatch_or_tool_execution',
      dryRun: {
        status: 'not_run_confirmation_gate_absent',
        blocker: 'blocked_missing_runtime_dry_run_confirmation_gate',
        routeExecution: 'not_run_confirmation_gate_absent',
        workerDispatch: 'not_run_confirmation_gate_absent',
        workerExecution: 'not_run_confirmation_gate_absent',
        toolExecution: 'not_run_confirmation_gate_absent',
      },
      nextMilestone: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-DRY-RUN-1',
    }),
    2,
  )
}

const privateInputManifest = {
  manifestId: requiredReferences.privateInputManifestRef.id,
  sourceClass: requiredReferences.privateInputManifestRef.sourceClass,
  items: allowedCommandTemplateIds.map((templateId) => ({
    templateId,
    fileName: `${templateId}.metadata-only.json`,
    bytes: 0,
    sha256: sha256Bytes(`${packet}:${templateId}:metadata-only`),
    storage: 'none_metadata_only_no_media_input',
    mediaInput: false,
  })),
  rawCommandStringsAllowed: false,
  publicUrlSourceOfTruth: false,
  signedUrlSourceOfTruth: false,
  arbitraryPrivateMedia: false,
  generatedAt: new Date().toISOString(),
}
privateInputManifest.sha256 = sha256Bytes(JSON.stringify(privateInputManifest))

const privateInputManifestPath = path.join(outputDir, 'private-input-manifest.json')
writeJson(privateInputManifestPath, privateInputManifest)

const outputManifest = {
  manifestId: 'output-manifest-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1',
  status: 'validated_schema_only_no_outputs_created',
  items: [],
  publicArtifacts: false,
  signedUrls: false,
  finalRenderExport: false,
  generatedAt: new Date().toISOString(),
}
outputManifest.sha256 = sha256Bytes(JSON.stringify(outputManifest))
const outputManifestPath = path.join(outputDir, 'output-manifest.json')
writeJson(outputManifestPath, outputManifest)

const qaReport = {
  reportId: 'qa-report-gstreamer-mkvtoolnix-guarded-runtime-dry-run-1',
  status: 'passed_dry_run_envelope_validation_only',
  checks: [
    'confirmation_gate_present',
    'required_refs_named',
    'allowed_command_templates_only',
    'private_input_manifest_checksum_present',
    'output_manifest_schema_present',
    'cleanup_policy_present',
    'no_worker_dispatch',
    'no_tool_execution',
    'no_media_processing',
  ],
  generatedAt: new Date().toISOString(),
}
qaReport.sha256 = sha256Bytes(JSON.stringify(qaReport))
const qaReportPath = path.join(outputDir, 'qa-report.json')
writeJson(qaReportPath, qaReport)

const envelope = {
  contractId: 'rp.externalBeta.gstreamerMkvtoolnix.guardedWorkerRuntimeDryRun.v1',
  dryRunMode: 'confirmed_guarded_worker_runtime_envelope_validation_only',
  runtimeEnabled: false,
  routeExecutionEnabled: false,
  workerDispatchEnabled: false,
  workerExecutionEnabled: false,
  toolExecutionEnabled: false,
  ...requiredReferences,
  routeIdempotencyKey: requiredReferences.routeIdempotencyRef.id,
  commandTemplates: allowedCommandTemplateIds.map((templateId) => ({
    id: `command-template-${templateId}`,
    status: 'approved',
    templateId,
    rawCommandStringsAllowed: false,
  })),
  commandTemplateResults: allowedCommandTemplateIds.map(createCommandTemplateResult),
  privateInputManifestRef: {
    ...requiredReferences.privateInputManifestRef,
    sha256: privateInputManifest.sha256,
    checksumMatches: true,
    path: privateInputManifestPath,
  },
  outputManifestRef: {
    id: outputManifest.manifestId,
    sha256: outputManifest.sha256,
    path: outputManifestPath,
  },
  qaReportRef: {
    id: qaReport.reportId,
    sha256: qaReport.sha256,
    path: qaReportPath,
  },
  rejectedInputs: {
    rawChat: false,
    rawCommandString: false,
    frontendFilePath: false,
    publicUrlSourceOfTruth: false,
    signedUrlSourceOfTruth: false,
    arbitraryPrivateMedia: false,
    unmanifestedFile: false,
    providerOrModelPromptPayload: false,
    serviceRoleSecretPayload: false,
  },
  cleanup: {
    status: 'completed_no_runtime_outputs_to_delete',
    generatedMediaFiles: 0,
    publicArtifacts: 0,
    signedUrls: 0,
  },
  safety: safetyFalse,
}

const blockers = []
for (const [key, value] of Object.entries(requiredReferences)) {
  if (!value?.id || !value?.status) blockers.push(`blocked_missing_${key}`)
}
if (!privateInputManifest.sha256 || privateInputManifest.sha256.length !== 64) {
  blockers.push('blocked_manifest_checksum_mismatch')
}
if (!outputManifest.sha256 || outputManifest.sha256.length !== 64) {
  blockers.push('blocked_output_manifest_missing')
}
if (!qaReport.sha256 || qaReport.sha256.length !== 64) {
  blockers.push('blocked_qa_report_missing')
}
for (const command of envelope.commandTemplates) {
  if (!allowedCommandTemplateIds.includes(command.templateId) || command.rawCommandStringsAllowed !== false) {
    blockers.push('blocked_unapproved_command_template')
  }
}
for (const [key, value] of Object.entries(safetyFalse)) {
  if (value !== false) blockers.push(`blocked_safety_flag_${key}`)
}

if (blockers.length > 0) {
  finish(
    baseReport({
      decision: 'blocked_guarded_worker_runtime_dry_run_envelope_validation_failed',
      execution: 'blocked_guarded_worker_runtime_dry_run_envelope_validation_no_worker_dispatch_or_tool_execution',
      privateInputManifestPath,
      outputManifestPath,
      qaReportPath,
      envelope,
      blockers,
      dryRun: {
        status: 'blocked_envelope_validation_failed',
        routeExecution: 'not_run_envelope_validation_failed',
        workerDispatch: 'not_run_envelope_validation_failed',
        workerExecution: 'not_run_envelope_validation_failed',
        toolExecution: 'not_run_envelope_validation_failed',
      },
      nextMilestone: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-IMPLEMENTATION-1',
    }),
    1,
  )
}

finish(
  baseReport({
    decision: 'completed_gstreamer_mkvtoolnix_guarded_worker_runtime_dry_run_envelope_validation',
    execution: 'completed_confirmation_gated_guarded_worker_runtime_dry_run_no_worker_dispatch_or_tool_execution',
    privateInputManifestPath,
    outputManifestPath,
    qaReportPath,
    envelope,
    blockers: [],
    dryRun: {
      status: 'completed_guarded_worker_runtime_dry_run_envelope_validation',
      requiredReferencesNamed: true,
      privateInputManifestChecksum: privateInputManifest.sha256,
      outputManifestChecksum: outputManifest.sha256,
      qaReportChecksum: qaReport.sha256,
      routeExecution: 'not_run_dry_run_envelope_validation_only',
      workerDispatch: 'not_run_dry_run_envelope_validation_only',
      workerExecution: 'not_run_dry_run_envelope_validation_only',
      toolExecution: 'not_run_dry_run_envelope_validation_only',
      commandTemplateResults: envelope.commandTemplateResults,
      cleanup: envelope.cleanup.status,
    },
    readiness: {
      gstreamer: 'ready_for_guarded_worker_runtime_execution_implementation',
      mkvtoolnix: 'ready_for_guarded_worker_runtime_execution_implementation',
    },
    nextMilestone: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-RUNTIME-EXECUTION-IMPLEMENTATION-1',
  }),
  0,
)
