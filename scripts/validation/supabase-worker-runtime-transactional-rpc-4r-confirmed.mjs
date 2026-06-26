#!/usr/bin/env node
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-CONFIRMED'
const targetPacket = 'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED'
const credentialContextPacket = 'RP-INTERNAL-BETA-SUPABASE-CREDENTIAL-CONTEXT-CONTRACT-1'
const migrationFile = 'supabase/migrations/202606180001_worker_runtime_transactional_rpc.sql'
const targetValidationReportVar = 'REEDITPRO_SUPABASE_TARGET_RLS_STORAGE_VALIDATION_REPORT'
const outputRoot = '/tmp/reeditpro-supabase-worker-runtime-transactional-rpc-4r-confirmed'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(outputRoot, runId)
const reportPath = path.join(outputDir, 'rpc-4r-confirmed-report.json')
const manifestPath = path.join(outputDir, 'rpc-4r-confirmed-manifest.json')

const requiredConfirmations = [
  'REEDITPRO_CONFIRM_SUPABASE_WORKER_RUNTIME_RPC_MIGRATION',
  'REEDITPRO_CONFIRM_SUPABASE_STAGING_SQL',
  'REEDITPRO_CONFIRM_WORKER_RUNTIME_TRANSACTIONAL_RPC_SCOPE',
  'REEDITPRO_CONFIRM_SUPABASE_TARGET_IS_STAGING',
  'REEDITPRO_CONFIRM_NO_PRODUCTION_SUPABASE',
  'REEDITPRO_CONFIRM_SECRET_MANAGER_BACKEND_CREDENTIAL_RESOLUTION',
]

const approvedAccessTokenAliases = [
  'SUPABASE_ACCESS_TOKEN',
  'REEDITPRO_STAGING_SUPABASE_ACCESS_TOKEN',
  'REEDITPRO_SUPABASE_ACCESS_TOKEN',
]

const approvedReadonlyDbUrlAliases = [
  'REEDITPRO_SUPABASE_READONLY_DB_URL',
  'REEDITPRO_STAGING_SUPABASE_DB_URL',
  'SUPABASE_STAGING_DB_URL',
  'STAGING_SUPABASE_DB_URL',
  'REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL',
]

fs.mkdirSync(outputDir, { recursive: true })

function sha256Buffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

function sha256File(file) {
  return sha256Buffer(fs.readFileSync(file))
}

function safeStat(file) {
  const stat = fs.statSync(file)
  return { bytes: stat.size, sha256: sha256File(file) }
}

function confirmationState() {
  return Object.fromEntries(
    requiredConfirmations.map((name) => [name, process.env[name] === 'true' ? 'present_true' : 'absent_or_not_true']),
  )
}

function missingConfirmations() {
  return requiredConfirmations.filter((name) => process.env[name] !== 'true')
}

function hasEnvValue(name) {
  return typeof process.env[name] === 'string' && process.env[name].trim().length > 0
}

function credentialContextDecision() {
  const hasAccessToken = approvedAccessTokenAliases.some(hasEnvValue)
  const hasReadonlyDbUrl = approvedReadonlyDbUrlAliases.some(hasEnvValue)

  if (!hasAccessToken && !hasReadonlyDbUrl) {
    return 'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias'
  }

  if (!hasAccessToken) return 'blocked_missing_approved_supabase_access_token_alias'
  if (!hasReadonlyDbUrl) return 'blocked_missing_approved_supabase_readonly_db_url_alias'

  return 'completed_approved_supabase_credential_alias_presence_preflight_no_payload_access'
}

function credentialPresence() {
  return {
    supabaseAccessToken: approvedAccessTokenAliases.some(hasEnvValue),
    readonlyDatabaseUrl: approvedReadonlyDbUrlAliases.some(hasEnvValue),
    serviceRoleKey: false,
    databasePassword: false,
  }
}

function readTargetValidationReport() {
  const reportFile = process.env[targetValidationReportVar]
  if (!reportFile) {
    return {
      status: 'missing',
      blocker: 'blocked_pending_confirmed_supabase_target_rls_storage_validation',
    }
  }

  if (!fs.existsSync(reportFile)) {
    return {
      status: 'missing_file',
      blocker: 'blocked_confirmed_supabase_target_rls_storage_validation_report_unavailable',
      reportFile,
    }
  }

  try {
    const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'))
    const passed =
      report.packet === targetPacket &&
      report.decision === 'completed_guarded_supabase_target_rls_storage_readonly_validation' &&
      report.targetRef === 'wmyyttnynmteqgcdishd' &&
      report.targetClass === 'staging' &&
      report.safety?.remoteSupabaseMutation === false &&
      report.safety?.sqlMutation === false &&
      report.safety?.migrationApply === false &&
      report.safety?.serviceRoleSecretPayloadAccess === false

    if (!passed) {
      return {
        status: 'failed_or_mismatched',
        blocker: 'blocked_confirmed_supabase_target_rls_storage_validation_not_passed',
        reportFile,
      }
    }

    return {
      status: 'passed',
      reportFile,
      reportSha256: sha256File(reportFile),
      reportBytes: fs.statSync(reportFile).size,
    }
  } catch {
    return {
      status: 'unreadable',
      blocker: 'blocked_confirmed_supabase_target_rls_storage_validation_report_unreadable',
      reportFile,
    }
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`)
}

function finish(decision, execution, extra = {}, exitCode = 1) {
  const migration = safeStat(migrationFile)
  const report = {
    packet,
    runId,
    outputDir,
    decision,
    execution,
    blocker: extra.blocker ?? decision,
    confirmationState: confirmationState(),
    credentialContext: {
      contractPacket: credentialContextPacket,
      decision: extra.credentialContextDecision ?? 'not_checked',
      requiredBeforeTargetValidationAndSql: true,
      acceptedAccessTokenAliases: approvedAccessTokenAliases,
      acceptedReadonlyDbUrlAliases: approvedReadonlyDbUrlAliases,
      credentialPresence: credentialPresence(),
      credentialPayloadsPrinted: false,
      credentialPayloadsPersisted: false,
    },
    targetValidationDependency: extra.targetValidationDependency ?? 'not_checked',
    migrationSource: {
      file: migrationFile,
      bytes: migration.bytes,
      sha256: migration.sha256,
      status: 'static_source_only_not_executed',
    },
    supabase: {
      environmentTouched: 'none',
      sqlExecuted: 'none',
      migrationDeployed: 'no',
      readbackStatus: 'not_run',
      productionTouched: false,
      serviceRoleSecretPayloadAccess: false,
      secretPayloadPrinted: false,
    },
    safety: {
      remoteSupabaseMutation: false,
      sqlExecution: false,
      migrationApply: false,
      rlsPolicyApply: false,
      storageBucketCreation: false,
      storageObjectCreation: false,
      storageObjectRead: false,
      serviceRoleSecretPayloadAccess: false,
      frontendServiceRoleCredentialExposure: false,
      serviceRoleRouteExecution: false,
      workerExecution: false,
      workerDispatch: false,
      workerLeaseClaim: false,
      providerModelCall: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      creditMutation: false,
      internalBetaUnlock: false,
      externalBetaUnlock: false,
      productionUnlock: false,
      finalRenderExport: false,
    },
    productReadyEndToEndLocalOssTools: 0,
    nextMilestone: 'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-CONFIRMED-EXTERNAL-STAGING-SQL-EXECUTION',
    ...extra,
  }

  writeJson(reportPath, report)
  const manifest = {
    packet,
    runId,
    outputDir,
    generatedAt: new Date().toISOString(),
    artifacts: [
      {
        fileName: path.basename(reportPath),
        path: reportPath,
        ...safeStat(reportPath),
      },
    ],
  }
  writeJson(manifestPath, manifest)
  manifest.artifacts.push({
    fileName: path.basename(manifestPath),
    path: manifestPath,
    ...safeStat(manifestPath),
  })
  writeJson(manifestPath, manifest)

  console.log(`${packet} result: ${decision}`)
  console.log(`Execution: ${execution}`)
  console.log(`Run ID: ${runId}`)
  console.log(`Output directory: ${outputDir}`)
  console.log(`Report: ${reportPath}`)
  console.log(`Manifest: ${manifestPath}`)
  process.exit(exitCode)
}

const absent = missingConfirmations()
if (absent.length > 0) {
  finish(
    'blocked_pending_rpc_4r_confirmed_staging_sql_gates',
    'blocked_confirmation_absent_no_sql_execution',
    {
      blocker: 'blocked_pending_rpc_4r_confirmed_staging_sql_gates',
      missingConfirmations: absent,
      targetValidationDependency: 'not_checked_confirmation_absent',
    },
  )
}

const credentialDecision = credentialContextDecision()
if (credentialDecision !== 'completed_approved_supabase_credential_alias_presence_preflight_no_payload_access') {
  finish(credentialDecision, 'blocked_no_sql_execution_missing_safe_credential_context', {
    blocker: credentialDecision,
    credentialContextDecision: credentialDecision,
    targetValidationDependency: 'not_checked_missing_safe_credential_context',
  })
}

const targetValidation = readTargetValidationReport()
if (targetValidation.status !== 'passed') {
  finish(targetValidation.blocker, 'blocked_missing_confirmed_target_validation_no_sql_execution', {
    blocker: targetValidation.blocker,
    targetValidationDependency: targetValidation,
  })
}

finish(
  'blocked_rpc_4r_confirmed_sql_execution_requires_external_guarded_staging_runner',
  'blocked_confirmed_target_validation_present_but_no_sql_execution_in_codex_session',
  {
    blocker: 'blocked_rpc_4r_confirmed_sql_execution_requires_external_guarded_staging_runner',
    targetValidationDependency: targetValidation,
    note: 'This Codex runner intentionally stops before SQL execution. A future external guarded staging SQL runner must use approved credential handling and record readback evidence without printing secrets.',
  },
)
