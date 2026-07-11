import {
  boundedAudioMusicAdapterToolNames,
  boundedDataVisualAdapterToolNames,
  boundedAudioCleanupModelAdapterToolNames,
  boundedModelFoundationAdapterToolNames,
  boundedMapBrowserColorSceneAdapterToolNames,
  boundedMotionAdapterToolNames,
  boundedRenderPackagingAdapterToolNames,
  boundedSpeechModelAdapterToolNames,
  boundedVisionModelAdapterToolNames,
  listProfessionalSkillDefinitions,
  listProfessionalSkillFamilies,
  listProfessionalSkillHiddenAdapterNames,
} from '../../src/lib/professional-skills'
import type { ProfessionalSkillDefinition } from '../../src/types/professional-skills'
import {
  listProfessionalToolAdapterContracts,
  normalizeRequestedToolName,
  resolveProfessionalToolAdapterContract,
  type ProfessionalToolAdapterContract,
} from './professional-tool-adapter-contracts'
import { productionToolProfiles } from './production-tool-profiles'
import type { ProductionToolId, ProductionToolProfile } from './production-tool-types'

export type ProfessionalToolProgramGroupId =
  | 'launch_core_registry_foundation'
  | 'bounded_visual_data_motion_adapters'
  | 'bounded_ai_vision_model_adapters'
  | 'bounded_speech_model_adapters'
  | 'bounded_music_audio_adapters'
  | 'bounded_map_browser_color_scene_adapters'
  | 'bounded_render_packaging_adapters'
  | 'owner_lane_registry_support'
  | 'skill_hidden_adapter_surface'

export type ProfessionalToolProgramStage =
  | 'launch_core_registry_owner_source_accepted'
  | 'owner_lane_registry_support_source_accepted'
  | 'bounded_adapter_contract_ready'
  | 'readiness_check_only'
  | 'model_backed_adapter_ready_requires_owner_manifest_evidence'
  | 'registry_only_not_adapter_wired'

export type ProfessionalToolProgramImplementationTier =
  | 'skill_architecture_and_bounded_adapter_wired'
  | 'owner_lane_source_truth_accepted_runtime_gated'
  | 'skill_reference_only_not_bounded_adapter_wired'
  | 'registry_named_only_not_skill_or_adapter_wired'

export type ProfessionalToolSourceTruthStatus =
  | 'bounded_adapter_source_truth_ready'
  | 'bounded_adapter_manifest_evidence_required'
  | 'owner_lane_source_truth_accepted'
  | 'skill_reference_contract_required'
  | 'registry_only_model_manifest_required'
  | 'registry_only_scope_decision_required'
  | 'registry_only_evaluation_hold'

export type ProfessionalToolSourceTruthAuthority =
  | 'bounded_adapter_contract'
  | 'owner_lane_launch_core'
  | 'owner_lane_registry_support'
  | 'skill_registry_reference'
  | 'production_registry_name_only'

export type ProfessionalToolPromotionPath =
  | 'launch_core_runtime_proof'
  | 'bounded_adapter_contract_and_runner_plan'
  | 'model_weight_owner_review_then_bounded_adapter'
  | 'scope_decision_before_adapter_work'
  | 'not_selected_or_evaluation_hold'

export interface ProfessionalToolProgramEntry {
  requestedToolName: string
  canonicalToolId?: ProductionToolId
  displayName?: string
  groupIds: ProfessionalToolProgramGroupId[]
  stage: ProfessionalToolProgramStage
  implementationTier: ProfessionalToolProgramImplementationTier
  sourceTruthStatus: ProfessionalToolSourceTruthStatus
  sourceTruthAuthority: ProfessionalToolSourceTruthAuthority
  nextGate: string
  workerType?: ProfessionalToolAdapterContract['workerType']
  modes: ProfessionalToolAdapterContract['modes']
  skillIds: string[]
  userFacingActivity?: string
  requiresApprovedSnapshot: boolean
  requiresPrivateArtifacts: boolean
  requiresPackageReadiness: boolean
  requiresModelWeightApproval: boolean
  frontendExecutionAllowed: false
  productReady: boolean
  blockers: string[]
}

export interface ProfessionalToolProgramGroup {
  groupId: ProfessionalToolProgramGroupId
  title: string
  purpose: string
  requestedToolNames: string[]
  canonicalToolIds: ProductionToolId[]
  entryCount: number
  productReadyCount: number
  frontendExecutionAllowedCount: number
  boundary: string
}

export interface ProfessionalToolPromotionBacklogItem {
  requestedToolName: string
  canonicalToolId?: ProductionToolId
  implementationTier: ProfessionalToolProgramImplementationTier
  promotionPath: ProfessionalToolPromotionPath
  recommendedNextGate: string
  requiredEvidence: string[]
  notes: string[]
}

export interface ProfessionalToolArchitectureProgramMap {
  summary: {
    productionRegistryToolCount: number
    launchCoreRegistryToolCount: number
    boundedInternalAdapterContractCount: number
    professionalSkillCount: number
    professionalSkillFamilyCount: number
    hiddenSkillAdapterNameCount: number
    skillArchitectureIntegratedToolNameCount: number
    boundedBackendAdapterWiredCount: number
    ownerLaneSourceTruthAcceptedToolCount: number
    launchCoreRegistryOnlyWiredCount: number
    ownerLaneRegistrySupportAcceptedToolCount: number
    skillReferenceOnlyToolNameCount: number
    registryNamedOnlyToolCount: number
    promotionBacklogItemCount: number
    registryNamedOnlyModelManifestLaneCount: number
    registryNamedOnlyScopeDecisionCount: number
    registryNamedOnlyEvaluationHoldCount: number
    sourceTruthStatusCounts: Record<ProfessionalToolSourceTruthStatus, number>
    hiddenSkillAdapterNamesWithoutBoundedContracts: string[]
    productReadyToolCount: number
    frontendExecutableToolCount: number
    notes: string[]
  }
  groups: ProfessionalToolProgramGroup[]
  promotionBacklog: ProfessionalToolPromotionBacklogItem[]
  entries: ProfessionalToolProgramEntry[]
}

function unique<T extends string>(values: T[]): T[] {
  return Array.from(new Set(values))
}

function sortUnique<T extends string>(values: T[]): T[] {
  return unique(values).sort()
}

function skillMapByHiddenAdapter(skills: ProfessionalSkillDefinition[]): Map<string, ProfessionalSkillDefinition[]> {
  const byAdapter = new Map<string, ProfessionalSkillDefinition[]>()

  for (const skill of skills) {
    for (const adapterName of skill.hiddenAdapterToolNames) {
      const key = normalizeRequestedToolName(adapterName)
      const existing = byAdapter.get(key) ?? []
      existing.push(skill)
      byAdapter.set(key, existing)
    }
  }

  return byAdapter
}

function profileByToolId(profiles: ProductionToolProfile[]): Map<ProductionToolId, ProductionToolProfile> {
  return new Map(profiles.map((profile) => [profile.toolId, profile]))
}

function groupIdsForRequestedToolName(requestedToolName: string): ProfessionalToolProgramGroupId[] {
  const normalized = normalizeRequestedToolName(requestedToolName)
  const groups: ProfessionalToolProgramGroupId[] = []

  if ((boundedDataVisualAdapterToolNames as readonly string[]).some((name) => normalizeRequestedToolName(name) === normalized) ||
      (boundedMotionAdapterToolNames as readonly string[]).some((name) => normalizeRequestedToolName(name) === normalized)) {
    groups.push('bounded_visual_data_motion_adapters')
  }

  if ((boundedModelFoundationAdapterToolNames as readonly string[]).some((name) => normalizeRequestedToolName(name) === normalized) ||
      (boundedVisionModelAdapterToolNames as readonly string[]).some((name) => normalizeRequestedToolName(name) === normalized)) {
    groups.push('bounded_ai_vision_model_adapters')
  }

  if ((boundedSpeechModelAdapterToolNames as readonly string[]).some((name) => normalizeRequestedToolName(name) === normalized)) {
    groups.push('bounded_speech_model_adapters')
  }

  if ((boundedAudioMusicAdapterToolNames as readonly string[]).some((name) => normalizeRequestedToolName(name) === normalized)) {
    groups.push('bounded_music_audio_adapters')
  }

  if ((boundedAudioCleanupModelAdapterToolNames as readonly string[]).some((name) => normalizeRequestedToolName(name) === normalized)) {
    groups.push('bounded_music_audio_adapters')
  }

  if ((boundedMapBrowserColorSceneAdapterToolNames as readonly string[]).some((name) => normalizeRequestedToolName(name) === normalized)) {
    groups.push('bounded_map_browser_color_scene_adapters')
  }

  if ((boundedRenderPackagingAdapterToolNames as readonly string[]).some((name) => normalizeRequestedToolName(name) === normalized)) {
    groups.push('bounded_render_packaging_adapters')
  }

  return groups
}

function stageForContract(contract: ProfessionalToolAdapterContract): ProfessionalToolProgramStage {
  if (contract.requiresModelWeightApproval) return 'model_backed_adapter_ready_requires_owner_manifest_evidence'
  if (contract.modes.length === 1 && contract.modes[0] === 'readiness_check') return 'readiness_check_only'
  return 'bounded_adapter_contract_ready'
}

function isEvaluationHoldToolName(toolName: string): boolean {
  return toolName === 'rubber_band' ||
    toolName === 'essentia' ||
    toolName === 'revideo' ||
    toolName === 'cesium_js' ||
    toolName === 'soundtouch'
}

function isOwnerLaneAcceptedRegistrySupportToolName(toolName: string): boolean {
  return toolName === 'pyav' ||
    toolName === 'duckdb' ||
    toolName === 'polars' ||
    toolName === 'vapoursynth'
}

function registryOnlySourceTruthStatus(profile: ProductionToolProfile): ProfessionalToolSourceTruthStatus {
  if (profile.launchCore || isOwnerLaneAcceptedRegistrySupportToolName(profile.toolId)) return 'owner_lane_source_truth_accepted'
  if (profile.modelWeightsRequired) return 'registry_only_model_manifest_required'
  if (isEvaluationHoldToolName(profile.toolId)) return 'registry_only_evaluation_hold'
  return 'registry_only_scope_decision_required'
}

function registryOnlyNextGate(status: ProfessionalToolSourceTruthStatus): string {
  if (status === 'owner_lane_source_truth_accepted') return 'owner_lane_runtime_gate'
  if (status === 'registry_only_model_manifest_required') return 'exact_model_weight_owner_manifest_review'
  if (status === 'registry_only_evaluation_hold') return 'owner_scope_decision_keep_or_remove'
  if (status === 'registry_only_scope_decision_required') return 'owner_scope_decision_before_adapter_work'
  if (status === 'skill_reference_contract_required') return 'bounded_adapter_contract_source_truth_and_runner_plan'
  if (status === 'bounded_adapter_manifest_evidence_required') return 'approved_runtime_gate_with_model_manifest_evidence'
  return 'approved_runtime_gate_with_snapshot_private_artifacts_idempotency_cost_and_qa'
}

function emptySourceTruthStatusCounts(): Record<ProfessionalToolSourceTruthStatus, number> {
  return {
    bounded_adapter_source_truth_ready: 0,
    bounded_adapter_manifest_evidence_required: 0,
    owner_lane_source_truth_accepted: 0,
    skill_reference_contract_required: 0,
    registry_only_model_manifest_required: 0,
    registry_only_scope_decision_required: 0,
    registry_only_evaluation_hold: 0,
  }
}

function countSourceTruthStatuses(entries: ProfessionalToolProgramEntry[]): Record<ProfessionalToolSourceTruthStatus, number> {
  const counts = emptySourceTruthStatusCounts()
  for (const entry of entries) counts[entry.sourceTruthStatus] += 1
  return counts
}

function buildContractEntry(params: {
  contract: ProfessionalToolAdapterContract
  profiles: Map<ProductionToolId, ProductionToolProfile>
  skillsByAdapter: Map<string, ProfessionalSkillDefinition[]>
}): ProfessionalToolProgramEntry {
  const { contract, profiles, skillsByAdapter } = params
  const skills = skillsByAdapter.get(normalizeRequestedToolName(contract.requestedToolName)) ?? []
  const profile = profiles.get(contract.canonicalToolId)

  return {
    requestedToolName: contract.requestedToolName,
    canonicalToolId: contract.canonicalToolId,
    displayName: profile?.displayName,
    groupIds: groupIdsForRequestedToolName(contract.requestedToolName),
    stage: stageForContract(contract),
    implementationTier: 'skill_architecture_and_bounded_adapter_wired',
    sourceTruthStatus: contract.requiresModelWeightApproval
      ? 'bounded_adapter_manifest_evidence_required'
      : 'bounded_adapter_source_truth_ready',
    sourceTruthAuthority: 'bounded_adapter_contract',
    nextGate: contract.requiresModelWeightApproval
      ? 'approved_runtime_gate_with_model_manifest_evidence'
      : 'approved_runtime_gate_with_snapshot_private_artifacts_idempotency_cost_and_qa',
    workerType: contract.workerType,
    modes: contract.modes,
    skillIds: skills.map((skill) => skill.id).sort(),
    userFacingActivity: contract.userFacingActivity,
    requiresApprovedSnapshot: contract.requiresApprovedSnapshot,
    requiresPrivateArtifacts: contract.requiresPrivateArtifacts,
    requiresPackageReadiness: contract.requiresPackageReadiness,
    requiresModelWeightApproval: contract.requiresModelWeightApproval,
    frontendExecutionAllowed: contract.frontendExecutionAllowed,
    productReady: contract.productReady,
    blockers: contract.productReadiness.blockers,
  }
}

function buildRegistryOnlyEntry(profile: ProductionToolProfile, skillIds: string[]): ProfessionalToolProgramEntry {
  const sourceTruthStatus = registryOnlySourceTruthStatus(profile)
  const ownerLaneAccepted = sourceTruthStatus === 'owner_lane_source_truth_accepted'

  return {
    requestedToolName: profile.toolId,
    canonicalToolId: profile.toolId,
    displayName: profile.displayName,
    groupIds: profile.launchCore
      ? ['launch_core_registry_foundation']
      : ownerLaneAccepted
        ? ['owner_lane_registry_support']
        : [],
    stage: profile.launchCore
      ? 'launch_core_registry_owner_source_accepted'
      : ownerLaneAccepted
        ? 'owner_lane_registry_support_source_accepted'
        : 'registry_only_not_adapter_wired',
    implementationTier: ownerLaneAccepted
      ? 'owner_lane_source_truth_accepted_runtime_gated'
      : 'registry_named_only_not_skill_or_adapter_wired',
    sourceTruthStatus,
    sourceTruthAuthority: profile.launchCore
      ? 'owner_lane_launch_core'
      : ownerLaneAccepted
        ? 'owner_lane_registry_support'
        : 'production_registry_name_only',
    nextGate: registryOnlyNextGate(sourceTruthStatus),
    workerType: profile.workerType,
    modes: [],
    skillIds,
    userFacingActivity: undefined,
    requiresApprovedSnapshot: true,
    requiresPrivateArtifacts: profile.requiredArtifacts.some((kind) =>
      kind === 'source_media' ||
      kind === 'proxy_media' ||
      kind === 'video' ||
      kind === 'audio' ||
      kind === 'image' ||
      kind === 'frame_sequence'
    ),
    requiresPackageReadiness: true,
    requiresModelWeightApproval: profile.modelWeightsRequired,
    frontendExecutionAllowed: false,
    productReady: false,
    blockers: ownerLaneAccepted
      ? [
          `${profile.toolId} is accepted as owner-lane source truth for architecture wiring.`,
          'This chat does not need to re-approve that owner lane, but execution still requires the normal approved snapshot, private artifact, idempotency, cost, QA, and runtime gates.',
        ]
      : [
          `${profile.toolId} is present in the production registry but is not part of the bounded internal adapter contract pack.`,
          'Registry-only tools still require an owner scope decision before this architecture should plan them for execution.',
        ],
  }
}

function promotionPathForEntry(entry: ProfessionalToolProgramEntry): ProfessionalToolPromotionPath {
  if (entry.implementationTier === 'owner_lane_source_truth_accepted_runtime_gated') return 'launch_core_runtime_proof'
  if (entry.requiresModelWeightApproval) return 'model_weight_owner_review_then_bounded_adapter'
  if (entry.implementationTier === 'skill_reference_only_not_bounded_adapter_wired') return 'bounded_adapter_contract_and_runner_plan'
  if (entry.implementationTier === 'registry_named_only_not_skill_or_adapter_wired') {
    if (entry.stage === 'registry_only_not_adapter_wired' && isEvaluationHoldToolName(entry.requestedToolName)) {
      return 'not_selected_or_evaluation_hold'
    }
    return 'scope_decision_before_adapter_work'
  }
  return 'bounded_adapter_contract_and_runner_plan'
}

function buildPromotionBacklogItem(entry: ProfessionalToolProgramEntry): ProfessionalToolPromotionBacklogItem {
  const promotionPath = promotionPathForEntry(entry)
  const commonEvidence = [
    'approved plan snapshot boundary',
    'idempotency and private artifact policy',
    'QA gate coverage',
    'no frontend execution path',
  ]

  if (promotionPath === 'launch_core_runtime_proof') {
    return {
      requestedToolName: entry.requestedToolName,
      canonicalToolId: entry.canonicalToolId,
      implementationTier: entry.implementationTier,
      promotionPath,
      recommendedNextGate: 'container_runtime_readiness_proof',
      requiredEvidence: [
        ...commonEvidence,
        'container/package presence proof',
        'bounded API-shape or command-shape proof',
        'private no-media or synthetic-only runtime proof where applicable',
        'deployment/runbook/observability evidence before product readiness',
      ],
      notes: ['Launch-core registry wiring is not enough; runtime/container proof must be recorded before execution claims.'],
    }
  }

  if (promotionPath === 'model_weight_owner_review_then_bounded_adapter') {
    return {
      requestedToolName: entry.requestedToolName,
      canonicalToolId: entry.canonicalToolId,
      implementationTier: entry.implementationTier,
      promotionPath,
      recommendedNextGate: 'exact_model_weight_owner_manifest_review',
      requiredEvidence: [
        ...commonEvidence,
        'exact model/checkpoint source URI',
        'checksum and version manifest',
        'commercial-use and redistribution review',
        'runtime mount policy',
        'bounded adapter contract only after model evidence is approved',
      ],
      notes: ['Do not add execution runners or product claims before exact model/checkpoint evidence is approved.'],
    }
  }

  if (promotionPath === 'bounded_adapter_contract_and_runner_plan') {
    return {
      requestedToolName: entry.requestedToolName,
      canonicalToolId: entry.canonicalToolId,
      implementationTier: entry.implementationTier,
      promotionPath,
      recommendedNextGate: 'bounded_adapter_contract_source_truth_and_runner_plan',
      requiredEvidence: [
        ...commonEvidence,
        'bounded adapter contract',
        'source-truth readiness evidence source',
        'runner or skip-safe adapter boundary',
        'private input/output manifest mapping',
        'smoke coverage proving user-facing copy hides package names',
      ],
      notes: ['The tool is skill-referenced, but not yet a real bounded adapter implementation.'],
    }
  }

  if (promotionPath === 'not_selected_or_evaluation_hold') {
    return {
      requestedToolName: entry.requestedToolName,
      canonicalToolId: entry.canonicalToolId,
      implementationTier: entry.implementationTier,
      promotionPath,
      recommendedNextGate: 'owner_scope_decision_keep_or_remove',
      requiredEvidence: [
        'owner decision that this tool is still needed',
        'reason it is not replaced by an already-selected launch tool',
        'license and distribution review if promoted later',
      ],
      notes: ['This name should remain out of execution planning unless an owner explicitly promotes it.'],
    }
  }

  return {
    requestedToolName: entry.requestedToolName,
    canonicalToolId: entry.canonicalToolId,
    implementationTier: entry.implementationTier,
    promotionPath,
    recommendedNextGate: 'owner_scope_decision_before_adapter_work',
    requiredEvidence: [
      'owner use-case decision',
      'skill family mapping',
      'backend worker ownership',
      'package/source/license review',
      ...commonEvidence,
    ],
    notes: ['Registry name exists, but the product architecture has not selected an adapter or skill path yet.'],
  }
}

function findProfileByToolName(
  profiles: ProductionToolProfile[],
  toolName: string,
): ProductionToolProfile | undefined {
  const normalized = normalizeRequestedToolName(toolName)
  return profiles.find((profile) => normalizeRequestedToolName(profile.toolId) === normalized)
}

function buildSkillReferenceOnlyEntry(params: {
  requestedToolName: string
  profile?: ProductionToolProfile
  skillIds: string[]
}): ProfessionalToolProgramEntry {
  const { requestedToolName, profile, skillIds } = params

  return {
    requestedToolName,
    canonicalToolId: profile?.toolId,
    displayName: profile?.displayName,
    groupIds: ['skill_hidden_adapter_surface'],
    stage: 'registry_only_not_adapter_wired',
    implementationTier: 'skill_reference_only_not_bounded_adapter_wired',
    sourceTruthStatus: 'skill_reference_contract_required',
    sourceTruthAuthority: 'skill_registry_reference',
    nextGate: 'bounded_adapter_contract_source_truth_and_runner_plan',
    workerType: profile?.workerType,
    modes: [],
    skillIds,
    userFacingActivity: undefined,
    requiresApprovedSnapshot: true,
    requiresPrivateArtifacts: Boolean(profile?.requiredArtifacts.some((kind) =>
      kind === 'source_media' ||
      kind === 'proxy_media' ||
      kind === 'video' ||
      kind === 'audio' ||
      kind === 'image' ||
      kind === 'frame_sequence'
    )),
    requiresPackageReadiness: true,
    requiresModelWeightApproval: Boolean(profile?.modelWeightsRequired),
    frontendExecutionAllowed: false,
    productReady: false,
    blockers: [
      `${requestedToolName} is referenced by professional skills but is not part of the bounded adapter contract pack.`,
      'This is not an end-to-end bounded adapter implementation until a contract, source-truth evidence path, runner boundary, and QA smoke are added.',
    ],
  }
}

function canonicalIdsForRequestedTools(toolNames: readonly string[]): ProductionToolId[] {
  return sortUnique(toolNames
    .map((toolName) => resolveProfessionalToolAdapterContract(toolName)?.canonicalToolId)
    .filter((toolId): toolId is ProductionToolId => Boolean(toolId)))
}

function buildGroup(input: {
  groupId: ProfessionalToolProgramGroupId
  title: string
  purpose: string
  requestedToolNames: string[]
  boundary: string
}): ProfessionalToolProgramGroup {
  const canonicalToolIds = canonicalIdsForRequestedTools(input.requestedToolNames)
  const entries = input.requestedToolNames
    .map((toolName) => resolveProfessionalToolAdapterContract(toolName))
    .filter((contract): contract is ProfessionalToolAdapterContract => Boolean(contract))

  return {
    ...input,
    canonicalToolIds,
    entryCount: input.requestedToolNames.length,
    productReadyCount: entries.filter((contract) => contract.productReady).length,
    frontendExecutionAllowedCount: entries.filter((contract) => contract.frontendExecutionAllowed).length,
  }
}

export function buildProfessionalToolArchitectureProgramMap(): ProfessionalToolArchitectureProgramMap {
  const profiles = [...productionToolProfiles]
  const profileMap = profileByToolId(profiles)
  const skills = listProfessionalSkillDefinitions()
  const skillsByAdapter = skillMapByHiddenAdapter(skills)
  const contracts = listProfessionalToolAdapterContracts()
  const contractEntries = contracts.map((contract) => buildContractEntry({
    contract,
    profiles: profileMap,
    skillsByAdapter,
  }))
  const contractCanonicalIds = new Set(contractEntries.map((entry) => entry.canonicalToolId).filter(Boolean))
  const registryOnlyLaunchCoreEntries = profiles
    .filter((profile) => profile.launchCore && !contractCanonicalIds.has(profile.toolId))
    .map((profile) => {
      const skillsForProfile = skillsByAdapter.get(normalizeRequestedToolName(profile.toolId)) ?? []
      return buildRegistryOnlyEntry(profile, skillsForProfile.map((skill) => skill.id).sort())
    })
  const ownerLaneRegistrySupportEntries = profiles
    .filter((profile) =>
      isOwnerLaneAcceptedRegistrySupportToolName(profile.toolId) &&
      !contractCanonicalIds.has(profile.toolId)
    )
    .map((profile) => {
      const skillsForProfile = skillsByAdapter.get(normalizeRequestedToolName(profile.toolId)) ?? []
      return buildRegistryOnlyEntry(profile, skillsForProfile.map((skill) => skill.id).sort())
    })
  const hiddenSkillAdapterNames = listProfessionalSkillHiddenAdapterNames()
  const normalizedContractNames = new Set(contracts.flatMap((contract) => [
    normalizeRequestedToolName(contract.requestedToolName),
    normalizeRequestedToolName(contract.canonicalToolId),
  ]))
  const normalizedLaunchCoreRegistryOnlyNames = new Set(registryOnlyLaunchCoreEntries.flatMap((entry) => [
    normalizeRequestedToolName(entry.requestedToolName),
    ...(entry.canonicalToolId ? [normalizeRequestedToolName(entry.canonicalToolId)] : []),
  ]))
  const hiddenSkillAdapterNamesWithoutBoundedContracts = sortUnique(hiddenSkillAdapterNames
    .filter((name) => !normalizedContractNames.has(normalizeRequestedToolName(name))))
  const skillReferenceOnlyEntries = hiddenSkillAdapterNamesWithoutBoundedContracts
    .filter((name) => !normalizedLaunchCoreRegistryOnlyNames.has(normalizeRequestedToolName(name)))
    .map((name) => {
      const skillsForAdapter = skillsByAdapter.get(normalizeRequestedToolName(name)) ?? []
      return buildSkillReferenceOnlyEntry({
        requestedToolName: name,
        profile: findProfileByToolName(profiles, name),
        skillIds: skillsForAdapter.map((skill) => skill.id).sort(),
      })
    })
  const partialEntries = [
    ...contractEntries,
    ...registryOnlyLaunchCoreEntries,
    ...ownerLaneRegistrySupportEntries,
    ...skillReferenceOnlyEntries,
  ]
  const normalizedPartialEntryToolIds = new Set(partialEntries.flatMap((entry) => [
    normalizeRequestedToolName(entry.requestedToolName),
    ...(entry.canonicalToolId ? [normalizeRequestedToolName(entry.canonicalToolId)] : []),
  ]))
  const registryNamedOnlyEntries = profiles
    .filter((profile) => !normalizedPartialEntryToolIds.has(normalizeRequestedToolName(profile.toolId)))
    .map((profile) => buildRegistryOnlyEntry(profile, []))
  const entries = [...partialEntries, ...registryNamedOnlyEntries]
  const promotionBacklog = entries
    .filter((entry) =>
      entry.implementationTier !== 'skill_architecture_and_bounded_adapter_wired' &&
      entry.implementationTier !== 'owner_lane_source_truth_accepted_runtime_gated'
    )
    .map(buildPromotionBacklogItem)
  const registryNamedOnlyModelManifestLaneCount = promotionBacklog
    .filter((item) => item.promotionPath === 'model_weight_owner_review_then_bounded_adapter')
    .length
  const registryNamedOnlyScopeDecisionCount = promotionBacklog
    .filter((item) => item.promotionPath === 'scope_decision_before_adapter_work')
    .length
  const registryNamedOnlyEvaluationHoldCount = promotionBacklog
    .filter((item) => item.promotionPath === 'not_selected_or_evaluation_hold')
    .length
  const launchCoreToolCount = profiles.filter((profile) => profile.launchCore).length
  const sourceTruthStatusCounts = countSourceTruthStatuses(entries)

  return {
    summary: {
      productionRegistryToolCount: profiles.length,
      launchCoreRegistryToolCount: launchCoreToolCount,
      boundedInternalAdapterContractCount: contracts.length,
      professionalSkillCount: skills.length,
      professionalSkillFamilyCount: listProfessionalSkillFamilies().length,
      hiddenSkillAdapterNameCount: hiddenSkillAdapterNames.length,
      skillArchitectureIntegratedToolNameCount: hiddenSkillAdapterNames.length,
      boundedBackendAdapterWiredCount: contracts.length,
      ownerLaneSourceTruthAcceptedToolCount: registryOnlyLaunchCoreEntries.length + ownerLaneRegistrySupportEntries.length,
      launchCoreRegistryOnlyWiredCount: registryOnlyLaunchCoreEntries.length,
      ownerLaneRegistrySupportAcceptedToolCount: ownerLaneRegistrySupportEntries.length,
      skillReferenceOnlyToolNameCount: skillReferenceOnlyEntries.length,
      registryNamedOnlyToolCount: registryNamedOnlyEntries.length,
      promotionBacklogItemCount: promotionBacklog.length,
      registryNamedOnlyModelManifestLaneCount,
      registryNamedOnlyScopeDecisionCount,
      registryNamedOnlyEvaluationHoldCount,
      sourceTruthStatusCounts,
      hiddenSkillAdapterNamesWithoutBoundedContracts,
      productReadyToolCount: entries.filter((entry) => entry.productReady).length,
      frontendExecutableToolCount: entries.filter((entry) => entry.frontendExecutionAllowed).length,
      notes: [
        'Counts are intentionally separated: production registry entries, owner-lane source-truth tools, bounded adapter contracts, and hidden skill adapter names are different source-truth surfaces.',
        'The bounded adapter pack is what the agent can plan toward after upload, approved snapshot, private artifacts, source-truth readiness evidence, idempotency, QA, and cost gates.',
        'Owner-lane launch-core and support tools are accepted for architecture wiring and are not re-approved here; their execution still flows through backend runtime gates.',
        'The remaining promotion backlog is only truly uncertain registry-named-only work: exact model manifests or not-selected/evaluation holds.',
        'The user should see edit activities and progress, not package names. Internal tool names remain available only in developer/source-truth records.',
        'Product-ready remains false until runtime, deployment, owner, model-weight, private artifact, QA, and billing evidence gates pass.',
      ],
    },
    groups: [
      buildGroup({
        groupId: 'bounded_visual_data_motion_adapters',
        title: 'Visual, Data, Motion Adapter Pack',
        purpose: 'Charts, diagrams, exact text/vector cards, 2D motion, and controlled 3D visual layers.',
        requestedToolNames: [
          ...boundedDataVisualAdapterToolNames,
          ...boundedMotionAdapterToolNames,
        ],
        boundary: 'Backend-approved render/asset handoff only; user-facing UI describes visual activities instead of library names.',
      }),
      buildGroup({
        groupId: 'bounded_ai_vision_model_adapters',
        title: 'AI Vision And Model Adapter Pack',
        purpose: 'Model runtime foundations, masks, background treatment, and quality enhancement gates.',
        requestedToolNames: [
          ...boundedModelFoundationAdapterToolNames,
          ...boundedVisionModelAdapterToolNames,
        ],
        boundary: 'Backend model-backed adapters are wired, but execution still requires owner-lane manifest evidence at the approved runtime gate.',
      }),
      buildGroup({
        groupId: 'bounded_speech_model_adapters',
        title: 'Speech Transcript Model Adapter Pack',
        purpose: 'Speech transcript and timing adapters for approved private source audio.',
        requestedToolNames: [...boundedSpeechModelAdapterToolNames],
        boundary: 'Backend-only speech adapters require owner-lane model manifest evidence, private audio refs, and approved snapshots before execution.',
      }),
      buildGroup({
        groupId: 'bounded_music_audio_adapters',
        title: 'Music And Audio Adapter Pack',
        purpose: 'Private audio analysis, timing, loudness, cleanup, and music cue support.',
        requestedToolNames: [
          ...boundedAudioMusicAdapterToolNames,
          ...boundedAudioCleanupModelAdapterToolNames,
        ],
        boundary: 'Requires private source/audio artifacts and backend package readiness evidence before bounded execution.',
      }),
      buildGroup({
        groupId: 'bounded_map_browser_color_scene_adapters',
        title: 'Map, Browser, Color, And Scene Adapter Pack',
        purpose: 'Map geometry, approved page capture, color/image handling, and scene-boundary preparation.',
        requestedToolNames: [...boundedMapBrowserColorSceneAdapterToolNames],
        boundary: 'Backend or render-planning adapter contracts only; no arbitrary browsing, user media, or public artifact output without approved gates.',
      }),
      buildGroup({
        groupId: 'bounded_render_packaging_adapters',
        title: 'Render Packaging Validation Adapter Pack',
        purpose: 'Private review packaging, container validation, and internal render pipeline support.',
        requestedToolNames: [...boundedRenderPackagingAdapterToolNames],
        boundary: 'Backend-only validation; no public delivery, no final export claim, and no frontend execution.',
      }),
      {
        groupId: 'launch_core_registry_foundation',
        title: 'Launch-Core Production Registry Foundation',
        purpose: 'Server registry launch-core tools that support ingest, timeline, audio, render, and QA foundations.',
        requestedToolNames: profiles.filter((profile) => profile.launchCore).map((profile) => profile.toolId).sort(),
        canonicalToolIds: profiles.filter((profile) => profile.launchCore).map((profile) => profile.toolId).sort(),
        entryCount: launchCoreToolCount,
        productReadyCount: 0,
        frontendExecutionAllowedCount: 0,
        boundary: 'Owner-lane source truth accepted for architecture wiring; execution remains backend-gated by approved snapshots, private artifacts, QA, and runtime evidence.',
      },
      {
        groupId: 'owner_lane_registry_support',
        title: 'Owner-Lane Registry Support',
        purpose: 'Accepted support tools from other owner lanes that this architecture can route around without re-approval.',
        requestedToolNames: ownerLaneRegistrySupportEntries.map((entry) => entry.requestedToolName).sort(),
        canonicalToolIds: ownerLaneRegistrySupportEntries
          .map((entry) => entry.canonicalToolId)
          .filter((toolId): toolId is ProductionToolId => Boolean(toolId))
          .sort(),
        entryCount: ownerLaneRegistrySupportEntries.length,
        productReadyCount: 0,
        frontendExecutionAllowedCount: 0,
        boundary: 'Owner-lane source truth accepted for architecture wiring; execution remains backend-gated by approved snapshots, private artifacts, QA, and runtime evidence.',
      },
      {
        groupId: 'skill_hidden_adapter_surface',
        title: 'Professional Skill Hidden Adapter Surface',
        purpose: 'The full set of internal packages referenced behind user-facing professional skills.',
        requestedToolNames: hiddenSkillAdapterNames.sort(),
        canonicalToolIds: canonicalIdsForRequestedTools(hiddenSkillAdapterNames),
        entryCount: hiddenSkillAdapterNames.length,
        productReadyCount: 0,
        frontendExecutionAllowedCount: 0,
        boundary: 'Skills hide package names from users and require backend-approved execution gates before any tool work.',
      },
    ],
    promotionBacklog,
    entries,
  }
}

export function resolveProfessionalToolProgramEntry(
  requestedToolName: string,
): ProfessionalToolProgramEntry | undefined {
  const normalized = normalizeRequestedToolName(requestedToolName)
  return buildProfessionalToolArchitectureProgramMap().entries.find((entry) =>
    normalizeRequestedToolName(entry.requestedToolName) === normalized ||
    (entry.canonicalToolId ? normalizeRequestedToolName(entry.canonicalToolId) === normalized : false)
  )
}
