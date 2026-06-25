import { nowIso, sanitizeJson } from './service-helpers'

export type InternalBetaProviderAdapterOperation =
  | 'provider_route_read'
  | 'provider_request_preflight'
  | 'provider_prompt_payload_prepare'
  | 'provider_cost_cap_check'
  | 'provider_secret_boundary_check'
  | 'provider_fallback_policy_prepare'
  | 'provider_status_readback'
  | 'provider_failure_classify'

export type InternalBetaProviderAdapterStatus = 'disabled_pending_provider_adapter_runtime_gate'

export interface InternalBetaProviderAdapterScaffoldDefinition {
  operation: InternalBetaProviderAdapterOperation
  scaffoldFunctionName: string
  approvedPlanRequired: boolean
  creditReservationRequired: boolean
  jobIdRequired: boolean
  providerRouteRequired: boolean
  promptPlanRequired: boolean
  modelPolicyRequired: boolean
  costCapRequired: boolean
  fallbackPolicyRequired: boolean
  idempotencyKeyRequired: boolean
  routeExecutionEnabled: false
  workerExecutionEnabled: false
  providerModelCallsEnabled: false
  secretPayloadAccessEnabled: false
  creditMutationEnabled: false
  supabaseMutationEnabled: false
}

export interface InternalBetaProviderAdapterInput {
  workspaceId?: string
  projectId?: string
  userId?: string
  requestId?: string
  approvedPlanSnapshotId?: string
  creditReservationId?: string
  jobId?: string
  providerRouteId?: string
  promptPlanId?: string
  modelPolicyId?: string
  costCapId?: string
  fallbackPolicyId?: string
  idempotencyKey?: string
  reason?: string
  payload?: Record<string, unknown>
}

export interface InternalBetaProviderAdapterScaffoldResult {
  ok: false
  status: InternalBetaProviderAdapterStatus
  operation: InternalBetaProviderAdapterOperation
  scaffoldFunctionName: string
  createdAt: string
  httpStatusCode: 202
  approvedPlanRequired: boolean
  creditReservationRequired: boolean
  jobIdRequired: boolean
  providerRouteRequired: boolean
  promptPlanRequired: boolean
  modelPolicyRequired: boolean
  costCapRequired: boolean
  fallbackPolicyRequired: boolean
  idempotencyKeyRequired: boolean
  routeExecution: false
  workerExecution: false
  workerDispatch: false
  providerModelCalls: false
  modelCall: false
  secretPayloadAccess: false
  rawPromptExecution: false
  creditMutation: false
  supabaseMutation: false
  renderExportExecution: false
  storageWrite: false
  signedUrlCreation: false
  publicArtifactCreation: false
  internalBetaUnlock: false
  requiredBeforeEnablement: string[]
  inputSummary: Record<string, unknown>
  warnings: string[]
}

export const INTERNAL_BETA_PROVIDER_ADAPTER_SCAFFOLDS: InternalBetaProviderAdapterScaffoldDefinition[] = [
  {
    operation: 'provider_route_read',
    scaffoldFunctionName: 'readInternalBetaProviderRouteScaffold',
    approvedPlanRequired: true,
    creditReservationRequired: true,
    jobIdRequired: false,
    providerRouteRequired: true,
    promptPlanRequired: false,
    modelPolicyRequired: true,
    costCapRequired: false,
    fallbackPolicyRequired: true,
    idempotencyKeyRequired: false,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    secretPayloadAccessEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'provider_request_preflight',
    scaffoldFunctionName: 'preflightInternalBetaProviderRequestScaffold',
    approvedPlanRequired: true,
    creditReservationRequired: true,
    jobIdRequired: true,
    providerRouteRequired: true,
    promptPlanRequired: true,
    modelPolicyRequired: true,
    costCapRequired: true,
    fallbackPolicyRequired: true,
    idempotencyKeyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    secretPayloadAccessEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'provider_prompt_payload_prepare',
    scaffoldFunctionName: 'prepareInternalBetaProviderPromptPayloadScaffold',
    approvedPlanRequired: true,
    creditReservationRequired: true,
    jobIdRequired: true,
    providerRouteRequired: true,
    promptPlanRequired: true,
    modelPolicyRequired: true,
    costCapRequired: true,
    fallbackPolicyRequired: true,
    idempotencyKeyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    secretPayloadAccessEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'provider_cost_cap_check',
    scaffoldFunctionName: 'checkInternalBetaProviderCostCapScaffold',
    approvedPlanRequired: true,
    creditReservationRequired: true,
    jobIdRequired: true,
    providerRouteRequired: true,
    promptPlanRequired: true,
    modelPolicyRequired: true,
    costCapRequired: true,
    fallbackPolicyRequired: false,
    idempotencyKeyRequired: false,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    secretPayloadAccessEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'provider_secret_boundary_check',
    scaffoldFunctionName: 'checkInternalBetaProviderSecretBoundaryScaffold',
    approvedPlanRequired: true,
    creditReservationRequired: true,
    jobIdRequired: true,
    providerRouteRequired: true,
    promptPlanRequired: false,
    modelPolicyRequired: true,
    costCapRequired: true,
    fallbackPolicyRequired: false,
    idempotencyKeyRequired: false,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    secretPayloadAccessEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'provider_fallback_policy_prepare',
    scaffoldFunctionName: 'prepareInternalBetaProviderFallbackPolicyScaffold',
    approvedPlanRequired: true,
    creditReservationRequired: true,
    jobIdRequired: true,
    providerRouteRequired: true,
    promptPlanRequired: true,
    modelPolicyRequired: true,
    costCapRequired: false,
    fallbackPolicyRequired: true,
    idempotencyKeyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    secretPayloadAccessEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'provider_status_readback',
    scaffoldFunctionName: 'readInternalBetaProviderStatusScaffold',
    approvedPlanRequired: false,
    creditReservationRequired: false,
    jobIdRequired: true,
    providerRouteRequired: true,
    promptPlanRequired: false,
    modelPolicyRequired: true,
    costCapRequired: false,
    fallbackPolicyRequired: false,
    idempotencyKeyRequired: false,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    secretPayloadAccessEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
  {
    operation: 'provider_failure_classify',
    scaffoldFunctionName: 'classifyInternalBetaProviderFailureScaffold',
    approvedPlanRequired: true,
    creditReservationRequired: true,
    jobIdRequired: true,
    providerRouteRequired: true,
    promptPlanRequired: true,
    modelPolicyRequired: true,
    costCapRequired: true,
    fallbackPolicyRequired: true,
    idempotencyKeyRequired: true,
    routeExecutionEnabled: false,
    workerExecutionEnabled: false,
    providerModelCallsEnabled: false,
    secretPayloadAccessEnabled: false,
    creditMutationEnabled: false,
    supabaseMutationEnabled: false,
  },
]

export function getInternalBetaProviderAdapterScaffold(
  operation: InternalBetaProviderAdapterOperation,
): InternalBetaProviderAdapterScaffoldDefinition {
  const definition = INTERNAL_BETA_PROVIDER_ADAPTER_SCAFFOLDS.find((item) => item.operation === operation)
  if (!definition) {
    throw new Error(`Unknown internal beta provider adapter operation: ${operation}`)
  }

  return definition
}

export function createDisabledInternalBetaProviderAdapterScaffoldResult(
  operation: InternalBetaProviderAdapterOperation,
  input: InternalBetaProviderAdapterInput = {},
): InternalBetaProviderAdapterScaffoldResult {
  const definition = getInternalBetaProviderAdapterScaffold(operation)

  return {
    ok: false,
    status: 'disabled_pending_provider_adapter_runtime_gate',
    operation,
    scaffoldFunctionName: definition.scaffoldFunctionName,
    createdAt: nowIso(),
    httpStatusCode: 202,
    approvedPlanRequired: definition.approvedPlanRequired,
    creditReservationRequired: definition.creditReservationRequired,
    jobIdRequired: definition.jobIdRequired,
    providerRouteRequired: definition.providerRouteRequired,
    promptPlanRequired: definition.promptPlanRequired,
    modelPolicyRequired: definition.modelPolicyRequired,
    costCapRequired: definition.costCapRequired,
    fallbackPolicyRequired: definition.fallbackPolicyRequired,
    idempotencyKeyRequired: definition.idempotencyKeyRequired,
    routeExecution: false,
    workerExecution: false,
    workerDispatch: false,
    providerModelCalls: false,
    modelCall: false,
    secretPayloadAccess: false,
    rawPromptExecution: false,
    creditMutation: false,
    supabaseMutation: false,
    renderExportExecution: false,
    storageWrite: false,
    signedUrlCreation: false,
    publicArtifactCreation: false,
    internalBetaUnlock: false,
    requiredBeforeEnablement: buildProviderAdapterGateRequirements(definition),
    inputSummary: summarizeProviderAdapterInput(input),
    warnings: [
      'Internal beta provider adapter scaffold is fail-closed.',
      'No provider call, model call, secret payload access, raw prompt execution, worker dispatch, route execution, credit mutation, Supabase write, render/export, signed URL creation, public artifact creation, beta unlock, or production unlock occurred.',
    ],
  }
}

export function readInternalBetaProviderRouteScaffold(input: InternalBetaProviderAdapterInput = {}) {
  return createDisabledInternalBetaProviderAdapterScaffoldResult('provider_route_read', input)
}

export function preflightInternalBetaProviderRequestScaffold(input: InternalBetaProviderAdapterInput = {}) {
  return createDisabledInternalBetaProviderAdapterScaffoldResult('provider_request_preflight', input)
}

export function prepareInternalBetaProviderPromptPayloadScaffold(input: InternalBetaProviderAdapterInput = {}) {
  return createDisabledInternalBetaProviderAdapterScaffoldResult('provider_prompt_payload_prepare', input)
}

export function checkInternalBetaProviderCostCapScaffold(input: InternalBetaProviderAdapterInput = {}) {
  return createDisabledInternalBetaProviderAdapterScaffoldResult('provider_cost_cap_check', input)
}

export function checkInternalBetaProviderSecretBoundaryScaffold(input: InternalBetaProviderAdapterInput = {}) {
  return createDisabledInternalBetaProviderAdapterScaffoldResult('provider_secret_boundary_check', input)
}

export function prepareInternalBetaProviderFallbackPolicyScaffold(input: InternalBetaProviderAdapterInput = {}) {
  return createDisabledInternalBetaProviderAdapterScaffoldResult('provider_fallback_policy_prepare', input)
}

export function readInternalBetaProviderStatusScaffold(input: InternalBetaProviderAdapterInput = {}) {
  return createDisabledInternalBetaProviderAdapterScaffoldResult('provider_status_readback', input)
}

export function classifyInternalBetaProviderFailureScaffold(input: InternalBetaProviderAdapterInput = {}) {
  return createDisabledInternalBetaProviderAdapterScaffoldResult('provider_failure_classify', input)
}

function buildProviderAdapterGateRequirements(definition: InternalBetaProviderAdapterScaffoldDefinition): string[] {
  const requirements = [
    'explicit_provider_adapter_runtime_enablement_milestone',
    'backend_only_secret_isolation_test',
    'negative_no_frontend_provider_call_test',
    'negative_no_raw_prompt_execution_test',
    'tier_model_routing_policy_test',
    'cost_cap_and_credit_reservation_gate_test',
  ]

  if (definition.approvedPlanRequired) requirements.push('approved_plan_snapshot_required')
  if (definition.creditReservationRequired) requirements.push('credit_reservation_required')
  if (definition.jobIdRequired) requirements.push('job_id_required')
  if (definition.providerRouteRequired) requirements.push('provider_route_required')
  if (definition.promptPlanRequired) requirements.push('prompt_plan_required')
  if (definition.modelPolicyRequired) requirements.push('model_policy_required')
  if (definition.costCapRequired) requirements.push('cost_cap_required')
  if (definition.fallbackPolicyRequired) requirements.push('fallback_policy_required')
  if (definition.idempotencyKeyRequired) requirements.push('idempotency_key_enforcement')

  return requirements
}

function summarizeProviderAdapterInput(input: InternalBetaProviderAdapterInput): Record<string, unknown> {
  return sanitizeJson({
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    userId: input.userId,
    requestId: input.requestId,
    approvedPlanSnapshotId: input.approvedPlanSnapshotId,
    creditReservationId: input.creditReservationId,
    jobId: input.jobId,
    providerRouteId: input.providerRouteId,
    promptPlanId: input.promptPlanId,
    modelPolicyId: input.modelPolicyId,
    costCapId: input.costCapId,
    fallbackPolicyId: input.fallbackPolicyId,
    idempotencyKeyPresent: Boolean(input.idempotencyKey),
    reason: input.reason,
    payloadKeys: input.payload ? Object.keys(sanitizeJson(input.payload)).sort() : [],
  })
}
