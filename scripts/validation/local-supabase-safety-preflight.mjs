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

const localDbEnvPatterns = [
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

function readText(relativePath) {
  if (!exists(relativePath)) return ''
  return fs.readFileSync(absolute(relativePath), 'utf8')
}

function activeTomlText(relativePath) {
  return readText(relativePath)
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n')
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

function architectureText(architecture) {
  return `${architecture?.stdout ?? ''}\n${architecture?.stderr ?? ''}`
}

function architectureMismatch(architecture) {
  const text = architectureText(architecture)
  return process.arch === 'arm64' && /\bx86_64\b/i.test(text) && !/\barm64\b/i.test(text)
}

function executableFailsWithBadCpu(version) {
  const text = `${version?.stdout ?? ''}\n${version?.stderr ?? ''}\n${version?.error?.message ?? ''}`
  return /bad cpu type|unknown system error -86|\berrno:\s*-86\b/i.test(text)
}

function toolStatus(name, versionArgs) {
  const executablePath = findExecutable(name)
  const architecture = fileArchitecture(executablePath)
  const version = executablePath ? runCommand(executablePath, versionArgs, 5000) : null
  const versionOk = Boolean(version && version.exitCode === 0)
  const archMismatch = architectureMismatch(architecture)

  return {
    found: Boolean(executablePath),
    path: executablePath,
    architecture,
    architectureMismatch: archMismatch,
    badCpuType: executableFailsWithBadCpu(version),
    version,
    executable: Boolean(executablePath && versionOk && !archMismatch),
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
    architectureMismatch: architectureMismatch(architecture),
    version,
    daemon,
    executable: Boolean(executablePath && version?.exitCode === 0 && !architectureMismatch(architecture)),
    daemonAvailable: Boolean(daemon && daemon.exitCode === 0),
  }
}

function configStatus() {
  const relativePath = 'supabase/config.toml'
  const present = exists(relativePath)
  const activeText = activeTomlText(relativePath)
  const remoteBlockPresent = /\[remotes\.[^\]]+\]/i.test(activeText)
  const supabaseUrlPresent = /\.supabase\.co\b/i.test(activeText)
  const envReferencePresent = /\benv\(/i.test(activeText)
  const projectIdMatch = activeText.match(/^\s*project_id\s*=\s*"([^"]+)"/im)
  const projectIdPrinted = projectIdMatch?.[1] === 'reeditpro-local' ? 'reeditpro-local' : null
  const projectIdLooksRemote = Boolean(projectIdMatch && /^[a-z]{20}$/.test(projectIdMatch[1]))

  return {
    path: relativePath,
    exists: present,
    projectIdPrinted,
    projectIdValuePrinted: Boolean(projectIdPrinted),
    projectIdLooksRemote,
    remoteBlockPresent,
    supabaseUrlPresent,
    envReferencePresent,
    valuesPrinted: false,
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

function blocker(id, message) {
  return { id, severity: 'blocker', message }
}

function critical(id, message) {
  return { id, severity: 'critical', message }
}

function warning(id, message) {
  return { id, severity: 'warning', message }
}

function blockerIds(entries) {
  return entries.map((entry) => entry.id)
}

function supabaseCliRemediation(tool) {
  if (!tool.found) {
    return [
      'Install a Supabase CLI outside the repo before local SQL validation.',
      'Preferred macOS arm64 path: install through Homebrew so PATH can prefer /opt/homebrew/bin/supabase.',
      'Alternative: place a standalone arm64 Supabase binary outside the repo and make PATH prefer it.',
      'Alternative: use npx supabase only with Node.js 20 or later.',
      'Do not use global npm install -g supabase.',
    ]
  }

  if (tool.architectureMismatch || tool.badCpuType) {
    return [
      `Replace or shadow ${tool.path} with an arm64-compatible Supabase CLI before Prompt 20B.`,
      'Check architecture with: file $(which supabase).',
      'Preferred macOS arm64 path: /opt/homebrew/bin/supabase from Homebrew.',
      'Alternative: standalone arm64 Supabase binary outside the repo.',
      'Alternative: npx supabase with Node.js 20 or later after confirming the command is local-only.',
      'Do not commit binaries and do not use global npm install -g supabase.',
    ]
  }

  if (!tool.executable) {
    return [
      'Supabase CLI was found but did not execute. Repair PATH/permissions outside the repo.',
      'Confirm with: supabase --version.',
      'Do not run supabase start, reset, or SQL until preflight is ready.',
    ]
  }

  return ['Supabase CLI appears executable. Keep using local-only commands and avoid supabase link.']
}

function dockerRemediation(status) {
  if (!status.found) {
    return [
      'Install Docker Desktop, OrbStack, Colima, Rancher Desktop, Podman, or another Docker-compatible local runtime.',
      'Do not use a remote Docker host for local Supabase validation.',
    ]
  }

  if (!status.executable) {
    return [
      'Docker exists but docker --version failed. Repair the local Docker client path.',
      'Do not start Supabase until Docker is executable and local.',
    ]
  }

  if (!status.daemonAvailable) {
    return [
      'Start the local Docker daemon/runtime before Prompt 20B.',
      'Confirm with: docker info --format {{.ServerVersion}}.',
      'Do not route through a remote Docker host.',
    ]
  }

  return ['Docker is reachable. Supabase CLI and psql still must be repaired before local SQL can run.']
}

function psqlRemediation(tool) {
  if (!tool.found) {
    return [
      'Install psql outside the repo before running local SQL.',
      'Options: Postgres.app, Homebrew postgresql, Homebrew libpq with PATH updated, or a future approved Docker psql path.',
      'Confirm with: psql --version.',
      'Do not connect psql to staging, remote, or production databases.',
    ]
  }

  if (tool.architectureMismatch || tool.badCpuType) {
    return [
      'Replace psql with a host-compatible binary outside the repo.',
      'Confirm with: file $(which psql) and psql --version.',
    ]
  }

  if (!tool.executable) {
    return [
      'psql was found but did not execute. Repair PATH/permissions outside the repo.',
      'Confirm with: psql --version.',
    ]
  }

  return ['psql appears executable. It may only be used by the guarded local runner after preflight is ready.']
}

function configRemediation(status) {
  if (!status.exists) {
    return [
      'Create a local-only supabase/config.toml before local Supabase validation.',
      'The config must contain no remote project ref, no [remotes.*] block, no secrets, and local ports only.',
    ]
  }

  if (status.remoteBlockPresent || status.supabaseUrlPresent || status.projectIdLooksRemote) {
    return [
      'Remove remote Supabase references from supabase/config.toml before local SQL validation.',
      'Do not use supabase link in this repo for local validation prompts.',
    ]
  }

  return ['supabase/config.toml exists and appears local-only by static inspection.']
}

const missingRequiredFiles = requiredFiles.filter((file) => !exists(file))
const envNames = Object.keys(process.env)
const localDbUrlEnvNames = envNames.filter((name) => localDbEnvPatterns.some((pattern) => pattern.test(name))).sort()
const remoteRiskEnvNames = envNames.filter((name) => remoteRiskEnvPatterns.some((pattern) => pattern.test(name))).sort()
const criticalSecretEnvNames = envNames.filter((name) => criticalSecretEnvPatterns.some((pattern) => pattern.test(name))).sort()

const linkIndicators = linkIndicatorFiles
  .filter(exists)
  .map((file) => ({ path: file, present: true, valuePrinted: false }))

const supabaseConfig = configStatus()
const supabaseCli = toolStatus('supabase', ['--version'])
const docker = dockerStatus()
const psql = toolStatus('psql', ['--version'])
const nodeRuntime = {
  path: process.execPath,
  architecture: fileArchitecture(process.execPath),
  version: process.version,
  architectureMismatch: architectureMismatch(fileArchitecture(process.execPath)),
}

const blockers = []
const warnings = []
const criticalFindings = []

if (!supabaseConfig.exists) {
  blockers.push(blocker('supabase_config_missing', 'supabase/config.toml is missing, so local Supabase project configuration is not proven.'))
}

if (supabaseConfig.remoteBlockPresent) {
  criticalFindings.push(critical('supabase_config_remote_block', 'supabase/config.toml contains a remotes block; remove remote branch/project configuration before local SQL.'))
}

if (supabaseConfig.supabaseUrlPresent || supabaseConfig.projectIdLooksRemote) {
  criticalFindings.push(critical('supabase_config_remote_reference', 'supabase/config.toml appears to reference a remote Supabase project.'))
}

if (supabaseConfig.envReferencePresent) {
  warnings.push(warning('supabase_config_env_reference', 'supabase/config.toml references env(); confirm it is local-only and contains no secrets before starting Supabase.'))
}

if (!supabaseCli.found) {
  blockers.push(blocker('supabase_cli_missing', 'Supabase CLI is not on PATH.'))
} else if (supabaseCli.architectureMismatch || supabaseCli.badCpuType) {
  blockers.push(blocker('supabase_cli_arch_mismatch', 'Supabase CLI exists but is not compatible with this host architecture.'))
} else if (!supabaseCli.executable) {
  blockers.push(blocker('supabase_cli_not_executable', 'Supabase CLI exists but cannot execute on this host.'))
}

if (!docker.found) {
  blockers.push(blocker('docker_missing', 'Docker is not on PATH.'))
} else if (!docker.executable) {
  blockers.push(blocker('docker_not_executable', 'Docker exists but `docker --version` failed.'))
} else if (!docker.daemonAvailable) {
  blockers.push(blocker('docker_daemon_unavailable', 'Docker daemon is not available to this process.'))
}

if (!psql.found) {
  blockers.push(blocker('psql_missing', 'psql is not on PATH, so the local SQL runner cannot execute selected SQL directly.'))
} else if (psql.architectureMismatch || psql.badCpuType) {
  blockers.push(blocker('psql_arch_mismatch', 'psql exists but is not compatible with this host architecture.'))
} else if (!psql.executable) {
  blockers.push(blocker('psql_not_executable', 'psql exists but cannot execute on this host.'))
}

if (remoteRiskEnvNames.length > 0) {
  blockers.push(blocker('remote_risk_env_names_present', 'Supabase/database URL or project-ref environment variable names are present; values were not read or printed.'))
}

if (criticalSecretEnvNames.length > 0) {
  criticalFindings.push(critical('secret_env_names_present', 'Secret-like environment variable names are present; values were not read or printed.'))
}

if (linkIndicators.length > 0) {
  criticalFindings.push(critical('supabase_link_indicator_present', 'Local Supabase link/project-ref indicators are present.'))
}

if (missingRequiredFiles.length > 0) {
  criticalFindings.push(critical('required_validation_files_missing', 'Required Prompt 19/20 Supabase/RLS preparation files are missing.'))
}

const localSqlFiles = listLocalSqlFiles()
const localExecutableCandidates = localSqlFiles.filter((file) => file.localExecutableCandidate)

if (localExecutableCandidates.length === 0) {
  blockers.push(blocker('local_sql_candidate_missing', 'No executable local-only SQL candidates exist under database/test-sql/local/.'))
}

const remoteRiskDetected =
  remoteRiskEnvNames.length > 0 ||
  linkIndicators.length > 0 ||
  supabaseConfig.remoteBlockPresent ||
  supabaseConfig.supabaseUrlPresent ||
  supabaseConfig.projectIdLooksRemote

const canUseDocker = Boolean(docker.executable && docker.daemonAvailable)
const canUsePsql = Boolean(psql.executable)
const configSafe = Boolean(supabaseConfig.exists && !supabaseConfig.remoteBlockPresent && !supabaseConfig.supabaseUrlPresent && !supabaseConfig.projectIdLooksRemote)
const canStartLocalSupabase = Boolean(configSafe && supabaseCli.executable && canUseDocker && !remoteRiskDetected && criticalFindings.length === 0)
const canResetLocalSupabase = Boolean(canStartLocalSupabase && exists('supabase/migrations'))
const canRunLocalSql = Boolean(configSafe && supabaseCli.executable && canUsePsql && localExecutableCandidates.length > 0 && !remoteRiskDetected && criticalFindings.length === 0)

const status =
  criticalFindings.length > 0 || blockers.length > 0
    ? 'blocked'
    : warnings.length > 0
      ? 'warning'
      : 'ready'

const manualSetupRequired = Boolean(!canRunLocalSql || blockers.length > 0 || criticalFindings.length > 0)
const nextRecommendedPrompt = canRunLocalSql
  ? 'Prompt 20B - Local RLS First Executable Smoke Test'
  : 'Prompt 20D - Manual Environment Setup Verification'
const prompt20BReadiness = {
  canProceed: canRunLocalSql,
  requiredBeforePrompt20B: [
    ...(supabaseCli.executable ? [] : ['arm64-compatible Supabase CLI']),
    ...(canUseDocker ? [] : ['local Docker-compatible runtime']),
    ...(canUsePsql ? [] : ['psql or approved local SQL executor']),
    ...(localExecutableCandidates.length > 0 ? [] : ['at least one executable local-only SQL candidate under database/test-sql/local/']),
    ...(remoteRiskDetected ? ['remove remote Supabase link/env risk indicators'] : []),
    ...(criticalFindings.length > 0 ? ['resolve critical safety findings'] : []),
  ],
}

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
    localDbUrlEnvNames,
    remoteRiskEnvNames,
    criticalSecretEnvNames,
    valuesPrinted: false,
  },
  tools: {
    nodeRuntime,
    supabaseCli,
    docker,
    psql,
  },
  sql: {
    draftAndManualTests: listSqlFiles(),
    localExecutableCandidates,
  },
  decision: {
    status,
    canRunLocalSql,
    canStartLocalSupabase,
    canResetLocalSupabase,
    canUseDocker,
    canUsePsql,
    remoteRiskDetected,
    manualSetupRequired,
    nextRecommendedPrompt,
    prompt20BReadiness,
    blockers: blockers.map((entry) => entry.message),
    blockerIds: blockerIds(blockers),
    blockerDetails: blockers,
    warnings: warnings.map((entry) => entry.message),
    warningIds: blockerIds(warnings),
    warningDetails: warnings,
    criticalFindings: criticalFindings.map((entry) => entry.message),
    criticalFindingIds: blockerIds(criticalFindings),
    criticalFindingDetails: criticalFindings,
    remediation: {
      supabaseCli: supabaseCliRemediation(supabaseCli),
      docker: dockerRemediation(docker),
      psql: psqlRemediation(psql),
      supabaseConfig: configRemediation(supabaseConfig),
      localSqlCandidate:
        localExecutableCandidates.length > 0
          ? ['Local executable SQL candidates exist. Run only through the guarded runner after all other preflight gates pass.']
          : [
              'Do not create or run executable SQL in Prompt 20C.',
              'Prompt 20B should create the first minimal local-only auth/workspace SQL candidate after local tools are repaired.',
            ],
      localDbUrl:
        canStartLocalSupabase || canRunLocalSql
          ? ['Use supabase status --output json only after the CLI and Docker local target are verified.']
          : ['No local DB URL is verified. Repair CLI/Docker first, then capture a localhost-only DB URL in Prompt 20B or a setup verification prompt.'],
    },
    nextActions:
      status === 'ready'
        ? ['Use the guarded runner with --confirm-local-only and selected local SQL files only.']
        : [
            'Do not execute SQL.',
            'Install or select an arm64 Supabase CLI outside the repo.',
            'Install psql or provide an approved local SQL executor outside the repo.',
            'Keep supabase/config.toml local-only and avoid supabase link.',
            `Recommended next prompt: ${nextRecommendedPrompt}.`,
          ],
    recommendation:
      status === 'ready'
        ? 'Local-only SQL execution may proceed only through the guarded runner and selected local executable SQL files.'
        : 'Do not execute SQL. Complete the manual local environment setup and verification before Prompt 20B.',
  },
  summary: {
    status,
    manualSetupRequired,
    nextRecommendedPrompt,
    criticalFindingCount: criticalFindings.length,
    blockerCount: blockers.length,
    warningCount: warnings.length,
  },
}

console.log(JSON.stringify(result, null, 2))

if (criticalFindings.length > 0) {
  process.exitCode = 1
}
