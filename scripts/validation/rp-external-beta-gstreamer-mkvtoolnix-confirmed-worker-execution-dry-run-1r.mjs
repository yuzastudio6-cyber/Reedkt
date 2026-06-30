#!/usr/bin/env node
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-CONFIRMED-WORKER-EXECUTION-DRY-RUN-1R'
const confirmEnv = 'REEDITPRO_CONFIRM_GSTREAMER_MKVTOOLNIX_GUARDED_WORKER_EXECUTION'
const integrationBase = '4862913316df39324b3245500b21e1dd81f6ca88'
const outputRoot = '/tmp/reeditpro-rp-external-beta-gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r'
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
    id: 'approved-snapshot-gstreamer-mkvtoolnix-external-agent-dry-run-1r',
    status: 'approved',
    version: 'approved-plan-v1',
  },
  approvalRecordRef: {
    id: 'approval-record-gstreamer-mkvtoolnix-external-agent-dry-run-1r',
    status: 'approved',
  },
  creditPolicyRef: {
    id: 'no-spend-fixture-policy-gstreamer-mkvtoolnix-external-agent-dry-run-1r',
    status: 'approved',
    mode: 'no_spend_fixture_policy',
  },
  jobRef: {
    id: 'job-gstreamer-mkvtoolnix-external-agent-dry-run-1r',
    status: 'dry_run_planned',
  },
  workerLeaseRef: {
    id: 'worker-lease-gstreamer-mkvtoolnix-external-agent-dry-run-1r',
    status: 'dry_run_not_dispatched',
    leaseRequired: true,
  },
  idempotencyRef: {
    id: 'idempotency-gstreamer-mkvtoolnix-external-agent-dry-run-1r',
    status: 'approved',
  },
  privateInputManifestRef: {
    id: 'private-input-manifest-gstreamer-mkvtoolnix-external-agent-dry-run-1r',
    status: 'approved',
    sourceClass: 'controlled_generated_fixture_metadata_only',
  },
  expectedOutputManifestSchemaRef: {
    id: 'output-manifest-schema-gstreamer-mkvtoolnix-external-agent-dry-run-1r',
    status: 'approved',
  },
  expectedQaReportSchemaRef: {
    id: 'qa-report-schema-gstreamer-mkvtoolnix-external-agent-dry-run-1r',
    status: 'approved',
  },
  cleanupPolicyRef: {
    id: 'cleanup-policy-gstreamer-mkvtoolnix-external-agent-dry-run-1r',
    status: 'approved',
  },
  retentionPolicyRef: {
    id: 'retention-policy-gstreamer-mkvtoolnix-external-agent-dry-run-1r',
    status: 'approved',
  },
  failurePolicyRef: {
    id: 'failure-policy-gstreamer-mkvtoolnix-external-agent-dry-run-1r',
    status: 'approved',
  },
  auditEventParentRef: {
    id: 'audit-event-parent-gstreamer-mkvtoolnix-external-agent-dry-run-1r',
    status: 'planned',
  },
}

const safetyFalse = {
  workerExecution: false,
  workerDispatch: false,
  serviceRoleRouteExecution: false,
  routeExecution: false,
  gstreamerExecution: false,
  mkvtoolnixExecution: false,
  gpacMp4boxExecution: false,
  vapoursynthExecution: false,
  revideoExecution: false,
  filmExecution: false,
  qwenExecution: false,
  aiGraphicsExecution: false,
  ffmpegFfprobeExecution: false,
  dockerExecution: false,
  remotionExecution: false,
  mediaProcessing: false,
  privateMediaProcessing: false,
  userMediaProcessing: false,
  supabaseMutation: false,
  sqlExecution: false,
  secretPayloadAccess: false,
  signedUrlCreation: false,
  publicArtifactCreation: false,
  creditMutation: false,
  stripePaymentProcessing: false,
  deployment: false,
  iamMutation: false,
  googleGroupMembershipMutation: false,
  broadExternalBetaAudienceUnlock: false,
  paidProductionUnlock: false,
  productionUnlock: false,
  finalRenderExport: false,
  dependencyMutation: false,
  packageLockMutation: false,
  dockerfileInstallSourceChange: false,
  requirementsInstallSourceChange: false,
  cloudRunReadback: false,
  cloudRunServiceUpdate: false,
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
      confirmedWorkerDryRun1Merge: integrationBase,
      confirmedWorkerDryRun1: 'blocked_missing_confirmation_gate',
      confirmationGatedWorkerExecutionPlan: 'completed_gstreamer_mkvtoolnix_confirmation_gated_worker_execution_plan_ready_for_confirmed_dry_run',
      guardedWorkerEnablementReview: 'approved_gstreamer_mkvtoolnix_guarded_worker_enablement_review_ready_for_confirmation_gated_worker_execution_plan',
      disabledWorkerScaffold: 'completed_gstreamer_mkvtoolnix_disabled_worker_scaffold_negative_tests_ready_for_guarded_worker_enablement_review',
      agentExecutionContract: 'completed_gstreamer_mkvtoolnix_guarded_agent_execution_contract_ready_for_disabled_worker_scaffold',
      toolExecutionReadinessMatrix: 'completed_external_beta_tool_execution_readiness_matrix_for_guarded_agent_execution',
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
  const reportPath = path.join(outputDir, 'gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r-report.json')
  writeJson(reportPath, report)

  const manifestPath = path.join(outputDir, 'gstreamer-mkvtoolnix-confirmed-worker-execution-dry-run-1r-manifest.json')
  const manifest = {
    packet,
    runId,
    outputDir,
    decision: report.decision,
    execution: report.execution,
    artifacts: [
      artifact(reportPath),
      ...(report.privateInputManifestPath ? [artifact(report.privateInputManifestPath)] : []),
    ],
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
      decision: 'blocked_missing_confirmation_gate',
      execution: 'blocked_missing_confirmation_gate_no_worker_or_tool_execution',
      dryRun: {
        status: 'not_run_confirmation_gate_absent',
        blocker: 'blocked_missing_confirmation_gate',
        workerDispatch: 'not_run_confirmation_gate_absent',
        workerExecution: 'not_run_confirmation_gate_absent',
        toolExecution: 'not_run_confirmation_gate_absent',
        gstreamerExecution: 'not_run_confirmation_gate_absent',
        mkvtoolnixExecution: 'not_run_confirmation_gate_absent',
      },
      nextMilestone: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-CONFIRMED-WORKER-EXECUTION-DRY-RUN-1R',
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

const envelope = {
  contractId: 'rp.externalBeta.gstreamerMkvtoolnix.agentExecution.v1',
  dryRunMode: 'confirmed_worker_execution_contract_validation_only',
  runtimeEnabled: false,
  workerDispatchEnabled: false,
  routeExecutionEnabled: false,
  toolExecutionEnabled: false,
  ...requiredReferences,
  commandTemplates: allowedCommandTemplateIds.map((templateId) => ({
    id: `command-template-${templateId}`,
    status: 'approved',
    templateId,
    rawCommandStringsAllowed: false,
  })),
  privateInputManifestRef: {
    ...requiredReferences.privateInputManifestRef,
    sha256: privateInputManifest.sha256,
    checksumMatches: true,
    path: privateInputManifestPath,
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
  safety: safetyFalse,
}

const blockers = []
for (const [key, value] of Object.entries(requiredReferences)) {
  if (!value?.id || !value?.status) blockers.push(`blocked_missing_${key}`)
}
if (!privateInputManifest.sha256 || privateInputManifest.sha256.length !== 64) {
  blockers.push('blocked_private_input_manifest_checksum_invalid')
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
      decision: 'blocked_confirmed_worker_dry_run_contract_validation_failed',
      execution: 'blocked_confirmed_worker_dry_run_contract_validation_no_worker_or_tool_execution',
      privateInputManifestPath,
      envelope,
      blockers,
      dryRun: {
        status: 'blocked_contract_validation_failed',
        workerDispatch: 'not_run_contract_validation_failed',
        workerExecution: 'not_run_contract_validation_failed',
        toolExecution: 'not_run_contract_validation_failed',
      },
      nextMilestone: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-CONFIRMED-WORKER-EXECUTION-DRY-RUN-1R',
    }),
    1,
  )
}

finish(
  baseReport({
    decision: 'completed_gstreamer_mkvtoolnix_confirmed_worker_execution_dry_run_contract_validation',
    execution: 'completed_confirmation_gated_worker_dry_run_envelope_validation_no_runtime_execution',
    privateInputManifestPath,
    envelope,
    blockers,
    dryRun: {
      status: 'completed_confirmed_worker_dry_run_contract_validation',
      confirmationGateObserved: 'present_true',
      requiredReferencesNamed: true,
      allowedCommandTemplatesNamed: allowedCommandTemplateIds,
      privateInputManifestChecksum: privateInputManifest.sha256,
      workerDispatch: 'not_run_dry_run_contract_validation_only',
      workerExecution: 'not_run_dry_run_contract_validation_only',
      toolExecution: 'not_run_dry_run_contract_validation_only',
      gstreamerExecution: 'not_run_dry_run_contract_validation_only',
      mkvtoolnixExecution: 'not_run_dry_run_contract_validation_only',
      mediaProcessing: 'not_run_dry_run_contract_validation_only',
      outputManifest: 'schema_named_no_artifact_output',
      qaReport: 'schema_named_no_runtime_qa_report',
      cleanupResult: 'no_runtime_outputs_to_clean',
    },
    readiness: {
      gstreamer: 'ready_for_guarded_worker_route_implementation',
      mkvtoolnix: 'ready_for_guarded_worker_route_implementation',
      externalAgentExecution: 'ready_for_guarded_worker_route_implementation_not_broad_media',
    },
    nextMilestone: 'RP-EXTERNAL-BETA-GSTREAMER-MKVTOOLNIX-GUARDED-WORKER-ROUTE-IMPLEMENTATION-1',
  }),
  0,
)
