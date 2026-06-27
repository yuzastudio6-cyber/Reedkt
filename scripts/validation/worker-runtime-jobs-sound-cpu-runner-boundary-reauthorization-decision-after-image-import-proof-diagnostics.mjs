import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_runner_boundary_reauthorization_decision_after_image_import_proof_passed_with_warnings_ready_for_limited_no_media_no_artifact_beta_runner_boundary_preflight_after_image_import_proof'

const files = {
  decision: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-decision-after-image-import-proof.md',
  scope: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-scope-register-after-image-import-proof.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-evidence-register-after-image-import-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-blocker-register-after-image-import-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-claim-policy-after-image-import-proof.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-beta-runner-boundary-preflight-after-image-import-proof.md',
  sourceReview: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-proof-owner-review-after-image-import-proof.md',
  sourceAcceptance: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-proof-owner-acceptance-register-after-image-import-proof.md',
  sourceEvidenceReview: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-proof-owner-evidence-review-register-after-image-import-proof.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-runner-boundary-proof-owner-claim-policy-after-image-import-proof.md'
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(relativePath) {
  const fullPath = path.join(root, relativePath)
  assert(existsSync(fullPath), `missing file: ${relativePath}`)
  return readFileSync(fullPath, 'utf8')
}

function parseBlock(relativePath, label) {
  const text = read(relativePath)
  const start = `\`\`\`json ${label}`
  const startIndex = text.indexOf(start)
  assert(startIndex !== -1, `missing JSON block ${label} in ${relativePath}`)
  const jsonStart = text.indexOf('\n', startIndex) + 1
  const endIndex = text.indexOf('\n```', jsonStart)
  assert(endIndex !== -1, `unterminated JSON block ${label} in ${relativePath}`)
  return JSON.parse(text.slice(jsonStart, endIndex))
}

const decisionDoc = parseBlock(files.decision, 'worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-decision-after-image-import-proof')
const scope = parseBlock(files.scope, 'worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-scope-register-after-image-import-proof')
const evidence = parseBlock(files.evidence, 'worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-evidence-register-after-image-import-proof')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-blocker-register-after-image-import-proof')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-claim-policy-after-image-import-proof')
const sourceReview = parseBlock(files.sourceReview, 'worker-runtime-jobs-sound-cpu-runner-boundary-proof-owner-review-after-image-import-proof')
const sourceAcceptance = parseBlock(files.sourceAcceptance, 'worker-runtime-jobs-sound-cpu-runner-boundary-proof-owner-acceptance-register-after-image-import-proof')
const sourceEvidenceReview = parseBlock(files.sourceEvidenceReview, 'worker-runtime-jobs-sound-cpu-runner-boundary-proof-owner-evidence-review-register-after-image-import-proof')
const sourcePolicy = parseBlock(files.sourcePolicy, 'worker-runtime-jobs-sound-cpu-runner-boundary-proof-owner-claim-policy-after-image-import-proof')

read(files.prompt)

for (const row of [decisionDoc, scope, evidence, blockers, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

assert(decisionDoc.sourcePr === 1190, 'source PR mismatch')
assert(decisionDoc.sourceMergeCommit === '77ca9a2ede2cdacc75739d7d3b57ea686c4407d0', 'source merge mismatch')
assert(decisionDoc.acceptedDecision.boundedRunnerBoundaryReauthorizationAccepted === true, 'bounded reauthorization not accepted')
assert(decisionDoc.acceptedDecision.boundaryScope === 'future_internal_preflight_no_media_no_artifact_synthetic_payloads_only', 'boundary scope widened')
assert(decisionDoc.acceptedDecision.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(decisionDoc.acceptedDecision.allowPassedCount === 15, 'allow count mismatch')
assert(decisionDoc.acceptedDecision.blockedPassedCount === 14, 'blocked count mismatch')
assert(decisionDoc.acceptedDecision.failedFixtureCount === 0, 'failed fixture count widened')
assert(decisionDoc.acceptedDecision.externalBetaReadyCount === 0, 'external beta widened')
assert(decisionDoc.acceptedDecision.productionReadyCount === 0, 'production widened')
assert(decisionDoc.acceptedForToday.limitedInternalPreflightPlanningMayProceed === 'yes', 'limited preflight next step missing')

for (const key of [
  'productToolCallExecution',
  'workerExecution',
  'routeExecution',
  'mediaProcessing',
  'artifactWrites',
  'supabaseSql',
  'providerModelCalls',
  'dockerGcp',
  'externalBetaUnlock',
  'productionUnlock'
]) {
  assert(decisionDoc.acceptedForToday[key] === 'no', `${key} widened`)
}

assert(scope.counts.futurePreflightAuthorizedItemCount === 6, 'future preflight item count mismatch')
assert(scope.counts.productExecutionAuthorizedCount === 0, 'product execution authorization widened')
assert(scope.notAuthorized.includes('product_tool_call_execution'), 'product execution non-authorization missing')
assert(scope.notAuthorized.includes('dry_run_passed_claim'), 'dry-run claim non-authorization missing')

assert(evidence.acceptedSourceEvidence.proofOwnerReviewPr === 1190, 'evidence owner review PR mismatch')
assert(evidence.proofEvidence.acceptedSoundCpuToolCount === 15, 'evidence tool count mismatch')
assert(evidence.proofEvidence.allowPassedCount === 15, 'evidence allow count mismatch')
assert(evidence.proofEvidence.blockedPassedCount === 14, 'evidence block count mismatch')
assert(evidence.proofEvidence.failedFixtureCount === 0, 'evidence failed fixtures widened')
assert(evidence.evidenceStatus === 'accepted_for_future_internal_preflight_only', 'evidence status widened')

assert(blockers.counts.nextBlockerCount === 1, 'next blocker count mismatch')
assert(blockers.counts.blockedLaterCount === 3, 'blocked later count mismatch')
assert(blockers.counts.readyForProductExecutionBlockerCount === 0, 'product execution blocker count widened')

assert(policy.allowedClaims.boundedRunnerBoundaryReauthorizationAccepted === true, 'allowed bounded decision claim missing')
assert(policy.allowedClaims.limitedInternalPreflightPlanningMayProceed === true, 'allowed preflight next claim missing')
assert(policy.forbiddenClaims.productToolCallExecutionReady === true, 'product execution forbidden missing')
assert(policy.forbiddenClaims.externalBetaReady === true, 'external beta forbidden missing')
assert(policy.forbiddenClaims.dry_run_passed === true, 'dry-run forbidden missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL widened')

assert(
  sourceReview.decision ===
    'worker_runtime_jobs_sound_cpu_runner_boundary_proof_owner_review_after_image_import_proof_passed_with_warnings_ready_for_runner_boundary_reauthorization_decision_after_image_import_proof',
  'source review decision mismatch'
)
assert(sourceReview.acceptedEvidence.acceptedSoundCpuToolCount === 15, 'source tool count mismatch')
assert(sourceReview.acceptedEvidence.failedFixtureCount === 0, 'source failed fixtures widened')
assert(sourceAcceptance.counts.acceptedForExecutionTodayCount === 0, 'source accepted execution count widened')
assert(sourceEvidenceReview.productExecutionAccepted === false, 'source product execution widened')
assert(sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'source SQL widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.['worker-runtime-jobs:sound-cpu-runner-boundary-reauthorization-decision-after-image-import-proof:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-runner-boundary-reauthorization-decision-after-image-import-proof-diagnostics.mjs',
  'package script missing'
)

const changedText = Object.values(files).map(read).join('\n')
for (const forbidden of [
  '"productToolCallExecution": "yes"',
  '"workerExecution": "yes"',
  '"routeExecution": "yes"',
  '"mediaProcessing": "yes"',
  '"artifactWrites": "yes"',
  '"supabaseSql": "yes"',
  '"productExecutionAuthorizedCount": 15',
  '"acceptedForExecutionTodayCount": 15',
  '"externalBetaReadyCount": 15',
  '"productionReadyCount": 15',
  '"sqlExecuted": "yes"',
  'Docker push enabled',
  'Docker run enabled',
  'external beta ready',
  'production ready'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_runner_boundary_reauthorization_decision_after_image_import_proof_diagnostics_passed',
      decision,
      sourceMergeCommit: decisionDoc.sourceMergeCommit,
      boundedRunnerBoundaryReauthorizationAccepted: decisionDoc.acceptedDecision.boundedRunnerBoundaryReauthorizationAccepted,
      acceptedSoundCpuToolCount: decisionDoc.acceptedDecision.acceptedSoundCpuToolCount,
      productExecutionAuthorizedCount: scope.counts.productExecutionAuthorizedCount,
      externalBetaReadyCount: decisionDoc.acceptedDecision.externalBetaReadyCount,
      nextPrompt: decisionDoc.nextPrompt
    },
    null,
    2
  )
)
