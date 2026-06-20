import {
  readActivationRun,
  type SupabaseFeatureGateInput,
  type SupabaseMilestoneBundle,
  type SupabaseMilestoneWriteVerification,
} from '../supabase-milestone-registry'
import { buildSupabaseMilestoneBundleFromSyncInput, type ActivationMilestoneSyncInput } from '../supabase-milestone-sync'
import {
  providerModelsAuditArtifactPrefix,
  providerModelsAuditConfig,
  providerModelsAuditDisabledFeatureGates,
  providerModelsAuditSafetyFlags,
} from './provider-gateway-models-audit-policy'
import type {
  ProviderModelsAuditQaSummary,
  ProviderModelsAuditSupabaseReadbackInput,
  ProviderModelsAuditSupabaseSyncResult,
} from './provider-gateway-models-audit-types'

export function buildProvider0SupabaseSyncInput(runId: string, qa: ProviderModelsAuditQaSummary): ActivationMilestoneSyncInput {
  const prefix = providerModelsAuditArtifactPrefix(runId)
  const generatedBase = `gs://${providerModelsAuditConfig.generatedAssetsBucket}/${prefix}`
  const qaBase = `gs://${providerModelsAuditConfig.qaBucket}/${prefix}`
  const completed = qa.status === 'passed'
  return {
    phaseId: 'PROVIDER-0',
    phaseName: 'Provider Gateway Models Repo Audit',
    runId,
    status: completed ? 'completed' : 'blocked',
    track: 'activation',
    subsystem: 'provider_gateway_models',
    branch: providerModelsAuditConfig.branch,
    prNumber: null,
    prUrl: null,
    baseBranch: providerModelsAuditConfig.baseBranch,
    commitSha: null,
    qaStatus: completed ? 'passed' : 'blocked',
    readinessStatus: completed ? 'ready_for_provider_registry_secret_metadata_fixture' : 'blocked',
    completedAt: new Date().toISOString(),
    reportArtifactPath: `${qaBase}/reports/provider0-report.json`,
    manifestArtifactPath: `${generatedBase}/manifest/provider-gateway-models-audit-manifest.json`,
    qaArtifactPath: `${qaBase}/qa/provider-gateway-models-audit-qa.json`,
    artifacts: [
      artifact('provider0_repo_audit', 'repo_audit', `${generatedBase}/audit/provider-gateway-repo-audit.json`),
      artifact('provider0_official_evidence', 'official_provider_evidence', `${generatedBase}/evidence/provider-model-official-evidence.json`),
      artifact('provider0_model_decisions', 'model_decisions', `${generatedBase}/decisions/provider-model-decisions.json`),
      artifact('provider0_data_policy', 'data_policy', `${generatedBase}/policy/provider-data-policy.json`),
      artifact('provider0_cost_policy', 'cost_policy', `${generatedBase}/policy/provider-cost-policy.json`),
      artifact('provider0_secret_policy', 'provider_secret_policy', `${generatedBase}/policy/provider-secret-policy.json`),
      artifact('provider0_phase_roadmap', 'phase_roadmap', `${generatedBase}/roadmap/provider-phase-roadmap.json`),
      artifact('provider0_answers', 'question_answers', `${generatedBase}/answers/provider0-questions-answers.json`),
      artifact('provider0_manifest', 'audit_manifest', `${generatedBase}/manifest/provider-gateway-models-audit-manifest.json`),
      artifact('provider0_sync_input', 'milestone_sync_input', `${generatedBase}/supabase/provider0-milestone-sync-input.json`),
      artifact('provider0_sync_result', 'milestone_sync_result', `${generatedBase}/supabase/provider0-milestone-sync-result.json`),
      artifact('provider0_qa', 'qa', `${qaBase}/qa/provider-gateway-models-audit-qa.json`),
      artifact('provider0_report', 'report', `${qaBase}/reports/provider0-report.json`),
    ],
    qaGates: qa.gates.map((qaGate) => ({
      gateId: qaGate.gateId,
      status: qaGate.passed ? 'passed' : 'blocked',
      summary: qaGate.summary,
      mandatory: qaGate.mandatory,
      evidence: { phase: 'PROVIDER-0', runId },
    })),
    readinessSnapshots: [
      {
        subsystem: 'provider_gateway_models',
        readinessKey: 'provider1',
        readinessStatus: completed ? 'ready_for_provider_registry_secret_metadata_fixture' : 'blocked',
        scope: 'PROVIDER-1 may add provider registry and secret metadata fixtures only; real provider calls remain blocked.',
        evidence: { phase: 'PROVIDER-0', runId, noProviderCalls: true },
      },
    ],
    toolCapabilities: [
      {
        toolId: 'provider_gateway_models_audit',
        displayName: 'Provider Gateway Models Repo Audit',
        track: 'activation',
        subsystem: 'provider_gateway_models',
        readinessState: completed ? 'ready_for_provider_registry_secret_metadata_fixture' : 'blocked',
        runtimeAllowed: false,
        productionAllowed: false,
        externalBetaAllowed: false,
        broadMediaAllowed: false,
        evidence: { phase: 'PROVIDER-0', runId, providerCallsAllowed: false },
      },
    ],
    featureGateUpdates: providerModelsAuditDisabledFeatureGates.map((gateKey) => gate(String(gateKey))),
    summary: 'PROVIDER-0 audits DeepSeek/Qwen model names, provider gateway contracts, secret/data/cost policy, and safe next phases without provider calls.',
    blockers: qa.blockers,
    warnings: qa.warnings,
    supabaseSyncPolicy: providerModelsAuditSafetyFlags,
  }
}

export function buildProvider0SupabaseMilestoneBundle(input: ActivationMilestoneSyncInput): SupabaseMilestoneBundle {
  return buildSupabaseMilestoneBundleFromSyncInput(input)
}

export async function readbackProvider0Milestone(input: ProviderModelsAuditSupabaseReadbackInput): Promise<ProviderModelsAuditSupabaseSyncResult> {
  const blockers: string[] = []
  if (!input.schemaVerification.allTablesPresent) blockers.push(...input.schemaVerification.blockers)
  if (input.milestoneWrite.status !== 'completed') blockers.push(...input.milestoneWrite.blockers)
  let activationRunReadback = false
  if (!blockers.length) {
    try {
      const activationRun = await readActivationRun(input.client, 'PROVIDER-0', input.runId)
      activationRunReadback = activationRun?.run_id === input.runId
    } catch (error) {
      blockers.push(sanitizeReadbackError(error instanceof Error ? error.message : String(error)))
    }
  }
  if (!activationRunReadback) blockers.push('PROVIDER-0 activation run readback did not match.')
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

export function buildNotAttemptedProvider0SyncResult(input: {
  schemaPresent?: boolean
  inputValidated?: boolean
  bundleValidated?: boolean
  blockers?: string[]
  warnings?: string[]
} = {}): ProviderModelsAuditSupabaseSyncResult {
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
    evidence: { phase: 'PROVIDER-0', reason: 'PROVIDER-0 is a repo-audit/report-only provider gateway model phase.' },
  }
}

function artifact(artifactId: string, artifactType: string, gcsUri: string) {
  return {
    artifactId,
    artifactType,
    gcsUri,
    sourceOfTruth: true,
    signedUrlSourceOfTruth: false as const,
    metadata: { phase: 'PROVIDER-0', privateGcsOnly: true },
  }
}

function sanitizeReadbackError(message: string): string {
  return message
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/(service_role|apikey|authorization|password|token)[^,\n]*/gi, '<redacted-secret-field>')
    .slice(0, 500)
}
