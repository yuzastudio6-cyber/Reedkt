import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const implementationFiles = [
  'server/routes/compliance-routes.ts',
  'server/services/compliance-service.ts',
  'server/validation/compliance-schemas.ts',
  'src/backend/api/routes/compliance-api-routes.ts',
  'src/backend/api/api-runtime-contracts.ts',
  'src/backend/api/api-route-registry.ts',
  'src/backend/api/index.ts',
  'server/app.ts',
  'scripts/validation/run-foundation-validation.mjs',
  'package.json',
]

const requiredDocs = [
  'docs/compliance-license-security-review-foundation.md',
  'docs/compliance-review-contract.md',
  'docs/compliance-route-contract.md',
  'docs/compliance-gate-contract.md',
  'docs/dependency-security-review-runbook.md',
  'docs/tool-provider-compliance-matrix.md',
  'docs/prompt-16-validation-results.md',
  'database/test-sql/018_compliance_license_security_review_rls_smoke_tests.draft.sql',
]

const requiredRouteIds = [
  'compliance.readiness.check',
  'compliance.subjects.list',
  'compliance.subject.get',
  'compliance.review.preview',
  'compliance.review.createBoundary',
  'compliance.review.get',
  'compliance.review.listForSubject',
  'compliance.blockers.list',
  'compliance.license.readiness',
  'compliance.security.readiness',
  'compliance.dependency.readiness',
  'compliance.runtimeApproval.readiness',
  'compliance.productionUnlock.blocked',
  'compliance.auditSummary.get',
]

const forbiddenRuntimePatterns = [
  /\.from\(['"`](compliance_review_records|tool_license_compliance|dependency_review_records|package_review_records|license_review_records|security_review_records|runtime_approval_records|model_provenance_review_records|compliance_audit_events)['"`]\)\s*\n?\s*\.(insert|update|upsert|delete)/i,
  /\.rpc\(['"`](approve_compliance|approve_production|unlock_production|install_package|run_audit_fix|execute_tool|call_provider|claim_worker_job|start_render)['"`]/i,
  /canApproveProduction:\s*true/i,
  /canEnableRuntime:\s*true/i,
  /productionApproved:\s*true/i,
  /productionAllowed:\s*true/i,
  /externalBetaAllowed:\s*true/i,
  /broadRealMediaAllowed:\s*true/i,
  /aiLegalApprovalProvided:\s*true/i,
  /\bnpm\s+(install|i|add)\b/i,
  /\bnpm\s+audit\s+fix\b/i,
  /\byarn\s+add\b|\bpnpm\s+add\b/i,
  /\bfetch\s*\(/,
  /\baxios\./,
  /https\.request\s*\(/,
  /SecretManagerServiceClient|accessSecretVersion|secretmanager/i,
  /process\.env\.[A-Z0-9_]*(OPENAI|WAN|HAILUO|VEO|LYRIA|MIRELO|MMAUDIO|PROVIDER|API_KEY|SECRET|STRIPE|SUPABASE)[A-Z0-9_]*/i,
  /SUPABASE_SERVICE_ROLE_KEY|service_role_key|provider_api_key|STRIPE_SECRET_KEY|stripe_secret_key/i,
  /signed_url\s*[:=]|signedUrl\s*:/i,
  /callProvider\s*\(|executeProvider\s*\(|executeTool\s*\(|runWorker\s*\(|startRender\s*\(|processMedia\s*\(/i,
  /CloudRun[A-Z]|runCloudRun|CloudRunClient|new PubSub|PubSubClient|CloudTasksClient|new CloudTasks/i,
]

function filePath(relativePath) {
  return path.join(root, relativePath)
}

function fileExists(relativePath) {
  return fs.existsSync(filePath(relativePath))
}

function readFile(relativePath) {
  if (!fileExists(relativePath)) return ''
  return fs.readFileSync(filePath(relativePath), 'utf8')
}

function scanFilePatterns(files, patterns) {
  const matches = []
  for (const file of files) {
    const text = readFile(file)
    for (const pattern of patterns) {
      const match = pattern.exec(text)
      if (match) {
        matches.push({
          file,
          line: text.slice(0, match.index).split('\n').length,
          pattern: String(pattern),
          excerpt: match[0].replace(/\s+/g, ' ').slice(0, 220),
        })
      }
    }
  }
  return matches
}

function collectPostRouteIdempotencyFindings(file) {
  const findings = []
  const lines = readFile(file).split('\n')
  lines.forEach((line, index) => {
    const routeMatch = line.match(/router\.post\(['"`]([^'"`]+)['"`](.*)/)
    if (!routeMatch) return
    if (!line.includes('requireIdempotency')) {
      findings.push({
        file,
        line: index + 1,
        pattern: 'compliancePostRequiresIdempotency',
        excerpt: line.trim().slice(0, 220),
      })
    }
  })
  return findings
}

const existingFiles = implementationFiles.filter(fileExists)
const missingDocs = requiredDocs.filter((file) => !fileExists(file))
const forbiddenRuntimeMatches = scanFilePatterns(existingFiles, forbiddenRuntimePatterns)
const idempotencyFindings = collectPostRouteIdempotencyFindings('server/routes/compliance-routes.ts')

const routeText = readFile('server/routes/compliance-routes.ts')
const serviceText = readFile('server/services/compliance-service.ts')
const schemaText = readFile('server/validation/compliance-schemas.ts')
const apiRouteText = readFile('src/backend/api/routes/compliance-api-routes.ts')
const registryText = readFile('src/backend/api/api-route-registry.ts')
const contractsText = readFile('src/backend/api/api-runtime-contracts.ts')
const appText = readFile('server/app.ts')
const runnerText = readFile('scripts/validation/run-foundation-validation.mjs')
const packageText = readFile('package.json')
const matrixText = readFile('docs/tool-provider-compliance-matrix.md')

const behaviorChecks = {
  routeRegisteredInServerApp: /createComplianceRoutes/.test(appText),
  apiDomainRegistered: /\|\s*'compliance'/.test(contractsText) && /compliance:\s*0/.test(registryText),
  routeMetadataRegistered: requiredRouteIds.every((routeId) => apiRouteText.includes(routeId)),
  metadataHasForbiddenSideEffects: /COMPLIANCE_FORBIDDEN_SIDE_EFFECTS/.test(apiRouteText),
  routeUsesComplianceService: /createComplianceService/.test(routeText),
  routePostsRequireIdempotency: idempotencyFindings.length === 0,
  serviceBlocksProductionApproval: /canApproveProduction:\s*false/.test(serviceText) && /canEnableRuntime:\s*false/.test(serviceText),
  serviceHasNoComplianceWrites: !/\.from\(['"`](compliance_review_records|tool_license_compliance|dependency_review_records|security_review_records)['"`]\)\s*\n?\s*\.(insert|update|upsert|delete)/i.test(serviceText),
  serviceBuildsStaticInventory: /listToolReadiness/.test(serviceText) && /packageInventory/.test(serviceText),
  schemaValidatesUnsafeEvidence: /unsafeKeyPattern/.test(schemaText) && /safeMetadataSchema/.test(schemaText),
  matrixCoversRequestedProviders: ['OpenAI provider', 'Wan provider', 'Hailuo provider', 'Veo provider', 'Lyria provider', 'Mirelo provider', 'MMAudio provider'].every((name) => matrixText.includes(name)),
  packageScriptRegistered: /"compliance:diagnostics"/.test(packageText),
  diagnosticsInFoundationRunner: /compliance:diagnostics/.test(runnerText),
}

const behaviorFailures = Object.entries(behaviorChecks)
  .filter(([, ok]) => !ok)
  .map(([check]) => ({
    file: 'scripts/validation/compliance-scope-diagnostics.mjs',
    line: 1,
    pattern: check,
    excerpt: `Behavior check failed: ${check}`,
  }))

const missingDocFindings = missingDocs.map((file) => ({
  file,
  line: 1,
  pattern: 'requiredPrompt16Doc',
  excerpt: 'Required Prompt 16 document or draft SQL file is missing.',
}))

const criticalFindings = [
  ...forbiddenRuntimeMatches,
  ...idempotencyFindings,
  ...behaviorFailures,
  ...missingDocFindings,
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
    callsProviders: false,
    rendersMedia: false,
    executesTools: false,
    installsPackages: false,
    mutatesDependencies: false,
    executesWorkers: false,
    processesMedia: false,
    mutatesCredits: false,
    transfersStorage: false,
    createsSignedUrls: false,
    deploys: false,
    mutatesSourceFiles: false,
  },
  files: {
    implementationFiles: implementationFiles.map((file) => ({ path: file, exists: fileExists(file) })),
    requiredDocs: requiredDocs.map((file) => ({ path: file, exists: fileExists(file) })),
  },
  behaviorChecks,
  findings: {
    forbiddenRuntimeMatches,
    idempotencyFindings,
    behaviorFailures,
    missingDocFindings,
    criticalFindings,
  },
  summary: {
    filesScanned: existingFiles.length,
    missingDocCount: missingDocs.length,
    forbiddenRuntimeMatchCount: forbiddenRuntimeMatches.length,
    idempotencyFindingCount: idempotencyFindings.length,
    behaviorFailureCount: behaviorFailures.length,
    criticalFindingCount: criticalFindings.length,
  },
  recommendation: criticalFindings.length === 0
    ? 'Compliance/license/security review foundation passed static scope diagnostics.'
    : 'Fix Prompt 16 compliance scope findings before proceeding.',
}

console.log(JSON.stringify(result, null, 2))
if (criticalFindings.length > 0) process.exitCode = 1
