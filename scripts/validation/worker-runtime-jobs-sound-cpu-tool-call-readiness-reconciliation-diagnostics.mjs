#!/usr/bin/env node
import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const exists = (path) => fs.existsSync(path)
const assert = (condition, message) => {
  if (!condition) throw new Error(message)
}

const parseJsonBlock = (path, label) => {
  const text = read(path)
  const start = `\`\`\`json ${label}`
  const startIndex = text.indexOf(start)
  assert(startIndex !== -1, `missing JSON block ${label} in ${path}`)
  const jsonStart = text.indexOf('\n', startIndex) + 1
  const endIndex = text.indexOf('\n```', jsonStart)
  assert(endIndex !== -1, `unterminated JSON block ${label} in ${path}`)
  return JSON.parse(text.slice(jsonStart, endIndex))
}

const files = {
  result: 'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-reconciliation.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-evidence-map.md',
  duplicate: 'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-duplicate-guard.md',
  next: 'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-next-step-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-tool-call-readiness-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh-2.md',
  pr1129: 'docs/worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan.md',
  gate2a: 'docs/sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result.md',
  gate2aOwner: 'docs/worker-runtime-jobs-sound-cpu-synthetic-tool-call-owner-review.md',
  retry: 'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-retry-result.md'
}

for (const path of Object.values(files)) assert(exists(path), `missing ${path}`)

const decision = 'worker_runtime_jobs_sound_cpu_tool_call_readiness_reconciliation_completed_with_warnings_ready_for_runtime_beta_blocker_resolution_refresh_2'
const result = parseJsonBlock(files.result, 'worker-runtime-jobs-sound-cpu-tool-call-readiness-reconciliation')
const evidence = parseJsonBlock(files.evidence, 'worker-runtime-jobs-sound-cpu-tool-call-readiness-evidence-map')
const duplicate = parseJsonBlock(files.duplicate, 'worker-runtime-jobs-sound-cpu-tool-call-readiness-duplicate-guard')
const next = parseJsonBlock(files.next, 'worker-runtime-jobs-sound-cpu-tool-call-readiness-next-step-register')
const policy = parseJsonBlock(files.policy, 'worker-runtime-jobs-sound-cpu-tool-call-readiness-claim-policy')
const pr1129 = parseJsonBlock(files.pr1129, 'worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan')
const gate2a = parseJsonBlock(files.gate2a, 'sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result')
const gate2aOwner = parseJsonBlock(files.gate2aOwner, 'worker-runtime-jobs-sound-cpu-synthetic-tool-call-owner-review')
const retry = parseJsonBlock(files.retry, 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-retry-result')

assert(result.decision === decision, 'unexpected reconciliation decision')
assert(result.sourceVerification.sourceHead === 'f830fa9208c852fb591be74a5d659c5bd6db3d30', 'unexpected source head')
assert(result.sourceVerification.pr1129.status === 'merged', 'PR #1129 must be marked merged')
assert(result.sourceVerification.ownerChatWaitRequired === false, 'owner wait must be false')
assert(result.reconciliationResult.directPinnedPackageCount === 13, 'direct package count must be 13')
assert(result.reconciliationResult.aliasCoveredToolCount === 2, 'alias count must be 2')
assert(result.reconciliationResult.acceptedSoundCpuToolCount === 15, 'tool count must be 15')
assert(result.reconciliationResult.postMusic21PackageProofPassed === true, 'post-music21 package proof must be accepted')
assert(result.reconciliationResult.gate2aSyntheticToolCallProofAlreadyMerged === true, 'Gate 2A proof must be accepted')
assert(result.reconciliationResult.gate2aProbePassedCount === 15, 'Gate 2A passed count must be 15')
assert(result.reconciliationResult.gate2aProbeFailedCount === 0, 'Gate 2A failed count must be 0')
assert(result.reconciliationResult.rerunGate2aProofInThisPrompt === false, 'must not rerun Gate 2A proof')
for (const key of [
  'persistentRuntimeInstallReadyCount',
  'productToolCallExecutionReadyCount',
  'workerExecutionReadyCount',
  'routeExecutionReadyCount',
  'mediaProcessingReadyCount',
  'supabaseSqlReadyCount',
  'artifactDeliveryReadyCount',
  'internalBetaReadyCount',
  'externalBetaReadyCount',
  'productionReadyCount'
]) {
  assert(result.reconciliationResult[key] === 0, `${key} must remain zero`)
}

const gate2aLayer = evidence.evidenceLayers.find((row) => row.id === 'gate_2a_synthetic_tool_call_proof')
assert(gate2aLayer, 'missing Gate 2A evidence layer')
assert(gate2aLayer.probePassedCount === 15, 'evidence Gate 2A passed count mismatch')
assert(gate2aLayer.probeFailedCount === 0, 'evidence Gate 2A failed count mismatch')
for (const key of [
  'mediaFileOpenAttempted',
  'artifactCreated',
  'workerExecutionAttempted',
  'routeExecutionAttempted',
  'supabaseTouched',
  'sqlExecuted',
  'dockerRunOrPushAttempted'
]) {
  assert(gate2aLayer[key] === false, `${key} must be false`)
}

const retryLayer = evidence.evidenceLayers.find((row) => row.id === 'post_music21_retry_package_proof')
assert(retryLayer, 'missing post-music21 retry layer')
assert(retryLayer.packageProofPassed === true, 'retry proof must be passed')
assert(retryLayer.moduleImportsPassedCount === 14, 'retry import count must be 14')
assert(retryLayer.syntheticAssertionsPassedCount === 5, 'retry synthetic assertion count must be 5')
assert(evidence.currentReadinessCounts.packageProofReadyForPlanning === 15, 'package proof count mismatch')
assert(evidence.currentReadinessCounts.syntheticToolCallProbePassed === 15, 'synthetic probe count mismatch')
for (const key of [
  'persistentRuntimeInstallReady',
  'productToolCallExecutionReady',
  'workerExecutionReady',
  'routeExecutionReady',
  'realUserMediaReady',
  'externalBetaReady',
  'paidProductionReady'
]) {
  assert(evidence.currentReadinessCounts[key] === 0, `${key} must remain zero`)
}

assert(duplicate.duplicateGuard.mergedGate2aProofIsDuplicateClassForNaiveRerun === true, 'duplicate guard must flag Gate 2A duplicate class')
assert(duplicate.duplicateGuard.proofRerunAllowedWithoutFreshNeed === false, 'proof rerun must be blocked without fresh need')
assert(duplicate.duplicateGuard.ownerResponseWaitRequired === false, 'owner wait must remain false')
assert(duplicate.stopConditions.includes('fresh_same_purpose_pr_appears'), 'missing same-purpose PR stop condition')

assert(next.selectedNextStep.prompt.includes('RUNTIME-BETA-BLOCKER-RESOLUTION-REFRESH-2'), 'unexpected next prompt')
for (const row of next.nonSelectedNextSteps) {
  assert(row.reason, `missing reason for non-selected next step ${row.prompt}`)
}

for (const value of Object.values(policy.allowedClaims)) assert(value === true, 'allowed claim must be true')
for (const claim of [
  'persistent runtime install ready',
  'product tool-call execution ready',
  'worker execution ready',
  'route execution ready',
  'external beta ready',
  'paid production ready',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'runtime readiness'
]) {
  assert(policy.forbiddenClaims.includes(claim), `missing forbidden claim ${claim}`)
}
for (const value of Object.values(policy.runtimeFlags)) assert(value === false, 'runtime flag must be false')
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update must be no')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'SQL executed must be no')

assert(pr1129.decision === 'worker_runtime_jobs_sound_cpu_limited_no_media_no_artifact_tool_call_readiness_plan_completed_with_warnings_ready_for_controlled_tool_call_readiness_proof', 'PR #1129 source decision mismatch')
assert(pr1129.planResult.toolCallExecutionReadyCount === 0, 'PR #1129 must not claim tool-call readiness')
assert(gate2a.decision === 'sound_runtime_media_gate_2a_controlled_synthetic_tool_call_proof_passed_with_warnings_ready_for_tool_call_owner_review', 'Gate 2A decision mismatch')
assert(gate2a.probePassedCount === 15, 'Gate 2A source passed count mismatch')
assert(gate2a.probeFailedCount === 0, 'Gate 2A source failed count mismatch')
assert(gate2aOwner.decision === 'worker_runtime_jobs_sound_cpu_synthetic_tool_call_owner_review_passed_with_warnings_ready_for_synthetic_worker_route_plan', 'Gate 2A owner decision mismatch')
assert(retry.decision === 'worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_retry_passed_with_warnings_ready_for_runtime_beta_readiness_reconciliation', 'retry decision mismatch')
assert(retry.proofResult.packageProofPassed === true, 'retry package proof must pass')
assert(retry.readinessOutcome.toolCallReadinessClaimed === false, 'retry must not claim tool-call readiness')

const changedText = [
  files.result,
  files.evidence,
  files.duplicate,
  files.next,
  files.policy,
  files.prompt
].map(read).join('\n')
for (const forbidden of [
  'externalBetaReadyCount\": 1',
  'productionReadyCount\": 1',
  'productToolCallExecutionReadyCount\": 15',
  'toolCallExecutionApprovedToday\": true',
  'workerExecutionApprovedToday\": true',
  'routeExecutionApprovedToday\": true',
  'sqlExecuted\": true',
  'supabaseMutationAttempted\": true',
  'Docker push',
  'Docker run'
]) {
  assert(!changedText.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_tool_call_readiness_reconciliation_diagnostics_passed',
  decision,
  acceptedSoundCpuToolCount: result.reconciliationResult.acceptedSoundCpuToolCount,
  gate2aProbePassedCount: result.reconciliationResult.gate2aProbePassedCount,
  productToolCallExecutionReadyCount: result.reconciliationResult.productToolCallExecutionReadyCount,
  externalBetaReadyCount: result.reconciliationResult.externalBetaReadyCount,
  nextPrompt: result.nextPrompt
}, null, 2))
