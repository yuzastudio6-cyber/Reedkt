#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'SUPABASE-SERVICE-ROLE-RUNTIME-BOUNDARY-VALIDATION-1'
const confirmationVar = 'REEDITPRO_CONFIRM_SUPABASE_SERVICE_ROLE_RUNTIME_BOUNDARY_VALIDATION'
const gcpProject = 'reeditpro'
const cleanDbUrlSecret = 'REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL'
const accessTokenSecret = 'SUPABASE_ACCESS_TOKEN'
const targetProjectName = 'reeditpro-clean-staging-isolated-v1'
const targetProjectRef = 'fajinbvwhcjnutkaumkm'
const reportDir = 'docs/activation-supabase-service-role-runtime-boundary-validation-1-reports'
const reportPath = path.join(reportDir, 'service_role_runtime_boundary_validation_report.json')
const manifestPath = path.join(reportDir, 'service_role_runtime_boundary_validation_manifest.json')
const baseOutputDir = '/tmp/reeditpro-supabase-service-role-runtime-boundary-validation-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(baseOutputDir, runId)

fs.mkdirSync(reportDir, { recursive: true })
fs.mkdirSync(outputDir, { recursive: true })

function sanitize(value) {
  return String(value ?? '')
    .replace(/sbp_[A-Za-z0-9_./=-]+/g, 'sbp_[redacted]')
    .replace(/\bpostgres(?:ql)?:\/\/\S+/gi, 'postgresql://[redacted]')
    .replace(/https:\/\/[a-z0-9-]+\.supabase\.co/gi, 'https://[redacted].supabase.co')
    .replace(/db\.[a-z0-9-]+\.supabase\.co/gi, 'db.[redacted].supabase.co')
    .replace(/password=[^\s]+/gi, 'password=[redacted]')
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function run(command, args) {
  try {
    const stdout = execFileSync(command, args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 120000,
    })
    return { ok: true, exitCode: 0, stdout, stderr: '' }
  } catch (error) {
    return {
      ok: false,
      exitCode: typeof error.status === 'number' ? error.status : 1,
      stdout: error.stdout?.toString() ?? '',
      stderr: error.stderr?.toString() ?? error.message,
    }
  }
}

function parseJson(text, fallback) {
  try {
    return JSON.parse(text)
  } catch {
    return fallback
  }
}

function gcloudMetadata(args) {
  const result = run('gcloud', args)
  return {
    ok: result.ok,
    exitCode: result.exitCode,
    stdout: parseJson(result.stdout, null),
    stderrSummary: sanitize(result.stderr).slice(0, 1000),
  }
}

function read(file) {
  return fs.readFileSync(file, 'utf8')
}

function fileIncludes(file, tokens) {
  const text = read(file)
  return tokens.every((token) => text.includes(token))
}

function listTracked(prefix) {
  const result = run('git', ['ls-files', prefix])
  if (!result.ok) return []
  return result.stdout.trim().split('\n').filter(Boolean)
}

function findFrontendServiceRoleExposure() {
  const files = listTracked('src')
    .filter((file) => /\.(ts|tsx|js|jsx)$/.test(file))
    .filter((file) => !file.startsWith('src/server/'))
    .filter((file) => !file.startsWith('src/backend/'))

  const unsafe = []
  for (const file of files) {
    const text = read(file)
    if (/SUPABASE_SERVICE_ROLE_KEY|import\.meta\.env\.[A-Z0-9_]*SERVICE_ROLE|VITE_[A-Z0-9_]*SERVICE_ROLE/.test(text)) {
      unsafe.push(file)
    }
  }
  return unsafe
}

function validateStaticBoundary() {
  const scaffoldFile = 'server/services/internal-beta-service-role-runtime-scaffold.ts'
  const guardFile = 'server/services/internal-beta-approved-snapshot-service-role-persistence-guard.ts'
  const credentialFile = 'server/config/internal-beta-supabase-credential-context-contract.ts'
  const orchestratorFile = 'server/services/internal-beta-runtime-readiness-orchestrator.ts'

  const scaffold = read(scaffoldFile)
  const routeIds = scaffold.match(/routeId: 'internalBeta\.[^']+'/g) ?? []
  const scaffoldUnsafePattern = /\.from\(|\.insert\(|\.update\(|\.delete\(|\.rpc\(|createClient\(|fetch\(|exec(File)?Sync\(|spawn\(|registerMockRouteHandler\(/g
  const scaffoldUnsafeMatches = scaffold.match(scaffoldUnsafePattern) ?? []
  const frontendServiceRoleExposure = findFrontendServiceRoleExposure()

  const requiredScaffoldTokens = [
    "status: 'disabled_pending_runtime_gate'",
    'routeExecution: false',
    'workerExecution: false',
    'providerModelCalls: false',
    'renderExportExecution: false',
    'creditMutation: false',
    'supabaseMutation: false',
    'privateArtifactAccessEnabled: false',
    'publicArtifactsCreated: false',
    'stripePaymentProcessing: false',
  ]

  const requiredGuardTokens = [
    'evaluateInternalBetaApprovedSnapshotServiceRolePersistenceGuard',
    'blocked_pending_service_role_persistence_runtime_approval',
    'ready_for_separate_service_role_persistence_implementation_no_supabase_write',
    'persistedToSupabase: false',
    'serviceRoleRouteExecution: false',
    'remoteSupabaseMutation: false',
    'sqlExecution: false',
    'workerExecution: false',
    'signedUrlCreation: false',
    'publicArtifactCreation: false',
    'internalBetaUnlock: false',
  ]

  const requiredCredentialTokens = [
    'serviceRoleSecretPayloadAccess: false',
    'frontendServiceRoleCredentialExposure: false',
    'serviceRoleRouteExecution: false',
    'credentialValuesPersisted: false',
    'serviceRolePayloadPrinted: false',
  ]

  const requiredOrchestratorTokens = [
    'serviceRoleRouteExecution: false',
    'serviceRolePersistenceGuard.persistedToSupabase !== false',
    'throw new Error',
    'Internal beta runtime readiness orchestrator service-role persistence guard executed a forbidden remote path.',
  ]

  return {
    scaffoldRouteCount: routeIds.length,
    scaffoldBoundaryTokensPresent: requiredScaffoldTokens.every((token) => scaffold.includes(token)),
    scaffoldUnsafeMatches,
    guardBoundaryTokensPresent: fileIncludes(guardFile, requiredGuardTokens),
    credentialBoundaryTokensPresent: fileIncludes(credentialFile, requiredCredentialTokens),
    orchestratorBoundaryTokensPresent: fileIncludes(orchestratorFile, requiredOrchestratorTokens),
    frontendServiceRoleExposure,
    routeHandlerRegistration: 0,
    mockHandlerRegistration: 0,
    serviceRoleRuntimeFiles: [scaffoldFile, guardFile, credentialFile, orchestratorFile],
  }
}

function buildSafety(overrides = {}) {
  return {
    secretManagerMetadataRead: false,
    secretManagerPayloadAccess: false,
    serviceRoleSecretPayloadAccess: false,
    credentialPayloadPrinted: false,
    credentialPayloadPersistedInRepo: false,
    remoteSupabaseCommand: false,
    remoteSupabaseMutation: false,
    sqlExecution: false,
    sqlMutation: false,
    rpcExecution: false,
    serviceRoleRouteExecution: false,
    routeExecution: false,
    workerExecution: false,
    workerDispatch: false,
    workerLeaseClaim: false,
    storageObjectCreation: false,
    storageObjectRead: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    creditMutation: false,
    creditReservationCreation: false,
    jobEnqueue: false,
    jobEventWrite: false,
    providerCall: false,
    modelCall: false,
    renderExport: false,
    internalBetaUnlock: false,
    externalBetaUnlock: false,
    productionUnlock: false,
    ...overrides,
  }
}

function finish(report, exitCode) {
  const finalReport = {
    packet,
    runId,
    outputDir,
    generatedAt: new Date().toISOString(),
    targetProjectName,
    targetProjectRef,
    ...report,
  }
  fs.writeFileSync(reportPath, `${JSON.stringify(finalReport, null, 2)}\n`)
  const manifest = {
    packet,
    runId,
    outputDir,
    generatedAt: new Date().toISOString(),
    artifacts: [
      {
        fileName: path.basename(reportPath),
        path: reportPath,
        bytes: fs.statSync(reportPath).size,
        sha256: sha256(reportPath),
      },
    ],
  }
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`${packet} result: ${finalReport.decision}`)
  console.log(`Run ID: ${runId}`)
  console.log(`Report: ${reportPath}`)
  console.log(`Manifest: ${manifestPath}`)
  process.exit(exitCode)
}

if (process.env[confirmationVar] !== 'true') {
  finish(
    {
      decision: 'blocked_pending_service_role_runtime_boundary_confirmation',
      execution: 'blocked_no_secret_metadata_or_static_boundary_validation_confirmation_absent',
      blocker: 'blocked_pending_service_role_runtime_boundary_confirmation',
      confirmationVar,
      confirmationObserved: 'absent_or_not_true',
      safety: buildSafety(),
      nextMilestone: packet,
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    1,
  )
}

const cleanSecret = gcloudMetadata([
  'secrets',
  'describe',
  cleanDbUrlSecret,
  `--project=${gcpProject}`,
  '--format=json(name,labels,createTime,replication)',
])
const cleanSecretVersion = gcloudMetadata([
  'secrets',
  'versions',
  'describe',
  '2',
  `--secret=${cleanDbUrlSecret}`,
  `--project=${gcpProject}`,
  '--format=json(name,state,createTime,destroyTime)',
])
const accessTokenSecretMetadata = gcloudMetadata([
  'secrets',
  'describe',
  accessTokenSecret,
  `--project=${gcpProject}`,
  '--format=json(name,labels,createTime,replication)',
])
const accessTokenLatestVersion = gcloudMetadata([
  'secrets',
  'versions',
  'list',
  accessTokenSecret,
  `--project=${gcpProject}`,
  '--limit=1',
  '--sort-by=~createTime',
  '--format=json(name,state,createTime)',
])

const staticBoundary = validateStaticBoundary()
const secretMetadata = {
  gcpProject,
  approvedReferences: [cleanDbUrlSecret, accessTokenSecret],
  cleanDbUrlSecret: {
    metadataPresent: cleanSecret.ok,
    expectedName: `projects/390722338345/secrets/${cleanDbUrlSecret}`,
    name: cleanSecret.stdout?.name ?? null,
    labels: cleanSecret.stdout?.labels ?? null,
    version2Enabled: cleanSecretVersion.stdout?.state === 'ENABLED',
    version2Name: cleanSecretVersion.stdout?.name ?? null,
    version2CreateTime: cleanSecretVersion.stdout?.createTime ?? null,
  },
  accessTokenSecret: {
    metadataPresent: accessTokenSecretMetadata.ok,
    expectedName: `projects/390722338345/secrets/${accessTokenSecret}`,
    name: accessTokenSecretMetadata.stdout?.name ?? null,
    latestVersionEnabled: Array.isArray(accessTokenLatestVersion.stdout)
      ? accessTokenLatestVersion.stdout[0]?.state === 'ENABLED'
      : false,
    latestVersionName: Array.isArray(accessTokenLatestVersion.stdout)
      ? accessTokenLatestVersion.stdout[0]?.name ?? null
      : null,
    latestVersionCreateTime: Array.isArray(accessTokenLatestVersion.stdout)
      ? accessTokenLatestVersion.stdout[0]?.createTime ?? null
      : null,
  },
  payloadAccess: false,
}

const blockers = []
if (!cleanSecret.ok || !cleanSecretVersion.ok || !accessTokenSecretMetadata.ok || !accessTokenLatestVersion.ok) {
  blockers.push('blocked_secret_manager_reference_metadata_unavailable')
}
if (secretMetadata.cleanDbUrlSecret.version2Enabled !== true) {
  blockers.push('blocked_clean_staging_db_url_secret_version_not_enabled')
}
if (secretMetadata.accessTokenSecret.latestVersionEnabled !== true) {
  blockers.push('blocked_supabase_access_token_secret_metadata_not_enabled')
}
if (staticBoundary.scaffoldRouteCount !== 8) blockers.push('blocked_service_role_scaffold_route_count_mismatch')
if (!staticBoundary.scaffoldBoundaryTokensPresent) blockers.push('blocked_service_role_scaffold_fail_closed_boundary_missing')
if (staticBoundary.scaffoldUnsafeMatches.length > 0) blockers.push('blocked_service_role_scaffold_contains_runtime_signal')
if (!staticBoundary.guardBoundaryTokensPresent) blockers.push('blocked_approved_snapshot_service_role_guard_boundary_missing')
if (!staticBoundary.credentialBoundaryTokensPresent) blockers.push('blocked_credential_context_service_role_boundary_missing')
if (!staticBoundary.orchestratorBoundaryTokensPresent) blockers.push('blocked_runtime_orchestrator_service_role_boundary_missing')
if (staticBoundary.frontendServiceRoleExposure.length > 0) blockers.push('blocked_frontend_service_role_credential_exposure_signal')

if (blockers.length > 0) {
  finish(
    {
      decision: blockers[0],
      execution: 'blocked_guarded_service_role_runtime_boundary_validation',
      blocker: blockers[0],
      allBlockers: blockers,
      confirmationVar,
      confirmationObserved: 'present_true',
      secretMetadata,
      staticBoundary,
      safety: buildSafety({ secretManagerMetadataRead: true }),
      nextMilestone: packet,
      productReadyEndToEndLocalOssTools: 0,
      packageLock: 'unchanged',
      generatedArtifactsCommitted: 'none',
    },
    1,
  )
}

finish(
  {
    decision: 'completed_service_role_runtime_boundary_validation',
    execution: 'completed_guarded_secret_metadata_and_static_backend_boundary_validation_no_service_role_payload_or_runtime_execution',
    blocker: 'none',
    confirmationVar,
    confirmationObserved: 'present_true',
    secretMetadata,
    staticBoundary,
    readiness: {
      approvedSnapshotServiceRolePersistence: 'ready_for_separate_service_role_persistence_implementation_no_supabase_write',
      workerRuntimeTrackaPrivateE2eExecutionGate2r:
        'blocked_pending_service_role_persistence_private_storage_artifact_job_and_e2e_gates',
      internalBetaReadinessRollup:
        'blocked_pending_service_role_persistence_private_storage_artifact_job_and_e2e_gates',
      externalProductBeta: 'blocked_pending_internal_beta_evidence_security_privacy_support_cost_and_deployment_gates',
    },
    safety: buildSafety({ secretManagerMetadataRead: true }),
    nextMilestone: 'RP-INTERNAL-BETA-APPROVED-SNAPSHOT-SERVICE-ROLE-PERSISTENCE-IMPLEMENTATION-1',
    productReadyEndToEndLocalOssTools: 0,
    packageLock: 'unchanged',
    generatedArtifactsCommitted: 'none',
  },
  0,
)
