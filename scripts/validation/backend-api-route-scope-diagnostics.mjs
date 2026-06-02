import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const routeFiles = [
  'server/routes/chat-routes.ts',
  'server/routes/job-routes.ts',
  'server/routes/worker-routes.ts',
  'server/routes/provider-gateway-routes.ts',
  'server/routes/render-routes.ts',
  'server/routes/health-routes.ts',
  'server/routes/route-helpers.ts',
]

const registryFiles = [
  'src/backend/api/api-route-registry.ts',
  'src/backend/api/mock-api-router.ts',
  'src/backend/api/api-runtime-contracts.ts',
  'src/backend/api/routes/job-api-routes.ts',
  'src/backend/api/routes/worker-api-routes.ts',
  'src/backend/api/routes/generation-api-routes.ts',
  'src/backend/api/routes/render-api-routes.ts',
  'src/backend/api/routes/music-api-routes.ts',
  'src/backend/api/routes/sfx-api-routes.ts',
  'src/backend/api/routes/storytiming-api-routes.ts',
  'src/backend/api/routes/provider-api-routes.ts',
  'src/backend/api/routes/stripe-api-routes.ts',
  'src/backend/api/routes/credit-api-routes.ts',
  'src/backend/api/routes/approved-snapshot-api-routes.ts',
  'src/backend/api/routes/storage-api-routes.ts',
  'src/backend/api/routes/media-upload-api-routes.ts',
  'src/backend/api/routes/auth-bootstrap-api-routes.ts',
  'src/backend/api/routes/project-api-routes.ts',
]

const blockedServiceImports = [
  /createChatService/,
  /runWorkerClaimRunner/,
  /runToolReadinessChecks/,
  /checkBasicRenderSmokeTools/,
]

const blockedRuntimeCalls = [
  /\.from\(['"`]jobs['"`]\).*\.insert/s,
  /\.from\(['"`]job_batches['"`]\).*\.insert/s,
  /\.from\(['"`]provider_request_attempts['"`]\).*\.insert/s,
  /\.from\(['"`]provider_webhook_events['"`]\).*\.insert/s,
  /\.from\(['"`]render_jobs['"`]\).*\.insert/s,
  /\.from\(['"`]tool_runtime_checks['"`]\).*\.insert/s,
  /stripe\.checkout/i,
  /checkout\.sessions/i,
  /executeTool/i,
  /callProvider/i,
  /startRender/i,
  /startGeneration/i,
]

const secretPatterns = [
  /SUPABASE_SERVICE_ROLE_KEY/,
  /service_role_key/i,
  /provider_api_key/i,
  /stripe_secret_key/i,
  /client_secret/i,
  /private_key/i,
  /access_token/i,
  /refresh_token/i,
  /signed_url\s*[:=]/i,
  /signedUrl\s*:/,
]

const requiredFailClosedFiles = [
  'server/routes/chat-routes.ts',
  'server/routes/provider-gateway-routes.ts',
  'server/routes/render-routes.ts',
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
            excerpt: line.trim().slice(0, 180),
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

function summarizeByFile(matches) {
  return matches.reduce((summary, match) => {
    summary[match.file] = (summary[match.file] ?? 0) + 1
    return summary
  }, {})
}

function failClosedCoverage(files) {
  const renderRoutesText = readFile('server/routes/render-routes.ts')
  const renderServiceText = readFile('server/services/render-service.ts')
  const providerRoutesText = readFile('server/routes/provider-gateway-routes.ts')
  const providerServiceText = readFile('server/services/provider-gateway-service.ts')
  const renderMutationRoutes = [
    '/v1/render/manifest/build',
    '/v1/render/preview/request',
    '/v1/export/request',
  ]
  const providerBoundaryRoutes = [
    '/v1/providers/request-attempt/create-boundary',
    '/v1/providers/webhooks/:provider/receive-boundary',
    '/v1/providers/request-envelope/validate',
    '/v1/providers/route/preview',
  ]
  const renderServiceBoundarySafe = /createRenderService/.test(renderRoutesText) &&
    /RenderWorkerRuntimeGate/.test(renderServiceText) &&
    /backend_required/.test(renderServiceText) &&
    !/\.from\(['"`]render_jobs['"`]\)\s*\n?\s*\.insert/i.test(renderServiceText) &&
    renderMutationRoutes.every((route) => {
      const routeIndex = renderRoutesText.indexOf(route)
      if (routeIndex === -1) return false
      const routeWindow = renderRoutesText.slice(routeIndex, routeIndex + 240)
      return /requireIdempotency/.test(routeWindow)
    })
  const providerServiceBoundarySafe = /createProviderGatewayService/.test(providerRoutesText) &&
    /ProviderTransportGate/.test(providerServiceText) &&
    /ProviderExecutionBlockedGate/.test(providerServiceText) &&
    /canCallProvider:\s*false/.test(providerServiceText) &&
    !/\.from\(['"`](provider_request_attempts|provider_webhook_events)['"`]\)\s*\n?\s*\.(insert|update|upsert|delete)/i.test(providerServiceText) &&
    providerBoundaryRoutes.every((route) => {
      const routeIndex = providerRoutesText.indexOf(route)
      if (routeIndex === -1) return false
      const routeWindow = providerRoutesText.slice(routeIndex, routeIndex + 260)
      return /requireIdempotency/.test(routeWindow)
    })

  return files.map((file) => {
    const text = readFile(file)
    const usesPrompt10RenderBoundary = file === 'server/routes/render-routes.ts' && renderServiceBoundarySafe
    const usesPrompt15ProviderBoundary = file === 'server/routes/provider-gateway-routes.ts' && providerServiceBoundarySafe
    return {
      file,
      exists: fileExists(file),
      usesBackendRequiredHelper: /sendBackendRequired/.test(text) || usesPrompt10RenderBoundary || usesPrompt15ProviderBoundary,
      importsBlockedExecutionService: blockedServiceImports.some((pattern) => pattern.test(text)),
      usesPrompt10RenderBoundary,
      usesPrompt15ProviderBoundary,
    }
  })
}

const existingRouteFiles = routeFiles.filter(fileExists)
const existingRegistryFiles = registryFiles.filter(fileExists)
const blockedImportMatches = scanLines(existingRouteFiles, blockedServiceImports)
const blockedRuntimeMatches = scanFilePatterns(existingRouteFiles, blockedRuntimeCalls)
const routeSecretMatches = scanLines(existingRouteFiles, secretPatterns)
const registrySecretMatches = scanLines(existingRegistryFiles, secretPatterns)
const failClosed = failClosedCoverage(requiredFailClosedFiles)

const registryText = existingRegistryFiles.map(readFile).join('\n')
const hasPrompt7BlockedDomains = /PROMPT7_BLOCKED_EXECUTION_DOMAINS/.test(registryText)
const mockRouterUsesProductionReadiness = /getRouteProductionReadiness/.test(readFile('src/backend/api/mock-api-router.ts'))
const routeHelpersHaveSafeEnvelope = /sendBackendRequired/.test(readFile('server/routes/route-helpers.ts')) &&
  /sendBlocked/.test(readFile('server/routes/route-helpers.ts')) &&
  /requestId/.test(readFile('server/routes/route-helpers.ts'))

const failClosedGaps = failClosed.filter((entry) => !entry.usesBackendRequiredHelper || entry.importsBlockedExecutionService)
const criticalFindings = [
  ...blockedImportMatches,
  ...blockedRuntimeMatches,
  ...routeSecretMatches,
  ...failClosedGaps.map((entry) => ({
    file: entry.file,
    line: 1,
    pattern: 'failClosedCoverage',
    excerpt: JSON.stringify(entry),
  })),
]

if (!hasPrompt7BlockedDomains) {
  criticalFindings.push({
    file: 'src/backend/api/api-route-registry.ts',
    line: 1,
    pattern: 'PROMPT7_BLOCKED_EXECUTION_DOMAINS',
    excerpt: 'Route registry must derive blocked production readiness for execution domains.',
  })
}

if (!mockRouterUsesProductionReadiness) {
  criticalFindings.push({
    file: 'src/backend/api/mock-api-router.ts',
    line: 1,
    pattern: 'getRouteProductionReadiness',
    excerpt: 'Mock router must fail closed for Prompt 7 blocked/future route readiness.',
  })
}

if (!routeHelpersHaveSafeEnvelope) {
  criticalFindings.push({
    file: 'server/routes/route-helpers.ts',
    line: 1,
    pattern: 'safeEnvelopeHelpers',
    excerpt: 'Route helpers must include requestId-aware ok/backend_required/blocked helpers.',
  })
}

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
    deploys: false,
  },
  files: {
    routeFiles: routeFiles.map((file) => ({ path: file, exists: fileExists(file) })),
    registryFiles: registryFiles.map((file) => ({ path: file, exists: fileExists(file) })),
  },
  routeRuntimeGuards: {
    hasPrompt7BlockedDomains,
    mockRouterUsesProductionReadiness,
    routeHelpersHaveSafeEnvelope,
    failClosed,
  },
  summary: {
    routeFilesScanned: existingRouteFiles.length,
    registryFilesScanned: existingRegistryFiles.length,
    blockedImportMatchCount: blockedImportMatches.length,
    blockedRuntimeMatchCount: blockedRuntimeMatches.length,
    routeSecretMatchCount: routeSecretMatches.length,
    registrySecretMentionCount: registrySecretMatches.length,
    failClosedGapCount: failClosedGaps.length,
    criticalFindingCount: criticalFindings.length,
  },
  byFile: {
    blockedImports: summarizeByFile(blockedImportMatches),
    blockedRuntimeCalls: summarizeByFile(blockedRuntimeMatches),
    routeSecrets: summarizeByFile(routeSecretMatches),
    registrySecretMentions: summarizeByFile(registrySecretMatches),
  },
  matches: {
    blockedImports: blockedImportMatches,
    blockedRuntimeCalls: blockedRuntimeMatches,
    routeSecrets: routeSecretMatches,
    registrySecretMentions: registrySecretMatches,
    failClosedGaps,
  },
  recommendation: criticalFindings.length === 0
    ? 'No critical backend API route hardening findings detected. Review registry secret mentions as metadata-only references if present.'
    : 'Critical backend API route hardening findings detected. Blocked route groups must fail closed before continuing.',
}

console.log(JSON.stringify(result, null, 2))

if (criticalFindings.length > 0) {
  process.exitCode = 1
}
