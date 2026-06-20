import {
  readActivationRun,
  type SupabaseFeatureGateInput,
  type SupabaseMilestoneBundle,
  type SupabaseMilestoneWriteVerification,
} from '../supabase-milestone-registry'
import { buildSupabaseMilestoneBundleFromSyncInput, type ActivationMilestoneSyncInput } from '../supabase-milestone-sync'
import {
  runtimeUnlockArtifactPrefix,
  runtimeUnlockConfig,
  runtimeUnlockDisabledFeatureGates,
  runtimeUnlockSafetyFlags,
} from './runtime-unlock-roadmap-policy'
import type { RuntimeUnlockQaSummary, RuntimeUnlockSupabaseReadbackInput, RuntimeUnlockSupabaseSyncResult } from './runtime-unlock-roadmap-types'

export function buildPhase53ASupabaseSyncInput(runId: string, qa: RuntimeUnlockQaSummary): ActivationMilestoneSyncInput {
  const prefix = runtimeUnlockArtifactPrefix(runId)
  const generatedBase = `gs://${runtimeUnlockConfig.generatedAssetsBucket}/${prefix}`
  const qaBase = `gs://${runtimeUnlockConfig.qaBucket}/${prefix}`
  const completed = qa.status === 'passed'
  return {
    phaseId: '53A',
    phaseName: 'Runtime Unlock Roadmap Owner Acceptance Audit',
    runId,
    status: completed ? 'completed' : 'blocked',
    track: 'activation',
    subsystem: 'shared_runtime_unlock',
    branch: runtimeUnlockConfig.branch,
    prNumber: null,
    prUrl: null,
    baseBranch: runtimeUnlockConfig.baseBranch,
    commitSha: null,
    qaStatus: completed ? 'passed' : 'blocked',
    readinessStatus: completed ? 'ready_for_owner_acceptance_intake_or_pause_pending_owner_repo_audits' : 'blocked',
    completedAt: new Date().toISOString(),
    reportArtifactPath: `${qaBase}/reports/phase53a-report.json`,
    manifestArtifactPath: `${generatedBase}/manifest/runtime-unlock-roadmap-manifest.json`,
    qaArtifactPath: `${qaBase}/qa/runtime-unlock-roadmap-qa.json`,
    artifacts: [
      artifact('phase53a_repo_ownership_audit', 'repo_ownership_audit', `${generatedBase}/audit/repo-ownership-audit.json`),
      artifact('phase53a_runtime_unlock_roadmap', 'runtime_unlock_roadmap', `${generatedBase}/roadmap/runtime-unlock-roadmap.json`),
      artifact('phase53a_owner_acceptance_matrix', 'owner_acceptance_matrix', `${generatedBase}/matrix/owner-acceptance-matrix.json`),
      artifact('phase53a_blocked_scope_policy', 'blocked_scope_policy', `${generatedBase}/policy/blocked-scope-policy.json`),
      artifact('phase53a_runtime_unlock_ladder', 'runtime_unlock_ladder', `${generatedBase}/ladder/runtime-unlock-ladder.json`),
      artifact('phase53a_owner_repo_audit_prompts', 'owner_repo_audit_prompts', `${generatedBase}/prompts/owner-repo-audit-prompts.json`),
      artifact('phase53a_runtime_unlock_risk_register', 'runtime_unlock_risk_register', `${generatedBase}/exposure/runtime-unlock-exposure-register.json`),
      artifact('phase53a_manifest', 'runtime_unlock_manifest', `${generatedBase}/manifest/runtime-unlock-roadmap-manifest.json`),
      artifact('phase53a_sync_input', 'milestone_sync_input', `${generatedBase}/supabase/phase53a-milestone-sync-input.json`),
      artifact('phase53a_sync_result', 'milestone_sync_result', `${generatedBase}/supabase/phase53a-milestone-sync-result.json`),
      artifact('phase53a_qa', 'qa', `${qaBase}/qa/runtime-unlock-roadmap-qa.json`),
      artifact('phase53a_report', 'report', `${qaBase}/reports/phase53a-report.json`),
    ],
    qaGates: qa.gates.map((qaGate) => ({
      gateId: qaGate.gateId,
      status: qaGate.passed ? 'passed' : 'blocked',
      summary: qaGate.summary,
      mandatory: qaGate.mandatory,
      evidence: { phase: '53A', runId },
    })),
    readinessSnapshots: [
      {
        subsystem: 'runtime_unlock_roadmap',
        readinessKey: 'phase53b',
        readinessStatus: completed ? 'ready_for_owner_acceptance_intake_or_pause_pending_owner_repo_audits' : 'blocked',
        scope: 'Phase 53B may intake owner acceptance responses or pause pending owner repo audits; runtime remains blocked.',
        evidence: { phase: '53A', runId, noRuntimeExecution: true },
      },
    ],
    toolCapabilities: [
      {
        toolId: 'runtime_unlock_roadmap',
        displayName: 'Runtime unlock roadmap and owner acceptance audit',
        track: 'activation',
        subsystem: 'shared_runtime_unlock',
        readinessState: completed ? 'ready_for_owner_acceptance_intake_or_pause_pending_owner_repo_audits' : 'blocked',
        runtimeAllowed: false,
        productionAllowed: false,
        externalBetaAllowed: false,
        broadMediaAllowed: false,
        evidence: { phase: '53A', runId, runtimeExecutionAllowed: false },
      },
    ],
    featureGateUpdates: runtimeUnlockDisabledFeatureGates.map((gateKey) => gate(String(gateKey))),
    summary: 'Phase 53A creates the runtime unlock roadmap, owner acceptance matrix, blocked-scope policy, and repo-audit prompts without runtime execution.',
    blockers: qa.blockers,
    warnings: qa.warnings,
    supabaseSyncPolicy: runtimeUnlockSafetyFlags,
  }
}

export function buildPhase53ASupabaseMilestoneBundle(input: ActivationMilestoneSyncInput): SupabaseMilestoneBundle {
  return buildSupabaseMilestoneBundleFromSyncInput(input)
}

export async function readbackPhase53AMilestone(input: RuntimeUnlockSupabaseReadbackInput): Promise<RuntimeUnlockSupabaseSyncResult> {
  const blockers: string[] = []
  if (!input.schemaVerification.allTablesPresent) blockers.push(...input.schemaVerification.blockers)
  if (input.milestoneWrite.status !== 'completed') blockers.push(...input.milestoneWrite.blockers)
  let activationRunReadback = false
  if (!blockers.length) {
    try {
      const activationRun = await readActivationRun(input.client, '53A', input.runId)
      activationRunReadback = activationRun?.run_id === input.runId
    } catch (error) {
      blockers.push(sanitizeReadbackError(error instanceof Error ? error.message : String(error)))
    }
  }
  if (!activationRunReadback) blockers.push('Phase 53A activation run readback did not match.')
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
    unrelatedSupabaseRowsWritten: false,
    blockers: Array.from(new Set(blockers)),
    warnings: [],
  }
}

export function buildNotAttemptedPhase53ASyncResult(input: {
  schemaPresent?: boolean
  inputValidated?: boolean
  bundleValidated?: boolean
  blockers?: string[]
  warnings?: string[]
} = {}): RuntimeUnlockSupabaseSyncResult {
  return {
    status: 'not_attempted',
    schemaPresent: input.schemaPresent ?? false,
    inputValidated: input.inputValidated ?? false,
    bundleValidated: input.bundleValidated ?? false,
    milestoneWrite: notAttemptedWrite(input),
    activationRunReadback: false,
    writesLimitedToMilestoneRegistry: true,
    migrationsApplied: false,
    schemaChangesApplied: false,
    historicalBackfillRerun: false,
    unrelatedSupabaseRowsWritten: false,
    blockers: input.blockers ?? [],
    warnings: input.warnings ?? [],
  }
}

function notAttemptedWrite(input: { schemaPresent?: boolean; bundleValidated?: boolean; blockers?: string[]; warnings?: string[] }): SupabaseMilestoneWriteVerification {
  return {
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
    evidence: { phase: '53A', reason: 'Phase 53A is runtime unlock roadmap and owner acceptance audit only.' },
  }
}

function artifact(artifactId: string, artifactType: string, gcsUri: string) {
  return {
    artifactId,
    artifactType,
    gcsUri,
    sourceOfTruth: true,
    signedUrlSourceOfTruth: false as const,
    metadata: { phase: '53A', privateGcsOnly: true },
  }
}

function sanitizeReadbackError(message: string): string {
  return message
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/(service_role|apikey|authorization|password|token)[^,\n]*/gi, '<redacted-secret-field>')
    .slice(0, 500)
}
