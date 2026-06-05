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
import { agentToolPlanBridgeArtifactPrefix, agentToolPlanBridgeConfig, agentToolPlanBridgeSafetyFlags } from './agent-tool-plan-bridge-policy'
import type { AgentToolPlanBridgeQaSummary, AgentToolPlanBridgeSupabaseSyncResult } from './agent-tool-plan-bridge-types'

export const agentToolPlanBridgeDisabledFeatureGates: SupabaseFeatureGateInput[] = [
  gate('production_ready', 'Production readiness'),
  gate('external_beta_ready', 'External beta readiness'),
  gate('paid_production_ready', 'Paid production readiness'),
  gate('broad_media_ready', 'Broad media readiness'),
  gate('public_artifacts', 'Public artifacts'),
  gate('signed_url_source_of_truth', 'Signed URL source of truth'),
  gate('raw_prompt_execution', 'Raw prompt execution'),
  gate('direct_agent_tool_execution', 'Direct agent-to-tool execution'),
  gate('tool_runtime_execution', 'Tool runtime execution'),
  gate('worker_execution', 'Worker execution'),
  gate('provider_execution', 'Provider execution'),
  gate('supabase_migrations', 'Supabase migrations'),
  gate('historical_backfill', 'Historical backfill'),
]

export function buildPhase52DSupabaseSyncInput(runId: string, qa: AgentToolPlanBridgeQaSummary): ActivationMilestoneSyncInput {
  const prefix = agentToolPlanBridgeArtifactPrefix(runId)
  const generatedBase = `gs://${agentToolPlanBridgeConfig.generatedAssetsBucket}/${prefix}`
  const qaBase = `gs://${agentToolPlanBridgeConfig.qaBucket}/${prefix}`
  const completed = qa.status === 'passed'
  return {
    phaseId: '52D',
    phaseName: 'Agent-To-Tool Plan Bridge',
    runId,
    status: completed ? 'completed' : 'blocked',
    track: 'activation',
    subsystem: 'shared_agent_tool_plan_bridge',
    branch: agentToolPlanBridgeConfig.branch,
    prNumber: null,
    prUrl: null,
    baseBranch: agentToolPlanBridgeConfig.baseBranch,
    commitSha: null,
    qaStatus: completed ? 'passed' : 'blocked',
    readinessStatus: completed ? 'ready_for_approved_plan_snapshot_validation_system_reconciliation' : 'blocked',
    completedAt: new Date().toISOString(),
    reportArtifactPath: `${qaBase}/reports/phase52d-report.json`,
    manifestArtifactPath: `${generatedBase}/manifest/agent-tool-plan-bridge-manifest.json`,
    qaArtifactPath: `${qaBase}/qa/agent-tool-plan-bridge-qa.json`,
    artifacts: [
      artifact('phase52d_repo_ownership_audit', 'repo_ownership_audit', `${generatedBase}/audit/repo-ownership-audit.json`),
      artifact('phase52d_evidence_context', 'evidence_context', `${generatedBase}/evidence/agent-tool-plan-evidence-context.json`),
      artifact('phase52d_candidate_plans', 'candidate_approved_plan_snapshots', `${generatedBase}/plans/candidate-approved-plan-snapshots.json`),
      artifact('phase52d_blocked_plans', 'blocked_plan_records', `${generatedBase}/plans/blocked-plan-records.json`),
      artifact('phase52d_producer_gate', 'producer_plan_gate_results', `${generatedBase}/gates/producer-plan-gate-results.json`),
      artifact('phase52d_qa_gate', 'qa_plan_gate_results', `${generatedBase}/gates/qa-plan-gate-results.json`),
      artifact('phase52d_handoff_packets', 'cross_track_handoff_packets', `${generatedBase}/handoff/agent-tool-plan-handoff-packets.json`),
      artifact('phase52d_manifest', 'bridge_manifest', `${generatedBase}/manifest/agent-tool-plan-bridge-manifest.json`),
      artifact('phase52d_sync_input', 'milestone_sync_input', `${generatedBase}/supabase/phase52d-milestone-sync-input.json`),
      artifact('phase52d_sync_result', 'milestone_sync_result', `${generatedBase}/supabase/phase52d-milestone-sync-result.json`),
      artifact('phase52d_qa', 'qa', `${qaBase}/qa/agent-tool-plan-bridge-qa.json`),
      artifact('phase52d_report', 'report', `${qaBase}/reports/phase52d-report.json`),
    ],
    qaGates: qa.gates.map((qaGate) => ({
      gateId: qaGate.gateId,
      status: qaGate.passed ? 'passed' : 'blocked',
      summary: qaGate.summary,
      mandatory: qaGate.mandatory,
      evidence: { phase: '52D', runId },
    })),
    readinessSnapshots: [
      {
        subsystem: 'shared_agent_tool_plan_bridge',
        readinessKey: 'agent_tool_plan_bridge',
        readinessStatus: completed ? 'ready_for_approved_plan_snapshot_validation_system_reconciliation' : 'blocked',
        scope: 'Existing-evidence-only candidate approved-plan bridge; no runtime execution.',
        evidence: { phase: '52D', runId, candidatePlans: 7, blockedPlans: 4 },
      },
      {
        subsystem: 'shared_agent_tool_architecture',
        readinessKey: 'phase52e',
        readinessStatus: completed ? 'ready_for_approved_plan_snapshot_validation_system_reconciliation' : 'blocked',
        scope: 'Phase 52E may validate candidate approved-plan snapshots/system reconciliation on existing evidence.',
        evidence: { phase: '52D', runId, requiresSuccessfulSupabaseReadback: true },
      },
    ],
    toolCapabilities: [
      {
        toolId: 'agent_tool_plan_bridge',
        displayName: 'Agent-to-tool plan bridge',
        track: 'activation',
        subsystem: 'shared_agent_tool_plan_bridge',
        readinessState: completed ? 'ready_for_approved_plan_snapshot_validation_system_reconciliation' : 'blocked',
        runtimeAllowed: false,
        productionAllowed: false,
        externalBetaAllowed: false,
        broadMediaAllowed: false,
        evidence: { phase: '52D', runId, candidatePlanOnly: true, workerExecutionAllowed: false },
      },
    ],
    featureGateUpdates: agentToolPlanBridgeDisabledFeatureGates,
    summary: 'Phase 52D bridges Phase 52C findings/intents into candidate-only approved-plan snapshots and cross-track handoff packets.',
    blockers: qa.blockers,
    warnings: qa.warnings,
    supabaseSyncPolicy: agentToolPlanBridgeSafetyFlags,
  }
}

export function buildPhase52DSupabaseMilestoneBundle(input: ActivationMilestoneSyncInput): SupabaseMilestoneBundle {
  return buildSupabaseMilestoneBundleFromSyncInput(input)
}

export async function readbackPhase52DMilestone(input: {
  client: SupabaseClient
  runId: string
  schemaVerification: SupabaseRegistrySchemaVerification
  milestoneWrite: SupabaseMilestoneWriteVerification
  inputValidated: boolean
  bundleValidated: boolean
}): Promise<AgentToolPlanBridgeSupabaseSyncResult> {
  const blockers: string[] = []
  const warnings: string[] = []
  if (!input.schemaVerification.allTablesPresent) blockers.push(...input.schemaVerification.blockers)
  if (input.milestoneWrite.status !== 'completed') blockers.push(...input.milestoneWrite.blockers)
  let activationRunReadback = false
  if (!blockers.length) {
    try {
      const activationRun = await readActivationRun(input.client, '52D', input.runId)
      activationRunReadback = activationRun?.run_id === input.runId
    } catch (error) {
      blockers.push(sanitizeReadbackError(error instanceof Error ? error.message : String(error)))
    }
  }
  if (!activationRunReadback) blockers.push('Phase 52D activation run readback did not match.')
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

export function buildNotAttemptedPhase52DSyncResult(input: {
  schemaPresent?: boolean
  inputValidated?: boolean
  bundleValidated?: boolean
  blockers?: string[]
  warnings?: string[]
} = {}): AgentToolPlanBridgeSupabaseSyncResult {
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

function gate(gateKey: string, gateName: string): SupabaseFeatureGateInput {
  return {
    gateKey,
    gateName,
    gateStatus: 'disabled',
    enabled: false,
    productionAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadMediaAllowed: false,
    evidence: { phase: '52D', reason: 'Phase 52D is candidate-plan bridge metadata only.' },
  }
}

function artifact(artifactId: string, artifactType: string, gcsUri: string) {
  return {
    artifactId,
    artifactType,
    gcsUri,
    sourceOfTruth: true,
    signedUrlSourceOfTruth: false as const,
    metadata: { phase: '52D', privateGcsOnly: true },
  }
}

function sanitizeReadbackError(message: string): string {
  return message
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '<redacted-db-url>')
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/(service_role|apikey|authorization|password|token)[^,\n]*/gi, '<redacted-secret-field>')
    .slice(0, 700)
}
