import { PROVIDER_API_ROUTES } from '../../src/backend/api/routes/provider-api-routes'
import type { ApiRouteDefinition } from '../../src/backend/api/api-runtime-contracts'
import {
  QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_READY_STATUS,
  type Qwen25VlExternalBetaProductWorkflowBindingInput,
  type Qwen25VlExternalBetaProductWorkflowBindingResult,
  assertQwen25VlExternalBetaProductWorkflowBindingResult,
  buildQwen25VlExternalBetaProductWorkflowBinding,
} from './qwen2-5-vl-external-beta-product-workflow-binding'

export const QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_PACKET =
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_1' as const

export const QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_DECISION =
  'completed_qwen2_5_vl_external_beta_product_workflow_route_integration_source_contract' as const

export const QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_EXECUTION =
  'completed_backend_route_integration_source_no_runtime_execution' as const

export const QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_READY_STATUS =
  'ready_for_guarded_qwen2_5_vl_external_beta_product_route_readback_validation' as const

export const QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_NEXT_MILESTONE =
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_ROUTE_READBACK_VALIDATION_1' as const

export const QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_ID =
  'providers.qwen25Vl.structuredVisualMetadataPlan' as const

export type Qwen25VlExternalBetaProductWorkflowRouteIntegrationStatus =
  | typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_READY_STATUS
  | 'blocked_pending_product_workflow_binding_readiness'
  | 'blocked_route_contract_missing_or_unsafe'
  | 'blocked_missing_authenticated_backend_route_reference'
  | 'blocked_missing_service_role_safe_readback_reference'
  | 'blocked_route_integration_unsafe_runtime_request'

export interface Qwen25VlExternalBetaProductWorkflowRouteIntegrationInput
  extends Qwen25VlExternalBetaProductWorkflowBindingInput {
  routeId?: string | null
  requestId?: string | null
  authenticatedUserRef?: string | null
  workspaceMembershipRef?: string | null
  routeIdempotencyKey?: string | null
  approvedSnapshotReadbackRef?: string | null
  creditReservationReadbackRef?: string | null
  queueLeaseReadbackRef?: string | null
  privateInputManifestReadbackRef?: string | null
  privateArtifactManifestReadbackRef?: string | null
  privateArtifactChecksumReadbackRef?: string | null
  sourceSequenceMapReadbackRef?: string | null
  compiledIntentReadbackRef?: string | null
  modelRoutingPolicyReadbackRef?: string | null
  qaPolicyReadbackRef?: string | null
  routeExecutionRequested?: boolean
  remoteRuntimeRequested?: boolean
  frontendProviderModelCallRequested?: boolean
  rawPromptExecutionRequested?: boolean
  arbitraryUserMediaRequested?: boolean
  signedUrlCreationRequested?: boolean
  publicArtifactRequested?: boolean
  finalRenderExportRequested?: boolean
  externalBetaUnlockRequested?: boolean
  paidProductionUnlockRequested?: boolean
  productionUnlockRequested?: boolean
}

export interface Qwen25VlExternalBetaProductWorkflowRouteIntegrationResult {
  packet: typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_PACKET
  decision: typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_DECISION
  execution: typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_EXECUTION
  ok: boolean
  status: Qwen25VlExternalBetaProductWorkflowRouteIntegrationStatus
  productWorkflowBinding: Qwen25VlExternalBetaProductWorkflowBindingResult
  sourceEvidence: {
    backendRuntimeAdapterPr: 1321
    confirmedAdapterRuntimeFixturePr: 1328
    productWorkflowBindingPr: 1333
    productWorkflowBindingMergeSha: 'e0cae42a25f1b7d390654fcc8b610f30b86c8358'
    confirmedRunId: 'qwen25-adapter-runtime-fixture-2026-06-27T22-48-47-273Z-d12cb07d'
    serviceReason: 'qwen_fixture_inference_smoke_completed'
    parsedJson: true
    schemaValid: true
    structuredMetadataOutputAccepted: true
    rawOutputStoredInRepo: false
    failClosedRestorePassed: true
    excludedPr: 577
  }
  routeContract: {
    routeId: typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_ID
    method: 'POST'
    path: '/api/providers/qwen2-5-vl/structured-visual-metadata'
    domain: 'providers'
    securityLevel: 'workspace_editor'
    runtimeMode: 'backend_required'
    status: 'backend_required'
    requiresSupabase: true
    requiresServiceRole: true
    requiresProviderSecret: true
    routeContractRegistered: boolean
    routeHandlerRegisteredNow: false
    mockHandlerRegisteredNow: false
    authenticatedBackendOnlyRoute: boolean
    serviceRoleSafeReadbackRequired: true
  }
  authenticatedRoute: {
    requestId: string | null
    authenticatedUserRef: string | null
    workspaceMembershipRef: string | null
    routeIdempotencyKey: string | null
  }
  serviceRoleSafeReadback: {
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
  }
  allowedRouteUse: {
    structuredVisualMetadataPlanningRouteContract: boolean
    sourceSequenceMapSupportRouteContract: boolean
    approvedSnapshotReadbackOnly: true
    privateArtifactReferenceReadbackOnly: true
    routeExecutionAllowedNow: false
    remoteRuntimeAllowedNow: false
    workerDispatchAllowedNow: false
    providerModelCallAllowedNow: false
    rawPromptExecutionAllowedNow: false
    arbitraryUserMediaAllowedNow: false
    signedUrlCreationAllowedNow: false
    publicArtifactAllowedNow: false
    finalRenderExportAllowedNow: false
    externalBetaUnlockAllowedNow: false
    paidProductionUnlockAllowedNow: false
    productionUnlockAllowedNow: false
  }
  safety: {
    sourceOnlyRouteIntegration: true
    qwenRuntimeExecutedInThisPhase: false
    routeHandlerRegistered: false
    mockHandlerRegistered: false
    routeExecution: false
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
  nextMilestone: typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_NEXT_MILESTONE
}

function normalize(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function getRouteContract(): ApiRouteDefinition | undefined {
  return PROVIDER_API_ROUTES.find((route) => route.id === QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_ID)
}

function isSafeRouteContract(route: ApiRouteDefinition | undefined): route is ApiRouteDefinition {
  return Boolean(
    route &&
      route.domain === 'providers' &&
      route.method === 'POST' &&
      route.path === '/api/providers/qwen2-5-vl/structured-visual-metadata' &&
      route.securityLevel === 'workspace_editor' &&
      route.runtimeMode === 'backend_required' &&
      route.status === 'backend_required' &&
      route.requiresSupabase &&
      route.requiresServiceRole &&
      route.requiresProviderSecret &&
      !route.requiresStripeSecret,
  )
}

function missingAuthenticatedRouteRefs(
  input: Qwen25VlExternalBetaProductWorkflowRouteIntegrationInput,
): string[] {
  const refs: Array<[keyof Qwen25VlExternalBetaProductWorkflowRouteIntegrationInput, string]> = [
    ['requestId', 'request_id_required'],
    ['authenticatedUserRef', 'authenticated_user_reference_required'],
    ['workspaceMembershipRef', 'workspace_membership_reference_required'],
    ['routeIdempotencyKey', 'route_idempotency_key_required'],
  ]
  return refs.flatMap(([key, blocker]) => (normalize(input[key] as string | null | undefined) ? [] : [blocker]))
}

function missingServiceRoleReadbackRefs(
  input: Qwen25VlExternalBetaProductWorkflowRouteIntegrationInput,
): string[] {
  const refs: Array<[keyof Qwen25VlExternalBetaProductWorkflowRouteIntegrationInput, string]> = [
    ['approvedSnapshotReadbackRef', 'approved_snapshot_readback_reference_required'],
    ['creditReservationReadbackRef', 'credit_reservation_readback_reference_required'],
    ['queueLeaseReadbackRef', 'queue_lease_readback_reference_required'],
    ['privateInputManifestReadbackRef', 'private_input_manifest_readback_reference_required'],
    ['privateArtifactManifestReadbackRef', 'private_artifact_manifest_readback_reference_required'],
    ['privateArtifactChecksumReadbackRef', 'private_artifact_checksum_readback_reference_required'],
    ['sourceSequenceMapReadbackRef', 'source_sequence_map_readback_reference_required'],
    ['compiledIntentReadbackRef', 'compiled_intent_readback_reference_required'],
    ['modelRoutingPolicyReadbackRef', 'model_routing_policy_readback_reference_required'],
    ['qaPolicyReadbackRef', 'qa_policy_readback_reference_required'],
  ]
  return refs.flatMap(([key, blocker]) => (normalize(input[key] as string | null | undefined) ? [] : [blocker]))
}

function hasUnsafeRuntimeRequest(input: Qwen25VlExternalBetaProductWorkflowRouteIntegrationInput): boolean {
  return Boolean(
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

export function buildQwen25VlExternalBetaProductWorkflowRouteIntegration(
  input: Qwen25VlExternalBetaProductWorkflowRouteIntegrationInput = {},
): Qwen25VlExternalBetaProductWorkflowRouteIntegrationResult {
  const productWorkflowBinding = buildQwen25VlExternalBetaProductWorkflowBinding(input)
  assertQwen25VlExternalBetaProductWorkflowBindingResult(productWorkflowBinding)

  const route = getRouteContract()
  const safeRouteContract = isSafeRouteContract(route)
  const missingAuthRefs = missingAuthenticatedRouteRefs(input)
  const missingReadbackRefs = missingServiceRoleReadbackRefs(input)
  const unsafeRuntimeRequest = hasUnsafeRuntimeRequest(input)

  const blockers = [...productWorkflowBinding.blockers]
  if (!productWorkflowBinding.ok) blockers.push('product_workflow_binding_must_be_ready')
  if (!safeRouteContract) blockers.push('qwen_product_workflow_route_contract_missing_or_unsafe')
  blockers.push(...missingAuthRefs, ...missingReadbackRefs)
  if (unsafeRuntimeRequest) blockers.push('qwen_product_workflow_route_runtime_execution_not_allowed_in_this_phase')

  const ok =
    productWorkflowBinding.ok &&
    productWorkflowBinding.status === QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_READY_STATUS &&
    safeRouteContract &&
    missingAuthRefs.length === 0 &&
    missingReadbackRefs.length === 0 &&
    !unsafeRuntimeRequest

  const status: Qwen25VlExternalBetaProductWorkflowRouteIntegrationStatus = ok
    ? QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_READY_STATUS
    : !productWorkflowBinding.ok
      ? 'blocked_pending_product_workflow_binding_readiness'
      : !safeRouteContract
        ? 'blocked_route_contract_missing_or_unsafe'
        : unsafeRuntimeRequest
          ? 'blocked_route_integration_unsafe_runtime_request'
          : missingAuthRefs.length > 0
            ? 'blocked_missing_authenticated_backend_route_reference'
            : 'blocked_missing_service_role_safe_readback_reference'

  return {
    packet: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_PACKET,
    decision: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_DECISION,
    execution: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_EXECUTION,
    ok,
    status,
    productWorkflowBinding,
    sourceEvidence: {
      backendRuntimeAdapterPr: 1321,
      confirmedAdapterRuntimeFixturePr: 1328,
      productWorkflowBindingPr: 1333,
      productWorkflowBindingMergeSha: 'e0cae42a25f1b7d390654fcc8b610f30b86c8358',
      confirmedRunId: 'qwen25-adapter-runtime-fixture-2026-06-27T22-48-47-273Z-d12cb07d',
      serviceReason: 'qwen_fixture_inference_smoke_completed',
      parsedJson: true,
      schemaValid: true,
      structuredMetadataOutputAccepted: true,
      rawOutputStoredInRepo: false,
      failClosedRestorePassed: true,
      excludedPr: 577,
    },
    routeContract: {
      routeId: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_ID,
      method: 'POST',
      path: '/api/providers/qwen2-5-vl/structured-visual-metadata',
      domain: 'providers',
      securityLevel: 'workspace_editor',
      runtimeMode: 'backend_required',
      status: 'backend_required',
      requiresSupabase: true,
      requiresServiceRole: true,
      requiresProviderSecret: true,
      routeContractRegistered: safeRouteContract,
      routeHandlerRegisteredNow: false,
      mockHandlerRegisteredNow: false,
      authenticatedBackendOnlyRoute: safeRouteContract,
      serviceRoleSafeReadbackRequired: true,
    },
    authenticatedRoute: {
      requestId: normalize(input.requestId),
      authenticatedUserRef: normalize(input.authenticatedUserRef),
      workspaceMembershipRef: normalize(input.workspaceMembershipRef),
      routeIdempotencyKey: normalize(input.routeIdempotencyKey),
    },
    serviceRoleSafeReadback: {
      approvedSnapshotReadbackRef: normalize(input.approvedSnapshotReadbackRef),
      creditReservationReadbackRef: normalize(input.creditReservationReadbackRef),
      queueLeaseReadbackRef: normalize(input.queueLeaseReadbackRef),
      privateInputManifestReadbackRef: normalize(input.privateInputManifestReadbackRef),
      privateArtifactManifestReadbackRef: normalize(input.privateArtifactManifestReadbackRef),
      privateArtifactChecksumReadbackRef: normalize(input.privateArtifactChecksumReadbackRef),
      sourceSequenceMapReadbackRef: normalize(input.sourceSequenceMapReadbackRef),
      compiledIntentReadbackRef: normalize(input.compiledIntentReadbackRef),
      modelRoutingPolicyReadbackRef: normalize(input.modelRoutingPolicyReadbackRef),
      qaPolicyReadbackRef: normalize(input.qaPolicyReadbackRef),
    },
    allowedRouteUse: {
      structuredVisualMetadataPlanningRouteContract: ok,
      sourceSequenceMapSupportRouteContract: ok,
      approvedSnapshotReadbackOnly: true,
      privateArtifactReferenceReadbackOnly: true,
      routeExecutionAllowedNow: false,
      remoteRuntimeAllowedNow: false,
      workerDispatchAllowedNow: false,
      providerModelCallAllowedNow: false,
      rawPromptExecutionAllowedNow: false,
      arbitraryUserMediaAllowedNow: false,
      signedUrlCreationAllowedNow: false,
      publicArtifactAllowedNow: false,
      finalRenderExportAllowedNow: false,
      externalBetaUnlockAllowedNow: false,
      paidProductionUnlockAllowedNow: false,
      productionUnlockAllowedNow: false,
    },
    safety: {
      sourceOnlyRouteIntegration: true,
      qwenRuntimeExecutedInThisPhase: false,
      routeHandlerRegistered: false,
      mockHandlerRegistered: false,
      routeExecution: false,
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
    nextMilestone: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_NEXT_MILESTONE,
  }
}

export function assertQwen25VlExternalBetaProductWorkflowRouteIntegrationResult(
  result: Qwen25VlExternalBetaProductWorkflowRouteIntegrationResult,
): void {
  if (result.decision !== QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_DECISION) {
    throw new Error('QWEN product workflow route integration decision mismatch.')
  }
  if (result.execution !== QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_EXECUTION) {
    throw new Error('QWEN product workflow route integration execution mismatch.')
  }
  assertQwen25VlExternalBetaProductWorkflowBindingResult(result.productWorkflowBinding)
  if (result.ok && result.productWorkflowBinding.status !== QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_READY_STATUS) {
    throw new Error('QWEN product workflow route integration requires ready product binding.')
  }
  if (result.sourceEvidence.productWorkflowBindingPr !== 1333) {
    throw new Error('QWEN product workflow route integration must reference product workflow binding #1333.')
  }
  if (result.sourceEvidence.productWorkflowBindingMergeSha !== 'e0cae42a25f1b7d390654fcc8b610f30b86c8358') {
    throw new Error('QWEN product workflow binding merge SHA mismatch.')
  }
  if (!result.sourceEvidence.parsedJson || !result.sourceEvidence.schemaValid) {
    throw new Error('QWEN route integration must preserve parsed/schema-valid fixture evidence.')
  }
  if (result.sourceEvidence.rawOutputStoredInRepo) throw new Error('QWEN raw output must not be stored in repo.')
  if (!result.sourceEvidence.failClosedRestorePassed) throw new Error('QWEN fail-closed restore must remain passed.')
  if (!result.routeContract.routeContractRegistered) throw new Error('QWEN route contract must be registered.')
  if (!result.routeContract.authenticatedBackendOnlyRoute) {
    throw new Error('QWEN route contract must remain authenticated and backend-only.')
  }
  if (!result.routeContract.requiresServiceRole) throw new Error('QWEN route contract must require service-role readback.')
  if (!result.routeContract.requiresProviderSecret) throw new Error('QWEN route contract must require backend provider secret boundary.')
  if (result.routeContract.routeHandlerRegisteredNow) throw new Error('QWEN route handler must not be registered now.')
  if (result.routeContract.mockHandlerRegisteredNow) throw new Error('QWEN mock route handler must not be registered now.')
  if (!result.allowedRouteUse.approvedSnapshotReadbackOnly) {
    throw new Error('QWEN route integration must require approved snapshot readback only.')
  }
  if (!result.allowedRouteUse.privateArtifactReferenceReadbackOnly) {
    throw new Error('QWEN route integration must require private artifact reference readback only.')
  }
  for (const [key, value] of Object.entries(result.allowedRouteUse)) {
    if (key.endsWith('AllowedNow') && value !== false) {
      throw new Error(`QWEN route allowed-use flag ${key} must remain false.`)
    }
  }
  for (const [key, value] of Object.entries(result.safety)) {
    if (key === 'sourceOnlyRouteIntegration') {
      if (value !== true) throw new Error('QWEN route source-only safety flag must remain true.')
      continue
    }
    if (value !== false) throw new Error(`QWEN route safety flag ${key} must remain false.`)
  }
}
