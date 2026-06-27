import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const decision =
  'worker_runtime_jobs_sound_cpu_limited_internal_runner_boundary_preflight_plan_after_image_import_proof_completed_with_warnings_ready_for_limited_internal_runner_boundary_preflight_owner_review_after_image_import_proof'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_limited_internal_runner_boundary_preflight_decision_after_image_import_proof_passed_with_warnings_ready_for_limited_internal_runner_boundary_preflight_plan_after_image_import_proof'

const files = {
  plan: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-plan-after-image-import-proof.md',
  scope: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-scope-register-after-image-import-proof.md',
  tools: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-tool-register-after-image-import-proof.md',
  payload: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-payload-guard-register-after-image-import-proof.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-evidence-register-after-image-import-proof.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-blocker-register-after-image-import-proof.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-claim-policy-after-image-import-proof.md',
  nextPrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-owner-review-after-image-import-proof.md',
  sourcePrompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-plan-after-image-import-proof.md',
  sourceDecisionDoc: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-decision-after-image-import-proof.md',
  sourceEvidence: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-decision-evidence-register-after-image-import-proof.md',
  sourceScope: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-decision-scope-register-after-image-import-proof.md',
  sourcePolicy: 'docs/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-decision-claim-policy-after-image-import-proof.md'
}

const expectedTools = [
  'librosa',
  'audioread',
  'pydub',
  'pydub_effects',
  'scipy',
  'resampy',
  'pyloudnorm',
  'ebu_r128_pyloudnorm',
  'audioflux',
  'music21',
  'pretty_midi',
  'mido',
  'noisereduce',
  'pedalboard',
  'mir_eval'
]

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

const plan = parseBlock(files.plan, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-plan-after-image-import-proof')
const scope = parseBlock(files.scope, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-scope-register-after-image-import-proof')
const tools = parseBlock(files.tools, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-tool-register-after-image-import-proof')
const payload = parseBlock(files.payload, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-payload-guard-register-after-image-import-proof')
const evidence = parseBlock(files.evidence, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-evidence-register-after-image-import-proof')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-blocker-register-after-image-import-proof')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-claim-policy-after-image-import-proof')
const source = parseBlock(files.sourceDecisionDoc, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-decision-after-image-import-proof')
const sourceEvidence = parseBlock(files.sourceEvidence, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-decision-evidence-register-after-image-import-proof')
const sourceScope = parseBlock(files.sourceScope, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-decision-scope-register-after-image-import-proof')
const sourcePolicy = parseBlock(files.sourcePolicy, 'worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-decision-claim-policy-after-image-import-proof')

read(files.nextPrompt)
read(files.sourcePrompt)

for (const row of [plan, scope, tools, payload, evidence, blockers, policy]) {
  assert(row.decision === decision, `decision mismatch in ${row.label}`)
}

assert(plan.sourceDecision === sourceDecision, 'source decision mismatch')
assert(plan.sourcePr === 1205, 'source PR mismatch')
assert(plan.sourceMergeCommit === '978e702482ec9318498a7e8e897b8f74f05f9e40', 'source merge mismatch')
assert(plan.preflightPlan.plannedOnly === true, 'plan is not planning-only')
assert(plan.preflightPlan.scope === 'limited_internal_no_media_no_artifact_synthetic_runner_boundary_preflight', 'scope widened')
assert(plan.preflightPlan.approvedPlanSnapshotIdRequired === true, 'approved snapshot missing')
assert(plan.preflightPlan.idempotencyKeyRequired === true, 'idempotency key missing')
assert(plan.preflightPlan.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(plan.preflightPlan.allowFixturePassCount === 15, 'allow pass count mismatch')
assert(plan.preflightPlan.forbiddenPayloadStopCount === 14, 'forbidden stop count mismatch')
assert(plan.preflightPlan.failedFixtureCount === 0, 'failed fixture count widened')
assert(plan.preflightPlan.sanitizedEvidenceOnly === true, 'sanitized evidence missing')
assert(plan.acceptedForToday.limitedInternalRunnerBoundaryPreflightPlanning === 'yes', 'planning not accepted')

for (const key of [
  'limitedInternalRunnerBoundaryPreflightExecution',
  'productToolCallExecution',
  'workerExecution',
  'routeExecution',
  'mediaFileOpen',
  'mediaProcessing',
  'artifactWrites',
  'supabaseSql',
  'providerModelCalls',
  'dockerGcp',
  'internalBetaUnlock',
  'externalBetaUnlock',
  'productionUnlock'
]) {
  assert(plan.acceptedForToday[key] === 'no', `${key} widened`)
}

assert(scope.counts.authorizedFuturePlanReviewItemCount === 6, 'authorized plan review count mismatch')
assert(scope.counts.notAuthorizedItemCount === 22, 'not authorized count mismatch')
for (const key of [
  'productExecutionAuthorizedCount',
  'workerExecutionAuthorizedCount',
  'mediaProcessingAuthorizedCount',
  'artifactDeliveryAuthorizedCount',
  'supabaseSqlAuthorizedCount',
  'betaUnlockAuthorizedCount',
  'productionUnlockAuthorizedCount'
]) {
  assert(scope.counts[key] === 0, `${key} widened`)
}
for (const item of ['product_tool_call_execution', 'media_file_open', 'artifact_write', 'supabase_mutation', 'sql_execution']) {
  assert(scope.notAuthorized.includes(item), `missing non-authorization: ${item}`)
}

assert(JSON.stringify(tools.acceptedForFutureSyntheticPreflightPlanning) === JSON.stringify(expectedTools), 'tool allowlist mismatch')
assert(JSON.stringify(tools.notAcceptedForProductExecutionToday) === JSON.stringify(expectedTools), 'tool no-execution list mismatch')
assert(tools.counts.acceptedForFutureSyntheticPreflightPlanningCount === 15, 'future tool planning count mismatch')
assert(tools.counts.acceptedForProductExecutionTodayCount === 0, 'product execution tool count widened')
assert(tools.counts.acceptedForWorkerExecutionTodayCount === 0, 'worker execution tool count widened')
assert(tools.counts.acceptedForExternalBetaTodayCount === 0, 'external beta tool count widened')
assert(tools.counts.acceptedForProductionTodayCount === 0, 'production tool count widened')

assert(payload.counts.requiredFutureSyntheticPayloadFieldCount === 9, 'payload required field count mismatch')
assert(payload.counts.runtimeFlagsRequiredFalseCount === 3, 'runtime false flag count mismatch')
assert(payload.counts.forbiddenPayloadFamilyCount === 14, 'forbidden payload family count mismatch')
for (const field of ['approvedPlanSnapshotId', 'workspaceId', 'projectId', 'jobId', 'idempotencyKey', 'toolId']) {
  assert(payload.requiredFutureSyntheticPayloadFields.includes(field), `missing required payload field: ${field}`)
}
for (const forbidden of ['rawPrompt', 'mediaFilePath', 'artifactWriteTarget', 'supabaseWriteIntent', 'sqlStatement', 'dockerRunRequest']) {
  assert(payload.forbiddenPayloadFamilies.includes(forbidden), `missing forbidden payload family: ${forbidden}`)
}

assert(evidence.sourceEvidence.decisionPr === 1205, 'evidence source PR mismatch')
assert(evidence.sourceEvidence.decisionMergeCommit === '978e702482ec9318498a7e8e897b8f74f05f9e40', 'evidence merge mismatch')
assert(evidence.acceptedEvidence.acceptedToolCount === 15, 'evidence tool count mismatch')
assert(evidence.acceptedEvidence.allowFixturePassCount === 15, 'evidence allow count mismatch')
assert(evidence.acceptedEvidence.forbiddenPayloadStopCount === 14, 'evidence stop count mismatch')
assert(evidence.acceptedEvidence.failedFixtureCount === 0, 'evidence failed count widened')
assert(evidence.notEvidenceFor.includes('generated_local_fixture_passed'), 'generated fixture non-evidence missing')
assert(evidence.notEvidenceFor.includes('dry_run_passed'), 'dry-run non-evidence missing')
assert(evidence.evidenceStatus === 'accepted_for_limited_internal_runner_boundary_preflight_plan_review_only', 'evidence status widened')

assert(blockers.counts.nextBlockerCount === 1, 'next blocker count mismatch')
assert(blockers.counts.blockedLaterCount === 4, 'blocked later count mismatch')
assert(blockers.counts.readyForProductExecutionBlockerCount === 0, 'product blocker widened')

assert(policy.allowedClaims.limitedInternalRunnerBoundaryPreflightPlanning === true, 'allowed planning claim missing')
assert(policy.allowedClaims.acceptedSoundCpuToolCount === 15, 'allowed tool count mismatch')
assert(policy.allowedClaims.forbiddenPayloadStopCount === 14, 'allowed stop count mismatch')
assert(policy.allowedClaims.failedFixtureCount === 0, 'allowed failed count widened')
assert(policy.forbiddenClaims.productToolCallExecutionReady === true, 'product execution forbidden missing')
assert(policy.forbiddenClaims.internalBetaUnlocked === true, 'internal beta forbidden missing')
assert(policy.forbiddenClaims.externalBetaReady === true, 'external beta forbidden missing')
assert(policy.forbiddenClaims.productionReady === true, 'production forbidden missing')
assert(policy.forbiddenClaims.generated_local_fixture_passed === true, 'generated fixture forbidden missing')
assert(policy.forbiddenClaims.dry_run_passed === true, 'dry-run forbidden missing')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL widened')

assert(source.decision === sourceDecision, 'source decision mismatch')
assert(source.sourcePr === 1202, 'source upstream PR mismatch')
assert(source.sourceMergeCommit === '0f14c9b9727451cc65dd00d269eafcb02d367cef', 'source upstream merge mismatch')
assert(source.acceptedDecision.limitedInternalRunnerBoundaryPreflightPlanningMayProceed === true, 'source planning acceptance missing')
assert(source.acceptedDecision.acceptedSoundCpuToolCount === 15, 'source tool count mismatch')
assert(source.acceptedDecision.blockedPassedCount === 14, 'source block count mismatch')
assert(source.acceptedDecision.productExecutionAuthorizedCount === 0, 'source product execution widened')
assert(source.acceptedDecision.internalBetaUnlockCount === 0, 'source internal beta widened')
assert(source.acceptedDecision.externalBetaReadyCount === 0, 'source external beta widened')
assert(source.acceptedDecision.productionReadyCount === 0, 'source production widened')
assert(sourceEvidence.acceptedProofEvidence.acceptedToolCount === 15, 'source evidence tool count mismatch')
assert(sourceEvidence.acceptedProofEvidence.failedFixtureCount === 0, 'source evidence failed count widened')
assert(sourceScope.counts.productExecutionAuthorizedCount === 0, 'source scope product execution widened')
assert(sourcePolicy.supabaseClassification.sqlExecuted === 'no', 'source SQL widened')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts?.[
    'worker-runtime-jobs:sound-cpu-limited-internal-runner-boundary-preflight-plan-after-image-import-proof:diagnostics'
  ] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-limited-internal-runner-boundary-preflight-plan-after-image-import-proof-diagnostics.mjs',
  'package script missing'
)

const changedText = Object.values(files).map(read).join('\n')
for (const forbidden of [
  '"productToolCallExecution": "yes"',
  '"workerExecution": "yes"',
  '"routeExecution": "yes"',
  '"mediaFileOpen": "yes"',
  '"mediaProcessing": "yes"',
  '"artifactWrites": "yes"',
  '"supabaseSql": "yes"',
  '"internalBetaUnlock": "yes"',
  '"externalBetaUnlock": "yes"',
  '"productionUnlock": "yes"',
  '"productExecutionAuthorizedCount": 15',
  '"workerExecutionAuthorizedCount": 15',
  '"betaUnlockAuthorizedCount": 15',
  '"acceptedForProductExecutionTodayCount": 15',
  '"acceptedForExternalBetaTodayCount": 15',
  '"acceptedForProductionTodayCount": 15',
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
      status:
        'worker_runtime_jobs_sound_cpu_limited_internal_runner_boundary_preflight_plan_after_image_import_proof_diagnostics_passed',
      decision,
      sourcePr: plan.sourcePr,
      sourceMergeCommit: plan.sourceMergeCommit,
      acceptedSoundCpuToolCount: plan.preflightPlan.acceptedSoundCpuToolCount,
      forbiddenPayloadStopCount: plan.preflightPlan.forbiddenPayloadStopCount,
      productExecutionAuthorizedCount: scope.counts.productExecutionAuthorizedCount,
      betaUnlockAuthorizedCount: scope.counts.betaUnlockAuthorizedCount,
      productionUnlockAuthorizedCount: scope.counts.productionUnlockAuthorizedCount,
      nextPrompt: plan.nextPrompt
    },
    null,
    2
  )
)
