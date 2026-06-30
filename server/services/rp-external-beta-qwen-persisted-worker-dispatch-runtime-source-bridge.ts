export const RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_PACKET =
  'RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-RUNTIME-SOURCE-BRIDGE-1' as const

export const RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_DECISION =
  'completed_qwen_persisted_worker_dispatch_runtime_source_bridge' as const

export const RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_EXECUTION =
  'completed_backend_only_persisted_dispatch_source_bridge_no_runtime_execution' as const

export const RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_READY_STATUS =
  'ready_for_confirmed_qwen_persisted_worker_dispatch_approved_fixture_inference_runtime_retry' as const

export const RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_NEXT_MILESTONE =
  'RP-EXTERNAL-BETA-QWEN-PERSISTED-WORKER-DISPATCH-APPROVED-FIXTURE-INFERENCE-CONFIRMED-RUNTIME-1R' as const

export const RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_CONFIRM_ENV =
  'REEDITPRO_CONFIRM_QWEN_PERSISTED_WORKER_DISPATCH_APPROVED_FIXTURE_INFERENCE' as const

export const RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_APPROVED_FIXTURE =
  'qwen25-approved-snapshot-job-orchestration-runtime-fixture-1-2026-06-28T07-37-02-997Z-a0b72404' as const

export type QwenPersistedWorkerDispatchRuntimeSourceBridgeStatus =
  | typeof RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_READY_STATUS
  | 'blocked_missing_persisted_worker_dispatch_bridge_reference'
  | 'blocked_invalid_persisted_worker_dispatch_bridge_state'
  | 'blocked_unsafe_persisted_worker_dispatch_bridge_request'

export interface QwenPersistedWorkerDispatchRuntimeSourceBridgeInput {
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
  approvedFixtureRef?: string | null
  approvedTesterAccount?: string | null
  googleCloudProjectId?: string | null
  region?: string | null
  supabaseTargetRef?: string | null
  timeoutCostCeilingRef?: string | null
  failClosedRestorePolicyRef?: string | null
  approvedSnapshotStatus?: 'approved' | 'draft' | 'superseded' | 'rejected' | null
  creditReservationStatus?: 'reserved' | 'pending' | 'spent' | 'released' | 'refunded' | null
  jobStatus?: 'queued' | 'leased' | 'running' | 'completed' | 'failed' | null
  workerLeaseStatus?: 'claimed' | 'pending' | 'expired' | 'released' | null
  privateInputManifestStatus?: 'approved_fixture_reference' | 'missing' | 'public' | null
  privateOutputManifestChecksumPolicy?: 'required' | 'missing' | null
  timeoutCostCeilingStatus?: 'satisfied' | 'missing' | null
  failClosedRestorePolicyStatus?: 'required' | 'missing' | null
  routeExecutionRequestedNow?: boolean
  providerModelCallRequestedNow?: boolean
  workerDispatchRequestedNow?: boolean
  workerExecutionRequestedNow?: boolean
  cloudRunJobExecutionRequestedNow?: boolean
  cloudRunServiceUpdateRequestedNow?: boolean
  supabaseMutationRequestedNow?: boolean
  sqlExecutionRequestedNow?: boolean
  secretPayloadAccessRequestedNow?: boolean
  creditMutationRequestedNow?: boolean
  signedUrlCreationRequestedNow?: boolean
  publicArtifactRequestedNow?: boolean
  mediaProcessingRequestedNow?: boolean
  finalRenderExportRequestedNow?: boolean
  externalBetaUnlockRequestedNow?: boolean
  productionUnlockRequestedNow?: boolean
}

export interface QwenPersistedWorkerDispatchRuntimeSourceBridgeResult {
  packet: typeof RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_PACKET
  decision: typeof RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_DECISION
  execution: typeof RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_EXECUTION
  ok: boolean
  status: QwenPersistedWorkerDispatchRuntimeSourceBridgeStatus
  sourceEvidence: {
    approvedSnapshotJobOrchestrationRuntimeFixtureRunId: typeof RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_APPROVED_FIXTURE
    qwenApprovedFixtureInferenceApprovalPr: 1810
    confirmedRuntimeClosurePr: 1815
    confirmedRuntimeClosureMergeSha: '3fb9ee8890aab91bfd8a5ac13007131f2a939442'
    excludedPr: 577
  }
  requiredReferences: Record<string, string | null>
  requiredState: {
    approvedSnapshotStatus: QwenPersistedWorkerDispatchRuntimeSourceBridgeInput['approvedSnapshotStatus']
    creditReservationStatus: QwenPersistedWorkerDispatchRuntimeSourceBridgeInput['creditReservationStatus']
    jobStatus: QwenPersistedWorkerDispatchRuntimeSourceBridgeInput['jobStatus']
    workerLeaseStatus: QwenPersistedWorkerDispatchRuntimeSourceBridgeInput['workerLeaseStatus']
    privateInputManifestStatus: QwenPersistedWorkerDispatchRuntimeSourceBridgeInput['privateInputManifestStatus']
    privateOutputManifestChecksumPolicy: QwenPersistedWorkerDispatchRuntimeSourceBridgeInput['privateOutputManifestChecksumPolicy']
    timeoutCostCeilingStatus: QwenPersistedWorkerDispatchRuntimeSourceBridgeInput['timeoutCostCeilingStatus']
    failClosedRestorePolicyStatus: QwenPersistedWorkerDispatchRuntimeSourceBridgeInput['failClosedRestorePolicyStatus']
  }
  persistedDispatchBridge: {
    backendOnly: true
    sourceContractOnly: true
    workerDispatchSourceBridgePrepared: boolean
    routeId: 'providers.qwen25Vl.structuredVisualMetadataPlan'
    runtimeScope: 'approved_snapshot_structured_metadata_only'
    confirmationEnv: typeof RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_CONFIRM_ENV
    approvedFixtureRef: string | null
    approvedTesterAccount: string | null
    googleCloudProjectId: string | null
    region: string | null
    supabaseTargetRef: string | null
    routeIdempotencyKey: string | null
    queue: {
      jobBatchRef: string | null
      jobRef: string | null
      workerLeaseRef: string | null
      providerRequestId: string | null
    }
    approvedSnapshot: {
      approvedSnapshotRef: string | null
      approvalRecordRef: string | null
      editPlanVersionId: string | null
      sourceSequenceMapRef: string | null
      compiledIntentRef: string | null
      modelRoutingPolicyRef: string | null
      qaPolicyRef: string | null
    }
    credit: {
      creditEstimateRef: string | null
      creditReservationRef: string | null
      policy: 'credit_no_spend_no_persistent_credit_mutation'
    }
    manifests: {
      privateInputManifestRef: string | null
      privateArtifactManifestRef: string | null
      privateArtifactChecksumRef: string | null
      publicArtifactPolicy: 'blocked'
      signedUrlSourceOfTruth: 'blocked'
    }
    runtimeCeiling: {
      timeoutCostCeilingRef: string | null
      failClosedRestorePolicyRef: string | null
      singleAttemptOnly: true
    }
    legacyAdapterPathPolicy: {
      directAdapterShortcutAllowed: false
      existingProductRouteRuntimeFixtureAllowedOnlyBehindPersistedBridge: true
      reason: 'The prior QWEN adapter/runtime fixture may be delegated only after this bridge proves approved snapshot, job, lease, idempotency, private manifest, timeout/cost, and fail-closed references.'
    }
  }
  allowedExecution: {
    bridgePreparedNow: boolean
    routeInvocationAllowedNow: false
    providerModelCallAllowedNow: false
    workerDispatchAllowedNow: false
    workerExecutionAllowedNow: false
    cloudRunJobExecutionAllowedNow: false
    cloudRunServiceUpdateAllowedNow: false
    supabaseMutationAllowedNow: false
    sqlExecutionAllowedNow: false
    secretPayloadAccessAllowedNow: false
    creditMutationAllowedNow: false
    signedUrlCreationAllowedNow: false
    publicArtifactAllowedNow: false
    mediaProcessingAllowedNow: false
    finalRenderExportAllowedNow: false
    broadExternalBetaUnlockAllowedNow: false
    productionUnlockAllowedNow: false
  }
  safety: {
    backendOnlySourceBridge: true
    sourceContractOnly: true
    routeInvocation: false
    qwenRuntimeExecutedInThisPhase: false
    providerCall: false
    modelCall: false
    workerDispatch: false
    workerExecution: false
    cloudRunJobExecution: false
    cloudRunServiceUpdate: false
    supabaseMutation: false
    sqlExecution: false
    secretPayloadAccess: false
    creditMutation: false
    persistentCreditMutation: false
    signedUrlCreation: false
    publicArtifactCreation: false
    mediaProcessing: false
    privateUserMediaProcessing: false
    rawPromptExecution: false
    finalRenderExport: false
    broadExternalBetaUnlockAppliedToEnvironment: false
    paidProductionUnlock: false
    productionUnlock: false
    packageLockMutation: false
  }
  blockers: string[]
  nextMilestone: typeof RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_NEXT_MILESTONE
}

const EXPECTED = {
  approvedTesterAccount: 'aiediting@reeditpro.com',
  googleCloudProjectId: 'reeditpro',
  region: 'us-central1',
  supabaseTargetRef: 'wmyyttnynmteqgcdishd',
  approvedFixtureRef: RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_APPROVED_FIXTURE,
} as const

function normalize(value: string | null | undefined): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function hasUnsafeRequest(input: QwenPersistedWorkerDispatchRuntimeSourceBridgeInput): boolean {
  return Boolean(
    input.routeExecutionRequestedNow ||
      input.providerModelCallRequestedNow ||
      input.workerDispatchRequestedNow ||
      input.workerExecutionRequestedNow ||
      input.cloudRunJobExecutionRequestedNow ||
      input.cloudRunServiceUpdateRequestedNow ||
      input.supabaseMutationRequestedNow ||
      input.sqlExecutionRequestedNow ||
      input.secretPayloadAccessRequestedNow ||
      input.creditMutationRequestedNow ||
      input.signedUrlCreationRequestedNow ||
      input.publicArtifactRequestedNow ||
      input.mediaProcessingRequestedNow ||
      input.finalRenderExportRequestedNow ||
      input.externalBetaUnlockRequestedNow ||
      input.productionUnlockRequestedNow,
  )
}

function missingReferenceBlockers(input: QwenPersistedWorkerDispatchRuntimeSourceBridgeInput): string[] {
  const refs: Array<[keyof QwenPersistedWorkerDispatchRuntimeSourceBridgeInput, string]> = [
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
    ['approvedFixtureRef', 'approved_fixture_reference_required'],
    ['approvedTesterAccount', 'approved_tester_account_required'],
    ['googleCloudProjectId', 'google_cloud_project_reference_required'],
    ['region', 'region_reference_required'],
    ['supabaseTargetRef', 'supabase_target_reference_required'],
    ['timeoutCostCeilingRef', 'timeout_cost_ceiling_reference_required'],
    ['failClosedRestorePolicyRef', 'fail_closed_restore_policy_reference_required'],
  ]
  return refs.flatMap(([key, blocker]) => (normalize(input[key] as string | null | undefined) ? [] : [blocker]))
}

function stateBlockers(input: QwenPersistedWorkerDispatchRuntimeSourceBridgeInput): string[] {
  return [
    input.approvedSnapshotStatus !== 'approved' ? 'approved_snapshot_status_must_be_approved' : null,
    input.creditReservationStatus !== 'reserved' ? 'credit_reservation_status_must_be_reserved' : null,
    input.jobStatus !== 'queued' && input.jobStatus !== 'leased' ? 'job_status_must_be_queued_or_leased' : null,
    input.workerLeaseStatus !== 'claimed' ? 'worker_lease_status_must_be_claimed' : null,
    input.privateInputManifestStatus !== 'approved_fixture_reference'
      ? 'private_input_manifest_must_be_approved_fixture_reference'
      : null,
    input.privateOutputManifestChecksumPolicy !== 'required'
      ? 'private_output_manifest_checksum_policy_required'
      : null,
    input.timeoutCostCeilingStatus !== 'satisfied' ? 'timeout_cost_ceiling_must_be_satisfied' : null,
    input.failClosedRestorePolicyStatus !== 'required' ? 'fail_closed_restore_policy_required' : null,
    normalize(input.approvedTesterAccount) !== EXPECTED.approvedTesterAccount ? 'approved_tester_account_mismatch' : null,
    normalize(input.googleCloudProjectId) !== EXPECTED.googleCloudProjectId ? 'google_cloud_project_mismatch' : null,
    normalize(input.region) !== EXPECTED.region ? 'region_mismatch' : null,
    normalize(input.supabaseTargetRef) !== EXPECTED.supabaseTargetRef ? 'supabase_target_ref_mismatch' : null,
    normalize(input.approvedFixtureRef) !== EXPECTED.approvedFixtureRef ? 'approved_fixture_ref_mismatch' : null,
  ].filter((value): value is string => Boolean(value))
}

export function buildQwenPersistedWorkerDispatchRuntimeSourceBridge(
  input: QwenPersistedWorkerDispatchRuntimeSourceBridgeInput = {},
): QwenPersistedWorkerDispatchRuntimeSourceBridgeResult {
  const missingRefs = missingReferenceBlockers(input)
  const invalidStates = stateBlockers(input)
  const unsafeRequest = hasUnsafeRequest(input)
  const ok = missingRefs.length === 0 && invalidStates.length === 0 && !unsafeRequest
  const status: QwenPersistedWorkerDispatchRuntimeSourceBridgeStatus = ok
    ? RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_READY_STATUS
    : unsafeRequest
      ? 'blocked_unsafe_persisted_worker_dispatch_bridge_request'
      : missingRefs.length > 0
        ? 'blocked_missing_persisted_worker_dispatch_bridge_reference'
        : 'blocked_invalid_persisted_worker_dispatch_bridge_state'

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
    approvedFixtureRef: normalize(input.approvedFixtureRef),
    approvedTesterAccount: normalize(input.approvedTesterAccount),
    googleCloudProjectId: normalize(input.googleCloudProjectId),
    region: normalize(input.region),
    supabaseTargetRef: normalize(input.supabaseTargetRef),
    timeoutCostCeilingRef: normalize(input.timeoutCostCeilingRef),
    failClosedRestorePolicyRef: normalize(input.failClosedRestorePolicyRef),
  }

  return {
    packet: RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_PACKET,
    decision: RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_DECISION,
    execution: RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_EXECUTION,
    ok,
    status,
    sourceEvidence: {
      approvedSnapshotJobOrchestrationRuntimeFixtureRunId:
        RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_APPROVED_FIXTURE,
      qwenApprovedFixtureInferenceApprovalPr: 1810,
      confirmedRuntimeClosurePr: 1815,
      confirmedRuntimeClosureMergeSha: '3fb9ee8890aab91bfd8a5ac13007131f2a939442',
      excludedPr: 577,
    },
    requiredReferences,
    requiredState: {
      approvedSnapshotStatus: input.approvedSnapshotStatus ?? null,
      creditReservationStatus: input.creditReservationStatus ?? null,
      jobStatus: input.jobStatus ?? null,
      workerLeaseStatus: input.workerLeaseStatus ?? null,
      privateInputManifestStatus: input.privateInputManifestStatus ?? null,
      privateOutputManifestChecksumPolicy: input.privateOutputManifestChecksumPolicy ?? null,
      timeoutCostCeilingStatus: input.timeoutCostCeilingStatus ?? null,
      failClosedRestorePolicyStatus: input.failClosedRestorePolicyStatus ?? null,
    },
    persistedDispatchBridge: {
      backendOnly: true,
      sourceContractOnly: true,
      workerDispatchSourceBridgePrepared: ok,
      routeId: 'providers.qwen25Vl.structuredVisualMetadataPlan',
      runtimeScope: 'approved_snapshot_structured_metadata_only',
      confirmationEnv: RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_CONFIRM_ENV,
      approvedFixtureRef: requiredReferences.approvedFixtureRef,
      approvedTesterAccount: requiredReferences.approvedTesterAccount,
      googleCloudProjectId: requiredReferences.googleCloudProjectId,
      region: requiredReferences.region,
      supabaseTargetRef: requiredReferences.supabaseTargetRef,
      routeIdempotencyKey: requiredReferences.routeIdempotencyKey,
      queue: {
        jobBatchRef: requiredReferences.jobBatchRef,
        jobRef: requiredReferences.jobRef,
        workerLeaseRef: requiredReferences.workerLeaseRef,
        providerRequestId: requiredReferences.providerRequestId,
      },
      approvedSnapshot: {
        approvedSnapshotRef: requiredReferences.approvedSnapshotRef,
        approvalRecordRef: requiredReferences.approvalRecordRef,
        editPlanVersionId: requiredReferences.editPlanVersionId,
        sourceSequenceMapRef: requiredReferences.sourceSequenceMapRef,
        compiledIntentRef: requiredReferences.compiledIntentRef,
        modelRoutingPolicyRef: requiredReferences.modelRoutingPolicyRef,
        qaPolicyRef: requiredReferences.qaPolicyRef,
      },
      credit: {
        creditEstimateRef: requiredReferences.creditEstimateRef,
        creditReservationRef: requiredReferences.creditReservationRef,
        policy: 'credit_no_spend_no_persistent_credit_mutation',
      },
      manifests: {
        privateInputManifestRef: requiredReferences.privateInputManifestRef,
        privateArtifactManifestRef: requiredReferences.privateArtifactManifestRef,
        privateArtifactChecksumRef: requiredReferences.privateArtifactChecksumRef,
        publicArtifactPolicy: 'blocked',
        signedUrlSourceOfTruth: 'blocked',
      },
      runtimeCeiling: {
        timeoutCostCeilingRef: requiredReferences.timeoutCostCeilingRef,
        failClosedRestorePolicyRef: requiredReferences.failClosedRestorePolicyRef,
        singleAttemptOnly: true,
      },
      legacyAdapterPathPolicy: {
        directAdapterShortcutAllowed: false,
        existingProductRouteRuntimeFixtureAllowedOnlyBehindPersistedBridge: true,
        reason:
          'The prior QWEN adapter/runtime fixture may be delegated only after this bridge proves approved snapshot, job, lease, idempotency, private manifest, timeout/cost, and fail-closed references.',
      },
    },
    allowedExecution: {
      bridgePreparedNow: ok,
      routeInvocationAllowedNow: false,
      providerModelCallAllowedNow: false,
      workerDispatchAllowedNow: false,
      workerExecutionAllowedNow: false,
      cloudRunJobExecutionAllowedNow: false,
      cloudRunServiceUpdateAllowedNow: false,
      supabaseMutationAllowedNow: false,
      sqlExecutionAllowedNow: false,
      secretPayloadAccessAllowedNow: false,
      creditMutationAllowedNow: false,
      signedUrlCreationAllowedNow: false,
      publicArtifactAllowedNow: false,
      mediaProcessingAllowedNow: false,
      finalRenderExportAllowedNow: false,
      broadExternalBetaUnlockAllowedNow: false,
      productionUnlockAllowedNow: false,
    },
    safety: {
      backendOnlySourceBridge: true,
      sourceContractOnly: true,
      routeInvocation: false,
      qwenRuntimeExecutedInThisPhase: false,
      providerCall: false,
      modelCall: false,
      workerDispatch: false,
      workerExecution: false,
      cloudRunJobExecution: false,
      cloudRunServiceUpdate: false,
      supabaseMutation: false,
      sqlExecution: false,
      secretPayloadAccess: false,
      creditMutation: false,
      persistentCreditMutation: false,
      signedUrlCreation: false,
      publicArtifactCreation: false,
      mediaProcessing: false,
      privateUserMediaProcessing: false,
      rawPromptExecution: false,
      finalRenderExport: false,
      broadExternalBetaUnlockAppliedToEnvironment: false,
      paidProductionUnlock: false,
      productionUnlock: false,
      packageLockMutation: false,
    },
    blockers: [
      ...missingRefs,
      ...invalidStates,
      unsafeRequest ? 'persisted_worker_dispatch_runtime_source_bridge_rejects_unsafe_runtime_request_flags' : null,
    ].filter((value): value is string => Boolean(value)),
    nextMilestone: RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_NEXT_MILESTONE,
  }
}

export function assertQwenPersistedWorkerDispatchRuntimeSourceBridgeResult(
  result: QwenPersistedWorkerDispatchRuntimeSourceBridgeResult,
): void {
  if (result.decision !== RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_DECISION) {
    throw new Error('QWEN persisted worker dispatch source bridge decision mismatch.')
  }
  if (result.execution !== RP_EXTERNAL_BETA_QWEN_PERSISTED_WORKER_DISPATCH_RUNTIME_SOURCE_BRIDGE_EXECUTION) {
    throw new Error('QWEN persisted worker dispatch source bridge execution mismatch.')
  }
  if (!result.persistedDispatchBridge.backendOnly || !result.persistedDispatchBridge.sourceContractOnly) {
    throw new Error('QWEN persisted worker dispatch source bridge must remain backend-only source contract.')
  }
  if (result.persistedDispatchBridge.legacyAdapterPathPolicy.directAdapterShortcutAllowed) {
    throw new Error('QWEN persisted worker dispatch source bridge must reject direct adapter shortcuts.')
  }
  if (!result.persistedDispatchBridge.legacyAdapterPathPolicy.existingProductRouteRuntimeFixtureAllowedOnlyBehindPersistedBridge) {
    throw new Error('QWEN persisted worker dispatch source bridge must gate prior runtime fixture behind bridge.')
  }
  if (result.ok && !result.persistedDispatchBridge.workerDispatchSourceBridgePrepared) {
    throw new Error('QWEN persisted worker dispatch source bridge ok result must prepare the bridge.')
  }
  if (!result.ok && result.persistedDispatchBridge.workerDispatchSourceBridgePrepared) {
    throw new Error('QWEN persisted worker dispatch source bridge blocked result must not prepare the bridge.')
  }
  for (const [key, value] of Object.entries(result.allowedExecution)) {
    if (key === 'bridgePreparedNow') {
      if (value !== result.ok) throw new Error('QWEN bridge prepared flag must match ok status.')
      continue
    }
    if (value !== false) throw new Error(`QWEN persisted bridge allowed execution flag ${key} must be false.`)
  }
  for (const [key, value] of Object.entries(result.safety)) {
    if (key === 'backendOnlySourceBridge' || key === 'sourceContractOnly') {
      if (value !== true) throw new Error(`QWEN persisted bridge safety flag ${key} must be true.`)
      continue
    }
    if (value !== false) throw new Error(`QWEN persisted bridge safety flag ${key} must be false.`)
  }
}
