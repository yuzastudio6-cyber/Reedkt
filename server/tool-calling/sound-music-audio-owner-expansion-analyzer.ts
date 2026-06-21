import {
  PRODUCTION_TOOL_IDS,
  listProductionToolProfiles,
} from '../tool-registry'
import type {
  ProductionToolId,
  ProductionToolProfile,
} from '../tool-registry'
import {
  listToolAdapterContracts,
} from './adapter-registry'
import {
  buildAllOwnerToolReconciliationMatrix,
} from './all-owner-stack-reconciliation-analyzer'
import {
  listControlledLowRiskProbePolicies,
} from './controlled-low-risk-execution-policy'
import {
  listFixtureBoundMetadataProbePolicies,
} from './fixture-bound-metadata-probe-policy'
import {
  listCommandIntentPolicies,
} from './safe-command-plan-policy'
import {
  listSyntheticFixtureDefinitions,
} from './synthetic-fixture-catalog'
import {
  listExplicitToolStudyCards,
} from './tool-capability-card-loader'
import {
  listRuntimeIdReconciliationResults,
} from './tool-runtime-id-aliases'
import {
  loadSoundMusicAudioOwnerSources,
} from './sound-music-audio-owner-expansion-loader'
import type {
  SoundExecutionGate,
  SoundInstallEvidenceStatus,
  SoundMusicAudioCategory,
  SoundMusicAudioCoverageAnalysis,
  SoundMusicAudioOwnerExpansionRow,
  SoundMusicAudioOwnerExpansionSeedRow,
  SoundMusicAudioRecommendation,
  SoundOwnerEvidenceStatus,
  SoundPendingAction,
} from './sound-music-audio-owner-expansion-types'
import type {
  UnmergedOwnerEvidenceItem,
} from './unmerged-owner-evidence-types'

const soundRelatedProductionCategories = new Set([
  'audio_cleanup',
  'audio_analysis',
  'music_separation',
  'speech_transcription',
])

const requiredCandidateAliases = [
  'soundfile_libsndfile',
  'soundfile',
  'libsndfile',
  'sox',
  'aubio',
  'mmaudio',
  'pydub',
  'audioread',
  'pyloudnorm',
  'basic_pitch',
  'crepe',
  'torchcrepe',
  'spleeter',
  'open_unmix',
  'asteroid',
  'speechbrain_enhancement',
  'sfx_director',
  'soundsync',
  'sound_cue_manifest_tools',
  'music_ducking_loudness_qa_planning',
]

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right))
}

function rowMatchesTool(row: SoundMusicAudioOwnerExpansionRow, toolId: string): boolean {
  return row.normalizedToolId === toolId || row.productionToolId === toolId || row.aliases.includes(toolId)
}

function profileForToolId(toolId: string, profiles: readonly ProductionToolProfile[]): ProductionToolProfile | undefined {
  return profiles.find((profile) => profile.toolId === toolId)
}

function soundCategoryForProfile(profile: ProductionToolProfile): SoundMusicAudioCategory {
  if (profile.category === 'audio_cleanup') return 'audio_cleanup'
  if (profile.category === 'music_separation') return 'stem_separation'
  if (profile.category === 'speech_transcription') return 'speech_audio_support'
  if (profile.toolId === 'signalsmith_stretch' || profile.toolId === 'soundtouch' || profile.toolId === 'rubber_band') return 'time_stretch'
  if (profile.category === 'audio_analysis') return 'audio_analysis'

  return 'unknown_or_pending'
}

function statusesForProfile(profile: ProductionToolProfile): SoundOwnerEvidenceStatus[] {
  const statuses: SoundOwnerEvidenceStatus[] = ['first_class_production_tool_id']
  if (profile.modelWeightsRequired) statuses.push('blocked_pending_model_weight')
  if (profile.productionStatus === 'needs_license_review') statuses.push('blocked_pending_license')
  if (profile.productionStatus === 'evaluation_only' || profile.productionStatus === 'blocked') statuses.push('blocked_pending_runtime_gate')

  return uniqueSorted(statuses)
}

function gateForProfile(profile: ProductionToolProfile, seedGate: SoundExecutionGate): SoundExecutionGate {
  if (profile.modelWeightsRequired) return 'blocked_pending_model_review'
  if (profile.productionStatus === 'needs_license_review') return 'blocked_pending_license'
  if (profile.productionStatus === 'evaluation_only' || profile.productionStatus === 'blocked') return 'blocked_no_execution'

  return seedGate
}

function pendingActionForRow(input: {
  row: SoundMusicAudioOwnerExpansionRow
  profile?: ProductionToolProfile
  hasStudyCard: boolean
  hasAdapterContract: boolean
}): SoundPendingAction {
  if (input.row.duplicateRisk === 'wait_for_unmerged_owner_pr') return 'do_not_duplicate_owner_lane'
  if (input.row.executionGate === 'blocked_pending_model_review') return 'wait_for_model_weight_owner_review'
  if (input.row.executionGate === 'blocked_pending_media_policy') return 'wait_for_media_policy_owner_handoff'
  if (input.row.executionGate === 'blocked_pending_license') return 'wait_for_license_provenance_review'
  if (input.row.executionGate === 'blocked_pending_cpu_worker_install_plan') return 'wait_for_sound_runtime_media_gate_1'
  if (!input.profile && input.row.ownerEvidenceStatus.includes('blocked_pending_registry_expansion')) return 'add_runtime_registry_id'
  if (input.profile && !input.hasStudyCard) return 'add_tool_calling_study_card'
  if (input.profile && !input.hasAdapterContract) return 'add_adapter_contract'

  return input.row.pendingAction
}

function mergeRow(
  seed: SoundMusicAudioOwnerExpansionSeedRow,
  overlay: Partial<SoundMusicAudioOwnerExpansionRow>,
): SoundMusicAudioOwnerExpansionRow {
  return {
    ...seed,
    ...overlay,
    ownerEvidenceStatus: uniqueSorted([
      ...seed.ownerEvidenceStatus,
      ...(overlay.ownerEvidenceStatus ?? []),
    ]) as SoundOwnerEvidenceStatus[],
    sourceEvidence: uniqueSorted([
      ...seed.sourceEvidence,
      ...(overlay.sourceEvidence ?? []),
    ]),
    packageNames: uniqueSorted([
      ...seed.packageNames,
      ...(overlay.packageNames ?? []),
    ]),
    aliases: uniqueSorted([
      ...seed.aliases,
      ...(overlay.aliases ?? []),
    ]),
    currentToolCallingCoverage: {
      hasStudyCard: seed.currentToolCallingCoverage.hasStudyCard || overlay.currentToolCallingCoverage?.hasStudyCard === true,
      hasAdapterContract: seed.currentToolCallingCoverage.hasAdapterContract || overlay.currentToolCallingCoverage?.hasAdapterContract === true,
      hasSafeCommandIntent: seed.currentToolCallingCoverage.hasSafeCommandIntent || overlay.currentToolCallingCoverage?.hasSafeCommandIntent === true,
      hasFixturePlan: seed.currentToolCallingCoverage.hasFixturePlan || overlay.currentToolCallingCoverage?.hasFixturePlan === true,
      hasControlledProbe: seed.currentToolCallingCoverage.hasControlledProbe || overlay.currentToolCallingCoverage?.hasControlledProbe === true,
      hasFixtureBoundProbe: seed.currentToolCallingCoverage.hasFixtureBoundProbe || overlay.currentToolCallingCoverage?.hasFixtureBoundProbe === true,
    },
    unmergedOwnerEvidenceRefs: uniqueSorted(overlay.unmergedOwnerEvidenceRefs ?? []),
  }
}

function defaultSeedForProfile(profile: ProductionToolProfile): SoundMusicAudioOwnerExpansionSeedRow {
  return {
    normalizedToolId: profile.toolId,
    displayName: profile.displayName,
    soundCategory: soundCategoryForProfile(profile),
    ownerEvidenceStatus: statusesForProfile(profile),
    sourceEvidence: ['server/tool-registry/production-tool-profiles.ts'],
    productionToolId: profile.toolId,
    packageNames: [],
    aliases: [profile.toolId],
    currentToolCallingCoverage: {
      hasStudyCard: false,
      hasAdapterContract: false,
      hasSafeCommandIntent: false,
      hasFixturePlan: false,
      hasControlledProbe: false,
      hasFixtureBoundProbe: false,
    },
    selectableAsRuntimeTool: false,
    installEvidenceStatus: 'owner_inventory_only',
    executionGate: gateForProfile(profile, 'blocked_pending_cpu_worker_install_plan'),
    pendingAction: profile.modelWeightsRequired ? 'wait_for_model_weight_owner_review' : 'wait_for_sound_runtime_media_gate_1',
    duplicateRisk: 'none',
    notes: 'Generated from first-class registry evidence because the SOUND matrix did not contain a seed row.',
  }
}

function installEvidenceForRow(row: SoundMusicAudioOwnerExpansionRow): SoundInstallEvidenceStatus {
  if (row.installEvidenceStatus === 'requirements_pinned') return 'requirements_pinned'
  if (row.ownerEvidenceStatus.includes('approved_install_plan_only')) return 'install_plan_only'
  if (row.productionToolId && row.installEvidenceStatus !== 'not_declared') return row.installEvidenceStatus

  return row.installEvidenceStatus
}

function selectableForRow(row: SoundMusicAudioOwnerExpansionRow, profile?: ProductionToolProfile): boolean {
  if (!profile) return false
  if (row.executionGate.startsWith('blocked_')) return false
  if (profile.productionStatus === 'blocked' || profile.productionStatus === 'evaluation_only') return false
  if (profile.modelWeightsRequired) return false

  return row.selectableAsRuntimeTool
}

function unmergedRefsForTool(toolId: string, evidence: readonly UnmergedOwnerEvidenceItem[]): string[] {
  return evidence
    .filter((item) => item.affectedTools.includes(toolId))
    .map((item) => `#${item.prNumber}:${item.headBranch}`)
}

export function buildSoundMusicAudioOwnerExpansionMatrix(
  unmergedOwnerEvidence: readonly UnmergedOwnerEvidenceItem[] = [],
): SoundMusicAudioOwnerExpansionRow[] {
  const sourceBundle = loadSoundMusicAudioOwnerSources()
  const profiles = listProductionToolProfiles()
  const soundProfiles = profiles.filter((profile) => soundRelatedProductionCategories.has(profile.category))
  const studyToolIds = new Set<string>(
    listExplicitToolStudyCards()
      .map((card) => card.toolId)
      .filter((toolId): toolId is ProductionToolId => Boolean(toolId)),
  )
  const adapterToolIds = new Set<string>(listToolAdapterContracts().map((contract) => contract.toolId))
  const commandToolIds = new Set<string>(listCommandIntentPolicies().map((policy) => policy.toolId))
  const fixtureToolIds = new Set<string>(listSyntheticFixtureDefinitions().flatMap((fixture) => fixture.applicableToolIds))
  const controlledProbeToolIds = new Set<string>(listControlledLowRiskProbePolicies().map((policy) => policy.toolId))
  const fixtureBoundProbeToolIds = new Set<string>(listFixtureBoundMetadataProbePolicies().map((policy) => policy.toolId))
  const runtimeAliasResults = listRuntimeIdReconciliationResults()
  const allOwnerRows = buildAllOwnerToolReconciliationMatrix(unmergedOwnerEvidence)
  const rowsById = new Map<string, SoundMusicAudioOwnerExpansionRow>()

  for (const seed of sourceBundle.matrixDocument.rows) {
    const matchedProfile = seed.productionToolId
      ? profileForToolId(seed.productionToolId, profiles)
      : profiles.find((profile) => seed.normalizedToolId === profile.toolId || seed.aliases.includes(profile.toolId))
    const allOwner = allOwnerRows.find((row) => rowMatchesTool(mergeRow(seed, {}), row.normalizedToolId))
    const profile = matchedProfile
    const toolId = profile?.toolId ?? seed.productionToolId ?? seed.normalizedToolId
    const aliasEvidence = runtimeAliasResults
      .filter((result) => result.inputToolId === toolId || result.toolId === toolId || seed.aliases.includes(result.inputToolId))
      .flatMap((result) => [result.inputToolId, ...result.aliases])
    const gate = profile ? gateForProfile(profile, seed.executionGate) : seed.executionGate
    const overlay = mergeRow(seed, {
      productionToolId: profile?.toolId ?? seed.productionToolId,
      soundCategory: profile ? soundCategoryForProfile(profile) : seed.soundCategory,
      ownerEvidenceStatus: [
        ...(profile ? statusesForProfile(profile) : []),
        ...(studyToolIds.has(toolId as ProductionToolId) ? ['explicit_tool_calling_study_card' as const] : []),
        ...(adapterToolIds.has(toolId as ProductionToolId) ? ['planning_only_adapter_contract' as const] : []),
      ],
      sourceEvidence: [
        ...(profile ? ['server/tool-registry/production-tool-profiles.ts'] : []),
        ...(allOwner ? ['docs/tool-calling/all-owner-stack-reconciliation-matrix.json'] : []),
      ],
      aliases: aliasEvidence,
      currentToolCallingCoverage: {
        hasStudyCard: studyToolIds.has(toolId as ProductionToolId),
        hasAdapterContract: adapterToolIds.has(toolId as ProductionToolId),
        hasSafeCommandIntent: commandToolIds.has(toolId),
        hasFixturePlan: fixtureToolIds.has(toolId),
        hasControlledProbe: controlledProbeToolIds.has(toolId),
        hasFixtureBoundProbe: fixtureBoundProbeToolIds.has(toolId),
      },
      installEvidenceStatus: seed.installEvidenceStatus,
      executionGate: gate,
      unmergedOwnerEvidenceRefs: unmergedRefsForTool(seed.normalizedToolId, unmergedOwnerEvidence),
    })
    const row = {
      ...overlay,
      installEvidenceStatus: installEvidenceForRow(overlay),
      selectableAsRuntimeTool: selectableForRow(overlay, profile),
      pendingAction: pendingActionForRow({
        row: overlay,
        profile,
        hasStudyCard: overlay.currentToolCallingCoverage.hasStudyCard,
        hasAdapterContract: overlay.currentToolCallingCoverage.hasAdapterContract,
      }),
    }
    rowsById.set(row.normalizedToolId, row)
  }

  for (const profile of soundProfiles) {
    if ([...rowsById.values()].some((row) => rowMatchesTool(row, profile.toolId))) continue
    const seed = defaultSeedForProfile(profile)
    const row = mergeRow(seed, {
      currentToolCallingCoverage: {
        hasStudyCard: studyToolIds.has(profile.toolId),
        hasAdapterContract: adapterToolIds.has(profile.toolId),
        hasSafeCommandIntent: commandToolIds.has(profile.toolId),
        hasFixturePlan: fixtureToolIds.has(profile.toolId),
        hasControlledProbe: controlledProbeToolIds.has(profile.toolId),
        hasFixtureBoundProbe: fixtureBoundProbeToolIds.has(profile.toolId),
      },
      ownerEvidenceStatus: [
        ...(studyToolIds.has(profile.toolId) ? ['explicit_tool_calling_study_card' as const] : []),
        ...(adapterToolIds.has(profile.toolId) ? ['planning_only_adapter_contract' as const] : []),
      ],
    })
    rowsById.set(row.normalizedToolId, {
      ...row,
      selectableAsRuntimeTool: selectableForRow(row, profile),
      pendingAction: pendingActionForRow({
        row,
        profile,
        hasStudyCard: row.currentToolCallingCoverage.hasStudyCard,
        hasAdapterContract: row.currentToolCallingCoverage.hasAdapterContract,
      }),
    })
  }

  return [...rowsById.values()].sort((left, right) => left.normalizedToolId.localeCompare(right.normalizedToolId))
}

export function listSoundToolsNeedingStudyCards(): string[] {
  return buildSoundMusicAudioOwnerExpansionMatrix()
    .filter((row) => row.productionToolId && !row.currentToolCallingCoverage.hasStudyCard)
    .map((row) => row.normalizedToolId)
    .sort()
}

export function listSoundToolsNeedingRuntimeRegistryIds(): string[] {
  return buildSoundMusicAudioOwnerExpansionMatrix()
    .filter((row) => !row.productionToolId && row.pendingAction === 'add_runtime_registry_id')
    .map((row) => row.normalizedToolId)
    .sort()
}

export function listSoundToolsBlockedByOwnerGate(): string[] {
  return buildSoundMusicAudioOwnerExpansionMatrix()
    .filter((row) => row.executionGate.startsWith('blocked_') || row.ownerEvidenceStatus.some((status) => status.startsWith('blocked_')))
    .map((row) => row.normalizedToolId)
    .sort()
}

export function listSoundToolsEligibleForFutureRegistryExpansion(): string[] {
  return buildSoundMusicAudioOwnerExpansionMatrix()
    .filter((row) => (
      !row.productionToolId &&
      row.ownerEvidenceStatus.includes('approved_install_plan_only') &&
      (row.installEvidenceStatus === 'requirements_pinned' || row.installEvidenceStatus === 'install_plan_only') &&
      row.executionGate === 'blocked_pending_cpu_worker_install_plan'
    ))
    .map((row) => row.normalizedToolId)
    .sort()
}

export function recommendSoundMusicAudioNextMilestones(): SoundMusicAudioRecommendation[] {
  const rows = buildSoundMusicAudioOwnerExpansionMatrix()
  const eligible = listSoundToolsEligibleForFutureRegistryExpansion()
  const modelBlocked = rows
    .filter((row) => row.executionGate === 'blocked_pending_model_review')
    .map((row) => row.normalizedToolId)
  const mediaBlocked = rows
    .filter((row) => row.executionGate === 'blocked_pending_media_policy')
    .map((row) => row.normalizedToolId)

  return [
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-1',
      reason: 'SOUND owner lane should produce the CPU worker install plan before tool-calling promotes owner-inventory or install-plan-only tools.',
      candidateToolIds: eligible,
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-2',
      reason: 'Model-weight and provenance-sensitive audio tools remain blocked until owner review clears download, storage, and execution policy.',
      candidateToolIds: uniqueSorted(modelBlocked),
    },
    {
      milestone: 'SOUND-RUNTIME-MEDIA-GATE-3',
      reason: 'Media file-open, FFmpeg/ffprobe, pydub, preview/export, and private manifest policy must be handed off before media execution.',
      candidateToolIds: uniqueSorted(mediaBlocked),
    },
    {
      milestone: 'REEDITPRO-TOOL-CALLING-SOUND-OWNER-CANDIDATE-STUDY-CARDS-1',
      reason: 'After SOUND owner install evidence is current, tool-calling can add planning-only study cards for eligible owner candidates without registry promotion.',
      candidateToolIds: eligible,
    },
  ]
}

export function analyzeSoundMusicAudioToolCallingCoverage(): SoundMusicAudioCoverageAnalysis {
  const rows = buildSoundMusicAudioOwnerExpansionMatrix()
  const sourceBundle = loadSoundMusicAudioOwnerSources()
  const firstClassSoundToolCount = rows.filter((row) => row.productionToolId && PRODUCTION_TOOL_IDS.includes(row.productionToolId)).length
  const ownerInventoryOnlyCount = rows.filter((row) => row.installEvidenceStatus === 'owner_inventory_only').length
  const installPlanOnlyCount = rows.filter((row) => row.installEvidenceStatus === 'install_plan_only' || row.installEvidenceStatus === 'requirements_pinned').length
  const blockedRows = rows.filter((row) => row.executionGate.startsWith('blocked_') || row.ownerEvidenceStatus.some((status) => status.startsWith('blocked_')))
  const toolsNeedingRegistryExpansion = listSoundToolsNeedingRuntimeRegistryIds()
  const toolsNeedingStudyCards = listSoundToolsNeedingStudyCards()
  const toolsEligibleForFutureRegistryExpansion = listSoundToolsEligibleForFutureRegistryExpansion()
  const duplicateRiskCount = rows.filter((row) => row.duplicateRisk !== 'none').length
  const candidateToolsMissingFromMatrix = requiredCandidateAliases.filter((toolId) => !rows.some((row) => rowMatchesTool(row, toolId)))

  return {
    matrixRows: rows,
    soundMatrixRows: rows.length,
    firstClassSoundToolCount,
    ownerInventoryOnlyCount,
    installPlanOnlyCount,
    blockedSoundToolCount: blockedRows.length,
    toolsNeedingRegistryExpansion,
    toolsNeedingRegistryExpansionCount: toolsNeedingRegistryExpansion.length,
    toolsNeedingStudyCards,
    toolsNeedingStudyCardsCount: toolsNeedingStudyCards.length,
    toolsEligibleForFutureRegistryExpansion,
    recommendedNextMilestones: recommendSoundMusicAudioNextMilestones(),
    githubPrScanAvailable: sourceBundle.matrixDocument.evidenceSummary.githubPrScanAvailable,
    duplicateRiskCount,
    candidateToolsMissingFromMatrix,
    safety: {
      executesTools: false,
      audioProcessingPerformed: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      sqlExecuted: false,
      duplicateSystemsCreated: false,
    },
  }
}
