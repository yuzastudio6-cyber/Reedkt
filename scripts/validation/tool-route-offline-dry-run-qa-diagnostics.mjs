import { existsSync, readFileSync } from 'node:fs'

const REQUIRED_DOCS = [
  'docs/tool-route-execution/tool-route-5-offline-dry-run-qa-review.md',
  'docs/tool-route-execution/tool-route-5-fixture-acceptance-matrix.md',
  'docs/tool-route-execution/tool-route-5-warning-blocker-register.md',
  'docs/tool-route-execution/tool-route-5-worker-gate-readiness.md',
  'docs/tool-route-execution/tool-route-5-to-worker-handoff-packet.md',
  'docs/tool-route-execution/tool-route-5-cleanup-review.md',
  'docs/tool-route-execution/tool-route-6-allowed-blocked-scope.md',
  'docs/prompt-tool-route-5-validation-results.md',
  'docs/implementation-prompts/prompt-tool-route-5-offline-dry-run-qa-worker-gate-readiness.md',
]

const TRACKER_DOCS = [
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/production-beta-readiness-scorecard.md',
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

const REQUIRED_TERMS = [
  'tool_route_offline_dry_run_qa_passed_with_warnings',
  'ready_with_warnings_for_worker_route_fixture_integration_plan',
  'tool_route_offline_dry_run_passed_with_warnings',
  'approved_with_warnings_for_tool_route_4',
  'futureOfflineDryRunExecutionApproved: `true`',
  'liveRouteExecutionApprovedNow: `false`',
  'liveToolExecutionApprovedNow: `false`',
  'workerExecutionApprovedNow: `false`',
  'providerRuntimeApprovedNow: `false`',
  'mediaRuntimeApprovedNow: `false`',
  'audioRuntimeApprovedNow: `false`',
  'supabaseMutationApprovedNow: `false`',
  'publicArtifactsApproved: `false`',
  'signedUrlsApproved: `false`',
  'rawPromptExecutionApproved: `false`',
  'internalBetaApproved: `false`',
  'externalBetaApproved: `false`',
  'productionApproved: `false`',
  'docs/status only',
  'docs_only',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  '.local-artifacts/tool-route/tool-route-4/tool-route-4-local-static/',
  'PR #386',
  'PR #384',
  'PR #366',
  'CONFLICTING / DIRTY',
  'skipped_ignored_local_artifacts_absent',
  'none; offline tool-route dry-run QA review and worker gate readiness only',
  'No Supabase mutation, SQL execution',
]

const REQUIRED_SCRIPTS = {
  'tool-route:offline-dry-run:qa-review:diagnostics': 'node scripts/validation/tool-route-offline-dry-run-qa-diagnostics.mjs',
  'tool-route:offline-dry-run:diagnostics': 'node scripts/validation/tool-route-offline-dry-run-diagnostics.mjs',
  'tool-route:offline-dry-run-approval:diagnostics': 'node scripts/validation/tool-route-offline-dry-run-approval-diagnostics.mjs',
}

const FORBIDDEN_DOC_PATTERNS = [
  [/liveRouteExecutionApprovedNow`?:\s*`?true/i, 'live route execution approval'],
  [/liveToolExecutionApprovedNow`?:\s*`?true/i, 'live tool execution approval'],
  [/workerExecutionApprovedNow`?:\s*`?true/i, 'worker execution approval'],
  [/providerRuntimeApprovedNow`?:\s*`?true/i, 'provider runtime approval'],
  [/mediaRuntimeApprovedNow`?:\s*`?true/i, 'media runtime approval'],
  [/audioRuntimeApprovedNow`?:\s*`?true/i, 'audio runtime approval'],
  [/supabaseMutationApprovedNow`?:\s*`?true/i, 'Supabase mutation approval'],
  [/publicArtifactsApproved`?:\s*`?true/i, 'public artifact approval'],
  [/signedUrlsApproved`?:\s*`?true/i, 'signed URL approval'],
  [/rawPromptExecutionApproved`?:\s*`?true/i, 'raw prompt approval'],
  [/internalBetaApproved`?:\s*`?true/i, 'internal beta approval'],
  [/externalBetaApproved`?:\s*`?true/i, 'external beta approval'],
  [/productionApproved`?:\s*`?true/i, 'production approval'],
  [/route handler import:\s*`?(yes|true|performed|enabled)/i, 'route handler import claim'],
  [/tool runtime import:\s*`?(yes|true|performed|enabled)/i, 'tool runtime import claim'],
  [/route execution:\s*`?(yes|true|performed|enabled)/i, 'route execution claim'],
  [/tool execution:\s*`?(yes|true|performed|enabled)/i, 'tool execution claim'],
  [/worker execution:\s*`?(yes|true|performed|enabled)/i, 'worker execution claim'],
  [/SQL executed:\s*`?(yes|true|executed|applied)/i, 'SQL execution claim'],
  [/Migration deployed:\s*`?(yes|true|deployed|applied)/i, 'migration deployed claim'],
  [/Supabase environment touched:\s*`?(staging|production|remote|local)/i, 'Supabase environment touched claim'],
  [/gs:\/\//i, 'real GCS path'],
  [/supabase\.co/i, 'Supabase URL'],
  [/x-goog-signature|x-amz-signature|x-amz-credential|expires=/i, 'signed URL marker'],
  [/BEGIN PRIVATE KEY/i, 'private key'],
  [/\b(sk-[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})\b/, 'secret-like token'],
  [/\/Volumes\/backup\/codex-worktrees\/[^\s`]+\/\.local-artifacts/i, 'absolute local artifact path'],
  [/file:\/\//i, 'file URL'],
]

const FORBIDDEN_RUNNER_IMPORTS = [
  /from\s+['"][^'"]*server\/routes/i,
  /from\s+['"][^'"]*server\/workers/i,
  /from\s+['"][^'"]*server\/tool-registry/i,
  /from\s+['"][^'"]*provider/i,
  /from\s+['"][^'"]*supabase/i,
  /from\s+['"][^'"]*ffmpeg/i,
  /from\s+['"][^'"]*remotion/i,
  /import\(['"][^'"]*server\/routes/i,
  /import\(['"][^'"]*server\/workers/i,
  /import\(['"][^'"]*server\/tool-registry/i,
  /import\(['"][^'"]*provider/i,
  /import\(['"][^'"]*supabase/i,
  /import\(['"][^'"]*ffmpeg/i,
  /import\(['"][^'"]*remotion/i,
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(filePath) {
  assert(existsSync(filePath), `Missing required file: ${filePath}`)
  return readFileSync(filePath, 'utf8')
}

function readJson(filePath) {
  return JSON.parse(read(filePath))
}

const packageJson = readJson('package.json')
for (const [scriptName, command] of Object.entries(REQUIRED_SCRIPTS)) {
  assert(packageJson.scripts?.[scriptName] === command, `Missing or changed package script ${scriptName}.`)
}

const gitignore = read('.gitignore')
assert(gitignore.includes('.local-artifacts/'), '.local-artifacts/ must be ignored.')

const combinedDocs = REQUIRED_DOCS.map((filePath) => `${filePath}\n${read(filePath)}`).join('\n\n')
for (const term of REQUIRED_TERMS) {
  assert(combinedDocs.includes(term), `Missing required term: ${term}`)
}
for (const fixture of EXPECTED_FIXTURES) {
  assert(combinedDocs.includes(fixture), `Missing fixture QA review for ${fixture}.`)
}
for (const [pattern, label] of FORBIDDEN_DOC_PATTERNS) {
  assert(!pattern.test(combinedDocs), `Forbidden ${label} found in TOOL-ROUTE-5 docs.`)
}

const urls = combinedDocs.match(/https?:\/\/[^\s)`]+/g) || []
for (const url of urls) {
  assert(
    /^https:\/\/github\.com\/yuzastudio6-cyber\/Reedkt\/pull\/\d+$/.test(url),
    `Forbidden non-PR URL found in TOOL-ROUTE-5 docs: ${url}`,
  )
}

const runnerSources = [
  'scripts/validation/tool-route-offline-dry-run-qa-diagnostics.mjs',
  'scripts/validation/tool-route-offline-dry-run.mjs',
  'scripts/validation/tool-route-offline-dry-run-qa.mjs',
]
for (const filePath of runnerSources) {
  const text = read(filePath)
  for (const pattern of FORBIDDEN_RUNNER_IMPORTS) {
    assert(!pattern.test(text), `${filePath} must not import live route/tool/provider/Supabase/media runtime modules.`)
  }
}

const combinedTrackers = TRACKER_DOCS.map((filePath) => `${filePath}\n${read(filePath)}`).join('\n\n')
assert(combinedTrackers.includes('TOOL-ROUTE-5'), 'Present tracker docs must reference TOOL-ROUTE-5.')
assert(
  combinedTrackers.includes('tool_route_offline_dry_run_qa_passed_with_warnings'),
  'Present tracker docs must include TOOL-ROUTE-5 QA result.',
)
assert(
  combinedTrackers.includes('ready_with_warnings_for_worker_route_fixture_integration_plan'),
  'Present tracker docs must include TOOL-ROUTE-5 worker readiness state.',
)

console.log(JSON.stringify({
  status: 'passed',
  phase: 'TOOL-ROUTE-5',
  qaResult: 'tool_route_offline_dry_run_qa_passed_with_warnings',
  workerReadinessState: 'ready_with_warnings_for_worker_route_fixture_integration_plan',
  docsChecked: REQUIRED_DOCS.length,
  fixturesReviewed: EXPECTED_FIXTURES.length,
  packageScriptsChecked: Object.keys(REQUIRED_SCRIPTS).length,
  futureOfflineDryRunExecutionApproved: true,
  liveRouteExecutionApprovedNow: false,
  liveToolExecutionApprovedNow: false,
  workerExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
  mediaRuntimeApprovedNow: false,
  audioRuntimeApprovedNow: false,
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
  productionCapabilityEnabled: 'none; offline tool-route dry-run QA review and worker gate readiness only',
  nextRecommendedPrompt: 'WORKER-2 - Worker Runtime Dry-Run Fixture Plan / Contract Tests or TOOL-ROUTE-6 - Worker Gate Integration Packet',
}, null, 2))
