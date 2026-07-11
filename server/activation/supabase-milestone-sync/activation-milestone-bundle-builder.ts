import type {
  SupabaseFeatureGateInput,
  SupabaseMilestoneBundle,
  SupabaseMilestoneRegistryStatus,
} from '../supabase-milestone-registry'
import { defaultActivationLaunchPermissions } from '../activation-launch-permissions'
import { futurePhaseSupabaseSyncPrSummary, supabaseMilestoneSyncDisabledFeatureGates, supabaseMilestoneSyncConfig } from './supabase-milestone-sync-policy'
import type { ActivationMilestoneSyncArtifactInput, ActivationMilestoneSyncInput, ActivationMilestoneSyncStatus } from './supabase-milestone-sync-types'

export function buildActivationMilestoneBundle(input: ActivationMilestoneSyncInput): SupabaseMilestoneBundle {
  return {
    phaseId: input.phaseId,
    phaseName: input.phaseName,
    runId: input.runId,
    status: toRegistryStatus(input.status),
    track: input.track,
    subsystem: input.subsystem,
    branch: input.branch,
    prNumber: input.prNumber,
    prUrl: input.prUrl,
    baseBranch: input.baseBranch,
    commitSha: input.commitSha,
    qaStatus: input.qaStatus,
    readinessStatus: input.readinessStatus,
    completedAt: input.completedAt,
    artifacts: input.artifacts.map(toRegistryArtifact),
    qaGates: input.qaGates,
    readinessSnapshots: input.readinessSnapshots,
    toolCapabilities: input.toolCapabilities,
    featureGateUpdates: input.featureGateUpdates.length ? input.featureGateUpdates : buildDefaultDisabledFeatureGates(input),
    summary: input.summary,
    blockers: input.blockers,
    warnings: input.warnings,
  }
}

export function buildPhase51DSelfSyncInput(input: { runId: string; artifactPrefix: string; completedAt?: string | null }): ActivationMilestoneSyncInput {
  const generated = (artifactId: string, artifactType: string, objectPath: string): ActivationMilestoneSyncArtifactInput => ({
    artifactId,
    artifactType,
    gcsUri: `gs://${supabaseMilestoneSyncConfig.generatedAssetsBucket}/${input.artifactPrefix}/${objectPath}`,
    sourceOfTruth: true,
    signedUrlSourceOfTruth: false,
    metadata: { phase: '51D', runId: input.runId, supabaseStoresBlob: false },
  })
  const qa = (artifactId: string, artifactType: string, objectPath: string): ActivationMilestoneSyncArtifactInput => ({
    artifactId,
    artifactType,
    gcsUri: `gs://${supabaseMilestoneSyncConfig.qaBucket}/${input.artifactPrefix}/${objectPath}`,
    sourceOfTruth: true,
    signedUrlSourceOfTruth: false,
    metadata: { phase: '51D', runId: input.runId, supabaseStoresBlob: false },
  })
  return {
    phaseId: '51D',
    phaseName: 'Automatic Supabase milestone sync',
    runId: input.runId,
    status: 'completed',
    track: 'activation',
    subsystem: 'supabase_milestone_sync',
    branch: 'codex/rp-activation-51d-automatic-supabase-milestone-sync',
    prNumber: null,
    prUrl: null,
    baseBranch: supabaseMilestoneSyncConfig.baseBranch,
    commitSha: null,
    qaStatus: 'passed',
    readinessStatus: 'ready_for_shared_agent_and_tool_ownership_architecture',
    completedAt: input.completedAt ?? new Date().toISOString(),
    reportPath: `gs://${supabaseMilestoneSyncConfig.qaBucket}/${input.artifactPrefix}/reports/phase51d-report.json`,
    manifestPath: `gs://${supabaseMilestoneSyncConfig.generatedAssetsBucket}/${input.artifactPrefix}/docs/future-phase-sync-contract.json`,
    qaPath: `gs://${supabaseMilestoneSyncConfig.qaBucket}/${input.artifactPrefix}/qa/supabase-milestone-sync-qa.json`,
    artifacts: [
      generated('phase51d_milestone_sync_input', 'milestone_sync_input', 'sync/phase51d-milestone-sync-input.json'),
      generated('phase51d_milestone_bundle', 'milestone_bundle', 'sync/phase51d-milestone-bundle.json'),
      generated('phase51d_supabase_sync_result', 'supabase_sync_result', 'sync/phase51d-supabase-sync-result.json'),
      generated('phase51d_readback_verification', 'readback_verification', 'verification/phase51d-readback-verification.json'),
      generated('future_phase_sync_contract', 'future_phase_sync_contract', 'docs/future-phase-sync-contract.json'),
      qa('supabase_milestone_sync_qa', 'qa_summary', 'qa/supabase-milestone-sync-qa.json'),
      qa('phase51d_report', 'phase_report', 'reports/phase51d-report.json'),
    ],
    qaGates: [
      { gateId: 'phase51c_evidence', status: 'passed', summary: 'Phase 51C completed and records Phase51D readiness.', mandatory: true, evidence: { phase51C: 'phase51c-20260605T022737' } },
      { gateId: 'sync_contract_defined', status: 'passed', summary: 'Canonical ActivationMilestoneSyncInput contract is defined.', mandatory: true },
      { gateId: 'report_adapter', status: 'passed', summary: 'Report/direct input adapter maps activation reports to Phase 51B milestone bundles.', mandatory: true },
      { gateId: 'sanitizer_policy', status: 'passed', summary: 'Sanitizer rejects secrets, public artifact truth, signed URL truth, raw provider data, and feature unlocks.', mandatory: true },
      { gateId: 'idempotent_sync', status: 'passed', summary: 'Phase 51D uses the Phase 51B idempotent writer path.', mandatory: true },
      { gateId: 'feature_gate_policy', status: 'passed', summary: 'Feature gates remain disabled for production, beta, broad media, public artifacts, raw prompt execution, and signed URL truth.', mandatory: true },
      { gateId: 'future_phase_contract', status: 'passed', summary: 'Future phase PR/report sync status template is defined.', mandatory: true, evidence: { template: futurePhaseSupabaseSyncPrSummary } },
      { gateId: 'blocked_features', status: 'passed', summary: 'No migrations, historical backfill, providers, production, beta, broad media, public artifacts, or schema/RLS changes are allowed.', mandatory: true },
    ],
    readinessSnapshots: [
      {
        subsystem: 'supabase',
        readinessKey: 'automatic_per_phase_milestone_sync',
        readinessStatus: 'ready_for_shared_agent_and_tool_ownership_architecture',
        scope: 'future_activation_phase_milestone_sync_only',
        evidence: { phase51C: 'phase51c-20260605T022737', phase51D: input.runId },
      },
    ],
    toolCapabilities: [
      {
        toolId: 'supabase_milestone_sync',
        displayName: 'Supabase Milestone Sync Adapter',
        track: 'activation',
        subsystem: 'supabase',
        readinessState: 'ready_for_future_activation_phase_sync',
        runtimeAllowed: true,
        productionAllowed: false,
        externalBetaAllowed: defaultActivationLaunchPermissions.externalBetaAllowed,
        broadMediaAllowed: false,
        evidence: { phase51D: input.runId, registryTablesOnly: true },
      },
    ],
    featureGateUpdates: [],
    summary: 'Phase 51D makes Supabase milestone sync the standard future activation-phase reporting path while GCS remains the private artifact store.',
    blockers: [],
    warnings: ['Phase 51D self-sync writes only to the Phase 51B milestone registry tables.'],
    supabaseSyncPolicy: {
      mode: supabaseMilestoneSyncConfig.mode,
      registryTablesOnly: true,
      privateGcsArtifactReferencesOnly: true,
      supabaseStoresBlobs: false,
      futurePhasePrSummaryTemplate: futurePhaseSupabaseSyncPrSummary,
    },
  }
}

export function buildDefaultDisabledFeatureGates(input: Pick<ActivationMilestoneSyncInput, 'phaseId' | 'runId'>): SupabaseFeatureGateInput[] {
  return supabaseMilestoneSyncDisabledFeatureGates.map((gateKey) => ({
    gateKey,
    gateName: gateKey.split('_').map((part) => part[0].toUpperCase() + part.slice(1)).join(' '),
    gateStatus: 'disabled',
    enabled: false,
    productionAllowed: defaultActivationLaunchPermissions.productionReadyAllowed,
    externalBetaAllowed: defaultActivationLaunchPermissions.externalBetaAllowed,
    paidProductionAllowed: defaultActivationLaunchPermissions.paidProductionAllowed,
    broadMediaAllowed: false,
    evidence: { phaseId: input.phaseId, runId: input.runId, disabledBy: 'phase51d_supabase_milestone_sync_policy' },
  }))
}

function toRegistryStatus(status: ActivationMilestoneSyncStatus): SupabaseMilestoneRegistryStatus {
  if (status === 'completed') return 'completed'
  if (status === 'blocked') return 'blocked'
  return 'partial'
}

function toRegistryArtifact(artifact: ActivationMilestoneSyncArtifactInput) {
  return {
    artifactId: artifact.artifactId,
    artifactType: artifact.artifactType,
    gcsUri: artifact.gcsUri,
    sourceOfTruth: artifact.sourceOfTruth,
    signedUrlSourceOfTruth: artifact.signedUrlSourceOfTruth,
    metadata: artifact.metadata,
  }
}
