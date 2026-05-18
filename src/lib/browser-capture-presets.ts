import type {
  AspectRatio,
  BrowserCaptureMode,
  BrowserStyleFamily,
  BrowserVisualType,
  EditingCategory,
  EditLevel,
  FrameTemplateType,
  OpenSourceToolId,
  SpeakerVisualLayoutMode,
} from '../types/reeditpro'

export type BrowserStylePreset = {
  label: string
  description: string
  bestUseCases: string[]
  frameTreatment: string
  highlightStyle: string
  captionBehavior: string
  avoidRules: string[]
  qaChecks: string[]
}

export type BrowserVisualPreset = {
  defaultCaptureMode: BrowserCaptureMode
  preferredLayoutModes: SpeakerVisualLayoutMode[]
  preferredTools: OpenSourceToolId[]
  tierBehavior: string
  fallback: string[]
  qaChecks: string[]
}

export const browserStylePresets: Record<BrowserStyleFamily, BrowserStylePreset> = {
  clean_product_demo: {
    label: 'Clean product demo',
    description: 'Polished browser visuals for product pages, features, and simple CTA moments.',
    bestUseCases: ['Product feature explainers', 'SaaS offer pages', 'Founder product demos'],
    frameTreatment: 'Clean browser shell with restrained border, readable crop, and subtle depth.',
    highlightStyle: 'Soft outline or callout around one feature at a time.',
    captionBehavior: 'Short captions and labels that do not cover the page crop.',
    avoidRules: ['Do not invent exact product UI.', 'Do not fake pricing, claims, or labels.', 'Avoid tiny text crops.'],
    qaChecks: ['Feature highlight is readable.', 'CTA or product label is not misleading.', 'Caption safe zone is preserved.'],
  },
  saas_dashboard_premium: {
    label: 'SaaS dashboard premium',
    description: 'Premium dashboard framing for analytics, product consoles, and customer-facing UI.',
    bestUseCases: ['SaaS dashboard walkthroughs', 'Analytics product explainers', 'Admin console feature demos'],
    frameTreatment: 'Dark or neutral dashboard frame with a polished toolbar and controlled highlight layer.',
    highlightStyle: 'Glow, outline, or zoom around the planned metric or feature.',
    captionBehavior: 'Keep dashboard text large; use labels only for the current feature.',
    avoidRules: ['Do not fabricate exact metrics.', 'Do not reveal private dashboard data.', 'Do not use AI video for exact UI.'],
    qaChecks: ['Dashboard text is readable.', 'Private metrics are redacted if needed.', 'Highlight target is obvious.'],
  },
  documentary_evidence_page: {
    label: 'Documentary evidence page',
    description: 'Neutral source-page treatment for documentary and case-study evidence visuals.',
    bestUseCases: ['Evidence boards', 'Article/source references', 'Case-study timeline pages'],
    frameTreatment: 'Neutral browser card with source label and restrained emphasis.',
    highlightStyle: 'Spotlight or thin outline; no sensational treatment.',
    captionBehavior: 'Use safe wording such as reported, claimed, source provided, or example/mock.',
    avoidRules: ['Do not present unclear sources as verified.', 'Do not fabricate evidence screenshots.', 'Do not expose private data.'],
    qaChecks: ['Source status is visible.', 'Safe wording is used.', 'Evidence is not treated as verified without support.'],
  },
  education_screen_tutorial: {
    label: 'Education screen tutorial',
    description: 'Step-based screen visuals for lessons, walkthroughs, and tutorials.',
    bestUseCases: ['Tutorial screens', 'Course lessons', 'App how-to videos'],
    frameTreatment: 'Readable screen frame with step labels and generous safe zones.',
    highlightStyle: 'Outline, cursor motion, click pulse, or zoom for the active step.',
    captionBehavior: 'Captions should explain the step without hiding the UI.',
    avoidRules: ['Avoid fast scrolls.', 'Avoid small UI text.', 'Do not imply real capture has happened in the mock.'],
    qaChecks: ['Current step is clear.', 'Cursor/click cues are not distracting.', 'UI text remains readable.'],
  },
  ecommerce_product_focus: {
    label: 'Ecommerce product focus',
    description: 'Controlled ecommerce and checkout-page planning with privacy-aware framing.',
    bestUseCases: ['Product pages', 'Storefront pages', 'Checkout explainers'],
    frameTreatment: 'Clean product card or browser frame with product area prioritized.',
    highlightStyle: 'Callout or outline around product detail, price area, or CTA if authorized.',
    captionBehavior: 'Short labels; avoid crowding price or CTA areas.',
    avoidRules: ['Do not fake prices or inventory.', 'Do not capture payment data without approval.', 'Do not invent checkout UI.'],
    qaChecks: ['Product area is readable.', 'Sensitive checkout details are redacted.', 'Claims are not misleading.'],
  },
  social_browser_card: {
    label: 'Social browser card',
    description: 'Compact browser card for fast social proof or lightweight web context.',
    bestUseCases: ['Vertical shorts', 'Quick proof cards', 'Simple web references'],
    frameTreatment: 'Compact card with a clear label and minimal page detail.',
    highlightStyle: 'Small outline or callout; no dense annotations.',
    captionBehavior: 'Large text outside the page crop for short-form readability.',
    avoidRules: ['Avoid cluttered full-page captures.', 'Avoid unreadable page text.', 'Do not imply source verification.'],
    qaChecks: ['Source label is visible.', 'Crop is legible on vertical video.', 'Caption zone is clear.'],
  },
  comparison_before_after: {
    label: 'Comparison before/after',
    description: 'Matched browser panels for old/new page or UI comparisons.',
    bestUseCases: ['Website redesigns', 'Landing page before/after', 'UI comparisons'],
    frameTreatment: 'Two matched frames with consistent scale and neutral labels.',
    highlightStyle: 'Matched callouts or subtle diff highlights.',
    captionBehavior: 'Use before/after labels and concise comparison captions.',
    avoidRules: ['Do not exaggerate differences.', 'Do not fake results.', 'Avoid mismatched crop scales.'],
    qaChecks: ['Before/after labels are clear.', 'Crop scales are comparable.', 'Claims are supported.'],
  },
  neutral_article_capture: {
    label: 'Neutral article capture',
    description: 'Article, blog, documentation, and source-page framing with neutral labels.',
    bestUseCases: ['Article references', 'Documentation callouts', 'Source context visuals'],
    frameTreatment: 'Neutral browser frame or article card with source label.',
    highlightStyle: 'Thin outline or spotlight around one relevant area.',
    captionBehavior: 'Use safe wording and keep article text readable.',
    avoidRules: ['Do not present commentary as official source.', 'Do not fabricate article text.', 'Avoid excessive zoom motion.'],
    qaChecks: ['Article/source label is visible.', 'Highlighted area is readable.', 'Safe wording is present.'],
  },
  dark_mode_dashboard: {
    label: 'Dark mode dashboard',
    description: 'Dark UI dashboard treatment with restrained glow and readable metrics.',
    bestUseCases: ['Dark SaaS products', 'Developer dashboards', 'Analytics UI'],
    frameTreatment: 'Dark browser frame with controlled contrast and subtle cyan/violet accents.',
    highlightStyle: 'Soft glow, outline, or zoom around one element.',
    captionBehavior: 'Use external captions and avoid covering dashboard data.',
    avoidRules: ['Avoid excessive neon.', 'Avoid tiny metrics.', 'Do not reveal private data.'],
    qaChecks: ['Contrast is sufficient.', 'Text is readable.', 'Private data checks are represented.'],
  },
  custom: {
    label: 'Custom browser visual',
    description: 'Custom browser/app treatment for approved brand or project-specific needs.',
    bestUseCases: ['Custom client systems', 'Internal web assets', 'Brand-specific walkthroughs'],
    frameTreatment: 'Use the approved project style while preserving source and safety labels.',
    highlightStyle: 'Project-specific highlight treatment.',
    captionBehavior: 'Keep captions out of UI-safe zones.',
    avoidRules: ['Do not bypass source permissions.', 'Do not invent exact UI.', 'Do not expose private data.'],
    qaChecks: ['Custom treatment stays readable.', 'Source status is preserved.', 'Approval gate remains visible.'],
  },
}

export const browserVisualPresets: Record<BrowserVisualType, BrowserVisualPreset> = {
  website_screenshot: {
    defaultCaptureMode: 'viewport_capture',
    preferredLayoutModes: ['full_visual_takeover', 'lower_visual_panel'],
    preferredTools: ['playwright', 'sharp', 'remotion'],
    tierBehavior: 'Basic can use a simple frame; Pro and Premium can add highlights and zooms.',
    fallback: ['Use uploaded screenshot only.', 'Use a mock browser frame if exact capture is not needed.'],
    qaChecks: ['Page crop is readable.', 'Source label is visible.', 'Caption safe zone is clear.'],
  },
  landing_page_capture: {
    defaultCaptureMode: 'viewport_capture',
    preferredLayoutModes: ['voiceover_visual_takeover', 'product_feature_callout'],
    preferredTools: ['playwright', 'sharp', 'remotion'],
    tierBehavior: 'Pro supports polished feature framing; Premium can plan richer sequences.',
    fallback: ['Use mock browser frame for illustrative offers.', 'Use uploaded screenshot.'],
    qaChecks: ['Offer wording is not fabricated.', 'CTA area is readable.', 'No misleading proof claims.'],
  },
  product_page_capture: {
    defaultCaptureMode: 'viewport_capture',
    preferredLayoutModes: ['product_feature_callout', 'screen_capture_with_speaker_pip'],
    preferredTools: ['playwright', 'sharp', 'remotion'],
    tierBehavior: 'Basic uses simple card; Pro supports product callouts; Premium supports sequences.',
    fallback: ['Use uploaded product screenshot.', 'Use illustrative mock only if exact capture is not needed.'],
    qaChecks: ['Product detail is readable.', 'Pricing/claims are not invented.', 'Highlight target is clear.'],
  },
  ecommerce_page_capture: {
    defaultCaptureMode: 'viewport_capture',
    preferredLayoutModes: ['product_feature_callout', 'lower_visual_panel'],
    preferredTools: ['playwright', 'sharp', 'remotion'],
    tierBehavior: 'Avoid checkout/account data in Basic; Pro/Premium can plan redaction.',
    fallback: ['Use uploaded screenshot with sensitive data cropped.', 'Use mock browser card.'],
    qaChecks: ['Payment/account data is redacted.', 'Product or checkout area is readable.', 'No fake inventory or pricing.'],
  },
  saas_dashboard_capture: {
    defaultCaptureMode: 'viewport_capture',
    preferredLayoutModes: ['screen_capture_with_speaker_pip', 'side_by_side_speaker_visual', 'voiceover_visual_takeover'],
    preferredTools: ['playwright', 'sharp', 'remotion'],
    tierBehavior: 'Pro supports dashboard highlight zooms; Premium can plan multi-step walkthroughs.',
    fallback: ['Use uploaded dashboard screenshot.', 'Use illustrative mock only for non-exact UI.'],
    qaChecks: ['Dashboard metrics are readable or redacted.', 'Feature highlight is clear.', 'No AI-video exact UI invention.'],
  },
  app_screen_capture: {
    defaultCaptureMode: 'viewport_capture',
    preferredLayoutModes: ['screen_capture_with_speaker_pip', 'side_by_side_speaker_visual'],
    preferredTools: ['playwright', 'sharp', 'remotion'],
    tierBehavior: 'Pro supports app feature focus; Premium can plan step sequences.',
    fallback: ['Use uploaded app screenshot.', 'Use mock app frame if exact capture is not needed.'],
    qaChecks: ['App screen text is readable.', 'Private account data is redacted.', 'Feature focus is clear.'],
  },
  article_capture: {
    defaultCaptureMode: 'viewport_capture',
    preferredLayoutModes: ['voiceover_visual_takeover', 'browser_card_inside_evidence_board'],
    preferredTools: ['playwright', 'sharp', 'remotion'],
    tierBehavior: 'Basic can use a static article card; Pro/Premium can add neutral highlight zooms.',
    fallback: ['Use uploaded screenshot.', 'Use source-labeled mock article card.'],
    qaChecks: ['Source label is visible.', 'Safe wording is present.', 'Article text is not fabricated.'],
  },
  evidence_page_capture: {
    defaultCaptureMode: 'viewport_capture',
    preferredLayoutModes: ['browser_card_inside_evidence_board', 'voiceover_visual_takeover'],
    preferredTools: ['playwright', 'sharp', 'remotion'],
    tierBehavior: 'Premium gets stronger evidence and redaction QA; Basic stays simple and neutral.',
    fallback: ['Use uploaded screenshot with source label.', 'Use mock/example label if fictional.'],
    qaChecks: ['Evidence status is represented.', 'Safe wording is used.', 'Private data is redacted.'],
  },
  browser_mockup_frame: {
    defaultCaptureMode: 'mock_browser_frame',
    preferredLayoutModes: ['lower_visual_panel', 'product_feature_callout'],
    preferredTools: ['sharp', 'remotion'],
    tierBehavior: 'Available to all tiers as illustrative planning only.',
    fallback: ['Ask for an authorized URL or uploaded screenshot.'],
    qaChecks: ['Mock/example label is visible.', 'No exact site is implied.', 'No fake evidence is presented.'],
  },
  before_after_website_comparison: {
    defaultCaptureMode: 'before_after_capture',
    preferredLayoutModes: ['split_screen_comparison', 'before_after_panel'],
    preferredTools: ['playwright', 'sharp', 'remotion'],
    tierBehavior: 'Premium is best for multi-step comparison; Basic should avoid complex comparisons.',
    fallback: ['Use two uploaded screenshots.', 'Use simple before/after mock cards.'],
    qaChecks: ['Before/after labels are visible.', 'Crops are comparable.', 'Claims are supported.'],
  },
  tutorial_screen_step: {
    defaultCaptureMode: 'step_sequence',
    preferredLayoutModes: ['screen_capture_with_speaker_pip', 'side_by_side_speaker_visual'],
    preferredTools: ['playwright', 'sharp', 'remotion'],
    tierBehavior: 'Pro supports step capture planning; Premium supports richer walkthroughs.',
    fallback: ['Use uploaded screenshots per step.', 'Use simple mock tutorial frames.'],
    qaChecks: ['Step label is visible.', 'UI text is readable.', 'Cursor/click cues are planned.'],
  },
  scroll_sequence: {
    defaultCaptureMode: 'scroll_sequence',
    preferredLayoutModes: ['voiceover_visual_takeover', 'screen_capture_with_speaker_pip'],
    preferredTools: ['playwright', 'sharp', 'remotion'],
    tierBehavior: 'Premium preferred; Basic should avoid complex scroll sequences.',
    fallback: ['Use one static crop.', 'Use uploaded screenshot only.'],
    qaChecks: ['Scroll speed is readable.', 'Caption zone is preserved.', 'No real browser execution in demo.'],
  },
  selector_focus: {
    defaultCaptureMode: 'element_screenshot',
    preferredLayoutModes: ['product_feature_callout', 'screen_capture_with_speaker_pip'],
    preferredTools: ['playwright', 'sharp', 'remotion'],
    tierBehavior: 'Pro and Premium support selector focus planning.',
    fallback: ['Use crop rectangle from uploaded screenshot.', 'Use mock callout.'],
    qaChecks: ['Selector target is clear.', 'Highlight does not cover important text.', 'Source status is represented.'],
  },
  ui_highlight_zoom: {
    defaultCaptureMode: 'viewport_capture',
    preferredLayoutModes: ['product_feature_callout', 'side_by_side_speaker_visual'],
    preferredTools: ['playwright', 'sharp', 'remotion'],
    tierBehavior: 'Pro supports highlight zooms; Premium can sequence multiple zooms.',
    fallback: ['Use one crop from uploaded screenshot.', 'Use mock highlight frame.'],
    qaChecks: ['Zoom target is readable.', 'Motion does not collide with captions.', 'Highlight purpose is clear.'],
  },
  webpage_timeline_card: {
    defaultCaptureMode: 'viewport_capture',
    preferredLayoutModes: ['browser_card_inside_evidence_board'],
    preferredTools: ['playwright', 'sharp', 'remotion'],
    tierBehavior: 'Pro and Premium can use timeline cards; Basic uses simple source cards.',
    fallback: ['Use source-labeled mock card.', 'Use uploaded screenshot.'],
    qaChecks: ['Timeline label is visible.', 'Source status is represented.', 'Claims are safely worded.'],
  },
  dashboard_metric_card: {
    defaultCaptureMode: 'element_screenshot',
    preferredLayoutModes: ['product_feature_callout', 'lower_visual_panel'],
    preferredTools: ['playwright', 'sharp', 'remotion'],
    tierBehavior: 'Pro supports metric cards; Premium adds redaction/QA for sensitive dashboards.',
    fallback: ['Use uploaded crop.', 'Use anonymized mock metric card.'],
    qaChecks: ['Metric is readable.', 'Private data is redacted.', 'Metric is not fabricated as real.'],
  },
  custom_browser_visual: {
    defaultCaptureMode: 'viewport_capture',
    preferredLayoutModes: ['full_visual_takeover', 'product_feature_callout'],
    preferredTools: ['playwright', 'sharp', 'remotion'],
    tierBehavior: 'Tier behavior depends on complexity and privacy risk.',
    fallback: ['Use uploaded screenshot.', 'Use mock browser frame.'],
    qaChecks: ['Source permission is represented.', 'Safe wording is present.', 'No real browser work in demo.'],
  },
}

export function getBrowserStylePreset(styleFamily: BrowserStyleFamily) {
  return browserStylePresets[styleFamily]
}

export function getBrowserVisualPreset(browserVisualType: BrowserVisualType) {
  return browserVisualPresets[browserVisualType]
}

export function getDefaultBrowserStyleForCategory(params: {
  editingCategory: EditingCategory
  customInstructions?: string
}): BrowserStyleFamily {
  const instructions = params.customInstructions?.toLowerCase() ?? ''

  if (/evidence|source|claim|reported|article|case|documentary/.test(instructions)) {
    return params.editingCategory === 'testimonial_case_study' ? 'documentary_evidence_page' : 'neutral_article_capture'
  }

  if (/ecommerce|checkout|shop|store|cart/.test(instructions)) {
    return 'ecommerce_product_focus'
  }

  if (/dashboard|saas|analytics|admin|console|metric/.test(instructions)) {
    return 'saas_dashboard_premium'
  }

  if (/tutorial|lesson|step|screen recording|walkthrough/.test(instructions)) {
    return 'education_screen_tutorial'
  }

  switch (params.editingCategory) {
    case 'product_demo':
    case 'marketing_ad':
      return 'clean_product_demo'
    case 'education_explainer':
      return 'education_screen_tutorial'
    case 'testimonial_case_study':
      return 'documentary_evidence_page'
    case 'vlog_lifestyle':
    case 'social_short_viral_clip':
      return 'social_browser_card'
    case 'talking_head_personal_brand':
      return 'neutral_article_capture'
    case 'real_estate_property_tour':
    case 'podcast_clip':
    case 'simple_clean_edit':
    case 'custom_let_ai_decide':
      return 'custom'
  }
}

export function getDefaultCaptureModeForVisualType(browserVisualType: BrowserVisualType): BrowserCaptureMode {
  return browserVisualPresets[browserVisualType].defaultCaptureMode
}

export function getDefaultBrowserLayoutForAspectRatio(params: {
  aspectRatio: AspectRatio
  visualType: BrowserVisualType
  editLevel: EditLevel
}): {
  layoutMode: SpeakerVisualLayoutMode
  frameTemplateType: FrameTemplateType
} {
  if (params.visualType === 'before_after_website_comparison') {
    return { layoutMode: 'split_screen_comparison', frameTemplateType: 'browser_card' }
  }

  if (params.visualType === 'evidence_page_capture' || params.visualType === 'article_capture' || params.visualType === 'webpage_timeline_card') {
    return { layoutMode: 'browser_card_inside_evidence_board', frameTemplateType: 'evidence_board' }
  }

  if (params.visualType === 'product_page_capture' || params.visualType === 'saas_dashboard_capture' || params.visualType === 'app_screen_capture') {
    if (params.aspectRatio === '16:9') {
      return { layoutMode: 'side_by_side_speaker_visual', frameTemplateType: 'horizontal_wide_frame' }
    }

    return params.editLevel === 'basic'
      ? { layoutMode: 'lower_visual_panel', frameTemplateType: 'vertical_story_frame' }
      : { layoutMode: 'screen_capture_with_speaker_pip', frameTemplateType: 'vertical_story_frame' }
  }

  if (params.aspectRatio === '16:9') {
    return { layoutMode: 'voiceover_visual_takeover', frameTemplateType: 'horizontal_wide_frame' }
  }

  if (params.aspectRatio === '1:1') {
    return { layoutMode: 'product_feature_callout', frameTemplateType: 'square_social_frame' }
  }

  return { layoutMode: 'lower_visual_panel', frameTemplateType: 'vertical_story_frame' }
}
