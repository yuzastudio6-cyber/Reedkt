import { existsSync, readFileSync } from 'node:fs'

const MERGE_SHA = 'f6283e63742d6999910d3887482dc3112da1e570'

const REQUIRED_DOCS = [
  'docs/tool-route-execution/tool-route-2a-refresh-conflict-resolution.md',
  'docs/tool-route-execution/tool-route-2a-post-refresh-contract-test-results.md',
  'docs/prompt-tool-route-2a-validation-results.md',
  'docs/implementation-prompts/prompt-tool-route-2a-refresh-conflict-resolution-after-tool-route-1a.md',
  'docs/tool-route-execution/tool-route-1a-sound-study-refresh.md',
  'docs/tool-route-execution/tool-route-1a-fixture-refresh-results.md',
  'docs/tool-route-execution/tool-route-2-fixture-validation-results.md',
  'docs/tool-route-execution/tool-route-2-contract-test-report.md',
  'docs/tool-route-execution/tool-route-2-readiness-decision.md',
  'docs/prompt-tool-route-2-validation-results.md',
]

const CONFLICT_RESOLUTION_FILES = [
  'package.json',
  'docs/beta-readiness-scorecard.md',
  'docs/production-beta-blocker-inventory.md',
  'docs/production-beta-readiness-scorecard.md',
]

const SOUND_FIXTURE = 'docs/tool-route-execution/fixtures/sound-music-audio.scoped-tool-call.fixture.json'
const MULTI_FIXTURE = 'docs/tool-route-execution/fixtures/multi-tool-plan.scoped-tool-call.fixture.json'

const REQUIRED_SCRIPTS = {
  'tool-study-pending-owners-0:diagnostics': 'node scripts/validation/tool-study-pending-owners-0-diagnostics.mjs',
  'tool-route:execution-unlock:audit:diagnostics': 'node scripts/validation/tool-route-execution-unlock-audit-diagnostics.mjs',
  'tool-route:dry-run-fixtures:diagnostics': 'node scripts/validation/tool-route-dry-run-fixtures-diagnostics.mjs',
  'tool-route:1a-sound-refresh:diagnostics': 'node scripts/validation/tool-route-1a-sound-study-refresh-diagnostics.mjs',
  'tool-route:offline-contract-tests': 'node scripts/validation/tool-route-offline-contract-tests.mjs',
  'tool-route:offline-contract-test:diagnostics': 'node scripts/validation/tool-route-offline-contract-test-diagnostics.mjs',
  'tool-route:2a-refresh-conflict:diagnostics': 'node scripts/validation/tool-route-2a-refresh-conflict-resolution-diagnostics.mjs',
}

const REQUIRED_DOC_TERMS = [
  'tool_route_2a_conflict_resolved_contract_tests_passed_with_warnings',
  'tool_route_offline_contract_tests_passed_with_warnings_after_sound_refresh',
  'tool_route_offline_contract_tests_passed_with_warnings',
  'sound_music_audio_refs_refreshed_after_pr_371',
  'PR #370',
  'PR #372',
  'PR #371',
  MERGE_SHA,
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
  'Supabase environment touched: `none`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'none; TOOL-ROUTE-2A refresh conflict resolution only',
  'No Supabase mutation, SQL execution',
]

const REQUIRED_SOUND_BLOCKED_USES = [
  'audio_processing',
  'audio_generation',
  'sfx_music_generation',
  'ffmpeg_ffprobe_execution',
  'deepfilternet_runtime',
  'demucs_runtime',
  'provider_audio_generation',
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

const FORBIDDEN_DOC_PATTERNS = [
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

const FIXTURE_FORBIDDEN_PATTERNS = [
  [/PR_360_SOUND_MUSIC_AUDIO_owner_study/, 'stale Sound PR #360 owner-study ref'],
  [/SOUND_MUSIC_AUDIO\.timing_audio_metadata_planning/, 'stale Sound timing audio metadata capability'],
  [/https?:\/\//i, 'real URL'],
  [/gs:\/\//i, 'real GCS path'],
  [/supabase\.co/i, 'Supabase URL'],
  [/x-goog-signature|x-amz-signature|x-amz-credential|expires=/i, 'signed URL marker'],
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
for (const [scriptName, command] of Object.entries(REQUIRED_SCRIPTS)) {
  assert(packageJson.scripts?.[scriptName] === command, `Missing or changed package script ${scriptName}.`)
}

for (const filePath of CONFLICT_RESOLUTION_FILES) {
  const text = read(filePath)
  assert(!text.includes('<<<<<<<'), `Unresolved conflict marker found in ${filePath}`)
  assert(!text.includes('======='), `Unresolved conflict separator found in ${filePath}`)
  assert(!text.includes('>>>>>>>'), `Unresolved conflict marker found in ${filePath}`)
}

const combinedDocs = REQUIRED_DOCS.map((filePath) => `${filePath}\n${read(filePath)}`).join('\n\n')

for (const term of REQUIRED_DOC_TERMS) {
  assert(combinedDocs.includes(term), `Missing required doc term: ${term}`)
}

for (const [pattern, label] of FORBIDDEN_DOC_PATTERNS) {
  assert(!pattern.test(combinedDocs), `Forbidden ${label} found in TOOL-ROUTE-2A docs.`)
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

console.log(JSON.stringify({
  status: 'passed',
  phase: 'TOOL-ROUTE-2A',
  decisionState: 'tool_route_2a_conflict_resolved_contract_tests_passed_with_warnings',
  combinedRouteState: 'tool_route_offline_contract_tests_passed_with_warnings_after_sound_refresh',
  soundStudyMergeSha: MERGE_SHA,
  docsChecked: REQUIRED_DOCS.length,
  conflictFilesChecked: CONFLICT_RESOLUTION_FILES.length,
  packageScriptsChecked: Object.keys(REQUIRED_SCRIPTS).length,
  soundFixturePr371RefPresent: true,
  multiToolFixturePr371RefPresent: true,
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
  productionCapabilityEnabled: 'none; TOOL-ROUTE-2A refresh conflict resolution only',
  nextRecommendedPrompt: 'TOOL-ROUTE-3 - Offline Tool Route Dry-Run Approval Packet',
}, null, 2))
