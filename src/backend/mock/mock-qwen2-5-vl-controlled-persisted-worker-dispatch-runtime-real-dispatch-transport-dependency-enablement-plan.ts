import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_ATTEMPT_RESULT_REVIEW } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-execution-attempt-result-review'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_plan_recorded_approval_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CH-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-TRANSPORT-DEPENDENCY-ENABLEMENT-APPROVAL: approve controlled Qwen real-dispatch lease adapter and private invoke transport dependency enablement, no generated assets/no beta' as const

const review =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_EXECUTION_ATTEMPT_RESULT_REVIEW

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_PLAN = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_dependency_enablement_plan',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultReviewDecision:
    review.decision,
  enablementScope: {
    realDispatchAttemptResultReviewAccepted:
      review.acceptedEvidence.realDispatchExecutionAttemptResultAccepted,
    transportDependencyEnablementPlanRecorded: true,
    transportDependencyEnablementApprovalRequired: true,
    dependenciesEnabledNow: false,
    readyForRealWorkerDispatchNow: false,
    approvesCloudRunInvocationNow: false,
    approvesQwenInferenceNow: false,
    approvesGeneratedAssetsNow: false,
    approvesBetaNow: false,
    approvesProductionNow: false,
  },
  selectedRuntime: {
    platform: 'google_cloud_run_gpu',
    gpu: 'nvidia_l4',
    region: 'us-central1',
    service: 'reeditpro-qwen2-5-vl-l4-worker',
    costPosture: 'scale_to_zero_required',
    minInstances: 0,
    initialMaxInstances: 1,
    cpuFallbackAllowed: false,
  },
  dependencyEnablementPlan: [
    {
      id: 'service_role_lease_claim_dependency',
      owner: 'WORKER_RUNTIME_JOBS',
      requiredEvidence: [
        'backend-only runtime path can claim exactly one eligible Qwen job lease for an approved snapshot',
        'stale lease, retry, conflict, and duplicate-source behavior are deterministic',
        'frontend code cannot claim jobs or mutate worker rows',
      ],
      currentExecutionAllowed: false,
    },
    {
      id: 'idempotency_runtime_message_dependency',
      owner: 'WORKER_RUNTIME_JOBS',
      requiredEvidence: [
        'idempotency rows bind workspace, project, approved snapshot, job type, private source refs, and request hash',
        'backend runtime messages remain sanitized and approved-snapshot scoped',
        'job events and claim attempts are rollback-safe',
      ],
      currentExecutionAllowed: false,
    },
    {
      id: 'qwen_dispatch_adapter_dependency',
      owner: 'AI_VIDEO_BROLL_GENERATION',
      requiredEvidence: [
        'fail-closed adapter can become a bounded approved adapter only through a later approval gate',
        'adapter accepts only validated local queue contracts and approved snapshot refs',
        'adapter rejects raw chat, raw worker prompts, public URLs, signed URLs, and generated asset instructions',
      ],
      currentExecutionAllowed: false,
    },
    {
      id: 'private_invoke_envelope_dependency',
      owner: 'AI_VIDEO_BROLL_GENERATION',
      requiredEvidence: [
        'envelope uses approved snapshot refs, private source refs, schema version, and bounded Qwen metadata scope',
        'raw model output remains excluded from repo, UI payloads, public artifacts, and signed URL source-of-truth records',
        'Qwen stays visual understanding and visual QA metadata only',
      ],
      currentExecutionAllowed: false,
    },
    {
      id: 'private_invoke_transport_dependency',
      owner: 'PROVIDER_GATEWAY_MODELS',
      requiredEvidence: [
        'backend injects service URL, audience, identity token, and request-sending dependencies only after approval',
        'frontend and browser code never resolve or hold private invoke credentials',
        'private Cloud Run target keeps NVIDIA L4, scale-to-zero, min instances 0, and initial max instances 1',
      ],
      currentExecutionAllowed: false,
    },
    {
      id: 'response_classification_dependency',
      owner: 'AI_VIDEO_BROLL_GENERATION',
      requiredEvidence: [
        'response classifier distinguishes fail-closed contract responses, valid fixture metadata, invalid schema, timeout, auth failure, and retryable transport failure',
        'result acceptance requires qwen_fixture_visual_metadata_v1-compatible metadata',
        'invalid or partial responses do not create generated assets or public artifacts',
      ],
      currentExecutionAllowed: false,
    },
    {
      id: 'qa_audit_cost_credit_dependency',
      owner: 'OBSERVABILITY_AUDIT_COST',
      requiredEvidence: [
        'sanitized QA, audit, cost, and credit evidence ties to job, lease, idempotency, approved snapshot, and private source refs',
        'credit spend remains blocked until accepted result evidence exists',
        'failure, timeout, retry, and cleanup events expose no sensitive values',
      ],
      currentExecutionAllowed: false,
    },
    {
      id: 'cleanup_rollback_dependency',
      owner: 'WORKER_RUNTIME_JOBS',
      requiredEvidence: [
        'failed attempts release or preserve leases according to retry policy',
        'cleanup preserves idempotency and private source refs',
        'duplicate Cloud Run requests are prevented',
      ],
      currentExecutionAllowed: false,
    },
    {
      id: 'beta_production_public_artifact_lock_dependency',
      owner: 'AI_VIDEO_BROLL_GENERATION',
      requiredEvidence: [
        'dependency enablement does not unlock arbitrary user media, generated assets, public artifacts, or signed URLs',
        'beta and production remain blocked',
        'generated_local_fixture_passed remains unclaimed',
      ],
      currentExecutionAllowed: false,
    },
  ],
  sourceOfTruthRules: {
    workersExecuteApprovedSnapshots: true,
    rawChatWorkerExecutionAllowed: false,
    rawWorkerPromptAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    publicUrlSourceOfTruthAllowed: false,
    privateStorageManifestChecksumApprovedSnapshotRefsRequired: true,
    qwenMayGenerateBrollVideo: false,
    qwenMayRenderExport: false,
    frontendMayClaimJobs: false,
    frontendMayResolvePrivateInvokeCredentials: false,
    frontendMayCallCloudRun: false,
    frontendMayCreateGeneratedAssets: false,
  },
  runtimeFlags: {
    controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionAttemptResultReviewAccepted:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPlanRequired:
      false,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPlanRecorded:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementApprovalRequired:
      true,
    serviceRoleLeaseClaimDependencyPlanned: true,
    idempotencyRuntimeMessageDependencyPlanned: true,
    qwenDispatchAdapterDependencyPlanned: true,
    privateInvokeEnvelopeDependencyPlanned: true,
    privateInvokeTransportDependencyPlanned: true,
    responseClassificationDependencyPlanned: true,
    qaAuditCostCreditDependencyPlanned: true,
    cleanupRollbackDependencyPlanned: true,
    betaProductionPublicArtifactLockPlanned: true,
    selectedGpuL4Accepted: true,
    scaleToZeroCostPostureAccepted: true,
    minInstancesZeroAccepted: true,
    initialMaxInstancesOneAccepted: true,
    cpuFallbackDisabledAccepted: true,
    readyForRealWorkerDispatch: false,
    transportDependenciesEnabledNow: false,
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

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeRealDispatchTransportDependencyEnablementPlan =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_DEPENDENCY_ENABLEMENT_PLAN
