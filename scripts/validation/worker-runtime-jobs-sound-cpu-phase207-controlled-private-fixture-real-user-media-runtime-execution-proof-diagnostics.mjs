import fs from 'node:fs'
import path from 'node:path'

const decision = 'worker_runtime_jobs_sound_cpu_phase207_blocked_private_fixture_missing'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase206_real_user_media_runtime_execution_go_no_go_plan_completed_with_warnings_ready_for_selected_execution_or_blocker_gate'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE208-PRIVATE-FIXTURE-SOURCE-SELECTION-PREFLIGHT'

const files = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase207-controlled-private-fixture-real-user-media-runtime-execution-proof-result.md',
    label: 'worker-runtime-jobs-sound-cpu-phase207-controlled-private-fixture-real-user-media-runtime-execution-proof-result',
  },
  evidence: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase207-preflight-evidence-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase207-preflight-evidence-register',
  },
  blocker: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase207-private-fixture-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase207-private-fixture-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase207-runtime-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-phase207-runtime-claim-policy',
  },
}

const sourceFiles = [
  'docs/worker-runtime-jobs-sound-cpu-phase206-real-user-media-runtime-execution-go-no-go-plan-result.md',
  'docs/worker-runtime-jobs-sound-cpu-phase206-phase207-stop-conditions-register.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase207-controlled-private-fixture-real-user-media-runtime-execution-proof.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase208-private-fixture-source-selection-preflight.md',
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
    'toolExecutionReady',
    'workerExecutionReady',
    'routeExecutionReady',
    'realUserMediaProcessingReady',
    'mediaProcessingReady',
    'artifactDeliveryReady',
    'supabaseReady',
    'sqlReady',
    'providerModelReady',
    'dockerGcpReady',
    'internalBetaWidened',
    'externalBetaWidened',
    'realUserMediaBetaReady',
    'paidProductionReady',
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
assert(parsed.result.sourceVerification.sourcePr === 2333, 'source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'b637aa87e29cc447622b50ee2fd7cb59501768ca', 'source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.sourceVerification.samePurposeBranchOrPrFound === false, 'duplicate state widened')
assert(parsed.result.preflightResult.explicitApprovedLocalPrivateFixturePathFound === false, 'fixture path should be missing')
assert(parsed.result.preflightResult.proofBlockedBeforeMediaRead === true, 'proof must stop before media read')
assert(parsed.result.preflightResult.blockerClassification === decision, 'blocker classification mismatch')
assert(parsed.result.preflightResult.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assertFalseMap(parsed.result.runtimeActions, 'result.runtimeActions')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.evidence.decision === decision, 'evidence decision mismatch')
assert(parsed.evidence.preflightChecks.phase207PromptRead === true, 'prompt read missing')
assert(parsed.evidence.preflightChecks.sameHeadPrCheckClean === true, 'same-head check missing')
assert(parsed.evidence.preflightChecks.repoMediaFileSearchFoundApprovedFixturePath === false, 'fixture search widened')
assert(parsed.evidence.preflightChecks.noRandomMediaSelected === true, 'random media guard missing')
assert(parsed.evidence.acceptedPriorEvidence.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(parsed.evidence.acceptedPriorEvidence.controlledPrivateFixtureRealMediaProofPassed === false, 'proof pass widened')
assert(parsed.evidence.observedDuplicateState.samePurposeOpenPrs === 0, 'same-purpose PR mismatch')

assert(parsed.blocker.decision === decision, 'blocker decision mismatch')
assert(parsed.blocker.selectedBlocker.blockerId === 'approved_private_fixture_missing', 'selected blocker mismatch')
assert(parsed.blocker.selectedBlocker.severity === 'hard_stop', 'blocker severity mismatch')
assert(parsed.blocker.selectedBlocker.fixPrompt === nextPrompt, 'fix prompt mismatch')
assert(parsed.blocker.selectedBlocker.mustNotWorkAround === true, 'workaround guard missing')
assert(parsed.blocker.notBlockersToday.some((item) => item.blockerId === 'owner_paste_wait'), 'owner wait not-blocker missing')

assert(parsed.claims.decision === decision, 'claims decision mismatch')
assert(parsed.claims.allowedClaims.blockedBeforeMediaRead === true, 'blocked-before-read claim missing')
assert(parsed.claims.allowedClaims.privateFixtureMissing === true, 'private fixture missing claim missing')
assert(parsed.claims.allowedClaims.selectedNextPrompt === nextPrompt, 'claims next prompt mismatch')
assertFalseMap(parsed.claims.blockedClaims, 'claims.blockedClaims')
assertFalseMap(parsed.claims.runtimeActions, 'claims.runtimeActions')
assertNoop(parsed.claims.supabaseClassification, 'claims.supabaseClassification')

const prompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase208-private-fixture-source-selection-preflight.md')
assert(prompt.includes(decision), 'Phase208 source decision missing')
assert(prompt.includes('Do not choose random media'), 'Phase208 random media guard missing')
assert(prompt.includes('No media read'), 'Phase208 no media read guard missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase207-controlled-private-fixture-real-user-media-runtime-execution-proof:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase207-controlled-private-fixture-real-user-media-runtime-execution-proof-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2333,
      proofAttempted: false,
      blockedBeforeMediaRead: true,
      selectedNextPrompt: nextPrompt,
      supabaseUpdateRequired: false,
    },
    null,
    2,
  ),
)
