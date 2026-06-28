import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_tool_call_runtime_readiness_refresh_after_internal_dry_run_passed_with_warnings_ready_for_next_runtime_blocker_closure_no_external_beta'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_internal_beta_next_scope_review_after_dry_run_passed_with_warnings_ready_for_tool_call_runtime_readiness_refresh_no_external_beta'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PRODUCT-TOOL-CALL-EXECUTION-READINESS-GAP-CLOSURE-AFTER-INTERNAL-DRY-RUN: close product tool-call execution readiness gap after bounded internal dry-run, no external beta'
const descriptorDigest = '278afb2895eeebdbb433b858fa6df87e966d2dcf4d21826380e11956121ce81a'

const files = {
  refresh: 'docs/worker-runtime-jobs-sound-cpu-tool-call-runtime-readiness-refresh-after-internal-dry-run.md',
  sourceRegister:
    'docs/worker-runtime-jobs-sound-cpu-tool-call-runtime-readiness-refresh-source-register-after-internal-dry-run.md',
  evidence:
    'docs/worker-runtime-jobs-sound-cpu-tool-call-runtime-readiness-refresh-evidence-register-after-internal-dry-run.md',
  classification:
    'docs/worker-runtime-jobs-sound-cpu-tool-call-runtime-readiness-refresh-classification-after-internal-dry-run.md',
  nextBlocker:
    'docs/worker-runtime-jobs-sound-cpu-tool-call-runtime-readiness-refresh-next-blocker-after-internal-dry-run.md',
  claimPolicy:
    'docs/worker-runtime-jobs-sound-cpu-tool-call-runtime-readiness-refresh-claim-policy-after-internal-dry-run.md',
  nextPromptFile:
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-product-tool-call-execution-readiness-gap-closure-after-internal-dry-run.md',
  sourceNextScope: 'docs/worker-runtime-jobs-sound-cpu-internal-beta-next-scope-review-after-dry-run.md',
  sourceOwnerReview:
    'docs/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-owner-review-after-execution.md',
  sourceDryRun: 'docs/worker-runtime-jobs-sound-cpu-controlled-internal-dry-run-execution-result-after-plan-review.md',
  toolCallProof:
    'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-tool-call-readiness-proof-after-image-import-proof.md',
  toolCallOwnerReview:
    'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-owner-review-after-image-import-proof.md',
  gapClosure:
    'docs/worker-runtime-jobs-sound-cpu-limited-beta-tool-call-gap-closure-owner-review-after-image-import-proof.md',
  runtimeReconciliation:
    'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation-after-runner-boundary-execution-proof.md',
  runtimePreflightOwner:
    'docs/worker-runtime-jobs-sound-cpu-runtime-beta-preflight-owner-review-after-runner-boundary-execution-proof.md',
  productBetaGap: 'docs/worker-runtime-jobs-sound-cpu-product-beta-readiness-gap-closure.md',
  packageJson: 'package.json'
}

const labels = {
  refresh: 'worker-runtime-jobs-sound-cpu-tool-call-runtime-readiness-refresh-after-internal-dry-run',
  sourceRegister:
    'worker-runtime-jobs-sound-cpu-tool-call-runtime-readiness-refresh-source-register-after-internal-dry-run',
  evidence:
    'worker-runtime-jobs-sound-cpu-tool-call-runtime-readiness-refresh-evidence-register-after-internal-dry-run',
  classification:
    'worker-runtime-jobs-sound-cpu-tool-call-runtime-readiness-refresh-classification-after-internal-dry-run',
  nextBlocker:
    'worker-runtime-jobs-sound-cpu-tool-call-runtime-readiness-refresh-next-blocker-after-internal-dry-run',
  claimPolicy:
    'worker-runtime-jobs-sound-cpu-tool-call-runtime-readiness-refresh-claim-policy-after-internal-dry-run'
}

const forbiddenText = [
  '"externalBetaUnlocked": true',
  '"realUserMediaBetaUnlocked": true',
  '"paidProductionUnlocked": true',
  '"productionUnlocked": true',
  '"productToolCallExecutionReady": true',
  '"workerExecutionReady": true',
  '"routeExecutionReady": true',
  '"runtimeReadinessClaimed": true',
  '"mediaReadinessClaimed": true',
  '"artifactReadinessClaimed": true',
  '"generatedLocalFixturePassedClaimed": true',
  '"dryRunPassedClaimed": true',
  '"productToolCallExecutionApprovedToday": true',
  '"workerExecutionApprovedToday": true',
  '"routeExecutionApprovedToday": true',
  '"mediaProcessingApprovedToday": true',
  '"artifactDeliveryApprovedToday": true',
  '"supabaseSqlApprovedToday": true',
  '"billingStripeApprovedToday": true',
  '"externalBetaApprovedToday": true',
  '"productionApprovedToday": true',
  '"supabaseTouched": true',
  '"sqlExecuted": true',
  '"creditMutated": true',
  '"stripeProcessed": true',
  '"environmentTouched": "yes"',
  '"sqlExecuted": "yes"',
  '"migrationDeployed": "yes"',
  'SUPABASE_SERVICE',
  'STRIPE_SECRET',
  'BEGIN RSA',
  'BEGIN OPENSSH'
]

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function read(relativePath) {
  const fullPath = path.join(root, relativePath)
  assert(fs.existsSync(fullPath), `Missing required file: ${relativePath}`)
  return fs.readFileSync(fullPath, 'utf8')
}

function parseJsonFence(markdown, label) {
  const fence = '```json ' + label
  const start = markdown.indexOf(fence)
  assert(start !== -1, `Missing JSON fence: ${label}`)
  const jsonStart = markdown.indexOf('\n', start)
  const end = markdown.indexOf('```', jsonStart + 1)
  assert(jsonStart !== -1 && end !== -1, `Unclosed JSON fence: ${label}`)
  return JSON.parse(markdown.slice(jsonStart + 1, end).trim())
}

function assertSupabaseNoop(value, label) {
  assert(value.updateRequired === 'no', `${label}.updateRequired must be no`)
  assert(value.environmentTouched === 'no', `${label}.environmentTouched must be no`)
  assert(value.sqlExecuted === 'no', `${label}.sqlExecuted must be no`)
  assert(value.migrationDeployed === 'no', `${label}.migrationDeployed must be no`)
  assert(value.nextAction === 'none', `${label}.nextAction must be none`)
}

function assertAllFalse(value, label) {
  for (const [key, entry] of Object.entries(value)) {
    assert(entry === false, `${label}.${key} must remain false`)
  }
}

const docs = Object.fromEntries(Object.entries(files).map(([key, relativePath]) => [key, read(relativePath)]))

for (const [key, text] of Object.entries(docs)) {
  for (const forbidden of forbiddenText) {
    assert(!text.includes(forbidden), `Forbidden widened claim or secret marker found in ${key}: ${forbidden}`)
  }
}

const parsed = Object.fromEntries(
  Object.entries(labels).map(([key, label]) => [key, parseJsonFence(docs[key], label)])
)

for (const key of ['refresh', 'sourceRegister', 'evidence', 'classification', 'nextBlocker', 'claimPolicy']) {
  assert(parsed[key].decision === decision, `Decision mismatch in ${key}`)
}

assert(
  docs.packageJson.includes(
    '"worker-runtime-jobs:sound-cpu-tool-call-runtime-readiness-refresh-after-internal-dry-run:diagnostics": "node scripts/validation/worker-runtime-jobs-sound-cpu-tool-call-runtime-readiness-refresh-after-internal-dry-run-diagnostics.mjs"'
  ),
  'package script missing'
)
assert(
  docs.nextPromptFile.includes('WORKER_RUNTIME_JOBS-SOUND-CPU-PRODUCT-TOOL-CALL-EXECUTION-READINESS-GAP-CLOSURE-AFTER-INTERNAL-DRY-RUN'),
  'next prompt id missing'
)
assert(docs.nextPromptFile.includes('product tool-call execution readiness gap'), 'next prompt title missing')
assert(docs.nextPromptFile.includes('Expected decision if the gap can close for planning only'), 'next prompt expected decision missing')

assert(parsed.refresh.sourceVerification.sourceHead === 'b8999b86b2bc36493944d3a55bcfbd8ba90468c9', 'source head mismatch')
assert(parsed.refresh.sourceVerification.pr1363.mergeCommit === 'b8999b86b2bc36493944d3a55bcfbd8ba90468c9', 'PR #1363 merge mismatch')
assert(parsed.refresh.sourceVerification.pr1363.decision === sourceDecision, 'PR #1363 decision mismatch')
assert(parsed.refresh.sourceVerification.pr1357.mergeCommit === 'a790cad3ecd82a5de715cd2251fe5f1862a29d32', 'PR #1357 merge mismatch')
assert(parsed.refresh.refreshInputs.boundedInternalDryRunToolCount === 15, 'bounded dry-run tool count mismatch')
assert(parsed.refresh.refreshInputs.boundedInternalDryRunPassed === 15, 'bounded dry-run pass count mismatch')
assert(parsed.refresh.refreshInputs.boundedInternalDryRunFailed === 0, 'bounded dry-run failed count mismatch')
assert(parsed.refresh.refreshInputs.boundedInternalDryRunDigest === descriptorDigest, 'descriptor digest mismatch')
assert(parsed.refresh.refreshInputs.priorNoMediaNoArtifactToolCallProbePassedCount === 15, 'tool-call proof pass count mismatch')
assert(parsed.refresh.refreshInputs.priorNoMediaNoArtifactToolCallProbeFailedCount === 0, 'tool-call proof fail count mismatch')
assert(parsed.refresh.refreshInputs.productBetaPlanningGapsClosed === 8, 'planning gap closure count mismatch')
assert(parsed.refresh.refreshInputs.productBetaPlanningGapsRemaining === 0, 'planning gap remaining count mismatch')

for (const key of [
  'productToolCallExecutionReadyCount',
  'workerExecutionReadyCount',
  'routeExecutionReadyCount',
  'runtimeReadinessReadyCount',
  'mediaReadinessReadyCount',
  'externalBetaReadyCount',
  'productionReadyCount'
]) {
  assert(parsed.refresh.refreshedClassification[key] === 0, `refresh readiness count widened: ${key}`)
}
for (const key of [
  'productToolCallExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'artifactDeliveryApprovedToday',
  'supabaseSqlApprovedToday',
  'billingStripeApprovedToday',
  'externalBetaApprovedToday',
  'productionApprovedToday'
]) {
  assert(parsed.refresh.refreshedClassification[key] === false, `refresh approval widened: ${key}`)
}
assert(parsed.refresh.refreshOutcome.mayAdvanceToNextRuntimeBlockerClosure === true, 'next closure not allowed')
assert(parsed.refresh.refreshOutcome.selectedNextBlocker === 'product_tool_call_execution_readiness_gap', 'selected blocker mismatch')
assert(parsed.refresh.refreshOutcome.nextPrompt === nextPrompt, 'next prompt mismatch')
assert(parsed.refresh.refreshOutcome.externalBetaStillBlocked === true, 'external beta blocker missing')
assert(parsed.refresh.refreshOutcome.productionStillBlocked === true, 'production blocker missing')
assertSupabaseNoop(parsed.refresh.supabaseClassification, 'refresh')

assert(parsed.sourceRegister.sourceRegister.length === 7, 'source register count mismatch')
for (const source of parsed.sourceRegister.sourceRegister) {
  assert(source.executionApprovedBySource === false, `source execution widened: ${source.source}`)
}
assert(parsed.sourceRegister.sourceConclusion.samePurposeDuplicateFound === false, 'same-purpose duplicate mismatch')
assert(parsed.sourceRegister.sourceConclusion.allSourcesRemainNoExecutionForProduct === true, 'source product execution boundary missing')

assert(parsed.evidence.acceptedEvidence.toolCandidateCount === 15, 'evidence tool count mismatch')
assert(parsed.evidence.acceptedEvidence.boundedInternalDryRunPassed === 15, 'evidence dry-run passed mismatch')
assert(parsed.evidence.acceptedEvidence.boundedInternalDryRunFailed === 0, 'evidence dry-run failed mismatch')
assert(parsed.evidence.acceptedEvidence.priorSyntheticToolCallProbePassedCount === 15, 'evidence probe passed mismatch')
assert(parsed.evidence.acceptedEvidence.priorSyntheticToolCallProbeFailedCount === 0, 'evidence probe failed mismatch')
for (const [key, entry] of Object.entries(parsed.evidence.notAcceptedAsEvidenceFor)) {
  assert(entry === true, `notAcceptedAsEvidenceFor.${key} must be true`)
}
assert(parsed.evidence.evidenceGap.gapOpen === true, 'evidence gap must remain open')
assert(parsed.evidence.evidenceGap.gapId === 'product_tool_call_execution_readiness_gap', 'evidence gap id mismatch')

assert(parsed.classification.classification.productToolCallExecutionReadiness === 'blocked_unclaimed', 'product tool-call classification widened')
assert(parsed.classification.classification.externalBetaReadiness === 'blocked_unclaimed', 'external beta classification widened')
assert(parsed.classification.readinessCounts.acceptedSoundCpuToolCount === 15, 'classification tool count mismatch')
for (const key of [
  'productToolCallExecutionReadyCount',
  'workerExecutionReadyCount',
  'routeExecutionReadyCount',
  'runtimeReadinessReadyCount',
  'externalBetaReadyCount',
  'productionReadyCount'
]) {
  assert(parsed.classification.readinessCounts[key] === 0, `classification count widened: ${key}`)
}
assert(parsed.classification.summary.refreshMayProceedToNextClosure === true, 'refresh next closure missing')
assert(parsed.classification.summary.readinessWidened === false, 'readiness widened')

assert(parsed.nextBlocker.selectedNextBlocker.blockerId === 'product_tool_call_execution_readiness_gap', 'next blocker mismatch')
assert(parsed.nextBlocker.selectedNextBlocker.nextPrompt === nextPrompt, 'next blocker prompt mismatch')
assert(parsed.nextBlocker.selectedNextBlocker.mayProceed === true, 'next blocker mayProceed missing')
assert(parsed.nextBlocker.selectedNextBlocker.mayExecuteProductCallsInThisPrompt === false, 'next blocker execution widened')
assert(parsed.nextBlocker.notSelected.length === 3, 'not-selected blocker count mismatch')
for (const blocker of parsed.nextBlocker.notSelected) assert(blocker.mayProceed === false, `not-selected blocker widened: ${blocker.blockerId}`)

assert(parsed.claimPolicy.allowedClaims.length === 4, 'allowed claim count mismatch')
for (const required of [
  'product tool-call execution ready',
  'worker execution ready',
  'route execution ready',
  'external beta ready',
  'generated_local_fixture_passed',
  'dry_run_passed'
]) {
  assert(parsed.claimPolicy.forbiddenClaims.includes(required), `forbidden claim missing: ${required}`)
}
assertAllFalse(parsed.claimPolicy.closedFlags, 'claimPolicy.closedFlags')
assertSupabaseNoop(parsed.claimPolicy.supabaseClassification, 'claimPolicy')

assert(docs.sourceNextScope.includes(sourceDecision), 'source next-scope decision missing')
assert(docs.sourceNextScope.includes('"productToolCallExecutionReadyCount": 0'), 'source next-scope product count widened or missing')
assert(docs.sourceOwnerReview.includes(descriptorDigest), 'source owner-review digest missing')
assert(docs.sourceDryRun.includes(descriptorDigest), 'source dry-run digest missing')
assert(docs.toolCallProof.includes('"probePassedCount": 15'), 'tool-call proof probe count missing')
assert(docs.toolCallOwnerReview.includes('"productToolCallExecution": "no"'), 'tool-call owner product execution boundary missing')
assert(docs.gapClosure.includes('"productToolCallExecution": "no"'), 'gap closure product execution boundary missing')
assert(docs.runtimeReconciliation.includes('"runtimeExecutionApprovedToday": false'), 'runtime reconciliation boundary missing')
assert(docs.runtimePreflightOwner.includes('"productToolCallExecutionApprovedToday": false'), 'runtime preflight owner product boundary missing')
assert(docs.productBetaGap.includes('"closedGapCountToday": 8'), 'product beta gap closure count missing')

console.log(
  JSON.stringify(
    {
      ok: true,
      decision,
      sourceHead: parsed.refresh.sourceVerification.sourceHead,
      acceptedSoundCpuToolCount: parsed.evidence.acceptedEvidence.toolCandidateCount,
      productToolCallExecutionReadyCount: parsed.refresh.refreshedClassification.productToolCallExecutionReadyCount,
      selectedNextPrompt: parsed.refresh.refreshOutcome.nextPrompt,
      externalBetaApprovedToday: parsed.refresh.refreshedClassification.externalBetaApprovedToday
    },
    null,
    2
  )
)
