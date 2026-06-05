import type { SupabaseClient } from '@supabase/supabase-js'
import {
  readActivationRun,
  type SupabaseFeatureGateInput,
  type SupabaseMilestoneBundle,
  type SupabaseMilestoneWriteVerification,
  type SupabaseRegistrySchemaVerification,
} from '../supabase-milestone-registry'
import { buildSupabaseMilestoneBundleFromSyncInput, type ActivationMilestoneSyncInput } from '../supabase-milestone-sync'
import { approvedPlanValidationArtifactPrefix, approvedPlanValidationConfig, approvedPlanValidationSafetyFlags } from './approved-plan-validation-policy'
import { phase52EDisabledFeatureGates } from './approved-plan-feature-gate-validator'
import type { ApprovedPlanValidationQaSummary, ApprovedPlanValidationSupabaseSyncResult } from './approved-plan-validation-types'

export function buildPhase52ESupabaseSyncInput(runId: string, qa: ApprovedPlanValidationQaSummary): ActivationMilestoneSyncInput {
  const prefix = approvedPlanValidationArtifactPrefix(runId)
  const generatedBase = `gs://${approvedPlanValidationConfig.generatedAssetsBucket}/${prefix}`
  const qaBase = `gs://${approvedPlanValidationConfig.qaBucket}/${prefix}`
  const completed = qa.status === 'passed'
  return {
    phaseId: '52E',
    phaseName: 'Approved-Plan Snapshot Validation And System Reconciliation',
    runId,
    status: completed ? 'completed' : 'blocked',
    track: 'activation',
    subsystem: 'shared_agent_approved_plan_validation',
    branch: approvedPlanValidationConfig.branch,
    prNumber: null,
    prUrl: null,
    baseBranch: approvedPlanValidationConfig.baseBranch,
    commitSha: null,
    qaStatus: completed ? 'passed' : 'blocked',
    readinessStatus: completed ? 'ready_for_system_readiness_reconciliation_controlled_internal_test_planning' : 'blocked',
    completedAt: new Date().toISOString(),
    reportArtifactPath: `${qaBase}/reports/phase52e-report.json`,
    manifestArtifactPath: `${generatedBase}/manifest/approved-plan-snapshot-validation-manifest.json`,
    qaArtifactPath: `${qaBase}/qa/approved-plan-snapshot-validation-qa.json`,
    artifacts: [
      artifact('phase52e_repo_ownership_audit', 'repo_ownership_audit', `${generatedBase}/audit/repo-ownership-audit.json`),
      artifact('phase52e_evidence_context', 'approved_plan_validation_evidence_context', `${generatedBase}/evidence/approved-plan-validation-evidence-context.json`),
      artifact('phase52e_schema_validation', 'approved_plan_schema_validation', `${generatedBase}/validation/approved-plan-schema-validation.json`),
      artifact('phase52e_ownership_validation', 'ownership_validation', `${generatedBase}/validation/ownership-validation.json`),
      artifact('phase52e_runtime_block_validation', 'runtime_block_validation', `${generatedBase}/validation/runtime-block-validation.json`),
      artifact('phase52e_feature_gate_validation', 'feature_gate_validation', `${generatedBase}/validation/feature-gate-validation.json`),
      artifact('phase52e_system_reconciliation', 'system_reconciliation', `${generatedBase}/reconciliation/system-reconciliation-summary.json`),
      artifact('phase52e_missing_contracts', 'missing_contract_inventory', `${generatedBase}/reconciliation/missing-contract-inventory.json`),
      artifact('phase52e_validated_handoffs', 'validated_handoff_packets', `${generatedBase}/handoff/validated-handoff-packets.json`),
      artifact('phase52e_manifest', 'approved_plan_validation_manifest', `${generatedBase}/manifest/approved-plan-snapshot-validation-manifest.json`),
      artifact('phase52e_sync_input', 'milestone_sync_input', `${generatedBase}/supabase/phase52e-milestone-sync-input.json`),
      artifact('phase52e_sync_result', 'milestone_sync_result', `${generatedBase}/supabase/phase52e-milestone-sync-result.json`),
      artifact('phase52e_qa', 'qa', `${qaBase}/qa/approved-plan-snapshot-validation-qa.json`),
      artifact('phase52e_report', 'report', `${qaBase}/reports/phase52e-report.json`),
    ],
    qaGates: qa.gates.map((qaGate) => ({
      gateId: qaGate.gateId,
      status: qaGate.passed ? 'passed' : 'blocked',
      summary: qaGate.summary,
      mandatory: qaGate.mandatory,
      evidence: { phase: '52E', runId },
    })),
    readinessSnapshots: [
      {
        subsystem: 'shared_agent_approved_plan_validation',
        readinessKey: 'approved_plan_snapshot_validation',
        readinessStatus: completed ? 'ready_for_system_readiness_reconciliation_controlled_internal_test_planning' : 'blocked',
        scope: 'Existing-evidence-only validation of Phase 52D candidate approved-plan snapshots; no runtime execution.',
        evidence: { phase: '52E', runId, candidatePlansValidated: 7, blockedPlansValidated: 4 },
      },
      {
        subsystem: 'system_readiness_reconciliation',
        readinessKey: 'phase52f',
        readinessStatus: completed ? 'ready_for_system_readiness_reconciliation_controlled_internal_test_planning' : 'blocked',
        scope: 'Phase 52F may reconcile controlled internal test planning only; production/beta/runtime remains blocked.',
        evidence: { phase: '52E', runId, requiresSuccessfulSupabaseReadback: true },
      },
    ],
    toolCapabilities: [
      {
        toolId: 'approved_plan_snapshot_validation',
        displayName: 'Approved-plan snapshot validation',
        track: 'activation',
        subsystem: 'shared_agent_approved_plan_validation',
        readinessState: completed ? 'ready_for_system_readiness_reconciliation_controlled_internal_test_planning' : 'blocked',
        runtimeAllowed: false,
        productionAllowed: false,
        externalBetaAllowed: false,
        broadMediaAllowed: false,
        evidence: { phase: '52E', runId, candidatePlanValidationOnly: true, workerExecutionAllowed: false },
      },
    ],
    featureGateUpdates: phase52EDisabledFeatureGates.map((gateKey) => gate(gateKey)),
    summary: 'Phase 52E validates Phase 52D candidate approved-plan snapshots and reconciles system ownership boundaries without runtime execution.',
    blockers: qa.blockers,
    warnings: qa.warnings,
    supabaseSyncPolicy: approvedPlanValidationSafetyFlags,
  }
}

export function buildPhase52ESupabaseMilestoneBundle(input: ActivationMilestoneSyncInput): SupabaseMilestoneBundle {
  return buildSupabaseMilestoneBundleFromSyncInput(input)
}

export async function readbackPhase52EMilestone(input: {
  client: SupabaseClient
  runId: string
  schemaVerification: SupabaseRegistrySchemaVerification
  milestoneWrite: SupabaseMilestoneWriteVerification
  inputValidated: boolean
  bundleValidated: boolean
}): Promise<ApprovedPlanValidationSupabaseSyncResult> {
  const blockers: string[] = []
  const warnings: string[] = []
  if (!input.schemaVerification.allTablesPresent) blockers.push(...input.schemaVerification.blockers)
  if (input.milestoneWrite.status !== 'completed') blockers.push(...input.milestoneWrite.blockers)
  let activationRunReadback = false
  if (!blockers.length) {
    try {
      const activationRun = await readActivationRun(input.client, '52E', input.runId)
      activationRunReadback = activationRun?.run_id === input.runId
    } catch (error) {
      blockers.push(sanitizeReadbackError(error instanceof Error ? error.message : String(error)))
    }
  }
  if (!activationRunReadback) blockers.push('Phase 52E activation run readback did not match.')
  return {
    status: blockers.length ? 'blocked' : 'completed',
    schemaPresent: input.schemaVerification.allTablesPresent,
    inputValidated: input.inputValidated,
    bundleValidated: input.bundleValidated,
    milestoneWrite: input.milestoneWrite,
    activationRunReadback,
    writesLimitedToMilestoneRegistry: true,
    migrationsApplied: false,
    schemaChangesApplied: false,
    historicalBackfillRerun: false,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }
}

export function buildNotAttemptedPhase52ESyncResult(input: {
  schemaPresent?: boolean
  inputValidated?: boolean
  bundleValidated?: boolean
  blockers?: string[]
  warnings?: string[]
} = {}): ApprovedPlanValidationSupabaseSyncResult {
  return {
    status: 'not_attempted',
    schemaPresent: input.schemaPresent ?? false,
    inputValidated: input.inputValidated ?? false,
    bundleValidated: input.bundleValidated ?? false,
    milestoneWrite: {
      status: 'not_attempted',
      schemaPresent: input.schemaPresent ?? false,
      migrationApplied: false,
      bundleValidated: input.bundleValidated ?? false,
      activationRunWritten: false,
      artifactRowsWritten: 0,
      qaGateRowsWritten: 0,
      readinessRowsWritten: 0,
      toolCapabilityRowsWritten: 0,
      featureGateRowsWritten: 0,
      readbackMatched: false,
      publicArtifactRejected: true,
      signedUrlRejected: true,
      secretLookingValueRejected: true,
      blockers: input.blockers ?? [],
      warnings: input.warnings ?? [],
    },
    activationRunReadback: false,
    writesLimitedToMilestoneRegistry: true,
    migrationsApplied: false,
    schemaChangesApplied: false,
    historicalBackfillRerun: false,
    blockers: input.blockers ?? [],
    warnings: input.warnings ?? [],
  }
}

function gate(gateKey: string): SupabaseFeatureGateInput {
  return {
    gateKey,
    gateName: gateKey.replace(/_/g, ' '),
    gateStatus: 'disabled',
    enabled: false,
    productionAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadMediaAllowed: false,
    evidence: { phase: '52E', reason: 'Phase 52E is validation/reconciliation metadata only.' },
  }
}

function artifact(artifactId: string, artifactType: string, gcsUri: string) {
  return {
    artifactId,
    artifactType,
    gcsUri,
    sourceOfTruth: true,
    signedUrlSourceOfTruth: false as const,
    metadata: { phase: '52E', privateGcsOnly: true },
  }
}

function sanitizeReadbackError(message: string): string {
  return message
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/(service_role|apikey|authorization|password|token)[^,\n]*/gi, '<redacted-secret-field>')
    .slice(0, 500)
}
