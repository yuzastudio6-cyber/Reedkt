import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const root = process.cwd()

const approvedLocalDbUrlEnvPatterns = [
  /^REEDITPRO_LOCAL_SUPABASE_DB_URL$/i,
  /^LOCAL_SUPABASE_DB_URL$/i,
  /^SUPABASE_LOCAL_DB_URL$/i,
]

const remoteRiskEnvPatterns = [
  /^SUPABASE_(URL|DB_URL|DATABASE_URL|PROJECT_REF|PROJECT_ID)$/i,
  /^NEXT_PUBLIC_SUPABASE_(URL|ANON_KEY)$/i,
  /^DATABASE_URL$/i,
  /^POSTGRES(_URL|_PRISMA_URL|_URL_NON_POOLING)?$/i,
]

const criticalSecretEnvPatterns = [
  /^SUPABASE_(SERVICE_ROLE_KEY|ACCESS_TOKEN|DB_PASSWORD)$/i,
  /^STRIPE_(SECRET_KEY|WEBHOOK_SECRET|LIVE_SECRET_KEY)$/i,
  /^OPENAI_API_KEY$/i,
  /^PROVIDER_API_KEY$/i,
  /^GOOGLE_APPLICATION_CREDENTIALS$/i,
  /(^|_)(SECRET|TOKEN|PRIVATE_KEY|SERVICE_ROLE_KEY)$/i,
]

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

function summarizeError(error) {
  return {
    name: error.name,
    code: error.code,
    errno: error.errno,
    message: String(error.message ?? '').slice(0, 400),
  }
}

function redact(value) {
  return String(value ?? '')
    .replace(/(service[_-]?role|anon|access[_-]?token|secret|password|key)[^\s"'=:]*(\s*[:=]\s*)[^\s"']+/gi, '$1$2[redacted]')
    .replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, 'postgres://[redacted-local-db-url]')
    .slice(0, 1200)
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
    stdout: redact(result.stdout),
    stderr: redact(result.stderr),
    error: result.error ? summarizeError(result.error) : null,
  }
}

function fileArchitecture(executablePath) {
  const fileCommand = findExecutable('file')
  if (!executablePath || !fileCommand) return null
  return runCommand(fileCommand, [executablePath], 3000)
}

function architectureText(architecture) {
  return `${architecture?.stdout ?? ''}\n${architecture?.stderr ?? ''}`
}

function architectureMismatch(architecture) {
  const text = architectureText(architecture)
  return process.arch === 'arm64' && /\bx86_64\b/i.test(text) && !/\barm64\b/i.test(text)
}

function badCpuType(commandResult) {
  const text = `${commandResult?.stdout ?? ''}\n${commandResult?.stderr ?? ''}\n${commandResult?.error?.message ?? ''}`
  return /bad cpu type|unknown system error -86|\berrno:\s*-86\b/i.test(text)
}

function toolStatus(name, versionArgs, timeoutMs = 5000) {
  const executablePath = findExecutable(name)
  const architecture = fileArchitecture(executablePath)
  const version = executablePath ? runCommand(executablePath, versionArgs, timeoutMs) : null
  const archMismatch = architectureMismatch(architecture)

  return {
    found: Boolean(executablePath),
    path: executablePath,
    architecture,
    architectureMismatch: archMismatch,
    badCpuType: badCpuType(version),
    version,
    executable: Boolean(executablePath && version?.exitCode === 0 && !archMismatch),
  }
}

function dockerStatus() {
  const executablePath = findExecutable('docker')
  const architecture = fileArchitecture(executablePath)
  const version = executablePath ? runCommand(executablePath, ['--version'], 5000) : null
  const daemon = executablePath ? runCommand(executablePath, ['info', '--format', '{{.ServerVersion}}'], 5000) : null
  const archMismatch = architectureMismatch(architecture)

  return {
    found: Boolean(executablePath),
    path: executablePath,
    architecture,
    architectureMismatch: archMismatch,
    version,
    daemon,
    executable: Boolean(executablePath && version?.exitCode === 0 && !archMismatch),
    daemonAvailable: Boolean(daemon && daemon.exitCode === 0),
  }
}

function homebrewStatus() {
  const executablePath = findExecutable('brew')
  const version = executablePath ? runCommand(executablePath, ['--version'], 5000) : null
  const prefix = executablePath ? runCommand(executablePath, ['--prefix'], 5000) : null
  const prefixText = String(prefix?.stdout ?? '').trim()

  return {
    found: Boolean(executablePath),
    path: executablePath,
    version,
    prefix,
    prefixPrinted: prefixText || null,
    isAppleSiliconPrefix: prefixText === '/opt/homebrew',
    isIntelPrefix: prefixText === '/usr/local',
    optHomebrewExists: fs.existsSync('/opt/homebrew'),
    optHomebrewBinExists: fs.existsSync('/opt/homebrew/bin'),
  }
}

function localHostname(hostname) {
  return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(String(hostname ?? '').toLowerCase())
}

function localDbUrlStatus(envNames) {
  const checked = []

  for (const name of envNames) {
    const rawValue = process.env[name]
    if (!rawValue) {
      checked.push({
        name,
        present: true,
        valuePrinted: false,
        parseable: false,
        localHostOnly: false,
        reason: 'empty_value',
      })
      continue
    }

    try {
      const parsed = new URL(rawValue)
      const localHostOnly = localHostname(parsed.hostname)
      checked.push({
        name,
        present: true,
        valuePrinted: false,
        parseable: true,
        protocol: parsed.protocol === 'postgresql:' ? 'postgres:' : parsed.protocol,
        localHostOnly,
        redactedUrl: localHostOnly ? 'postgres://[redacted-local-db-url]' : null,
      })
    } catch {
      checked.push({
        name,
        present: true,
        valuePrinted: false,
        parseable: false,
        localHostOnly: false,
        reason: 'invalid_url',
      })
    }
  }

  const local = checked.find((entry) => entry.parseable && entry.localHostOnly)

  return {
    envNames,
    checked,
    valuesPrinted: false,
    available: Boolean(local),
    source: local ? 'approved_local_db_url_env' : null,
  }
}

function configStatus() {
  const relativePath = 'supabase/config.toml'
  const resolved = path.join(root, relativePath)
  const exists = fs.existsSync(resolved)
  const text = exists
    ? fs
        .readFileSync(resolved, 'utf8')
        .split('\n')
        .filter((line) => !line.trim().startsWith('#'))
        .join('\n')
    : ''

  return {
    path: relativePath,
    exists,
    projectIdLocal: /^\s*project_id\s*=\s*"reeditpro-local"/im.test(text),
    remoteBlockPresent: /\[remotes\.[^\]]+\]/i.test(text),
    supabaseUrlPresent: /\.supabase\.co\b/i.test(text),
    envReferencePresent: /\benv\(/i.test(text),
  }
}

function localSqlCandidates() {
  const directory = path.join(root, 'database/test-sql/local')
  if (!fs.existsSync(directory)) return []

  return fs
    .readdirSync(directory)
    .filter((file) => file.endsWith('.sql') && !file.endsWith('.draft.sql'))
    .sort()
    .map((file) => `database/test-sql/local/${file}`)
}

const envNames = Object.keys(process.env)
const localDbUrlEnvNames = envNames.filter((name) => approvedLocalDbUrlEnvPatterns.some((pattern) => pattern.test(name))).sort()
const remoteRiskEnvNames = envNames.filter((name) => remoteRiskEnvPatterns.some((pattern) => pattern.test(name))).sort()
const criticalSecretEnvNames = envNames.filter((name) => criticalSecretEnvPatterns.some((pattern) => pattern.test(name))).sort()

const supabaseCli = toolStatus('supabase', ['--version'])
const docker = dockerStatus()
const psql = toolStatus('psql', ['--version'])
const homebrew = homebrewStatus()
const localDbUrl = localDbUrlStatus(localDbUrlEnvNames)
const config = configStatus()
const candidates = localSqlCandidates()

const remoteRiskDetected = remoteRiskEnvNames.length > 0
const criticalSecretRiskDetected = criticalSecretEnvNames.length > 0
const configSafe = Boolean(config.exists && config.projectIdLocal && !config.remoteBlockPresent && !config.supabaseUrlPresent && !config.envReferencePresent)
const canProceedToPrompt20B = Boolean(
  supabaseCli.executable &&
    docker.executable &&
    docker.daemonAvailable &&
    psql.executable &&
    configSafe &&
    localDbUrl.available &&
    !remoteRiskDetected &&
    !criticalSecretRiskDetected,
)
const canRunLocalSql = Boolean(canProceedToPrompt20B && candidates.length > 0)

const blockers = []
if (!supabaseCli.found) blockers.push('supabase_cli_missing')
else if (supabaseCli.architectureMismatch) blockers.push('supabase_cli_arch_mismatch')
else if (!supabaseCli.executable) blockers.push('supabase_cli_not_executable')
if (!docker.found) blockers.push('docker_missing')
else if (!docker.daemonAvailable) blockers.push('docker_daemon_unavailable')
if (!psql.found) blockers.push('psql_missing')
else if (psql.architectureMismatch) blockers.push('psql_arch_mismatch')
else if (!psql.executable) blockers.push('psql_not_executable')
if (!configSafe) blockers.push('local_supabase_config_not_safe')
if (!localDbUrl.available) blockers.push('local_db_url_missing')
if (candidates.length === 0) blockers.push('local_sql_candidate_missing')
if (remoteRiskDetected) blockers.push('remote_risk_env_names_present')
if (criticalSecretRiskDetected) blockers.push('critical_secret_env_names_present')

const result = {
  generatedAt: new Date().toISOString(),
  platform: process.platform,
  arch: process.arch,
  hostArch: os.arch(),
  nodeVersion: process.version,
  safety: {
    manualOnly: true,
    installsTools: false,
    downloadsTools: false,
    callsNpx: false,
    runsSupabaseStatus: false,
    runsSupabaseLifecycle: false,
    executesSql: false,
    connectsToDatabases: false,
    printsSecrets: false,
    readsEnvValues: localDbUrlEnvNames.length > 0,
    readsEnvValuesScope: localDbUrlEnvNames.length > 0 ? 'approved local DB URL names only for localhost verification' : 'none',
    callsProviders: false,
    rendersMedia: false,
    executesTools: false,
    executesWorkers: false,
    deploys: false,
    mutatesSourceFiles: false,
  },
  tools: {
    supabaseCli,
    docker,
    psql,
    homebrew,
  },
  files: {
    supabaseConfig: config,
    localSqlCandidates: candidates,
  },
  environment: {
    localDbUrl,
    remoteRiskEnvNames,
    criticalSecretEnvNames,
    valuesPrinted: false,
  },
  decision: {
    status: canProceedToPrompt20B ? 'ready_for_prompt_20b' : 'blocked',
    manualSetupRequired: !canProceedToPrompt20B,
    canProceedToPrompt20B,
    canRunLocalSql,
    canUseDocker: Boolean(docker.executable && docker.daemonAvailable),
    canUsePsql: Boolean(psql.executable),
    localDbUrlAvailable: localDbUrl.available,
    remoteRiskDetected,
    blockerIds: blockers,
    nextRecommendedPrompt: canProceedToPrompt20B
      ? 'Prompt 20B - Local RLS First Executable Smoke Test'
      : 'Prompt 20F1 - Manual Host Tool Repair Follow-Up',
    prompt20BReadiness: {
      canProceed: canProceedToPrompt20B,
      canRunLocalSql,
      requiredBeforePrompt20B: [
        ...(supabaseCli.executable ? [] : ['arm64-compatible Supabase CLI']),
        ...(docker.daemonAvailable ? [] : ['local Docker-compatible runtime']),
        ...(psql.executable ? [] : ['psql or approved local SQL executor']),
        ...(localDbUrl.available ? [] : ['localhost-only local Supabase database URL']),
        ...(configSafe ? [] : ['local-only supabase/config.toml']),
        ...(remoteRiskDetected ? ['remove remote Supabase link/env risk indicators'] : []),
        ...(criticalSecretRiskDetected ? ['remove critical secret-like env names from validation environment'] : []),
      ],
      prompt20BWorkItems: candidates.length > 0
        ? []
        : ['Prompt 20B should create the first executable local-only SQL candidate under database/test-sql/local/.'],
    },
  },
  recommendation: canProceedToPrompt20B
    ? 'Prompt 20B may create the first executable local SQL candidate and run only the guarded local runner if the prompt explicitly approves it.'
    : 'Do not execute SQL. Complete manual host tool repair outside the repo and rerun this probe.',
}

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)

if (remoteRiskDetected || criticalSecretRiskDetected) {
  process.exitCode = 1
}
