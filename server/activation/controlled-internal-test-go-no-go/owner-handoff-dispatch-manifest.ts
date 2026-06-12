import { goNoGoDisabledFeatureGates } from './controlled-internal-test-go-no-go-policy'
import type {
  ControlledInternalTestPacket,
  GoNoGoBlockerRecord,
  GoNoGoDecisionPacket,
  OwnerHandoffDispatchManifest,
  OwnerHandoffPromptPacket,
} from './controlled-internal-test-go-no-go-types'

export function buildOwnerHandoffDispatchManifest(input: {
  runId: string
  decisionPacket: GoNoGoDecisionPacket
  controlledInternalTestPacket: ControlledInternalTestPacket
  ownerPromptPackets: OwnerHandoffPromptPacket[]
  blockerInventory: GoNoGoBlockerRecord[]
  warnings?: string[]
  blockers?: string[]
  phase52HReady?: boolean
}): OwnerHandoffDispatchManifest {
  return {
    manifestId: 'phase52g_owner_handoff_dispatch_manifest',
    runId: input.runId,
    phase: '52G',
    topLevelDecision: input.decisionPacket.topLevelDecision,
    workstreamDecisions: input.decisionPacket.workstreamDecisions,
    controlledInternalTestPacket: input.controlledInternalTestPacket,
    ownerPromptPackets: input.ownerPromptPackets.map((packet) => ({
      packetId: packet.packetId,
      fileName: packet.fileName,
      workstream: packet.workstream,
    })),
    blockerInventory: input.blockerInventory,
    sourceOfTruthSummary: [
      'Private GCS JSON/Markdown artifacts are authoritative for Phase 52G.',
      'Screenshots, previews, public URLs, and signed URLs are not source of truth.',
      'Supabase stores structured milestone metadata and private gs:// references only.',
    ],
    supabaseMilestoneRefs: ['52F:phase52f-20260605T185559', `52G:${input.runId}`],
    blockedFeatures: [...goNoGoDisabledFeatureGates],
    warnings: input.warnings ?? [],
    blockers: input.blockers ?? [],
    phase52HReadiness: input.phase52HReady ? 'ready_for_cross_workstream_handoff_tracking_or_owner_response_intake' : 'blocked',
  }
}
