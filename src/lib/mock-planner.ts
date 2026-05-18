import type { BrowserCapturePlan, ClipSource, EditPlan, PlannerInput, SignatureRoute } from '../types/reeditpro'
import { createBrowserCapturePlan } from './browser-capture-planner'
import { createEditQAChecks } from './edit-qa-planner'
import { compileEditingIntent, inferReferenceAdaptationFocus } from './intent-compiler'
import { createProfessionalEditingDirective } from './professional-editing-ontology'
import { buildProviderPromptGuidance } from './prompt-builders'
import { createReferenceVideoPlan, mergeReferenceDNAIntoProfessionalDirective } from './reference-dna'
import { validateMockEditPlan } from './planner-validation'
import { getWorkflowProfile } from './workflow-profiles'

export const mockPlannerLoadingSteps = [
  'Analyzing source sequence',
  'Reading user instructions',
  'Studying Reference DNA',
  'Planning browser/app visuals',
  'Mapping story beats',
  'Routing signature systems',
  'Estimating credits',
  'Preparing plan',
]

export const sampleClips: ClipSource[] = [
  {
    id: 'clip-1',
    uploadedOrder: 1,
    fileName: 'entry-living-room-walkthrough.mp4',
    duration: '00:12',
    detectedType: 'Entry and living room walkthrough',
    notes: 'Open with a calm premium feel.',
    isImportant: true,
  },
  {
    id: 'clip-2',
    uploadedOrder: 2,
    fileName: 'kitchen-detail-shots.mov',
    duration: '00:08',
    detectedType: 'Detail b-roll',
    notes: 'Nice countertop detail.',
  },
  {
    id: 'clip-3',
    uploadedOrder: 3,
    fileName: 'speaker-investment-line.mp4',
    duration: '00:14',
    detectedType: 'Speaker value explanation',
    notes: 'Strong line about major investment.',
    isImportant: true,
  },
  {
    id: 'clip-4',
    uploadedOrder: 4,
    fileName: 'exterior-backyard.mp4',
    duration: '00:10',
    detectedType: 'Exterior and backyard proof',
    isOptional: false,
  },
]

function systemLabel(system: SignatureRoute['system']) {
  const labels = {
    stroke_motion: 'Stroke Motion',
    graphic_design: 'Graphic Design / VisualExplain',
    real_motion: 'Real Motion',
    sound_sync: 'SoundSync',
    none: 'None',
  }

  return labels[system]
}

function shouldUseMinimalVisuals(input: PlannerInput) {
  return input.visualPreference === 'keep_visuals_minimal' || input.visualPreference === 'no_extra_visuals' || input.workflowType === 'simple_clean_edit'
}

function createSignatureRoutes(input: PlannerInput): SignatureRoute[] {
  const routes: SignatureRoute[] = [
    {
      timeRange: '00:00-00:04',
      system: 'sound_sync',
      reason: 'Establish the selected mood with timing support before adding visual density.',
      creditImpact: 'low',
    },
  ]

  if (shouldUseMinimalVisuals(input)) {
    routes.push({
      timeRange: '00:05-00:18',
      system: 'none',
      reason: 'The user preference or workflow points toward a clean edit, so the plan avoids unnecessary overlays.',
      creditImpact: 'none',
    })
    return routes
  }

  const instructions = input.customInstructions.toLowerCase()
  const hasConceptWork =
    input.workflowType === 'education_explainer' ||
    input.workflowType === 'product_demo' ||
    input.workflowType === 'marketing_ad' ||
    instructions.includes('explain') ||
    instructions.includes('framework') ||
    instructions.includes('list')

  const hasRealMotionCandidate =
    input.visualPreference === 'real_motion_if_useful' ||
    input.creditPreference === 'premium_best_result' ||
    input.workflowType === 'product_demo' ||
    input.workflowType === 'real_estate_property_tour' ||
    input.clips.some((clip) => /product|kitchen|exterior|proof|object|walkthrough/i.test(`${clip.fileName} ${clip.detectedType}`))

  if (hasConceptWork || input.visualPreference === 'more_graphic_design' || input.visualPreference === 'balanced_visual_mix') {
    routes.push({
      timeRange: '00:05-00:10',
      system: 'graphic_design',
      reason: 'Use clean explanatory overlays only where they clarify details, concepts, or proof points.',
      creditImpact: 'medium',
    })
  }

  if (hasRealMotionCandidate && input.creditPreference !== 'low_credit_cost') {
    routes.push({
      timeRange: '00:11-00:15',
      system: 'real_motion',
      reason: 'A realistic in-video overlay can support a real object or proof moment, but it remains optional and credit-heavy.',
      creditImpact: 'premium',
    })
  }

  if (input.visualPreference === 'more_stroke_motion' || input.editLevel !== 'basic') {
    routes.push({
      timeRange: '00:16-00:24',
      system: 'stroke_motion',
      reason: 'Add light 2D motion to emphasize the speaker-aligned story beat without cluttering the footage.',
      creditImpact: 'medium',
    })
  }

  routes.push({
    timeRange: '00:24-00:32',
    system: 'sound_sync',
    reason: 'Support the final transition and emotional polish with beat timing and voice ducking.',
    creditImpact: 'low',
  })

  return routes
}

function createCreditEstimate(routes: SignatureRoute[], input: PlannerInput, browserCapturePlan?: BrowserCapturePlan): EditPlan['creditEstimate'] {
  const breakdown = [
    { label: 'Planning and transcript analysis', credits: 0, reason: 'Included as a mock setup step for this frontend demo.' },
    { label: 'Captions', credits: 10, reason: 'Editable captions aligned with StoryTiming.' },
    { label: 'Basic edit cleanup', credits: input.editLevel === 'basic' ? 14 : 18, reason: 'Trim dead space and smooth pacing.' },
  ]

  if (routes.some((route) => route.system === 'stroke_motion')) {
    breakdown.push({ label: 'Stroke Motion', credits: 22, reason: '2D overlay motion for speaker-aligned emphasis.' })
  }

  if (routes.some((route) => route.system === 'graphic_design')) {
    breakdown.push({ label: 'Graphic Design / VisualExplain', credits: 18, reason: 'Clean overlay graphics for details, lists, or proof.' })
  }

  if (routes.some((route) => route.system === 'real_motion')) {
    breakdown.push({ label: 'Real Motion', credits: 34, reason: 'Premium overlay-first realistic motion with face-safe placement.' })
  }

  if (routes.some((route) => route.system === 'sound_sync')) {
    breakdown.push({ label: 'SoundSync', credits: 8, reason: 'Music timing, SFX cues, ducking, and emotional polish.' })
  }

  if (browserCapturePlan?.active) {
    const browserCreditImpact = browserCapturePlan.items.some((item) => item.creditImpact === 'premium' || item.creditImpact === 'high')
      ? 14
      : browserCapturePlan.items.some((item) => item.creditImpact === 'medium')
        ? 9
        : 4
    breakdown.push({
      label: 'Browser/app visual planning',
      credits: browserCreditImpact,
      reason:
        'Plans source status, capture mode, browser frame, highlights, redaction, layout, and QA. No browser tools run in this frontend demo.',
    })
  }

  breakdown.push({ label: 'Final render placeholder', credits: 0, reason: 'Rendering is not implemented in this frontend-only phase.' })

  const total = breakdown.reduce((sum, item) => sum + item.credits, 0)

  return { total, breakdown }
}

export function createMockEditPlan(input: PlannerInput): EditPlan {
  const resolvedInput: PlannerInput = {
    ...input,
    referenceAdaptationFocus: inferReferenceAdaptationFocus(input),
  }
  const profile = getWorkflowProfile(resolvedInput.workflowType)
  const referenceAttached =
    resolvedInput.referenceUrl.trim().length > 0 ||
    resolvedInput.referenceVideoMode === 'mock_reference' ||
    resolvedInput.referenceVideoMode === 'user_uploaded_reference'
  const referenceVideoPlan = createReferenceVideoPlan({
    referenceUrl: resolvedInput.referenceUrl,
    referenceAttached,
    skipped: resolvedInput.referenceVideoMode === 'reference_skipped',
    input: resolvedInput,
  })
  const compiledIntent = compileEditingIntent(resolvedInput)
  const baseDirective = createProfessionalEditingDirective({ input: resolvedInput, compiledIntent })
  const professionalEditingDirective = mergeReferenceDNAIntoProfessionalDirective({
    directive: baseDirective,
    referenceDNA: referenceVideoPlan.referenceDNA,
    userInstructions: resolvedInput.customInstructions,
  })
  const browserCapturePlan = createBrowserCapturePlan({
    input: resolvedInput,
    compiledIntent,
  })
  const routes = createSignatureRoutes(resolvedInput)
  const strongerSocialOpen =
    resolvedInput.structurePreference === 'restructure_for_social' ||
    resolvedInput.structurePreference === 'let_ai_recommend' ||
    resolvedInput.workflowType === 'social_short_viral_clip' ||
    resolvedInput.workflowType === 'marketing_ad'

  const sourceSequenceMap = resolvedInput.clips.map((clip) => ({
    clipId: clip.id,
    uploadedOrder: clip.uploadedOrder,
    detectedRole: clip.detectedType,
    strengths: clip.isImportant ? ['Marked important by user', 'Strong candidate for story anchor'] : ['Useful supporting context'],
    concerns: clip.isOptional ? ['Marked optional, use only if it improves the story'] : ['Needs timing review before final structure'],
    possibleUses: [
      clip.uploadedOrder === 1 ? 'Natural opening context' : 'Supporting segment',
      clip.fileName.toLowerCase().includes('speaker') ? 'Possible hook or value line' : 'Visual proof or pacing support',
    ],
  }))

  const recommendedStructure = strongerSocialOpen
    ? [
        'Open with the strongest 3-second spoken line if the user wants more social performance.',
        'Return to the source sequence for context so the edit still feels natural.',
        'Use detail shots as proof moments instead of random cutaways.',
        'Close with the clearest result or CTA from the available clips.',
      ]
    : [
        'Preserve the uploaded source sequence as the primary structure.',
        'Trim weak pauses and keep the walkthrough or story flow intact.',
        'Use only targeted overlays where they clarify the spoken point.',
        'End with a clean final beat and export-ready captions.',
      ]

  const hookPolicy =
    resolvedInput.workflowType === 'marketing_ad'
      ? 'required'
      : resolvedInput.workflowType === 'simple_clean_edit'
        ? 'avoid'
        : strongerSocialOpen
          ? 'recommended'
          : 'optional'

  const hookDecision = {
    policy: hookPolicy,
    recommendation:
      hookPolicy === 'avoid'
        ? 'No hook recommended. Keep the edit clean because the selected workflow or instructions point to simplicity.'
        : hookPolicy === 'required'
          ? 'Strong hook required before the offer or proof sequence.'
          : 'Soft hook recommended only if it improves the viewer entry point.',
    reason:
      resolvedInput.customInstructions.toLowerCase().includes('no hook')
        ? 'User instructions have highest priority, so the plan will not force a hook.'
        : `${profile.label} gives workflow context, but the edit plan chooses the hook based on goal, platform, and footage.`,
  } satisfies EditPlan['hookDecision']

  const providerPromptGuidance = buildProviderPromptGuidance({
    input: resolvedInput,
    directive: professionalEditingDirective,
    referenceDNA: referenceVideoPlan.referenceDNA,
    browserCapturePlan,
  })
  const qaChecks = createEditQAChecks({ input: resolvedInput, referenceVideoPlan, browserCapturePlan })

  const plan: EditPlan = {
    goalSummary: `Create a ${profile.label.toLowerCase()} that feels ${resolvedInput.moodStyle.replaceAll('_', ' ')} while protecting credits with plan-first approval.`,
    sourceSequenceMap,
    recommendedStructure,
    hookDecision,
    referenceVideoPlan,
    referenceDNA: referenceVideoPlan.referenceDNA
      ? {
          pacing: referenceVideoPlan.referenceDNA.pacing,
          music: referenceVideoPlan.referenceDNA.soundSyncStyle,
          captions: `${referenceVideoPlan.referenceDNA.captionStyle}; ${referenceVideoPlan.referenceDNA.captionDensity}`,
          transitions: referenceVideoPlan.referenceDNA.transitionStyle,
          visualStyle: referenceVideoPlan.referenceDNA.visualEffectStyle,
          adaptationRule: referenceVideoPlan.referenceDNA.adaptationRules[0] ?? 'Reference DNA guides style; it does not create a shot-for-shot copy.',
        }
      : undefined,
    signatureRoutes: routes.map((route) => ({
      ...route,
      reason: `${route.reason} (${systemLabel(route.system)} is selected per segment, not forced by the dropdown.)`,
    })),
    soundSyncDirection:
      resolvedInput.editLevel === 'basic'
        ? 'Keep SoundSync subtle: light cleanup, soft bed if needed, and no distracting transitions.'
        : 'Use SoundSync for mood, beat timing, transition sounds, ducking, and emotional polish while speech stays clear.',
    captionDirection: 'Use readable captions that avoid faces, important objects, and Real Motion placement zones.',
    browserCapturePlan,
    compiledIntent,
    professionalEditingDirective,
    qaChecks,
    providerPromptGuidance,
    creditEstimate: createCreditEstimate(routes, resolvedInput, browserCapturePlan),
    approvalRequired: true,
  }

  return {
    ...plan,
    plannerValidation: validateMockEditPlan(plan, resolvedInput),
  }
}
