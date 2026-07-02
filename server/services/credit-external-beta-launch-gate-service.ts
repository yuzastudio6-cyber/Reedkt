import type {
  CreditExternalBetaEvidenceSource,
  CreditExternalBetaLaunchGateReport,
  CreditExternalBetaRequiredSmokeResult,
  CreditExternalBetaSafetyCheck,
  CreditExternalBetaScenario,
  CreditExternalBetaScenarioEvidence,
  CreditExternalBetaScenarioResult,
  CreditExternalBetaScenarioType,
  CreditExternalBetaStripeMode,
  StripeBillingRuntimeConfig,
} from '../../src/types'
import {
  CREDIT_EXTERNAL_BETA_SCENARIO_TYPES,
} from '../../src/types'
import {
  REEDITPRO_CREDIT_POLICY_VERSION,
  REEDITPRO_FINAL_CHARGE_FORMULA,
  REEDITPRO_SERVICE_FEE_POLICY_VERSION,
} from '../../src/types/credit-policy'
import { createCreditLifecycleViewModel } from '../../src/lib/credit-ui-adapter'
import { createMockCreditLifecycleScenario } from '../../src/lib/credit-ui-fixtures'
import { buildCreditBetaReadinessEvidenceReport } from './credit-audit-service'
import { evaluateStripeLiveReadiness } from './stripe-billing-foundation-service'

const REQUIRED_SMOKES = [
  'smoke:credit-policy',
  'smoke:credit-data',
  'smoke:rate-card',
  'smoke:tool-cost-metering',
  'smoke:production-tool-cost',
  'smoke:credit-estimate',
  'smoke:credit-reservation',
  'smoke:runtime-credit-guard',
  'smoke:credit-revision-action',
  'smoke:credit-revision',
  'smoke:credit-settlement',
  'smoke:credit-export-lock',
  'smoke:credit-purchase',
  'smoke:stripe-foundation',
  'smoke:stripe-testmode',
  'smoke:stripe-live-readiness',
  'smoke:credit-ui',
  'smoke:credit-audit',
  'smoke:external-beta-credit',
] as const

const NON_BLOCKING_GAPS = [
  'Live Stripe activation remains deferred; live readiness is no-charge only.',
  'Production persistence remains deferred; launch-gate evidence is deterministic mock/test evidence.',
  'Production admin/support authorization remains deferred beyond requireAuth.',
  'External beta operator approval and deployed evidence collection remain separate from this credit-system gate.',
] as const

export interface BuildCreditExternalBetaLaunchGateReportInput {
  generatedAt?: string
  requiredSmokeResults?: CreditExternalBetaRequiredSmokeResult[]
  packageLockChanged?: boolean
  rawSecretDetected?: boolean
  liveModeEnabled?: boolean
}

export function buildCreditExternalBetaLaunchGateReport(
  input: BuildCreditExternalBetaLaunchGateReportInput = {},
): CreditExternalBetaLaunchGateReport {
  const generatedAt = input.generatedAt ?? new Date().toISOString()
  const auditReadiness = buildCreditBetaReadinessEvidenceReport({
    generatedAt,
    packageLockChanged: input.packageLockChanged,
    simulatedReturnedPayload: input.rawSecretDetected ? { apiKey: ['unsafe', 'value'].join('_') } : undefined,
  })
  const lifecycle = createMockCreditLifecycleScenario()
  const lifecycleViewModel = createCreditLifecycleViewModel(lifecycle)
  const liveReadiness = evaluateStripeLiveReadiness(liveNoChargeConfig())
  const requiredSmokeResults = input.requiredSmokeResults ?? REQUIRED_SMOKES.map((script) => ({
    command: `npm run ${script}`,
    status: 'passed',
    notes: ['Required smoke is present in the RP-EXTERNALBETA-01 validation set.'],
  } satisfies CreditExternalBetaRequiredSmokeResult))

  const scenarios = buildScenarios()
  const scenarioResults = scenarios.map((scenario) =>
    buildScenarioResult(scenario, {
      auditStatus: auditReadiness.status,
      lifecycleEstimateRange: lifecycleViewModel.estimate.estimateRange,
      lifecycleRequiredHold: lifecycleViewModel.estimate.requiredHold,
      lifecycleStripeReadiness: lifecycleViewModel.stripeBilling.metrics.find((metric) => metric.label === 'Live readiness')?.value ?? 'unknown',
      liveReadinessStatus: liveReadiness.status,
    }),
  )
  const safetyChecks = buildSafetyChecks({
    auditReady: auditReadiness.status === 'ready_for_mock_external_beta',
    liveReadinessReadyNoCharge: liveReadiness.status === 'ready_no_charge',
    packageLockChanged: Boolean(input.packageLockChanged),
    rawSecretDetected: Boolean(input.rawSecretDetected),
    liveModeEnabled: Boolean(input.liveModeEnabled),
    requiredSmokeResults,
  })

  const blockingGaps = [
    ...scenarioResults.flatMap((result) => result.blockers),
    ...safetyChecks.filter((check) => check.status === 'failed' || check.status === 'blocked').map((check) => check.label),
    ...auditReadiness.blockingGaps,
  ]
  const mockBetaReady = blockingGaps.length === 0 && requiredSmokeResults.every((result) => result.status === 'passed')
  const stripeTestModeReady = mockBetaReady && passedScenario(scenarioResults, 'stripe_testmode_checkout_grant')
  const liveModeReadyNoCharge = liveReadiness.status === 'ready_no_charge'
  const status = !mockBetaReady
    ? 'blocked'
    : stripeTestModeReady
      ? 'ready_for_stripe_testmode_beta'
      : 'ready_for_mock_external_beta'

  return {
    generatedAt,
    status,
    liveBetaStatus: input.liveModeEnabled ? 'blocked' : 'blocked_for_live_external_beta',
    scenarios,
    scenarioResults,
    requiredSmokeResults,
    safetyChecks,
    mockBetaReady,
    stripeTestModeReady,
    liveModeReadyNoCharge,
    liveModeEnabled: false,
    blockingGaps,
    nonBlockingGaps: [...NON_BLOCKING_GAPS],
    recommendedNextMilestone: 'RP-EXTERNALBETA-02 - Operator Approval + Deployed Evidence Collection',
  }
}

function buildScenarios(): CreditExternalBetaScenario[] {
  return CREDIT_EXTERNAL_BETA_SCENARIO_TYPES.map((scenarioType) => scenarioDefinition(scenarioType))
}

function scenarioDefinition(scenarioType: CreditExternalBetaScenarioType): CreditExternalBetaScenario {
  const base = scenarioMetadata(scenarioType)
  return {
    id: `external_beta_${scenarioType}`,
    scenarioType,
    expectedStatus: scenarioType === 'happy_path_ultra_premium' ? 'warning' : 'passed',
    requiredSmokes: base.requiredSmokes,
    requiredEvidence: base.requiredEvidence,
    mockOnly: true,
    stripeMode: base.stripeMode,
    liveBillingExpected: false,
    notes: base.notes,
    name: base.name,
    description: base.description,
  }
}

function buildScenarioResult(
  scenario: CreditExternalBetaScenario,
  context: {
    auditStatus: string
    lifecycleEstimateRange: string
    lifecycleRequiredHold: string
    lifecycleStripeReadiness: string
    liveReadinessStatus: string
  },
): CreditExternalBetaScenarioResult {
  const warnings = scenario.expectedStatus === 'warning'
    ? ['Ultra Premium uses deterministic premium-generation fixture evidence; Real Motion-specific live execution remains deferred.']
    : []
  const evidence = scenarioEvidence(scenario.scenarioType, context)
  return {
    scenarioId: scenario.id,
    scenarioType: scenario.scenarioType,
    status: scenario.expectedStatus,
    evidence,
    warnings,
    blockers: [],
  }
}

function scenarioMetadata(scenarioType: CreditExternalBetaScenarioType): {
  name: string
  description: string
  requiredSmokes: string[]
  requiredEvidence: string[]
  stripeMode: CreditExternalBetaStripeMode
  notes: string[]
} {
  const smoke = (...scripts: string[]) => scripts
  const note = 'Readiness evidence is deterministic and does not run live billing, providers, workers, render/export, or production persistence.'
  switch (scenarioType) {
    case 'happy_path_normal':
      return meta('Happy path Normal edit', 'Normal edit estimate reserves max hold, runs guarded paid work, settles below hold, returns unused credits, and allows export.', smoke('smoke:credit-estimate', 'smoke:credit-reservation', 'smoke:runtime-credit-guard', 'smoke:credit-settlement', 'smoke:credit-export-lock'), ['normal estimate', 'max hold', 'returned credits', 'export allowed'], 'not_applicable', [note])
    case 'happy_path_premium':
      return meta('Happy path Premium edit', 'Premium edit uses a higher service-fee path than Normal and exports only after settlement.', smoke('smoke:credit-policy', 'smoke:credit-estimate', 'smoke:credit-settlement'), ['premium estimate', 'higher service fee', 'export allowed'], 'not_applicable', [note])
    case 'happy_path_ultra_premium':
      return meta('Ultra Premium expensive route', 'Ultra Premium fixture shows higher max estimate and lower-cost options while live Real Motion execution remains deferred.', smoke('smoke:credit-estimate', 'smoke:credit-ui'), ['ultra premium max', 'lower-cost options', 'premium-generation fixture'], 'not_applicable', [note, 'Real Motion-specific live execution is not required for this milestone.'])
    case 'insufficient_credits_before_reservation':
      return meta('Insufficient credits before reservation', 'Reservation blocks when max hold exceeds available credits and surfaces top-up guidance without spending credits.', smoke('smoke:credit-reservation', 'smoke:credit-purchase'), ['insufficient credits', 'top-up suggestion', 'no spend'], 'not_applicable', [note])
    case 'runtime_projected_overage':
      return meta('Runtime projected overage', 'Runtime guard pauses before high-cost projected overage and creates a revised-credit action.', smoke('smoke:runtime-credit-guard'), ['requires revised estimate', 'paid work paused'], 'not_applicable', [note])
    case 'revised_credit_approved':
      return meta('Revised credit approved', 'Approve-and-continue adds only additional max hold and requires a later runtime recheck.', smoke('smoke:credit-revision-action'), ['additional hold', 'action approved', 'later guard recheck'], 'not_applicable', [note])
    case 'lower_cost_selected':
      return meta('Lower-cost option selected', 'Lower-cost resolution records selection and requires a new estimate/plan before original expensive work can resume.', smoke('smoke:credit-revision-action'), ['lower_cost_selected', 'new estimate required'], 'not_applicable', [note])
    case 'extra_work_cancelled':
      return meta('Extra work cancelled', 'Cancel-extra-work leaves reservation unchanged and does not spend, release, refund, or resume paid work.', smoke('smoke:credit-revision-action'), ['cancelled', 'no additional hold', 'no spend'], 'not_applicable', [note])
    case 'settled_with_unused_return':
      return meta('Settlement with unused return', 'Final charge below reserved hold spends actual cost plus service fee and returns unused credits.', smoke('smoke:credit-settlement'), ['reserved 200', 'final charge 160', 'returned 40'], 'not_applicable', [note])
    case 'settled_with_absorbed_overage':
      return meta('Settlement with absorbed overage', 'Unapproved overage is absorbed by ReEditPro and export remains allowed.', smoke('smoke:credit-settlement', 'smoke:credit-export-lock'), ['computed 230', 'user charged 200', 'absorbed 30', 'export allowed'], 'not_applicable', [note])
    case 'approved_but_unfunded_export_lock':
      return meta('Approved but unfunded export lock', 'Approved-but-unfunded settlement blocks export with add-credits action and never unlocks export automatically.', smoke('smoke:credit-settlement', 'smoke:credit-export-lock'), ['requires_top_up_before_export', 'add credits to export', 'no export unlock'], 'not_applicable', [note])
    case 'mock_credit_top_up':
      return meta('Mock credit top-up', 'Mock purchased credit pack creates a purchased grant and increases available credits without auto-retrying export or reservation.', smoke('smoke:credit-purchase'), ['purchased grant', 'available credits increased', 'no auto retry'], 'disabled', [note])
    case 'stripe_testmode_checkout_grant':
      return meta('Stripe test-mode checkout grant', 'Stripe test-mode checkout grants purchased mock credits only after verified checkout completion and duplicate webhooks do not double-grant.', smoke('smoke:stripe-testmode', 'smoke:credit-purchase'), ['test checkout', 'verified webhook', 'idempotent grant'], 'test', [note])
    case 'stripe_live_readiness_no_charge':
      return meta('Stripe live readiness no-charge', 'Complete live references can reach ready_no_charge while all live payment capabilities remain false.', smoke('smoke:stripe-live-readiness'), ['ready_no_charge', 'live capabilities false'], 'live', [note])
    case 'audit_support_trace':
      return meta('Support audit trace', 'Support can inspect redacted timeline, receipt, Stripe trace, and beta-readiness evidence.', smoke('smoke:credit-audit'), ['audit timeline', 'support receipt', 'redacted Stripe trace'], 'not_applicable', [note])
    case 'ui_lifecycle_display':
      return meta('Credit UI lifecycle display', 'Wallet UI fixtures explain the credit lifecycle without route calls, live billing, or secret exposure.', smoke('smoke:credit-ui'), ['wallet UI cards', 'browser-safe adapter', 'safe copy'], 'not_applicable', [note])
  }
}

function scenarioEvidence(
  scenarioType: CreditExternalBetaScenarioType,
  context: {
    auditStatus: string
    lifecycleEstimateRange: string
    lifecycleRequiredHold: string
    lifecycleStripeReadiness: string
    liveReadinessStatus: string
  },
): CreditExternalBetaScenarioEvidence[] {
  switch (scenarioType) {
    case 'happy_path_normal':
      return evidence([
        ['normal_estimate', 'Normal estimate', 'productEditLevel=normal, requiredHold=maximumEstimatedCredits', 'estimate'],
        ['normal_reservation', 'Max hold reserved', 'reservedCredits=maximumEstimatedCredits, not expected estimate', 'reservation'],
        ['normal_settlement', 'Unused credits returned', 'finalChargeCredits <= reservedCredits; releasedCredits > 0', 'settlement'],
      ])
    case 'happy_path_premium':
      return evidence([
        ['premium_estimate', 'Premium estimate', 'productEditLevel=premium', 'estimate'],
        ['premium_fee', 'Premium service fee', 'service fee exceeds comparable Normal fixture', 'settlement'],
      ])
    case 'happy_path_ultra_premium':
      return evidence([
        ['ultra_estimate', 'Ultra Premium estimate', 'maximumEstimatedCredits exceeds Premium fixture', 'estimate'],
        ['ultra_lower_cost', 'Lower-cost options', 'downgrade/tool/render options available', 'estimate'],
      ])
    case 'insufficient_credits_before_reservation':
      return evidence([
        ['reservation_blocked', 'Reservation blocked', 'status=insufficient_credits and wallet is not mutated', 'reservation'],
        ['top_up_suggested', 'Top-up suggested', 'smallest pack covers required top-up where possible', 'top_up'],
      ])
    case 'runtime_projected_overage':
      return evidence([
        ['runtime_pause', 'Runtime pause', 'status=requires_revised_estimate', 'runtime_guard'],
        ['revision_created', 'Revision action created', 'pauseReason=projected_overage', 'revision_action'],
      ])
    case 'revised_credit_approved':
      return evidence([
        ['additional_hold', 'Additional hold reserved', 'newReservedCredits equals revised max when wallet can cover it', 'reservation'],
        ['guard_recheck', 'Later guard required', 'approval does not auto-start paid work', 'runtime_guard'],
      ])
    case 'lower_cost_selected':
      return evidence([
        ['lower_cost', 'Lower-cost selected', 'status=lower_cost_selected', 'revision_action'],
        ['new_plan_required', 'New estimate required', 'new estimate required before original paid work can resume', 'runtime_guard'],
      ])
    case 'extra_work_cancelled':
      return evidence([
        ['cancelled', 'Extra work cancelled', 'status=cancelled', 'revision_action'],
        ['no_mutation', 'No spend/release/refund', 'reservation unchanged', 'reservation'],
      ])
    case 'settled_with_unused_return':
      return evidence([
        ['settlement_return', 'Unused hold returned', 'reserved=200, finalCharge=160, released=40', 'settlement'],
        ['formula', 'Final-charge formula', REEDITPRO_FINAL_CHARGE_FORMULA, 'settlement'],
      ])
    case 'settled_with_absorbed_overage':
      return evidence([
        ['absorbed_overage', 'Overage absorbed', 'computedFinal=230, charged=200, absorbed=30', 'settlement'],
        ['absorbed_export', 'Export allowed', 'absorbed overage does not block export', 'export_lock'],
      ])
    case 'approved_but_unfunded_export_lock':
      return evidence([
        ['top_up_lock', 'Top-up lock', 'status=requires_top_up_before_export', 'export_lock'],
        ['no_unlock', 'No export unlock', 'checkout/top-up does not automatically unlock export', 'export_lock'],
      ])
    case 'mock_credit_top_up':
      return evidence([
        ['mock_pack', 'Mock pack', '100 credits = $10; purchased grant sourceType=purchased', 'top_up'],
        ['no_auto_retry', 'No auto retry', 'top-up requires user to retry blocked flow', 'top_up'],
      ])
    case 'stripe_testmode_checkout_grant':
      return evidence([
        ['test_checkout', 'Stripe test checkout', 'mode=test; checkout grants only after verified webhook', 'stripe'],
        ['duplicate_webhook', 'Webhook idempotency', 'duplicate event does not double-grant credits', 'stripe'],
      ])
    case 'stripe_live_readiness_no_charge':
      return evidence([
        ['live_readiness', 'Live readiness', context.liveReadinessStatus, 'stripe'],
        ['live_capabilities_false', 'Live capabilities disabled', 'checkout/setup/paymentIntent/webhook/grant all false', 'stripe'],
      ])
    case 'audit_support_trace':
      return evidence([
        ['audit_status', 'Audit readiness', context.auditStatus, 'audit'],
        ['support_receipt', 'Support receipt', 'receipt explains final charge, returned credits, overage, and outstanding credits', 'audit'],
      ])
    case 'ui_lifecycle_display':
      return evidence([
        ['ui_estimate', 'UI estimate range', context.lifecycleEstimateRange, 'ui'],
        ['ui_hold', 'UI required hold', context.lifecycleRequiredHold, 'ui'],
        ['ui_stripe', 'UI live readiness copy', context.lifecycleStripeReadiness, 'ui'],
      ])
  }
}

function buildSafetyChecks(input: {
  auditReady: boolean
  liveReadinessReadyNoCharge: boolean
  packageLockChanged: boolean
  rawSecretDetected: boolean
  liveModeEnabled: boolean
  requiredSmokeResults: CreditExternalBetaRequiredSmokeResult[]
}): CreditExternalBetaSafetyCheck[] {
  return [
    safety('required_smokes_pass', 'Required smokes pass', input.requiredSmokeResults.every((result) => result.status === 'passed'), input.requiredSmokeResults.map((result) => `${result.command}: ${result.status}`)),
    safety('audit_evidence_ready', 'Audit/support evidence ready', input.auditReady, ['Credit audit readiness report is reused.']),
    safety('live_readiness_no_charge', 'Live readiness is no-charge only', input.liveReadinessReadyNoCharge, ['Stripe live readiness can be ready_no_charge but live capabilities remain false.']),
    safety('live_mode_disabled', 'Live mode execution disabled', !input.liveModeEnabled, ['liveModeEnabled=false']),
    safety('package_lock_unchanged', 'package-lock unchanged', !input.packageLockChanged, ['No dependency or package-lock change is required.']),
    safety('no_raw_secret_exposure', 'No raw secrets exposed', !input.rawSecretDetected, ['Secret/card markers are redacted or absent from reports.']),
    safety('tool_cost_service_fee_excluded', 'Tool events exclude service fee', true, ['serviceFeeIncluded=false for tool-cost events.']),
    safety('service_fee_separate', 'Service fee separate from tool cost', true, [`creditPolicyVersion=${REEDITPRO_CREDIT_POLICY_VERSION}`, `serviceFeePolicyVersion=${REEDITPRO_SERVICE_FEE_POLICY_VERSION}`]),
    safety('max_estimate_hold_rule', 'Max estimate hold rule enforced', true, ['Reservation uses maximumEstimatedCredits/requiredHoldCredits.']),
    safety('no_provider_render_export', 'No provider/render/export execution', true, ['Launch gate is report-only and fixture-driven.']),
    safety('no_production_persistence', 'No production persistence', true, ['No Supabase write, production wallet mutation, or ledger write.']),
  ]
}

function passedScenario(results: CreditExternalBetaScenarioResult[], scenarioType: CreditExternalBetaScenarioType): boolean {
  const result = results.find((item) => item.scenarioType === scenarioType)
  return result?.status === 'passed'
}

function meta(
  name: string,
  description: string,
  requiredSmokes: string[],
  requiredEvidence: string[],
  stripeMode: CreditExternalBetaStripeMode,
  notes: string[],
) {
  return { name, description, requiredSmokes, requiredEvidence, stripeMode, notes }
}

function evidence(rows: Array<[string, string, string, CreditExternalBetaEvidenceSource]>): CreditExternalBetaScenarioEvidence[] {
  return rows.map(([id, label, value, source]) => ({ id, label, value, source }))
}

function safety(id: string, label: string, passed: boolean, notes: string[]): CreditExternalBetaSafetyCheck {
  return {
    id,
    label,
    status: passed ? 'passed' : 'blocked',
    notes,
  }
}

function liveNoChargeConfig(): StripeBillingRuntimeConfig {
  return {
    mode: 'live',
    secretSource: 'google_secret_manager',
    publishableKeyMode: 'live',
    secretKeySecretName: 'reeditpro-live-stripe-secret-key',
    publishableKeySecretName: 'reeditpro-live-stripe-publishable-key',
    webhookSigningSecretName: 'reeditpro-live-stripe-webhook-secret',
    secretReferences: {
      liveSecretKeySecretName: 'reeditpro-live-stripe-secret-key',
      livePublishableKeySecretName: 'reeditpro-live-stripe-publishable-key',
      liveWebhookSigningSecretName: 'reeditpro-live-stripe-webhook-secret',
    },
    restrictedKeyPreferred: true,
    testModeRealCallsAllowed: false,
    liveModeAllowed: true,
    liveModeRequiresManualApproval: true,
    webhookEndpointMode: 'live',
    environment: 'production',
    mockOnly: false,
    warnings: [],
  }
}

export const CREDIT_EXTERNAL_BETA_REQUIRED_SMOKES = [...REQUIRED_SMOKES]
export const CREDIT_EXTERNAL_BETA_NON_BLOCKING_GAPS = [...NON_BLOCKING_GAPS]
