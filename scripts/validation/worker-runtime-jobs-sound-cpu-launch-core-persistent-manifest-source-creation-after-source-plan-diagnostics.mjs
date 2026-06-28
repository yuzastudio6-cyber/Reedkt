#!/usr/bin/env node
import { existsSync, lstatSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_persistent_manifest_source_creation_after_source_plan_completed_with_warnings_ready_for_persistent_manifest_owner_review_no_runtime_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_persistent_manifest_source_plan_after_manifest_plan_completed_with_warnings_ready_for_persistent_manifest_source_creation_no_runtime_no_production'
const SOURCE_HEAD = '1031a2c8f6c4344ac69cd8136d796b9d7ae22d36'
const REQUIREMENTS_PATH = 'server/workers/sound-cpu/requirements.launch-core.txt'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-PERSISTENT-MANIFEST-OWNER-REVIEW-AFTER-SOURCE-CREATION: review persistent launch-core manifest source, no runtime/no production'

const PYTHON_LINES = [
  'av==17.1.0',
  'scenedetect==0.7',
  'opencv-python-headless==4.13.0.92',
  'duckdb==1.5.4',
  'polars==1.42.0',
  'opentimelineio==0.18.1',
]

const FILES = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-source-creation-after-source-plan.md',
    label:
      'worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-source-creation-after-source-plan-result',
  },
  python: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-python-requirements-source-register-after-source-plan.md',
    label:
      'worker-runtime-jobs-sound-cpu-launch-core-python-requirements-source-register-after-source-plan',
  },
  node: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-node-lockfile-source-register-after-source-plan.md',
    label:
      'worker-runtime-jobs-sound-cpu-launch-core-node-lockfile-source-register-after-source-plan',
  },
  validation: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-source-creation-validation-register-after-source-plan.md',
    label:
      'worker-runtime-jobs-sound-cpu-launch-core-source-creation-validation-register-after-source-plan',
  },
  claim: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-source-creation-claim-policy-after-source-plan.md',
    label:
      'worker-runtime-jobs-sound-cpu-launch-core-source-creation-claim-policy-after-source-plan',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-owner-review-after-source-creation.md',
    label:
      'worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-owner-review-after-source-creation',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-source-plan-after-manifest-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-launch-core-source-creation-file-plan-after-manifest-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-launch-core-source-creation-validation-plan-after-manifest-plan.md',
  'docs/cross-chat-tool-ownership-registry.md',
]

const MUST_BE_FALSE = [
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
  'workerReadinessClaimedToday',
  'mediaReadinessClaimedToday',
  'dockerImageReadinessClaimedToday',
  'runtimeUseApprovedToday',
  'mediaFileOpenAllowed',
  'ffmpegInvocationAllowed',
  'opencvMediaOperationAllowed',
  'workerExecutionAllowed',
  'artifactCreationAllowed',
  'nodeModulesCreatedOrStaged',
  'installScriptsExecuted',
  'remotionRenderApprovedToday',
  'imageProcessingApprovedToday',
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

function assertNoForbiddenPaths(paths) {
  for (const path of paths) {
    assert(!existsSync(path), `${path} must not exist in this source-creation gate`)
  }
}

for (const source of SOURCE_FILES) read(source)
assert(existsSync(REQUIREMENTS_PATH), `${REQUIREMENTS_PATH} must exist`)
assert(!lstatSync(REQUIREMENTS_PATH).isSymbolicLink(), `${REQUIREMENTS_PATH} must not be a symlink`)
assertNoForbiddenPaths(['dist', 'dist-server'])

const requirements = read(REQUIREMENTS_PATH).trim().split(/\r?\n/)
assert(requirements.length === PYTHON_LINES.length, 'Python requirements line count mismatch')
for (const [index, expected] of PYTHON_LINES.entries()) {
  assert(requirements[index] === expected, `Python requirements line ${index + 1} mismatch`)
}

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))

for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const result = parsed.result
assert(result.decision === DECISION, 'decision mismatch')
assert(result.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(result.sourceBase.sourcePlanPr === 1449, 'source plan PR mismatch')
assert(result.sourceBase.sourcePlanDecision === SOURCE_DECISION, 'source plan decision mismatch')
assert(result.sourceCreationResult.pythonRequirementsCreated === true, 'Python requirements creation missing')
assert(result.sourceCreationResult.packageJsonDependencyMutationCompleted === true, 'package.json mutation missing')
assert(result.sourceCreationResult.packageLockMutationCompleted === true, 'package-lock mutation missing')
assert(result.sourceCreationResult.approvedDependencyClosureOnly === true, 'approved closure flag missing')
assert(result.launchCorePersistentTools.pythonPackages.length === 6, 'Python package count mismatch')
assert(result.launchCorePersistentTools.nodePackages.sharp === '0.35.2', 'sharp result mismatch')
assert(result.launchCorePersistentTools.nodePackages.remotion === '4.0.484', 'remotion result mismatch')
assert(result.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const python = parsed.python
assert(python.requirementsSource.path === REQUIREMENTS_PATH, 'Python source path mismatch')
assert(python.requirementsSource.createdToday === true, 'Python source created flag mismatch')
assert(python.requirementsSource.lineCount === 6, 'Python source line count mismatch')
assert(python.requiredPins.length === 6, 'Python pin count mismatch')
for (const line of PYTHON_LINES) {
  const [name, version] = line.split('==')
  assert(
    python.requiredPins.some((entry) => entry.package === name && entry.version === version),
    `missing Python pin ${line}`,
  )
}
assert(python.validationOnlyPolicy.pythonPackageInstallAllowedForValidation === true, 'Python validation allowance missing')

const node = parsed.node
assert(node.nodeManifestSource.packageJsonDependencyMutationCompleted === true, 'Node manifest mutation flag missing')
assert(node.nodeManifestSource.packageLockMutationCompleted === true, 'Node lock mutation flag missing')
assert(node.requiredRootDependencies.sharp === '0.35.2', 'Node sharp mismatch')
assert(node.requiredRootDependencies.remotion === '4.0.484', 'Node remotion mismatch')
assert(node.lockfilePolicy.lockfileUpdateAllowedToday === true, 'lockfile allowance missing')
assert(node.lockfilePolicy.approvedDependencyClosureOnly === true, 'approved lock closure missing')

const validation = parsed.validation
assert(validation.requiredValidation.length >= 8, 'validation list too small')
assert(validation.validationScope.dependencyHydrationForValidationOnly === true, 'validation hydration missing')
assert(validation.validationScope.packageLockHashMayChangeForApprovedDependencies === true, 'lock hash allowance missing')

const claim = parsed.claim
assert(claim.allowedClaimsToday.length === 4, 'allowed claim count mismatch')
assert(claim.claimConclusion.persistentManifestSourceCreated === true, 'claim persistent source missing')
assert(claim.claimConclusion.ownerReviewMayProceed === true, 'owner review handoff missing')
assert(claim.claimConclusion.realUserMediaBetaStillBlocked === true, 'real user beta blocker missing')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'prompt required decision mismatch')
assert(prompt.sourceReviewInputs.pythonRequirementsPath === REQUIREMENTS_PATH, 'prompt Python source mismatch')
assert(prompt.sourceReviewInputs.requiredPythonPins.length === 6, 'prompt Python pin count mismatch')
assert(prompt.allowedInOwnerReview.sourceReview === true, 'prompt source review allowance missing')
assert(prompt.allowedInOwnerReview.runtimeExecution === false, 'prompt runtime must be false')
assert(prompt.allowedInOwnerReview.productionUnlock === false, 'prompt production must be false')

const pkg = JSON.parse(read('package.json'))
assert(pkg.dependencies?.sharp === '0.35.2', 'package.json sharp dependency mismatch')
assert(pkg.dependencies?.remotion === '4.0.484', 'package.json remotion dependency mismatch')
assert(
  pkg.scripts['worker-runtime-jobs:sound-cpu-launch-core-persistent-manifest-source-creation-after-source-plan:diagnostics'],
  'package script missing',
)

const lock = JSON.parse(read('package-lock.json'))
assert(lock.packages?.['']?.dependencies?.sharp === '0.35.2', 'package-lock root sharp mismatch')
assert(lock.packages?.['']?.dependencies?.remotion === '4.0.484', 'package-lock root remotion mismatch')
assert(lock.packages?.['node_modules/sharp']?.version === '0.35.2', 'package-lock sharp package mismatch')
assert(lock.packages?.['node_modules/remotion']?.version === '4.0.484', 'package-lock remotion package mismatch')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceHead: SOURCE_HEAD,
      sourcePlanPr: 1449,
      pythonRequirementsCreated: true,
      pythonRequirementCount: PYTHON_LINES.length,
      nodeDependencies: { sharp: '0.35.2', remotion: '4.0.484' },
      packageLockUpdated: true,
      runtimeExecutionApprovedToday: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
