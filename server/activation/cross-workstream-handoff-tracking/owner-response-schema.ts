import type { OwnerResponseSchema } from './cross-workstream-handoff-types'

export function buildOwnerResponseSchema(): OwnerResponseSchema {
  return {
    schemaId: 'phase52h_owner_response_schema',
    requiredFields: [
      'responseId',
      'workstream',
      'ownerChat',
      'sourcePhase',
      'sourceRunId',
      'handoffPacketRef',
      'responseStatus',
      'ownerDecision',
      'acceptedScope',
      'blockedScope',
      'nextPrompt',
      'evidenceRefs',
      'blockers',
      'risks',
      'contractsChanged',
      'supabaseUpdateClassification',
      'productionReadyAllowed',
      'externalBetaAllowed',
      'broadMediaAllowed',
      'publicArtifactAllowed',
      'rawPromptExecutionAllowed',
      'signedUrlSourceOfTruthAllowed',
      'createdAt',
      'updatedAt',
    ],
    allowedStatuses: ['pending', 'accepted', 'accepted_with_blockers', 'blocked', 'rejected', 'superseded', 'needs_clarification'],
    blockedBooleanDefaults: {
      productionReadyAllowed: false,
      externalBetaAllowed: false,
      broadMediaAllowed: false,
      publicArtifactAllowed: false,
      rawPromptExecutionAllowed: false,
      signedUrlSourceOfTruthAllowed: false,
    },
    notes: [
      'Owner responses are coordination metadata only.',
      'Owner responses must not include secrets, public artifact URLs as source of truth, signed URLs as source of truth, or runtime execution claims.',
      'Accepted responses may only accept planning or handoff scope unless a later explicit owner phase changes the contract.',
    ],
  }
}
