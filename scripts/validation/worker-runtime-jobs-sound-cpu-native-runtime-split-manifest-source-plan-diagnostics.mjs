#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_source_plan_completed_with_warnings_ready_for_source_creation_no_media_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_native_runtime_split_manifest_plan_completed_with_warnings_ready_for_split_manifest_source_plan_no_media_no_production'
const SOURCE_HEAD = '7d9360a10e99df53c26bc3d0cc18c3e4e0b0c526'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-NATIVE-RUNTIME-SPLIT-MANIFEST-SOURCE-CREATION: create isolated manifest source files, no install/no media/no production'

const PLANNED_PATHS = [
  'server/workers/sound-cpu/requirements.launch-core.shared.txt',
  'server/workers/sound-cpu/requirements.launch-core.pyav.txt',
  'server/workers/sound-cpu/requirements.launch-core.opencv-scenedetect.txt',
]

const FILES = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-plan-result',
  },
  paths: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-path-register.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-path-register',
  },
  contents: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-content-register.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-content-register',
  },
  proof: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-proof-handoff.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-proof-handoff',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-claim-policy',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-creation.md',
    label: 'worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-creation',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-strategy-register.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-source-plan.md',
  'server/workers/sound-cpu/requirements.launch-core.txt',
  'package.json',
  'package-lock.json',
]

const MUST_BE_FALSE = [
  'requirementsFilesCreatedToday',
  'requirementsFilesChangedToday',
  'runtimeSourceChangedToday',
  'installProofRanToday',
  'sourceInstallReviewClosedToday',
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

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-native-runtime-split-manifest-source-plan:diagnostics'],
  'package script missing',
)

const priorPlan = read('docs/worker-runtime-jobs-sound-cpu-native-runtime-split-manifest-plan.md')
assert(priorPlan.includes(SOURCE_DECISION), 'source split plan decision missing')

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const result = parsed.result
assert(result.decision === DECISION, 'decision mismatch')
assert(result.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(result.sourceBase.splitManifestPlanPr === 1475, 'source PR mismatch')
assert(result.sourceBase.splitManifestPlanDecision === SOURCE_DECISION, 'source decision mismatch')
assert(result.sourcePlanResult.sourcePlanCreated === true, 'source plan flag missing')
assert(result.sourcePlanResult.requirementsFilesCreatedToday === false, 'requirements must not be created today')
assert(result.sourcePlanResult.sourceInstallReviewClosedCountThisGate === 0, 'must close zero source-install blockers')
assert(result.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const paths = parsed.paths.plannedSourcePaths
assert(paths.length === 3, 'planned source path count mismatch')
for (const path of PLANNED_PATHS) {
  assert(paths.some((entry) => entry.path === path && entry.status === 'planned_not_created'), `${path} must be planned_not_created`)
  assert(!existsSync(path), `${path} must not exist in source-plan gate`)
}

const contents = parsed.contents.plannedManifestContents
assert(contents.length === 3, 'planned manifest contents count mismatch')
assert(contents.some((entry) => entry.path === PLANNED_PATHS[0] && entry.plannedLines.includes('duckdb==1.5.4')), 'shared manifest duckdb line missing')
assert(contents.some((entry) => entry.path === PLANNED_PATHS[1] && entry.plannedLines.includes('av==17.1.0')), 'pyav line missing')
assert(
  contents.some((entry) => entry.path === PLANNED_PATHS[2] && entry.plannedLines.includes('opencv-python-headless==4.13.0.92')),
  'opencv line missing',
)
assert(
  contents.some((entry) => entry.path === PLANNED_PATHS[2] && entry.plannedLines.includes('scenedetect==0.7')),
  'scenedetect line missing',
)
assert(contents.plannedCompatibilityRule === undefined, 'content register schema should keep compatibility rule inside document root')
assert(parsed.contents.plannedCompatibilityRule?.preserveCurrentCombinedManifestUntilConsumerMigration === true, 'compatibility rule missing')

const proof = parsed.proof.proofHandoff
assert(proof.requiredProofsAfterSourceCreationAndReview.length === 3, 'proof handoff count mismatch')
assert(proof.forbiddenInProof.includes('media file open'), 'proof must forbid media open')
assert(proof.forbiddenInProof.includes('readiness unlock'), 'proof must forbid readiness unlock')

const blockers = parsed.blockers
assert(blockers.blockersRemaining.some((entry) => entry.id === 'native_ffmpeg_dylib_duplicate_warning'), 'duplicate blocker missing')
assert(blockers.closureToday.requirementsFilesCreatedToday === false, 'closure must record no source creation')

const claims = parsed.claims
assert(claims.allowedClaims.sourcePlanCreated === true, 'source plan claim missing')
assert(claims.blockedClaims.realUserMediaBetaAllowed === false, 'real-user beta must stay false')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'prompt required decision mismatch')
assert(prompt.allowedSourceCreationScope.createRequirementsFiles === true, 'source creation prompt must allow requirements file creation')
assert(prompt.allowedSourceCreationScope.pythonPackageInstall === false, 'source creation prompt must not allow installs')
assert(Object.keys(prompt.requiredFilesToCreate).length === 3, 'source creation prompt file count mismatch')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      splitManifestPlanPr: 1475,
      sourcePlanCreated: true,
      requirementsFilesCreatedToday: false,
      sourceInstallReviewClosedCountThisGate: 0,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
