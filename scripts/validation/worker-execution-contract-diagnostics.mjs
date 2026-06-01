import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const implementationFiles = [
  'server/routes/worker-routes.ts',
  'server/services/worker-execution-contract-service.ts',
  'server/services/worker-claim-service.ts',
  'server/validation/worker-execution-schemas.ts',
  'server/validation/worker-schemas.ts',
  'src/backend/api/routes/worker-api-routes.ts',
  'src/backend/api/api-route-registry.ts',
  'scripts/validation/run-foundation-validation.mjs',
  'package.json',
]

const toolReadinessFiles = [
  'server/foundation/tool-readiness/tool-readiness-registry.ts',
  'server/foundation/tool-readiness/tool-readiness-policy.ts',
]

const forbiddenRuntimePatterns = [
  /\.from\(['"`](jobs|job_batches|job_dependencies|job_events|worker_leases|worker_job_claims|job_claim_attempts|backend_runtime_messages|tool_runtime_checks|tool_call_intents|tool_call_executions)['"`]\)\s*\n?\s*\.(insert|update|upsert|delete)/i,
  /\.rpc\(['"`](claim_worker_job|complete_worker_job|fail_worker_job|recover_stale_worker|execute_worker|execute_tool|start_tool_call|start_render|call_provider)['"`]/i,
  /runWorkerClaimRunner/,
  /runToolReadinessChecks/,
  /executeWorker\s*\(/i,
  /executeTool\s*\(/i,
  /callProvider\s*\(/i,
  /startRender\s*\(/i,
  /startGeneration\s*\(/i,
  /runMediaProbe\s*\(/i,
  /probeMediaFile\s*\(/i,
  /CloudRun[A-Z]|runCloudRun|CloudRunClient/i,
  /PubSub\(|new PubSub|PubSubClient/i,
  /CloudTasksClient|new CloudTasks/i,
  /stripe\.(checkout|webhooks)|checkout\.sessions|STRIPE_SECRET_KEY|stripe_secret_key/i,
  /SUPABASE_SERVICE_ROLE_KEY/,
  /service_role_key/i,
  /provider_api_key/i,
  /signed_url\s*[:=]/i,
  /signedUrl\s*:/,
  /productionAllowed:\s*true/,
  /externalBetaAllowed:\s*true/,
  /broadRealMediaAllowed:\s*true/,
]

const legacyPrimaryTargetPatterns = [
  /\.from\(['"`](editing_jobs|job_steps|worker_events)['"`]\)/i,
]

const disabledToolRuntimePatterns = [
  /allowedInRuntime:\s*true/,
  /runtimeExecutionAllowed:\s*true/,
  /requiresFrontendExecution:\s*true/,
]

const workerContractRouteIds = [
  'workers.executionEnvelope.readiness',
  'workers.executionEnvelope.preview',
  'workers.claim.preflight',
  'workers.cancel.boundary',
  'workers.staleRecovery.preview',
  'workers.runtime.capabilities',
  'workers.runtime.toolRequirements',
  'workers.execution.blocked',
]

const allowedPostWithoutIdempotency = new Set([
  '/v1/jobs/readiness',
  '/v1/jobs/:jobId/claim/readiness',
])

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

function scanLines(files, patterns) {
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
            excerpt: line.trim().slice(0, 220),
          })
        }
      })
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
        pattern: 'mutationRouteRequiresIdempotency',
        excerpt: line.trim().slice(0, 220),
      })
    }
  })

  return findings
}

function collectWorkerRouteReadinessFindings(file) {
  const text = readFile(file)
  const findings = []
  const routeBlocks = text.split(/workerRoute\(\{/).slice(1)

  routeBlocks.forEach((block) => {
    const idMatch = block.match(/id:\s*['"`]([^'"`]+)['"`]/)
    if (!idMatch) return
    const routeId = idMatch[1]
    if (!/^workers\.(claim|heartbeat|lease|complete|fail|cancel|staleRecovery|execution)/.test(routeId)) return
    if (/productionReadiness:\s*['"`]implemented['"`]/.test(block) || /status:\s*['"`]mock_ready['"`]/.test(block)) {
      findings.push({
        file,
        line: text.slice(0, text.indexOf(idMatch[0])).split('\n').length,
        pattern: 'workerExecutionRouteMustNotBeImplemented',
        excerpt: `${routeId} is marked implemented/mock_ready without transactional runtime.`,
      })
    }
  })

  return findings
}

const existingFiles = implementationFiles.filter(fileExists)
const existingToolFiles = toolReadinessFiles.filter(fileExists)
const forbiddenRuntimeMatches = scanFilePatterns(existingFiles, forbiddenRuntimePatterns)
const legacyPrimaryTargetMatches = scanLines(existingFiles, legacyPrimaryTargetPatterns)
const disabledToolRuntimeMatches = scanFilePatterns(existingToolFiles, disabledToolRuntimePatterns)
const idempotencyFindings = collectPostRouteIdempotencyFindings('server/routes/worker-routes.ts')
const routeReadinessFindings = collectWorkerRouteReadinessFindings('src/backend/api/routes/worker-api-routes.ts')

const routeText = readFile('server/routes/worker-routes.ts')
const serviceText = readFile('server/services/worker-execution-contract-service.ts')
const schemaText = readFile('server/validation/worker-execution-schemas.ts')
const apiRouteText = readFile('src/backend/api/routes/worker-api-routes.ts')
const runnerText = readFile('scripts/validation/run-foundation-validation.mjs')
const packageText = readFile('package.json')

const behaviorChecks = {
  routeUsesContractService: /createWorkerExecutionContractService/.test(routeText),
  schemaValidatesUnsafeMetadata: /unsafeKeyPattern/.test(schemaText) && /safeMetadataSchema/.test(schemaText),
  serviceBuildsEnvelope: /envelopeSchemaVersion/.test(serviceText) && /canExecute:\s*false/.test(serviceText),
  serviceBlocksRuntime: /WorkerRuntimeGate/.test(serviceText) && /ProductionUnlockGate/.test(serviceText),
  routeMetadataRegistered: workerContractRouteIds.every((routeId) => apiRouteText.includes(routeId)),
  mutationRoutesRequireIdempotency: idempotencyFindings.length === 0,
  packageScriptRegistered: /"worker:execution:diagnostics"/.test(packageText),
  diagnosticsInFoundationRunner: /worker:execution:diagnostics/.test(runnerText),
  toolsRemainRuntimeDisabled: disabledToolRuntimeMatches.length === 0,
}

const behaviorFailures = Object.entries(behaviorChecks)
  .filter(([, ok]) => !ok)
  .map(([check]) => ({
    file: 'scripts/validation/worker-execution-contract-diagnostics.mjs',
    line: 1,
    pattern: check,
    excerpt: `Behavior check failed: ${check}`,
  }))

const criticalFindings = [
  ...forbiddenRuntimeMatches,
  ...legacyPrimaryTargetMatches,
  ...disabledToolRuntimeMatches,
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
    rendersMedia: false,
    executesTools: false,
    installsTools: false,
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
    toolReadinessFiles: toolReadinessFiles.map((file) => ({ path: file, exists: fileExists(file) })),
  },
  behaviorChecks,
  findings: {
    forbiddenRuntimeMatches,
    legacyPrimaryTargetMatches,
    disabledToolRuntimeMatches,
    idempotencyFindings,
    routeReadinessFindings,
    behaviorFailures,
    criticalFindings,
  },
  summary: {
    filesScanned: existingFiles.length,
    toolFilesScanned: existingToolFiles.length,
    forbiddenRuntimeMatchCount: forbiddenRuntimeMatches.length,
    legacyPrimaryTargetMatchCount: legacyPrimaryTargetMatches.length,
    disabledToolRuntimeMatchCount: disabledToolRuntimeMatches.length,
    idempotencyFindingCount: idempotencyFindings.length,
    routeReadinessFindingCount: routeReadinessFindings.length,
    behaviorFailureCount: behaviorFailures.length,
    criticalFindingCount: criticalFindings.length,
  },
  recommendation: criticalFindings.length === 0
    ? 'Worker execution contract foundation passed static diagnostics.'
    : 'Fix critical worker execution contract findings before proceeding.',
}

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)

if (criticalFindings.length > 0) {
  process.exitCode = 1
}
