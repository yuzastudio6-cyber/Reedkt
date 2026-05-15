import type { ClipSource, PlannerInput } from '../../types/reeditpro'
import { sampleClips } from '../../lib/mock-planner'

export const defaultChatPlannerInput: PlannerInput = {
  projectName: 'Premium real estate short',
  targetPlatform: 'tiktok_reels_shorts',
  aspectRatio: '9:16',
  workflowType: 'real_estate_property_tour',
  editLevel: 'pro',
  structurePreference: 'improve_if_needed',
  moodStyle: 'luxury',
  visualPreference: 'balanced_visual_mix',
  referenceUrl: 'https://example.com/luxury-listing-reference',
  customInstructions:
    "I want to edit these clips into a premium real estate short. Keep it natural and don't make it too viral.",
  creditPreference: 'balanced',
  clips: sampleClips,
}

export const initialMockClips: ClipSource[] = sampleClips

export const referenceDNAItems = [
  { label: 'Pacing', value: 'Slow premium open, then tighter detail beats.' },
  { label: 'Music mood', value: 'Warm luxury bed with soft ducking under voice.' },
  { label: 'Caption style', value: 'Minimal white captions, low safe-zone placement.' },
  { label: 'Visual style', value: 'Subtle property details and restrained overlays.' },
  { label: 'Transition feel', value: 'Clean room-to-room motion, no harsh viral cuts.' },
  { label: 'Adaptation rule', value: 'Study the style, do not copy shot-for-shot.' },
]

export const progressSteps = [
  'Reading source sequence',
  'Analyzing transcript',
  'Mapping story beats',
  'Applying clean cuts',
  'Creating captions',
  'Planning Stroke Motion',
  'Creating Graphic Design overlay',
  'Checking Real Motion face-safe placement',
  'Matching SoundSync mood',
  'Preparing preview',
  'Rendering mock preview',
]
