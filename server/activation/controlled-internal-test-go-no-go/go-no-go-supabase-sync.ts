import type { SupabaseClient } from '@supabase/supabase-js'
import {
  readActivationRun,
  type SupabaseFeatureGateInput,
  type SupabaseMilestoneBundle,
  type SupabaseMilestoneWriteVerification,
  type SupabaseRegistrySchemaVerification,
} from '../supabase-milestone-registry'
import { buildSupabaseMilestoneBundleFromSyncInput, type ActivationMilestoneSyncInput } from '../supabase-milestone-sync'
import { goNoGoArtifactPrefix, goNoGoConfig, goNoGoDisabledFeatureGates, goNoGoSafetyFlags } from './controlled-internal-test-go-no-go-policy'
import type { GoNoGoQaSummary, GoNoGoSupabaseSyncResult } from './controlled-internal-test-go-no-go-types'

export function buildPhase52GSupabaseSyncInput(runId: string, qa: GoNoGoQaSummary): ActivationMilestoneSyncInput {
  const prefix = goNoGoArtifactPrefix(runId)
  const generatedBase = `gs://${goNoGoConfig.generatedAssetsBucket}/${prefix}`
  const qaBase = `gs://${goNoGoConfig.qaBucket}/${prefix}`
  const completed = qa.status === 'passed'
  return {
    phaseId: '52G',
    phaseName: 'Controlled Internal Test Go No Go Handoff Dispatch',
    runId,
    status: completed ? 'completed' : 'blocked',
    track: 'activation',
    subsystem: 'shared_system_readiness',
    branch: goNoGoConfig.branch,
    prNumber: null,
    prUrl: null,
    baseBranch: goNoGoConfig.baseBranch,
    commitSha: null,
    qaStatus: completed ? 'passed' : 'blocked',
    readinessStatus: completed ? 'ready_for_cross_workstream_handoff_tracking_or_owner_response_intake' : 'blocked',
    completedAt: new Date().toISOString(),
    reportArtifactPath: `${qaBase}/reports/phase52g-report.json`,
    manifestArtifactPath: `${generatedBase}/manifest/owner-handoff-dispatch-manifest.json`,
    qaArtifactPath: `${qaBase}/qa/controlled-internal-test-go-no-go-qa.json`,
    artifacts: [
      artifact('phase52g_repo_ownership_audit', 'repo_ownership_audit', `${generatedBase}/audit/repo-ownership-audit.json`),
      artifact('phase52g_decision_packet', 'go_no_go_decision_packet', `${generatedBase}/decision/controlled-internal-test-go-no-go-decision.json`),
      artifact('phase52g_controlled_test_packet', 'controlled_internal_test_packet', `${generatedBase}/plan/controlled-internal-test-packet.json`),
      artifact('phase52g_blocker_inventory', 'go_no_go_blocker_inventory', `${generatedBase}/blockers/go-no-go-blocker-inventory.json`),
      artifact('phase52g_exposure_register', 'go_no_go_exposure_register', `${generatedBase}/risks/go-no-go-exposure-register.json`),
      artifact('phase52g_owner_prompts', 'owner_handoff_prompt_packets', `${generatedBase}/prompts/owner-handoff-prompt-packets.json`),
      artifact('phase52g_dispatch_manifest', 'owner_handoff_dispatch_manifest', `${generatedBase}/manifest/owner-handoff-dispatch-manifest.json`),
      artifact('phase52g_sync_input', 'milestone_sync_input', `${generatedBase}/supabase/phase52g-milestone-sync-input.json`),
      artifact('phase52g_sync_result', 'milestone_sync_result', `${generatedBase}/supabase/phase52g-milestone-sync-result.json`),
      artifact('phase52g_qa', 'qa', `${qaBase}/qa/controlled-internal-test-go-no-go-qa.json`),
      artifact('phase52g_report', 'report', `${qaBase}/reports/phase52g-report.json`),
    ],
    qaGates: qa.gates.map((qaGate) => ({
      gateId: qaGate.gateId,
      status: qaGate.passed ? 'passed' : 'blocked',
      summary: qaGate.summary,
      mandatory: qaGate.mandatory,
      evidence: { phase: '52G', runId },
    })),
    readinessSnapshots: [
      {
        subsystem: 'controlled_internal_test',
        readinessKey: 'phase52h',
        readinessStatus: completed ? 'ready_for_cross_workstream_handoff_tracking_or_owner_response_intake' : 'blocked',
        scope: 'Phase 52H may track owner responses or pause for owner execution of handoff prompts; runtime remains blocked.',
        evidence: { phase: '52G', runId, noRuntimeExecution: true },
      },
    ],
    toolCapabilities: [
      {
        toolId: 'controlled_internal_test_go_no_go_dispatch',
        displayName: 'Controlled internal test go/no-go dispatch',
        track: 'activation',
        subsystem: 'shared_system_readiness',
        readinessState: completed ? 'ready_for_cross_workstream_handoff_tracking_or_owner_response_intake' : 'blocked',
        runtimeAllowed: false,
        productionAllowed: false,
        externalBetaAllowed: false,
        broadMediaAllowed: false,
        evidence: { phase: '52G', runId, handoffOnly: true, workerExecutionAllowed: false },
      },
    ],
    featureGateUpdates: goNoGoDisabledFeatureGates.map((gateKey) => gate(String(gateKey))),
    summary: 'Phase 52G emits controlled internal test go/no-go and owner handoff packets without runtime execution.',
    blockers: qa.blockers,
    warnings: qa.warnings,
    supabaseSyncPolicy: goNoGoSafetyFlags,
  }
}

export function buildPhase52GSupabaseMilestoneBundle(input: ActivationMilestoneSyncInput): SupabaseMilestoneBundle {
  return buildSupabaseMilestoneBundleFromSyncInput(input)
}

export async function readbackPhase52GMilestone(input: {
  client: SupabaseClient
  runId: string
  schemaVerification: SupabaseRegistrySchemaVerification
  milestoneWrite: SupabaseMilestoneWriteVerification
  inputValidated: boolean
  bundleValidated: boolean
}): Promise<GoNoGoSupabaseSyncResult> {
  const blockers: string[] = []
  if (!input.schemaVerification.allTablesPresent) blockers.push(...input.schemaVerification.blockers)
  if (input.milestoneWrite.status !== 'completed') blockers.push(...input.milestoneWrite.blockers)
  let activationRunReadback = false
  if (!blockers.length) {
    try {
      const activationRun = await readActivationRun(input.client, '52G', input.runId)
      activationRunReadback = activationRun?.run_id === input.runId
    } catch (error) {
      blockers.push(sanitizeReadbackError(error instanceof Error ? error.message : String(error)))
    }
  }
  if (!activationRunReadback) blockers.push('Phase 52G activation run readback did not match.')
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

export function buildNotAttemptedPhase52GSyncResult(input: {
  schemaPresent?: boolean
  inputValidated?: boolean
  bundleValidated?: boolean
  blockers?: string[]
  warnings?: string[]
} = {}): GoNoGoSupabaseSyncResult {
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
    evidence: { phase: '52G', reason: 'Phase 52G is go/no-go and handoff metadata only.' },
  }
}

function artifact(artifactId: string, artifactType: string, gcsUri: string) {
  return {
    artifactId,
    artifactType,
    gcsUri,
    sourceOfTruth: true,
    signedUrlSourceOfTruth: false as const,
    metadata: { phase: '52G', privateGcsOnly: true },
  }
}

function sanitizeReadbackError(message: string): string {
  return message
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/(service_role|apikey|authorization|password|token)[^,\n]*/gi, '<redacted-secret-field>')
    .slice(0, 500)
}
