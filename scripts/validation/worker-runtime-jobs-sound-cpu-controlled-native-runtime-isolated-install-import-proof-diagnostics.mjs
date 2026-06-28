#!/usr/bin/env node
import { existsSync, lstatSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_controlled_native_runtime_isolated_install_import_proof_passed_with_warnings_ready_for_source_install_closure_owner_review_no_media_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_native_runtime_isolated_install_import_proof_plan_completed_with_warnings_ready_for_controlled_isolated_install_import_proof_no_media_no_production'
const SOURCE_HEAD = '2b4c5b63b357ab62f6918357b6c13a0d65e6bb7f'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-NATIVE-RUNTIME-ISOLATED-PROOF-OWNER-REVIEW: review isolated install/import proof, no media/no production'

const FILES = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-install-import-proof-result.md',
    label: 'worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-install-import-proof-result',
  },
  lanes: {
    path: 'docs/worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-lane-proof-register.md',
    label: 'worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-lane-proof-register',
  },
  log: {
    path: 'docs/worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-proof-log-summary.md',
    label: 'worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-proof-log-summary',
  },
  closure: {
    path: 'docs/worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-source-install-closure-readiness.md',
    label: 'worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-source-install-closure-readiness',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-proof-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-proof-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-proof-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-proof-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-owner-review',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-native-runtime-isolated-install-import-proof-plan.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-install-import-proof.md',
  'server/workers/sound-cpu/requirements.launch-core.shared.txt',
  'server/workers/sound-cpu/requirements.launch-core.pyav.txt',
  'server/workers/sound-cpu/requirements.launch-core.opencv-scenedetect.txt',
  'scripts/validation/worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-install-import-proof-runner.py',
  'package.json',
  'package-lock.json',
]

const EXPECTED_LANES = [
  {
    lane: 'shared',
    requirements: 'server/workers/sound-cpu/requirements.launch-core.shared.txt',
    versions: {
      duckdb: '1.5.4',
      polars: '1.42.0',
      opentimelineio: '0.18.1',
    },
    imports: ['duckdb', 'polars', 'opentimelineio'],
  },
  {
    lane: 'pyav',
    requirements: 'server/workers/sound-cpu/requirements.launch-core.pyav.txt',
    versions: {
      av: '17.1.0',
    },
    imports: ['av'],
  },
  {
    lane: 'opencv_scenedetect',
    requirements: 'server/workers/sound-cpu/requirements.launch-core.opencv-scenedetect.txt',
    versions: {
      scenedetect: '0.7',
      'opencv-python-headless': '4.13.0.92',
    },
    imports: ['cv2', 'scenedetect'],
  },
]

const MUST_BE_FALSE = [
  'sourceInstallReviewClosedInThisGate',
  'sourceInstallReviewClosedForNativeRuntimeTargets',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'generatedLocalFixturePassedClaimedToday',
  'dryRunPassedClaimedToday',
  'runtimeReadinessClaimed',
  'runtimeReadinessClaimedToday',
  'workerReadinessClaimed',
  'mediaReadinessClaimed',
  'workerReadinessClaimedToday',
  'mediaReadinessClaimedToday',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionReady',
  'realUserMediaBetaMayProceedNow',
  'productionMayProceedNow',
  'runtimeExecution',
  'workerExecution',
  'routeExecution',
  'toolExecution',
  'mediaProcessing',
  'dockerBuildRunPush',
  'gcpCloudRunSecretManager',
  'supabaseMutation',
  'sqlExecution',
  'artifactCreation',
  'realUserMediaBetaUnlock',
  'productionUnlock',
  'runtimeExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'toolExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'dockerBuildRunPushApprovedToday',
  'gcpCloudRunSecretManagerApprovedToday',
  'supabaseMutationApprovedToday',
  'sqlExecutionApprovedToday',
  'artifactDeliveryApprovedToday',
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(path) {
  assert(existsSync(path), `Missing required file: ${path}`)
  return readFileSync(path, 'utf8')
}

function parseBlock(info) {
  const text = read(info.path)
  const marker = '```json ' + info.label
  const start = text.indexOf(marker)
  assert(start >= 0, `${info.path} missing fenced JSON label ${info.label}`)
  const jsonStart = text.indexOf('\n', start)
  const end = text.indexOf('```', jsonStart + 1)
  assert(jsonStart >= 0 && end >= 0, `${info.path} missing JSON fence close`)
  return JSON.parse(text.slice(jsonStart + 1, end).trim())
}

function assertSupabaseNoop(value, label) {
  assert(value?.updateRequired === 'no', `${label} Supabase update mismatch`)
  assert(value?.environmentTouched === 'no', `${label} Supabase environment mismatch`)
  assert(value?.sqlExecuted === 'no', `${label} SQL mismatch`)
  assert(value?.migrationDeployed === 'no', `${label} migration mismatch`)
  assert(value?.nextAction === 'none', `${label} Supabase next action mismatch`)
}

function scanFalse(value, trail = []) {
  if (value === null || value === undefined || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanFalse(entry, trail.concat(String(index))))
    return
  }
  for (const [key, child] of Object.entries(value)) {
    if (MUST_BE_FALSE.includes(key)) assert(child === false, `${trail.concat(key).join('.')} must remain false`)
    scanFalse(child, trail.concat(key))
  }
}

for (const file of SOURCE_FILES) read(file)

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-controlled-native-runtime-isolated-install-import-proof:diagnostics'],
  'package script missing',
)

const plan = read('docs/worker-runtime-jobs-sound-cpu-native-runtime-isolated-install-import-proof-plan.md')
assert(plan.includes(SOURCE_DECISION), 'source plan decision missing')

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const result = parsed.result
assert(result.decision === DECISION, 'decision mismatch')
assert(result.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(result.sourceBase.isolatedProofPlanPr === 1487, 'source PR mismatch')
assert(result.sourceBase.isolatedProofPlanDecision === SOURCE_DECISION, 'source decision mismatch')
assert(result.proofResult.pythonVersion === 'Python 3.13.13', 'python version mismatch')
assert(result.proofResult.lanesChecked === 3, 'lane count mismatch')
assert(result.proofResult.installSucceeded === true, 'install proof missing')
assert(result.proofResult.metadataPassed === true, 'metadata proof missing')
assert(result.proofResult.importsPassed === true, 'import proof missing')
assert(result.proofResult.nativeDuplicateWarningDetected === false, 'duplicate native warning must remain false')
assert(result.proofResult.temporaryVenvsOutsideRepo === true, 'venvs must be outside repo')
assert(result.proofResult.temporaryVenvsRemoved === true, 'venvs must be removed')
assert(result.proofResult.packageLockUnchanged === true, 'package lock must be unchanged')
assert(result.proofResult.sourceInstallReviewClosedCountThisGate === 0, 'proof gate must close zero source-install blockers')
assert(result.proofResult.sourceInstallClosureCandidateCountAfter === 5, 'closure candidate count mismatch')
assert(result.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const laneProofs = parsed.lanes.laneProofs
assert(laneProofs.length === EXPECTED_LANES.length, 'lane proof count mismatch')
for (const expected of EXPECTED_LANES) {
  const actual = laneProofs.find((entry) => entry.lane === expected.lane)
  assert(actual, `missing lane ${expected.lane}`)
  assert(actual.requirements === expected.requirements, `${expected.lane} requirements mismatch`)
  for (const [pkg, version] of Object.entries(expected.versions)) {
    assert(actual.metadataVersions?.[pkg] === version, `${expected.lane} ${pkg} version mismatch`)
  }
  for (const imported of expected.imports) {
    assert(actual.imports.includes(imported), `${expected.lane} missing import ${imported}`)
  }
  assert(actual.installSucceeded === true, `${expected.lane} install must pass`)
  assert(actual.metadataPassed === true, `${expected.lane} metadata must pass`)
  assert(actual.importsPassed === true, `${expected.lane} imports must pass`)
  assert(actual.nativeDuplicateWarningDetected === false, `${expected.lane} duplicate warning must be false`)
  assert(actual.venvInsideRepo === false, `${expected.lane} venv must not be inside repo`)
}

const log = parsed.log.sanitizedLogSummary
assert(log.runner.endsWith('controlled-native-runtime-isolated-install-import-proof-runner.py'), 'runner mismatch')
assert(log.tempRootPrefix === '/private/tmp/reeditpro-sound-cpu-isolated-proof-', 'temp root prefix mismatch')
assert(log.tempRootRemoved === true, 'temp root removal missing')
assert(log.rawLogsCommitted === false, 'raw logs must not be committed')
assert(log.secretMaterialRecorded === false, 'secret material must not be recorded')
assert(log.localAbsoluteVenvPathCommitted === false, 'local venv path must not be committed')

const closure = parsed.closure.closureReadiness
assert(closure.sourceInstallReviewClosureMayBeReviewed === true, 'closure review readiness missing')
assert(closure.sourceInstallReviewClosedInThisGate === false, 'proof gate must not close source install')
assert(closure.closureCandidateTools.length === 5, 'closure candidate count mismatch')
assert(closure.closureRequiresOwnerReview === true, 'closure must require owner review')

const blockers = parsed.blockers
assert(blockers.resolvedInThisProof.some((entry) => entry.id === 'native_duplicate_warning_in_split_lanes'), 'duplicate blocker evidence missing')
assert(blockers.remainingBlockedScopes.sourceInstallClosureNeedsOwnerReview === true, 'owner review blocker missing')

const claims = parsed.claims
assert(claims.allowedClaims.controlledIsolatedInstallImportProofRan === true, 'proof-run claim missing')
assert(claims.allowedClaims.splitManifestLanesInstalled === true, 'lane install claim missing')
assert(claims.allowedClaims.splitManifestLanesImported === true, 'lane import claim missing')
assert(claims.allowedClaims.nativeDuplicateWarningDetected === false, 'duplicate warning claim must be false')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'prompt required decision mismatch')
assert(prompt.allowedReviewScope.sourceInstallClosureReview === true, 'owner review source-install scope missing')
assert(prompt.allowedReviewScope.runtimeExecution === false, 'owner review runtime must remain false')
assert(prompt.allowedReviewScope.mediaProcessing === false, 'owner review media must remain false')
assert(prompt.allowedReviewScope.productionUnlock === false, 'owner review production must remain false')

if (existsSync('node_modules')) {
  const stat = lstatSync('node_modules')
  assert(stat.isDirectory(), 'node_modules must not be an unexpected file or symlink during diagnostics')
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      isolatedProofPlanPr: 1487,
      lanesChecked: laneProofs.length,
      installSucceeded: true,
      importsPassed: true,
      nativeDuplicateWarningDetected: false,
      packageLockUnchanged: true,
      sourceInstallReviewClosedCountThisGate: 0,
      sourceInstallClosureCandidateCountAfter: 5,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
