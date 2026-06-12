import {
  readActivationRun,
  type SupabaseFeatureGateInput,
  type SupabaseMilestoneBundle,
  type SupabaseMilestoneWriteVerification,
} from '../supabase-milestone-registry'
import { buildSupabaseMilestoneBundleFromSyncInput, type ActivationMilestoneSyncInput } from '../supabase-milestone-sync'
import {
  providerModelApprovalArtifactPrefix,
  providerModelApprovalConfig,
  providerModelApprovalDisabledFeatureGates,
  providerModelApprovalSafetyFlags,
} from './provider-model-approval-policy'
import type {
  ProviderModelApprovalQaSummary,
  ProviderModelApprovalSupabaseReadbackInput,
  ProviderModelApprovalSupabaseSyncResult,
} from './provider-model-approval-types'

export function buildProvider1SupabaseSyncInput(runId: string, qa: ProviderModelApprovalQaSummary): ActivationMilestoneSyncInput {
  const prefix = providerModelApprovalArtifactPrefix(runId)
  const generatedBase = `gs://${providerModelApprovalConfig.generatedAssetsBucket}/${prefix}`
  const qaBase = `gs://${providerModelApprovalConfig.qaBucket}/${prefix}`
  const completed = qa.status === 'passed'
  return {
    phaseId: 'PROVIDER-1',
    phaseName: 'DeepSeek Qwen API Approval Policy',
    runId,
    status: completed ? 'completed' : 'blocked',
    track: 'activation',
    subsystem: 'provider_gateway_models',
    branch: providerModelApprovalConfig.branch,
    prNumber: null,
    prUrl: null,
    baseBranch: providerModelApprovalConfig.baseBranch,
    commitSha: null,
    qaStatus: completed ? 'passed' : 'blocked',
    readinessStatus: completed ? 'ready_for_provider_fixture_adapters_normalizers' : 'blocked',
    completedAt: new Date().toISOString(),
    reportArtifactPath: `${qaBase}/reports/provider1-report.json`,
    manifestArtifactPath: `${generatedBase}/manifest/provider-model-approval-manifest.json`,
    qaArtifactPath: `${qaBase}/qa/provider-model-approval-policy-qa.json`,
    artifacts: [
      artifact('provider1_repo_ownership_audit', 'repo_ownership_audit', `${generatedBase}/audit/repo-ownership-audit.json`),
      artifact('provider1_deepseek_evidence', 'deepseek_approval_evidence', `${generatedBase}/evidence/deepseek-v4-approval-evidence.json`),
      artifact('provider1_qwen_evidence', 'qwen_approval_evidence', `${generatedBase}/evidence/qwen37-max-approval-evidence.json`),
      artifact('provider1_secret_policy', 'provider_secret_policy', `${generatedBase}/policy/provider-secret-policy.json`),
      artifact('provider1_data_policy', 'provider_data_policy', `${generatedBase}/policy/provider-data-policy.json`),
      artifact('provider1_cost_policy', 'provider_cost_policy', `${generatedBase}/policy/provider-cost-policy.json`),
      artifact('provider1_routing_policy', 'provider_routing_policy', `${generatedBase}/policy/provider-routing-policy.json`),
      artifact('provider1_storage_policy', 'provider_storage_policy', `${generatedBase}/policy/provider-storage-policy.json`),
      artifact('provider1_risk_register', 'provider_risk_register', `${generatedBase}/risks/provider-issue-register.json`),
      artifact('provider1_next_phase_plan', 'provider_next_phase_plan', `${generatedBase}/roadmap/provider-next-phase-plan.json`),
      artifact('provider1_manifest', 'approval_manifest', `${generatedBase}/manifest/provider-model-approval-manifest.json`),
      artifact('provider1_sync_input', 'milestone_sync_input', `${generatedBase}/supabase/provider1-milestone-sync-input.json`),
      artifact('provider1_sync_result', 'milestone_sync_result', `${generatedBase}/supabase/provider1-milestone-sync-result.json`),
      artifact('provider1_qa', 'qa', `${qaBase}/qa/provider-model-approval-policy-qa.json`),
      artifact('provider1_report', 'report', `${qaBase}/reports/provider1-report.json`),
    ],
    qaGates: qa.gates.map((qaGate) => ({
      gateId: qaGate.gateId,
      status: qaGate.passed ? 'passed' : 'blocked',
      summary: qaGate.summary,
      mandatory: qaGate.mandatory,
      evidence: { phase: 'PROVIDER-1', runId },
    })),
    readinessSnapshots: [
      {
        subsystem: 'provider_gateway_models',
        readinessKey: 'provider2',
        readinessStatus: completed ? 'ready_for_provider_fixture_adapters_normalizers' : 'blocked',
        scope: 'PROVIDER-2 may add fixture adapters and normalizers only; real provider calls remain blocked.',
        evidence: { phase: 'PROVIDER-1', runId, noProviderCalls: true },
      },
    ],
    toolCapabilities: [
      {
        toolId: 'provider_model_approval_policy',
        displayName: 'Provider model approval policy',
        track: 'activation',
        subsystem: 'provider_gateway_models',
        readinessState: completed ? 'ready_for_provider_fixture_adapters_normalizers' : 'blocked',
        runtimeAllowed: false,
        productionAllowed: false,
        externalBetaAllowed: false,
        broadMediaAllowed: false,
        evidence: { phase: 'PROVIDER-1', runId, providerCallsAllowed: false },
      },
    ],
    featureGateUpdates: providerModelApprovalDisabledFeatureGates.map((gateKey) => gate(String(gateKey))),
    summary: 'PROVIDER-1 approves DeepSeek/Qwen Provider Gateway policy, secret references, data, cost, routing, storage, and next fixture phases without provider calls.',
    blockers: qa.blockers,
    warnings: qa.warnings,
    supabaseSyncPolicy: providerModelApprovalSafetyFlags,
  }
}

export function buildProvider1SupabaseMilestoneBundle(input: ActivationMilestoneSyncInput): SupabaseMilestoneBundle {
  return buildSupabaseMilestoneBundleFromSyncInput(input)
}

export async function readbackProvider1Milestone(input: ProviderModelApprovalSupabaseReadbackInput): Promise<ProviderModelApprovalSupabaseSyncResult> {
  const blockers: string[] = []
  if (!input.schemaVerification.allTablesPresent) blockers.push(...input.schemaVerification.blockers)
  if (input.milestoneWrite.status !== 'completed') blockers.push(...input.milestoneWrite.blockers)
  let activationRunReadback = false
  if (!blockers.length) {
    try {
      const activationRun = await readActivationRun(input.client, 'PROVIDER-1', input.runId)
      activationRunReadback = activationRun?.run_id === input.runId
    } catch (error) {
      blockers.push(sanitizeReadbackError(error instanceof Error ? error.message : String(error)))
    }
  }
  if (!activationRunReadback) blockers.push('PROVIDER-1 activation run readback did not match.')
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

export function buildNotAttemptedProvider1SyncResult(input: {
  schemaPresent?: boolean
  inputValidated?: boolean
  bundleValidated?: boolean
  blockers?: string[]
  warnings?: string[]
} = {}): ProviderModelApprovalSupabaseSyncResult {
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
    evidence: { phase: 'PROVIDER-1', reason: 'PROVIDER-1 is a policy-only provider model approval phase.' },
  }
}

function artifact(artifactId: string, artifactType: string, gcsUri: string) {
  return {
    artifactId,
    artifactType,
    gcsUri,
    sourceOfTruth: true,
    signedUrlSourceOfTruth: false as const,
    metadata: { phase: 'PROVIDER-1', privateGcsOnly: true },
  }
}

function sanitizeReadbackError(message: string): string {
  return message
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/(service_role|apikey|authorization|password|token)[^,\n]*/gi, '<redacted-secret-field>')
    .slice(0, 500)
}
