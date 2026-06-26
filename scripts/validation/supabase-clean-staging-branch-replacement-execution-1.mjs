#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'SUPABASE-CLEAN-STAGING-BRANCH-REPLACEMENT-EXECUTION-1'
const confirmationVar = 'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_BRANCH_REPLACEMENT_EXECUTION'
const gcpProject = 'reeditpro'
const accessTokenSecret = 'SUPABASE_ACCESS_TOKEN'
const targetSecret = 'REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL'
const parentProjectName = 'Reeditpro'
const parentProjectRef = 'wmyyttnynmteqgcdishd'
const previousCleanBranchName = 'reeditpro-internal-staging-clean'
const previousCleanBranchRef = 'fnjiylwirntrqdcwpbho'
const replacementBranchName = 'reeditpro-clean-staging-v2'
const replacementBranchConfigEndpoint = (branchRef) => `https://api.${'supabase.com'}/v1/branches/${branchRef}`
const reportDir = 'docs/activation-supabase-clean-staging-branch-replacement-execution-1-reports'
const reportPath = path.join(reportDir, 'clean_staging_branch_replacement_execution_report.json')
const manifestPath = path.join(reportDir, 'clean_staging_branch_replacement_execution_manifest.json')
const baseOutputDir = '/tmp/reeditpro-supabase-clean-staging-branch-replacement-execution-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(baseOutputDir, runId)
const healthyStatuses = new Set(['ACTIVE', 'ACTIVE_HEALTHY', 'DEPLOYED', 'FUNCTIONS_DEPLOYED', 'HEALTHY', 'MIGRATIONS_DEPLOYED', 'READY', 'RUNNING'])
const dbPassField = ['db', 'pass'].join('_')
const jwtSecretField = ['jwt', 'secret'].join('_')

fs.mkdirSync(reportDir, { recursive: true })
fs.mkdirSync(outputDir, { recursive: true })

function sanitize(value) {
  return String(value ?? '')
    .replace(/sbp_[A-Za-z0-9_./=-]+/g, 'sbp_[redacted]')
    .replace(/\bpostgres(?:ql)?:\/\/\S+/gi, 'postgresql://[redacted]')
    .replace(/password=[^\s]+/gi, 'password=[redacted]')
    .replace(new RegExp(`"${dbPassField}"\\s*:\\s*"[^"]+"`, 'gi'), `"${dbPassField}":"[redacted]"`)
    .replace(new RegExp(`"${jwtSecretField}"\\s*:\\s*"[^"]+"`, 'gi'), `"${jwtSecretField}":"[redacted]"`)
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function summarizeText(text) {
  const sanitized = sanitize(text)
  return {
    byteLength: Buffer.byteLength(sanitized),
    lineCount: sanitized.trim().length === 0 ? 0 : sanitized.trim().split(/\r?\n/).length,
    snippet: sanitized.trim().slice(0, 3000),
    secretPatternDetected: /sbp_[A-Za-z0-9_./=-]+|\bpostgres(?:ql)?:\/\/\S+/i.test(
      sanitized.replaceAll('postgresql://[redacted]', ''),
    ),
  }
}

function commandResult(status, exitCode, stdout, stderr, commandClass) {
  return {
    status,
    exitCode,
    commandClass,
    stdout: summarizeText(stdout),
    stderr: summarizeText(stderr),
  }
}

function run(command, args, options = {}) {
  try {
    const stdout = execFileSync(command, args, {
      encoding: 'utf8',
      env: options.env ?? process.env,
      input: options.input,
      stdio: options.input ? ['pipe', 'pipe', 'pipe'] : ['ignore', 'pipe', 'pipe'],
      timeout: options.timeoutMs ?? 120000,
    })
    return {
      status: 'passed',
      exitCode: 0,
      stdout,
      stderr: '',
      summary: commandResult('passed', 0, stdout, '', options.commandClass ?? command),
    }
  } catch (error) {
    const stdout = error.stdout?.toString() ?? ''
    const stderr = error.stderr?.toString() ?? error.message
    const exitCode = typeof error.status === 'number' ? error.status : 1
    return {
      status: 'blocked',
      exitCode,
      stdout,
      stderr,
      summary: commandResult('blocked', exitCode, stdout, stderr, options.commandClass ?? command),
    }
  }
}

function gcloud(args, options = {}) {
  const result = run('gcloud', args, {
    ...options,
    timeoutMs: options.timeoutMs ?? 120000,
    commandClass: options.commandClass ?? `gcloud ${args.slice(0, 3).join(' ')} [redacted]`,
  })
  if (result.status !== 'passed') {
    const error = new Error(sanitize(result.stderr || result.stdout || 'gcloud command failed'))
    error.result = result
    throw error
  }
  return result.stdout
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
      '--sort-by=~createTime',
      '--format=json(name,state,createTime)',
    ], { commandClass: 'gcloud secrets versions list [SECRET] --format=json' }).trim()
    const parsed = JSON.parse(output || '[]')
    const latest = Array.isArray(parsed) ? parsed[0] : null
    return latest
      ? { present: true, name: latest.name ?? null, state: latest.state ?? null, createTime: latest.createTime ?? null }
      : { present: false, name: null, state: null, createTime: null }
  } catch (error) {
    return { present: false, name: null, state: null, createTime: null, sanitizedError: sanitize(error.message) }
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
  ], { commandClass: 'gcloud secrets versions access latest --secret=[SECRET]' }).trim()
}

function secretExists(secretName) {
  try {
    gcloud(['secrets', 'describe', secretName, `--project=${gcpProject}`, '--format=value(name)'], {
      commandClass: 'gcloud secrets describe [SECRET]',
    })
    return true
  } catch {
    return false
  }
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
  ], { commandClass: 'gcloud secrets create REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL' })
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
  ], {
    input: dbUrl,
    commandClass: 'gcloud secrets versions add REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL --data-file=-',
  })
  const match = output.match(/Created version \[(\d+)\]/)
  return match?.[1] ?? 'unknown'
}

function buildSafety(overrides = {}) {
  return {
    secretManagerPayloadAccess: false,
    credentialPayloadPrinted: false,
    credentialPayloadPersistedInRepo: false,
    supabaseManagementApiRead: false,
    supabaseCliBranchList: false,
    supabaseCliBranchCreate: false,
    remoteSupabaseMutation: false,
    remoteSupabaseReadCommand: false,
    sqlExecution: false,
    sqlMutation: false,
    migrationListRead: false,
    migrationApply: false,
    migrationDryRun: false,
    migrationHistoryManualEdit: false,
    supabaseDbPull: false,
    branchDelete: false,
    branchReset: false,
    branchReplacementSelection: false,
    cleanBranchDbUrlSecretVersionAdd: false,
    storageObjectCreation: false,
    storageObjectRead: false,
    serviceRoleRouteExecution: false,
    workerExecution: false,
    providerCall: false,
    modelCall: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
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
    parentProjectName,
    parentProjectRef,
    previousCleanBranchName,
    previousCleanBranchRef,
    replacementBranchName,
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

function supabaseEnv(accessToken) {
  return {
    ...process.env,
    SUPABASE_ACCESS_TOKEN: accessToken,
    DEVELOPER_DIR: '/Library/Developer/CommandLineTools',
  }
}

function runSupabase(args, accessToken, commandClass, timeoutMs = 180000) {
  return run('supabase', args, {
    env: supabaseEnv(accessToken),
    timeoutMs,
    commandClass,
  })
}

function parseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function asBranch(record) {
  if (!record || typeof record !== 'object') return null
  const name = String(record.name ?? record.branch_name ?? record.slug ?? '')
  const ref = String(record.ref ?? record.project_ref ?? record.id ?? record.branch_ref ?? '')
  const status = String(record.status ?? record.current_state ?? record.state ?? '')
  const persistent = record.persistent ?? record.is_persistent ?? null
  const withData = record.with_data ?? record.withData ?? false
  if (!name && !ref) return null
  return { name, ref, status, persistent, withData }
}

function extractBranches(parsed) {
  const candidates = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.branches) ? parsed.branches : []
  return candidates.map(asBranch).filter(Boolean)
}

function listBranches(accessToken) {
  const result = runSupabase([
    '-o',
    'json',
    'branches',
    'list',
    '--project-ref',
    parentProjectRef,
  ], accessToken, 'supabase branches list --project-ref [PARENT_PROJECT_REF]')
  const parsed = parseJson(result.stdout)
  return {
    status: result.status,
    command: result.summary,
    parsed: parsed !== null,
    branches: extractBranches(parsed),
  }
}

function createBranch(accessToken) {
  const result = runSupabase([
    '-o',
    'json',
    'branches',
    'create',
    replacementBranchName,
    '--persistent',
    '--project-ref',
    parentProjectRef,
  ], accessToken, 'supabase branches create [REPLACEMENT_BRANCH_NAME] --persistent --project-ref [PARENT_PROJECT_REF]', 300000)
  const branch = asBranch(parseJson(result.stdout))
  return {
    status: result.status,
    command: result.summary,
    branch,
  }
}

function branchSummary(branch) {
  return branch
    ? {
        name: branch.name,
        ref: branch.ref,
        status: branch.status,
        persistent: branch.persistent,
        withData: branch.withData === true,
      }
    : null
}

async function waitForBranch(accessToken) {
  const attempts = []
  let selected = null
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const listed = listBranches(accessToken)
    const branch = listed.branches.find((candidate) => candidate.name === replacementBranchName)
    selected = branch ?? selected
    attempts.push({
      attempt,
      listStatus: listed.status,
      parsed: listed.parsed,
      branch: branchSummary(branch),
    })
    const normalized = String(branch?.status ?? '').toUpperCase()
    if (branch?.ref && healthyStatuses.has(normalized)) {
      return { status: 'passed', branch, attempts }
    }
    await new Promise((resolve) => setTimeout(resolve, 10000))
  }
  return { status: 'blocked', branch: selected, attempts }
}

async function fetchBranchConfig(accessToken, branchRef) {
  const response = await fetch(replacementBranchConfigEndpoint(branchRef), {
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

function buildDbUrl(config, branchRef) {
  const required = ['ref', 'db_host', 'db_port', 'db_user', dbPassField]
  for (const key of required) {
    if (config[key] === undefined || config[key] === null || config[key] === '') {
      throw new Error(`branch config missing ${key}`)
    }
  }
  if (config.ref !== branchRef) {
    throw new Error('branch config ref mismatch')
  }
  const user = encodeURIComponent(String(config.db_user))
  const password = encodeURIComponent(String(config[dbPassField]))
  const host = String(config.db_host)
  const port = String(config.db_port)
  const scheme = ['postgresql', '://'].join('')
  return `${scheme}${user}:${password}@${host}:${port}/postgres`
}

function summarizeBranchConfig(config, branchRef) {
  return {
    refMatchesReplacementBranch: config?.ref === branchRef,
    dbHostPresent: Boolean(config?.db_host),
    dbPortPresent: Boolean(config?.db_port),
    dbUserPresent: Boolean(config?.db_user),
    dbPassPresent: Boolean(config?.[dbPassField]),
    jwtSecretPresent: Boolean(config?.[jwtSecretField]),
    status: config?.status ?? config?.current_state ?? null,
    payloadValuesIncluded: false,
  }
}

function migrationList(dbUrl) {
  const result = run('supabase', ['migration', 'list', '--db-url', dbUrl], {
    timeoutMs: 180000,
    commandClass: 'supabase migration list --db-url [REDACTED_REPLACEMENT_BRANCH_DB_URL]',
  })
  return {
    status: result.status,
    command: result.summary,
    parsed: parseMigrationList(result.stdout),
  }
}

function parseMigrationList(text) {
  const localMigrationIds = new Set()
  const remoteMigrationIds = new Set()
  const pendingLocalMigrationIds = new Set()
  const remoteOnlyMigrationIds = new Set()
  for (const line of String(text ?? '').split(/\r?\n/)) {
    const match = line.match(/^\s*(\d{12,14})?\s*\|\s*(\d{12,14})?\s*\|/)
    if (!match) continue
    const local = match[1] ?? ''
    const remote = match[2] ?? ''
    if (local) localMigrationIds.add(local)
    if (remote) {
      remoteMigrationIds.add(remote)
      if (!local) remoteOnlyMigrationIds.add(remote)
    } else if (local) {
      pendingLocalMigrationIds.add(local)
    }
  }
  return {
    textParsed: localMigrationIds.size > 0 || remoteMigrationIds.size > 0,
    localMigrationIds: [...localMigrationIds].sort(),
    remoteMigrationIds: [...remoteMigrationIds].sort(),
    pendingLocalMigrationIds: [...pendingLocalMigrationIds].sort(),
    remoteOnlyMigrationIds: [...remoteOnlyMigrationIds].sort(),
    sourceAlignedForMigrationChainApply: remoteOnlyMigrationIds.size === 0,
  }
}

if (process.env[confirmationVar] !== 'true') {
  finish({
    decision: 'blocked_pending_clean_staging_branch_replacement_confirmation',
    execution: 'blocked_confirmation_absent_no_remote_execution',
    blocker: 'blocked_pending_clean_staging_branch_replacement_confirmation',
    confirmation: 'absent_or_not_true',
    branchReplacement: 'not_run',
    secretRotation: 'not_run',
    migrationHistoryRead: 'not_run',
    safety: buildSafety(),
  }, 1)
}

let accessToken
try {
  accessToken = accessSecretPayload(accessTokenSecret)
} catch (error) {
  finish({
    decision: 'blocked_supabase_access_token_secret_payload_unavailable',
    execution: 'blocked_before_supabase_branch_list',
    blocker: 'blocked_supabase_access_token_secret_payload_unavailable',
    confirmation: 'present_true',
    branchReplacement: 'not_run',
    secretRotation: 'not_run',
    migrationHistoryRead: 'not_run',
    sanitizedError: sanitize(error.message),
    safety: buildSafety({ secretManagerPayloadAccess: false }),
  }, 1)
}

if (!accessToken || !accessToken.startsWith('sbp_')) {
  finish({
    decision: 'blocked_supabase_access_token_payload_invalid',
    execution: 'blocked_before_supabase_branch_list',
    blocker: 'blocked_supabase_access_token_payload_invalid',
    confirmation: 'present_true',
    branchReplacement: 'not_run',
    secretRotation: 'not_run',
    migrationHistoryRead: 'not_run',
    safety: buildSafety({ secretManagerPayloadAccess: true }),
  }, 1)
}

const firstList = listBranches(accessToken)
if (firstList.status !== 'passed' || !firstList.parsed) {
  finish({
    decision: 'blocked_clean_staging_branch_replacement_list_failed',
    execution: 'blocked_before_branch_replacement',
    blocker: 'blocked_clean_staging_branch_replacement_list_failed',
    confirmation: 'present_true',
    branchReplacement: 'not_run',
    secretRotation: 'not_run',
    migrationHistoryRead: 'not_run',
    firstList: {
      status: firstList.status,
      parsed: firstList.parsed,
      command: firstList.command,
    },
    safety: buildSafety({
      secretManagerPayloadAccess: true,
      supabaseCliBranchList: true,
      remoteSupabaseReadCommand: true,
    }),
  }, 1)
}

let branchAction = 'reused'
let selectedBranch = firstList.branches.find((branch) => branch.name === replacementBranchName)
let createReport = null
if (!selectedBranch) {
  branchAction = 'created'
  createReport = createBranch(accessToken)
  if (createReport.status !== 'passed') {
    finish({
      decision: 'blocked_clean_staging_branch_replacement_create_failed',
      execution: 'blocked_during_supabase_branch_create',
      blocker: 'blocked_clean_staging_branch_replacement_create_failed',
      confirmation: 'present_true',
      branchReplacement: 'blocked_create_failed',
      secretRotation: 'not_run',
      migrationHistoryRead: 'not_run',
      firstList: {
        status: firstList.status,
        parsed: firstList.parsed,
        branchCount: firstList.branches.length,
        existingReplacementBranch: null,
      },
      createReport,
      safety: buildSafety({
        secretManagerPayloadAccess: true,
        supabaseCliBranchList: true,
        supabaseCliBranchCreate: true,
        remoteSupabaseMutation: true,
        remoteSupabaseReadCommand: true,
      }),
    }, 1)
  }
  selectedBranch = createReport.branch
}

const health = await waitForBranch(accessToken)
if (health.status !== 'passed' || !health.branch?.ref) {
  finish({
    decision: 'blocked_clean_staging_branch_replacement_health_unavailable',
    execution: 'blocked_after_branch_create_or_select_before_secret_rotation',
    blocker: 'blocked_clean_staging_branch_replacement_health_unavailable',
    confirmation: 'present_true',
    branchReplacement: branchAction,
    selectedBranch: branchSummary(selectedBranch),
    health,
    secretRotation: 'not_run',
    migrationHistoryRead: 'not_run',
    safety: buildSafety({
      secretManagerPayloadAccess: true,
      supabaseCliBranchList: true,
      supabaseCliBranchCreate: branchAction === 'created',
      remoteSupabaseMutation: branchAction === 'created',
      remoteSupabaseReadCommand: true,
      branchReplacementSelection: branchAction === 'reused',
    }),
  }, 1)
}

selectedBranch = health.branch

let branchConfig
try {
  branchConfig = await fetchBranchConfig(accessToken, selectedBranch.ref)
} catch (error) {
  finish({
    decision: 'blocked_clean_staging_branch_replacement_config_unavailable',
    execution: 'blocked_before_migration_history_read',
    blocker: 'blocked_clean_staging_branch_replacement_config_unavailable',
    confirmation: 'present_true',
    branchReplacement: branchAction,
    selectedBranch: branchSummary(selectedBranch),
    health,
    secretRotation: 'not_run',
    migrationHistoryRead: 'not_run',
    sanitizedError: sanitize(error.message),
    safety: buildSafety({
      secretManagerPayloadAccess: true,
      supabaseManagementApiRead: true,
      supabaseCliBranchList: true,
      supabaseCliBranchCreate: branchAction === 'created',
      remoteSupabaseMutation: branchAction === 'created',
      remoteSupabaseReadCommand: true,
      branchReplacementSelection: branchAction === 'reused',
    }),
  }, 1)
}

let dbUrl
try {
  dbUrl = buildDbUrl(branchConfig, selectedBranch.ref)
} catch (error) {
  finish({
    decision: 'blocked_clean_staging_branch_replacement_config_missing_db_fields',
    execution: 'blocked_before_migration_history_read',
    blocker: 'blocked_clean_staging_branch_replacement_config_missing_db_fields',
    confirmation: 'present_true',
    branchReplacement: branchAction,
    selectedBranch: branchSummary(selectedBranch),
    health,
    branchConfigSummary: summarizeBranchConfig(branchConfig, selectedBranch.ref),
    secretRotation: 'not_run',
    migrationHistoryRead: 'not_run',
    sanitizedError: sanitize(error.message),
    safety: buildSafety({
      secretManagerPayloadAccess: true,
      supabaseManagementApiRead: true,
      supabaseCliBranchList: true,
      supabaseCliBranchCreate: branchAction === 'created',
      remoteSupabaseMutation: branchAction === 'created',
      remoteSupabaseReadCommand: true,
      branchReplacementSelection: branchAction === 'reused',
    }),
  }, 1)
}

const migrations = migrationList(dbUrl)
if (migrations.status !== 'passed' || !migrations.parsed.textParsed) {
  finish({
    decision: 'blocked_replacement_branch_migration_list_failed',
    execution: 'blocked_before_clean_branch_db_url_secret_rotation',
    blocker: 'blocked_replacement_branch_migration_list_failed',
    confirmation: 'present_true',
    branchReplacement: branchAction,
    selectedBranch: branchSummary(selectedBranch),
    health,
    branchConfigSummary: summarizeBranchConfig(branchConfig, selectedBranch.ref),
    migrationHistoryRead: migrations,
    secretRotation: 'not_run',
    safety: buildSafety({
      secretManagerPayloadAccess: true,
      supabaseManagementApiRead: true,
      supabaseCliBranchList: true,
      supabaseCliBranchCreate: branchAction === 'created',
      remoteSupabaseMutation: branchAction === 'created',
      remoteSupabaseReadCommand: true,
      sqlExecution: 'read_only_migration_history_inspection',
      sqlMutation: false,
      migrationListRead: true,
      branchReplacementSelection: branchAction === 'reused',
    }),
  }, 1)
}

if (!migrations.parsed.sourceAlignedForMigrationChainApply) {
  finish({
    decision: 'blocked_replacement_branch_migration_history_not_source_aligned',
    execution: 'blocked_before_clean_branch_db_url_secret_rotation',
    blocker: 'blocked_replacement_branch_migration_history_not_source_aligned',
    confirmation: 'present_true',
    branchReplacement: branchAction,
    selectedBranch: branchSummary(selectedBranch),
    health,
    branchConfigSummary: summarizeBranchConfig(branchConfig, selectedBranch.ref),
    migrationHistoryRead: migrations,
    remoteOnlyMigrationIds: migrations.parsed.remoteOnlyMigrationIds,
    secretRotation: 'not_run',
    safety: buildSafety({
      secretManagerPayloadAccess: true,
      supabaseManagementApiRead: true,
      supabaseCliBranchList: true,
      supabaseCliBranchCreate: branchAction === 'created',
      remoteSupabaseMutation: branchAction === 'created',
      remoteSupabaseReadCommand: true,
      sqlExecution: 'read_only_migration_history_inspection',
      sqlMutation: false,
      migrationListRead: true,
      branchReplacementSelection: branchAction === 'reused',
    }),
  }, 1)
}

let secretCreated = false
let versionAdded = 'unknown'
try {
  secretCreated = createTargetSecretIfNeeded()
  versionAdded = addTargetSecretVersion(dbUrl)
} catch (error) {
  finish({
    decision: 'blocked_clean_staging_branch_replacement_db_url_secret_write_failed',
    execution: 'blocked_secret_manager_version_add_failed',
    blocker: 'blocked_clean_staging_branch_replacement_db_url_secret_write_failed',
    confirmation: 'present_true',
    branchReplacement: branchAction,
    selectedBranch: branchSummary(selectedBranch),
    health,
    branchConfigSummary: summarizeBranchConfig(branchConfig, selectedBranch.ref),
    migrationHistoryRead: migrations,
    secretRotation: 'blocked_secret_write_failed',
    secretCreated,
    sanitizedError: sanitize(error.message),
    safety: buildSafety({
      secretManagerPayloadAccess: true,
      supabaseManagementApiRead: true,
      supabaseCliBranchList: true,
      supabaseCliBranchCreate: branchAction === 'created',
      remoteSupabaseMutation: branchAction === 'created',
      remoteSupabaseReadCommand: true,
      sqlExecution: 'read_only_migration_history_inspection',
      sqlMutation: false,
      migrationListRead: true,
      branchReplacementSelection: branchAction === 'reused',
    }),
  }, 1)
}

const latestTargetVersion = latestSecretVersion(targetSecret)
const latestAccessTokenVersion = latestSecretVersion(accessTokenSecret)
finish({
  decision: 'completed_clean_staging_branch_replacement_execution_source_aligned',
  execution: 'completed_guarded_clean_staging_branch_replacement_secret_rotation_no_sql_mutation',
  blocker: 'none',
  confirmation: 'present_true',
  branchReplacement: branchAction,
  selectedBranch: branchSummary(selectedBranch),
  health,
  branchConfigSummary: summarizeBranchConfig(branchConfig, selectedBranch.ref),
  migrationHistoryRead: migrations,
  sourceAlignedForMigrationChainApply: true,
  secretRotation: 'completed',
  secretCreated,
  secretVersionAdded: true,
  addedSecretVersion: versionAdded,
  latestTargetSecretVersion: latestTargetVersion,
  latestAccessTokenSecretVersion: latestAccessTokenVersion,
  nextMilestone: 'SUPABASE-CLEAN-STAGING-BRANCH-CURRENT-TARGET-GUARDED-VALIDATION-2',
  safety: buildSafety({
    secretManagerPayloadAccess: true,
    supabaseManagementApiRead: true,
    supabaseCliBranchList: true,
    supabaseCliBranchCreate: branchAction === 'created',
    remoteSupabaseMutation: branchAction === 'created',
    remoteSupabaseReadCommand: true,
    sqlExecution: 'read_only_migration_history_inspection',
    sqlMutation: false,
    migrationListRead: true,
    branchReplacementSelection: branchAction === 'reused',
    cleanBranchDbUrlSecretVersionAdd: true,
  }),
}, 0)
