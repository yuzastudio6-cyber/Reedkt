import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

const files = {
  audit: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-reconciliation-audit.md',
  sourceMap: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-source-map.md',
  decisions: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-decision-register.md',
  gaps: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-lane-remaining-gap-register.md',
  prompt: 'docs/implementation-prompts/prompt-worker-runtime-jobs-sound-cpu-owner-evidence-lane-gap-closure-plan.md',
  sourceBlocker: 'docs/worker-runtime-jobs-sound-cpu-owner-evidence-response-collection-blocker.md',
  syntheticProof: 'docs/sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result.md',
  runtimePacket: 'docs/sound-runtime-media-gate-2am-runtime-execution-owner-approval-packet.md',
  gapPlan: 'docs/sound-runtime-media-gate-2an-runtime-execution-approval-readiness-gap-closure-plan.md',
  supabaseArtifact: 'docs/sound-runtime-media-gate-2ad-supabase-artifact-owner-boundary-register.md',
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function read(relativePath) {
  const fullPath = path.join(root, relativePath)
  assert(fs.existsSync(fullPath), `Missing required file: ${relativePath}`)
  return fs.readFileSync(fullPath, 'utf8')
}

function parseJsonFence(relativePath, label) {
  const text = read(relativePath)
  const pattern = new RegExp('```json ' + label + '\\n([\\s\\S]*?)\\n```')
  const match = text.match(pattern)
  assert(match, `Missing JSON fence ${label} in ${relativePath}`)
  return JSON.parse(match[1])
}

const audit = parseJsonFence(files.audit, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-reconciliation-audit')
const sourceMap = parseJsonFence(files.sourceMap, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-source-map')
const decisions = parseJsonFence(files.decisions, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-decision-register')
const gaps = parseJsonFence(files.gaps, 'worker-runtime-jobs-sound-cpu-owner-evidence-lane-remaining-gap-register')
const sourceBlocker = parseJsonFence(files.sourceBlocker, 'worker-runtime-jobs-sound-cpu-owner-evidence-response-collection-blocker')
const syntheticProof = parseJsonFence(files.syntheticProof, 'sound-runtime-media-gate-2a-controlled-synthetic-tool-call-proof-result')
const runtimePacket = parseJsonFence(files.runtimePacket, 'sound-runtime-media-gate-2am-runtime-execution-owner-approval-packet')
const gapPlan = parseJsonFence(files.gapPlan, 'sound-runtime-media-gate-2an-runtime-execution-approval-readiness-gap-closure-plan')
const supabaseArtifact = parseJsonFence(files.supabaseArtifact, 'sound-runtime-media-gate-2ad-supabase-artifact-owner-boundary-register')
const prompt = read(files.prompt)

assert(audit.owner === 'WORKER_RUNTIME_JOBS', 'audit owner mismatch')
assert(
  audit.decision === 'worker_runtime_jobs_sound_cpu_owner_evidence_lane_reconciliation_completed_with_warnings_ready_for_owner_gap_closure_plan',
  'audit decision mismatch',
)
assert(audit.sourceVerification.sourceHead === 'e4d0a02f38332e062d62c4881f83431af4269af2', 'source head mismatch')
assert(audit.reconciliationResult.literalOwnerResponsesFound === false, 'literal owner responses must remain false')
assert(audit.reconciliationResult.repoLaneEvidenceInspected === true, 'repo lane evidence must be inspected')
assert(audit.reconciliationResult.requiredOwnerAreaCount === 7, 'required owner area count mismatch')
assert(audit.reconciliationResult.ownerAreasClassifiedFromLaneEvidence === 7, 'classified owner area count mismatch')
assert(audit.reconciliationResult.planningEvidencePresentCount === 7, 'planning evidence count mismatch')
assert(audit.reconciliationResult.strictOwnerResponseCount === 0, 'strict owner response count must remain zero')
assert(audit.reconciliationResult.toolCandidateCount === 15, 'tool candidate count mismatch')
assert(audit.reconciliationResult.externalBetaAllowed === false, 'external beta must stay blocked')
assert(audit.reconciliationResult.paidProductionAllowed === false, 'paid production must stay blocked')
assert(audit.reconciliationResult.runtimeExecutionApprovedToday === false, 'runtime execution must stay blocked')
assert(audit.reconciliationResult.workerExecutionApprovedToday === false, 'worker execution must stay blocked')
assert(audit.reconciliationResult.billingBetaProductionApprovedToday === false, 'billing/beta/production must stay blocked')

assert(sourceMap.sourceMaps.length === 7, 'source map must classify seven owner areas')
for (const row of sourceMap.sourceMaps) {
  assert(Array.isArray(row.evidenceFiles) && row.evidenceFiles.length > 0, `${row.ownerArea} has no evidence files`)
  for (const evidenceFile of row.evidenceFiles) {
    read(evidenceFile)
  }
}

assert(decisions.acceptedLaneEvidence.controlledSyntheticToolCallProof.toolCandidateCount === 15, 'decision tool count mismatch')
assert(decisions.acceptedLaneEvidence.controlledSyntheticToolCallProof.probePassedCount === 15, 'decision probe count mismatch')
assert(decisions.acceptedLaneEvidence.workerRuntimePlanningEvidence.requiredOwnerSignoffCount === 8, 'required signoff count mismatch')
assert(decisions.decisionBoundaries.doesThisApproveExecution === false, 'execution must not be approved')
assert(decisions.decisionBoundaries.doesThisApproveBeta === false, 'beta must not be approved')
assert(decisions.decisionBoundaries.doesThisApproveProduction === false, 'production must not be approved')
assert(decisions.decisionBoundaries.doesThisApproveSupabaseSql === false, 'Supabase SQL must not be approved')
assert(decisions.decisionBoundaries.doesThisApproveBillingStripe === false, 'billing/Stripe must not be approved')
assert(decisions.decisionBoundaries.doesThisApproveArtifactDelivery === false, 'artifact delivery must not be approved')

assert(gaps.remainingGaps.length === 3, 'remaining gap count mismatch')
assert(gaps.summary.closedGapCountToday === 0, 'closed gap count must remain zero')
assert(gaps.summary.nextAction.includes('gap_closure_plan'), 'next action must be gap closure planning')

assert(sourceBlocker.responseCollectionResult.ownerResponsesFound === false, 'source blocker owner response state drifted')
assert(sourceBlocker.responseCollectionResult.ownerResponsesReceivedToday === 0, 'source blocker response count drifted')
assert(syntheticProof.toolCandidateCount === 15, 'synthetic proof candidate count mismatch')
assert(syntheticProof.probePassedCount === 15, 'synthetic proof probe count mismatch')
assert(syntheticProof.betaReadinessClassification.externalBetaAllowed === 'no', 'synthetic proof external beta must remain no')
assert(runtimePacket.ownerApprovalPacketResult.requiredOwnerSignoffCount === 8, 'runtime packet signoff count mismatch')
assert(runtimePacket.ownerApprovalPacketResult.runtimeExecutionApprovedToday === false, 'runtime packet must not approve execution')
assert(gapPlan.gapClosurePlanResult.trackedGapCount === 8, 'gap plan tracked count mismatch')
assert(gapPlan.gapClosurePlanResult.closedGapCountToday === 0, 'gap plan closed gap count mismatch')
assert(supabaseArtifact.supabaseClassification.updateRequired === 'no', 'Supabase update classification mismatch')
assert(supabaseArtifact.supabaseBoundaries.sqlExecutionApprovedToday === false, 'Supabase SQL must remain blocked')
assert(supabaseArtifact.artifactBoundaries.publicArtifactCreationApprovedToday === false, 'public artifacts must remain blocked')

const forbiddenPromptClaims = [
  'unlock beta',
  'unlock production',
  'run workers',
  'run routes',
  'Docker build/run/push',
]
for (const claim of forbiddenPromptClaims) {
  assert(prompt.includes(claim), `prompt must explicitly block ${claim}`)
}

console.log(
  JSON.stringify(
    {
      status: 'worker_runtime_jobs_sound_cpu_owner_evidence_lane_reconciliation_audit_diagnostics_passed',
      decision: audit.decision,
      sourceHead: audit.sourceVerification.sourceHead,
      toolCandidateCount: audit.reconciliationResult.toolCandidateCount,
      ownerAreasClassifiedFromLaneEvidence: audit.reconciliationResult.ownerAreasClassifiedFromLaneEvidence,
      strictOwnerResponseCount: audit.reconciliationResult.strictOwnerResponseCount,
      closedGapCountToday: audit.reconciliationResult.closedGapCountToday,
      runtimeExecutionApprovedToday: audit.reconciliationResult.runtimeExecutionApprovedToday,
      externalBetaAllowed: audit.reconciliationResult.externalBetaAllowed,
      nextPrompt: audit.nextPrompt,
    },
    null,
    2,
  ),
)
