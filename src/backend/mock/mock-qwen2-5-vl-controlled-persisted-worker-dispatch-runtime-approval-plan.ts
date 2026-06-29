import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_RESULT_REVIEW } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-smoke-result-review'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_approval_plan_recorded_approval_decision_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58BT-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-APPROVAL-DECISION: decide controlled persisted Qwen worker dispatch runtime approval, no Cloud Run invocation/no inference/no assets/no beta' as const

const review = QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_SMOKE_RESULT_REVIEW

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_APPROVAL_PLAN = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_approval_plan',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeSmokeResultReviewDecision:
    review.decision,
  approvalScope: {
    approvalPlanRecorded: true,
    approvalDecisionRequired: true,
    approvesExecutionNow: false,
    approvesCloudRunInvocationNow: false,
    approvesQwenInferenceNow: false,
    approvesGeneratedAssetsNow: false,
    approvesBetaNow: false,
    approvesProductionNow: false,
  },
  requiredRuntimeApprovalEvidence: [
    {
      id: 'approved_plan_snapshot_source_of_truth',
      owner: 'SUPABASE_RLS_STORAGE_DATABASE',
      requiredEvidence: [
        'approved_plan_snapshot_id exists and points to an immutable approved plan version',
        'approved snapshot contains compiled intent, structured findings, edit intents, timing, asset manifest refs, provider policy, and worker execution graph',
        'raw chat is not used as a worker payload',
      ],
      executionAllowedByThisPlan: false,
    },
    {
      id: 'credit_reservation_source_of_truth',
      owner: 'BILLING_STRIPE_CREDITS',
      requiredEvidence: [
        'credit estimate and credit reservation reference the approved snapshot version',
        'reservation status is accepted for Qwen visual-analysis worker execution',
        'spend, release, refund, and overage behavior remain fail-closed until runtime result evidence exists',
      ],
      executionAllowedByThisPlan: false,
    },
    {
      id: 'private_source_of_truth_refs',
      owner: 'SUPABASE_RLS_STORAGE_DATABASE',
      requiredEvidence: [
        'source media and expected output refs use private storage object records, manifests, checksums, and approved snapshot refs',
        'signed URLs and public URLs are audit/access mechanisms only and never source of truth',
        'storage object record creation and signed URL event creation remain backend-only',
      ],
      executionAllowedByThisPlan: false,
    },
    {
      id: 'service_role_lease_claim_mutation',
      owner: 'WORKER_RUNTIME_JOBS',
      requiredEvidence: [
        'service-role backend path may claim exactly one eligible Qwen job lease',
        'lease timeout, retry count, conflict handling, and cleanup are defined',
        'frontend/browser code cannot claim jobs or write worker runtime rows',
      ],
      executionAllowedByThisPlan: false,
    },
    {
      id: 'idempotency_and_duplicate_guard',
      owner: 'WORKER_RUNTIME_JOBS',
      requiredEvidence: [
        'idempotency key binds workspace, project, approved snapshot, job type, and private source refs',
        'duplicate source mismatch blocks before Cloud Run invocation',
        'job event and backend runtime message writes are sanitized and deterministic',
      ],
      executionAllowedByThisPlan: false,
    },
    {
      id: 'private_invoke_transport_dependencies',
      owner: 'PROVIDER_GATEWAY_MODELS',
      requiredEvidence: [
        'backend-only transport may resolve service URL, audience, identity token, and auth header only after approval',
        'Cloud Run service remains private and uses NVIDIA L4 with scale-to-zero posture',
        'no frontend Cloud Run invocation, no public service URL, no provider fallback, and no secret exposure',
      ],
      executionAllowedByThisPlan: false,
    },
    {
      id: 'qa_audit_cost_credit_evidence',
      owner: 'OBSERVABILITY_AUDIT_COST',
      requiredEvidence: [
        'Qwen output schema, confidence, source frame refs, and raw-output exclusion are captured',
        'audit event and cost evidence are sanitized and tied to approved snapshot and job refs',
        'credit spend remains blocked until accepted worker result and QA evidence exist',
      ],
      executionAllowedByThisPlan: false,
    },
    {
      id: 'rollback_and_fail_closed_behavior',
      owner: 'AI_VIDEO_BROLL_GENERATION',
      requiredEvidence: [
        'all missing prerequisite paths block before Cloud Run invocation',
        'failed private invoke leaves no generated asset row and no public artifact',
        'manual rollback path preserves private source-of-truth refs, idempotency, and credit release/refund rules',
      ],
      executionAllowedByThisPlan: false,
    },
  ],
  approvedRuntimePosture: {
    selectedGpu: 'nvidia_l4',
    costPosture: 'scale_to_zero_required',
    minInstances: 0,
    initialMaxInstances: 1,
    cpuFallbackAllowed: false,
    reason:
      'NVIDIA L4 remains the cost-friendly Cloud Run GPU target for bounded Qwen visual-analysis requests that should run only when invoked and scale down when idle.',
  },
  runtimeFlags: {
    controlledPersistedWorkerDispatchRuntimeSmokeResultReviewAccepted: true,
    controlledPersistedWorkerDispatchRuntimeApprovalPlanRequired: false,
    controlledPersistedWorkerDispatchRuntimeApprovalPlanRecorded: true,
    controlledPersistedWorkerDispatchRuntimeApprovalDecisionRequired: true,
    approvedSnapshotApprovalPlanned: true,
    creditReservationApprovalPlanned: true,
    privateSourceOfTruthRefsApprovalPlanned: true,
    serviceRoleLeaseClaimApprovalPlanned: true,
    idempotencyApprovalPlanned: true,
    privateInvokeTransportApprovalPlanned: true,
    qaAuditCostCreditApprovalPlanned: true,
    rollbackFailClosedApprovalPlanned: true,
    selectedGpuL4Accepted: true,
    scaleToZeroCostPostureAccepted: true,
    readyForRealWorkerDispatch: false,
    runtimeApprovalDecisionRecorded: false,
    realJobCreated: false,
    realLeaseClaimed: false,
    idempotencyRowCreated: false,
    jobEventCreated: false,
    backendRuntimeMessageCreated: false,
    workerClaimCreated: false,
    storageObjectRecordCreated: false,
    signedUrlEventCreated: false,
    qaReportCreated: false,
    auditEventCreated: false,
    creditMutationCreated: false,
    cloudRunInvocationAttempted: false,
    serviceRuntimeRequestSent: false,
    serviceUrlResolvedNow: false,
    audienceResolvedNow: false,
    identityTokenFetched: false,
    authHeaderCreated: false,
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
    mediaProcessingRun: false,
    renderExportRun: false,
    betaReady: false,
    productionReady: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
  },
  nextPrompt: NEXT_PROMPT,
} as const

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeApprovalPlan =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_APPROVAL_PLAN
