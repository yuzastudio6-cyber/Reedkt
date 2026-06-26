#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

const packet = 'SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-CREATION-1'
const confirmationVar = 'REEDITPRO_CONFIRM_SUPABASE_CLEAN_STAGING_ISOLATED_TARGET_CREATION'
const gcpProject = 'reeditpro'
const accessTokenSecret = 'SUPABASE_ACCESS_TOKEN'
const targetSecret = 'REEDITPRO_CLEAN_STAGING_SUPABASE_DB_URL'
const parentProjectName = 'Reeditpro'
const parentProjectRef = 'wmyyttnynmteqgcdishd'
const targetProjectName = 'reeditpro-clean-staging-isolated-v1'
const targetProjectSize = process.env.REEDITPRO_SUPABASE_ISOLATED_TARGET_SIZE || 'micro'
const targetRegistryMigrationId = '202606050001'
const workerRpcMigrationId = '202606180001'
const internalBetaGapMigrationId = '20260625031135'
const reportDir = 'docs/activation-supabase-clean-staging-isolated-target-creation-1-reports'
const reportPath = path.join(reportDir, 'clean_staging_isolated_target_creation_report.json')
const manifestPath = path.join(reportDir, 'clean_staging_isolated_target_creation_manifest.json')
const baseOutputDir = '/tmp/reeditpro-supabase-clean-staging-isolated-target-creation-1'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(baseOutputDir, runId)
const healthyStatuses = new Set(['ACTIVE', 'ACTIVE_HEALTHY', 'HEALTHY', 'READY', 'RUNNING'])

fs.mkdirSync(reportDir, { recursive: true })
fs.mkdirSync(outputDir, { recursive: true })

function sanitize(value) {
  return String(value ?? '')
    .replace(/sbp_[A-Za-z0-9_./=-]+/g, 'sbp_[redacted]')
    .replace(/\bpostgres(?:ql)?:\/\/\S+/gi, 'postgresql://[redacted]')
    .replace(/postgres:\/\/\S+/gi, 'postgresql://[redacted]')
    .replace(/db\.[a-z0-9-]+\.supabase\.co/gi, 'db.[redacted].supabase.co')
    .replace(/password=[^\s]+/gi, 'password=[redacted]')
    .replace(/"organization_id"\s*:\s*"[^"]+"/gi, '"organization_id":"[present]"')
    .replace(/"organization_slug"\s*:\s*"[^"]+"/gi, '"organization_slug":"[present]"')
    .replace(/"host"\s*:\s*"[^"]+"/gi, '"host":"[redacted]"')
    .replace(/--db-password\s+\S+/gi, '--db-password [redacted]')
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function summarizeText(text, max = 3000) {
  const sanitized = sanitize(text)
  return {
    byteLength: Buffer.byteLength(sanitized),
    lineCount: sanitized.trim().length === 0 ? 0 : sanitized.trim().split(/\r?\n/).length,
    snippet: sanitized.trim().slice(0, max),
    secretPatternDetected: /sbp_[A-Za-z0-9_./=-]+|\bpostgres(?:ql)?:\/\/\S+/i.test(
      sanitized.replaceAll('postgresql://[redacted]', ''),
    ),
  }
}

function commandSummary(result, commandClass) {
  return {
    commandClass,
    status: result.status,
    exitCode: result.exitCode,
    stdout: summarizeText(result.stdout),
    stderr: summarizeText(result.stderr),
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
    return { status: 'passed', exitCode: 0, stdout, stderr: '' }
  } catch (error) {
    return {
      status: 'blocked',
      exitCode: typeof error.status === 'number' ? error.status : 1,
      stdout: error.stdout?.toString() ?? '',
      stderr: error.stderr?.toString() ?? error.message,
    }
  }
}

function gcloud(args, options = {}) {
  const result = run('gcloud', args, {
    ...options,
    timeoutMs: options.timeoutMs ?? 120000,
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
    ]).trim()
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
  ]).trim()
}

function secretExists(secretName) {
  try {
    gcloud(['secrets', 'describe', secretName, `--project=${gcpProject}`, '--format=value(name)'])
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

function supabaseEnv(accessToken) {
  return {
    ...process.env,
    SUPABASE_ACCESS_TOKEN: accessToken,
    SUPABASE_TELEMETRY_DISABLED: '1',
  }
}

function parseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function asArray(value) {
  if (Array.isArray(value)) return value
  if (Array.isArray(value?.projects)) return value.projects
  if (Array.isArray(value?.data)) return value.data
  if (Array.isArray(value?.organizations)) return value.organizations
  return []
}

function field(record, names) {
  for (const name of names) {
    const value = name.split('.').reduce((acc, key) => acc?.[key], record)
    if (value !== undefined && value !== null && String(value).trim() !== '') return String(value)
  }
  return ''
}

function projectSummary(project) {
  if (!project) return null
  return {
    name: field(project, ['name', 'project.name']),
    ref: field(project, ['id', 'ref', 'project_ref', 'projectRef']),
    region: field(project, ['region', 'db_region', 'dbRegion']),
    status: field(project, ['status', 'database.status']),
    organizationIdPresent: Boolean(field(project, ['organization_id', 'organization.id', 'org_id', 'orgId'])),
  }
}

function orgSummary(org) {
  if (!org) return null
  return {
    name: field(org, ['name', 'organization.name']),
    idPresent: Boolean(field(org, ['id', 'slug', 'organization_id'])),
  }
}

function runSupabase(args, accessToken, commandClass, timeoutMs = 120000) {
  const result = run('supabase', args, {
    env: supabaseEnv(accessToken),
    timeoutMs,
  })
  return {
    ...result,
    summary: commandSummary(result, commandClass),
  }
}

function listProjects(accessToken) {
  const result = runSupabase(['--output-format', 'json', 'projects', 'list'], accessToken, 'supabase projects list --output-format json')
  const parsed = parseJson(result.stdout)
  return { result, parsed, projects: asArray(parsed) }
}

function listOrgs(accessToken) {
  const result = runSupabase(['--output-format', 'json', 'orgs', 'list'], accessToken, 'supabase orgs list --output-format json')
  const parsed = parseJson(result.stdout)
  return { result, parsed, orgs: asArray(parsed) }
}

function findProject(projects, predicate) {
  return projects.find((project) => predicate(project)) ?? null
}

function resolveOrgId(projects, orgs) {
  const parent = findProject(projects, (project) => field(project, ['id', 'ref', 'project_ref', 'projectRef']) === parentProjectRef)
  const parentOrgId = parent ? field(parent, ['organization_id', 'organization.id', 'org_id', 'orgId']) : ''
  if (parentOrgId) return { status: 'resolved_from_parent_project', orgId: parentOrgId, parentProject: projectSummary(parent) }
  if (orgs.length === 1) {
    return { status: 'resolved_single_org', orgId: field(orgs[0], ['id', 'slug', 'organization_id']), orgs: orgs.map(orgSummary) }
  }
  const named = orgs.find((org) => /reeditpro/i.test(field(org, ['name', 'organization.name'])))
  const namedOrgId = named ? field(named, ['id', 'slug', 'organization_id']) : ''
  if (namedOrgId) return { status: 'resolved_named_org', orgId: namedOrgId, orgs: orgs.map(orgSummary) }
  return { status: 'blocked_org_not_resolved', orgId: '', parentProject: projectSummary(parent), orgs: orgs.map(orgSummary) }
}

function resolveRegion(projects) {
  const parent = findProject(projects, (project) => field(project, ['id', 'ref', 'project_ref', 'projectRef']) === parentProjectRef)
  const parentRegion = parent ? field(parent, ['region', 'db_region', 'dbRegion']) : ''
  const envRegion = process.env.REEDITPRO_SUPABASE_ISOLATED_TARGET_REGION || ''
  if (envRegion) return { status: 'resolved_from_env', region: envRegion, parentProject: projectSummary(parent) }
  if (parentRegion) return { status: 'resolved_from_parent_project', region: parentRegion, parentProject: projectSummary(parent) }
  return { status: 'blocked_region_not_resolved', region: '', parentProject: projectSummary(parent) }
}

function createProject(accessToken, orgId, region, password) {
  return runSupabase([
    '--output-format',
    'json',
    'projects',
    'create',
    targetProjectName,
    '--org-id',
    orgId,
    '--db-password',
    password,
    '--region',
    region,
    '--size',
    targetProjectSize,
    '--yes',
  ], accessToken, 'supabase projects create [TARGET_PROJECT] --org-id [ORG] --db-password [redacted] --region [REGION] --size [SIZE]', 600000)
}

function waitForProject(accessToken) {
  const attempts = []
  let selected = null
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const listed = listProjects(accessToken)
    selected = findProject(listed.projects, (project) => field(project, ['name']) === targetProjectName)
    const normalizedStatus = field(selected ?? {}, ['status', 'database.status']).toUpperCase()
    attempts.push({
      attempt,
      listCommand: listed.result.summary,
      project: projectSummary(selected),
      healthy: Boolean(selected && healthyStatuses.has(normalizedStatus)),
    })
    if (selected && healthyStatuses.has(normalizedStatus)) return { status: 'passed', project: selected, attempts }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10000)
  }
  return { status: 'blocked', project: selected, attempts }
}

function buildDbUrl(projectRef, password) {
  if (!projectRef || !password) throw new Error('missing project ref or password')
  const scheme = ['postgresql', '://'].join('')
  return `${scheme}postgres:${encodeURIComponent(password)}@db.${projectRef}.${'supabase.co'}:5432/postgres`
}

function extractMigrationIdsFromText(text) {
  const localMigrationIds = new Set()
  const remoteMigrationIds = new Set()
  const pendingLocalMigrationIds = new Set()
  const remoteOnlyMigrationIds = new Set()
  for (const line of String(text ?? '').split(/\r?\n/)) {
    if (!line.includes('|')) continue
    const cells = line.split('|').map((cell) => cell.trim())
    if (cells.length < 2) continue
    const local = cells[0].match(/\b\d{12,14}\b/)?.[0] ?? ''
    const remote = cells[1].match(/\b\d{12,14}\b/)?.[0] ?? ''
    if (local) localMigrationIds.add(local)
    if (remote) remoteMigrationIds.add(remote)
    if (local && !remote) pendingLocalMigrationIds.add(local)
    if (!local && remote) remoteOnlyMigrationIds.add(remote)
  }
  return {
    localMigrationIds: [...localMigrationIds],
    remoteMigrationIds: [...remoteMigrationIds],
    pendingLocalMigrationIds: [...pendingLocalMigrationIds],
    remoteOnlyMigrationIds: [...remoteOnlyMigrationIds],
  }
}

function runSupabaseMigrationList(dbUrl) {
  const result = run('supabase', [
    '--output-format',
    'json',
    'migration',
    'list',
    '--db-url',
    dbUrl,
  ], {
    env: { ...process.env, SUPABASE_TELEMETRY_DISABLED: '1' },
    timeoutMs: 180000,
  })
  const parsed = parseJson(result.stdout)
  const textIds = extractMigrationIdsFromText(result.stdout)
  return {
    status: result.status === 'passed' ? 'passed' : 'blocked',
    commandClass: 'supabase migration list --db-url [redacted]',
    commandResult: commandSummary(result, 'supabase migration list --db-url [redacted]'),
    migrationHistoryParsed: parsed !== null,
    ...textIds,
    requiredMigrationIds: [
      targetRegistryMigrationId,
      workerRpcMigrationId,
      internalBetaGapMigrationId,
    ],
    sourceAlignedNoRemoteOnlyMigrations: textIds.remoteOnlyMigrationIds.length === 0,
  }
}

function buildSafety(overrides = {}) {
  return {
    secretManagerPayloadAccess: false,
    credentialPayloadPrinted: false,
    credentialPayloadPersistedInRepo: false,
    supabaseProjectList: false,
    supabaseOrgList: false,
    supabaseProjectCreate: false,
    remoteSupabaseCommand: false,
    remoteSupabaseMutation: false,
    remoteSupabaseReadCommand: false,
    sqlExecution: false,
    sqlMutation: false,
    migrationListRead: false,
    migrationApply: false,
    migrationDryRun: false,
    migrationHistoryManualEdit: false,
    supabaseDbPull: false,
    branchCreate: false,
    branchDelete: false,
    branchReset: false,
    dbUrlSecretRotation: false,
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
    targetProjectName,
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

if (process.env[confirmationVar] !== 'true') {
  finish({
    decision: 'blocked_pending_isolated_target_creation_confirmation',
    execution: 'blocked_before_secret_access_or_remote_supabase_command',
    blocker: 'blocked_pending_isolated_target_creation_confirmation',
    confirmationVar,
    targetAction: 'not_run',
    migrationHistoryReadback: 'not_run',
    dbUrlSecretRotation: 'not_run',
    safety: buildSafety(),
  }, 1)
}

let accessTokenMetadata
let targetSecretMetadataBefore
let accessToken
try {
  accessTokenMetadata = latestSecretVersion(accessTokenSecret)
  targetSecretMetadataBefore = latestSecretVersion(targetSecret)
  if (!accessTokenMetadata.present) {
    finish({
      decision: 'blocked_missing_supabase_access_token_secret',
      execution: 'blocked_before_remote_supabase_command',
      blocker: 'blocked_missing_supabase_access_token_secret',
      confirmationVar,
      accessTokenSecretMetadata: accessTokenMetadata,
      targetSecretMetadataBefore,
      targetAction: 'not_run',
      migrationHistoryReadback: 'not_run',
      dbUrlSecretRotation: 'not_run',
      safety: buildSafety(),
    }, 1)
  }
  accessToken = accessSecretPayload(accessTokenSecret)
} catch (error) {
  finish({
    decision: 'blocked_supabase_access_token_secret_unavailable',
    execution: 'blocked_before_remote_supabase_command',
    blocker: 'blocked_supabase_access_token_secret_unavailable',
    confirmationVar,
    accessTokenSecretMetadata: accessTokenMetadata,
    targetSecretMetadataBefore,
    sanitizedError: sanitize(error.message),
    targetAction: 'not_run',
    migrationHistoryReadback: 'not_run',
    dbUrlSecretRotation: 'not_run',
    safety: buildSafety(),
  }, 1)
}

const firstProjects = listProjects(accessToken)
if (firstProjects.result.status !== 'passed') {
  finish({
    decision: 'blocked_isolated_target_project_list_failed',
    execution: 'blocked_before_isolated_target_creation',
    blocker: 'blocked_isolated_target_project_list_failed',
    confirmationVar,
    accessTokenSecretMetadata: accessTokenMetadata,
    targetSecretMetadataBefore,
    projectListCommand: firstProjects.result.summary,
    targetAction: 'not_run',
    migrationHistoryReadback: 'not_run',
    dbUrlSecretRotation: 'not_run',
    safety: buildSafety({
      secretManagerPayloadAccess: true,
      supabaseProjectList: true,
      remoteSupabaseCommand: true,
      remoteSupabaseReadCommand: true,
    }),
  }, 1)
}

const existingTarget = findProject(firstProjects.projects, (project) => field(project, ['name']) === targetProjectName)
if (existingTarget) {
  finish({
    decision: 'blocked_isolated_target_already_exists_requires_reuse_policy',
    execution: 'blocked_before_isolated_target_creation',
    blocker: 'blocked_isolated_target_already_exists_requires_reuse_policy',
    confirmationVar,
    accessTokenSecretMetadata: accessTokenMetadata,
    targetSecretMetadataBefore,
    existingTarget: projectSummary(existingTarget),
    targetAction: 'blocked_existing_target_reuse_not_approved',
    migrationHistoryReadback: 'not_run',
    dbUrlSecretRotation: 'not_run',
    safety: buildSafety({
      secretManagerPayloadAccess: true,
      supabaseProjectList: true,
      remoteSupabaseCommand: true,
      remoteSupabaseReadCommand: true,
    }),
  }, 1)
}

const orgList = listOrgs(accessToken)
if (orgList.result.status !== 'passed') {
  finish({
    decision: 'blocked_isolated_target_org_list_failed',
    execution: 'blocked_before_isolated_target_creation',
    blocker: 'blocked_isolated_target_org_list_failed',
    confirmationVar,
    accessTokenSecretMetadata: accessTokenMetadata,
    targetSecretMetadataBefore,
    projectListCommand: firstProjects.result.summary,
    orgListCommand: orgList.result.summary,
    targetAction: 'not_run',
    migrationHistoryReadback: 'not_run',
    dbUrlSecretRotation: 'not_run',
    safety: buildSafety({
      secretManagerPayloadAccess: true,
      supabaseProjectList: true,
      supabaseOrgList: true,
      remoteSupabaseCommand: true,
      remoteSupabaseReadCommand: true,
    }),
  }, 1)
}

const orgResolution = resolveOrgId(firstProjects.projects, orgList.orgs)
const regionResolution = resolveRegion(firstProjects.projects)
if (!orgResolution.orgId || !regionResolution.region) {
  finish({
    decision: !orgResolution.orgId ? 'blocked_isolated_target_org_not_resolved' : 'blocked_isolated_target_region_not_resolved',
    execution: 'blocked_before_isolated_target_creation',
    blocker: !orgResolution.orgId ? 'blocked_isolated_target_org_not_resolved' : 'blocked_isolated_target_region_not_resolved',
    confirmationVar,
    accessTokenSecretMetadata: accessTokenMetadata,
    targetSecretMetadataBefore,
    projectListCommand: firstProjects.result.summary,
    orgListCommand: orgList.result.summary,
    orgResolution: { ...orgResolution, orgId: orgResolution.orgId ? '[present]' : '' },
    regionResolution,
    targetAction: 'not_run',
    migrationHistoryReadback: 'not_run',
    dbUrlSecretRotation: 'not_run',
    safety: buildSafety({
      secretManagerPayloadAccess: true,
      supabaseProjectList: true,
      supabaseOrgList: true,
      remoteSupabaseCommand: true,
      remoteSupabaseReadCommand: true,
    }),
  }, 1)
}

const dbPassword = crypto.randomBytes(24).toString('base64url')
const createResult = createProject(accessToken, orgResolution.orgId, regionResolution.region, dbPassword)
if (createResult.status !== 'passed') {
  finish({
    decision: 'blocked_isolated_target_project_create_failed',
    execution: 'blocked_during_isolated_target_creation',
    blocker: 'blocked_isolated_target_project_create_failed',
    confirmationVar,
    accessTokenSecretMetadata: accessTokenMetadata,
    targetSecretMetadataBefore,
    projectListCommand: firstProjects.result.summary,
    orgListCommand: orgList.result.summary,
    orgResolution: { ...orgResolution, orgId: '[present]' },
    regionResolution,
    createCommand: createResult.summary,
    targetAction: 'blocked_create_failed',
    migrationHistoryReadback: 'not_run',
    dbUrlSecretRotation: 'not_run',
    safety: buildSafety({
      secretManagerPayloadAccess: true,
      supabaseProjectList: true,
      supabaseOrgList: true,
      supabaseProjectCreate: true,
      remoteSupabaseCommand: true,
      remoteSupabaseMutation: true,
      remoteSupabaseReadCommand: true,
    }),
  }, 1)
}

const health = waitForProject(accessToken)
if (health.status !== 'passed' || !health.project) {
  finish({
    decision: 'blocked_isolated_target_project_health_unavailable',
    execution: 'blocked_after_isolated_target_creation_before_migration_readback',
    blocker: 'blocked_isolated_target_project_health_unavailable',
    confirmationVar,
    accessTokenSecretMetadata: accessTokenMetadata,
    targetSecretMetadataBefore,
    projectListCommand: firstProjects.result.summary,
    orgListCommand: orgList.result.summary,
    orgResolution: { ...orgResolution, orgId: '[present]' },
    regionResolution,
    createCommand: createResult.summary,
    targetAction: 'created',
    selectedProject: projectSummary(health.project),
    healthAttempts: health.attempts,
    migrationHistoryReadback: 'not_run',
    dbUrlSecretRotation: 'not_run',
    safety: buildSafety({
      secretManagerPayloadAccess: true,
      supabaseProjectList: true,
      supabaseOrgList: true,
      supabaseProjectCreate: true,
      remoteSupabaseCommand: true,
      remoteSupabaseMutation: true,
      remoteSupabaseReadCommand: true,
    }),
  }, 1)
}

const selectedProject = health.project
const selectedProjectRef = field(selectedProject, ['id', 'ref', 'project_ref', 'projectRef'])
let dbUrl
try {
  dbUrl = buildDbUrl(selectedProjectRef, dbPassword)
} catch (error) {
  finish({
    decision: 'blocked_isolated_target_project_ref_missing',
    execution: 'blocked_before_migration_history_readback',
    blocker: 'blocked_isolated_target_project_ref_missing',
    confirmationVar,
    accessTokenSecretMetadata: accessTokenMetadata,
    targetSecretMetadataBefore,
    orgResolution: { ...orgResolution, orgId: '[present]' },
    regionResolution,
    createCommand: createResult.summary,
    targetAction: 'created',
    selectedProject: projectSummary(selectedProject),
    migrationHistoryReadback: 'not_run',
    dbUrlSecretRotation: 'not_run',
    safety: buildSafety({
      secretManagerPayloadAccess: true,
      supabaseProjectList: true,
      supabaseOrgList: true,
      supabaseProjectCreate: true,
      remoteSupabaseCommand: true,
      remoteSupabaseMutation: true,
      remoteSupabaseReadCommand: true,
    }),
  }, 1)
}

const migrationList = runSupabaseMigrationList(dbUrl)
if (migrationList.status !== 'passed') {
  finish({
    decision: 'blocked_isolated_target_migration_history_readback_failed',
    execution: 'blocked_before_clean_branch_db_url_secret_rotation',
    blocker: 'blocked_isolated_target_migration_history_readback_failed',
    confirmationVar,
    accessTokenSecretMetadata: accessTokenMetadata,
    targetSecretMetadataBefore,
    orgResolution: { ...orgResolution, orgId: '[present]' },
    regionResolution,
    createCommand: createResult.summary,
    targetAction: 'created',
    selectedProject: projectSummary(selectedProject),
    migrationHistoryReadback: 'blocked',
    migrationHistoryEvidence: migrationList,
    dbUrlSecretRotation: 'not_run',
    safety: buildSafety({
      secretManagerPayloadAccess: true,
      supabaseProjectList: true,
      supabaseOrgList: true,
      supabaseProjectCreate: true,
      remoteSupabaseCommand: true,
      remoteSupabaseMutation: true,
      remoteSupabaseReadCommand: true,
      sqlExecution: true,
      migrationListRead: true,
    }),
  }, 1)
}

if (!migrationList.sourceAlignedNoRemoteOnlyMigrations) {
  finish({
    decision: 'blocked_isolated_target_migration_history_not_source_aligned',
    execution: 'blocked_before_clean_branch_db_url_secret_rotation',
    blocker: 'blocked_isolated_target_migration_history_not_source_aligned',
    confirmationVar,
    accessTokenSecretMetadata: accessTokenMetadata,
    targetSecretMetadataBefore,
    orgResolution: { ...orgResolution, orgId: '[present]' },
    regionResolution,
    createCommand: createResult.summary,
    targetAction: 'created',
    selectedProject: projectSummary(selectedProject),
    migrationHistoryReadback: 'completed',
    migrationHistoryEvidence: migrationList,
    dbUrlSecretRotation: 'not_run',
    safety: buildSafety({
      secretManagerPayloadAccess: true,
      supabaseProjectList: true,
      supabaseOrgList: true,
      supabaseProjectCreate: true,
      remoteSupabaseCommand: true,
      remoteSupabaseMutation: true,
      remoteSupabaseReadCommand: true,
      sqlExecution: true,
      migrationListRead: true,
    }),
  }, 1)
}

let secretCreated = false
let secretVersion = 'not_run'
try {
  secretCreated = createTargetSecretIfNeeded()
  secretVersion = addTargetSecretVersion(dbUrl)
} catch (error) {
  finish({
    decision: 'blocked_isolated_target_db_url_secret_rotation_failed',
    execution: 'blocked_after_source_aligned_migration_readback',
    blocker: 'blocked_isolated_target_db_url_secret_rotation_failed',
    confirmationVar,
    accessTokenSecretMetadata: accessTokenMetadata,
    targetSecretMetadataBefore,
    orgResolution: { ...orgResolution, orgId: '[present]' },
    regionResolution,
    createCommand: createResult.summary,
    targetAction: 'created',
    selectedProject: projectSummary(selectedProject),
    migrationHistoryReadback: 'completed_source_aligned_no_remote_only_migrations',
    migrationHistoryEvidence: migrationList,
    dbUrlSecretRotation: 'blocked',
    targetSecretCreated: secretCreated,
    sanitizedError: sanitize(error.message),
    safety: buildSafety({
      secretManagerPayloadAccess: true,
      supabaseProjectList: true,
      supabaseOrgList: true,
      supabaseProjectCreate: true,
      remoteSupabaseCommand: true,
      remoteSupabaseMutation: true,
      remoteSupabaseReadCommand: true,
      sqlExecution: true,
      migrationListRead: true,
    }),
  }, 1)
}

const targetSecretMetadataAfter = latestSecretVersion(targetSecret)
finish({
  decision: 'completed_isolated_clean_staging_target_creation_source_aligned_secret_rotation',
  execution: 'completed_guarded_isolated_target_creation_migration_history_readback_and_db_url_secret_rotation_no_sql_mutation',
  blocker: 'none',
  confirmationVar,
  accessTokenSecretMetadata: accessTokenMetadata,
  targetSecretMetadataBefore,
  targetSecretMetadataAfter,
  orgResolution: { ...orgResolution, orgId: '[present]' },
  regionResolution,
  createCommand: createResult.summary,
  targetAction: 'created',
  selectedProject: projectSummary(selectedProject),
  selectedProjectRef,
  migrationHistoryReadback: 'completed_source_aligned_no_remote_only_migrations',
  migrationHistoryEvidence: migrationList,
  dbUrlSecretRotation: 'completed',
  targetSecretCreated: secretCreated,
  targetSecretVersionAdded: secretVersion,
  nextMilestone: 'SUPABASE-CLEAN-STAGING-ISOLATED-TARGET-MIGRATION-CHAIN-APPLY-1',
  safety: buildSafety({
    secretManagerPayloadAccess: true,
    supabaseProjectList: true,
    supabaseOrgList: true,
    supabaseProjectCreate: true,
    remoteSupabaseCommand: true,
    remoteSupabaseMutation: true,
    remoteSupabaseReadCommand: true,
    sqlExecution: true,
    migrationListRead: true,
    dbUrlSecretRotation: true,
  }),
}, 0)
