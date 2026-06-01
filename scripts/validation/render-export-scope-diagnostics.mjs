import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const implementationFiles = [
  'server/routes/render-routes.ts',
  'server/services/render-service.ts',
  'server/validation/render-schemas.ts',
  'src/backend/api/routes/render-api-routes.ts',
  'src/backend/api/api-route-registry.ts',
  'server/app.ts',
]

const forbiddenRuntimePatterns = [
  /\.from\(['"`](render_jobs|render_job_inputs|renders|render_events|final_exports|qa_reports|qa_check_results|jobs|worker_job_claims|worker_leases|generation_requests|provider_request_attempts|tool_runtime_checks|credit_ledger_entries|credit_reservations)['"`]\)\s*\n?\s*\.(insert|update|upsert|delete)/i,
  /\.rpc\(['"`](create_render_job|request_preview_render|request_final_export|claim_worker_job|append_job_event|run_remotion|run_ffmpeg|start_render|start_export)['"`]/i,
  /renderMedia\s*\(/,
  /renderFrames\s*\(/,
  /bundle\s*\(/,
  /spawn\s*\(/,
  /execFile\s*\(/,
  /new\s+Worker\b/,
  /runBasicRenderSmokeWorker\s*\(/,
  /createRenderJob\s*\(/,
  /claimWorker|runWorker|executeWorker/i,
  /callProvider\s*\(|providerClient\.\w+\s*\(|providerRequest\s*[:=]/i,
  /executeTool\s*\(|toolExecution\s*[:=]/i,
  /startGeneration|generationRequest/i,
  /transcribe|runMediaProbe|probeMediaFile|ffprobe\s*\(/i,
  /stripe\.(checkout|webhooks)|checkout\.sessions|STRIPE_SECRET_KEY|stripe_secret_key/i,
  /SUPABASE_SERVICE_ROLE_KEY/,
  /service_role_key/i,
  /provider_api_key/i,
  /signed_url\s*[:=]/i,
  /signedUrl\s*:/,
  /remote Supabase execution enabled/i,
  /CloudRun|Cloud Tasks|PubSub|Pub\/Sub/i,
]

const documentedBlockerPatterns = [
  /ToolExecutionBlockedGate/i,
  /ProviderExecutionBlockedGate/i,
  /WorkerExecutionBlockedGate/i,
  /never executes tools/i,
  /never calls providers/i,
  /never starts workers/i,
  /does not execute Remotion/i,
  /no Remotion or FFmpeg execution occurred/i,
]

const noncanonicalPrimaryTargets = [
  /\.from\(['"`](exports|export_variants|preview_reviews|review_comments|qa_report_items)['"`]\)/i,
]

function fileExists(relativePath) {
  return fs.existsSync(path.join(root, relativePath))
}

function readFile(relativePath) {
  const absolutePath = path.join(root, relativePath)
  if (!fs.existsSync(absolutePath)) return ''
  return fs.readFileSync(absolutePath, 'utf8')
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

function collectIdempotencyFindings(file) {
  const text = readFile(file)
  const findings = []
  const mutationRoutes = [
    '/v1/render/manifest/build',
    '/v1/render/preview/request',
    '/v1/export/request',
  ]
  const lines = text.split('\n')

  for (const route of mutationRoutes) {
    const routeLine = lines.findIndex((line) => line.includes(`'${route}'`) || line.includes(`"${route}"`))
    if (routeLine === -1) {
      findings.push({
        file,
        line: 1,
        pattern: 'mutationRoutePresent',
        excerpt: `Missing mutation route: ${route}`,
      })
      continue
    }

    const routeWindow = lines.slice(routeLine, routeLine + 3).join(' ')
    if (!routeWindow.includes('requireIdempotency')) {
      findings.push({
        file,
        line: routeLine + 1,
        pattern: 'mutationRouteRequiresIdempotency',
        excerpt: routeWindow.trim().slice(0, 220),
      })
    }
  }

  return findings
}

const existingFiles = implementationFiles.filter(fileExists)
const forbiddenRuntimeMatches = scanFilePatterns(existingFiles, forbiddenRuntimePatterns)
const noncanonicalPrimaryTargetMatches = scanFilePatterns(existingFiles, noncanonicalPrimaryTargets)
const idempotencyFindings = collectIdempotencyFindings('server/routes/render-routes.ts')
const documentedBlockerMentions = scanFilePatterns(existingFiles, documentedBlockerPatterns)

const routeText = readFile('server/routes/render-routes.ts')
const serviceText = readFile('server/services/render-service.ts')
const metadataText = readFile('src/backend/api/routes/render-api-routes.ts')
const registryText = readFile('src/backend/api/api-route-registry.ts')
const runnerText = readFile('scripts/validation/run-foundation-validation.mjs')

const behaviorChecks = {
  routeRegisteredInServerApp: /createRenderRoutes/.test(readFile('server/app.ts')),
  routeUsesAuth: /requireAuth/.test(routeText),
  mutationRoutesUseIdempotency: idempotencyFindings.length === 0,
  serviceUsesBackendRequiredBoundary: /RenderWorkerRuntimeGate/.test(serviceText) && /backend_required/.test(serviceText),
  serviceHasNoRenderJobInsert: !/\.from\(['"`]render_jobs['"`]\)\s*\n?\s*\.insert/i.test(serviceText),
  serviceDocumentsNoExecution: /does not execute Remotion/.test(serviceText) || /no Remotion or FFmpeg execution occurred/i.test(serviceText),
  routeMetadataRegistered: /RENDER_API_ROUTES/.test(registryText),
  routeMetadataHasForbiddenSideEffects: /RENDER_FORBIDDEN_SIDE_EFFECTS/.test(metadataText),
  diagnosticsInFoundationRunner: /render:export:diagnostics/.test(runnerText),
}

const behaviorFailures = Object.entries(behaviorChecks)
  .filter(([, ok]) => !ok)
  .map(([check]) => ({
    file: 'scripts/validation/render-export-scope-diagnostics.mjs',
    line: 1,
    pattern: check,
    excerpt: `Behavior check failed: ${check}`,
  }))

const criticalFindings = [
  ...forbiddenRuntimeMatches,
  ...noncanonicalPrimaryTargetMatches,
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
    processesMedia: false,
    deploys: false,
    mutatesSourceFiles: false,
  },
  files: {
    implementationFiles: implementationFiles.map((file) => ({ path: file, exists: fileExists(file) })),
  },
  behaviorChecks,
  findings: {
    forbiddenRuntimeMatches,
    noncanonicalPrimaryTargetMatches,
    idempotencyFindings,
    documentedBlockerMentions,
    behaviorFailures,
    criticalFindings,
  },
  summary: {
    filesScanned: existingFiles.length,
    missingFiles: implementationFiles.filter((file) => !fileExists(file)),
    forbiddenRuntimeMatchCount: forbiddenRuntimeMatches.length,
    noncanonicalPrimaryTargetMatchCount: noncanonicalPrimaryTargetMatches.length,
    idempotencyFindingCount: idempotencyFindings.length,
    documentedBlockerMentionCount: documentedBlockerMentions.length,
    behaviorFailureCount: behaviorFailures.length,
    criticalFindingCount: criticalFindings.length,
  },
  recommendation: criticalFindings.length === 0
    ? 'Render/export route-service foundation passed scope diagnostics.'
    : 'Fix critical render/export scope findings before proceeding.',
}

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)

if (criticalFindings.length > 0) {
  process.exitCode = 1
}
