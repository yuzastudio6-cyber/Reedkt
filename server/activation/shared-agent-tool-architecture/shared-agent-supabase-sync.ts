import type { SupabaseFeatureGateInput } from '../supabase-milestone-registry'
import {
  buildSupabaseMilestoneBundleFromSyncInput,
  type ActivationMilestoneSyncInput,
  type SupabaseMilestoneSyncPolicy,
} from '../supabase-milestone-sync'
import {
  sharedAgentToolArchitectureArtifactPrefix,
  sharedAgentToolArchitectureConfig,
} from './shared-agent-tool-architecture-policy'
import type { SharedAgentToolArchitectureQaSummary } from './shared-agent-tool-architecture-types'

export const sharedAgentToolArchitectureSupabaseSyncPolicy: SupabaseMilestoneSyncPolicy = {
  writesAllowed: true,
  migrationsAllowed: false,
  historicalBackfillAllowed: false,
  productRowWritesAllowed: false,
  providerCallsAllowed: false,
  frontendServiceRoleExposureAllowed: false,
  publicArtifactAllowed: false,
  signedUrlSourceOfTruthAllowed: false,
  rawPromptExecutionAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  paidProductionAllowed: false,
  broadMediaAllowed: false,
}

export function buildPhase52ASupabaseSyncInput(runId: string, qa: SharedAgentToolArchitectureQaSummary): ActivationMilestoneSyncInput {
  const prefix = sharedAgentToolArchitectureArtifactPrefix(runId)
  const generatedBase = `gs://${sharedAgentToolArchitectureConfig.generatedAssetsBucket}/${prefix}`
  const qaBase = `gs://${sharedAgentToolArchitectureConfig.qaBucket}/${prefix}`
  return {
    phaseId: '52A',
    phaseName: 'Shared Agent Tool Ownership Architecture',
    runId,
    status: qa.status === 'passed' ? 'completed' : 'blocked',
    track: 'activation',
    subsystem: 'shared_agent_tool_architecture',
    branch: sharedAgentToolArchitectureConfig.branch,
    prNumber: 171,
    prUrl: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/171',
    baseBranch: sharedAgentToolArchitectureConfig.baseBranch,
    commitSha: null,
    qaStatus: qa.status === 'passed' ? 'passed' : 'blocked',
    readinessStatus: qa.status === 'passed' ? 'ready_for_tool_capability_registry_audit' : 'blocked',
    completedAt: qa.status === 'passed' ? new Date().toISOString() : null,
    reportArtifactPath: `${qaBase}/reports/phase52a-report.json`,
    manifestArtifactPath: `${generatedBase}/manifest/shared-agent-tool-architecture-manifest.json`,
    qaArtifactPath: `${qaBase}/qa/shared-agent-tool-architecture-qa.json`,
    artifacts: [
      artifact('phase52a_agent_roles', 'agent_role_registry', `${generatedBase}/architecture/agent-role-registry.json`, true),
      artifact('phase52a_tool_ownership', 'tool_ownership_map', `${generatedBase}/architecture/tool-ownership-map.json`, true),
      artifact('phase52a_capability_schema', 'capability_manifest_schema', `${generatedBase}/schemas/tool-capability-manifest-schema.json`, true),
      artifact('phase52a_agent_finding_schema', 'agent_finding_schema', `${generatedBase}/schemas/agent-finding-schema.json`, true),
      artifact('phase52a_edit_intent_schema', 'edit_intent_schema', `${generatedBase}/schemas/edit-intent-schema.json`, true),
      artifact('phase52a_approved_snapshot_schema', 'approved_plan_snapshot_schema', `${generatedBase}/schemas/approved-plan-snapshot-schema.json`, true),
      artifact('phase52a_routing_policy', 'routing_policy', `${generatedBase}/policy/agent-tool-routing-policy.json`, true),
      artifact('phase52a_source_of_truth_policy', 'source_of_truth_policy', `${generatedBase}/policy/source-of-truth-policy.json`, true),
      artifact('phase52a_handoff_template', 'cross_track_handoff_template', `${generatedBase}/handoff/cross-track-handoff-template.json`, true),
      artifact('phase52a_manifest', 'architecture_manifest', `${generatedBase}/manifest/shared-agent-tool-architecture-manifest.json`, true),
      artifact('phase52a_sync_input', 'supabase_sync_input', `${generatedBase}/supabase/phase52a-milestone-sync-input.json`, true),
      artifact('phase52a_sync_result', 'supabase_sync_result', `${generatedBase}/supabase/phase52a-milestone-sync-result.json`, true),
      artifact('phase52a_qa', 'qa', `${qaBase}/qa/shared-agent-tool-architecture-qa.json`, true),
      artifact('phase52a_report', 'report', `${qaBase}/reports/phase52a-report.json`, true),
    ],
    qaGates: qa.gates.map((gate) => ({
      gateId: gate.gateId,
      status: gate.passed ? 'passed' : 'blocked',
      summary: gate.summary,
      mandatory: true,
      evidence: { phase: '52A', runId },
    })),
    readinessSnapshots: [
      {
        subsystem: 'shared_agent_tool_architecture',
        readinessKey: 'phase52a',
        readinessStatus: qa.status === 'passed' ? 'completed' : 'blocked',
        scope: 'Shared specialist agent roles, schemas, routing, source-of-truth policy, and ownership map.',
        evidence: { phase: '52A', runId, dependsOn: sharedAgentToolArchitectureConfig.canonicalPhase51DRunId },
      },
      {
        subsystem: 'tool_capability_registry',
        readinessKey: 'phase52b',
        readinessStatus: qa.status === 'passed' ? 'ready_for_tool_capability_registry_audit' : 'blocked',
        scope: 'Phase 52B may audit tool capability registry after shared architecture and Supabase sync pass.',
        evidence: { phase: '52A', runId, requiresSupabaseReadback: true },
      },
    ],
    toolCapabilities: [
      capability('shared_agent_tool_architecture', 'Shared agent/tool architecture', 'ready_for_tool_capability_registry_audit', runId),
      capability('approved_plan_snapshot_contract', 'Approved plan snapshot contract', 'architecture_schema_defined', runId),
      capability('tool_ownership_map', 'Tool ownership map', 'architecture_schema_defined', runId),
    ],
    featureGateUpdates: sharedAgentToolArchitectureDisabledFeatureGates,
    summary: 'Phase 52A defines the shared agent/tool ownership architecture and syncs one milestone record through the Phase 51D path.',
    blockers: qa.blockers,
    warnings: qa.warnings,
    supabaseSyncPolicy: sharedAgentToolArchitectureSupabaseSyncPolicy,
  }
}

export function buildPhase52ASupabaseMilestoneBundle(input: ActivationMilestoneSyncInput) {
  return buildSupabaseMilestoneBundleFromSyncInput(input)
}

export const sharedAgentToolArchitectureDisabledFeatureGates: SupabaseFeatureGateInput[] = [
  disabledGate('production_delivery', 'Production delivery'),
  disabledGate('external_beta', 'External beta'),
  disabledGate('paid_production', 'Paid production'),
  disabledGate('broad_real_media', 'Broad real media'),
  disabledGate('public_artifacts', 'Public artifacts'),
  disabledGate('signed_url_source_of_truth', 'Signed URL source of truth'),
  disabledGate('raw_prompt_execution', 'Raw prompt execution'),
  disabledGate('direct_agent_tool_execution', 'Direct agent-to-tool execution'),
]

function artifact(artifactId: string, artifactType: string, gcsUri: string, sourceOfTruth: boolean) {
  return {
    artifactId,
    artifactType,
    gcsUri,
    sourceOfTruth,
    signedUrlSourceOfTruth: false as const,
    metadata: { phase: '52A', privateGcsOnly: true },
  }
}

function capability(toolId: string, displayName: string, readinessState: string, runId: string) {
  return {
    toolId,
    displayName,
    track: 'activation',
    subsystem: 'shared_agent_tool_architecture',
    readinessState,
    runtimeAllowed: false,
    productionAllowed: false as const,
    externalBetaAllowed: false as const,
    broadMediaAllowed: false as const,
    evidence: { phase: '52A', runId },
  }
}

function disabledGate(gateKey: string, gateName: string): SupabaseFeatureGateInput {
  return {
    gateKey,
    gateName,
    gateStatus: 'blocked',
    enabled: false,
    productionAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadMediaAllowed: false,
    evidence: { phase: '52A', reason: 'Phase 52A is architecture and milestone sync only.' },
  }
}
