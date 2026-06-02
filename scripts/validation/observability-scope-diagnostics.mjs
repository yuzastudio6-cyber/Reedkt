import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const implementationFiles = [
  'server/routes/observability-routes.ts',
  'server/services/observability-service.ts',
  'server/validation/observability-schemas.ts',
  'src/backend/api/routes/observability-api-routes.ts',
  'src/backend/api/api-runtime-contracts.ts',
  'src/backend/api/api-route-registry.ts',
  'src/backend/api/index.ts',
  'server/app.ts',
  'scripts/validation/run-foundation-validation.mjs',
  'package.json',
]

const requiredDocs = [
  'docs/observability-audit-abuse-cost-foundation.md',
  'docs/audit-event-contract.md',
  'docs/rate-limit-abuse-cost-control-contract.md',
  'docs/observability-route-contract.md',
  'docs/observability-gate-contract.md',
  'docs/operational-runbook-foundation.md',
  'docs/prompt-17-validation-results.md',
  'database/test-sql/019_observability_audit_abuse_cost_rls_smoke_tests.draft.sql',
]

const requiredRouteIds = [
  'observability.readiness.check',
  'observability.runtime.status',
  'observability.requestTrace.get',
  'observability.routeRisk.summary',
  'audit.event.preview',
  'audit.event.createBoundary',
  'audit.event.listForProject',
  'audit.event.listForWorkspace',
  'audit.summary.get',
  'rateLimit.readiness.check',
  'rateLimit.policy.preview',
  'rateLimit.checkBoundary',
  'abuse.readiness.check',
  'abuse.policy.preview',
  'abuse.checkBoundary',
  'costControl.readiness.check',
  'costControl.policy.preview',
  'costControl.usageSummary.preview',
  'costControl.executionBlocked',
  'operationalAlert.readiness.check',
  'operationalAlert.preview',
]

const staticImplementedRouteIds = [
  'observability.runtime.status',
  'observability.routeRisk.summary',
]

const forbiddenRuntimePatterns = [
  /\.from\(['"`](audit_events|rate_limit_events|abuse_prevention_events|usage_metering_records|cost_control_records|operational_alert_records|runtime_health_snapshots|audit_event_summaries)['"`]\)\s*\n?\s*\.(insert|update|upsert|delete)/i,
  /\.rpc\(['"`](create_audit_event|enforce_rate_limit|block_abuse|apply_cost_control|send_operational_alert|unlock_production|admin_override)['"`]/i,
  /canSendExternalTelemetry:\s*true/i,
  /canCreateAuditEvent:\s*true/i,
  /canEnforceRateLimit:\s*true/i,
  /canBlockAbuse:\s*true/i,
  /canApplyCostControl:\s*true/i,
  /productionUnlockEnabled:\s*true/i,
  /externalTelemetryEnabled:\s*true/i,
  /billingEnabled:\s*true/i,
  /enforcementEnabled:\s*true/i,
  /\bfetch\s*\(/,
  /\baxios\./,
  /https\.request\s*\(/,
  /new\s+StatsD|Datadog|Sentry|Honeycomb|OpenTelemetry|otel|prom-client|Prometheus/i,
  /SecretManagerServiceClient|accessSecretVersion|secretmanager/i,
  /process\.env\.[A-Z0-9_]*(OPENAI|WAN|HAILUO|VEO|LYRIA|MIRELO|MMAUDIO|PROVIDER|API_KEY|SECRET|STRIPE|SUPABASE)[A-Z0-9_]*/i,
  /SUPABASE_SERVICE_ROLE_KEY|service_role_key|provider_api_key|STRIPE_SECRET_KEY|stripe_secret_key/i,
  /signed_url\s*[:=]|signedUrl\s*:/i,
  /callProvider\s*\(|executeProvider\s*\(|executeTool\s*\(|runWorker\s*\(|startRender\s*\(|processMedia\s*\(|createCheckoutSession\s*\(/i,
  /CloudRun[A-Z]|runCloudRun|CloudRunClient|new PubSub|PubSubClient|CloudTasksClient|new CloudTasks/i,
  /\bnpm\s+(install|i|add)\b/i,
  /\bnpm\s+audit\s+fix\b/i,
  /\byarn\s+add\b|\bpnpm\s+add\b/i,
  /adminOverrideEnabled:\s*true|productionApproved:\s*true|externalBetaAllowed:\s*true|broadRealMediaAllowed:\s*true/i,
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
        pattern: 'observabilityPostRequiresIdempotency',
        excerpt: line.trim().slice(0, 220),
      })
    }
  })
  return findings
}

function collectImplementedRouteFindings(apiRouteText) {
  const findings = []
  const routeBlocks = [...apiRouteText.matchAll(/observabilityRoute\(\{([\s\S]*?)\n  \}\)/g)]
  for (const match of routeBlocks) {
    const block = match[1]
    if (!/productionReadiness:\s*['"`]implemented['"`]/.test(block)) continue
    const idMatch = block.match(/id:\s*['"`]([^'"`]+)['"`]/)
    const routeId = idMatch?.[1] ?? 'unknown'
    if (!staticImplementedRouteIds.includes(routeId)) {
      findings.push({
        file: 'src/backend/api/routes/observability-api-routes.ts',
        line: apiRouteText.slice(0, match.index ?? 0).split('\n').length,
        pattern: 'implementedRouteMustBeStaticOnly',
        excerpt: `Route ${routeId} is marked implemented without being an allowed static summary route.`,
      })
    }
  }
  return findings
}

const existingFiles = implementationFiles.filter(fileExists)
const missingDocs = requiredDocs.filter((file) => !fileExists(file))
const forbiddenRuntimeMatches = scanFilePatterns(existingFiles, forbiddenRuntimePatterns)
const idempotencyFindings = collectPostRouteIdempotencyFindings('server/routes/observability-routes.ts')

const routeText = readFile('server/routes/observability-routes.ts')
const serviceText = readFile('server/services/observability-service.ts')
const schemaText = readFile('server/validation/observability-schemas.ts')
const apiRouteText = readFile('src/backend/api/routes/observability-api-routes.ts')
const registryText = readFile('src/backend/api/api-route-registry.ts')
const contractsText = readFile('src/backend/api/api-runtime-contracts.ts')
const appText = readFile('server/app.ts')
const runnerText = readFile('scripts/validation/run-foundation-validation.mjs')
const packageText = readFile('package.json')

const routeReadinessFindings = collectImplementedRouteFindings(apiRouteText)

const behaviorChecks = {
  routeRegisteredInServerApp: /createObservabilityRoutes/.test(appText),
  apiDomainRegistered: /\|\s*'observability'/.test(contractsText) && /observability:\s*0/.test(registryText),
  routeMetadataRegistered: requiredRouteIds.every((routeId) => apiRouteText.includes(routeId)),
  metadataHasForbiddenSideEffects: /OBSERVABILITY_FORBIDDEN_SIDE_EFFECTS/.test(apiRouteText),
  routeUsesObservabilityService: /createObservabilityService/.test(routeText),
  routePostsRequireIdempotency: idempotencyFindings.length === 0,
  serviceBlocksTelemetryAndEnforcement: /canSendExternalTelemetry:\s*false/.test(serviceText) && /canEnforceRateLimit:\s*false/.test(serviceText),
  serviceHasNoOperationalWrites: !/\.from\(['"`](audit_events|rate_limit_events|abuse_prevention_events|usage_metering_records|cost_control_records|operational_alert_records)['"`]\)\s*\n?\s*\.(insert|update|upsert|delete)/i.test(serviceText),
  serviceBuildsStaticRouteRisk: /createApiRouteMapSummary/.test(serviceText) && /REEDITPRO_API_ROUTES/.test(serviceText),
  schemaValidatesUnsafeMetadata: /unsafeKeyPattern/.test(schemaText) && /safeMetadataSchema/.test(schemaText),
  packageScriptRegistered: /"observability:diagnostics"/.test(packageText),
  diagnosticsInFoundationRunner: /observability:diagnostics/.test(runnerText),
}

const behaviorFailures = Object.entries(behaviorChecks)
  .filter(([, ok]) => !ok)
  .map(([check]) => ({
    file: 'scripts/validation/observability-scope-diagnostics.mjs',
    line: 1,
    pattern: check,
    excerpt: `Behavior check failed: ${check}`,
  }))

const missingDocFindings = missingDocs.map((file) => ({
  file,
  line: 1,
  pattern: 'requiredPrompt17Doc',
  excerpt: 'Required Prompt 17 document or draft SQL file is missing.',
}))

const criticalFindings = [
  ...forbiddenRuntimeMatches,
  ...idempotencyFindings,
  ...routeReadinessFindings,
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
    sendsTelemetry: false,
    deploys: false,
    executesWorkers: false,
    processesMedia: false,
    mutatesCredits: false,
    transfersStorage: false,
    createsSignedUrls: false,
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
    routeReadinessFindings,
    behaviorFailures,
    missingDocFindings,
    criticalFindings,
  },
  summary: {
    filesScanned: existingFiles.length,
    missingDocCount: missingDocs.length,
    forbiddenRuntimeMatchCount: forbiddenRuntimeMatches.length,
    idempotencyFindingCount: idempotencyFindings.length,
    routeReadinessFindingCount: routeReadinessFindings.length,
    behaviorFailureCount: behaviorFailures.length,
    criticalFindingCount: criticalFindings.length,
  },
  recommendation: criticalFindings.length === 0
    ? 'Observability/audit/abuse/cost-control foundation passed static scope diagnostics.'
    : 'Fix Prompt 17 observability scope findings before proceeding.',
}

console.log(JSON.stringify(result, null, 2))
if (criticalFindings.length > 0) process.exitCode = 1
