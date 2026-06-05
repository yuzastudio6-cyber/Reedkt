import type { BlockedPlanRecord, CandidateApprovedPlanSnapshot } from '../agent-tool-plan-bridge'
import type { FeatureGateValidationResult } from './approved-plan-validation-types'

export const phase52EDisabledFeatureGates = [
  'production_ready',
  'external_beta_ready',
  'paid_production_ready',
  'broad_media_ready',
  'public_artifacts',
  'signed_url_source_of_truth',
  'raw_prompt_execution',
  'direct_agent_tool_execution',
  'worker_execution',
  'tool_runtime_execution',
  'provider_execution',
  'web_search_execution',
  'map_rendering',
  'browser_capture',
  'supabase_migrations',
  'historical_backfill',
]

export function validateApprovedPlanFeatureGates(input: {
  candidatePlans: CandidateApprovedPlanSnapshot[]
  blockedPlans: BlockedPlanRecord[]
}): FeatureGateValidationResult {
  const blockers: string[] = []
  const details = [
    ...input.candidatePlans.map((plan) => {
      const passed = !plan.safetyFlags.publicArtifactAllowed &&
        !plan.safetyFlags.signedUrlSourceOfTruthAllowed &&
        !plan.safetyFlags.productionReadyAllowed &&
        !plan.safetyFlags.externalBetaAllowed &&
        !plan.safetyFlags.broadMediaAllowed
      if (!passed) blockers.push(`${plan.planId}: attempted to enable a blocked feature gate.`)
      return { id: plan.planId, passed, summary: passed ? 'Candidate feature gates remain disabled.' : 'Candidate feature gate validation failed.' }
    }),
    ...input.blockedPlans.map((plan) => {
      const passed = !plan.publicArtifactAllowed &&
        !plan.signedUrlSourceOfTruthAllowed &&
        !plan.productionReadyAllowed &&
        !plan.externalBetaAllowed &&
        !plan.broadMediaAllowed
      if (!passed) blockers.push(`${plan.planId}: attempted to enable a blocked feature gate.`)
      return { id: plan.planId, passed, summary: passed ? 'Blocked/handoff feature gates remain disabled.' : 'Blocked/handoff feature gate validation failed.' }
    }),
  ]

  return {
    validationId: 'phase52e_feature_gate_validation',
    status: blockers.length ? 'blocked' : 'passed',
    checkedRecords: input.candidatePlans.length + input.blockedPlans.length,
    blockers,
    warnings: [],
    details,
    disabledGates: phase52EDisabledFeatureGates,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    broadMediaAllowed: false,
  }
}
