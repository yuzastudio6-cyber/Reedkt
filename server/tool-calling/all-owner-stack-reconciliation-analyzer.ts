import {
  PRODUCTION_TOOL_IDS,
  listProductionToolProfiles,
} from '../tool-registry'
import type {
  ProductionToolCategory,
  ProductionToolId,
  ProductionToolProfile,
  ProductionToolStatus,
} from '../tool-registry'
import {
  listExplicitToolStudyCards,
  listExpandedToolCapabilityCards,
} from './tool-capability-card-loader'
import {
  listToolAdapterContracts,
} from './adapter-registry'
import {
  listCommandIntentPolicies,
} from './safe-command-plan-policy'
import {
  listSyntheticFixtureDefinitions,
} from './synthetic-fixture-catalog'
import {
  listControlledLowRiskProbePolicies,
} from './controlled-low-risk-execution-policy'
import {
  listFixtureBoundMetadataProbePolicies,
} from './fixture-bound-metadata-probe-policy'
import {
  listRuntimeIdReconciliationResults,
} from './tool-runtime-id-aliases'
import {
  loadAllOwnerReconciliationSources,
} from './all-owner-stack-reconciliation-loader'
import type {
  AllOwnerCoverageAnalysis,
  AllOwnerCurrentRepoStatus,
  AllOwnerDuplicateRisk,
  AllOwnerPendingAction,
  AllOwnerRecommendedMilestone,
  AllOwnerReconciliationDuplicateRiskFinding,
  AllOwnerToolLane,
  AllOwnerToolReconciliationRow,
  AllOwnerToolReconciliationSeedRow,
} from './all-owner-stack-reconciliation-types'
import type {
  ToolCallingOperationId,
} from './operation-ontology'
import type {
  UnmergedOwnerEvidenceItem,
  UnmergedOwnerEvidenceLane,
} from './unmerged-owner-evidence-types'

function uniqueSorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right))
}

function arrayOrEmpty<T>(values: readonly T[] | undefined): readonly T[] {
  return values ?? []
}

const ownerLabelAliasesByToolId: Readonly<Record<string, readonly string[]>> = {
  babylon_js: ['babylonjs'],
  hyperframe: ['hyperframe_render_handoff'],
  lottie: ['lottie_web'],
  pixijs: ['pixi_js'],
  playwright: ['playwright_chromium'],
  revideo: ['revideo_render_preview_alternative'],
  vapoursynth: ['vapoursynth_frame_pipeline'],
}

function laneForCategory(category: ProductionToolCategory): AllOwnerToolLane {
  if (
    category === 'core_media' ||
    category === 'visual_analysis' ||
    category === 'scene_detection' ||
    category === 'ocr' ||
    category === 'color_management' ||
    category === 'image_processing'
  ) {
    return 'track_b_media'
  }
  if (
    category === 'timeline' ||
    category === 'render_composition' ||
    category === 'captions' ||
    category === 'frame_interpolation' ||
    category === 'evaluation'
  ) {
    return 'track_a_render_export'
  }
  if (
    category === 'audio_cleanup' ||
    category === 'audio_analysis' ||
    category === 'music_separation' ||
    category === 'speech_transcription'
  ) {
    return 'sound_music_audio'
  }
  if (
    category === 'background_removal' ||
    category === 'segmentation_tracking' ||
    category === 'mask_refinement' ||
    category === 'enhancement' ||
    category === 'motion_graphics' ||
    category === 'charts_dataviz'
  ) {
    return 'ai_graphics'
  }
  if (category === 'browser_capture') return 'web_capture'
  if (category === 'maps_geospatial') return 'map_geospatial'

  return 'unknown_or_pending'
}

function laneForUnmergedOwnerLane(ownerLane: UnmergedOwnerEvidenceLane): AllOwnerToolLane {
  if (ownerLane === 'track_b_media_oss') return 'track_b_media'
  if (ownerLane === 'track_a_render_export_native_container') return 'track_a_render_export'
  if (ownerLane === 'ai_graphics_static_motion_chart_model_tools') return 'ai_graphics'
  if (ownerLane === 'sound_music_audio_sfx_soundsync') return 'sound_music_audio'
  if (ownerLane === 'web_capture') return 'web_capture'
  if (ownerLane === 'map_geospatial') return 'map_geospatial'
  if (ownerLane === 'worker_runtime') return 'worker_runtime'
  if (ownerLane === 'tool_calling') return 'tool_calling_overlay'

  return 'unknown_or_pending'
}

function statusesForProfile(profile: ProductionToolProfile): AllOwnerCurrentRepoStatus[] {
  const statuses: AllOwnerCurrentRepoStatus[] = ['first_class_production_tool_id']
  if (profile.productionStatus === 'evaluation_only') statuses.push('evaluation_only')
  if (profile.productionStatus === 'needs_license_review') statuses.push('blocked_pending_license')
  if (profile.productionStatus === 'blocked') statuses.push('blocked_pending_runtime_lane')
  if (profile.modelWeightsRequired) statuses.push('blocked_pending_model_weight')

  return uniqueSorted(statuses)
}

function selectableForStatus(status: ProductionToolStatus): boolean {
  return status !== 'blocked' && status !== 'evaluation_only'
}

function pendingActionForRow(input: {
  firstClass: boolean
  hasStudy: boolean
  hasAdapter: boolean
  modelWeightsRequired: boolean
  productionStatus?: ProductionToolStatus
  seedPendingAction: AllOwnerPendingAction
  duplicateRisk: AllOwnerDuplicateRisk
}): AllOwnerPendingAction {
  if (input.duplicateRisk === 'existing_owner_work_in_progress' || input.duplicateRisk === 'wait_for_unmerged_owner_pr') {
    return 'wait_for_unmerged_owner_pr'
  }
  if (input.productionStatus === 'blocked' || input.productionStatus === 'evaluation_only') return 'wait_for_worker_runtime_gate'
  if (input.modelWeightsRequired) return 'wait_for_model_weight_review'
  if (input.productionStatus === 'needs_license_review') return 'wait_for_license_review'
  if (!input.firstClass) return input.seedPendingAction === 'none' ? 'add_production_tool_registry_id' : input.seedPendingAction
  if (!input.hasStudy) return 'add_tool_calling_study_card'
  if (!input.hasAdapter) return 'add_adapter_contract'

  return 'none'
}

function defaultSeedForProfile(profile: ProductionToolProfile): AllOwnerToolReconciliationSeedRow {
  return {
    normalizedToolId: profile.toolId,
    displayName: profile.displayName,
    ownerLane: laneForCategory(profile.category),
    sourceEvidence: ['server/tool-registry/production-tool-profiles.ts'],
    currentRepoStatus: statusesForProfile(profile),
    productionToolId: profile.toolId,
    aliases: [profile.toolId],
    packageNames: [],
    dockerEvidence: [],
    requirementsEvidence: [],
    packageJsonEvidence: [],
    proofEvidence: ['ProductionToolProfile is the current first-class registry evidence.'],
    runtimeEvidence: arrayOrEmpty(profile.runtimeNotes),
    operationCoverage: [],
    hasToolCallingStudyCard: false,
    hasAdapterContract: false,
    hasSafeCommandIntent: false,
    hasFixturePlan: false,
    hasDryRunFixture: false,
    hasBinaryFixturePlan: false,
    hasControlledReadinessProbe: false,
    hasFixtureBoundProbe: false,
    selectableAsRuntimeTool: selectableForStatus(profile.productionStatus),
    pendingAction: 'none',
    duplicateRisk: 'none',
    notes: 'Generated from live server/tool-registry metadata by all-owner reconciliation.',
  }
}

function mergeRows(
  seed: AllOwnerToolReconciliationRow | AllOwnerToolReconciliationSeedRow,
  overlay: Partial<AllOwnerToolReconciliationRow>,
): AllOwnerToolReconciliationRow {
  return {
    ...seed,
    ...overlay,
    sourceEvidence: uniqueSorted([...seed.sourceEvidence, ...(overlay.sourceEvidence ?? [])]),
    currentRepoStatus: uniqueSorted([...seed.currentRepoStatus, ...(overlay.currentRepoStatus ?? [])]) as AllOwnerCurrentRepoStatus[],
    aliases: uniqueSorted([...seed.aliases, ...(overlay.aliases ?? [])]),
    packageNames: uniqueSorted([...seed.packageNames, ...(overlay.packageNames ?? [])]),
    dockerEvidence: uniqueSorted([...seed.dockerEvidence, ...(overlay.dockerEvidence ?? [])]),
    requirementsEvidence: uniqueSorted([...seed.requirementsEvidence, ...(overlay.requirementsEvidence ?? [])]),
    packageJsonEvidence: uniqueSorted([...seed.packageJsonEvidence, ...(overlay.packageJsonEvidence ?? [])]),
    proofEvidence: uniqueSorted([...seed.proofEvidence, ...(overlay.proofEvidence ?? [])]),
    runtimeEvidence: uniqueSorted([...seed.runtimeEvidence, ...(overlay.runtimeEvidence ?? [])]),
    operationCoverage: uniqueSorted([...seed.operationCoverage, ...(overlay.operationCoverage ?? [])]) as ToolCallingOperationId[],
    hasToolCallingStudyCard: seed.hasToolCallingStudyCard || overlay.hasToolCallingStudyCard === true,
    hasAdapterContract: seed.hasAdapterContract || overlay.hasAdapterContract === true,
    hasSafeCommandIntent: seed.hasSafeCommandIntent || overlay.hasSafeCommandIntent === true,
    hasFixturePlan: seed.hasFixturePlan || overlay.hasFixturePlan === true,
    hasDryRunFixture: seed.hasDryRunFixture || overlay.hasDryRunFixture === true,
    hasBinaryFixturePlan: seed.hasBinaryFixturePlan || overlay.hasBinaryFixturePlan === true,
    hasControlledReadinessProbe: seed.hasControlledReadinessProbe || overlay.hasControlledReadinessProbe === true,
    hasFixtureBoundProbe: seed.hasFixtureBoundProbe || overlay.hasFixtureBoundProbe === true,
    unmergedOwnerEvidenceRefs: uniqueSorted([
      ...('unmergedOwnerEvidenceRefs' in seed ? seed.unmergedOwnerEvidenceRefs : []),
      ...(overlay.unmergedOwnerEvidenceRefs ?? []),
    ]),
  }
}

function addOrMergeRow(
  rowsById: Map<string, AllOwnerToolReconciliationRow>,
  seed: AllOwnerToolReconciliationSeedRow,
  overlay: Partial<AllOwnerToolReconciliationRow> = {},
): void {
  const existing = rowsById.get(seed.normalizedToolId)
  rowsById.set(seed.normalizedToolId, existing ? mergeRows(existing, overlay) : mergeRows(seed, overlay))
}

function rowMatchesTool(row: AllOwnerToolReconciliationRow, toolId: string): boolean {
  return row.normalizedToolId === toolId || row.productionToolId === toolId || row.aliases.includes(toolId)
}

function duplicateRiskFromUnmergedEvidence(evidence: readonly UnmergedOwnerEvidenceItem[]): Map<string, {
  refs: string[]
  duplicateRisk: AllOwnerDuplicateRisk
  pendingAction: AllOwnerPendingAction
}> {
  const riskByTool = new Map<string, {
    refs: string[]
    duplicateRisk: AllOwnerDuplicateRisk
    pendingAction: AllOwnerPendingAction
  }>()

  for (const item of evidence) {
    if (item.sourceTruthStatus !== 'open_pr_candidate_evidence') continue
    for (const toolId of item.affectedTools) {
      const current = riskByTool.get(toolId) ?? {
        refs: [],
        duplicateRisk: 'none' as AllOwnerDuplicateRisk,
        pendingAction: 'none' as AllOwnerPendingAction,
      }
      current.refs.push(`#${item.prNumber}:${item.headBranch}`)
      current.duplicateRisk = item.duplicateRisk === 'wait_for_owner_merge'
        ? 'wait_for_unmerged_owner_pr'
        : 'existing_owner_work_in_progress'
      current.pendingAction = item.recommendedAction === 'wait_for_merge' || item.recommendedAction === 'do_not_duplicate'
        ? 'wait_for_unmerged_owner_pr'
        : 'do_not_duplicate_owner_lane'
      riskByTool.set(toolId, current)
    }
  }

  return riskByTool
}

export function buildAllOwnerToolReconciliationMatrix(
  unmergedOwnerEvidence: readonly UnmergedOwnerEvidenceItem[] = [],
): AllOwnerToolReconciliationRow[] {
  const sourceBundle = loadAllOwnerReconciliationSources(unmergedOwnerEvidence)
  const profiles = listProductionToolProfiles()
  const studyCards = listExplicitToolStudyCards()
  const studyCardByToolId = new Map(studyCards.filter((card) => card.toolId).map((card) => [card.toolId as ProductionToolId, card]))
  const capabilityCardByToolId = new Map(listExpandedToolCapabilityCards().filter((card) => 'toolId' in card).map((card) => [card.toolId, card]))
  const adapterToolIds = new Set(listToolAdapterContracts().map((contract) => contract.toolId))
  const commandToolIds = new Set<string>(listCommandIntentPolicies().map((policy) => policy.toolId))
  const fixtureToolIds = new Set<string>(listSyntheticFixtureDefinitions().flatMap((fixture) => fixture.applicableToolIds))
  const controlledProbeToolIds = new Set<string>(listControlledLowRiskProbePolicies().map((policy) => policy.toolId))
  const fixtureBoundProbeToolIds = new Set<string>(listFixtureBoundMetadataProbePolicies().map((policy) => policy.toolId))
  const aliasResults = listRuntimeIdReconciliationResults()
  const duplicateRiskByTool = duplicateRiskFromUnmergedEvidence(unmergedOwnerEvidence)
  const rowsById = new Map<string, AllOwnerToolReconciliationRow>()

  for (const seed of sourceBundle.seedDocument.rows) {
    addOrMergeRow(rowsById, seed)
  }

  for (const profile of profiles) {
    const seed = sourceBundle.seedDocument.rows.find((row) => row.normalizedToolId === profile.toolId) ?? defaultSeedForProfile(profile)
    const studyCard = studyCardByToolId.get(profile.toolId)
    const capabilityCard = capabilityCardByToolId.get(profile.toolId)
    const aliasEvidence = aliasResults
      .filter((result) => result.toolId === profile.toolId || result.inputToolId === profile.toolId)
      .flatMap((result) => [result.inputToolId, ...result.aliases])
    const duplicateRisk = duplicateRiskByTool.get(profile.toolId)
    const currentRepoStatus: AllOwnerCurrentRepoStatus[] = [
      ...statusesForProfile(profile),
      ...(studyCard ? ['explicit_tool_calling_study_card' as const] : []),
      ...(capabilityCard?.capabilitySource === 'generated_registry_profile' ? ['generated_registry_card_only' as const] : []),
      ...(controlledProbeToolIds.has(profile.toolId) ? ['controlled_probe_unavailable' as const] : []),
      ...(fixtureBoundProbeToolIds.has(profile.toolId) ? ['fixture_bound_probe_passed' as const] : []),
    ]
    const rowDuplicateRisk = duplicateRisk?.duplicateRisk ?? seed.duplicateRisk
    const pendingAction = pendingActionForRow({
      firstClass: true,
      hasStudy: Boolean(studyCard),
      hasAdapter: adapterToolIds.has(profile.toolId),
      modelWeightsRequired: profile.modelWeightsRequired,
      productionStatus: profile.productionStatus,
      seedPendingAction: seed.pendingAction,
      duplicateRisk: rowDuplicateRisk,
    })

    addOrMergeRow(rowsById, seed, {
      productionToolId: profile.toolId,
      ownerLane: laneForCategory(profile.category),
      sourceEvidence: [
        'server/tool-registry/production-tool-profiles.ts',
        ...(studyCard?.sourceEvidence?.map((evidence) => evidence.sourcePath) ?? []),
      ],
      currentRepoStatus,
      aliases: [
        profile.toolId,
        ...aliasEvidence,
        ...(studyCard?.aliases ?? []),
        ...(ownerLabelAliasesByToolId[profile.toolId] ?? []),
      ],
      packageNames: [],
      packageJsonEvidence: [],
      proofEvidence: [
        ...(studyCard?.sourceEvidence?.map((evidence) => evidence.summary) ?? []),
        'First-class ProductionToolProfile is present on the current base.',
      ],
      runtimeEvidence: arrayOrEmpty(profile.runtimeNotes),
      operationCoverage: [
        ...(capabilityCard?.operations ?? []),
        ...(studyCard?.operations.map((operation) => operation.operationId) ?? []),
      ],
      hasToolCallingStudyCard: Boolean(studyCard),
      hasAdapterContract: adapterToolIds.has(profile.toolId),
      hasSafeCommandIntent: commandToolIds.has(profile.toolId),
      hasFixturePlan: fixtureToolIds.has(profile.toolId),
      hasDryRunFixture: fixtureToolIds.has(profile.toolId),
      hasBinaryFixturePlan: fixtureToolIds.has(profile.toolId),
      hasControlledReadinessProbe: controlledProbeToolIds.has(profile.toolId),
      hasFixtureBoundProbe: fixtureBoundProbeToolIds.has(profile.toolId),
      selectableAsRuntimeTool: selectableForStatus(profile.productionStatus),
      pendingAction,
      duplicateRisk: rowDuplicateRisk,
      unmergedOwnerEvidenceRefs: duplicateRisk?.refs ?? [],
    })
  }

  for (const item of unmergedOwnerEvidence) {
    for (const toolId of item.affectedTools) {
      const matchingRow = [...rowsById.values()].find((row) => rowMatchesTool(row, toolId))
      if (!matchingRow) continue
      addOrMergeRow(rowsById, matchingRow, {
        ownerLane: matchingRow.ownerLane === 'unknown_or_pending'
          ? laneForUnmergedOwnerLane(item.ownerLane)
          : matchingRow.ownerLane,
        sourceEvidence: [`PR #${item.prNumber}`],
        unmergedOwnerEvidenceRefs: [`#${item.prNumber}:${item.headBranch}`],
        duplicateRisk: item.duplicateRisk === 'none'
          ? matchingRow.duplicateRisk
          : item.duplicateRisk === 'wait_for_owner_merge'
            ? 'wait_for_unmerged_owner_pr'
            : 'existing_owner_work_in_progress',
        pendingAction: item.recommendedAction === 'wait_for_merge'
          ? 'wait_for_unmerged_owner_pr'
          : matchingRow.pendingAction,
      })
    }
  }

  return [...rowsById.values()].sort((left, right) => left.normalizedToolId.localeCompare(right.normalizedToolId))
}

export function listToolsNeedingToolCallingStudyCards(
  matrixRows: readonly AllOwnerToolReconciliationRow[] = buildAllOwnerToolReconciliationMatrix(),
): string[] {
  return matrixRows
    .filter((row) => Boolean(row.productionToolId) && !row.hasToolCallingStudyCard)
    .map((row) => row.normalizedToolId)
    .sort()
}

export function listToolsNeedingRuntimeRegistryExpansion(
  matrixRows: readonly AllOwnerToolReconciliationRow[] = buildAllOwnerToolReconciliationMatrix(),
): string[] {
  return matrixRows
    .filter((row) => !row.productionToolId && row.pendingAction === 'add_production_tool_registry_id')
    .map((row) => row.normalizedToolId)
    .sort()
}

export function listToolsNeedingAdapterContracts(
  matrixRows: readonly AllOwnerToolReconciliationRow[] = buildAllOwnerToolReconciliationMatrix(),
): string[] {
  return matrixRows
    .filter((row) => Boolean(row.productionToolId) && !row.hasAdapterContract)
    .map((row) => row.normalizedToolId)
    .sort()
}

export function listToolsBlockedByOwnerOrLicense(
  matrixRows: readonly AllOwnerToolReconciliationRow[] = buildAllOwnerToolReconciliationMatrix(),
): string[] {
  return matrixRows
    .filter((row) => row.currentRepoStatus.some((status) => (
      status === 'blocked_pending_license' ||
      status === 'blocked_pending_model_weight' ||
      status === 'blocked_pending_runtime_lane' ||
      status === 'blocked_pending_registry_expansion' ||
      status === 'evaluation_only' ||
      status === 'provider_api_only'
    )))
    .map((row) => row.normalizedToolId)
    .sort()
}

export function listDuplicateRiskFindings(
  matrixRows: readonly AllOwnerToolReconciliationRow[] = buildAllOwnerToolReconciliationMatrix(),
): AllOwnerReconciliationDuplicateRiskFinding[] {
  return matrixRows
    .filter((row) => row.duplicateRisk !== 'none')
    .map((row) => ({
      normalizedToolId: row.normalizedToolId,
      displayName: row.displayName,
      ownerLane: row.ownerLane,
      duplicateRisk: row.duplicateRisk,
      pendingAction: row.pendingAction,
      reason: row.notes,
    }))
    .sort((left, right) => left.normalizedToolId.localeCompare(right.normalizedToolId))
}

export function recommendNextToolCallingExpansionMilestones(
  matrixRows: readonly AllOwnerToolReconciliationRow[] = buildAllOwnerToolReconciliationMatrix(),
): AllOwnerRecommendedMilestone[] {
  const blocked = new Set(listToolsBlockedByOwnerOrLicense(matrixRows))
  const needsRegistry = new Set(listToolsNeedingRuntimeRegistryExpansion(matrixRows))
  const firstClassExternalProbesPassed = ['mediainfo', 'exiftool', 'tesseract', 'imagemagick']
    .every((toolId) => matrixRows.some((row) => row.normalizedToolId === toolId && row.currentRepoStatus.includes('controlled_probe_passed')))

  return [
    {
      milestone: 'REEDITPRO-TOOL-CALLING-SOUND-MUSIC-AUDIO-OWNER-EXPANSION-1',
      ownerLane: 'sound_music_audio' as const,
      reason: 'Reconcile Sound/Music/Audio and SFX owner proof before promoting soundfile/libsndfile, sox, aubio, MMAudio, SoundSync, or cue-manifest surfaces.',
      candidateToolIds: matrixRows
        .filter((row) => (row.ownerLane === 'sound_music_audio' || row.ownerLane === 'sfx_soundsync') && (needsRegistry.has(row.normalizedToolId) || blocked.has(row.normalizedToolId)))
        .map((row) => row.normalizedToolId),
    },
    {
      milestone: 'REEDITPRO-TOOL-CALLING-AI-GRAPHICS-OWNER-EVIDENCE-RECONCILIATION-1',
      ownerLane: 'ai_graphics' as const,
      reason: 'AI graphics/static/chart/model candidates require owner install, license, model-weight, or runtime proof before registry expansion.',
      candidateToolIds: matrixRows
        .filter((row) => row.ownerLane === 'ai_graphics' && (needsRegistry.has(row.normalizedToolId) || blocked.has(row.normalizedToolId)))
        .map((row) => row.normalizedToolId),
    },
    {
      milestone: 'REEDITPRO-TOOL-CALLING-TRACKA-NATIVE-CONTAINER-OWNER-EXPANSION-1',
      ownerLane: 'track_a_render_export' as const,
      reason: 'Track A native/container candidates need owner proof and must reuse existing final-render/caption/container lanes before tool-calling expansion.',
      candidateToolIds: matrixRows
        .filter((row) => row.ownerLane === 'track_a_render_export' && (needsRegistry.has(row.normalizedToolId) || blocked.has(row.normalizedToolId) || row.pendingAction === 'do_not_duplicate_owner_lane'))
        .map((row) => row.normalizedToolId),
    },
    {
      milestone: firstClassExternalProbesPassed
        ? 'REEDITPRO-TOOL-CALLING-TRACKB-EXTERNAL-FIXTURE-BOUND-PROBES-DECISION-1'
        : 'REEDITPRO-TOOL-CALLING-TRACKB-EXTERNAL-CONTROLLED-PROBE-AVAILABILITY-REFRESH-1',
      ownerLane: 'track_b_media' as const,
      reason: firstClassExternalProbesPassed
        ? 'Track B external probes have passed evidence; fixture-bound probes should still remain separately gated.'
        : 'Track B external binaries were unavailable in the publish environment; refresh controlled probe availability before fixture-bound expansion.',
      candidateToolIds: ['mediainfo', 'exiftool', 'tesseract', 'imagemagick', 'graphicsmagick'],
    },
    {
      milestone: 'REEDITPRO-TOOL-CALLING-WORKER-SUPABASE-ROUTE-INTEGRATION-DECISION-1',
      ownerLane: 'worker_runtime' as const,
      reason: 'Worker/Supabase integration should wait until tool-specific execution evidence and existing worker runtime/table ownership are reconciled.',
      candidateToolIds: ['worker_runtime', 'tool_calling_overlay'],
    },
  ].map((milestone) => ({
    ...milestone,
    candidateToolIds: uniqueSorted(milestone.candidateToolIds),
  }))
}

export function analyzeToolCallingCoverageAgainstAllOwners(
  unmergedOwnerEvidence: readonly UnmergedOwnerEvidenceItem[] = [],
): AllOwnerCoverageAnalysis {
  const matrixRows = buildAllOwnerToolReconciliationMatrix(unmergedOwnerEvidence)
  const duplicateRiskFindings = listDuplicateRiskFindings(matrixRows)

  return {
    matrixRows,
    totalMatrixRows: matrixRows.length,
    lanesRepresented: uniqueSorted(matrixRows.map((row) => row.ownerLane)) as AllOwnerToolLane[],
    firstClassProductionToolCount: PRODUCTION_TOOL_IDS.length,
    explicitStudyCardCount: listExplicitToolStudyCards().length,
    adapterContractCount: listToolAdapterContracts().length,
    commandIntentPolicyCount: listCommandIntentPolicies().length,
    pendingRuntimeRegistryExpansionCount: matrixRows.filter((row) => !row.productionToolId && row.currentRepoStatus.includes('blocked_pending_registry_expansion')).length,
    toolsNeedingStudyCards: listToolsNeedingToolCallingStudyCards(matrixRows),
    toolsNeedingRuntimeRegistryExpansion: listToolsNeedingRuntimeRegistryExpansion(matrixRows),
    toolsNeedingAdapterContracts: listToolsNeedingAdapterContracts(matrixRows),
    toolsBlockedByOwnerOrLicense: listToolsBlockedByOwnerOrLicense(matrixRows),
    duplicateRiskFindings,
    unmergedOwnerEvidenceCount: unmergedOwnerEvidence.length,
    recommendedNextMilestones: recommendNextToolCallingExpansionMilestones(matrixRows),
    safety: {
      executesTools: false,
      mediaProcessingPerformed: false,
      supabaseMutationPerformed: false,
      sqlExecuted: false,
      duplicateSystemsCreated: false,
    },
  }
}
