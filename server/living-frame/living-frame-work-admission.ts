import {
  LIVING_FRAME_CAPABILITY_KEYS,
  LIVING_FRAME_MINI_SKILL_KEYS,
} from '../../src/types/living-frame'
import type {
  LivingFrameCapabilityWorkCoverage,
  LivingFrameMiniSkillWorkCoverage,
  LivingFrameWorkAdmissionAuthorityBoundary,
  LivingFrameWorkAdmissionCatalog,
  LivingFrameWorkAdmissionCatalogDraft,
  LivingFrameWorkAdmissionMetrics,
  LivingFrameWorkCoverageState,
  LivingFrameWorkExternalGateCode,
  LivingFrameMissingOperationCode,
} from '../../src/types/living-frame-work-admission'
import {
  LIVING_FRAME_MISSING_OPERATION_CODES,
  LIVING_FRAME_WORK_ADMISSION_CLASS,
  LIVING_FRAME_WORK_ADMISSION_VERSION,
  LIVING_FRAME_WORK_COVERAGE_STATES,
  LIVING_FRAME_WORK_EXTERNAL_GATE_CODES,
} from '../../src/types/living-frame-work-admission'
import type {
  EditWorkItemType,
} from '../../src/types/editing-agent-runtime'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'

type NamedWorkItemType = Exclude<EditWorkItemType, 'custom'>

const BASE_WORK_GATES = [
  'canonical_selected_scene_required',
  'approved_snapshot_required',
  'artifact_qa_required',
] as const satisfies readonly LivingFrameWorkExternalGateCode[]

const RENDER_GATES = [
  ...BASE_WORK_GATES,
  'master_timing_binding_required',
  'private_remotion_review_required',
] as const satisfies readonly LivingFrameWorkExternalGateCode[]

const PROVIDER_GENERATION_GATES = [
  ...BASE_WORK_GATES,
  'provider_route_qualification_required',
] as const satisfies readonly LivingFrameWorkExternalGateCode[]

const TOOL_MODEL_GATES = [
  ...BASE_WORK_GATES,
  'tool_profile_qualification_required',
  'model_weight_qualification_required',
] as const satisfies readonly LivingFrameWorkExternalGateCode[]

const AUTHORITY_BOUNDARY:
  LivingFrameWorkAdmissionAuthorityBoundary = Object.freeze({
    vocabularyAuditOnly: true,
    selectedSceneAuthority: false,
    approvalAuthority: false,
    snapshotAuthority: false,
    workItemCreationAuthority: false,
    workGraphMutationAuthority: false,
    queueAuthority: false,
    assetManifestMutationAuthority: false,
    providerAuthority: false,
    toolRouteAuthority: false,
    modelWeightAuthority: false,
    costAuthority: false,
    qaApprovalAuthority: false,
    renderAuthority: false,
    runtimeAuthority: false,
    productionAuthority: false,
  })

const CAPABILITY_COVERAGE:
  readonly LivingFrameCapabilityWorkCoverage[] = [
    capability(
      'deterministic_vector_drawing',
      'existing_named_work_type_candidate',
      ['prepare_remotion_layer'],
      [],
      RENDER_GATES,
    ),
    capability(
      'exact_map_rendering',
      'existing_named_work_type_candidate',
      ['render_map_asset'],
      [],
      BASE_WORK_GATES,
    ),
    capability(
      'exact_data_graphics',
      'existing_named_work_type_candidate',
      ['render_chart_asset'],
      [],
      BASE_WORK_GATES,
    ),
    capability(
      'still_image_generation_or_edit',
      'existing_named_work_type_candidate',
      ['generate_image_asset'],
      [],
      PROVIDER_GENERATION_GATES,
    ),
    capability(
      'foreground_component_extraction',
      'partial_existing_types_schema_admission_required',
      ['generate_mask_asset', 'process_image_asset'],
      ['hidden_plate_reconstruction_operation_required'],
      TOOL_MODEL_GATES,
    ),
    capability(
      'temporal_subject_masking',
      'existing_named_work_type_candidate',
      ['generate_mask_asset'],
      [],
      TOOL_MODEL_GATES,
    ),
    capability(
      'alpha_edge_refinement',
      'existing_named_work_type_candidate',
      ['process_image_asset'],
      [],
      [
        ...BASE_WORK_GATES,
        'tool_profile_qualification_required',
      ],
    ),
    capability(
      'reference_conditioned_illustration',
      'existing_named_work_type_candidate',
      ['generate_image_asset'],
      [],
      [
        ...PROVIDER_GENERATION_GATES,
        'model_weight_qualification_required',
      ],
    ),
    capability(
      'structure_conditioned_illustration',
      'existing_named_work_type_candidate',
      ['generate_image_asset'],
      [],
      [
        ...PROVIDER_GENERATION_GATES,
        'model_weight_qualification_required',
      ],
    ),
    capability(
      'identity_conditioned_illustration',
      'safety_blocked',
      [],
      ['identity_conditioned_generation_prohibited_pending_safety'],
      [
        ...PROVIDER_GENERATION_GATES,
        'model_weight_qualification_required',
        'identity_safety_required',
      ],
    ),
    capability(
      'low_rank_adapter_training_or_loading',
      'explicit_schema_admission_required',
      [],
      ['adapter_training_or_loading_operation_required'],
      [
        ...PROVIDER_GENERATION_GATES,
        'model_weight_qualification_required',
      ],
    ),
    capability(
      'deterministic_particle_effects',
      'existing_named_work_type_candidate',
      ['prepare_remotion_layer'],
      [],
      RENDER_GATES,
    ),
    capability(
      'deterministic_scene_composition',
      'existing_named_work_type_candidate',
      ['prepare_remotion_layer'],
      [],
      RENDER_GATES,
    ),
    capability(
      'image_upscale_or_prepare',
      'existing_named_work_type_candidate',
      ['process_image_asset'],
      [],
      [
        ...BASE_WORK_GATES,
        'tool_profile_qualification_required',
      ],
    ),
    capability(
      'visual_semantic_qa',
      'existing_named_work_type_candidate',
      ['run_asset_qa'],
      [],
      BASE_WORK_GATES,
    ),
    capability(
      'bounded_video_asset_generation',
      'existing_named_work_type_candidate',
      ['generate_ai_video_asset'],
      [],
      PROVIDER_GENERATION_GATES,
    ),
  ]

const MINI_SKILL_COVERAGE:
  readonly LivingFrameMiniSkillWorkCoverage[] = [
    miniSkill(
      'narrative_illustration',
      'existing_named_work_type_candidate',
      ['generate_image_asset'],
      [],
      PROVIDER_GENERATION_GATES,
    ),
    miniSkill(
      'animation_aware_illustration',
      'existing_named_work_type_candidate',
      ['generate_image_asset'],
      [],
      PROVIDER_GENERATION_GATES,
    ),
    miniSkill(
      'component_decomposition',
      'partial_existing_types_schema_admission_required',
      ['generate_mask_asset', 'process_image_asset'],
      ['hidden_plate_reconstruction_operation_required'],
      TOOL_MODEL_GATES,
    ),
    miniSkill(
      'component_rigging',
      'explicit_schema_admission_required',
      [],
      ['component_rig_build_operation_required'],
      BASE_WORK_GATES,
    ),
    miniSkill(
      'mechanical_part_motion',
      'existing_named_work_type_candidate',
      ['prepare_remotion_layer'],
      [],
      RENDER_GATES,
    ),
    miniSkill(
      'environmental_motion',
      'existing_named_work_type_candidate',
      ['prepare_remotion_layer'],
      [],
      RENDER_GATES,
    ),
    miniSkill(
      'editorial_motion',
      'existing_named_work_type_candidate',
      ['prepare_remotion_layer'],
      [],
      RENDER_GATES,
    ),
    miniSkill(
      'path_motion',
      'existing_named_work_type_candidate',
      ['prepare_remotion_layer'],
      [],
      RENDER_GATES,
    ),
    miniSkill(
      'deformation_motion',
      'existing_named_work_type_candidate',
      ['prepare_remotion_layer'],
      [],
      RENDER_GATES,
    ),
    miniSkill(
      'state_change_motion',
      'existing_named_work_type_candidate',
      ['prepare_remotion_layer'],
      [],
      RENDER_GATES,
    ),
    miniSkill(
      'focus_handoff',
      'existing_named_work_type_candidate',
      ['prepare_visual_cue_timing', 'prepare_remotion_layer'],
      [],
      RENDER_GATES,
    ),
    miniSkill(
      'attention_restoration',
      'existing_named_work_type_candidate',
      ['prepare_visual_cue_timing', 'prepare_remotion_layer'],
      [],
      RENDER_GATES,
    ),
    miniSkill(
      'visual_orbit',
      'existing_named_work_type_candidate',
      ['prepare_remotion_layer'],
      [],
      RENDER_GATES,
    ),
    miniSkill(
      'camera_choreography',
      'existing_named_work_type_candidate',
      ['prepare_visual_cue_timing', 'prepare_remotion_layer'],
      [],
      RENDER_GATES,
    ),
    miniSkill(
      'semantic_scale',
      'existing_named_work_type_candidate',
      ['prepare_visual_cue_timing', 'prepare_remotion_layer'],
      [],
      RENDER_GATES,
    ),
    miniSkill(
      'sound_choreography',
      'existing_named_work_type_candidate',
      ['prepare_soundsync_timing'],
      [],
      [
        ...BASE_WORK_GATES,
        'soundsync_binding_required',
      ],
    ),
    miniSkill(
      'visual_continuity_direction',
      'planning_only_no_work_item',
      [],
      [],
      ['canonical_selected_scene_required'],
    ),
    miniSkill(
      'alpha_edge_qa',
      'existing_named_work_type_candidate',
      ['run_asset_qa'],
      [],
      BASE_WORK_GATES,
    ),
    miniSkill(
      'living_frame_restraint_qa',
      'existing_named_work_type_candidate',
      ['run_final_qa'],
      [],
      BASE_WORK_GATES,
    ),
  ]

export function compileLivingFrameWorkAdmissionCatalog():
LivingFrameWorkAdmissionCatalog {
  assertVocabularyCoverage()
  const capabilityCoverage = CAPABILITY_COVERAGE.map(cloneCoverage)
  const miniSkillCoverage = MINI_SKILL_COVERAGE.map(cloneCoverage)
  const metrics = compileMetrics(capabilityCoverage, miniSkillCoverage)
  const draft: LivingFrameWorkAdmissionCatalogDraft = {
    contractVersion: LIVING_FRAME_WORK_ADMISSION_VERSION,
    admissionClass: LIVING_FRAME_WORK_ADMISSION_CLASS,
    capabilityCoverage,
    miniSkillCoverage,
    metrics,
    authorityBoundary: AUTHORITY_BOUNDARY,
    customWorkItemAllowed: false,
    createsWorkItems: false,
    createsAssetManifestEntries: false,
    existingExecutionPlannerRemainsAuthority: true,
    missingOperationsRequireCanonicalSchemaAdmission: true,
    subjectSpecificRouting: false,
    productionReady: false,
  }
  return {
    ...draft,
    catalogDigestSha256: sha256AuthorityValue(draft),
  }
}

export function verifyLivingFrameWorkAdmissionCatalog(
  value: unknown,
): value is LivingFrameWorkAdmissionCatalog {
  try {
    if (!isRecord(value) || !hasExactKeys(value, [
      'contractVersion',
      'admissionClass',
      'capabilityCoverage',
      'miniSkillCoverage',
      'metrics',
      'authorityBoundary',
      'customWorkItemAllowed',
      'createsWorkItems',
      'createsAssetManifestEntries',
      'existingExecutionPlannerRemainsAuthority',
      'missingOperationsRequireCanonicalSchemaAdmission',
      'subjectSpecificRouting',
      'productionReady',
      'catalogDigestSha256',
    ])) return false
    const catalog = value as unknown as LivingFrameWorkAdmissionCatalog
    const { catalogDigestSha256, ...draft } = catalog
    if (
      catalogDigestSha256 !== sha256AuthorityValue(draft)
      || catalog.contractVersion !== LIVING_FRAME_WORK_ADMISSION_VERSION
      || catalog.admissionClass !== LIVING_FRAME_WORK_ADMISSION_CLASS
      || !validateCoverageCollection(
        catalog.capabilityCoverage,
        'capabilityKey',
        LIVING_FRAME_CAPABILITY_KEYS,
      )
      || !validateCoverageCollection(
        catalog.miniSkillCoverage,
        'miniSkillKey',
        LIVING_FRAME_MINI_SKILL_KEYS,
      )
      || !validateBoundary(catalog.authorityBoundary)
      || catalog.customWorkItemAllowed !== false
      || catalog.createsWorkItems !== false
      || catalog.createsAssetManifestEntries !== false
      || catalog.existingExecutionPlannerRemainsAuthority !== true
      || catalog.missingOperationsRequireCanonicalSchemaAdmission !== true
      || catalog.subjectSpecificRouting !== false
      || catalog.productionReady !== false
    ) return false
    const expectedMetrics = compileMetrics(
      catalog.capabilityCoverage,
      catalog.miniSkillCoverage,
    )
    return stableAuthorityStringify(catalog.capabilityCoverage)
        === stableAuthorityStringify(CAPABILITY_COVERAGE)
      && stableAuthorityStringify(catalog.miniSkillCoverage)
        === stableAuthorityStringify(MINI_SKILL_COVERAGE)
      && stableAuthorityStringify(expectedMetrics)
      === stableAuthorityStringify(catalog.metrics)
  } catch {
    return false
  }
}

function capability(
  capabilityKey: LivingFrameCapabilityWorkCoverage['capabilityKey'],
  coverageState: LivingFrameWorkCoverageState,
  workItemTypes: readonly NamedWorkItemType[],
  missingOperationCodes: readonly LivingFrameMissingOperationCode[],
  gates: readonly LivingFrameWorkExternalGateCode[],
): LivingFrameCapabilityWorkCoverage {
  return {
    capabilityKey,
    coverageState,
    existingNamedWorkItemTypes: sorted(workItemTypes),
    missingOperationCodes: sorted(missingOperationCodes),
    requiredExternalGateCodes: sorted(gates),
  }
}

function miniSkill(
  miniSkillKey: LivingFrameMiniSkillWorkCoverage['miniSkillKey'],
  coverageState: LivingFrameWorkCoverageState,
  workItemTypes: readonly NamedWorkItemType[],
  missingOperationCodes: readonly LivingFrameMissingOperationCode[],
  gates: readonly LivingFrameWorkExternalGateCode[],
): LivingFrameMiniSkillWorkCoverage {
  return {
    miniSkillKey,
    coverageState,
    existingNamedWorkItemTypes: sorted(workItemTypes),
    missingOperationCodes: sorted(missingOperationCodes),
    requiredExternalGateCodes: sorted(gates),
  }
}

function cloneCoverage<
  T extends LivingFrameCapabilityWorkCoverage
    | LivingFrameMiniSkillWorkCoverage,
>(entry: T): T {
  return {
    ...entry,
    existingNamedWorkItemTypes: [...entry.existingNamedWorkItemTypes],
    missingOperationCodes: [...entry.missingOperationCodes],
    requiredExternalGateCodes: [...entry.requiredExternalGateCodes],
  }
}

function assertVocabularyCoverage(): void {
  if (
    stableAuthorityStringify(
      CAPABILITY_COVERAGE.map((entry) => entry.capabilityKey).sort(),
    ) !== stableAuthorityStringify([...LIVING_FRAME_CAPABILITY_KEYS].sort())
    || stableAuthorityStringify(
      MINI_SKILL_COVERAGE.map((entry) => entry.miniSkillKey).sort(),
    ) !== stableAuthorityStringify([...LIVING_FRAME_MINI_SKILL_KEYS].sort())
  ) throw new Error(
    'Living Frame work admission does not cover the complete vocabulary.',
  )
}

function compileMetrics(
  capabilityCoverage: readonly LivingFrameCapabilityWorkCoverage[],
  miniSkillCoverage: readonly LivingFrameMiniSkillWorkCoverage[],
): LivingFrameWorkAdmissionMetrics {
  const all = [...capabilityCoverage, ...miniSkillCoverage]
  return {
    capabilityCount: capabilityCoverage.length,
    miniSkillCount: miniSkillCoverage.length,
    existingNamedCoverageCount: all.filter((entry) =>
      entry.coverageState === 'existing_named_work_type_candidate').length,
    planningOnlyCount: all.filter((entry) =>
      entry.coverageState === 'planning_only_no_work_item').length,
    partialCoverageCount: all.filter((entry) =>
      entry.coverageState
        === 'partial_existing_types_schema_admission_required').length,
    missingSchemaAdmissionCount: all.filter((entry) =>
      entry.coverageState === 'explicit_schema_admission_required').length,
    safetyBlockedCount: all.filter((entry) =>
      entry.coverageState === 'safety_blocked').length,
  }
}

function validateCoverageCollection(
  value: unknown,
  key: 'capabilityKey' | 'miniSkillKey',
  expectedKeys: readonly string[],
): boolean {
  if (
    !Array.isArray(value)
    || value.length !== expectedKeys.length
    || new Set(value.map((entry) =>
      isRecord(entry) ? entry[key] : null)).size !== value.length
  ) return false
  const actualKeys: string[] = []
  for (const entry of value) {
    if (
      !isRecord(entry)
      || !hasExactKeys(entry, [
        key,
        'coverageState',
        'existingNamedWorkItemTypes',
        'missingOperationCodes',
        'requiredExternalGateCodes',
      ])
      || typeof entry[key] !== 'string'
      || !expectedKeys.includes(entry[key])
      || typeof entry.coverageState !== 'string'
      || !(LIVING_FRAME_WORK_COVERAGE_STATES as readonly string[])
        .includes(entry.coverageState)
      || !validateStringSet(entry.existingNamedWorkItemTypes)
      || entry.existingNamedWorkItemTypes.includes('custom')
      || !validateClosedSet(
        entry.missingOperationCodes,
        LIVING_FRAME_MISSING_OPERATION_CODES,
      )
      || !validateClosedSet(
        entry.requiredExternalGateCodes,
        LIVING_FRAME_WORK_EXTERNAL_GATE_CODES,
      )
      || !coverageStateMatches(entry)
    ) return false
    actualKeys.push(entry[key])
  }
  return stableAuthorityStringify(actualKeys.sort())
    === stableAuthorityStringify([...expectedKeys].sort())
}

function coverageStateMatches(
  entry: Record<string, unknown>,
): boolean {
  const work = entry.existingNamedWorkItemTypes as readonly string[]
  const missing = entry.missingOperationCodes as readonly string[]
  if (entry.coverageState === 'existing_named_work_type_candidate') {
    return work.length > 0 && missing.length === 0
  }
  if (entry.coverageState === 'planning_only_no_work_item') {
    return work.length === 0 && missing.length === 0
  }
  if (
    entry.coverageState
      === 'partial_existing_types_schema_admission_required'
  ) return work.length > 0 && missing.length > 0
  if (entry.coverageState === 'explicit_schema_admission_required') {
    return work.length === 0 && missing.length > 0
  }
  return entry.coverageState === 'safety_blocked'
    && work.length === 0
    && missing.includes(
      'identity_conditioned_generation_prohibited_pending_safety',
    )
}

function validateBoundary(value: unknown): boolean {
  return isRecord(value)
    && hasExactKeys(value, [
      'vocabularyAuditOnly',
      'selectedSceneAuthority',
      'approvalAuthority',
      'snapshotAuthority',
      'workItemCreationAuthority',
      'workGraphMutationAuthority',
      'queueAuthority',
      'assetManifestMutationAuthority',
      'providerAuthority',
      'toolRouteAuthority',
      'modelWeightAuthority',
      'costAuthority',
      'qaApprovalAuthority',
      'renderAuthority',
      'runtimeAuthority',
      'productionAuthority',
    ])
    && value.vocabularyAuditOnly === true
    && Object.entries(value).every(([key, entry]) =>
      key === 'vocabularyAuditOnly' ? entry === true : entry === false)
}

function validateStringSet(value: unknown): value is string[] {
  return Array.isArray(value)
    && new Set(value).size === value.length
    && value.every((entry, index) =>
      typeof entry === 'string'
      && entry !== 'custom'
      && (
        index === 0
        || String(value[index - 1]).localeCompare(entry) < 0
      ))
}

function validateClosedSet(
  value: unknown,
  allowed: readonly string[],
): value is string[] {
  return validateStringSet(value)
    && value.every((entry) => allowed.includes(entry))
}

function sorted<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values)].sort((left, right) =>
    left.localeCompare(right))
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  return Object.keys(value).sort().join('|')
    === [...keys].sort().join('|')
}
