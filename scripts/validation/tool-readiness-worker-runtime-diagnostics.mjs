import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const implementationFiles = [
  'server/foundation/tool-readiness/tool-readiness-types.ts',
  'server/foundation/tool-readiness/tool-readiness-policy.ts',
  'server/foundation/tool-readiness/tool-readiness-registry.ts',
  'server/foundation/tool-readiness/tool-readiness-service.ts',
  'server/foundation/tool-readiness/tool-readiness-diagnostics.ts',
  'server/foundation/tool-readiness/tool-readiness-report-builder.ts',
  'server/foundation/tool-readiness/index.ts',
  'server/routes/tool-readiness-routes.ts',
  'server/cli/foundation-tool-readiness.ts',
  'server/cli/foundation-tool-readiness-report.ts',
  'server/smoke/tool-readiness-worker-runtime-foundation-smoke.ts',
  'src/backend/api/routes/tool-readiness-api-routes.ts',
  'src/backend/api/api-route-registry.ts',
  'server/app.ts',
  'package.json',
]

const requiredFiles = [
  'server/foundation/tool-readiness/tool-readiness-types.ts',
  'server/foundation/tool-readiness/tool-readiness-policy.ts',
  'server/foundation/tool-readiness/tool-readiness-registry.ts',
  'server/foundation/tool-readiness/tool-readiness-service.ts',
  'server/foundation/tool-readiness/tool-readiness-diagnostics.ts',
  'server/foundation/tool-readiness/tool-readiness-report-builder.ts',
  'server/foundation/tool-readiness/index.ts',
  'server/routes/tool-readiness-routes.ts',
  'server/cli/foundation-tool-readiness.ts',
  'server/cli/foundation-tool-readiness-report.ts',
  'server/smoke/tool-readiness-worker-runtime-foundation-smoke.ts',
  'src/backend/api/routes/tool-readiness-api-routes.ts',
]

const requiredToolIds = [
  'ffmpeg',
  'ffprobe',
  'libass',
  'remotion',
  'opentimelineio',
  'opencolorio',
  'openimageio',
  'kornia',
  'birefnet',
  'sam2',
  'real-esrgan',
  'film',
  'deepfilternet',
  'demucs',
  'paddleocr',
  'paddlepaddle',
  'qwen-vl',
  'vllm',
  'playwright',
  'sharp',
  'searxng',
  'readability',
  'maplibre',
  'turf',
  'deckgl',
  'cesium',
  'd3',
]

const requiredStates = [
  'not_configured',
  'planning_only',
  'readiness_check_only',
  'mock_only',
  'disabled',
  'blocked_missing_runtime',
  'blocked_missing_approval',
  'blocked_missing_secret',
  'blocked_by_policy',
  'ready_for_future_activation',
  'never_public',
]

const forbiddenRuntimePatterns = [
  /from\s+['"`]node:child_process['"`]/,
  /runToolReadinessChecks/,
  /spawn\s*\(/,
  /execFile\s*\(/,
  /runTool\s*\(/,
  /executeTool\s*\(/,
  /probeToolRuntime\s*\(/,
  /installToolPackage\s*\(/,
  /claimWorker\s*\(/,
  /runWorker\s*\(/,
  /executeWorker\s*\(/,
  /callProvider\s*\(/,
  /providerClient\.\w+\s*\(/,
  /createSignedUrl\s*\(/,
  /signedUrl\s*:/,
  /\.from\(['"`][\w_]+['"`]\)\s*\n?\s*\.(insert|update|upsert|delete)/i,
  /\.rpc\(['"`](claim_worker_job|execute_tool|start_tool_call|reserve_credits|spend_credits|request_final_export)['"`]/i,
  /allowedInRuntime:\s*true/,
  /productionAllowed:\s*true/,
  /externalBetaAllowed:\s*true/,
  /broadRealMediaAllowed:\s*true/,
  /requiresSignedUrl:\s*true/,
  /requiresFrontendExecution:\s*true/,
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

const existingFiles = implementationFiles.filter(fileExists)
const registryText = readFile('server/foundation/tool-readiness/tool-readiness-registry.ts')
const typesText = readFile('server/foundation/tool-readiness/tool-readiness-types.ts')
const routeText = readFile('server/routes/tool-readiness-routes.ts')
const appText = readFile('server/app.ts')
const apiRegistryText = readFile('src/backend/api/api-route-registry.ts')
const apiRouteText = readFile('src/backend/api/routes/tool-readiness-api-routes.ts')
const runnerText = readFile('scripts/validation/run-foundation-validation.mjs')
const packageText = readFile('package.json')

const missingFiles = requiredFiles.filter((file) => !fileExists(file))
const missingToolIds = requiredToolIds.filter((toolId) => !registryText.includes(`"${toolId}"`) && !registryText.includes(`'${toolId}'`))
const missingStates = requiredStates.filter((state) => !typesText.includes(`"${state}"`) && !typesText.includes(`'${state}'`))
const forbiddenRuntimeMatches = scanFilePatterns(existingFiles, forbiddenRuntimePatterns)

const behaviorChecks = {
  requiredFilesPresent: missingFiles.length === 0,
  requiredToolIdsPresent: missingToolIds.length === 0,
  readinessStatesExplicit: missingStates.length === 0,
  routesRegisteredInServerApp: /createToolReadinessRoutes/.test(appText),
  routeFileIsReadOnly: /router\.get\('/.test(routeText) && !/router\.(post|patch|put|delete)\('/.test(routeText),
  apiRouteMetadataRegistered: /TOOL_READINESS_API_ROUTES/.test(apiRegistryText) && /TOOL_READINESS_API_ROUTES/.test(apiRouteText),
  packageScriptsRegistered:
    /"foundation:tool-readiness"/.test(packageText) &&
    /"foundation:tool-readiness:report"/.test(packageText) &&
    /"smoke:tool-readiness-worker-runtime-foundation"/.test(packageText),
  diagnosticsInFoundationRunner: /tool:readiness:diagnostics/.test(runnerText),
  demucsBlocked: /toolId:\s*['"`]demucs['"`][\s\S]*readinessState:\s*['"`]blocked_missing_approval['"`]/.test(registryText),
  vlmBlocked:
    /toolId:\s*['"`]qwen-vl['"`][\s\S]*readinessState:\s*['"`]blocked_by_policy['"`]/.test(registryText) &&
    /toolId:\s*['"`]vllm['"`][\s\S]*readinessState:\s*['"`]blocked_by_policy['"`]/.test(registryText),
  noRuntimePatterns: forbiddenRuntimeMatches.length === 0,
}

const behaviorFailures = Object.entries(behaviorChecks)
  .filter(([, ok]) => !ok)
  .map(([check]) => ({
    file: 'scripts/validation/tool-readiness-worker-runtime-diagnostics.mjs',
    line: 1,
    pattern: check,
    excerpt: `Behavior check failed: ${check}`,
  }))

const criticalFindings = [
  ...missingFiles.map((file) => ({
    file,
    line: 1,
    pattern: 'requiredFilePresent',
    excerpt: `Missing required file: ${file}`,
  })),
  ...missingToolIds.map((toolId) => ({
    file: 'server/foundation/tool-readiness/tool-readiness-registry.ts',
    line: 1,
    pattern: 'requiredToolIdPresent',
    excerpt: `Missing required tool id: ${toolId}`,
  })),
  ...missingStates.map((state) => ({
    file: 'server/foundation/tool-readiness/tool-readiness-types.ts',
    line: 1,
    pattern: 'requiredStatePresent',
    excerpt: `Missing readiness state: ${state}`,
  })),
  ...forbiddenRuntimeMatches,
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
    missingFiles,
  },
  behaviorChecks,
  findings: {
    missingToolIds,
    missingStates,
    forbiddenRuntimeMatches,
    behaviorFailures,
    criticalFindings,
  },
  summary: {
    filesScanned: existingFiles.length,
    requiredToolCount: requiredToolIds.length,
    requiredStateCount: requiredStates.length,
    forbiddenRuntimeMatchCount: forbiddenRuntimeMatches.length,
    behaviorFailureCount: behaviorFailures.length,
    criticalFindingCount: criticalFindings.length,
  },
  recommendation: criticalFindings.length === 0
    ? 'Tool readiness worker runtime foundation passed static diagnostics.'
    : 'Fix critical Prompt 13 tool readiness findings before proceeding.',
}

process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)

if (criticalFindings.length > 0) {
  process.exitCode = 1
}
