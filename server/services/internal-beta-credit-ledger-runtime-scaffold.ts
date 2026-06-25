import { nowIso, sanitizeJson } from './service-helpers'

export type InternalBetaCreditLedgerRuntimeOperation =
  | 'credit_reservation_create'
  | 'credit_reservation_validate'
  | 'reserved_credits_spend'
  | 'reserved_credits_release'
  | 'credits_refund_for_failed_generation'
  | 'credit_ledger_readback'

export type InternalBetaCreditLedgerRuntimeStatus = 'disabled_pending_credit_ledger_runtime_gate'

export interface InternalBetaCreditLedgerRuntimeScaffoldDefinition {
  operation: InternalBetaCreditLedgerRuntimeOperation
  scaffoldFunctionName: string
  approvedPlanRequired: boolean
  approvedCreditEstimateRequired: boolean
  creditReservationRequired: boolean
  jobCompletionRequired: boolean
  idempotencyKeyRequired: boolean
  stripePaymentProcessingEnabled: false
  creditMutationEnabled: false
  supabaseMutationEnabled: false
  workerExecutionEnabled: false
  providerModelCallsEnabled: false
  renderExportEnabled: false
}

export interface InternalBetaCreditLedgerRuntimeInput {
  workspaceId?: string
  projectId?: string
  userId?: string
  requestId?: string
  approvedPlanSnapshotId?: string
  editPlanId?: string
  creditEstimateId?: string
  creditApprovalId?: string
  creditReservationId?: string
  jobId?: string
  idempotencyKey?: string
  reason?: string
  payload?: Record<string, unknown>
}

export interface InternalBetaCreditLedgerRuntimeScaffoldResult {
  ok: false
  status: InternalBetaCreditLedgerRuntimeStatus
  operation: InternalBetaCreditLedgerRuntimeOperation
  scaffoldFunctionName: string
  createdAt: string
  httpStatusCode: 202
  approvedPlanRequired: boolean
  approvedCreditEstimateRequired: boolean
  creditReservationRequired: boolean
  jobCompletionRequired: boolean
  idempotencyKeyRequired: boolean
  stripePaymentProcessing: false
  creditMutation: false
  supabaseMutation: false
  workerExecution: false
  providerModelCalls: false
  renderExportExecution: false
  publicArtifactsCreated: false
  internalBetaUnlock: false
  requiredBeforeEnablement: string[]
  inputSummary: Record<string, unknown>
  warnings: string[]
}

export const INTERNAL_BETA_CREDIT_LEDGER_RUNTIME_SCAFFOLDS: InternalBetaCreditLedgerRuntimeScaffoldDefinition[] = [
  {
    operation: 'credit_reservation_create',
    scaffoldFunctionName: 'createInternalBetaCreditReservationRuntimeScaffold',
    approvedPlanRequired: true,
    approvedCreditEstimateRequired: true,
    creditReservationRequired: false,
    jobCompletionRequired: false,
    idempotencyKeyRequired: true,
    stripePaymentProcessingEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    renderExportEnabled: false,
  },
  {
    operation: 'credit_reservation_validate',
    scaffoldFunctionName: 'validateInternalBetaCreditReservationRuntimeScaffold',
    approvedPlanRequired: true,
    approvedCreditEstimateRequired: true,
    creditReservationRequired: true,
    jobCompletionRequired: false,
    idempotencyKeyRequired: false,
    stripePaymentProcessingEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    renderExportEnabled: false,
  },
  {
    operation: 'reserved_credits_spend',
    scaffoldFunctionName: 'spendInternalBetaReservedCreditsRuntimeScaffold',
    approvedPlanRequired: true,
    approvedCreditEstimateRequired: true,
    creditReservationRequired: true,
    jobCompletionRequired: true,
    idempotencyKeyRequired: true,
    stripePaymentProcessingEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    renderExportEnabled: false,
  },
  {
    operation: 'reserved_credits_release',
    scaffoldFunctionName: 'releaseInternalBetaReservedCreditsRuntimeScaffold',
    approvedPlanRequired: true,
    approvedCreditEstimateRequired: true,
    creditReservationRequired: true,
    jobCompletionRequired: false,
    idempotencyKeyRequired: true,
    stripePaymentProcessingEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    renderExportEnabled: false,
  },
  {
    operation: 'credits_refund_for_failed_generation',
    scaffoldFunctionName: 'refundInternalBetaCreditsForFailedGenerationRuntimeScaffold',
    approvedPlanRequired: true,
    approvedCreditEstimateRequired: true,
    creditReservationRequired: true,
    jobCompletionRequired: true,
    idempotencyKeyRequired: true,
    stripePaymentProcessingEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    renderExportEnabled: false,
  },
  {
    operation: 'credit_ledger_readback',
    scaffoldFunctionName: 'readInternalBetaCreditLedgerRuntimeScaffold',
    approvedPlanRequired: false,
    approvedCreditEstimateRequired: false,
    creditReservationRequired: false,
    jobCompletionRequired: false,
    idempotencyKeyRequired: false,
    stripePaymentProcessingEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    renderExportEnabled: false,
  },
]

export function getInternalBetaCreditLedgerRuntimeScaffold(
  operation: InternalBetaCreditLedgerRuntimeOperation,
): InternalBetaCreditLedgerRuntimeScaffoldDefinition {
  const definition = INTERNAL_BETA_CREDIT_LEDGER_RUNTIME_SCAFFOLDS.find((item) => item.operation === operation)
  if (!definition) {
    throw new Error(`Unknown internal beta credit ledger runtime operation: ${operation}`)
  }

  return definition
}

export function createDisabledInternalBetaCreditLedgerRuntimeScaffoldResult(
  operation: InternalBetaCreditLedgerRuntimeOperation,
  input: InternalBetaCreditLedgerRuntimeInput = {},
): InternalBetaCreditLedgerRuntimeScaffoldResult {
  const definition = getInternalBetaCreditLedgerRuntimeScaffold(operation)

  return {
    ok: false,
    status: 'disabled_pending_credit_ledger_runtime_gate',
    operation,
    scaffoldFunctionName: definition.scaffoldFunctionName,
    createdAt: nowIso(),
    httpStatusCode: 202,
    approvedPlanRequired: definition.approvedPlanRequired,
    approvedCreditEstimateRequired: definition.approvedCreditEstimateRequired,
    creditReservationRequired: definition.creditReservationRequired,
    jobCompletionRequired: definition.jobCompletionRequired,
    idempotencyKeyRequired: definition.idempotencyKeyRequired,
    stripePaymentProcessing: false,
    creditMutation: false,
    supabaseMutation: false,
    workerExecution: false,
    providerModelCalls: false,
    renderExportExecution: false,
    publicArtifactsCreated: false,
    internalBetaUnlock: false,
    requiredBeforeEnablement: buildCreditLedgerGateRequirements(definition),
    inputSummary: summarizeCreditLedgerInput(input),
    warnings: [
      'Internal beta credit ledger runtime scaffold is fail-closed.',
      'No credit reservation, spend, release, refund, Stripe/payment processing, Supabase write, worker dispatch, provider/model call, render/export, beta unlock, or production unlock occurred.',
    ],
  }
}

export function createInternalBetaCreditReservationRuntimeScaffold(
  input: InternalBetaCreditLedgerRuntimeInput = {},
) {
  return createDisabledInternalBetaCreditLedgerRuntimeScaffoldResult('credit_reservation_create', input)
}

export function validateInternalBetaCreditReservationRuntimeScaffold(
  input: InternalBetaCreditLedgerRuntimeInput = {},
) {
  return createDisabledInternalBetaCreditLedgerRuntimeScaffoldResult('credit_reservation_validate', input)
}

export function spendInternalBetaReservedCreditsRuntimeScaffold(
  input: InternalBetaCreditLedgerRuntimeInput = {},
) {
  return createDisabledInternalBetaCreditLedgerRuntimeScaffoldResult('reserved_credits_spend', input)
}

export function releaseInternalBetaReservedCreditsRuntimeScaffold(
  input: InternalBetaCreditLedgerRuntimeInput = {},
) {
  return createDisabledInternalBetaCreditLedgerRuntimeScaffoldResult('reserved_credits_release', input)
}

export function refundInternalBetaCreditsForFailedGenerationRuntimeScaffold(
  input: InternalBetaCreditLedgerRuntimeInput = {},
) {
  return createDisabledInternalBetaCreditLedgerRuntimeScaffoldResult('credits_refund_for_failed_generation', input)
}

export function readInternalBetaCreditLedgerRuntimeScaffold(
  input: InternalBetaCreditLedgerRuntimeInput = {},
) {
  return createDisabledInternalBetaCreditLedgerRuntimeScaffoldResult('credit_ledger_readback', input)
}

function buildCreditLedgerGateRequirements(definition: InternalBetaCreditLedgerRuntimeScaffoldDefinition): string[] {
  const requirements = [
    'explicit_credit_ledger_runtime_enablement_milestone',
    'append_only_ledger_transaction_contract',
    'least_privilege_service_role_runtime_test',
    'negative_no_generation_before_approval_test',
    'stripe_payment_processing_separate_sandbox_gate',
  ]

  if (definition.approvedPlanRequired) requirements.push('approved_plan_snapshot_required')
  if (definition.approvedCreditEstimateRequired) requirements.push('approved_credit_estimate_required')
  if (definition.creditReservationRequired) requirements.push('credit_reservation_required')
  if (definition.jobCompletionRequired) requirements.push('audited_job_completion_or_failure_required')
  if (definition.idempotencyKeyRequired) requirements.push('idempotency_key_enforcement')

  return requirements
}

function summarizeCreditLedgerInput(input: InternalBetaCreditLedgerRuntimeInput): Record<string, unknown> {
  return sanitizeJson({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    userId: input.userId,
    requestId: input.requestId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    editPlanId: input.editPlanId,
    creditEstimateId: input.creditEstimateId,
    creditApprovalId: input.creditApprovalId,
    creditReservationId: input.creditReservationId,
    jobId: input.jobId,
    idempotencyKeyPresent: Boolean(input.idempotencyKey),
    reason: input.reason,
    payloadKeys: input.payload ? Object.keys(sanitizeJson(input.payload)).sort() : [],
  })
}
