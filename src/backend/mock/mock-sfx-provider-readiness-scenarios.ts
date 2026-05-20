import type {
  CreditEstimateRecord,
  CreditReservationRecord,
  EditPlanRecord,
  GenerationRequestRecord,
  JobRecord,
  SFXEventPlanRecord,
  SFXPromptPlanRecord,
  SFXProviderRouteRecord,
} from '../../types'
import type {
  SFXProviderExecutionReadinessInput,
  SFXProviderKey,
  SFXProviderReadinessBlockReason,
  SFXProviderReadinessSafeNextStep,
} from '../providers/sfx/sfx-provider-contracts'
import { isMMAudioProviderKey } from '../providers/sfx/sfx-provider-contracts'
import { nowIso } from './mock-database'

export interface MockSFXProviderReadinessScenario {
  id: string
  label: string
  description: string
  input: SFXProviderExecutionReadinessInput
  expectedReadyForRealTransport: boolean
  expectedProvider: SFXProviderKey
  expectedBlockReasons: SFXProviderReadinessBlockReason[]
  expectedSafeNextStep: SFXProviderReadinessSafeNextStep
}

const workspaceId = 'mock-workspace-reeditpro'
const projectId = 'mock-project-provider-readiness'
const editPlanId = 'mock-edit-plan-provider-readiness'
const creditEstimateId = 'mock-credit-estimate-provider-readiness'
const creditReservationId = 'mock-credit-reservation-provider-readiness'
const eventPlanId = 'mock-sfx-event-plan-provider-readiness'
const routeId = 'mock-sfx-provider-route-provider-readiness'
const promptPlanId = 'mock-sfx-prompt-plan-provider-readiness'
const generationRequestId = 'mock-generation-request-provider-readiness'
const jobId = 'mock-job-provider-readiness'

function baseRecord(id: string) {
  return {
    id,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      mockOnly: true,
      readinessOnly: true,
    },
  }
}

function editPlan(approved = true): EditPlanRecord {
  return {
    id: editPlanId,
    projectId,
    chatSessionId: 'mock-chat-provider-readiness',
    intentAnalysisId: 'mock-intent-provider-readiness',
    sourceClipSequenceId: 'mock-source-sequence-provider-readiness',
    status: approved ? 'approved' : 'awaiting_approval',
    complexity: 'pro_edit',
    professionalStandardRequired: true,
    goalSummary: 'Mock SFX provider readiness check.',
    strategySummary: 'Readiness-only verification before future real provider transport.',
    hookPolicy: 'recommended',
    hookRecommendation: 'Use SFX only where provider routing and approvals are satisfied.',
    approvalStatus: approved ? 'approved' : 'pending',
    approvedByUserId: approved ? 'mock-user-reeditpro' : undefined,
    approvedAt: approved ? nowIso() : undefined,
    approvalRequiredBeforeGeneration: true,
    version: 1,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    metadata: {
      mockOnly: true,
      readinessOnly: true,
    },
  }
}

function creditEstimate(approved = true): CreditEstimateRecord {
  return {
    ...baseRecord(creditEstimateId),
    workspaceId,
    projectId,
    editPlanId,
    status: approved ? 'approved' : 'shown_to_user',
    totalEstimatedCredits: 12,
    approvedAt: approved ? nowIso() : undefined,
    estimateReason: 'Mock provider readiness credit estimate.',
    lineItems: [],
  }
}

function creditReservation(reserved = true): CreditReservationRecord {
  return {
    ...baseRecord(creditReservationId),
    creditWalletId: 'mock-credit-wallet-provider-readiness',
    workspaceId,
    projectId,
    creditEstimateId,
    editPlanId,
    status: reserved ? 'reserved' : 'draft',
    reservedCredits: reserved ? 12 : 0,
    spentCredits: 0,
    releasedCredits: 0,
    refundedCredits: 0,
    reservationReason: 'Mock provider readiness reservation.',
    reservedAt: reserved ? nowIso() : undefined,
  }
}

function eventPlan(provider: SFXProviderKey, targetLayer: SFXEventPlanRecord['targetLayer'] = 'transition'): SFXEventPlanRecord {
  return {
    ...baseRecord(eventPlanId),
    projectId,
    editPlanId,
    targetLayer,
    useCase: targetLayer === 'source_footage_repair' ? 'ambient_bridge' : 'transition_soft_whoosh',
    decisionState: provider === 'no_sfx' ? 'not_needed' : 'needed',
    sourceFootagePolicy: targetLayer === 'source_footage_repair' ? 'avoid_source_action_sfx' : 'edit_layer_only_default',
    reason: provider === 'no_sfx'
      ? 'No SFX improves this edit moment.'
      : 'Provider readiness scenario needs one planned edit-layer SFX cue.',
    sceneContext: 'Mock readiness scene.',
    videoTone: 'polished project edit',
    editLevel: 'pro',
    signatureSystem: 'sound_sync',
    anchorType: 'cut',
    anchorTimeSeconds: 12.42,
    startTimeSeconds: 12.2,
    hitTimeSeconds: 12.42,
    endTimeSeconds: 12.8,
    timingPriority: 'frame_accurate',
    volumeProfile: 'subtle_polish',
    mixPriority: 'voice_first',
    creditImpact: provider === 'mirelo_sfx_v1_5' ? 'high' : 'medium',
    requiresApproval: provider !== 'no_sfx',
    userVisibleSummary: 'Mock provider readiness SFX cue.',
    avoidRules: ['Do not cover speech.'],
    mustFollowRules: ['Stay approval-gated.'],
    status: provider === 'no_sfx' ? 'planned' : 'approved',
    notes: ['Readiness-only; no real provider call.'],
  }
}

function providerRoute(provider: SFXProviderKey): SFXProviderRouteRecord {
  return {
    ...baseRecord(routeId),
    projectId,
    editPlanId,
    sfxEventPlanId: eventPlanId,
    recommendedProvider: provider,
    providerRole: provider === 'mirelo_sfx_v1_5'
      ? 'production_final'
      : isMMAudioProviderKey(provider)
        ? 'cheap_draft_fallback'
        : provider === 'reeditpro_internal_library'
          ? 'internal_library_first_choice'
          : 'none',
    fallbackProvider: provider === 'mirelo_sfx_v1_5' ? 'mmaudio_v2' : undefined,
    reason: provider === 'no_sfx'
      ? 'No SFX route is safest for this moment.'
      : 'Provider route is ready to be checked by the backend readiness gate.',
    useInternalLibraryFirst: provider === 'reeditpro_internal_library',
    useMMAudioForDraft: isMMAudioProviderKey(provider),
    useMireloForProduction: provider === 'mirelo_sfx_v1_5',
    noSfxAllowed: provider === 'no_sfx',
    costSensitivity: provider === 'mirelo_sfx_v1_5' ? 'quality_first' : 'balanced',
    qualityTarget: provider === 'mirelo_sfx_v1_5' ? 'production' : 'preview',
    approvalRequired: provider !== 'no_sfx',
    notes: ['Readiness-only provider route.'],
  }
}

function promptPlan(provider: SFXProviderKey): SFXPromptPlanRecord | undefined {
  if (provider === 'no_sfx') return undefined

  return {
    ...baseRecord(promptPlanId),
    projectId,
    editPlanId,
    sfxEventPlanId: eventPlanId,
    providerRouteId: routeId,
    provider,
    modelName: provider === 'mirelo_sfx_v1_5' ? 'mirelo-sfx-v1.5' : 'mmaudio-v2',
    promptStyle: 'structured_sentence',
    prompt: 'Subtle premium transition whoosh, voice-safe, polished but restrained.',
    negativePrompt: 'No harsh hits, no cartoon tone, no speech masking.',
    librarySearchTags: ['soft', 'premium', 'transition', 'whoosh'],
    durationNeededSeconds: 0.7,
    durationToGenerateSeconds: 3,
    generatedDurationPolicy: 'generate_2_to_3_seconds',
    textureWords: ['soft', 'airy'],
    energyWords: ['subtle'],
    styleWords: ['premium', 'clean'],
    avoidWords: ['harsh', 'loud'],
    timingInstructions: ['Hit at 12.420 seconds.'],
    mixInstructions: ['Voice-first mix.'],
    promptWarnings: [],
    status: 'approved',
    notes: ['Readiness-only prompt plan; not executed.'],
  }
}

function generationRequest(provider: SFXProviderKey): GenerationRequestRecord | undefined {
  if (provider === 'no_sfx') return undefined

  return {
    ...baseRecord(generationRequestId),
    workspaceId,
    projectId,
    editPlanId,
    jobId,
    creditEstimateId,
    providerType: 'external_ai_provider',
    modelName: provider === 'mirelo_sfx_v1_5' ? 'mirelo-sfx-v1.5' : 'mmaudio-v2',
    signatureSystem: 'sound_sync',
    generationType: 'sfx_asset',
    inputAssetIds: [],
    outputAssetType: 'generated_audio',
    transparentBackgroundRequired: false,
    durationSeconds: 3,
    resolution: 'audio',
    prompt: 'Subtle premium transition whoosh, voice-safe, polished but restrained.',
    negativePrompt: 'No harsh hits, no cartoon tone, no speech masking.',
    styleConstraints: ['voice_safe', 'mock_only'],
    timingConstraints: ['hit_at_12_420s'],
    status: 'queued',
    creditEstimate: 12,
    estimatedCredits: 12,
    creditReservationId,
    idempotencyKey: 'mock-provider-readiness-generation',
    workerNotes: ['Readiness-only; no live provider call.'],
    requestPayload: {
      mockOnly: true,
      sfxEventPlanId: eventPlanId,
      sfxProviderRouteId: routeId,
      sfxPromptPlanId: promptPlanId,
    },
  }
}

function workerJob(): JobRecord {
  return {
    ...baseRecord(jobId),
    workspaceId,
    projectId,
    editPlanId,
    creditEstimateId,
    creditReservationId,
    jobType: 'soundsync_generation',
    status: 'queued',
    priority: 'normal',
    workerTarget: 'soundsync_worker',
    runtimeType: 'backend_api',
    jobName: 'Mock SFX provider readiness job',
    jobDescription: 'Readiness-only job record for future backend provider transport.',
    dependsOnAll: true,
    inputPayload: {
      mockOnly: true,
      generationRequestId,
      sfxEventPlanId: eventPlanId,
      sfxProviderRouteId: routeId,
      sfxPromptPlanId: promptPlanId,
    },
    outputPayload: {},
    errorPayload: {},
    failureCategory: 'none',
    attemptCount: 0,
    maxAttempts: 1,
    progressPercent: 0,
    progressMessage: 'Queued for readiness check only.',
  }
}

function readyInput(provider: SFXProviderKey): SFXProviderExecutionReadinessInput {
  return {
    mode: 'real',
    eventPlan: eventPlan(provider),
    providerRoute: providerRoute(provider),
    promptPlan: promptPlan(provider),
    generationRequest: generationRequest(provider),
    creditEstimate: creditEstimate(true),
    creditReservation: creditReservation(true),
    workerJob: provider === 'no_sfx' ? undefined : workerJob(),
    editPlan: editPlan(true),
    sourceFootageApproved: true,
    runtimeMode: 'backend_worker',
    providerDocsReviewed: true,
    storageOutputConfigured: true,
    provenancePolicyReviewed: true,
    config: {
      mode: 'real',
      isBrowserRuntime: false,
      mireloSecretReferenceName: provider === 'mirelo_sfx_v1_5' ? 'projects/reeditpro/secrets/reeditpro-prod-mirelo-api-key' : undefined,
      mmaudioSecretReferenceName: isMMAudioProviderKey(provider) ? 'projects/reeditpro/secrets/reeditpro-prod-mmaudio-api-key' : undefined,
      hasMireloCredential: provider === 'mirelo_sfx_v1_5',
      hasMMAudioCredential: isMMAudioProviderKey(provider),
    },
  }
}

function normalizeExpectedProvider(provider?: string): SFXProviderKey {
  if (
    provider === 'mirelo_sfx_v1_5' ||
    provider === 'mmaudio_v2' ||
    provider === 'mmaudio_v' ||
    provider === 'reeditpro_internal_library' ||
    provider === 'no_sfx'
  ) {
    return provider
  }

  return 'no_sfx'
}

function scenario(input: Omit<MockSFXProviderReadinessScenario, 'expectedProvider'> & {
  expectedProvider?: SFXProviderKey
}): MockSFXProviderReadinessScenario {
  return {
    ...input,
    expectedProvider: input.expectedProvider ??
      normalizeExpectedProvider(input.input.promptPlan?.provider ?? input.input.providerRoute?.recommendedProvider),
  }
}

export const mockSFXProviderReadinessScenarios: MockSFXProviderReadinessScenario[] = [
  scenario({
    id: 'mock-mode-allowed',
    label: 'Mock mode allowed',
    description: 'Local mock SFX provider execution can continue, but real transport readiness is false.',
    input: {
      ...readyInput('mirelo_sfx_v1_5'),
      mode: 'mock',
      config: {
        mode: 'mock',
        isBrowserRuntime: false,
      },
    },
    expectedReadyForRealTransport: false,
    expectedBlockReasons: ['provider_mode_mock'],
    expectedSafeNextStep: 'stay_in_mock_mode',
  }),
  scenario({
    id: 'disabled-mode-blocked',
    label: 'Disabled mode blocked',
    description: 'Provider mode disabled returns a structured disabled block.',
    input: {
      ...readyInput('mirelo_sfx_v1_5'),
      mode: 'disabled',
      config: {
        mode: 'disabled',
        isBrowserRuntime: false,
      },
    },
    expectedReadyForRealTransport: false,
    expectedBlockReasons: ['provider_mode_disabled'],
    expectedSafeNextStep: 'keep_provider_disabled',
  }),
  scenario({
    id: 'frontend-real-mode-blocked',
    label: 'Frontend real mode blocked',
    description: 'Real mode is blocked if the check is attempted from browser/Vite runtime.',
    input: {
      ...readyInput('mirelo_sfx_v1_5'),
      forceBrowserRuntime: true,
      runtimeMode: 'browser_frontend',
      config: {
        mode: 'real',
        isBrowserRuntime: true,
        mireloSecretReferenceName: 'projects/reeditpro/secrets/reeditpro-prod-mirelo-api-key',
        hasMireloCredential: true,
      },
    },
    expectedReadyForRealTransport: false,
    expectedBlockReasons: ['frontend_runtime_blocked'],
    expectedSafeNextStep: 'move_check_to_backend_worker',
  }),
  scenario({
    id: 'real-mirelo-missing-secret-ref',
    label: 'Real Mirelo missing Secret Manager reference',
    description: 'Real Mirelo readiness requires a Secret Manager reference name, not a raw key.',
    input: {
      ...readyInput('mirelo_sfx_v1_5'),
      config: {
        mode: 'real',
        isBrowserRuntime: false,
        hasMireloCredential: false,
      },
    },
    expectedReadyForRealTransport: false,
    expectedBlockReasons: ['secret_reference_missing'],
    expectedSafeNextStep: 'configure_secret_references',
  }),
  scenario({
    id: 'real-mirelo-ready-for-future-transport',
    label: 'Real Mirelo prerequisites ready',
    description: 'Mirelo has backend refs and approval gates; future transport still remains unimplemented.',
    input: readyInput('mirelo_sfx_v1_5'),
    expectedReadyForRealTransport: true,
    expectedBlockReasons: [],
    expectedSafeNextStep: 'implement_backend_transport',
  }),
  scenario({
    id: 'real-mmaudio-ready-for-future-transport',
    label: 'Real MMAudio prerequisites ready',
    description: 'MMAudio has backend refs and approval gates; future transport still remains unimplemented.',
    input: readyInput('mmaudio_v2'),
    expectedReadyForRealTransport: true,
    expectedBlockReasons: [],
    expectedSafeNextStep: 'implement_backend_transport',
  }),
  scenario({
    id: 'missing-credit-reservation',
    label: 'Missing credit reservation',
    description: 'Generation remains blocked until credits are reserved.',
    input: {
      ...readyInput('mirelo_sfx_v1_5'),
      creditReservation: undefined,
    },
    expectedReadyForRealTransport: false,
    expectedBlockReasons: ['credit_reservation_missing'],
    expectedSafeNextStep: 'approve_plan_and_reserve_credits',
  }),
  scenario({
    id: 'missing-generation-request',
    label: 'Missing generation request',
    description: 'Provider readiness blocks when no approved or queued generation request exists.',
    input: {
      ...readyInput('mirelo_sfx_v1_5'),
      generationRequest: undefined,
    },
    expectedReadyForRealTransport: false,
    expectedBlockReasons: ['generation_request_missing'],
    expectedSafeNextStep: 'create_generation_request',
  }),
  scenario({
    id: 'no-sfx-provider-route',
    label: 'No-SFX provider route',
    description: 'No-SFX route is valid and should not attempt real provider readiness.',
    input: readyInput('no_sfx'),
    expectedReadyForRealTransport: false,
    expectedBlockReasons: ['provider_route_no_sfx'],
    expectedSafeNextStep: 'do_not_generate_sfx',
  }),
  scenario({
    id: 'source-footage-repair-without-approval',
    label: 'Source-footage repair without approval',
    description: 'Source-footage SFX repair cannot proceed without explicit approval.',
    input: {
      ...readyInput('mirelo_sfx_v1_5'),
      eventPlan: eventPlan('mirelo_sfx_v1_5', 'source_footage_repair'),
      sourceFootageApproved: false,
    },
    expectedReadyForRealTransport: false,
    expectedBlockReasons: ['source_footage_not_approved', 'safety_gate_blocked'],
    expectedSafeNextStep: 'prepare_storage_and_provenance',
  }),
  scenario({
    id: 'provider-docs-not-reviewed',
    label: 'Provider docs not reviewed',
    description: 'Real provider readiness requires provider docs and policy review flags.',
    input: {
      ...readyInput('mmaudio_v2'),
      providerDocsReviewed: false,
    },
    expectedReadyForRealTransport: false,
    expectedBlockReasons: ['provider_docs_not_reviewed'],
    expectedSafeNextStep: 'review_provider_docs',
  }),
]

export function getDefaultMockSFXProviderReadinessScenario(): MockSFXProviderReadinessScenario {
  return mockSFXProviderReadinessScenarios[0]
}

export function getMockSFXProviderReadinessScenarioById(
  id: string,
): MockSFXProviderReadinessScenario | undefined {
  return mockSFXProviderReadinessScenarios.find((scenarioItem) => scenarioItem.id === id)
}
