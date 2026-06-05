import type { SupabaseClient } from '@supabase/supabase-js'
import {
  readActivationRun,
  type SupabaseFeatureGateInput,
  type SupabaseMilestoneBundle,
  type SupabaseMilestoneWriteVerification,
  type SupabaseRegistrySchemaVerification,
} from '../supabase-milestone-registry'
import type { ActivationMilestoneSyncInput } from '../supabase-milestone-sync'
import { buildSupabaseMilestoneBundleFromSyncInput } from '../supabase-milestone-sync'
import { multiAgentDryRunArtifactPrefix, multiAgentDryRunConfig, multiAgentDryRunSafetyFlags } from './multi-agent-dry-run-policy'
import type { MultiAgentDryRunQaSummary, MultiAgentDryRunSupabaseSyncResult } from './multi-agent-dry-run-types'

export const multiAgentDryRunDisabledFeatureGates: SupabaseFeatureGateInput[] = [
  featureGate('production_ready', 'Production readiness'),
  featureGate('external_beta_ready', 'External beta readiness'),
  featureGate('paid_production_ready', 'Paid production readiness'),
  featureGate('broad_media_ready', 'Broad media readiness'),
  featureGate('public_artifacts', 'Public artifacts'),
  featureGate('signed_url_source_of_truth', 'Signed URL source of truth'),
  featureGate('raw_prompt_execution', 'Raw prompt execution'),
  featureGate('direct_agent_tool_execution', 'Direct agent-to-tool execution'),
  featureGate('tool_runtime_execution', 'Tool/runtime execution'),
  featureGate('provider_execution', 'Provider execution'),
]

export function buildPhase52CSupabaseSyncInput(runId: string, qa: MultiAgentDryRunQaSummary): ActivationMilestoneSyncInput {
  const prefix = multiAgentDryRunArtifactPrefix(runId)
  const generatedBase = `gs://${multiAgentDryRunConfig.generatedAssetsBucket}/${prefix}`
  const qaBase = `gs://${multiAgentDryRunConfig.qaBucket}/${prefix}`
  const status = qa.status === 'passed' ? 'completed' : 'blocked'
  return {
    phaseId: '52C',
    phaseName: 'Multi-Agent Dry-Run On Existing Evidence',
    runId,
    status,
    track: 'activation',
    subsystem: 'shared_agent_multi_agent_dry_run',
    branch: multiAgentDryRunConfig.branch,
    prNumber: null,
    prUrl: null,
    baseBranch: multiAgentDryRunConfig.baseBranch,
    commitSha: null,
    qaStatus: qa.status === 'passed' ? 'passed' : 'blocked',
    readinessStatus: qa.status === 'passed' ? 'ready_for_agent_to_tool_plan_bridge_on_existing_evidence' : 'blocked',
    completedAt: new Date().toISOString(),
    reportArtifactPath: `${qaBase}/reports/phase52c-report.json`,
    manifestArtifactPath: `${generatedBase}/manifest/multi-agent-dry-run-manifest.json`,
    qaArtifactPath: `${qaBase}/qa/multi-agent-dry-run-qa.json`,
    artifacts: [
      artifact('phase52c_evidence_context', 'evidence_context', `${generatedBase}/evidence/multi-agent-evidence-context.json`, true),
      artifact('phase52c_scenarios', 'dry_run_scenarios', `${generatedBase}/scenarios/multi-agent-dry-run-scenarios.json`, true),
      artifact('phase52c_agent_findings', 'agent_findings', `${generatedBase}/findings/agent-findings.json`, true),
      artifact('phase52c_edit_intents', 'edit_intent_candidates', `${generatedBase}/intents/edit-intent-candidates.json`, true),
      artifact('phase52c_producer_gate', 'producer_gate_results', `${generatedBase}/gates/producer-gate-results.json`, true),
      artifact('phase52c_qa_safety_gate', 'qa_safety_gate_results', `${generatedBase}/gates/qa-safety-gate-results.json`, true),
      artifact('phase52c_manifest', 'dry_run_manifest', `${generatedBase}/manifest/multi-agent-dry-run-manifest.json`, true),
      artifact('phase52c_sync_input', 'milestone_sync_input', `${generatedBase}/supabase/phase52c-milestone-sync-input.json`, true),
      artifact('phase52c_sync_result', 'milestone_sync_result', `${generatedBase}/supabase/phase52c-milestone-sync-result.json`, true),
      artifact('phase52c_qa', 'qa', `${qaBase}/qa/multi-agent-dry-run-qa.json`, true),
      artifact('phase52c_report', 'report', `${qaBase}/reports/phase52c-report.json`, true),
    ],
    qaGates: qa.gates.map((gate) => ({
      gateId: gate.gateId,
      status: gate.passed ? 'passed' : 'blocked',
      summary: gate.summary,
      mandatory: gate.mandatory,
      evidence: { phase: '52C', runId },
    })),
    readinessSnapshots: [
      {
        subsystem: 'shared_agent_multi_agent_dry_run',
        readinessKey: 'multi_agent_dry_run',
        readinessStatus: qa.status === 'passed' ? 'ready_for_agent_to_tool_plan_bridge_on_existing_evidence' : 'blocked',
        scope: 'Deterministic dry-run on existing Phase 52A/52B evidence only; candidate-plan-only outputs.',
        evidence: { phase: '52C', runId, scenarioCount: 6, requiredIntentCandidates: 11 },
      },
      {
        subsystem: 'shared_agent_tool_architecture',
        readinessKey: 'phase52d',
        readinessStatus: qa.status === 'passed' ? 'ready_for_agent_to_tool_plan_bridge_on_existing_evidence' : 'blocked',
        scope: 'Phase 52D may bridge agent findings/intents to approved tool-plan snapshots on existing evidence.',
        evidence: { phase: '52C', runId, requiresSuccessfulSupabaseReadback: true },
      },
    ],
    toolCapabilities: [
      {
        toolId: 'multi_agent_dry_run',
        displayName: 'Multi-agent dry-run on existing evidence',
        track: 'activation',
        subsystem: 'shared_agent_multi_agent_dry_run',
        readinessState: qa.status === 'passed' ? 'ready_for_agent_to_tool_plan_bridge_on_existing_evidence' : 'blocked',
        runtimeAllowed: false,
        productionAllowed: false,
        externalBetaAllowed: false,
        broadMediaAllowed: false,
        evidence: {
          phase: '52C',
          runId,
          candidatePlanOnly: true,
          toolRuntimeExecutionAllowed: false,
          providerCallAllowed: false,
          publicArtifactAllowed: false,
          rawPromptExecutionAllowed: false,
        },
      },
    ],
    featureGateUpdates: multiAgentDryRunDisabledFeatureGates,
    summary: 'Phase 52C runs a deterministic multi-agent dry-run over existing Phase 52A schemas and Phase 52B capabilities, producing candidate-plan-only findings and intents.',
    blockers: qa.blockers,
    warnings: qa.warnings,
    supabaseSyncPolicy: multiAgentDryRunSafetyFlags,
  }
}

export function buildPhase52CSupabaseMilestoneBundle(input: ActivationMilestoneSyncInput): SupabaseMilestoneBundle {
  return buildSupabaseMilestoneBundleFromSyncInput(input)
}

export async function readbackPhase52CMilestone(input: {
  client: SupabaseClient
  runId: string
  schemaVerification: SupabaseRegistrySchemaVerification
  milestoneWrite: SupabaseMilestoneWriteVerification
  inputValidated: boolean
  bundleValidated: boolean
}): Promise<MultiAgentDryRunSupabaseSyncResult> {
  const blockers: string[] = []
  const warnings: string[] = []
  if (!input.schemaVerification.allTablesPresent) blockers.push(...input.schemaVerification.blockers)
  if (input.milestoneWrite.status !== 'completed') blockers.push(...input.milestoneWrite.blockers)

  let activationRunReadback = false
  if (!blockers.length) {
    try {
      const activationRun = await readActivationRun(input.client, '52C', input.runId)
      activationRunReadback = activationRun?.run_id === input.runId
    } catch (error) {
      blockers.push(sanitizeReadbackError(error instanceof Error ? error.message : String(error)))
    }
  }
  if (!activationRunReadback) blockers.push('Phase 52C activation run readback did not match.')

  return {
    status: blockers.length === 0 ? 'completed' : 'blocked',
    schemaPresent: input.schemaVerification.allTablesPresent,
    inputValidated: input.inputValidated,
    bundleValidated: input.bundleValidated,
    milestoneWrite: input.milestoneWrite,
    activationRunReadback,
    writesLimitedToMilestoneRegistry: true,
    migrationsApplied: false,
    schemaChangesApplied: false,
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }
}

export function buildNotAttemptedPhase52CSyncResult(input: {
  schemaPresent?: boolean
  inputValidated?: boolean
  bundleValidated?: boolean
  blockers?: string[]
  warnings?: string[]
} = {}): MultiAgentDryRunSupabaseSyncResult {
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
    blockers: input.blockers ?? [],
    warnings: input.warnings ?? [],
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
    evidence: { phase: '52C', reason: 'Phase 52C is candidate-plan-only dry-run evidence.' },
  }
}

function artifact(artifactId: string, artifactType: string, gcsUri: string, sourceOfTruth: boolean) {
  return {
    artifactId,
    artifactType,
    gcsUri,
    sourceOfTruth,
    signedUrlSourceOfTruth: false as const,
    metadata: { phase: '52C', privateGcsOnly: true },
  }
}

function sanitizeReadbackError(message: string): string {
  return message
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '<redacted-db-url>')
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/(service_role|apikey|authorization|password|token)[^,\n]*/gi, '<redacted-secret-field>')
    .slice(0, 700)
}
