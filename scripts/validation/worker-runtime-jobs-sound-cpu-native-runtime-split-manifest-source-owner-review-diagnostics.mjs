#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_source_owner_review_passed_with_warnings_ready_for_isolated_install_import_proof_plan_no_install_no_media_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_source_creation_completed_with_warnings_ready_for_source_owner_review_no_install_no_media_no_production'
const SOURCE_HEAD = '73dd7c52fae8bd5439e3a122c3d2fb8bfe1b04f3'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-NATIVE-RUNTIME-ISOLATED-INSTALL-IMPORT-PROOF-PLAN: plan isolated manifest install/import proof, no media/no production'

const MANIFESTS = {
  'server/workers/sound-cpu/requirements.launch-core.shared.txt': ['duckdb==1.5.4', 'polars==1.42.0', 'opentimelineio==0.18.1'],
  'server/workers/sound-cpu/requirements.launch-core.pyav.txt': ['av==17.1.0'],
  'server/workers/sound-cpu/requirements.launch-core.opencv-scenedetect.txt': [
    'scenedetect==0.7',
    'opencv-python-headless==4.13.0.92',
  ],
}

const FILES = {
  review: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-owner-review',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-acceptance-register.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-acceptance-register',
  },
  contents: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-owner-content-register.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-owner-content-register',
  },
  readiness: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-readiness-register.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-isolated-proof-readiness-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-owner-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-owner-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-owner-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-owner-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-native-runtime-isolated-install-import-proof-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-isolated-install-import-proof-plan',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-creation-result.md',
  'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-file-register.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-owner-review.md',
  'package.json',
  'package-lock.json',
]

const MUST_BE_FALSE = [
  'sourceFilesAcceptedForRuntimeToday',
  'packageInstallApprovedToday',
  'installProofRanToday',
  'sourceInstallReviewClosedToday',
  'sourceInstallReviewClosedForNativeRuntimeTargets',
  'generatedLocalFixturePassedClaimedToday',
  'dryRunPassedClaimedToday',
  'runtimeReadinessClaimedToday',
  'workerReadinessClaimedToday',
  'mediaReadinessClaimedToday',
  'toolExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'pythonPackageInstall',
  'nodePackageInstall',
  'runtimeSourceImplementation',
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
  packageJson.scripts['worker-runtime-jobs:sound-cpu-native-runtime-split-manifest-source-owner-review:diagnostics'],
  'package script missing',
)

const sourceCreation = read('docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-creation-result.md')
assert(sourceCreation.includes(SOURCE_DECISION), 'source creation decision missing')

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const review = parsed.review
assert(review.decision === DECISION, 'decision mismatch')
assert(review.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(review.sourceBase.splitManifestSourceCreationPr === 1481, 'source PR mismatch')
assert(review.sourceBase.splitManifestSourceCreationDecision === SOURCE_DECISION, 'source decision mismatch')
assert(review.reviewResult.sourceFilesAcceptedForProofPlanning === true, 'source files must be accepted for proof planning')
assert(review.reviewResult.sourceInstallReviewClosedCountThisGate === 0, 'must close zero source-install blockers')
assert(review.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const acceptance = parsed.acceptance
assert(acceptance.acceptedForProofPlanning.length === 3, 'acceptance count mismatch')
assert(acceptance.notAcceptedToday.packageInstall === false, 'package install must stay rejected')

const contents = parsed.contents.contentReview
assert(contents.combinedManifestPreserved === true, 'combined manifest preservation missing')
assert(contents.versionsMatchCombinedManifest === true, 'version match missing')
assert(parsed.contents.duplicateRiskReview.pyavAndOpenCvStillMustNotShareSamePythonProcess === true, 'same-process guard missing')

const readiness = parsed.readiness.proofPlanningReadiness
assert(readiness.isolatedManifestsExist === true, 'isolated manifests readiness missing')
assert(readiness.proofPlanningMayProceed === true, 'proof planning readiness missing')
assert(readiness.proofExecutionMayProceedToday === false, 'proof execution must stay false')

const blockers = parsed.blockers
assert(blockers.remainingBlockers.some((entry) => entry.id === 'native_ffmpeg_dylib_duplicate_warning'), 'native duplicate blocker missing')
assert(blockers.closureToday.sourceInstallReviewClosedCountThisGate === 0, 'closure count mismatch')

const claims = parsed.claims
assert(claims.allowedClaims.sourceFilesAcceptedForProofPlanning === true, 'source acceptance claim missing')
assert(claims.blockedClaims.realUserMediaBetaAllowed === false, 'real-user beta must stay false')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'prompt required decision mismatch')
assert(prompt.allowedPlanScope.proofCommandPlanning === true, 'proof planning scope missing')
assert(prompt.allowedPlanScope.pythonPackageInstall === false, 'proof plan must not install')
assert(prompt.proofTargets.length === 3, 'proof target count mismatch')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      splitManifestSourceCreationPr: 1481,
      sourceFilesAcceptedForProofPlanning: true,
      proofExecutionMayProceedToday: false,
      sourceInstallReviewClosedCountThisGate: 0,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
