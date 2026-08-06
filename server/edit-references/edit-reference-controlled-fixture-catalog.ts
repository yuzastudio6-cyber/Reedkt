export const EDIT_REFERENCE_CONTROLLED_FIXTURE_CATALOG_VERSION =
  'edit-reference-controlled-fixture-catalog-v1' as const

export type EditReferenceControlledFixtureRuntimeStatus =
  | 'specification_ready_media_fixture_pending'

export type EditReferenceBlockedTransfer =
  | 'reference_footage'
  | 'exact_caption_wording'
  | 'exact_timing_or_sequence'
  | 'creator_person_brand_identity'
  | 'copyrighted_music_or_sfx'
  | 'original_graphics_or_layout'

export const EDIT_REFERENCE_UNIVERSAL_BLOCKED_TRANSFERS = [
  'reference_footage',
  'exact_caption_wording',
  'exact_timing_or_sequence',
  'creator_person_brand_identity',
  'copyrighted_music_or_sfx',
  'original_graphics_or_layout',
] as const satisfies readonly EditReferenceBlockedTransfer[]

export interface EditReferenceExpectedEvidenceContract {
  readonly visualObservations: readonly string[]
  readonly storyObservations: readonly string[]
  readonly captionObservations: readonly string[]
  readonly colorObservations: readonly string[]
  readonly speechPacingObservations: readonly string[]
  readonly brollObservations: readonly string[]
  readonly audioObservations: readonly string[]
  readonly graphicMotionObservations: readonly string[]
  readonly transferableRules: readonly string[]
  readonly nonTransferableRules: readonly string[]
}

export interface EditReferenceControlledReferenceFixture {
  readonly id: 'reference_a_travel_story' | 'reference_b_educational_voice_first' | 'reference_c_product_commercial'
  readonly canonicalLabel: 'Reference A' | 'Reference B' | 'Reference C'
  readonly title: string
  readonly profile: string
  readonly rightsBasis: 'synthetic_internal'
  readonly runtimeStatus: EditReferenceControlledFixtureRuntimeStatus
  readonly expectedEvidence: EditReferenceExpectedEvidenceContract
}

export interface EditReferenceTargetUnderstandingContract {
  readonly sourceSummary: readonly string[]
  readonly storyStructure: readonly string[]
  readonly visualOpportunities: readonly string[]
  readonly audioState: readonly string[]
  readonly captionRequirements: readonly string[]
  readonly graphicMotionNeeds: readonly string[]
  readonly limitations: readonly string[]
}

export interface EditReferenceControlledTargetFixture {
  readonly id:
    | 'target_a_educational_product_demo'
    | 'target_b_travel_talking_head'
    | 'target_c_silent_visual_montage'
    | 'target_d_voice_first_software_tutorial'
  readonly canonicalLabel: 'Target A' | 'Target B' | 'Target C' | 'Target D'
  readonly title: string
  readonly profile: string
  readonly rightsBasis: 'synthetic_internal'
  readonly runtimeStatus: EditReferenceControlledFixtureRuntimeStatus
  readonly hasSpeech: boolean
  readonly hasSourceAudio: boolean
  readonly expectedUnderstanding: EditReferenceTargetUnderstandingContract
}

export interface EditReferenceControlledAdaptationCase {
  readonly id:
    | 'travel_to_educational_product'
    | 'travel_to_travel_talking_head'
    | 'educational_to_product_demo'
    | 'visual_heavy_to_sparse_talking_head'
    | 'caption_heavy_to_silent_visual'
    | 'audio_heavy_to_voice_first_tutorial'
  readonly referenceFixtureId: EditReferenceControlledReferenceFixture['id']
  readonly targetFixtureId: EditReferenceControlledTargetFixture['id']
  readonly proofPurpose: string
  readonly expectedAppliedPrinciples: readonly string[]
  readonly expectedAdaptedPrinciples: readonly string[]
  readonly expectedHeldBackPrinciples: readonly string[]
  readonly blockedTransfers: readonly EditReferenceBlockedTransfer[]
  readonly expectedTargetInstructions: readonly string[]
  readonly mustMateriallyDifferFrom: readonly EditReferenceControlledAdaptationCase['id'][]
}

export const EDIT_REFERENCE_CONTROLLED_REFERENCE_FIXTURES = [
  {
    id: 'reference_a_travel_story',
    canonicalLabel: 'Reference A',
    title: 'Warm travel story with restrained sound design',
    profile: 'Travel/story edit with warm grade, meaning-led B-roll, readable captions, music, and restrained cue-linked SFX.',
    rightsBasis: 'synthetic_internal',
    runtimeStatus: 'specification_ready_media_fixture_pending',
    expectedEvidence: {
      visualObservations: [
        'Environment, speaker, and detail shots alternate to support the narrated journey.',
        'Framing moves from establishing context to human-scale moments and object details.',
        'Transitions remain restrained and motivated by location, action, or story change.',
      ],
      storyObservations: [
        'A destination or expectation hook introduces the journey.',
        'The middle progresses through discovery and contrast rather than disconnected highlights.',
        'The ending allows a reflective emotional beat instead of an abrupt montage stop.',
      ],
      captionObservations: [
        'Clean one- or two-line captions support speech without dominating the travel imagery.',
        'Keyword emphasis is sparse and meaning-led.',
        'Caption placement protects faces, locations, and important environmental details.',
      ],
      colorObservations: [
        'Warm-lifestyle treatment keeps whites and skin tones believable.',
        'Highlights remain controlled in bright outdoor material.',
        'Scene matching avoids abrupt warm/cool drift.',
      ],
      speechPacingObservations: [
        'Conversational sentence rhythm is moderately paced.',
        'Reflective pauses remain where they carry story meaning.',
        'Cuts and visual reveals avoid interrupting important words.',
      ],
      brollObservations: [
        'Environment, travel details, and object close-ups support specific narration beats.',
        'B-roll is not inserted solely to increase visual variety.',
      ],
      audioObservations: [
        'A warm music bed follows the emotional progression and ducks under speech.',
        'Ambient texture supports place without masking narration.',
        'Restrained SFX are attached only to visible or transitional cues.',
      ],
      graphicMotionObservations: [
        'Location cards and lower thirds are minimal and readable.',
        'Motion intensity stays below the footage and story.',
      ],
      transferableRules: [
        'Use meaning-led environmental B-roll where the target has relevant source material.',
        'Preserve emotional breathing room while protecting speech clarity.',
        'Use warm, natural color principles only where they suit the target subject and footage.',
        'Keep music and SFX subordinate to narration and visible cues.',
      ],
      nonTransferableRules: [
        'Do not reuse travel footage, places, people, logos, or creator identity.',
        'Do not copy exact shot order, timecodes, caption wording, music, ambience, or SFX.',
        'Do not recreate a distinctive location card or graphic layout exactly.',
      ],
    },
  },
  {
    id: 'reference_b_educational_voice_first',
    canonicalLabel: 'Reference B',
    title: 'Clean educational edit with voice-first clarity',
    profile: 'Educational edit with structured explanation, clean captions, restrained diagrams, minimal music, and speech-first timing.',
    rightsBasis: 'synthetic_internal',
    runtimeStatus: 'specification_ready_media_fixture_pending',
    expectedEvidence: {
      visualObservations: [
        'The speaker remains the primary source of authority.',
        'Diagrams, labels, and examples appear only when they clarify the spoken concept.',
        'Visual density stays controlled so each idea has a clear focal point.',
      ],
      storyObservations: [
        'The explanation moves from problem or question to concept, example, and takeaway.',
        'Topic changes align with phrase or section boundaries.',
        'Information density increases only after the core concept is established.',
      ],
      captionObservations: [
        'Sentence-block or clean-subtitle captions prioritize comprehension.',
        'Line breaks follow phrases and avoid orphaned words.',
        'Labels and captions use separate safe zones and do not collide.',
      ],
      colorObservations: [
        'Clean natural or high-key treatment keeps the speaker and teaching surface legible.',
        'White balance, exposure, and skin tones remain neutral.',
        'Graphics use a restrained palette distinct from source correction.',
      ],
      speechPacingObservations: [
        'Phrase-based pacing leaves enough time for each concept and label.',
        'Speech clarity outranks beat alignment or decorative motion.',
        'Pause tightening preserves instructional meaning.',
      ],
      brollObservations: [
        'Screen captures, examples, and diagrams replace generic stock-like cutaways.',
        'Every visual insert resolves a specific explanatory need.',
      ],
      audioObservations: [
        'Voice is consistently leveled and remains the dominant audio element.',
        'Music is absent or minimal and carefully ducked.',
        'SFX are limited to justified label, step, or UI reveals.',
      ],
      graphicMotionObservations: [
        'Labels, step cards, and diagrams use controlled deterministic layouts.',
        'Entry motion is restrained and synchronized to the relevant phrase.',
      ],
      transferableRules: [
        'Structure explanations around concept, example, and takeaway.',
        'Synchronize labels and diagrams to spoken meaning.',
        'Protect voice clarity and readable caption timing.',
        'Prefer deterministic graphics over generated video when exact text matters.',
      ],
      nonTransferableRules: [
        'Do not copy lesson wording, examples, diagrams, labels, or screen content.',
        'Do not reuse the speaker, voice, brand, typography, or exact layout.',
        'Do not transfer sentence timing or section order without target evidence.',
      ],
    },
  },
  {
    id: 'reference_c_product_commercial',
    canonicalLabel: 'Reference C',
    title: 'Product commercial with precise captions and UI motion',
    profile: 'Product/commercial edit with benefit-led structure, UI cards, precise captions, clean motion graphics, and polished but restrained sound.',
    rightsBasis: 'synthetic_internal',
    runtimeStatus: 'specification_ready_media_fixture_pending',
    expectedEvidence: {
      visualObservations: [
        'Product and interface details remain visible during benefit claims.',
        'Cards and screen regions create a clear hierarchy without obscuring the demonstration.',
        'Camera or editor motion is purposeful and lands on product actions.',
      ],
      storyObservations: [
        'The structure moves from problem to feature, benefit, proof, and action.',
        'Each section earns its next claim with visible product evidence.',
        'The ending resolves with a concise target-specific action rather than a generic slogan.',
      ],
      captionObservations: [
        'Precise captions and callouts use short, readable chunks.',
        'Emphasis follows benefits and product actions instead of arbitrary keywords.',
        'Caption zones avoid interface controls and product details.',
      ],
      colorObservations: [
        'Premium-clean or high-key treatment keeps product colors accurate.',
        'Generated and deterministic graphic layers match the source footage and panel background.',
        'Contrast remains polished without crushed interface detail.',
      ],
      speechPacingObservations: [
        'Benefit-led narration is tight but leaves demonstrations enough hold time.',
        'Feature names and actions receive readable emphasis windows.',
        'Transitions occur after phrase or action boundaries.',
      ],
      brollObservations: [
        'Product shots and screen recordings support claims directly.',
        'Proof visuals take priority over generic lifestyle imagery.',
      ],
      audioObservations: [
        'A subtle premium bed is ducked around narration.',
        'UI or card SFX are sparse, cue-linked, and consistent.',
        'No sound effect masks feature names or instructions.',
      ],
      graphicMotionObservations: [
        'UI cards, labels, and split panels use exact deterministic composition.',
        'Entry and exit behavior follows product actions and phrase timing.',
        'Motion density remains controlled even when several features are shown.',
      ],
      transferableRules: [
        'Use problem, feature, benefit, proof, and action as a target-adapted narrative option.',
        'Keep product evidence visible and synchronize callouts to target actions.',
        'Use deterministic composition for exact text, UI, numbers, and labels.',
        'Use restrained cue-linked UI sound with voice-first ducking.',
      ],
      nonTransferableRules: [
        'Do not copy product screens, claims, brand identity, card design, or interface layout.',
        'Do not reuse exact caption text, feature sequence, timecodes, music, or UI SFX.',
        'Do not imply target product capabilities not supported by target evidence.',
      ],
    },
  },
] as const satisfies readonly EditReferenceControlledReferenceFixture[]

export const EDIT_REFERENCE_CONTROLLED_TARGET_FIXTURES = [
  {
    id: 'target_a_educational_product_demo',
    canonicalLabel: 'Target A',
    title: 'Educational product demonstration',
    profile: 'A voice-led product explanation with screen evidence, a confirmed 16:9 frame, and instructional rather than travel or lifestyle goals.',
    rightsBasis: 'synthetic_internal',
    runtimeStatus: 'specification_ready_media_fixture_pending',
    hasSpeech: true,
    hasSourceAudio: true,
    expectedUnderstanding: {
      sourceSummary: ['One presenter explains a generic product while a rights-safe interface demonstration provides evidence.'],
      storyStructure: ['Question or problem, guided demonstration, verified benefit, and concise takeaway.'],
      visualOpportunities: ['Screen crops, cursor-safe highlights, step cards, and product detail holds.'],
      audioState: ['Voice-first source audio; optional minimal music must duck below instruction.'],
      captionRequirements: ['Phrase-based readable captions that avoid interface controls and callouts.'],
      graphicMotionNeeds: ['Deterministic labels and step cards synchronized to demonstrated actions.'],
      limitations: ['No travel footage, lifestyle identity, unsupported product claim, or exact reference layout may transfer.'],
    },
  },
  {
    id: 'target_b_travel_talking_head',
    canonicalLabel: 'Target B',
    title: 'Sparse travel talking-head source',
    profile: 'A portrait talking-head travel account with limited target-owned B-roll, conversational speech, and a confirmed 9:16 frame.',
    rightsBasis: 'synthetic_internal',
    runtimeStatus: 'specification_ready_media_fixture_pending',
    hasSpeech: true,
    hasSourceAudio: true,
    expectedUnderstanding: {
      sourceSummary: ['One speaker tells a travel experience with a small set of target-owned environment and detail shots.'],
      storyStructure: ['Personal hook, chronological experience, contrast, and reflection.'],
      visualOpportunities: ['Face-safe captions, available travel details, restrained location context, and natural cutaways.'],
      audioState: ['Conversational voice with natural pauses and usable ambience.'],
      captionRequirements: ['Short portrait-safe chunks that avoid the face and lower interface region.'],
      graphicMotionNeeds: ['Minimal location or context cards only when the target story requires them.'],
      limitations: ['Sparse B-roll prevents a visual-heavy treatment; missing target visuals must not be replaced by reference footage.'],
    },
  },
  {
    id: 'target_c_silent_visual_montage',
    canonicalLabel: 'Target C',
    title: 'Silent visual montage',
    profile: 'A speech-free 4:5 montage whose story must come from target-owned visual order, authored text cards, and restrained music/SFX planning.',
    rightsBasis: 'synthetic_internal',
    runtimeStatus: 'specification_ready_media_fixture_pending',
    hasSpeech: false,
    hasSourceAudio: false,
    expectedUnderstanding: {
      sourceSummary: ['A sequence of target-owned visual clips with no transcript or usable source audio.'],
      storyStructure: ['Visual setup, progression, contrast, and closing image derived from target content.'],
      visualOpportunities: ['Rhythmic visual grouping, authored title cards, and target-specific detail emphasis.'],
      audioState: ['No source audio; any music or SFX requires separate rights and approval.'],
      captionRequirements: ['No speech captions; only concise authored context or accessibility text where needed.'],
      graphicMotionNeeds: ['Simple title and context cards that preserve montage imagery and read time.'],
      limitations: ['Speech timing, exact reference captions, voice pacing, and reference music cannot transfer.'],
    },
  },
  {
    id: 'target_d_voice_first_software_tutorial',
    canonicalLabel: 'Target D',
    title: 'Voice-first software tutorial',
    profile: 'A 16:9 narrated software tutorial with dense screen evidence, sequential instructions, and speech clarity as the top timing priority.',
    rightsBasis: 'synthetic_internal',
    runtimeStatus: 'specification_ready_media_fixture_pending',
    hasSpeech: true,
    hasSourceAudio: true,
    expectedUnderstanding: {
      sourceSummary: ['Narration explains a sequence of generic software actions over target-owned screen capture.'],
      storyStructure: ['Goal, prerequisites, sequential steps, verification, and recap.'],
      visualOpportunities: ['Cursor-safe zooms, highlights, numbered steps, and verification states.'],
      audioState: ['Dense instructional speech; music and SFX must remain minimal and never mask words.'],
      captionRequirements: ['Accurate phrase-timed captions with screen-control collision avoidance.'],
      graphicMotionNeeds: ['Deterministic step labels and callouts with sufficient hold time.'],
      limitations: ['Required tutorial steps cannot be removed for reference pacing; target screen truth controls the sequence.'],
    },
  },
] as const satisfies readonly EditReferenceControlledTargetFixture[]

export const EDIT_REFERENCE_CONTROLLED_ADAPTATION_CASES = [
  {
    id: 'travel_to_educational_product',
    referenceFixtureId: 'reference_a_travel_story',
    targetFixtureId: 'target_a_educational_product_demo',
    proofPurpose: 'Prove that warm travel principles adapt into a clear product lesson without importing travel content or sequence.',
    expectedAppliedPrinciples: ['meaning-led supporting visuals', 'speech-safe timing', 'restrained cue-linked sound'],
    expectedAdaptedPrinciples: ['warm lifestyle color becomes clean product-safe warmth', 'travel B-roll becomes target-owned screen and product evidence'],
    expectedHeldBackPrinciples: ['destination hook', 'travel ambience', 'chronological travel sequence'],
    blockedTransfers: EDIT_REFERENCE_UNIVERSAL_BLOCKED_TRANSFERS,
    expectedTargetInstructions: ['Prioritize product comprehension and verified screen evidence.', 'Use the target narration and demonstrated actions as timing authority.'],
    mustMateriallyDifferFrom: ['travel_to_travel_talking_head'],
  },
  {
    id: 'travel_to_travel_talking_head',
    referenceFixtureId: 'reference_a_travel_story',
    targetFixtureId: 'target_b_travel_talking_head',
    proofPurpose: 'Prove that a closely related target can retain more travel language while still adapting to sparse target-owned footage.',
    expectedAppliedPrinciples: ['warm natural treatment', 'meaning-led travel details', 'reflective breathing room', 'restrained sound design'],
    expectedAdaptedPrinciples: ['visual density is reduced to match sparse target B-roll', 'caption placement adapts to the portrait speaker'],
    expectedHeldBackPrinciples: ['unavailable locations', 'reference shot density', 'reference journey order'],
    blockedTransfers: EDIT_REFERENCE_UNIVERSAL_BLOCKED_TRANSFERS,
    expectedTargetInstructions: ['Keep the target speaker authoritative.', 'Use only available target-owned travel shots and preserve natural pauses.'],
    mustMateriallyDifferFrom: ['travel_to_educational_product'],
  },
  {
    id: 'educational_to_product_demo',
    referenceFixtureId: 'reference_b_educational_voice_first',
    targetFixtureId: 'target_a_educational_product_demo',
    proofPurpose: 'Prove target-aligned educational structure while replacing every example, label, and diagram with target evidence.',
    expectedAppliedPrinciples: ['concept-example-takeaway structure', 'voice-first mix', 'phrase-linked labels', 'deterministic exact-text graphics'],
    expectedAdaptedPrinciples: ['generic teaching examples become product demonstrations', 'diagram support becomes screen and feature evidence'],
    expectedHeldBackPrinciples: ['reference lesson wording', 'reference examples', 'reference diagram composition'],
    blockedTransfers: EDIT_REFERENCE_UNIVERSAL_BLOCKED_TRANSFERS,
    expectedTargetInstructions: ['Use the target product flow as the source of truth.', 'Hold each demonstrated action long enough to understand.'],
    mustMateriallyDifferFrom: ['travel_to_educational_product'],
  },
  {
    id: 'visual_heavy_to_sparse_talking_head',
    referenceFixtureId: 'reference_c_product_commercial',
    targetFixtureId: 'target_b_travel_talking_head',
    proofPurpose: 'Prove that visual-heavy reference motion is held back when the target lacks matching product or UI evidence.',
    expectedAppliedPrinciples: ['clear hierarchy', 'precise readable captions', 'cue-linked motion only when justified'],
    expectedAdaptedPrinciples: ['UI cards become minimal target-specific context cards', 'motion density is reduced around the target speaker'],
    expectedHeldBackPrinciples: ['product interface motion', 'split-panel feature sequence', 'commercial CTA structure'],
    blockedTransfers: EDIT_REFERENCE_UNIVERSAL_BLOCKED_TRANSFERS,
    expectedTargetInstructions: ['Protect the speaker and sparse travel footage from graphic clutter.', 'Prefer natural cutaways over invented product-style visuals.'],
    mustMateriallyDifferFrom: ['travel_to_travel_talking_head'],
  },
  {
    id: 'caption_heavy_to_silent_visual',
    referenceFixtureId: 'reference_c_product_commercial',
    targetFixtureId: 'target_c_silent_visual_montage',
    proofPurpose: 'Prove that reference speech captions do not become fabricated transcript captions on a silent target.',
    expectedAppliedPrinciples: ['readable hierarchy', 'safe text placement', 'controlled entry and exit motion'],
    expectedAdaptedPrinciples: ['speech captions become concise authored context cards only when needed', 'timing follows target visual rhythm and read time'],
    expectedHeldBackPrinciples: ['word-level emphasis', 'feature-callout sequence', 'speech-aligned caption timing'],
    blockedTransfers: EDIT_REFERENCE_UNIVERSAL_BLOCKED_TRANSFERS,
    expectedTargetInstructions: ['Do not invent speech or transcript evidence.', 'Use target-authored context and accessibility text only.'],
    mustMateriallyDifferFrom: ['educational_to_product_demo'],
  },
  {
    id: 'audio_heavy_to_voice_first_tutorial',
    referenceFixtureId: 'reference_a_travel_story',
    targetFixtureId: 'target_d_voice_first_software_tutorial',
    proofPurpose: 'Prove that audio principles reduce to voice protection when a target contains dense instructional speech.',
    expectedAppliedPrinciples: ['voice-first ducking', 'speech-safe transition timing', 'cue-linked sound only'],
    expectedAdaptedPrinciples: ['travel music energy becomes minimal tutorial support', 'ambience and emotional SFX become sparse interface cues where justified'],
    expectedHeldBackPrinciples: ['travel ambience', 'emotional music progression', 'destination transition sounds'],
    blockedTransfers: EDIT_REFERENCE_UNIVERSAL_BLOCKED_TRANSFERS,
    expectedTargetInstructions: ['Instructional speech and required steps outrank beat alignment.', 'Use silence when music or SFX would reduce comprehension.'],
    mustMateriallyDifferFrom: ['travel_to_travel_talking_head'],
  },
] as const satisfies readonly EditReferenceControlledAdaptationCase[]

export const EDIT_REFERENCE_CONTROLLED_FIXTURE_CATALOG = {
  version: EDIT_REFERENCE_CONTROLLED_FIXTURE_CATALOG_VERSION,
  runtimeStatus: 'specification_ready_media_fixture_pending' as const,
  references: EDIT_REFERENCE_CONTROLLED_REFERENCE_FIXTURES,
  targets: EDIT_REFERENCE_CONTROLLED_TARGET_FIXTURES,
  adaptations: EDIT_REFERENCE_CONTROLLED_ADAPTATION_CASES,
  semanticRuntimeExecuted: false,
  mediaFixtureGenerated: false,
  providerCallMade: false,
  remoteMutationMade: false,
  productionReady: false,
}
