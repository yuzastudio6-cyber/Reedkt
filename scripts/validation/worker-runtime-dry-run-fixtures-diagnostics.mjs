import { existsSync, readFileSync } from 'node:fs'

const REQUIRED_DOCS = [
  'docs/worker-runtime/worker-2-dry-run-fixture-plan.md',
  'docs/worker-runtime/worker-2-fixture-contract-test-report.md',
  'docs/worker-runtime/worker-2-tool-route-handoff-mapping.md',
  'docs/worker-runtime/worker-2-warning-blocker-register.md',
  'docs/worker-runtime/worker-2-readiness-decision.md',
  'docs/worker-runtime/worker-3-allowed-blocked-scope.md',
  'docs/worker-runtime/fixtures/worker-route-dry-run-fixtures.json',
  'docs/prompt-worker-2-validation-results.md',
  'docs/implementation-prompts/prompt-worker-2-worker-runtime-dry-run-fixture-plan-contract-tests.md',
]

const TRACKER_DOCS = [
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/production-beta-readiness-scorecard.md',
]

const REQUIRED_TERMS = [
  'worker_runtime_dry_run_fixture_contract_tests_passed_with_warnings',
  'ready_with_warnings_for_worker_3_offline_dry_run_approval_packet',
  'tool_route_offline_dry_run_qa_passed_with_warnings',
  'ready_with_warnings_for_worker_route_fixture_integration_plan',
  'workerExecutionApprovedNow: `false`',
  'workerJobClaimApprovedNow: `false`',
  'workerLeaseMutationApprovedNow: `false`',
  'routeExecutionApprovedNow: `false`',
  'toolExecutionApprovedNow: `false`',
  'providerRuntimeApprovedNow: `false`',
  'mediaRuntimeApprovedNow: `false`',
  'audioRuntimeApprovedNow: `false`',
  'supabaseMutationApprovedNow: `false`',
  'gcsUploadApprovedNow: `false`',
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
  'none; worker runtime dry-run fixture plan and contract tests only',
  'server/cli/run-worker-job.ts',
  'server/routes/worker-routes.ts',
  'server/workers/worker-claim-runner.ts',
  'server/services/worker-claim-service.ts',
  'server/workers/worker-gates.ts',
  'No provider call, worker execution',
]

const REQUIRED_FIXTURE_TERMS = [
  'worker_route_ai_tools_creative_graphics',
  'worker_route_track_a_render_export',
  'worker_route_track_b_media_processing',
  'worker_route_sound_music_audio',
  'worker_route_web_search_capture',
  'worker_route_map_geospatial',
  'worker_route_multi_tool_plan',
]

const REQUIRED_SCRIPTS = {
  'worker:runtime-dry-run-fixtures:contract-tests': 'node scripts/validation/worker-runtime-dry-run-fixture-contract-tests.mjs',
  'worker:runtime-dry-run-fixtures:diagnostics': 'node scripts/validation/worker-runtime-dry-run-fixtures-diagnostics.mjs',
}

const FORBIDDEN_DOC_PATTERNS = [
  [/workerExecutionApprovedNow`?:\s*`?true/i, 'worker execution approval'],
  [/workerJobClaimApprovedNow`?:\s*`?true/i, 'worker job claim approval'],
  [/workerLeaseMutationApprovedNow`?:\s*`?true/i, 'worker lease mutation approval'],
  [/routeExecutionApprovedNow`?:\s*`?true/i, 'route execution approval'],
  [/toolExecutionApprovedNow`?:\s*`?true/i, 'tool execution approval'],
  [/providerRuntimeApprovedNow`?:\s*`?true/i, 'provider runtime approval'],
  [/mediaRuntimeApprovedNow`?:\s*`?true/i, 'media runtime approval'],
  [/audioRuntimeApprovedNow`?:\s*`?true/i, 'audio runtime approval'],
  [/supabaseMutationApprovedNow`?:\s*`?true/i, 'Supabase mutation approval'],
  [/gcsUploadApprovedNow`?:\s*`?true/i, 'GCS upload approval'],
  [/publicArtifactsApproved`?:\s*`?true/i, 'public artifact approval'],
  [/signedUrlsApproved`?:\s*`?true/i, 'signed URL approval'],
  [/rawPromptExecutionApproved`?:\s*`?true/i, 'raw prompt approval'],
  [/internalBetaApproved`?:\s*`?true/i, 'internal beta approval'],
  [/externalBetaApproved`?:\s*`?true/i, 'external beta approval'],
  [/productionApproved`?:\s*`?true/i, 'production approval'],
  [/worker job claimed:\s*`?(yes|true|performed|enabled)/i, 'worker job claim claim'],
  [/worker lease mutation:\s*`?(yes|true|performed|enabled)/i, 'worker lease mutation claim'],
  [/route handler import:\s*`?(yes|true|performed|enabled)/i, 'route handler import claim'],
  [/tool runtime import:\s*`?(yes|true|performed|enabled)/i, 'tool runtime import claim'],
  [/SQL executed:\s*`?(yes|true|executed|applied)/i, 'SQL execution claim'],
  [/Migration deployed:\s*`?(yes|true|deployed|applied)/i, 'migration deployed claim'],
  [/Supabase environment touched:\s*`?(staging|production|remote|local)/i, 'Supabase environment touched claim'],
  [/gs:\/\//i, 'real GCS path'],
  [/supabase\.co/i, 'Supabase URL'],
  [/x-goog-signature|x-amz-signature|x-amz-credential|expires=/i, 'signed URL marker'],
  [new RegExp(`BEGIN ${'PRIVATE'} KEY`, 'i'), 'private key'],
  [/\b(sk-[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})\b/, 'secret-like token'],
  [/file:\/\//i, 'file URL'],
]

const FORBIDDEN_RUNNER_IMPORTS = [
  /from\s+['"][^'"]*server\/cli\/run-worker-job/i,
  /from\s+['"][^'"]*server\/routes/i,
  /from\s+['"][^'"]*server\/workers/i,
  /from\s+['"][^'"]*server\/tool-registry/i,
  /from\s+['"][^'"]*provider/i,
  /from\s+['"][^'"]*supabase/i,
  /from\s+['"][^'"]*ffmpeg/i,
  /from\s+['"][^'"]*remotion/i,
  /import\(['"][^'"]*server\/cli\/run-worker-job/i,
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

const combinedDocs = REQUIRED_DOCS.map((filePath) => `${filePath}\n${read(filePath)}`).join('\n\n')
for (const term of [...REQUIRED_TERMS, ...REQUIRED_FIXTURE_TERMS]) {
  assert(combinedDocs.includes(term), `Missing required term: ${term}`)
}
for (const [pattern, label] of FORBIDDEN_DOC_PATTERNS) {
  assert(!pattern.test(combinedDocs), `Forbidden ${label} found in WORKER-2 docs.`)
}

const urls = combinedDocs.match(/https?:\/\/[^\s)`]+/g) || []
for (const url of urls) {
  assert(
    /^https:\/\/github\.com\/yuzastudio6-cyber\/Reedkt\/pull\/\d+$/.test(url),
    `Forbidden non-PR URL found in WORKER-2 docs: ${url}`,
  )
}

const runnerSources = [
  'scripts/validation/worker-runtime-dry-run-fixture-contract-tests.mjs',
  'scripts/validation/worker-runtime-dry-run-fixtures-diagnostics.mjs',
]
for (const filePath of runnerSources) {
  const text = read(filePath)
  for (const pattern of FORBIDDEN_RUNNER_IMPORTS) {
    assert(!pattern.test(text), `${filePath} must not import live worker/route/tool/provider/Supabase/media runtime modules.`)
  }
}

const combinedTrackers = TRACKER_DOCS.map((filePath) => `${filePath}\n${read(filePath)}`).join('\n\n')
assert(combinedTrackers.includes('WORKER-2'), 'Present tracker docs must reference WORKER-2.')
assert(
  combinedTrackers.includes('worker_runtime_dry_run_fixture_contract_tests_passed_with_warnings'),
  'Present tracker docs must include WORKER-2 decision state.',
)
assert(
  combinedTrackers.includes('ready_with_warnings_for_worker_3_offline_dry_run_approval_packet'),
  'Present tracker docs must include WORKER-2 worker readiness state.',
)

console.log(JSON.stringify({
  status: 'passed',
  phase: 'WORKER-2',
  decisionState: 'worker_runtime_dry_run_fixture_contract_tests_passed_with_warnings',
  workerReadinessState: 'ready_with_warnings_for_worker_3_offline_dry_run_approval_packet',
  docsChecked: REQUIRED_DOCS.length,
  fixtureRowsChecked: REQUIRED_FIXTURE_TERMS.length,
  packageScriptsChecked: Object.keys(REQUIRED_SCRIPTS).length,
  workerExecutionApprovedNow: false,
  workerJobClaimApprovedNow: false,
  workerLeaseMutationApprovedNow: false,
  routeExecutionApprovedNow: false,
  toolExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
  mediaRuntimeApprovedNow: false,
  audioRuntimeApprovedNow: false,
  supabaseMutationApprovedNow: false,
  gcsUploadApprovedNow: false,
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
  productionCapabilityEnabled: 'none; worker runtime dry-run fixture plan and contract tests only',
  nextRecommendedPrompt: 'WORKER-3 - Worker Runtime Offline Dry-Run Approval Packet',
}, null, 2))
