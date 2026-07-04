export type ProjectEditBriefInternalTestingOwnerAcceptanceDecision =
  | 'project_edit_brief_internal_testing_owner_acceptance_passed_ready_for_production_shaped_internal_persistence_plan'
  | 'project_edit_brief_internal_testing_owner_acceptance_blocked_pending_codex_operator_scope'

export interface ProjectEditBriefInternalTestingOwnerAcceptance {
  id: string
  milestone: 'RP-EDITBRIEF-15H'
  decision: ProjectEditBriefInternalTestingOwnerAcceptanceDecision | string
  status: string
  acceptedBy: string
  scope: 'internal_testing_only' | string
  productionShapedImplementationRequired: boolean
  releaseDeltaTracked: boolean
  allowed: {
    internalDryRunTesting: boolean
    internalPersistencePlanning: boolean
    mockLocalRouteValidation: boolean
    contractFirstBackendSkeleton: boolean
  }
  blockedScope: {
    externalBetaAllowed: false
    realUserMediaBetaAllowed: false
    paidProductionAllowed: false
    liveSupabaseWritesAllowed: false
    providerCallsAllowed: false
    workerDispatchAllowed: false
    renderExportAllowed: false
    creditSpendAllowed: false
    realUserMediaAllowed: false
  }
  hardInvariants: string[]
  nextMilestone: string
}

export interface ProjectEditBriefInternalTestingOwnerAcceptanceResult {
  decision: ProjectEditBriefInternalTestingOwnerAcceptanceDecision
  internalTestingAllowed: boolean
  internalPersistencePlanningAllowed: boolean
  productionShapedImplementationRequired: boolean
  releaseDeltaTracked: boolean
  externalBetaAllowed: false
  realUserMediaBetaAllowed: false
  paidProductionAllowed: false
  liveSupabaseWritesAllowed: false
  providerCallsAllowed: false
  workerDispatchAllowed: false
  renderExportAllowed: false
  creditSpendAllowed: false
  blockedReasons: string[]
  nextMilestone: string
}

export const PROJECT_EDIT_BRIEF_INTERNAL_TESTING_REQUIRED_INVARIANTS = [
  'approved_plan_snapshot_required_before_expensive_work',
  'credit_estimate_reservation_required_before_expensive_work',
  'no_raw_prompts_as_source_truth',
  'no_secrets_or_service_role_in_frontend',
  'no_signed_urls_as_source_truth',
  'backend_worker_only_heavy_execution',
  'license_model_weight_review_required_before_external_beta',
  'no_silent_billing_or_wallet_mutation',
] as const

const expectedDecision =
  'project_edit_brief_internal_testing_owner_acceptance_passed_ready_for_production_shaped_internal_persistence_plan'

export function evaluateProjectEditBriefInternalTestingOwnerAcceptance(
  acceptance: ProjectEditBriefInternalTestingOwnerAcceptance,
): ProjectEditBriefInternalTestingOwnerAcceptanceResult {
  const blockedReasons: string[] = []

  if (acceptance.milestone !== 'RP-EDITBRIEF-15H') {
    blockedReasons.push('Milestone must be RP-EDITBRIEF-15H.')
  }
  if (acceptance.decision !== expectedDecision) {
    blockedReasons.push('Internal testing acceptance decision does not match the canonical decision.')
  }
  if (!acceptance.acceptedBy.trim()) {
    blockedReasons.push('Internal testing owner acceptance requires an acceptedBy value.')
  }
  if (acceptance.scope !== 'internal_testing_only') {
    blockedReasons.push('Internal testing owner acceptance must be scoped to internal_testing_only.')
  }
  if (!acceptance.productionShapedImplementationRequired) {
    blockedReasons.push('Internal testing must require production-shaped implementation, not throwaway wiring.')
  }
  if (!acceptance.releaseDeltaTracked) {
    blockedReasons.push('Internal testing must track the remaining release delta.')
  }

  const missingAllowed = Object.entries(acceptance.allowed)
    .filter(([, value]) => value !== true)
    .map(([key]) => key)
  for (const key of missingAllowed) {
    blockedReasons.push(`${key} must be allowed for the internal testing lane.`)
  }

  const unsafeBlockedScope = Object.entries(acceptance.blockedScope)
    .filter(([, value]) => value !== false)
    .map(([key]) => key)
  for (const key of unsafeBlockedScope) {
    blockedReasons.push(`${key} must remain false for RP-EDITBRIEF-15H.`)
  }

  for (const invariant of PROJECT_EDIT_BRIEF_INTERNAL_TESTING_REQUIRED_INVARIANTS) {
    if (!acceptance.hardInvariants.includes(invariant)) {
      blockedReasons.push(`Missing hard invariant: ${invariant}.`)
    }
  }

  const passed = blockedReasons.length === 0

  return {
    decision: passed
      ? expectedDecision
      : 'project_edit_brief_internal_testing_owner_acceptance_blocked_pending_codex_operator_scope',
    internalTestingAllowed: passed,
    internalPersistencePlanningAllowed: passed,
    productionShapedImplementationRequired: acceptance.productionShapedImplementationRequired,
    releaseDeltaTracked: acceptance.releaseDeltaTracked,
    externalBetaAllowed: false,
    realUserMediaBetaAllowed: false,
    paidProductionAllowed: false,
    liveSupabaseWritesAllowed: false,
    providerCallsAllowed: false,
    workerDispatchAllowed: false,
    renderExportAllowed: false,
    creditSpendAllowed: false,
    blockedReasons,
    nextMilestone: acceptance.nextMilestone,
  }
}
