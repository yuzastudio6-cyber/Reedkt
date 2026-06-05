import { approvedPlanValidationRequiredDocs, approvedPlanValidationRequiredScripts, approvedPlanValidationSafetyFlags } from './approved-plan-validation-policy'
import type {
  ApprovedPlanEvidenceContext,
  ApprovedPlanRepoOwnershipAudit,
  ApprovedPlanValidationManifest,
  ApprovedPlanValidationQaGate,
  ApprovedPlanValidationQaSummary,
  ApprovedPlanValidationResult,
  ApprovedPlanValidationSupabaseSyncResult,
  FeatureGateValidationResult,
  MissingContractInventory,
  OwnershipValidationResult,
  RuntimeBlockValidationResult,
  SystemReconciliationSummary,
  ValidatedHandoffPacket,
} from './approved-plan-validation-types'

export function buildApprovedPlanValidationQaSummary(input: {
  packageScripts: Record<string, string>
  docsPresent: Record<string, boolean>
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
  manifest: ApprovedPlanValidationManifest
  supabaseSyncResult?: ApprovedPlanValidationSupabaseSyncResult
  executionMode: boolean
}): ApprovedPlanValidationQaSummary {
  const scriptsPresent = approvedPlanValidationRequiredScripts.every((script) => Boolean(input.packageScripts[script]))
  const docsPresent = approvedPlanValidationRequiredDocs.every((doc) => input.docsPresent[doc] !== false)
  const gates: ApprovedPlanValidationQaGate[] = [
    gate('source_of_truth_repo_audit', input.repoOwnershipAudit.implementationAllowed && !input.repoOwnershipAudit.duplicateValidationDetected, input.repoOwnershipAudit.blockers[0] ?? 'Repo ownership and source-of-truth audit completed.'),
    gate('phase52d_evidence', input.evidenceContext.phase52D.runId === 'phase52d-20260605T164423' && input.evidenceContext.candidatePlans.length === 7 && input.evidenceContext.blockedPlans.length === 4, 'Canonical Phase 52D evidence is present with seven candidate plans and four blocked/handoff records.'),
    gate('candidate_plan_schema_validation', input.candidateSchemaValidation.status === 'passed', input.candidateSchemaValidation.blockers[0] ?? 'Candidate approved-plan snapshot schemas passed.'),
    gate('blocked_plan_validation', input.blockedPlanValidation.status === 'passed', input.blockedPlanValidation.blockers[0] ?? 'Blocked/handoff records remain blocked or handoff-only.'),
    gate('ownership_validation', input.ownershipValidation.status === 'passed', input.ownershipValidation.blockers[0] ?? 'Every plan routes to the expected owner.'),
    gate('runtime_block_validation', input.runtimeBlockValidation.status === 'passed', input.runtimeBlockValidation.blockers[0] ?? 'Runtime, worker, model, provider, search, browser, and map execution remain blocked.'),
    gate('feature_gate_validation', input.featureGateValidation.status === 'passed', input.featureGateValidation.blockers[0] ?? 'Production, beta, public artifact, signed URL, and raw prompt gates remain disabled.'),
    gate('system_reconciliation', input.systemReconciliation.blockers.length === 0, input.systemReconciliation.blockers[0] ?? 'System reconciliation completed with handoff boundaries preserved.'),
    gate('missing_contract_inventory', input.missingContractInventory.blockers.length === 0, input.missingContractInventory.blockers[0] ?? 'Missing source-of-truth contracts are inventoried without blocking Phase 52E.'),
    gate('validated_handoffs', input.validatedHandoffs.length >= 8 && input.validatedHandoffs.every((handoff) => handoff.validationResult === 'validated' || handoff.packetId === 'missing-contracts-handoff'), 'Validated handoff packets were generated for all required owners and missing contracts.'),
    gate('source_of_truth_policy', input.manifest.sourceOfTruthSummary.length >= 4, 'Source-of-truth policy summary is preserved in the manifest.'),
    gate('supabase_milestone_sync', input.executionMode ? input.supabaseSyncResult?.status === 'completed' : true, input.executionMode ? input.supabaseSyncResult?.blockers[0] ?? 'Phase 52E Supabase milestone sync completed.' : 'Static mode records Supabase sync as execution-only.'),
    gate(
      'blocked_features',
      scriptsPresent &&
        docsPresent &&
        !approvedPlanValidationSafetyFlags.toolRuntimeAllowed &&
        !approvedPlanValidationSafetyFlags.workerExecutionAllowed &&
        !approvedPlanValidationSafetyFlags.modelInferenceAllowed &&
        !approvedPlanValidationSafetyFlags.providerCallsAllowed &&
        !approvedPlanValidationSafetyFlags.webSearchAllowed &&
        !approvedPlanValidationSafetyFlags.mapRenderingAllowed &&
        !approvedPlanValidationSafetyFlags.productionReadyAllowed &&
        !approvedPlanValidationSafetyFlags.externalBetaAllowed &&
        !approvedPlanValidationSafetyFlags.broadMediaAllowed,
      'Package scripts/docs are present and runtime/provider/model/search/map/production/beta/broad-media paths remain blocked.',
    ),
  ]
  const blockers = gates.filter((item) => item.mandatory && !item.passed).map((item) => `${item.gateId}: ${item.summary}`)
  return {
    status: blockers.length ? 'blocked' : 'passed',
    gates,
    blockers,
    warnings: input.executionMode ? input.repoOwnershipAudit.warnings : ['Supabase readback and artifact upload are verified only during confirmed execution.', ...input.repoOwnershipAudit.warnings],
  }
}

function gate(gateId: ApprovedPlanValidationQaGate['gateId'], passed: boolean | undefined, summary: string): ApprovedPlanValidationQaGate {
  return { gateId, passed: Boolean(passed), mandatory: true, summary }
}
