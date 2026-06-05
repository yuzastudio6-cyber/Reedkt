import { routeForIntent } from '../agent-tool-plan-bridge'
import type { BlockedPlanRecord, CandidateApprovedPlanSnapshot } from '../agent-tool-plan-bridge'
import type { OwnershipValidationResult } from './approved-plan-validation-types'

export function validateApprovedPlanOwnership(input: {
  candidatePlans: CandidateApprovedPlanSnapshot[]
  blockedPlans: BlockedPlanRecord[]
}): OwnershipValidationResult {
  const blockers: string[] = []
  const ownerRoutes: OwnershipValidationResult['ownerRoutes'] = []

  for (const plan of input.candidatePlans) {
    const intentType = plan.sourceIntentTypes[0]
    const expected = routeForIntent(intentType)
    const actual = plan.crossTrackOwner
    const ownerValid = actual === expected.ownerRoute && plan.selectedToolRoutes.every((route) => route.ownerRoute === actual)
    if (!ownerValid) blockers.push(`${plan.planId}: expected ${expected.ownerRoute}, got ${actual}.`)
    ownerRoutes.push({
      planId: plan.planId,
      ownerRoute: actual,
      ownerValid,
      nextOwnerAction: expected.ownerActionNeeded,
    })
  }

  for (const plan of input.blockedPlans) {
    const intentType = plan.sourceIntentTypes[0]
    const expected = routeForIntent(intentType)
    const ownerValid = plan.ownerRoute === expected.ownerRoute
    if (!ownerValid) blockers.push(`${plan.planId}: expected ${expected.ownerRoute}, got ${plan.ownerRoute}.`)
    ownerRoutes.push({
      planId: plan.planId,
      ownerRoute: plan.ownerRoute,
      ownerValid,
      nextOwnerAction: plan.ownerActionNeeded,
    })
  }

  return {
    validationId: 'phase52e_ownership_validation',
    status: blockers.length ? 'blocked' : 'passed',
    checkedRecords: input.candidatePlans.length + input.blockedPlans.length,
    blockers,
    warnings: [],
    details: ownerRoutes.map((route) => ({
      id: route.planId,
      passed: route.ownerValid,
      summary: route.ownerValid ? `Owner route ${route.ownerRoute} is valid.` : `Owner route ${route.ownerRoute} is invalid.`,
    })),
    ownerRoutes,
  }
}
