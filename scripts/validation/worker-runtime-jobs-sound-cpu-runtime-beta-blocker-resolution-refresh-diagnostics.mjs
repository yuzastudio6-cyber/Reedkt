#!/usr/bin/env node
import fs from 'node:fs'

const read = (path) => fs.readFileSync(path, 'utf8')
const exists = (path) => fs.existsSync(path)
const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message)
  }
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
  result: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh-evidence-register.md',
  counts: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh-count-register.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh-blocker-register.md',
  duplicates: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh-duplicate-register.md',
  next: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh-next-step-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh.md',
  sourceReconciliation: 'docs/worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation.md',
  sourceRetry: 'docs/worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-retry-result.md',
  oldApprovalGate: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate.md'
}

for (const path of Object.values(files)) assert(exists(path), `missing ${path}`)

const result = parseJsonBlock(files.result, 'worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh')
const evidence = parseJsonBlock(files.evidence, 'worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh-evidence-register')
const counts = parseJsonBlock(files.counts, 'worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh-count-register')
const blockers = parseJsonBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh-blocker-register')
const duplicates = parseJsonBlock(files.duplicates, 'worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh-duplicate-register')
const next = parseJsonBlock(files.next, 'worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh-next-step-register')
const policy = parseJsonBlock(files.policy, 'worker-runtime-jobs-sound-cpu-runtime-beta-blocker-resolution-refresh-claim-policy')
const source = parseJsonBlock(files.sourceReconciliation, 'worker-runtime-jobs-sound-cpu-runtime-beta-readiness-reconciliation')
const retry = parseJsonBlock(files.sourceRetry, 'worker-runtime-jobs-sound-cpu-controlled-no-media-no-artifact-execution-proof-retry-result')

const decision = 'worker_runtime_jobs_sound_cpu_runtime_beta_blocker_resolution_refresh_completed_with_warnings_ready_for_runtime_execution_approval_gate_refresh'
assert(result.decision === decision, 'unexpected decision')
assert(result.sourceVerification.sourceHead === '70a908da65cdd9517ec2df89f4d9a380d112b133', 'unexpected source head')
assert(result.sourceVerification.pr1122.status === 'merged', 'PR #1122 source not marked merged')
assert(result.sourceVerification.ownerChatWaitRequired === false, 'owner wait should be false')
assert(result.refreshResult.packageProofRetryAccepted === true, 'retry proof not accepted')
assert(result.refreshResult.packageProofReadyForPlanningCount === 15, 'package proof count must be 15')
for (const key of [
  'persistentRuntimeInstallReadyCount',
  'toolCallExecutionReadyCount',
  'workerRuntimeExecutionReadyCount',
  'routeExecutionReadyCount',
  'internalBetaReadyCount',
  'externalBetaReadyCount',
  'productionReadyCount'
]) {
  assert(result.refreshResult[key] === 0, `${key} must be zero`)
}
for (const key of [
  'runtimeExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'toolExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'supabaseSqlApprovedToday',
  'artifactDeliveryApprovedToday',
  'internalBetaAllowedToday',
  'externalBetaAllowedToday',
  'productionAllowedToday'
]) {
  assert(result.refreshResult[key] === false, `${key} must be false`)
}

assert(evidence.acceptedProofFacts.candidateToolCount === 15, 'evidence tool count mismatch')
assert(evidence.acceptedProofFacts.metadataPassedCount === 13, 'metadata count mismatch')
assert(evidence.acceptedProofFacts.moduleImportsPassedCount === 14, 'module import count mismatch')
assert(evidence.acceptedProofFacts.syntheticAssertionsPassedCount === 5, 'synthetic assertion count mismatch')
for (const value of Object.values(evidence.scopeFacts)) assert(value === true, 'scope fact must be true')

assert(counts.counts.candidateToolCount === 15, 'candidate count mismatch')
assert(counts.counts.packageProofReadyForPlanningCount === 15, 'package proof ready count mismatch')
assert(counts.counts.persistentRuntimeInstallReadyCount === 0, 'persistent install count must be zero')
assert(counts.counts.toolCallExecutionReadyCount === 0, 'tool-call execution count must be zero')
assert(counts.toolsRepresented.directPinnedPackages.length === 13, 'direct package list must include 13')
assert(counts.toolsRepresented.aliasCoveredTools.length === 2, 'alias tool list must include 2')

assert(blockers.resolvedBlockers.length === 3, 'resolved blocker list mismatch')
for (const required of [
  'persistent_runtime_install_not_ready',
  'tool_call_execution_not_ready',
  'worker_dispatch_claim_lease_execution_not_ready',
  'route_execution_not_ready',
  'supabase_sql_storage_not_ready',
  'external_beta_not_unlocked',
  'production_not_unlocked'
]) {
  assert(blockers.remainingBlockers.includes(required), `missing remaining blocker ${required}`)
}

assert(duplicates.duplicateCheck.samePurposeRemoteBranchFound === false, 'same-purpose branch should be false')
assert(duplicates.duplicateCheck.samePurposeOpenPrFound === false, 'same-purpose PR should be false')
assert(duplicates.ownerCoordinationPolicy.ownerChatResponseWaitRequired === false, 'owner wait policy should be false')

assert(next.selectedNextStep.prompt.includes('RUNTIME-EXECUTION-APPROVAL-GATE-REFRESH'), 'unexpected next prompt')
for (const value of Object.values(next.guardrails)) assert(value === true, 'next-step guardrail must be true')

for (const value of Object.values(policy.allowedClaims)) assert(value === true, 'allowed claim marker must be true')
for (const claim of ['tool-call execution ready', 'worker execution ready', 'route execution ready', 'runtime readiness', 'external beta ready', 'production ready']) {
  assert(policy.forbiddenClaims.includes(claim), `missing forbidden claim ${claim}`)
}
assert(policy.supabaseClassification.updateRequired === 'no', 'Supabase update should be no')
assert(policy.requiredNoScopeStatement.includes('No package install'), 'no-scope package-install guard missing')

assert(source.decision === 'worker_runtime_jobs_sound_cpu_runtime_beta_readiness_reconciliation_completed_with_warnings_ready_for_runtime_beta_blocker_resolution_refresh', 'source reconciliation decision mismatch')
assert(source.reconciliationResult.packageProofRetryPassed === true, 'source retry proof flag missing')
assert(retry.decision === 'worker_runtime_jobs_sound_cpu_controlled_no_media_no_artifact_execution_proof_retry_passed_with_warnings_ready_for_runtime_beta_readiness_reconciliation', 'retry decision mismatch')
assert(retry.proofResult.packageProofPassed === true, 'retry package proof not passed')
assert(retry.readinessOutcome.toolCallReadinessClaimed === false, 'retry widened tool-call readiness')
assert(retry.readinessOutcome.externalBetaUnlocked === false, 'retry widened external beta')

const changedTexts = [
  files.result,
  files.evidence,
  files.counts,
  files.blockers,
  files.duplicates,
  files.next,
  files.policy,
  files.prompt
].map(read).join('\n')

for (const forbidden of [
  'Docker build passed yes',
  'Docker push yes',
  'Docker run yes',
  'SQL executed yes',
  'Supabase mutation yes',
  'external beta ready true',
  'production ready true'
]) {
  assert(!changedTexts.includes(forbidden), `forbidden widened claim: ${forbidden}`)
}

console.log(JSON.stringify({
  status: 'worker_runtime_jobs_sound_cpu_runtime_beta_blocker_resolution_refresh_diagnostics_passed',
  decision,
  sourceHead: result.sourceVerification.sourceHead,
  packageProofReadyForPlanningCount: counts.counts.packageProofReadyForPlanningCount,
  persistentRuntimeInstallReadyCount: counts.counts.persistentRuntimeInstallReadyCount,
  toolCallExecutionReadyCount: counts.counts.toolCallExecutionReadyCount,
  nextPrompt: result.nextPrompt
}, null, 2))
