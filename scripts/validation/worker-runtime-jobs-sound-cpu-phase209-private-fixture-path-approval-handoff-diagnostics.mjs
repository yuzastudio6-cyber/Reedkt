import fs from 'node:fs'
import path from 'node:path'

const decision = 'worker_runtime_jobs_sound_cpu_phase209_blocked_private_fixture_path_or_boundary_missing'
const sourceDecision = 'worker_runtime_jobs_sound_cpu_phase208_blocked_private_fixture_source_missing'
const nextPrompt = 'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE210-PRIVATE-FIXTURE-PATH-INPUT-AND-BOUNDARY-INTAKE'

const files = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase209-private-fixture-path-approval-handoff-result.md',
    label: 'worker-runtime-jobs-sound-cpu-phase209-private-fixture-path-approval-handoff-result',
  },
  evidence: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase209-path-boundary-evidence-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase209-path-boundary-evidence-register',
  },
  blocker: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase209-missing-path-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-phase209-missing-path-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-phase209-runtime-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-phase209-runtime-claim-policy',
  },
}

const sourceFiles = [
  'docs/worker-runtime-jobs-sound-cpu-phase208-private-fixture-source-selection-preflight-result.md',
  'docs/worker-runtime-jobs-sound-cpu-phase208-policy-evidence-register.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase209-private-fixture-path-approval-handoff.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake.md',
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
    'privateFixtureApprovedForBoundedProof',
    'requiredBoundariesComplete',
    'mediaRead',
    'mediaProcessed',
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
    'acceptedFixturePath',
    'toolExecutionReadyForRealUserMedia',
    'externalAgentRealMediaExecutionReady',
    'controlledPrivateFixtureProofPassed',
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
assert(parsed.result.sourceVerification.sourcePr === 2339, 'source PR mismatch')
assert(parsed.result.sourceVerification.sourceMergeCommit === 'e0a59641ce59d3c5aaa8435460602e34dbc5ca29', 'source merge mismatch')
assert(parsed.result.sourceVerification.sourceDecision === sourceDecision, 'source decision mismatch')
assert(parsed.result.sourceVerification.samePurposeBranchOrPrFound === false, 'duplicate state widened')
assert(parsed.result.handoffResult.explicitLocalPathProvided === false, 'path provided should be false')
assert(parsed.result.handoffResult.acceptedFixturePath === null, 'accepted fixture path must be null')
assert(parsed.result.handoffResult.privateFixtureApprovedForBoundedProof === false, 'fixture approval widened')
assert(parsed.result.handoffResult.requiredBoundariesComplete === false, 'boundaries should be incomplete')
assert(parsed.result.handoffResult.blockedBeforeMediaRead === true, 'blocked-before-read missing')
assert(parsed.result.handoffResult.mediaRead === false, 'media read widened')
assert(parsed.result.handoffResult.proofAttempted === false, 'proof attempt widened')
assert(parsed.result.handoffResult.blockerClassification === decision, 'blocker classification mismatch')
assert(parsed.result.handoffResult.selectedNextPrompt === nextPrompt, 'next prompt mismatch')
assertFalseMap(parsed.result.runtimeActions, 'result.runtimeActions')
assertNoop(parsed.result.supabaseClassification, 'result.supabaseClassification')

assert(parsed.evidence.decision === decision, 'evidence decision mismatch')
assert(parsed.evidence.requiredPathEvidence.localFilesystemPath === 'missing', 'local path should be missing')
assert(parsed.evidence.requiredPathEvidence.privateNonPublicClassification === 'missing', 'private classification should be missing')
assert(parsed.evidence.requiredPathEvidence.userOwnedOrOwnerApproved === 'missing', 'owner approval should be missing')
assert(parsed.evidence.requiredBoundaryEvidence.retentionBoundary === 'missing', 'retention boundary should be missing')
assert(parsed.evidence.requiredBoundaryEvidence.cleanupBoundary === 'missing', 'cleanup boundary should be missing')
assert(parsed.evidence.requiredBoundaryEvidence.stopBeforeMediaOpenUnlessComplete === true, 'stop-before-open missing')
assert(parsed.evidence.sourceEvidenceAccepted.phase208ConfirmedNoPath === true, 'phase208 no-path evidence missing')
assert(parsed.evidence.sourceEvidenceAccepted.phase208ConfirmedNoMediaRead === true, 'phase208 no-media evidence missing')
assert(parsed.evidence.pathAcceptanceToday.accepted === false, 'path acceptance widened')

assert(parsed.blocker.decision === decision, 'blocker decision mismatch')
assert(parsed.blocker.selectedBlocker.blockerId === 'private_fixture_path_or_boundary_missing', 'selected blocker mismatch')
assert(parsed.blocker.selectedBlocker.severity === 'hard_stop', 'blocker severity mismatch')
assert(parsed.blocker.selectedBlocker.mustNotWorkAround === true, 'workaround guard missing')
assert(parsed.blocker.selectedBlocker.fixPrompt === nextPrompt, 'blocker next prompt mismatch')
assert(parsed.blocker.notBlockersToday.some((item) => item.blockerId === 'package_install'), 'package install not-blocker missing')
assert(parsed.blocker.notBlockersToday.some((item) => item.blockerId === 'paid_production'), 'paid production not-blocker missing')

assert(parsed.claims.decision === decision, 'claims decision mismatch')
assert(parsed.claims.allowedClaims.privateFixturePathHandoffCompleted === true, 'handoff claim missing')
assert(parsed.claims.allowedClaims.privateFixturePathMissing === true, 'path missing claim missing')
assert(parsed.claims.allowedClaims.proofBoundariesMissing === true, 'boundary missing claim missing')
assert(parsed.claims.allowedClaims.blockedBeforeMediaRead === true, 'blocked-before-read claim missing')
assert(parsed.claims.allowedClaims.selectedNextPrompt === nextPrompt, 'claims next prompt mismatch')
assertFalseMap(parsed.claims.blockedClaims, 'claims.blockedClaims')
assertFalseMap(parsed.claims.runtimeActions, 'claims.runtimeActions')
assertNoop(parsed.claims.supabaseClassification, 'claims.supabaseClassification')

const phase209Prompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase209-private-fixture-path-approval-handoff.md')
assert(phase209Prompt.includes('without opening or processing the media'), 'Phase209 no-media guard missing')
assert(phase209Prompt.includes('No media read'), 'Phase209 no-media forbidden scope missing')

const phase210Prompt = read('docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase210-private-fixture-path-input-and-boundary-intake.md')
assert(phase210Prompt.includes('No media read'), 'Phase210 no-media guard missing')
assert(phase210Prompt.includes('Do not search broad private folders'), 'Phase210 broad search guard missing')
assert(phase210Prompt.includes('worker_runtime_jobs_sound_cpu_phase210_blocked_private_fixture_path_input_missing_or_incomplete'), 'Phase210 blocker decision missing')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts?.['worker-runtime-jobs:sound-cpu-phase209-private-fixture-path-approval-handoff:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase209-private-fixture-path-approval-handoff-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourcePr: 2339,
      explicitLocalPathProvided: false,
      mediaRead: false,
      selectedNextPrompt: nextPrompt,
      supabaseUpdateRequired: false,
    },
    null,
    2,
  ),
)
