import fs from 'node:fs'
import path from 'node:path'

const decision = 'worker_runtime_jobs_sound_cpu_phase210_blocked_private_fixture_path_input_missing_or_incomplete'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_phase209_blocked_private_fixture_path_or_boundary_missing'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE210-PRIVATE-FIXTURE-PATH-INPUT-AND-BOUNDARY-INTAKE-WITH-EXPLICIT-PATH'

const files = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-result.md',
    label: 'worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-result',
  },
  intake: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase210-path-boundary-intake-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase210-path-boundary-intake-register',
  },
  blocker: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase210-intake-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase210-intake-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase210-runtime-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-phase210-runtime-claim-policy',
  },
}

const sourceFiles = [
  'docs/worker-runtime-jobs-sound-cpu-phase209-private-fixture-path-approval-handoff-result.md',
  'docs/worker-runtime-jobs-sound-cpu-phase209-path-boundary-evidence-register.md',
  'docs/worker-runtime-jobs-sound-cpu-phase209-missing-path-blocker-register.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-with-explicit-path.md',
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
    'explicitLocalPathProvided',
    'pathIsExplicit',
    'pathIsLocal',
    'privateFixtureApprovedForBoundedProof',
    'requiredBoundariesComplete',
    'mediaRead',
    'mediaProcessed',
    'proofAttempted',
    'toolExecutionAttempted',
    'workerDispatchAttempted',
    'routeExecutionAttempted',
    'realUserMediaRead',
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
    'explicitLocalPathAccepted',
    'controlledPrivateFixtureProofPassed',
    'generated_local_fixture_passed',
    'dry_run_passed',
    'runtimeReadinessClaimed',
    'externalAgentRealMediaExecutionReady',
    'realUserMediaBetaReady',
    'paidProductionReady'
  ]
  for (const key of forbidden) assert(!text.includes(`"${key}": true`), `${file} contains forbidden true claim: ${key}`)
}

const parsed = Object.fromEntries(
  Object.entries(files).map(([key, value]) => [key, parse(value.path, value.label)]),
)

for (const value of Object.values(files)) assertNoForbiddenTrueClaims(value.path)
for (const file of sourceFiles) read(file)

assert(parsed.result.decision === decision, 'result decision mismatch')
assert(parsed.result.sourceVerification.sourcePr === 2339, 'source PR mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.sourceVerification.currentSourceHead === '1a9d3a7aac47f6d95576457032c5aee85ba81c8a', 'source head mismatch')
assert(parsed.result.sourceVerification.samePurposeBranchOrPrFound === false, 'duplicate state widened')
assert(parsed.result.intakeResult.explicitLocalPathProvided === false, 'path provided should be false')
assert(parsed.result.intakeResult.acceptedFixturePath === null, 'accepted fixture path must be null')
assert(parsed.result.intakeResult.privateFixtureApprovedForBoundedProof === false, 'fixture approval widened')
assert(parsed.result.intakeResult.requiredBoundariesComplete === false, 'required boundaries widened')
assert(parsed.result.intakeResult.blockedBeforeMediaRead === true, 'blocked-before-media-read missing')
assert(parsed.result.intakeResult.mediaRead === false, 'media read widened')
assert(parsed.result.intakeResult.proofAttempted === false, 'proof attempt widened')
assert(parsed.result.intakeResult.mustNotSubstituteRandomMedia === true, 'random-media guard missing')
assert(parsed.result.intakeResult.mustNotSearchBroadPrivateFolders === true, 'broad-search guard missing')
assert(parsed.result.intakeResult.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assertFalseMap(parsed.result.runtimeActions, 'result.runtimeActions')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.intake.decision === decision, 'intake decision mismatch')
assert(parsed.intake.requiredPathEvidence.localFilesystemPath === 'missing', 'local path must be missing')
assert(parsed.intake.requiredPathEvidence.pathIsExplicit === false, 'path explicit widened')
assert(parsed.intake.requiredPathEvidence.pathIsLocal === false, 'path local widened')
assert(parsed.intake.requiredPathEvidence.broadPrivateFolderSearchPerformed === false, 'broad search must be false')
assert(parsed.intake.requiredBoundaryEvidence.retentionBoundary === 'missing', 'retention boundary should be missing')
assert(parsed.intake.requiredBoundaryEvidence.cleanupBoundary === 'missing', 'cleanup boundary should be missing')
assert(parsed.intake.requiredBoundaryEvidence.stopBeforeMediaOpenUnlessComplete === true, 'stop-before-open missing')
assert(parsed.intake.acceptedPriorEvidence.phase128AcceptedToolCount === 15, 'phase128 tool count mismatch')
assert(parsed.intake.acceptedPriorEvidence.phase209ConfirmedMissingPath === true, 'phase209 missing path not carried forward')
assert(parsed.intake.pathAcceptanceToday.accepted === false, 'path acceptance widened')

assert(parsed.blocker.decision === decision, 'blocker decision mismatch')
assert(parsed.blocker.selectedBlocker.blockerId === 'private_fixture_path_input_missing_or_incomplete', 'blocker id mismatch')
assert(parsed.blocker.selectedBlocker.severity === 'hard_stop', 'blocker severity mismatch')
assert(parsed.blocker.selectedBlocker.mustNotWorkAround === true, 'workaround guard missing')
assert(parsed.blocker.selectedBlocker.fixPrompt === nextPrompt, 'fix prompt mismatch')
assert(parsed.blocker.notBlockersToday.some((item) => item.blockerId === 'fifteen_tool_coverage'), '15-tool not-blocker missing')
assert(
  parsed.blocker.notBlockersToday.some((item) => item.blockerId === 'bounded_no_real_user_media_external_agent_call'),
  'bounded no-media not-blocker missing',
)

assert(parsed.claims.decision === decision, 'claims decision mismatch')
assert(parsed.claims.allowedClaims.phase210IntakeCompleted === true, 'phase210 intake claim missing')
assert(parsed.claims.allowedClaims.privateFixturePathMissing === true, 'path missing claim missing')
assert(parsed.claims.allowedClaims.proofBoundariesMissing === true, 'boundary missing claim missing')
assert(parsed.claims.allowedClaims.acceptedSoundCpuToolCount === 15, 'accepted tool count mismatch')
assert(parsed.claims.allowedClaims.selectedNextPrompt === nextPrompt, 'claims next prompt mismatch')
assertFalseMap(parsed.claims.blockedClaims, 'claims.blockedClaims')
assertFalseMap(parsed.claims.runtimeActions, 'claims.runtimeActions')
assertNoop(parsed.claims.supabaseClassification, 'claims.supabaseClassification')

const originalPrompt = read(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake.md',
)
assert(originalPrompt.includes('No media read'), 'original Phase210 no-media guard missing')
assert(originalPrompt.includes('Do not search broad private folders'), 'original Phase210 broad-search guard missing')

const explicitPathPrompt = read(
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-with-explicit-path.md',
)
assert(explicitPathPrompt.includes(decision), 'explicit path prompt source missing')
assert(explicitPathPrompt.includes('One exact local filesystem path'), 'explicit path prompt path requirement missing')
assert(explicitPathPrompt.includes('Do not search broad private folders'), 'explicit path prompt broad-search guard missing')
assert(explicitPathPrompt.includes('No media read'), 'explicit path prompt no-media guard missing')
assert(
  explicitPathPrompt.includes(
    'worker_runtime_jobs_sound_cpu_phase210_private_fixture_path_input_passed_with_warnings_ready_for_controlled_private_fixture_real_user_media_runtime_execution_proof',
  ),
  'explicit path prompt pass decision missing',
)

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase210-private-fixture-path-input-and-boundary-intake:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2339,
      acceptedSoundCpuToolCount: 15,
      explicitLocalPathProvided: false,
      mediaRead: false,
      selectedNextPrompt: nextPrompt,
      supabaseUpdateRequired: false
    },
    null,
    2,
  ),
)
