#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_dependency_install_proof_owner_review_after_proof_passed_with_warnings_ready_for_persistent_manifest_plan_no_runtime_no_production'
const SOURCE_PROOF_DECISION =
  'worker_runtime_jobs_sound_cpu_controlled_launch_core_dependency_install_proof_after_plan_passed_required_checks_with_warnings_ready_for_dependency_install_proof_owner_review_no_runtime_no_production'
const SOURCE_HEAD = '8205ef04f3eafe7aaf118b1673b99fb01d30cefb'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-LAUNCH-CORE-PERSISTENT-MANIFEST-PLAN-AFTER-PROOF-REVIEW: plan persistent launch-core dependency manifests, no runtime/no production'

const FILES = {
  review: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-dependency-install-proof-owner-review-after-proof.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-dependency-install-proof-owner-review-after-proof',
  },
  acceptance: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-dependency-proof-acceptance-register-after-proof.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-dependency-proof-acceptance-register-after-proof',
  },
  manifest: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-decision-register-after-proof.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-decision-register-after-proof',
  },
  warnings: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-dependency-warning-owner-register-after-proof.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-dependency-warning-owner-register-after-proof',
  },
  claim: {
    path: 'docs/worker-runtime-jobs-sound-cpu-launch-core-dependency-proof-owner-claim-policy-after-proof.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-dependency-proof-owner-claim-policy-after-proof',
  },
  prompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-plan-after-proof-review.md',
    label: 'worker-runtime-jobs-sound-cpu-launch-core-persistent-manifest-plan-after-proof-review',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-controlled-launch-core-dependency-install-proof-after-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-launch-core-python-proof-register-after-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-launch-core-node-proof-register-after-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-launch-core-dependency-warning-register-after-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-controlled-launch-core-dependency-install-claim-policy-after-plan.md',
  'docs/cross-chat-tool-ownership-registry.md',
  'server/workers/production-readiness/core-cpu-render-readiness-checks.ts',
]

const FORBIDDEN_TRUE_KEYS = [
  'runtimeExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'productToolCallExecutionApprovedToday',
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

const parsed = Object.fromEntries(
  Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]),
)

for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanForbiddenTrue(doc, [name])
}

const review = parsed.review
assert(review.decision === DECISION, 'review decision mismatch')
assert(review.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(review.sourceBase.proofPr === 1440, 'proof PR mismatch')
assert(review.sourceBase.proofDecision === SOURCE_PROOF_DECISION, 'proof decision mismatch')
assert(review.acceptedEvidence.requiredLaunchCoreChecksPassed === true, 'required checks acceptance missing')
assert(review.acceptedEvidence.missingRequiredChecks === 0, 'missing required checks must be zero')
assert(review.acceptedEvidence.nodeMetadataResolverFixAccepted === true, 'metadata resolver acceptance missing')
assert(review.ownerReviewResult.proofMayFeedPersistentManifestPlan === true, 'persistent manifest handoff missing')
assert(review.ownerReviewResult.runtimeReady === false, 'runtime must remain false')
assert(review.nextPrompt === NEXT_PROMPT, 'next prompt mismatch')

const acceptance = parsed.acceptance
assert(acceptance.decision === DECISION, 'acceptance decision mismatch')
assert(acceptance.sourceProofDecision === SOURCE_PROOF_DECISION, 'acceptance source decision mismatch')
assert(acceptance.summary.requiredChecksAccepted === true, 'acceptance required checks missing')
assert(acceptance.summary.missingRequiredChecks === 0, 'acceptance missing-required mismatch')
assert(acceptance.summary.persistentManifestPlanRequired === true, 'persistent manifest requirement missing')
for (const item of acceptance.register) {
  assert(item.accepted === true, `${item.item} must be accepted`)
  assert(item.acceptedForPersistentManifestPlanning === true, `${item.item} must feed planning`)
  assert(item.acceptedForRuntimeExecutionToday === false, `${item.item} must not approve runtime`)
}

const manifest = parsed.manifest
assert(manifest.persistentManifestDecision.pythonWorkerRequirementPinsShouldBePlanned === true, 'Python manifest planning missing')
assert(manifest.persistentManifestDecision.nodePackageManifestPlacementShouldBePlanned === true, 'Node manifest planning missing')
assert(manifest.persistentManifestDecision.sourceLockfileMutationApprovedToday === false, 'lockfile mutation must stay closed')
assert(manifest.futureManifestCandidates.pythonPackages.length === 6, 'Python package count mismatch')
assert(manifest.futureManifestCandidates.nodePackages.includes('sharp'), 'sharp missing')
assert(manifest.futureManifestCandidates.nodePackages.includes('remotion'), 'remotion missing')
assert(manifest.nextPrompt === NEXT_PROMPT, 'manifest next prompt mismatch')

const warnings = parsed.warnings
assert(warnings.warningsPreserved.length === 6, 'warning count mismatch')
for (const id of [
  'pyav_opencv_bundled_ffmpeg_dylib_overlap',
  'libass_filter_inspection_warning',
  'ffmpeg_lgpl_safe_build_manual_review',
  'persistent_manifest_absent',
]) {
  assert(warnings.warningsPreserved.some((entry) => entry.id === id), `missing warning ${id}`)
}
assert(warnings.warningConclusion.requiredChecksAccepted === true, 'warning conclusion required acceptance mismatch')
assert(warnings.warningConclusion.realUserMediaBetaStillBlocked === true, 'real-user beta must remain blocked')

const claim = parsed.claim
assert(claim.allowedClaimsToday.includes('persistent manifest planning may proceed'), 'allowed planning claim missing')
for (const [key, value] of Object.entries(claim.closedClaimsToday)) {
  assert(value === false, `${key} must remain false`)
}
assert(claim.claimConclusion.proofCanFeedPersistentManifestPlan === true, 'claim handoff missing')
assert(claim.claimConclusion.proofCanUnlockRuntime === false, 'claim runtime unlock must be false')
assert(claim.claimConclusion.proofCanUnlockRealUserMediaBeta === false, 'claim beta unlock must be false')

const prompt = parsed.prompt
assert(prompt.requiredSourceDecision === DECISION, 'prompt source decision mismatch')
assert(prompt.planningScope.pythonPackagesToPlan.length === 6, 'prompt Python package count mismatch')
assert(prompt.planningScope.nodePackagesToPlan.includes('sharp'), 'prompt sharp missing')
assert(prompt.planningScope.nodePackagesToPlan.includes('remotion'), 'prompt remotion missing')
for (const [key, value] of Object.entries(prompt.forbiddenScope)) {
  assert(value === false, `prompt forbidden scope ${key} must remain false`)
}

const checker = read('server/workers/production-readiness/core-cpu-render-readiness-checks.ts')
assert(checker.includes('resolveNodePackageMetadataPath'), 'metadata resolver helper missing')

scanUnsafe(Object.values(FILES).map((info) => info.path))

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: DECISION,
      sourceProofPr: 1440,
      sourceHead: SOURCE_HEAD,
      requiredLaunchCoreChecksAccepted: true,
      missingRequiredChecks: 0,
      persistentManifestPlanRequired: true,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt: NEXT_PROMPT,
    },
    null,
    2,
  ),
)
