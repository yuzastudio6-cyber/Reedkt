export const RP_EXTERNAL_BETA_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_PACKET =
  'RP-EXTERNAL-BETA-QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_1' as const

export const RP_EXTERNAL_BETA_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_DECISION =
  'completed_qwen2_5_vl_approved_snapshot_job_orchestration_e2e_source_contract' as const

export const RP_EXTERNAL_BETA_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_EXECUTION =
  'completed_backend_only_approved_snapshot_job_orchestration_source_no_runtime_execution' as const

export const RP_EXTERNAL_BETA_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_READY_STATUS =
  'ready_for_guarded_qwen2_5_vl_approved_snapshot_job_orchestration_runtime_fixture' as const

export const RP_EXTERNAL_BETA_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_NEXT_MILESTONE =
  'RP-EXTERNAL-BETA-QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_RUNTIME_FIXTURE_1' as const

export type Qwen25VlApprovedSnapshotJobOrchestrationStatus =
  | typeof RP_EXTERNAL_BETA_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_READY_STATUS
  | 'blocked_missing_approved_snapshot_job_orchestration_dependency'
  | 'blocked_invalid_approved_snapshot_job_orchestration_state'
  | 'blocked_unsafe_approved_snapshot_job_orchestration_request'

export interface Qwen25VlApprovedSnapshotJobOrchestrationInput {
  workspaceId?: string | null
  projectId?: string | null
  editSessionId?: string | null
  editPlanVersionId?: string | null
  approvedSnapshotRef?: string | null
  approvalRecordRef?: string | null
  creditEstimateRef?: string | null
  creditReservationRef?: string | null
  jobBatchRef?: string | null
  jobRef?: string | null
  workerLeaseRef?: string | null
  routeIdempotencyKey?: string | null
  providerRequestId?: string | null
  privateInputManifestRef?: string | null
  privateArtifactManifestRef?: string | null
  privateArtifactChecksumRef?: string | null
  sourceSequenceMapRef?: string | null
  compiledIntentRef?: string | null
  modelRoutingPolicyRef?: string | null
  qaPolicyRef?: string | null
  qwenRuntimeReadinessRollupRef?: string | null
  qwenProductRouteRuntimeRunId?: string | null
  approvedSnapshotStatus?: 'approved' | 'draft' | 'superseded' | 'rejected' | null
  creditReservationStatus?: 'reserved' | 'pending' | 'spent' | 'released' | 'refunded' | null
  jobStatus?: 'queued' | 'leased' | 'running' | 'completed' | 'failed' | null
  workerLeaseStatus?: 'claimed' | 'pending' | 'expired' | 'released' | null
  qwenProductRouteRuntimeHttpStatus?: number | null
  qwenStructuredMetadataAccepted?: boolean | null
  qwenFailClosedRestorePassed?: boolean | null
  routeExecutionRequestedNow?: boolean
  providerModelCallRequestedNow?: boolean
  workerDispatchRequestedNow?: boolean
  workerExecutionRequestedNow?: boolean
  cloudRunJobExecutionRequestedNow?: boolean
  supabaseMutationRequestedNow?: boolean
  sqlExecutionRequestedNow?: boolean
  creditMutationRequestedNow?: boolean
  signedUrlCreationRequestedNow?: boolean
  publicArtifactRequestedNow?: boolean
  mediaProcessingRequestedNow?: boolean
  finalRenderExportRequestedNow?: boolean
  externalBetaUnlockRequestedNow?: boolean
}

export interface Qwen25VlApprovedSnapshotJobOrchestrationResult {
  packet: typeof RP_EXTERNAL_BETA_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_PACKET
  decision: typeof RP_EXTERNAL_BETA_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_DECISION
  execution: typeof RP_EXTERNAL_BETA_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_EXECUTION
  ok: boolean
  status: Qwen25VlApprovedSnapshotJobOrchestrationStatus
  sourceEvidence: {
    approvedSnapshotPersistencePr: 1116
    creditReservationLedgerPr: 1118
    jobQueueLeaseEventPr: 1123
    privateArtifactStoragePr: 1128
    approvedSnapshotRouteWritePr: 'recorded_in_docs'
    qwenProductRouteBackendHandoffPr: 1380
    qwenProductRouteProviderRuntimeColdStartRetryPr: 1403
    qwenProductRouteRuntimeReadinessRollupPr: 1407
    qwenProductRouteRuntimeReadinessRollupMergeSha: '71fe816d96135674bb634389ae08e2358806c33f'
    excludedPr: 577
  }
  requiredReferences: {
    workspaceId: string | null
    projectId: string | null
    editSessionId: string | null
    editPlanVersionId: string | null
    approvedSnapshotRef: string | null
    approvalRecordRef: string | null
    creditEstimateRef: string | null
    creditReservationRef: string | null
    jobBatchRef: string | null
    jobRef: string | null
    workerLeaseRef: string | null
    routeIdempotencyKey: string | null
    providerRequestId: string | null
    privateInputManifestRef: string | null
    privateArtifactManifestRef: string | null
    privateArtifactChecksumRef: string | null
    sourceSequenceMapRef: string | null
    compiledIntentRef: string | null
    modelRoutingPolicyRef: string | null
    qaPolicyRef: string | null
    qwenRuntimeReadinessRollupRef: string | null
    qwenProductRouteRuntimeRunId: string | null
  }
  requiredState: {
    approvedSnapshotStatus: Qwen25VlApprovedSnapshotJobOrchestrationInput['approvedSnapshotStatus']
    creditReservationStatus: Qwen25VlApprovedSnapshotJobOrchestrationInput['creditReservationStatus']
    jobStatus: Qwen25VlApprovedSnapshotJobOrchestrationInput['jobStatus']
    workerLeaseStatus: Qwen25VlApprovedSnapshotJobOrchestrationInput['workerLeaseStatus']
    qwenProductRouteRuntimeHttpStatus: number | null | undefined
    qwenStructuredMetadataAccepted: boolean | null | undefined
    qwenFailClosedRestorePassed: boolean | null | undefined
  }
  orchestrationEnvelope: {
    backendOnly: true
    sourceContractOnly: true
    approvedSnapshotRequired: true
    approvalRecordRequired: true
    creditReservationRequired: true
    queueLeaseRequired: true
    idempotencyRequired: true
    privateManifestReferencesOnly: true
    qwenProductRouteRuntimeEvidenceRequired: true
    envelopePrepared: boolean
    routeId: 'providers.qwen25Vl.structuredVisualMetadataPlan'
    adapterRuntimeLane: 'qwen2_5_vl_confirmed_private_adapter_runtime_fixture'
  }
  allowedExecution: {
    orchestrationEnvelopePreparedNow: boolean
    routeExecutionAllowedNow: false
    providerModelCallAllowedNow: false
    workerDispatchAllowedNow: false
    workerExecutionAllowedNow: false
    cloudRunJobExecutionAllowedNow: false
    supabaseMutationAllowedNow: false
    sqlExecutionAllowedNow: false
    creditMutationAllowedNow: false
    signedUrlCreationAllowedNow: false
    publicArtifactAllowedNow: false
    mediaProcessingAllowedNow: false
    finalRenderExportAllowedNow: false
    externalBetaUnlockAllowedNow: false
  }
  safety: {
    backendOnlyApprovedSnapshotJobOrchestrationSource: true
    sourceContractOnly: true
    routeExecution: false
    qwenRuntimeExecutedInThisPhase: false
    providerCall: false
    modelCall: false
    workerDispatch: false
    workerExecution: false
    cloudRunJobExecution: false
    supabaseMutation: false
    sqlExecution: false
    creditMutation: false
    signedUrlCreation: false
    publicArtifactCreation: false
    mediaProcessing: false
    privateUserMediaProcessing: false
    rawPromptExecution: false
    finalRenderExport: false
    externalBetaUnlockAppliedToEnvironment: false
    packageLockMutation: false
  }
  blockers: string[]
  nextMilestone: typeof RP_EXTERNAL_BETA_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_NEXT_MILESTONE
}

function normalize(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function hasUnsafeRequest(input: Qwen25VlApprovedSnapshotJobOrchestrationInput): boolean {
  return Boolean(
    input.routeExecutionRequestedNow ||
      input.providerModelCallRequestedNow ||
      input.workerDispatchRequestedNow ||
      input.workerExecutionRequestedNow ||
      input.cloudRunJobExecutionRequestedNow ||
      input.supabaseMutationRequestedNow ||
      input.sqlExecutionRequestedNow ||
      input.creditMutationRequestedNow ||
      input.signedUrlCreationRequestedNow ||
      input.publicArtifactRequestedNow ||
      input.mediaProcessingRequestedNow ||
      input.finalRenderExportRequestedNow ||
      input.externalBetaUnlockRequestedNow,
  )
}

function missingReferenceBlockers(input: Qwen25VlApprovedSnapshotJobOrchestrationInput): string[] {
  const refs: Array<[keyof Qwen25VlApprovedSnapshotJobOrchestrationInput, string]> = [
    ['workspaceId', 'workspace_reference_required'],
    ['projectId', 'project_reference_required'],
    ['editSessionId', 'edit_session_reference_required'],
    ['editPlanVersionId', 'edit_plan_version_reference_required'],
    ['approvedSnapshotRef', 'approved_snapshot_reference_required'],
    ['approvalRecordRef', 'approval_record_reference_required'],
    ['creditEstimateRef', 'credit_estimate_reference_required'],
    ['creditReservationRef', 'credit_reservation_reference_required'],
    ['jobBatchRef', 'job_batch_reference_required'],
    ['jobRef', 'job_reference_required'],
    ['workerLeaseRef', 'worker_lease_reference_required'],
    ['routeIdempotencyKey', 'route_idempotency_key_required'],
    ['providerRequestId', 'provider_request_reference_required'],
    ['privateInputManifestRef', 'private_input_manifest_reference_required'],
    ['privateArtifactManifestRef', 'private_artifact_manifest_reference_required'],
    ['privateArtifactChecksumRef', 'private_artifact_checksum_reference_required'],
    ['sourceSequenceMapRef', 'source_sequence_map_reference_required'],
    ['compiledIntentRef', 'compiled_intent_reference_required'],
    ['modelRoutingPolicyRef', 'model_routing_policy_reference_required'],
    ['qaPolicyRef', 'qa_policy_reference_required'],
    ['qwenRuntimeReadinessRollupRef', 'qwen_runtime_readiness_rollup_reference_required'],
    ['qwenProductRouteRuntimeRunId', 'qwen_product_route_runtime_run_id_required'],
  ]
  return refs.flatMap(([key, blocker]) => (normalize(input[key] as string | null | undefined) ? [] : [blocker]))
}

function stateBlockers(input: Qwen25VlApprovedSnapshotJobOrchestrationInput): string[] {
  return [
    input.approvedSnapshotStatus !== 'approved' ? 'approved_snapshot_status_must_be_approved' : null,
    input.creditReservationStatus !== 'reserved' ? 'credit_reservation_status_must_be_reserved' : null,
    input.jobStatus !== 'queued' && input.jobStatus !== 'leased' ? 'job_status_must_be_queued_or_leased' : null,
    input.workerLeaseStatus !== 'claimed' ? 'worker_lease_status_must_be_claimed' : null,
    input.qwenProductRouteRuntimeHttpStatus !== 200 ? 'qwen_product_route_runtime_http_status_must_be_200' : null,
    input.qwenStructuredMetadataAccepted !== true ? 'qwen_structured_metadata_must_be_accepted' : null,
    input.qwenFailClosedRestorePassed !== true ? 'qwen_fail_closed_restore_must_have_passed' : null,
  ].filter((value): value is string => Boolean(value))
}

export function buildQwen25VlApprovedSnapshotJobOrchestrationE2E(
  input: Qwen25VlApprovedSnapshotJobOrchestrationInput = {},
): Qwen25VlApprovedSnapshotJobOrchestrationResult {
  const missingRefs = missingReferenceBlockers(input)
  const invalidStates = stateBlockers(input)
  const unsafeRequest = hasUnsafeRequest(input)
  const ok = missingRefs.length === 0 && invalidStates.length === 0 && !unsafeRequest
  const status: Qwen25VlApprovedSnapshotJobOrchestrationStatus = ok
    ? RP_EXTERNAL_BETA_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_READY_STATUS
    : unsafeRequest
      ? 'blocked_unsafe_approved_snapshot_job_orchestration_request'
      : missingRefs.length > 0
        ? 'blocked_missing_approved_snapshot_job_orchestration_dependency'
        : 'blocked_invalid_approved_snapshot_job_orchestration_state'

  const requiredReferences = {
    workspaceId: normalize(input.workspaceId),
    projectId: normalize(input.projectId),
    editSessionId: normalize(input.editSessionId),
    editPlanVersionId: normalize(input.editPlanVersionId),
    approvedSnapshotRef: normalize(input.approvedSnapshotRef),
    approvalRecordRef: normalize(input.approvalRecordRef),
    creditEstimateRef: normalize(input.creditEstimateRef),
    creditReservationRef: normalize(input.creditReservationRef),
    jobBatchRef: normalize(input.jobBatchRef),
    jobRef: normalize(input.jobRef),
    workerLeaseRef: normalize(input.workerLeaseRef),
    routeIdempotencyKey: normalize(input.routeIdempotencyKey),
    providerRequestId: normalize(input.providerRequestId),
    privateInputManifestRef: normalize(input.privateInputManifestRef),
    privateArtifactManifestRef: normalize(input.privateArtifactManifestRef),
    privateArtifactChecksumRef: normalize(input.privateArtifactChecksumRef),
    sourceSequenceMapRef: normalize(input.sourceSequenceMapRef),
    compiledIntentRef: normalize(input.compiledIntentRef),
    modelRoutingPolicyRef: normalize(input.modelRoutingPolicyRef),
    qaPolicyRef: normalize(input.qaPolicyRef),
    qwenRuntimeReadinessRollupRef: normalize(input.qwenRuntimeReadinessRollupRef),
    qwenProductRouteRuntimeRunId: normalize(input.qwenProductRouteRuntimeRunId),
  }

  return {
    packet: RP_EXTERNAL_BETA_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_PACKET,
    decision: RP_EXTERNAL_BETA_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_DECISION,
    execution: RP_EXTERNAL_BETA_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_EXECUTION,
    ok,
    status,
    sourceEvidence: {
      approvedSnapshotPersistencePr: 1116,
      creditReservationLedgerPr: 1118,
      jobQueueLeaseEventPr: 1123,
      privateArtifactStoragePr: 1128,
      approvedSnapshotRouteWritePr: 'recorded_in_docs',
      qwenProductRouteBackendHandoffPr: 1380,
      qwenProductRouteProviderRuntimeColdStartRetryPr: 1403,
      qwenProductRouteRuntimeReadinessRollupPr: 1407,
      qwenProductRouteRuntimeReadinessRollupMergeSha: '71fe816d96135674bb634389ae08e2358806c33f',
      excludedPr: 577,
    },
    requiredReferences,
    requiredState: {
      approvedSnapshotStatus: input.approvedSnapshotStatus ?? null,
      creditReservationStatus: input.creditReservationStatus ?? null,
      jobStatus: input.jobStatus ?? null,
      workerLeaseStatus: input.workerLeaseStatus ?? null,
      qwenProductRouteRuntimeHttpStatus: input.qwenProductRouteRuntimeHttpStatus ?? null,
      qwenStructuredMetadataAccepted: input.qwenStructuredMetadataAccepted ?? null,
      qwenFailClosedRestorePassed: input.qwenFailClosedRestorePassed ?? null,
    },
    orchestrationEnvelope: {
      backendOnly: true,
      sourceContractOnly: true,
      approvedSnapshotRequired: true,
      approvalRecordRequired: true,
      creditReservationRequired: true,
      queueLeaseRequired: true,
      idempotencyRequired: true,
      privateManifestReferencesOnly: true,
      qwenProductRouteRuntimeEvidenceRequired: true,
      envelopePrepared: ok,
      routeId: 'providers.qwen25Vl.structuredVisualMetadataPlan',
      adapterRuntimeLane: 'qwen2_5_vl_confirmed_private_adapter_runtime_fixture',
    },
    allowedExecution: {
      orchestrationEnvelopePreparedNow: ok,
      routeExecutionAllowedNow: false,
      providerModelCallAllowedNow: false,
      workerDispatchAllowedNow: false,
      workerExecutionAllowedNow: false,
      cloudRunJobExecutionAllowedNow: false,
      supabaseMutationAllowedNow: false,
      sqlExecutionAllowedNow: false,
      creditMutationAllowedNow: false,
      signedUrlCreationAllowedNow: false,
      publicArtifactAllowedNow: false,
      mediaProcessingAllowedNow: false,
      finalRenderExportAllowedNow: false,
      externalBetaUnlockAllowedNow: false,
    },
    safety: {
      backendOnlyApprovedSnapshotJobOrchestrationSource: true,
      sourceContractOnly: true,
      routeExecution: false,
      qwenRuntimeExecutedInThisPhase: false,
      providerCall: false,
      modelCall: false,
      workerDispatch: false,
      workerExecution: false,
      cloudRunJobExecution: false,
      supabaseMutation: false,
      sqlExecution: false,
      creditMutation: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      mediaProcessing: false,
      privateUserMediaProcessing: false,
      rawPromptExecution: false,
      finalRenderExport: false,
      externalBetaUnlockAppliedToEnvironment: false,
      packageLockMutation: false,
    },
    blockers: [
      ...missingRefs,
      ...invalidStates,
      unsafeRequest ? 'approved_snapshot_job_orchestration_rejects_runtime_execution_request_flags' : null,
    ].filter((value): value is string => Boolean(value)),
    nextMilestone: RP_EXTERNAL_BETA_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_NEXT_MILESTONE,
  }
}

export function assertQwen25VlApprovedSnapshotJobOrchestrationE2EResult(
  result: Qwen25VlApprovedSnapshotJobOrchestrationResult,
): void {
  if (result.decision !== RP_EXTERNAL_BETA_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_DECISION) {
    throw new Error('QWEN approved snapshot job orchestration decision mismatch.')
  }
  if (result.execution !== RP_EXTERNAL_BETA_QWEN2_5_VL_APPROVED_SNAPSHOT_JOB_ORCHESTRATION_E2E_EXECUTION) {
    throw new Error('QWEN approved snapshot job orchestration execution mismatch.')
  }
  if (!result.orchestrationEnvelope.backendOnly || !result.orchestrationEnvelope.sourceContractOnly) {
    throw new Error('QWEN approved snapshot job orchestration must remain backend-only source contract.')
  }
  if (result.ok !== result.orchestrationEnvelope.envelopePrepared) {
    throw new Error('QWEN approved snapshot job orchestration envelope state must match ok status.')
  }
  for (const [key, value] of Object.entries(result.allowedExecution)) {
    if (key === 'orchestrationEnvelopePreparedNow') {
      if (value !== result.ok) throw new Error('QWEN orchestration envelope prepared flag must match ok status.')
      continue
    }
    if (value !== false) throw new Error(`QWEN orchestration allowed execution flag ${key} must be false.`)
  }
  for (const [key, value] of Object.entries(result.safety)) {
    if (key === 'backendOnlyApprovedSnapshotJobOrchestrationSource' || key === 'sourceContractOnly') {
      if (value !== true) throw new Error(`QWEN orchestration safety flag ${key} must be true.`)
      continue
    }
    if (value !== false) throw new Error(`QWEN orchestration safety flag ${key} must be false.`)
  }
}
