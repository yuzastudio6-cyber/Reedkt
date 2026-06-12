import { crossWorkstreamHandoffDisabledFeatureGates } from './cross-workstream-handoff-policy'
import type {
  CrossWorkstreamHandoffManifest,
  CrossWorkstreamSourceAudit,
  OwnerPromptPacketReference,
  OwnerResponseIntakeInstructions,
  OwnerResponseLedger,
  OwnerResponseSchema,
} from './cross-workstream-handoff-types'

export function buildOwnerResponseIntakeInstructions(): OwnerResponseIntakeInstructions {
  return {
    instructionsId: 'phase52h_owner_response_intake_instructions',
    responseSubmissionMode: 'private_artifact_or_follow_up_prompt',
    requiredOwnerActions: [
      'Review the Phase 52G owner prompt packet for the workstream.',
      'Return one owner response packet using the Phase 52H schema.',
      'List accepted planning scope, blocked execution scope, evidence refs, blockers, risks, and next prompt.',
      'Keep Supabase updates to milestone/status metadata unless a later explicit owner phase authorizes more.',
    ],
    prohibitedOwnerActions: [
      'Do not execute owner prompts in Phase 52H.',
      'Do not execute tools, workers, models, providers, media processing, web search, browser capture, map rendering, migrations, Docker, Cloud Run, production, external beta, or broad media.',
      'Do not expose secrets, create public artifacts, or use signed URLs as source of truth.',
    ],
    validationExpectations: [
      'Every owner response must preserve blocked feature booleans as false.',
      'Every owner response must reference private artifacts or committed docs only.',
      'Any contractsChanged=true response requires explicit evidence and owner rationale.',
    ],
    phase52IHandling: [
      'Phase 52I may update the ledger after owner responses arrive.',
      'If owners do not respond, Phase 52I should pause pending owner responses rather than invent acceptance.',
      'Phase 52I remains non-runtime unless a later prompt explicitly changes scope.',
    ],
  }
}

export function buildCrossWorkstreamHandoffManifest(input: {
  runId: string
  repoOwnershipAudit: CrossWorkstreamSourceAudit
  ownerResponseSchema: OwnerResponseSchema
  ownerResponseLedger: OwnerResponseLedger
  ownerPromptPacketRefs: OwnerPromptPacketReference[]
  responseIntakeInstructions: OwnerResponseIntakeInstructions
  warnings: string[]
  blockers: string[]
  phase52IReady: boolean
}): CrossWorkstreamHandoffManifest {
  return {
    manifestId: 'phase52h_cross_workstream_handoff_tracking_manifest',
    runId: input.runId,
    phase: '52H',
    repoOwnershipAudit: input.repoOwnershipAudit,
    ownerResponseSchema: input.ownerResponseSchema,
    ownerResponseLedger: input.ownerResponseLedger,
    ownerPromptPacketRefs: input.ownerPromptPacketRefs,
    pendingResponses: input.ownerResponseLedger.pendingResponses,
    acceptedResponses: input.ownerResponseLedger.acceptedResponses,
    blockedResponses: input.ownerResponseLedger.blockedResponses,
    responseIntakeInstructions: input.responseIntakeInstructions,
    supabaseMilestoneRefs: ['52G:phase52g-20260606T033152', `52H:${input.runId}`],
    blockedFeatures: [...crossWorkstreamHandoffDisabledFeatureGates],
    warnings: input.warnings,
    blockers: input.blockers,
    phase52IReadiness: input.phase52IReady ? 'ready_for_owner_response_intake_update' : 'blocked',
  }
}
