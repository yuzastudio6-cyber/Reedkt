import { phase52DAllowedIntentTypes, phase52DBlockedIntentTypes } from './approved-plan-candidate-builder'
import type { BlockedPlanRecord, CandidateApprovedPlanSnapshot } from './agent-tool-plan-bridge-types'

export interface AgentToolPlanScopeValidation {
  ok: boolean
  blockers: string[]
  warnings: string[]
}

export function validateAgentToolPlanScope(input: {
  candidatePlans: CandidateApprovedPlanSnapshot[]
  blockedPlans: BlockedPlanRecord[]
}): AgentToolPlanScopeValidation {
  const blockers: string[] = []
  const warnings: string[] = []
  if (input.candidatePlans.length !== phase52DAllowedIntentTypes.length) blockers.push(`Expected ${phase52DAllowedIntentTypes.length} candidate plans, got ${input.candidatePlans.length}.`)
  if (input.blockedPlans.length !== phase52DBlockedIntentTypes.length) blockers.push(`Expected ${phase52DBlockedIntentTypes.length} blocked/handoff records, got ${input.blockedPlans.length}.`)

  for (const intentType of phase52DAllowedIntentTypes) {
    if (!input.candidatePlans.some((plan) => plan.sourceIntentTypes.includes(intentType))) blockers.push(`Missing candidate plan for ${intentType}.`)
  }
  for (const intentType of phase52DBlockedIntentTypes) {
    if (!input.blockedPlans.some((plan) => plan.sourceIntentTypes.includes(intentType))) blockers.push(`Missing blocked/handoff plan for ${intentType}.`)
  }

  for (const plan of input.candidatePlans) {
    if (!plan.candidateOnly || plan.executionStatus !== 'candidate_only') blockers.push(`${plan.planId} is not candidate-only.`)
    if (plan.rawPromptExecution || plan.workerExecutionAllowed || plan.approvedForRuntime) blockers.push(`${plan.planId} attempts raw prompt, worker, or runtime execution.`)
    if (plan.safetyFlags.publicArtifactAllowed || plan.safetyFlags.signedUrlSourceOfTruthAllowed || plan.safetyFlags.providerCallsAllowed) blockers.push(`${plan.planId} attempts a blocked provider/artifact path.`)
    if (plan.safetyFlags.productionReadyAllowed || plan.safetyFlags.externalBetaAllowed || plan.safetyFlags.broadMediaAllowed) blockers.push(`${plan.planId} attempts production, beta, or broad-media readiness.`)
    if (!plan.selectedToolRoutes.length) blockers.push(`${plan.planId} has no owner route.`)
    if (!plan.sourceOfTruthPolicy.some((item) => item.includes('source of truth'))) warnings.push(`${plan.planId} has no explicit source-of-truth wording.`)
  }
  for (const plan of input.blockedPlans) {
    if (plan.rawPromptExecution || plan.workerExecutionAllowed || plan.approvedForRuntime) blockers.push(`${plan.planId} attempts runtime despite blocked/handoff status.`)
    if (plan.publicArtifactAllowed || plan.signedUrlSourceOfTruthAllowed || plan.productionReadyAllowed || plan.externalBetaAllowed || plan.broadMediaAllowed) blockers.push(`${plan.planId} attempts a blocked unlock.`)
    if (!plan.ownerRoute || !plan.ownerActionNeeded) blockers.push(`${plan.planId} missing owner route or owner action.`)
  }
  return { ok: blockers.length === 0, blockers, warnings }
}
