import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const requiredDocs = [
  'docs/worker-runtime/worker-10-controlled-job-claim-lease-noop-execution.md',
  'docs/worker-runtime/worker-10-controlled-job-claim-lease-noop-results.md',
  'docs/worker-runtime/worker-10-job-claim-noop-evidence.md',
  'docs/worker-runtime/worker-10-lease-noop-evidence.md',
  'docs/worker-runtime/worker-10-queue-noop-evidence.md',
  'docs/worker-runtime/worker-10-qa-evidence.md',
  'docs/worker-runtime/worker-10-observability-evidence.md',
  'docs/worker-runtime/worker-10-cleanup-evidence.md',
  'docs/worker-runtime/worker-10-readiness-decision.md',
  'docs/worker-runtime/worker-11-allowed-blocked-scope.md',
  'docs/prompt-worker-10-validation-results.md',
  'docs/implementation-prompts/prompt-worker-10-controlled-job-claim-lease-noop-execution.md',
]

const sourceDocs = [
  'docs/worker-runtime/worker-9-controlled-job-claim-lease-gate-approval-packet.md',
  'docs/worker-runtime/worker-9-approval-decision-record.md',
  'docs/worker-runtime/worker-10-allowed-blocked-scope.md',
  'docs/worker-runtime/worker-8-controlled-noop-qa-review.md',
  'docs/worker-runtime/worker-7-readiness-decision.md',
  'docs/worker-runtime/worker-2-readiness-decision.md',
]

const trackerDocs = [
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/production-beta-readiness-scorecard.md',
]

const expectedFixtureIds = [
  'worker_route_ai_tools_creative_graphics',
  'worker_route_track_a_render_export',
  'worker_route_track_b_media_processing',
  'worker_route_sound_music_audio',
  'worker_route_web_search_capture',
  'worker_route_map_geospatial',
  'worker_route_multi_tool_plan',
]

const expectedEvidenceFiles = [
  '.local-artifacts/worker-runtime/worker-10/worker-10-local-claim-lease-noop/claim-lease-noop-report.json',
  '.local-artifacts/worker-runtime/worker-10/worker-10-local-claim-lease-noop/job-claim-noop-summary.json',
  '.local-artifacts/worker-runtime/worker-10/worker-10-local-claim-lease-noop/lease-noop-summary.json',
  '.local-artifacts/worker-runtime/worker-10/worker-10-local-claim-lease-noop/queue-noop-summary.json',
  '.local-artifacts/worker-runtime/worker-10/worker-10-local-claim-lease-noop/qa-evidence.json',
  '.local-artifacts/worker-runtime/worker-10/worker-10-local-claim-lease-noop/observability-evidence.json',
  '.local-artifacts/worker-runtime/worker-10/worker-10-local-claim-lease-noop/cleanup-evidence.json',
  '.local-artifacts/worker-runtime/worker-10/worker-10-local-claim-lease-noop/checksum-summary.json',
]

const falseBooleanNames = [
  'liveWorkerExecutionApprovedNow',
  'realJobClaimApprovedNow',
  'workerJobClaimApprovedNow',
  'realLeaseMutationApprovedNow',
  'workerLeaseMutationApprovedNow',
  'queueExecutionApprovedNow',
  'routeExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'mediaRuntimeApprovedNow',
  'audioRuntimeApprovedNow',
  'supabaseMutationApprovedNow',
  'publicArtifactsApproved',
  'signedUrlsApproved',
  'rawPromptExecutionApproved',
  'internalBetaApproved',
  'externalBetaApproved',
  'productionApproved',
]

const exactNoScope =
  'No live worker execution, real job claim, real lease mutation, queue execution, route execution, tool execution, provider/model calls, Supabase mutation, SQL, GCS/storage upload, signed URLs, public artifacts, beta/production unlock, dependency mutation, raw prompt execution, or final render/export was enabled.'

function fail(message) {
  console.error(`WORKER-10 controlled claim/lease no-op diagnostic failed: ${message}`)
  process.exit(1)
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8')
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath))
}

for (const relativePath of [...requiredDocs, ...sourceDocs]) {
  if (!existsSync(path.join(root, relativePath))) fail(`missing ${relativePath}`)
}
if (!existsSync(path.join(root, 'docs/worker-runtime/fixtures/worker-route-dry-run-fixtures.json'))) {
  fail('missing worker fixture JSON')
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['worker:runtime-job-claim-lease-noop:execute'] !==
  'node scripts/validation/worker-runtime-job-claim-lease-noop-execution.mjs'
) {
  fail('missing package script worker:runtime-job-claim-lease-noop:execute')
}
if (
  packageJson.scripts?.['worker:runtime-job-claim-lease-noop:diagnostics'] !==
  'node scripts/validation/worker-runtime-job-claim-lease-noop-execution-diagnostics.mjs'
) {
  fail('missing package script worker:runtime-job-claim-lease-noop:diagnostics')
}

const docsText = requiredDocs.map((relativePath) => `${relativePath}\n${read(relativePath)}`).join('\n\n')
const sourceText = sourceDocs.map((relativePath) => `${relativePath}\n${read(relativePath)}`).join('\n\n')

const requiredMarkers = [
  'worker_runtime_controlled_claim_lease_noop_passed_with_warnings',
  'ready_with_warnings_for_worker_11_controlled_job_claim_lease_noop_qa_review',
  'worker-10-local-claim-lease-noop',
  'approved_with_warnings_for_worker_10',
  'futureControlledJobClaimLeaseNoopApproved: true',
  'futureControlledJobClaimLeaseNoopApproved: `true`',
  'worker_runtime_controlled_noop_qa_passed_with_warnings',
  'worker_runtime_controlled_noop_passed_with_warnings',
  'worker_runtime_dry_run_fixture_contract_tests_passed_with_warnings',
  'fixtures processed: `7`',
  'job claim no-op evidence created: `true`',
  'lease no-op evidence created: `true`',
  'queue no-op evidence created: `true`',
  'QA evidence created: `true`',
  'observability evidence created: `true`',
  'cleanup evidence created: `true`',
  'real job claim made: `false`',
  'real lease mutation performed: `false`',
  'queue execution performed: `false`',
  'docs/status only',
  'docs_only',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Supabase milestone sync: `not_performed`',
  'none; controlled job claim/lease no-op execution only',
  'WORKER-11 - Controlled Job Claim/Lease No-Op QA Review',
]

for (const marker of requiredMarkers) {
  if (!docsText.includes(marker)) fail(`missing marker ${marker}`)
}
if (!docsText.includes(exactNoScope)) fail('missing exact no-scope statement')

if (!sourceText.includes('approved_with_warnings_for_worker_10')) fail('source WORKER-9 decision missing')
if (!sourceText.includes('futureControlledJobClaimLeaseNoopApproved: `true`')) {
  fail('source WORKER-9 future approval missing')
}
if (!sourceText.includes('worker_runtime_controlled_noop_qa_passed_with_warnings')) {
  fail('source WORKER-8 QA missing')
}

for (const fixtureId of expectedFixtureIds) {
  if (!docsText.includes(fixtureId)) fail(`missing fixture ${fixtureId}`)
}
for (const evidenceFile of expectedEvidenceFiles) {
  if (!docsText.includes(evidenceFile)) fail(`missing local evidence reference ${evidenceFile}`)
}

const fixtureData = readJson('docs/worker-runtime/fixtures/worker-route-dry-run-fixtures.json')
if (!Array.isArray(fixtureData.fixtures) || fixtureData.fixtures.length !== expectedFixtureIds.length) {
  fail('expected seven worker fixture rows')
}
for (const expectedFixtureId of expectedFixtureIds) {
  const fixture = fixtureData.fixtures.find((candidate) => candidate.fixtureId === expectedFixtureId)
  if (!fixture) fail(`fixture JSON missing ${expectedFixtureId}`)
  for (const fieldName of ['workerJobRef', 'idempotencyKeyRef', 'approvedPlanSnapshotRef', 'scopedToolCallManifestRef']) {
    if (typeof fixture[fieldName] !== 'string' || !/^<[^>]+>$/.test(fixture[fieldName])) {
      fail(`${expectedFixtureId} has unsafe ${fieldName}`)
    }
  }
}

for (const booleanName of falseBooleanNames) {
  const falsePattern = new RegExp(`${booleanName}:\\s+\`false\``)
  const truePattern = new RegExp(`${booleanName}:\\s+\`?true\`?`, 'i')
  if (!falsePattern.test(docsText)) fail(`missing false boolean ${booleanName}`)
  if (truePattern.test(docsText)) fail(`unsafe true boolean ${booleanName}`)
}

const unsafePatterns = [
  [/liveWorkerExecutionApprovedNow:\s+`?true`?/i, 'live worker execution approval'],
  [/realJobClaimApprovedNow:\s+`?true`?/i, 'real job claim approval'],
  [/workerJobClaimApprovedNow:\s+`?true`?/i, 'worker job claim approval'],
  [/realLeaseMutationApprovedNow:\s+`?true`?/i, 'real lease mutation approval'],
  [/workerLeaseMutationApprovedNow:\s+`?true`?/i, 'worker lease mutation approval'],
  [/queueExecutionApprovedNow:\s+`?true`?/i, 'queue execution approval'],
  [/routeExecutionApprovedNow:\s+`?true`?/i, 'route execution approval'],
  [/toolExecutionApprovedNow:\s+`?true`?/i, 'tool execution approval'],
  [/providerRuntimeApprovedNow:\s+`?true`?/i, 'provider runtime approval'],
  [/supabaseMutationApprovedNow:\s+`?true`?/i, 'Supabase mutation approval'],
  [/SQL executed:\s+`?(yes|true|executed|applied)`?/i, 'SQL execution claim'],
  [/Migration deployed:\s+`?(yes|true|deployed|applied)`?/i, 'migration deployment claim'],
  [/Supabase environment touched:\s+`?(staging|production|remote|local)`?/i, 'Supabase environment touch claim'],
  [/gs:\/\//i, 'GCS path'],
  [/supabase\.co/i, 'Supabase URL'],
  [new RegExp(['x-goog-' + 'signature', 'x-amz-' + 'signature', 'x-amz-' + 'credential'].join('|'), 'i'), 'signed URL marker'],
  [new RegExp('BEGIN ' + 'PRIVATE KEY', 'i'), 'private key'],
  [/\b(sk-[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})\b/, 'secret-looking token'],
  [/\/Volumes\/backup\/codex-worktrees\/[^\s`]+\/\.local-artifacts/i, 'absolute local artifact path'],
  [/\/private\/tmp\/[^\s`]+\/\.local-artifacts/i, 'absolute local artifact path'],
]
for (const [pattern, label] of unsafePatterns) {
  if (pattern.test(docsText)) fail(`unsafe claim detected: ${label}`)
}

const runnerText = read('scripts/validation/worker-runtime-job-claim-lease-noop-execution.mjs')
const diagnosticText = read('scripts/validation/worker-runtime-job-claim-lease-noop-execution-diagnostics.mjs')
for (const [text, label, allowed] of [
  [runnerText, 'runner', new Set(['node:fs', 'node:crypto', 'node:path', 'node:url'])],
  [diagnosticText, 'diagnostic', new Set(['node:fs', 'node:path', 'node:url'])],
]) {
  const staticImports = [...text.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1])
  for (const importPath of staticImports) {
    if (!allowed.has(importPath)) fail(`${label} imports forbidden module ${importPath}`)
  }
  const dynamicImports = [...text.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)].map((match) => match[1])
  if (dynamicImports.length > 0) fail(`${label} uses dynamic imports`)
  for (const pattern of [
    /from\s+['"][^'"]*server\/workers/i,
    /from\s+['"][^'"]*server\/routes/i,
    /from\s+['"][^'"]*server\/cli\/run-worker-job/i,
    /from\s+['"][^'"]*tool-registry/i,
    /from\s+['"][^'"]*provider/i,
    /from\s+['"][^'"]*supabase/i,
    /from\s+['"][^'"]*ffmpeg/i,
    /from\s+['"][^'"]*remotion/i,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b/,
    /\bWebSocket\b/,
  ]) {
    if (pattern.test(text.replace(/(['"`])(?:\\.|(?!\1)[\s\S])*\1/g, ''))) {
      fail(`${label} contains forbidden runtime or network usage`)
    }
  }
}

const trackerText = trackerDocs
  .filter((relativePath) => existsSync(path.join(root, relativePath)))
  .map((relativePath) => `${relativePath}\n${read(relativePath)}`)
  .join('\n\n')
if (!trackerText.includes('WORKER-10')) fail('present trackers must reference WORKER-10')
if (!trackerText.includes('worker_runtime_controlled_claim_lease_noop_passed_with_warnings')) {
  fail('present trackers must reference WORKER-10 result')
}
if (!trackerText.includes('ready_with_warnings_for_worker_11_controlled_job_claim_lease_noop_qa_review')) {
  fail('present trackers must reference WORKER-10 readiness')
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'WORKER-10',
  decisionState: 'worker_runtime_controlled_claim_lease_noop_passed_with_warnings',
  readinessDecision: 'ready_with_warnings_for_worker_11_controlled_job_claim_lease_noop_qa_review',
  runId: 'worker-10-local-claim-lease-noop',
  fixturesChecked: expectedFixtureIds.length,
  realJobClaimApprovedNow: false,
  realLeaseMutationApprovedNow: false,
  queueExecutionApprovedNow: false,
  liveWorkerExecutionApprovedNow: false,
  routeExecutionApprovedNow: false,
  toolExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
  supabaseMutationApprovedNow: false,
  publicArtifactsApproved: false,
  signedUrlsApproved: false,
  internalBetaApproved: false,
  externalBetaApproved: false,
  productionApproved: false,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  supabaseMilestoneSync: 'not_performed',
  nextRecommendedPrompt: 'WORKER-11 - Controlled Job Claim/Lease No-Op QA Review',
}, null, 2))
