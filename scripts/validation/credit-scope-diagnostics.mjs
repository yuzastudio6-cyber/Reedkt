import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const implementationFiles = [
  'server/routes/credit-routes.ts',
  'server/services/credit-service.ts',
  'server/services/credit-gate-service.ts',
  'server/validation/credit-schemas.ts',
  'src/backend/api/routes/credit-api-routes.ts',
  'src/backend/api/api-route-registry.ts',
  'src/backend/api/index.ts',
]

const canonicalTables = [
  'credit_estimates',
  'credit_estimate_items',
  'approval_records',
  'approved_plan_snapshots',
  'credit_reservations',
  'credit_ledger_entries',
  'refund_records',
  'projects',
  'workspaces',
  'workspace_members',
]

const legacyTablePatterns = [
  /\.from\(['"`]credit_approvals['"`]\)/,
  /\.from\(['"`]credit_wallets['"`]\)/,
  /\.from\(['"`]credit_grants['"`]\)/,
  /\.from\(['"`]credit_wallet_balance_view['"`]\)/,
  /\.from\(['"`]credit_estimate_line_items['"`]\)/,
  /\.from\(['"`]credit_reservation_line_items['"`]\)/,
  /\.from\(['"`]credit_refunds['"`]\)/,
]

const blockedTablePatterns = [
  /\.from\(['"`]editing_jobs['"`]\)/,
  /\.from\(['"`]job_steps['"`]\)/,
  /\.from\(['"`]worker_events['"`]\)/,
  /\.from\(['"`]worker_leases['"`]\)/,
  /\.from\(['"`]generation_requests['"`]\)/,
  /\.from\(['"`]generation_events['"`]\)/,
  /\.from\(['"`]generated_assets['"`]\)/,
  /\.from\(['"`]provider_attempts['"`]\)/,
  /\.from\(['"`]render_jobs['"`]\)/,
  /\.from\(['"`]renders['"`]\)/,
  /\.from\(['"`]final_exports['"`]\)/,
  /\.from\(['"`]tool_runtime_checks['"`]\)/,
  /\.from\(['"`]storage_object_records['"`]\)/,
  /\.from\(['"`]upload_intents['"`]\)/,
]

const mutationPatterns = [
  /\.from\(['"`](credit_estimates|credit_estimate_items|approval_records|approved_plan_snapshots|credit_reservations|credit_ledger_entries|refund_records)['"`]\)[\s\S]{0,500}\.insert\(/,
  /\.from\(['"`](credit_estimates|credit_estimate_items|approval_records|approved_plan_snapshots|credit_reservations|credit_ledger_entries|refund_records)['"`]\)[\s\S]{0,500}\.update\(/,
  /\.from\(['"`](credit_estimates|credit_estimate_items|approval_records|approved_plan_snapshots|credit_reservations|credit_ledger_entries|refund_records)['"`]\)[\s\S]{0,500}\.delete\(/,
]

const forbiddenRuntimePatterns = [
  /checkout\.sessions/i,
  /stripe\.checkout/i,
  /webhook/i,
  /createJob/i,
  /claimWorker/i,
  /providerGateway/i,
  /callProvider/i,
  /createRender/i,
  /executeTool/i,
  /createSignedUrl/i,
  /uploadObject/i,
  /startGeneration/i,
  /startRender/i,
]

const secretPatterns = [
  /SUPABASE_SERVICE_ROLE_KEY/,
  /service_role_key/i,
  /provider_api_key/i,
  /stripe_secret_key/i,
  /private_key/i,
  /client_secret/i,
  /access_token/i,
  /refresh_token/i,
  /signed_url/i,
  /signedUrl\s*:/,
]

function fileExists(relativePath) {
  return fs.existsSync(path.join(root, relativePath))
}

function readFile(relativePath) {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) return ''
  return fs.readFileSync(absolutePath, 'utf8')
}

function scanLinePatterns(files, patterns) {
  const matches = []

  for (const file of files) {
    const lines = readFile(file).split('\n')
    for (const pattern of patterns) {
      lines.forEach((line, index) => {
        if (pattern.test(line)) {
          matches.push({
            file,
            line: index + 1,
            pattern: String(pattern),
            excerpt: line.trim().slice(0, 180),
          })
        }
      })
    }
  }

  return matches
}

function scanFilePatterns(files, patterns) {
  const matches = []

  for (const file of files) {
    const text = readFile(file)
    for (const pattern of patterns) {
      const match = pattern.exec(text)
      if (match) {
        const prefix = text.slice(0, match.index)
        matches.push({
          file,
          line: prefix.split('\n').length,
          pattern: String(pattern),
          excerpt: match[0].replace(/\s+/g, ' ').slice(0, 220),
        })
      }
    }
  }

  return matches
}

function scanCanonicalTables(files) {
  return canonicalTables.reduce((summary, table) => {
    const pattern = new RegExp(`\\b${table}\\b`)
    summary[table] = files.some((file) => pattern.test(readFile(file)))
    return summary
  }, {})
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

const legacyTableMatches = scanLinePatterns(existingFiles, legacyTablePatterns)
const blockedTableMatches = scanLinePatterns(existingFiles, blockedTablePatterns)
const mutationMatches = scanFilePatterns(existingFiles, mutationPatterns)
const runtimeMatches = scanLinePatterns(existingFiles, forbiddenRuntimePatterns)
const secretMatches = scanLinePatterns(existingFiles, secretPatterns)
const criticalFindings = [
  ...legacyTableMatches,
  ...blockedTableMatches,
  ...mutationMatches,
  ...secretMatches,
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
    mutatesCredits: false,
    createsJobs: false,
    callsProviders: false,
    rendersMedia: false,
    executesTools: false,
    deploys: false,
  },
  files,
  canonicalTableCoverage: scanCanonicalTables(existingFiles),
  summary: {
    filesScanned: existingFiles.length,
    missingFiles: files.filter((file) => !file.exists).map((file) => file.path),
    legacyTableMatchCount: legacyTableMatches.length,
    blockedTableMatchCount: blockedTableMatches.length,
    canonicalMutationMatchCount: mutationMatches.length,
    forbiddenRuntimeWarningCount: runtimeMatches.length,
    secretMatchCount: secretMatches.length,
    criticalFindingCount: criticalFindings.length,
  },
  byFile: {
    legacyTables: summarizeByFile(legacyTableMatches),
    blockedTables: summarizeByFile(blockedTableMatches),
    canonicalMutations: summarizeByFile(mutationMatches),
    runtimeWarnings: summarizeByFile(runtimeMatches),
    secrets: summarizeByFile(secretMatches),
  },
  matches: {
    legacyTables: legacyTableMatches,
    blockedTables: blockedTableMatches,
    canonicalMutations: mutationMatches,
    runtimeWarnings: runtimeMatches,
    secrets: secretMatches,
  },
  recommendation:
    criticalFindings.length === 0
      ? 'No critical Prompt 6 credit scope findings detected. Review runtime warnings for expected fail-closed wording only.'
      : 'Critical Prompt 6 credit scope findings detected. Remove legacy table targeting, direct credit mutation, blocked-domain table use, or secret-like values before proceeding.',
}

console.log(JSON.stringify(result, null, 2))

if (criticalFindings.length > 0) {
  process.exitCode = 1
}
