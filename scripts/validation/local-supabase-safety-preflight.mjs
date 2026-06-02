import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const root = process.cwd()

const requiredFiles = [
  'docs/supabase-rls-test-manifest.md',
  'docs/rls-draft-to-executable-conversion-plan.md',
  'docs/supabase-rls-fixture-contract.md',
  'docs/staging-supabase-validation-runbook.md',
  'docs/supabase-validation-evidence-checklist.md',
  'database/test-sql/README.md',
  'supabase/migration-order.md',
  'supabase/migrations',
]

const riskyEnvNames = [
  /^SUPABASE_(URL|ANON_KEY|SERVICE_ROLE_KEY|ACCESS_TOKEN|DB_URL|DATABASE_URL|PROJECT_REF|PROJECT_ID)$/i,
  /^NEXT_PUBLIC_SUPABASE_(URL|ANON_KEY)$/i,
  /^DATABASE_URL$/i,
  /^POSTGRES(_URL|_PRISMA_URL|_URL_NON_POOLING)?$/i,
  /^STRIPE_(SECRET_KEY|WEBHOOK_SECRET|LIVE_SECRET_KEY)$/i,
  /^OPENAI_API_KEY$/i,
  /^PROVIDER_API_KEY$/i,
  /^GOOGLE_APPLICATION_CREDENTIALS$/i,
]

const linkIndicatorFiles = [
  '.supabase/project-ref',
  '.supabase/.temp/project-ref',
  '.supabase/config.toml',
  'supabase/.temp/project-ref',
]

function absolute(relativePath) {
  return path.join(root, relativePath)
}

function exists(relativePath) {
  return fs.existsSync(absolute(relativePath))
}

function findExecutable(name) {
  const entries = (process.env.PATH ?? '').split(path.delimiter).filter(Boolean)
  for (const entry of entries) {
    const candidate = path.join(entry, name)
    try {
      fs.accessSync(candidate, fs.constants.X_OK)
      return candidate
    } catch {
      // Keep scanning PATH.
    }
  }
  return null
}

function runCommand(command, args, timeoutMs = 5000) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: timeoutMs,
  })

  return {
    attempted: true,
    command: [path.basename(command), ...args].join(' '),
    exitCode: typeof result.status === 'number' ? result.status : null,
    signal: result.signal ?? null,
    stdout: redactOutput(result.stdout),
    stderr: redactOutput(result.stderr),
    error: result.error ? summarizeError(result.error) : null,
  }
}

function summarizeError(error) {
  return {
    name: error.name,
    code: error.code,
    errno: error.errno,
    message: String(error.message ?? '').slice(0, 400),
  }
}

function redactOutput(value) {
  return String(value ?? '')
    .replace(/(service[_-]?role|anon|access[_-]?token|secret|password|key)[^\s"'=:]*(\s*[:=]\s*)[^\s"']+/gi, '$1$2[redacted]')
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, 'postgres://[redacted-local-db-url]')
    .slice(0, 1200)
}

function fileArchitecture(executablePath) {
  const fileCommand = findExecutable('file')
  if (!executablePath || !fileCommand) return null
  return runCommand(fileCommand, [executablePath], 3000)
}

function toolStatus(name, versionArgs) {
  const executablePath = findExecutable(name)
  const architecture = fileArchitecture(executablePath)
  const version = executablePath ? runCommand(executablePath, versionArgs, 5000) : null
  const versionOk = Boolean(version && version.exitCode === 0)

  return {
    found: Boolean(executablePath),
    path: executablePath,
    architecture,
    version,
    executable: Boolean(executablePath && versionOk),
  }
}

function dockerStatus() {
  const executablePath = findExecutable('docker')
  const architecture = fileArchitecture(executablePath)
  const version = executablePath ? runCommand(executablePath, ['--version'], 5000) : null
  const daemon = executablePath ? runCommand(executablePath, ['info', '--format', '{{.ServerVersion}}'], 5000) : null

  return {
    found: Boolean(executablePath),
    path: executablePath,
    architecture,
    version,
    daemon,
    executable: Boolean(executablePath && version?.exitCode === 0),
    daemonAvailable: Boolean(daemon && daemon.exitCode === 0),
  }
}

function listSqlFiles() {
  const testDir = absolute('database/test-sql')
  if (!fs.existsSync(testDir)) return []

  return fs
    .readdirSync(testDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => ({
      path: `database/test-sql/${file}`,
      draftOnly: file.endsWith('.draft.sql'),
      localExecutableCandidate: false,
    }))
}

function listLocalSqlFiles() {
  const localDir = absolute('database/test-sql/local')
  if (!fs.existsSync(localDir)) return []

  return fs
    .readdirSync(localDir)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => ({
      path: `database/test-sql/local/${file}`,
      draftOnly: file.endsWith('.draft.sql'),
      localExecutableCandidate: !file.endsWith('.draft.sql'),
    }))
}

const missingRequiredFiles = requiredFiles.filter((file) => !exists(file))
const riskyEnvironmentNames = Object.keys(process.env)
  .filter((name) => riskyEnvNames.some((pattern) => pattern.test(name)))
  .sort()

const linkIndicators = linkIndicatorFiles
  .filter(exists)
  .map((file) => ({ path: file, present: true, valuePrinted: false }))

const supabaseConfig = {
  path: 'supabase/config.toml',
  exists: exists('supabase/config.toml'),
}

const supabaseCli = toolStatus('supabase', ['--version'])
const docker = dockerStatus()
const psql = toolStatus('psql', ['--version'])

const blockers = []
const criticalFindings = []

if (!supabaseConfig.exists) {
  blockers.push('supabase/config.toml is missing, so local Supabase project configuration is not proven.')
}

if (!supabaseCli.found) {
  blockers.push('Supabase CLI is not on PATH.')
} else if (!supabaseCli.executable) {
  blockers.push('Supabase CLI exists but cannot execute on this host.')
}

if (!docker.found) {
  blockers.push('Docker is not on PATH.')
} else if (!docker.executable) {
  blockers.push('Docker exists but `docker --version` failed.')
} else if (!docker.daemonAvailable) {
  blockers.push('Docker daemon is not available to this process.')
}

if (!psql.found) {
  blockers.push('psql is not on PATH, so the local SQL runner cannot execute selected SQL directly.')
} else if (!psql.executable) {
  blockers.push('psql exists but cannot execute on this host.')
}

if (riskyEnvironmentNames.length > 0) {
  criticalFindings.push('Risky Supabase/database/provider/payment secret-like environment variable names are present.')
}

if (linkIndicators.length > 0) {
  criticalFindings.push('Local Supabase link/project-ref indicators are present.')
}

if (missingRequiredFiles.length > 0) {
  criticalFindings.push('Required Prompt 19 Supabase/RLS preparation files are missing.')
}

const localSqlFiles = listLocalSqlFiles()
const summaryStatus =
  criticalFindings.length > 0 ? 'failed' : blockers.length > 0 ? 'blocked' : 'passed'

const result = {
  generatedAt: new Date().toISOString(),
  platform: process.platform,
  arch: process.arch,
  hostArch: os.arch(),
  nodeVersion: process.version,
  safety: {
    readsEnvValues: false,
    printsSecrets: false,
    connectsToRemoteSupabase: false,
    executesSql: false,
    runsMigrations: false,
    deploys: false,
    callsProviders: false,
    rendersMedia: false,
    executesTools: false,
    executesWorkers: false,
    transfersStorage: false,
    createsSignedUrls: false,
    mutatesCredits: false,
  },
  files: {
    requiredFiles: requiredFiles.map((file) => ({ path: file, exists: exists(file) })),
    missingRequiredFiles,
    supabaseConfig,
    linkIndicators,
  },
  environment: {
    riskyEnvironmentNames,
    valuesPrinted: false,
  },
  tools: {
    supabaseCli,
    docker,
    psql,
  },
  sql: {
    draftAndManualTests: listSqlFiles(),
    localExecutableCandidates: localSqlFiles.filter((file) => file.localExecutableCandidate),
  },
  decision: {
    canRunLocalSql:
      criticalFindings.length === 0 &&
      blockers.length === 0 &&
      localSqlFiles.some((file) => file.localExecutableCandidate),
    blockers,
    criticalFindings,
    recommendation:
      summaryStatus === 'passed'
        ? 'Local-only SQL execution may proceed only through the guarded runner and selected local executable SQL files.'
        : summaryStatus === 'blocked'
          ? 'Do not execute SQL. Repair the listed local-only toolchain/config blockers first.'
          : 'Do not execute SQL. Remove critical remote/secret/link risks or restore required preparation files first.',
  },
  summary: {
    status: summaryStatus,
    criticalFindingCount: criticalFindings.length,
    blockerCount: blockers.length,
  },
}

console.log(JSON.stringify(result, null, 2))

if (criticalFindings.length > 0) {
  process.exitCode = 1
}
