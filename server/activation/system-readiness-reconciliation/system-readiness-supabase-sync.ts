import type { SupabaseClient } from '@supabase/supabase-js'
import {
  readActivationRun,
  type SupabaseFeatureGateInput,
  type SupabaseMilestoneBundle,
  type SupabaseMilestoneWriteVerification,
  type SupabaseRegistrySchemaVerification,
} from '../supabase-milestone-registry'
import { buildSupabaseMilestoneBundleFromSyncInput, type ActivationMilestoneSyncInput } from '../supabase-milestone-sync'
import { systemReadinessArtifactPrefix, systemReadinessConfig, systemReadinessSafetyFlags } from './system-readiness-reconciliation-policy'
import { systemReadinessDisabledFeatureGates } from './system-readiness-reconciliation-policy'
import type { SystemReadinessQaSummary, SystemReadinessSupabaseSyncResult } from './system-readiness-reconciliation-types'

export function buildPhase52FSupabaseSyncInput(runId: string, qa: SystemReadinessQaSummary): ActivationMilestoneSyncInput {
  const prefix = systemReadinessArtifactPrefix(runId)
  const generatedBase = `gs://${systemReadinessConfig.generatedAssetsBucket}/${prefix}`
  const qaBase = `gs://${systemReadinessConfig.qaBucket}/${prefix}`
  const completed = qa.status === 'passed'
  return {
    phaseId: '52F',
    phaseName: 'System Readiness Reconciliation And Controlled Internal Test Plan',
    runId,
    status: completed ? 'completed' : 'blocked',
    track: 'activation',
    subsystem: 'shared_system_readiness',
    branch: systemReadinessConfig.branch,
    prNumber: null,
    prUrl: null,
    baseBranch: systemReadinessConfig.baseBranch,
    commitSha: null,
    qaStatus: completed ? 'passed' : 'blocked',
    readinessStatus: completed ? 'ready_for_controlled_internal_test_go_no_go_packet_or_owner_handoff_dispatch' : 'blocked',
    completedAt: new Date().toISOString(),
    reportArtifactPath: `${qaBase}/reports/phase52f-report.json`,
    manifestArtifactPath: `${generatedBase}/manifest/system-readiness-reconciliation-manifest.json`,
    qaArtifactPath: `${qaBase}/qa/system-readiness-reconciliation-qa.json`,
    artifacts: [
      artifact('phase52f_repo_ownership_audit', 'repo_ownership_audit', `${generatedBase}/audit/repo-ownership-audit.json`),
      artifact('phase52f_evidence_context', 'system_readiness_evidence_context', `${generatedBase}/evidence/system-readiness-evidence-context.json`),
      artifact('phase52f_workstream_readiness', 'workstream_readiness_reconciliation', `${generatedBase}/readiness/workstream-readiness-reconciliation.json`),
      artifact('phase52f_controlled_test_plan', 'controlled_internal_test_plan', `${generatedBase}/plan/controlled-internal-test-plan.json`),
      artifact('phase52f_blocker_inventory', 'system_blocker_inventory', `${generatedBase}/blockers/system-blocker-inventory.json`),
      artifact('phase52f_feature_gates', 'feature_gate_reconciliation', `${generatedBase}/gates/feature-gate-reconciliation.json`),
      artifact('phase52f_exposure_register', 'system_exposure_register', `${generatedBase}/risks/system-exposure-register.json`),
      artifact('phase52f_handoffs', 'owner_handoff_packets', `${generatedBase}/handoff/system-readiness-handoff-packets.json`),
      artifact('phase52f_manifest', 'system_readiness_manifest', `${generatedBase}/manifest/system-readiness-reconciliation-manifest.json`),
      artifact('phase52f_sync_input', 'milestone_sync_input', `${generatedBase}/supabase/phase52f-milestone-sync-input.json`),
      artifact('phase52f_sync_result', 'milestone_sync_result', `${generatedBase}/supabase/phase52f-milestone-sync-result.json`),
      artifact('phase52f_qa', 'qa', `${qaBase}/qa/system-readiness-reconciliation-qa.json`),
      artifact('phase52f_report', 'report', `${qaBase}/reports/phase52f-report.json`),
    ],
    qaGates: qa.gates.map((qaGate) => ({
      gateId: qaGate.gateId,
      status: qaGate.passed ? 'passed' : 'blocked',
      summary: qaGate.summary,
      mandatory: qaGate.mandatory,
      evidence: { phase: '52F', runId },
    })),
    readinessSnapshots: [
      {
        subsystem: 'shared_system_readiness',
        readinessKey: 'system_readiness_reconciliation',
        readinessStatus: completed ? 'ready_for_controlled_internal_test_go_no_go_packet_or_owner_handoff_dispatch' : 'blocked',
        scope: 'Existing-evidence-only system readiness reconciliation and controlled internal test planning.',
        evidence: { phase: '52F', runId, noRuntimeExecution: true },
      },
      {
        subsystem: 'controlled_internal_test_planning',
        readinessKey: 'phase52g',
        readinessStatus: completed ? 'ready_for_controlled_internal_test_go_no_go_packet_or_owner_handoff_dispatch' : 'blocked',
        scope: 'Phase 52G may prepare go/no-go owner dispatch only; not runtime execution.',
        evidence: { phase: '52F', runId, requiresSuccessfulSupabaseReadback: true },
      },
    ],
    toolCapabilities: [
      {
        toolId: 'system_readiness_reconciliation',
        displayName: 'System readiness reconciliation',
        track: 'activation',
        subsystem: 'shared_system_readiness',
        readinessState: completed ? 'ready_for_controlled_internal_test_go_no_go_packet_or_owner_handoff_dispatch' : 'blocked',
        runtimeAllowed: false,
        productionAllowed: false,
        externalBetaAllowed: false,
        broadMediaAllowed: false,
        evidence: { phase: '52F', runId, planningOnly: true, workerExecutionAllowed: false },
      },
    ],
    featureGateUpdates: systemReadinessDisabledFeatureGates.map((gateKey) => gate(String(gateKey))),
    summary: 'Phase 52F reconciles system readiness and controlled internal test planning across workstreams without runtime execution.',
    blockers: qa.blockers,
    warnings: qa.warnings,
    supabaseSyncPolicy: systemReadinessSafetyFlags,
  }
}

export function buildPhase52FSupabaseMilestoneBundle(input: ActivationMilestoneSyncInput): SupabaseMilestoneBundle {
  return buildSupabaseMilestoneBundleFromSyncInput(input)
}

export async function readbackPhase52FMilestone(input: {
  client: SupabaseClient
  runId: string
  schemaVerification: SupabaseRegistrySchemaVerification
  milestoneWrite: SupabaseMilestoneWriteVerification
  inputValidated: boolean
  bundleValidated: boolean
}): Promise<SystemReadinessSupabaseSyncResult> {
  const blockers: string[] = []
  if (!input.schemaVerification.allTablesPresent) blockers.push(...input.schemaVerification.blockers)
  if (input.milestoneWrite.status !== 'completed') blockers.push(...input.milestoneWrite.blockers)
  let activationRunReadback = false
  if (!blockers.length) {
    try {
      const activationRun = await readActivationRun(input.client, '52F', input.runId)
      activationRunReadback = activationRun?.run_id === input.runId
    } catch (error) {
      blockers.push(sanitizeReadbackError(error instanceof Error ? error.message : String(error)))
    }
  }
  if (!activationRunReadback) blockers.push('Phase 52F activation run readback did not match.')
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
    warnings: [],
  }
}

export function buildNotAttemptedPhase52FSyncResult(input: {
  schemaPresent?: boolean
  inputValidated?: boolean
  bundleValidated?: boolean
  blockers?: string[]
  warnings?: string[]
} = {}): SystemReadinessSupabaseSyncResult {
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
    evidence: { phase: '52F', reason: 'Phase 52F is reconciliation/planning metadata only.' },
  }
}

function artifact(artifactId: string, artifactType: string, gcsUri: string) {
  return {
    artifactId,
    artifactType,
    gcsUri,
    sourceOfTruth: true,
    signedUrlSourceOfTruth: false as const,
    metadata: { phase: '52F', privateGcsOnly: true },
  }
}

function sanitizeReadbackError(message: string): string {
  return message
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/(service_role|apikey|authorization|password|token)[^,\n]*/gi, '<redacted-secret-field>')
    .slice(0, 500)
}
