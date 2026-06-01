import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const implementationFiles = [
  'server/routes/approval-routes.ts',
  'server/services/approved-snapshot-service.ts',
  'server/services/project-service.ts',
  'server/validation/approved-snapshot-schemas.ts',
  'server/validation/approval-schemas.ts',
  'src/backend/api/routes/approved-snapshot-api-routes.ts',
  'src/backend/api/api-route-registry.ts',
  'src/backend/api/index.ts',
]

const allowedCanonicalTables = [
  'approval_records',
  'approved_plan_snapshots',
  'edit_plan_versions',
  'credit_estimates',
  'credit_reservations',
  'projects',
  'workspaces',
  'workspace_members',
]

const forbiddenFromTablePatterns = [
  /\.from\(['"`]credit_approvals['"`]\)/,
  /\.from\(['"`]edit_plans['"`]\)/,
  /\.from\(['"`]credit_ledger_entries['"`]\)/,
  /\.from\(['"`]editing_jobs['"`]\)/,
  /\.from\(['"`]job_steps['"`]\)/,
  /\.from\(['"`]worker_events['"`]\)/,
  /\.from\(['"`]worker_leases['"`]\)/,
  /\.from\(['"`]generation_requests['"`]\)/,
  /\.from\(['"`]generation_events['"`]\)/,
  /\.from\(['"`]generated_assets['"`]\)/,
  /\.from\(['"`]provider_requests['"`]\)/,
  /\.from\(['"`]provider_attempts['"`]\)/,
  /\.from\(['"`]render_jobs['"`]\)/,
  /\.from\(['"`]renders['"`]\)/,
  /\.from\(['"`]final_exports['"`]\)/,
  /\.from\(['"`]qa_reports['"`]\)/,
  /\.from\(['"`]tool_runtime_checks['"`]\)/,
  /\.from\(['"`]storage_object_records['"`]\).*\.insert/s,
]

const forbiddenRuntimePatterns = [
  /can_create_approved_plan_snapshot/,
  /createJob/i,
  /claimWorker/i,
  /providerGateway/i,
  /createRender/i,
  /reserveCredits/i,
  /spendCredits/i,
  /refundCredits/i,
  /createSignedUrl/i,
  /uploadObject/i,
  /executeTool/i,
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
]

function fileExists(relativePath) {
  return fs.existsSync(path.join(root, relativePath))
}

function readFile(relativePath) {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) return ''
  return fs.readFileSync(absolutePath, 'utf8')
}

function scanPatterns(files, patterns) {
  const matches = []

  for (const file of files) {
    const text = readFile(file)
    const lines = text.split('\n')
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

function scanAllowedTables(files) {
  return allowedCanonicalTables.reduce((summary, table) => {
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

const forbiddenTableMatches = scanPatterns(existingFiles, forbiddenFromTablePatterns)
const forbiddenRuntimeMatches = scanPatterns(existingFiles, forbiddenRuntimePatterns)
const secretMatches = scanPatterns(existingFiles, secretPatterns)
const criticalFindings = [
  ...forbiddenTableMatches,
  ...secretMatches,
]
const warningFindings = forbiddenRuntimeMatches.filter((match) => !/can_create_approved_plan_snapshot/.test(match.excerpt))
const legacyHelperFindings = forbiddenRuntimeMatches.filter((match) => /can_create_approved_plan_snapshot/.test(match.excerpt))

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
  allowedCanonicalTableCoverage: scanAllowedTables(existingFiles),
  summary: {
    filesScanned: existingFiles.length,
    missingFiles: files.filter((file) => !file.exists).map((file) => file.path),
    forbiddenTableMatchCount: forbiddenTableMatches.length,
    legacyHelperMatchCount: legacyHelperFindings.length,
    forbiddenRuntimeWarningCount: warningFindings.length,
    secretMatchCount: secretMatches.length,
    criticalFindingCount: criticalFindings.length + legacyHelperFindings.length,
  },
  byFile: {
    forbiddenTables: summarizeByFile(forbiddenTableMatches),
    legacyHelpers: summarizeByFile(legacyHelperFindings),
    runtimeWarnings: summarizeByFile(warningFindings),
    secrets: summarizeByFile(secretMatches),
  },
  matches: {
    forbiddenTables: forbiddenTableMatches,
    legacyHelpers: legacyHelperFindings,
    runtimeWarnings: warningFindings,
    secrets: secretMatches,
  },
  recommendation:
    criticalFindings.length === 0 && legacyHelperFindings.length === 0
      ? 'No critical approved snapshot scope findings detected. Review runtime warnings for expected fail-closed wording only.'
      : 'Critical approved snapshot scope findings detected. Remove legacy helper/table use or secrets before enabling this boundary.',
}

console.log(JSON.stringify(result, null, 2))

if (criticalFindings.length > 0 || legacyHelperFindings.length > 0) {
  process.exitCode = 1
}
