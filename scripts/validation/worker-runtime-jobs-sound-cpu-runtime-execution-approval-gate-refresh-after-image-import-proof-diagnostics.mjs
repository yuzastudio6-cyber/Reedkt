import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const files = {
  result: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-after-image-import-proof.md',
  evidence: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-after-image-import-proof-evidence-register.md',
  criteria: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-after-image-import-proof-criteria-register.md',
  tools: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-after-image-import-proof-tool-register.md',
  blockers: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-after-image-import-proof-blocker-register.md',
  duplicates: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-after-image-import-proof-duplicate-register.md',
  next: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-after-image-import-proof-next-step-register.md',
  policy: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-after-image-import-proof-claim-policy.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-limited-no-media-no-artifact-tool-call-readiness-plan-after-image-import-proof.md',
  sourceCleanup3: 'docs/reeditpro-local-validation-disk-cleanup-3-sound-cpu-beta-preflight-hydration.md',
  sourceCleanup3Readiness: 'docs/reeditpro-local-validation-disk-cleanup-3-sound-cpu-beta-preflight-readiness-register.md',
  oldRefresh: 'docs/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh.md'
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

const result = parseBlock(files.result, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-after-image-import-proof')
const evidence = parseBlock(files.evidence, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-after-image-import-proof-evidence-register')
const criteria = parseBlock(files.criteria, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-after-image-import-proof-criteria-register')
const tools = parseBlock(files.tools, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-after-image-import-proof-tool-register')
const blockers = parseBlock(files.blockers, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-after-image-import-proof-blocker-register')
const duplicates = parseBlock(files.duplicates, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-after-image-import-proof-duplicate-register')
const next = parseBlock(files.next, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-after-image-import-proof-next-step-register')
const policy = parseBlock(files.policy, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-after-image-import-proof-claim-policy')
const sourceCleanup3 = parseBlock(files.sourceCleanup3, 'reeditpro-local-validation-disk-cleanup-3-sound-cpu-beta-preflight-hydration')
const sourceCleanup3Readiness = parseBlock(files.sourceCleanup3Readiness, 'reeditpro-local-validation-disk-cleanup-3-sound-cpu-beta-preflight-readiness-register')
const oldRefresh = parseBlock(files.oldRefresh, 'worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh')

const expectedDecision =
  'worker_runtime_jobs_sound_cpu_runtime_execution_approval_gate_refresh_after_image_import_proof_passed_with_warnings_ready_for_limited_no_media_no_artifact_tool_call_readiness_plan_after_image_import_proof'

assert(result.decision === expectedDecision, 'unexpected decision')
assert(result.sourceMergeCommit === '66f7f039d205a87c6e3110b250370d06ceac3704', 'source merge mismatch')
assert(result.approvalGateRefresh.acceptedSoundCpuToolCount === 15, 'tool count mismatch')
assert(result.approvalGateRefresh.dependencyBackedStaticPreflightPassed === true, 'preflight must pass')
assert(result.approvalGateRefresh.containerImportBlockerCleared === true, 'container import blocker not cleared')
assert(result.approvalGateRefresh.futureLimitedNoMediaNoArtifactToolCallReadinessPlanMayProceed === true, 'future plan should proceed')
assert(result.approvalGateRefresh.futurePlanMustRemainSeparatePrompt === true, 'future plan must be separate')
for (const key of [
  'approvedForExecutionToday',
  'runtimeExecutionApprovedToday',
  'workerExecutionApprovedToday',
  'routeExecutionApprovedToday',
  'toolExecutionApprovedToday',
  'mediaProcessingApprovedToday',
  'providerCallsApprovedToday',
  'supabaseMutationApprovedToday',
  'sqlExecutionApprovedToday',
  'artifactDeliveryApprovedToday',
  'internalBetaAllowed',
  'externalBetaAllowed',
  'productionAllowed',
  'generatedLocalFixturePassedClaimedToday',
  'dryRunPassedClaimedToday',
  'runtimeReadinessClaimedToday',
  'workerReadinessClaimedToday',
  'toolCallReadinessClaimedToday',
  'mediaReadinessClaimedToday'
]) {
  assert(result.approvalGateRefresh[key] === false, `${key} must remain false`)
}

assert(evidence.evidenceAccepted.packageLockUnchanged === true, 'package lock evidence missing')
assert(evidence.evidenceAccepted.containerImportPassedCount === 14, 'container import evidence mismatch')
assert(evidence.evidenceAccepted.crossChatOwnershipConflictCount === 0, 'ownership conflict widened')

assert(criteria.acceptedPrerequisites.candidateToolCount === 15, 'criteria tool count mismatch')
assert(criteria.acceptedPrerequisites.containerImportBlockerCleared === true, 'criteria import blocker mismatch')
for (const value of Object.values(criteria.notAcceptedToday)) assert(value === false, 'not accepted today must be false')

assert(tools.packageProofReadyForPlanning.length === 15, 'planning tool list must have 15 tools')
assert(tools.notYetReadyForProductToolCallExecution.length === 15, 'not-ready list must have 15 tools')
assert(tools.counts.productToolCallExecutionReadyCount === 0, 'product execution readiness widened')

for (const blocker of [
  'limited_no_media_no_artifact_tool_call_readiness_plan',
  'explicit_tool_call_allowlist',
  'synthetic_payload_schema_review',
  'runtime_flag_guard_review'
]) {
  assert(blockers.remainingBeforeProductToolCalls.includes(blocker), `missing blocker ${blocker}`)
}
for (const value of Object.values(blockers.blockedToday)) assert(value === true, 'blocked-today marker must be true')

assert(duplicates.sameHeadOpenPrFound === false, 'same-head duplicate found')
assert(duplicates.samePurposeOpenPrFound === false, 'same-purpose duplicate found')
assert(duplicates.olderApprovalGateRefreshExists === true, 'older refresh evidence missing')
assert(duplicates.olderApprovalGateRefreshPredatesImageImportProof === true, 'older refresh should predate image proof')
assert(duplicates.ownershipConflictFound === false, 'ownership conflict found')

assert(next.selectedNextPrompt.includes('TOOL-CALL-READINESS-PLAN-AFTER-IMAGE-IMPORT-PROOF'), 'next prompt mismatch')
assert(next.separatePromptRequired === true, 'next prompt must be separate')
read(files.prompt)

assert(policy.supabaseClassification.updateRequired === 'no', 'supabase update widened')
assert(policy.supabaseClassification.sqlExecuted === 'no', 'sql widened')
for (const forbidden of policy.forbiddenClaims) {
  assert(forbidden.includes('_') || forbidden.includes('ready'), 'forbidden claim format changed')
}

assert(
  sourceCleanup3.decision ===
    'reeditpro_local_validation_disk_cleanup_3_sound_cpu_beta_preflight_hydration_passed_with_warnings_ready_for_runtime_execution_approval_gate_refresh_after_image_import_proof',
  'source cleanup decision mismatch'
)
assert(sourceCleanup3Readiness.dependencyBackedStaticPreflightPassed === true, 'source preflight did not pass')
assert(sourceCleanup3Readiness.externalBetaReadyCount === 0, 'source external beta widened')
assert(sourceCleanup3Readiness.productionReadyCount === 0, 'source production widened')
assert(oldRefresh.sourceVerification.sourceHead === 'ee88f613b14ecbde4c0769edf0a9ddc8bc1eb359', 'old refresh source changed unexpectedly')

const packageJson = JSON.parse(read('package.json'))
assert(
  packageJson.scripts['worker-runtime-jobs:sound-cpu-runtime-execution-approval-gate-refresh-after-image-import-proof:diagnostics'] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-runtime-execution-approval-gate-refresh-after-image-import-proof-diagnostics.mjs',
  'package script missing'
)

const changedText = Object.values(files).map(read).join('\n')
for (const forbiddenPattern of [
  '"externalBetaAllowed": true',
  '"productionAllowed": true',
  '"toolExecutionApprovedToday": true',
  '"workerExecutionApprovedToday": true',
  '"routeExecutionApprovedToday": true',
  '"mediaProcessingApprovedToday": true',
  '"supabaseMutationApprovedToday": true',
  '"sqlExecutionApprovedToday": true',
  '"artifactDeliveryApprovedToday": true',
  '"productToolCallExecutionReadyCount": 15'
]) {
  assert(!changedText.includes(forbiddenPattern), `forbidden widened claim found: ${forbiddenPattern}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_runtime_execution_approval_gate_refresh_after_image_import_proof_diagnostics_passed',
      decision: result.decision,
      sourceMergeCommit: result.sourceMergeCommit,
      acceptedSoundCpuToolCount: result.approvalGateRefresh.acceptedSoundCpuToolCount,
      productToolCallExecutionReadyCount: tools.counts.productToolCallExecutionReadyCount,
      nextPrompt: result.nextPrompt
    },
    null,
    2
  )
)
