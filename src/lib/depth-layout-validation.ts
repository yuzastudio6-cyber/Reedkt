import { createDepthLowerCostAlternatives, getDepthCompositionCreditProfile, inferDepthCompositionComplexity } from './depth-layout-credit-policy'
import type {
  DataVizPlan,
  DepthAwareLayoutValidationPlan,
  DepthAwareLayoutValidationPlanItem,
  DepthAwareOverlayPlan,
  DepthAwareOverlayPlanItem,
  DepthLayoutFallbackRecommendation,
  DepthLayoutValidationCategory,
  DepthLayoutValidationCheck,
  DepthLayoutValidationStatus,
  ForegroundMaskingPlan,
  MapAnimationPlan,
  PlannerInput,
  RendererCompositionPlan,
  SpeakerVisualLayoutMode,
  SpeakerVisualLayoutPlan,
} from '../types/reeditpro'

type ValidationParams = {
  input: PlannerInput
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan
  depthAwareOverlayPlan?: DepthAwareOverlayPlan
  foregroundMaskingPlan?: ForegroundMaskingPlan
  mapAnimationPlan?: MapAnimationPlan
  dataVizPlan?: DataVizPlan
  browserCapturePlan?: { active?: boolean; items?: unknown[] }
  rendererCompositionPlan?: RendererCompositionPlan
}

const riskRequiresFallback = new Set(['medium', 'high', 'premium'])

function label(value: string) {
  return value.replaceAll('_', ' ')
}

function depthLanguageRequested(input: PlannerInput) {
  const text = [
    input.customInstructions,
    input.projectName,
    input.workflowType,
    input.clips.map((clip) => `${clip.fileName} ${clip.detectedType} ${clip.notes ?? ''} ${clip.thumbnailHint ?? ''}`).join(' '),
  ].join(' ').toLowerCase()

  return /behind me|behind the person|behind subject|map behind|card behind|foreground|depth|object in front|pole|contact object|in the scene/.test(text)
}

function check(params: {
  id: string
  category: DepthLayoutValidationCategory
  label: string
  passed: boolean
  failStatus?: Exclude<DepthLayoutValidationStatus, 'passed'>
  severity: DepthLayoutValidationCheck['severity']
  message: string
  recommendation?: string
  relatedSegmentId?: string
  relatedAssetPlanItemId?: string
  relatedDepthAwareOverlayItemId?: string
  relatedMaskingPlanItemId?: string
}): DepthLayoutValidationCheck {
  const { failStatus = params.severity === 'blocking' ? 'blocking' : 'failed', passed, ...rest } = params

  return {
    ...rest,
    status: passed ? 'passed' : failStatus,
  }
}

function aggregateStatus(checks: DepthLayoutValidationCheck[]): DepthLayoutValidationStatus {
  if (checks.some((item) => item.status === 'blocking')) return 'blocking'
  if (checks.some((item) => item.status === 'failed')) return 'failed'
  if (checks.some((item) => item.status === 'warning')) return 'warning'
  return 'passed'
}

function layoutForDepthItem(depthItem: DepthAwareOverlayPlanItem, speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan) {
  return speakerVisualLayoutPlan?.items.find((item) =>
    item.depthAwareOverlayItemId === depthItem.id ||
    item.id === depthItem.speakerVisualLayoutItemId ||
    item.segmentId === depthItem.segmentId,
  )
}

function maskingForDepthItem(depthItem: DepthAwareOverlayPlanItem, foregroundMaskingPlan?: ForegroundMaskingPlan) {
  return foregroundMaskingPlan?.items.find((item) => item.depthAwareOverlayItemId === depthItem.id)
}

function fallbackFor(depthItem: DepthAwareOverlayPlanItem, fallbackLayoutMode: SpeakerVisualLayoutMode | undefined, credits: number): DepthLayoutFallbackRecommendation[] {
  if (!fallbackLayoutMode) {
    return []
  }

  return [
    {
      id: `fallback-${depthItem.id}`,
      fromLayoutMode: layoutForDepthItem(depthItem)?.layoutMode,
      toLayoutMode: fallbackLayoutMode,
      reason: `Use ${label(fallbackLayoutMode)} if ${label(depthItem.maskStrategy)} is too risky or hurts readability.`,
      reducesRisk: true,
      estimatedCreditSavings: Math.max(1, Math.min(credits, 6)),
      tradeoff: 'The edit loses some premium depth, but protects faces, captions, labels, and delivery confidence.',
      requiresNewApproval: true,
    },
  ]
}

function createValidationItem(params: {
  input: PlannerInput
  depthItem: DepthAwareOverlayPlanItem
  foregroundMaskingPlan?: ForegroundMaskingPlan
  mapAnimationPlan?: MapAnimationPlan
  dataVizPlan?: DataVizPlan
  rendererCompositionPlan?: RendererCompositionPlan
  speakerVisualLayoutPlan?: SpeakerVisualLayoutPlan
}): DepthAwareLayoutValidationPlanItem {
  const { dataVizPlan, depthItem, foregroundMaskingPlan, input, mapAnimationPlan, rendererCompositionPlan, speakerVisualLayoutPlan } = params
  const maskingItem = maskingForDepthItem(depthItem, foregroundMaskingPlan)
  const layoutItem = layoutForDepthItem(depthItem, speakerVisualLayoutPlan)
  const contactObjects = depthItem.foregroundObjects.filter((object) => object.kind === 'contact_object')
  const preservedContacts = contactObjects.filter((object) => object.preserveInFrontOfOverlay)
  const needsContact = depthItem.depthCompositingMode === 'graphic_behind_subject_and_contact_objects' ||
    depthItem.maskStrategy === 'subject_plus_contact_object_mask'
  const complexity = inferDepthCompositionComplexity({
    contactObjectCount: contactObjects.length,
    depthCompositingMode: depthItem.depthCompositingMode,
    editLevel: input.editLevel,
    foregroundObjectCount: depthItem.foregroundObjects.length,
    maskRisk: depthItem.maskRisk,
    maskStrategy: depthItem.maskStrategy,
    trackingRequirement: depthItem.trackingRequirement,
  })
  const profile = getDepthCompositionCreditProfile(complexity)
  const fallbackRequired = profile.requiredFallback || riskRequiresFallback.has(depthItem.maskRisk) || depthItem.maskStrategy !== 'none'
  const hasFallback = Boolean(depthItem.fallbackLayoutMode || maskingItem?.fallbackLayoutMode || maskingItem?.fallbackIfMaskFails)
  const textForReadability = [
    depthItem.overlayLayerDescription,
    depthItem.reason,
    ...depthItem.promptImplications,
    ...depthItem.remotionLayerNotes,
    ...depthItem.qaChecks,
  ].join(' ').toLowerCase()
  const mapDepthItems = mapAnimationPlan?.items.filter((item) =>
    item.depthAwareOverlayItemId === depthItem.id ||
    item.layout.foregroundMaskAware ||
    Boolean(item.layout.depthCompositingMode),
  ) ?? []
  const dataVizItems = dataVizPlan?.items.filter((item) =>
    item.visualAssetPlanItemId === depthItem.assetPlanItemId ||
    item.assetPlanItemId === depthItem.assetPlanItemId ||
    item.speakerVisualLayoutItemId === depthItem.speakerVisualLayoutItemId,
  ) ?? []

  const checks: DepthLayoutValidationCheck[] = [
    check({
      id: `${depthItem.id}-tier`,
      category: 'tier_compatibility',
      label: 'Tier compatibility',
      passed: profile.tierFit[input.editLevel] && depthItem.tierAllowed[input.editLevel],
      failStatus: input.editLevel === 'basic' ? 'blocking' : 'failed',
      severity: input.editLevel === 'basic' || complexity === 'premium' ? 'blocking' : 'high',
      message: `${input.editLevel} tier fit for ${profile.label}.`,
      recommendation: input.editLevel === 'basic' ? 'Use a lower panel, side-by-side, or full visual takeover instead of complex masks.' : 'Keep fallback and QA before approval.',
      relatedSegmentId: depthItem.segmentId,
      relatedAssetPlanItemId: depthItem.assetPlanItemId,
      relatedDepthAwareOverlayItemId: depthItem.id,
    }),
    check({
      id: `${depthItem.id}-mask-risk`,
      category: 'mask_risk',
      label: 'Mask risk',
      passed: depthItem.maskRisk === 'low' || depthItem.maskRisk === 'medium',
      failStatus: hasFallback ? 'warning' : 'failed',
      severity: depthItem.maskRisk === 'premium' ? 'blocking' : depthItem.maskRisk === 'high' ? 'high' : 'medium',
      message: `Mask risk is ${label(depthItem.maskRisk)} for ${label(depthItem.maskStrategy)}.`,
      recommendation: 'Use fallback and future worker QA for medium/high/premium risk.',
      relatedDepthAwareOverlayItemId: depthItem.id,
      relatedMaskingPlanItemId: maskingItem?.id,
    }),
    check({
      id: `${depthItem.id}-fallback`,
      category: 'fallback_layout',
      label: 'Fallback layout',
      passed: !fallbackRequired || hasFallback,
      failStatus: depthItem.maskRisk === 'high' || depthItem.maskRisk === 'premium' || input.editLevel === 'basic' ? 'blocking' : 'failed',
      severity: fallbackRequired ? 'blocking' : 'medium',
      message: 'Medium/high/premium depth or mask work must have a fallback layout.',
      recommendation: 'Use side-by-side, lower panel, picture-in-picture, or full visual takeover as fallback.',
      relatedDepthAwareOverlayItemId: depthItem.id,
      relatedMaskingPlanItemId: maskingItem?.id,
    }),
    check({
      id: `${depthItem.id}-contact-object`,
      category: 'contact_object_preservation',
      label: 'Contact object preservation',
      passed: !needsContact || (contactObjects.length > 0 && preservedContacts.length === contactObjects.length && Boolean(maskingItem?.fallbackIfMaskFails)),
      failStatus: needsContact ? 'blocking' : 'warning',
      severity: needsContact ? 'blocking' : 'medium',
      message: needsContact ? 'Subject plus contact-object depth requires a preserved contact object and fallback-if-mask-fails note.' : 'No contact-object preservation required.',
      recommendation: 'Define the contact object, preserve it in front of the overlay, and keep fallback notes.',
      relatedDepthAwareOverlayItemId: depthItem.id,
      relatedMaskingPlanItemId: maskingItem?.id,
    }),
    check({
      id: `${depthItem.id}-foreground-group`,
      category: 'foreground_group',
      label: 'Foreground depth group',
      passed: !needsContact || depthItem.foregroundDepthGroups.some((group) => group.contactObjectIds.length > 0 && group.preserveGroupInFront),
      failStatus: needsContact ? 'failed' : 'warning',
      severity: needsContact ? 'high' : 'medium',
      message: 'Contact-object plans should group subject plus contact object as foreground.',
      recommendation: 'Add a foreground depth group containing the subject and contact object.',
      relatedDepthAwareOverlayItemId: depthItem.id,
    }),
    check({
      id: `${depthItem.id}-caption-safety`,
      category: 'caption_safety',
      label: 'Captions above all',
      passed: /caption.*above|above.*caption|top layer|top-layer/i.test(depthItem.captionLayerRule),
      failStatus: 'blocking',
      severity: 'blocking',
      message: 'Captions must remain above masks, graphics, and foreground layers.',
      recommendation: 'Add explicit caption-above-all layer rule before approval.',
      relatedDepthAwareOverlayItemId: depthItem.id,
    }),
    check({
      id: `${depthItem.id}-graphic-readability`,
      category: 'graphic_readability',
      label: 'Graphic readability',
      passed: /readable|label|safe zone|avoid|foreground|caption/i.test(textForReadability),
      failStatus: 'warning',
      severity: 'high',
      message: 'Graphic/card text should avoid foreground subjects and contact objects.',
      recommendation: 'Move labels away from foreground zones or switch to a lower-cost layout.',
      relatedDepthAwareOverlayItemId: depthItem.id,
    }),
    check({
      id: `${depthItem.id}-map-readability`,
      category: 'map_readability',
      label: 'Map labels and pins',
      passed: mapDepthItems.length === 0 || mapDepthItems.every((item) => item.layout.labelAvoidZones.length > 0 || item.layout.notes.some((note) => /label|readable|pin|safe/i.test(note))),
      failStatus: 'warning',
      severity: mapDepthItems.length ? 'high' : 'low',
      message: 'Depth-aware map labels, pins, and routes must remain readable around the foreground group.',
      recommendation: 'Reduce label density or move map graphics to side-by-side/lower panel if labels collide.',
      relatedDepthAwareOverlayItemId: depthItem.id,
    }),
    check({
      id: `${depthItem.id}-dataviz-readability`,
      category: 'dataviz_readability',
      label: 'Chart and diagram readability',
      passed: dataVizItems.length === 0 || dataVizItems.every((item) => !item.layout.compactMode || (item.layout.maxLabelCount ?? 0) <= 6),
      failStatus: 'warning',
      severity: dataVizItems.length ? 'high' : 'low',
      message: 'Charts and diagrams should not put dense labels under foreground masks.',
      recommendation: 'Use fewer labels or switch to a dedicated panel.',
      relatedDepthAwareOverlayItemId: depthItem.id,
    }),
    check({
      id: `${depthItem.id}-layer-order`,
      category: 'layer_order',
      label: 'Layer order',
      passed: Boolean(rendererCompositionPlan?.layers.length) && (rendererCompositionPlan?.rendererNotes.some((note) => /caption|foreground mask|depth-aware|top/i.test(note)) ?? false),
      failStatus: 'warning',
      severity: 'high',
      message: 'Expected order is base video, visual overlay, foreground mask, then captions/top UI.',
      recommendation: 'Keep renderer notes explicit about foreground masks and caption z-order.',
      relatedDepthAwareOverlayItemId: depthItem.id,
    }),
    check({
      id: `${depthItem.id}-worker-requirement`,
      category: 'worker_requirement',
      label: 'Future worker requirement',
      passed: [...depthItem.workerNotes, ...(maskingItem?.workerNotes ?? [])].some((note) => /future|mock|no real|worker/i.test(note)),
      failStatus: 'failed',
      severity: 'high',
      message: 'Masking/tracking must remain a future approved worker task.',
      recommendation: 'Add mock-only worker notes and approved-snapshot execution notes.',
      relatedDepthAwareOverlayItemId: depthItem.id,
      relatedMaskingPlanItemId: maskingItem?.id,
    }),
    check({
      id: `${depthItem.id}-credit-complexity`,
      category: 'credit_complexity',
      label: 'Credit complexity',
      passed: profile.creditImpact !== 'none' || complexity === 'none',
      failStatus: 'warning',
      severity: 'medium',
      message: `${profile.label} has ${profile.creditImpact} credit impact.`,
      recommendation: 'Show lower-cost alternatives when impact is high or premium.',
      relatedDepthAwareOverlayItemId: depthItem.id,
    }),
    check({
      id: `${depthItem.id}-model-policy`,
      category: 'model_policy',
      label: 'No Veo for depth composition',
      passed: !JSON.stringify(depthItem).toLowerCase().includes('veo'),
      failStatus: 'blocking',
      severity: 'blocking',
      message: 'Depth-aware composition does not enable Veo or AI-video fallback.',
      recommendation: 'Remove model fallback language from depth/mask planning.',
      relatedDepthAwareOverlayItemId: depthItem.id,
    }),
    check({
      id: `${depthItem.id}-approval-policy`,
      category: 'approval_policy',
      label: 'Approval before execution',
      passed: true,
      severity: 'blocking',
      message: 'Future workers must wait for approved plan and credit estimate.',
      relatedDepthAwareOverlayItemId: depthItem.id,
    }),
  ]
  const status = aggregateStatus(checks)
  const fallbackRecommendations = fallbackFor(depthItem, depthItem.fallbackLayoutMode ?? maskingItem?.fallbackLayoutMode ?? layoutItem?.fallbackLayoutMode, profile.estimatedPlanningCredits)

  return {
    id: `depth-validation-${depthItem.id}`,
    segmentId: depthItem.segmentId,
    assetPlanItemId: depthItem.assetPlanItemId,
    depthAwareOverlayItemId: depthItem.id,
    maskingPlanItemId: maskingItem?.id,
    layoutMode: layoutItem?.layoutMode,
    depthCompositingMode: depthItem.depthCompositingMode,
    maskStrategy: depthItem.maskStrategy,
    maskRisk: depthItem.maskRisk,
    trackingRequirement: depthItem.trackingRequirement,
    complexity,
    creditProfileId: profile.id,
    status,
    checks,
    fallbackRecommendations,
    creditImpact: profile.creditImpact,
    estimatedPlanningCredits: input.editLevel === 'basic' && !profile.tierFit.basic ? 0 : profile.estimatedPlanningCredits,
    userFacingSummary: `${profile.label}: ${label(depthItem.depthCompositingMode)} with ${label(depthItem.maskStrategy)}. ${hasFallback ? 'Fallback is planned.' : 'Fallback needs review.'}`,
    developerNotes: [
      'Validation is deterministic and checks structured plans only.',
      'No real masks, pixels, OpenCV, tracking, collision detection, or Remotion rendering are executed.',
      needsContact ? 'Contact-object preservation is required for this item.' : 'Contact-object preservation is not required for this item.',
    ],
  }
}

function createGlobalChecks(params: ValidationParams, active: boolean): DepthLayoutValidationCheck[] {
  const { depthAwareOverlayPlan, foregroundMaskingPlan, input, rendererCompositionPlan } = params
  const limitationsText = [
    ...(foregroundMaskingPlan?.limitations ?? []),
    ...(depthAwareOverlayPlan?.notes ?? []),
    ...(depthAwareOverlayPlan?.globalRules ?? []),
  ].join(' ').toLowerCase()

  return [
    check({
      id: 'depth-validation-active-when-requested',
      category: 'approval_policy',
      label: 'Validation present when depth is requested',
      passed: active || !depthLanguageRequested(input),
      failStatus: 'warning',
      severity: 'high',
      message: 'Depth/foreground/contact-object user requests should produce a validation plan.',
      recommendation: 'Create validation before approval whenever depth language appears.',
    }),
    check({
      id: 'depth-validation-mock-only',
      category: 'worker_requirement',
      label: 'No real mask execution',
      passed: /no real|mock|no segmentation|no masks|pixels/.test(limitationsText) || !active,
      failStatus: 'blocking',
      severity: 'blocking',
      message: 'Validation must state that no real pixels or masks are checked.',
      recommendation: 'Add mock-only limitations and future-worker notes.',
    }),
    check({
      id: 'depth-validation-caption-top-layer',
      category: 'caption_safety',
      label: 'Captions remain top layer',
      passed: !active || Boolean(rendererCompositionPlan?.rendererNotes.some((note) => /caption.*above|above.*caption|top/i.test(note)) || depthAwareOverlayPlan?.globalRules.some((rule) => /caption.*above|above.*caption|top/i.test(rule))),
      failStatus: 'failed',
      severity: 'blocking',
      message: 'Captions must stay above foreground masks and graphics.',
      recommendation: 'Add renderer/depth notes with caption top-layer rule.',
    }),
    check({
      id: 'depth-validation-no-veo',
      category: 'model_policy',
      label: 'Depth does not enable Veo',
      passed: !JSON.stringify({
        depthAwareOverlayPlan,
        foregroundMaskingPlan,
      }).toLowerCase().includes('veo'),
      failStatus: 'blocking',
      severity: 'blocking',
      message: 'Depth-aware layout validation must not introduce Veo.',
      recommendation: 'Keep depth composition as Remotion/future mask-worker planning only.',
    }),
    check({
      id: 'depth-validation-approval-gate',
      category: 'approval_policy',
      label: 'Approval gate preserved',
      passed: true,
      severity: 'blocking',
      message: 'No depth worker, tool, or render execution starts before approval.',
    }),
  ]
}

export function createDepthAwareLayoutValidationPlan(params: ValidationParams): DepthAwareLayoutValidationPlan {
  const { depthAwareOverlayPlan, foregroundMaskingPlan, input } = params
  const active = Boolean(
    depthAwareOverlayPlan?.active ||
      foregroundMaskingPlan?.active ||
      params.mapAnimationPlan?.items.some((item) => item.layout.foregroundMaskAware || item.layout.depthCompositingMode) ||
      params.browserCapturePlan?.active ||
      depthLanguageRequested(input),
  )

  const items = (depthAwareOverlayPlan?.items ?? []).map((depthItem) => createValidationItem({
    ...params,
    depthItem,
  }))
  const globalChecks = createGlobalChecks(params, active)
  const fallbackRecommendations = items.flatMap((item) => item.fallbackRecommendations)
  const highestCreditItem = [...items].sort((left, right) => right.estimatedPlanningCredits - left.estimatedPlanningCredits)[0]
  const lowerCostAlternatives = createDepthLowerCostAlternatives({
    complexity: highestCreditItem?.complexity ?? 'none',
    currentLayoutMode: highestCreditItem?.layoutMode,
    estimatedPlanningCredits: highestCreditItem?.estimatedPlanningCredits,
    hasAnimatedOverlay: Boolean(params.mapAnimationPlan?.active || params.dataVizPlan?.active),
    hasContactObject: items.some((item) => item.checks.some((checkItem) => checkItem.category === 'contact_object_preservation' && checkItem.status === 'passed')),
    hasTracking: items.some((item) => item.trackingRequirement !== undefined && item.trackingRequirement !== 'none' && item.trackingRequirement !== 'static_mask'),
    readabilityRisk: items.some((item) => item.checks.some((checkItem) =>
      (checkItem.category === 'graphic_readability' || checkItem.category === 'map_readability' || checkItem.category === 'dataviz_readability') &&
      checkItem.status !== 'passed',
    )),
    targetTier: input.editLevel,
  })
  const allChecks = [...globalChecks, ...items.flatMap((item) => item.checks)]
  const overallStatus = active ? aggregateStatus(allChecks) : 'passed'
  const creditProfilesUsed = Array.from(new Set(items.map((item) => item.creditProfileId)))
  const totalEstimatedDepthPlanningCredits = items.reduce((sum, item) => sum + item.estimatedPlanningCredits, 0)

  return {
    id: `depth-layout-validation-${input.editingCategory}-${input.editLevel}`,
    active,
    summary: active
      ? `Depth layout validation checked ${items.length} item${items.length === 1 ? '' : 's'} for risk, fallback, readability, tier fit, and credit impact.`
      : 'Depth layout validation inactive; no depth-aware overlay or foreground mask plan is needed.',
    overallStatus,
    items,
    creditProfilesUsed,
    totalEstimatedDepthPlanningCredits,
    fallbackRecommendations,
    globalChecks,
    lowerCostAlternatives,
    qaChecks: [
      'Fallback layout exists for medium/high/premium depth risk.',
      'Captions remain above all masks, graphics, and foreground groups.',
      'Contact-object preservation is validated when requested.',
      'Graphics, maps, charts, and browser visuals remain readable.',
      'Depth-aware composition does not enable Veo.',
      'No real mask processing runs in this frontend demo.',
    ],
    limitations: [
      'Mock validation only; no real masks or pixels checked.',
      'Future OpenCV/segmentation/tracking workers are required for real foreground masking.',
      'Validation checks structured plans, not rendered output.',
      'No FFmpeg, Sharp, Remotion rendering, provider API, or collision detection is executed.',
    ],
    notes: [
      input.editLevel === 'basic'
        ? 'Basic should use safer layout choices for complex depth requests.'
        : `${input.editLevel} can plan depth effects only with fallback and approval.`,
      'Credit impact is planning-only and does not deduct real credits.',
    ],
  }
}
