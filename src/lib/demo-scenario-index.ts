import type { DemoScenario } from './demo-scenarios'
import type { EditingCategory, EditLevel } from '../types/reeditpro'

export type DemoScenarioIndexItem = {
  id: string
  label: string
  description: string
  editingCategory: EditingCategory
  editLevel: EditLevel
}

export const demoScenarioIndex: DemoScenarioIndexItem[] = [
  {
    id: 'storytelling_pro_couple_story',
    label: 'Storytelling Pro - Couple story',
    description: 'A serious emotional short that tests Stroke Motion, character consistency, Pro routing, and readable story beats.',
    editingCategory: 'storytelling',
    editLevel: 'pro',
  },
  {
    id: 'education_pro_money_flow',
    label: 'Education Pro - Money flow explainer',
    description: 'A diagram-first explainer that tests VisualExplain, card prompts, Remotion motion briefs, and no-random-animation policy.',
    editingCategory: 'education_explainer',
    editLevel: 'pro',
  },
  {
    id: 'documentary_premium_scam_case',
    label: 'Documentary Premium - Fictional scam case',
    description: 'A fictional evidence-led case study that tests Premium depth, character packs, fact safety, prompt safety, and final-fallback-only Veo policy.',
    editingCategory: 'documentary_case_study',
    editLevel: 'premium',
  },
  {
    id: 'business_brand_pro_product_feature',
    label: 'Business / Brand Pro - Product feature explainer',
    description: 'A polished product explainer that tests business style, product callouts, VisualExplain, and optional proof motion without chaos.',
    editingCategory: 'business_brand',
    editLevel: 'pro',
  },
  {
    id: 'layout_pro_map_behind_subject',
    label: 'Layout Pro - Map behind subject',
    description: 'A Pro layout scenario that tests map/card behind a speaker plus pole/contact-object preservation with masking gated.',
    editingCategory: 'lifestyle',
    editLevel: 'pro',
  },
  {
    id: 'lifestyle_basic_creator_short',
    label: 'Lifestyle Basic - Clean creator short',
    description: 'A low-compute but professional creator edit that tests Basic quality, minimal visuals, captions, color, and no unnecessary AI video.',
    editingCategory: 'lifestyle',
    editLevel: 'basic',
  },
]

export const defaultDemoScenario: DemoScenario = {
  id: 'storytelling_pro_couple_story',
  label: 'Storytelling Pro - Couple story',
  description: 'A serious emotional short that tests Stroke Motion, character consistency, Pro routing, and readable story beats.',
  editingCategory: 'storytelling',
  editLevel: 'pro',
  targetPlatform: 'tiktok_reels_shorts',
  aspectRatio: '9:16',
  frameTemplateType: 'vertical_talking_head_lower_panel',
  moodStyle: 'emotional',
  visualPreference: 'more_stroke_motion',
  creditPreference: 'balanced',
  workflowType: 'social_short_viral_clip',
  referenceAttached: false,
  referenceUrl: '',
  customInstructions:
    'Create a fast visual story. A couple starts happy, the woman becomes pregnant later, the man reacts confused and shocked, then walks away and leaves her alone. Keep it serious, emotional, clean, and readable without audio. Do not make it childish.',
  clips: [
    {
      id: 'couple-story-clip-1',
      uploadedOrder: 1,
      fileName: 'happy-couple-opening.mp4',
      duration: '00:08',
      detectedType: 'Warm couple setup',
      notes: 'Use as the clean emotional setup.',
      isImportant: true,
    },
    {
      id: 'couple-story-clip-2',
      uploadedOrder: 2,
      fileName: 'pregnancy-reveal-line.mp4',
      duration: '00:10',
      detectedType: 'Pregnancy reveal line',
      notes: 'Important reveal moment.',
      isImportant: true,
    },
    {
      id: 'couple-story-clip-3',
      uploadedOrder: 3,
      fileName: 'confused-reaction-shot.mov',
      duration: '00:07',
      detectedType: 'Man confused reaction',
      notes: 'Use for shock beat.',
    },
    {
      id: 'couple-story-clip-4',
      uploadedOrder: 4,
      fileName: 'woman-alone-ending.mp4',
      duration: '00:09',
      detectedType: 'Woman alone ending',
      notes: 'Ending should feel sad and quiet.',
      isImportant: true,
    },
  ],
  expectedSignatureSystems: ['Stroke Motion', 'SoundSync', 'Graphic Design / VisualExplain only if it clarifies'],
  expectedAssetBehavior: ['Warm minimal setup still/keyframes', 'Tension reveal and reaction beats', 'Sad isolation ending with readable still/end frame'],
  expectedProviderPolicy: ['Wan primary', 'Hailuo fallback', 'No Veo because Pro', 'Matching panel background'],
  expectedSafetyNotes: ['Serious tone', 'No childish/cartoonish visuals', 'Character consistency for recurring couple figures'],
}

export function getDemoScenarioIndexItemById(id: string) {
  return demoScenarioIndex.find((scenario) => scenario.id === id)
}

export function getDemoScenarioIndexItemByCategory(category: EditingCategory) {
  return demoScenarioIndex.find((scenario) => scenario.editingCategory === category)
}
