import type { CanonicalEditJourney } from './canonical-edit-journey'

export type CanonicalPresentedPlanIdentity = {
  planId: string
  planVersion: number
  planHash: string
}

export function canonicalPlanApprovalReadyForPresentedPlan(input: {
  backendConnected: boolean
  journey?: CanonicalEditJourney
  publicationStatus?: string
  presentedPlan?: CanonicalPresentedPlanIdentity
  visibleMaximumCredits: number
}): boolean {
  if (!input.backendConnected) return true

  const journey = input.journey
  const authority = journey?.approvalAuthority
  const presentedPlan = input.presentedPlan
  return Boolean(
    journey?.stage === 'plan_approval_required' &&
    authority &&
    journey.plan?.status === 'presented' &&
    journey.plan.estimateStatus === 'presented' &&
    journey.plan.maximumCredits === input.visibleMaximumCredits &&
    input.publicationStatus === 'plan_published_waiting_for_approval' &&
    presentedPlan?.planId === authority.planId &&
    presentedPlan.planVersion === journey.plan.version &&
    presentedPlan.planHash === authority.expectedPlanHash,
  )
}
