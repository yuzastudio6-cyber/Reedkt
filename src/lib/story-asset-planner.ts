import type {
  AdaptiveEditStrategyPlan,
  FrameTemplateType,
  PlannerInput,
  SignatureSystem,
  VideoUnderstandingReport,
  VisualAssetPlanItem,
  VisualSupportOpportunityType,
  VisualAssetType,
} from '../types/reeditpro'
import { selectProviderRoute } from './provider-router'
import { selectStyleMode } from './style-modes'

type BeatSeed = {
  beatLabel: string
  storyPurpose: string
  narrativePhase: string
  emotion: string
  actionIntensity: VisualAssetPlanItem['actionIntensity']
  assetType: VisualAssetType
  signatureSystem: SignatureSystem
  needsCharacterConsistency?: boolean
  needsStartFrame?: boolean
  needsEndFrame?: boolean
  recommendedDurationSeconds: number
  reason: string
  creditImpact: VisualAssetPlanItem['creditImpact']
  critical?: boolean
}

type CreateVisualAssetPlanOptions = {
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  videoUnderstandingReport?: VideoUnderstandingReport
}

function getFrameTemplateType(input: PlannerInput): FrameTemplateType {
  if (input.aspectRatio === 'let_ai_decide') {
    return 'let_ai_decide'
  }

  if (input.aspectRatio === '16:9') {
    return 'youtube_side_panel'
  }

  if (input.aspectRatio === '1:1') {
    return 'square_center_panel'
  }

  return 'vertical_talking_head_lower_panel'
}

function isBasic(input: PlannerInput) {
  return input.editLevel === 'basic'
}

function wantsMinimal(input: PlannerInput) {
  return input.visualPreference === 'keep_visuals_minimal' || input.visualPreference === 'no_extra_visuals'
}

function applyPreferenceAndLevel(input: PlannerInput, beats: BeatSeed[]): BeatSeed[] {
  let plannedBeats = [...beats]

  if (input.visualPreference === 'more_graphic_design') {
    plannedBeats = plannedBeats.map<BeatSeed>((beat) =>
      beat.signatureSystem === 'stroke_motion' && beat.actionIntensity === 'low'
        ? {
            ...beat,
            assetType: 'graphic_design_frame',
            signatureSystem: 'graphic_design',
            recommendedDurationSeconds: 0,
            reason: `${beat.reason} Visual preference shifts low-action beats toward controlled graphic frames.`,
          }
        : beat,
    )
  }

  if (input.visualPreference === 'more_stroke_motion') {
    plannedBeats = plannedBeats.map<BeatSeed>((beat) =>
      beat.assetType === 'still_with_editor_motion' || beat.assetType === 'still_scene'
        ? {
            ...beat,
            assetType: 'animated_scene',
            signatureSystem: 'stroke_motion',
            needsStartFrame: true,
            needsEndFrame: true,
            recommendedDurationSeconds: 5,
            reason: `${beat.reason} Visual preference asks for more Stroke Motion where story movement helps.`,
          }
        : beat,
    )
  }

  if (input.visualPreference === 'real_motion_if_useful' && input.editingCategory === 'business_brand') {
    plannedBeats.splice(Math.min(3, plannedBeats.length), 0, {
      beatLabel: 'Product proof motion',
      storyPurpose: 'Show a realistic object/product proof moment only if it helps the offer.',
      narrativePhase: 'proof',
      emotion: 'premium proof',
      actionIntensity: 'medium',
      assetType: 'real_motion_scene',
      signatureSystem: 'real_motion',
      needsStartFrame: true,
      needsEndFrame: false,
      recommendedDurationSeconds: input.editLevel === 'premium' ? 6 : 4,
      reason: 'Real Motion is allowed by preference and useful for object/product proof.',
      creditImpact: input.editLevel === 'premium' ? 'premium' : 'high',
      critical: input.editLevel === 'premium',
    })
  }

  if (wantsMinimal(input)) {
    plannedBeats = plannedBeats
      .filter((beat) => beat.assetType !== 'real_motion_scene')
      .map<BeatSeed>((beat) =>
        beat.signatureSystem === 'stroke_motion'
          ? {
              ...beat,
              assetType: beat.actionIntensity === 'high' ? 'still_with_editor_motion' : 'still_scene',
              needsEndFrame: false,
              recommendedDurationSeconds: 0,
              reason: `${beat.reason} Minimal visual preference converts nonessential animation into still/editor motion.`,
              creditImpact: beat.creditImpact === 'premium' || beat.creditImpact === 'high' ? 'medium' : beat.creditImpact,
            }
          : beat,
      )
  }

  if (isBasic(input)) {
    plannedBeats = plannedBeats
      .filter((beat) => beat.assetType !== 'real_motion_scene')
      .map<BeatSeed>((beat) =>
        beat.assetType === 'animated_scene' && beat.actionIntensity !== 'high'
          ? {
              ...beat,
              assetType: 'still_with_editor_motion',
              needsStartFrame: true,
              needsEndFrame: false,
              recommendedDurationSeconds: 0,
              reason: `${beat.reason} Basic keeps professional quality with fewer AI-video assets.`,
              creditImpact: beat.creditImpact === 'high' || beat.creditImpact === 'premium' ? 'medium' : beat.creditImpact,
            }
          : beat,
      )
      .slice(0, 4)
  }

  if (input.editLevel === 'premium') {
    return plannedBeats
  }

  if (input.editLevel === 'pro') {
    return plannedBeats.slice(0, 5)
  }

  return plannedBeats
}

function storytellingBeats(input: PlannerInput): BeatSeed[] {
  return [
    {
      beatLabel: 'Setup / normal situation',
      storyPurpose: 'Establish the human story before adding heavy visual motion.',
      narrativePhase: 'setup',
      emotion: 'warm setup',
      actionIntensity: 'low',
      assetType: input.editLevel === 'basic' ? 'still_with_editor_motion' : 'animated_scene',
      signatureSystem: 'stroke_motion',
      needsCharacterConsistency: true,
      needsStartFrame: true,
      needsEndFrame: input.editLevel !== 'basic',
      recommendedDurationSeconds: input.editLevel === 'basic' ? 0 : 5,
      reason: 'Storytelling uses motion for human setup only when it improves the opening beat.',
      creditImpact: input.editLevel === 'basic' ? 'low' : 'medium',
    },
    {
      beatLabel: 'Trigger / reveal',
      storyPurpose: 'Make the story turn visible through a clear motion beat.',
      narrativePhase: 'trigger reveal',
      emotion: 'suspicion reveal',
      actionIntensity: 'high',
      assetType: 'animated_scene',
      signatureSystem: 'stroke_motion',
      needsCharacterConsistency: true,
      needsStartFrame: true,
      needsEndFrame: true,
      recommendedDurationSeconds: 5,
      reason: 'Movement helps show the reveal and emotional shift.',
      creditImpact: 'medium',
      critical: input.editLevel === 'premium',
    },
    {
      beatLabel: 'Reaction / confusion',
      storyPurpose: 'Show a reaction beat without turning every segment into animation.',
      narrativePhase: 'reaction conflict',
      emotion: 'confusion tension',
      actionIntensity: 'medium',
      assetType: 'animated_scene',
      signatureSystem: 'stroke_motion',
      needsCharacterConsistency: true,
      needsStartFrame: true,
      needsEndFrame: true,
      recommendedDurationSeconds: 5,
      reason: 'A short Stroke Motion beat improves the reaction moment.',
      creditImpact: 'medium',
    },
    {
      beatLabel: 'Fact / character insert',
      storyPurpose: 'Clarify a key name, amount, or fact with a readable card.',
      narrativePhase: 'evidence',
      emotion: 'clear neutral',
      actionIntensity: 'low',
      assetType: 'fact_card',
      signatureSystem: 'graphic_design',
      recommendedDurationSeconds: 0,
      reason: 'Short factual inserts should be still/card assets for clarity and credit control.',
      creditImpact: 'low',
    },
    {
      beatLabel: 'Ending / consequence',
      storyPurpose: 'Land the consequence with restraint instead of over-animating.',
      narrativePhase: 'ending aftermath',
      emotion: 'sad aftermath',
      actionIntensity: 'medium',
      assetType: input.editLevel === 'basic' ? 'still_with_editor_motion' : 'animated_scene',
      signatureSystem: 'stroke_motion',
      needsCharacterConsistency: true,
      needsStartFrame: true,
      needsEndFrame: input.editLevel !== 'basic',
      recommendedDurationSeconds: input.editLevel === 'basic' ? 0 : 5,
      reason: 'The ending benefits from emotional visual support, but Basic can use editor motion.',
      creditImpact: input.editLevel === 'premium' ? 'medium' : 'low',
    },
  ]
}

function lifestyleBeats(): BeatSeed[] {
  return [
    {
      beatLabel: 'Natural opening',
      storyPurpose: 'Keep the creator footage primary and lightly polish the opening.',
      narrativePhase: 'setup',
      emotion: 'natural calm',
      actionIntensity: 'low',
      assetType: 'still_with_editor_motion',
      signatureSystem: 'graphic_design',
      recommendedDurationSeconds: 0,
      reason: 'Lifestyle edits should avoid heavy AI video unless movement clearly helps.',
      creditImpact: 'low',
    },
    {
      beatLabel: 'Light detail insert',
      storyPurpose: 'Use a still/editor motion detail to support the vlog or casual story.',
      narrativePhase: 'development',
      emotion: 'light upbeat',
      actionIntensity: 'low',
      assetType: 'graphic_design_frame',
      signatureSystem: 'graphic_design',
      recommendedDurationSeconds: 0,
      reason: 'Light graphics keep the source footage primary.',
      creditImpact: 'low',
    },
    {
      beatLabel: 'Optional emotion beat',
      storyPurpose: 'Add a small Stroke Motion moment only if the story needs emotion or action.',
      narrativePhase: 'reaction',
      emotion: 'casual emotional beat',
      actionIntensity: 'medium',
      assetType: 'animated_scene',
      signatureSystem: 'stroke_motion',
      needsStartFrame: true,
      needsEndFrame: false,
      recommendedDurationSeconds: 4,
      reason: 'A short animation can help a reaction beat without overwhelming lifestyle pacing.',
      creditImpact: 'medium',
    },
    {
      beatLabel: 'Clean ending',
      storyPurpose: 'Close with clean editor motion and captions.',
      narrativePhase: 'ending',
      emotion: 'clean resolution',
      actionIntensity: 'low',
      assetType: 'still_with_editor_motion',
      signatureSystem: 'graphic_design',
      recommendedDurationSeconds: 0,
      reason: 'A still/editor motion ending protects credits and keeps the edit natural.',
      creditImpact: 'low',
    },
  ]
}

function businessBeats(input: PlannerInput): BeatSeed[] {
  return [
    {
      beatLabel: 'Problem card',
      storyPurpose: 'Name the pain point or offer context clearly.',
      narrativePhase: 'problem',
      emotion: 'business clarity',
      actionIntensity: 'low',
      assetType: 'fact_card',
      signatureSystem: 'graphic_design',
      recommendedDurationSeconds: 0,
      reason: 'Business edits need clear cards before motion-heavy visuals.',
      creditImpact: 'low',
    },
    {
      beatLabel: 'Product / offer frame',
      storyPurpose: 'Frame the offer, service, or product in a polished controlled layout.',
      narrativePhase: 'offer',
      emotion: 'premium brand',
      actionIntensity: 'low',
      assetType: 'graphic_design_frame',
      signatureSystem: 'graphic_design',
      recommendedDurationSeconds: 0,
      reason: 'GPT-Image-2 creates the designed frame; ReeditPro keeps layout control.',
      creditImpact: 'medium',
    },
    {
      beatLabel: 'Feature motion design',
      storyPurpose: 'Animate a feature or framework with exact text and labels.',
      narrativePhase: 'feature',
      emotion: 'clear proof',
      actionIntensity: 'medium',
      assetType: 'motion_design_scene',
      signatureSystem: 'graphic_design',
      recommendedDurationSeconds: 4,
      reason: 'Controlled motion design is better than random AI video when exact labels matter.',
      creditImpact: 'medium',
    },
    {
      beatLabel: 'Proof / results card',
      storyPurpose: 'Show proof, metric, testimonial, or result without overclaiming.',
      narrativePhase: 'proof',
      emotion: 'trust proof',
      actionIntensity: 'low',
      assetType: 'fact_card',
      signatureSystem: 'graphic_design',
      recommendedDurationSeconds: 0,
      reason: 'Proof moments should stay readable and claim-safe.',
      creditImpact: 'low',
    },
    {
      beatLabel: input.visualPreference === 'real_motion_if_useful' ? 'Real Motion proof' : 'CTA frame',
      storyPurpose: input.visualPreference === 'real_motion_if_useful' ? 'Use realistic object motion for a product/proof moment.' : 'Close with a clean call-to-action card.',
      narrativePhase: 'result',
      emotion: 'premium result',
      actionIntensity: 'medium',
      assetType: input.visualPreference === 'real_motion_if_useful' ? 'real_motion_scene' : 'list_card',
      signatureSystem: input.visualPreference === 'real_motion_if_useful' ? 'real_motion' : 'graphic_design',
      needsStartFrame: input.visualPreference === 'real_motion_if_useful',
      needsEndFrame: false,
      recommendedDurationSeconds: input.visualPreference === 'real_motion_if_useful' ? 6 : 0,
      reason: input.visualPreference === 'real_motion_if_useful' ? 'Real Motion is useful only if product/object proof improves the video.' : 'A CTA card is clearer and lower-compute than unnecessary AI video.',
      creditImpact: input.visualPreference === 'real_motion_if_useful' ? 'premium' : 'low',
      critical: input.editLevel === 'premium' && input.visualPreference === 'real_motion_if_useful',
    },
  ]
}

function educationBeats(): BeatSeed[] {
  return [
    {
      beatLabel: 'Concept title card',
      storyPurpose: 'Introduce the concept with clear hierarchy.',
      narrativePhase: 'setup',
      emotion: 'educational clear',
      actionIntensity: 'low',
      assetType: 'graphic_design_frame',
      signatureSystem: 'graphic_design',
      recommendedDurationSeconds: 0,
      reason: 'Education starts with controlled VisualExplain rather than random AI video.',
      creditImpact: 'low',
    },
    {
      beatLabel: 'Step / list card',
      storyPurpose: 'Break the explanation into readable steps.',
      narrativePhase: 'development',
      emotion: 'structured learning',
      actionIntensity: 'low',
      assetType: 'list_card',
      signatureSystem: 'graphic_design',
      recommendedDurationSeconds: 0,
      reason: 'Lists and steps should stay exact and readable.',
      creditImpact: 'low',
    },
    {
      beatLabel: 'Diagram build',
      storyPurpose: 'Animate a concept, process, or framework deterministically.',
      narrativePhase: 'development',
      emotion: 'clarity',
      actionIntensity: 'medium',
      assetType: 'motion_design_scene',
      signatureSystem: 'graphic_design',
      recommendedDurationSeconds: 5,
      reason: 'Motion design explains the concept while keeping text and diagrams controlled.',
      creditImpact: 'medium',
    },
    {
      beatLabel: 'Example visual',
      storyPurpose: 'Show a simple example visual without overusing animation.',
      narrativePhase: 'example',
      emotion: 'practical example',
      actionIntensity: 'medium',
      assetType: 'still_with_editor_motion',
      signatureSystem: 'graphic_design',
      recommendedDurationSeconds: 0,
      reason: 'A still with editor motion is usually enough for examples.',
      creditImpact: 'low',
    },
    {
      beatLabel: 'Summary card',
      storyPurpose: 'Reinforce the core takeaway.',
      narrativePhase: 'summary',
      emotion: 'clear ending',
      actionIntensity: 'low',
      assetType: 'fact_card',
      signatureSystem: 'graphic_design',
      recommendedDurationSeconds: 0,
      reason: 'A concise card keeps the ending useful and low-compute.',
      creditImpact: 'low',
    },
  ]
}

function documentaryBeats(): BeatSeed[] {
  return [
    {
      beatLabel: 'Case setup / timeline',
      storyPurpose: 'Establish the sequence of events neutrally.',
      narrativePhase: 'setup timeline',
      emotion: 'documentary neutral',
      actionIntensity: 'low',
      assetType: 'timeline_card',
      signatureSystem: 'graphic_design',
      recommendedDurationSeconds: 0,
      reason: 'Case-study edits need neutral timelines before dramatized visuals.',
      creditImpact: 'medium',
    },
    {
      beatLabel: 'Character / name card',
      storyPurpose: 'Introduce a person, entity, or role safely.',
      narrativePhase: 'context',
      emotion: 'neutral evidence',
      actionIntensity: 'low',
      assetType: 'name_card',
      signatureSystem: 'graphic_design',
      recommendedDurationSeconds: 0,
      reason: 'Names and roles should be cards, not unnecessary animation.',
      creditImpact: 'low',
    },
    {
      beatLabel: 'Money trail / evidence board',
      storyPurpose: 'Show evidence, claims, or money movement in a claim-safe layout.',
      narrativePhase: 'evidence',
      emotion: 'investigative proof',
      actionIntensity: 'medium',
      assetType: 'graphic_design_frame',
      signatureSystem: 'graphic_design',
      recommendedDurationSeconds: 0,
      reason: 'Evidence must stay readable and neutral.',
      creditImpact: 'medium',
    },
    {
      beatLabel: 'Selected reenactment',
      storyPurpose: 'Animate only the action/reaction beat that helps the viewer understand what happened.',
      narrativePhase: 'reenactment conflict',
      emotion: 'tension reveal',
      actionIntensity: 'high',
      assetType: 'animated_scene',
      signatureSystem: 'stroke_motion',
      needsCharacterConsistency: true,
      needsStartFrame: true,
      needsEndFrame: true,
      recommendedDurationSeconds: 5,
      reason: 'Documentary animation is selective and story-led, not applied to every beat.',
      creditImpact: 'medium',
      critical: true,
    },
    {
      beatLabel: 'Fact safety card',
      storyPurpose: 'Separate verified facts from interpretation.',
      narrativePhase: 'fact safety',
      emotion: 'neutral clarity',
      actionIntensity: 'low',
      assetType: 'fact_card',
      signatureSystem: 'graphic_design',
      recommendedDurationSeconds: 0,
      reason: 'Claims and facts should stay in controlled cards.',
      creditImpact: 'low',
    },
    {
      beatLabel: 'Outcome / summary',
      storyPurpose: 'Close with the consequence or current status.',
      narrativePhase: 'outcome summary',
      emotion: 'aftermath',
      actionIntensity: 'low',
      assetType: 'timeline_card',
      signatureSystem: 'graphic_design',
      recommendedDurationSeconds: 0,
      reason: 'A timeline/summary card gives closure without speculative visuals.',
      creditImpact: 'low',
    },
  ]
}

function categoryBeats(input: PlannerInput): BeatSeed[] {
  if (input.visualPreference === 'no_extra_visuals') {
    return [
      {
        beatLabel: 'Essential context card',
        storyPurpose: 'Use only one essential card if the edit needs clarity.',
        narrativePhase: 'context',
        emotion: 'minimal',
        actionIntensity: 'low',
        assetType: 'fact_card',
        signatureSystem: 'graphic_design',
        recommendedDurationSeconds: 0,
        reason: 'No-extra-visual preference keeps the plan mostly captions and cleanup.',
        creditImpact: 'low',
      },
    ]
  }

  if (input.editingCategory === 'lifestyle') {
    return lifestyleBeats()
  }

  if (input.editingCategory === 'business_brand') {
    return businessBeats(input)
  }

  if (input.editingCategory === 'education_explainer') {
    return educationBeats()
  }

  if (input.editingCategory === 'documentary_case_study') {
    return documentaryBeats()
  }

  return storytellingBeats(input)
}

function beatFromOpportunity(
  type: VisualSupportOpportunityType,
  input: PlannerInput,
  reason: string,
): BeatSeed | undefined {
  switch (type) {
    case 'map_animation':
      return {
        beatLabel: 'Video understanding map beat',
        storyPurpose: 'Clarify location, route, neighborhood, or geography only where the report says it helps.',
        narrativePhase: 'location explanation',
        emotion: 'clear spatial context',
        actionIntensity: 'medium',
        assetType: 'motion_design_scene',
        signatureSystem: 'graphic_design',
        recommendedDurationSeconds: 4,
        reason: `${reason} Video understanding prefers a map/VisualExplain beat over a random animation.`,
        creditImpact: input.editLevel === 'basic' ? 'low' : 'medium',
      }
    case 'screen_capture':
      return {
        beatLabel: 'Video understanding screen beat',
        storyPurpose: 'Show the app, website, article, or dashboard moment with readable interface context.',
        narrativePhase: 'screen explanation',
        emotion: 'clear demonstration',
        actionIntensity: 'low',
        assetType: 'graphic_design_frame',
        signatureSystem: 'graphic_design',
        recommendedDurationSeconds: 0,
        reason: `${reason} Video understanding points to screen capture/product framing rather than generic AI video.`,
        creditImpact: 'low',
      }
    case 'chart_or_diagram':
    case 'graphic_explainer':
      return {
        beatLabel: 'Video understanding explainer beat',
        storyPurpose: 'Explain a process, money flow, framework, or feature with exact readable structure.',
        narrativePhase: 'explanation',
        emotion: 'structured clarity',
        actionIntensity: 'medium',
        assetType: 'motion_design_scene',
        signatureSystem: 'graphic_design',
        recommendedDurationSeconds: 4,
        reason: `${reason} Video understanding chose controlled VisualExplain because exact meaning matters.`,
        creditImpact: input.editLevel === 'basic' ? 'low' : 'medium',
      }
    case 'evidence_board':
      return {
        beatLabel: 'Video understanding evidence beat',
        storyPurpose: 'Group evidence, names, timeline, or source context without treating allegations as proven facts.',
        narrativePhase: 'evidence context',
        emotion: 'neutral proof',
        actionIntensity: 'low',
        assetType: 'graphic_design_frame',
        signatureSystem: 'graphic_design',
        recommendedDurationSeconds: 0,
        reason: `${reason} Evidence needs controlled cards/boards, not speculative visuals.`,
        creditImpact: 'medium',
      }
    case 'timeline_card':
      return {
        beatLabel: 'Video understanding timeline beat',
        storyPurpose: 'Make sequence or story progression readable.',
        narrativePhase: 'timeline',
        emotion: 'organized context',
        actionIntensity: 'low',
        assetType: 'timeline_card',
        signatureSystem: 'graphic_design',
        recommendedDurationSeconds: 0,
        reason: `${reason} Timeline clarity is more useful than decorative motion.`,
        creditImpact: 'low',
      }
    case 'name_card':
      return {
        beatLabel: 'Video understanding name card',
        storyPurpose: 'Introduce a person, company, or role with neutral context.',
        narrativePhase: 'context',
        emotion: 'neutral clarity',
        actionIntensity: 'low',
        assetType: 'name_card',
        signatureSystem: 'graphic_design',
        recommendedDurationSeconds: 0,
        reason: `${reason} Name/role context should stay readable and claim-safe.`,
        creditImpact: 'low',
      }
    case 'stroke_motion':
      return {
        beatLabel: 'Video understanding emotion beat',
        storyPurpose: 'Support an emotional or story beat without applying Stroke Motion to every segment.',
        narrativePhase: 'emotional beat',
        emotion: 'human story',
        actionIntensity: 'medium',
        assetType: input.editLevel === 'basic' ? 'still_with_editor_motion' : 'animated_scene',
        signatureSystem: 'stroke_motion',
        needsCharacterConsistency: true,
        needsStartFrame: true,
        needsEndFrame: input.editLevel !== 'basic',
        recommendedDurationSeconds: input.editLevel === 'basic' ? 0 : 4,
        reason: `${reason} Video understanding suggests restrained story visualization only where emotion matters.`,
        creditImpact: input.editLevel === 'basic' ? 'low' : 'medium',
      }
    case 'b_roll_cutaway':
      return {
        beatLabel: 'Video understanding b-roll beat',
        storyPurpose: 'Use uploaded support footage when it matches the spoken meaning.',
        narrativePhase: 'support',
        emotion: 'natural support',
        actionIntensity: 'low',
        assetType: 'still_with_editor_motion',
        signatureSystem: 'none',
        recommendedDurationSeconds: 0,
        reason: `${reason} Uploaded b-roll is preferred over generated filler.`,
        creditImpact: 'none',
      }
    case 'caption_only':
    case 'no_extra_visual':
      return undefined
    default:
      return undefined
  }
}

function beatsFromVideoUnderstanding(
  input: PlannerInput,
  report?: VideoUnderstandingReport,
): BeatSeed[] {
  if (!report) {
    return []
  }

  const visualPreferenceAvoidsExtras =
    input.visualPreference === 'no_extra_visuals' ||
    report.visualSupportOpportunities.some((opportunity) => opportunity.opportunityType === 'no_extra_visual')

  if (visualPreferenceAvoidsExtras) {
    return []
  }

  const seen = new Set<VisualSupportOpportunityType>()

  return report.visualSupportOpportunities
    .filter((opportunity) => {
      if (seen.has(opportunity.opportunityType)) return false
      seen.add(opportunity.opportunityType)
      return opportunity.priority !== 'low' || input.editLevel !== 'basic'
    })
    .map((opportunity) => beatFromOpportunity(opportunity.opportunityType, input, opportunity.reason))
    .filter((beat): beat is BeatSeed => Boolean(beat))
    .slice(0, input.editLevel === 'basic' ? 2 : 3)
}

function beatFromAdaptiveStrategy(
  strategy: AdaptiveEditStrategyPlan['segmentStrategies'][number],
  input: PlannerInput,
): BeatSeed | undefined {
  if (
    strategy.recommendedVisualSupport === 'caption_only' ||
    strategy.recommendedVisualSupport === 'no_extra_visual' ||
    !strategy.recommendedAssetType
  ) {
    return undefined
  }

  const assetType =
    strategy.generationRestraint === 'avoid_generation' && strategy.recommendedAssetType === 'animated_scene'
      ? 'motion_design_scene'
      : strategy.generationRestraint === 'avoid_generation' && strategy.recommendedAssetType === 'real_motion_scene'
        ? 'graphic_design_frame'
        : strategy.recommendedAssetType
  const signatureSystem =
    strategy.generationRestraint === 'avoid_generation' &&
    (strategy.recommendedSignatureSystem === 'stroke_motion' || strategy.recommendedSignatureSystem === 'real_motion')
      ? 'graphic_design'
      : strategy.recommendedSignatureSystem

  return {
    beatLabel: strategy.label,
    storyPurpose: strategy.reasons[0]?.explanation ?? strategy.qaChecks[0] ?? 'Support the adaptive segment strategy.',
    narrativePhase: strategy.segmentRole?.replaceAll('_', ' ') ?? 'adaptive strategy',
    emotion: strategy.creativeIntensity.replaceAll('_', ' '),
    actionIntensity: strategy.creativeIntensity === 'high_impact' || strategy.creativeIntensity === 'cinematic' ? 'high' : 'medium',
    assetType,
    signatureSystem,
    needsCharacterConsistency: strategy.recommendedVisualSupport === 'stroke_motion',
    needsStartFrame: signatureSystem === 'stroke_motion' || signatureSystem === 'real_motion',
    needsEndFrame: signatureSystem === 'stroke_motion' && input.editLevel !== 'basic',
    recommendedDurationSeconds: assetType === 'animated_scene' || assetType === 'real_motion_scene' || assetType === 'motion_design_scene' ? 4 : 0,
    reason: `Adaptive edit strategy: ${strategy.decisionKind.replaceAll('_', ' ')}. ${strategy.reasons.map((reason) => reason.explanation).slice(0, 2).join(' ')}`,
    creditImpact: strategy.costComplexity === 'premium' ? 'premium' : strategy.costComplexity === 'high' ? 'high' : strategy.costComplexity === 'medium' ? 'medium' : strategy.costComplexity === 'low' ? 'low' : 'none',
    critical: strategy.costComplexity === 'high' || strategy.costComplexity === 'premium',
  }
}

function beatsFromAdaptiveStrategy(input: PlannerInput, plan?: AdaptiveEditStrategyPlan): BeatSeed[] {
  if (!plan) {
    return []
  }

  return plan.segmentStrategies
    .filter((strategy) => strategy.generationRestraint !== 'avoid_generation' || strategy.recommendedSignatureSystem === 'graphic_design' || strategy.recommendedToolHints.includes('remotion_layout'))
    .map((strategy) => beatFromAdaptiveStrategy(strategy, input))
    .filter((beat): beat is BeatSeed => Boolean(beat))
    .slice(0, input.editLevel === 'basic' ? 2 : 4)
}

function mergeUnderstandingBeats(
  input: PlannerInput,
  baseBeats: BeatSeed[],
  report?: VideoUnderstandingReport,
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan,
) {
  const strategyBeats = beatsFromAdaptiveStrategy(input, adaptiveEditStrategyPlan)
  const understandingBeats = beatsFromVideoUnderstanding(input, report)

  if (understandingBeats.length === 0 && strategyBeats.length === 0) {
    return baseBeats
  }

  const keys = new Set<string>()

  return [...strategyBeats, ...understandingBeats, ...baseBeats].filter((beat) => {
    const key = `${beat.assetType}-${beat.signatureSystem}-${beat.narrativePhase}`
    if (keys.has(key)) return false
    keys.add(key)
    return true
  })
}

function qaChecksFor(seed: BeatSeed) {
  const checks = ['supports story beat', 'fits frame panel', 'avoids caption collision', 'respects approval and credit gate']

  if (seed.signatureSystem === 'real_motion') {
    checks.push('face-safe placement', 'realism does not distract from source footage')
  }

  if (seed.signatureSystem === 'graphic_design') {
    checks.push('exact text remains readable', 'claims stay neutral and fact-safe')
  }

  if (seed.needsCharacterConsistency) {
    checks.push('character consistency across stills and animation frames')
  }

  return checks
}

function buildItem(seed: BeatSeed, input: PlannerInput, index: number, frameTemplateType: FrameTemplateType): VisualAssetPlanItem {
  const styleModeId = selectStyleMode({
    actionIntensity: seed.actionIntensity,
    assetType: seed.assetType,
    editingCategory: input.editingCategory,
    emotion: seed.emotion,
    narrativePhase: seed.narrativePhase,
    signatureSystem: seed.signatureSystem,
  })
  const needsStartFrame = Boolean(seed.needsStartFrame)
  const needsEndFrame = Boolean(seed.needsEndFrame)

  return {
    id: `visual-asset-${index + 1}`,
    beatLabel: seed.beatLabel,
    storyPurpose: seed.storyPurpose,
    narrativePhase: seed.narrativePhase,
    emotion: seed.emotion,
    actionIntensity: seed.actionIntensity,
    assetType: seed.assetType,
    signatureSystem: seed.signatureSystem,
    styleModeId,
    frameTemplateType,
    needsCharacterConsistency: Boolean(seed.needsCharacterConsistency),
    needsStartFrame,
    needsEndFrame,
    recommendedDurationSeconds: seed.recommendedDurationSeconds,
    providerRoute: selectProviderRoute({
      actionIntensity: seed.actionIntensity,
      assetType: seed.assetType,
      editLevel: input.editLevel,
      isCriticalBeat: seed.critical,
      needsEndFrame,
      needsStartFrame,
      recommendedDurationSeconds: seed.recommendedDurationSeconds,
      signatureSystem: seed.signatureSystem,
    }),
    reason: seed.reason,
    qaChecks: qaChecksFor(seed),
    creditImpact: seed.creditImpact,
  }
}

export function createVisualAssetPlan(
  input: PlannerInput,
  options: CreateVisualAssetPlanOptions = {},
): VisualAssetPlanItem[] {
  const frameTemplateType = getFrameTemplateType(input)
  const plannedBeats = mergeUnderstandingBeats(input, categoryBeats(input), options.videoUnderstandingReport, options.adaptiveEditStrategyPlan)

  return applyPreferenceAndLevel(input, plannedBeats).map((seed, index) => buildItem(seed, input, index, frameTemplateType))
}
