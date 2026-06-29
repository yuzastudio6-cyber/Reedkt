import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_ATTEMPT_RESULT_REVIEW } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-execution-attempt-result-review'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approval_plan_recorded_approval_decision_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CA-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVAL-DECISION: decide real persisted Qwen worker dispatch runtime approval, no generated assets/no beta' as const

const review =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_EXECUTION_ATTEMPT_RESULT_REVIEW

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVAL_PLAN = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approval_plan',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeExecutionAttemptResultReviewDecision:
    review.decision,
  approvalScope: {
    realDispatchApprovalPlanRecorded: true,
    realDispatchApprovalDecisionRequired: true,
    approvesRealDispatchNow: false,
    approvesWorkerLeaseClaimNow: false,
    approvesCloudRunInvocationNow: false,
    approvesQwenInferenceNow: false,
    approvesGeneratedAssetsNow: false,
    approvesBetaNow: false,
    approvesProductionNow: false,
  },
  acceptedPreconditions: {
    failClosedExecutionAttemptReviewed: review.acceptedEvidence.executionAttemptResultAccepted,
    approvedFixtureAttemptOnly: review.acceptedEvidence.approvedFixtureOnlyAccepted,
    defaultLeaseBoundaryAccepted:
      review.acceptedEvidence.defaultRuntimeLeaseBoundaryAccepted,
    adapterPreviewBoundaryAccepted:
      review.acceptedEvidence.adapterPreviewBoundaryAccepted,
    transportPreviewBoundaryAccepted:
      review.acceptedEvidence.transportPreviewBoundaryAccepted,
    transportPreviewReachedAllRuntimeBoundaries:
      review.acceptedEvidence.transportPreviewRuntimeBoundaryCoverageAccepted,
    selectedGpuL4Accepted: review.acceptedEvidence.selectedGpuL4Accepted,
    scaleToZeroCostPostureAccepted:
      review.acceptedEvidence.scaleToZeroCostPostureAccepted,
    signedUrlsRemainNonSourceOfTruth:
      review.acceptedEvidence.signedUrlsRemainNonSourceOfTruth,
    generatedAssetNonCreationAccepted:
      review.acceptedEvidence.generatedAssetNonCreationAccepted,
    cloudRunNonInvocationAccepted:
      review.acceptedEvidence.cloudRunNonInvocationAccepted,
    inferenceNonExecutionAccepted: review.acceptedEvidence.inferenceNonExecutionAccepted,
  },
  requiredRealDispatchApprovalEvidence: [
    {
      id: 'approved_snapshot_fixture_scope',
      owner: 'SUPABASE_RLS_STORAGE_DATABASE',
      requiredEvidence: [
        'approved_plan_snapshot_id points to an immutable approved fixture plan version',
        'snapshot contains compiled intent, structured findings, edit intents, timing refs, private source refs, and worker execution graph',
        'raw chat is rejected as direct worker execution input',
      ],
      executionAllowedByThisPlan: false,
    },
    {
      id: 'credit_reservation_no_spend_precondition',
      owner: 'BILLING_STRIPE_CREDITS',
      requiredEvidence: [
        'credit estimate and reservation are tied to the exact approved snapshot version',
        'reservation is accepted for a bounded Qwen visual-analysis dispatch attempt',
        'credit spend remains blocked until accepted runtime result, QA evidence, and cost evidence exist',
      ],
      executionAllowedByThisPlan: false,
    },
    {
      id: 'service_role_job_lease_claim_scope',
      owner: 'WORKER_RUNTIME_JOBS',
      requiredEvidence: [
        'service-role backend code may claim exactly one eligible Qwen job lease for the approved fixture',
        'lease timeout, retry count, stale-lease cleanup, and conflict handling are deterministic',
        'frontend/browser code cannot claim jobs, mutate worker rows, or resolve runtime credentials',
      ],
      executionAllowedByThisPlan: false,
    },
    {
      id: 'idempotency_duplicate_source_guard',
      owner: 'WORKER_RUNTIME_JOBS',
      requiredEvidence: [
        'idempotency key binds workspace, project, approved snapshot, job type, attempt scope, and private source refs',
        'duplicate source mismatch blocks before service URL resolution or Cloud Run invocation',
        'job event and backend runtime messages remain sanitized and deterministic',
      ],
      executionAllowedByThisPlan: false,
    },
    {
      id: 'private_invoke_transport_execution_conditions',
      owner: 'PROVIDER_GATEWAY_MODELS',
      requiredEvidence: [
        'backend-only runtime may resolve service URL, audience, identity token, and auth header only after approval',
        'Cloud Run service remains private and uses the approved NVIDIA L4 scale-to-zero posture',
        'no frontend Cloud Run invocation, no public service URL, no provider fallback, and no secret exposure',
      ],
      executionAllowedByThisPlan: false,
    },
    {
      id: 'qwen_request_response_schema',
      owner: 'AI_VIDEO_BROLL_GENERATION',
      requiredEvidence: [
        'request envelope includes approved snapshot, source frame refs, schema version, and bounded fixture scope',
        'response parser requires qwen_fixture_visual_metadata_v1-compatible output before any result acceptance',
        'raw model output stays excluded from repo, UI payloads, public artifacts, and signed URL source-of-truth records',
      ],
      executionAllowedByThisPlan: false,
    },
    {
      id: 'result_persistence_without_generated_assets',
      owner: 'SUPABASE_RLS_STORAGE_DATABASE',
      requiredEvidence: [
        'runtime may create only approved job/runtime/audit/QA metadata rows after successful approval',
        'generated_assets, public artifacts, storage object writes, and signed URL creation remain blocked for this gate',
        'private storage manifests/checksums remain references only unless a later storage owner gate approves writes',
      ],
      executionAllowedByThisPlan: false,
    },
    {
      id: 'qa_audit_cost_observability',
      owner: 'OBSERVABILITY_AUDIT_COST',
      requiredEvidence: [
        'Qwen output schema confidence, source frame refs, blocked action counts, and raw-output exclusion are auditable',
        'audit and cost evidence are sanitized and tied to approved snapshot, job, lease, and idempotency refs',
        'failure, timeout, and retry paths emit no sensitive values and keep credits fail-closed',
      ],
      executionAllowedByThisPlan: false,
    },
    {
      id: 'rollback_cleanup_credit_release',
      owner: 'WORKER_RUNTIME_JOBS',
      requiredEvidence: [
        'failed dispatch attempt releases or preserves leases according to retry policy without duplicate execution',
        'credit release/refund handoff is explicit and no spend occurs without accepted result evidence',
        'cleanup preserves approved snapshot refs, private source refs, idempotency, and sanitized events',
      ],
      executionAllowedByThisPlan: false,
    },
    {
      id: 'beta_production_public_artifact_lock',
      owner: 'AI_VIDEO_BROLL_GENERATION',
      requiredEvidence: [
        'real dispatch approval does not unlock beta, production, arbitrary media, public artifacts, or generated assets',
        'the first approved real dispatch must remain scoped to bounded Qwen visual-analysis metadata',
        'later beta readiness requires separate result review, QA, cost, billing, and product acceptance',
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
    controlledPersistedWorkerDispatchRuntimeExecutionAttemptResultReviewAccepted: true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlanRequired: false,
    controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlanRecorded: true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionRequired: true,
    approvedSnapshotFixtureScopePlanned: true,
    creditReservationNoSpendPreconditionPlanned: true,
    serviceRoleJobLeaseClaimScopePlanned: true,
    idempotencyDuplicateSourceGuardPlanned: true,
    privateInvokeTransportExecutionConditionsPlanned: true,
    qwenRequestResponseSchemaPlanned: true,
    resultPersistenceWithoutGeneratedAssetsPlanned: true,
    qaAuditCostObservabilityPlanned: true,
    rollbackCleanupCreditReleasePlanned: true,
    betaProductionPublicArtifactLockPlanned: true,
    selectedGpuL4Accepted: true,
    scaleToZeroCostPostureAccepted: true,
    readyForRealWorkerDispatch: false,
    realDispatchApprovalDecisionRecorded: false,
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

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlan =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVAL_PLAN
