import {
  QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_READY_STATUS,
  type Qwen25VlExternalBetaBackendRuntimeAdapterInput,
  type Qwen25VlExternalBetaBackendRuntimeAdapterResult,
  assertQwen25VlExternalBetaBackendRuntimeAdapterResult,
  buildQwen25VlExternalBetaBackendRuntimeAdapterContract,
} from './qwen2-5-vl-external-beta-backend-runtime-adapter'

export const QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_PACKET =
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_1' as const

export const QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_DECISION =
  'completed_qwen2_5_vl_external_beta_product_workflow_binding_source_contract' as const

export const QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_EXECUTION =
  'completed_product_workflow_binding_source_no_runtime_execution' as const

export const QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_READY_STATUS =
  'ready_for_guarded_qwen2_5_vl_external_beta_product_workflow_route_integration' as const

export const QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_NEXT_MILESTONE =
  'QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_ROUTE_INTEGRATION_1' as const

export type Qwen25VlExternalBetaProductWorkflowBindingStatus =
  | typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_READY_STATUS
  | 'blocked_pending_backend_runtime_adapter_readiness'
  | 'blocked_missing_product_workflow_reference'
  | 'blocked_product_workflow_unsafe_runtime_request'

export interface Qwen25VlExternalBetaProductWorkflowBindingInput
  extends Qwen25VlExternalBetaBackendRuntimeAdapterInput {
  workflowBindingId?: string | null
  workspaceId?: string | null
  projectId?: string | null
  editSessionId?: string | null
  sourceSequenceMapRef?: string | null
  compiledIntentSnapshotRef?: string | null
  editPlanVersionRef?: string | null
  modelRoutingPolicyRef?: string | null
  qaPolicyRef?: string | null
  workflowStatus?: 'planning_only' | 'approved_snapshot_candidate' | 'external_beta_guarded_binding' | null
  productRouteExecutionRequested?: boolean
  workerDispatchRequested?: boolean
  providerModelCallRequested?: boolean
  broadExternalBetaUnlockRequested?: boolean
}

export interface Qwen25VlExternalBetaProductWorkflowBindingResult {
  packet: typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_PACKET
  decision: typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_DECISION
  execution: typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_EXECUTION
  ok: boolean
  status: Qwen25VlExternalBetaProductWorkflowBindingStatus
  backendAdapter: Qwen25VlExternalBetaBackendRuntimeAdapterResult
  sourceEvidence: {
    backendRuntimeAdapterPr: 1321
    confirmedAdapterRuntimeFixturePr: 1328
    confirmedAdapterRuntimeFixtureMergeSha: '012f436a38b6a525246c673923105b14ae36c727'
    confirmedRunId: 'qwen25-adapter-runtime-fixture-2026-06-27T22-48-47-273Z-d12cb07d'
    serviceReason: 'qwen_fixture_inference_smoke_completed'
    parsedJson: true
    schemaValid: true
    structuredMetadataOutputAccepted: true
    rawOutputStoredInRepo: false
    failClosedRestorePassed: true
  }
  productWorkflow: {
    bindingId: string | null
    workspaceId: string | null
    projectId: string | null
    editSessionId: string | null
    workflowStatus: 'planning_only' | 'approved_snapshot_candidate' | 'external_beta_guarded_binding'
    sourceSequenceMapRef: string | null
    compiledIntentSnapshotRef: string | null
    editPlanVersionRef: string | null
    approvedSnapshotRef: string | null
    creditReservationRef: string | null
    queueLeaseRef: string | null
    idempotencyKey: string | null
    privateInputManifestRef: string | null
    privateArtifactManifestRef: string | null
    privateArtifactChecksumRef: string | null
    modelRoutingPolicyRef: string | null
    qaPolicyRef: string | null
  }
  allowedProductUse: {
    structuredVisualMetadataForPlanning: boolean
    sourceSequenceMapSupport: boolean
    approvedSnapshotOnly: true
    privateArtifactReferencesOnly: true
    productRouteExecutionAllowedNow: false
    workerDispatchAllowedNow: false
    providerModelCallAllowedNow: false
    finalRenderExportAllowedNow: false
    broadExternalBetaUnlockAllowedNow: false
  }
  safety: {
    sourceOnlyContract: true
    qwenRuntimeExecutedInThisPhase: false
    cloudRunServiceUpdated: false
    cloudRunJobExecuted: false
    identityTokenFetch: false
    providerCall: false
    modelCall: false
    workerExecution: false
    workerDispatch: false
    routeExecution: false
    supabaseMutation: false
    sqlExecution: false
    secretPayloadAccess: false
    signedUrlCreation: false
    publicArtifactCreation: false
    mediaProcessing: false
    finalRenderExport: false
    externalBetaUnlockAppliedToEnvironment: false
    productionUnlock: false
    creditMutation: false
    packageLockMutation: false
  }
  blockers: string[]
  nextMilestone: typeof QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_NEXT_MILESTONE
}

function normalize(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function missingRequiredProductRefs(input: Qwen25VlExternalBetaProductWorkflowBindingInput): string[] {
  const refs: Array<[keyof Qwen25VlExternalBetaProductWorkflowBindingInput, string]> = [
    ['workflowBindingId', 'workflow_binding_id_required'],
    ['workspaceId', 'workspace_id_required'],
    ['projectId', 'project_id_required'],
    ['editSessionId', 'edit_session_id_required'],
    ['sourceSequenceMapRef', 'source_sequence_map_reference_required'],
    ['compiledIntentSnapshotRef', 'compiled_intent_snapshot_reference_required'],
    ['editPlanVersionRef', 'edit_plan_version_reference_required'],
    ['approvedSnapshotRef', 'approved_snapshot_reference_required'],
    ['creditReservationRef', 'credit_reservation_reference_required'],
    ['queueLeaseRef', 'queue_lease_reference_required'],
    ['idempotencyKey', 'idempotency_key_required'],
    ['privateInputManifestRef', 'private_input_manifest_reference_required'],
    ['privateArtifactManifestRef', 'private_artifact_manifest_reference_required'],
    ['privateArtifactChecksumRef', 'private_artifact_checksum_reference_required'],
    ['modelRoutingPolicyRef', 'model_routing_policy_reference_required'],
    ['qaPolicyRef', 'qa_policy_reference_required'],
  ]
  return refs.flatMap(([key, blocker]) => (normalize(input[key] as string | null | undefined) ? [] : [blocker]))
}

export function buildQwen25VlExternalBetaProductWorkflowBinding(
  input: Qwen25VlExternalBetaProductWorkflowBindingInput = {},
): Qwen25VlExternalBetaProductWorkflowBindingResult {
  const backendAdapter = buildQwen25VlExternalBetaBackendRuntimeAdapterContract(input)
  assertQwen25VlExternalBetaBackendRuntimeAdapterResult(backendAdapter)

  const blockers = [...backendAdapter.blockers]
  if (!backendAdapter.ok) blockers.push('backend_runtime_adapter_must_be_ready')

  const missingRefs = missingRequiredProductRefs(input)
  blockers.push(...missingRefs)

  const unsafeRuntimeRequest =
    input.productRouteExecutionRequested ||
    input.workerDispatchRequested ||
    input.providerModelCallRequested ||
    input.broadExternalBetaUnlockRequested
  if (unsafeRuntimeRequest) blockers.push('product_workflow_binding_runtime_execution_not_allowed_in_this_phase')

  const ok = backendAdapter.ok && missingRefs.length === 0 && !unsafeRuntimeRequest
  const status: Qwen25VlExternalBetaProductWorkflowBindingStatus = ok
    ? QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_READY_STATUS
    : !backendAdapter.ok
      ? 'blocked_pending_backend_runtime_adapter_readiness'
      : unsafeRuntimeRequest
        ? 'blocked_product_workflow_unsafe_runtime_request'
        : 'blocked_missing_product_workflow_reference'

  return {
    packet: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_PACKET,
    decision: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_DECISION,
    execution: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_EXECUTION,
    ok,
    status,
    backendAdapter,
    sourceEvidence: {
      backendRuntimeAdapterPr: 1321,
      confirmedAdapterRuntimeFixturePr: 1328,
      confirmedAdapterRuntimeFixtureMergeSha: '012f436a38b6a525246c673923105b14ae36c727',
      confirmedRunId: 'qwen25-adapter-runtime-fixture-2026-06-27T22-48-47-273Z-d12cb07d',
      serviceReason: 'qwen_fixture_inference_smoke_completed',
      parsedJson: true,
      schemaValid: true,
      structuredMetadataOutputAccepted: true,
      rawOutputStoredInRepo: false,
      failClosedRestorePassed: true,
    },
    productWorkflow: {
      bindingId: normalize(input.workflowBindingId),
      workspaceId: normalize(input.workspaceId),
      projectId: normalize(input.projectId),
      editSessionId: normalize(input.editSessionId),
      workflowStatus: input.workflowStatus ?? 'external_beta_guarded_binding',
      sourceSequenceMapRef: normalize(input.sourceSequenceMapRef),
      compiledIntentSnapshotRef: normalize(input.compiledIntentSnapshotRef),
      editPlanVersionRef: normalize(input.editPlanVersionRef),
      approvedSnapshotRef: normalize(input.approvedSnapshotRef),
      creditReservationRef: normalize(input.creditReservationRef),
      queueLeaseRef: normalize(input.queueLeaseRef),
      idempotencyKey: normalize(input.idempotencyKey),
      privateInputManifestRef: normalize(input.privateInputManifestRef),
      privateArtifactManifestRef: normalize(input.privateArtifactManifestRef),
      privateArtifactChecksumRef: normalize(input.privateArtifactChecksumRef),
      modelRoutingPolicyRef: normalize(input.modelRoutingPolicyRef),
      qaPolicyRef: normalize(input.qaPolicyRef),
    },
    allowedProductUse: {
      structuredVisualMetadataForPlanning: ok,
      sourceSequenceMapSupport: ok,
      approvedSnapshotOnly: true,
      privateArtifactReferencesOnly: true,
      productRouteExecutionAllowedNow: false,
      workerDispatchAllowedNow: false,
      providerModelCallAllowedNow: false,
      finalRenderExportAllowedNow: false,
      broadExternalBetaUnlockAllowedNow: false,
    },
    safety: {
      sourceOnlyContract: true,
      qwenRuntimeExecutedInThisPhase: false,
      cloudRunServiceUpdated: false,
      cloudRunJobExecuted: false,
      identityTokenFetch: false,
      providerCall: false,
      modelCall: false,
      workerExecution: false,
      workerDispatch: false,
      routeExecution: false,
      supabaseMutation: false,
      sqlExecution: false,
      secretPayloadAccess: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      mediaProcessing: false,
      finalRenderExport: false,
      externalBetaUnlockAppliedToEnvironment: false,
      productionUnlock: false,
      creditMutation: false,
      packageLockMutation: false,
    },
    blockers,
    nextMilestone: QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_NEXT_MILESTONE,
  }
}

export function assertQwen25VlExternalBetaProductWorkflowBindingResult(
  result: Qwen25VlExternalBetaProductWorkflowBindingResult,
): void {
  if (result.decision !== QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_DECISION) {
    throw new Error('QWEN product workflow binding decision mismatch.')
  }
  if (result.execution !== QWEN2_5_VL_EXTERNAL_BETA_PRODUCT_WORKFLOW_BINDING_EXECUTION) {
    throw new Error('QWEN product workflow binding execution mismatch.')
  }
  assertQwen25VlExternalBetaBackendRuntimeAdapterResult(result.backendAdapter)
  if (result.ok && result.backendAdapter.status !== QWEN2_5_VL_EXTERNAL_BETA_BACKEND_RUNTIME_ADAPTER_READY_STATUS) {
    throw new Error('QWEN product workflow binding requires ready backend adapter status.')
  }
  if (result.sourceEvidence.confirmedAdapterRuntimeFixturePr !== 1328) {
    throw new Error('QWEN product workflow binding must reference confirmed adapter runtime fixture #1328.')
  }
  if (result.sourceEvidence.serviceReason !== 'qwen_fixture_inference_smoke_completed') {
    throw new Error('QWEN confirmed adapter runtime fixture service reason mismatch.')
  }
  if (!result.sourceEvidence.parsedJson || !result.sourceEvidence.schemaValid) {
    throw new Error('QWEN confirmed fixture structured metadata must remain parsed and schema-valid.')
  }
  if (result.sourceEvidence.rawOutputStoredInRepo) throw new Error('QWEN raw output must not be stored in repo.')
  if (!result.sourceEvidence.failClosedRestorePassed) throw new Error('QWEN fail-closed restore must be passed.')
  if (!result.allowedProductUse.approvedSnapshotOnly) throw new Error('QWEN product binding must require approved snapshots.')
  if (!result.allowedProductUse.privateArtifactReferencesOnly) {
    throw new Error('QWEN product binding must require private artifact references.')
  }
  if (result.allowedProductUse.productRouteExecutionAllowedNow) {
    throw new Error('QWEN product route execution must remain blocked in this phase.')
  }
  if (result.allowedProductUse.workerDispatchAllowedNow) {
    throw new Error('QWEN worker dispatch must remain blocked in this phase.')
  }
  if (result.allowedProductUse.providerModelCallAllowedNow) {
    throw new Error('QWEN provider/model calls must remain blocked in this phase.')
  }
  if (result.allowedProductUse.finalRenderExportAllowedNow) {
    throw new Error('QWEN final render/export must remain blocked in this phase.')
  }
  if (result.allowedProductUse.broadExternalBetaUnlockAllowedNow) {
    throw new Error('QWEN broad external beta unlock must remain blocked in this phase.')
  }
  for (const [key, value] of Object.entries(result.safety)) {
    if (key === 'sourceOnlyContract') {
      if (value !== true) throw new Error('QWEN product binding source-only safety flag must remain true.')
      continue
    }
    if (value !== false) throw new Error(`QWEN product binding safety flag ${key} must remain false.`)
  }
}
