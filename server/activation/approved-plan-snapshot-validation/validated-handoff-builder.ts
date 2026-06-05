import type { CrossTrackHandoffPacket } from '../agent-tool-plan-bridge'
import type { MissingContractInventory, ValidatedHandoffPacket } from './approved-plan-validation-types'

const commonProhibited = [
  'tool/model/provider execution',
  'worker execution',
  'raw prompt execution',
  'public artifact publication',
  'signed URL as source of truth',
  'production or external beta unlock',
]

const packetFileNames: Record<string, string> = {
  TRACK_A_RENDER_EXPORT: 'validated-track-a-plan-candidates-handoff',
  WEB_SEARCH_CAPTURE: 'validated-web-search-plan-candidates-handoff',
  MAP_GEOSPATIAL: 'validated-map-geospatial-plan-candidates-handoff',
  AI_TOOLS_CREATIVE_GRAPHICS: 'validated-ai-tools-handoff',
  TRACK_B_MEDIA_PROCESSING: 'validated-track-b-handoff',
  WORKER_RUNTIME_JOBS: 'validated-worker-runtime-handoff',
  SUPABASE_MILESTONE_SYNC: 'validated-supabase-handoff',
}

export function buildValidatedHandoffPackets(input: {
  runId: string
  sourceHandoffs: CrossTrackHandoffPacket[]
  missingContractInventory: MissingContractInventory
}): ValidatedHandoffPacket[] {
  const packets: ValidatedHandoffPacket[] = input.sourceHandoffs.map((source) => ({
    packetId: packetFileNames[source.targetWorkstream] ?? source.packetId,
    owner: source.targetWorkstream,
    candidatePlanIds: source.candidatePlanIds,
    blockedPlanIds: source.blockedPlanIds,
    validationResult: 'validated' as const,
    nextAction: source.ownerActionNeeded.join(' '),
    prohibitedActions: Array.from(new Set([...commonProhibited, ...source.prohibitedActions])),
    supabaseRefs: [`52E:${input.runId}`, ...source.supabaseMilestoneRefs],
    risk: source.blockedPlanIds.length ? 'medium' as const : 'low' as const,
    requiredPromptOwner: source.nextRecommendedPhaseOrPromptOwner,
    blockers: [],
    warnings: [],
  }))

  packets.push({
    packetId: 'missing-contracts-handoff',
    owner: 'SYSTEM_RECONCILIATION',
    candidatePlanIds: [],
    blockedPlanIds: [],
    validationResult: input.missingContractInventory.blockers.length ? 'blocked' : 'validated',
    nextAction: 'Resolve missing source-of-truth contracts in their owning workstreams before runtime expansion.',
    prohibitedActions: commonProhibited,
    supabaseRefs: [`52E:${input.runId}`],
    risk: input.missingContractInventory.missingContracts.length ? 'medium' : 'low',
    requiredPromptOwner: 'system readiness reconciliation / cross-chat coordination owner',
    blockers: input.missingContractInventory.blockers,
    warnings: input.missingContractInventory.warnings,
  })

  return packets
}
