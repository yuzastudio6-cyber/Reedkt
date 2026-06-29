#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const repoRoot = process.cwd()

const decision =
  'worker_runtime_jobs_sound_cpu_phase37t_caption_render_runtime_hook_blocked_state_source_controlled_execution_proof_passed_with_warnings_ready_for_controlled_execution_proof_owner_review_no_media_no_artifacts'
const sourceDecision =
  'worker_runtime_jobs_sound_cpu_phase37s_caption_render_runtime_hook_blocked_state_source_controlled_execution_plan_owner_review_passed_with_warnings_ready_for_controlled_execution_proof_no_media_no_artifacts'
const sourceMergeCommit = '5b53c67f82994c019e53059799cd46bc6e2e2937'
const tempProofFile =
  'server/workers/sound-cpu/phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.tmp.ts'
const nextPrompt =
  'WORKER_RUNTIME_JOBS-SOUND-CPU-PHASE37T-CAPTION-RENDER-RUNTIME-HOOK-BLOCKED-STATE-SOURCE-CONTROLLED-EXECUTION-PROOF-OWNER-REVIEW'
const packageScript =
  'worker-runtime-jobs:sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof:diagnostics'

const docs = [
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof.md',
    'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-proof-output-register.md',
    'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-proof-output-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-temp-file-removal-register.md',
    'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-temp-file-removal-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-blocked-assertion-register.md',
    'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-blocked-assertion-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-blocker-register.md',
    'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-blocker-register',
  ],
  [
    'docs/worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-claim-policy.md',
    'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-claim-policy',
  ],
  [
    'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-review.md',
    'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-review',
  ],
]

function readText(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath)
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Missing required file: ${relativePath}`)
  }
  return fs.readFileSync(absolutePath, 'utf8')
}

function parseJsonBlock(relativePath, label) {
  const text = readText(relativePath)
  const pattern = new RegExp('```json\\s+' + label + '\\n([\\s\\S]*?)\\n```')
  const match = text.match(pattern)
  if (!match) throw new Error(`Missing JSON block ${label} in ${relativePath}`)
  return JSON.parse(match[1])
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function assertFalse(value, label) {
  assert(value === false, `${label} must be false`)
}

const parsed = new Map(docs.map(([file, label]) => [label, parseJsonBlock(file, label)]))
const proof = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof',
)
const output = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-proof-output-register',
)
const removal = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-temp-file-removal-register',
)
const assertion = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-blocked-assertion-register',
)
const blocker = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-blocker-register',
)
const claimPolicy = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-claim-policy',
)
const ownerPrompt = parsed.get(
  'worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-owner-review',
)

assert(proof.decision === decision, 'Proof decision mismatch')
assert(proof.sourceVerification.sourcePr === 1688, 'Proof source PR mismatch')
assert(proof.sourceVerification.sourceMergeCommit === sourceMergeCommit, 'Proof source merge mismatch')
assert(proof.sourceVerification.sourceDecision === sourceDecision, 'Proof source decision mismatch')
assert(proof.controlledProof.command.includes(tempProofFile), 'Proof command mismatch')
assert(proof.controlledProof.serverTypecheckCommand === 'npm run typecheck:server', 'Typecheck command mismatch')
assert(proof.controlledProof.factoryInvoked === true, 'Factory invocation proof missing')
assert(proof.controlledProof.blockedAssertionInvoked === true, 'Blocked assertion proof missing')
assert(proof.controlledProof.syntheticNoMediaInputOnly === true, 'Synthetic no-media proof missing')
assert(proof.controlledProof.blockedStatus === 'blocked_by_owner_gate', 'Blocked status mismatch')
assert(proof.controlledProof.integrationName === 'ocrCaptionRenderSafeZoneBlockedStateIntegration', 'Integration name mismatch')
assert(proof.controlledProof.integrationSourceStatus === 'blocked_state_source_created_execution_blocked', 'Integration status mismatch')
assertFalse(proof.controlledProof.runtimeExecutionApproved, 'proof runtimeExecutionApproved')
assertFalse(proof.controlledProof.workerExecutionApproved, 'proof workerExecutionApproved')
assertFalse(proof.controlledProof.renderExecutionApproved, 'proof renderExecutionApproved')
assertFalse(proof.controlledProof.mediaProcessingApproved, 'proof mediaProcessingApproved')
assertFalse(proof.controlledProof.artifactCreationApproved, 'proof artifactCreationApproved')
assertFalse(proof.controlledProof.supabaseSqlApproved, 'proof supabaseSqlApproved')
assert(proof.controlledProof.noArtifactCreated === true, 'No artifact flag missing')
assert(proof.controlledProof.temporaryProofFileRemovedBeforeStaging === true, 'Temp cleanup proof missing')
assert(proof.nextPrompt === nextPrompt, 'Next prompt mismatch')

assert(output.sanitizedOutput.status === 'passed', 'Sanitized output status mismatch')
assert(output.sanitizedOutput.factoryInvoked === true, 'Output factory invocation missing')
assert(output.sanitizedOutput.blockedAssertionInvoked === true, 'Output blocked assertion missing')
assert(output.sanitizedOutput.syntheticNoMediaInputOnly === true, 'Output synthetic no-media missing')
assertFalse(output.sanitizedOutput.runtimeExecutionApproved, 'output runtimeExecutionApproved')
assertFalse(output.sanitizedOutput.artifactCreationApproved, 'output artifactCreationApproved')
assert(output.omittedFromEvidence.includes('media bytes'), 'Media bytes omission missing')
assert(output.omittedFromEvidence.includes('service-role tokens'), 'Service-role omission missing')

assert(removal.temporaryProofFile === tempProofFile, 'Removal temp file mismatch')
assert(removal.temporaryProofFileCreatedForProof === true, 'Temp file creation evidence missing')
assert(removal.temporaryProofFileRemovedBeforeStaging === true, 'Temp file removal missing')
assertFalse(removal.temporaryProofFileStaged, 'removal temporaryProofFileStaged')
assertFalse(removal.nodeModulesStaged, 'removal nodeModulesStaged')
assertFalse(removal.distStaged, 'removal distStaged')
assertFalse(removal.distServerStaged, 'removal distServerStaged')
assert(!fs.existsSync(path.join(repoRoot, tempProofFile)), 'Temporary proof file must be absent before staging')

assert(assertion.blockedAssertion.invokedInControlledProof === true, 'Blocked assertion invocation missing')
assert(assertion.blockedAssertion.matchedExpectedReason === true, 'Blocked assertion reason mismatch')
assert(assertion.factoryAssertion.invokedInControlledProof === true, 'Factory assertion invocation missing')
assert(assertion.factoryAssertion.allRuntimeApprovalsFalse === true, 'Runtime approvals false assertion missing')
for (const key of [
  'runtimeReady',
  'workerReady',
  'mediaReady',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(assertion.runtimeAndMediaClaims[key], `assertion.runtimeAndMediaClaims.${key}`)
}

assert(
  blocker.resolvedForThisGate.some((row) => row.blockerId === 'phase37t_controlled_execution_proof_pending'),
  'Phase 37T proof blocker resolution missing',
)
assert(
  blocker.remainingBlockers.some((row) => row.blockerId === 'phase37t_controlled_execution_proof_owner_review_pending'),
  'Phase 37T owner-review blocker missing',
)

assert(claimPolicy.allowedClaims.controlledSyntheticFailClosedProofPassed === true, 'Controlled proof claim missing')
assert(claimPolicy.allowedClaims.factoryInvokedInControlledProof === true, 'Factory proof claim missing')
assert(claimPolicy.allowedClaims.blockedAssertionInvokedInControlledProof === true, 'Blocked assertion proof claim missing')
for (const key of [
  'runtimeExecution',
  'realMediaProcessing',
  'workerExecution',
  'artifactCreation',
  'supabaseSql',
  'generated_local_fixture_passed',
  'dry_run_passed',
  'realUserMediaBetaAllowed',
  'paidProductionAllowed',
]) {
  assertFalse(claimPolicy.allowedClaims[key], `claimPolicy.allowedClaims.${key}`)
}
assert(claimPolicy.noScopeStatement.includes('ran one bounded fail-closed synthetic no-media proof'), 'No-scope phrase missing')

assert(ownerPrompt.requiredSourceDecision === decision, 'Owner prompt source decision mismatch')
assert(ownerPrompt.sourceHeadAtPromptCreation === sourceMergeCommit, 'Owner prompt source head mismatch')
assert(ownerPrompt.reviewFocus.temporaryProofFileRemoved === true, 'Owner prompt temp cleanup missing')
assert(ownerPrompt.reviewFocus.noSupabaseSql === true, 'Owner prompt Supabase guard missing')

const sourceReview = parseJsonBlock(
  'docs/worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-review.md',
  'worker-runtime-jobs-sound-cpu-phase37s-caption-render-runtime-hook-blocked-state-source-controlled-execution-plan-owner-review',
)
assert(sourceReview.decision === sourceDecision, 'Source owner review decision mismatch')
assert(sourceReview.reviewDecision.phase37TControlledExecutionProofMayProceed === true, 'Source did not permit Phase 37T')

const packageJson = JSON.parse(readText('package.json'))
assert(
  packageJson.scripts?.[packageScript] ===
    'node scripts/validation/worker-runtime-jobs-sound-cpu-phase37t-caption-render-runtime-hook-blocked-state-source-controlled-execution-proof-diagnostics.mjs',
  'package diagnostics script missing',
)

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision,
      sourcePr: 1688,
      sourceMergeCommit,
      factoryInvoked: true,
      blockedAssertionInvoked: true,
      syntheticNoMediaInputOnly: true,
      temporaryProofFileRemoved: true,
      runtimeExecutionApproved: false,
      realUserMediaBetaAllowed: false,
      paidProductionAllowed: false,
      nextPrompt,
    },
    null,
    2,
  ),
)
