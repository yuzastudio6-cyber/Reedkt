import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const requiredDocs = [
  'docs/worker-runtime/worker-9-controlled-job-claim-lease-gate-approval-packet.md',
  'docs/worker-runtime/worker-9-source-evidence-lockfile.md',
  'docs/worker-runtime/worker-9-approval-decision-record.md',
  'docs/worker-runtime/worker-9-job-claim-lease-safety-policy.md',
  'docs/worker-runtime/worker-9-future-command-template.md',
  'docs/worker-runtime/worker-9-qa-observability-requirements.md',
  'docs/worker-runtime/worker-9-cleanup-rollback-plan.md',
  'docs/worker-runtime/worker-10-allowed-blocked-scope.md',
  'docs/prompt-worker-9-validation-results.md',
  'docs/implementation-prompts/prompt-worker-9-controlled-job-claim-lease-gate-approval-packet.md',
]

const sourceDocs = [
  'docs/worker-runtime/worker-8-controlled-noop-qa-review.md',
  'docs/worker-runtime/worker-8-fixture-acceptance-matrix.md',
  'docs/worker-runtime/worker-8-warning-blocker-register.md',
  'docs/worker-runtime/worker-7-controlled-noop-worker-gate-execution.md',
  'docs/worker-runtime/worker-7-readiness-decision.md',
  'docs/worker-runtime/worker-6-approval-decision-record.md',
  'docs/worker-runtime/worker-5-offline-dry-run-qa-review.md',
  'docs/worker-runtime/worker-4-readiness-decision.md',
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
  'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, real job claim, worker lease mutation, queue execution, route execution, route handler import, tool runtime import, worker runtime import, browser capture, map rendering, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, media/audio processing, audio generation, SFX/music generation, FFmpeg/FFprobe execution, DeepFilterNet execution, Demucs execution, controlled no-op rerun, controlled claim/lease execution, or broad service-role handler was enabled.'

const requiredMarkers = [
  'approved_with_warnings_for_worker_10',
  'futureControlledJobClaimLeaseNoopApproved: `true`',
  'WORKER-0',
  'WORKER-1',
  'WORKER-2',
  'WORKER-3',
  'WORKER-4',
  'WORKER-5',
  'WORKER-6',
  'WORKER-7',
  'WORKER-8',
  'TOOL-ROUTE-0',
  'TOOL-ROUTE-1',
  'TOOL-ROUTE-1A',
  'TOOL-ROUTE-2',
  'TOOL-ROUTE-2A',
  'TOOL-ROUTE-3',
  'TOOL-ROUTE-4',
  'TOOL-ROUTE-5',
  'PR #360',
  'PR #371',
  'PR #410',
  'PLAN-SNAPSHOT',
  'MODEL-DRYRUN-2A',
  'docs/worker-runtime/fixtures/worker-route-dry-run-fixtures.json',
  'worker:runtime-job-claim-lease-approval:diagnostics',
  'worker_runtime_controlled_noop_qa_passed_with_warnings',
  'ready_with_warnings_for_worker_9_controlled_job_claim_lease_gate_plan',
  'worker_runtime_controlled_noop_passed_with_warnings',
  'worker_runtime_offline_dry_run_qa_passed_with_warnings',
  'worker_runtime_offline_dry_run_passed_with_warnings',
  'worker_runtime_dry_run_fixture_contract_tests_passed_with_warnings',
  'DO NOT RUN UNTIL WORKER-10 EXECUTION APPROVAL EXISTS.',
  '<WORKER_10_RUN_ID>',
  '<WORKER_FIXTURE_DIR>',
  '<OFFLINE_CLAIM_LEASE_OUTPUT_DIR>',
  '<WORKER_JOB_PAYLOAD_FIXTURE>',
  '<CLAIM_LEASE_NOOP_FIXTURE>',
  'docs/status only',
  'docs_only',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Supabase milestone sync: `not_performed`',
  'none; controlled job claim/lease gate approval packet only',
  'WORKER-10 - Controlled Job Claim/Lease No-Op Execution',
]

function fail(message) {
  console.error(`WORKER-9 job claim/lease approval diagnostic failed: ${message}`)
  process.exit(1)
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8')
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath))
}

for (const relativePath of requiredDocs) {
  if (!existsSync(path.join(root, relativePath))) fail(`missing required doc ${relativePath}`)
}
for (const relativePath of sourceDocs) {
  if (!existsSync(path.join(root, relativePath))) fail(`missing source doc ${relativePath}`)
}
if (!existsSync(path.join(root, 'docs/worker-runtime/fixtures/worker-route-dry-run-fixtures.json'))) {
  fail('missing worker fixture JSON')
}

const packageJson = readJson('package.json')
if (
  packageJson.scripts?.['worker:runtime-job-claim-lease-approval:diagnostics'] !==
  'node scripts/validation/worker-runtime-job-claim-lease-approval-diagnostics.mjs'
) {
  fail('missing package script worker:runtime-job-claim-lease-approval:diagnostics')
}

const docsText = requiredDocs.map((relativePath) => `${relativePath}\n${read(relativePath)}`).join('\n\n')
const sourceText = sourceDocs.map((relativePath) => `${relativePath}\n${read(relativePath)}`).join('\n\n')

for (const marker of requiredMarkers) {
  if (!docsText.includes(marker)) fail(`missing marker ${marker}`)
}
if (!docsText.includes(exactNoScope)) fail('missing exact no-scope statement')

if (!sourceText.includes('worker_runtime_controlled_noop_qa_passed_with_warnings')) {
  fail('source WORKER-8 docs do not record expected QA result')
}
if (!sourceText.includes('ready_with_warnings_for_worker_9_controlled_job_claim_lease_gate_plan')) {
  fail('source WORKER-8 docs do not record expected readiness')
}
if (!sourceText.includes('worker_runtime_controlled_noop_passed_with_warnings')) {
  fail('source WORKER-7 docs do not record expected controlled no-op result')
}

const decisionDoc = read('docs/worker-runtime/worker-9-approval-decision-record.md')
const allowedDecisionStates = [
  'approved_with_warnings_for_worker_10',
  'blocked_pending_worker_8_dependency_validation',
  'blocked_pending_worker_9_approval_fixes',
]
if (!allowedDecisionStates.some((state) => decisionDoc.includes(`decisionState: \`${state}\``))) {
  fail('approval decision record does not use an allowed decision state')
}

if (!decisionDoc.includes('futureControlledJobClaimLeaseNoopApproved: `true`')) {
  fail('expected futureControlledJobClaimLeaseNoopApproved true in approval record')
}

for (const booleanName of falseBooleanNames) {
  const falsePattern = new RegExp(`${booleanName}:\\s+\`false\``)
  const truePattern = new RegExp(`${booleanName}:\\s+\`?true\`?`, 'i')
  if (!falsePattern.test(docsText)) fail(`missing false boolean ${booleanName}`)
  if (truePattern.test(docsText)) fail(`unsafe true boolean ${booleanName}`)
}

const fixtureData = readJson('docs/worker-runtime/fixtures/worker-route-dry-run-fixtures.json')
if (!Array.isArray(fixtureData.fixtures) || fixtureData.fixtures.length !== expectedFixtureIds.length) {
  fail('expected seven worker fixture rows')
}

for (const expectedFixtureId of expectedFixtureIds) {
  const fixture = fixtureData.fixtures.find((candidate) => candidate.fixtureId === expectedFixtureId)
  if (!fixture) fail(`fixture JSON missing ${expectedFixtureId}`)
  if (!docsText.includes(expectedFixtureId)) fail(`docs missing fixture ${expectedFixtureId}`)
  const requiredFixtureFields = [
    'approvedPlanSnapshotRef',
    'scopedToolCallManifestRef',
    'workerJobRef',
    'idempotencyKeyRef',
    'privateArtifactManifestRef',
    'checksumRef',
    'qaEvidenceRef',
    'observabilityEvidenceRef',
    'cleanupEvidenceRef',
  ]
  for (const fieldName of requiredFixtureFields) {
    if (typeof fixture[fieldName] !== 'string' || !/^<[^>]+>$/.test(fixture[fieldName])) {
      fail(`${expectedFixtureId} has unsafe or missing placeholder field ${fieldName}`)
    }
  }
  if (!Array.isArray(fixture.blockedUses) || fixture.blockedUses.length === 0) {
    fail(`${expectedFixtureId} missing blocked uses`)
  }
  const blockedUses = fixture.blockedUses.join(' ')
  for (const blockedUse of ['worker_execution', 'worker_job_claim', 'route_execution', 'tool_execution', 'supabase_mutation', 'signed_url_creation', 'public_artifact_creation']) {
    if (!blockedUses.includes(blockedUse)) fail(`${expectedFixtureId} missing blocked use ${blockedUse}`)
  }
}

const commandTemplate = read('docs/worker-runtime/worker-9-future-command-template.md')
const commandBlocks = commandTemplate.match(/```sh[\s\S]*?```/g) ?? []
if (commandBlocks.length < 1) fail('expected at least one shell command block')
for (const block of commandBlocks) {
  const count = (block.match(/DO NOT RUN UNTIL WORKER-10 EXECUTION APPROVAL EXISTS\./g) ?? []).length
  if (count !== 1) fail('each command block must include exactly one WORKER-10 warning')
}
const allowedPlaceholders = new Set([
  'WORKER_10_RUN_ID',
  'WORKER_FIXTURE_DIR',
  'OFFLINE_CLAIM_LEASE_OUTPUT_DIR',
  'WORKER_JOB_PAYLOAD_FIXTURE',
  'CLAIM_LEASE_NOOP_FIXTURE',
])
const placeholders = [...commandTemplate.matchAll(/<([^>]+)>/g)].map((match) => match[1])
for (const placeholder of placeholders) {
  if (!allowedPlaceholders.has(placeholder)) fail(`unexpected command placeholder ${placeholder}`)
}

const unsafeDocPatterns = [
  [/controlled claim\/lease execution:\s*`?(yes|true|performed|enabled|complete)/i, 'controlled claim/lease execution claim'],
  [/controlled no-op rerun:\s*`?(yes|true|performed|enabled|complete)/i, 'controlled no-op rerun claim'],
  [/live worker execution approved:\s*`?(true|yes|enabled)/i, 'live worker execution approval'],
  [/real job claim approved:\s*`?(true|yes|enabled)/i, 'real job claim approval'],
  [/worker job claim approved:\s*`?(true|yes|enabled)/i, 'worker job claim approval'],
  [/worker lease mutation approved:\s*`?(true|yes|enabled)/i, 'worker lease mutation approval'],
  [/queue execution approved:\s*`?(true|yes|enabled)/i, 'queue execution approval'],
  [/route execution approved:\s*`?(true|yes|enabled)/i, 'route execution approval'],
  [/tool execution approved:\s*`?(true|yes|enabled)/i, 'tool execution approval'],
  [/provider runtime approved:\s*`?(true|yes|enabled)/i, 'provider runtime approval'],
  [/SQL executed:\s*`?(yes|true|executed|applied)/i, 'SQL execution claim'],
  [/Migration deployed:\s*`?(yes|true|deployed|applied)/i, 'migration deployment claim'],
  [/Supabase environment touched:\s*`?(staging|production|remote|local)/i, 'Supabase environment touch claim'],
  [/gs:\/\//i, 'real GCS path'],
  [/supabase\.co/i, 'Supabase URL'],
  [new RegExp(['x-goog-' + 'signature', 'x-amz-' + 'signature', 'x-amz-' + 'credential', 'expires='].join('|'), 'i'), 'signed URL marker'],
  [/file:\/\//i, 'file URL'],
  [new RegExp('BEGIN ' + 'PRIVATE KEY', 'i'), 'private key'],
  [/\b(sk-[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})\b/, 'secret-like token'],
  [/\/Volumes\/backup\/codex-worktrees\/[^\s`]+\/\.local-artifacts/i, 'absolute local artifact path'],
  [/\/private\/tmp\/[^\s`]+\/\.local-artifacts/i, 'absolute local artifact path'],
]

for (const [pattern, label] of unsafeDocPatterns) {
  if (pattern.test(docsText)) fail(`unsafe claim detected: ${label}`)
}

const runnerText = read('scripts/validation/worker-runtime-job-claim-lease-approval-diagnostics.mjs')
const staticImports = [...runnerText.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1])
const allowedImports = new Set(['node:fs', 'node:path', 'node:url'])
for (const importPath of staticImports) {
  if (!allowedImports.has(importPath)) fail(`diagnostic imports forbidden module ${importPath}`)
}
const dynamicImports = [...runnerText.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)].map((match) => match[1])
if (dynamicImports.length > 0) fail('diagnostic uses dynamic imports')

const forbiddenRuntimeImportPatterns = [
  /from\s+['"][^'"]*server\/cli\/run-worker-job/i,
  /from\s+['"][^'"]*server\/routes/i,
  /from\s+['"][^'"]*server\/workers/i,
  /from\s+['"][^'"]*server\/tool-registry/i,
  /from\s+['"][^'"]*provider/i,
  /from\s+['"][^'"]*supabase/i,
  /from\s+['"][^'"]*ffmpeg/i,
  /from\s+['"][^'"]*remotion/i,
]
for (const pattern of forbiddenRuntimeImportPatterns) {
  if (pattern.test(runnerText)) fail('diagnostic imports a forbidden runtime module')
}

const trackerText = trackerDocs
  .filter((relativePath) => existsSync(path.join(root, relativePath)))
  .map((relativePath) => `${relativePath}\n${read(relativePath)}`)
  .join('\n\n')
if (!trackerText.includes('WORKER-9')) fail('present trackers must reference WORKER-9')
if (!trackerText.includes('approved_with_warnings_for_worker_10')) {
  fail('present trackers must reference WORKER-9 decision state')
}
if (!trackerText.includes('futureControlledJobClaimLeaseNoopApproved')) {
  fail('present trackers must reference the future claim/lease approval')
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'WORKER-9',
  decisionState: 'approved_with_warnings_for_worker_10',
  futureControlledJobClaimLeaseNoopApproved: true,
  fixturesChecked: expectedFixtureIds.length,
  liveWorkerExecutionApprovedNow: false,
  realJobClaimApprovedNow: false,
  workerJobClaimApprovedNow: false,
  realLeaseMutationApprovedNow: false,
  workerLeaseMutationApprovedNow: false,
  queueExecutionApprovedNow: false,
  routeExecutionApprovedNow: false,
  toolExecutionApprovedNow: false,
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
  supabaseMilestoneSync: 'not_performed',
  productionCapabilityEnabled: 'none; controlled job claim/lease gate approval packet only',
  nextRecommendedPrompt: 'WORKER-10 - Controlled Job Claim/Lease No-Op Execution',
}, null, 2))
