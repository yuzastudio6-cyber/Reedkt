import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const args = process.argv.slice(2)

const mode = args.includes('--run')
  ? 'run'
  : args.includes('--list-tests')
    ? 'list-tests'
    : 'dry-run'

const selectedFiles = valuesFor('--file')
const explicitEvidencePath = valueFor('--evidence')
const confirmLocalOnly = args.includes('--confirm-local-only')

const allowedDirectories = [
  path.resolve(root, 'database/test-sql/local'),
]

function valueFor(flag) {
  const index = args.indexOf(flag)
  if (index === -1) return null
  return args[index + 1] ?? null
}

function valuesFor(flag) {
  const values = []
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === flag && args[index + 1]) values.push(args[index + 1])
  }
  return values
}

function defaultEvidencePath() {
  if (mode !== 'run') return null
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `.reeditpro-local-validation/supabase-rls-evidence/${stamp}.json`
}

function redact(value) {
  return String(value ?? '')
    .replace(/(service[_-]?role|anon|access[_-]?token|secret|password|key)[^\s"'=:]*(\s*[:=]\s*)[^\s"']+/gi, '$1$2[redacted]')
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, 'postgres://[redacted-local-db-url]')
    .slice(0, 1600)
}

function runCommand(command, commandArgs, timeoutMs = 8000) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: timeoutMs,
  })

  return {
    command: [path.basename(command), ...commandArgs].join(' '),
    exitCode: typeof result.status === 'number' ? result.status : null,
    signal: result.signal ?? null,
    rawStdout: String(result.stdout ?? ''),
    stdout: redact(result.stdout),
    stderr: redact(result.stderr),
    error: result.error
      ? {
          name: result.error.name,
          code: result.error.code,
          errno: result.error.errno,
          message: redact(result.error.message),
        }
      : null,
  }
}

function runNodeScript(relativePath, scriptArgs = []) {
  return runCommand(process.execPath, [relativePath, ...scriptArgs], 8000)
}

function parseJsonCommandResult(commandResult) {
  if (commandResult.exitCode !== 0 || commandResult.error) return null
  try {
    return JSON.parse(commandResult.rawStdout)
  } catch {
    return null
  }
}

function listTests() {
  const rootTestDir = path.join(root, 'database/test-sql')
  const localTestDir = path.join(root, 'database/test-sql/local')
  const tests = []

  if (fs.existsSync(rootTestDir)) {
    for (const file of fs.readdirSync(rootTestDir).sort()) {
      if (!file.endsWith('.sql')) continue
      tests.push({
        path: `database/test-sql/${file}`,
        status: file.endsWith('.draft.sql') ? 'draft_only' : 'manual_legacy_or_review_needed',
        executableByRunner: false,
      })
    }
  }

  if (fs.existsSync(localTestDir)) {
    for (const file of fs.readdirSync(localTestDir).sort()) {
      if (!file.endsWith('.sql')) continue
      tests.push({
        path: `database/test-sql/local/${file}`,
        status: file.endsWith('.draft.sql') ? 'draft_only' : 'local_executable_candidate',
        executableByRunner: !file.endsWith('.draft.sql'),
      })
    }
  }

  return tests
}

function isAllowedSqlPath(relativePath) {
  const resolved = path.resolve(root, relativePath)
  return (
    resolved.endsWith('.sql') &&
    !resolved.endsWith('.draft.sql') &&
    allowedDirectories.some((directory) => resolved.startsWith(`${directory}${path.sep}`))
  )
}

function selectedExecutableTests() {
  if (selectedFiles.length > 0) {
    return selectedFiles.map((file) => ({
      path: file,
      exists: fs.existsSync(path.resolve(root, file)),
      allowed: isAllowedSqlPath(file),
    }))
  }

  return listTests()
    .filter((test) => test.executableByRunner)
    .map((test) => ({
      path: test.path,
      exists: fs.existsSync(path.resolve(root, test.path)),
      allowed: isAllowedSqlPath(test.path),
    }))
}

function localHostname(hostname) {
  return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(String(hostname ?? '').toLowerCase())
}

function parseLocalDbUrl(statusJson) {
  if (!statusJson || typeof statusJson !== 'object') return null

  const candidates = [
    statusJson.DB_URL,
    statusJson.db_url,
    statusJson.database_url,
    statusJson.databaseUrl,
    statusJson.api?.DB_URL,
    statusJson.db?.url,
  ].filter(Boolean)

  for (const candidate of candidates) {
    try {
      const parsed = new URL(candidate)
      if (localHostname(parsed.hostname)) return candidate
    } catch {
      // Continue looking for a local URL.
    }
  }

  return null
}

function localSupabaseStatus(preflight) {
  if (mode === 'list-tests') {
    return {
      attempted: false,
      reason: 'List mode does not inspect Supabase status.',
      command: 'supabase status --output json',
      result: null,
      localDbUrlAvailable: false,
    }
  }

  const supabasePath = preflight?.tools?.supabaseCli?.path
  const supabaseExecutable = Boolean(preflight?.tools?.supabaseCli?.executable)
  if (!supabasePath || !supabaseExecutable) {
    return {
      attempted: false,
      reason: 'Supabase CLI is unavailable or not executable.',
      command: 'supabase status --output json',
      result: null,
      localDbUrlAvailable: false,
    }
  }

  const status = runCommand(supabasePath, ['status', '--output', 'json'], 8000)
  const json = parseJsonCommandResult(status)
  const dbUrl = parseLocalDbUrl(json)

  return {
    attempted: true,
    command: 'supabase status --output json',
    result: status,
    parsedJson: Boolean(json),
    localDbUrlAvailable: Boolean(dbUrl),
    localDbUrlRedacted: dbUrl ? 'postgres://[redacted-local-db-url]' : null,
    dbUrl,
  }
}

function writeEvidence(result) {
  const evidencePath = explicitEvidencePath ?? defaultEvidencePath()
  if (!evidencePath) return null
  const resolved = path.resolve(root, evidencePath)
  fs.mkdirSync(path.dirname(resolved), { recursive: true })
  fs.writeFileSync(resolved, `${JSON.stringify(result, null, 2)}\n`)
  return path.relative(root, resolved)
}

function preflightBlockers(preflight) {
  if (!preflight) return ['Safety preflight did not return parseable JSON.']
  return [
    ...(preflight.decision?.criticalFindings ?? []),
    ...(preflight.decision?.blockers ?? []),
  ]
}

const preflightCommand = runNodeScript('scripts/validation/local-supabase-safety-preflight.mjs')
const preflight = parseJsonCommandResult(preflightCommand)
const tests = listTests()
const executableTests = selectedExecutableTests()
const status = localSupabaseStatus(preflight)

const blockers = []

if (mode !== 'list-tests') {
  blockers.push(...preflightBlockers(preflight))
}

if (mode === 'run' && !confirmLocalOnly) {
  blockers.push('Run mode requires --confirm-local-only.')
}

if (mode === 'run' && preflight?.decision?.remoteRiskDetected) {
  blockers.push('Run mode refused execution because remote risk was detected.')
}

if (mode === 'run' && !preflight?.decision?.canRunLocalSql) {
  blockers.push('Run mode refused execution because safety preflight did not allow local SQL.')
}

if (mode !== 'list-tests' && !status.localDbUrlAvailable) {
  blockers.push('No verified local Supabase database URL is available from `supabase status --output json`.')
}

if (executableTests.length === 0) {
  blockers.push('No local executable SQL candidates were selected or found.')
}

for (const test of executableTests) {
  if (!test.exists) blockers.push(`Selected SQL file does not exist: ${test.path}`)
  if (!test.allowed) blockers.push(`Selected SQL file is not an allowed local executable path: ${test.path}`)
}

const psqlPath = preflight?.tools?.psql?.path
const canRun =
  mode === 'run' &&
  blockers.length === 0 &&
  Boolean(psqlPath) &&
  Boolean(status.dbUrl)

const commandsRun = []
const testResults = []

if (mode === 'run' && !canRun) {
  blockers.push('Run mode refused execution because the local-only target is not fully proven safe.')
}

if (canRun) {
  for (const test of executableTests) {
    const result = runCommand(psqlPath, [status.dbUrl, '-v', 'ON_ERROR_STOP=1', '-f', path.resolve(root, test.path)], 30000)
    commandsRun.push({ command: 'psql [redacted-local-db-url] -v ON_ERROR_STOP=1 -f [local-sql-file]', file: test.path })
    testResults.push({
      file: test.path,
      status: result.exitCode === 0 ? 'passed' : 'failed',
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr,
      error: result.error,
    })
  }
}

const failedTests = testResults.filter((result) => result.status !== 'passed')
const summaryStatus =
  mode === 'list-tests'
    ? 'listed'
    : mode === 'dry-run'
      ? blockers.length === 0
        ? 'ready'
        : 'blocked'
      : canRun && failedTests.length === 0
        ? 'passed'
        : 'blocked'

const result = {
  generatedAt: new Date().toISOString(),
  mode,
  platform: process.platform,
  arch: process.arch,
  nodeVersion: process.version,
  safety: {
    defaultDryRun: mode !== 'run',
    requiresConfirmLocalOnlyForRun: true,
    confirmLocalOnly,
    refusesRemoteLinks: true,
    refusesRiskyEnvNames: true,
    allowedSqlDirectories: allowedDirectories.map((directory) => path.relative(root, directory)),
    printsSecrets: false,
    callsRemoteSupabase: false,
    deploys: false,
    callsProviders: false,
    rendersMedia: false,
    executesTools: false,
    executesWorkers: false,
    transfersStorage: false,
    mutatesCredits: false,
  },
  preflight: {
    command: preflightCommand.command,
    exitCode: preflightCommand.exitCode,
    parsed: Boolean(preflight),
    summary: preflight?.summary ?? null,
    decision: preflight?.decision ?? null,
  },
  localStatus: {
    attempted: status.attempted,
    command: status.command,
    reason: status.reason ?? null,
    result: status.result
      ? {
          exitCode: status.result.exitCode,
          signal: status.result.signal,
          stderr: status.result.stderr,
          error: status.result.error,
        }
      : null,
    parsedJson: status.parsedJson ?? false,
    localDbUrlAvailable: status.localDbUrlAvailable,
    localDbUrlRedacted: status.localDbUrlRedacted,
  },
  tests: {
    all: tests,
    selectedExecutable: executableTests,
  },
  commandsRun,
  testResults,
  blockers,
  summary: {
    status: summaryStatus,
    sqlExecuted: commandsRun.length > 0,
    testCount: testResults.length,
    failedTestCount: failedTests.length,
    evidenceRequiredForRun: mode === 'run',
    recommendation:
      summaryStatus === 'passed'
        ? 'Record evidence and proceed only to the next approved validation milestone.'
        : summaryStatus === 'listed'
          ? 'Use dry-run next; do not execute SQL until preflight proves a local isolated target.'
          : 'Do not execute SQL. Repair the listed local-only blockers before running SQL.',
  },
}

const evidenceWritten = writeEvidence(result)
if (evidenceWritten) result.evidenceWritten = evidenceWritten

console.log(JSON.stringify(result, null, 2))

if (mode === 'run' && summaryStatus !== 'passed') {
  process.exitCode = 1
}
