import type { ClipSource, PlannerInput } from '../../types/reeditpro'
import { sampleClips } from '../../lib/mock-planner/default-data'

export const defaultChatPlannerInput: PlannerInput = {
  projectName: 'Premium real estate short',
  targetPlatform: 'tiktok_reels_shorts',
  aspectRatio: '9:16',
  frameTemplateType: 'vertical_talking_head_lower_panel',
  editingCategory: 'storytelling',
  workflowType: 'custom_let_ai_decide',
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
  'Reading source order',
  'Understanding source content',
  'Mapping story beats',
  'Preparing clean cut decisions',
  'Preparing captions',
  'Planning motion storytelling',
  'Planning graphic support',
  'Checking face-safe placement',
  'Matching sound and mood',
  'Assembling review timeline',
  'Preparing private review',
]
