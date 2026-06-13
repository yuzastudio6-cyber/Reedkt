import { existsSync, readFileSync } from 'node:fs'

const REQUIRED_DOCS = [
  'docs/tool-route-execution/tool-route-2-offline-contract-test-execution.md',
  'docs/tool-route-execution/tool-route-2-fixture-validation-results.md',
  'docs/tool-route-execution/tool-route-2-contract-test-report.md',
  'docs/tool-route-execution/tool-route-2-warning-blocker-register.md',
  'docs/tool-route-execution/tool-route-2-readiness-decision.md',
  'docs/tool-route-execution/tool-route-3-allowed-blocked-scope.md',
  'docs/prompt-tool-route-2-validation-results.md',
  'docs/implementation-prompts/prompt-tool-route-2-offline-contract-test-execution.md',
]

const REQUIRED_TERMS = [
  'tool_route_offline_contract_tests_passed_with_warnings',
  'TOOL_ROUTE_EXECUTION',
  'PR #360',
  'PR #366',
  'PR #368',
  'routeExecutionApprovedNow: `false`',
  'toolExecutionApprovedNow: `false`',
  'workerExecutionApprovedNow: `false`',
  'providerRuntimeApprovedNow: `false`',
  'supabaseMutationApprovedNow: `false`',
  'publicArtifactsApproved: `false`',
  'signedUrlsApproved: `false`',
  'rawPromptExecutionApproved: `false`',
  'internalBetaApproved: `false`',
  'externalBetaApproved: `false`',
  'productionApproved: `false`',
  'docs/status only',
  'docs_only',
  'environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'none; offline tool-route contract tests only',
  'No Supabase mutation, SQL execution',
]

const EXPECTED_FIXTURES = [
  'ai-tools-creative-graphics.scoped-tool-call.fixture.json',
  'track-a-render-export.scoped-tool-call.fixture.json',
  'track-b-media-processing.scoped-tool-call.fixture.json',
  'sound-music-audio.scoped-tool-call.fixture.json',
  'web-search-capture.scoped-tool-call.fixture.json',
  'map-geospatial.scoped-tool-call.fixture.json',
  'multi-tool-plan.scoped-tool-call.fixture.json',
]

const FORBIDDEN_PATTERNS = [
  [/routeExecutionApprovedNow`?:\s*`?true/i, 'route execution approval'],
  [/toolExecutionApprovedNow`?:\s*`?true/i, 'tool execution approval'],
  [/workerExecutionApprovedNow`?:\s*`?true/i, 'worker execution approval'],
  [/providerRuntimeApprovedNow`?:\s*`?true/i, 'provider runtime approval'],
  [/supabaseMutationApprovedNow`?:\s*`?true/i, 'Supabase mutation approval'],
  [/publicArtifactsApproved`?:\s*`?true/i, 'public artifact approval'],
  [/signedUrlsApproved`?:\s*`?true/i, 'signed URL approval'],
  [/rawPromptExecutionApproved`?:\s*`?true/i, 'raw prompt approval'],
  [/internalBetaApproved`?:\s*`?true/i, 'internal beta approval'],
  [/externalBetaApproved`?:\s*`?true/i, 'external beta approval'],
  [/productionApproved`?:\s*`?true/i, 'production approval'],
  [/SQL executed:\s*`?(yes|true|executed|applied)/i, 'SQL execution claim'],
  [/Migration deployed:\s*`?(yes|true|deployed|applied)/i, 'migration deployed claim'],
  [/Supabase environment touched:\s*`?(staging|production|remote|local)/i, 'Supabase environment touched claim'],
  [/route handler import:\s*`?(yes|true|performed|enabled)/i, 'route handler import claim'],
  [/tool runtime import:\s*`?(yes|true|performed|enabled)/i, 'tool runtime import claim'],
  [/public artifact creation:\s*`?(yes|true|approved)/i, 'public artifact creation claim'],
  [/signed URL creation:\s*`?(yes|true|approved)/i, 'signed URL creation claim'],
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
  packageJson.scripts?.['tool-route:offline-contract-tests'] ===
    'node scripts/validation/tool-route-offline-contract-tests.mjs',
  'Missing package script tool-route:offline-contract-tests.',
)
assert(
  packageJson.scripts?.['tool-route:offline-contract-test:diagnostics'] ===
    'node scripts/validation/tool-route-offline-contract-test-diagnostics.mjs',
  'Missing package script tool-route:offline-contract-test:diagnostics.',
)

const combined = REQUIRED_DOCS.map((filePath) => `${filePath}\n${read(filePath)}`).join('\n\n')

for (const term of REQUIRED_TERMS) {
  assert(combined.includes(term), `Missing required term: ${term}`)
}

for (const fixture of EXPECTED_FIXTURES) {
  assert(combined.includes(fixture), `Missing fixture reference: ${fixture}`)
}

for (const [pattern, label] of FORBIDDEN_PATTERNS) {
  assert(!pattern.test(combined), `Forbidden ${label} found in TOOL-ROUTE-2 docs.`)
}

assert(!combined.includes('route handler import proof: failed'), 'Route handler import proof must not fail.')
assert(!combined.includes('tool runtime import proof: failed'), 'Tool runtime import proof must not fail.')

console.log(JSON.stringify({
  status: 'passed',
  phase: 'TOOL-ROUTE-2',
  decisionState: 'tool_route_offline_contract_tests_passed_with_warnings',
  docsChecked: REQUIRED_DOCS.length,
  fixturesReferenced: EXPECTED_FIXTURES.length,
  routeExecutionApprovedNow: false,
  toolExecutionApprovedNow: false,
  workerExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
  supabaseMutationApprovedNow: false,
  publicArtifactsApproved: false,
  signedUrlsApproved: false,
  rawPromptExecutionApproved: false,
  internalBetaApproved: false,
  externalBetaApproved: false,
  productionApproved: false,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  productionCapabilityEnabled: 'none; offline tool-route contract tests only',
  nextRecommendedPrompt: 'TOOL-ROUTE-3 - Offline Tool Route Dry-Run Approval Packet',
}, null, 2))
