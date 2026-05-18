import type {
  DepthCompositingMode,
  EditLevel,
  LayoutComplexity,
  MaskRiskLevel,
  MaskStrategy,
  SpeakerVisualLayoutMode,
  TrackingRequirement,
} from '../types/reeditpro'

export type DepthTierAvailability = Record<EditLevel, boolean>

export interface DepthCompositingModeDefinition {
  id: DepthCompositingMode
  label: string
  description: string
  bestUseCases: string[]
  avoidUseCases: string[]
  defaultMaskStrategy: MaskStrategy
  complexity: LayoutComplexity
  risk: MaskRiskLevel
  tierAvailability: DepthTierAvailability
  toolImplications: string[]
  promptImplications: string[]
  remotionLayerNotes: string[]
  qaChecks: string[]
  fallbackLayoutMode?: SpeakerVisualLayoutMode
}

export interface MaskStrategyDefinition {
  id: MaskStrategy
  label: string
  description: string
  complexity: LayoutComplexity
  risk: MaskRiskLevel
  trackingRequirement: TrackingRequirement
  tierAvailability: DepthTierAvailability
  toolImplications: string[]
  qaChecks: string[]
}

const allTiers: DepthTierAvailability = { basic: true, pro: true, premium: true }
const proPremiumOnly: DepthTierAvailability = { basic: false, pro: true, premium: true }
const premiumOnly: DepthTierAvailability = { basic: false, pro: false, premium: true }

function depthMode(definition: DepthCompositingModeDefinition) {
  return definition
}

function maskStrategy(definition: MaskStrategyDefinition) {
  return definition
}

export const maskStrategies = [
  maskStrategy({
    id: 'none',
    label: 'No mask',
    description: 'No foreground mask is planned.',
    complexity: 'simple',
    risk: 'low',
    trackingRequirement: 'none',
    tierAvailability: allTiers,
    toolImplications: ['No segmentation or tracking worker is needed.'],
    qaChecks: ['Confirm the composition does not imply a foreground mask.'],
  }),
  maskStrategy({
    id: 'subject_mask',
    label: 'Subject mask',
    description: 'A future worker would preserve the main speaker or subject in front of the overlay.',
    complexity: 'moderate',
    risk: 'medium',
    trackingRequirement: 'static_mask',
    tierAvailability: proPremiumOnly,
    toolImplications: ['Future segmentation worker must detect and confirm the subject mask.'],
    qaChecks: ['Protect face, eyes, mouth, and body silhouette.', 'Fallback exists if subject edges are unreliable.'],
  }),
  maskStrategy({
    id: 'subject_plus_contact_object_mask',
    label: 'Subject plus contact object mask',
    description: 'A future worker would preserve the subject plus a touched, leaned-on, held, or connected object.',
    complexity: 'advanced',
    risk: 'high',
    trackingRequirement: 'light_tracking',
    tierAvailability: proPremiumOnly,
    toolImplications: ['Future worker must confirm the contact object and preserve the group in front.'],
    qaChecks: ['Contact object preservation is planned.', 'Do not mask every object.', 'Fallback exists for mask or tracking failure.'],
  }),
  maskStrategy({
    id: 'hero_object_mask',
    label: 'Hero object mask',
    description: 'A product or story object remains in front of the overlay.',
    complexity: 'advanced',
    risk: 'high',
    trackingRequirement: 'object_tracking',
    tierAvailability: proPremiumOnly,
    toolImplications: ['Future worker must confirm the hero object before compositing.'],
    qaChecks: ['Hero object remains readable and story-relevant.', 'Fallback exists for object tracking risk.'],
  }),
  maskStrategy({
    id: 'scene_anchor_mask',
    label: 'Scene anchor mask',
    description: 'A pole, counter, table edge, railing, or similar anchor is preserved for depth grounding.',
    complexity: 'advanced',
    risk: 'high',
    trackingRequirement: 'light_tracking',
    tierAvailability: proPremiumOnly,
    toolImplications: ['Future worker must confirm the anchor is stable enough to preserve.'],
    qaChecks: ['Scene anchor improves the depth illusion.', 'Fallback exists if thin edges are too risky.'],
  }),
  maskStrategy({
    id: 'multi_object_depth_mask',
    label: 'Multi-object depth mask',
    description: 'Multiple foreground objects are preserved as a depth group.',
    complexity: 'premium',
    risk: 'premium',
    trackingRequirement: 'multi_object_tracking',
    tierAvailability: premiumOnly,
    toolImplications: ['Future segmentation and tracking workers need manual-style review.'],
    qaChecks: ['Manual review is recommended.', 'Multiple objects are justified by segment meaning.', 'Fallback exists.'],
  }),
  maskStrategy({
    id: 'full_cutout_composition',
    label: 'Full cutout composition',
    description: 'The subject or object is cut out and recomposited over a new layout.',
    complexity: 'premium',
    risk: 'premium',
    trackingRequirement: 'manual_review_recommended',
    tierAvailability: premiumOnly,
    toolImplications: ['Future cutout, edge refinement, and temporal consistency workers are required.'],
    qaChecks: ['Cutout is planned only when it improves the edit.', 'Manual review is recommended.', 'Fallback exists.'],
  }),
]

export const depthCompositingModes = [
  depthMode({
    id: 'none',
    label: 'No depth overlay',
    description: 'No special foreground/background depth composition is planned.',
    bestUseCases: ['full speaker', 'simple lower panels', 'normal full visual takeover', 'captions only'],
    avoidUseCases: ['explicit behind-subject requests', 'contact object preservation moments'],
    defaultMaskStrategy: 'none',
    complexity: 'simple',
    risk: 'low',
    tierAvailability: allTiers,
    toolImplications: ['No depth worker is needed.'],
    promptImplications: ['No special foreground mask reserve is needed.'],
    remotionLayerNotes: ['Use normal layer ordering.'],
    qaChecks: ['No depth effect is implied.'],
  }),
  depthMode({
    id: 'graphic_on_top',
    label: 'Graphic on top',
    description: 'A graphic, label, or card sits above source video without a mask.',
    bestUseCases: ['safe empty-space overlays', 'small labels', 'simple callouts', 'Basic-safe requests'],
    avoidUseCases: ['large overlays covering faces', 'requested behind-subject depth illusion'],
    defaultMaskStrategy: 'none',
    complexity: 'simple',
    risk: 'low',
    tierAvailability: allTiers,
    toolImplications: ['No real mask or tracking worker is needed.'],
    promptImplications: ['Keep the overlay compact and away from faces, captions, and key source detail.'],
    remotionLayerNotes: ['Graphic sits above source video and below captions.'],
    qaChecks: ['Graphic does not cover face or captions.', 'Text remains readable.'],
    fallbackLayoutMode: 'lower_visual_panel',
  }),
  depthMode({
    id: 'graphic_behind_subject',
    label: 'Graphic behind subject',
    description: 'A planned graphic layer sits behind the main speaker or subject.',
    bestUseCases: ['map/card behind speaker', 'premium-looking explainer overlays', 'clear static subject scenes'],
    avoidUseCases: ['fast movement', 'hair-heavy edges', 'busy backgrounds', 'Basic default layouts'],
    defaultMaskStrategy: 'subject_mask',
    complexity: 'moderate',
    risk: 'medium',
    tierAvailability: proPremiumOnly,
    toolImplications: ['Future segmentation worker must create and confirm a subject mask.'],
    promptImplications: ['Avoid placing key labels behind the expected speaker mask.'],
    remotionLayerNotes: ['Layer stack: source video, overlay graphic, future subject mask, captions.'],
    qaChecks: ['Speaker face remains protected.', 'Fallback layout exists for mask failure.'],
    fallbackLayoutMode: 'lower_visual_panel',
  }),
  depthMode({
    id: 'graphic_behind_subject_and_contact_objects',
    label: 'Graphic behind subject and contact objects',
    description: 'A graphic sits behind the speaker plus relevant contact objects or scene anchors.',
    bestUseCases: ['map behind person and pole', 'card behind person leaning on table', 'scene-integrated evidence graphics'],
    avoidUseCases: ['decorative effects', 'many thin moving objects', 'Basic tier plans'],
    defaultMaskStrategy: 'subject_plus_contact_object_mask',
    complexity: 'advanced',
    risk: 'high',
    tierAvailability: proPremiumOnly,
    toolImplications: ['Future worker must detect/confirm subject and contact object before compositing.'],
    promptImplications: ['Keep key map/card labels away from the planned person and contact object foreground group.'],
    remotionLayerNotes: ['Graphic should sit behind the preserved foreground group: subject plus contact object.'],
    qaChecks: ['Contact object preservation is planned.', 'Foreground depth group exists.', 'Fallback layout exists.'],
    fallbackLayoutMode: 'side_by_side_speaker_visual',
  }),
  depthMode({
    id: 'graphic_between_background_and_foreground',
    label: 'Graphic between background and foreground',
    description: 'A visual is inserted between base video background and selected foreground objects.',
    bestUseCases: ['premium integrated VisualExplain scenes', 'speaker plus graphic depth composition'],
    avoidUseCases: ['unclear foreground/background separation', 'Basic tier', 'non-essential decoration'],
    defaultMaskStrategy: 'subject_mask',
    complexity: 'advanced',
    risk: 'high',
    tierAvailability: proPremiumOnly,
    toolImplications: ['Future segmentation worker must separate foreground from background.'],
    promptImplications: ['Reserve negative space around the foreground subject and avoid dense labels under the mask.'],
    remotionLayerNotes: ['Graphic sits between base video and foreground mask layers.'],
    qaChecks: ['Depth effect improves the spoken point.', 'Fallback layout exists.'],
    fallbackLayoutMode: 'picture_in_picture_speaker',
  }),
  depthMode({
    id: 'subject_cutout_overlay',
    label: 'Subject cutout overlay',
    description: 'The subject is cut out and recomposited over a new layout.',
    bestUseCases: ['Premium editorial composites', 'speaker cutout over controlled graphic scene'],
    avoidUseCases: ['Basic/Pro default planning', 'hair-heavy motion', 'unapproved mask work'],
    defaultMaskStrategy: 'full_cutout_composition',
    complexity: 'premium',
    risk: 'premium',
    tierAvailability: premiumOnly,
    toolImplications: ['Future cutout worker and manual-style review are required.'],
    promptImplications: ['Design the background visual to accept a subject cutout without pretending the cutout exists now.'],
    remotionLayerNotes: ['Future subject cutout layer sits above the generated layout and below captions.'],
    qaChecks: ['Manual review is recommended.', 'Fallback layout exists.', 'No real cutout is executed in the mock.'],
    fallbackLayoutMode: 'picture_in_picture_speaker',
  }),
  depthMode({
    id: 'object_anchored_overlay',
    label: 'Object anchored overlay',
    description: 'A graphic or callout is planned to anchor to a hero object or tracked object.',
    bestUseCases: ['product feature callouts', 'dashboard/product object labels', 'real-world object explainers'],
    avoidUseCases: ['fast object motion', 'unknown object location', 'Basic tier'],
    defaultMaskStrategy: 'hero_object_mask',
    complexity: 'advanced',
    risk: 'high',
    tierAvailability: proPremiumOnly,
    toolImplications: ['Future object confirmation and tracking worker are required.'],
    promptImplications: ['Leave clear anchor space and do not bake final tracking into the generated asset.'],
    remotionLayerNotes: ['Object-anchored callout is a Remotion/future worker composition plan only.'],
    qaChecks: ['Object anchoring improves the segment meaning.', 'Fallback lower panel exists.'],
    fallbackLayoutMode: 'lower_visual_panel',
  }),
  depthMode({
    id: 'masked_panel_behind_subject',
    label: 'Masked panel behind subject',
    description: 'A panel/card sits behind the subject while the subject remains in front.',
    bestUseCases: ['integrated lower panels', 'speaker-led support graphic', 'clear static subject scenes'],
    avoidUseCases: ['tiny labels', 'busy subject motion', 'Basic default planning'],
    defaultMaskStrategy: 'subject_mask',
    complexity: 'moderate',
    risk: 'medium',
    tierAvailability: proPremiumOnly,
    toolImplications: ['Future subject mask worker must confirm the face/body boundary.'],
    promptImplications: ['Panel text should avoid the expected face/body mask and caption zone.'],
    remotionLayerNotes: ['Panel sits behind future foreground mask and below captions.'],
    qaChecks: ['Panel remains readable after foreground overlay.', 'Fallback lower panel exists.'],
    fallbackLayoutMode: 'lower_visual_panel',
  }),
  depthMode({
    id: 'full_visual_replacement',
    label: 'Full visual replacement',
    description: 'Source video is hidden and the visual takes over without foreground masking.',
    bestUseCases: ['voiceover visual takeover', 'full map', 'full evidence board', 'full graphic explainer'],
    avoidUseCases: ['moments where speaker trust or emotion must remain visible'],
    defaultMaskStrategy: 'none',
    complexity: 'simple',
    risk: 'low',
    tierAvailability: allTiers,
    toolImplications: ['No mask worker is needed; Remotion still owns final composition.'],
    promptImplications: ['Visual can use the full frame but must preserve caption safe zones.'],
    remotionLayerNotes: ['Visual layer dominates while source/speaker layer is hidden or voice-only.'],
    qaChecks: ['Full replacement does not lose important speaker context.', 'Captions remain readable.'],
    fallbackLayoutMode: 'lower_visual_panel',
  }),
]

export function getDepthCompositingMode(mode: DepthCompositingMode) {
  return depthCompositingModes.find((definition) => definition.id === mode)
}

export function getMaskStrategy(strategy: MaskStrategy) {
  return maskStrategies.find((definition) => definition.id === strategy)
}

export function getDepthTierAvailability(mode: DepthCompositingMode, strategy: MaskStrategy): DepthTierAvailability {
  const modeDefinition = getDepthCompositingMode(mode)
  const strategyDefinition = getMaskStrategy(strategy)

  return {
    basic: Boolean(modeDefinition?.tierAvailability.basic && strategyDefinition?.tierAvailability.basic),
    pro: Boolean(modeDefinition?.tierAvailability.pro && strategyDefinition?.tierAvailability.pro),
    premium: Boolean(modeDefinition?.tierAvailability.premium && strategyDefinition?.tierAvailability.premium),
  }
}

export function getDepthFallbackLayout(mode: DepthCompositingMode, risk: MaskRiskLevel): SpeakerVisualLayoutMode | undefined {
  const definition = getDepthCompositingMode(mode)

  if (risk === 'medium' || risk === 'high' || risk === 'premium') {
    return definition?.fallbackLayoutMode ?? 'lower_visual_panel'
  }

  return definition?.fallbackLayoutMode
}

export function getDepthQAChecks(mode: DepthCompositingMode, strategy: MaskStrategy) {
  const modeDefinition = getDepthCompositingMode(mode)
  const strategyDefinition = getMaskStrategy(strategy)

  return Array.from(
    new Set([
      ...(modeDefinition?.qaChecks ?? []),
      ...(strategyDefinition?.qaChecks ?? []),
      'Captions remain above masks and graphics.',
      'Graphic text remains readable after foreground overlay.',
      'No real segmentation, tracking, or mask execution occurs in this frontend mock.',
    ]),
  )
}
