#!/usr/bin/env node
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'RP-INTERNAL-BETA-SUPABASE-TARGET-CREDENTIAL-CONTEXT-PREFLIGHT-1'
const targetName = 'Reeditpro'
const targetRef = 'wmyyttnynmteqgcdishd'
const targetClass = 'staging'
const accessTokenEnvNames = [
  'SUPABASE_ACCESS_TOKEN',
  'REEDITPRO_STAGING_SUPABASE_ACCESS_TOKEN',
  'REEDITPRO_SUPABASE_ACCESS_TOKEN',
]
const readonlyDbUrlEnvNames = [
  'REEDITPRO_SUPABASE_READONLY_DB_URL',
  'REEDITPRO_STAGING_SUPABASE_DB_URL',
  'SUPABASE_STAGING_DB_URL',
  'STAGING_SUPABASE_DB_URL',
  'REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL',
]
const baseOutputDir = '/tmp/reeditpro-rp-internal-beta-supabase-target-credential-context-preflight-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(baseOutputDir, runId)
const reportPath = path.join(outputDir, 'credential-context-preflight-report.json')
const manifestPath = path.join(outputDir, 'artifact-manifest.json')

fs.mkdirSync(outputDir, { recursive: true })

function isPresent(name) {
  return Object.prototype.hasOwnProperty.call(process.env, name) && process.env[name] !== ''
}

function firstPresentEnvName(names) {
  return names.find((name) => isPresent(name)) ?? null
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
}

function finish(decision, execution, blocker, exitCode) {
  const accessTokenEnvName = firstPresentEnvName(accessTokenEnvNames)
  const readonlyDbUrlEnvName = firstPresentEnvName(readonlyDbUrlEnvNames)
  const report = {
    packet,
    runId,
    outputDir,
    targetName,
    targetRef,
    targetClass,
    decision,
    execution,
    blocker,
    credentialPresence: {
      supabaseAccessToken: Boolean(accessTokenEnvName),
      supabaseAccessTokenEnv: accessTokenEnvName,
      readonlyDatabaseUrl: Boolean(readonlyDbUrlEnvName),
      readonlyDatabaseUrlEnv: readonlyDbUrlEnvName,
      acceptedAccessTokenEnvNames: accessTokenEnvNames,
      acceptedReadonlyDbUrlEnvNames: readonlyDbUrlEnvNames,
      serviceRoleKey: isPresent('SUPABASE_SERVICE_ROLE_KEY'),
      databasePassword: isPresent('SUPABASE_DB_PASSWORD'),
    },
    commandsExecuted: 0,
    payloadPolicy: {
      secretPayloadAccess: false,
      accessTokenPayloadPrinted: false,
      databaseUrlPayloadPrinted: false,
      serviceRolePayloadPrinted: false,
      credentialValuesPersisted: false,
    },
    safety: {
      remoteSupabaseCommand: false,
      remoteSupabaseMutation: false,
      sqlExecution: false,
      sqlMutation: false,
      migrationApply: false,
      storageBucketCreation: false,
      storageObjectCreation: false,
      storageObjectRead: false,
      serviceRoleSecretPayloadAccess: false,
      frontendServiceRoleCredentialExposure: false,
      serviceRoleRouteExecution: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      workerExecution: false,
      providerModelCall: false,
      renderExport: false,
      internalBetaUnlock: false,
      externalBetaUnlock: false,
      productionUnlock: false,
    },
    nextRequiredAction:
      decision === 'completed_approved_supabase_credential_alias_presence_preflight_no_payload_access'
        ? 'run_confirmed_readonly_supabase_target_validation'
        : 'provide_approved_supabase_access_token_alias_and_readonly_db_url_alias_without_payload_logging',
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
        bytes: fs.statSync(reportPath).size,
        sha256: sha256(reportPath),
      },
    ],
  }
  writeJson(manifestPath, manifest)
  manifest.artifacts.push({
    fileName: path.basename(manifestPath),
    path: manifestPath,
    bytes: fs.statSync(manifestPath).size,
    sha256: sha256(manifestPath),
  })
  writeJson(manifestPath, manifest)

  console.log(`${packet} result: ${decision}`)
  console.log(`Run ID: ${runId}`)
  console.log(`Output directory: ${outputDir}`)
  console.log(`Report: ${reportPath}`)
  console.log(`Manifest: ${manifestPath}`)
  process.exit(exitCode)
}

const hasAccessToken = Boolean(firstPresentEnvName(accessTokenEnvNames))
const hasReadonlyDbUrl = Boolean(firstPresentEnvName(readonlyDbUrlEnvNames))

if (!hasAccessToken && !hasReadonlyDbUrl) {
  finish(
    'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias',
    'blocked_no_remote_execution_missing_safe_credential_context',
    'blocked_missing_approved_supabase_access_token_alias_and_readonly_db_url_alias',
    1,
  )
}

if (!hasAccessToken) {
  finish(
    'blocked_missing_approved_supabase_access_token_alias',
    'blocked_no_remote_execution_missing_safe_credential_context',
    'blocked_missing_approved_supabase_access_token_alias',
    1,
  )
}

if (!hasReadonlyDbUrl) {
  finish(
    'blocked_missing_approved_supabase_readonly_db_url_alias',
    'blocked_no_remote_execution_missing_safe_credential_context',
    'blocked_missing_approved_supabase_readonly_db_url_alias',
    1,
  )
}

finish(
  'completed_approved_supabase_credential_alias_presence_preflight_no_payload_access',
  'completed_local_presence_only_preflight_no_remote_execution',
  'none',
  0,
)
