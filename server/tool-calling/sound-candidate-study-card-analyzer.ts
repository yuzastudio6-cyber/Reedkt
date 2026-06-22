import {
  PRODUCTION_TOOL_IDS,
} from '../tool-registry'
import {
  listToolAdapterContracts,
} from './adapter-registry'
import {
  listControlledLowRiskProbePolicies,
} from './controlled-low-risk-execution-policy'
import {
  listCommandIntentPolicies,
} from './safe-command-plan-policy'
import {
  buildSoundMusicAudioOwnerExpansionMatrix,
} from './sound-music-audio-owner-expansion-analyzer'
import {
  loadSoundCandidateStudyCards,
} from './sound-candidate-study-card-loader'
import type {
  SoundCandidateRecommendation,
  SoundCandidateStudyCard,
  SoundCandidateStudyCardAnalysis,
} from './sound-candidate-study-card-types'

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right))
}

function candidateHasOwnerEvidence(card: SoundCandidateStudyCard): boolean {
  const rows = buildSoundMusicAudioOwnerExpansionMatrix()

  return rows.some((row) => (
    row.normalizedToolId === card.externalToolId ||
    row.aliases.includes(card.externalToolId) ||
    card.aliases.some((alias) => row.normalizedToolId === alias || row.aliases.includes(alias))
  ))
}

export function listSoundCandidateCardsNeedingEvidence(
  cards: readonly SoundCandidateStudyCard[] = loadSoundCandidateStudyCards(),
): string[] {
  return cards
    .filter((card) => card.sourceEvidence.length === 0 || !candidateHasOwnerEvidence(card))
    .map((card) => card.externalToolId)
    .sort()
}

export function listSoundCandidateCardsEligibleForFutureRegistryExpansion(
  cards: readonly SoundCandidateStudyCard[] = loadSoundCandidateStudyCards(),
): string[] {
  return cards
    .filter((card) => (
      card.runtimeResolution.status === 'install_plan_only' &&
      card.ownerGateStatus === 'wait_for_sound_runtime_media_gate_1'
    ))
    .map((card) => card.externalToolId)
    .sort()
}

export function listSoundCandidateCardsBlockedByOwnerGate(
  cards: readonly SoundCandidateStudyCard[] = loadSoundCandidateStudyCards(),
): string[] {
  return cards
    .filter((card) => (
      card.runtimeResolution.status.startsWith('blocked_') ||
      card.ownerGateStatus === 'wait_for_model_weight_owner_review' ||
      card.ownerGateStatus === 'wait_for_media_policy_owner_handoff' ||
      card.ownerGateStatus === 'wait_for_license_provenance_review'
    ))
    .map((card) => card.externalToolId)
    .sort()
}

export function recommendSoundCandidateNextMilestones(
  cards: readonly SoundCandidateStudyCard[] = loadSoundCandidateStudyCards(),
): SoundCandidateRecommendation[] {
  const gate1Candidates = cards
    .filter((card) => card.ownerGateStatus === 'wait_for_sound_runtime_media_gate_1')
    .map((card) => card.externalToolId)
  const gate2Candidates = cards
    .filter((card) => card.ownerGateStatus === 'wait_for_model_weight_owner_review')
    .map((card) => card.externalToolId)
  const gate3Candidates = cards
    .filter((card) => card.ownerGateStatus === 'wait_for_media_policy_owner_handoff')
    .map((card) => card.externalToolId)

  return [
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-1',
      reason: 'CPU worker install-plan candidates need bounded owner install proof before tool-calling registry reconciliation.',
      candidateExternalToolIds: uniqueSorted(gate1Candidates),
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-2',
      reason: 'Model/provenance candidates need owner review before any runtime registry or execution planning.',
      candidateExternalToolIds: uniqueSorted(gate2Candidates),
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-3',
      reason: 'Media/file-open and manifest candidates need private media policy handoff before runtime expansion.',
      candidateExternalToolIds: uniqueSorted(gate3Candidates),
    },
    {
      milestone: 'REEDITPRO-TOOL-CALLING-SOUND-RUNTIME-GATE-1-RECONCILIATION',
      reason: 'After SOUND owner gates publish proof, reconcile candidate cards against future registry expansion without automatic promotion.',
      candidateExternalToolIds: uniqueSorted(cards.map((card) => card.externalToolId)),
    },
  ]
}

export function analyzeSoundCandidateStudyCards(): SoundCandidateStudyCardAnalysis {
  const cards = loadSoundCandidateStudyCards()
  const adapterToolIds = new Set<string>(listToolAdapterContracts().map((contract) => contract.toolId))
  const commandToolIds = new Set<string>(listCommandIntentPolicies().map((policy) => policy.toolId))
  const controlledProbeToolIds = new Set<string>(listControlledLowRiskProbePolicies().map((policy) => policy.toolId))
  const productionToolIdSet = new Set<string>(PRODUCTION_TOOL_IDS)
  const cardIds = cards.map((card) => card.externalToolId)
  const adapterContractsAdded = cardIds.filter((externalToolId) => adapterToolIds.has(externalToolId)).length
  const commandIntentsAdded = cardIds.filter((externalToolId) => commandToolIds.has(externalToolId)).length
  const controlledProbesAdded = cardIds.filter((externalToolId) => controlledProbeToolIds.has(externalToolId)).length
  const selectableCandidateCount = cards.filter((card) => card.selectableAsRuntimeTool).length

  if (selectableCandidateCount !== 0 || adapterContractsAdded !== 0 || commandIntentsAdded !== 0 || controlledProbesAdded !== 0) {
    throw new Error('Sound candidate study cards must remain non-selectable and must not gain adapters, command intents, or controlled probes.')
  }
  if (cardIds.some((externalToolId) => productionToolIdSet.has(externalToolId))) {
    throw new Error('Sound candidate study cards must not use first-class ProductionToolId values.')
  }

  const installPlanOnlyExternalToolIds = cards
    .filter((card) => card.runtimeResolution.status === 'install_plan_only')
    .map((card) => card.externalToolId)
  const ownerInventoryOnlyExternalToolIds = cards
    .filter((card) => card.runtimeResolution.status === 'owner_inventory_only')
    .map((card) => card.externalToolId)
  const blockedCandidateExternalToolIds = listSoundCandidateCardsBlockedByOwnerGate(cards)
  const futureRegistryEligibleExternalToolIds = listSoundCandidateCardsEligibleForFutureRegistryExpansion(cards)
  const evidenceNotFound = listSoundCandidateCardsNeedingEvidence(cards)

  return {
    candidateStudyCards: cards,
    candidateStudyCardCount: cards.length,
    evidenceNotFound,
    evidenceNotFoundCount: evidenceNotFound.length,
    blockedCandidateExternalToolIds,
    blockedCandidateCount: blockedCandidateExternalToolIds.length,
    installPlanOnlyExternalToolIds: uniqueSorted(installPlanOnlyExternalToolIds),
    installPlanOnlyCount: installPlanOnlyExternalToolIds.length,
    ownerInventoryOnlyExternalToolIds: uniqueSorted(ownerInventoryOnlyExternalToolIds),
    ownerInventoryOnlyCount: ownerInventoryOnlyExternalToolIds.length,
    futureRegistryEligibleExternalToolIds,
    futureRegistryEligibleCount: futureRegistryEligibleExternalToolIds.length,
    selectableCandidateCount: 0,
    adapterContractsAdded: 0,
    commandIntentsAdded: 0,
    controlledProbesAdded: 0,
    productionToolIdCount: PRODUCTION_TOOL_IDS.length,
    productionToolIdCountChanged: false,
    recommendedNextMilestones: recommendSoundCandidateNextMilestones(cards),
    safety: {
      executesTools: false,
      audioProcessingPerformed: false,
      mediaProcessingPerformed: false,
      workerExecutionPerformed: false,
      providerCallsPerformed: false,
      supabaseMutationPerformed: false,
      sqlExecuted: false,
      migrationsCreated: false,
      signedUrlsCreated: false,
      packageLockMutated: false,
      betaProductionUnlocked: false,
      duplicateSystemsCreated: false,
    },
  }
}
