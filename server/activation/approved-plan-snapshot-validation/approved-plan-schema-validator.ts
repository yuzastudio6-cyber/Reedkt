import { phase52DAllowedIntentTypes, phase52DBlockedIntentTypes } from '../agent-tool-plan-bridge'
import type { BlockedPlanRecord, CandidateApprovedPlanSnapshot } from '../agent-tool-plan-bridge'
import type { ApprovedPlanValidationResult } from './approved-plan-validation-types'

export function validateCandidateApprovedPlanSchemas(candidatePlans: CandidateApprovedPlanSnapshot[]): ApprovedPlanValidationResult {
  const blockers: string[] = []
  const warnings: string[] = []
  const details = candidatePlans.map((plan) => {
    const planBlockers = validateCandidatePlan(plan)
    blockers.push(...planBlockers.map((item) => `${plan.planId}: ${item}`))
    return {
      id: plan.planId,
      passed: planBlockers.length === 0,
      summary: planBlockers[0] ?? 'Candidate plan preserves Phase 52E approved-plan snapshot validation schema.',
    }
  })

  if (candidatePlans.length !== phase52DAllowedIntentTypes.length) blockers.push(`Expected ${phase52DAllowedIntentTypes.length} candidate plans, got ${candidatePlans.length}.`)
  for (const intentType of phase52DAllowedIntentTypes) {
    if (!candidatePlans.some((plan) => plan.sourceIntentTypes.includes(intentType))) blockers.push(`Missing candidate plan for ${intentType}.`)
  }
  if (candidatePlans.some((plan) => !plan.planId.startsWith('phase52d-'))) warnings.push('Candidate plan IDs differ from the Phase 52D canonical prefix.')

  return {
    validationId: 'phase52e_candidate_plan_schema_validation',
    status: blockers.length ? 'blocked' : 'passed',
    checkedRecords: candidatePlans.length,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
    details,
  }
}

export function validateBlockedPlanSchemas(blockedPlans: BlockedPlanRecord[]): ApprovedPlanValidationResult {
  const blockers: string[] = []
  const details = blockedPlans.map((plan) => {
    const planBlockers = validateBlockedPlan(plan)
    blockers.push(...planBlockers.map((item) => `${plan.planId}: ${item}`))
    return {
      id: plan.planId,
      passed: planBlockers.length === 0,
      summary: planBlockers[0] ?? 'Blocked/handoff record preserves Phase 52E non-executable plan schema.',
    }
  })

  if (blockedPlans.length !== phase52DBlockedIntentTypes.length) blockers.push(`Expected ${phase52DBlockedIntentTypes.length} blocked/handoff records, got ${blockedPlans.length}.`)
  for (const intentType of phase52DBlockedIntentTypes) {
    if (!blockedPlans.some((plan) => plan.sourceIntentTypes.includes(intentType))) blockers.push(`Missing blocked/handoff record for ${intentType}.`)
  }

  return {
    validationId: 'phase52e_blocked_plan_validation',
    status: blockers.length ? 'blocked' : 'passed',
    checkedRecords: blockedPlans.length,
    blockers: Array.from(new Set(blockers)),
    warnings: [],
    details,
  }
}

function validateCandidatePlan(plan: CandidateApprovedPlanSnapshot): string[] {
  const blockers: string[] = []
  if (plan.decision !== 'candidate_plan_only') blockers.push('decision must be candidate_plan_only.')
  if (plan.executionStatus !== 'candidate_only' || !plan.candidateOnly) blockers.push('executionStatus must be candidate_only.')
  if (plan.rawPromptExecution || plan.workerExecutionAllowed || plan.approvedForRuntime) blockers.push('raw prompt, worker, and runtime approval must remain false.')
  if (plan.approvedByPolicy) blockers.push('approvedByPolicy must remain false.')
  if (!plan.inputArtifactScope.length || !plan.outputArtifactScope.length) blockers.push('input/output artifact scopes are required.')
  if (!plan.selectedToolRoutes.length || !plan.crossTrackOwner) blockers.push('owner route is required.')
  if (!plan.qaRequirements.length) blockers.push('QA requirements are required.')
  if (!plan.sourceOfTruthPolicy.length) blockers.push('source-of-truth policy is required.')
  if (plan.supabaseMilestoneSyncPolicy !== 'phase51d_milestone_sync_only') blockers.push('Supabase sync policy must stay phase51d_milestone_sync_only.')
  if (plan.safetyFlags.publicArtifactAllowed || plan.safetyFlags.signedUrlSourceOfTruthAllowed || plan.safetyFlags.providerCallsAllowed) blockers.push('public artifact, signed URL source-of-truth, and provider calls must remain false.')
  if (plan.safetyFlags.productionReadyAllowed || plan.safetyFlags.externalBetaAllowed || plan.safetyFlags.broadMediaAllowed) blockers.push('production, external beta, and broad media must remain false.')
  if (plan.safetyFlags.toolRuntimeAllowed || plan.safetyFlags.modelInferenceAllowed) blockers.push('tool runtime and model inference must remain false.')
  return blockers
}

function validateBlockedPlan(plan: BlockedPlanRecord): string[] {
  const blockers: string[] = []
  if (plan.decision !== 'handoff_only' && plan.decision !== 'blocked') blockers.push('decision must be handoff_only or blocked.')
  if (plan.executionStatus !== 'blocked_or_handoff_only') blockers.push('executionStatus must be blocked_or_handoff_only.')
  if (plan.rawPromptExecution || plan.workerExecutionAllowed || plan.approvedForRuntime) blockers.push('raw prompt, worker, and runtime approval must remain false.')
  if (plan.publicArtifactAllowed || plan.signedUrlSourceOfTruthAllowed) blockers.push('public artifact and signed URL source-of-truth must remain false.')
  if (plan.productionReadyAllowed || plan.externalBetaAllowed || plan.broadMediaAllowed) blockers.push('production, external beta, and broad media must remain false.')
  if (!plan.ownerRoute || !plan.ownerActionNeeded || !plan.blockedReason) blockers.push('owner route, owner action, and blocked reason are required.')
  if (!plan.sourceOfTruthPolicy.length) blockers.push('source-of-truth policy is required.')
  return blockers
}
