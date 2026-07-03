import fs from 'node:fs'
import path from 'node:path'

const decision = 'worker_runtime_jobs_sound_cpu_phase208_blocked_private_fixture_source_missing'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_phase207_blocked_private_fixture_missing'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE209-PRIVATE-FIXTURE-PATH-APPROVAL-HANDOFF'

const files = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase208-private-fixture-source-selection-preflight-result.md',
    label: 'worker-runtime-jobs-sound-cpu-phase208-private-fixture-source-selection-preflight-result',
  },
  evidence: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase208-policy-evidence-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase208-policy-evidence-register',
  },
  blocker: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase208-private-fixture-source-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase208-private-fixture-source-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase208-runtime-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-phase208-runtime-claim-policy',
  },
}

const sourceFiles = [
  'docs/worker-runtime-jobs-sound-cpu-phase207-controlled-private-fixture-real-user-media-runtime-execution-proof-result.md',
  'docs/worker-runtime-jobs-sound-cpu-phase207-private-fixture-blocker-register.md',
  'docs/worker-runtime-jobs-sound-cpu-phase133-real-user-media-input-classification-policy.md',
  'docs/worker-runtime-jobs-sound-cpu-phase133-real-user-media-privacy-retention-policy.md',
  'docs/worker-runtime-jobs-sound-cpu-phase133-real-user-media-stop-rules-policy.md',
  'docs/worker-runtime-jobs-sound-cpu-phase134-private-media-retention-deletion-policy.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase208-private-fixture-source-selection-preflight.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase209-private-fixture-path-approval-handoff.md',
]

function read(file) {
  const full = path.join(process.cwd(), file)
  if (!fs.existsSync(full)) throw new Error(`Missing required file: ${file}`)
  return fs.readFileSync(full, 'utf8')
}

function parse(file, label) {
  const text = read(file)
  const match = text.match(new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```'))
  if (!match) throw new Error(`Missing JSON block ${label} in ${file}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertNoop(record, label) {
  assert(record.updateRequired === 'no', `${label}.updateRequired must be no`)
  assert(record.environmentTouched === 'no', `${label}.environmentTouched must be no`)
  assert(record.sqlExecuted === 'no', `${label}.sqlExecuted must be no`)
  assert(record.migrationDeployed === 'no', `${label}.migrationDeployed must be no`)
  assert(record.nextAction === 'none', `${label}.nextAction must be none`)
}

function assertFalseMap(record, label) {
  for (const [key, value] of Object.entries(record)) assert(value === false, `${label}.${key} must be false`)
}

function assertNoForbiddenTrueClaims(file) {
  const text = read(file)
  const forbidden = [
    'proofAttempted',
    'mediaRead',
    'mediaProcessed',
    'realUserMediaRead',
    'mediaProcessing',
    'toolExecution',
    'workerExecution',
    'routeExecution',
    'artifactCreation',
    'supabaseMutation',
    'sqlExecution',
    'storageTransfer',
    'signedUrlCreation',
    'publicArtifactCreation',
    'providerModelCall',
    'dockerGcpAction',
    'betaUnlock',
    'productionUnlock',
    'controlledPrivateFixtureProofPassed',
    'toolExecutionReadyForRealUserMedia',
    'workerExecutionReadyForRealUserMedia',
    'routeExecutionReadyForRealUserMedia',
    'realUserMediaBetaReady',
    'productionReady',
    'runtimeReadinessClaimed',
  ]
  for (const key of forbidden) assert(!text.includes(`"${key}": true`), `${file} contains forbidden true claim: ${key}`)
}

const parsed = Object.fromEntries(
  Object.entries(files).map(([key, value]) => [key, parse(value.path, value.label)]),
)

for (const value of Object.values(files)) assertNoForbiddenTrueClaims(value.path)
for (const file of sourceFiles) read(file)

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2337, 'source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === '3212ca1f930f2731f04f13f22faaa6c6424f20ce', 'source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.sourceVerification.samePurposeBranchOrPrFound === false, 'duplicate state widened')
assert(parsed.result.preflightResult.repoOwnedFixturePolicyDocsInspected === true, 'policy docs not inspected')
assert(parsed.result.preflightResult.localMetadataInspectedOnly === true, 'metadata-only guard missing')
assert(parsed.result.preflightResult.explicitApprovedLocalPrivateFixturePathFound === false, 'fixture path should be missing')
assert(parsed.result.preflightResult.acceptedFixturePath === null, 'fixture path must remain null')
assert(parsed.result.preflightResult.mediaRead === false, 'media read widened')
assert(parsed.result.preflightResult.mediaProcessed === false, 'media processing widened')
assert(parsed.result.preflightResult.blockerClassification === decision, 'blocker classification mismatch')
assert(parsed.result.preflightResult.randomMediaSelectionAllowed === false, 'random media selection widened')
assert(parsed.result.preflightResult.broadPrivateFolderSearchAllowed === false, 'broad private folder search widened')
assert(parsed.result.preflightResult.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assertFalseMap(parsed.result.runtimeActions, 'result.runtimeActions')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.evidence.decision === decision, 'evidence decision mismatch')
assert(parsed.evidence.acceptedPriorEvidence.soundCpuToolCount === 15, 'tool count mismatch')
assert(parsed.evidence.acceptedPriorEvidence.phase207BlockerDecision === sourceDecision, 'phase207 source mismatch')
assert(parsed.evidence.policyDocsInspected.length >= 6, 'policy docs count too small')
assert(parsed.evidence.policyRequirementsObserved.privateManifestRequired === true, 'manifest requirement missing')
assert(parsed.evidence.policyRequirementsObserved.stopBeforeMediaOpenWhenMissingFixture === true, 'stop-before-open missing')
assert(parsed.evidence.sourceSelectionEvidence.explicitLocalPathInRepoOwnedMetadata === false, 'explicit path should be absent')
assert(parsed.evidence.sourceSelectionEvidence.approvedPrivateFixturePathFound === false, 'approved fixture should be absent')
assert(parsed.evidence.sourceSelectionEvidence.randomDiskMediaRejected === true, 'random disk media rejection missing')
assert(parsed.evidence.sourceSelectionEvidence.broadPrivateFolderCrawlRejected === true, 'broad crawl rejection missing')

assert(parsed.blocker.decision === decision, 'blocker decision mismatch')
assert(parsed.blocker.selectedBlocker.blockerId === 'explicit_approved_local_private_fixture_source_missing', 'selected blocker mismatch')
assert(parsed.blocker.selectedBlocker.severity === 'hard_stop', 'blocker severity mismatch')
assert(parsed.blocker.selectedBlocker.mustNotWorkAround === true, 'workaround guard missing')
assert(parsed.blocker.selectedBlocker.fixPrompt === nextPrompt, 'blocker next prompt mismatch')
assert(parsed.blocker.notBlockersToday.some((item) => item.blockerId === 'tool_install_or_import'), 'tool install not-blocker missing')
assert(parsed.blocker.notBlockersToday.some((item) => item.blockerId === 'owner_paste_wait'), 'owner wait not-blocker missing')

assert(parsed.claims.decision === decision, 'claims decision mismatch')
assert(parsed.claims.allowedClaims.privateFixtureSourcePreflightCompleted === true, 'source preflight claim missing')
assert(parsed.claims.allowedClaims.privateFixtureSourceMissing === true, 'source missing claim missing')
assert(parsed.claims.allowedClaims.blockedBeforeMediaRead === true, 'blocked-before-read claim missing')
assert(parsed.claims.allowedClaims.selectedNextPrompt === nextPrompt, 'claims next prompt mismatch')
assertFalseMap(parsed.claims.blockedClaims, 'claims.blockedClaims')
assertFalseMap(parsed.claims.runtimeActions, 'claims.runtimeActions')
assertNoop(parsed.claims.supabaseClassification, 'claims.supabaseClassification')

const phase208Prompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase208-private-fixture-source-selection-preflight.md')
assert(phase208Prompt.includes('No media read'), 'Phase208 no-media guard missing')
assert(phase208Prompt.includes('Do not choose random media'), 'Phase208 random media guard missing')

const phase209Prompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase209-private-fixture-path-approval-handoff.md')
assert(phase209Prompt.includes('without opening or processing the media'), 'Phase209 no-open guard missing')
assert(phase209Prompt.includes('Do not search broad private folders'), 'Phase209 broad search guard missing')
assert(phase209Prompt.includes('worker_runtime_jobs_sound_cpu_phase209_blocked_private_fixture_path_or_boundary_missing'), 'Phase209 blocker decision missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase208-private-fixture-source-selection-preflight:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase208-private-fixture-source-selection-preflight-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2337,
      approvedPrivateFixturePathFound: false,
      mediaRead: false,
      selectedNextPrompt: nextPrompt,
      supabaseUpdateRequired: false,
    },
    null,
    2,
  ),
)
