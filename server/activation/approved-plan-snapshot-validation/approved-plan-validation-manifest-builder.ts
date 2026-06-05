import { approvedPlanValidationBlockedFeatures } from './approved-plan-validation-policy'
import type {
  ApprovedPlanValidationManifest,
  ApprovedPlanValidationQaSummary,
  ApprovedPlanValidationSupabaseSyncResult,
  ApprovedPlanValidationResult,
  ApprovedPlanRepoOwnershipAudit,
  ApprovedPlanEvidenceContext,
  FeatureGateValidationResult,
  MissingContractInventory,
  OwnershipValidationResult,
  RuntimeBlockValidationResult,
  SystemReconciliationSummary,
  ValidatedHandoffPacket,
} from './approved-plan-validation-types'

export function buildApprovedPlanValidationManifest(input: {
  runId: string
  repoOwnershipAudit: ApprovedPlanRepoOwnershipAudit
  evidenceContext: ApprovedPlanEvidenceContext
  candidateSchemaValidation: ApprovedPlanValidationResult
  blockedPlanValidation: ApprovedPlanValidationResult
  ownershipValidation: OwnershipValidationResult
  runtimeBlockValidation: RuntimeBlockValidationResult
  featureGateValidation: FeatureGateValidationResult
  systemReconciliation: SystemReconciliationSummary
  missingContractInventory: MissingContractInventory
  validatedHandoffs: ValidatedHandoffPacket[]
  qa?: ApprovedPlanValidationQaSummary
  supabaseSyncResult?: ApprovedPlanValidationSupabaseSyncResult
  blockers?: string[]
  warnings?: string[]
}): ApprovedPlanValidationManifest {
  const blockers = Array.from(new Set([
    ...(input.blockers ?? []),
    ...input.repoOwnershipAudit.blockers,
    ...input.evidenceContext.blockers,
    ...input.candidateSchemaValidation.blockers,
    ...input.blockedPlanValidation.blockers,
    ...input.ownershipValidation.blockers,
    ...input.runtimeBlockValidation.blockers,
    ...input.featureGateValidation.blockers,
    ...input.systemReconciliation.blockers,
    ...input.missingContractInventory.blockers,
    ...(input.supabaseSyncResult?.blockers ?? []),
  ]))
  const warnings = Array.from(new Set([
    ...(input.warnings ?? []),
    ...input.repoOwnershipAudit.warnings,
    ...input.evidenceContext.warnings,
    ...input.candidateSchemaValidation.warnings,
    ...input.blockedPlanValidation.warnings,
    ...input.ownershipValidation.warnings,
    ...input.runtimeBlockValidation.warnings,
    ...input.featureGateValidation.warnings,
    ...input.systemReconciliation.warnings,
    ...input.missingContractInventory.warnings,
    ...(input.supabaseSyncResult?.warnings ?? []),
  ]))
  const qaBlocked = input.qa?.status === 'blocked'
  const supabaseStatus = input.supabaseSyncResult?.status ?? 'not_attempted'
  return {
    manifestId: 'phase52e_approved_plan_snapshot_validation_manifest',
    runId: input.runId,
    phase: '52E',
    repoOwnershipAudit: input.repoOwnershipAudit,
    evidenceContextSummary: {
      evidenceSource: input.evidenceContext.evidenceSource,
      candidatePlanCount: input.evidenceContext.candidatePlans.length,
      blockedPlanCount: input.evidenceContext.blockedPlans.length,
      handoffPacketCount: input.evidenceContext.handoffPackets.length,
      phase52DRunId: input.evidenceContext.phase52D.runId,
    },
    validatedCandidatePlanIds: input.evidenceContext.candidatePlans.map((plan) => plan.planId),
    validatedBlockedPlanIds: input.evidenceContext.blockedPlans.map((plan) => plan.planId),
    featureGateValidation: input.featureGateValidation,
    runtimeBlockValidation: input.runtimeBlockValidation,
    ownershipValidation: input.ownershipValidation,
    systemReconciliation: input.systemReconciliation,
    missingContractInventory: input.missingContractInventory,
    validatedHandoffIds: input.validatedHandoffs.map((handoff) => handoff.packetId),
    sourceOfTruthSummary: input.systemReconciliation.sourceOfTruthSummary,
    supabaseMilestoneSyncStatus: supabaseStatus === 'completed' ? 'completed' : supabaseStatus === 'blocked' ? 'blocked' : 'not_attempted',
    blockedFeatures: [...approvedPlanValidationBlockedFeatures],
    warnings,
    blockers,
    phase52FReadiness: supabaseStatus === 'completed' && !blockers.length && !qaBlocked
      ? 'ready_for_system_readiness_reconciliation_controlled_internal_test_planning'
      : 'blocked',
  }
}
