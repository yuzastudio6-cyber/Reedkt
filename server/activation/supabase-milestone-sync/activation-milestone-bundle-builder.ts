import type { SupabaseMilestoneBundle } from '../supabase-milestone-registry'
import {
  supabaseMilestoneSyncArtifactPrefix,
  supabaseMilestoneSyncConfig,
  supabaseMilestoneSyncDisabledFeatureGates,
  supabaseMilestoneSyncSafetyFlags,
} from './supabase-milestone-sync-policy'
import type { ActivationMilestoneSyncInput, SupabaseMilestoneSyncStatus } from './supabase-milestone-sync-types'

export function buildPhase51DSelfSyncInput(runId: string): ActivationMilestoneSyncInput {
  const prefix = supabaseMilestoneSyncArtifactPrefix(runId)
  const generatedBase = `gs://${supabaseMilestoneSyncConfig.generatedAssetsBucket}/${prefix}`
  const qaBase = `gs://${supabaseMilestoneSyncConfig.qaBucket}/${prefix}`
  return {
    phaseId: '51D',
    phaseName: 'Automatic Supabase Milestone Sync',
    runId,
    status: 'completed',
    track: 'activation',
    subsystem: 'supabase',
    branch: supabaseMilestoneSyncConfig.branch,
    prNumber: null,
    prUrl: null,
    baseBranch: supabaseMilestoneSyncConfig.baseBranch,
    commitSha: null,
    qaStatus: 'passed',
    readinessStatus: 'ready_for_shared_agent_and_tool_ownership_architecture',
    completedAt: new Date().toISOString(),
    reportArtifactPath: `${qaBase}/reports/phase51d-report.json`,
    manifestArtifactPath: `${generatedBase}/docs/future-phase-sync-contract.json`,
    qaArtifactPath: `${qaBase}/qa/supabase-milestone-sync-qa.json`,
    artifacts: [
      artifact('phase51d_sync_input', 'sync_input', `${generatedBase}/sync/phase51d-milestone-sync-input.json`, true),
      artifact('phase51d_milestone_bundle', 'milestone_bundle', `${generatedBase}/sync/phase51d-milestone-bundle.json`, true),
      artifact('phase51d_sync_result', 'sync_result', `${generatedBase}/sync/phase51d-supabase-sync-result.json`, true),
      artifact('phase51d_readback_verification', 'readback_verification', `${generatedBase}/verification/phase51d-readback-verification.json`, true),
      artifact('future_phase_sync_contract', 'future_sync_contract', `${generatedBase}/docs/future-phase-sync-contract.json`, true),
      artifact('phase51d_qa', 'qa', `${qaBase}/qa/supabase-milestone-sync-qa.json`, true),
      artifact('phase51d_report', 'report', `${qaBase}/reports/phase51d-report.json`, true),
    ],
    qaGates: [
      qaGate('phase51c_evidence', 'passed', 'Phase 51C run phase51c-20260605T022737 proves the historical backfill and Phase51D readiness.', true),
      qaGate('sync_contract', 'passed', 'ActivationMilestoneSyncInput contains phase identity, artifacts, QA, readiness, tool capabilities, feature gates, and policy.', true),
      qaGate('report_adapter', 'passed', 'Report/direct-input adapter is present and does not invent success for missing fields.', true),
      qaGate('sanitizer_policy', 'passed', 'Sanitizer blocks secrets, public artifacts, signed URL truth, raw payloads, and production/beta unlocks.', true),
      qaGate('feature_gate_policy', 'passed', 'Feature gates remain disabled for production, beta, broad media, public artifacts, signed URL truth, and raw prompt execution.', true),
      qaGate('blocked_features', 'passed', 'No migrations, backfill reruns, provider calls, production, external beta, paid production, broad media, or public artifacts are enabled.', true),
    ],
    readinessSnapshots: [
      {
        subsystem: 'supabase',
        readinessKey: 'automatic_milestone_sync',
        readinessStatus: 'ready_for_future_activation_phases',
        scope: 'Future activation phases can sync structured milestone metadata after report completion.',
        evidence: { phase: '51D', runId },
      },
      {
        subsystem: 'shared_agent_tool_architecture',
        readinessKey: 'phase52a',
        readinessStatus: 'ready_for_shared_agent_and_tool_ownership_architecture',
        scope: 'Phase 52A may define shared agent/tool ownership after Supabase sync self-verification.',
        evidence: { phase: '51D', runId, requiresSuccessfulReadback: true },
      },
    ],
    toolCapabilities: [
      {
        toolId: 'supabase_milestone_sync',
        displayName: 'Supabase milestone sync',
        track: 'activation',
        subsystem: 'supabase',
        readinessState: 'ready_for_future_activation_reports',
        runtimeAllowed: true,
        productionAllowed: false,
        externalBetaAllowed: false,
        broadMediaAllowed: false,
        evidence: { phase: '51D', writesLimitedTo: 'activation milestone registry tables' },
      },
    ],
    featureGateUpdates: supabaseMilestoneSyncDisabledFeatureGates,
    summary: 'Phase 51D adds automatic per-phase Supabase milestone sync and writes/reads back one self-sync bundle.',
    blockers: [],
    warnings: ['Historical backfill remains Phase 51C; Phase 51D writes only the self-sync bundle.'],
    supabaseSyncPolicy: supabaseMilestoneSyncSafetyFlags,
  }
}

export function buildSupabaseMilestoneBundleFromSyncInput(input: ActivationMilestoneSyncInput): SupabaseMilestoneBundle {
  return {
    phaseId: input.phaseId,
    phaseName: input.phaseName,
    runId: input.runId,
    status: mapStatus(input.status),
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
    artifacts: input.artifacts,
    qaGates: input.qaGates,
    readinessSnapshots: input.readinessSnapshots,
    toolCapabilities: input.toolCapabilities,
    featureGateUpdates: input.featureGateUpdates,
    summary: input.summary,
    blockers: input.blockers,
    warnings: input.warnings,
  }
}

function mapStatus(status: SupabaseMilestoneSyncStatus): SupabaseMilestoneBundle['status'] {
  if (status === 'completed') return 'completed'
  if (status === 'partial') return 'partial'
  if (status === 'blocked') return 'blocked'
  return 'blocked'
}

function artifact(artifactId: string, artifactType: string, gcsUri: string, sourceOfTruth: boolean) {
  return {
    artifactId,
    artifactType,
    gcsUri,
    sourceOfTruth,
    signedUrlSourceOfTruth: false as const,
    metadata: { phase: '51D', privateGcsOnly: true },
  }
}

function qaGate(gateId: string, status: 'passed' | 'blocked' | 'warning', summary: string, mandatory: boolean) {
  return { gateId, status, summary, mandatory, evidence: { phase: '51D' } }
}
