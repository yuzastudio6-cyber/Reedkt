import type {
  CreditApprovalRecord,
  CreditEstimateLineItemRecord,
  CreditEstimateRecord,
  CreditReservationRecord,
  EditPlanRecord,
  GenerationRequestRecord,
  JobRecord,
  SFXEventPlanRecord,
  SFXPromptPlanRecord,
  SFXProviderRouteRecord,
} from '../../types'
import type { JobRuntimeQueueItem } from '../../types/job-runtime'
import type {
  CreateEditProjectSFXIntegrationRequest,
  CreateEditProjectSFXIntegrationResponse,
  EditProjectSFXIntegrationResult,
  EditProjectSFXNextStep,
} from '../contracts/sfx-director-contracts'
import type { CreditEstimateRuntimeLineInput } from './credit-estimate-runtime-service'
import type { MockDatabase } from '../mock/mock-database'
import { createMockId, findMockRecord, nowIso } from '../mock/mock-database'
import { fail, ok, type ServiceResult, unwrapServiceResult } from '../service-result'
import { createSFXDirectorPlan } from './sfx-director-service'
import { createSFXPromptPlansForEvents } from './sfx-prompt-plan-service'
import { createCreditEstimateRuntime } from './credit-estimate-runtime-service'
import { approveCreditEstimate, createCreditWallet, grantWeeklyBonusCredits } from './credit-service'
import { reserveCreditsForApprovedEstimate } from './credit-reservation-runtime-service'
import { createSFXProviderGenerationRequestFromPromptPlan } from './generation-service'
import { createSFXGenerationJob } from './job-orchestration-service'
import { queueMockJob } from './job-queue-runtime-service'
import { getSFXProviderDisplayLabel, isMMAudioProviderKey } from '../providers/sfx/sfx-provider-contracts'

interface ProjectSFXGateState {
  creditEstimate?: CreditEstimateRecord
  creditEstimateLines: CreditEstimateLineItemRecord[]
  creditApproval?: CreditApprovalRecord
  creditReservation?: CreditReservationRecord
  warnings: string[]
}

const DEFAULT_WORKSPACE_ID = 'mock-workspace-reeditpro'
const DEFAULT_USER_ID = 'mock-user-reeditpro'

function normalizeWorkspaceId(input: CreateEditProjectSFXIntegrationRequest): string {
  return input.workspaceId ?? DEFAULT_WORKSPACE_ID
}

function instructionText(input: CreateEditProjectSFXIntegrationRequest): string {
  return [
    input.videoTone,
    ...(input.userInstructions ?? []),
    ...(input.avoidInstructions ?? []),
  ].join(' ').toLowerCase()
}

function speechPresent(input: CreateEditProjectSFXIntegrationRequest): boolean {
  const text = instructionText(input)
  return !/montage only|no speech|silent montage|fitness beat/i.test(text)
}

function musicPresent(input: CreateEditProjectSFXIntegrationRequest): boolean {
  const text = instructionText(input)
  return !/no music|voice only/i.test(text)
}

function ambienceImportant(input: CreateEditProjectSFXIntegrationRequest): boolean {
  const text = instructionText(input)
  return /lifestyle|vacation|lake como|faith|serious|teaching|luxury|real estate|ambience|natural/i.test(text)
}

function plannedEventPlans(eventPlans: SFXEventPlanRecord[]): SFXEventPlanRecord[] {
  return eventPlans.filter((eventPlan) =>
    eventPlan.decisionState !== 'avoid' &&
    eventPlan.decisionState !== 'not_needed'
  )
}

function promptablePlans(promptPlans: SFXPromptPlanRecord[]): SFXPromptPlanRecord[] {
  return promptPlans.filter((promptPlan) => promptPlan.provider !== 'no_sfx')
}

function estimateCreditsForPromptPlan(promptPlan: SFXPromptPlanRecord): number {
  if (promptPlan.provider === 'mirelo_sfx_v1_5') return 8
  if (isMMAudioProviderKey(promptPlan.provider)) return 4
  if (promptPlan.provider === 'reeditpro_internal_library') return 2
  return 1
}

function providerLabel(provider: SFXPromptPlanRecord['provider']): string {
  if (provider === 'mirelo_sfx_v1_5') return 'Mirelo production SFX'
  if (isMMAudioProviderKey(provider)) return 'MMAudio V2 draft/fallback SFX'
  if (provider === 'reeditpro_internal_library') return 'Internal library SFX search'
  return 'SoundSync SFX planning'
}

function buildCreditLines(promptPlans: SFXPromptPlanRecord[]): CreditEstimateRuntimeLineInput[] {
  return promptablePlans(promptPlans).flatMap((promptPlan) => [
    {
      lineItemType: 'sfx',
      usageCategory: 'soundsync',
      label: providerLabel(promptPlan.provider),
      description: `Project SFX cue ${promptPlan.sfxEventPlanId} remains approval-gated and mock-only.`,
      estimatedCredits: estimateCreditsForPromptPlan(promptPlan),
      providerHint: promptPlan.provider,
      modelHint: promptPlan.modelName,
      isPremium: promptPlan.provider === 'mirelo_sfx_v1_5',
    },
    {
      lineItemType: 'soundsync',
      usageCategory: 'soundsync',
      label: 'SFX trim, hit alignment, mix, and QA',
      description: 'Mock SoundSync post-generation planning for one project SFX cue.',
      estimatedCredits: 2,
      providerHint: 'sfx_worker_skeleton',
    },
  ])
}

function routeSummary(route: SFXProviderRouteRecord): string {
  if (route.recommendedProvider === 'no_sfx') {
    return `No SFX route for ${route.sfxEventPlanId}: ${route.reason}`
  }

  return `${route.sfxEventPlanId}: ${getSFXProviderDisplayLabel(route.recommendedProvider)}` +
    `${route.fallbackProvider ? ` with ${getSFXProviderDisplayLabel(route.fallbackProvider)} fallback` : ''}. ${route.reason}`
}

function ensureMockCredits(db: MockDatabase, workspaceId: string): string {
  const existingWallet = db.creditWallets.find((wallet) => wallet.workspaceId === workspaceId)
  if (existingWallet) {
    if (existingWallet.cachedAvailableCredits < 200) {
      existingWallet.cachedAvailableCredits = 200
      existingWallet.updatedAt = nowIso()
    }
    return existingWallet.id
  }

  const wallet = unwrapServiceResult(createCreditWallet(db, workspaceId, DEFAULT_USER_ID))
  unwrapServiceResult(grantWeeklyBonusCredits(db, wallet.id, 200))
  return wallet.id
}

function createGateState(
  db: MockDatabase,
  input: CreateEditProjectSFXIntegrationRequest,
  promptPlans: SFXPromptPlanRecord[],
): ProjectSFXGateState {
  const workspaceId = normalizeWorkspaceId(input)
  const lineItems = buildCreditLines(promptPlans)
  const warnings: string[] = []

  if (lineItems.length === 0) {
    return {
      creditEstimateLines: [],
      warnings: ['No SFX credit estimate was created because no promptable SFX generation is needed.'],
    }
  }

  ensureMockCredits(db, workspaceId)
  const estimateRuntime = unwrapServiceResult(createCreditEstimateRuntime(db, {
    workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    chatSessionId: input.chatSessionId,
    purpose: 'sfx_generation',
    estimateReason: 'Project-level mock SFX generation, timing, mix, and QA estimate.',
    lineItems,
  }))
  warnings.push(...estimateRuntime.warnings)

  let creditApproval: CreditApprovalRecord | undefined
  if (input.creditApproved) {
    const approvalResult = approveCreditEstimate(db, {
      workspaceId,
      projectId: input.projectId,
      creditEstimateId: estimateRuntime.creditEstimate.id,
      approvedByUserId: DEFAULT_USER_ID,
    })
    if (approvalResult.ok) {
      creditApproval = approvalResult.data
    } else {
      warnings.push(approvalResult.error.message)
    }
  } else {
    warnings.push('SFX generation is blocked until the project SFX credit estimate is approved.')
  }

  let creditReservation: CreditReservationRecord | undefined
  if (input.creditReserved && creditApproval) {
    const reservationResult = reserveCreditsForApprovedEstimate(db, {
      workspaceId,
      projectId: input.projectId,
      creditWalletId: db.creditWallets.find((wallet) => wallet.workspaceId === workspaceId)?.id,
      creditEstimateId: estimateRuntime.creditEstimate.id,
      creditApprovalId: creditApproval.id,
      editPlanId: input.editPlanId,
      requestedByUserId: DEFAULT_USER_ID,
      purpose: 'sfx_generation',
    })

    if (reservationResult.ok) {
      creditReservation = reservationResult.data.reservation
      warnings.push(...reservationResult.data.warnings)
    } else {
      warnings.push(reservationResult.error.message)
    }
  } else if (input.creditReserved && !creditApproval) {
    warnings.push('SFX credit reservation was requested but the estimate is not approved.')
  } else if (input.creditApproved) {
    warnings.push('SFX generation is blocked until credits are reserved.')
  }

  return {
    creditEstimate: estimateRuntime.creditEstimate,
    creditEstimateLines: estimateRuntime.lineItems,
    creditApproval,
    creditReservation,
    warnings,
  }
}

function generationCreditsForRequest(
  promptPlan: SFXPromptPlanRecord,
  creditEstimate?: CreditEstimateRecord,
): number {
  if (!creditEstimate) return estimateCreditsForPromptPlan(promptPlan)
  return Math.max(1, Math.ceil(creditEstimate.totalEstimatedCredits / 2))
}

function createQueueItemForJob(input: {
  db: MockDatabase
  workspaceId: string
  projectId: string
  editPlanId: string
  creditEstimateId?: string
  creditReservationId?: string
  generationRequestId?: string
  job: JobRecord
  promptPlan: SFXPromptPlanRecord
  providerRoute?: SFXProviderRouteRecord
}): JobRuntimeQueueItem {
  return queueMockJob(input.db, {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    creditEstimateId: input.creditEstimateId,
    creditReservationId: input.creditReservationId,
    generationRequestId: input.generationRequestId,
    jobId: input.job.id,
    workerKind: 'sfx_generation',
    requiresEditPlanApproval: true,
    requiresCreditEstimateApproval: true,
    requiresCreditReservation: true,
    requiresGenerationRequest: true,
    requiresProvider: true,
    providerRuntimeMode: 'mock',
    mockSafe: true,
    payload: {
      sfxEventPlanId: input.promptPlan.sfxEventPlanId,
      sfxPromptPlanId: input.promptPlan.id,
      sfxProviderRouteId: input.providerRoute?.id,
      provider: input.promptPlan.provider,
      projectSfxWorkflow: true,
    },
  })
}

function nextStepForIntegration(input: {
  sfxEventPlans: SFXEventPlanRecord[]
  promptPlans: SFXPromptPlanRecord[]
  creditReservation?: CreditReservationRecord
  generationRequests: GenerationRequestRecord[]
  jobQueueItems: JobRuntimeQueueItem[]
}): EditProjectSFXNextStep {
  if (plannedEventPlans(input.sfxEventPlans).length === 0 || promptablePlans(input.promptPlans).length === 0) {
    return 'no_sfx_needed'
  }

  if (!input.creditReservation) return 'await_sfx_credit_approval'
  if (input.generationRequests.length === 0) return 'queue_mock_sfx_generation'
  if (input.jobQueueItems.length > 0) return 'run_mock_sfx_worker'
  return 'queue_mock_sfx_generation'
}

export function createEditProjectSFXPlanFromEditPlan(
  db: MockDatabase,
  input: CreateEditProjectSFXIntegrationRequest,
): ServiceResult<Pick<CreateEditProjectSFXIntegrationResponse, 'sfxEventPlans' | 'providerRoutes' | 'warnings'>> {
  const result = createSFXDirectorPlan(db, {
    workspaceId: normalizeWorkspaceId(input),
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    userPrompt: [
      input.videoTone,
      ...(input.userInstructions ?? []),
    ].filter(Boolean).join(' '),
    videoType: input.videoTone,
    workflowContext: 'project_editing',
    editComplexity: input.editComplexity,
    transcriptSummary: speechPresent(input)
      ? 'Project edit has voice or dialogue sections that SFX must protect.'
      : 'Project edit is mostly music/visual rhythm with little or no speech.',
    sceneSummaries: input.userInstructions,
    audioEnvironmentSummary: ambienceImportant(input)
      ? 'Source ambience matters and should not be masked by generated SFX.'
      : 'No special ambience preservation instruction supplied.',
    musicPlanSummary: musicPresent(input)
      ? 'Music may carry pacing, but SFX remains voice-safe and edit-layer-only.'
      : 'Music is not expected to carry the project.',
    userSFXInstructions: input.userInstructions,
    avoidSFXInstructions: input.avoidInstructions,
    speechPresent: speechPresent(input),
    musicPresent: musicPresent(input),
    ambienceImportant: ambienceImportant(input),
  })

  if (!result.ok) return result

  return ok({
    sfxEventPlans: result.data.sfxEventPlans,
    providerRoutes: result.data.providerRoutes,
    warnings: result.data.warnings,
  }, result.warnings)
}

export function createEditProjectSFXProviderRoutes(
  sfxEventPlans: SFXEventPlanRecord[],
  providerRoutes: SFXProviderRouteRecord[],
): SFXProviderRouteRecord[] {
  return sfxEventPlans
    .map((eventPlan) => providerRoutes.find((route) => route.sfxEventPlanId === eventPlan.id))
    .filter((route): route is SFXProviderRouteRecord => Boolean(route))
}

export function createEditProjectSFXPromptPlans(
  db: MockDatabase,
  input: {
    sfxEventPlans: SFXEventPlanRecord[]
    providerRoutes: SFXProviderRouteRecord[]
    userInstructions?: string[]
    avoidInstructions?: string[]
  },
) {
  return createSFXPromptPlansForEvents(db, {
    sfxEventPlans: input.sfxEventPlans,
    providerRoutes: input.providerRoutes,
    userSFXInstructions: input.userInstructions,
    avoidSFXInstructions: input.avoidInstructions,
  })
}

export function createEditProjectSFXCreditEstimateLines(
  promptPlans: SFXPromptPlanRecord[],
): CreditEstimateRuntimeLineInput[] {
  return buildCreditLines(promptPlans)
}

export function createEditProjectSFXMockGenerationRequests(
  db: MockDatabase,
  input: {
    workspaceId: string
    projectId: string
    editPlanId: string
    creditEstimate?: CreditEstimateRecord
    creditReservation?: CreditReservationRecord
    promptPlans: SFXPromptPlanRecord[]
    editPlanApproved?: boolean
  },
): { generationRequests: GenerationRequestRecord[], warnings: string[] } {
  const generationRequests: GenerationRequestRecord[] = []
  const warnings: string[] = []

  if (!input.creditReservation) {
    return {
      generationRequests,
      warnings: ['SFX generation requests were not created because the credit reservation is missing.'],
    }
  }
  const creditReservation = input.creditReservation

  promptablePlans(input.promptPlans).forEach((promptPlan) => {
    const result = createSFXProviderGenerationRequestFromPromptPlan(db, {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editPlanId: input.editPlanId,
      creditReservationId: creditReservation.id,
      promptPlan,
      creditEstimateId: input.creditEstimate?.id,
      estimatedCredits: generationCreditsForRequest(promptPlan, input.creditEstimate),
      planApproved: input.editPlanApproved,
    })

    if (result.ok) {
      generationRequests.push(result.data)
    } else {
      warnings.push(result.error.message)
    }
  })

  return { generationRequests, warnings }
}

export function createEditProjectSFXWorkerJobs(
  db: MockDatabase,
  input: {
    workspaceId: string
    projectId: string
    editPlanId: string
    creditEstimate?: CreditEstimateRecord
    creditReservation?: CreditReservationRecord
    generationRequests: GenerationRequestRecord[]
    promptPlans: SFXPromptPlanRecord[]
    providerRoutes: SFXProviderRouteRecord[]
  },
): { jobs: JobRecord[], jobQueueItems: JobRuntimeQueueItem[], warnings: string[] } {
  const jobs: JobRecord[] = []
  const jobQueueItems: JobRuntimeQueueItem[] = []
  const warnings: string[] = []

  if (!input.creditReservation) {
    return {
      jobs,
      jobQueueItems,
      warnings: ['SFX worker jobs were not queued because credits are not reserved.'],
    }
  }
  const creditReservation = input.creditReservation

  input.generationRequests.forEach((generationRequest) => {
    const promptPlan = input.promptPlans.find((candidate) =>
      candidate.id === generationRequest.requestPayload?.['sfxPromptPlanId'] ||
      candidate.id === generationRequest.id ||
      generationRequest.prompt === candidate.prompt
    )
    const actualPromptPlan = promptPlan ?? input.promptPlans.find((candidate) =>
      candidate.id === generationRequest.requestPayload?.['sfxPromptPlanId']
    )

    if (!actualPromptPlan) {
      warnings.push(`Missing prompt plan for generation request ${generationRequest.id}.`)
      return
    }

    const providerRoute = input.providerRoutes.find((route) => route.id === actualPromptPlan.providerRouteId)
    const jobResult = createSFXGenerationJob(db, {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editPlanId: input.editPlanId,
      creditEstimateId: input.creditEstimate?.id,
      creditReservationId: creditReservation.id,
      generationRequestId: generationRequest.id,
      sfxEventPlanId: actualPromptPlan.sfxEventPlanId,
      sfxPromptPlanId: actualPromptPlan.id,
      sfxProviderRouteId: actualPromptPlan.providerRouteId,
    })

    if (!jobResult.ok) {
      warnings.push(jobResult.error.message)
      return
    }

    jobs.push(jobResult.data)
    jobQueueItems.push(createQueueItemForJob({
      db,
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      editPlanId: input.editPlanId,
      creditEstimateId: input.creditEstimate?.id,
      creditReservationId: creditReservation.id,
      generationRequestId: generationRequest.id,
      job: jobResult.data,
      promptPlan: actualPromptPlan,
      providerRoute,
    }))
  })

  return { jobs, jobQueueItems, warnings }
}

export function createEditProjectSFXPipelineSummary(result: EditProjectSFXIntegrationResult): string[] {
  const promptProviderLabels = result.promptPlans.map((promptPlan) => promptPlan.provider)
  const generatedCount = result.generationRequests.length
  const queuedCount = result.jobQueueItems.filter((item) => item.queueStatus === 'queued').length

  return [
    `${result.sfxEventPlans.length} project SFX event plan(s) created from the edit plan context.`,
    `Provider routes: ${result.providerRoutes.map((route) => route.recommendedProvider).join(', ') || 'none'}.`,
    `Prompt providers: ${promptProviderLabels.join(', ') || 'none because no SFX is needed'}.`,
    result.creditEstimate
      ? `${result.creditEstimate.totalEstimatedCredits} mock credit(s) estimated before SFX generation.`
      : 'No SFX credit estimate was needed.',
    `${generatedCount} mock generation request(s), ${queuedCount} queued mock SFX worker job(s).`,
    'Mock mode: ReeditPro has not called Mirelo or MMAudio yet.',
  ]
}

export function createEditProjectSFXIntegration(
  db: MockDatabase,
  input: CreateEditProjectSFXIntegrationRequest,
): ServiceResult<CreateEditProjectSFXIntegrationResponse> {
  if (input.mockOnly !== true) {
    return fail('MOCK_ONLY', 'Project SFX integration is mock-only in RP-FIX-14.')
  }

  const workspaceId = normalizeWorkspaceId(input)
  const planResult = createEditProjectSFXPlanFromEditPlan(db, input)
  if (!planResult.ok) return planResult

  const providerRoutes = createEditProjectSFXProviderRoutes(
    planResult.data.sfxEventPlans,
    planResult.data.providerRoutes,
  )
  const promptResult = unwrapServiceResult(createEditProjectSFXPromptPlans(db, {
    sfxEventPlans: planResult.data.sfxEventPlans,
    providerRoutes,
    userInstructions: input.userInstructions,
    avoidInstructions: input.avoidInstructions,
  }))
  const gateState = createGateState(db, input, promptResult.sfxPromptPlans)
  const generation = createEditProjectSFXMockGenerationRequests(db, {
    workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    creditEstimate: gateState.creditEstimate,
    creditReservation: gateState.creditReservation,
    promptPlans: promptResult.sfxPromptPlans,
    editPlanApproved: input.editPlanApproved,
  })
  const workerJobs = createEditProjectSFXWorkerJobs(db, {
    workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    creditEstimate: gateState.creditEstimate,
    creditReservation: gateState.creditReservation,
    generationRequests: generation.generationRequests,
    promptPlans: promptResult.sfxPromptPlans,
    providerRoutes,
  })

  const warnings = [
    ...planResult.data.warnings,
    ...promptResult.warnings,
    ...promptResult.validationWarnings,
    ...gateState.warnings,
    ...generation.warnings,
    ...workerJobs.warnings,
    'Project SFX workflow is local/mock-only; no provider API, Supabase, Cloud Run, storage, Stripe, or rendering call was made.',
  ]
  const nextStep = nextStepForIntegration({
    sfxEventPlans: planResult.data.sfxEventPlans,
    promptPlans: promptResult.sfxPromptPlans,
    creditReservation: gateState.creditReservation,
    generationRequests: generation.generationRequests,
    jobQueueItems: workerJobs.jobQueueItems,
  })
  const response: CreateEditProjectSFXIntegrationResponse = {
    sfxEventPlans: planResult.data.sfxEventPlans,
    providerRoutes,
    promptPlans: promptResult.sfxPromptPlans,
    skippedPromptPlans: promptResult.skippedPromptPlans,
    creditEstimate: gateState.creditEstimate,
    creditEstimateLines: gateState.creditEstimateLines,
    creditApproval: gateState.creditApproval,
    creditReservation: gateState.creditReservation,
    generationRequests: generation.generationRequests,
    jobs: workerJobs.jobs,
    jobQueueItems: workerJobs.jobQueueItems,
    providerRouteSummary: providerRoutes.map(routeSummary),
    creditGateSummary: [
      gateState.creditEstimate
        ? `Credit estimate ${gateState.creditEstimate.status}.`
        : 'No credit estimate needed.',
      gateState.creditApproval ? 'Credit estimate approved.' : 'Credit estimate not approved.',
      gateState.creditReservation ? 'Credits reserved for mock SFX generation.' : 'Credits not reserved.',
    ],
    nextStep,
    warnings,
  }

  return ok(response, warnings)
}

export function findProjectSFXEditPlan(
  db: MockDatabase,
  editPlanId: string,
): EditPlanRecord | undefined {
  return findMockRecord(db, 'editPlans', editPlanId)
}

export function createProjectSFXId(prefix: string): string {
  return createMockId(`project-sfx-${prefix}`)
}
