import type {
  CreditApprovalRecord,
  CreditEstimateRecord,
  CreditReservationRecord,
  EditPlanRecord,
  GenerationRequestRecord,
  SFXEventPlanRecord,
  SFXPromptPlanRecord,
  SFXProviderRouteRecord,
} from '../../types'
import type {
  SFXWorkerFailure,
  SFXWorkerInput,
  SFXWorkerMockRecordBundle,
  SFXWorkerValidationResult,
} from './sfx-worker-contracts'
import { assertCreditReservationMatchesRequest } from '../services/credit-approval-gate-service'

function pass(warnings: string[] = []): SFXWorkerValidationResult {
  return { ok: true, warnings }
}

function block(
  code: SFXWorkerFailure['code'],
  message: string,
  warnings: string[] = [],
  details?: unknown,
): SFXWorkerValidationResult {
  return {
    ok: false,
    failure: { code, message, details },
    warnings,
  }
}

function mergeValidationResults(results: SFXWorkerValidationResult[]): SFXWorkerValidationResult {
  const warnings = results.flatMap((result) => result.warnings)
  const failed = results.find((result) => !result.ok)

  if (!failed || failed.ok) {
    return pass(warnings)
  }

  return {
    ok: false,
    failure: failed.failure,
    warnings,
  }
}

function hasValue(value: string | undefined) {
  return Boolean(value && value.trim().length > 0)
}

function promptWarningsBlock(promptPlan: SFXPromptPlanRecord) {
  return promptPlan.promptWarnings.some((warning) =>
    /critical|forced_worker_block|prompt validation failed|unsafe for generation/i.test(warning),
  )
}

export function validateSFXWorkerInput(input: SFXWorkerInput): SFXWorkerValidationResult {
  if (!input.mockOnly) {
    return block('MOCK_ONLY', 'SFX worker skeleton can only run in mock mode.')
  }

  if (!hasValue(input.jobId)) return block('MISSING_JOB', 'SFX worker input requires a job ID.')
  if (!hasValue(input.sfxEventPlanId)) return block('MISSING_EVENT_PLAN', 'SFX worker input requires an SFX event plan ID.')
  if (!hasValue(input.sfxProviderRouteId)) return block('MISSING_PROVIDER_ROUTE', 'SFX worker input requires an SFX provider route ID.')
  if (!hasValue(input.sfxPromptPlanId)) return block('MISSING_PROMPT_PLAN', 'SFX worker input requires an SFX prompt plan ID.')
  if (!hasValue(input.generationRequestId)) return block('MISSING_GENERATION_REQUEST', 'SFX worker input requires a generation request ID.')
  if (!hasValue(input.creditReservationId)) return block('MISSING_CREDIT_RESERVATION', 'SFX worker input requires a credit reservation ID.')

  return pass()
}

export function validateSFXEditPlanApprovalForWorker(
  editPlan: EditPlanRecord | undefined,
): SFXWorkerValidationResult {
  if (!editPlan || editPlan.status !== 'approved') {
    return block('PLAN_NOT_APPROVED', 'Generation not allowed: edit plan is not approved.', [], {
      editPlanStatus: editPlan?.status ?? 'missing',
    })
  }

  return pass()
}

export function validateSFXCreditApprovalForWorker(
  creditEstimate: CreditEstimateRecord | undefined,
  creditApproval: CreditApprovalRecord | undefined,
): SFXWorkerValidationResult {
  if (!creditEstimate || creditEstimate.status !== 'approved') {
    return block('CREDITS_NOT_RESERVED', 'Generation not allowed: SFX credit estimate is not approved.', [], {
      creditEstimateStatus: creditEstimate?.status ?? 'missing',
    })
  }

  if (!creditApproval || creditApproval.status !== 'approved') {
    return block('CREDITS_NOT_RESERVED', 'Generation not allowed: SFX credit approval is missing or not approved.', [], {
      creditApprovalStatus: creditApproval?.status ?? 'missing',
    })
  }

  return pass()
}

export function validateSFXCreditReservationForWorker(
  reservation: CreditReservationRecord | undefined,
): SFXWorkerValidationResult {
  if (!reservation) {
    return block('MISSING_CREDIT_RESERVATION', 'Generation not allowed: SFX credits are not approved and reserved.')
  }

  if (reservation.status !== 'reserved') {
    return block('CREDITS_NOT_RESERVED', 'Generation not allowed: SFX credits are not approved and reserved.', [], {
      reservationStatus: reservation.status,
    })
  }

  return pass()
}

export function validateSFXSharedCreditGateForWorker(
  input: SFXWorkerInput,
  records: SFXWorkerMockRecordBundle,
): SFXWorkerValidationResult {
  const gate = assertCreditReservationMatchesRequest(records.creditReservation, {
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editPlanId: input.editPlanId,
    creditEstimateId: records.creditEstimate?.id ?? records.generationRequest?.creditEstimateId,
    creditReservationId: input.creditReservationId,
    requestedByUserId: input.requestedByUserId,
    purpose: 'sfx_generation',
    estimatedCredits: records.creditEstimate?.totalEstimatedCredits ?? records.generationRequest?.estimatedCredits ?? 6,
    requiresApproval: true,
  })

  if (!gate.ok) {
    return block('CREDITS_NOT_RESERVED', gate.message, gate.warnings, gate)
  }

  return pass(gate.warnings)
}

export function validateSFXGenerationRequestForWorker(
  request: GenerationRequestRecord | undefined,
): SFXWorkerValidationResult {
  if (!request) {
    return block('MISSING_GENERATION_REQUEST', 'Generation not allowed: SFX generation request is missing.')
  }

  if (request.status !== 'approved' && request.status !== 'queued') {
    return block('PLAN_NOT_APPROVED', 'Generation not allowed: SFX generation request must be approved or queued.', [], {
      generationRequestStatus: request.status,
    })
  }

  const warnings: string[] = []
  if (request.requestType !== 'sfx_asset' && request.requestType !== 'soundsync_audio') {
    warnings.push('SFX worker generation request should be an sfx_asset or soundsync_audio request.')
  }
  if (request.providerType !== 'google_cloud_worker') {
    warnings.push('SFX worker generation request should target the future Google Cloud worker boundary.')
  }

  return pass(warnings)
}

export function validateSFXEventPlanForWorker(
  eventPlan: SFXEventPlanRecord | undefined,
  input?: SFXWorkerInput,
): SFXWorkerValidationResult {
  if (!eventPlan) {
    return block('MISSING_EVENT_PLAN', 'Generation not allowed: SFX event plan is missing.')
  }

  if (eventPlan.decisionState === 'avoid') {
    return block('SFX_DECISION_AVOID', 'Generation not allowed: SFX decision is avoid.', [], {
      sfxEventPlanId: eventPlan.id,
    })
  }

  if (eventPlan.decisionState === 'not_needed') {
    return block('SFX_DECISION_NOT_NEEDED', 'Generation not allowed: SFX decision is not needed.', [], {
      sfxEventPlanId: eventPlan.id,
    })
  }

  if (eventPlan.decisionState === 'needs_user_confirmation' && !input?.userConfirmationApproved) {
    return block('PLAN_NOT_APPROVED', 'Generation not allowed: SFX still needs user confirmation.', [], {
      decisionState: eventPlan.decisionState,
    })
  }

  if (
    eventPlan.targetLayer === 'source_footage_repair' &&
    !input?.sourceFootageApproved &&
    eventPlan.sourceFootagePolicy !== 'allow_source_repair' &&
    eventPlan.sourceFootagePolicy !== 'allow_full_sound_design' &&
    eventPlan.sourceFootagePolicy !== 'user_requested_source_sfx'
  ) {
    return block('PROMPT_VALIDATION_FAILED', 'Generation not allowed: source-footage SFX policy is not approved.', [], {
      sourceFootagePolicy: eventPlan.sourceFootagePolicy,
    })
  }

  return pass()
}

export function validateSFXProviderRouteForWorker(
  providerRoute: SFXProviderRouteRecord | undefined,
  eventPlan?: SFXEventPlanRecord,
): SFXWorkerValidationResult {
  if (!providerRoute) {
    return block('MISSING_PROVIDER_ROUTE', 'Generation not allowed: SFX provider route is missing.')
  }

  if (providerRoute.recommendedProvider === 'no_sfx') {
    return block('SFX_DECISION_NOT_NEEDED', 'Generation not allowed: provider route selected no SFX.', [], {
      recommendedProvider: providerRoute.recommendedProvider,
    })
  }

  if (eventPlan && providerRoute.sfxEventPlanId !== eventPlan.id) {
    return block('MISSING_PROVIDER_ROUTE', 'Generation not allowed: provider route does not match the SFX event plan.', [], {
      routeEventPlanId: providerRoute.sfxEventPlanId,
      eventPlanId: eventPlan.id,
    })
  }

  return pass()
}

export function validateSFXPromptPlanForWorker(
  promptPlan: SFXPromptPlanRecord | undefined,
  providerRoute?: SFXProviderRouteRecord,
): SFXWorkerValidationResult {
  if (!promptPlan) {
    return block('MISSING_PROMPT_PLAN', 'Generation not allowed: SFX prompt plan is missing.')
  }

  if (promptPlan.provider === 'no_sfx') {
    return block('SFX_DECISION_NOT_NEEDED', 'Generation not allowed: SFX prompt plan selected no SFX.', [], {
      promptProvider: promptPlan.provider,
    })
  }

  if (providerRoute && promptPlan.providerRouteId !== providerRoute.id) {
    return block('MISSING_PROMPT_PLAN', 'Generation not allowed: prompt plan does not match provider route.', [], {
      promptProviderRouteId: promptPlan.providerRouteId,
      providerRouteId: providerRoute.id,
    })
  }

  if (!['planned', 'approved', 'queued'].includes(promptPlan.status)) {
    return block('PROMPT_VALIDATION_FAILED', 'Generation not allowed: SFX prompt plan is not planned, approved, or queued.', [], {
      promptStatus: promptPlan.status,
    })
  }

  if (promptWarningsBlock(promptPlan)) {
    return block('PROMPT_VALIDATION_FAILED', 'Generation not allowed: SFX prompt validation has a blocking warning.', [], {
      promptWarnings: promptPlan.promptWarnings,
    })
  }

  if (promptPlan.provider !== 'reeditpro_internal_library' && promptPlan.durationToGenerateSeconds < promptPlan.durationNeededSeconds) {
    return block('PROMPT_VALIDATION_FAILED', 'Generation not allowed: generated duration is shorter than needed duration.', [], {
      durationNeededSeconds: promptPlan.durationNeededSeconds,
      durationToGenerateSeconds: promptPlan.durationToGenerateSeconds,
    })
  }

  return pass()
}

export function validateSFXDecisionStateForWorker(
  eventPlan: SFXEventPlanRecord | undefined,
  input?: SFXWorkerInput,
): SFXWorkerValidationResult {
  return validateSFXEventPlanForWorker(eventPlan, input)
}

export function validateSFXGenerationGate(
  input: SFXWorkerInput,
  records: SFXWorkerMockRecordBundle,
): SFXWorkerValidationResult {
  return mergeValidationResults([
    validateSFXWorkerInput(input),
    records.job ? pass() : block('MISSING_JOB', 'Generation not allowed: SFX worker job is missing.'),
    validateSFXEditPlanApprovalForWorker(records.editPlan),
    validateSFXCreditApprovalForWorker(records.creditEstimate, records.creditApproval),
    validateSFXCreditReservationForWorker(records.creditReservation),
    validateSFXSharedCreditGateForWorker(input, records),
    validateSFXGenerationRequestForWorker(records.generationRequest),
    validateSFXEventPlanForWorker(records.sfxEventPlan, input),
    validateSFXProviderRouteForWorker(records.sfxProviderRoute, records.sfxEventPlan),
    validateSFXPromptPlanForWorker(records.sfxPromptPlan, records.sfxProviderRoute),
  ])
}
