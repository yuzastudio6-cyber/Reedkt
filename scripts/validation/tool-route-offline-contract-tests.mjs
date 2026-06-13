import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const FIXTURE_DIR = 'docs/tool-route-execution/fixtures'

const EXPECTED_FIXTURES = [
  'ai-tools-creative-graphics.scoped-tool-call.fixture.json',
  'track-a-render-export.scoped-tool-call.fixture.json',
  'track-b-media-processing.scoped-tool-call.fixture.json',
  'sound-music-audio.scoped-tool-call.fixture.json',
  'web-search-capture.scoped-tool-call.fixture.json',
  'map-geospatial.scoped-tool-call.fixture.json',
  'multi-tool-plan.scoped-tool-call.fixture.json',
]

const REQUIRED_ARRAY_FIELDS = [
  'sourceOwnerStudyRefs',
  'capabilityRefs',
  'requestedCapabilities',
  'selectedToolRefs',
  'editIntentRefs',
  'routeRefs',
  'inputArtifactRefs',
  'outputArtifactScopes',
  'privateArtifactManifestRefs',
  'checksumRequirements',
  'QARequirements',
  'observabilityRequirements',
  'blockedUses',
]

const REQUIRED_FALSE_FLAGS = [
  'routeExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'supabaseMutationApprovedNow',
  'publicArtifactsApproved',
  'signedUrlsApproved',
  'rawPromptExecutionApproved',
  'internalBetaApproved',
  'externalBetaApproved',
  'productionApproved',
]

const REQUIRED_BLOCKED_USES = [
  'raw_prompt_execution',
  'route_execution',
  'tool_execution',
  'worker_execution',
  'provider_model_runtime',
  'signed_url_as_source_of_truth',
  'public_artifact',
  'supabase_mutation',
  'storage_transfer',
  'internal_beta_unlock',
  'external_beta_unlock',
  'production_unlock',
]

const REQUIRED_BASE_DOCS = [
  'docs/tool-route-execution/tool-route-1-dry-run-fixture-plan.md',
  'docs/tool-route-execution/tool-route-1-scoped-tool-call-manifest-contract.md',
  'docs/tool-route-execution/tool-route-1-contract-test-plan.md',
  'docs/tool-route-execution/tool-route-1-dry-run-readiness-matrix.md',
  'docs/prompt-tool-route-1-validation-results.md',
]

const UNSAFE_TEXT_PATTERNS = [
  [/https?:\/\//i, 'real URL'],
  [/gs:\/\//i, 'real GCS path'],
  [/supabase\.co/i, 'Supabase URL'],
  [/postgres(?:ql)?:\/\//i, 'database URL'],
  [/x-goog-signature|x-amz-signature|x-amz-credential|expires=/i, 'signed URL marker'],
  [/\b(sk-[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})\b/, 'secret-like token'],
  [/BEGIN PRIVATE KEY/i, 'private key'],
]

const LIVE_IMPORT_PATTERNS = [
  /from\s+['"][^'"]*server\/routes/i,
  /from\s+['"][^'"]*server\/workers/i,
  /from\s+['"][^'"]*server\/tool-registry/i,
  /from\s+['"][^'"]*src\/backend\/contracts\/tool-execution-contracts/i,
  /import\(['"][^'"]*server\/routes/i,
  /import\(['"][^'"]*server\/workers/i,
  /import\(['"][^'"]*server\/tool-registry/i,
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

function validateArray(fixture, field, filePath) {
  assert(Array.isArray(fixture[field]), `${field} must be an array in ${filePath}`)
  assert(fixture[field].length > 0, `${field} must not be empty in ${filePath}`)
}

assert(existsSync(FIXTURE_DIR), `Missing fixture directory: ${FIXTURE_DIR}`)

for (const docPath of REQUIRED_BASE_DOCS) {
  read(docPath)
}

const results = []

for (const fileName of EXPECTED_FIXTURES) {
  const filePath = path.join(FIXTURE_DIR, fileName)
  const text = read(filePath)
  const fixture = JSON.parse(text)
  const warnings = []

  for (const [pattern, label] of UNSAFE_TEXT_PATTERNS) {
    assert(!pattern.test(text), `Forbidden ${label} found in ${filePath}`)
  }

  assert(typeof fixture.manifestId === 'string' && fixture.manifestId.length > 0, `manifestId missing in ${filePath}`)
  assert(typeof fixture.fixtureId === 'string' && fixture.fixtureId.length > 0, `fixtureId missing in ${filePath}`)
  assert(fixture.ownerWorkstream === 'TOOL_ROUTE_EXECUTION', `ownerWorkstream mismatch in ${filePath}`)
  assert(
    typeof fixture.planSnapshotId === 'string' &&
      fixture.planSnapshotId.startsWith('<APPROVED_PLAN_SNAPSHOT_PLACEHOLDER_') &&
      fixture.planSnapshotId.endsWith('>'),
    `planSnapshotId must be an approved snapshot placeholder in ${filePath}`,
  )
  assert(
    typeof fixture.workerJobRef === 'string' && fixture.workerJobRef.startsWith('<WORKER_JOB_REF_PLACEHOLDER_'),
    `workerJobRef must be a worker placeholder in ${filePath}`,
  )
  assert(
    typeof fixture.selectedToolMix === 'string' && fixture.selectedToolMix.length > 0,
    `selectedToolMix missing in ${filePath}`,
  )

  for (const field of REQUIRED_ARRAY_FIELDS) {
    validateArray(fixture, field, filePath)
  }

  for (const blockedUse of REQUIRED_BLOCKED_USES) {
    assert(fixture.blockedUses.includes(blockedUse), `Missing blocked use ${blockedUse} in ${filePath}`)
  }

  assert(fixture.noRawPromptExecution === true, `noRawPromptExecution must be true in ${filePath}`)
  assert(fixture.noSignedUrlSourceOfTruth === true, `noSignedUrlSourceOfTruth must be true in ${filePath}`)
  assert(fixture.noPublicArtifact === true, `noPublicArtifact must be true in ${filePath}`)
  assert(fixture.noSupabaseMutation === true, `noSupabaseMutation must be true in ${filePath}`)

  for (const flag of REQUIRED_FALSE_FLAGS) {
    assert(fixture[flag] === false, `${flag} must be false in ${filePath}`)
  }

  assert(fixture.supabaseUpdateRequired === 'docs/status only', `Supabase update required mismatch in ${filePath}`)
  assert(fixture.supabaseUpdateStatus === 'docs_only', `Supabase update status mismatch in ${filePath}`)
  assert(fixture.supabaseEnvironmentTouched === 'none', `Supabase environment touched mismatch in ${filePath}`)
  assert(fixture.sqlExecuted === 'none', `SQL executed mismatch in ${filePath}`)
  assert(fixture.migrationDeployed === 'no', `Migration deployed mismatch in ${filePath}`)

  if (fixture.approvalState !== 'dry_run_fixture_plan_only') {
    warnings.push(`Unexpected approvalState ${fixture.approvalState}`)
  }

  results.push({
    fixture: fileName,
    ownerStudyRefsPresent: fixture.sourceOwnerStudyRefs.length > 0,
    planSnapshotIdPlaceholderPresent: true,
    capabilityRefsPresent: fixture.capabilityRefs.length > 0,
    selectedToolRefsOrMixPresent: fixture.selectedToolRefs.length > 0 || Boolean(fixture.selectedToolMix),
    routeRefsPresent: fixture.routeRefs.length > 0,
    artifactScopesPresent: fixture.outputArtifactScopes.length > 0,
    qaRequirementsPresent: fixture.QARequirements.length > 0,
    observabilityRequirementsPresent: fixture.observabilityRequirements.length > 0,
    requiredBooleansFalse: REQUIRED_FALSE_FLAGS.every((flag) => fixture[flag] === false),
    blockedUsesPresent: REQUIRED_BLOCKED_USES.every((blockedUse) => fixture.blockedUses.includes(blockedUse)),
    result: warnings.length === 0 ? 'passed' : 'passed_with_warnings',
    warnings,
  })
}

const scriptText = read('scripts/validation/tool-route-offline-contract-tests.mjs')
for (const pattern of LIVE_IMPORT_PATTERNS) {
  assert(!pattern.test(scriptText), 'Offline contract test runner must not import live route/tool/worker modules.')
}

const failed = results.filter((result) => result.result === 'failed' || result.result === 'blocked')
assert(failed.length === 0, `Fixture validation failed: ${failed.map((result) => result.fixture).join(', ')}`)

console.log(JSON.stringify({
  status: 'passed',
  phase: 'TOOL-ROUTE-2',
  decisionState: 'tool_route_offline_contract_tests_passed_with_warnings',
  fixturesChecked: EXPECTED_FIXTURES.length,
  fixturesPassed: results.filter((result) => result.result === 'passed').length,
  fixturesPassedWithWarnings: results.filter((result) => result.result === 'passed_with_warnings').length,
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
  results,
}, null, 2))
