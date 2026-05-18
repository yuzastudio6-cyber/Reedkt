import type {
  AspectRatio,
  ClipSource,
  CreditPreference,
  EditingCategory,
  EditLevel,
  FrameTemplateType,
  MoodStyle,
  TargetPlatform,
  VideoWorkflowType,
  VisualPreference,
} from '../types/reeditpro'

export type DemoScenario = {
  id: string
  label: string
  description: string
  editingCategory: EditingCategory
  editLevel: EditLevel
  targetPlatform: TargetPlatform
  aspectRatio: AspectRatio
  frameTemplateType: FrameTemplateType
  moodStyle: MoodStyle
  visualPreference: VisualPreference
  creditPreference: CreditPreference
  workflowType: VideoWorkflowType
  referenceAttached: boolean
  referenceUrl: string
  customInstructions: string
  clips: ClipSource[]
  expectedSignatureSystems: string[]
  expectedAssetBehavior: string[]
  expectedProviderPolicy: string[]
  expectedSafetyNotes: string[]
}

export const demoScenarios: DemoScenario[] = [
  {
    id: 'storytelling_pro_couple_story',
    label: 'Storytelling Pro — Couple story',
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
  },
  {
    id: 'education_pro_money_flow',
    label: 'Education Pro — Money flow explainer',
    description: 'A diagram-first explainer that tests VisualExplain, card prompts, Remotion motion briefs, and no-random-animation policy.',
    editingCategory: 'education_explainer',
    editLevel: 'pro',
    targetPlatform: 'tiktok_reels_shorts',
    aspectRatio: '9:16',
    frameTemplateType: 'vertical_talking_head_lower_panel',
    moodStyle: 'educational',
    visualPreference: 'more_graphic_design',
    creditPreference: 'balanced',
    workflowType: 'education_explainer',
    referenceAttached: false,
    referenceUrl: '',
    customInstructions:
      'Explain how money moves through a scam network. Use clean diagrams, arrows, account cards, simple labels, and step-by-step visuals. Show the money flow clearly with labels. Use controlled diagrams, not random animation or AI video for exact arrows and labels.',
    clips: [
      {
        id: 'money-flow-clip-1',
        uploadedOrder: 1,
        fileName: 'teacher-hook-money-flow.mp4',
        duration: '00:11',
        detectedType: 'Speaker sets up money-flow concept',
        isImportant: true,
      },
      {
        id: 'money-flow-clip-2',
        uploadedOrder: 2,
        fileName: 'step-one-account-card.mp4',
        duration: '00:09',
        detectedType: 'Step one explanation',
        notes: 'Needs account card and arrow.',
      },
      {
        id: 'money-flow-clip-3',
        uploadedOrder: 3,
        fileName: 'network-diagram-explanation.mp4',
        duration: '00:13',
        detectedType: 'Network diagram explanation',
        isImportant: true,
      },
      {
        id: 'money-flow-clip-4',
        uploadedOrder: 4,
        fileName: 'recap-three-steps.mp4',
        duration: '00:08',
        detectedType: 'Three-step recap',
      },
    ],
    expectedSignatureSystems: ['Graphic Design / VisualExplain', 'SoundSync', 'Remotion/editor motion'],
    expectedAssetBehavior: ['Diagram/card frames', 'Arrows and account cards', 'Step-by-step labels', 'money_flow_diagram dataviz plan', 'No unnecessary AI video'],
    expectedProviderPolicy: ['D3/Remotion or ECharts/Remotion for chart_diagram_chain', 'GPT-Image-2 only for non-exact frames/cards', 'Remotion/editor motion for controlled movement', 'No Veo because Pro', 'Matching panel background'],
    expectedSafetyNotes: ['No random animation', 'Keep claims educational and clear', 'No sensational scam visuals', 'Data confidence and safe wording represented'],
  },
  {
    id: 'documentary_premium_scam_case',
    label: 'Documentary Premium — Fictional scam case',
    description: 'A fictional evidence-led case study that tests Premium depth, character packs, fact safety, prompt safety, and final-fallback-only Veo policy.',
    editingCategory: 'documentary_case_study',
    editLevel: 'premium',
    targetPlatform: 'tiktok_reels_shorts',
    aspectRatio: '9:16',
    frameTemplateType: 'vertical_talking_head_lower_panel',
    moodStyle: 'premium',
    visualPreference: 'balanced_visual_mix',
    creditPreference: 'premium_best_result',
    workflowType: 'testimonial_case_study',
    referenceAttached: false,
    referenceUrl: '',
    customInstructions:
      'Create a serious fictional case-study story about Marcus, Lena, and Omar building a fake investment website and moving millions online. Use evidence cards, timeline cards, money trail visuals, and selected Stroke Motion reenactments. These are fictional characters. Keep the tone serious and documentary-style, not childish.',
    clips: [
      {
        id: 'scam-case-clip-1',
        uploadedOrder: 1,
        fileName: 'case-setup-narration.mp4',
        duration: '00:12',
        detectedType: 'Case setup narration',
        notes: 'Introduce fictional characters and neutral case frame.',
        isImportant: true,
      },
      {
        id: 'scam-case-clip-2',
        uploadedOrder: 2,
        fileName: 'fake-website-explanation.mp4',
        duration: '00:10',
        detectedType: 'Fake website explanation',
      },
      {
        id: 'scam-case-clip-3',
        uploadedOrder: 3,
        fileName: 'money-trail-timeline.mp4',
        duration: '00:14',
        detectedType: 'Money trail timeline',
        notes: 'Needs timeline and money trail card.',
        isImportant: true,
      },
      {
        id: 'scam-case-clip-4',
        uploadedOrder: 4,
        fileName: 'outcome-documentary-recap.mp4',
        duration: '00:09',
        detectedType: 'Outcome recap',
      },
    ],
    expectedSignatureSystems: ['Graphic Design / VisualExplain', 'Stroke Motion', 'SoundSync'],
    expectedAssetBehavior: ['Evidence cards', 'Name cards', 'Timeline cards', 'Money trail graphic', 'evidence_flow_diagram or money_flow_diagram dataviz plan', 'Selected Stroke Motion reenactments'],
    expectedProviderPolicy: ['D3/Remotion for evidence and money-flow diagrams', 'GPT-Image-2 for cards/keyframes only when not responsible for exact data', 'Wan primary for animation', 'Hailuo fallback', 'Veo only final fallback/rescue', 'Matching panel background'],
    expectedSafetyNotes: ['Fact safety active', 'Claims marked fictional', 'Claimed/fictional dataviz wording', 'Character packs for Marcus, Lena, Omar', 'No guilt-implying real-person treatment'],
  },
  {
    id: 'business_brand_pro_product_feature',
    label: 'Business / Brand Pro — Product feature explainer',
    description: 'A polished product explainer that tests business style, product callouts, VisualExplain, and optional proof motion without chaos.',
    editingCategory: 'business_brand',
    editLevel: 'pro',
    targetPlatform: 'youtube',
    aspectRatio: '16:9',
    frameTemplateType: 'youtube_side_panel',
    moodStyle: 'corporate',
    visualPreference: 'more_graphic_design',
    creditPreference: 'balanced',
    workflowType: 'product_demo',
    referenceAttached: false,
    referenceUrl: '',
    customInstructions:
      'Create a polished product feature explainer for a SaaS dashboard. Show the problem, the feature, the benefit, and a clean CTA. Use premium graphic design, product callouts, feature comparison cards, simple dashboard metrics, and subtle motion. Real Motion only if it helps. Do not make it chaotic.',
    clips: [
      {
        id: 'product-feature-clip-1',
        uploadedOrder: 1,
        fileName: 'problem-intro-founder.mp4',
        duration: '00:10',
        detectedType: 'Problem setup with speaker',
        isImportant: true,
      },
      {
        id: 'product-feature-clip-2',
        uploadedOrder: 2,
        fileName: 'dashboard-feature-screen.mp4',
        duration: '00:12',
        detectedType: 'Dashboard feature screen recording',
        notes: 'Use product callouts.',
        isImportant: true,
      },
      {
        id: 'product-feature-clip-3',
        uploadedOrder: 3,
        fileName: 'benefit-proof-shot.mp4',
        duration: '00:09',
        detectedType: 'Benefit/proof explanation',
      },
      {
        id: 'product-feature-clip-4',
        uploadedOrder: 4,
        fileName: 'clean-cta-ending.mp4',
        duration: '00:07',
        detectedType: 'CTA ending',
      },
    ],
    expectedSignatureSystems: ['Graphic Design / VisualExplain', 'SoundSync', 'Possible Real Motion only if useful'],
    expectedAssetBehavior: ['Problem/feature/benefit/CTA structure', 'Product callout cards', 'Feature comparison or metric card dataviz plan', 'Premium graphic frames', 'Subtle motion'],
    expectedProviderPolicy: ['Remotion/ECharts for controlled dashboard metrics and comparisons', 'GPT-Image-2 for non-exact product cards/frames', 'Wan primary if AI video is needed', 'Hailuo fallback', 'No Veo because Pro'],
    expectedSafetyNotes: ['Premium-clean business style', 'No chaotic effects', 'Product and face safe zones respected'],
  },
  {
    id: 'layout_pro_map_behind_subject',
    label: 'Layout Pro - Map behind subject',
    description: 'A Pro layout scenario that tests map/card behind a speaker plus pole/contact-object preservation without real masking.',
    editingCategory: 'lifestyle',
    editLevel: 'pro',
    targetPlatform: 'youtube',
    aspectRatio: '16:9',
    frameTemplateType: 'youtube_side_panel',
    moodStyle: 'clean',
    visualPreference: 'more_graphic_design',
    creditPreference: 'balanced',
    workflowType: 'talking_head_personal_brand',
    referenceAttached: false,
    referenceUrl: '',
    customInstructions:
      'Show a map behind the person while the speaker voice continues. Keep the person and the pole they are leaning near in front of the map, so the graphic feels like it is inside the scene. Keep captions readable and do not cover the face.',
    clips: [
      {
        id: 'layout-map-depth-clip-1',
        uploadedOrder: 1,
        fileName: 'speaker-near-pole-intro.mp4',
        duration: '00:10',
        detectedType: 'Speaker standing near a pole introducing the location',
        notes: 'Use as the foreground speaker and pole/contact-object depth setup.',
        isImportant: true,
        sourceRole: 'speaker',
      },
      {
        id: 'layout-map-depth-clip-2',
        uploadedOrder: 2,
        fileName: 'neighborhood-route-explanation.mp4',
        duration: '00:12',
        detectedType: 'Route and neighborhood explanation',
        notes: 'Needs readable map labels and route pin.',
        isImportant: true,
        sourceRole: 'proof',
      },
      {
        id: 'layout-map-depth-clip-3',
        uploadedOrder: 3,
        fileName: 'street-context-broll.mp4',
        duration: '00:08',
        detectedType: 'Street and environment b-roll',
        notes: 'Use only if it supports the location explanation.',
        sourceRole: 'b_roll',
      },
      {
        id: 'layout-map-depth-clip-4',
        uploadedOrder: 4,
        fileName: 'speaker-location-cta.mp4',
        duration: '00:07',
        detectedType: 'Speaker CTA and recap',
        sourceRole: 'ending',
      },
    ],
    expectedSignatureSystems: ['Graphic Design / VisualExplain', 'Remotion/compositing', 'SoundSync'],
    expectedAssetBehavior: [
      'Depth-aware overlay plan active',
      'graphic_behind_subject_and_contact_objects for map/card behind speaker',
      'Pole/contact object planned as foreground preservation',
      'MapLibre/Turf/Remotion map route chain planned',
      'Controlled map planning instead of AI-video geography',
      'Location uncertainty uses safe wording if exact source is missing',
      'Fallback layout planned',
    ],
    expectedProviderPolicy: [
      'Pro no Veo',
      'MapLibre/Turf/Remotion for exact map planning',
      'GPT-Image-2 only for stylized non-exact map card if needed',
      'No AI video for exact map rendering',
      'Matching panel background',
      'Remotion handles composition',
      'Future mask worker note',
    ],
    expectedSafetyNotes: [
      'Contact object preservation',
      'Captions above all',
      'No real masking in frontend',
      'Face protected',
      'Future mask worker required',
    ],
  },
  {
    id: 'lifestyle_basic_creator_short',
    label: 'Lifestyle Basic — Clean creator short',
    description: 'A low-compute but professional creator edit that tests Basic quality, minimal visuals, captions, color, and no unnecessary AI video.',
    editingCategory: 'lifestyle',
    editLevel: 'basic',
    targetPlatform: 'tiktok_reels_shorts',
    aspectRatio: '9:16',
    frameTemplateType: 'vertical_talking_head_lower_panel',
    moodStyle: 'clean',
    visualPreference: 'keep_visuals_minimal',
    creditPreference: 'low_credit_cost',
    workflowType: 'vlog_lifestyle',
    referenceAttached: false,
    referenceUrl: '',
    customInstructions:
      'Make this a clean lifestyle short. Keep it natural, warm, and professional. Use light captions, simple cuts, nice color correction, and only minimal graphics if needed. Do not over-edit.',
    clips: [
      {
        id: 'lifestyle-basic-clip-1',
        uploadedOrder: 1,
        fileName: 'morning-intro-vlog.mp4',
        duration: '00:09',
        detectedType: 'Natural lifestyle opening',
        isImportant: true,
      },
      {
        id: 'lifestyle-basic-clip-2',
        uploadedOrder: 2,
        fileName: 'coffee-detail-shot.mp4',
        duration: '00:06',
        detectedType: 'Warm detail b-roll',
      },
      {
        id: 'lifestyle-basic-clip-3',
        uploadedOrder: 3,
        fileName: 'creator-talking-point.mp4',
        duration: '00:13',
        detectedType: 'Creator talking point',
        isImportant: true,
      },
      {
        id: 'lifestyle-basic-clip-4',
        uploadedOrder: 4,
        fileName: 'simple-ending-walkaway.mp4',
        duration: '00:07',
        detectedType: 'Simple ending',
      },
    ],
    expectedSignatureSystems: ['SoundSync', 'Minimal Graphic Design / VisualExplain only if needed'],
    expectedAssetBehavior: ['Clean cuts', 'Readable captions', 'Natural/warm correction', 'Minimal graphics', 'Fewer AI-video assets'],
    expectedProviderPolicy: ['No Veo', 'Avoid Hailuo unless necessary', 'Prefer still/editor motion over generated AI video'],
    expectedSafetyNotes: ['Basic remains professional', 'No random effects', 'No over-editing'],
  },
]

export function getDemoScenarioById(id: string) {
  return demoScenarios.find((scenario) => scenario.id === id)
}

export function getDefaultDemoScenario() {
  return demoScenarios[0]
}
