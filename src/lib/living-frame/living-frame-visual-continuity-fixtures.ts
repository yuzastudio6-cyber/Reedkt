import type {
  LivingFrameVisualContinuityPack,
  LivingFrameVisualContinuityPackDraft,
  LivingFrameVisualContinuityValidationIssueCode,
} from '../../types/living-frame-visual-continuity'
import {
  LIVING_FRAME_VISUAL_CONTINUITY_EVIDENCE_CLASS,
  LIVING_FRAME_VISUAL_CONTINUITY_PACK_SOURCE,
  LIVING_FRAME_VISUAL_CONTINUITY_PACK_STATUS,
  LIVING_FRAME_VISUAL_CONTINUITY_PACK_VERSION,
} from '../../types/living-frame-visual-continuity'
import {
  createLivingFrameVisualContinuityPack,
  LIVING_FRAME_VISUAL_CONTINUITY_AUTHORITY_BOUNDARY,
} from './living-frame-visual-continuity-contract'

export interface LivingFrameVisualContinuityFixtureSet {
  readonly musashi: LivingFrameVisualContinuityPack
  readonly helicopter: LivingFrameVisualContinuityPack
  readonly hormuz: LivingFrameVisualContinuityPack
  readonly emotionalMonologueNonUse: null
}

export interface LivingFrameVisualContinuityAdversarialFixture {
  readonly fixtureId: string
  readonly expectedIssueCode:
    LivingFrameVisualContinuityValidationIssueCode
  readonly payload: unknown
}

export function createLivingFrameVisualContinuityFixtureDrafts(): {
  readonly musashi: LivingFrameVisualContinuityPackDraft
  readonly helicopter: LivingFrameVisualContinuityPackDraft
  readonly hormuz: LivingFrameVisualContinuityPackDraft
} {
  return {
    musashi: createMusashiDraft(),
    helicopter: createHelicopterDraft(),
    hormuz: createHormuzDraft(),
  }
}

export async function createLivingFrameVisualContinuityFixtures():
  Promise<LivingFrameVisualContinuityFixtureSet> {
  const drafts = createLivingFrameVisualContinuityFixtureDrafts()
  const [musashi, helicopter, hormuz] = await Promise.all([
    createLivingFrameVisualContinuityPack(drafts.musashi),
    createLivingFrameVisualContinuityPack(drafts.helicopter),
    createLivingFrameVisualContinuityPack(drafts.hormuz),
  ])
  return {
    musashi,
    helicopter,
    hormuz,
    emotionalMonologueNonUse: null,
  }
}

export function createLivingFrameVisualContinuityAdversarialFixtures(
  drafts = createLivingFrameVisualContinuityFixtureDrafts(),
): readonly LivingFrameVisualContinuityAdversarialFixture[] {
  return [
    adversarial('raw_transcript', 'forbidden_key', drafts.musashi, (root) => {
      root.rawTranscript = 'controlled raw input'
    }),
    adversarial('provider_route', 'forbidden_key', drafts.musashi, (root) => {
      root.providerId = 'caller-provider'
    }),
    adversarial('production_promotion', 'forbidden_key', drafts.musashi, (root) => {
      root.productionReady = true
    }),
    adversarial('unknown_root_key', 'schema_rejected', drafts.musashi, (root) => {
      root.unrecognized = true
    }),
    adversarial('deliberate_non_use_pack', 'schema_rejected', drafts.musashi, (root) => {
      root.semanticDecisionState = 'deliberate_non_use'
    }),
    adversarial('duplicate_character_id', 'duplicate_id', drafts.musashi, (root) => {
      const sheets = arrayField(root, 'characterSheets')
      sheets.push(cloneJson(sheets[0]))
    }),
    adversarial('duplicate_scene_order', 'duplicate_order', drafts.musashi, (root) => {
      const scenes = arrayField(root, 'sceneDesignSheets')
      scenes.push({
        ...objectField(cloneJson(scenes[0])),
        sceneDesignSheetId: 'scene.musashi.second',
        semanticCandidateDecisionId: 'decision.musashi.second',
      })
    }),
    adversarial('cyclic_sheet_dependency', 'cyclic_dependency', drafts.musashi, (root) => {
      arrayField(root, 'sheetDependencies').push({
        fromSheetId: 'style.musashi',
        toSheetId: 'scene.musashi',
        kind: 'references',
      })
    }),
    adversarial('dangling_scene_character', 'dangling_reference', drafts.musashi, (root) => {
      arrayField(objectField(arrayField(root, 'sceneDesignSheets')[0]), 'characterSheetIds')
        .push('character.missing')
    }),
    adversarial('secret_like_summary', 'unsafe_text', drafts.musashi, (root) => {
      objectField(root, 'styleBible').summary =
        'api_key=controlled-sensitive-value'
    }),
    adversarial('ordinary_motion_cross_lane', 'workflow_context_invalid', drafts.musashi, (root) => {
      arrayField(root, 'expectationRefs').push(expectation(
        'expectation.motion',
        'motion_storytelling_style_expectation',
        digest('a'),
      ))
    }),
    adversarial('forged_live_expectation', 'schema_rejected', drafts.musashi, (root) => {
      objectField(arrayField(root, 'expectationRefs')[0]).liveAuthorityVerified = true
    }),
    adversarial('verified_likeness_forgery', 'schema_rejected', drafts.musashi, (root) => {
      objectField(arrayField(root, 'characterSheets')[0]).verifiedLikenessClaimed = true
    }),
    adversarial('musashi_likeness_mode', 'identity_safety_invalid', drafts.musashi, (root) => {
      objectField(arrayField(root, 'characterSheets')[0]).sourceTruthMode =
        'documentary_source_verification_required'
    }),
    adversarial('real_person_without_fact_safety', 'identity_safety_invalid', drafts.musashi, (root) => {
      const sheet = objectField(arrayField(root, 'characterSheets')[0])
      sheet.identityKind = 'real_person_neutral_reference_only'
      sheet.identitySafetyState = 'neutral_reference_only'
    }),
    adversarial('hormuz_symbolic_distortion', 'geography_or_data_truth_invalid', drafts.hormuz, (root) => {
      objectField(arrayField(root, 'sceneDesignSheets')[0]).scaleTruthGuard =
        'symbolic_treatment_disclosed'
    }),
    adversarial('hormuz_fact_ref_removed', 'fact_safety_invalid', drafts.hormuz, (root) => {
      objectField(arrayField(root, 'environmentSheets')[0]).expectationRefIds = []
    }),
    adversarial('checkerboard_as_alpha', 'schema_rejected', drafts.musashi, (root) => {
      objectField(root, 'alphaEdgeRules').checkerboardIsTransparency = true
    }),
    adversarial('alpha_background_missing', 'schema_rejected', drafts.musashi, (root) => {
      arrayField(objectField(root, 'alphaEdgeRules'), 'testBackgrounds').pop()
    }),
    adversarial('living_a_roll_without_mask_benchmark', 'alpha_policy_invalid', drafts.hormuz, (root) => {
      objectField(root, 'alphaEdgeRules').temporalMaskBenchmarkRequired = false
    }),
    adversarial('ledger_acceptance_mismatch', 'ledger_promotion_invalid', drafts.musashi, (root) => {
      objectField(arrayField(root, 'continuityLedger')[0]).acceptedForPlanningOnly = false
    }),
    adversarial('ledger_qa_promotion', 'schema_rejected', drafts.musashi, (root) => {
      objectField(arrayField(root, 'continuityLedger')[0]).qaApprovedExecutableAsset = true
    }),
    adversarial('ledger_manifest_promotion', 'schema_rejected', drafts.musashi, (root) => {
      objectField(arrayField(root, 'continuityLedger')[0]).assetManifestAuthority = true
    }),
    adversarial('selected_scene_forgery', 'schema_rejected', drafts.musashi, (root) => {
      objectField(arrayField(root, 'sceneDesignSheets')[0]).selectedSceneAuthority = true
    }),
    adversarial('exact_frame_forgery', 'schema_rejected', drafts.musashi, (root) => {
      objectField(arrayField(root, 'sceneDesignSheets')[0]).exactFramesProvided = true
    }),
    adversarial('all_green_authority_forgery', 'schema_rejected', drafts.musashi, (root) => {
      const boundary = objectField(root, 'authorityBoundary')
      for (const key of Object.keys(boundary)) {
        boundary[key] = true
      }
    }),
  ]
}

function createMusashiDraft(): LivingFrameVisualContinuityPackDraft {
  const styleBibleId = 'style.musashi'
  const characterSheetId = 'character.musashi'
  const swordSheetId = 'object.musashi.sword'
  const environmentSheetId = 'environment.musashi.duel'
  const sceneId = 'scene.musashi'
  return baseDraft({
    suffix: 'musashi',
    styleBible: {
      styleBibleId,
      version: 1,
      summary: 'Premium cinematic anime with restrained Japanese ink influence and a controlled crimson accent.',
      assetTreatment: 'cinematic_anime',
      lineLanguage: 'mixed_weight_ink',
      paletteMode: 'limited_accent',
      palette: [
        color('musashi.parchment', 0, 'background', '#d8c9a8'),
        color('musashi.charcoal', 1, 'primary_subject', '#282522'),
        color('musashi.crimson', 2, 'accent', '#a62d2d'),
      ],
      lightingDirection: 'camera_left',
      lightingCharacter: 'hard_side',
      edgeTreatment: 'inked',
      textureTreatment: 'ink_bleed',
      detailDensity: 'balanced',
      avoidanceCodes: [
        'generic_glossy_anime',
        'chibi_proportions',
        'unapproved_photoreal_likeness',
        'baked_text',
        'opaque_rectangle',
        'named_artist_imitation',
      ],
      referenceExpectationIds: [],
    },
    expectationRefs: [
      expectation(
        'expectation.character.musashi',
        'character_consistency_plan_expectation',
        digest('1'),
      ),
    ],
    characterSheets: [{
      characterSheetId,
      version: 1,
      displayLabel: 'Musashi illustrative canon',
      identityKind: 'canonical_illustrative_interpretation',
      importance: 'primary',
      sourceTruthMode: 'canonical_illustrative_interpretation',
      canonicalAppearanceSummary: 'A consistent adult swordsman interpretation with a strong readable silhouette and restrained period detail.',
      outfitSummary: 'Layered charcoal kimono and muted sash remain consistent across approved planning views.',
      silhouetteSummary: 'Wide grounded stance, readable hair shape, and two distinct sword silhouettes.',
      expressionRangeSummary: 'Restrained focus through decisive intensity without exaggerated guilt or rage cues.',
      identitySafetyState: 'canonical_interpretation_only',
      identityRuleCodes: [
        'preserve_face_structure',
        'preserve_hair_and_hairline',
        'preserve_body_proportions',
        'preserve_outfit_layers',
        'preserve_handedness',
        'preserve_weapon_or_prop_design',
        'preserve_silhouette',
        'do_not_claim_verified_likeness',
        'do_not_imply_unsupported_action',
      ],
      referenceViews: [
        referenceView('musashi.view.neutral', 0, 'neutral_pose', digest('2')),
        referenceView('musashi.view.action', 1, 'action_pose', digest('3')),
      ],
      styleBibleId,
      expectationRefIds: ['expectation.character.musashi'],
      verifiedLikenessClaimed: false,
      historicalEvidenceClaimed: false,
    }],
    objectSheets: [{
      objectSheetId: swordSheetId,
      version: 1,
      displayLabel: 'Musashi long sword',
      objectKind: 'weapon',
      truthMode: 'illustrative_design',
      canonicalDesignSummary: 'A restrained period sword design with stable guard, grip, blade length, and readable diagonal silhouette.',
      materialAndColorSummary: 'Dark wrapped grip, muted steel blade, and charcoal guard remain unchanged.',
      separabilityCodes: [
        'complete_silhouette_required',
        'foreground_background_separable',
        'no_baked_motion_blur',
        'no_baked_text',
      ],
      styleBibleId,
      expectationRefIds: [],
      exactGeometryVerified: false,
    }],
    environmentSheets: [{
      environmentSheetId,
      version: 1,
      displayLabel: 'Illustrative duel clearing',
      truthMode: 'illustrative_environment',
      canonicalEnvironmentSummary: 'A restrained wooded duel clearing with open negative space behind the sword path.',
      atmosphereSummary: 'Low dust and ink-like atmospheric particles support the strike without becoming evidence.',
      depthStyle: 'deep_multiplane',
      styleBibleId,
      expectationRefIds: [],
      exactGeographyVerified: false,
    }],
    sceneDesignSheets: [{
      sceneDesignSheetId: sceneId,
      order: 0,
      semanticCandidateDecisionId: 'decision.musashi.strike',
      mode: 'living_still',
      sourceTruthMode: 'canonical_illustrative_interpretation',
      summary: 'Hold the confrontation, then reveal one decisive limited-animation strike with controlled secondary motion.',
      styleBibleId,
      characterSheetIds: [characterSheetId],
      objectSheetIds: [swordSheetId],
      environmentSheetIds: [environmentSheetId],
      compositionStrategy: 'full_scene',
      depthStyle: 'deep_multiplane',
      captionRegionExpectation: 'downstream_safe_region_revalidation_required',
      faceRegionExpectation: 'not_applicable',
      gestureRegionExpectation: 'not_applicable',
      scaleTruthGuard: 'symbolic_treatment_disclosed',
      exactFramesProvided: false,
      componentSceneGraphProvided: false,
      selectedSceneAuthority: false,
    }],
    motionLanguageSheet: motionLanguage(
      'motion.musashi',
      'urgent',
      'balanced',
      'slow_dolly',
    ),
    soundLanguageSheet: soundLanguage(
      'sound.musashi',
      'documentary_restrained',
    ),
    alphaEdgeRules: alphaRules('alpha.musashi', false),
    continuityLedger: [
      ledger(
        'ledger.musashi.character',
        0,
        'asset.musashi.character',
        digest('4'),
        'accepted_for_continuity_planning_only',
        'identity_matches_controlled_canon_expectation',
        'The controlled candidate is suitable for continuity planning only; asset QA remains downstream.',
        [characterSheetId],
        [],
        [],
      ),
      ledger(
        'ledger.musashi.sword',
        1,
        'asset.musashi.sword',
        digest('5'),
        'accepted_for_continuity_planning_only',
        'object_design_matches_controlled_expectation',
        'The controlled sword candidate matches the planned design expectation but is not executable asset evidence.',
        [],
        [swordSheetId],
        [],
      ),
    ],
    sheetDependencies: [
      dependency(characterSheetId, styleBibleId),
      dependency(swordSheetId, styleBibleId),
      dependency(environmentSheetId, styleBibleId),
      dependency(sceneId, characterSheetId),
      dependency(sceneId, swordSheetId),
      dependency(sceneId, environmentSheetId),
    ],
  })
}

function createHelicopterDraft(): LivingFrameVisualContinuityPackDraft {
  const styleBibleId = 'style.helicopter'
  const objectSheetId = 'object.helicopter'
  const environmentSheetId = 'environment.helicopter.terrain'
  const sceneId = 'scene.helicopter'
  return baseDraft({
    suffix: 'helicopter',
    styleBible: {
      styleBibleId,
      version: 1,
      summary: 'Cinematic documentary illustration with realistic proportions, restrained depth, and clear mechanical separation.',
      assetTreatment: 'cinematic_realistic',
      lineLanguage: 'none',
      paletteMode: 'naturalistic',
      palette: [
        color('helicopter.sky', 0, 'background', '#8092a0'),
        color('helicopter.body', 1, 'primary_subject', '#45524a'),
        color('helicopter.dust', 2, 'accent', '#a18c68'),
      ],
      lightingDirection: 'camera_left',
      lightingCharacter: 'soft_natural',
      edgeTreatment: 'clean',
      textureTreatment: 'film_grain',
      detailDensity: 'balanced',
      avoidanceCodes: ['baked_text', 'opaque_rectangle'],
      referenceExpectationIds: [],
    },
    expectationRefs: [],
    characterSheets: [],
    objectSheets: [{
      objectSheetId,
      version: 1,
      displayLabel: 'Selective-motion helicopter',
      objectKind: 'vehicle',
      truthMode: 'illustrative_design',
      canonicalDesignSummary: 'A stable side three-quarter helicopter design with separate main rotor, tail rotor, body, and shadow expectations.',
      materialAndColorSummary: 'Muted olive body, dark rotor assembly, and consistent window reflections.',
      separabilityCodes: [
        'complete_silhouette_required',
        'mechanical_parts_separable',
        'foreground_background_separable',
        'hidden_area_reconstruction_expected',
        'no_baked_motion_blur',
        'no_baked_text',
      ],
      styleBibleId,
      expectationRefIds: [],
      exactGeometryVerified: false,
    }],
    environmentSheets: [{
      environmentSheetId,
      version: 1,
      displayLabel: 'Low-altitude terrain',
      truthMode: 'illustrative_environment',
      canonicalEnvironmentSummary: 'Layered dry terrain with foreground vegetation suitable for controlled parallax.',
      atmosphereSummary: 'Downwash dust remains sparse and directional around the landing zone.',
      depthStyle: 'deep_multiplane',
      styleBibleId,
      expectationRefIds: [],
      exactGeographyVerified: false,
    }],
    sceneDesignSheets: [{
      sceneDesignSheetId: sceneId,
      order: 0,
      semanticCandidateDecisionId: 'decision.helicopter.operation',
      mode: 'living_still',
      sourceTruthMode: 'fictional_or_stylized',
      summary: 'Keep the body largely anchored while mechanical and environmental motion communicate operation and approach.',
      styleBibleId,
      characterSheetIds: [],
      objectSheetIds: [objectSheetId],
      environmentSheetIds: [environmentSheetId],
      compositionStrategy: 'full_scene',
      depthStyle: 'deep_multiplane',
      captionRegionExpectation: 'downstream_safe_region_revalidation_required',
      faceRegionExpectation: 'not_applicable',
      gestureRegionExpectation: 'not_applicable',
      scaleTruthGuard: 'perspective_only',
      exactFramesProvided: false,
      componentSceneGraphProvided: false,
      selectedSceneAuthority: false,
    }],
    motionLanguageSheet: motionLanguage(
      'motion.helicopter',
      'mechanical',
      'balanced',
      'object_follow',
    ),
    soundLanguageSheet: soundLanguage(
      'sound.helicopter',
      'mechanical',
    ),
    alphaEdgeRules: alphaRules('alpha.helicopter', false),
    continuityLedger: [
      ledger(
        'ledger.helicopter.object',
        0,
        'asset.helicopter.object',
        digest('6'),
        'accepted_for_continuity_planning_only',
        'animation_separability_expected',
        'The controlled candidate is separable in planning; rotor, edge, and asset QA remain unproven.',
        [],
        [objectSheetId],
        [],
      ),
    ],
    sheetDependencies: [
      dependency(objectSheetId, styleBibleId),
      dependency(environmentSheetId, styleBibleId),
      dependency(sceneId, objectSheetId),
      dependency(sceneId, environmentSheetId),
    ],
  })
}

function createHormuzDraft(): LivingFrameVisualContinuityPackDraft {
  const styleBibleId = 'style.hormuz'
  const speakerSheetId = 'character.hormuz.speaker'
  const mapObjectId = 'object.hormuz.map'
  const environmentSheetId = 'environment.hormuz.geography'
  const sceneId = 'scene.hormuz'
  const factExpectationId = 'expectation.fact.hormuz'
  const characterExpectationId = 'expectation.character.hormuz.speaker'
  return baseDraft({
    suffix: 'hormuz',
    styleBible: {
      styleBibleId,
      version: 1,
      summary: 'Clean geopolitical editorial language with exact geography, restrained labels, and a muted maritime palette.',
      assetTreatment: 'technical',
      lineLanguage: 'clean_vector',
      paletteMode: 'limited_accent',
      palette: [
        color('hormuz.water', 0, 'background', '#7f9aa7'),
        color('hormuz.land', 1, 'surface', '#d2c6aa'),
        color('hormuz.route', 2, 'accent', '#c6553d'),
      ],
      lightingDirection: 'front_neutral',
      lightingCharacter: 'technical_neutral',
      edgeTreatment: 'clean',
      textureTreatment: 'clean_digital',
      detailDensity: 'balanced',
      avoidanceCodes: [
        'baked_text',
        'opaque_rectangle',
        'publisher_imitation',
      ],
      referenceExpectationIds: [factExpectationId],
    },
    expectationRefs: [
      expectation(
        factExpectationId,
        'documentary_fact_safety_plan_expectation',
        digest('7'),
      ),
      expectation(
        characterExpectationId,
        'character_consistency_plan_expectation',
        digest('8'),
      ),
    ],
    characterSheets: [{
      characterSheetId: speakerSheetId,
      version: 1,
      displayLabel: 'Source speaker protection',
      identityKind: 'source_speaker_no_likeness_generation',
      importance: 'primary',
      sourceTruthMode: 'controlled_source_expectation',
      canonicalAppearanceSummary: 'The source speaker remains source-bound and is never regenerated as an illustrated likeness.',
      outfitSummary: 'Preserve the source-visible outfit without synthetic replacement.',
      silhouetteSummary: 'Use only downstream verified source masks and safe regions.',
      expressionRangeSummary: 'Preserve source expression; visual continuity may not reinterpret emotion.',
      identitySafetyState: 'source_speaker_no_generation',
      identityRuleCodes: [
        'preserve_face_structure',
        'preserve_outfit_layers',
        'preserve_silhouette',
        'do_not_claim_verified_likeness',
        'do_not_imply_unsupported_action',
      ],
      referenceViews: [],
      styleBibleId,
      expectationRefIds: [characterExpectationId],
      verifiedLikenessClaimed: false,
      historicalEvidenceClaimed: false,
    }],
    objectSheets: [{
      objectSheetId: mapObjectId,
      version: 1,
      displayLabel: 'Exact Hormuz map components',
      objectKind: 'map_symbol',
      truthMode: 'exact_geography_symbol_required',
      canonicalDesignSummary: 'Coastlines, route geometry, labels, and chokepoint relationships remain exact and deterministic.',
      materialAndColorSummary: 'Muted land and water fields with one controlled route accent.',
      separabilityCodes: [
        'complete_silhouette_required',
        'foreground_background_separable',
        'no_baked_text',
      ],
      styleBibleId,
      expectationRefIds: [factExpectationId],
      exactGeometryVerified: false,
    }],
    environmentSheets: [{
      environmentSheetId,
      version: 1,
      displayLabel: 'Strait of Hormuz geography',
      truthMode: 'exact_geography_required',
      canonicalEnvironmentSummary: 'The geographic relationship between Iran, Oman, and the shipping corridor must remain exact.',
      atmosphereSummary: 'No decorative atmosphere may obscure labels, coastlines, routes, or the source speaker.',
      depthStyle: 'shallow_2_5d',
      styleBibleId,
      expectationRefIds: [factExpectationId],
      exactGeographyVerified: false,
    }],
    sceneDesignSheets: [{
      sceneDesignSheetId: sceneId,
      order: 0,
      semanticCandidateDecisionId: 'decision.hormuz.chokepoint',
      mode: 'living_a_roll',
      sourceTruthMode: 'exact_geography_verification_required',
      summary: 'Build exact map and route relationships around the source speaker while preserving face, gesture, caption, and geography safety.',
      styleBibleId,
      characterSheetIds: [speakerSheetId],
      objectSheetIds: [mapObjectId],
      environmentSheetIds: [environmentSheetId],
      compositionStrategy: 'speaker_spatial_stage',
      depthStyle: 'shallow_2_5d',
      captionRegionExpectation: 'downstream_safe_region_revalidation_required',
      faceRegionExpectation: 'downstream_safe_region_revalidation_required',
      gestureRegionExpectation: 'downstream_safe_region_revalidation_required',
      scaleTruthGuard: 'literal_relationship_preserved',
      exactFramesProvided: false,
      componentSceneGraphProvided: false,
      selectedSceneAuthority: false,
    }],
    motionLanguageSheet: motionLanguage(
      'motion.hormuz',
      'restrained',
      'sparse',
      'source_matched',
    ),
    soundLanguageSheet: soundLanguage(
      'sound.hormuz',
      'documentary_restrained',
    ),
    alphaEdgeRules: alphaRules('alpha.hormuz', true),
    continuityLedger: [
      ledger(
        'ledger.hormuz.map',
        0,
        'asset.hormuz.map',
        digest('9'),
        'future_asset_evidence_required',
        'fact_or_geography_uncertain',
        'The map design remains an expectation until exact geography and destination composite QA are supplied downstream.',
        [],
        [mapObjectId],
        [environmentSheetId],
      ),
    ],
    sheetDependencies: [
      dependency(speakerSheetId, styleBibleId),
      dependency(mapObjectId, styleBibleId),
      dependency(environmentSheetId, styleBibleId),
      dependency(sceneId, speakerSheetId),
      dependency(sceneId, mapObjectId),
      dependency(sceneId, environmentSheetId),
    ],
  })
}

function baseDraft(input: {
  readonly suffix: string
  readonly styleBible: LivingFrameVisualContinuityPackDraft['styleBible']
  readonly expectationRefs: LivingFrameVisualContinuityPackDraft['expectationRefs']
  readonly characterSheets: LivingFrameVisualContinuityPackDraft['characterSheets']
  readonly objectSheets: LivingFrameVisualContinuityPackDraft['objectSheets']
  readonly environmentSheets: LivingFrameVisualContinuityPackDraft['environmentSheets']
  readonly sceneDesignSheets: LivingFrameVisualContinuityPackDraft['sceneDesignSheets']
  readonly motionLanguageSheet: LivingFrameVisualContinuityPackDraft['motionLanguageSheet']
  readonly soundLanguageSheet: LivingFrameVisualContinuityPackDraft['soundLanguageSheet']
  readonly alphaEdgeRules: LivingFrameVisualContinuityPackDraft['alphaEdgeRules']
  readonly continuityLedger: LivingFrameVisualContinuityPackDraft['continuityLedger']
  readonly sheetDependencies: LivingFrameVisualContinuityPackDraft['sheetDependencies']
}): LivingFrameVisualContinuityPackDraft {
  return {
    contractVersion: LIVING_FRAME_VISUAL_CONTINUITY_PACK_VERSION,
    contractSource: LIVING_FRAME_VISUAL_CONTINUITY_PACK_SOURCE,
    status: LIVING_FRAME_VISUAL_CONTINUITY_PACK_STATUS,
    evidenceClass: LIVING_FRAME_VISUAL_CONTINUITY_EVIDENCE_CLASS,
    promotionAllowed: false,
    semanticDecisionState: 'candidates_proposed',
    workflowContext: {
      kind: 'ordinary_edit_video',
      motionProductionContext: null,
    },
    canonicalBindings: {
      workspaceId: `workspace.${input.suffix}`,
      projectId: `project.${input.suffix}`,
      editSessionId: `edit.${input.suffix}`,
      handoffId: `handoff.${input.suffix}`,
      deferredLivingFrameComponentDigestSha256: digest('b'),
      planningEvidenceBindingDigestSha256: digest('c'),
      preapprovalReasoningResultBindingDigestSha256: digest('d'),
      compiledIntentDigestSha256: digest('e'),
      sourceSequenceDigestSha256: digest('f'),
      outputFrameDigestSha256: digest('0'),
      lineageRevision: 1,
    },
    expectationRefs: input.expectationRefs,
    styleBible: input.styleBible,
    characterSheets: input.characterSheets,
    objectSheets: input.objectSheets,
    environmentSheets: input.environmentSheets,
    sceneDesignSheets: input.sceneDesignSheets,
    motionLanguageSheet: input.motionLanguageSheet,
    soundLanguageSheet: input.soundLanguageSheet,
    alphaEdgeRules: input.alphaEdgeRules,
    continuityLedger: input.continuityLedger,
    sheetDependencies: input.sheetDependencies,
    authorityBoundary: LIVING_FRAME_VISUAL_CONTINUITY_AUTHORITY_BOUNDARY,
  }
}

function expectation(
  expectationId: string,
  expectationKind:
    LivingFrameVisualContinuityPackDraft['expectationRefs'][number]['expectationKind'],
  expectedDigestSha256: string,
): LivingFrameVisualContinuityPackDraft['expectationRefs'][number] {
  return {
    expectationId,
    expectationKind,
    version: 1,
    expectedDigestSha256,
    evidenceClass: 'controlled_unverified_expectation',
    liveAuthorityVerified: false,
    currentAuthorityVerified: false,
    approvalVerified: false,
  }
}

function color(
  colorId: string,
  order: number,
  role: LivingFrameVisualContinuityPackDraft['styleBible']['palette'][number]['role'],
  hex: string,
): LivingFrameVisualContinuityPackDraft['styleBible']['palette'][number] {
  return { colorId, order, role, hex }
}

function referenceView(
  referenceViewId: string,
  order: number,
  kind: LivingFrameVisualContinuityPackDraft['characterSheets'][number]['referenceViews'][number]['kind'],
  expectedReferenceDigestSha256: string,
): LivingFrameVisualContinuityPackDraft['characterSheets'][number]['referenceViews'][number] {
  return {
    referenceViewId,
    order,
    kind,
    expectedReferenceDigestSha256,
    evidenceClass: 'controlled_unverified_reference_expectation',
    qaApprovedAsset: false,
  }
}

function motionLanguage(
  motionLanguageSheetId: string,
  motionCharacter:
    LivingFrameVisualContinuityPackDraft['motionLanguageSheet']['motionCharacter'],
  motionDensity:
    LivingFrameVisualContinuityPackDraft['motionLanguageSheet']['motionDensity'],
  cameraCharacter:
    LivingFrameVisualContinuityPackDraft['motionLanguageSheet']['cameraCharacter'],
): LivingFrameVisualContinuityPackDraft['motionLanguageSheet'] {
  return {
    motionLanguageSheetId,
    version: 1,
    summary: 'Motion remains semantically motivated, limited to one primary action, and balanced by intentional stillness.',
    motionCharacter,
    motionDensity,
    cameraCharacter,
    stillnessPolicies: [
      'stillness_is_primary_contrast',
      'hold_before_primary_motion',
      'no_motion_without_semantic_reason',
    ],
    maximumSimultaneousPrimaryMotions: 1,
    semanticTimingOnly: true,
    exactFramesProvided: false,
  }
}

function soundLanguage(
  soundLanguageSheetId: string,
  palette: LivingFrameVisualContinuityPackDraft['soundLanguageSheet']['palette'],
): LivingFrameVisualContinuityPackDraft['soundLanguageSheet'] {
  return {
    soundLanguageSheetId,
    version: 1,
    summary: 'Narration remains dominant while restrained sound supports only meaningful visible or editorial motion.',
    palette,
    density: 'sparse',
    narrationProtection: 'strict',
    automaticWhooshPerElement: false,
    exactCuePlacementProvided: false,
    exactMixProvided: false,
  }
}

function alphaRules(
  alphaEdgeRulesId: string,
  temporalMaskBenchmarkRequired: boolean,
): LivingFrameVisualContinuityPackDraft['alphaEdgeRules'] {
  return {
    alphaEdgeRulesId,
    version: 1,
    masterMode: 'straight_alpha_expected_after_qa',
    nativeAlphaCapabilityCheckRequired: true,
    nativeAlphaClaimIsQaApproval: false,
    checkerboardIsTransparency: false,
    rectangularBackgroundRejected: true,
    testBackgrounds: [
      'white',
      'black',
      'neutral_gray',
      'saturated_color',
      'destination_composite',
    ],
    destinationCompositeQaRequired: true,
    temporalMaskBenchmarkRequired,
    qaApprovedAsset: false,
  }
}

function ledger(
  ledgerEntryId: string,
  order: number,
  assetExpectationId: string,
  expectedAssetDigestSha256: string,
  state: LivingFrameVisualContinuityPackDraft['continuityLedger'][number]['state'],
  reasonCode: LivingFrameVisualContinuityPackDraft['continuityLedger'][number]['reasonCode'],
  derivedSummary: string,
  linkedCharacterSheetIds: readonly string[],
  linkedObjectSheetIds: readonly string[],
  linkedEnvironmentSheetIds: readonly string[],
): LivingFrameVisualContinuityPackDraft['continuityLedger'][number] {
  return {
    ledgerEntryId,
    order,
    assetExpectationId,
    expectedAssetDigestSha256,
    state,
    reasonCode,
    derivedSummary,
    linkedCharacterSheetIds,
    linkedObjectSheetIds,
    linkedEnvironmentSheetIds,
    acceptedForPlanningOnly:
      state === 'accepted_for_continuity_planning_only',
    qaApprovedExecutableAsset: false,
    assetManifestAuthority: false,
  }
}

function dependency(
  fromSheetId: string,
  toSheetId: string,
): LivingFrameVisualContinuityPackDraft['sheetDependencies'][number] {
  return { fromSheetId, toSheetId, kind: 'governed_by' }
}

function digest(character: string): string {
  return character.repeat(64)
}

type MutableJson = Record<string, unknown>

function adversarial(
  fixtureId: string,
  expectedIssueCode: LivingFrameVisualContinuityValidationIssueCode,
  base: LivingFrameVisualContinuityPackDraft,
  mutate: (root: MutableJson) => void,
): LivingFrameVisualContinuityAdversarialFixture {
  const payload = cloneJson(base) as unknown as MutableJson
  mutate(payload)
  return { fixtureId, expectedIssueCode, payload }
}

function objectField(value: unknown, key?: string): MutableJson {
  const resolvedValue = key
    ? objectField(value)[key]
    : value
  if (
    !resolvedValue
    || typeof resolvedValue !== 'object'
    || Array.isArray(resolvedValue)
  ) {
    throw new Error('Fixture field is not an object.')
  }
  return resolvedValue as MutableJson
}

function arrayField(root: MutableJson, key: string): unknown[] {
  const value = root[key]
  if (!Array.isArray(value)) throw new Error(`${key} is not an array.`)
  return value
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
