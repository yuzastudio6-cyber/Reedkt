import type { ClipSource, PlannerInput } from '../types/reeditpro'

type DemoScenario = {
  id: string
  name: string
  plannerInput: PlannerInput
  expectedSafetyNotes: string[]
}

const businessBrandClips: ClipSource[] = [
  {
    id: 'business-product-clip-1',
    uploadedOrder: 1,
    fileName: 'product-problem-hook.mp4',
    duration: '00:11',
    detectedType: 'Founder explains product problem',
    isImportant: true,
  },
  {
    id: 'business-product-clip-2',
    uploadedOrder: 2,
    fileName: 'feature-proof-broll.mp4',
    duration: '00:09',
    detectedType: 'Product feature b-roll',
  },
  {
    id: 'business-product-clip-3',
    uploadedOrder: 3,
    fileName: 'customer-result-line.mp4',
    duration: '00:12',
    detectedType: 'Result proof line',
    isImportant: true,
  },
]

export const demoScenarios: DemoScenario[] = [
  {
    id: 'business_brand_pro_product_feature',
    name: 'Business brand Pro product feature with mock reference',
    plannerInput: {
      projectName: 'Product feature launch short',
      targetPlatform: 'tiktok_reels_shorts',
      aspectRatio: '9:16',
      workflowType: 'product_demo',
      editLevel: 'pro',
      structurePreference: 'improve_if_needed',
      moodStyle: 'premium',
      visualPreference: 'balanced_visual_mix',
      referenceUrl: 'https://example.com/mock-clean-product-reference',
      referenceVideoMode: 'user_pasted_link',
      referenceAdaptationFocus: ['pacing', 'caption_style'],
      referenceNotes: ['Use style DNA only.'],
      customInstructions: 'Use the reference for pacing and caption style, but do not copy it exactly.',
      creditPreference: 'balanced',
      clips: businessBrandClips,
    },
    expectedSafetyNotes: [
      'Reference is style DNA only, no shot-for-shot copy.',
      'Do not copy exact music, exact sequence, copyrighted visuals, or creator identity.',
      'Reference does not enable Veo for Pro.',
      'Credit approval is still required before generation.',
    ],
  },
]
