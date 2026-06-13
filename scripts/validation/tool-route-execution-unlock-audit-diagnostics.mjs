import { existsSync, readFileSync } from 'node:fs'

const REQUIRED_DOCS = [
  'docs/tool-route-execution/tool-route-execution-unlock-repo-audit.md',
  'docs/tool-route-execution/tool-route-source-inventory.md',
  'docs/tool-route-execution/owner-study-gate-review.md',
  'docs/tool-route-execution/plan-snapshot-to-tool-route-contract.md',
  'docs/tool-route-execution/tool-route-dispatch-boundary.md',
  'docs/tool-route-execution/tool-route-service-role-boundary.md',
  'docs/tool-route-execution/tool-route-artifact-boundary.md',
  'docs/tool-route-execution/tool-route-observability-qa-boundary.md',
  'docs/tool-route-execution/tool-route-unlock-readiness-matrix.md',
  'docs/tool-route-execution/tool-route-1-allowed-blocked-scope.md',
  'docs/prompt-tool-route-execution-unlock-0-validation-results.md',
  'docs/implementation-prompts/prompt-tool-route-execution-unlock-0-repo-audit.md',
]

const REQUIRED_TERMS = [
  'ready_with_warnings_for_tool_route_1',
  'TOOL_ROUTE_EXECUTION',
  'AI_TOOLS_CREATIVE_GRAPHICS',
  'TRACK_A_RENDER_EXPORT',
  'TRACK_B_MEDIA_PROCESSING',
  'SOUND_MUSIC_AUDIO',
  'WEB_SEARCH_CAPTURE',
  'MAP_GEOSPATIAL',
  'approvedPlanSnapshotId',
  'scopedToolCallManifestId',
  'workerClaimId',
  'idempotencyKey',
  'correlationId',
  'Supabase row + private GCS path + manifest + checksum + approved plan snapshot',
  'docs/status only',
  'docs_only',
  'environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Production capability enabled: `none; tool-route execution unlock repo audit only`',
]

const REQUIRED_SOURCE_PATHS = [
  'server/routes/worker-routes.ts',
  'server/routes/provider-gateway-routes.ts',
  'server/routes/render-routes.ts',
  'server/routes/job-routes.ts',
  'server/routes/route-helpers.ts',
  'server/cli/run-worker-job.ts',
  'server/workers/worker-claim-runner.ts',
  'server/workers/worker-gates.ts',
  'server/workers/worker-runtime.ts',
  'src/backend/contracts/tool-execution-contracts.ts',
  'src/backend/contracts/tool-artifact-contracts.ts',
  'server/tool-registry/tool-runtime-policy.ts',
  'server/security-review/tool-execution-security-policy.ts',
  'server/observability/worker-event-observability.ts',
]

const REQUIRED_FALSE_FLAGS = [
  'routeExecutionApproved',
  'toolExecutionApproved',
  'workerExecutionApproved',
  'providerModelRuntimeApproved',
  'supabaseMutationApproved',
  'publicArtifactsApproved',
  'signedUrlsApproved',
  'internalBetaApproved',
  'externalBetaApproved',
  'productionApproved',
]

const FORBIDDEN_PATTERNS = [
  [/routeExecutionApproved`?:\s*`?true/i, 'route execution approved'],
  [/toolExecutionApproved`?:\s*`?true/i, 'tool execution approved'],
  [/workerExecutionApproved`?:\s*`?true/i, 'worker execution approved'],
  [/providerModelRuntimeApproved`?:\s*`?true/i, 'provider/model runtime approved'],
  [/supabaseMutationApproved`?:\s*`?true/i, 'Supabase mutation approved'],
  [/publicArtifactsApproved`?:\s*`?true/i, 'public artifacts approved'],
  [/signedUrlsApproved`?:\s*`?true/i, 'signed URLs approved'],
  [/internalBetaApproved`?:\s*`?true/i, 'internal beta approved'],
  [/externalBetaApproved`?:\s*`?true/i, 'external beta approved'],
  [/productionApproved`?:\s*`?true/i, 'production approved'],
  [/route execution approved:\s*`?true/i, 'route execution approved prose'],
  [/tool execution approved:\s*`?true/i, 'tool execution approved prose'],
  [/worker execution approved:\s*`?true/i, 'worker execution approved prose'],
  [/SQL executed:\s*`?(yes|true|executed|applied)/i, 'SQL execution claim'],
  [/Migration deployed:\s*`?(yes|true|deployed|applied)/i, 'migration deployed claim'],
  [/Supabase environment touched:\s*`?(staging|production|remote|local)/i, 'Supabase environment touched claim'],
  [/signed URL creation:\s*`?(yes|true|approved)/i, 'signed URL creation claim'],
  [/public artifact creation:\s*`?(yes|true|approved)/i, 'public artifact creation claim'],
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(filePath) {
  assert(existsSync(filePath), `Missing required file: ${filePath}`)
  return readFileSync(filePath, 'utf8')
}

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['tool-route:execution-unlock:audit:diagnostics'] ===
    'node scripts/validation/tool-route-execution-unlock-audit-diagnostics.mjs',
  'Missing package script tool-route:execution-unlock:audit:diagnostics.',
)

for (const sourcePath of REQUIRED_SOURCE_PATHS) {
  assert(existsSync(sourcePath), `Missing inventoried source path: ${sourcePath}`)
}

const combined = REQUIRED_DOCS.map((filePath) => `${filePath}\n${read(filePath)}`).join('\n\n')

for (const term of REQUIRED_TERMS) {
  assert(combined.includes(term), `Missing required term: ${term}`)
}

for (const flag of REQUIRED_FALSE_FLAGS) {
  const falsePattern = new RegExp(flag + '[`]?\\s*:\\s*[`]?false', 'i')
  assert(falsePattern.test(combined), `Missing false approval flag: ${flag}`)
}

for (const [pattern, label] of FORBIDDEN_PATTERNS) {
  assert(!pattern.test(combined), `Forbidden ${label} found in audit docs.`)
}

assert(!combined.includes('raw prompt execution approved: `true`'), 'Raw prompt execution must not be approved.')
assert(!combined.includes('broad service-role handler was enabled. yes'), 'Broad service-role handler must not be enabled.')
assert(combined.includes('No Supabase mutation, SQL execution'), 'Exact no-scope statement is missing.')

console.log(JSON.stringify({
  status: 'passed',
  phase: 'tool-route-execution-unlock-0',
  toolRouteUnlockReadinessState: 'ready_with_warnings_for_tool_route_1',
  docsChecked: REQUIRED_DOCS.length,
  sourcePathsChecked: REQUIRED_SOURCE_PATHS.length,
  routeExecutionApproved: false,
  toolExecutionApproved: false,
  workerExecutionApproved: false,
  providerModelRuntimeApproved: false,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; tool-route execution unlock repo audit only',
  nextRecommendedPrompt: 'TOOL-ROUTE-1 - Tool Route Dry-Run Fixture Plan / Contract Tests',
}, null, 2))
