import {
  assertSFXRealModeAllowed,
  getSFXProviderConfig,
} from './sfx-provider-config'
import type {
  SFXProviderKey,
  SFXProviderSafetyGateInput,
  SFXProviderSafetyGateResult,
} from './sfx-provider-contracts'
import { normalizeSFXProviderKey } from './sfx-provider-contracts'

function pass(message = 'SFX provider safety gates passed.', warnings: string[] = []): SFXProviderSafetyGateResult {
  return { ok: true, message, warnings }
}

function block(code: string, message: string, warnings: string[] = []): SFXProviderSafetyGateResult {
  return { ok: false, code, message, warnings }
}

function promptWarningsBlock(warnings: string[]) {
  return warnings.some((warning) =>
    /critical|forced_worker_block|prompt validation failed|unsafe for generation/i.test(warning),
  )
}

function providerKey(input: SFXProviderSafetyGateInput): SFXProviderKey {
  const provider = input.promptPlan?.provider ?? input.providerRoute?.recommendedProvider ?? 'no_sfx'
  return normalizeSFXProviderKey(provider)
}

export function assertSFXPromptPlanAllowed(input: SFXProviderSafetyGateInput): SFXProviderSafetyGateResult {
  if (!input.promptPlan) {
    return block('MISSING_PROMPT_PLAN', 'SFX provider call blocked: prompt plan is missing.')
  }

  if (!['planned', 'approved', 'queued'].includes(input.promptPlan.status)) {
    return block('PROMPT_NOT_READY', 'SFX provider call blocked: prompt plan is not planned, approved, or queued.')
  }

  if (input.promptPlan.provider === 'no_sfx') {
    return block('SFX_NO_PROVIDER_SELECTED', 'SFX provider call blocked: prompt plan selected no SFX.')
  }

  if (promptWarningsBlock(input.promptPlan.promptWarnings)) {
    return block('PROMPT_VALIDATION_FAILED', 'SFX provider call blocked: prompt plan has a critical validation warning.')
  }

  if (
    input.promptPlan.provider !== 'reeditpro_internal_library' &&
    input.promptPlan.durationToGenerateSeconds < input.promptPlan.durationNeededSeconds
  ) {
    return block('PROMPT_DURATION_INVALID', 'SFX provider call blocked: generation duration is shorter than needed duration.')
  }

  return pass()
}

export function assertSFXCreditsReserved(input: SFXProviderSafetyGateInput): SFXProviderSafetyGateResult {
  if (!input.creditReservation) {
    return block('MISSING_CREDIT_RESERVATION', 'SFX provider call blocked: credit reservation is missing.')
  }

  if (input.creditReservation.status !== 'reserved') {
    return block('CREDITS_NOT_RESERVED', 'SFX provider call blocked: credits are not reserved.')
  }

  return pass()
}

export function assertSFXEditPlanApproved(input: SFXProviderSafetyGateInput): SFXProviderSafetyGateResult {
  if (!input.editPlan) return pass('SFX edit plan approval was already enforced by worker validation.')

  if (input.editPlan.status !== 'approved') {
    return block('PLAN_NOT_APPROVED', 'SFX provider call blocked: edit plan is not approved.')
  }

  return pass()
}

export function assertSFXProviderRouteAllowed(input: SFXProviderSafetyGateInput): SFXProviderSafetyGateResult {
  if (!input.providerRoute) {
    return block('MISSING_PROVIDER_ROUTE', 'SFX provider call blocked: provider route is missing.')
  }

  if (input.providerRoute.recommendedProvider === 'no_sfx') {
    return block('SFX_NO_PROVIDER_SELECTED', 'SFX provider call blocked: provider route selected no SFX.')
  }

  if (input.eventPlan && input.providerRoute.sfxEventPlanId !== input.eventPlan.id) {
    return block('PROVIDER_ROUTE_MISMATCH', 'SFX provider call blocked: provider route does not match event plan.')
  }

  return pass()
}

export function assertSFXDecisionAllowsGeneration(input: SFXProviderSafetyGateInput): SFXProviderSafetyGateResult {
  if (!input.eventPlan) {
    return block('MISSING_EVENT_PLAN', 'SFX provider call blocked: event plan is missing.')
  }

  if (input.eventPlan.decisionState === 'avoid') {
    return block('SFX_DECISION_AVOID', 'SFX provider call blocked: SFX decision is avoid.')
  }

  if (input.eventPlan.decisionState === 'not_needed') {
    return block('SFX_DECISION_NOT_NEEDED', 'SFX provider call blocked: SFX decision is not needed.')
  }

  return pass()
}

export function assertSFXSourceFootagePolicySafe(input: SFXProviderSafetyGateInput): SFXProviderSafetyGateResult {
  if (!input.eventPlan) {
    return block('MISSING_EVENT_PLAN', 'SFX provider call blocked: event plan is missing.')
  }

  if (
    input.eventPlan.targetLayer === 'source_footage_repair' &&
    !input.sourceFootageApproved &&
    input.eventPlan.sourceFootagePolicy !== 'allow_source_repair' &&
    input.eventPlan.sourceFootagePolicy !== 'allow_full_sound_design' &&
    input.eventPlan.sourceFootagePolicy !== 'user_requested_source_sfx'
  ) {
    return block('SOURCE_FOOTAGE_POLICY_CONFLICT', 'SFX provider call blocked: source-footage SFX policy is not approved.')
  }

  return pass()
}

export function assertSFXGenerationRequestReady(input: SFXProviderSafetyGateInput): SFXProviderSafetyGateResult {
  if (!input.generationRequest) {
    return block('MISSING_GENERATION_REQUEST', 'SFX provider call blocked: generation request is missing.')
  }

  if (input.generationRequest.status !== 'approved' && input.generationRequest.status !== 'queued') {
    return block('GENERATION_REQUEST_NOT_READY', 'SFX provider call blocked: generation request must be approved or queued.')
  }

  return pass()
}

export function assertSFXProviderCallAllowed(input: SFXProviderSafetyGateInput): SFXProviderSafetyGateResult {
  if (input.mode === 'disabled') {
    return block('SFX_PROVIDER_INTEGRATION_DISABLED', 'SFX provider integration disabled.')
  }

  const mode = input.mode ?? 'mock'
  if (mode === 'real') {
    const realMode = assertSFXRealModeAllowed(getSFXProviderConfig({ mode }), providerKey(input))
    if (!realMode.ok) {
      return block(
        realMode.error?.code ?? 'SFX_REAL_MODE_BLOCKED',
        realMode.error?.message ?? 'Real SFX provider mode is blocked.',
        realMode.warnings ?? [],
      )
    }
  }

  const checks = [
    assertSFXDecisionAllowsGeneration(input),
    assertSFXProviderRouteAllowed(input),
    assertSFXPromptPlanAllowed(input),
    assertSFXGenerationRequestReady(input),
    assertSFXCreditsReserved(input),
    assertSFXEditPlanApproved(input),
    assertSFXSourceFootagePolicySafe(input),
  ]
  const warnings = checks.flatMap((check) => check.warnings)
  const failed = checks.find((check) => !check.ok)

  if (failed) {
    return {
      ...failed,
      warnings,
    }
  }

  return pass('SFX provider safety gates passed.', warnings)
}
