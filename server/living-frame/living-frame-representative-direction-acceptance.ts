import {
  LIVING_FRAME_TIMING_PHASES,
} from '../../src/types/living-frame'
import {
  LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS,
} from '../../src/types/living-frame-active-non-illustration-aggregate'
import {
  LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_CHECK_IDS,
} from '../../src/types/living-frame-non-character-professional-review'
import type {
  LivingFrameOwnerScopeAmendment,
} from '../../src/types/living-frame-owner-scope-amendment'
import {
  LIVING_FRAME_REPRESENTATIVE_DIRECTION_ACCEPTANCE_VERSION,
  type LivingFrameRepresentativeCaseDirectionAcceptance,
  type LivingFrameRepresentativeDemonstrationAction,
  type LivingFrameRepresentativeDirectionAcceptanceManifest,
  type LivingFrameRepresentativeDirectionAcceptanceManifestDraft,
  type LivingFrameRepresentativeDirectionMode,
  type LivingFrameRepresentativeMotionChannel,
  type LivingFrameRepresentativeSemanticScalePolicy,
} from '../../src/types/living-frame-representative-direction-acceptance'
import type {
  LivingFrameRepresentativeVisualFixtureManifest,
} from '../../src/types/living-frame-representative-visual-fixture'
import type {
  LivingFrameRepresentativeMediaSourceCandidateSet,
} from '../../src/types/living-frame-representative-media-source-candidates'
import type {
  LivingFrameVisualContinuityAssetTreatment,
  LivingFrameVisualContinuityCameraCharacter,
  LivingFrameVisualContinuityCompositionStrategy,
  LivingFrameVisualContinuityDepthStyle,
  LivingFrameVisualContinuityMotionCharacter,
  LivingFrameVisualContinuityMotionDensity,
  LivingFrameVisualContinuitySoundPalette,
  LivingFrameVisualContinuityStillnessPolicy,
} from '../../src/types/living-frame-visual-continuity'
import {
  sha256AuthorityValue,
  stableAuthorityStringify,
} from '../services/private-edit-authority-store'
import {
  verifyLivingFrameOwnerScopeAmendment,
} from './living-frame-owner-scope-amendment'
import {
  verifyLivingFrameRepresentativeVisualFixtureManifest,
} from './living-frame-representative-visual-fixture'
import {
  verifyLivingFrameRepresentativeMediaSourceCandidateSet,
} from './living-frame-representative-media-source-candidates'

const SHA256 = /^[a-f0-9]{64}$/u

interface StyleDefinition {
  readonly assetTreatments:
    readonly LivingFrameVisualContinuityAssetTreatment[]
  readonly depthStyle: LivingFrameVisualContinuityDepthStyle
  readonly compositionStrategy:
    LivingFrameVisualContinuityCompositionStrategy
  readonly motionCharacter:
    LivingFrameVisualContinuityMotionCharacter
  readonly motionDensity: LivingFrameVisualContinuityMotionDensity
  readonly cameraCharacter:
    LivingFrameVisualContinuityCameraCharacter
  readonly stillnessPolicy:
    LivingFrameVisualContinuityStillnessPolicy
  readonly soundPalette: LivingFrameVisualContinuitySoundPalette
}

interface DirectionDefinition {
  readonly directionMode: LivingFrameRepresentativeDirectionMode
  readonly demonstrationAction:
    LivingFrameRepresentativeDemonstrationAction
  readonly phaseWeights: readonly [number, number, number, number, number]
  readonly styleProfile: StyleDefinition
  readonly primaryChannel: LivingFrameRepresentativeMotionChannel
  readonly secondaryChannels:
    readonly LivingFrameRepresentativeMotionChannel[]
  readonly semanticScalePolicy:
    LivingFrameRepresentativeSemanticScalePolicy
  readonly staticIllustrationMustRemainStatic: boolean
}

const DIRECTION_DEFINITIONS = [
  direction('living_a_roll', 'integrate_visual_with_speaker', [1200, 1600, 4200, 1400, 1600], style(['photographic', 'editorial_cutout'], 'shallow_2_5d', 'speaker_spatial_stage', 'restrained', 'balanced', 'restrained_documentary', 'ambient_motion_only_until_semantic_trigger', 'documentary_restrained'), 'attention', ['source_motion', 'editorial'], 'editorial_symbolic_with_disclosure', false),
  direction('living_still', 'hold_static_illustration_and_reveal_editorial_context', [1400, 1400, 4000, 1400, 1800], style(['editorial_cutout'], 'flat', 'negative_space_stage', 'elegant', 'sparse', 'locked', 'stillness_is_primary_contrast', 'minimal'), 'editorial', [], 'none', true),
  direction('living_still', 'animate_environment_around_static_non_character_object', [1200, 1600, 4500, 1400, 1300], style(['paper_collage'], 'shallow_2_5d', 'full_scene', 'restrained', 'balanced', 'slow_dolly', 'hold_before_primary_motion', 'organic'), 'environmental', ['camera'], 'perspective_only', false),
  direction('living_archive', 'assemble_source_verified_archive_evidence', [1000, 1800, 4600, 1400, 1200], style(['archival', 'photographic'], 'deep_multiplane', 'editorial_evidence_stage', 'restrained', 'balanced', 'restrained_documentary', 'no_motion_without_semantic_reason', 'documentary_restrained'), 'editorial', ['camera'], 'literal_relationship_only', false),
  direction('living_diagram', 'reveal_diagram_relationship', [1000, 1500, 5000, 1300, 1200], style(['technical', 'vector'], 'flat', 'exact_diagram_stage', 'elegant', 'balanced', 'locked', 'no_motion_without_semantic_reason', 'minimal'), 'editorial', [], 'data_proportional_only', false),
  direction('hybrid_expansion', 'expand_non_character_visual_and_return_to_speaker', [1200, 1500, 4500, 1600, 1200], style(['photographic', 'technical'], 'deep_multiplane', 'hybrid_expand_and_return', 'fluid', 'balanced', 'slow_dolly', 'ambient_motion_only_until_semantic_trigger', 'documentary_restrained'), 'spatial', ['attention', 'camera'], 'perspective_only', false),
  direction('living_diagram', 'reveal_literal_map_route_and_data_relationship', [1000, 1700, 5000, 1200, 1100], style(['archival', 'technical'], 'shallow_2_5d', 'exact_diagram_stage', 'restrained', 'balanced', 'restrained_documentary', 'no_motion_without_semantic_reason', 'minimal'), 'editorial', ['camera'], 'data_proportional_only', false),
  direction('living_a_roll', 'transfer_attention_and_apply_truthful_semantic_scale', [1200, 1500, 4300, 1500, 1500], style(['photographic', 'editorial_cutout'], 'shallow_2_5d', 'speaker_spatial_stage', 'elegant', 'balanced', 'slow_dolly', 'ambient_motion_only_until_semantic_trigger', 'documentary_restrained'), 'attention', ['camera', 'editorial'], 'editorial_symbolic_with_disclosure', false),
  direction('living_a_roll', 'demonstrate_depth_occlusion_or_safe_space_fallback', [1300, 1600, 4400, 1400, 1300], style(['photographic', 'editorial_cutout'], 'deep_multiplane', 'speaker_spatial_stage', 'restrained', 'balanced', 'source_matched', 'no_motion_without_semantic_reason', 'minimal'), 'spatial', ['camera'], 'perspective_only', false),
  direction('living_still', 'apply_environmental_or_preapproved_rigid_support_motion', [1300, 1400, 4700, 1300, 1300], style(['paper_collage'], 'shallow_2_5d', 'full_scene', 'restrained', 'balanced', 'slow_dolly', 'hold_before_primary_motion', 'organic'), 'environmental', ['spatial'], 'perspective_only', false),
  direction('living_a_roll', 'coordinate_caption_sound_and_visual_attention', [1500, 1500, 4200, 1300, 1500], style(['photographic', 'editorial_cutout'], 'shallow_2_5d', 'speaker_spatial_stage', 'restrained', 'sparse', 'locked', 'no_motion_without_semantic_reason', 'minimal'), 'attention', ['source_motion'], 'none', false),
  direction('final_artifact_review', 'inspect_exact_final_artifact_without_new_motion', [1000, 1000, 6000, 1000, 1000], style(['photographic', 'archival', 'technical'], 'deep_multiplane', 'full_scene', 'restrained', 'sparse', 'source_matched', 'stillness_is_primary_contrast', 'documentary_restrained'), 'none', [], 'none', false),
] as const satisfies readonly DirectionDefinition[]

export interface LivingFrameRepresentativeCaseSourceAdmissionRef {
  readonly caseId:
    LivingFrameRepresentativeCaseDirectionAcceptance['caseId']
  readonly refVersion:
    'living-frame-representative-case-source-admission-v1'
  readonly digestSha256: string
}

export interface CompileLivingFrameRepresentativeDirectionAcceptanceInput {
  readonly ownerScopeAmendment: LivingFrameOwnerScopeAmendment
  readonly representativeVisualFixture:
    LivingFrameRepresentativeVisualFixtureManifest
  readonly representativeSourceCandidateSet:
    LivingFrameRepresentativeMediaSourceCandidateSet
  readonly caseSourceAdmissionRefs:
    readonly LivingFrameRepresentativeCaseSourceAdmissionRef[]
}

export function compileLivingFrameRepresentativeDirectionAcceptance(
  input: CompileLivingFrameRepresentativeDirectionAcceptanceInput,
): LivingFrameRepresentativeDirectionAcceptanceManifest {
  assertInput(input)
  const cases = DIRECTION_DEFINITIONS.map((definition, order) => {
    const visualCase = input.representativeVisualFixture.cases[order]!
    const sourceBinding =
      input.representativeSourceCandidateSet.caseBindings[order]!
    const admissionRef = input.caseSourceAdmissionRefs[order]!
    const phasePlan = LIVING_FRAME_TIMING_PHASES.map((phase, phaseOrder) => ({
      phase,
      order: phaseOrder,
      relativeWeightBasisPoints: definition.phaseWeights[phaseOrder],
      intent: [
        'prepare_attention_without_preempting_meaning',
        'introduce_primary_visual_on_semantic_trigger',
        'demonstrate_action_and_hold_for_comprehension',
        'resolve_visual_argument',
        'settle_and_restore_or_transition_attention',
      ][phaseOrder] as LivingFrameRepresentativeCaseDirectionAcceptance['phasePlan'][number]['intent'],
      exactFramesProvided: false as const,
    }))
    const base = {
      caseId: visualCase.caseId,
      order,
      activeScope: visualCase.activeScope,
      directionMode: definition.directionMode,
      sourceCandidateIds: [
        ...sourceBinding.requiredSourceCandidateIds,
      ],
      caseSourceAdmissionRef: {
        refVersion: admissionRef.refVersion,
        digestSha256: admissionRef.digestSha256,
        canonicalRereadRequired: true as const,
      },
      demonstrationAction: definition.demonstrationAction,
      phasePlan,
      styleProfile: structuredClone(definition.styleProfile),
      motionBudget: {
        primaryChannel: definition.primaryChannel,
        secondaryChannels: [...definition.secondaryChannels],
        maximumConcurrentMeaningfulMotions: 2 as const,
        ambientMotionMustRemainSubordinate: true as const,
        cameraMotionMustBeNarrativelyMotivated: true as const,
      },
      semanticScalePolicy: definition.semanticScalePolicy,
      exactMapAndDataGeometryMayNotBeEditoriallyDistorted: true as const,
      illustratedOrLivingSubjectAnimationPermitted: false as const,
      mechanicalRiggingOrPartAnimationPermitted: false as const,
      staticIllustrationMustRemainStatic:
        definition.staticIllustrationMustRemainStatic,
      captionsRemainAboveLivingFrame: true as const,
      focusHandoffRequiresRestoreOrPlannedTransition: true as const,
      actionSpecificTimingRequired: true as const,
      storyTimingOwnsExactFrames: true as const,
      soundSyncOwnsExactCueAndMix: true as const,
      headIntelligenceMustChooseRefineSimplifyOrRefuse: true as const,
      geometryOrMetricsOnlyAcceptancePermitted: false as const,
      completePlaybackAndCompleteTimeVisualReviewRequired: true as const,
      exactProfessionalCheckIds: [
        ...LIVING_FRAME_NON_CHARACTER_PROFESSIONAL_CHECK_IDS,
      ],
    }
    return deepFreeze({
      ...base,
      directionDigestSha256: sha256AuthorityValue(base),
    })
  })
  const draft: LivingFrameRepresentativeDirectionAcceptanceManifestDraft = {
    contractVersion:
      LIVING_FRAME_REPRESENTATIVE_DIRECTION_ACCEPTANCE_VERSION,
    manifestClass:
      'source_only_representative_head_direction_and_action_timing_acceptance_profile',
    ownerScopeAmendmentVersion: input.ownerScopeAmendment.contractVersion,
    ownerScopeAmendmentDigestSha256:
      input.ownerScopeAmendment.amendmentDigestSha256,
    representativeVisualFixtureVersion:
      input.representativeVisualFixture.contractVersion,
    representativeVisualFixtureDigestSha256:
      input.representativeVisualFixture.manifestDigestSha256,
    representativeSourceCandidateSetVersion:
      input.representativeSourceCandidateSet.contractVersion,
    representativeSourceCandidateSetDigestSha256:
      input.representativeSourceCandidateSet.candidateSetDigestSha256,
    cases,
    activeCaseCount: 12,
    exactFivePhaseActionSpecificPlansRequired: true,
    relativePhaseWeightsSumBasisPoints: 10_000,
    noUniversalAnimationTimingPreset: true,
    noUniversalStyleOrDepthTreatment: true,
    headIntelligenceCreativeDecisionRequired: true,
    canonicalSemanticPlannerMustRemainOwner: true,
    masterTimingAndStoryTimingRemainExactFrameOwners: true,
    pausedScopesRejected: [...input.ownerScopeAmendment.pausedScope],
    pausedScopeCount: 7,
    canonicalConsumptionPending: true,
    createsPlannerTimingSoundWorkAssetRendererQaOrReviewOwner: false,
    operationRegistered: false,
    dispatchGranted: false,
    runtimeExecuted: false,
    assetCreated: false,
    customerCharged: false,
    publicDeliveryReady: false,
    productionReady: false,
  }
  return deepFreeze({
    ...draft,
    caseSetDigestSha256: sha256AuthorityValue(
      cases.map((entry) => entry.directionDigestSha256),
    ),
    manifestDigestSha256: sha256AuthorityValue(draft),
  })
}

export function verifyLivingFrameRepresentativeDirectionAcceptance(
  value: unknown,
  input: CompileLivingFrameRepresentativeDirectionAcceptanceInput,
): value is LivingFrameRepresentativeDirectionAcceptanceManifest {
  try {
    return stableAuthorityStringify(value)
      === stableAuthorityStringify(
        compileLivingFrameRepresentativeDirectionAcceptance(input),
      )
  } catch {
    return false
  }
}

function assertInput(
  input: CompileLivingFrameRepresentativeDirectionAcceptanceInput,
): void {
  if (!verifyLivingFrameOwnerScopeAmendment(input.ownerScopeAmendment)) {
    throw new Error('Invalid Living Frame owner scope amendment.')
  }
  if (!verifyLivingFrameRepresentativeVisualFixtureManifest(
    input.representativeVisualFixture,
    input.ownerScopeAmendment,
  )) throw new Error('Invalid Living Frame representative visual fixture.')
  if (!verifyLivingFrameRepresentativeMediaSourceCandidateSet(
    input.representativeSourceCandidateSet,
  )) throw new Error('Invalid Living Frame representative source candidate set.')
  if (
    input.caseSourceAdmissionRefs.length !== 12
    || input.caseSourceAdmissionRefs.some((entry, order) =>
      entry.caseId !== LIVING_FRAME_ACTIVE_NON_ILLUSTRATION_CASE_IDS[order]
      || entry.refVersion
        !== 'living-frame-representative-case-source-admission-v1'
      || !SHA256.test(entry.digestSha256))
    || DIRECTION_DEFINITIONS.length !== 12
    || DIRECTION_DEFINITIONS.some((definition) =>
      definition.phaseWeights.some((weight) =>
        !Number.isSafeInteger(weight) || weight <= 0)
      || definition.phaseWeights.reduce((sum, weight) => sum + weight, 0)
        !== 10_000
      || definition.secondaryChannels.length > 2
      || new Set(definition.secondaryChannels).size
        !== definition.secondaryChannels.length
      || definition.secondaryChannels.includes(definition.primaryChannel))
  ) throw new Error('Invalid Living Frame representative direction input.')
}

function direction(
  directionMode: LivingFrameRepresentativeDirectionMode,
  demonstrationAction: LivingFrameRepresentativeDemonstrationAction,
  phaseWeights: readonly [number, number, number, number, number],
  styleProfile: StyleDefinition,
  primaryChannel: LivingFrameRepresentativeMotionChannel,
  secondaryChannels: readonly LivingFrameRepresentativeMotionChannel[],
  semanticScalePolicy: LivingFrameRepresentativeSemanticScalePolicy,
  staticIllustrationMustRemainStatic: boolean,
): DirectionDefinition {
  return {
    directionMode,
    demonstrationAction,
    phaseWeights,
    styleProfile,
    primaryChannel,
    secondaryChannels,
    semanticScalePolicy,
    staticIllustrationMustRemainStatic,
  }
}

function style(
  assetTreatments:
    readonly LivingFrameVisualContinuityAssetTreatment[],
  depthStyle: LivingFrameVisualContinuityDepthStyle,
  compositionStrategy:
    LivingFrameVisualContinuityCompositionStrategy,
  motionCharacter: LivingFrameVisualContinuityMotionCharacter,
  motionDensity: LivingFrameVisualContinuityMotionDensity,
  cameraCharacter: LivingFrameVisualContinuityCameraCharacter,
  stillnessPolicy: LivingFrameVisualContinuityStillnessPolicy,
  soundPalette: LivingFrameVisualContinuitySoundPalette,
): StyleDefinition {
  return {
    assetTreatments,
    depthStyle,
    compositionStrategy,
    motionCharacter,
    motionDensity,
    cameraCharacter,
    stillnessPolicy,
    soundPalette,
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}
