import { existsSync, readFileSync } from 'node:fs'

const FIXTURE_FILE = 'docs/worker-runtime/fixtures/worker-route-dry-run-fixtures.json'
const EXPECTED_SOURCE_FIXTURES = [
  'docs/tool-route-execution/fixtures/ai-tools-creative-graphics.scoped-tool-call.fixture.json',
  'docs/tool-route-execution/fixtures/track-a-render-export.scoped-tool-call.fixture.json',
  'docs/tool-route-execution/fixtures/track-b-media-processing.scoped-tool-call.fixture.json',
  'docs/tool-route-execution/fixtures/sound-music-audio.scoped-tool-call.fixture.json',
  'docs/tool-route-execution/fixtures/web-search-capture.scoped-tool-call.fixture.json',
  'docs/tool-route-execution/fixtures/map-geospatial.scoped-tool-call.fixture.json',
  'docs/tool-route-execution/fixtures/multi-tool-plan.scoped-tool-call.fixture.json',
]

const REQUIRED_PLACEHOLDER_FIELDS = [
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

const REQUIRED_BLOCKED_USES = [
  'worker_execution',
  'worker_job_claim',
  'route_execution',
  'tool_execution',
  'supabase_mutation',
  'gcs_upload',
  'signed_url_creation',
  'public_artifact_creation',
]

const REQUIRED_FALSE_BOOLEANS = [
  'workerExecutionApprovedNow',
  'workerJobClaimApprovedNow',
  'workerLeaseMutationApprovedNow',
  'routeExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'mediaRuntimeApprovedNow',
  'audioRuntimeApprovedNow',
  'supabaseMutationApprovedNow',
  'gcsUploadApprovedNow',
  'publicArtifactsApproved',
  'signedUrlsApproved',
  'rawPromptExecutionApproved',
  'internalBetaApproved',
  'externalBetaApproved',
  'productionApproved',
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

function isPlaceholder(value) {
  return typeof value === 'string' && /^<[A-Z0-9_]+>$/.test(value)
}

const manifest = readJson(FIXTURE_FILE)

assert(manifest.schemaVersion === 'worker-route-dry-run-fixtures.v1', 'Unexpected worker fixture schema version.')
assert(manifest.decisionState === 'worker_runtime_dry_run_fixture_contract_tests_passed_with_warnings', 'Unexpected decision state.')
assert(manifest.workerReadinessState === 'ready_with_warnings_for_worker_3_offline_dry_run_approval_packet', 'Unexpected worker readiness state.')
assert(Array.isArray(manifest.fixtures), 'fixtures must be an array.')
assert(manifest.fixtures.length === 7, 'Expected seven worker route fixtures.')

for (const flag of REQUIRED_FALSE_BOOLEANS) {
  assert(manifest.approvalBooleans?.[flag] === false, `${flag} must be false in top-level approval booleans.`)
}

const sourceFixtureSet = new Set()
for (const fixture of manifest.fixtures) {
  assert(typeof fixture.fixtureId === 'string' && fixture.fixtureId.startsWith('worker_route_'), 'Worker fixture id must use worker_route_ prefix.')
  assert(EXPECTED_SOURCE_FIXTURES.includes(fixture.sourceScopedToolCallFixture), `Unexpected source fixture: ${fixture.sourceScopedToolCallFixture}`)
  assert(existsSync(fixture.sourceScopedToolCallFixture), `Missing source scoped tool-call fixture: ${fixture.sourceScopedToolCallFixture}`)
  sourceFixtureSet.add(fixture.sourceScopedToolCallFixture)

  for (const field of REQUIRED_PLACEHOLDER_FIELDS) {
    assert(isPlaceholder(fixture[field]), `${fixture.fixtureId} field ${field} must be a placeholder token.`)
  }
  assert(Array.isArray(fixture.expectedContractChecks) && fixture.expectedContractChecks.length >= 5, `${fixture.fixtureId} must include expected contract checks.`)
  assert(Array.isArray(fixture.blockedUses), `${fixture.fixtureId} blockedUses must be an array.`)
  for (const blockedUse of REQUIRED_BLOCKED_USES) {
    assert(fixture.blockedUses.includes(blockedUse), `${fixture.fixtureId} missing blocked use ${blockedUse}.`)
  }
}

for (const expectedFixture of EXPECTED_SOURCE_FIXTURES) {
  assert(sourceFixtureSet.has(expectedFixture), `Missing worker mapping for ${expectedFixture}.`)
}

console.log(JSON.stringify({
  status: 'passed',
  phase: 'WORKER-2',
  decisionState: manifest.decisionState,
  workerReadinessState: manifest.workerReadinessState,
  fixturesChecked: manifest.fixtures.length,
  sourceScopedToolCallFixturesChecked: sourceFixtureSet.size,
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
  nextRecommendedPrompt: 'WORKER-3 - Worker Runtime Offline Dry-Run Approval Packet',
}, null, 2))
