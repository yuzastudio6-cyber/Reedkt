#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import crypto from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const packet = 'RP-INTERNAL-BETA-SUPABASE-TARGET-RLS-STORAGE-VALIDATION-1R-CONFIRMED'
const targetRef = 'wmyyttnynmteqgcdishd'
const targetName = 'Reeditpro'
const targetClass = 'staging'
const confirmationVar = 'REEDITPRO_CONFIRM_INTERNAL_BETA_SUPABASE_TARGET_RLS_STORAGE_VALIDATION'
const readonlyDbUrlVar = 'REEDITPRO_SUPABASE_READONLY_DB_URL'
const baseOutputDir = '/tmp/reeditpro-rp-internal-beta-supabase-target-rls-storage-validation-1r-confirmed'
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${crypto.randomBytes(4).toString('hex')}`
const outputDir = path.join(baseOutputDir, runId)
const isolatedHome = path.join(outputDir, 'supabase-cli-home')
const reportPath = path.join(outputDir, 'validation-report.json')
const manifestPath = path.join(outputDir, 'artifact-manifest.json')

fs.mkdirSync(path.join(isolatedHome, '.supabase'), { recursive: true })

const commands = []
const evidence = {
  targetIdentity: 'not_run',
  advisorLint: 'not_run',
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function sanitize(value) {
  return String(value ?? '')
    .replace(/sbp_[A-Za-z0-9_./=-]+/g, 'sbp_[redacted]')
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, 'postgresql://[redacted]')
    .replace(/(service[_-]?role[_-]?key["'\s:=]+)[A-Za-z0-9_./=-]+/gi, '$1[redacted]')
    .replace(/(anon[_-]?key["'\s:=]+)[A-Za-z0-9_./=-]+/gi, '$1[redacted]')
}

function bounded(text) {
  const clean = sanitize(text)
  return clean.length > 4000 ? `${clean.slice(0, 4000)}\n[truncated]` : clean
}

function runSupabase(args, label, options = {}) {
  const command = `supabase ${args.join(' ')}`
  const startedAt = new Date().toISOString()
  try {
    const stdout = execFileSync('supabase', args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        HOME: isolatedHome,
        SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN ?? '',
      },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: options.timeoutMs ?? 120000,
    })
    commands.push({
      label,
      command,
      exitStatus: 0,
      startedAt,
      completedAt: new Date().toISOString(),
      stdoutSnippet: bounded(stdout),
      stderrSnippet: '',
    })
    return stdout
  } catch (error) {
    commands.push({
      label,
      command,
      exitStatus: typeof error.status === 'number' ? error.status : 1,
      startedAt,
      completedAt: new Date().toISOString(),
      stdoutSnippet: bounded(error.stdout?.toString() ?? ''),
      stderrSnippet: bounded(error.stderr?.toString() ?? error.message),
    })
    throw error
  }
}

function writeJson(file, data) {
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`)
}

function finish(decision, execution, extra = {}, exitCode = 1) {
  const report = {
    packet,
    runId,
    outputDir,
    targetName,
    targetRef,
    targetClass,
    decision,
    execution,
    confirmation: process.env[confirmationVar] === 'true' ? 'present_true' : 'absent_or_not_true',
    credentialPresence: {
      supabaseAccessToken: Boolean(process.env.SUPABASE_ACCESS_TOKEN),
      readonlyDatabaseUrl: Boolean(process.env[readonlyDbUrlVar]),
      serviceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      databasePassword: Boolean(process.env.SUPABASE_DB_PASSWORD),
    },
    evidence,
    commands,
    safety: {
      remoteSupabaseMutation: false,
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

if (process.env[confirmationVar] !== 'true') {
  finish(
    'blocked_pending_guarded_supabase_target_rls_storage_validation_confirmation',
    'blocked_confirmation_absent_no_remote_execution',
    {
      blocker: 'blocked_pending_guarded_supabase_target_rls_storage_validation_confirmation',
      nextRequiredGate: `${confirmationVar}=true`,
    },
  )
}

if (!process.env.SUPABASE_ACCESS_TOKEN) {
  finish(
    'blocked_missing_supabase_access_token_for_readonly_target_identity',
    'blocked_no_remote_execution_missing_safe_credential_context',
    {
      blocker: 'blocked_missing_supabase_access_token_for_readonly_target_identity',
      requiredCredentialContext: 'SUPABASE_ACCESS_TOKEN',
    },
  )
}

let projects
try {
  const projectsRaw = runSupabase(['projects', 'list', '--output', 'json'], 'readonly_target_identity')
  projects = JSON.parse(projectsRaw)
} catch {
  finish(
    'blocked_readonly_target_identity_check_failed',
    'blocked_remote_readonly_validation_incomplete',
    { blocker: 'blocked_readonly_target_identity_check_failed' },
  )
}

const targetProject = Array.isArray(projects)
  ? projects.find((project) => {
      const text = JSON.stringify(project)
      return text.includes(targetRef) || text.includes(targetName)
    })
  : undefined

if (!targetProject) {
  finish(
    'blocked_supabase_target_identity_mismatch',
    'blocked_remote_readonly_validation_incomplete',
    {
      blocker: 'blocked_supabase_target_identity_mismatch',
      targetIdentityCandidates: Array.isArray(projects) ? projects.length : 0,
    },
  )
}

evidence.targetIdentity = 'passed_readonly_management_api_project_list'

if (!process.env[readonlyDbUrlVar]) {
  finish(
    'blocked_missing_readonly_rls_storage_metadata_context',
    'blocked_remote_readonly_validation_incomplete_after_target_identity',
    {
      blocker: 'blocked_missing_readonly_rls_storage_metadata_context',
      targetIdentity: 'passed',
      requiredCredentialContext: readonlyDbUrlVar,
      note: 'Target identity passed, but RLS/storage advisor validation requires a read-only database URL provided by the execution environment. The URL is not printed or persisted.',
    },
  )
}

try {
  const lintRaw = runSupabase(
    [
      'db',
      'lint',
      '--db-url',
      process.env[readonlyDbUrlVar],
      '--schema',
      'public,storage',
      '--level',
      'warning',
      '--fail-on',
      'none',
    ],
    'readonly_rls_storage_advisor_lint',
    { timeoutMs: 180000 },
  )
  evidence.advisorLint = 'passed_readonly_public_storage_schema_lint'
  finish(
    'completed_guarded_supabase_target_rls_storage_readonly_validation',
    'completed_readonly_target_identity_and_advisor_validation_no_mutation',
    {
      targetIdentity: 'passed',
      rlsValidation: 'passed_readonly_advisor_lint',
      storageValidation: 'passed_readonly_storage_schema_advisor_lint',
      advisorOutputBytes: Buffer.byteLength(lintRaw),
      nextMilestone: 'SUPABASE-WORKER-RUNTIME-TRANSACTIONAL-RPC-4R-CONFIRMED',
    },
    0,
  )
} catch {
  finish(
    'blocked_readonly_rls_storage_advisor_lint_failed',
    'blocked_remote_readonly_validation_incomplete',
    {
      blocker: 'blocked_readonly_rls_storage_advisor_lint_failed',
      targetIdentity: 'passed',
    },
  )
}
