#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_native_runtime_isolated_install_import_proof_plan_completed_with_warnings_ready_for_controlled_isolated_install_import_proof_no_media_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_source_owner_review_passed_with_warnings_ready_for_isolated_install_import_proof_plan_no_install_no_media_no_production'
const SOURCE_HEAD = '0fd8176d4cec9a26e9e66d42fbfd2dcc6b38c1f4'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-CONTROLLED-NATIVE-RUNTIME-ISOLATED-INSTALL-IMPORT-PROOF: run isolated install/import proof, no media/no production'

const MANIFESTS = {
  'server/workers/sound-cpu/requirements.launch-core.shared.txt': ['duckdb==1.5.4', 'polars==1.42.0', 'opentimelineio==0.18.1'],
  'server/workers/sound-cpu/requirements.launch-core.pyav.txt': ['av==17.1.0'],
  'server/workers/sound-cpu/requirements.launch-core.opencv-scenedetect.txt': [
    'scenedetect==0.7',
    'opencv-python-headless==4.13.0.92',
  ],
}

const FILES = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-isolated-install-import-proof-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-isolated-install-import-proof-plan',
  },
  commands: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-command-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-command-plan',
  },
  passFail: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-pass-fail-register.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-pass-fail-register',
  },
  safety: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-safety-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-safety-policy',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-install-import-proof.md',
    label: 'worker-runtime-jobs-sound-cpu-controlled-native-runtime-isolated-install-import-proof',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-owner-review.md',
  'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-owner-content-register.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-native-runtime-isolated-install-import-proof-plan.md',
  'package.json',
  'package-lock.json',
]

const MUST_BE_FALSE = [
  'packageInstallRanToday',
  'importProofRanToday',
  'mediaExecutionRanToday',
  'sourceInstallReviewClosedToday',
  'closureApprovedToday',
  'generatedLocalFixturePassedClaimedToday',
  'dryRunPassedClaimedToday',
  'runtimeReadinessClaimedToday',
  'workerReadinessClaimedToday',
  'mediaReadinessClaimedToday',
  'toolExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'tempVenvsInsideRepoAllowed',
  'nodeModulesMutationAllowed',
  'packageLockMutationAllowed',
  'mediaFileOpenAllowed',
  'audioVideoDecodeAllowed',
  'sceneDetectionExecutionAllowed',
  'workerExecutionAllowed',
  'routeExecutionAllowed',
  'toolExecutionAllowed',
  'dockerBuildRunPushAllowed',
  'gcpCloudRunSecretManagerAllowed',
  'supabaseMutationAllowed',
  'sqlExecutionAllowed',
  'artifactCreationAllowed',
  'realUserMediaBetaUnlockAllowed',
  'productionUnlockAllowed',
  'mediaFileOpen',
  'decodeEncode',
  'sceneDetectionExecution',
  'workerExecution',
  'routeExecution',
  'toolExecution',
  'dockerBuildRunPush',
  'gcpCloudRunSecretManager',
  'supabaseMutation',
  'sqlExecution',
  'artifactCreation',
  'realUserMediaBetaUnlock',
  'productionUnlock',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionReady',
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

for (const source of SOURCE_FILES) read(source)
for (const [path, lines] of Object.entries(MANIFESTS)) {
  assert(read(path).trim() === lines.join('\n'), `${path} content mismatch`)
}

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-native-runtime-isolated-install-import-proof-plan:diagnostics'],
  'package script missing',
)

const sourceReview = read('docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-owner-review.md')
assert(sourceReview.includes(SOURCE_DECISION), 'source owner-review decision missing')

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const result = parsed.result
assert(result.decision === DECISION, 'decision mismatch')
assert(result.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(result.sourceBase.splitManifestSourceOwnerReviewPr === 1484, 'source PR mismatch')
assert(result.sourceBase.splitManifestSourceOwnerReviewDecision === SOURCE_DECISION, 'source decision mismatch')
assert(result.planResult.isolatedProofPlanCreated === true, 'plan created flag missing')
assert(result.planResult.sourceInstallReviewClosedCountThisGate === 0, 'must close zero source-install blockers')
assert(result.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const commands = parsed.commands.plannedProofCommands
assert(commands.length === 3, 'planned proof command count mismatch')
for (const manifestPath of Object.keys(MANIFESTS)) {
  assert(commands.some((entry) => entry.manifestPath === manifestPath), `${manifestPath} missing from command plan`)
}
assert(parsed.commands.explicitlyNotExecutedInThisGate.includes('pip install'), 'command plan must record no pip install today')

const passFail = parsed.passFail
assert(passFail.futurePassCriteria.noNativeDuplicateClassWarningInAnyIsolatedLane === true, 'duplicate warning pass criterion missing')
assert(passFail.futurePassCriteria.noMediaFileOpen === true, 'media-open pass criterion missing')
assert(passFail.sourceInstallClosureAfterFuturePass.closureRequiresOwnerReview === true, 'future closure must require owner review')

const safety = parsed.safety.safetyPolicy
assert(safety.tempVenvsInsideRepoAllowed === false, 'venv inside repo must be false')
assert(safety.mediaFileOpenAllowed === false, 'media open must be false')
assert(safety.supabaseMutationAllowed === false, 'supabase must be false')

const blockers = parsed.blockers
assert(blockers.remainingBlockersBeforeFutureProof.some((entry) => entry.id === 'native_ffmpeg_dylib_duplicate_warning'), 'native duplicate blocker missing')
assert(blockers.closureToday.sourceInstallReviewClosedCountThisGate === 0, 'closure count mismatch')

const claims = parsed.claims
assert(claims.allowedClaims.isolatedProofPlanCreated === true, 'proof plan claim missing')
assert(claims.blockedClaims.realUserMediaBetaAllowed === false, 'real-user beta must stay false')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'prompt required decision mismatch')
assert(prompt.allowedProofScope.temporaryPythonVenvsOutsideRepo === true, 'future proof venv policy missing')
assert(prompt.allowedProofScope.mediaFileOpen === false, 'future proof must block media open')
assert(prompt.proofTargets.length === 3, 'future proof target count mismatch')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      splitManifestSourceOwnerReviewPr: 1484,
      isolatedProofPlanCreated: true,
      packageInstallRanToday: false,
      importProofRanToday: false,
      sourceInstallReviewClosedCountThisGate: 0,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
