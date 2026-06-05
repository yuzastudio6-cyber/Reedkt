import type { EditIntentCandidate, MultiAgentFinding, MultiAgentIntentType, ProducerGateResult } from '../multi-agent-dry-run'
import type { BlockedPlanRecord, CandidateApprovedPlanSnapshot } from './agent-tool-plan-bridge-types'
import { agentToolPlanBridgeArtifactPrefix, agentToolPlanBridgeConfig } from './agent-tool-plan-bridge-policy'
import { routeForIntent } from './edit-intent-to-plan-router'

export const phase52DAllowedIntentTypes: MultiAgentIntentType[] = [
  'conservative_color_adjustment',
  'caption_burnin_preview',
  'text_behind_subject_preview',
  'slow_motion_segment',
  'web_research_planning_context',
  'route_map_overlay',
  'location_context_card',
]

export const phase52DBlockedIntentTypes: MultiAgentIntentType[] = [
  'motion_graphics_lower_third',
  'noise_cleanup',
  'qwen_vlm_visual_understanding_request',
  'demucs_stem_separation_request',
]

export function buildCandidateApprovedPlanSnapshots(input: {
  runId: string
  createdAt: string
  findings: MultiAgentFinding[]
  intents: EditIntentCandidate[]
  producerGateResults: ProducerGateResult[]
}): CandidateApprovedPlanSnapshot[] {
  const prefix = agentToolPlanBridgeArtifactPrefix(input.runId)
  return input.intents
    .filter((intent) => phase52DAllowedIntentTypes.includes(intent.intentType))
    .filter((intent) => input.producerGateResults.some((result) => result.intentId === intent.intentId && result.decision === 'allowed_candidate_plan_only'))
    .map((intent) => {
      const route = routeForIntent(intent.intentType)
      const sourceFindingIds = input.findings.filter((finding) => finding.scenarioId === intent.scenarioId && finding.downstreamIntentCandidates.includes(intent.intentType)).map((finding) => finding.findingId)
      return {
        planId: `phase52d-${intent.intentType}-candidate`,
        planVersion: 'phase52d_candidate_v1',
        createdAt: input.createdAt,
        sourceRequestId: `phase52c:${intent.scenarioId}`,
        sourceScenarioId: intent.scenarioId,
        sourceFindingIds,
        sourceIntentIds: [intent.intentId],
        sourceIntentTypes: [intent.intentType],
        decision: 'candidate_plan_only',
        executionStatus: 'candidate_only',
        approvedByPolicy: false,
        candidateOnly: true,
        rawPromptExecution: false,
        workerExecutionAllowed: false,
        approvedForRuntime: false,
        requiresFutureOwnerApproval: route.handoffRequired,
        inputArtifactScope: route.inputArtifactScope,
        outputArtifactScope: route.outputArtifactScope,
        selectedToolRoutes: [{
          ownerRoute: route.ownerRoute,
          track: route.track,
          toolIds: route.requiredToolIds,
          capabilities: route.requiredCapabilities,
          ownerType: route.ownerType,
        }],
        selectedIntents: [intent.intentType],
        rejectedIntents: [],
        safetyFlags: {
          publicArtifactAllowed: false,
          signedUrlSourceOfTruthAllowed: false,
          providerCallsAllowed: false,
          productionReadyAllowed: false,
          externalBetaAllowed: false,
          broadMediaAllowed: false,
          toolRuntimeAllowed: false,
          modelInferenceAllowed: false,
        },
        budgetLimits: {
          maxRuntimeCostUsd: 0,
          creditReservationRequiredBeforeExecution: true,
        },
        privacyLimits: ['private gs:// artifacts only', 'no signed URL source of truth', 'no raw prompt execution', 'no provider/model/tool secrets'],
        runtimeLimits: ['no worker execution', 'no model inference', 'no media processing', 'no provider calls', 'no browser/map/search runtime'],
        allowedBuckets: [agentToolPlanBridgeConfig.generatedAssetsBucket, agentToolPlanBridgeConfig.qaBucket],
        allowedPrefixes: [prefix],
        qaRequirements: ['Producer gate must keep candidate_plan_only', 'QA/Safety gate must prove no runtime execution', 'Supabase milestone sync must write/read back before Phase52E readiness'],
        rollbackPolicy: 'Candidate records can be superseded by a later approved snapshot validation phase; no runtime rollback is needed because no execution occurs.',
        crossTrackOwner: route.ownerRoute,
        handoffRequired: route.handoffRequired,
        sourceOfTruthPolicy: route.sourceOfTruthPolicy,
        supabaseMilestoneSyncPolicy: 'phase51d_milestone_sync_only',
      }
    })
}

export function buildBlockedPlanRecords(input: {
  findings: MultiAgentFinding[]
  intents: EditIntentCandidate[]
  producerGateResults: ProducerGateResult[]
}): BlockedPlanRecord[] {
  return input.intents
    .filter((intent) => phase52DBlockedIntentTypes.includes(intent.intentType))
    .map((intent) => {
      const route = routeForIntent(intent.intentType)
      const handoffOnly = intent.intentType === 'motion_graphics_lower_third' || intent.intentType === 'noise_cleanup'
      const sourceFindingIds = input.findings.filter((finding) => finding.scenarioId === intent.scenarioId && finding.downstreamIntentCandidates.includes(intent.intentType)).map((finding) => finding.findingId)
      const producerResult = input.producerGateResults.find((result) => result.intentId === intent.intentId)
      return {
        planId: `phase52d-${intent.intentType}-${handoffOnly ? 'handoff' : 'blocked'}`,
        planVersion: 'phase52d_blocked_v1',
        sourceScenarioId: intent.scenarioId,
        sourceFindingIds,
        sourceIntentIds: [intent.intentId],
        sourceIntentTypes: [intent.intentType],
        decision: handoffOnly ? 'handoff_only' : 'blocked',
        executionStatus: 'blocked_or_handoff_only',
        ownerRoute: route.ownerRoute,
        requiredCapabilities: route.requiredCapabilities,
        blockedReason: producerResult?.reason ?? intent.blockedReason ?? route.ownerActionNeeded,
        ownerActionNeeded: route.ownerActionNeeded,
        rawPromptExecution: false,
        workerExecutionAllowed: false,
        approvedForRuntime: false,
        publicArtifactAllowed: false,
        signedUrlSourceOfTruthAllowed: false,
        productionReadyAllowed: false,
        externalBetaAllowed: false,
        broadMediaAllowed: false,
        sourceOfTruthPolicy: route.sourceOfTruthPolicy,
      }
    })
}
