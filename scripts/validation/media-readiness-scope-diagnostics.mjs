import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const implementationFiles = [
  'server/routes/media-readiness-routes.ts',
  'server/services/media-readiness-service.ts',
  'server/validation/media-readiness-schemas.ts',
  'src/backend/api/routes/media-readiness-api-routes.ts',
  'src/backend/api/api-route-registry.ts',
  'server/app.ts',
]

const forbiddenRuntimePatterns = [
  /\.from\(['"`](media_assets|uploaded_clips|source_sequence_items|storage_object_records|upload_intents|master_timing_maps|jobs|worker_job_claims|worker_leases|tool_runtime_checks|render_jobs|generation_requests|provider_request_attempts|credit_ledger_entries|credit_reservations|approved_plan_snapshots)['"`]\)\s*\n?\s*\.(insert|update|upsert|delete)/i,
  /\.rpc\(['"`](claim_worker_job|can_claim_worker_job|append_job_event|run_media_probe|start_media_probe|create_render_job|create_generation_request)['"`]/i,
  /probeMediaFile\s*\(/,
  /runMediaProbeWorker\s*\(/,
  /runSourceMediaReadinessWorker\s*\(/,
  /execFile\s*\(/,
  /spawn\s*\(/,
  /new\s+Worker\b/,
  /runWorkerClaimRunner/,
  /executeWorker\s*\(/i,
  /executeTool/i,
  /callProvider/i,
  /startRender/i,
  /startGeneration/i,
  /transcribe(Media|Audio)|runTranscription|startTranscription/i,
  /ocrProvider|runOcr|runOCR|vlmProvider|runVlm|runVLM/i,
  /detectFaces|faceDetection|objectDetection|detectObjects/i,
  /stripe\.(checkout|webhooks)|checkout\.sessions|STRIPE_SECRET_KEY|stripe_secret_key/i,
  /SUPABASE_SERVICE_ROLE_KEY/,
  /service_role_key/i,
  /provider_api_key/i,
  /signed_url\s*[:=]/i,
  /signedUrl\s*:/,
  /remote Supabase execution enabled/i,
]

const noncanonicalPrimaryTargets = [
  /\.from\(['"`](source_clip_sequences|source_clip_sequence_items|source_sequence_maps|source_sequence_map_items|transcripts|transcript_segments|scene_boundaries|visual_observations|audio_observations)['"`]\)/i,
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

function collectProbeRequestIdempotencyFindings(file) {
  const text = readFile(file)
  const findings = []
  const lines = text.split('\n')

  lines.forEach((line, index) => {
    if (!line.includes("'/v1/media/probe/request'") && !line.includes('"/v1/media/probe/request"')) return
    if (!line.includes('requireIdempotency')) {
      findings.push({
        file,
        line: index + 1,
        pattern: 'probeRequestRequiresIdempotency',
        excerpt: line.trim().slice(0, 220),
      })
    }
  })

  return findings
}

const existingFiles = implementationFiles.filter(fileExists)
const forbiddenRuntimeMatches = scanFilePatterns(existingFiles, forbiddenRuntimePatterns)
const noncanonicalPrimaryTargetMatches = scanFilePatterns(existingFiles, noncanonicalPrimaryTargets)
const idempotencyFindings = collectProbeRequestIdempotencyFindings('server/routes/media-readiness-routes.ts')

const routeText = readFile('server/routes/media-readiness-routes.ts')
const serviceText = readFile('server/services/media-readiness-service.ts')
const metadataText = readFile('src/backend/api/routes/media-readiness-api-routes.ts')
const registryText = readFile('src/backend/api/api-route-registry.ts')
const runnerText = readFile('scripts/validation/run-foundation-validation.mjs')

const behaviorChecks = {
  routeRegisteredInServerApp: /createMediaReadinessRoutes/.test(readFile('server/app.ts')),
  routeUsesAuth: /requireAuth/.test(routeText),
  probeRequestUsesIdempotency: /\/v1\/media\/probe\/request/.test(routeText) && /requireIdempotency/.test(routeText),
  serviceUsesBackendRequiredBoundary: /backendRequiredResult/.test(serviceText) && /BackendMediaRuntimeGate/.test(serviceText),
  serviceDocumentsNoExecution: /does not process real user media/.test(serviceText) || /No persisted probe result/.test(serviceText),
  routeMetadataRegistered: /MEDIA_READINESS_API_ROUTES/.test(registryText),
  routeMetadataHasForbiddenSideEffects: /MEDIA_READINESS_FORBIDDEN_SIDE_EFFECTS/.test(metadataText),
  diagnosticsInFoundationRunner: /media:readiness:diagnostics/.test(runnerText),
}

const behaviorFailures = Object.entries(behaviorChecks)
  .filter(([, ok]) => !ok)
  .map(([check]) => ({
    file: 'scripts/validation/media-readiness-scope-diagnostics.mjs',
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
  },
  files: {
    implementationFiles: implementationFiles.map((file) => ({ path: file, exists: fileExists(file) })),
  },
  behaviorChecks,
  findings: {
    forbiddenRuntimeMatches,
    noncanonicalPrimaryTargetMatches,
    idempotencyFindings,
    behaviorFailures,
    criticalFindings,
  },
  summary: {
    filesScanned: existingFiles.length,
    missingFiles: implementationFiles.filter((file) => !fileExists(file)),
    forbiddenRuntimeMatchCount: forbiddenRuntimeMatches.length,
    noncanonicalPrimaryTargetMatchCount: noncanonicalPrimaryTargetMatches.length,
    idempotencyFindingCount: idempotencyFindings.length,
    behaviorFailureCount: behaviorFailures.length,
    criticalFindingCount: criticalFindings.length,
  },
  recommendation: criticalFindings.length === 0
    ? 'Media readiness route-service foundation passed scope diagnostics.'
    : 'Fix critical media readiness scope findings before proceeding.',
}

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)

if (criticalFindings.length > 0) {
  process.exitCode = 1
}
