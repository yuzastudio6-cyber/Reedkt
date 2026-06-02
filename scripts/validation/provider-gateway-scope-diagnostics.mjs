import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const implementationFiles = [
  'server/routes/provider-gateway-routes.ts',
  'server/services/provider-gateway-service.ts',
  'server/validation/provider-gateway-schemas.ts',
  'src/backend/api/routes/provider-api-routes.ts',
  'src/backend/api/api-route-registry.ts',
  'scripts/validation/run-foundation-validation.mjs',
  'package.json',
]

const requiredRouteIds = [
  'providers.readiness.check',
  'providers.catalog.list',
  'providers.catalog.get',
  'providers.models.list',
  'providers.model.get',
  'providers.secretReference.check',
  'providers.route.preview',
  'providers.requestEnvelope.validate',
  'providers.requestAttempt.readiness',
  'providers.requestAttempt.createBoundary',
  'providers.requestAttempt.get',
  'providers.requestAttempt.listForProject',
  'providers.webhook.readiness',
  'providers.webhook.receiveBoundary',
  'providers.webhook.summary.get',
  'providers.output.readiness',
  'providers.execution.blocked',
  'providers.blockers',
]

const forbiddenRuntimePatterns = [
  /\.from\(['"`](provider_request_attempts|provider_webhook_events|generation_requests|generated_assets|jobs|worker_job_claims|render_jobs|tool_call_executions)['"`]\)\s*\n?\s*\.(insert|update|upsert|delete)/i,
  /\.rpc\(['"`](create_provider_attempt|process_provider_webhook|call_provider|start_generation|start_render|execute_tool|claim_worker_job)['"`]/i,
  /\bfetch\s*\(/,
  /\baxios\./,
  /https\.request\s*\(/,
  /new\s+(OpenAI|Anthropic|GoogleGenerativeAI|Mirelo|Lyria|MMAudio|Veo|Wan|Hailuo)\b/,
  /callProvider\s*\(/i,
  /executeProvider\s*\(/i,
  /sendProviderRequest\s*\(/i,
  /processProviderWebhook\s*\(/i,
  /SecretManagerServiceClient|accessSecretVersion|secretmanager/i,
  /process\.env\.[A-Z0-9_]*(OPENAI|WAN|HAILUO|VEO|LYRIA|MIRELO|MMAUDIO|PROVIDER|API_KEY|SECRET)[A-Z0-9_]*/i,
  /SUPABASE_SERVICE_ROLE_KEY/,
  /service_role_key/i,
  /provider_api_key/i,
  /signed_url\s*[:=]/i,
  /signedUrl\s*:/,
  /stripe\.(checkout|webhooks)|checkout\.sessions|STRIPE_SECRET_KEY|stripe_secret_key/i,
  /CloudRun[A-Z]|runCloudRun|CloudRunClient/i,
  /PubSub\(|new PubSub|PubSubClient/i,
  /CloudTasksClient|new CloudTasks/i,
  /productionAllowed:\s*true/,
  /externalBetaAllowed:\s*true/,
  /broadRealMediaAllowed:\s*true/,
]

const allowedPostWithoutIdempotency = new Set([])

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
  const lines = readFile(file).split('\n')
  const findings = []

  lines.forEach((line, index) => {
    const routeMatch = line.match(/router\.post\(['"`]([^'"`]+)['"`](.*)/)
    if (!routeMatch) return
    const routePath = routeMatch[1]
    if (allowedPostWithoutIdempotency.has(routePath)) return
    if (!line.includes('requireIdempotency')) {
      findings.push({
        file,
        line: index + 1,
        pattern: 'providerMutationRouteRequiresIdempotency',
        excerpt: line.trim().slice(0, 220),
      })
    }
  })

  return findings
}

function collectProviderReadinessFindings(file) {
  const text = readFile(file)
  const findings = []
  const routeBlocks = text.split(/providerRoute\(\{/).slice(1)

  routeBlocks.forEach((block) => {
    const idMatch = block.match(/id:\s*['"`]([^'"`]+)['"`]/)
    if (!idMatch) return
    const routeId = idMatch[1]
    const executionSensitive = /^providers\.(secretReference|requestEnvelope|requestAttempt|webhook|output|execution|blockers|route\.preview)/.test(routeId)
    if (!executionSensitive) return
    if (/productionReadiness:\s*['"`]implemented['"`]/.test(block) || /status:\s*['"`]mock_ready['"`]/.test(block)) {
      findings.push({
        file,
        line: text.slice(0, text.indexOf(idMatch[0])).split('\n').length,
        pattern: 'providerExecutionRouteMustNotBeImplemented',
        excerpt: `${routeId} is marked implemented/mock_ready without provider transport runtime.`,
      })
    }
  })

  return findings
}

const existingFiles = implementationFiles.filter(fileExists)
const forbiddenRuntimeMatches = scanFilePatterns(existingFiles, forbiddenRuntimePatterns)
const idempotencyFindings = collectPostRouteIdempotencyFindings('server/routes/provider-gateway-routes.ts')
const routeReadinessFindings = collectProviderReadinessFindings('src/backend/api/routes/provider-api-routes.ts')

const routeText = readFile('server/routes/provider-gateway-routes.ts')
const serviceText = readFile('server/services/provider-gateway-service.ts')
const schemaText = readFile('server/validation/provider-gateway-schemas.ts')
const apiRouteText = readFile('src/backend/api/routes/provider-api-routes.ts')
const runnerText = readFile('scripts/validation/run-foundation-validation.mjs')
const packageText = readFile('package.json')

const behaviorChecks = {
  routeUsesProviderGatewayService: /createProviderGatewayService/.test(routeText),
  routePostsRequireIdempotency: idempotencyFindings.length === 0,
  serviceBlocksProviderCalls: /canCallProvider:\s*false/.test(serviceText) && /ProviderExecutionBlockedGate/.test(serviceText),
  serviceHasNoProviderWrites: !/\.from\(['"`](provider_request_attempts|provider_webhook_events)['"`]\)\s*\n?\s*\.(insert|update|upsert|delete)/i.test(serviceText),
  serviceHasSecretReferenceBoundary: /secretValueRead:\s*false/.test(serviceText) && /frontendVisible:\s*false/.test(serviceText),
  schemaValidatesUnsafeMetadata: /unsafeKeyPattern/.test(schemaText) && /safeMetadataSchema/.test(schemaText),
  routeMetadataRegistered: requiredRouteIds.every((routeId) => apiRouteText.includes(routeId)),
  packageScriptRegistered: /"provider:gateway:diagnostics"/.test(packageText),
  diagnosticsInFoundationRunner: /provider:gateway:diagnostics/.test(runnerText),
}

const behaviorFailures = Object.entries(behaviorChecks)
  .filter(([, ok]) => !ok)
  .map(([check]) => ({
    file: 'scripts/validation/provider-gateway-scope-diagnostics.mjs',
    line: 1,
    pattern: check,
    excerpt: `Behavior check failed: ${check}`,
  }))

const criticalFindings = [
  ...forbiddenRuntimeMatches,
  ...idempotencyFindings,
  ...routeReadinessFindings,
  ...behaviorFailures,
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
    installsProviderSdks: false,
    accessesSecretManager: false,
    processesWebhooks: false,
    createsProviderRequests: false,
    createsGeneratedAssets: false,
    rendersMedia: false,
    executesTools: false,
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
  },
  behaviorChecks,
  findings: {
    forbiddenRuntimeMatches,
    idempotencyFindings,
    routeReadinessFindings,
    behaviorFailures,
    criticalFindings,
  },
  summary: {
    filesScanned: existingFiles.length,
    forbiddenRuntimeMatchCount: forbiddenRuntimeMatches.length,
    idempotencyFindingCount: idempotencyFindings.length,
    routeReadinessFindingCount: routeReadinessFindings.length,
    behaviorFailureCount: behaviorFailures.length,
    criticalFindingCount: criticalFindings.length,
  },
  recommendation: criticalFindings.length === 0
    ? 'Provider gateway foundation passed static scope diagnostics.'
    : 'Fix provider gateway scope findings before proceeding.',
}

console.log(JSON.stringify(result, null, 2))
if (criticalFindings.length > 0) process.exitCode = 1
