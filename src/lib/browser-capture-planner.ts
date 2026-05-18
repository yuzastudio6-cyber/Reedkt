import type {
  AdaptiveEditStrategyPlan,
  AudioPipelinePlan,
  BrowserCaptureMode,
  BrowserCapturePermissionStatus,
  BrowserCapturePlan,
  BrowserCapturePlanItem,
  BrowserEvidenceStatus,
  BrowserPrivacyRisk,
  BrowserSourcePlan,
  BrowserSourceType,
  BrowserVisualType,
  CompiledEditingIntent,
  DataVizPlan,
  EditLevel,
  PlannerInput,
  RenderStrategyPlan,
  SpeakerVisualLayoutPlan,
  ToolStrategyPlan,
  VideoUnderstandingReport,
  VisualAssetPlanItem,
} from '../types/reeditpro'
import {
  getBrowserStylePreset,
  getBrowserVisualPreset,
  getDefaultBrowserLayoutForAspectRatio,
  getDefaultBrowserStyleForCategory,
  getDefaultCaptureModeForVisualType,
} from './browser-capture-presets'

const browserIntentKeywords = [
  'website',
  'webpage',
  'app',
  'dashboard',
  'saas',
  'browser',
  'landing page',
  'product page',
  'article',
  'evidence page',
  'screen recording',
  'screen',
  'ui',
  'feature',
  'online page',
  'checkout',
  'ecommerce',
  'shop',
  'storefront',
]

const privateDataKeywords = ['private', 'account', 'customer', 'email', 'payment', 'checkout', 'token', 'address', 'dashboard', 'analytics']

function combinedPlanningText(params: {
  input: PlannerInput
  compiledIntent?: CompiledEditingIntent
  videoUnderstandingReport?: VideoUnderstandingReport
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  visualAssetPlan?: VisualAssetPlanItem[]
}): string {
  return [
    params.input.customInstructions,
    params.input.workflowType,
    params.input.referenceUrl,
    params.compiledIntent?.goalSummary,
    ...(params.compiledIntent?.explicitInstructions ?? []),
    ...(params.compiledIntent?.referencePreferences ?? []),
    ...(params.videoUnderstandingReport?.opportunities ?? []),
    ...(params.videoUnderstandingReport?.notes ?? []),
    ...(params.adaptiveEditStrategyPlan?.toolHints ?? []),
    ...(params.adaptiveEditStrategyPlan?.visualOpportunities ?? []),
    ...(params.visualAssetPlan?.flatMap((item) => [item.title, item.visualType, ...item.notes]) ?? []),
  ]
    .join(' ')
    .toLowerCase()
}

function hasBrowserIntent(text: string, input: PlannerInput) {
  return (
    browserIntentKeywords.some((keyword) => text.includes(keyword)) ||
    input.workflowType === 'product_demo' ||
    input.workflowType === 'education_explainer' ||
    input.workflowType === 'marketing_ad' ||
    input.workflowType === 'testimonial_case_study'
  )
}

function inferBrowserVisualType(text: string, input: PlannerInput): BrowserVisualType {
  if (/before.?after|before and after|redesign|comparison/.test(text)) {
    return 'before_after_website_comparison'
  }

  if (/tutorial|lesson|step|walkthrough|screen recording/.test(text)) {
    return text.includes('scroll') ? 'scroll_sequence' : 'tutorial_screen_step'
  }

  if (/selector|callout|highlight|zoom/.test(text)) {
    return text.includes('zoom') ? 'ui_highlight_zoom' : 'selector_focus'
  }

  if (/evidence|claim|reported|source proof|case study/.test(text) || input.workflowType === 'testimonial_case_study') {
    return 'evidence_page_capture'
  }

  if (/article|blog|docs|documentation|source page/.test(text)) {
    return 'article_capture'
  }

  if (/ecommerce|checkout|cart|shop|storefront/.test(text)) {
    return 'ecommerce_page_capture'
  }

  if (/product page|pricing|offer page/.test(text)) {
    return 'product_page_capture'
  }

  if (/landing page|offer/.test(text)) {
    return 'landing_page_capture'
  }

  if (/dashboard|saas|analytics|admin|console|metric/.test(text)) {
    return 'saas_dashboard_capture'
  }

  if (/app|ui|feature/.test(text)) {
    return 'app_screen_capture'
  }

  if (!extractUrl(text)) {
    return 'browser_mockup_frame'
  }

  return 'website_screenshot'
}

function extractUrl(text: string) {
  return text.match(/https?:\/\/[^\s)]+/i)?.[0]
}

function sourcePlanFromInput(params: {
  input: PlannerInput
  text: string
  visualType: BrowserVisualType
}): BrowserSourcePlan {
  const url = extractUrl(params.input.referenceUrl) ?? extractUrl(params.text)
  const isMockUrl = Boolean(url && /example\.com|mock/i.test(url))
  const evidenceLike = params.visualType === 'evidence_page_capture' || params.visualType === 'article_capture'
  const sourceNeeded = !url || (!isMockUrl && evidenceLike)
  const sourceType: BrowserSourceType = url ? 'user_provided_url' : params.visualType === 'browser_mockup_frame' ? 'internal_mock' : 'unknown'
  const permissionStatus: BrowserCapturePermissionStatus = url ? (isMockUrl ? 'mock_only' : 'user_provided') : 'needs_confirmation'
  const evidenceStatus: BrowserEvidenceStatus = evidenceLike ? (isMockUrl ? 'mock_example' : url ? 'claimed_source' : 'unknown') : 'not_evidence'
  const safeWording = evidenceLike
    ? isMockUrl
      ? 'mock example page'
      : url
        ? 'claimed source page'
        : 'source needed before evidence visual'
    : isMockUrl
      ? 'mock example page'
      : url
        ? 'user-provided page'
        : 'source needed before capture'

  return {
    id: 'browser-source-1',
    sourceType,
    url,
    label: url ? 'Planned browser source' : 'Browser source needed',
    permissionStatus,
    evidenceStatus,
    sourceNeeded,
    sourceLabel: safeWording,
    safeWording,
    mockOnly: isMockUrl || !url,
    notes: [
      'Planning-only source record; no website has been accessed.',
      permissionStatus === 'needs_confirmation'
        ? 'Ask user for an authorized URL or uploaded screenshot before production capture.'
        : 'Future production capture still requires approval and authorization.',
    ],
  }
}

function captureModeForTier(visualType: BrowserVisualType, editLevel: EditLevel): BrowserCaptureMode {
  const defaultMode = getDefaultCaptureModeForVisualType(visualType)

  if (editLevel === 'basic') {
    if (defaultMode === 'scroll_sequence' || defaultMode === 'step_sequence' || defaultMode === 'before_after_capture') {
      return 'static_screenshot'
    }

    return defaultMode === 'element_screenshot' ? 'viewport_capture' : defaultMode
  }

  if (editLevel === 'pro' && defaultMode === 'scroll_sequence') {
    return 'step_sequence'
  }

  return defaultMode
}

function creditImpactFor(visualType: BrowserVisualType, editLevel: EditLevel, privacyRisk: BrowserPrivacyRisk): BrowserCapturePlanItem['creditImpact'] {
  if (visualType === 'browser_mockup_frame') {
    return 'low'
  }

  if (privacyRisk === 'high') {
    return editLevel === 'advanced_viral' ? 'premium' : 'high'
  }

  if (visualType === 'before_after_website_comparison' || visualType === 'scroll_sequence' || visualType === 'tutorial_screen_step') {
    return editLevel === 'advanced_viral' ? 'high' : 'medium'
  }

  if (visualType === 'saas_dashboard_capture' || visualType === 'ui_highlight_zoom' || visualType === 'selector_focus') {
    return 'medium'
  }

  return 'low'
}

function privacyRiskForText(text: string, visualType: BrowserVisualType): BrowserPrivacyRisk {
  if (privateDataKeywords.some((keyword) => text.includes(keyword))) {
    return visualType === 'ecommerce_page_capture' || visualType === 'saas_dashboard_capture' ? 'medium' : 'low'
  }

  if (visualType === 'evidence_page_capture') {
    return 'medium'
  }

  if (visualType === 'browser_mockup_frame') {
    return 'none'
  }

  return 'low'
}

export function createBrowserCapturePlan(params: {
  input: PlannerInput
  compiledIntent?: CompiledEditingIntent
  videoUnderstandingReport?: VideoUnderstandingReport
  adaptiveEditStrategyPlan?: AdaptiveEditStrategyPlan
  visualAssetPlan?: VisualAssetPlanItem[]
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan
  renderStrategyPlan?: RenderStrategyPlan
  toolStrategyPlan?: ToolStrategyPlan
  dataVizPlan?: DataVizPlan
  audioPipelinePlan?: AudioPipelinePlan
}): BrowserCapturePlan {
  const text = combinedPlanningText(params)
  const externallySuggested =
    params.speakerVisualLayoutPlan?.preferredLayoutMode?.includes('screen_capture') ||
    params.renderStrategyPlan?.strategyIds?.some((id) => id.includes('browser') || id.includes('screen')) ||
    params.toolStrategyPlan?.toolChainIds?.includes('browser_capture_chain') ||
    params.dataVizPlan?.notes?.some((note) => /browser|dashboard|screen/i.test(note)) ||
    params.audioPipelinePlan?.notes?.some((note) => /browser|dashboard|screen/i.test(note))
  const active = hasBrowserIntent(text, params.input) || Boolean(externallySuggested)

  const globalRules = [
    'Browser/app visuals use controlled capture planning, not AI video invention.',
    'No Playwright, Sharp, browser, website, scraping, or capture execution happens in this frontend demo.',
    'User approval and credit estimate remain required before future tool execution.',
    'Do not bypass auth, paywalls, CAPTCHAs, robots, rate limits, site restrictions, or credentials.',
    'Browser capture never enables Veo and never uses Veo for exact UI/page visuals.',
  ]
  const limitations = [
    'Mock-only browser capture plan; no Playwright/browser access has been run.',
    'Future worker/tool integration required for real capture.',
    'User-provided or authorized source required in production.',
  ]

  if (!active) {
    return {
      id: 'browser-capture-plan-none',
      active: false,
      summary: 'No browser/app visual capture need detected for this mock plan.',
      items: [],
      browserToolsPlanned: [],
      globalRules,
      qaChecks: ['No browser capture opportunity detected.'],
      limitations,
      notes: ['Browser/app capture planning is inactive.'],
    }
  }

  const browserVisualType = inferBrowserVisualType(text, params.input)
  const styleFamily = getDefaultBrowserStyleForCategory({
    editingCategory: params.input.workflowType,
    customInstructions: params.input.customInstructions,
  })
  const stylePreset = getBrowserStylePreset(styleFamily)
  const visualPreset = getBrowserVisualPreset(browserVisualType)
  const source = sourcePlanFromInput({ input: params.input, text, visualType: browserVisualType })
  const privacyRisk = privacyRiskForText(text, browserVisualType)
  const redactionNeeded = privacyRisk === 'medium' || privacyRisk === 'high'
  const captureMode = captureModeForTier(browserVisualType, params.input.editLevel)
  const layoutDefaults = getDefaultBrowserLayoutForAspectRatio({
    aspectRatio: params.input.aspectRatio,
    visualType: browserVisualType,
    editLevel: params.input.editLevel,
  })
  const layoutMode = params.speakerVisualLayoutPlan?.preferredLayoutMode ?? layoutDefaults.layoutMode
  const exactCapture = browserVisualType !== 'browser_mockup_frame'
  const toolIds = exactCapture || source.sourceType === 'user_provided_url' ? ['playwright', 'sharp', 'remotion'] as const : ['sharp', 'remotion'] as const

  const item: BrowserCapturePlanItem = {
    id: 'browser-capture-item-1',
    browserVisualType,
    title: stylePreset.label,
    purpose: `Use a controlled ${browserVisualType.replaceAll('_', ' ')} to support the edit without inventing exact UI as AI video.`,
    source,
    capture: {
      captureMode,
      viewportWidth: params.input.aspectRatio === '9:16' ? 390 : 1440,
      viewportHeight: params.input.aspectRatio === '9:16' ? 844 : 900,
      deviceScaleFactor: 2,
      fullPage: captureMode === 'full_page_screenshot',
      selector: browserVisualType === 'selector_focus' ? '[data-feature-highlight]' : undefined,
      clipRectangle: browserVisualType === 'dashboard_metric_card' ? { x: 80, y: 120, width: 520, height: 320 } : undefined,
      imageFormat: 'png',
      imageQuality: undefined,
      waitTimeMs: 1200,
      waitForSelector: browserVisualType === 'selector_focus' ? '[data-feature-highlight]' : undefined,
      scrollPosition: captureMode === 'scroll_sequence' ? 0 : undefined,
      captureSequence:
        captureMode === 'step_sequence' || captureMode === 'scroll_sequence'
          ? ['Open authorized page', 'Capture overview', 'Capture feature focus', 'Capture CTA or result state']
          : undefined,
      notes: [
        'Capture settings are planning metadata only.',
        params.input.editLevel === 'basic' ? 'Basic keeps browser capture simple and static.' : 'Pro/Premium can plan highlight zooms or step sequences.',
      ],
    },
    frameStyle: {
      styleFamily,
      showAddressBar: true,
      showTabs: params.input.editLevel !== 'basic' && browserVisualType !== 'browser_mockup_frame',
      showCursor: browserVisualType === 'tutorial_screen_step' || browserVisualType === 'app_screen_capture',
      theme: styleFamily === 'dark_mode_dashboard' || styleFamily === 'saas_dashboard_premium' ? 'dark' : 'auto',
      cornerRadius: 14,
      shadowStyle: 'premium soft shadow using ReeditPro surface tokens',
      borderStyle: 'subtle token border',
      toolbarColor: 'var(--rp-surface-2)',
      pageBackgroundColor: 'var(--rp-surface-1)',
      notes: [stylePreset.frameTreatment],
    },
    highlight: {
      highlightSelector: browserVisualType === 'selector_focus' ? '[data-feature-highlight]' : undefined,
      highlightZone: { x: 0.2, y: 0.22, width: 0.48, height: 0.28 },
      highlightColor: 'var(--rp-brand-cyan)',
      highlightStyle:
        browserVisualType === 'evidence_page_capture'
          ? 'spotlight'
          : browserVisualType === 'ui_highlight_zoom'
            ? 'zoom'
            : browserVisualType === 'browser_mockup_frame'
              ? 'none'
              : 'outline',
      zoomTarget: browserVisualType === 'ui_highlight_zoom' || browserVisualType === 'saas_dashboard_capture' ? { x: 0.24, y: 0.24, width: 0.42, height: 0.24 } : undefined,
      zoomScale: browserVisualType === 'ui_highlight_zoom' || browserVisualType === 'saas_dashboard_capture' ? 1.18 : undefined,
      panDirection: captureMode === 'scroll_sequence' ? 'down' : 'none',
      scrollAnimationDurationMs: captureMode === 'scroll_sequence' ? 1800 : undefined,
      stepRevealTimingMs: captureMode === 'step_sequence' ? 900 : undefined,
      cursorMotion: browserVisualType === 'tutorial_screen_step' || browserVisualType === 'app_screen_capture',
      clickPulse: browserVisualType === 'tutorial_screen_step' || browserVisualType === 'selector_focus',
      annotationStyle: stylePreset.highlightStyle,
      calloutLabel: browserVisualType === 'evidence_page_capture' ? source.safeWording : 'Feature highlight',
      notes: ['Highlight plan keeps one focus target active at a time.', stylePreset.highlightStyle],
    },
    redaction: {
      redactionNeeded,
      privacyRisk,
      redactionTargets: redactionNeeded
        ? ['emails', 'names', 'account numbers', 'addresses', 'payment info', 'tokens', 'private metrics']
        : [],
      redactionStyle: redactionNeeded ? 'blur' : 'none',
      blurStrength: redactionNeeded ? 14 : undefined,
      blockColor: redactionNeeded ? 'var(--rp-surface-3)' : undefined,
      userConfirmationRequired: privacyRisk === 'high',
      qaChecks: redactionNeeded
        ? ['Redaction covers sensitive fields.', 'User confirmation required before production use if high risk.']
        : ['No sensitive data risk detected in mock planning text.'],
      notes: redactionNeeded
        ? ['Privacy-sensitive browser/app content must be reviewed before capture or composition.']
        : ['Redaction is not required for this mock plan unless source content changes.'],
    },
    layout: {
      layoutMode,
      frameTemplateType: layoutDefaults.frameTemplateType,
      browserZone: { x: 0.08, y: 0.16, width: 0.84, height: 0.54 },
      speakerZone: layoutMode.includes('speaker') ? { x: 0.62, y: 0.56, width: 0.28, height: 0.32 } : undefined,
      captionSafeZone: { x: 0.08, y: 0.78, width: 0.84, height: 0.14 },
      safeMargins: 24,
      panelBackgroundColor: 'var(--rp-surface-1)',
      labelAvoidZones: [{ x: 0.08, y: 0.78, width: 0.84, height: 0.14 }],
      fullTakeoverMode: layoutMode === 'full_visual_takeover' || layoutMode === 'voiceover_visual_takeover',
      pictureInPictureSpeaker: layoutMode === 'screen_capture_with_speaker_pip' || layoutMode === 'picture_in_picture_speaker',
      notes: ['Remotion composes final browser layer, frame, safe zones, captions, and motion.'],
    },
    toolChain: source.sourceType === 'uploaded_screenshot' ? 'uploaded_screenshot_chain' : browserVisualType === 'browser_mockup_frame' ? 'mock_browser_frame_chain' : 'browser_capture_chain',
    toolIds: [...toolIds],
    remotionCapabilities: [
      'screen_capture_placement',
      layoutMode.includes('speaker') ? 'picture_in_picture' : 'safe_zone_layout',
      'browser_frame_overlay',
      'zoom_pan_highlight',
      'caption_safe_composition',
      browserVisualType === 'before_after_website_comparison' ? 'split_screen_comparison' : 'transition_layer',
    ],
    creditImpact: creditImpactFor(browserVisualType, params.input.editLevel, privacyRisk),
    tierAllowed: {
      basic:
        params.input.editLevel === 'basic'
          ? captureMode === 'static_screenshot' || captureMode === 'viewport_capture' || captureMode === 'mock_browser_frame'
          : true,
      pro: true,
      premium: true,
    },
    reason: `Detected browser/app visual intent from the workflow or instructions; ${visualPreset.tierBehavior}`,
    whyNotAiVideo: 'Exact websites, dashboards, UI labels, product pages, and evidence pages need controlled capture planning and Remotion composition, not AI-video invention.',
    fallbackStrategy: visualPreset.fallback,
    qaChecks: [...visualPreset.qaChecks, ...stylePreset.qaChecks],
    workerNotes: [
      'Future worker expects authorized source or uploaded screenshot.',
      'Future Playwright/Sharp output is an intermediate asset only.',
      'Remotion composes the final browser layer after approval.',
      'Do not run browser tools before edit plan and credit approval.',
    ],
  }

  return {
    id: 'browser-capture-plan-1',
    active: true,
    summary: `${item.title}: plan ${browserVisualType.replaceAll('_', ' ')} with ${item.toolIds.join(', ')} planning and Remotion composition.`,
    items: [item],
    browserToolsPlanned: item.toolIds,
    globalRules,
    qaChecks: [
      'Browser capture plan exists for detected browser/screen opportunity.',
      'Exact website/app visuals use controlled capture planning, not AI video.',
      'Source permission/status and safe wording are represented.',
      'Redaction plan exists when privacy risk is medium/high.',
      'Browser visual does not cover face/captions.',
      'No Playwright execution before approval.',
      'No Veo for browser capture.',
      'Browser plan does not bypass approval.',
    ],
    limitations,
    notes: [
      stylePreset.description,
      source.sourceNeeded ? 'Source still needs confirmation before production capture.' : 'Source status is represented for future approval.',
    ],
  }
}
