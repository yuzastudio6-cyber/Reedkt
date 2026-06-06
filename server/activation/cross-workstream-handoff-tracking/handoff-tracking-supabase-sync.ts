import type { SupabaseClient } from '@supabase/supabase-js'
import {
  readActivationRun,
  type SupabaseFeatureGateInput,
  type SupabaseMilestoneBundle,
  type SupabaseMilestoneWriteVerification,
  type SupabaseRegistrySchemaVerification,
} from '../supabase-milestone-registry'
import { buildSupabaseMilestoneBundleFromSyncInput, type ActivationMilestoneSyncInput } from '../supabase-milestone-sync'
import {
  crossWorkstreamHandoffArtifactPrefix,
  crossWorkstreamHandoffConfig,
  crossWorkstreamHandoffDisabledFeatureGates,
  crossWorkstreamHandoffSafetyFlags,
} from './cross-workstream-handoff-policy'
import type { CrossWorkstreamQaSummary, CrossWorkstreamSupabaseSyncResult } from './cross-workstream-handoff-types'

export function buildPhase52HSupabaseSyncInput(runId: string, qa: CrossWorkstreamQaSummary): ActivationMilestoneSyncInput {
  const prefix = crossWorkstreamHandoffArtifactPrefix(runId)
  const generatedBase = `gs://${crossWorkstreamHandoffConfig.generatedAssetsBucket}/${prefix}`
  const qaBase = `gs://${crossWorkstreamHandoffConfig.qaBucket}/${prefix}`
  const completed = qa.status === 'passed'
  return {
    phaseId: '52H',
    phaseName: 'Cross Workstream Handoff Tracking',
    runId,
    status: completed ? 'completed' : 'blocked',
    track: 'activation',
    subsystem: 'shared_system_readiness',
    branch: crossWorkstreamHandoffConfig.branch,
    prNumber: null,
    prUrl: null,
    baseBranch: crossWorkstreamHandoffConfig.baseBranch,
    commitSha: null,
    qaStatus: completed ? 'passed' : 'blocked',
    readinessStatus: completed ? 'ready_for_owner_response_intake_update' : 'blocked',
    completedAt: new Date().toISOString(),
    reportArtifactPath: `${qaBase}/reports/phase52h-report.json`,
    manifestArtifactPath: `${generatedBase}/manifest/cross-workstream-handoff-tracking-manifest.json`,
    qaArtifactPath: `${qaBase}/qa/cross-workstream-handoff-tracking-qa.json`,
    artifacts: [
      artifact('phase52h_repo_ownership_audit', 'repo_ownership_audit', `${generatedBase}/audit/repo-ownership-audit.json`),
      artifact('phase52h_owner_response_schema', 'owner_response_schema', `${generatedBase}/schema/owner-response-schema.json`),
      artifact('phase52h_owner_response_ledger', 'owner_response_tracking_ledger', `${generatedBase}/ledger/owner-response-tracking-ledger.json`),
      artifact('phase52h_owner_response_template', 'owner_response_template', `${generatedBase}/templates/owner-response-template.json`),
      artifact('phase52h_owner_prompt_refs', 'owner_prompt_packet_references', `${generatedBase}/prompts/owner-prompt-packet-references.json`),
      artifact('phase52h_intake_instructions', 'owner_response_intake_instructions', `${generatedBase}/intake/owner-response-intake-instructions.json`),
      artifact('phase52h_manifest', 'handoff_tracking_manifest', `${generatedBase}/manifest/cross-workstream-handoff-tracking-manifest.json`),
      artifact('phase52h_sync_input', 'milestone_sync_input', `${generatedBase}/supabase/phase52h-milestone-sync-input.json`),
      artifact('phase52h_sync_result', 'milestone_sync_result', `${generatedBase}/supabase/phase52h-milestone-sync-result.json`),
      artifact('phase52h_qa', 'qa', `${qaBase}/qa/cross-workstream-handoff-tracking-qa.json`),
      artifact('phase52h_report', 'report', `${qaBase}/reports/phase52h-report.json`),
    ],
    qaGates: qa.gates.map((qaGate) => ({
      gateId: qaGate.gateId,
      status: qaGate.passed ? 'passed' : 'blocked',
      summary: qaGate.summary,
      mandatory: qaGate.mandatory,
      evidence: { phase: '52H', runId },
    })),
    readinessSnapshots: [
      {
        subsystem: 'cross_workstream_handoff_tracking',
        readinessKey: 'phase52i',
        readinessStatus: completed ? 'ready_for_owner_response_intake_update' : 'blocked',
        scope: 'Phase 52I may update owner responses after other chats respond, or pause pending owner responses.',
        evidence: { phase: '52H', runId, noRuntimeExecution: true },
      },
    ],
    toolCapabilities: [
      {
        toolId: 'cross_workstream_handoff_tracking',
        displayName: 'Cross-workstream handoff tracking',
        track: 'activation',
        subsystem: 'shared_system_readiness',
        readinessState: completed ? 'ready_for_owner_response_intake_update' : 'blocked',
        runtimeAllowed: false,
        productionAllowed: false,
        externalBetaAllowed: false,
        broadMediaAllowed: false,
        evidence: { phase: '52H', runId, ownerPromptExecutionAllowed: false },
      },
    ],
    featureGateUpdates: crossWorkstreamHandoffDisabledFeatureGates.map((gateKey) => gate(String(gateKey))),
    summary: 'Phase 52H creates cross-workstream handoff tracking and owner response intake metadata without executing owner prompts or runtimes.',
    blockers: qa.blockers,
    warnings: qa.warnings,
    supabaseSyncPolicy: crossWorkstreamHandoffSafetyFlags,
  }
}

export function buildPhase52HSupabaseMilestoneBundle(input: ActivationMilestoneSyncInput): SupabaseMilestoneBundle {
  return buildSupabaseMilestoneBundleFromSyncInput(input)
}

export async function readbackPhase52HMilestone(input: {
  client: SupabaseClient
  runId: string
  schemaVerification: SupabaseRegistrySchemaVerification
  milestoneWrite: SupabaseMilestoneWriteVerification
  inputValidated: boolean
  bundleValidated: boolean
}): Promise<CrossWorkstreamSupabaseSyncResult> {
  const blockers: string[] = []
  if (!input.schemaVerification.allTablesPresent) blockers.push(...input.schemaVerification.blockers)
  if (input.milestoneWrite.status !== 'completed') blockers.push(...input.milestoneWrite.blockers)
  let activationRunReadback = false
  if (!blockers.length) {
    try {
      const activationRun = await readActivationRun(input.client, '52H', input.runId)
      activationRunReadback = activationRun?.run_id === input.runId
    } catch (error) {
      blockers.push(sanitizeReadbackError(error instanceof Error ? error.message : String(error)))
    }
  }
  if (!activationRunReadback) blockers.push('Phase 52H activation run readback did not match.')
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

export function buildNotAttemptedPhase52HSyncResult(input: {
  schemaPresent?: boolean
  inputValidated?: boolean
  bundleValidated?: boolean
  blockers?: string[]
  warnings?: string[]
} = {}): CrossWorkstreamSupabaseSyncResult {
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
    unrelatedSupabaseRowsWritten: false,
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
    evidence: { phase: '52H', reason: 'Phase 52H is handoff tracking and owner response intake metadata only.' },
  }
}

function artifact(artifactId: string, artifactType: string, gcsUri: string) {
  return {
    artifactId,
    artifactType,
    gcsUri,
    sourceOfTruth: true,
    signedUrlSourceOfTruth: false as const,
    metadata: { phase: '52H', privateGcsOnly: true },
  }
}

function sanitizeReadbackError(message: string): string {
  return message
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/(service_role|apikey|authorization|password|token)[^,\n]*/gi, '<redacted-secret-field>')
    .slice(0, 500)
}
