#!/usr/bin/env node
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const packet = 'RP-INTERNAL-BETA-LOCAL-READINESS-GATE-ROLLUP-1'
const baseOutputDir = '/tmp/reeditpro-rp-internal-beta-local-readiness-gate-rollup-1'

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function bytes(file) {
  return fs.statSync(file).size
}

function createRunId() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const suffix = crypto.randomBytes(4).toString('hex')
  return `${timestamp}-${suffix}`
}

const readinessRecord = readJson('docs/internal-beta/end-to-end-readiness-1/readiness-record.json')
const orchestratorRecord = readJson(
  'docs/internal-beta/rp-internal-beta-runtime-readiness-orchestrator-1/runtime-readiness-orchestrator-record.json',
)
const credentialIntegrationRecord = readJson(
  'docs/internal-beta/rp-internal-beta-runtime-readiness-credential-context-integration-1/runtime-readiness-credential-context-integration-record.json',
)
const credentialPreflightRecord = readJson(
  'docs/internal-beta/rp-internal-beta-supabase-target-credential-context-preflight-1/credential-context-preflight-record.json',
)
const confirmedRunnerRecord = readJson(
  'docs/internal-beta/rp-internal-beta-supabase-target-confirmed-runner-credential-context-hardening-1/confirmed-runner-credential-context-hardening-record.json',
)
const rollupRecord = readJson(
  'docs/internal-beta/rp-internal-beta-local-readiness-gate-rollup-1/local-readiness-gate-rollup-record.json',
)

const runId = createRunId()
const outputDir = path.join(baseOutputDir, runId)
fs.mkdirSync(outputDir, { recursive: true })

const report = {
  packet,
  runId,
  generatedAt: new Date().toISOString(),
  host: {
    platform: os.platform(),
    arch: os.arch(),
  },
  decision: 'blocked_internal_beta_not_ready_missing_supabase_credential_context_and_runtime_gates',
  execution: 'completed_local_readiness_gate_rollup_no_remote_execution',
  internalBetaEndToEndReady: false,
  internalBetaEndToEndStatus: 'not_ready',
  productReadyEndToEndLocalOssTools: 0,
  currentSupabaseCredentialContext:
    credentialPreflightRecord.decision ?? 'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias',
  currentSupabaseValidation:
    confirmedRunnerRecord.currentRunStatus ??
    'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias',
  runtimeReadinessStatus: orchestratorRecord.status,
  credentialContextGate: 'approved_supabase_credential_context_present',
  requiredBeforeInternalBeta: rollupRecord.requiredBeforeInternalBeta,
  componentCounts: orchestratorRecord.componentCounts,
  sourceRecords: {
    readiness: readinessRecord.packet,
    orchestrator: orchestratorRecord.packet,
    credentialIntegration: credentialIntegrationRecord.packet,
    credentialPreflight: credentialPreflightRecord.packet,
    confirmedRunnerHardening: confirmedRunnerRecord.packet,
    localRollup: rollupRecord.packet,
  },
  blockers: [
    'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias',
    'blocked_pending_supabase_target_validation_and_runtime_enablement',
    'blocked_pending_confirmed_supabase_target_rls_storage_validation',
    'disabled_pending_runtime_gate',
    'disabled_pending_credit_ledger_runtime_gate',
    'disabled_pending_job_queue_runtime_gate',
    'disabled_pending_private_artifact_manifest_runtime_gate',
    'disabled_pending_remotion_render_worker_runtime_gate',
    'disabled_pending_provider_runtime_gate',
  ],
  safety: {
    remoteSupabaseCommand: false,
    remoteSupabaseMutation: false,
    sqlExecution: false,
    sqlMutation: false,
    migrationApply: false,
    rlsPolicyApply: false,
    storageBucketCreation: false,
    storageObjectCreation: false,
    storageObjectRead: false,
    serviceRoleSecretPayloadAccess: false,
    frontendServiceRoleCredentialExposure: false,
    serviceRoleRouteExecution: false,
    googleCloudApiCall: false,
    cloudRunServiceCreation: false,
    cloudRunJobCreation: false,
    cloudRunDeployment: false,
    iamMutation: false,
    gcsBucketCreation: false,
    gcsObjectAccess: false,
    providerModelCall: false,
    modelCall: false,
    rawPromptExecution: false,
    workerExecution: false,
    workerDispatch: false,
    workerLeaseClaim: false,
    routeExecution: false,
    browserCapture: false,
    remotionExecution: false,
    ffmpegExecution: false,
    ffprobeExecution: false,
    mediaProcessing: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    creditMutation: false,
    creditReservationCreation: false,
    creditSpend: false,
    jobEnqueue: false,
    jobEventWrite: false,
    stripePaymentProcessing: false,
    deployment: false,
    internalBetaUnlock: false,
    externalBetaUnlock: false,
    productionUnlock: false,
    finalRenderExport: false,
    previewArtifactCreation: false,
    privateMediaProcessing: false,
    userMediaProcessing: false,
    dependencyMutation: false,
  },
  packageLock: 'unchanged',
  generatedArtifactsCommitted: 'none',
  nextMilestone: 'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED-RUN',
}

if (report.currentSupabaseCredentialContext !== 'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias') {
  throw new Error(`Unexpected credential context status: ${report.currentSupabaseCredentialContext}`)
}

if (report.currentSupabaseValidation !== 'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias') {
  throw new Error(`Unexpected confirmed runner status: ${report.currentSupabaseValidation}`)
}

if (report.componentCounts?.total !== 46) {
  throw new Error(`Unexpected disabled operation count: ${report.componentCounts?.total}`)
}

const reportFile = path.join(outputDir, 'local-readiness-gate-rollup-report.json')
writeJson(reportFile, report)

const manifest = {
  packet,
  runId,
  generatedAt: new Date().toISOString(),
  outputDir,
  artifacts: [
    {
      fileName: path.basename(reportFile),
      bytes: bytes(reportFile),
      sha256: sha256(reportFile),
    },
  ],
  generatedArtifactsCommitted: 'none',
}

const manifestFile = path.join(outputDir, 'artifact-manifest.json')
writeJson(manifestFile, manifest)

console.log(
  JSON.stringify(
    {
      packet,
      decision: report.decision,
      execution: report.execution,
      internalBetaEndToEndReady: report.internalBetaEndToEndReady,
      currentSupabaseCredentialContext: report.currentSupabaseCredentialContext,
      outputDir,
      artifacts: [
        {
          fileName: path.basename(reportFile),
          bytes: bytes(reportFile),
          sha256: sha256(reportFile),
        },
        {
          fileName: path.basename(manifestFile),
          bytes: bytes(manifestFile),
          sha256: sha256(manifestFile),
        },
      ],
      nextMilestone: report.nextMilestone,
    },
    null,
    2,
  ),
)
