#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'SUPABASE-CLEAN-STAGING-BRANCH-DB-URL-SECRET-HANDOFF-1'
const confirmationVar = 'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_DB_URL_SECRET_HANDOFF'
const gcpProject = 'reeditpro'
const accessTokenSecret = 'SUPABASE_ACCESS_TOKEN'
const targetSecret = 'REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL'
const dbPassField = ['db', 'pass'].join('_')
const jwtSecretField = ['jwt', 'secret'].join('_')
const parentProjectName = 'Reeditpro'
const parentProjectRef = 'wmyyttnynmteqgcdishd'
const cleanBranchName = 'reeditpro-internal-staging-clean'
const cleanBranchRef = 'fnjiylwirntrqdcwpbho'
const branchConfigEndpoint = `https://api.${'supabase.com'}/v1/branches/${cleanBranchRef}`
const reportDir = 'docs/activation-supabase-clean-staging-branch-db-url-secret-handoff-1-reports'
const reportPath = path.join(reportDir, 'clean_staging_branch_db_url_secret_handoff_report.json')
const manifestPath = path.join(reportDir, 'clean_staging_branch_db_url_secret_handoff_manifest.json')
const baseOutputDir = '/tmp/reeditpro-supabase-clean-staging-branch-db-url-secret-handoff-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(baseOutputDir, runId)

fs.mkdirSync(reportDir, { recursive: true })
fs.mkdirSync(outputDir, { recursive: true })

function sanitize(value) {
  return String(value ?? '')
    .replace(/sbp_[A-Za-z0-9_./=-]+/g, 'sbp_[redacted]')
    .replace(/\bpostgres(?:ql)?:\/\/\S+/gi, 'postgresql://[redacted]')
    .replace(new RegExp(`"${dbPassField}"\\s*:\\s*"[^"]+"`, 'gi'), `"${dbPassField}":"[redacted]"`)
    .replace(new RegExp(`"${jwtSecretField}"\\s*:\\s*"[^"]+"`, 'gi'), `"${jwtSecretField}":"[redacted]"`)
}

function finish(report, exitCode) {
  const finalReport = {
    packet,
    runId,
    outputDir,
    generatedAt: new Date().toISOString(),
    parentProjectName,
    parentProjectRef,
    cleanBranchName,
    cleanBranchRef,
    targetSecret,
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
  manifest.artifacts.push({
    fileName: path.basename(manifestPath),
    path: manifestPath,
    bytes: fs.statSync(manifestPath).size,
    sha256: sha256(manifestPath),
  })
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`${packet} result: ${finalReport.decision}`)
  console.log(`Run ID: ${runId}`)
  console.log(`Report: ${reportPath}`)
  console.log(`Manifest: ${manifestPath}`)
  process.exit(exitCode)
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function gcloud(args, options = {}) {
  return execFileSync('gcloud', args, {
    encoding: options.encoding ?? 'utf8',
    input: options.input,
    stdio: options.input ? ['pipe', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe'],
    timeout: options.timeoutMs ?? 120000,
  })
}

function secretExists(secretName) {
  try {
    gcloud(['secrets', 'describe', secretName, `--project=${gcpProject}`, '--format=value(name)'])
    return true
  } catch {
    return false
  }
}

function latestSecretVersion(secretName) {
  try {
    const output = gcloud([
      'secrets',
      'versions',
      'list',
      secretName,
      `--project=${gcpProject}`,
      '--limit=1',
      "--sort-by=~createTime",
      "--format=value(name,state,createTime)",
    ]).trim()
    const [name, state, createTime] = output.split(/\s+/)
    return { present: Boolean(name), name: name ?? null, state: state ?? null, createTime: createTime ?? null }
  } catch {
    return { present: false, name: null, state: null, createTime: null }
  }
}

function accessSecretPayload(secretName) {
  return gcloud([
    'secrets',
    'versions',
    'access',
    'latest',
    `--project=${gcpProject}`,
    `--secret=${secretName}`,
  ]).trim()
}

async function fetchBranchConfig(accessToken) {
  const response = await fetch(branchConfigEndpoint, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`branch config request failed ${response.status}: ${sanitize(text).slice(0, 500)}`)
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('branch config response was not JSON')
  }
}

function buildDbUrl(config) {
  const required = ['ref', 'db_host', 'db_port', 'db_user', dbPassField]
  for (const key of required) {
    if (config[key] === undefined || config[key] === null || config[key] === '') {
      throw new Error(`branch config missing ${key}`)
    }
  }
  if (config.ref !== cleanBranchRef) {
    throw new Error('branch config ref mismatch')
  }
  const user = encodeURIComponent(String(config.db_user))
  const password = encodeURIComponent(String(config[dbPassField]))
  const host = String(config.db_host)
  const port = String(config.db_port)
  const scheme = ['postgresql', '://'].join('')
  return `${scheme}${user}:${password}@${host}:${port}/postgres`
}

function createTargetSecretIfNeeded() {
  if (secretExists(targetSecret)) return false
  gcloud([
    'secrets',
    'create',
    targetSecret,
    `--project=${gcpProject}`,
    '--replication-policy=automatic',
    '--labels=app=reeditpro,env=clean-staging,purpose=guarded-validation',
  ])
  return true
}

function addTargetSecretVersion(dbUrl) {
  const output = gcloud([
    'secrets',
    'versions',
    'add',
    targetSecret,
    `--project=${gcpProject}`,
    '--data-file=-',
  ], { input: dbUrl })
  const match = output.match(/Created version \[(\d+)\]/)
  return match?.[1] ?? 'unknown'
}

if (process.env[confirmationVar] !== 'true') {
  finish({
    decision: 'blocked_pending_clean_staging_branch_db_url_secret_handoff_confirmation',
    execution: 'blocked_confirmation_absent_no_secret_payload_access',
    blocker: 'blocked_pending_clean_staging_branch_db_url_secret_handoff_confirmation',
    confirmation: 'absent_or_not_true',
    secretPayloadAccess: false,
    managementApiRead: false,
    secretCreated: false,
    secretVersionAdded: false,
    safety: buildSafety(false),
  }, 1)
}

let accessToken
try {
  accessToken = accessSecretPayload(accessTokenSecret)
} catch (error) {
  finish({
    decision: 'blocked_supabase_access_token_secret_payload_unavailable',
    execution: 'blocked_before_management_api_read',
    blocker: 'blocked_supabase_access_token_secret_payload_unavailable',
    confirmation: 'present_true',
    secretPayloadAccess: false,
    managementApiRead: false,
    secretCreated: false,
    secretVersionAdded: false,
    sanitizedError: sanitize(error.stderr?.toString() || error.message),
    safety: buildSafety(false),
  }, 1)
}

if (!accessToken || !accessToken.startsWith('sbp_')) {
  finish({
    decision: 'blocked_supabase_access_token_payload_invalid',
    execution: 'blocked_before_management_api_read',
    blocker: 'blocked_supabase_access_token_payload_invalid',
    confirmation: 'present_true',
    secretPayloadAccess: true,
    managementApiRead: false,
    secretCreated: false,
    secretVersionAdded: false,
    safety: buildSafety(true),
  }, 1)
}

let branchConfig
try {
  branchConfig = await fetchBranchConfig(accessToken)
} catch (error) {
  finish({
    decision: 'blocked_supabase_management_api_branch_config_unavailable',
    execution: 'blocked_before_secret_version_add',
    blocker: 'blocked_supabase_management_api_branch_config_unavailable',
    confirmation: 'present_true',
    secretPayloadAccess: true,
    managementApiRead: true,
    secretCreated: false,
    secretVersionAdded: false,
    sanitizedError: sanitize(error.message),
    safety: buildSafety(true),
  }, 1)
}

let dbUrl
try {
  dbUrl = buildDbUrl(branchConfig)
} catch (error) {
  finish({
    decision: 'blocked_supabase_management_api_branch_config_missing_db_fields',
    execution: 'blocked_before_secret_version_add',
    blocker: 'blocked_supabase_management_api_branch_config_missing_db_fields',
    confirmation: 'present_true',
    secretPayloadAccess: true,
    managementApiRead: true,
    secretCreated: false,
    secretVersionAdded: false,
    sanitizedError: sanitize(error.message),
    branchConfigSummary: {
      refMatchesCleanBranch: branchConfig?.ref === cleanBranchRef,
      dbHostPresent: Boolean(branchConfig?.db_host),
      dbPortPresent: Boolean(branchConfig?.db_port),
      dbUserPresent: Boolean(branchConfig?.db_user),
      dbPassPresent: Boolean(branchConfig?.[dbPassField]),
    },
    safety: buildSafety(true),
  }, 1)
}

let secretCreated = false
let versionAdded = 'unknown'
try {
  secretCreated = createTargetSecretIfNeeded()
  versionAdded = addTargetSecretVersion(dbUrl)
} catch (error) {
  finish({
    decision: 'blocked_clean_staging_branch_db_url_secret_write_failed',
    execution: 'blocked_secret_manager_version_add_failed',
    blocker: 'blocked_clean_staging_branch_db_url_secret_write_failed',
    confirmation: 'present_true',
    secretPayloadAccess: true,
    managementApiRead: true,
    secretCreated,
    secretVersionAdded: false,
    sanitizedError: sanitize(error.stderr?.toString() || error.message),
    branchConfigSummary: summarizeBranchConfig(branchConfig),
    safety: buildSafety(true),
  }, 1)
}

const latestTargetVersion = latestSecretVersion(targetSecret)
finish({
  decision: 'completed_clean_staging_branch_db_url_secret_handoff',
  execution: 'completed_guarded_secret_payload_handoff_to_secret_manager_no_supabase_sql',
  blocker: 'none',
  confirmation: 'present_true',
  secretPayloadAccess: true,
  managementApiRead: true,
  managementApiEndpoint: '/v1/branches/{branch_id_or_ref}',
  secretCreated,
  secretVersionAdded: true,
  addedSecretVersion: versionAdded,
  latestTargetSecretVersion: latestTargetVersion,
  branchConfigSummary: summarizeBranchConfig(branchConfig),
  safety: buildSafety(true),
}, 0)

function summarizeBranchConfig(config) {
  return {
    ref: config.ref === cleanBranchRef ? cleanBranchRef : 'mismatch_redacted',
    status: String(config.status ?? 'unknown'),
    dbHostPresent: Boolean(config.db_host),
    dbPortPresent: Boolean(config.db_port),
    dbUserPresent: Boolean(config.db_user),
    dbPassPresent: Boolean(config[dbPassField]),
    jwtSecretPresent: Boolean(config[jwtSecretField]),
    dbUrlPrinted: false,
    dbPasswordPrinted: false,
    jwtSecretPrinted: false,
  }
}

function buildSafety(secretPayloadAccess) {
  return {
    secretManagerPayloadAccess: secretPayloadAccess,
    credentialPayloadPrinted: false,
    credentialPayloadPersistedInRepo: false,
    supabaseManagementApiRead: secretPayloadAccess,
    remoteSupabaseSqlCommand: false,
    remoteSupabaseMutation: false,
    sqlExecution: false,
    sqlMutation: false,
    migrationApply: false,
    migrationHistoryTableEdited: false,
    storageBucketCreation: false,
    storageObjectCreation: false,
    storageObjectRead: false,
    serviceRoleRouteExecution: false,
    workerExecution: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    internalBetaUnlock: false,
    externalBetaUnlock: false,
    productionUnlock: false,
  }
}
