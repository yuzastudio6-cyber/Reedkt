#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs'

const DECISION =
  'worker_runtime_jobs_sound_cpu_hyperframe_package_identity_owner_review_passed_with_warnings_ready_for_readiness_semantics_fix_no_runtime_no_production'
const SOURCE_DECISION =
  'worker_runtime_jobs_sound_cpu_launch_core_hard_blocker_closure_plan_completed_with_warnings_ready_for_hyperframe_package_identity_owner_review_no_media_no_production'
const SOURCE_HEAD = 'f5f75db8e00bca35239149c21c1119dac6c3b2e1'
const NEXT_PROMPT =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-HYPERFRAME-READINESS-SEMANTICS-FIX: update Hyperframe readiness semantics, no runtime/no production'

const FILES = {
  review: {
    path: 'docs/worker-runtime-jobs-sound-cpu-hyperframe-package-identity-owner-review.md',
    label: 'worker-runtime-jobs-sound-cpu-hyperframe-package-identity-owner-review',
  },
  evidence: {
    path: 'docs/worker-runtime-jobs-sound-cpu-hyperframe-package-identity-evidence-register.md',
    label: 'worker-runtime-jobs-sound-cpu-hyperframe-package-identity-evidence-register',
  },
  candidates: {
    path: 'docs/worker-runtime-jobs-sound-cpu-hyperframe-package-candidate-register.md',
    label: 'worker-runtime-jobs-sound-cpu-hyperframe-package-candidate-register',
  },
  semantics: {
    path: 'docs/worker-runtime-jobs-sound-cpu-hyperframe-readiness-semantics-decision-register.md',
    label: 'worker-runtime-jobs-sound-cpu-hyperframe-readiness-semantics-decision-register',
  },
  blockers: {
    path: 'docs/worker-runtime-jobs-sound-cpu-hyperframe-package-identity-blocker-register.md',
    label: 'worker-runtime-jobs-sound-cpu-hyperframe-package-identity-blocker-register',
  },
  claims: {
    path: 'docs/worker-runtime-jobs-sound-cpu-hyperframe-package-identity-claim-policy.md',
    label: 'worker-runtime-jobs-sound-cpu-hyperframe-package-identity-claim-policy',
  },
  nextPrompt: {
    path: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-hyperframe-readiness-semantics-fix.md',
    label: 'worker-runtime-jobs-sound-cpu-hyperframe-readiness-semantics-fix',
  },
}

const SOURCE_FILES = [
  'docs/worker-runtime-jobs-sound-cpu-launch-core-hard-blocker-closure-plan.md',
  'docs/worker-runtime-jobs-sound-cpu-launch-core-hard-blocker-evidence-register.md',
  'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-hyperframe-package-identity-owner-review.md',
  'server/tool-registry/production-tool-profiles.ts',
  'server/workers/production-readiness/core-tool-node-import-checks.ts',
  'package.json',
]

const MUST_BE_FALSE = [
  'literalNpmPackageHyperframeExists',
  'acceptedReplacementPackageToday',
  'acceptedAsPackageBackedToday',
  'packageInstallApprovedToday',
  'packageLockMutationApprovedToday',
  'runtimeExecutionApprovedToday',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
  'productionReady',
  'acceptedForInstall',
  'installApprovedToday',
  'packageLockMutationApprovedToday',
  'packageInstall',
  'packageLockMutation',
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
  'hyperframePackageInstalled',
  'hyperframeReadinessSemanticsFixedToday',
  'hyperframePassed',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtimeReadinessClaimed',
  'workerReadinessClaimed',
  'mediaReadinessClaimed',
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

const sourcePlan = read('docs/worker-runtime-jobs-sound-cpu-launch-core-hard-blocker-closure-plan.md')
assert(sourcePlan.includes(SOURCE_DECISION), 'source hard-blocker closure decision missing')

const profiles = read('server/tool-registry/production-tool-profiles.ts')
assert(profiles.includes("toolId: 'hyperframe'"), 'Hyperframe profile missing')
assert(profiles.includes("workerType: 'frontend_preview_only'"), 'Hyperframe frontend preview owner missing')
assert(profiles.includes("executionMode: 'preview_boundary'"), 'Hyperframe preview boundary missing')

const nodeChecks = read('server/workers/production-readiness/core-tool-node-import-checks.ts')
assert(nodeChecks.includes("packageName: 'hyperframe'"), 'current hyperframe package check missing')
assert(nodeChecks.includes("packageJsonPath: 'hyperframe/package.json'"), 'current hyperframe package path missing')

const parsed = Object.fromEntries(Object.entries(FILES).map(([name, info]) => [name, parseBlock(info)]))
for (const [name, doc] of Object.entries(parsed)) {
  assert(doc.owner === undefined || doc.owner === 'WORKER_RUNTIME_JOBS', `${name} owner mismatch`)
  assertSupabaseNoop(doc.supabaseClassification, name)
  scanFalse(doc, [name])
}

const review = parsed.review
assert(review.decision === DECISION, 'review decision mismatch')
assert(review.sourceBase.sourceHead === SOURCE_HEAD, 'source head mismatch')
assert(review.sourceBase.hardBlockerClosurePlanPr === 1502, 'source PR mismatch')
assert(review.sourceBase.hardBlockerClosurePlanDecision === SOURCE_DECISION, 'source decision mismatch')
assert(review.reviewResult.acceptedAsInternalPreviewBoundaryToday === true, 'internal boundary acceptance missing')
assert(review.reviewResult.readinessSemanticsFixRequired === true, 'semantics fix requirement missing')
assert(review.nextPrompt === NEXT_PROMPT, 'review next prompt mismatch')

const evidence = parsed.evidence
assert(evidence.evidence.some((entry) => entry.id === 'package_registry_lookup' && entry.finding.includes('not found')), 'package lookup evidence missing')
assert(evidence.sourceOfTruthConclusion.hyperframeIsLiteralNpmPackage === false, 'literal package conclusion mismatch')
assert(evidence.sourceOfTruthConclusion.hyperframeIsInternalPreviewBoundaryUntilFurtherReview === true, 'internal boundary conclusion missing')
assert(evidence.sourceOfTruthConclusion.currentMetadataCheckIsTooSpecific === true, 'metadata specificity conclusion missing')

const candidates = parsed.candidates.candidateReview
for (const packageName of ['hyperframe', 'hyperframe-bridge', '@faeh/hyperframe']) {
  const candidate = candidates.find((entry) => entry.packageName === packageName)
  assert(candidate, `candidate ${packageName} missing`)
  assert(candidate.accepted === false, `candidate ${packageName} must not be accepted`)
}
assert(parsed.candidates.approvedPackageToday === null, 'approved package must remain null')

const semantics = parsed.semantics.semanticsDecision
assert(semantics.currentStatus === 'not_installed', 'current status mismatch')
assert(semantics.targetSemantics === 'internal_preview_boundary_warning', 'target semantics mismatch')
assert(semantics.targetStatusAfterFutureFix === 'warning', 'target status mismatch')
assert(semantics.doNotInstallPackage === true, 'do-not-install flag missing')

const blockers = parsed.blockers
assert(blockers.blockersClosedByThisReview.includes('hyperframe_package_identity_unknown'), 'closed identity blocker missing')
assert(blockers.blockersNotClosedByThisReview.includes('hyperframe_readiness_semantics_fix_not_applied'), 'semantics fix blocker missing')
assert(blockers.nextRecommendedClosurePrompt === NEXT_PROMPT, 'blocker next prompt mismatch')

const claims = parsed.claims
assert(claims.allowedClaims.hyperframePackageIdentityReviewed === true, 'identity reviewed claim missing')
assert(claims.allowedClaims.hyperframeLiteralNpmPackageRejected === true, 'literal package rejection claim missing')
assert(claims.allowedClaims.hyperframeInternalPreviewBoundaryAcceptedForFutureSemanticsFix === true, 'future semantics acceptance missing')
assert(claims.blockedClaims.hyperframeReadinessSemanticsFixedToday === false, 'semantics must not be fixed here')

const nextPrompt = parsed.nextPrompt
assert(nextPrompt.requiredSourceDecision === DECISION, 'prompt source decision mismatch')
assert(nextPrompt.allowedImplementationScope.readinessSemanticsCodeChange === true, 'semantics code scope missing')
assert(nextPrompt.allowedImplementationScope.packageInstall === false, 'package install must be blocked')
assert(nextPrompt.allowedImplementationScope.productionUnlock === false, 'production unlock must be blocked')

const pkg = JSON.parse(read('package.json'))
assert(
  pkg.scripts['worker-runtime-jobs:sound-cpu-hyperframe-package-identity-owner-review:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-hyperframe-package-identity-owner-review-diagnostics.mjs',
  'package script missing',
)

console.log(
  JSON.stringify(
    {
      decision: DECISION,
      hyperframeLiteralPackageExists: false,
      acceptedAsInternalPreviewBoundary: true,
      readinessSemanticsFixRequired: true,
      packageInstallApprovedToday: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
    },
    null,
    2,
  ),
)
