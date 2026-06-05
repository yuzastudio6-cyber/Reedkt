import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'
import type { BlockedPlanRecord, CandidateApprovedPlanSnapshot, CrossTrackHandoffPacket } from '../agent-tool-plan-bridge'
import { buildAgentToolPlanBridgeReport } from '../agent-tool-plan-bridge'
import { approvedPlanValidationConfig } from './approved-plan-validation-policy'
import type { ApprovedPlanEvidenceContext } from './approved-plan-validation-types'

const execFile = promisify(execFileCallback)

export async function resolveApprovedPlanEvidenceContext(input: { preferPrivateGcs: boolean } = { preferPrivateGcs: false }): Promise<ApprovedPlanEvidenceContext> {
  const sourceReport = await buildAgentToolPlanBridgeReport()
  const warnings: string[] = [...sourceReport.warnings]
  const blockers: string[] = [...sourceReport.blockers]
  let evidenceSource: ApprovedPlanEvidenceContext['evidenceSource'] = 'committed_phase52d_reconstruction'
  let candidatePlans = sourceReport.candidatePlans
  let blockedPlans = sourceReport.blockedPlans
  let handoffPackets = sourceReport.handoffPackets

  if (input.preferPrivateGcs) {
    const loaded = await loadPhase52DGcsEvidence()
    warnings.push(...loaded.warnings)
    blockers.push(...loaded.blockers)
    if (loaded.candidatePlans && loaded.blockedPlans && loaded.handoffPackets) {
      evidenceSource = 'private_gcs_phase52d_artifacts'
      candidatePlans = loaded.candidatePlans
      blockedPlans = loaded.blockedPlans
      handoffPackets = loaded.handoffPackets
    }
  }

  if (candidatePlans.length !== 7) blockers.push(`Phase 52D candidate evidence expected 7 records, got ${candidatePlans.length}.`)
  if (blockedPlans.length !== 4) blockers.push(`Phase 52D blocked/handoff evidence expected 4 records, got ${blockedPlans.length}.`)
  if (handoffPackets.length < 7) blockers.push(`Phase 52D handoff evidence expected at least 7 packets, got ${handoffPackets.length}.`)

  return {
    phase52D: {
      runId: 'phase52d-20260605T164423',
      status: 'completed',
      prNumber: 208,
      commitSha: 'bf6883ac4b3287cf7e4b38098459b21ea34cdb19',
      reference: 'docs/activation-phase-52d-agent-tool-plan-bridge-results.md',
    },
    phase52DReportStatus: sourceReport.status,
    evidenceSource,
    sourceReport,
    candidatePlans,
    blockedPlans,
    handoffPackets,
    contextFlags: {
      expectedCandidatePlans: 7,
      expectedBlockedPlans: 4,
      expectedHandoffPackets: 7,
      trackAInternalTestingReady: true,
      webSearchInternalBetaCandidateReady: true,
      mapGeospatialInternalTestingReady: true,
      supabaseMilestoneSyncReady: true,
      aiToolsPlaceholdersPending: true,
      trackBVlmExcluded: true,
      trackBDemucsBlockedPendingProvenance: true,
      workerExecutionNotOwnedHere: true,
      productionExternalBetaBroadMediaBlocked: true,
    },
    blockers: Array.from(new Set(blockers)),
    warnings: Array.from(new Set(warnings)),
  }
}

async function loadPhase52DGcsEvidence(): Promise<{
  candidatePlans?: CandidateApprovedPlanSnapshot[]
  blockedPlans?: BlockedPlanRecord[]
  handoffPackets?: CrossTrackHandoffPacket[]
  blockers: string[]
  warnings: string[]
}> {
  const generatedBase = `gs://${approvedPlanValidationConfig.generatedAssetsBucket}/${approvedPlanValidationConfig.sourcePhase52DGeneratedPrefix}`
  try {
    const [candidatePlans, blockedPlans, handoffPackets] = await Promise.all([
      readGcsJson<CandidateApprovedPlanSnapshot[]>(`${generatedBase}/plans/candidate-approved-plan-snapshots.json`),
      readGcsJson<BlockedPlanRecord[]>(`${generatedBase}/plans/blocked-plan-records.json`),
      readGcsJson<CrossTrackHandoffPacket[]>(`${generatedBase}/handoff/agent-tool-plan-handoff-packets.json`),
    ])
    return {
      candidatePlans,
      blockedPlans,
      handoffPackets,
      blockers: [],
      warnings: ['Phase 52D candidate, blocked, and handoff evidence loaded from private GCS artifacts.'],
    }
  } catch (error) {
    return {
      blockers: [],
      warnings: [`Private Phase 52D GCS evidence was not loaded; using committed deterministic reconstruction. ${sanitizeCommandError(error instanceof Error ? error.message : String(error))}`],
    }
  }
}

async function readGcsJson<T>(uri: string): Promise<T> {
  const { stdout } = await execFile('gcloud', ['storage', 'cat', uri], { maxBuffer: 16 * 1024 * 1024 })
  return JSON.parse(stdout) as T
}

function sanitizeCommandError(message: string): string {
  return message
    .replace(/https?:\/\/[^\s)]+/g, '<redacted-url>')
    .replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '<redacted-db-url>')
    .replace(/(service_role|apikey|authorization|password|token)[^,\n]*/gi, '<redacted-secret-field>')
    .slice(0, 500)
}
