import type {
  CreditApprovalRecord,
  CreditEstimateRecord,
  CreditReservationRecord,
  EditPlanRecord,
  GenerationRequestRecord,
  JobRecord,
  SFXEventPlanRecord,
  SFXLibraryDecision,
  SFXPromptPlanRecord,
  SFXProvider,
  SFXProviderRole,
  SFXProviderRouteRecord,
  SFXQAStatus,
  SFXTargetLayer,
} from '../../types'
import type {
  SFXWorkerInput,
  SFXWorkerMockRecordBundle,
  SFXWorkerOutput,
} from '../workers/sfx-worker-contracts'
import { isMMAudioProviderKey } from '../providers/sfx/sfx-provider-contracts'

const createdAt = '2026-05-19T00:00:00.000Z'
const workspaceId = 'mock-workspace-reeditpro'
const projectId = 'mock-sfx-worker-project'
const editPlanId = 'mock-approved-sfx-worker-edit-plan'

export interface MockSFXWorkerScenario {
  id: string
  label: string
  workerInput: SFXWorkerInput
  records: SFXWorkerMockRecordBundle
  sfxEventPlanSummary: string
  providerRouteSummary: string
  promptPlanSummary: string
  creditState: 'approved_reserved' | 'missing_reservation' | 'not_reserved' | 'not_approved'
  expectedWorkerResult: SFXWorkerOutput['status']
  expectedQAResult: SFXQAStatus | 'not_run'
  expectedLibraryDecision: SFXLibraryDecision | 'not_run'
  expectedNextStep:
    | 'use_in_preview'
    | 'reserve_credits'
    | 'approve_plan'
    | 'fix_prompt'
    | 'regenerate'
    | 'remove_sfx'
    | 'library_review'
}

function editPlan(status: EditPlanRecord['status'] = 'approved'): EditPlanRecord {
  return {
    id: editPlanId,
    projectId,
    chatSessionId: 'mock-sfx-chat-session',
    intentAnalysisId: 'mock-sfx-intent',
    sourceClipSequenceId: 'mock-sfx-source-sequence',
    status,
    complexity: 'premium_signature_edit',
    professionalStandardRequired: true,
    goalSummary: 'Mock luxury lifestyle edit with SoundSync SFX.',
    strategySummary: 'Use edit-layer SFX only and keep voice-first.',
    hookPolicy: 'recommended',
    hookRecommendation: 'Open with a refined title and soft transition.',
    creditEstimateId: 'mock-sfx-credit-estimate',
    approvalStatus: status === 'approved' ? 'approved' : 'pending',
    approvedByUserId: status === 'approved' ? 'mock-user' : undefined,
    approvedAt: status === 'approved' ? createdAt : undefined,
    approvalRequiredBeforeGeneration: true,
    version: 1,
    createdAt,
    updatedAt: createdAt,
    metadata: { mockOnly: true },
  }
}

function creditEstimate(status: CreditEstimateRecord['status'] = 'approved'): CreditEstimateRecord {
  return {
    id: 'mock-sfx-credit-estimate',
    workspaceId,
    projectId,
    editPlanId,
    status,
    totalEstimatedCredits: 18,
    minimumEstimatedCredits: 12,
    maximumEstimatedCredits: 24,
    availableCreditsSnapshot: 100,
    reservedCreditsSnapshot: 0,
    estimateReason: 'Mock SFX worker credit estimate.',
    estimatePayload: { mockOnly: true, sfxWorker: true },
    shownToUserAt: createdAt,
    approvedAt: status === 'approved' ? createdAt : undefined,
    createdByAgent: 'mock_sfx_credit_agent',
    createdAt,
    updatedAt: createdAt,
    metadata: { mockOnly: true },
  }
}

function creditApproval(status: CreditApprovalRecord['status'] = 'approved'): CreditApprovalRecord {
  return {
    id: 'mock-sfx-credit-approval',
    workspaceId,
    projectId,
    creditEstimateId: 'mock-sfx-credit-estimate',
    editPlanId,
    status,
    approvedBy: status === 'approved' ? 'mock-user' : undefined,
    approvedAt: status === 'approved' ? createdAt : undefined,
    approvalNote: 'Mock SFX credit approval.',
    approvalPayload: { mockOnly: true },
    createdAt,
    updatedAt: createdAt,
    metadata: { mockOnly: true },
  }
}

function creditReservation(
  id: string,
  status: CreditReservationRecord['status'] = 'reserved',
): CreditReservationRecord {
  return {
    id: `${id}-credit-reservation`,
    creditWalletId: `${id}-credit-wallet`,
    workspaceId,
    projectId,
    creditEstimateId: 'mock-sfx-credit-estimate',
    creditApprovalId: 'mock-sfx-credit-approval',
    editPlanId,
    status,
    reservedCredits: status === 'reserved' ? 18 : 0,
    spentCredits: 0,
    releasedCredits: 0,
    refundedCredits: 0,
    reservationReason: 'Mock SFX generation credit reservation.',
    idempotencyKey: `${id}-sfx-reservation`,
    reservedAt: status === 'reserved' ? createdAt : undefined,
    createdAt,
    updatedAt: createdAt,
    metadata: { mockOnly: true },
  }
}

function job(id: string): JobRecord {
  return {
    id: `${id}-job`,
    jobBatchId: `${id}-batch`,
    workspaceId,
    projectId,
    editPlanId,
    creditEstimateId: 'mock-sfx-credit-estimate',
    creditReservationId: `${id}-credit-reservation`,
    jobType: 'soundsync_generation',
    status: 'queued',
    priority: 'normal',
    workerTarget: 'soundsync_worker',
    runtimeType: 'cloud_run_job',
    jobName: `Mock SFX worker job: ${id}`,
    jobDescription: 'Future Cloud Run SFX worker placeholder. No real provider call is made.',
    dependsOnAll: true,
    inputPayload: { mockOnly: true },
    outputPayload: {},
    errorPayload: {},
    failureCategory: 'none',
    attemptCount: 0,
    maxAttempts: 1,
    progressPercent: 0,
    createdAt,
    updatedAt: createdAt,
    metadata: { mockOnly: true },
  }
}

function eventPlan(input: {
  id: string
  targetLayer: SFXTargetLayer
  useCase: SFXEventPlanRecord['useCase']
  decisionState?: SFXEventPlanRecord['decisionState']
  videoTone?: string
  sceneContext?: string
  volumeProfile?: SFXEventPlanRecord['volumeProfile']
}): SFXEventPlanRecord {
  return {
    id: `${input.id}-event`,
    projectId,
    editPlanId,
    targetLayer: input.targetLayer,
    useCase: input.useCase,
    decisionState: input.decisionState ?? 'needed',
    sourceFootagePolicy: 'edit_layer_only_default',
    reason: 'Mock worker scenario SFX supports a planned edit-layer cue.',
    sceneContext: input.sceneContext ?? 'Lake Como-style luxury lifestyle scene.',
    videoTone: input.videoTone ?? 'premium luxury travel',
    editLevel: 'premium_signature',
    signatureSystem: input.targetLayer === 'stroke_motion'
      ? 'stroke_motion'
      : input.targetLayer === 'real_motion'
        ? 'real_motion'
        : input.targetLayer === 'graphic_design'
          ? 'graphic_design'
          : 'none',
    anchorType: input.targetLayer === 'stroke_motion'
      ? 'stroke_motion_start'
      : input.targetLayer === 'real_motion'
        ? 'real_motion_object_settle'
        : input.targetLayer === 'graphic_design'
          ? 'graphic_reveal'
          : input.targetLayer === 'ambient_bridge'
            ? 'cut'
            : 'cut',
    anchorTimeSeconds: 12.42,
    timingPriority: input.targetLayer === 'ambient_bridge' ? 'loose_background' : 'frame_accurate',
    volumeProfile: input.volumeProfile ?? 'premium_soft',
    mixPriority: 'voice_first',
    creditImpact: 'low',
    requiresApproval: true,
    userVisibleSummary: `Mock ${input.useCase} SFX worker scenario.`,
    avoidRules: ['No random source-action SFX.', 'No loud SFX under voice.'],
    mustFollowRules: ['Edit plan and SFX credits must be approved before generation.'],
    status: 'approved',
    notes: ['Mock SFX worker scenario event plan.'],
    createdAt,
    updatedAt: createdAt,
    metadata: { mockOnly: true },
  }
}

function providerRole(provider: SFXProvider): SFXProviderRole {
  if (provider === 'mirelo_sfx_v1_5') return 'production_final'
  if (isMMAudioProviderKey(provider)) return 'cheap_draft_fallback'
  if (provider === 'reeditpro_internal_library') return 'internal_library_first_choice'
  return 'none'
}

function providerRoute(id: string, event: SFXEventPlanRecord, provider: SFXProvider, fallbackProvider?: SFXProvider): SFXProviderRouteRecord {
  return {
    id: `${id}-provider-route`,
    projectId,
    editPlanId,
    sfxEventPlanId: event.id,
    recommendedProvider: provider,
    providerRole: providerRole(provider),
    fallbackProvider,
    reason: 'Mock worker provider route. No provider is called.',
    useInternalLibraryFirst: provider === 'reeditpro_internal_library' || Boolean(fallbackProvider),
    useMMAudioForDraft: isMMAudioProviderKey(provider) || isMMAudioProviderKey(fallbackProvider),
    useMireloForProduction: provider === 'mirelo_sfx_v1_5',
    noSfxAllowed: true,
    costSensitivity: isMMAudioProviderKey(provider) ? 'lowest_cost' : 'balanced',
    qualityTarget: provider === 'mirelo_sfx_v1_5' ? 'production' : 'preview',
    approvalRequired: true,
    notes: ['Mock route only; no API keys or provider calls.'],
    createdAt,
    updatedAt: createdAt,
    metadata: { mockOnly: true },
  }
}

function promptPlan(
  id: string,
  event: SFXEventPlanRecord,
  route: SFXProviderRouteRecord,
  overrides: Partial<SFXPromptPlanRecord> = {},
): SFXPromptPlanRecord {
  const provider = overrides.provider ?? route.recommendedProvider
  const durationNeededSeconds = event.targetLayer === 'ambient_bridge' ? 4 : event.targetLayer === 'stroke_motion' ? 1.5 : 0.5
  const durationToGenerateSeconds = provider === 'reeditpro_internal_library' ? 0 : event.targetLayer === 'ambient_bridge' ? 7 : event.targetLayer === 'stroke_motion' ? 4 : 2.5

  return {
    id: `${id}-prompt-plan`,
    projectId,
    editPlanId,
    sfxEventPlanId: event.id,
    providerRouteId: route.id,
    provider,
    modelName: provider === 'mirelo_sfx_v1_5'
      ? 'mirelo-sfx-v1.5'
      : isMMAudioProviderKey(provider)
        ? 'mmaudio-v2'
        : 'reeditpro-internal-sfx-library',
    promptStyle: isMMAudioProviderKey(provider)
      ? 'video_conditioned_short_prompt'
      : provider === 'reeditpro_internal_library'
        ? 'library_search_tags'
        : 'structured_sentence',
    prompt: isMMAudioProviderKey(provider)
      ? 'soft transition whoosh'
      : `Soft premium ${event.useCase.replaceAll('_', ' ')}, clean and subtle, no cartoon, no harsh impact.`,
    negativePrompt: 'no loud impact, no cartoon, no harsh noise, no vocals',
    librarySearchTags: ['soft', 'premium', event.targetLayer, event.useCase],
    durationNeededSeconds,
    durationToGenerateSeconds,
    generatedDurationPolicy: event.targetLayer === 'ambient_bridge'
      ? 'generate_6_to_8_seconds'
      : event.targetLayer === 'stroke_motion'
        ? 'generate_3_to_5_seconds'
        : 'generate_2_to_3_seconds',
    textureWords: ['soft', 'clean'],
    energyWords: ['subtle'],
    styleWords: ['premium'],
    avoidWords: ['cartoon', 'harsh'],
    timingInstructions: ['Generate longer than needed, then trim and align hit point.'],
    mixInstructions: ['Keep voice-first and subtle.'],
    promptWarnings: [],
    status: 'planned',
    notes: ['Mock SFX worker prompt plan.'],
    createdAt,
    updatedAt: createdAt,
    metadata: { mockOnly: true },
    ...overrides,
  }
}

function generationRequest(id: string, prompt: SFXPromptPlanRecord, overrides: Partial<GenerationRequestRecord> = {}): GenerationRequestRecord {
  return {
    id: `${id}-generation-request`,
    workspaceId,
    projectId,
    editPlanId,
    creditEstimateId: 'mock-sfx-credit-estimate',
    creditReservationId: `${id}-credit-reservation`,
    requestType: 'sfx_asset',
    providerType: 'google_cloud_worker',
    modelName: prompt.modelName,
    signatureSystem: 'none',
    generationType: 'sfx_asset',
    inputAssetIds: [],
    outputAssetType: 'generated_audio',
    transparentBackgroundRequired: false,
    wordLevelTimingRequired: false,
    durationSeconds: Math.max(prompt.durationToGenerateSeconds, prompt.durationNeededSeconds),
    resolution: 'audio-only',
    prompt: prompt.prompt,
    negativePrompt: prompt.negativePrompt,
    styleConstraints: { mockOnly: true, provider: prompt.provider },
    timingConstraints: { sfxEventPlanId: prompt.sfxEventPlanId, trimAndHitAlignmentRequired: true },
    outputRequirements: { assetType: 'sound_effect', assetFormat: 'wav', qaRequiredBeforePreview: true },
    status: 'queued',
    qualityLevel: 'preview',
    creditEstimate: 6,
    estimatedCredits: 6,
    failureCategory: 'none',
    idempotencyKey: `${id}-sfx-worker-generation`,
    workerNotes: ['Mock SFX worker request only.'],
    providerRequestSummary: { provider: prompt.provider, model: prompt.modelName },
    requestPayload: { mockOnly: true, sfxPromptPlanId: prompt.id },
    queuedAt: createdAt,
    createdAt,
    updatedAt: createdAt,
    metadata: { mockOnly: true },
    ...overrides,
  }
}

function workerInput(id: string, event: SFXEventPlanRecord, route: SFXProviderRouteRecord, prompt: SFXPromptPlanRecord): SFXWorkerInput {
  return {
    jobId: `${id}-job`,
    jobBatchId: `${id}-batch`,
    workspaceId,
    projectId,
    editPlanId,
    sfxEventPlanId: event.id,
    sfxProviderRouteId: route.id,
    sfxPromptPlanId: prompt.id,
    generationRequestId: `${id}-generation-request`,
    creditReservationId: `${id}-credit-reservation`,
    requestedByUserId: 'mock-user',
    userConfirmationApproved: true,
    sourceFootageApproved: false,
    mockOnly: true,
  }
}

function scenario(input: {
  id: string
  label: string
  targetLayer: SFXTargetLayer
  useCase: SFXEventPlanRecord['useCase']
  provider: SFXProvider
  fallbackProvider?: SFXProvider
  decisionState?: SFXEventPlanRecord['decisionState']
  creditState?: MockSFXWorkerScenario['creditState']
  editPlanStatus?: EditPlanRecord['status']
  promptOverrides?: Partial<SFXPromptPlanRecord>
  requestOverrides?: Partial<GenerationRequestRecord>
  includeReservation?: boolean
  reservationStatus?: CreditReservationRecord['status']
  approvedLibraryAssetId?: string
  providerUnavailable?: boolean
  mockOutputSummary?: string
  speechPresent?: boolean
  musicPresent?: boolean
  ambienceImportant?: boolean
  expectedWorkerResult: SFXWorkerOutput['status']
  expectedQAResult: MockSFXWorkerScenario['expectedQAResult']
  expectedLibraryDecision: MockSFXWorkerScenario['expectedLibraryDecision']
  expectedNextStep: MockSFXWorkerScenario['expectedNextStep']
}): MockSFXWorkerScenario {
  const event = eventPlan({
    id: input.id,
    targetLayer: input.targetLayer,
    useCase: input.useCase,
    decisionState: input.decisionState,
    videoTone: input.mockOutputSummary?.includes('cartoonish') ? 'luxury premium cartoonish wrong style' : undefined,
  })
  const route = providerRoute(input.id, event, input.provider, input.fallbackProvider)
  const prompt = promptPlan(input.id, event, route, input.promptOverrides)
  const request = generationRequest(input.id, prompt, input.requestOverrides)
  const records: SFXWorkerMockRecordBundle = {
    job: job(input.id),
    editPlan: editPlan(input.editPlanStatus),
    creditEstimate: creditEstimate(input.creditState === 'not_approved' ? 'shown_to_user' : 'approved'),
    creditApproval: creditApproval(input.creditState === 'not_approved' ? 'pending' : 'approved'),
    creditReservation: input.includeReservation === false
      ? undefined
      : creditReservation(input.id, input.reservationStatus),
    generationRequest: request,
    sfxEventPlan: event,
    sfxProviderRoute: route,
    sfxPromptPlan: prompt,
    approvedLibraryAssetId: input.approvedLibraryAssetId,
    speechPresent: input.speechPresent,
    musicPresent: input.musicPresent,
    ambienceImportant: input.ambienceImportant,
    mockOutputSummary: input.mockOutputSummary,
    providerTermsKnown: true,
    commercialAllowed: true,
    adsAllowed: true,
    clientWorkAllowed: true,
    reuseAcrossUsersAllowed: input.expectedLibraryDecision === 'candidate_for_library',
    simulateApprovedLibraryMatch: Boolean(input.approvedLibraryAssetId),
    simulateMockApproval: input.expectedLibraryDecision === 'candidate_for_library',
  }
  const inputRecord = workerInput(input.id, event, route, prompt)
  inputRecord.providerUnavailable = input.providerUnavailable

  return {
    id: input.id,
    label: input.label,
    workerInput: inputRecord,
    records,
    sfxEventPlanSummary: `${event.targetLayer} / ${event.useCase} / ${event.decisionState}`,
    providerRouteSummary: `${route.recommendedProvider}${route.fallbackProvider ? ` -> ${route.fallbackProvider}` : ''}`,
    promptPlanSummary: `${prompt.promptStyle}: ${prompt.prompt}`,
    creditState: input.creditState ?? (input.includeReservation === false ? 'missing_reservation' : 'approved_reserved'),
    expectedWorkerResult: input.expectedWorkerResult,
    expectedQAResult: input.expectedQAResult,
    expectedLibraryDecision: input.expectedLibraryDecision,
    expectedNextStep: input.expectedNextStep,
  }
}

export const mockSFXWorkerScenarios: MockSFXWorkerScenario[] = [
  scenario({ id: 'mirelo-soft-transition-success', label: 'Mirelo production soft transition whoosh success', targetLayer: 'transition', useCase: 'transition_soft_whoosh', provider: 'mirelo_sfx_v1_5', expectedWorkerResult: 'mock_generated', expectedQAResult: 'passed', expectedLibraryDecision: 'candidate_for_library', expectedNextStep: 'library_review', musicPresent: true }),
  scenario({ id: 'mirelo-stroke-draw-success', label: 'Mirelo Stroke Motion draw success', targetLayer: 'stroke_motion', useCase: 'stroke_draw', provider: 'mirelo_sfx_v1_5', expectedWorkerResult: 'mock_generated', expectedQAResult: 'passed', expectedLibraryDecision: 'candidate_for_library', expectedNextStep: 'library_review', speechPresent: true }),
  scenario({ id: 'mirelo-graphic-reveal-success', label: 'Mirelo Graphic Design card reveal success', targetLayer: 'graphic_design', useCase: 'graphic_card_reveal', provider: 'mirelo_sfx_v1_5', expectedWorkerResult: 'mock_generated', expectedQAResult: 'passed', expectedLibraryDecision: 'candidate_for_library', expectedNextStep: 'library_review' }),
  scenario({ id: 'mirelo-real-motion-settle-success', label: 'Mirelo Real Motion object settle success', targetLayer: 'real_motion', useCase: 'real_motion_object_settle', provider: 'mirelo_sfx_v1_5', expectedWorkerResult: 'mock_generated', expectedQAResult: 'passed', expectedLibraryDecision: 'candidate_for_library', expectedNextStep: 'library_review', ambienceImportant: true }),
  scenario({ id: 'mmaudio-draft-transition-success', label: 'MMAudio V2 draft transition success', targetLayer: 'transition', useCase: 'transition_soft_whoosh', provider: 'mmaudio_v2', expectedWorkerResult: 'mock_generated', expectedQAResult: 'passed', expectedLibraryDecision: 'project_only', expectedNextStep: 'use_in_preview', musicPresent: true }),
  scenario({ id: 'mmaudio-ambient-bridge-success', label: 'MMAudio V2 ambient bridge draft success', targetLayer: 'ambient_bridge', useCase: 'ambient_soft_bridge', provider: 'mmaudio_v2', expectedWorkerResult: 'mock_generated', expectedQAResult: 'passed', expectedLibraryDecision: 'project_only', expectedNextStep: 'use_in_preview', ambienceImportant: true }),
  scenario({ id: 'internal-library-match-used', label: 'Internal library match used instead of generation', targetLayer: 'transition', useCase: 'transition_soft_whoosh', provider: 'reeditpro_internal_library', approvedLibraryAssetId: 'mock-approved-soft-whoosh-001', expectedWorkerResult: 'library_match_used', expectedQAResult: 'passed', expectedLibraryDecision: 'approved_internal_library', expectedNextStep: 'use_in_preview' }),
  scenario({ id: 'missing-credit-reservation-blocked', label: 'Missing credit reservation blocked', targetLayer: 'transition', useCase: 'transition_soft_whoosh', provider: 'mirelo_sfx_v1_5', includeReservation: false, creditState: 'missing_reservation', expectedWorkerResult: 'blocked', expectedQAResult: 'not_run', expectedLibraryDecision: 'not_run', expectedNextStep: 'reserve_credits' }),
  scenario({ id: 'edit-plan-not-approved-blocked', label: 'Edit plan not approved blocked', targetLayer: 'transition', useCase: 'transition_soft_whoosh', provider: 'mirelo_sfx_v1_5', editPlanStatus: 'awaiting_approval', expectedWorkerResult: 'blocked', expectedQAResult: 'not_run', expectedLibraryDecision: 'not_run', expectedNextStep: 'approve_plan' }),
  scenario({ id: 'sfx-decision-avoid-blocked', label: 'SFX decision avoid blocked', targetLayer: 'transition', useCase: 'transition_soft_whoosh', provider: 'mirelo_sfx_v1_5', decisionState: 'avoid', expectedWorkerResult: 'blocked', expectedQAResult: 'not_run', expectedLibraryDecision: 'not_run', expectedNextStep: 'remove_sfx' }),
  scenario({ id: 'sfx-decision-not-needed-blocked', label: 'SFX decision not needed blocked', targetLayer: 'transition', useCase: 'none', provider: 'mirelo_sfx_v1_5', decisionState: 'not_needed', expectedWorkerResult: 'blocked', expectedQAResult: 'not_run', expectedLibraryDecision: 'not_run', expectedNextStep: 'remove_sfx' }),
  scenario({ id: 'provider-route-no-sfx-blocked', label: 'Provider route no_sfx blocked', targetLayer: 'transition', useCase: 'none', provider: 'no_sfx', promptOverrides: { provider: 'no_sfx', modelName: 'no-sfx', durationNeededSeconds: 0, durationToGenerateSeconds: 0 }, expectedWorkerResult: 'blocked', expectedQAResult: 'not_run', expectedLibraryDecision: 'not_run', expectedNextStep: 'remove_sfx' }),
  scenario({ id: 'qa-too-loud-dialogue-failed', label: 'QA failure due to too loud under dialogue', targetLayer: 'montage_hit', useCase: 'montage_beat_accent', provider: 'mirelo_sfx_v1_5', speechPresent: true, mockOutputSummary: 'impact under dialogue too loud fights voice', expectedWorkerResult: 'failed', expectedQAResult: 'failed', expectedLibraryDecision: 'not_run', expectedNextStep: 'regenerate' }),
  scenario({ id: 'qa-cartoonish-luxury-title-failed', label: 'QA failure due to cartoonish luxury title hit', targetLayer: 'title_card', useCase: 'chapter_title', provider: 'mirelo_sfx_v1_5', mockOutputSummary: 'cartoonish cheap wrong style for luxury premium title hit', expectedWorkerResult: 'failed', expectedQAResult: 'failed', expectedLibraryDecision: 'not_run', expectedNextStep: 'regenerate' }),
  scenario({ id: 'lake-como-lifestyle-flow', label: 'Lake Como lifestyle multi-SFX flow', targetLayer: 'chapter_card', useCase: 'chapter_title', provider: 'mirelo_sfx_v1_5', fallbackProvider: 'mmaudio_v2', expectedWorkerResult: 'mock_generated', expectedQAResult: 'passed', expectedLibraryDecision: 'candidate_for_library', expectedNextStep: 'library_review', musicPresent: true }),
  scenario({ id: 'signature-sfx-flow', label: 'Signature SFX flow', targetLayer: 'stroke_motion', useCase: 'stroke_circle_complete', provider: 'mirelo_sfx_v1_5', expectedWorkerResult: 'mock_generated', expectedQAResult: 'passed', expectedLibraryDecision: 'candidate_for_library', expectedNextStep: 'library_review', speechPresent: true }),
  scenario({ id: 'generated-project-only', label: 'Generated SFX becomes project-only', targetLayer: 'ambient_bridge', useCase: 'lifestyle_restaurant_ambience_bridge', provider: 'mmaudio_v2', expectedWorkerResult: 'mock_generated', expectedQAResult: 'passed', expectedLibraryDecision: 'project_only', expectedNextStep: 'use_in_preview', ambienceImportant: true }),
  scenario({ id: 'generated-library-candidate', label: 'Generated SFX becomes library candidate', targetLayer: 'graphic_design', useCase: 'graphic_label_pop', provider: 'mirelo_sfx_v1_5', expectedWorkerResult: 'mock_generated', expectedQAResult: 'passed', expectedLibraryDecision: 'candidate_for_library', expectedNextStep: 'library_review' }),
  scenario({ id: 'provider-unavailable-fallback-mmaudio', label: 'Provider unavailable fallback to MMAudio V2', targetLayer: 'transition', useCase: 'transition_air_pass', provider: 'mirelo_sfx_v1_5', fallbackProvider: 'mmaudio_v2', providerUnavailable: true, expectedWorkerResult: 'mock_generated', expectedQAResult: 'passed', expectedLibraryDecision: 'project_only', expectedNextStep: 'use_in_preview' }),
  scenario({ id: 'prompt-validation-failed-blocked', label: 'Prompt validation failed blocked', targetLayer: 'transition', useCase: 'transition_light_riser', provider: 'mirelo_sfx_v1_5', promptOverrides: { promptWarnings: ['critical forced_worker_block: prompt asks for harsh vocal riser under speech'] }, expectedWorkerResult: 'blocked', expectedQAResult: 'not_run', expectedLibraryDecision: 'not_run', expectedNextStep: 'fix_prompt' }),
]

export function getMockSFXWorkerScenarioById(id: string) {
  return mockSFXWorkerScenarios.find((item) => item.id === id)
}

export function getDefaultMockSFXWorkerScenario() {
  return mockSFXWorkerScenarios[0]
}

export function getLakeComoSFXWorkerScenarios() {
  return mockSFXWorkerScenarios.filter((item) =>
    ['mirelo-soft-transition-success', 'lake-como-lifestyle-flow', 'generated-project-only'].includes(item.id),
  )
}

export function getSignatureSFXWorkerScenarios() {
  return mockSFXWorkerScenarios.filter((item) =>
    ['mirelo-stroke-draw-success', 'mirelo-graphic-reveal-success', 'mirelo-real-motion-settle-success', 'signature-sfx-flow'].includes(item.id),
  )
}
