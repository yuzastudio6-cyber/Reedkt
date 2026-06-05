import { approvedPlanValidationBlockedFeatures } from './approved-plan-validation-policy'
import type {
  ApprovedPlanEvidenceContext,
  FeatureGateValidationResult,
  MissingContractInventory,
  OwnershipValidationResult,
  RuntimeBlockValidationResult,
  SystemReconciliationSummary,
} from './approved-plan-validation-types'

export function buildSystemReconciliationSummary(input: {
  evidenceContext: ApprovedPlanEvidenceContext
  ownershipValidation: OwnershipValidationResult
  runtimeBlockValidation: RuntimeBlockValidationResult
  featureGateValidation: FeatureGateValidationResult
  missingContractInventory: MissingContractInventory
}): SystemReconciliationSummary {
  const blockers = [
    ...input.evidenceContext.blockers,
    ...input.ownershipValidation.blockers,
    ...input.runtimeBlockValidation.blockers,
    ...input.featureGateValidation.blockers,
    ...input.missingContractInventory.blockers,
  ]
  const warnings = [
    ...input.evidenceContext.warnings,
    ...input.ownershipValidation.warnings,
    ...input.runtimeBlockValidation.warnings,
    ...input.featureGateValidation.warnings,
    ...input.missingContractInventory.warnings,
  ]
  return {
    reconciliationId: 'phase52e_system_reconciliation',
    readyControlledInternalPlanning: [
      'shared agent/tool architecture',
      'tool capability registry',
      'multi-agent dry-run on existing evidence',
      'candidate approved-plan bridge',
      'Supabase milestone sync',
    ],
    readyInternalTestingButNotExecutionHere: [
      'Track A visual-video readiness evidence',
      'web search/capture internal beta candidate evidence',
      'map/geospatial internal testing evidence',
    ],
    handoffRequired: [
      'AI Tools creative graphics/motion design runtime',
      'Track B audio/OCR/VLM/media processing runtime',
      'Worker Runtime approved snapshot execution',
      'Supabase schema/RLS/migration workstream',
      'Provider Gateway execution workstream',
      'Frontend UX integration workstream',
      'Compliance/security and observability/cost workstreams',
      'Billing/Stripe credit mutation workstream',
    ],
    blockedScopes: [...approvedPlanValidationBlockedFeatures],
    sourceOfTruthSummary: [
      'Approved-plan candidates are structured metadata only and are not runtime approvals.',
      'Map/geospatial source of truth remains source records, location candidates, GeoJSON, Turf calculations, and style/camera/render manifests.',
      'Web search source of truth remains source/capture/extraction manifests; Brave raw/snippet storage remains blocked by default.',
      'Video, graphics, and audio outputs must use approved manifests rather than preview artifacts.',
      'Supabase stores private gs:// references and structured readiness metadata only.',
    ],
    phase52FRecommendedScope: 'system readiness reconciliation and controlled internal test planning on existing evidence only; no runtime execution.',
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }
}
