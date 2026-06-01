import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const implementationFiles = [
  'server/routes/job-routes.ts',
  'server/routes/worker-routes.ts',
  'server/services/job-service.ts',
  'server/services/worker-claim-service.ts',
  'server/validation/job-schemas.ts',
  'server/validation/worker-schemas.ts',
  'src/backend/api/routes/job-api-routes.ts',
  'src/backend/api/routes/worker-api-routes.ts',
  'src/backend/api/api-route-registry.ts',
]

const forbiddenRuntimePatterns = [
  /\.from\(['"`](job_batches|jobs|job_dependencies|job_events|worker_leases|worker_job_claims|job_claim_attempts|backend_runtime_messages|tool_runtime_checks)['"`]\)\s*\n?\s*\.(insert|update|upsert|delete)/i,
  /\.rpc\(['"`](can_claim_worker_job|can_run_job|claim_worker_job|recover_stale_worker|append_job_event)['"`]/i,
  /runWorkerClaimRunner/,
  /runToolReadinessChecks/,
  /executeWorker\(/i,
  /executeTool/i,
  /callProvider/i,
  /startRender/i,
  /startGeneration/i,
  /runMediaProbe/i,
  /CloudRun[A-Z]|runCloudRun|CloudRunClient/i,
  /PubSub\(|new PubSub|PubSubClient/i,
  /CloudTasksClient|new CloudTasks/i,
  /stripe\.(checkout|webhooks)|checkout\.sessions|STRIPE_SECRET_KEY|stripe_secret_key/i,
  /SUPABASE_SERVICE_ROLE_KEY/,
  /service_role_key/i,
  /provider_api_key/i,
  /stripe_secret_key/i,
  /signed_url\s*[:=]/i,
  /signedUrl\s*:/,
]

const legacyPrimaryTargetPatterns = [
  /\.from\(['"`](editing_jobs|job_steps|worker_events)['"`]\)/i,
]

const allowedPostWithoutIdempotency = [
  '/v1/jobs/readiness',
  '/v1/jobs/:jobId/claim/readiness',
]

function fileExists(relativePath) {
  return fs.existsSync(path.join(root, relativePath))
}

function readFile(relativePath) {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) return ''
  return fs.readFileSync(absolutePath, 'utf8')
}

function scanLines(files, patterns) {
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
            excerpt: line.trim().slice(0, 220),
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
  const text = readFile(file)
  const findings = []
  const lines = text.split('\n')

  lines.forEach((line, index) => {
    const routeMatch = line.match(/router\.post\(['"`]([^'"`]+)['"`](.*)/)
    if (!routeMatch) return
    const routePath = routeMatch[1]
    if (allowedPostWithoutIdempotency.includes(routePath)) return
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

const existingFiles = implementationFiles.filter(fileExists)
const forbiddenRuntimeMatches = scanFilePatterns(existingFiles, forbiddenRuntimePatterns)
const legacyPrimaryTargetMatches = scanLines(existingFiles, legacyPrimaryTargetPatterns)
const idempotencyFindings = [
  ...collectPostRouteIdempotencyFindings('server/routes/job-routes.ts'),
  ...collectPostRouteIdempotencyFindings('server/routes/worker-routes.ts'),
]

const jobServiceText = readFile('server/services/job-service.ts')
const workerServiceText = readFile('server/services/worker-claim-service.ts')
const jobRoutesText = readFile('server/routes/job-routes.ts')
const workerRoutesText = readFile('server/routes/worker-routes.ts')
const registryText = readFile('src/backend/api/api-route-registry.ts')

const behaviorChecks = {
  jobServiceUsesBoundaryResult: /mutationBoundaryResult/.test(jobServiceText) && /backendRequiredResult/.test(jobServiceText),
  workerServiceUsesBoundaryResult: /mutationBoundaryResult/.test(workerServiceText) && /backendRequiredResult/.test(workerServiceText),
  jobRoutesUseService: /createJobService/.test(jobRoutesText),
  workerRoutesUseService: /createWorkerClaimService/.test(workerRoutesText),
  workerDomainRegistered: /workers/.test(readFile('src/backend/api/api-runtime-contracts.ts')) && /WORKER_API_ROUTES/.test(registryText),
  jobDiagnosticsInFoundationRunner: /job:worker:diagnostics/.test(readFile('scripts/validation/run-foundation-validation.mjs')),
}

const behaviorFailures = Object.entries(behaviorChecks)
  .filter(([, ok]) => !ok)
  .map(([check]) => ({
    file: 'scripts/validation/job-worker-scope-diagnostics.mjs',
    line: 1,
    pattern: check,
    excerpt: `Behavior check failed: ${check}`,
  }))

const criticalFindings = [
  ...forbiddenRuntimeMatches,
  ...legacyPrimaryTargetMatches,
  ...idempotencyFindings,
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
    executesWorkers: false,
    deploys: false,
  },
  files: {
    implementationFiles: implementationFiles.map((file) => ({ path: file, exists: fileExists(file) })),
  },
  behaviorChecks,
  findings: {
    forbiddenRuntimeMatches,
    legacyPrimaryTargetMatches,
    idempotencyFindings,
    behaviorFailures,
    criticalFindings,
  },
  summary: {
    filesScanned: existingFiles.length,
    missingFiles: implementationFiles.filter((file) => !fileExists(file)),
    forbiddenRuntimeMatchCount: forbiddenRuntimeMatches.length,
    legacyPrimaryTargetMatchCount: legacyPrimaryTargetMatches.length,
    idempotencyFindingCount: idempotencyFindings.length,
    behaviorFailureCount: behaviorFailures.length,
    criticalFindingCount: criticalFindings.length,
  },
  recommendation: criticalFindings.length === 0
    ? 'Job/worker route-service foundation passed scope diagnostics.'
    : 'Fix critical job/worker scope findings before proceeding.',
}

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)

if (criticalFindings.length > 0) {
  process.exitCode = 1
}
