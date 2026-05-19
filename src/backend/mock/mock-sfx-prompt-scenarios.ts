import type {
  SFXEventPlanRecord,
  SFXPromptStyle,
  SFXProvider,
  SFXProviderRouteRecord,
  SFXVolumeProfile,
} from '../../types'
import type { SfxUseCase } from '../../types/audio-music'

const createdAt = '2026-05-19T12:00:00.000Z'
const projectId = 'mock-sfx-prompt-project'
const editPlanId = 'mock-sfx-prompt-edit-plan'

export interface MockSFXPromptScenario {
  id: string
  label: string
  eventPlan: SFXEventPlanRecord
  providerRoute: SFXProviderRouteRecord
  expectedProvider: SFXProvider
  expectedPromptStyle: SFXPromptStyle
  expectedPrompt: string
  expectedNegativePrompt: string
  expectedDurationToGenerate: number
  expectedWarnings: string[]
}

function eventPlan(input: {
  id: string
  targetLayer: SFXEventPlanRecord['targetLayer']
  useCase: SfxUseCase
  decisionState?: SFXEventPlanRecord['decisionState']
  volumeProfile?: SFXVolumeProfile
  sceneContext: string
  videoTone: string
}): SFXEventPlanRecord {
  return {
    id: `sfx_event_${input.id}`,
    projectId,
    editPlanId,
    targetLayer: input.targetLayer,
    useCase: input.useCase,
    decisionState: input.decisionState ?? 'needed',
    sourceFootagePolicy: 'edit_layer_only_default',
    reason: `Mock prompt scenario for ${input.targetLayer}.`,
    sceneContext: input.sceneContext,
    videoTone: input.videoTone,
    editLevel: 'signature',
    signatureSystem: input.targetLayer === 'stroke_motion'
      ? 'stroke_motion'
      : input.targetLayer === 'graphic_design'
        ? 'graphic_design'
        : input.targetLayer === 'real_motion'
          ? 'real_motion'
          : 'sound_sync',
    anchorType: input.targetLayer === 'stroke_motion'
      ? 'stroke_motion_completion'
      : input.targetLayer === 'graphic_design'
        ? 'graphic_reveal'
        : input.targetLayer === 'real_motion'
          ? 'real_motion_object_settle'
          : input.targetLayer === 'cta_reveal'
            ? 'cta_reveal'
            : input.targetLayer === 'chapter_card'
              ? 'chapter_card_reveal'
              : input.targetLayer === 'ambient_bridge'
                ? 'manual'
                : 'cut',
    anchorTimeSeconds: 4,
    timingPriority: 'frame_accurate',
    volumeProfile: input.volumeProfile ?? 'premium_soft',
    mixPriority: 'voice_first',
    creditImpact: input.decisionState === 'avoid' || input.decisionState === 'not_needed' ? 'none' : 'medium',
    requiresApproval: input.decisionState !== 'avoid' && input.decisionState !== 'not_needed',
    userVisibleSummary: input.sceneContext,
    avoidRules: ['No random SFX.', 'Do not overpower dialogue.'],
    mustFollowRules: ['Use provider-specific prompt style.', 'No real provider call.'],
    status: 'planned',
    notes: ['Mock prompt scenario only.'],
    createdAt,
    updatedAt: createdAt,
    metadata: { mockOnly: true },
  }
}

function providerRoute(input: {
  id: string
  eventPlanId: string
  provider: SFXProvider
}): SFXProviderRouteRecord {
  return {
    id: `sfx_route_${input.id}`,
    projectId,
    editPlanId,
    sfxEventPlanId: input.eventPlanId,
    recommendedProvider: input.provider,
    providerRole: input.provider === 'mirelo_sfx_v1_5'
      ? 'production_final'
      : input.provider === 'mmaudio_v'
        ? 'cheap_draft_fallback'
        : input.provider === 'reeditpro_internal_library'
          ? 'internal_library_first_choice'
          : 'none',
    fallbackProvider: input.provider === 'mirelo_sfx_v1_5' ? 'mmaudio_v' : undefined,
    reason: 'Mock provider route for SFX prompt adapter testing.',
    useInternalLibraryFirst: input.provider !== 'no_sfx',
    useMMAudioForDraft: input.provider === 'mmaudio_v',
    useMireloForProduction: input.provider === 'mirelo_sfx_v1_5',
    noSfxAllowed: true,
    costSensitivity: 'balanced',
    qualityTarget: input.provider === 'mirelo_sfx_v1_5' ? 'production' : 'preview',
    approvalRequired: input.provider !== 'no_sfx',
    notes: ['No provider call is made.'],
    createdAt,
    updatedAt: createdAt,
    metadata: { mockOnly: true, noProviderCall: true },
  }
}

function promptScenario(input: Omit<MockSFXPromptScenario, 'eventPlan' | 'providerRoute'> & {
  targetLayer: SFXEventPlanRecord['targetLayer']
  useCase: SfxUseCase
  decisionState?: SFXEventPlanRecord['decisionState']
  volumeProfile?: SFXVolumeProfile
  sceneContext: string
  videoTone: string
}): MockSFXPromptScenario {
  const event = eventPlan(input)
  const route = providerRoute({
    id: input.id,
    eventPlanId: event.id,
    provider: input.expectedProvider,
  })

  return {
    ...input,
    eventPlan: event,
    providerRoute: route,
  }
}

export const mockSFXPromptScenarios: MockSFXPromptScenario[] = [
  promptScenario({
    id: 'mirelo-soft-premium-transition',
    label: 'Mirelo soft premium transition whoosh',
    targetLayer: 'transition',
    useCase: 'transition_soft_whoosh',
    sceneContext: 'Luxury travel scene cut.',
    videoTone: 'luxury travel',
    expectedProvider: 'mirelo_sfx_v1_5',
    expectedPromptStyle: 'structured_sentence',
    expectedPrompt: 'Soft premium transition whoosh',
    expectedNegativePrompt: 'no harsh riser',
    expectedDurationToGenerate: 2.5,
    expectedWarnings: [],
  }),
  promptScenario({
    id: 'mmaudio-soft-transition-draft',
    label: 'MMAudio soft transition whoosh draft',
    targetLayer: 'transition',
    useCase: 'transition_soft_whoosh',
    sceneContext: 'Draft timing for soft travel transition.',
    videoTone: 'lifestyle travel',
    expectedProvider: 'mmaudio_v',
    expectedPromptStyle: 'video_conditioned_short_prompt',
    expectedPrompt: 'soft transition whoosh',
    expectedNegativePrompt: 'no loud impact',
    expectedDurationToGenerate: 2.5,
    expectedWarnings: [],
  }),
  promptScenario({
    id: 'library-soft-whoosh-search',
    label: 'Internal library soft whoosh search',
    targetLayer: 'transition',
    useCase: 'transition_soft_whoosh',
    sceneContext: 'Search reusable soft premium whoosh.',
    videoTone: 'premium luxury airy subtle',
    expectedProvider: 'reeditpro_internal_library',
    expectedPromptStyle: 'library_search_tags',
    expectedPrompt: 'transition',
    expectedNegativePrompt: 'exclude private',
    expectedDurationToGenerate: 0,
    expectedWarnings: ['Internal library search may return no match at launch.'],
  }),
  promptScenario({
    id: 'mirelo-stroke-line-draw',
    label: 'Mirelo Stroke Motion line draw',
    targetLayer: 'stroke_motion',
    useCase: 'stroke_line_trace',
    sceneContext: 'Thin animated line completes an explanation beat.',
    videoTone: 'educational clear',
    expectedProvider: 'mirelo_sfx_v1_5',
    expectedPromptStyle: 'structured_sentence',
    expectedPrompt: 'Gentle stroke drawing sound',
    expectedNegativePrompt: 'no loud scratch',
    expectedDurationToGenerate: 2.5,
    expectedWarnings: [],
  }),
  promptScenario({
    id: 'mmaudio-stroke-line-draw-draft',
    label: 'MMAudio Stroke Motion draft line draw',
    targetLayer: 'stroke_motion',
    useCase: 'stroke_line_trace',
    sceneContext: 'Draft line drawing sound for timing experiment.',
    videoTone: 'educational clear',
    expectedProvider: 'mmaudio_v',
    expectedPromptStyle: 'video_conditioned_short_prompt',
    expectedPrompt: 'gentle line drawing sound',
    expectedNegativePrompt: 'no loud impact',
    expectedDurationToGenerate: 2.5,
    expectedWarnings: [],
  }),
  promptScenario({
    id: 'mirelo-graphic-card-reveal',
    label: 'Mirelo Graphic Design card reveal',
    targetLayer: 'graphic_design',
    useCase: 'graphic_card_reveal',
    sceneContext: 'Clean VisualExplain card reveal beside speaker.',
    videoTone: 'corporate luxury professional',
    expectedProvider: 'mirelo_sfx_v1_5',
    expectedPromptStyle: 'structured_sentence',
    expectedPrompt: 'Subtle graphic card reveal sound',
    expectedNegativePrompt: 'no cartoon',
    expectedDurationToGenerate: 2.5,
    expectedWarnings: [],
  }),
  promptScenario({
    id: 'mirelo-real-motion-object-settle',
    label: 'Mirelo Real Motion object settle',
    targetLayer: 'real_motion',
    useCase: 'real_motion_object_settle',
    sceneContext: 'Product object settles on a table.',
    videoTone: 'realistic product polish',
    expectedProvider: 'mirelo_sfx_v1_5',
    expectedPromptStyle: 'structured_sentence',
    expectedPrompt: 'Soft Real Motion object settle sound',
    expectedNegativePrompt: 'no cinematic boom',
    expectedDurationToGenerate: 4,
    expectedWarnings: [],
  }),
  promptScenario({
    id: 'mirelo-chapter-title-hit',
    label: 'Mirelo chapter title hit',
    targetLayer: 'chapter_card',
    useCase: 'chapter_title',
    sceneContext: 'Premium chapter card reveal.',
    videoTone: 'premium lifestyle travel',
    expectedProvider: 'mirelo_sfx_v1_5',
    expectedPromptStyle: 'structured_sentence',
    expectedPrompt: 'Premium chapter title accent',
    expectedNegativePrompt: 'no trailer boom',
    expectedDurationToGenerate: 4,
    expectedWarnings: [],
  }),
  promptScenario({
    id: 'mirelo-cta-reveal-chime',
    label: 'Mirelo CTA reveal chime',
    targetLayer: 'cta_reveal',
    useCase: 'cta_success_chime',
    sceneContext: 'Clean final CTA card.',
    videoTone: 'clean warm resolve',
    expectedProvider: 'mirelo_sfx_v1_5',
    expectedPromptStyle: 'structured_sentence',
    expectedPrompt: 'Soft success chime',
    expectedNegativePrompt: 'no loud notification',
    expectedDurationToGenerate: 2.5,
    expectedWarnings: [],
  }),
  promptScenario({
    id: 'mmaudio-ambient-bridge',
    label: 'MMAudio ambient bridge',
    targetLayer: 'ambient_bridge',
    useCase: 'ambient_soft_bridge',
    sceneContext: 'Soft ambience bridge for silent travel B-roll.',
    videoTone: 'natural documentary',
    expectedProvider: 'mmaudio_v',
    expectedPromptStyle: 'video_conditioned_short_prompt',
    expectedPrompt: 'soft ambient bridge',
    expectedNegativePrompt: 'no loud impact',
    expectedDurationToGenerate: 7,
    expectedWarnings: [],
  }),
  promptScenario({
    id: 'faith-teaching-no-prompt',
    label: 'No prompt because SFX avoided in faith teaching',
    targetLayer: 'none',
    useCase: 'none',
    decisionState: 'avoid',
    sceneContext: 'Important faith teaching pause.',
    videoTone: 'faith serious teaching',
    expectedProvider: 'no_sfx',
    expectedPromptStyle: 'short_phrase',
    expectedPrompt: '',
    expectedNegativePrompt: '',
    expectedDurationToGenerate: 0,
    expectedWarnings: ['No SFX is a valid professional choice.'],
  }),
  promptScenario({
    id: 'talking-head-no-prompt',
    label: 'No prompt because talking-head cut does not need SFX',
    targetLayer: 'none',
    useCase: 'none',
    decisionState: 'not_needed',
    sceneContext: 'Simple talking-head cut.',
    videoTone: 'clean voice-first',
    expectedProvider: 'no_sfx',
    expectedPromptStyle: 'short_phrase',
    expectedPrompt: '',
    expectedNegativePrompt: '',
    expectedDurationToGenerate: 0,
    expectedWarnings: ['No SFX is a valid professional choice.'],
  }),
  promptScenario({
    id: 'warning-mmaudio-prompt-too-long',
    label: 'Validation warning: MMAudio prompt too long',
    targetLayer: 'transition',
    useCase: 'transition_soft_whoosh',
    sceneContext: 'Long prompt should warn in validation tests.',
    videoTone: 'premium travel',
    expectedProvider: 'mmaudio_v',
    expectedPromptStyle: 'video_conditioned_short_prompt',
    expectedPrompt: 'soft transition whoosh with clean airy premium subtle travel movement and short smooth tail',
    expectedNegativePrompt: 'no loud impact',
    expectedDurationToGenerate: 2.5,
    expectedWarnings: ['MMAudio prompt may be too long'],
  }),
  promptScenario({
    id: 'warning-impact-whisper-conflict',
    label: 'Validation warning: loud impact requested with whisper profile',
    targetLayer: 'chapter_card',
    useCase: 'chapter_title',
    volumeProfile: 'whisper',
    sceneContext: 'Serious chapter card should not use loud impact.',
    videoTone: 'serious teaching',
    expectedProvider: 'mirelo_sfx_v1_5',
    expectedPromptStyle: 'structured_sentence',
    expectedPrompt: 'loud impact chapter hit',
    expectedNegativePrompt: 'no cartoon',
    expectedDurationToGenerate: 4,
    expectedWarnings: ['Prompt conflicts with whisper volume profile.'],
  }),
  promptScenario({
    id: 'warning-source-action-default-policy',
    label: 'Validation warning: source action under edit-layer default',
    targetLayer: 'transition',
    useCase: 'transition_soft_whoosh',
    sceneContext: 'Source action wording should warn under edit-layer policy.',
    videoTone: 'clean social',
    expectedProvider: 'mirelo_sfx_v1_5',
    expectedPromptStyle: 'structured_sentence',
    expectedPrompt: 'footsteps and door sound during transition',
    expectedNegativePrompt: 'no cartoon',
    expectedDurationToGenerate: 2.5,
    expectedWarnings: ['source-footage action SFX'],
  }),
]

export function getMockSFXPromptScenarioById(id: string) {
  return mockSFXPromptScenarios.find((scenario) => scenario.id === id)
}

export function getDefaultMockSFXPromptScenario() {
  return mockSFXPromptScenarios[0]
}
