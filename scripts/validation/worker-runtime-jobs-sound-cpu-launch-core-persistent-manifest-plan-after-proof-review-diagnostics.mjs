#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_persistent_manifest_plan_after_proof_review_completed_with_warnings_ready_for_persistent_manifest_source_plan_no_runtime_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_dependency_install_proof_owner_review_after_proof_passed_with_warnings_ready_for_persistent_manifest_plan_no_runtime_no_production'
const SOURCE_HEAD = 'e35acdd53893deb028baac3774e1ec258db42c50'
const PYTHON_TARGET = 'server/workers/sound-cpu/requirements.launch-core.txt'
const NODE_MANIFEST = 'package.json'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-PERSISTENT-MANIFEST-SOURCE-PLAN-AFTER-MANIFEST-PLAN: plan source mutation for launch-core manifests, no runtime/no production'

const FILES = {
  result: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-plan-after-proof-review.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-plan-after-proof-review-result',
  },
  python: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-python-manifest-placement-plan-after-proof-review.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-python-manifest-placement-plan-after-proof-review',
  },
  node: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-node-manifest-placement-plan-after-proof-review.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-node-manifest-placement-plan-after-proof-review',
  },
  lockfile: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-lockfile-review-plan-after-proof-review.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-lockfile-review-plan-after-proof-review',
  },
  warnings: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-manifest-warning-register-after-proof-review.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-manifest-warning-register-after-proof-review',
  },
  claim: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-claim-policy-after-proof-review.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-claim-policy-after-proof-review',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-source-plan-after-manifest-plan.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-source-plan-after-manifest-plan',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-launch-core-dependency-install-proof-owner-review-after-proof.md',
  'docs/worker-runtime-jobs-sound-cpu-launch-core-dependency-proof-acceptance-register-after-proof.md',
  'docs/worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-decision-register-after-proof.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-launch-core-python-proof-register-after-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-launch-core-node-proof-register-after-plan.md',
  'server/workers/sound-oss-tools-controlled-install/requirements.sound-oss-tools.txt',
  'server/workers/sound-cpu/Dockerfile',
  'docs/cross-chat-tool-ownership-registry.md',
]

const FORBIDDEN_TRUE_KEYS = [
  'requirementsFileCreated',
  'requirementsFileMutated',
  'packageJsonDependencyMutated',
  'packageLockMutated',
  'dependencyInstallPersisted',
  'manifestSourceMutationApprovedToday',
  'dependencyInstallApprovedToday',
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
  'modelDownloadApprovedToday',
  'providerModelCallApprovedToday',
  'externalProductBetaReady',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionReady',
  'generatedLocalFixturePassedClaimedToday',
  'dryRunPassedClaimedToday',
  'runtimeReadinessClaimedToday',
  'mediaReadinessClaimedToday',
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

function scanForbiddenTrue(value, trail = []) {
  if (value === null || value === undefined || typeof value !== 'object') return
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanForbiddenTrue(entry, trail.concat(String(index))))
    return
  }
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_TRUE_KEYS.includes(key)) {
      assert(child === false, `${trail.concat(key).join('.')} must remain false`)
    }
    scanForbiddenTrue(child, trail.concat(key))
  }
}

function scanUnsafe(files) {
  const patterns = [
    /BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/,
    new RegExp(['SUPABASE', 'SERVICE', 'ROLE'].join('_')),
    new RegExp(['service', 'role', 'key'].join('_'), 'i'),
    /postgres(?:ql)?:\/\//i,
    new RegExp(['GOOGLE', 'APPLICATION', 'CREDENTIALS'].join('_')),
    new RegExp(['STRIPE', 'SECRET'].join('_')),
    new RegExp(['sk', 'live', ''].join('_')),
    /ghp_[A-Za-z0-9_]{20,}/,
    /"realUserMediaBetaAllowed"\s*:\s*true/,
    /"paidProductionAllowed"\s*:\s*true/,
    /"runtimeReadinessClaimedToday"\s*:\s*true/,
  ]
  for (const file of files) {
    const text = read(file)
    for (const pattern of patterns) {
      assert(!pattern.test(text), `${file} matched unsafe pattern ${pattern}`)
    }
  }
}

for (const source of SOURCE_FILES) read(source)
assert(!existsSync(PYTHON_TARGET), `${PYTHON_TARGET} must not be created by this plan`)

const parsed = Object.fromEntries(
  Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]),
)

for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanForbiddenTrue(doc, [name])
}

const result = parsed.result
assert(result.decision === DECISION, 'result decision mismatch')
assert(result.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(result.sourceBase.ownerReviewPr === 1442, 'owner review PR mismatch')
assert(result.sourceBase.ownerReviewDecision === SOURCE_DECISION, 'source decision mismatch')
assert(result.planResult.persistentManifestPlanCreated === true, 'manifest plan missing')
assert(result.planResult.missingRequiredChecks === 0, 'missing required checks must be zero')
assert(result.selectedFutureTargets.pythonRequirementsPath === PYTHON_TARGET, 'Python target mismatch')
assert(result.selectedFutureTargets.nodeManifestPath === NODE_MANIFEST, 'Node manifest mismatch')
assert(result.selectedFutureTargets.nodeManifestSection === 'dependencies', 'Node manifest section mismatch')
assert(result.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const python = parsed.python
assert(python.selectedFutureRequirementsPath === PYTHON_TARGET, 'Python placement target mismatch')
assert(python.pathDecision.createSeparateLaunchCoreRequirementsFileLater === true, 'separate requirements decision missing')
assert(python.pathDecision.mutateExistingSoundOssToolsRequirementsToday === false, 'existing requirements must not mutate')
assert(python.plannedPythonRequirements.length === 6, 'Python requirement count mismatch')
for (const requirementName of ['av', 'scenedetect', 'opencv-python-headless', 'duckdb', 'polars', 'opentimelineio']) {
  const item = python.plannedPythonRequirements.find((entry) => entry.requirementName === requirementName)
  assert(item, `missing Python requirement ${requirementName}`)
  assert(item.sourceMutationApprovedToday === false, `${requirementName} source mutation must remain false`)
}
assert(
  python.plannedPythonRequirements.find((entry) => entry.requirementName === 'opencv-python-headless')
    ?.futurePinStrategy === 'resolve_distribution_version_before_source_mutation',
  'OpenCV distribution-version guard missing',
)

const node = parsed.node
assert(node.selectedFutureManifestPath === NODE_MANIFEST, 'Node placement target mismatch')
assert(node.selectedFutureManifestSection === 'dependencies', 'Node section mismatch')
assert(node.pathDecision.packageJsonMutationApprovedToday === false, 'package.json mutation must remain false')
assert(node.pathDecision.packageLockMutationApprovedToday === false, 'package-lock mutation must remain false')
assert(node.plannedNodeDependencies.length === 2, 'Node dependency count mismatch')
for (const packageName of ['sharp', 'remotion']) {
  const item = node.plannedNodeDependencies.find((entry) => entry.packageName === packageName)
  assert(item, `missing Node package ${packageName}`)
  assert(item.sourceMutationApprovedToday === false, `${packageName} source mutation must remain false`)
  assert(item.runtimeExecutionApprovedToday === false, `${packageName} runtime must remain false`)
}
assert(node.deferredNodeDependency.packageName === 'hyperframe', 'hyperframe deferral missing')

const lockfile = parsed.lockfile
assert(lockfile.currentPackageLockHash === 'bbc17b3cb96f642deb5316c680074b1c7e76fd8410bf30ea7db516f10db5ebe3', 'lock hash mismatch')
assert(lockfile.lockfileMutationApprovedToday === false, 'lockfile mutation must remain false')
assert(lockfile.futureLockfileReviewRequired === true, 'lockfile review requirement missing')
assert(lockfile.futureLockfileReviewPlan.length >= 5, 'lockfile review plan too small')

const warnings = parsed.warnings
assert(warnings.warningsPreserved.length === 6, 'warning count mismatch')
for (const id of [
  'pyav_opencv_bundled_ffmpeg_dylib_overlap',
  'ffmpeg_lgpl_safe_build_manual_review',
  'libass_filter_inspection_warning',
  'persistent_manifest_source_not_created',
]) {
  assert(warnings.warningsPreserved.some((entry) => entry.id === id), `missing warning ${id}`)
}
assert(warnings.warningConclusion.runtimeReadinessStillBlocked === true, 'runtime warning conclusion missing')
assert(warnings.warningConclusion.realUserMediaBetaStillBlocked === true, 'beta warning conclusion missing')

const claim = parsed.claim
assert(claim.allowedClaimsToday.includes('future Python requirements path selected'), 'allowed Python path claim missing')
assert(claim.claimConclusion.planCanFeedManifestSourcePlan === true, 'source-plan handoff missing')
assert(claim.claimConclusion.planCanMutateManifestSource === false, 'source mutation must remain false')
for (const [key, value] of Object.entries(claim.closedClaimsToday)) {
  assert(value === false, `${key} must remain false`)
}

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'prompt source decision mismatch')
assert(prompt.futureSourceTargets.pythonRequirementsPath === PYTHON_TARGET, 'prompt Python target mismatch')
assert(prompt.futureSourceTargets.nodeManifestSection === 'dependencies', 'prompt Node section mismatch')
assert(prompt.requiredFutureScope.resolveExactPythonDistributionPins === true, 'prompt exact pin requirement missing')
for (const [key, value] of Object.entries(prompt.forbiddenScope)) {
  assert(value === false, `prompt forbidden scope ${key} must remain false`)
}

const pkg = JSON.parse(read('package.json'))
assert(!pkg.dependencies?.sharp, 'sharp must not be added in this plan')
assert(!pkg.dependencies?.remotion, 'remotion must not be added in this plan')
assert(
  pkg.scripts['worker-runtime-jobs:sound-cpu-launch-core-persistent-manifest-plan-after-proof-review:diagnostics'],
  'package script missing',
)

scanUnsafe(Object.values(FILES).map((info) => info.path))

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceOwnerReviewPr: 1442,
      sourceHead: SOURCE_HEAD,
      pythonRequirementsPath: PYTHON_TARGET,
      nodeManifestPath: NODE_MANIFEST,
      nodeManifestSection: 'dependencies',
      manifestSourceMutationApprovedToday: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
