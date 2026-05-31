import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const implementationFiles = [
  'server/routes/upload-routes.ts',
  'server/services/upload-service.ts',
  'server/storage/storage-adapter.ts',
  'server/storage/local-storage-adapter.ts',
  'server/storage/gcs-storage-adapter.ts',
  'server/storage/storage-paths.ts',
  'server/storage/storage-types.ts',
  'server/storage/storage-validation.ts',
  'server/validation/upload-schemas.ts',
  'src/backend/api/routes/storage-api-routes.ts',
  'src/backend/api/routes/media-upload-api-routes.ts',
  'src/backend/storage/media-asset-service.ts',
  'src/backend/storage/source-upload-flow-service.ts',
  'src/backend/storage/storage-buckets.ts',
  'src/backend/storage/storage-client-service.ts',
  'src/backend/storage/storage-path-builder.ts',
  'src/backend/storage/upload-plan-service.ts',
  'src/backend/storage/upload-validation-service.ts',
]

const blockedTableNames = [
  'edit_sessions',
  'chat_messages',
  'chat_sessions',
  'chat_attachments',
  'inline_chat_cards',
  'chat_actions',
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
  'provider_requests',
  'provider_attempts',
  'provider_webhooks',
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

const forbiddenRuntimeTerms = [
  'creditReservation',
  'credit_reservation',
  'creditLedger',
  'credit_ledger',
  'approvedPlanSnapshot',
  'approved_plan_snapshot',
  'workerClaim',
  'worker_claim',
  'providerAttempt',
  'provider_attempt',
  'renderJob',
  'render_job',
  'stripe',
  'toolRuntime',
  'tool_runtime',
]

const secretTerms = [
  'service_role_key',
  'supabase_service_role_key',
  'provider_api_key',
  'stripe_secret_key',
  'private_key',
  'client_secret',
  'access_token',
  'refresh_token',
]

const signedUrlPersistenceTerms = [
  'signed_url_value',
  'storedSignedUrl',
  'persistedSignedUrl',
  'longLivedSignedUrl',
  'signed_url text',
  'signed_url varchar',
]

const publicSourceMediaTerms = [
  'source-media-public',
  'public_source_media',
  'source media public',
  'public source media',
  'isPublic: true',
  'public: true',
]

const pathTraversalTerms = [
  'path.join(',
  'path.resolve(',
  'normalizeStoragePath',
]

function fileExists(relativePath) {
  return fs.existsSync(path.join(root, relativePath))
}

function readLines(relativePath) {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) return []
  return fs.readFileSync(absolutePath, 'utf8').split('\n')
}

function scanTerms(files, terms, options = {}) {
  const matches = []

  for (const file of files) {
    const lines = readLines(file)
    lines.forEach((line, index) => {
      const haystack = options.caseSensitive ? line : line.toLowerCase()
      for (const term of terms) {
        const needle = options.caseSensitive ? term : term.toLowerCase()
        if (haystack.includes(needle)) {
          matches.push({
            file,
            line: index + 1,
            term,
            excerpt: line.trim().slice(0, 180),
          })
        }
      }
    })
  }

  return matches
}

function summarizeByFile(matches) {
  return matches.reduce((summary, match) => {
    summary[match.file] = (summary[match.file] ?? 0) + 1
    return summary
  }, {})
}

const files = implementationFiles.map((filePath) => ({
  path: filePath,
  exists: fileExists(filePath),
}))
const existingFiles = files.filter((file) => file.exists).map((file) => file.path)

const blockedTableMatches = scanTerms(existingFiles, blockedTableNames)
const forbiddenRuntimeMatches = scanTerms(existingFiles, forbiddenRuntimeTerms)
const secretMatches = scanTerms(existingFiles, secretTerms)
const signedUrlPersistenceMatches = scanTerms(existingFiles, signedUrlPersistenceTerms)
const publicSourceMediaMatches = scanTerms(existingFiles, publicSourceMediaTerms)
const pathGuardrailMatches = scanTerms(existingFiles, pathTraversalTerms, { caseSensitive: true })

const criticalFindings = [
  ...secretMatches,
  ...signedUrlPersistenceMatches,
  ...publicSourceMediaMatches,
]

const result = {
  generatedAt: new Date().toISOString(),
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  safety: {
    connectsToSupabase: false,
    readsEnvironmentSecrets: false,
    executesSql: false,
    uploadsObjects: false,
    callsProviders: false,
    rendersMedia: false,
    executesTools: false,
    deploys: false,
  },
  files,
  summary: {
    filesScanned: existingFiles.length,
    missingFiles: files.filter((file) => !file.exists).map((file) => file.path),
    blockedTableMatchCount: blockedTableMatches.length,
    forbiddenRuntimeMatchCount: forbiddenRuntimeMatches.length,
    secretMatchCount: secretMatches.length,
    signedUrlPersistenceMatchCount: signedUrlPersistenceMatches.length,
    publicSourceMediaMatchCount: publicSourceMediaMatches.length,
    pathGuardrailMatchCount: pathGuardrailMatches.length,
    criticalFindingCount: criticalFindings.length,
  },
  byFile: {
    blockedTables: summarizeByFile(blockedTableMatches),
    forbiddenRuntimeTerms: summarizeByFile(forbiddenRuntimeMatches),
    secrets: summarizeByFile(secretMatches),
    signedUrlPersistence: summarizeByFile(signedUrlPersistenceMatches),
    publicSourceMedia: summarizeByFile(publicSourceMediaMatches),
    pathGuardrails: summarizeByFile(pathGuardrailMatches),
  },
  matches: {
    blockedTables: blockedTableMatches,
    forbiddenRuntimeTerms: forbiddenRuntimeMatches,
    secrets: secretMatches,
    signedUrlPersistence: signedUrlPersistenceMatches,
    publicSourceMedia: publicSourceMediaMatches,
    pathGuardrails: pathGuardrailMatches,
  },
  recommendation:
    criticalFindings.length === 0
      ? 'No critical storage/upload scope findings detected. Review noncritical runtime/path matches for expected local-only or metadata-only usage.'
      : 'Critical storage/upload scope findings detected. Review before enabling production storage/upload runtime.',
}

console.log(JSON.stringify(result, null, 2))

if (criticalFindings.length > 0) {
  process.exitCode = 1
}
