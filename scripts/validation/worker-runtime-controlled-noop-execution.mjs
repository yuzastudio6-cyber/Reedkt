import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const runId = 'worker-7-local-noop'
const outputRelativeDir = `.local-artifacts/worker-runtime/worker-7/${runId}`
const outputDir = path.join(root, outputRelativeDir)

const fixturePath = 'docs/worker-runtime/fixtures/worker-route-dry-run-fixtures.json'
const runnerPath = 'scripts/validation/worker-runtime-controlled-noop-execution.mjs'

const expectedFixtureIds = [
  'worker_route_ai_tools_creative_graphics',
  'worker_route_track_a_render_export',
  'worker_route_track_b_media_processing',
  'worker_route_sound_music_audio',
  'worker_route_web_search_capture',
  'worker_route_map_geospatial',
  'worker_route_multi_tool_plan',
]

const placeholderFields = [
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

const requiredExpectedContractChecks = [
  'approved_snapshot_placeholder',
  'scoped_tool_call_manifest_placeholder',
  'artifact_scope_placeholder',
  'qa_observability_cleanup_placeholders',
  'false_approval_booleans',
]

const requiredBlockedUses = [
  'worker_execution',
  'worker_job_claim',
  'route_execution',
  'tool_execution',
  'supabase_mutation',
  'gcs_upload',
  'signed_url_creation',
  'public_artifact_creation',
]

const requiredSourceDocs = [
  {
    path: 'docs/worker-runtime/worker-6-approval-decision-record.md',
    markers: ['approved_with_warnings_for_worker_7', 'futureControlledNoopWorkerExecutionApproved: `true`'],
  },
  {
    path: 'docs/worker-runtime/worker-7-allowed-blocked-scope.md',
    markers: ['WORKER-7 is expected to execute the controlled no-op worker gate', 'Write ignored local/offline evidence'],
  },
  {
    path: 'docs/worker-runtime/worker-5-offline-dry-run-qa-review.md',
    markers: ['worker_runtime_offline_dry_run_qa_passed_with_warnings'],
  },
  {
    path: 'docs/worker-runtime/worker-4-readiness-decision.md',
    markers: ['worker_runtime_offline_dry_run_passed_with_warnings', 'worker-4-local-static'],
  },
  {
    path: 'docs/worker-runtime/worker-2-readiness-decision.md',
    markers: ['worker_runtime_dry_run_fixture_contract_tests_passed_with_warnings'],
  },
]

function fail(message) {
  console.error(`WORKER-7 controlled no-op execution failed: ${message}`)
  process.exit(1)
}

function read(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8')
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath))
}

function sha256Text(text) {
  return createHash('sha256').update(text).digest('hex')
}

function sha256File(relativePath) {
  return sha256Text(read(relativePath))
}

function writeJson(filename, value) {
  const target = path.join(outputDir, filename)
  writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`)
  return path.join(outputRelativeDir, filename)
}

function assertPlaceholder(value, label) {
  if (typeof value !== 'string' || !/^<[A-Z0-9_]+>$/.test(value)) {
    fail(`${label} must be an uppercase placeholder`)
  }
}

function assertSafeString(value, label) {
  const signedUrlPattern = new RegExp(
    ['x-goog-' + 'signature', 'x-amz-' + 'signature', 'x-amz-' + 'credential', 'expires='].join('|'),
    'i',
  )
  if (/https?:\/\//i.test(value)) fail(`${label} contains a real URL`)
  if (/gs:\/\//i.test(value)) fail(`${label} contains a GCS path`)
  if (/file:\/\//i.test(value)) fail(`${label} contains a file URL`)
  if (/supabase\.co/i.test(value)) fail(`${label} contains a Supabase URL`)
  if (signedUrlPattern.test(value)) fail(`${label} contains signed URL markers`)
  if (/\/Volumes\/backup\/codex-worktrees\//i.test(value)) fail(`${label} contains an absolute worktree path`)
  if (/\b(sk-[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})\b/.test(value)) fail(`${label} contains a secret-like token`)
}

function collectStrings(value, out = []) {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, out))
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectStrings(item, out))
  return out
}

function assertFalseBooleans(approvalBooleans) {
  if (!approvalBooleans || typeof approvalBooleans !== 'object') fail('missing approvalBooleans object')
  for (const [key, value] of Object.entries(approvalBooleans)) {
    if (value !== false) fail(`approval boolean ${key} must be false`)
  }
}

function assertNoUnsafeRunnerImports() {
  const runnerText = read(runnerPath)
  const imports = [...runnerText.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1])
  const allowedImports = new Set(['node:fs', 'node:crypto', 'node:path', 'node:url'])
  for (const importPath of imports) {
    if (!allowedImports.has(importPath)) fail(`runner imports non-built-in or unapproved module ${importPath}`)
  }
  const dynamicImports = [...runnerText.matchAll(/import\(\s*['"]([^'"]+)['"]\s*\)/g)].map((match) => match[1])
  for (const importPath of dynamicImports) {
    fail(`runner uses dynamic import ${importPath}`)
  }
  const functionCallPatterns = [
    [/\bfetch\s*\(/, 'fetch'],
    [/\bXMLHttpRequest\b/, 'XMLHttpRequest'],
    [/\bWebSocket\b/, 'WebSocket'],
  ]
  const executableText = runnerText.replace(/(['"`])(?:\\.|(?!\1)[\s\S])*\1/g, '')
  for (const [pattern, label] of functionCallPatterns) {
    if (pattern.test(executableText)) fail(`runner contains forbidden network-capable call ${label}`)
  }
}

assertNoUnsafeRunnerImports()

for (const sourceDoc of requiredSourceDocs) {
  if (!existsSync(path.join(root, sourceDoc.path))) fail(`missing source doc ${sourceDoc.path}`)
  const sourceText = read(sourceDoc.path)
  for (const marker of sourceDoc.markers) {
    if (!sourceText.includes(marker)) fail(`source doc ${sourceDoc.path} missing marker ${marker}`)
  }
}

const fixtureData = readJson(fixturePath)
if (fixtureData.schemaVersion !== 'worker-route-dry-run-fixtures.v1') fail('unexpected fixture schema version')
if (fixtureData.decisionState !== 'worker_runtime_dry_run_fixture_contract_tests_passed_with_warnings') {
  fail('unexpected fixture decision state')
}
assertFalseBooleans(fixtureData.approvalBooleans)

if (!Array.isArray(fixtureData.fixtures) || fixtureData.fixtures.length !== expectedFixtureIds.length) {
  fail('expected seven worker fixture rows')
}

const fixtureIds = fixtureData.fixtures.map((fixture) => fixture.fixtureId)
for (const expectedFixtureId of expectedFixtureIds) {
  if (!fixtureIds.includes(expectedFixtureId)) fail(`missing fixture ${expectedFixtureId}`)
}

for (const value of collectStrings(fixtureData)) assertSafeString(value, 'fixture data')

const fixtureResults = fixtureData.fixtures.map((fixture) => {
  if (!expectedFixtureIds.includes(fixture.fixtureId)) fail(`unexpected fixture ${fixture.fixtureId}`)
  if (!existsSync(path.join(root, fixture.sourceScopedToolCallFixture))) {
    fail(`missing source scoped tool-call fixture ${fixture.sourceScopedToolCallFixture}`)
  }
  if (!/^docs\/tool-route-execution\/fixtures\/[a-z0-9-]+\.scoped-tool-call\.fixture\.json$/.test(fixture.sourceScopedToolCallFixture)) {
    fail(`unsafe source fixture path ${fixture.sourceScopedToolCallFixture}`)
  }

  for (const field of placeholderFields) assertPlaceholder(fixture[field], `${fixture.fixtureId}.${field}`)

  for (const expectedCheck of requiredExpectedContractChecks) {
    if (!fixture.expectedContractChecks?.includes(expectedCheck)) {
      fail(`${fixture.fixtureId} missing expected contract check ${expectedCheck}`)
    }
  }

  for (const blockedUse of requiredBlockedUses) {
    if (!fixture.blockedUses?.includes(blockedUse)) fail(`${fixture.fixtureId} missing blocked use ${blockedUse}`)
  }

  return {
    fixtureId: fixture.fixtureId,
    result: 'passed_with_warnings',
    sourceScopedToolCallFixture: fixture.sourceScopedToolCallFixture,
    approvedPlanSnapshotRef: fixture.approvedPlanSnapshotRef,
    scopedToolCallManifestRef: fixture.scopedToolCallManifestRef,
    workerJobRef: fixture.workerJobRef,
    idempotencyKeyRef: fixture.idempotencyKeyRef,
    privateArtifactManifestRef: fixture.privateArtifactManifestRef,
    checksumRef: fixture.checksumRef,
    qaEvidenceRef: fixture.qaEvidenceRef,
    observabilityEvidenceRef: fixture.observabilityEvidenceRef,
    cleanupEvidenceRef: fixture.cleanupEvidenceRef,
    claimLeaseNoopValidated: true,
    queueNoopValidated: true,
    liveExecutionBooleansFalse: true,
    warning: 'controlled_noop_only_live_runtime_remains_blocked',
  }
})

mkdirSync(outputDir, { recursive: true })

const sharedStatus = {
  runId,
  outputDirectory: outputRelativeDir,
  decisionState: 'worker_runtime_controlled_noop_passed_with_warnings',
  fixturesProcessed: fixtureResults.length,
  fixturesPassed: 0,
  fixturesPassedWithWarnings: fixtureResults.length,
  fixturesBlocked: 0,
  liveWorkerExecutionApprovedNow: false,
  workerJobClaimApprovedNow: false,
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
}

const controlledNoopReport = {
  ...sharedStatus,
  command: 'npm run --silent worker:runtime-controlled-noop:execute',
  sourceFixtureFile: fixturePath,
  sourceEvidence: {
    worker6Decision: 'approved_with_warnings_for_worker_7',
    futureControlledNoopWorkerExecutionApproved: true,
    worker5Qa: 'worker_runtime_offline_dry_run_qa_passed_with_warnings',
    worker4Result: 'worker_runtime_offline_dry_run_passed_with_warnings',
    worker2FixtureContracts: 'worker_runtime_dry_run_fixture_contract_tests_passed_with_warnings',
  },
  fixtures: fixtureResults,
}

const jobPayloadSummary = {
  ...sharedStatus,
  payloadRows: fixtureResults.map((fixture) => ({
    fixtureId: fixture.fixtureId,
    approvedPlanSnapshotRef: fixture.approvedPlanSnapshotRef,
    scopedToolCallManifestRef: fixture.scopedToolCallManifestRef,
    workerJobRef: fixture.workerJobRef,
    idempotencyKeyRef: fixture.idempotencyKeyRef,
    privateArtifactManifestRef: fixture.privateArtifactManifestRef,
    checksumRef: fixture.checksumRef,
    qaEvidenceRef: fixture.qaEvidenceRef,
    observabilityEvidenceRef: fixture.observabilityEvidenceRef,
    cleanupEvidenceRef: fixture.cleanupEvidenceRef,
  })),
}

const claimLeaseSummary = {
  ...sharedStatus,
  realJobClaimMade: false,
  workerLeaseMutationPerformed: false,
  serviceRoleMutationPerformed: false,
  claimLeaseRows: fixtureResults.map((fixture) => ({
    fixtureId: fixture.fixtureId,
    workerJobRef: fixture.workerJobRef,
    idempotencyKeyRef: fixture.idempotencyKeyRef,
    claimPlaceholderValidated: true,
    leasePlaceholderValidated: true,
    retryPolicyPlaceholderDerived: `<RETRY_POLICY_${fixture.fixtureId.toUpperCase()}>`,
  })),
}

const queueSummary = {
  ...sharedStatus,
  queuePushPerformed: false,
  queueConsumePerformed: false,
  queueWorkerRunPerformed: false,
  deadLetterQueueTouched: false,
  queueRows: fixtureResults.map((fixture) => ({
    fixtureId: fixture.fixtureId,
    queuePlaceholderDerived: `<QUEUE_NOOP_${fixture.fixtureId.toUpperCase()}>`,
    retryPolicyPlaceholderDerived: `<RETRY_POLICY_${fixture.fixtureId.toUpperCase()}>`,
  })),
}

const qaEvidence = {
  ...sharedStatus,
  fixtureValidationResult: 'passed_with_warnings',
  payloadValidationResult: 'passed_with_warnings',
  noWorkerRuntimeImportProof: true,
  noJobClaimProof: true,
  noLeaseMutationProof: true,
  noQueueExecutionProof: true,
  noRouteToolProviderRuntimeProof: true,
  noSupabaseMutationProof: true,
  noPublicArtifactProof: true,
  noSignedUrlProof: true,
  blockedUseValidation: 'passed',
}

const observabilityEvidence = {
  ...sharedStatus,
  localExecutionScope: 'controlled_noop_fixture_validation_only',
  commandsRun: ['npm run --silent worker:runtime-controlled-noop:execute'],
  filesInspected: [fixturePath, ...requiredSourceDocs.map((sourceDoc) => sourceDoc.path)],
  networkCallsMade: false,
  supabaseCallsMade: false,
  gcsCallsMade: false,
  providerModelCallsMade: false,
  routeToolWorkerRuntimeCallsMade: false,
}

const cleanupEvidence = {
  ...sharedStatus,
  cleanupPerformed: false,
  evidencePreserved: true,
  localOutputDirectory: outputRelativeDir,
  gcsCleanupNeeded: false,
  signedUrlCleanupNeeded: false,
  publicArtifactCleanupNeeded: false,
  supabaseCleanupNeeded: false,
  queueCleanupNeeded: false,
}

const writtenFiles = [
  writeJson('controlled-noop-report.json', controlledNoopReport),
  writeJson('job-payload-noop-summary.json', jobPayloadSummary),
  writeJson('claim-lease-noop-summary.json', claimLeaseSummary),
  writeJson('queue-noop-summary.json', queueSummary),
  writeJson('qa-evidence.json', qaEvidence),
  writeJson('observability-evidence.json', observabilityEvidence),
  writeJson('cleanup-evidence.json', cleanupEvidence),
]

const checksumSummary = {
  runId,
  sourceFixtureFile: fixturePath,
  sourceFixtureSha256: sha256File(fixturePath),
  outputFiles: writtenFiles.map((relativePath) => ({
    path: relativePath,
    sha256: sha256File(relativePath),
  })),
}
const checksumPath = writeJson('checksum-summary.json', checksumSummary)

console.log(JSON.stringify({
  status: 'passed',
  decisionState: sharedStatus.decisionState,
  runId,
  outputDirectory: outputRelativeDir,
  fixturesProcessed: sharedStatus.fixturesProcessed,
  fixturesPassedWithWarnings: sharedStatus.fixturesPassedWithWarnings,
  localEvidenceFiles: [...writtenFiles, checksumPath],
  liveWorkerExecutionApprovedNow: false,
  workerJobClaimApprovedNow: false,
  workerLeaseMutationApprovedNow: false,
  queueExecutionApprovedNow: false,
  routeExecutionApprovedNow: false,
  toolExecutionApprovedNow: false,
  providerRuntimeApprovedNow: false,
  supabaseMutationApprovedNow: false,
}, null, 2))
