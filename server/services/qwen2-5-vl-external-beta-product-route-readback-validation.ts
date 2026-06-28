import {
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_ID,
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_READY_STATUS,
  type Qwen25VlExternalBetaProductWorkflowRouteIntegrationInput,
  type Qwen25VlExternalBetaProductWorkflowRouteIntegrationResult,
  assertQwen25VlExternalBetaProductWorkflowRouteIntegrationResult,
  buildQwen25VlExternalBetaProductWorkflowRouteIntegration,
} from './qwen2-5-vl-external-beta-product-workflow-route-integration'

export const QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_PACKET =
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_1' as const

export const QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_DECISION =
  'blocked_pending_explicit_qwen2_5_vl_product_route_readback_validation_confirmation' as const

export const QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_EXECUTION =
  'completed_source_only_product_route_readback_validation_gate_no_remote_execution' as const

export const QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION' as const

export const QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_VALUE = 'true' as const

export const QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_READY_STATUS =
  'ready_for_confirmed_qwen2_5_vl_product_route_readback_validation_runtime_packet' as const

export const QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_NEXT_MILESTONE =
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRMED_1' as const

export type Qwen25VlExternalBetaProductRouteReadbackValidationStatus =
  | typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_READY_STATUS
  | 'blocked_pending_route_integration_readiness'
  | 'blocked_pending_explicit_qwen2_5_vl_product_route_readback_validation_confirmation'
  | 'blocked_missing_named_product_route_readback_target'
  | 'blocked_product_route_readback_unsafe_remote_request'

export interface Qwen25VlExternalBetaProductRouteReadbackValidationInput
  extends Qwen25VlExternalBetaProductWorkflowRouteIntegrationInput {
  confirmation?: string | boolean | null
  targetRef?: string | null
  routeReadbackExecutionRequested?: boolean
  supabaseReadbackExecutionRequested?: boolean
  serviceRoleReadbackExecutionRequested?: boolean
  routeHandlerExecutionRequested?: boolean
  secretPayloadPrintRequested?: boolean
  sqlMutationRequested?: boolean
  supabaseMutationRequested?: boolean
  cloudRunUpdateRequested?: boolean
  identityTokenFetchRequested?: boolean
}

export interface Qwen25VlExternalBetaProductRouteReadbackValidationResult {
  packet: typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_PACKET
  decision: typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_DECISION
  execution: typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_EXECUTION
  ok: boolean
  status: Qwen25VlExternalBetaProductRouteReadbackValidationStatus
  routeIntegration: Qwen25VlExternalBetaProductWorkflowRouteIntegrationResult
  sourceEvidence: {
    backendRuntimeAdapterPr: 1321
    confirmedAdapterRuntimeFixturePr: 1328
    productWorkflowBindingPr: 1333
    productWorkflowBindingMergeSha: 'e0cae42a25f1b7d390654fcc8b610f30b86c8358'
    productWorkflowRouteIntegrationPr: 1339
    productWorkflowRouteIntegrationMergeSha: '0350f42c1cda721d890cdd90155b0c948060686a'
    confirmedRunId: 'qwen25-adapter-runtime-fixture-2026-06-27T22-48-47-273Z-d12cb07d'
    serviceReason: 'qwen_fixture_inference_smoke_completed'
    parsedJson: true
    schemaValid: true
    structuredMetadataOutputAccepted: true
    rawOutputStoredInRepo: false
    failClosedRestorePassed: true
    excludedPr: 577
  }
  confirmationGate: {
    env: typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_ENV
    requiredValue: typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_VALUE
    confirmationPresent: boolean
    currentPhaseRemoteReadbackExecuted: false
  }
  target: {
    targetRef: string | null
    namedTargetRequiredBeforeRemoteReadback: true
  }
  requiredReadbackRefs: {
    approvedSnapshotReadbackRef: string | null
    creditReservationReadbackRef: string | null
    queueLeaseReadbackRef: string | null
    privateInputManifestReadbackRef: string | null
    privateArtifactManifestReadbackRef: string | null
    privateArtifactChecksumReadbackRef: string | null
    sourceSequenceMapReadbackRef: string | null
    compiledIntentReadbackRef: string | null
    modelRoutingPolicyReadbackRef: string | null
    qaPolicyReadbackRef: string | null
    authenticatedUserRef: string | null
    workspaceMembershipRef: string | null
    routeIdempotencyKey: string | null
  }
  allowedReadbackUse: {
    routeId: typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_ID
    routeContractReady: boolean
    sourceOnlyReadbackValidationGate: true
    actualRemoteReadbackAllowedNow: false
    routeHandlerExecutionAllowedNow: false
    supabaseReadbackExecutionAllowedNow: false
    serviceRoleReadbackExecutionAllowedNow: false
    secretPayloadAccessAllowedNow: false
    sqlMutationAllowedNow: false
    supabaseMutationAllowedNow: false
    workerDispatchAllowedNow: false
    providerModelCallAllowedNow: false
    mediaProcessingAllowedNow: false
    signedUrlCreationAllowedNow: false
    publicArtifactAllowedNow: false
    finalRenderExportAllowedNow: false
    externalBetaUnlockAllowedNow: false
    paidProductionUnlockAllowedNow: false
    productionUnlockAllowedNow: false
  }
  safety: {
    sourceOnlyProductRouteReadbackValidation: true
    qwenRuntimeExecutedInThisPhase: false
    routeReadbackExecution: false
    routeHandlerExecution: false
    supabaseReadbackExecution: false
    serviceRoleReadbackExecution: false
    remoteRuntimeExecution: false
    cloudRunServiceUpdated: false
    cloudRunJobExecuted: false
    identityTokenFetch: false
    providerCall: false
    modelCall: false
    frontendProviderModelCall: false
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
  blockers: string[]
  nextMilestone: typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_NEXT_MILESTONE
}

function normalize(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function isConfirmationPresent(input: Qwen25VlExternalBetaProductRouteReadbackValidationInput): boolean {
  if (input.confirmation === true) return true
  if (typeof input.confirmation === 'string') {
    return input.confirmation.trim() === QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_VALUE
  }
  return (
    process.env[QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_ENV] ===
    QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_VALUE
  )
}

function hasUnsafeRemoteRequest(input: Qwen25VlExternalBetaProductRouteReadbackValidationInput): boolean {
  return Boolean(
    input.routeReadbackExecutionRequested ||
      input.supabaseReadbackExecutionRequested ||
      input.serviceRoleReadbackExecutionRequested ||
      input.routeHandlerExecutionRequested ||
      input.secretPayloadPrintRequested ||
      input.sqlMutationRequested ||
      input.supabaseMutationRequested ||
      input.cloudRunUpdateRequested ||
      input.identityTokenFetchRequested ||
      input.routeExecutionRequested ||
      input.remoteRuntimeRequested ||
      input.workerDispatchRequested ||
      input.providerModelCallRequested ||
      input.frontendProviderModelCallRequested ||
      input.rawPromptExecutionRequested ||
      input.arbitraryUserMediaRequested ||
      input.signedUrlCreationRequested ||
      input.publicArtifactRequested ||
      input.finalRenderExportRequested ||
      input.externalBetaUnlockRequested ||
      input.broadExternalBetaUnlockRequested ||
      input.paidProductionUnlockRequested ||
      input.productionUnlockRequested,
  )
}

export function buildQwen25VlExternalBetaProductRouteReadbackValidation(
  input: Qwen25VlExternalBetaProductRouteReadbackValidationInput = {},
): Qwen25VlExternalBetaProductRouteReadbackValidationResult {
  const routeIntegration = buildQwen25VlExternalBetaProductWorkflowRouteIntegration(input)
  assertQwen25VlExternalBetaProductWorkflowRouteIntegrationResult(routeIntegration)

  const confirmationPresent = isConfirmationPresent(input)
  const targetRef = normalize(input.targetRef)
  const unsafeRemoteRequest = hasUnsafeRemoteRequest(input)
  const blockers = [...routeIntegration.blockers]

  if (!routeIntegration.ok) blockers.push('qwen_product_workflow_route_integration_must_be_ready')
  if (!confirmationPresent) {
    blockers.push('explicit_qwen2_5_vl_product_route_readback_validation_confirmation_required')
  }
  if (!targetRef) blockers.push('named_qwen2_5_vl_product_route_readback_target_required')
  if (unsafeRemoteRequest) {
    blockers.push('qwen_product_route_remote_readback_execution_not_allowed_in_source_only_phase')
  }

  const ok =
    routeIntegration.ok &&
    routeIntegration.status === QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_READY_STATUS &&
    confirmationPresent &&
    Boolean(targetRef) &&
    !unsafeRemoteRequest

  const status: Qwen25VlExternalBetaProductRouteReadbackValidationStatus = ok
    ? QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_READY_STATUS
    : !routeIntegration.ok
      ? 'blocked_pending_route_integration_readiness'
      : unsafeRemoteRequest
        ? 'blocked_product_route_readback_unsafe_remote_request'
        : !confirmationPresent
          ? 'blocked_pending_explicit_qwen2_5_vl_product_route_readback_validation_confirmation'
          : 'blocked_missing_named_product_route_readback_target'

  return {
    packet: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_PACKET,
    decision: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_DECISION,
    execution: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_EXECUTION,
    ok,
    status,
    routeIntegration,
    sourceEvidence: {
      backendRuntimeAdapterPr: 1321,
      confirmedAdapterRuntimeFixturePr: 1328,
      productWorkflowBindingPr: 1333,
      productWorkflowBindingMergeSha: 'e0cae42a25f1b7d390654fcc8b610f30b86c8358',
      productWorkflowRouteIntegrationPr: 1339,
      productWorkflowRouteIntegrationMergeSha: '0350f42c1cda721d890cdd90155b0c948060686a',
      confirmedRunId: 'qwen25-adapter-runtime-fixture-2026-06-27T22-48-47-273Z-d12cb07d',
      serviceReason: 'qwen_fixture_inference_smoke_completed',
      parsedJson: true,
      schemaValid: true,
      structuredMetadataOutputAccepted: true,
      rawOutputStoredInRepo: false,
      failClosedRestorePassed: true,
      excludedPr: 577,
    },
    confirmationGate: {
      env: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_ENV,
      requiredValue: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_CONFIRM_VALUE,
      confirmationPresent,
      currentPhaseRemoteReadbackExecuted: false,
    },
    target: {
      targetRef,
      namedTargetRequiredBeforeRemoteReadback: true,
    },
    requiredReadbackRefs: {
      ...routeIntegration.serviceRoleSafeReadback,
      authenticatedUserRef: routeIntegration.authenticatedRoute.authenticatedUserRef,
      workspaceMembershipRef: routeIntegration.authenticatedRoute.workspaceMembershipRef,
      routeIdempotencyKey: routeIntegration.authenticatedRoute.routeIdempotencyKey,
    },
    allowedReadbackUse: {
      routeId: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_ID,
      routeContractReady: routeIntegration.ok,
      sourceOnlyReadbackValidationGate: true,
      actualRemoteReadbackAllowedNow: false,
      routeHandlerExecutionAllowedNow: false,
      supabaseReadbackExecutionAllowedNow: false,
      serviceRoleReadbackExecutionAllowedNow: false,
      secretPayloadAccessAllowedNow: false,
      sqlMutationAllowedNow: false,
      supabaseMutationAllowedNow: false,
      workerDispatchAllowedNow: false,
      providerModelCallAllowedNow: false,
      mediaProcessingAllowedNow: false,
      signedUrlCreationAllowedNow: false,
      publicArtifactAllowedNow: false,
      finalRenderExportAllowedNow: false,
      externalBetaUnlockAllowedNow: false,
      paidProductionUnlockAllowedNow: false,
      productionUnlockAllowedNow: false,
    },
    safety: {
      sourceOnlyProductRouteReadbackValidation: true,
      qwenRuntimeExecutedInThisPhase: false,
      routeReadbackExecution: false,
      routeHandlerExecution: false,
      supabaseReadbackExecution: false,
      serviceRoleReadbackExecution: false,
      remoteRuntimeExecution: false,
      cloudRunServiceUpdated: false,
      cloudRunJobExecuted: false,
      identityTokenFetch: false,
      providerCall: false,
      modelCall: false,
      frontendProviderModelCall: false,
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
    blockers,
    nextMilestone: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_NEXT_MILESTONE,
  }
}

export function assertQwen25VlExternalBetaProductRouteReadbackValidationResult(
  result: Qwen25VlExternalBetaProductRouteReadbackValidationResult,
): void {
  if (result.decision !== QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_DECISION) {
    throw new Error('QWEN product route readback validation decision mismatch.')
  }
  if (result.execution !== QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_EXECUTION) {
    throw new Error('QWEN product route readback validation execution mismatch.')
  }
  assertQwen25VlExternalBetaProductWorkflowRouteIntegrationResult(result.routeIntegration)
  if (result.sourceEvidence.productWorkflowRouteIntegrationPr !== 1339) {
    throw new Error('QWEN product route readback validation must reference route integration #1339.')
  }
  if (result.sourceEvidence.productWorkflowRouteIntegrationMergeSha !== '0350f42c1cda721d890cdd90155b0c948060686a') {
    throw new Error('QWEN product route integration merge SHA mismatch.')
  }
  if (result.sourceEvidence.rawOutputStoredInRepo) throw new Error('QWEN raw output must not be stored in repo.')
  if (!result.sourceEvidence.failClosedRestorePassed) throw new Error('QWEN fail-closed restore must remain passed.')
  if (result.confirmationGate.currentPhaseRemoteReadbackExecuted) {
    throw new Error('QWEN product route readback validation must not execute remote readback in this phase.')
  }
  if (!result.target.namedTargetRequiredBeforeRemoteReadback) {
    throw new Error('QWEN product route readback validation must require a named remote target.')
  }
  for (const [key, value] of Object.entries(result.allowedReadbackUse)) {
    if (key.endsWith('AllowedNow') && value !== false) {
      throw new Error(`QWEN product route readback allowed-use flag ${key} must remain false.`)
    }
  }
  for (const [key, value] of Object.entries(result.safety)) {
    if (key === 'sourceOnlyProductRouteReadbackValidation') {
      if (value !== true) throw new Error('QWEN product route readback validation source-only flag must remain true.')
      continue
    }
    if (value !== false) throw new Error(`QWEN product route readback safety flag ${key} must remain false.`)
  }
}
