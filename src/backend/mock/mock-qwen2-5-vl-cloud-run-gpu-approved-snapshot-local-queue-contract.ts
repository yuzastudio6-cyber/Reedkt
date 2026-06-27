import { QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT } from './mock-qwen2-5-vl-cloud-run-gpu-approved-snapshot-runtime-contract'

const SCHEMA_VERSION =
  QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.contract.schemaVersion

export type Qwen25VlLocalQueueValidationIssue =
  | 'missing_approved_snapshot'
  | 'missing_credit_reservation'
  | 'missing_queue_lease'
  | 'missing_source_of_truth_refs'
  | 'raw_prompt_payload'
  | 'signed_url_source_of_truth'
  | 'enabled_runtime_gate'
  | 'model_policy_mismatch'
  | 'worker_type_mismatch'
  | 'schema_version_mismatch'

export interface Qwen25VlLocalQueueValidationResult {
  ok: boolean
  acceptedForFutureDispatch: boolean
  dispatchAllowedNow: false
  cloudRunInvocationAllowedNow: false
  inferenceAllowedNow: false
  issues: Qwen25VlLocalQueueValidationIssue[]
}

type JsonRecord = Record<string, unknown>

const rawPromptFieldNames = new Set([
  'prompt',
  'raw_prompt',
  'rawPrompt',
  'rawWorkerPrompt',
  'raw_worker_prompt',
  'rawPromptPayload',
  'workerPrompt'
])

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as JsonRecord
    : {}
}

function hasRawPromptField(value: unknown): boolean {
  if (Array.isArray(value)) return value.some((item) => hasRawPromptField(item))
  if (!value || typeof value !== 'object') return false
  return Object.entries(value as JsonRecord).some(([key, nested]) => {
    return rawPromptFieldNames.has(key) || hasRawPromptField(nested)
  })
}

function hasRequiredSourceRefs(sourceRefs: JsonRecord): boolean {
  return QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.sourceOfTruthRequired.every((key) => {
    const value = sourceRefs[key]
    return Array.isArray(value) && value.length > 0
  })
}

function runtimeGatesAllFalse(runtimeGates: JsonRecord): boolean {
  return Object.entries(QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.runtimeGatesRequired)
    .every(([key, expectedValue]) => runtimeGates[key] === expectedValue)
}

function modelPolicyMatches(modelPolicy: JsonRecord): boolean {
  const expected = QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.modelPolicyRequired
  return modelPolicy.modelId === expected.modelId &&
    modelPolicy.modelRevision === expected.modelRevision &&
    modelPolicy.modelAggregateSha256 === expected.modelAggregateSha256 &&
    modelPolicy.runtime === expected.runtime &&
    modelPolicy.gpu === expected.gpu &&
    modelPolicy.servingProfile === expected.servingProfile
}

export function validateQwen25VlLocalQueueFixture(
  fixture: JsonRecord
): Qwen25VlLocalQueueValidationResult {
  const issues: Qwen25VlLocalQueueValidationIssue[] = []
  const payload = asRecord(fixture.payloadJson)
  const sourceRefs = asRecord(payload.sourceOfTruthRefs)

  if (fixture.workerType !== QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT.queueEnvelope.workerType) {
    issues.push('worker_type_mismatch')
  }
  if (payload.schemaVersion !== SCHEMA_VERSION) {
    issues.push('schema_version_mismatch')
  }
  if (!fixture.approvedPlanSnapshotId || !payload.approvedPlanSnapshotId) {
    issues.push('missing_approved_snapshot')
  }
  if (!fixture.creditReservationId || !payload.creditReservationId) {
    issues.push('missing_credit_reservation')
  }
  if (!payload.queueLease) {
    issues.push('missing_queue_lease')
  }
  if (!hasRequiredSourceRefs(sourceRefs)) {
    issues.push('missing_source_of_truth_refs')
  }
  if (sourceRefs.signedUrlsAreSourceOfTruth === true || sourceRefs.publicUrlsAreSourceOfTruth === true) {
    issues.push('signed_url_source_of_truth')
  }
  if (hasRawPromptField(payload)) {
    issues.push('raw_prompt_payload')
  }
  if (!runtimeGatesAllFalse(asRecord(payload.runtimeGates))) {
    issues.push('enabled_runtime_gate')
  }
  if (!modelPolicyMatches(asRecord(payload.modelPolicy))) {
    issues.push('model_policy_mismatch')
  }

  return {
    ok: issues.length === 0,
    acceptedForFutureDispatch: issues.length === 0,
    dispatchAllowedNow: false,
    cloudRunInvocationAllowedNow: false,
    inferenceAllowedNow: false,
    issues
  }
}

export const QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  mode: 'cloud_run_gpu_approved_snapshot_local_queue_contract',
  decision:
    'qwen2_5_vl_7b_cloud_run_gpu_approved_snapshot_local_queue_contract_defined_no_dispatch_no_inference',
  queueEnvelope: {
    schema: 'runWorkerJobSchema',
    workerType: 'qwen2_5_vl_cloud_run_gpu_worker',
    workerInstanceId: 'qwen_worker_instance_mock_local_queue_contract',
    jobType: 'media_analysis',
    dryRun: true,
    approvedSnapshotRequired: true,
    creditReservationRequired: true,
    queueLeaseRequired: true,
    idempotencyKeyRequired: true,
    payloadJsonRequired: true
  },
  runtimePayload: {
    schemaVersion: SCHEMA_VERSION,
    requiredRequestFields:
      QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.requiredRequestFields,
    sourceOfTruthRequired:
      QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.sourceOfTruthRequired,
    allowedTaskUseCases:
      QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_RUNTIME_CONTRACT.allowedTaskUseCases
  },
  validQueueFixture: {
    workspaceId: 'workspace_mock_qwen_queue_001',
    projectId: 'project_mock_qwen_queue_001',
    workerType: 'qwen2_5_vl_cloud_run_gpu_worker',
    workerInstanceId: 'qwen_worker_instance_mock_local_queue_contract',
    idempotencyKey: 'idem_mock_qwen_queue_001',
    dryRun: true,
    jobType: 'media_analysis',
    approvedPlanSnapshotId: 'aps_mock_qwen_queue_001',
    creditReservationId: 'credit_reservation_mock_qwen_queue_001',
    payloadJson: {
      schemaVersion: SCHEMA_VERSION,
      requestId: 'req_mock_qwen_queue_001',
      approvedPlanSnapshotId: 'aps_mock_qwen_queue_001',
      approvedPlanSnapshotHash: 'sha256_mock_approved_snapshot_hash',
      approvalRecordId: 'approval_mock_qwen_queue_001',
      creditReservationId: 'credit_reservation_mock_qwen_queue_001',
      jobId: 'job_mock_qwen_queue_001',
      queueLease: {
        leaseId: 'lease_mock_qwen_queue_001',
        leaseToken: 'lease_reference_mock_not_secret',
        workerId: 'qwen_worker_mock_local_queue_contract',
        expiresAt: '2026-06-27T05:00:00Z'
      },
      idempotencyKey: 'idem_mock_qwen_queue_001',
      sourceOfTruthRefs: {
        supabaseRowRefs: ['supabase_row_ref_mock_qwen_queue_001'],
        privateManifestRefs: ['private_manifest_ref_mock_qwen_queue_001'],
        checksumRefs: ['checksum_ref_mock_qwen_queue_001'],
        approvedPlanSnapshotRefs: ['aps_mock_qwen_queue_001'],
        signedUrlsAreSourceOfTruth: false,
        publicUrlsAreSourceOfTruth: false
      },
      modelPolicy: {
        modelId: 'Qwen/Qwen2.5-VL-7B-Instruct',
        modelRevision: 'cc594898137f460bfe9f0759e9844b3ce807cfb5',
        modelAggregateSha256:
          '46f05ffcc6127a4caa9a3e8c11ddf298b9a5263c8680afe6b5d017ea91702c8b',
        runtime: 'vllm',
        gpu: 'nvidia-l4',
        servingProfile: 'bounded_preview_scale_to_zero'
      },
      runtimeGates: {
        rawVlmPromptAllowed: false,
        providerExecutionAllowed: false,
        mediaProcessingAllowed: false,
        publicOutputAllowed: false,
        trackAExecutionAllowed: false,
        modelInferenceEnabled: false
      },
      task: {
        useCase: 'visual_understanding',
        taskRef: 'task_mock_qwen_queue_001',
        structuredFindingIds: ['finding_mock_qwen_queue_001'],
        editIntentIds: ['intent_mock_qwen_queue_001'],
        mediaAssetRefs: ['private_media_asset_ref_mock_qwen_queue_001'],
        requestedOutput: 'metadata_only_visual_understanding_summary'
      }
    }
  },
  blockedQueueFixtures: [
    {
      id: 'missing_approved_snapshot',
      reason: 'approved_plan_snapshot_required',
      acceptedForFutureDispatch: false
    },
    {
      id: 'missing_credit_reservation',
      reason: 'credit_reservation_required',
      acceptedForFutureDispatch: false
    },
    {
      id: 'missing_queue_lease',
      reason: 'queue_lease_required',
      acceptedForFutureDispatch: false
    },
    {
      id: 'raw_prompt_payload',
      reason: 'raw_prompt_fields_rejected',
      blockedFieldName: 'raw_prompt',
      acceptedForFutureDispatch: false
    },
    {
      id: 'signed_url_source_of_truth',
      reason: 'signed_urls_cannot_be_source_of_truth',
      acceptedForFutureDispatch: false
    },
    {
      id: 'enabled_runtime_gate',
      reason: 'runtime_gates_must_remain_false',
      acceptedForFutureDispatch: false
    },
    {
      id: 'model_policy_mismatch',
      reason: 'qwen_model_policy_must_match_private_cache_revision',
      acceptedForFutureDispatch: false
    },
    {
      id: 'worker_type_mismatch',
      reason: 'worker_type_must_match_qwen_cloud_run_gpu_worker',
      acceptedForFutureDispatch: false
    }
  ],
  runtimeFlags: {
    localQueueContractDefined: true,
    validQueueFixtureMatchesRunWorkerJobSchema: true,
    validQueueFixtureAcceptedForFutureDispatch: true,
    dispatchAllowedNow: false,
    cloudRunInvocationAllowedNow: false,
    serviceRuntimeRequestSent: false,
    modelImportRun: false,
    modelLoadRun: false,
    vllmEngineInitialized: false,
    promptProcessed: false,
    forwardPassRun: false,
    inferenceRun: false,
    providerCallsMade: false,
    workersDispatched: false,
    supabaseTouched: false,
    sqlExecuted: false,
    generatedAssetsCreated: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    creditMutationCreated: false,
    betaUnlocked: false,
    productionUnlocked: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false
  },
  nextPrompt:
    'QWEN2_5_VL_STACK_TOOL_33-CLOUD-RUN-GPU-APPROVED-SNAPSHOT-DISPATCH-READINESS: audit Worker Runtime dispatch readiness for Qwen approved-snapshot jobs, no dispatch'
} as const

export type Qwen25VlCloudRunGpuApprovedSnapshotLocalQueueContract =
  typeof QWEN2_5_VL_CLOUD_RUN_GPU_APPROVED_SNAPSHOT_LOCAL_QUEUE_CONTRACT
