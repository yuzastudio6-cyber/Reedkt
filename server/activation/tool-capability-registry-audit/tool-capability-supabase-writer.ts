import type { SupabaseClient } from '@supabase/supabase-js'
import {
  readActivationRun,
  type SupabaseFeatureGateInput,
  type SupabaseMilestoneBundle,
  type SupabaseMilestoneWriteVerification,
  type SupabaseRegistrySchemaVerification,
  type SupabaseToolCapabilityInput,
} from '../supabase-milestone-registry'
import type { ActivationMilestoneSyncInput } from '../supabase-milestone-sync'
import { buildSupabaseMilestoneBundleFromSyncInput } from '../supabase-milestone-sync'
import { toolCapabilityRegistryArtifactPrefix, toolCapabilityRegistryConfig, toolCapabilityRegistrySafetyFlags } from './tool-capability-registry-policy'
import { toolCapabilityRecords } from './canonical-tool-capability-records'
import type {
  ToolCapabilityRecord,
  ToolCapabilityRegistryQaSummary,
  ToolCapabilityRegistrySupabaseSyncResult,
} from './tool-capability-registry-types'

export const toolCapabilityRegistryDisabledFeatureGates: SupabaseFeatureGateInput[] = [
  featureGate('production_ready', 'Production readiness'),
  featureGate('external_beta_ready', 'External beta readiness'),
  featureGate('paid_production_ready', 'Paid production readiness'),
  featureGate('broad_media_ready', 'Broad media readiness'),
  featureGate('public_artifacts', 'Public artifacts'),
  featureGate('signed_url_source_of_truth', 'Signed URL source of truth'),
  featureGate('raw_prompt_execution', 'Raw prompt execution'),
  featureGate('unrestricted_provider_execution', 'Unrestricted provider execution'),
  featureGate('direct_agent_tool_execution', 'Direct agent-to-tool execution'),
]

export function buildPhase52BSupabaseSyncInput(runId: string, qa: ToolCapabilityRegistryQaSummary): ActivationMilestoneSyncInput {
  const prefix = toolCapabilityRegistryArtifactPrefix(runId)
  const generatedBase = `gs://${toolCapabilityRegistryConfig.generatedAssetsBucket}/${prefix}`
  const qaBase = `gs://${toolCapabilityRegistryConfig.qaBucket}/${prefix}`
  return {
    phaseId: '52B',
    phaseName: 'Tool Capability Registry Audit',
    runId,
    status: qa.status === 'passed' ? 'completed' : 'blocked',
    track: 'activation',
    subsystem: 'shared_agent_tool_registry',
    branch: toolCapabilityRegistryConfig.branch,
    prNumber: null,
    prUrl: null,
    baseBranch: toolCapabilityRegistryConfig.baseBranch,
    commitSha: null,
    qaStatus: qa.status === 'passed' ? 'passed' : 'blocked',
    readinessStatus: qa.status === 'passed' ? 'ready_for_multi_agent_dry_run_on_existing_evidence' : 'blocked',
    completedAt: new Date().toISOString(),
    reportArtifactPath: `${qaBase}/reports/phase52b-report.json`,
    manifestArtifactPath: `${generatedBase}/registry/tool-capability-registry.json`,
    qaArtifactPath: `${qaBase}/qa/tool-capability-registry-audit-qa.json`,
    artifacts: [
      artifact('phase52b_tool_capability_registry', 'tool_capability_registry', `${generatedBase}/registry/tool-capability-registry.json`, true),
      artifact('phase52b_tool_capability_summary', 'tool_capability_summary', `${generatedBase}/registry/tool-capability-summary.json`, true),
      artifact('phase52b_registry_validation', 'registry_validation', `${generatedBase}/validation/tool-capability-registry-validation.json`, true),
      artifact('phase52b_supabase_tool_capability_write_result', 'supabase_tool_capability_write_result', `${generatedBase}/supabase/phase52b-tool-capability-write-result.json`, true),
      artifact('phase52b_milestone_sync_result', 'milestone_sync_result', `${generatedBase}/supabase/phase52b-milestone-sync-result.json`, true),
      artifact('phase52b_qa', 'qa', `${qaBase}/qa/tool-capability-registry-audit-qa.json`, true),
      artifact('phase52b_report', 'report', `${qaBase}/reports/phase52b-report.json`, true),
    ],
    qaGates: qa.gates.map((gate) => ({
      gateId: gate.gateId,
      status: gate.passed ? 'passed' : 'blocked',
      summary: gate.summary,
      mandatory: gate.mandatory,
      evidence: { phase: '52B', runId },
    })),
    readinessSnapshots: [
      {
        subsystem: 'shared_agent_tool_registry',
        readinessKey: 'tool_capability_registry',
        readinessStatus: qa.status === 'passed' ? 'ready_for_multi_agent_dry_run_on_existing_evidence' : 'blocked',
        scope: 'Canonical cross-track capability registry from Phase 52A ownership architecture.',
        evidence: { phase: '52B', runId, recordCount: toolCapabilityRecords.length },
      },
      {
        subsystem: 'shared_agent_tool_architecture',
        readinessKey: 'phase52c',
        readinessStatus: qa.status === 'passed' ? 'ready_for_multi_agent_dry_run_on_existing_evidence' : 'blocked',
        scope: 'Phase 52C may run a multi-agent dry-run on existing evidence only after registry sync/readback passes.',
        evidence: { phase: '52B', runId, requiresSuccessfulSupabaseReadback: true },
      },
    ],
    toolCapabilities: toolCapabilityRecords.map((item) => toSupabaseToolCapability(item)),
    featureGateUpdates: toolCapabilityRegistryDisabledFeatureGates,
    summary: 'Phase 52B creates the canonical tool capability registry, stores private registry artifacts, and syncs capability metadata through the Supabase milestone registry.',
    blockers: qa.blockers,
    warnings: qa.warnings,
    supabaseSyncPolicy: toolCapabilityRegistrySafetyFlags,
  }
}

export function buildPhase52BSupabaseMilestoneBundle(input: ActivationMilestoneSyncInput): SupabaseMilestoneBundle {
  return buildSupabaseMilestoneBundleFromSyncInput(input)
}

export function toSupabaseToolCapability(item: ToolCapabilityRecord): SupabaseToolCapabilityInput {
  return {
    toolId: item.toolId,
    displayName: item.displayName,
    track: item.track,
    subsystem: item.subsystem,
    readinessState: item.status,
    runtimeAllowed: false,
    productionAllowed: false,
    externalBetaAllowed: false,
    broadMediaAllowed: false,
    evidence: {
      phase: '52B',
      owner: item.owner,
      owningTrack: item.owningTrack,
      internalTestingReady: item.internalTestingReady,
      internalBetaCandidateReady: item.internalBetaCandidateReady,
      productionReady: item.productionReady,
      readinessEvidence: item.readinessEvidence,
      lastValidatedPhase: item.lastValidatedPhase,
      lastValidatedRunId: item.lastValidatedRunId,
      supabaseMilestoneRefs: item.supabaseMilestoneRefs,
      blockerReason: item.blockerReason,
      futureRequiredAction: item.futureRequiredAction,
      runtimeExecutionAllowed: false,
      providerCallAllowed: false,
      publicArtifactAllowed: false,
      signedUrlSourceOfTruthAllowed: false,
      rawPromptExecutionAllowed: false,
    },
  }
}

export async function readbackPhase52BRegistry(input: {
  client: SupabaseClient
  runId: string
  schemaVerification: SupabaseRegistrySchemaVerification
  milestoneWrite: SupabaseMilestoneWriteVerification
  inputValidated: boolean
  bundleValidated: boolean
}): Promise<ToolCapabilityRegistrySupabaseSyncResult> {
  const blockers: string[] = []
  const warnings: string[] = []
  if (!input.schemaVerification.allTablesPresent) blockers.push(...input.schemaVerification.blockers)
  if (input.milestoneWrite.status !== 'completed') blockers.push(...input.milestoneWrite.blockers)

  let activationRunReadback = false
  let toolCapabilityReadbackCount = 0
  let readinessSnapshotReadback = false
  if (!blockers.length) {
    try {
      const activationRun = await readActivationRun(input.client, '52B', input.runId)
      activationRunReadback = activationRun?.run_id === input.runId
      const keys = toolCapabilityRecords.map((item) => `${item.track}:${item.toolId}`)
      const { data: toolRows, error: toolError } = await input.client
        .from('tool_capabilities')
        .select('track,tool_id')
        .in('tool_id', toolCapabilityRecords.map((item) => item.toolId))
      if (toolError) throw toolError
      const found = new Set((toolRows ?? []).map((row: { track: string; tool_id: string }) => `${row.track}:${row.tool_id}`))
      toolCapabilityReadbackCount = keys.filter((key) => found.has(key)).length
      const { data: readiness, error: readinessError } = await input.client
        .from('readiness_snapshots')
        .select('readiness_key,readiness_status')
        .eq('subsystem', 'shared_agent_tool_registry')
        .eq('readiness_key', 'tool_capability_registry')
        .maybeSingle()
      if (readinessError) throw readinessError
      readinessSnapshotReadback = readiness?.readiness_key === 'tool_capability_registry'
    } catch (error) {
      blockers.push(sanitizeReadbackError(error instanceof Error ? error.message : String(error)))
    }
  }

  if (!activationRunReadback) blockers.push('Phase 52B activation run readback did not match.')
  if (toolCapabilityReadbackCount !== toolCapabilityRecords.length) blockers.push(`Tool capability readback expected ${toolCapabilityRecords.length}, got ${toolCapabilityReadbackCount}.`)
  if (!readinessSnapshotReadback) blockers.push('tool_capability_registry readiness snapshot readback did not match.')

  return {
    status: blockers.length === 0 ? 'completed' : 'blocked',
    schemaPresent: input.schemaVerification.allTablesPresent,
    inputValidated: input.inputValidated,
    bundleValidated: input.bundleValidated,
    milestoneWrite: input.milestoneWrite,
    activationRunReadback,
    toolCapabilityReadbackCount,
    toolCapabilityReadbackExpected: toolCapabilityRecords.length,
    readinessSnapshotReadback,
    migrationsApplied: false,
    schemaChangesApplied: false,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }
}

function featureGate(gateKey: string, gateName: string): SupabaseFeatureGateInput {
  return {
    gateKey,
    gateName,
    gateStatus: 'disabled',
    enabled: false,
    productionAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadMediaAllowed: false,
    evidence: { phase: '52B', reason: 'Phase 52B is registry/readiness-only.' },
  }
}

function artifact(artifactId: string, artifactType: string, gcsUri: string, sourceOfTruth: boolean) {
  return {
    artifactId,
    artifactType,
    gcsUri,
    sourceOfTruth,
    signedUrlSourceOfTruth: false as const,
    metadata: { phase: '52B', privateGcsOnly: true },
  }
}

function sanitizeReadbackError(message: string): string {
  return message
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '<redacted-db-url>')
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/(service_role|apikey|authorization|password|token)[^,\n]*/gi, '<redacted-secret-field>')
    .slice(0, 700)
}
