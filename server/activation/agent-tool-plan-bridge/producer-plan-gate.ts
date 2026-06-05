import type { BlockedPlanRecord, CandidateApprovedPlanSnapshot, ProducerPlanGateResult } from './agent-tool-plan-bridge-types'

export function runAgentToolPlanProducerGate(input: {
  candidatePlans: CandidateApprovedPlanSnapshot[]
  blockedPlans: BlockedPlanRecord[]
}): ProducerPlanGateResult[] {
  const candidateResults: ProducerPlanGateResult[] = input.candidatePlans.map((plan) => ({
    planId: plan.planId,
    decision: 'candidate_plan_only',
    ownerRoute: plan.crossTrackOwner,
    requiredCapabilitiesPresent: plan.selectedToolRoutes.every((route) => route.toolIds.length > 0),
    ownerRouteValid: plan.selectedToolRoutes.length > 0,
    candidatePlanOnly: true,
    runtimeExecutionBlocked: !plan.workerExecutionAllowed && !plan.approvedForRuntime,
    productionAllowed: false,
    externalBetaAllowed: false,
    broadMediaAllowed: false,
    publicArtifactAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    reason: 'Allowed as a candidate approved-plan snapshot only; no worker/tool/provider execution is authorized.',
    blockers: [],
  }))

  const blockedResults: ProducerPlanGateResult[] = input.blockedPlans.map((plan) => ({
    planId: plan.planId,
    decision: plan.decision,
    ownerRoute: plan.ownerRoute,
    requiredCapabilitiesPresent: plan.requiredCapabilities.length > 0,
    ownerRouteValid: Boolean(plan.ownerRoute),
    candidatePlanOnly: false,
    runtimeExecutionBlocked: true,
    productionAllowed: false,
    externalBetaAllowed: false,
    broadMediaAllowed: false,
    publicArtifactAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    reason: plan.blockedReason,
    blockers: plan.decision === 'blocked' ? [plan.blockedReason] : [],
  }))
  return [...candidateResults, ...blockedResults]
}

export function validateAgentToolPlanProducerGate(results: ProducerPlanGateResult[]) {
  const blockers: string[] = []
  const candidateOnly = results.filter((result) => result.decision === 'candidate_plan_only')
  const handoffOnly = results.filter((result) => result.decision === 'handoff_only')
  const blocked = results.filter((result) => result.decision === 'blocked')
  if (candidateOnly.length !== 7) blockers.push(`Producer gate expected 7 candidate-only plans, got ${candidateOnly.length}.`)
  if (handoffOnly.length !== 2) blockers.push(`Producer gate expected 2 handoff-only records, got ${handoffOnly.length}.`)
  if (blocked.length !== 2) blockers.push(`Producer gate expected 2 blocked records, got ${blocked.length}.`)
  for (const result of results) {
    if (!result.ownerRouteValid) blockers.push(`${result.planId} has no valid owner route.`)
    if (!result.requiredCapabilitiesPresent) blockers.push(`${result.planId} has no required capability list.`)
    if (!result.runtimeExecutionBlocked) blockers.push(`${result.planId} does not block runtime execution.`)
    if (result.productionAllowed || result.externalBetaAllowed || result.broadMediaAllowed || result.publicArtifactAllowed || result.signedUrlSourceOfTruthAllowed) blockers.push(`${result.planId} attempts a blocked unlock.`)
  }
  return { ok: blockers.length === 0, blockers }
}
