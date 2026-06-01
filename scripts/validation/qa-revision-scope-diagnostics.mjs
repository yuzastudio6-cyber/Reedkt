import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const implementationFiles = [
  'server/routes/qa-revision-routes.ts',
  'server/services/qa-revision-service.ts',
  'server/validation/qa-revision-schemas.ts',
  'src/backend/api/routes/qa-revision-api-routes.ts',
  'src/backend/api/api-route-registry.ts',
  'server/app.ts',
]

const forbiddenRuntimePatterns = [
  /\.from\(['"`](qa_reports|qa_check_results|qa_report_items|preview_reviews|review_comments|revision_requests|fallback_decisions|repair_plans|generation_requests|generated_assets|provider_request_attempts|render_jobs|render_job_inputs|renders|render_events|final_exports|jobs|job_events|worker_job_claims|worker_leases|tool_runtime_checks|credit_ledger_entries|credit_reservations|storage_object_records)['"`]\)\s*\n?\s*\.(insert|update|upsert|delete)/i,
  /\.rpc\(['"`](create_qa_report|resolve_qa_blocker|create_preview_review|create_review_comment|create_revision_request|plan_fallback_decision|start_repair|start_generation|request_preview_render|request_final_export|claim_worker_job|append_job_event|run_qa|run_revision|run_fallback)['"`]/i,
  /runQ[Aa]Worker\s*\(/,
  /executeQ[Aa]\s*\(/,
  /inspectMedia\s*\(/,
  /probeMediaFile\s*\(/,
  /runMediaProbe\s*\(/,
  /transcribe\s*\(/,
  /renderMedia\s*\(/,
  /renderFrames\s*\(/,
  /bundle\s*\(/,
  /spawn\s*\(/,
  /execFile\s*\(/,
  /new\s+Worker\b/,
  /claimWorker\s*\(/,
  /runWorker\s*\(/,
  /executeWorker\s*\(/,
  /callProvider\s*\(/,
  /providerClient\.\w+\s*\(/,
  /executeTool\s*\(/,
  /toolExecution\s*[:=]/i,
  /startGeneration\s*\(/,
  /createGenerationRequest\s*\(/,
  /regenerateAsset\s*\(/,
  /executeRepair\s*\(/,
  /stripe\.(checkout|webhooks)/i,
  /checkout\.sessions/i,
  /STRIPE_SECRET_KEY/,
  /SUPABASE_SERVICE_ROLE_KEY/,
  /service_role_key/i,
  /provider_api_key/i,
  /signed_url\s*[:=]/i,
  /signedUrl\s*:/,
  /remote Supabase execution enabled/i,
  /CloudRun|Cloud Tasks|PubSub|Pub\/Sub/i,
]

const noncanonicalPrimaryTargets = [
  /\.from\(['"`](fallback_decisions|repair_plans|qa_report_items|exports|export_variants|credit_approvals|user_profiles)['"`]\)\s*\n?\s*\.(insert|update|upsert|delete|select)/i,
]

const documentedBlockerPatterns = [
  /ProviderExecutionBlockedGate/i,
  /RenderExecutionBlockedGate/i,
  /ToolExecutionBlockedGate/i,
  /WorkerExecutionBlockedGate/i,
  /QA\/revision\/fallback readiness boundary passed/i,
  /does not execute QA/i,
  /does not execute tools/i,
  /does not inspect media/i,
  /does not retry, regenerate, repair, render, or create jobs/i,
]

const mutationRoutes = [
  '/v1/qa/reports',
  '/v1/qa/blockers/resolve-boundary',
  '/v1/preview/reviews',
  '/v1/review/comments',
  '/v1/revision/requests',
  '/v1/fallback/decisions/plan',
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

  for (const route of mutationRoutes) {
    const routeIndex = text.indexOf(route)
    if (routeIndex === -1) {
      findings.push({
        file,
        line: 1,
        pattern: 'mutationRoutePresent',
        excerpt: `Missing mutation route: ${route}`,
      })
      continue
    }

    const routeWindow = text.slice(routeIndex, routeIndex + 260)
    if (!/requireIdempotency/.test(routeWindow)) {
      findings.push({
        file,
        line: text.slice(0, routeIndex).split('\n').length,
        pattern: 'mutationRouteRequiresIdempotency',
        excerpt: routeWindow.replace(/\s+/g, ' ').slice(0, 220),
      })
    }
  }

  return findings
}

const existingFiles = implementationFiles.filter(fileExists)
const forbiddenRuntimeMatches = scanFilePatterns(existingFiles, forbiddenRuntimePatterns)
const noncanonicalPrimaryTargetMatches = scanFilePatterns(existingFiles, noncanonicalPrimaryTargets)
const documentedBlockerMentions = scanFilePatterns(existingFiles, documentedBlockerPatterns)
const idempotencyFindings = collectIdempotencyFindings('server/routes/qa-revision-routes.ts')

const appText = readFile('server/app.ts')
const registryText = readFile('src/backend/api/api-route-registry.ts')
const apiContractText = readFile('src/backend/api/api-runtime-contracts.ts')
const metadataText = readFile('src/backend/api/routes/qa-revision-api-routes.ts')
const serviceText = readFile('server/services/qa-revision-service.ts')
const runnerText = readFile('scripts/validation/run-foundation-validation.mjs')

const behaviorChecks = {
  routeRegisteredInServerApp: /createQaRevisionRoutes/.test(appText),
  apiDomainRegistered: /\|\s*'qa'/.test(apiContractText) && /qa:\s*0/.test(registryText),
  routeMetadataRegistered: /QA_REVISION_API_ROUTES/.test(registryText),
  metadataHasForbiddenSideEffects: /QA_REVISION_FORBIDDEN_SIDE_EFFECTS/.test(metadataText),
  serviceUsesBackendRequiredBoundary: /QaRevisionRuntimeGate/.test(serviceText) && /backend_required/.test(serviceText),
  serviceHasNoQaMutationWrite: !/\.from\(['"`](qa_reports|qa_check_results|preview_reviews|review_comments|revision_requests)['"`]\)\s*\n?\s*\.(insert|update|upsert|delete)/i.test(serviceText),
  diagnosticsInFoundationRunner: /qa:revision:diagnostics/.test(runnerText),
}

const behaviorFailures = Object.entries(behaviorChecks)
  .filter(([, ok]) => !ok)
  .map(([check]) => ({
    file: 'scripts/validation/qa-revision-scope-diagnostics.mjs',
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
    mutatesCredits: false,
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
    ? 'QA/revision/fallback route-service foundation passed scope diagnostics.'
    : 'Fix critical QA/revision/fallback scope findings before proceeding.',
}

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)

if (criticalFindings.length > 0) {
  process.exitCode = 1
}
