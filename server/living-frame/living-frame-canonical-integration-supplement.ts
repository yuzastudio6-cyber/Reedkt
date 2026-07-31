import {
  LIVING_FRAME_CANONICAL_CONSUMPTION_POINT_IDS,
  LIVING_FRAME_CANONICAL_INTEGRATION_BLOCKER_IDS,
  LIVING_FRAME_CANONICAL_INTEGRATION_SUPPLEMENT_CLASS,
  LIVING_FRAME_CANONICAL_INTEGRATION_SUPPLEMENT_VERSION,
  type LivingFrameCanonicalConsumptionPoint,
  type LivingFrameCanonicalIntegrationSourceRef,
  type LivingFrameCanonicalIntegrationSupplement,
  type LivingFrameCanonicalIntegrationSupplementDraft,
  type LivingFrameCanonicalToolRoute,
  type LivingFrameControlledGenerationRole,
} from '../../src/types/living-frame-canonical-integration-supplement'
import type {
  LivingFrameOwnerScopeAmendment,
} from '../../src/types/living-frame-owner-scope-amendment'
import type {
  LivingFrameActiveProfessionalSkillPolicyProjection,
} from '../../src/types/living-frame-active-professional-skill-policy-projection'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  NON_E2E_TOOL_CAPABILITY_IDS,
  PRODUCTION_TOOL_IDS,
} from '../tool-registry'
import {
  verifyLivingFrameOwnerScopeAmendment,
} from './living-frame-owner-scope-amendment'
import {
  verifyLivingFrameActiveProfessionalSkillPolicyProjection,
} from './living-frame-active-professional-skill-policy-projection'

const REPRESENTATIVE_SOURCE_DIGESTS = Object.freeze({
  activeAggregate:
    '5971d995060f440b83d9e118736e3a0294784c65173b624a7789f001dc6e93c0',
  activeEvidenceAdmission:
    '573583308fc5e38f4d8577d1c2f40e29966aa83085923a28d0a5e2ce84e22117',
  nonCharacterContentLineage:
    '7cc2cce35ee851d5a09d98f81699d8ac880c7f33440bbcbaf665212a7af33c0a',
  chatPlanPresentation:
    '1d857acbc353be6f668d6c5e0f4bec91b6c06b5ed8a7061077f7be5592f85ebf',
})

export interface CompileLivingFrameCanonicalIntegrationSupplementInput {
  readonly ownerScopeAmendment: LivingFrameOwnerScopeAmendment
  readonly activeProfessionalSkillPolicyProjection:
    LivingFrameActiveProfessionalSkillPolicyProjection
}

export function compileLivingFrameCanonicalIntegrationSupplement(
  input: CompileLivingFrameCanonicalIntegrationSupplementInput,
): LivingFrameCanonicalIntegrationSupplement {
  if (
    !isRecord(input)
    || !hasExactKeys(input, [
      'ownerScopeAmendment',
      'activeProfessionalSkillPolicyProjection',
    ])
    || !verifyLivingFrameOwnerScopeAmendment(
      input.ownerScopeAmendment,
    )
    || !verifyLivingFrameActiveProfessionalSkillPolicyProjection(
      input.activeProfessionalSkillPolicyProjection,
    )
    || input.activeProfessionalSkillPolicyProjection
      .canonicalConsumptionPending !== true
  ) throw new Error('Invalid Living Frame integration source policy.')

  const sourceRefs = compileSourceRefs(input)
  const canonicalConsumptionPoints =
    compileCanonicalConsumptionPoints()
  const toolRoutes = compileToolRoutes()
  const controlledGenerationRoles =
    compileControlledGenerationRoles()
  assertUnique(
    toolRoutes.map((route) => route.toolId),
    'Living Frame integration tool identity collision.',
  )
  assertUnique(
    toolRoutes
      .map((route) => route.operationId)
      .filter((operationId): operationId is string =>
        operationId != null),
    'Living Frame integration operation identity collision.',
  )
  assertRegistryIdentityStates(toolRoutes)

  const draft: LivingFrameCanonicalIntegrationSupplementDraft = {
    contractVersion:
      LIVING_FRAME_CANONICAL_INTEGRATION_SUPPLEMENT_VERSION,
    supplementClass:
      LIVING_FRAME_CANONICAL_INTEGRATION_SUPPLEMENT_CLASS,
    supplementState:
      'whole_pipeline_source_handoff_complete_canonical_consumption_and_runtime_evidence_pending',
    sourceRefs,
    sourceRefSetDigestSha256: sha256AuthorityValue(sourceRefs),
    canonicalConsumptionPoints,
    canonicalConsumptionPointSetDigestSha256:
      sha256AuthorityValue(canonicalConsumptionPoints),
    toolRoutes,
    toolRouteSetDigestSha256: sha256AuthorityValue(toolRoutes),
    controlledGenerationRoles,
    controlledGenerationRoleSetDigestSha256:
      sha256AuthorityValue(controlledGenerationRoles),
    observedRegistryState: {
      productionIdentityCount: PRODUCTION_TOOL_IDS.length,
      nonE2ECapabilityIdentityCount:
        NON_E2E_TOOL_CAPABILITY_IDS.length,
      registryCountIsNotProductCap: true,
      expansionPermittedForDistinctReleasedExecutable: true,
      modelWeightsAdaptersLibrariesAndCapabilitiesAreNotIdentities:
        true,
    },
    specialistModelRoles: {
      visualEvidenceSpecialist:
        'qwen2_5_vl_visual_understanding',
      headQaPrimary: 'kimi_k3_main_edit_agent',
      headQaFallback:
        'gpt_5_6_terra_fallback_edit_agent',
      qwenMayApproveOrSetDirection: false,
      headQaMayReplaceCanonicalPrivateReview: false,
    },
    activeScopeCount: 12,
    pausedScopeCount: 7,
    staticIllustrationWithoutCharacterAnimationAllowed: true,
    pausedCharacterAndMechanicalRoutesNonAdmissible: true,
    blockerIds: structuredClone(
      LIVING_FRAME_CANONICAL_INTEGRATION_BLOCKER_IDS,
    ),
    blockerSetDigestSha256: sha256AuthorityValue(
      LIVING_FRAME_CANONICAL_INTEGRATION_BLOCKER_IDS,
    ),
    exactSharedInterfaceBlockerCount: 12,
    canonicalConsumptionPending: true,
    sharedRegistryMutated: false,
    sharedPlannerMutated: false,
    sharedUiMutated: false,
    directPrivateReviewAdapterClaimed: false,
    createsReadinessApprovalWorkAssetTimingRendererOrReviewOwner:
      false,
    containsRawChatTranscriptCaptionAudioMediaBytesPathsUrlsPromptsCredentialsCommandsOrEnvironment:
      false,
    operationRegistered: false,
    providerCallMade: false,
    dispatchGranted: false,
    runtimeExecuted: false,
    artifactCreated: false,
    costAdmitted: false,
    canonicalQaApproved: false,
    privateReviewApproved: false,
    customerCharged: false,
    publicDeliveryReady: false,
    productionReady: false,
  }
  return deepFreeze({
    ...draft,
    supplementDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameCanonicalIntegrationSupplement(
  value: unknown,
  input: CompileLivingFrameCanonicalIntegrationSupplementInput,
): value is LivingFrameCanonicalIntegrationSupplement {
  if (!isRecord(value)) return false
  try {
    return stableAuthorityStringify(value)
      === stableAuthorityStringify(
        compileLivingFrameCanonicalIntegrationSupplement(input),
      )
  } catch {
    return false
  }
}

function compileSourceRefs(
  input: CompileLivingFrameCanonicalIntegrationSupplementInput,
): readonly LivingFrameCanonicalIntegrationSourceRef[] {
  return [
    sourceRef(
      'owner_scope_amendment',
      input.ownerScopeAmendment.contractVersion,
      input.ownerScopeAmendment.amendmentDigestSha256,
      'owner_policy_object',
      true,
    ),
    sourceRef(
      'active_professional_skill_policy_projection',
      input.activeProfessionalSkillPolicyProjection.contractVersion,
      input.activeProfessionalSkillPolicyProjection
        .projectionDigestSha256,
      'verified_policy_projection',
      true,
    ),
    sourceRef(
      'active_non_illustration_aggregate',
      'living-frame-active-non-illustration-aggregate-v1',
      REPRESENTATIVE_SOURCE_DIGESTS.activeAggregate,
      'representative_source_regression',
      true,
    ),
    sourceRef(
      'active_non_illustration_evidence_admission',
      'living-frame-active-non-illustration-evidence-admission-v1',
      REPRESENTATIVE_SOURCE_DIGESTS.activeEvidenceAdmission,
      'representative_source_regression',
      true,
    ),
    sourceRef(
      'non_character_content_lineage',
      'living-frame-non-character-content-lineage-v1',
      REPRESENTATIVE_SOURCE_DIGESTS.nonCharacterContentLineage,
      'representative_source_regression',
      true,
    ),
    sourceRef(
      'postrender_visual_inspection_contract',
      'living-frame-postrender-visual-inspection-checklist-v1',
      contractIdentityDigest([
        'living-frame-postrender-visual-inspection-request-v1',
        'living-frame-postrender-visual-inspection-result-v1',
        'living-frame-postrender-visual-inspection-checklist-v1',
      ]),
      'contract_identity',
      true,
    ),
    sourceRef(
      'chat_plan_presentation',
      'living-frame-chat-plan-presentation-v1',
      REPRESENTATIVE_SOURCE_DIGESTS.chatPlanPresentation,
      'representative_source_regression',
      true,
    ),
    sourceRef(
      'caption_direction_public_boundary',
      'caption-direction-living-frame-adapter-v1',
      contractIdentityDigest([
        'caption-direction-living-frame-request-v1',
        'living-frame-caption-direction-response-v1',
        'caption-direction-living-frame-adapter-v1',
      ]),
      'contract_identity',
      true,
    ),
    sourceRef(
      'canonical_motion_v3',
      'canonical-living-frame-motion-spec-v3',
      contractIdentityDigest([
        'canonical-living-frame-motion-spec-v3',
        'canonical-living-frame-motion-profile-v3',
      ]),
      'contract_identity',
      true,
    ),
    sourceRef(
      'semantic_soundsync_reconciliation',
      'living-frame-semantic-sound-timing-reconciliation-v1',
      contractIdentityDigest([
        'living-frame-attention-soundsync-integration-v1',
        'living-frame-semantic-sound-timing-reconciliation-v1',
      ]),
      'contract_identity',
      true,
    ),
  ]
}

function sourceRef(
  sourceRefId: LivingFrameCanonicalIntegrationSourceRef['sourceRefId'],
  contractVersion: string,
  digestSha256: string,
  digestClass: LivingFrameCanonicalIntegrationSourceRef['digestClass'],
  canonicalRereadRequired: boolean,
): LivingFrameCanonicalIntegrationSourceRef {
  const withoutDigest = {
    sourceRefId,
    contractVersion,
    digestSha256,
    digestClass,
    canonicalRereadRequired,
  }
  return {
    ...withoutDigest,
    sourceRefDigestSha256: sha256AuthorityValue(withoutDigest),
  }
}

function compileCanonicalConsumptionPoints():
readonly LivingFrameCanonicalConsumptionPoint[] {
  const entries = [
    consumptionPoint(
      'professional_skill_selection_and_plan_publication',
      'canonical Professional Skill registry and source-led planner',
      ['owner scope', 'active policy gate delta', 'Living Frame component'],
      ['one selected or explicit non-use decision', 'published gate digest'],
      ['owner_scope_amendment', 'active_professional_skill_policy_projection'],
      'verified_source_boundary_canonical_consumption_pending',
    ),
    consumptionPoint(
      'approved_snapshot',
      'canonical approved-plan snapshot owner',
      ['exact plan version', 'Living Frame component and policy digests'],
      ['immutable execution lineage', 'revision invalidation'],
      ['active_professional_skill_policy_projection', 'chat_plan_presentation'],
      'verified_source_boundary_canonical_consumption_pending',
    ),
    consumptionPoint(
      'master_timing_and_story_timing',
      'MasterTiming and StoryTiming',
      ['semantic phases', 'visual lifetime', 'caption handoff'],
      ['final frame authority', 'motion and cue conflict resolution'],
      ['canonical_motion_v3', 'semantic_soundsync_reconciliation'],
      'verified_source_boundary_canonical_consumption_pending',
    ),
    consumptionPoint(
      'speaker_layout_depth_occlusion_and_masks',
      'canonical layout, depth, occupancy, and mask owners',
      ['speaker/visual reservations', 'protected regions', 'mask lineage'],
      ['one shared scene occupancy state', 'safe-space fallback'],
      ['active_non_illustration_aggregate', 'caption_direction_public_boundary'],
      'canonical_runtime_or_provider_evidence_open',
    ),
    consumptionPoint(
      'soundsync',
      'SoundSync',
      ['semantic trigger', 'motion and attention lineage'],
      ['exact cue frames', 'mix', 'ducking', 'narration protection'],
      ['semantic_soundsync_reconciliation'],
      'canonical_runtime_or_provider_evidence_open',
    ),
    consumptionPoint(
      'caption_direction',
      'Caption Direction public adapter',
      ['opaque Living Frame scene and occupancy lineage'],
      ['caption ownership', 'layer order', 'information handoff'],
      ['caption_direction_public_boundary', 'chat_plan_presentation'],
      'verified_source_boundary_canonical_consumption_pending',
    ),
    consumptionPoint(
      'estimate_and_actual_cost',
      'canonical estimate, attempt-cost, and settlement owners',
      ['approved work and operation identities'],
      ['one estimate contribution', 'actual internal cost only', 'no duplicate charge'],
      ['active_non_illustration_evidence_admission'],
      'verified_source_boundary_canonical_consumption_pending',
    ),
    consumptionPoint(
      'approved_work_graph',
      'canonical approved execution package and work graph',
      ['snapshot-bound scenes, outputs, dependencies, fallbacks'],
      ['idempotent work items', 'dependency readiness', 'one-use leases'],
      ['active_non_illustration_evidence_admission'],
      'verified_source_boundary_canonical_consumption_pending',
    ),
    consumptionPoint(
      'asset_manifest_and_reconciliation',
      'canonical asset manifest and merge reconciliation',
      ['created private assets and versions'],
      ['create-only persistence', 'exact reread', 'replacement lineage'],
      ['active_non_illustration_evidence_admission', 'non_character_content_lineage'],
      'canonical_runtime_or_provider_evidence_open',
    ),
    consumptionPoint(
      'remotion_final_canvas',
      'Remotion renderer',
      ['approved layers, exact frame, MasterTiming, SoundSync and captions'],
      ['one final canvas', 'no provider-owned final composition'],
      ['canonical_motion_v3', 'non_character_content_lineage'],
      'canonical_runtime_or_provider_evidence_open',
    ),
    consumptionPoint(
      'deterministic_final_qa',
      'canonical artifact QA and FFprobe final QA',
      ['exact final artifact', 'technical contract'],
      ['blocking deterministic evidence', 'no semantic approval claim'],
      ['active_non_illustration_evidence_admission'],
      'canonical_runtime_or_provider_evidence_open',
    ),
    consumptionPoint(
      'postrender_qwen_visual_evidence',
      'canonical provider queue and Qwen visual specialist boundary',
      ['final artifact plus deterministic QA and complete-time coverage'],
      ['13 grounded visual checks', 'repair targets', 'visual evidence only'],
      ['postrender_visual_inspection_contract', 'active_non_illustration_evidence_admission'],
      'canonical_runtime_or_provider_evidence_open',
    ),
    consumptionPoint(
      'separate_verified_audio_and_head_qa',
      'SoundSync evidence owner and ordered Head QA policy',
      ['verified visual, deterministic, and separate full-duration audio evidence'],
      ['Kimi-primary or classified Terra fallback recommendation'],
      ['postrender_visual_inspection_contract', 'semantic_soundsync_reconciliation'],
      'canonical_runtime_or_provider_evidence_open',
    ),
    consumptionPoint(
      'n_plus_one_repair_and_reinspection',
      'canonical recovery, QA, and artifact-version owners',
      ['failed vN evidence and bounded repair target'],
      ['create-only vN+1', 'repeated deterministic, visual, audio, Head QA and reconciliation'],
      ['active_non_illustration_evidence_admission', 'postrender_visual_inspection_contract'],
      'canonical_runtime_or_provider_evidence_open',
    ),
    consumptionPoint(
      'canonical_private_review_and_chat_presentation',
      'canonical private-review assembly/decision and source-led chat read model',
      ['reconciled final artifact and all supplemental QA dependencies'],
      ['one private review authority', 'one plan card', 'canonical reload and revision invalidation'],
      ['active_non_illustration_evidence_admission', 'chat_plan_presentation'],
      'verified_source_boundary_canonical_consumption_pending',
    ),
  ]
  if (
    stableAuthorityStringify(entries.map((entry) =>
      entry.consumptionPointId))
      !== stableAuthorityStringify(
        LIVING_FRAME_CANONICAL_CONSUMPTION_POINT_IDS,
      )
  ) throw new Error('Living Frame canonical consumption-point drift.')
  return entries.map((entry, order) => ({ ...entry, order }))
}

function consumptionPoint(
  consumptionPointId:
    LivingFrameCanonicalConsumptionPoint['consumptionPointId'],
  canonicalOwner: string,
  consumes: readonly string[],
  mustProduceOrPreserve: readonly string[],
  sourceRefIds:
    readonly LivingFrameCanonicalIntegrationSourceRef['sourceRefId'][],
  currentState: LivingFrameCanonicalConsumptionPoint['currentState'],
): Omit<LivingFrameCanonicalConsumptionPoint, 'order'> {
  const withoutDigest = {
    consumptionPointId,
    canonicalOwner,
    consumes,
    mustProduceOrPreserve,
    sourceRefIds,
    currentState,
    createsParallelOwner: false as const,
  }
  return {
    ...withoutDigest,
    consumptionPointDigestSha256:
      sha256AuthorityValue(withoutDigest),
  }
}

function compileToolRoutes(): readonly LivingFrameCanonicalToolRoute[] {
  return [
    route('ffmpeg', 'tool.ffmpeg.execute_approved_media_recipe.v1', 'existing_production_identity', 'approved media preparation and packaging'),
    route('ffprobe', 'tool.ffprobe.inspect_approved_media.v1', 'existing_production_identity', 'deterministic final media inspection'),
    route('remotion', 'tool.remotion.render_approved_composition.v1', 'existing_production_identity', 'sole final-canvas composition'),
    route('rembg', 'tool.rembg.remove_image_background.v1', 'existing_production_identity', 'approved still alpha preparation'),
    route('sharp', 'tool.sharp.prepare_approved_image_asset.v1', 'existing_production_identity', 'approved image normalization and alpha validation'),
    route('sam2', 'tool.sam2.segment_and_track_subject.v1', 'existing_non_e2e_capability_identity', 'advanced temporal A-roll mask candidate; release gates open'),
    route('pixijs', 'tool.pixijs.render_living_frame_environmental_particles.v1', 'existing_production_identity', 'bounded environmental particle timeline'),
    route('d3', 'tool.d3.render_chart_or_diagram.v1', 'existing_production_identity', 'source-bound map, route, and data graphics'),
    route('satori', 'tool.satori.render_svg_text_card.v1', 'existing_production_identity', 'source-bound archive and document cards'),
    route('viz_js', 'tool.viz_js.render_dot_diagram.v1', 'existing_production_identity', 'source-bound exact diagrams'),
    route('svg_js', 'tool.svg_js.render_svg_overlay.v1', 'existing_production_identity', 'controlled vector overlays'),
    route('comfyui', 'tool.comfyui.generate_controlled_image.v1', 'existing_non_e2e_capability_identity', 'static illustration generation only; animation routes paused'),
  ].map((entry, order) => ({ ...entry, order }))
}

function route(
  toolId: string,
  operationId: string | null,
  identityState: LivingFrameCanonicalToolRoute['identityState'],
  currentScopeUse: string,
): Omit<LivingFrameCanonicalToolRoute, 'order'> {
  return {
    toolId,
    operationId,
    identityState,
    currentScopeUse,
    operationRegistrationOrDispatchGrantedBySupplement: false,
    createsNewIdentity: false,
  }
}

function compileControlledGenerationRoles():
readonly LivingFrameControlledGenerationRole[] {
  return [
    controlledRole('comfyui_host', 'comfyui', true, true, 'static_illustration_only_release_gates_open'),
    controlledRole('controlnet_aux_preparation', 'comfyui', false, false, 'static_illustration_only_release_gates_open'),
    controlledRole('controlnet_conditioning', 'comfyui', false, false, 'static_illustration_only_release_gates_open'),
    controlledRole('generic_ip_adapter_clip_vision', 'comfyui', false, false, 'static_illustration_only_release_gates_open'),
    controlledRole('peft_lora_adapter', 'comfyui', false, false, 'static_illustration_only_release_gates_open'),
    controlledRole('auraface_optional_cpu_qa', 'future_auraface_cpu_qa_identity', true, true, 'not_admissible_under_current_owner_scope'),
  ].map((entry, order) => ({ ...entry, order }))
}

function controlledRole(
  roleId: LivingFrameControlledGenerationRole['roleId'],
  executableIdentityOwner:
    LivingFrameControlledGenerationRole['executableIdentityOwner'],
  separateToolIdentityRequired: boolean,
  separateChargeEventRequired: boolean,
  activeOwnerScopeAdmission:
    LivingFrameControlledGenerationRole['activeOwnerScopeAdmission'],
): Omit<LivingFrameControlledGenerationRole, 'order'> {
  return {
    roleId,
    executableIdentityOwner,
    separateToolIdentityRequired,
    separateChargeEventRequired,
    activeOwnerScopeAdmission,
  }
}

function contractIdentityDigest(versions: readonly string[]): string {
  return sha256AuthorityValue({ versions })
}

function assertUnique(values: readonly string[], message: string): void {
  if (new Set(values).size !== values.length) throw new Error(message)
}

function assertRegistryIdentityStates(
  routes: readonly LivingFrameCanonicalToolRoute[],
): void {
  const production = new Set<string>(PRODUCTION_TOOL_IDS)
  const nonE2E = new Set<string>(NON_E2E_TOOL_CAPABILITY_IDS)
  for (const route of routes) {
    if (
      route.identityState === 'existing_production_identity'
      && !production.has(route.toolId)
    ) throw new Error('Living Frame production tool identity is not registered.')
    if (
      route.identityState === 'existing_non_e2e_capability_identity'
      && !nonE2E.has(route.toolId)
    ) throw new Error('Living Frame non-E2E capability identity is not registered.')
  }
}

function hasExactKeys(
  value: Record<string, unknown>,
  keys: readonly string[],
): boolean {
  const actual = Object.keys(value).sort()
  const expected = [...keys].sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === expected[index])
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null
    && typeof value === 'object'
    && !Array.isArray(value)
}

function deepFreeze<T>(value: T): T {
  if (
    value == null
    || typeof value !== 'object'
    || Object.isFrozen(value)
  ) return value
  Object.freeze(value)
  for (const child of Object.values(value as Record<string, unknown>)) {
    deepFreeze(child)
  }
  return value
}
