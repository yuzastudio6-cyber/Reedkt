import type {
  AspectRatio,
  EditLevel,
  LayoutComplexity,
  LayoutRiskLevel,
  PlannerInput,
  SegmentEditPlan,
  SpeakerPresenceMode,
  SpeakerVisualLayoutMode,
  TargetPlatform,
  VisualAssetPlanItem,
  VisualDominanceMode,
} from '../types/reeditpro'

export type LayoutTierAvailability = Record<EditLevel, boolean>

export interface SpeakerVisualLayoutModeDefinition {
  id: SpeakerVisualLayoutMode
  label: string
  description: string
  bestUseCases: string[]
  avoidUseCases: string[]
  supportedAspectRatios: AspectRatio[]
  defaultSpeakerPresence: SpeakerPresenceMode
  defaultVisualDominance: VisualDominanceMode
  complexity: LayoutComplexity
  riskLevel: LayoutRiskLevel
  tierAvailability: LayoutTierAvailability
  preferredTools: string[]
  promptImplications: string[]
  remotionNotes: string[]
  qaChecks: string[]
  fallbackLayoutMode?: SpeakerVisualLayoutMode
}

type GetDefaultLayoutForAssetParams = {
  input: PlannerInput
  asset?: VisualAssetPlanItem
  segment?: SegmentEditPlan
}

const allRatios: AspectRatio[] = ['9:16', '16:9', '1:1', 'let_ai_decide']
const allTiers: LayoutTierAvailability = { basic: true, pro: true, premium: true }
const proPremiumOnly: LayoutTierAvailability = { basic: false, pro: true, premium: true }
const premiumOnly: LayoutTierAvailability = { basic: false, pro: false, premium: true }

function mode(definition: SpeakerVisualLayoutModeDefinition) {
  return definition
}

export const speakerVisualLayoutModes = [
  mode({
    id: 'full_speaker',
    label: 'Full speaker',
    description: 'Speaker or source footage carries the segment with no extra visual takeover.',
    bestUseCases: ['hooks', 'emotion', 'trust moments', 'personal story', 'CTA', 'simple points'],
    avoidUseCases: ['dense maps', 'charts', 'evidence boards', 'screen details', 'long exact text'],
    supportedAspectRatios: allRatios,
    defaultSpeakerPresence: 'full_speaker',
    defaultVisualDominance: 'none',
    complexity: 'simple',
    riskLevel: 'low',
    tierAvailability: allTiers,
    preferredTools: ['source footage', 'captions', 'editor cleanup'],
    promptImplications: ['No extra generated visual is required for this segment.'],
    remotionNotes: ['Speaker/source video owns the frame.'],
    qaChecks: ['Speaker face or source subject remains visible.', 'Captions do not cover the face.'],
  }),
  mode({
    id: 'voiceover_visual_takeover',
    label: 'Voiceover visual takeover',
    description: 'Speaker voice continues while a visual owns the frame.',
    bestUseCases: ['maps', 'charts', 'timelines', 'evidence boards', 'diagrams', 'screen focus'],
    avoidUseCases: ['emotional confessions', 'trust-building hooks', 'simple speaker-led lines'],
    supportedAspectRatios: allRatios,
    defaultSpeakerPresence: 'voice_only',
    defaultVisualDominance: 'full_takeover',
    complexity: 'moderate',
    riskLevel: 'medium',
    tierAvailability: allTiers,
    preferredTools: ['Remotion', 'GPT-Image-2', 'VisualExplain'],
    promptImplications: ['Asset may use more visual detail, but must preserve caption safe zones.'],
    remotionNotes: ['Visual layer dominates; speaker layer can be hidden or voice-only for this segment.'],
    qaChecks: ['Visual has enough space for detail.', 'Full takeover does not lose important context.'],
    fallbackLayoutMode: 'lower_visual_panel',
  }),
  mode({
    id: 'picture_in_picture_speaker',
    label: 'Picture-in-picture speaker',
    description: 'Visual dominates while the speaker remains visible in a compact PIP zone.',
    bestUseCases: ['education', 'screen captures', 'product demos', 'commentary', 'map walkthroughs'],
    avoidUseCases: ['crowded vertical scenes', 'tiny visual labels', 'strong emotional face moments'],
    supportedAspectRatios: allRatios,
    defaultSpeakerPresence: 'picture_in_picture',
    defaultVisualDominance: 'dominant',
    complexity: 'moderate',
    riskLevel: 'medium',
    tierAvailability: allTiers,
    preferredTools: ['Remotion', 'source footage', 'visual panel'],
    promptImplications: ['Leave a safe corner or edge zone for speaker PIP.'],
    remotionNotes: ['PIP speaker zone must avoid captions and visual labels.'],
    qaChecks: ['PIP does not cover important visual information.', 'Speaker remains readable when trust matters.'],
    fallbackLayoutMode: 'voiceover_visual_takeover',
  }),
  mode({
    id: 'side_by_side_speaker_visual',
    label: 'Side-by-side speaker visual',
    description: 'Speaker and visual share separate horizontal zones.',
    bestUseCases: ['YouTube', 'education', 'business', 'product demos', 'presentations'],
    avoidUseCases: ['tight vertical videos', 'full-screen evidence boards', 'simple emotional lines'],
    supportedAspectRatios: ['16:9', '1:1', 'let_ai_decide'],
    defaultSpeakerPresence: 'side_panel_speaker',
    defaultVisualDominance: 'balanced',
    complexity: 'moderate',
    riskLevel: 'medium',
    tierAvailability: proPremiumOnly,
    preferredTools: ['Remotion', 'VisualExplain', 'screen capture'],
    promptImplications: ['Design for the visual side and keep the speaker side clean.'],
    remotionNotes: ['Speaker and visual zones should be balanced and caption-safe.'],
    qaChecks: ['Side-by-side layout fits the aspect ratio.', 'Both speaker and visual remain readable.'],
    fallbackLayoutMode: 'lower_visual_panel',
  }),
  mode({
    id: 'vertical_speaker_top_visual_bottom',
    label: 'Vertical speaker top visual bottom',
    description: 'Speaker stays above a supporting lower visual zone.',
    bestUseCases: ['short-form teaching', 'simple proof', 'creator commentary', 'support graphics'],
    avoidUseCases: ['dense charts', 'tiny maps', 'full evidence boards'],
    supportedAspectRatios: ['9:16', 'let_ai_decide'],
    defaultSpeakerPresence: 'partial_speaker',
    defaultVisualDominance: 'balanced',
    complexity: 'moderate',
    riskLevel: 'low',
    tierAvailability: allTiers,
    preferredTools: ['Remotion', 'GPT-Image-2', 'editor motion'],
    promptImplications: ['Fit the asset into a compact lower panel with large readable labels.'],
    remotionNotes: ['Speaker top and visual bottom zones should keep captions face-safe.'],
    qaChecks: ['Lower visual is readable.', 'Captions avoid face and visual text.'],
    fallbackLayoutMode: 'lower_visual_panel',
  }),
  mode({
    id: 'vertical_visual_top_speaker_bottom',
    label: 'Vertical visual top speaker bottom',
    description: 'Visual leads on top while speaker/source remains visible below.',
    bestUseCases: ['visual hook', 'short-form demonstrations', 'quick concept setup'],
    avoidUseCases: ['emotion-first beats', 'crowded labels', 'weak visual support'],
    supportedAspectRatios: ['9:16', 'let_ai_decide'],
    defaultSpeakerPresence: 'partial_speaker',
    defaultVisualDominance: 'balanced',
    complexity: 'moderate',
    riskLevel: 'medium',
    tierAvailability: allTiers,
    preferredTools: ['Remotion', 'VisualExplain', 'source footage'],
    promptImplications: ['Keep top visual clear and leave lower speaker zone uncluttered.'],
    remotionNotes: ['Vertical split must not crowd captions or speaker framing.'],
    qaChecks: ['Visual hook is readable.', 'Speaker remains recognizable.'],
    fallbackLayoutMode: 'lower_visual_panel',
  }),
  mode({
    id: 'lower_visual_panel',
    label: 'Lower visual panel',
    description: 'Speaker remains primary while a compact supporting panel appears lower in frame.',
    bestUseCases: ['vertical short-form', 'simple labels', 'quick proof', 'supporting graphics'],
    avoidUseCases: ['dense evidence', 'detailed maps', 'long text'],
    supportedAspectRatios: allRatios,
    defaultSpeakerPresence: 'partial_speaker',
    defaultVisualDominance: 'support',
    complexity: 'simple',
    riskLevel: 'low',
    tierAvailability: allTiers,
    preferredTools: ['Remotion', 'GPT-Image-2', 'editor motion'],
    promptImplications: ['Asset must fit a compact lower panel with large readable labels.'],
    remotionNotes: ['Lower panel stays under speaker/source footage with matching background.'],
    qaChecks: ['Panel text is readable.', 'Panel does not collide with captions.'],
  }),
  mode({
    id: 'full_graphic_explainer',
    label: 'Full graphic explainer',
    description: 'A full-frame controlled graphic explains a concept, framework, or process.',
    bestUseCases: ['diagrams', 'steps', 'frameworks', 'lists', 'processes'],
    avoidUseCases: ['speaker emotion', 'trust hooks', 'source footage that already explains the point'],
    supportedAspectRatios: allRatios,
    defaultSpeakerPresence: 'voice_only',
    defaultVisualDominance: 'full_takeover',
    complexity: 'moderate',
    riskLevel: 'medium',
    tierAvailability: allTiers,
    preferredTools: ['Remotion', 'GPT-Image-2', 'VisualExplain'],
    promptImplications: ['Use clear graphic hierarchy and preserve caption safe zone.'],
    remotionNotes: ['Full graphic owns the visual zone; Remotion controls final text timing.'],
    qaChecks: ['Graphic text is readable.', 'No clutter or random elements.'],
    fallbackLayoutMode: 'voiceover_visual_takeover',
  }),
  mode({
    id: 'full_stroke_motion_scene',
    label: 'Full Stroke Motion scene',
    description: 'A self-contained Stroke Motion visual story scene takes over the segment.',
    bestUseCases: ['story transformation', 'reveal', 'action', 'emotion', 'cause and effect'],
    avoidUseCases: ['dense factual proof', 'real named people without safety planning', 'Basic default planning'],
    supportedAspectRatios: allRatios,
    defaultSpeakerPresence: 'voice_only',
    defaultVisualDominance: 'full_takeover',
    complexity: 'moderate',
    riskLevel: 'medium',
    tierAvailability: { basic: false, pro: true, premium: true },
    preferredTools: ['Stroke Motion', 'GPT-Image-2', 'Wan', 'Hailuo', 'Remotion'],
    promptImplications: ['Create an asset/clip only; keep action inside the assigned visual zone.'],
    remotionNotes: ['Remotion places the Stroke Motion scene into the approved canvas.'],
    qaChecks: ['Motion supports the story beat.', 'Character/style consistency is preserved.'],
    fallbackLayoutMode: 'lower_visual_panel',
  }),
  mode({
    id: 'full_map_takeover',
    label: 'Full map takeover',
    description: 'A map owns the frame while the voice explains location, route, or geography.',
    bestUseCases: ['location', 'route', 'city', 'country', 'travel', 'real estate', 'distance'],
    avoidUseCases: ['decorative map references', 'emotional speaker-first lines'],
    supportedAspectRatios: allRatios,
    defaultSpeakerPresence: 'voice_only',
    defaultVisualDominance: 'full_takeover',
    complexity: 'moderate',
    riskLevel: 'medium',
    tierAvailability: allTiers,
    preferredTools: ['MapLibre', 'Turf', 'Remotion'],
    promptImplications: ['Map labels, pins, routes, and captions must remain readable.'],
    remotionNotes: ['Map placement is controlled by Remotion, not provider full-canvas generation.'],
    qaChecks: ['Map labels are readable.', 'Location treatment is accurate to user-provided context.'],
    fallbackLayoutMode: 'lower_visual_panel',
  }),
  mode({
    id: 'full_evidence_board',
    label: 'Full evidence board',
    description: 'A documentary or case-study board shows names, sources, timeline, claims, or money trail.',
    bestUseCases: ['documentary', 'case study', 'timeline', 'money trail', 'claim context', 'source cards'],
    avoidUseCases: ['unverified claims shown as fact', 'guilt-implying visuals', 'crowded text'],
    supportedAspectRatios: allRatios,
    defaultSpeakerPresence: 'voice_only',
    defaultVisualDominance: 'full_takeover',
    complexity: 'moderate',
    riskLevel: 'medium',
    tierAvailability: allTiers,
    preferredTools: ['Remotion', 'GPT-Image-2', 'D3'],
    promptImplications: ['Use clear documentary hierarchy and neutral claim treatment.'],
    remotionNotes: ['Evidence board is a controlled composition; Remotion owns final placement.'],
    qaChecks: ['Allegations are not visualized as proven facts.', 'Sources and claim status remain clear.'],
    fallbackLayoutMode: 'voiceover_visual_takeover',
  }),
  mode({
    id: 'screen_capture_with_speaker_pip',
    label: 'Screen capture with speaker PIP',
    description: 'A screen, app, website, dashboard, or article dominates with speaker PIP.',
    bestUseCases: ['SaaS', 'browser', 'dashboard', 'article', 'app demo', 'screen recording'],
    avoidUseCases: ['tiny unreadable UI', 'emotion-first lines', 'decorative web screenshots'],
    supportedAspectRatios: allRatios,
    defaultSpeakerPresence: 'picture_in_picture',
    defaultVisualDominance: 'dominant',
    complexity: 'moderate',
    riskLevel: 'medium',
    tierAvailability: allTiers,
    preferredTools: ['Playwright', 'Remotion'],
    promptImplications: ['Leave a safe PIP zone and keep UI text readable.'],
    remotionNotes: ['Screen capture remains an asset/source layer; Remotion owns PIP and captions.'],
    qaChecks: ['PIP does not cover key UI.', 'Screen text remains readable.'],
    fallbackLayoutMode: 'voiceover_visual_takeover',
  }),
  mode({
    id: 'speaker_cutout_overlay',
    label: 'Speaker cutout overlay',
    description: 'Future speaker cutout overlays a dominant visual.',
    bestUseCases: ['Premium explainers', 'speaker-plus-visual authority', 'advanced composite moments'],
    avoidUseCases: ['Basic/Pro defaults', 'unclear foreground edges', 'current no-masking milestones'],
    supportedAspectRatios: allRatios,
    defaultSpeakerPresence: 'partial_speaker',
    defaultVisualDominance: 'dominant',
    complexity: 'premium',
    riskLevel: 'high',
    tierAvailability: premiumOnly,
    preferredTools: ['future foreground masking', 'future depth-aware compositor', 'Remotion'],
    promptImplications: ['Plan only. Do not execute real cutout or masking in this milestone.'],
    remotionNotes: ['Actual cutout/masking is future RP-LAYOUT-02 work.'],
    qaChecks: ['Fallback layout exists.', 'No current worker treats masking as implemented.'],
    fallbackLayoutMode: 'picture_in_picture_speaker',
  }),
  mode({
    id: 'b_roll_cutaway',
    label: 'B-roll cutaway',
    description: 'Uploaded b-roll or proof footage takes over while voice continues.',
    bestUseCases: ['uploaded b-roll', 'proof clips', 'environment', 'product detail', 'room walkthrough'],
    avoidUseCases: ['random filler', 'speaker emotion moments', 'unrelated stock-like visuals'],
    supportedAspectRatios: allRatios,
    defaultSpeakerPresence: 'voice_only',
    defaultVisualDominance: 'dominant',
    complexity: 'simple',
    riskLevel: 'low',
    tierAvailability: allTiers,
    preferredTools: ['uploaded footage', 'source sequence map', 'Remotion'],
    promptImplications: ['No generated visual is needed unless an approved asset supports the cutaway.'],
    remotionNotes: ['Source footage can occupy the visual zone while voiceover continues.'],
    qaChecks: ['B-roll supports spoken meaning.', 'Cutaway is not random.'],
  }),
  mode({
    id: 'split_screen_comparison',
    label: 'Split-screen comparison',
    description: 'Two visuals or states share the frame for comparison.',
    bestUseCases: ['before/after', 'A/B comparison', 'option comparison', 'proof contrast'],
    avoidUseCases: ['long text', 'tiny vertical labels', 'speaker trust moments'],
    supportedAspectRatios: ['16:9', '1:1', '9:16', 'let_ai_decide'],
    defaultSpeakerPresence: 'voice_only',
    defaultVisualDominance: 'full_takeover',
    complexity: 'moderate',
    riskLevel: 'medium',
    tierAvailability: proPremiumOnly,
    preferredTools: ['Remotion', 'VisualExplain', 'GPT-Image-2'],
    promptImplications: ['Both sides need clear labels and balanced safe margins.'],
    remotionNotes: ['Remotion controls both comparison panels and labels.'],
    qaChecks: ['Both comparison sides are readable.', 'Claims are not overstated.'],
    fallbackLayoutMode: 'before_after_panel',
  }),
  mode({
    id: 'before_after_panel',
    label: 'Before/after panel',
    description: 'A before/after panel explains a transformation or result.',
    bestUseCases: ['results', 'transformation', 'case outcome', 'product outcome', 'property change'],
    avoidUseCases: ['unverified claims', 'unclear contrast', 'crowded captions'],
    supportedAspectRatios: allRatios,
    defaultSpeakerPresence: 'voice_only',
    defaultVisualDominance: 'dominant',
    complexity: 'moderate',
    riskLevel: 'medium',
    tierAvailability: allTiers,
    preferredTools: ['Remotion', 'GPT-Image-2', 'VisualExplain'],
    promptImplications: ['Label before and after states clearly and leave caption safe space.'],
    remotionNotes: ['Remotion controls the panel transition and final placement.'],
    qaChecks: ['Before/after labels are clear.', 'Result claims match approved wording.'],
    fallbackLayoutMode: 'lower_visual_panel',
  }),
  mode({
    id: 'object_anchored_callout',
    label: 'Object-anchored callout',
    description: 'A callout is planned near a product, object, app UI, or proof area.',
    bestUseCases: ['product features', 'real estate detail', 'app UI highlight', 'physical proof'],
    avoidUseCases: ['Basic default planning', 'real tracking claims', 'face obstruction'],
    supportedAspectRatios: allRatios,
    defaultSpeakerPresence: 'partial_speaker',
    defaultVisualDominance: 'dominant',
    complexity: 'advanced',
    riskLevel: 'high',
    tierAvailability: proPremiumOnly,
    preferredTools: ['future object tracking', 'Remotion', 'VisualExplain'],
    promptImplications: ['Plan only. Do not execute real object tracking in this milestone.'],
    remotionNotes: ['Object anchoring is mock planning only until future tracking work.'],
    qaChecks: ['Fallback layout exists.', 'Callout does not imply real tracking has run.'],
    fallbackLayoutMode: 'lower_visual_panel',
  }),
] satisfies SpeakerVisualLayoutModeDefinition[]

const modesById = new Map<SpeakerVisualLayoutMode, SpeakerVisualLayoutModeDefinition>(
  speakerVisualLayoutModes.map((definition) => [definition.id, definition]),
)

export function getSpeakerVisualLayoutMode(modeId: SpeakerVisualLayoutMode) {
  return modesById.get(modeId)
}

export function getLayoutTierAvailability(modeId: SpeakerVisualLayoutMode) {
  return getSpeakerVisualLayoutMode(modeId)?.tierAvailability ?? allTiers
}

export function getLayoutPromptImplications(modeId: SpeakerVisualLayoutMode) {
  return getSpeakerVisualLayoutMode(modeId)?.promptImplications ?? []
}

export function getLayoutQAChecks(modeId: SpeakerVisualLayoutMode) {
  return getSpeakerVisualLayoutMode(modeId)?.qaChecks ?? []
}

function combinedText(asset: VisualAssetPlanItem | undefined, segment: SegmentEditPlan | undefined) {
  return [
    asset?.beatLabel,
    asset?.storyPurpose,
    asset?.narrativePhase,
    asset?.reason,
    asset?.assetType,
    segment?.label,
    segment?.storyPurpose,
    segment?.spokenTextSummary,
    segment?.role,
  ].filter(Boolean).join(' ').toLowerCase()
}

function ratioMode(input: PlannerInput, preferred: SpeakerVisualLayoutMode): SpeakerVisualLayoutMode {
  if (input.aspectRatio === '9:16' && preferred === 'side_by_side_speaker_visual') {
    return 'lower_visual_panel'
  }

  if (input.aspectRatio === '16:9' && preferred === 'lower_visual_panel' && input.editLevel !== 'basic') {
    return 'side_by_side_speaker_visual'
  }

  return preferred
}

function tierSafeMode(input: PlannerInput, preferred: SpeakerVisualLayoutMode): SpeakerVisualLayoutMode {
  const definition = getSpeakerVisualLayoutMode(preferred)

  if (!definition?.tierAvailability[input.editLevel]) {
    if (input.editLevel === 'basic') {
      return preferred === 'full_stroke_motion_scene' ? 'lower_visual_panel' : definition?.fallbackLayoutMode ?? 'lower_visual_panel'
    }

    return definition?.fallbackLayoutMode ?? 'voiceover_visual_takeover'
  }

  if (input.editLevel === 'basic' && (definition.riskLevel === 'high' || definition.riskLevel === 'premium' || definition.complexity === 'advanced' || definition.complexity === 'premium')) {
    return definition.fallbackLayoutMode ?? 'lower_visual_panel'
  }

  if (input.editLevel === 'pro' && definition.riskLevel === 'high' && preferred === 'speaker_cutout_overlay') {
    return definition.fallbackLayoutMode ?? 'picture_in_picture_speaker'
  }

  return preferred
}

export function getDefaultLayoutForAsset(params: GetDefaultLayoutForAssetParams): SpeakerVisualLayoutModeDefinition {
  const { asset, input, segment } = params
  const text = combinedText(asset, segment)
  const isLandscape = input.aspectRatio === '16:9'
  const isVertical = input.aspectRatio === '9:16'
  let preferred: SpeakerVisualLayoutMode = 'full_speaker'

  if (segment?.role === 'hook' || segment?.role === 'call_to_action' || segment?.role === 'emotional_beat') {
    preferred = 'full_speaker'
  }

  if (segment?.role === 'b_roll_support' || /b[- ]?roll|cutaway|environment|detail shot|proof clip/.test(text)) {
    preferred = 'b_roll_cutaway'
  }

  if (/map|location|route|city|country|geography|neighborhood|travel|distance|nearby|address/.test(text)) {
    preferred = 'full_map_takeover'
  } else if (/website|app|dashboard|saas|browser|article|page|screen recording|screen capture|ui /.test(text)) {
    preferred = 'screen_capture_with_speaker_pip'
  } else if (input.editingCategory === 'documentary_case_study' && /evidence|claim|source|timeline|money|fraud|case|alleg/.test(text)) {
    preferred = 'full_evidence_board'
  } else if (asset?.assetType === 'timeline_card' || asset?.assetType === 'fact_card' || asset?.assetType === 'name_card') {
    preferred = input.editingCategory === 'documentary_case_study' ? 'full_evidence_board' : 'voiceover_visual_takeover'
  } else if (asset?.assetType === 'graphic_design_frame' || asset?.assetType === 'motion_design_scene' || asset?.assetType === 'list_card') {
    preferred = isLandscape && (input.editingCategory === 'education_explainer' || input.editingCategory === 'business_brand')
      ? 'side_by_side_speaker_visual'
      : isVertical
        ? 'lower_visual_panel'
        : 'full_graphic_explainer'
  } else if (asset?.signatureSystem === 'stroke_motion' && asset.assetType === 'animated_scene') {
    preferred = input.editLevel === 'basic' ? 'lower_visual_panel' : 'full_stroke_motion_scene'
  } else if (asset?.assetType === 'real_motion_scene' || asset?.signatureSystem === 'real_motion') {
    preferred = input.editLevel === 'premium' ? 'object_anchored_callout' : 'lower_visual_panel'
  } else if (/compare|versus| vs |before|after|transformation|result/.test(text)) {
    preferred = /before|after|transformation|result/.test(text) ? 'before_after_panel' : 'split_screen_comparison'
  } else if (input.editingCategory === 'education_explainer' && asset) {
    preferred = isLandscape ? 'side_by_side_speaker_visual' : 'lower_visual_panel'
  } else if (asset && isVertical) {
    preferred = 'lower_visual_panel'
  }

  const finalMode = tierSafeMode(input, ratioMode(input, preferred))

  return getSpeakerVisualLayoutMode(finalMode) ?? speakerVisualLayoutModes[0]
}

export function platformBestFit(targetPlatform: TargetPlatform): AspectRatio[] {
  if (targetPlatform === 'tiktok_reels_shorts') {
    return ['9:16']
  }

  if (targetPlatform === 'youtube' || targetPlatform === 'course_training' || targetPlatform === 'website') {
    return ['16:9']
  }

  return allRatios
}
