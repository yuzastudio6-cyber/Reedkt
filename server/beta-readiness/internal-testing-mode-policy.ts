import type { InternalTestingModeDecision } from './beta-readiness-types'

export interface EvaluateInternalTestingModeOptions {
  e2eDryRunPassed?: boolean
  safetyDocsExist?: boolean
  costDocsExist?: boolean
  authSignInAvailable?: boolean
  mockOrTestCreditsAvailable?: boolean
  boundedToolExecutionEvidenceReady?: boolean
}

const internalTestingGuardrails = [
  'auth_required_for_internal_testers',
  'approved_plan_snapshot_required_before_expensive_work',
  'approved_credit_estimate_required_before_expensive_work',
  'credit_reservation_required_before_expensive_work',
  'mock_or_test_credits_only',
  'idempotent_job_and_cost_event_required',
  'private_artifact_manifest_required',
  'no_raw_prompts_as_execution_source',
  'no_secrets_or_signed_urls_as_source_truth',
  'frontend_must_not_run_heavy_tools',
  'external_users_blocked',
  'paid_billing_blocked',
  'production_launch_blocked',
] as const

const internalTestingAllowedScopes = [
  'signed_in_internal_testing',
  'repeated_break_fix_iteration',
  'local_dev_fixture_testing',
  'internal_dry_run_e2e',
  'mock_or_test_credit_estimates',
  'approved_snapshot_gate_testing',
  'tool_readiness_diagnostics',
  'bounded_tool_execution_evidence_collection',
  'private_artifact_manifest_validation',
  'operator_status_readback',
] as const

const internalTestingBlockedScopes = [
  'external_beta_launch',
  'real_user_media_beta',
  'paid_user_onboarding',
  'live_billing_or_stripe_charges',
  'production_credit_wallet_mutation',
  'public_artifact_delivery',
  'production_launch',
] as const

export function evaluateInternalTestingMode(
  options: EvaluateInternalTestingModeOptions = {},
): InternalTestingModeDecision {
  const e2eDryRunPassed = options.e2eDryRunPassed ?? true
  const safetyDocsExist = options.safetyDocsExist ?? true
  const costDocsExist = options.costDocsExist ?? true
  const authSignInAvailable = options.authSignInAvailable ?? true
  const mockOrTestCreditsAvailable = options.mockOrTestCreditsAvailable ?? true
  const blockers = [
    ...(e2eDryRunPassed ? [] : ['Internal dry-run E2E baseline has not passed.']),
    ...(safetyDocsExist ? [] : ['Internal safety docs are missing.']),
    ...(costDocsExist ? [] : ['Internal cost/credit docs are missing.']),
    ...(authSignInAvailable ? [] : ['Internal tester sign-in path is not available.']),
    ...(mockOrTestCreditsAvailable ? [] : ['Mock/test credit mode is not available.']),
  ]
  const allowed = blockers.length === 0
  const boundedToolExecutionTestingAllowed = allowed && options.boundedToolExecutionEvidenceReady === true

  return {
    stage: 'internal_break_fix_testing',
    allowed,
    signInTestingAllowed: allowed,
    repeatedBreakFixTestingAllowed: allowed,
    boundedToolExecutionTestingAllowed,
    paidUsersRequired: false,
    liveBillingAllowed: false,
    externalUsersAllowed: false,
    realUserMediaAllowed: false,
    mockOrTestCreditsOnly: true,
    allowedScopes: [...internalTestingAllowedScopes],
    blockedScopes: [...internalTestingBlockedScopes],
    guardrails: [...internalTestingGuardrails],
    blockers,
    warnings: [
      'Internal testing can be used to break, fix, and retest the product without paid users.',
      'Bounded tool execution testing still requires the selected tool evidence path and approved backend gates.',
      'Real user media, external beta, and paid production remain separate approval stages.',
    ],
  }
}
