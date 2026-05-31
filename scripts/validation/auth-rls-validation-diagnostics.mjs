import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const runtimeScopeFiles = [
  'server/routes/auth-routes.ts',
  'server/routes/project-routes.ts',
  'server/services/auth-service.ts',
  'server/services/project-service.ts',
  'server/validation/auth-workspace-schemas.ts',
]

const routeMetadataFiles = [
  'src/backend/api/routes/auth-bootstrap-api-routes.ts',
  'src/backend/api/routes/project-api-routes.ts',
]

const promptFiles = [...runtimeScopeFiles, ...routeMetadataFiles]

const blockedTableNames = [
  'user_profiles',
  'edit_sessions',
  'chat_messages',
  'chat_sessions',
  'chat_attachments',
  'inline_chat_cards',
  'chat_actions',
  'media_assets',
  'uploaded_clips',
  'source_sequence_items',
  'reference_assets',
  'upload_intents',
  'storage_object_records',
  'signed_url_events',
  'edit_intent_snapshots',
  'edit_settings_snapshots',
  'edit_plan_versions',
  'plan_component_snapshots',
  'edit_plan_segments',
  'signature_routes',
  'credit_estimates',
  'credit_estimate_items',
  'approval_records',
  'credit_reservations',
  'credit_ledger_entries',
  'refund_records',
  'approved_plan_snapshots',
  'editing_jobs',
  'job_steps',
  'worker_events',
  'worker_leases',
  'backend_runtime_messages',
  'job_claim_attempts',
  'worker_job_claims',
  'generation_requests',
  'generation_events',
  'generated_assets',
  'generated_asset_versions',
  'render_jobs',
  'render_job_inputs',
  'renders',
  'render_events',
  'final_exports',
  'qa_reports',
  'qa_check_results',
  'revision_requests',
  'tool_runtime_checks',
]

const forbiddenDomainTerms = [
  'storage',
  'upload',
  'media',
  'credit',
  'job',
  'worker',
  'provider',
  'render',
  'tool',
  'stripe',
  'signed_url',
  'signed url',
  'service_role_key',
  'supabase_service_role_key',
  'api_key',
  'provider key',
]

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath))
}

function detectPackageManager() {
  if (exists('package-lock.json')) return 'npm'
  if (exists('pnpm-lock.yaml')) return 'pnpm'
  if (exists('yarn.lock')) return 'yarn'
  return 'unknown'
}

function findExecutable(name) {
  const pathValue = process.env.PATH ?? ''
  const pathEntries = pathValue.split(path.delimiter).filter(Boolean)

  for (const entry of pathEntries) {
    const candidate = path.join(entry, name)
    try {
      fs.accessSync(candidate, fs.constants.X_OK)
      return candidate
    } catch {
      // Continue scanning PATH.
    }
  }

  return null
}

function summarizeError(error) {
  return {
    name: error.name,
    code: error.code,
    errno: error.errno,
    signal: error.signal,
    status: error.status,
    message: String(error.message ?? '').slice(0, 400),
    stderr: Buffer.isBuffer(error.stderr) ? error.stderr.toString('utf8').slice(0, 400) : undefined,
    stdout: Buffer.isBuffer(error.stdout) ? error.stdout.toString('utf8').slice(0, 400) : undefined,
  }
}

function getSupabaseCliStatus() {
  const executablePath = findExecutable('supabase')
  if (!executablePath) {
    return {
      found: false,
      path: null,
      versionAttempted: false,
      version: null,
      error: null,
    }
  }

  try {
    const output = execFileSync(executablePath, ['--version'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 5000,
    })

    return {
      found: true,
      path: executablePath,
      versionAttempted: true,
      version: output.trim(),
      error: null,
    }
  } catch (error) {
    return {
      found: true,
      path: executablePath,
      versionAttempted: true,
      version: null,
      error: summarizeError(error),
    }
  }
}

function scanTerms(filePath, terms) {
  const absolutePath = path.join(root, filePath)
  if (!fs.existsSync(absolutePath)) {
    return []
  }

  const lines = fs.readFileSync(absolutePath, 'utf8').split('\n')
  const matches = []

  lines.forEach((line, index) => {
    const lowerLine = line.toLowerCase()
    for (const term of terms) {
      if (lowerLine.includes(term.toLowerCase())) {
        matches.push({
          file: filePath,
          line: index + 1,
          term,
        })
      }
    }
  })

  return matches
}

function scanPromptFiles() {
  const files = promptFiles.map((filePath) => ({
    path: filePath,
    exists: exists(filePath),
  }))

  const existingFiles = files.filter((file) => file.exists).map((file) => file.path)
  const existingRuntimeFiles = runtimeScopeFiles.filter((filePath) => exists(filePath))
  const existingRouteMetadataFiles = routeMetadataFiles.filter((filePath) => exists(filePath))
  const blockedTableMatches = existingFiles.flatMap((filePath) => scanTerms(filePath, blockedTableNames))
  const legacyProfileMatches = existingFiles.flatMap((filePath) => scanTerms(filePath, ['user_profiles']))
  const forbiddenDomainMatches = existingRuntimeFiles.flatMap((filePath) => scanTerms(filePath, forbiddenDomainTerms))
  const routeMetadataDomainMentions = existingRouteMetadataFiles.flatMap((filePath) => scanTerms(filePath, forbiddenDomainTerms))

  return {
    files,
    blockedTableMatches,
    legacyProfileMatches,
    forbiddenDomainMatches,
    routeMetadataDomainMentions,
    summary: {
      filesScanned: existingFiles.length,
      runtimeFilesScanned: existingRuntimeFiles.length,
      routeMetadataFilesScanned: existingRouteMetadataFiles.length,
      blockedTableMatchCount: blockedTableMatches.length,
      legacyProfileMatchCount: legacyProfileMatches.length,
      forbiddenDomainMatchCount: forbiddenDomainMatches.length,
      routeMetadataDomainMentionCount: routeMetadataDomainMentions.length,
    },
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  repoRelativeRoot: '.',
  safety: {
    connectsToSupabase: false,
    readsEnvironmentSecrets: false,
    executesSql: false,
    runsBuild: false,
    callsProviders: false,
    rendersMedia: false,
    executesReeditProTools: false,
    usesNodeBuiltInsOnly: true,
  },
  environment: {
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
  },
  files: {
    packageJsonExists: exists('package.json'),
    packageLockExists: exists('package-lock.json'),
    nodeModulesExists: exists('node_modules'),
    detectedPackageManager: detectPackageManager(),
    viteConfigExists: exists('vite.config.ts'),
    viteServerConfigExists: exists('vite.server.config.ts'),
    viteRemotionWorkerConfigExists: exists('vite.remotion-worker.config.ts'),
    rlsDraftSqlExists: exists('database/test-sql/006_auth_workspace_rls_smoke_tests.draft.sql'),
    rlsExecutableSqlExists: exists('database/test-sql/006_auth_workspace_rls_smoke_tests.sql'),
  },
  supabaseCli: getSupabaseCliStatus(),
  promptScopeScan: scanPromptFiles(),
}

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)
