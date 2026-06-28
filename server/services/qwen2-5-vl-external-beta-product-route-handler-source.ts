import { ApiError } from '../errors/api-error'
import type { ServiceContext } from '../types'
import {
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_ENV,
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_VALUE,
  type Qwen25VlExternalBetaProductRouteReadbackValidationInput,
  type Qwen25VlExternalBetaProductRouteReadbackValidationResult,
  assertQwen25VlExternalBetaProductRouteReadbackValidationResult,
  buildQwen25VlExternalBetaProductRouteReadbackValidation,
} from './qwen2-5-vl-external-beta-product-route-readback-validation'
import { QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV } from '../config/qwen2-5-vl-external-beta-runtime-gate-contract'

export const QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_SOURCE_PACKET =
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_SOURCE_1' as const

export const QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_SOURCE_DECISION =
  'completed_qwen2_5_vl_product_route_handler_source_fail_closed_contract' as const

export const QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_SOURCE_EXECUTION =
  'completed_backend_route_handler_source_no_provider_or_remote_execution' as const

export const QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_SOURCE_READY_STATUS =
  'ready_for_guarded_qwen2_5_vl_product_route_handler_fail_closed_runtime_validation' as const

export const QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_SOURCE_NEXT_MILESTONE =
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_FAIL_CLOSED_RUNTIME_VALIDATION_1' as const

export interface Qwen25VlExternalBetaProductRouteHandlerSourceInput {
  workspaceId: string
  projectId: string
  editSessionId: string
  requestId: string
  routeIdempotencyKey: string
  workspaceMembershipRef: string
  targetRef?: string | null
  workflowBindingId?: string | null
  adapterRequestId?: string | null
  approvedSnapshotReadbackRef: string
  creditReservationReadbackRef: string
  queueLeaseReadbackRef: string
  privateInputManifestReadbackRef: string
  privateArtifactManifestReadbackRef: string
  privateArtifactChecksumReadbackRef: string
  sourceSequenceMapReadbackRef: string
  compiledIntentReadbackRef: string
  editPlanVersionReadbackRef: string
  modelRoutingPolicyReadbackRef: string
  qaPolicyReadbackRef: string
  routeReadbackExecutionRequested?: boolean
  providerModelCallRequested?: boolean
  workerDispatchRequested?: boolean
  mediaProcessingRequested?: boolean
  signedUrlCreationRequested?: boolean
  publicArtifactRequested?: boolean
  finalRenderExportRequested?: boolean
  externalBetaUnlockRequested?: boolean
}

export interface Qwen25VlExternalBetaProductRouteHandlerSourceResult {
  packet: typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_SOURCE_PACKET
  decision: typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_SOURCE_DECISION
  execution: typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_SOURCE_EXECUTION
  ok: false
  status:
    | 'blocked_pending_route_readback_validation_gate'
    | 'blocked_provider_runtime_not_enabled'
    | 'blocked_product_route_handler_unsafe_runtime_request'
  httpStatus: 424
  route: {
    routeId: 'providers.qwen25Vl.structuredVisualMetadataPlan'
    method: 'POST'
    path: '/api/providers/qwen2-5-vl/structured-visual-metadata'
    routeHandlerRegisteredNow: true
    routeHandlerFailClosed: true
  }
  auth: {
    authenticatedUserRef: string | null
    workspaceMembershipRef: string | null
    routeIdempotencyKey: string | null
  }
  routeReadbackValidation: Qwen25VlExternalBetaProductRouteReadbackValidationResult
  runtimeGates: {
    qwenRuntimeGateEnv: typeof QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV
    routeReadbackConfirmationEnv: typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_ENV
    routeReadbackConfirmationRequiredValue: typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_VALUE
  }
  allowedExecution: {
    routeHandlerRegisteredNow: true
    routeExecutionAcceptedNow: false
    routeReadbackExecutionAllowedNow: false
    providerModelCallAllowedNow: false
    workerDispatchAllowedNow: false
    mediaProcessingAllowedNow: false
    signedUrlCreationAllowedNow: false
    publicArtifactAllowedNow: false
    finalRenderExportAllowedNow: false
    externalBetaUnlockAllowedNow: false
    paidProductionUnlockAllowedNow: false
    productionUnlockAllowedNow: false
  }
  safety: {
    backendRouteHandlerSourceOnly: true
    routeHandlerRegisteredNow: true
    routeExecutionInThisPhase: false
    routeReadbackExecution: false
    supabaseReadbackExecution: false
    serviceRoleReadbackExecution: false
    qwenRuntimeExecutedInThisPhase: false
    providerCall: false
    modelCall: false
    workerExecution: false
    workerDispatch: false
    supabaseMutation: false
    sqlExecution: false
    secretPayloadAccess: false
    signedUrlCreation: false
    publicArtifactCreation: false
    mediaProcessing: false
    privateUserMediaProcessing: false
    rawPromptExecution: false
    finalRenderExport: false
    externalBetaUnlockAppliedToEnvironment: false
    paidProductionUnlock: false
    productionUnlock: false
    creditMutation: false
    packageLockMutation: false
  }
  warnings: string[]
  blockers: string[]
  nextMilestone: typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_SOURCE_NEXT_MILESTONE
}

function normalize(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function buildReadbackValidationInput(
  context: ServiceContext,
  input: Qwen25VlExternalBetaProductRouteHandlerSourceInput,
): Qwen25VlExternalBetaProductRouteReadbackValidationInput {
  const idempotencyKey = normalize(input.routeIdempotencyKey)
  return {
    env: process.env,
    routeId: 'providers.qwen25Vl.structuredVisualMetadataPlan',
    requestId: input.requestId,
    authenticatedUserRef: context.auth?.userId ?? null,
    workspaceMembershipRef: input.workspaceMembershipRef,
    routeIdempotencyKey: idempotencyKey,
    targetRef: input.targetRef,
    workflowBindingId: input.workflowBindingId ?? `qwen_route_handler_${input.requestId}`,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    editSessionId: input.editSessionId,
    adapterRequestId: input.adapterRequestId ?? `qwen_route_handler_adapter_${input.requestId}`,
    sourceSequenceMapRef: input.sourceSequenceMapReadbackRef,
    compiledIntentSnapshotRef: input.compiledIntentReadbackRef,
    editPlanVersionRef: input.editPlanVersionReadbackRef,
    approvedSnapshotRef: input.approvedSnapshotReadbackRef,
    creditReservationRef: input.creditReservationReadbackRef,
    queueLeaseRef: input.queueLeaseReadbackRef,
    idempotencyKey,
    privateInputManifestRef: input.privateInputManifestReadbackRef,
    privateArtifactManifestRef: input.privateArtifactManifestReadbackRef,
    privateArtifactChecksumRef: input.privateArtifactChecksumReadbackRef,
    modelRoutingPolicyRef: input.modelRoutingPolicyReadbackRef,
    qaPolicyRef: input.qaPolicyReadbackRef,
    approvedSnapshotReadbackRef: input.approvedSnapshotReadbackRef,
    creditReservationReadbackRef: input.creditReservationReadbackRef,
    queueLeaseReadbackRef: input.queueLeaseReadbackRef,
    privateInputManifestReadbackRef: input.privateInputManifestReadbackRef,
    privateArtifactManifestReadbackRef: input.privateArtifactManifestReadbackRef,
    privateArtifactChecksumReadbackRef: input.privateArtifactChecksumReadbackRef,
    sourceSequenceMapReadbackRef: input.sourceSequenceMapReadbackRef,
    compiledIntentReadbackRef: input.compiledIntentReadbackRef,
    modelRoutingPolicyReadbackRef: input.modelRoutingPolicyReadbackRef,
    qaPolicyReadbackRef: input.qaPolicyReadbackRef,
    workflowStatus: 'external_beta_guarded_binding',
    routeReadbackExecutionRequested: input.routeReadbackExecutionRequested,
    providerModelCallRequested: input.providerModelCallRequested,
    workerDispatchRequested: input.workerDispatchRequested,
    signedUrlCreationRequested: input.signedUrlCreationRequested,
    publicArtifactRequested: input.publicArtifactRequested,
    finalRenderExportRequested: input.finalRenderExportRequested,
    externalBetaUnlockRequested: input.externalBetaUnlockRequested,
  }
}

function hasUnsafeRequest(input: Qwen25VlExternalBetaProductRouteHandlerSourceInput): boolean {
  return Boolean(
    input.routeReadbackExecutionRequested ||
      input.providerModelCallRequested ||
      input.workerDispatchRequested ||
      input.mediaProcessingRequested ||
      input.signedUrlCreationRequested ||
      input.publicArtifactRequested ||
      input.finalRenderExportRequested ||
      input.externalBetaUnlockRequested,
  )
}

export function buildQwen25VlExternalBetaProductRouteHandlerSourceResult(
  context: ServiceContext,
  input: Qwen25VlExternalBetaProductRouteHandlerSourceInput,
): Qwen25VlExternalBetaProductRouteHandlerSourceResult {
  const routeReadbackValidation = buildQwen25VlExternalBetaProductRouteReadbackValidation(
    buildReadbackValidationInput(context, input),
  )
  assertQwen25VlExternalBetaProductRouteReadbackValidationResult(routeReadbackValidation)

  const unsafeRequest = hasUnsafeRequest(input)
  const status = unsafeRequest
    ? 'blocked_product_route_handler_unsafe_runtime_request'
    : !routeReadbackValidation.ok
      ? 'blocked_pending_route_readback_validation_gate'
      : 'blocked_provider_runtime_not_enabled'

  const blockers = [
    ...routeReadbackValidation.blockers,
    unsafeRequest ? 'qwen_product_route_handler_runtime_execution_not_allowed_in_source_phase' : null,
    routeReadbackValidation.ok ? 'qwen_provider_runtime_execution_requires_future_confirmed_packet' : null,
  ].filter((value): value is string => Boolean(value))

  return {
    packet: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_SOURCE_PACKET,
    decision: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_SOURCE_DECISION,
    execution: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_SOURCE_EXECUTION,
    ok: false,
    status,
    httpStatus: 424,
    route: {
      routeId: 'providers.qwen25Vl.structuredVisualMetadataPlan',
      method: 'POST',
      path: '/api/providers/qwen2-5-vl/structured-visual-metadata',
      routeHandlerRegisteredNow: true,
      routeHandlerFailClosed: true,
    },
    auth: {
      authenticatedUserRef: context.auth?.userId ?? null,
      workspaceMembershipRef: normalize(input.workspaceMembershipRef),
      routeIdempotencyKey: normalize(input.routeIdempotencyKey),
    },
    routeReadbackValidation,
    runtimeGates: {
      qwenRuntimeGateEnv: QWEN2_5_VL_EXTERNAL_BETA_RUNTIME_GATE_ENV,
      routeReadbackConfirmationEnv: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_ENV,
      routeReadbackConfirmationRequiredValue: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_VALUE,
    },
    allowedExecution: {
      routeHandlerRegisteredNow: true,
      routeExecutionAcceptedNow: false,
      routeReadbackExecutionAllowedNow: false,
      providerModelCallAllowedNow: false,
      workerDispatchAllowedNow: false,
      mediaProcessingAllowedNow: false,
      signedUrlCreationAllowedNow: false,
      publicArtifactAllowedNow: false,
      finalRenderExportAllowedNow: false,
      externalBetaUnlockAllowedNow: false,
      paidProductionUnlockAllowedNow: false,
      productionUnlockAllowedNow: false,
    },
    safety: {
      backendRouteHandlerSourceOnly: true,
      routeHandlerRegisteredNow: true,
      routeExecutionInThisPhase: false,
      routeReadbackExecution: false,
      supabaseReadbackExecution: false,
      serviceRoleReadbackExecution: false,
      qwenRuntimeExecutedInThisPhase: false,
      providerCall: false,
      modelCall: false,
      workerExecution: false,
      workerDispatch: false,
      supabaseMutation: false,
      sqlExecution: false,
      secretPayloadAccess: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      mediaProcessing: false,
      privateUserMediaProcessing: false,
      rawPromptExecution: false,
      finalRenderExport: false,
      externalBetaUnlockAppliedToEnvironment: false,
      paidProductionUnlock: false,
      productionUnlock: false,
      creditMutation: false,
      packageLockMutation: false,
    },
    warnings: [
      'QWEN product route handler source is registered fail-closed.',
      'No QWEN provider/model call, Supabase readback, worker dispatch, media processing, signed/public artifact, or beta unlock was performed.',
    ],
    blockers,
    nextMilestone: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_SOURCE_NEXT_MILESTONE,
  }
}

export function createQwen25VlExternalBetaProductRouteHandlerSource(context: ServiceContext) {
  return {
    buildBlockedResult(input: Qwen25VlExternalBetaProductRouteHandlerSourceInput) {
      return buildQwen25VlExternalBetaProductRouteHandlerSourceResult(context, input)
    },

    throwFailClosed(input: Qwen25VlExternalBetaProductRouteHandlerSourceInput): never {
      const result = buildQwen25VlExternalBetaProductRouteHandlerSourceResult(context, input)
      throw new ApiError(
        'PROVIDER_ROUTE_BLOCKED',
        'QWEN2.5-VL structured visual metadata route is registered but fail-closed before provider runtime execution.',
        result.httpStatus,
        result,
      )
    },
  }
}

export function assertQwen25VlExternalBetaProductRouteHandlerSourceResult(
  result: Qwen25VlExternalBetaProductRouteHandlerSourceResult,
): void {
  if (result.decision !== QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_SOURCE_DECISION) {
    throw new Error('QWEN product route handler source decision mismatch.')
  }
  if (result.execution !== QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_HANDLER_SOURCE_EXECUTION) {
    throw new Error('QWEN product route handler source execution mismatch.')
  }
  if (result.ok !== false) throw new Error('QWEN product route handler source must fail closed.')
  if (!result.route.routeHandlerRegisteredNow) throw new Error('QWEN product route handler must be registered.')
  if (!result.route.routeHandlerFailClosed) throw new Error('QWEN product route handler must fail closed.')
  for (const [key, value] of Object.entries(result.allowedExecution)) {
    if (key === 'routeHandlerRegisteredNow') {
      if (value !== true) throw new Error('QWEN route handler registration flag must be true.')
      continue
    }
    if (value !== false) throw new Error(`QWEN route handler allowed execution flag ${key} must be false.`)
  }
  for (const [key, value] of Object.entries(result.safety)) {
    if (key === 'backendRouteHandlerSourceOnly' || key === 'routeHandlerRegisteredNow') {
      if (value !== true) throw new Error(`QWEN route handler safety flag ${key} must be true.`)
      continue
    }
    if (value !== false) throw new Error(`QWEN route handler safety flag ${key} must be false.`)
  }
}
