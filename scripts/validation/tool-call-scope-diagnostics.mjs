import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const implementationFiles = [
  'server/routes/tool-call-routes.ts',
  'server/services/tool-call-service.ts',
  'server/validation/tool-call-schemas.ts',
  'src/backend/api/routes/tool-call-api-routes.ts',
  'src/backend/api/api-route-registry.ts',
  'src/backend/api/api-runtime-contracts.ts',
  'server/app.ts',
]

const forbiddenRuntimePatterns = [
  /\.from\(['"`](tool_call_intents|tool_call_executions|tool_runtime_checks|tool_profiles|tool_capabilities|jobs|job_events|worker_job_claims|worker_leases|provider_request_attempts|render_jobs|render_job_inputs|renders|final_exports|credit_ledger_entries|credit_reservations|storage_object_records|media_assets|qa_reports|qa_check_results)['"`]\)\s*\n?\s*\.(insert|update|upsert|delete)/i,
  /\.rpc\(['"`](create_tool_call_intent|start_tool_call|execute_tool|claim_worker_job|append_job_event|request_preview_render|request_final_export|reserve_credits|spend_credits|create_storage_object|run_qa)['"`]/i,
  /runTool\s*\(/,
  /executeTool\s*\(/,
  /toolExecution\s*[:=]/i,
  /runToolChain\s*\(/,
  /probeToolRuntime\s*\(/,
  /installToolPackage\s*\(/,
  /spawn\s*\(/,
  /execFile\s*\(/,
  /new\s+Worker\b/,
  /claimWorker\s*\(/,
  /runWorker\s*\(/,
  /executeWorker\s*\(/,
  /callProvider\s*\(/,
  /providerClient\.\w+\s*\(/,
  /startGeneration\s*\(/,
  /createGenerationRequest\s*\(/,
  /processMedia\s*\(/,
  /probeMediaFile\s*\(/,
  /renderMedia\s*\(/,
  /renderFrames\s*\(/,
  /bundle\s*\(/,
  /stripe\.(checkout|webhooks)/i,
  /checkout\.sessions/i,
  /SUPABASE_SERVICE_ROLE_KEY/,
  /service_role_key/i,
  /provider_api_key/i,
  /signed_url\s*[:=]/i,
  /signedUrl\s*:/,
  /CloudRun|Cloud Tasks|PubSub|Pub\/Sub/i,
]

const noncanonicalPrimaryTargets = [
  /\.from\(['"`](tool_requests|tool_attempts|tool_runs|tool_outputs|tool_profiles_legacy|tools)['"`]\)\s*\n?\s*\.(insert|update|upsert|delete|select)/i,
]

const documentedBlockerPatterns = [
  /ToolCallRuntimeGate/i,
  /ToolCallBackendRuntimeGate/i,
  /ToolExecutionBlockedGate/i,
  /backend_required/i,
  /does not execute tools/i,
  /does not install/i,
  /does not process media/i,
  /Tool execution remains blocked/i,
]

const mutationRoutes = [
  "router.post('/v1/tools/call-intents',",
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

    const routeWindow = text.slice(routeIndex, routeIndex + 280)
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
const idempotencyFindings = collectIdempotencyFindings('server/routes/tool-call-routes.ts')

const appText = readFile('server/app.ts')
const registryText = readFile('src/backend/api/api-route-registry.ts')
const apiContractText = readFile('src/backend/api/api-runtime-contracts.ts')
const metadataText = readFile('src/backend/api/routes/tool-call-api-routes.ts')
const serviceText = readFile('server/services/tool-call-service.ts')
const routeText = readFile('server/routes/tool-call-routes.ts')
const runnerText = readFile('scripts/validation/run-foundation-validation.mjs')
const packageText = readFile('package.json')

const behaviorChecks = {
  routeRegisteredInServerApp: /createToolCallRoutes/.test(appText),
  apiDomainRegistered: /\|\s*'tools'/.test(apiContractText) && /tools:\s*0/.test(registryText),
  routeMetadataRegistered: /TOOL_CALL_API_ROUTES/.test(registryText),
  toolsDomainExecutionBlocked: /'tools'/.test(registryText) && /PROMPT7_BLOCKED_EXECUTION_DOMAINS/.test(registryText),
  metadataHasForbiddenSideEffects: /TOOL_CALL_FORBIDDEN_SIDE_EFFECTS/.test(metadataText),
  serviceUsesBackendRequiredBoundary: /ToolCallRuntimeGate/.test(serviceText) && /backend_required/.test(serviceText),
  serviceHasNoToolMutationWrite: !/\.from\(['"`](tool_call_intents|tool_call_executions|tool_runtime_checks)['"`]\)\s*\n?\s*\.(insert|update|upsert|delete)/i.test(serviceText),
  routeCreateIntentRequiresIdempotency: /\/v1\/tools\/call-intents/.test(routeText) && /requireIdempotency/.test(routeText),
  diagnosticsInFoundationRunner: /tool:call:diagnostics/.test(runnerText),
  packageScriptRegistered: /"tool:call:diagnostics"/.test(packageText),
}

const behaviorFailures = Object.entries(behaviorChecks)
  .filter(([, ok]) => !ok)
  .map(([check]) => ({
    file: 'scripts/validation/tool-call-scope-diagnostics.mjs',
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
    installsTools: false,
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
    ? 'Tool-call route/service foundation passed scope diagnostics.'
    : 'Fix critical tool-call scope findings before proceeding.',
}

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)

if (criticalFindings.length > 0) {
  process.exitCode = 1
}
