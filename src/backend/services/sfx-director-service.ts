import type {
  CreateSFXDirectorPlanRequest,
  CreateSFXDirectorPlanResponse,
  AnalyzeSFXOpportunitiesRequest,
  AnalyzeSFXOpportunitiesResponse,
  SFXPlanningContext,
  SFXPlanningOpportunity,
  SFXSkippedMoment,
} from '../contracts/sfx-director-contracts'
import type {
  SFXDecisionState,
  SFXEventPlanRecord,
  SFXProviderRouteRecord,
  SFXTargetLayer,
} from '../../types'
import type { SfxUseCase } from '../../types/audio-music'
import type { CreditImpact } from '../../types/shared'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId } from '../mock/mock-database'
import { ok, type ServiceResult, unwrapServiceResult } from '../service-result'
import {
  createAmbientBridgeSFXEventPlan,
  createChapterCardSFXEventPlan,
  createCTASFXEventPlan,
  createGraphicDesignSFXEventPlan,
  createMontageHitSFXEventPlan,
  createNoSFXEventPlan,
  createRealMotionSFXEventPlan,
  createSFXEventPlan,
  createStrokeMotionSFXEventPlan,
  createTitleCardSFXEventPlan,
  createTransitionSFXEventPlan,
} from './sfx-event-planning-service'
import { chooseSFXProviderRoute } from './sfx-provider-routing-service'
import {
  createSFXAvoidRules,
  createSFXMustFollowRules,
  decideSFXState,
} from './sfx-decision-policy-service'
import { classifySFXTargetLayer } from './sfx-target-layer-service'
import { recommendSFXSourceFootagePolicy } from './sfx-source-footage-policy-service'
import {
  recommendAnchorTime,
  recommendSFXAnchorType,
  recommendSFXTimingPriority,
} from './sfx-timing-anchor-policy-service'
import {
  recommendSFXMixPriority,
  recommendSFXVolumeProfile,
} from './sfx-volume-policy-service'

interface MomentDraft {
  label: string
  targetLayer?: SFXTargetLayer
  useCase?: SfxUseCase
  reason: string
  sceneContext: string
  videoTone?: string
  anchorTimeSeconds?: number
  decisionState?: SFXDecisionState
  editPlanSegmentId?: string
  transitionPlanId?: string
  signatureRouteId?: string
  strokeMotionBeatId?: string
  musicCueId?: string
}

function contextText(context: SFXPlanningContext): string {
  return [
    context.userPrompt,
    context.videoType,
    context.workflowContext,
    context.transcriptSummary,
    context.audioEnvironmentSummary,
    context.musicPlanSummary,
    ...(context.sceneSummaries ?? []),
    ...(context.userSFXInstructions ?? []),
    ...(context.avoidSFXInstructions ?? []),
  ].join(' ').toLowerCase()
}

function sfxUseCaseForLayer(targetLayer: SFXTargetLayer): SfxUseCase {
  if (targetLayer === 'transition') return 'transition_soft_whoosh'
  if (targetLayer === 'stroke_motion') return 'stroke_line_trace'
  if (targetLayer === 'graphic_design') return 'graphic_card_reveal'
  if (targetLayer === 'real_motion') return 'real_motion_object_settle'
  if (targetLayer === 'title_card') return 'light_hit'
  if (targetLayer === 'chapter_card') return 'chapter_title'
  if (targetLayer === 'cta_reveal') return 'cta_success_chime'
  if (targetLayer === 'montage_hit') return 'montage_beat_accent'
  if (targetLayer === 'ambient_bridge') return 'ambient_soft_bridge'
  if (targetLayer === 'source_footage_repair') return 'source_footage_repair'
  return 'none'
}

function creditImpactForDecision(decisionState: SFXDecisionState, targetLayer: SFXTargetLayer): CreditImpact {
  if (decisionState === 'avoid' || decisionState === 'not_needed') return 'none'
  if (targetLayer === 'real_motion' || targetLayer === 'stroke_motion') return 'medium'
  if (decisionState === 'needs_user_confirmation') return 'medium'
  return 'low'
}

function createOpportunity(context: SFXPlanningContext, draft: MomentDraft): SFXPlanningOpportunity {
  const targetLayer = draft.targetLayer ?? classifySFXTargetLayer({
    text: draft.label,
    sceneContext: draft.sceneContext,
    videoType: context.videoType,
  })
  const sourceFootagePolicy = recommendSFXSourceFootagePolicy({
    targetLayer,
    userPrompt: context.userPrompt,
    userSFXInstructions: context.userSFXInstructions,
    avoidSFXInstructions: context.avoidSFXInstructions,
    audioEnvironmentSummary: context.audioEnvironmentSummary,
    transcriptSummary: context.transcriptSummary,
    sceneContext: draft.sceneContext,
    realMotionSupport: targetLayer === 'real_motion',
  })
  const policyInput = {
    targetLayer,
    sourceFootagePolicy,
    editComplexity: context.editComplexity,
    userPrompt: context.userPrompt,
    userSFXInstructions: context.userSFXInstructions,
    avoidSFXInstructions: context.avoidSFXInstructions,
    transcriptSummary: context.transcriptSummary,
    sceneContext: draft.sceneContext,
    videoTone: draft.videoTone ?? context.videoType ?? 'professional',
    speechPresent: context.speechPresent,
    musicPresent: context.musicPresent,
    ambienceImportant: context.ambienceImportant,
  }
  const decisionState = draft.decisionState ?? decideSFXState(policyInput)
  const timingInput = {
    targetLayer,
    label: draft.label,
    sceneContext: draft.sceneContext,
    anchorTimeSeconds: draft.anchorTimeSeconds,
    speechPresent: context.speechPresent,
    musicPresent: context.musicPresent,
  }
  const volumeInput = {
    targetLayer,
    videoType: context.videoType,
    videoTone: draft.videoTone,
    editComplexity: context.editComplexity,
    speechPresent: context.speechPresent,
    musicPresent: context.musicPresent,
    ambienceImportant: context.ambienceImportant,
  }

  return {
    id: createMockId('sfx-opportunity'),
    label: draft.label,
    targetLayer,
    useCase: draft.useCase ?? sfxUseCaseForLayer(targetLayer),
    decisionState,
    sourceFootagePolicy,
    reason: draft.reason,
    sceneContext: draft.sceneContext,
    videoTone: draft.videoTone ?? context.videoType ?? 'professional',
    anchorType: recommendSFXAnchorType(timingInput),
    anchorTimeSeconds: recommendAnchorTime(timingInput),
    timingPriority: recommendSFXTimingPriority(timingInput),
    volumeProfile: recommendSFXVolumeProfile(volumeInput),
    mixPriority: recommendSFXMixPriority(volumeInput),
    creditImpact: creditImpactForDecision(decisionState, targetLayer),
    requiresApproval: decisionState !== 'avoid' && decisionState !== 'not_needed',
    editPlanSegmentId: draft.editPlanSegmentId,
    transitionPlanId: draft.transitionPlanId,
    signatureRouteId: draft.signatureRouteId,
    strokeMotionBeatId: draft.strokeMotionBeatId,
    musicCueId: draft.musicCueId,
    warnings: [
      ...createSFXAvoidRules(policyInput),
      ...createSFXMustFollowRules(policyInput),
    ],
  }
}

function createSkippedMoment(opportunity: SFXPlanningOpportunity): SFXSkippedMoment {
  return {
    id: createMockId('sfx-skipped-moment'),
    label: opportunity.label,
    reason: opportunity.reason,
    targetLayer: opportunity.targetLayer,
    decisionState: opportunity.decisionState === 'avoid' ? 'avoid' : 'not_needed',
  }
}

function baseDraftsForContext(context: SFXPlanningContext): MomentDraft[] {
  const text = contextText(context)
  const drafts: MomentDraft[] = []

  context.transitionPlans?.forEach((transition, index) => {
    drafts.push({
      label: `Transition SFX ${index + 1}`,
      targetLayer: 'transition',
      reason: transition.soundEffectNeeded
        ? 'Transition plan explicitly says a sound effect may help bridge the visual movement.'
        : 'Transition is reviewed for subtle audio support; no random transition SFX is assumed.',
      sceneContext: transition.reason,
      anchorTimeSeconds: transition.durationSeconds ?? index * 4,
      decisionState: transition.soundEffectNeeded ? 'optional' : undefined,
      transitionPlanId: transition.id,
    })
  })

  context.signatureRoutes?.forEach((route) => {
    const targetLayer = classifySFXTargetLayer({ signatureRoute: route })
    if (targetLayer === 'none') return

    drafts.push({
      label: `${route.signatureSystem.replaceAll('_', ' ')} SFX support`,
      targetLayer,
      reason: `Signature route may need subtle SFX support: ${route.reason}`,
      sceneContext: route.reason,
      anchorTimeSeconds: route.timing.startSeconds,
      signatureRouteId: route.id,
    })
  })

  context.strokeMotionBeats?.forEach((beat, index) => {
    drafts.push({
      label: `Stroke Motion beat ${index + 1} sound`,
      targetLayer: 'stroke_motion',
      reason: 'Stroke Motion draw or completion can benefit from a quiet synchronized sound.',
      sceneContext: beat.meaning ?? 'Stroke Motion beat',
      anchorTimeSeconds: index * 2,
      strokeMotionBeatId: beat.id,
    })
  })

  if (/lake como|luxury|vacation|travel|lifestyle/.test(text)) {
    drafts.push(
      {
        label: 'Coming-up teaser title hit',
        targetLayer: 'title_card',
        reason: 'A soft title hit can polish the teaser without becoming a loud social effect.',
        sceneContext: 'Luxury lifestyle opening title or teaser.',
        videoTone: 'premium travel',
        anchorTimeSeconds: 0.6,
      },
      {
        label: 'Soft transition whoosh',
        targetLayer: 'transition',
        reason: 'A subtle whoosh can bridge premium travel movement when there is no important speech.',
        sceneContext: 'Lake or city movement transition.',
        videoTone: 'premium travel',
        anchorTimeSeconds: 4.2,
      },
      {
        label: 'Chapter card soft hit',
        targetLayer: 'chapter_card',
        reason: 'A small chapter hit helps separate sections in a polished lifestyle edit.',
        sceneContext: 'Chapter card reveal between destination sections.',
        videoTone: 'premium travel',
        anchorTimeSeconds: 9.5,
      },
      {
        label: 'Boat or movement montage accent',
        targetLayer: 'montage_hit',
        reason: 'A montage beat accent can support selected movement cuts without adding fake water everywhere.',
        sceneContext: 'Boat or travel movement montage.',
        videoTone: 'premium travel',
        anchorTimeSeconds: 14.2,
      },
      {
        label: 'Food/social ambience bridge',
        targetLayer: 'ambient_bridge',
        reason: 'A soft ambience bridge can smooth a lifestyle scene change while preserving natural ambience.',
        sceneContext: 'Restaurant or social scene transition.',
        videoTone: 'warm social',
        anchorTimeSeconds: 20,
      },
      {
        label: 'Outro resolve hit',
        targetLayer: 'cta_reveal',
        reason: 'A clean resolve hit can softly close the edit if it does not cover dialogue.',
        sceneContext: 'Outro or final CTA reveal.',
        videoTone: 'premium travel',
        anchorTimeSeconds: 28,
      },
    )
  }

  if (/faith|bible|serious teaching|talking head|simple clean/.test(text)) {
    drafts.push({
      label: 'No SFX for voice-first teaching',
      targetLayer: 'none',
      useCase: 'none',
      decisionState: 'avoid',
      reason: 'Serious or voice-first content should not receive distracting decorative SFX.',
      sceneContext: context.transcriptSummary ?? 'Voice-first teaching or simple talking-head segment.',
      videoTone: 'faith or serious teaching',
    })
  }

  if (/fitness|high-energy|workout/.test(text)) {
    drafts.push({
      label: 'Fitness montage beat accent',
      targetLayer: 'montage_hit',
      reason: 'High-energy social movement can support a beat-aligned accent when speech is not covered.',
      sceneContext: 'Fitness movement montage.',
      videoTone: 'energetic social',
      anchorTimeSeconds: 8,
    })
  }

  if (/product|saas|demo|visualexplain|graphic|diagram|card/.test(text)) {
    drafts.push({
      label: 'Graphic Design reveal tick',
      targetLayer: 'graphic_design',
      reason: 'A subtle reveal tick can support an explanatory card or UI label.',
      sceneContext: 'Product or VisualExplain card reveal.',
      videoTone: 'business polished',
      anchorTimeSeconds: 6,
    })
  }

  if (/real motion|object demo|object settle|object movement/.test(text)) {
    drafts.push({
      label: 'Real Motion object settle',
      targetLayer: 'real_motion',
      reason: 'A room-matched object settle sound may make the Real Motion layer feel grounded.',
      sceneContext: 'Real Motion object entry or settle moment.',
      videoTone: 'realistic polished',
      anchorTimeSeconds: 7.2,
    })
  }

  if (/cta|call to action|book now|subscribe/.test(text)) {
    drafts.push({
      label: 'CTA reveal chime',
      targetLayer: 'cta_reveal',
      reason: 'A soft CTA chime can polish the final reveal if it stays below voice and music.',
      sceneContext: 'Call-to-action reveal.',
      videoTone: 'clean resolve',
      anchorTimeSeconds: 24,
    })
  }

  if (/silent b-?roll|missing audio|repair ambience|ambience repair/.test(text)) {
    drafts.push({
      label: 'Silent B-roll ambience repair',
      targetLayer: 'source_footage_repair',
      reason: 'Source-footage-style ambience is only considered because the source audio is missing or needs repair.',
      sceneContext: 'Silent B-roll or missing ambience repair.',
      videoTone: 'natural repair',
      anchorTimeSeconds: 2,
      decisionState: 'needs_user_confirmation',
    })
  }

  if (drafts.length === 0) {
    drafts.push({
      label: 'No SFX needed for clean edit',
      targetLayer: 'none',
      useCase: 'none',
      decisionState: 'not_needed',
      reason: 'No edit-layer cue clearly benefits from SFX; voice, music, or ambience can carry the moment.',
      sceneContext: context.transcriptSummary ?? 'General clean edit context.',
      videoTone: 'clean professional',
    })
  }

  return drafts
}

function eventCreatorForLayer(targetLayer: SFXTargetLayer) {
  if (targetLayer === 'transition') return createTransitionSFXEventPlan
  if (targetLayer === 'stroke_motion') return createStrokeMotionSFXEventPlan
  if (targetLayer === 'graphic_design') return createGraphicDesignSFXEventPlan
  if (targetLayer === 'real_motion') return createRealMotionSFXEventPlan
  if (targetLayer === 'title_card') return createTitleCardSFXEventPlan
  if (targetLayer === 'chapter_card') return createChapterCardSFXEventPlan
  if (targetLayer === 'cta_reveal') return createCTASFXEventPlan
  if (targetLayer === 'montage_hit') return createMontageHitSFXEventPlan
  if (targetLayer === 'ambient_bridge') return createAmbientBridgeSFXEventPlan
  if (targetLayer === 'none') return createNoSFXEventPlan
  return createSFXEventPlan
}

export function analyzeSFXOpportunities(
  request: AnalyzeSFXOpportunitiesRequest,
): ServiceResult<AnalyzeSFXOpportunitiesResponse> {
  const opportunities = baseDraftsForContext(request).map((draft) => createOpportunity(request, draft))
  const plannedSFXOpportunities = opportunities.filter((item) =>
    item.decisionState !== 'avoid' && item.decisionState !== 'not_needed'
  )
  const avoidSFXOpportunities = opportunities.filter((item) => item.decisionState === 'avoid')
  const skippedMoments = opportunities
    .filter((item) => item.decisionState === 'avoid' || item.decisionState === 'not_needed')
    .map(createSkippedMoment)

  return ok({
    plannedSFXOpportunities,
    avoidSFXOpportunities,
    skippedMoments,
    nextStep: 'create_sfx_prompt_plans',
    warnings: [
      'Mock SFX planning only; no provider prompts, generation, rendering, uploads, or Supabase calls were made.',
      'SFX remains edit-layer-first and source-action SFX is avoided by default.',
    ],
  })
}

export function createSFXDirectorPlan(
  db: MockDatabase,
  request: CreateSFXDirectorPlanRequest,
): ServiceResult<CreateSFXDirectorPlanResponse> {
  const analysis = unwrapServiceResult(analyzeSFXOpportunities(request))
  const recordOpportunities = [
    ...analysis.plannedSFXOpportunities,
    ...analysis.avoidSFXOpportunities,
  ]
  const sfxEventPlans: SFXEventPlanRecord[] = []
  const providerRoutes: SFXProviderRouteRecord[] = []

  recordOpportunities.forEach((opportunity) => {
    const createEvent = eventCreatorForLayer(opportunity.targetLayer)
    const eventPlan = unwrapServiceResult(createEvent(db, opportunity, request))
    const route = unwrapServiceResult(chooseSFXProviderRoute(db, eventPlan, {
      editComplexity: request.editComplexity,
      userPrompt: request.userPrompt,
      videoType: request.videoType,
      speechPresent: request.speechPresent,
    }))

    sfxEventPlans.push(eventPlan)
    providerRoutes.push(route)
  })

  return ok({
    sfxEventPlans,
    providerRoutes,
    skippedMoments: analysis.skippedMoments,
    avoidedMoments: analysis.avoidSFXOpportunities,
    nextStep: 'create_sfx_prompt_plans',
    warnings: analysis.warnings,
  })
}

export function createSFXUserVisibleSummary(result: CreateSFXDirectorPlanResponse): string {
  const planned = result.sfxEventPlans.filter((item) =>
    item.decisionState !== 'avoid' && item.decisionState !== 'not_needed'
  )
  const avoidedCount = result.avoidedMoments.length + result.skippedMoments.filter((item) => item.decisionState === 'avoid').length

  if (planned.length === 0) {
    return 'No SFX is recommended for this mock plan. Voice clarity, ambience, and music carry the edit.'
  }

  return `${planned.length} SFX moment${planned.length === 1 ? '' : 's'} planned, ${avoidedCount} avoided. SFX stays edit-layer-first, subtle, and approval-gated.`
}

export function createSFXPlanningSummary(result: CreateSFXDirectorPlanResponse): string[] {
  return [
    createSFXUserVisibleSummary(result),
    `Provider routes: ${result.providerRoutes.map((route) => route.recommendedProvider).join(', ') || 'none'}.`,
    `Next step: ${result.nextStep}.`,
    'No real SFX generation or provider call is included in RP-SFX-04.',
  ]
}
