import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const FIXTURE_DIR = 'docs/tool-route-execution/fixtures'
const DEFAULT_RUN_ID = 'tool-route-4-local-static'

const EXPECTED_FIXTURES = [
  'ai-tools-creative-graphics.scoped-tool-call.fixture.json',
  'track-a-render-export.scoped-tool-call.fixture.json',
  'track-b-media-processing.scoped-tool-call.fixture.json',
  'sound-music-audio.scoped-tool-call.fixture.json',
  'web-search-capture.scoped-tool-call.fixture.json',
  'map-geospatial.scoped-tool-call.fixture.json',
  'multi-tool-plan.scoped-tool-call.fixture.json',
]

const SOURCE_DOCS = [
  'docs/tool-route-execution/tool-route-3-source-evidence-lockfile.md',
  'docs/tool-route-execution/tool-route-3-approval-decision-record.md',
  'docs/tool-route-execution/tool-route-3-qa-observability-requirements.md',
  'docs/tool-route-execution/tool-route-3-cleanup-rollback-plan.md',
  'docs/tool-route-execution/tool-route-4-allowed-blocked-scope.md',
  'docs/tool-route-execution/tool-route-2a-post-refresh-contract-test-results.md',
  'docs/tool-route-execution/tool-route-2-readiness-decision.md',
  'docs/tool-route-execution/tool-route-1a-fixture-refresh-results.md',
  'docs/tool-route-execution/tool-route-1-scoped-tool-call-manifest-contract.md',
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

const UNSAFE_FIXTURE_PATTERNS = [
  [/https?:\/\//i, 'real URL'],
  [/gs:\/\//i, 'real GCS path'],
  [/supabase\.co/i, 'Supabase URL'],
  [/postgres(?:ql)?:\/\//i, 'database URL'],
  [/x-goog-signature|x-amz-signature|x-amz-credential|expires=/i, 'signed URL marker'],
  [/\b(sk-[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})\b/, 'secret-like token'],
  [/BEGIN PRIVATE KEY/i, 'private key'],
]

const APPROVAL_BOOLEANS = {
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
}

function argValue(name, fallback) {
  const index = process.argv.indexOf(name)
  if (index === -1) return fallback
  return process.argv[index + 1] || fallback
}

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

function sha256(text) {
  return createHash('sha256').update(text).digest('hex')
}

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function validateSourceDocs() {
  const combined = SOURCE_DOCS.map((filePath) => `${filePath}\n${read(filePath)}`).join('\n\n')
  const requiredTerms = [
    'approved_with_warnings_for_tool_route_4',
    'futureOfflineDryRunExecutionApproved: `true`',
    'liveRouteExecutionApprovedNow: `false`',
    'liveToolExecutionApprovedNow: `false`',
    'workerExecutionApprovedNow: `false`',
    'providerRuntimeApprovedNow: `false`',
    'mediaRuntimeApprovedNow: `false`',
    'audioRuntimeApprovedNow: `false`',
    'supabaseMutationApprovedNow: `false`',
    'PR #366',
    'CONFLICTING / DIRTY',
    'tool_route_offline_contract_tests_passed_with_warnings_after_sound_refresh',
  ]
  for (const term of requiredTerms) {
    assert(combined.includes(term), `Missing required source evidence term: ${term}`)
  }
}

function validateFixture(fileName) {
  const filePath = path.join(FIXTURE_DIR, fileName)
  const text = read(filePath)
  for (const [pattern, label] of UNSAFE_FIXTURE_PATTERNS) {
    assert(!pattern.test(text), `Forbidden ${label} found in ${filePath}`)
  }

  const fixture = JSON.parse(text)
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

  for (const field of REQUIRED_ARRAY_FIELDS) {
    assert(Array.isArray(fixture[field]) && fixture[field].length > 0, `${field} must be a populated array in ${filePath}`)
  }

  for (const blockedUse of REQUIRED_BLOCKED_USES) {
    assert(fixture.blockedUses.includes(blockedUse), `Missing blocked use ${blockedUse} in ${filePath}`)
  }

  for (const flag of REQUIRED_FALSE_FLAGS) {
    assert(fixture[flag] === false, `${flag} must be false in ${filePath}`)
  }

  assert(fixture.noRawPromptExecution === true, `noRawPromptExecution must be true in ${filePath}`)
  assert(fixture.noSignedUrlSourceOfTruth === true, `noSignedUrlSourceOfTruth must be true in ${filePath}`)
  assert(fixture.noPublicArtifact === true, `noPublicArtifact must be true in ${filePath}`)
  assert(fixture.noSupabaseMutation === true, `noSupabaseMutation must be true in ${filePath}`)
  assert(fixture.supabaseUpdateRequired === 'docs/status only', `Supabase update required mismatch in ${filePath}`)
  assert(fixture.supabaseUpdateStatus === 'docs_only', `Supabase update status mismatch in ${filePath}`)
  assert(fixture.supabaseEnvironmentTouched === 'none', `Supabase environment touched mismatch in ${filePath}`)
  assert(fixture.sqlExecuted === 'none', `SQL executed mismatch in ${filePath}`)
  assert(fixture.migrationDeployed === 'no', `Migration deployed mismatch in ${filePath}`)

  if (fileName === 'sound-music-audio.scoped-tool-call.fixture.json' || fileName === 'multi-tool-plan.scoped-tool-call.fixture.json') {
    assert(text.includes('PR_371_SOUND_MUSIC_AUDIO_owner_study_merged'), `${filePath} must reference merged PR #371 Sound evidence.`)
    assert(text.includes('SOUND_MUSIC_AUDIO.timing_aware_sound_cue_manifest'), `${filePath} must include timing-aware Sound capability.`)
    assert(!text.includes('PR_360_SOUND_MUSIC_AUDIO_owner_study'), `${filePath} must not use stale PR #360 Sound evidence.`)
  }

  return {
    fixtureFile: fileName,
    fixtureId: fixture.fixtureId,
    manifestId: fixture.manifestId,
    targetOwnerWorkstream: fixture.targetOwnerWorkstream,
    planSnapshotId: fixture.planSnapshotId,
    ownerStudyRefs: fixture.sourceOwnerStudyRefs,
    capabilityRefs: fixture.capabilityRefs,
    selectedToolRefs: fixture.selectedToolRefs,
    routeRefs: fixture.routeRefs,
    blockedUses: fixture.blockedUses,
    sourceChecksumSha256: sha256(text),
    result: 'offline_dry_run_passed_with_warnings',
    warnings: [
      'offline_static_fixture_only',
      'live_route_tool_worker_provider_supabase_runtime_blocked',
      'branch_stack_warning_pr_366_open_draft_conflicting',
    ],
  }
}

function checksumFile(filePath) {
  return sha256(read(filePath))
}

validateSourceDocs()
assert(existsSync(FIXTURE_DIR), `Missing fixture directory: ${FIXTURE_DIR}`)

const runId = argValue('--run-id', process.env.TOOL_ROUTE_4_RUN_ID || DEFAULT_RUN_ID)
const outputDirectory = argValue('--output-dir', path.join('.local-artifacts', 'tool-route', 'tool-route-4', runId))
mkdirSync(outputDirectory, { recursive: true })

const fixtureResults = EXPECTED_FIXTURES.map(validateFixture)
const generatedAt = new Date().toISOString()

const report = {
  status: 'passed',
  phase: 'TOOL-ROUTE-4',
  decisionState: 'tool_route_offline_dry_run_passed_with_warnings',
  runId,
  generatedAt,
  outputDirectory,
  fixturesChecked: EXPECTED_FIXTURES.length,
  fixturesPassedWithWarnings: fixtureResults.length,
  sourceEvidence: {
    toolRoute3Decision: 'approved_with_warnings_for_tool_route_4',
    futureOfflineDryRunExecutionApproved: true,
    toolRoute2aState: 'tool_route_offline_contract_tests_passed_with_warnings_after_sound_refresh',
    pr384: 'TOOL-ROUTE-3 draft approval packet evidence',
    pr366Warning: 'OPEN / draft / CONFLICTING / DIRTY',
  },
  approvalBooleans: APPROVAL_BOOLEANS,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  milestoneSync: 'not_performed',
  productionCapabilityEnabled: 'none; offline tool-route dry-run execution only',
  noScope: 'No route execution, tool execution, worker execution, provider/model runtime, route handler import, tool runtime import, media/audio processing, browser capture, map rendering, Supabase mutation, SQL, GCS upload/storage transfer, signed URLs, public artifacts, dependency mutation, raw prompt execution, final render/export, beta unlock, or production unlock was enabled.',
  fixtureResults,
}

const manifestSummary = {
  status: 'passed',
  runId,
  generatedAt,
  manifestCount: fixtureResults.length,
  manifests: fixtureResults.map((result) => ({
    fixtureFile: result.fixtureFile,
    fixtureId: result.fixtureId,
    manifestId: result.manifestId,
    targetOwnerWorkstream: result.targetOwnerWorkstream,
    planSnapshotId: result.planSnapshotId,
    capabilityRefCount: result.capabilityRefs.length,
    routeRefCount: result.routeRefs.length,
    selectedToolRefCount: result.selectedToolRefs.length,
    blockedUseCount: result.blockedUses.length,
    result: result.result,
  })),
}

const qaEvidence = {
  status: 'passed_with_warnings',
  runId,
  generatedAt,
  qaChecks: [
    'all_seven_fixtures_loaded',
    'placeholder_plan_snapshot_refs_verified',
    'false_approval_booleans_verified',
    'blocked_uses_verified',
    'sound_pr_371_refresh_verified',
    'stale_pr_360_sound_ref_absent',
    'no_runtime_import_or_execution_performed',
  ],
  warnings: [
    'offline_evidence_only',
    'pr_366_open_draft_conflicting',
    'live_route_tool_worker_provider_supabase_media_audio_beta_production_remain_blocked',
  ],
}

const observabilityEvidence = {
  status: 'passed_with_warnings',
  runId,
  generatedAt,
  correlationId: `<CORRELATION_ID_PLACEHOLDER_${runId}>`,
  routeDryRunId: `<ROUTE_DRY_RUN_ID_PLACEHOLDER_${runId}>`,
  eventLog: fixtureResults.map((result) => ({
    eventType: 'offline_fixture_validated',
    fixtureId: result.fixtureId,
    manifestId: result.manifestId,
    result: result.result,
  })),
  redactionStatus: 'no_secrets_private_urls_signed_urls_or_public_artifacts_recorded',
}

const cleanupEvidence = {
  status: 'passed_with_warnings',
  runId,
  generatedAt,
  localOutputDirectory: outputDirectory,
  committedArtifacts: 'none_from_local_artifacts',
  cleanupRequired: false,
  cleanupRationale: 'Only ignored local/offline JSON evidence was written; committed docs summarize sanitized relative paths.',
}

const outputFiles = {
  report: path.join(outputDirectory, 'offline-dry-run-report.json'),
  manifestSummary: path.join(outputDirectory, 'scoped-manifest-summary.json'),
  qaEvidence: path.join(outputDirectory, 'qa-evidence.json'),
  observabilityEvidence: path.join(outputDirectory, 'observability-evidence.json'),
  cleanupEvidence: path.join(outputDirectory, 'cleanup-evidence.json'),
  checksumSummary: path.join(outputDirectory, 'checksum-summary.json'),
}

writeJson(outputFiles.report, report)
writeJson(outputFiles.manifestSummary, manifestSummary)
writeJson(outputFiles.qaEvidence, qaEvidence)
writeJson(outputFiles.observabilityEvidence, observabilityEvidence)
writeJson(outputFiles.cleanupEvidence, cleanupEvidence)

const checksumSummary = {
  status: 'passed',
  runId,
  generatedAt,
  sourceFixtureChecksums: fixtureResults.map((result) => ({
    fixtureFile: result.fixtureFile,
    sha256: result.sourceChecksumSha256,
  })),
  localEvidenceChecksums: Object.entries(outputFiles)
    .filter(([key]) => key !== 'checksumSummary')
    .map(([key, filePath]) => ({
      artifact: key,
      path: filePath,
      sha256: checksumFile(filePath),
    })),
}

writeJson(outputFiles.checksumSummary, checksumSummary)

console.log(JSON.stringify({
  status: 'passed',
  phase: 'TOOL-ROUTE-4',
  decisionState: 'tool_route_offline_dry_run_passed_with_warnings',
  runId,
  outputDirectory,
  fixturesChecked: fixtureResults.length,
  localEvidenceFiles: Object.values(outputFiles),
  ...APPROVAL_BOOLEANS,
  supabaseUpdateRequired: 'docs/status only',
  supabaseUpdateStatus: 'docs_only',
  supabaseEnvironmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  nextRecommendedPrompt: 'TOOL-ROUTE-5 - Offline Tool Route Dry-Run QA Review / Worker Gate Readiness Packet',
}, null, 2))
