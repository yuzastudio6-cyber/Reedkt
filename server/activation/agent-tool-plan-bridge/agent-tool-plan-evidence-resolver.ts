import type { SupabaseClient } from '@supabase/supabase-js'
import {
  generateEditIntentCandidates,
  generateMultiAgentFindings,
  loadExecutedToolCapabilityContext,
  multiAgentDryRunScenarios,
  runProducerGate,
} from '../multi-agent-dry-run'
import type { AgentToolPlanEvidenceContext } from './agent-tool-plan-bridge-types'

const phase52CTimestamp = '2026-06-05T13:49:04.000Z'

export async function resolveAgentToolPlanEvidenceContext(client?: SupabaseClient): Promise<AgentToolPlanEvidenceContext> {
  const context = await loadExecutedToolCapabilityContext(client)
  const sourceAgentFindings = generateMultiAgentFindings(multiAgentDryRunScenarios, phase52CTimestamp)
  const sourceEditIntents = generateEditIntentCandidates(multiAgentDryRunScenarios, context.capabilities)
  const sourceProducerGateResults = runProducerGate(sourceEditIntents, context.capabilities)

  return {
    phase52A: {
      runId: 'phase52a-20260605T111515',
      status: 'completed',
      reference: 'docs/activation-phase-52a-shared-agent-tool-architecture-results.md',
    },
    phase52B: {
      runId: 'phase52b-20260605T121905',
      status: 'completed',
      reference: 'docs/activation-phase-52b-tool-capability-registry-audit-results.md',
      capabilityRecordCount: context.capabilities.length,
    },
    phase52C: {
      runId: 'phase52c-20260605T134904',
      status: 'completed',
      reference: 'docs/activation-phase-52c-multi-agent-dry-run-results.md',
    },
    sourceAgentFindings,
    sourceEditIntents,
    sourceProducerGateResults,
    capabilityRecords: context.capabilities,
    supabaseCapabilityReadback: context.supabaseCapabilityReadback,
    contextFlags: {
      trackAInternalTestingReady: true,
      webSearchInternalBetaCandidateReady: true,
      mapGeospatialInternalTestingReady: true,
      supabaseMilestoneSyncReady: true,
      aiToolsPlaceholdersPendingExternalManifest: true,
      trackBVlmExcluded: true,
      trackBDemucsBlockedPendingProvenance: true,
      workerExecutionNotOwnedHere: true,
      productionExternalBetaBroadMediaBlocked: true,
    },
    sourceOfTruthRules: context.sourceOfTruthRules,
    blockers: [...context.supabaseCapabilityReadback.blockers],
    warnings: [...context.supabaseCapabilityReadback.warnings],
  }
}
