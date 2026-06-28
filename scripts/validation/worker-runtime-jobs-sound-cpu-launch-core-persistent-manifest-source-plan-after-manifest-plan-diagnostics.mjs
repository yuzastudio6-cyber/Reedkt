#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_persistent_manifest_source_plan_after_manifest_plan_completed_with_warnings_ready_for_persistent_manifest_source_creation_no_runtime_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_persistent_manifest_plan_after_proof_review_completed_with_warnings_ready_for_persistent_manifest_source_plan_no_runtime_no_production'
const SOURCE_HEAD = 'd814b92c9613c178f36aa322c85084c9fbe4f166'
const PYTHON_TARGET = 'server/workers/sound-cpu/requirements.launch-core.txt'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-PERSISTENT-MANIFEST-SOURCE-CREATION-AFTER-SOURCE-PLAN: create persistent launch-core manifests, no runtime/no production'

const FILES = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-source-plan-after-manifest-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-source-plan-after-manifest-plan-result',
  },
  files: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-source-creation-file-plan-after-manifest-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-source-creation-file-plan-after-manifest-plan',
  },
  validation: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-source-creation-validation-plan-after-manifest-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-source-creation-validation-plan-after-manifest-plan',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-source-creation-blocker-register-after-manifest-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-source-creation-blocker-register-after-manifest-plan',
  },
  claim: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-source-creation-claim-policy-after-manifest-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-source-creation-claim-policy-after-manifest-plan',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-source-creation-after-source-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-source-creation-after-source-plan',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-plan-after-proof-review.md',
  'docs/worker-runtime-jobs-sound-cpu-launch-core-python-manifest-placement-plan-after-proof-review.md',
  'docs/worker-runtime-jobs-sound-cpu-launch-core-node-manifest-placement-plan-after-proof-review.md',
  'docs/worker-runtime-jobs-sound-cpu-launch-core-lockfile-review-plan-after-proof-review.md',
  'docs/cross-chat-tool-ownership-registry.md',
]

const MUST_BE_FALSE = [
  'actualSourceMutationApprovedToday',
  'requirementsFileCreationApprovedToday',
  'packageJsonDependencyMutationApprovedToday',
  'packageLockMutationApprovedToday',
  'requirementsFileCreated',
  'requirementsFileMutated',
  'packageJsonDependencyMutated',
  'packageLockMutated',
  'dependencyInstallPersisted',
  'runtimeExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'toolExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'imageProcessingApprovedToday',
  'remotionRenderingApprovedToday',
  'dockerBuildRunPushApprovedToday',
  'gcpCloudRunSecretManagerApprovedToday',
  'supabaseMutationApprovedToday',
  'sqlExecutionApprovedToday',
  'artifactDeliveryApprovedToday',
  'externalProductBetaReady',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionReady',
  'generatedLocalFixturePassedClaimedToday',
  'dryRunPassedClaimedToday',
  'runtimeReadinessClaimedToday',
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
assert(!existsSync(PYTHON_TARGET), `${PYTHON_TARGET} must not exist in source-plan gate`)

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))

for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const result = parsed.result
assert(result.decision === DECISION, 'decision mismatch')
assert(result.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(result.sourceBase.manifestPlanPr === 1446, 'manifest plan PR mismatch')
assert(result.sourceBase.manifestPlanDecision === SOURCE_DECISION, 'source decision mismatch')
assert(result.sourcePlanResult.sourceMutationPlanCreated === true, 'source plan flag missing')
assert(result.futureSourceCreationTargets.pythonRequirementsPath === PYTHON_TARGET, 'Python target mismatch')
assert(result.futureCreationOrder.length === 5, 'future creation order mismatch')
assert(result.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const files = parsed.files
assert(files.futurePythonRequirementsFile.path === PYTHON_TARGET, 'file plan Python target mismatch')
assert(files.futurePythonRequirementsFile.createdToday === false, 'Python requirements must not be created today')
assert(files.futurePythonRequirementLines.length === 6, 'Python requirement line count mismatch')
assert(files.futurePythonRequirementLines.some((line) => line.includes('opencv-python-headless==<resolve exact distribution version')), 'OpenCV exact-resolution guard missing')
assert(files.futureNodeManifestChange.path === 'package.json', 'Node manifest path mismatch')
assert(files.futureNodeManifestChange.section === 'dependencies', 'Node section mismatch')
assert(files.futureNodeManifestChange.createdToday === false, 'Node manifest mutation must be false')
assert(files.futureNodeManifestChange.dependencyLines.sharp === '0.35.2', 'sharp version mismatch')
assert(files.futureNodeManifestChange.dependencyLines.remotion === '4.0.484', 'remotion version mismatch')

const validation = parsed.validation
assert(validation.futureValidationPlan.length >= 6, 'validation plan too small')
assert(validation.approvedExecutionInNextGate.dependencyHydrationForValidationOnly === true, 'validation hydration allowance missing')
assert(validation.approvedExecutionInNextGate.runtimeExecution === false, 'runtime must remain false')
assert(validation.approvedExecutionInNextGate.dockerGcpSupabaseSql === false, 'Docker/GCP/Supabase/SQL must remain false')

const blockers = parsed.blockers
assert(blockers.blockersPreserved.length === 5, 'blocker count mismatch')
for (const id of ['opencv_distribution_pin_resolution', 'package_lock_diff_review', 'ffmpeg_lgpl_safe_build_manual_review']) {
  assert(blockers.blockersPreserved.some((entry) => entry.id === id), `missing blocker ${id}`)
}
assert(blockers.blockerConclusion.sourceCreationMayProceedAfterThisPlan === true, 'source creation handoff missing')
assert(blockers.blockerConclusion.realUserMediaBetaStillBlocked === true, 'real user beta must remain blocked')

const claim = parsed.claim
assert(claim.allowedClaimsToday.includes('persistent manifest source creation plan created'), 'allowed plan claim missing')
assert(claim.claimConclusion.planCanFeedSourceCreation === true, 'source creation handoff claim missing')
assert(claim.claimConclusion.planCanMutateSourceToday === false, 'source mutation must remain false')
for (const [key, value] of Object.entries(claim.closedClaimsToday)) {
  assert(value === false, `${key} must remain false`)
}

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'prompt source decision mismatch')
assert(prompt.sourceCreationTargets.pythonRequirementsPath === PYTHON_TARGET, 'prompt Python target mismatch')
assert(prompt.allowedInSourceCreationGate.requirementsFileCreation === true, 'future source creation allowance missing')
assert(prompt.allowedInSourceCreationGate.runtimeExecution === false, 'future prompt runtime must remain false')
assert(prompt.allowedInSourceCreationGate.productionUnlock === false, 'future prompt production unlock must remain false')

const pkg = JSON.parse(read('package.json'))
assert(!pkg.dependencies?.sharp, 'sharp must not be added in source-plan gate')
assert(!pkg.dependencies?.remotion, 'remotion must not be added in source-plan gate')
assert(
  pkg.scripts['worker-runtime-jobs:sound-cpu-launch-core-persistent-manifest-source-plan-after-manifest-plan:diagnostics'],
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceManifestPlanPr: 1446,
      sourceHead: SOURCE_HEAD,
      sourceCreationPlanCreated: true,
      requirementsFileCreated: false,
      packageJsonDependencyMutated: false,
      packageLockMutated: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
