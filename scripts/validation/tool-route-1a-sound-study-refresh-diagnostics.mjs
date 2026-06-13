import { existsSync, readFileSync } from 'node:fs'

const MERGE_SHA = 'f6283e63742d6999910d3887482dc3112da1e570'

const REQUIRED_DOCS = [
  'docs/tool-route-execution/tool-route-1a-sound-study-refresh.md',
  'docs/tool-route-execution/tool-route-1a-fixture-refresh-results.md',
  'docs/prompt-tool-route-1a-validation-results.md',
  'docs/tool-route-execution/tool-route-1-dry-run-fixture-plan.md',
  'docs/tool-route-execution/tool-route-1-synthetic-plan-snapshot-fixtures.md',
  'docs/tool-route-execution/tool-route-1-capability-to-route-map.md',
  'docs/tool-route-execution/tool-route-1-dry-run-readiness-matrix.md',
  'docs/tool-route-execution/owner-study-gate-review.md',
]

const SOUND_FIXTURE = 'docs/tool-route-execution/fixtures/sound-music-audio.scoped-tool-call.fixture.json'
const MULTI_FIXTURE = 'docs/tool-route-execution/fixtures/multi-tool-plan.scoped-tool-call.fixture.json'

const REQUIRED_SOUND_CAPABILITIES = [
  'SOUND_MUSIC_AUDIO.timing_aware_sound_cue_manifest',
  'SOUND_MUSIC_AUDIO.sound_effects_planning',
  'SOUND_MUSIC_AUDIO.music_cue_planning',
  'SOUND_MUSIC_AUDIO.audio_bed_planning',
  'SOUND_MUSIC_AUDIO.private_audio_artifact_manifest_policy',
  'SOUND_MUSIC_AUDIO.track_b_audio_processing_handoff',
  'SOUND_MUSIC_AUDIO.track_a_final_composition_handoff',
  'SOUND_MUSIC_AUDIO.provider_gateway_future_audio_generation_handoff',
]

const REQUIRED_SOUND_BLOCKED_USES = [
  'raw_prompt_execution',
  'route_execution',
  'tool_execution',
  'worker_execution',
  'provider_model_runtime',
  'media_processing',
  'audio_processing',
  'audio_generation',
  'sfx_music_generation',
  'ffmpeg_ffprobe_execution',
  'deepfilternet_runtime',
  'demucs_runtime',
  'provider_audio_generation',
  'signed_url_as_source_of_truth',
  'public_artifact',
  'supabase_mutation',
  'storage_transfer',
  'internal_beta_unlock',
  'external_beta_unlock',
  'production_unlock',
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

const REQUIRED_DOC_TERMS = [
  'sound_music_audio_refs_refreshed_after_pr_371',
  'ready_with_warnings_for_tool_route_2',
  'PR #371',
  MERGE_SHA,
  'SOUND_MUSIC_AUDIO',
  'Supabase update required: `docs/status only`',
  'Supabase update status: `docs_only`',
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'No Supabase mutation, SQL execution',
]

const DOC_FORBIDDEN_PATTERNS = [
  [/route execution approved:\s*`?true/i, 'route execution approval'],
  [/tool execution approved:\s*`?true/i, 'tool execution approval'],
  [/worker execution approved:\s*`?true/i, 'worker execution approval'],
  [/provider\/model runtime approved:\s*`?true/i, 'provider/model approval'],
  [/Supabase mutation approved:\s*`?true/i, 'Supabase mutation approval'],
  [/Public artifacts approved:\s*`?true/i, 'public artifact approval'],
  [/Signed URLs approved:\s*`?true/i, 'signed URL approval'],
  [/Raw prompt execution approved:\s*`?true/i, 'raw prompt execution approval'],
  [/Internal beta approved:\s*`?true/i, 'internal beta approval'],
  [/External beta approved:\s*`?true/i, 'external beta approval'],
  [/Production approved:\s*`?true/i, 'production approval'],
  [/SQL executed:\s*`?(yes|true|executed|applied)/i, 'SQL execution claim'],
  [/Migration deployed:\s*`?(yes|true|deployed|applied)/i, 'migration deployment claim'],
  [/Supabase environment touched:\s*`?(staging|production|remote|local)/i, 'Supabase environment touch claim'],
]

const FIXTURE_FORBIDDEN_PATTERNS = [
  [/PR_360_SOUND_MUSIC_AUDIO_owner_study/, 'stale Sound PR #360 owner-study ref'],
  [/SOUND_MUSIC_AUDIO\.timing_audio_metadata_planning/, 'stale Sound timing audio metadata capability'],
  [/https?:\/\//i, 'real URL'],
  [/gs:\/\//i, 'real GCS path'],
  [/supabase\.co/i, 'Supabase URL'],
  [/x-goog-signature|x-amz-signature|x-amz-credential|expires=/i, 'signed URL marker'],
  [/service[_-]?role/i, 'service-role marker'],
  [/postgres(?:ql)?:\/\//i, 'database URL'],
  [/BEGIN PRIVATE KEY/i, 'private key'],
  [/\b(sk-[A-Za-z0-9]{20,}|AIza[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16})\b/, 'secret-like token'],
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

function assertArrayIncludes(values, requiredValue, label) {
  assert(Array.isArray(values), `${label} must be an array`)
  assert(values.includes(requiredValue), `${label} missing ${requiredValue}`)
}

const packageJson = readJson('package.json')
assert(
  packageJson.scripts?.['tool-route:1a-sound-refresh:diagnostics'] ===
    'node scripts/validation/tool-route-1a-sound-study-refresh-diagnostics.mjs',
  'Missing package script tool-route:1a-sound-refresh:diagnostics.',
)

const combinedDocs = REQUIRED_DOCS.map((filePath) => `${filePath}\n${read(filePath)}`).join('\n\n')

for (const term of REQUIRED_DOC_TERMS) {
  assert(combinedDocs.includes(term), `Missing required doc term: ${term}`)
}

for (const [pattern, label] of DOC_FORBIDDEN_PATTERNS) {
  assert(!pattern.test(combinedDocs), `Forbidden ${label} found in TOOL-ROUTE-1A docs.`)
}

for (const fixturePath of [SOUND_FIXTURE, MULTI_FIXTURE]) {
  const text = read(fixturePath)
  for (const [pattern, label] of FIXTURE_FORBIDDEN_PATTERNS) {
    assert(!pattern.test(text), `Forbidden ${label} found in ${fixturePath}`)
  }
}

const soundFixture = readJson(SOUND_FIXTURE)
const multiFixture = readJson(MULTI_FIXTURE)

for (const fixture of [soundFixture, multiFixture]) {
  assertArrayIncludes(fixture.sourceOwnerStudyRefs, 'PR_371_SOUND_MUSIC_AUDIO_owner_study_merged', `${fixture.fixtureId}.sourceOwnerStudyRefs`)
  assertArrayIncludes(fixture.sourceOwnerStudyRefs, `PR_371_merge_sha_${MERGE_SHA}`, `${fixture.fixtureId}.sourceOwnerStudyRefs`)
  assertArrayIncludes(fixture.capabilityRefs, 'SOUND_MUSIC_AUDIO.timing_aware_sound_cue_manifest', `${fixture.fixtureId}.capabilityRefs`)

  for (const blockedUse of REQUIRED_SOUND_BLOCKED_USES) {
    assertArrayIncludes(fixture.blockedUses, blockedUse, `${fixture.fixtureId}.blockedUses`)
  }

  for (const flag of REQUIRED_FALSE_FLAGS) {
    assert(fixture[flag] === false, `${flag} must be false in ${fixture.fixtureId}`)
  }

  assert(fixture.supabaseUpdateRequired === 'docs/status only', `Supabase update required mismatch in ${fixture.fixtureId}`)
  assert(fixture.supabaseUpdateStatus === 'docs_only', `Supabase update status mismatch in ${fixture.fixtureId}`)
  assert(fixture.supabaseEnvironmentTouched === 'none', `Supabase environment mismatch in ${fixture.fixtureId}`)
  assert(fixture.sqlExecuted === 'none', `SQL execution mismatch in ${fixture.fixtureId}`)
  assert(fixture.migrationDeployed === 'no', `Migration deployed mismatch in ${fixture.fixtureId}`)
}

for (const capability of REQUIRED_SOUND_CAPABILITIES) {
  assertArrayIncludes(soundFixture.capabilityRefs, capability, 'soundFixture.capabilityRefs')
}

assert(
  soundFixture.selectedToolRefs.includes('timing_aware_sound_cue_manifest_placeholder'),
  'Sound fixture must include timing-aware sound cue manifest placeholder.',
)
assert(
  multiFixture.selectedToolRefs.includes('timing_aware_sound_cue_manifest_placeholder'),
  'Multi-tool fixture must include timing-aware sound cue manifest placeholder.',
)

console.log(JSON.stringify({
  status: 'passed',
  phase: 'TOOL-ROUTE-1A',
  refreshResult: 'sound_music_audio_refs_refreshed_after_pr_371',
  soundStudyMergeSha: MERGE_SHA,
  toolRouteReadinessState: 'ready_with_warnings_for_tool_route_2',
  docsChecked: REQUIRED_DOCS.length,
  fixturesChecked: 2,
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
  productionCapabilityEnabled: 'none; tool-route sound study fixture refresh only',
  nextRecommendedPrompt: 'TOOL-ROUTE-2 - Offline Tool Route Contract Test Execution',
}, null, 2))
