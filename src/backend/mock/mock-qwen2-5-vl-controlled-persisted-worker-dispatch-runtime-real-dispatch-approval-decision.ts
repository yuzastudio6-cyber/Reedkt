import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVAL_PLAN } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-approval-plan'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approval_decision_accepted_execution_plan_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CB-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-EXECUTION-PLAN: plan first real persisted Qwen worker dispatch attempt, no generated assets/no beta' as const

const approvalPlan =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVAL_PLAN

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVAL_DECISION = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_approval_decision',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlanDecision:
    approvalPlan.decision,
  approvalDecision: {
    realDispatchApprovalPlanAccepted: true,
    decisionRecorded: true,
    acceptedForExecutionPlanningOnly: true,
    controlledRealDispatchExecutionPlanRequired: true,
    approvesRealDispatchNow: false,
    approvesWorkerLeaseClaimNow: false,
    approvesCloudRunInvocationNow: false,
    approvesQwenInferenceNow: false,
    approvesGeneratedAssetsNow: false,
    approvesBetaNow: false,
    approvesProductionNow: false,
  },
  acceptedRealDispatchApprovalEvidence:
    approvalPlan.requiredRealDispatchApprovalEvidence.map((entry) => ({
      id: entry.id,
      owner: entry.owner,
      acceptedForExecutionPlanning: true,
      executionAllowedNow: false,
      requiredEvidence: entry.requiredEvidence,
    })),
  approvedRuntimePosture: approvalPlan.approvedRuntimePosture,
  requiredControlledRealDispatchExecutionPlan: [
    {
      id: 'approved_snapshot_fixture_scope',
      requiredPlan: [
        'approved snapshot id, immutable approved fixture plan version, structured findings, edit intents, timing refs, private source refs, and worker execution graph',
        'raw chat must remain rejected as direct worker execution input',
      ],
      executionAllowedNow: false,
    },
    {
      id: 'credit_reservation_no_spend_precondition',
      requiredPlan: [
        'credit estimate and no-spend reservation precondition tied to the exact approved snapshot',
        'credit spend remains blocked until accepted runtime result, QA, audit, and cost evidence exist',
      ],
      executionAllowedNow: false,
    },
    {
      id: 'single_service_role_job_lease_claim',
      requiredPlan: [
        'backend-only service-role code may claim exactly one eligible Qwen job lease',
        'timeout, retry, stale-lease cleanup, conflict handling, and idempotency duplicate-source guard are deterministic',
      ],
      executionAllowedNow: false,
    },
    {
      id: 'private_invoke_transport_plan',
      requiredPlan: [
        'service URL, audience, identity-token, and auth-header resolution are backend-only and approval-gated',
        'private Cloud Run target remains NVIDIA L4, scale-to-zero, min instances 0, initial max instances 1',
      ],
      executionAllowedNow: false,
    },
    {
      id: 'qwen_schema_and_result_persistence_plan',
      requiredPlan: [
        'request envelope and response parser target qwen_fixture_visual_metadata_v1-compatible visual metadata only',
        'result persistence may plan approved metadata rows only; generated assets, storage writes, public artifacts, and signed URLs stay blocked',
      ],
      executionAllowedNow: false,
    },
    {
      id: 'qa_audit_cost_cleanup_beta_lock_plan',
      requiredPlan: [
        'QA, audit, cost, rollback, cleanup, and credit release handoff evidence is explicit',
        'beta, production, arbitrary media, public artifacts, and generated assets remain blocked',
      ],
      executionAllowedNow: false,
    },
  ],
  runtimeFlags: {
    controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalPlanAccepted: true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionRequired: false,
    controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionRecorded: true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecisionAcceptedForExecutionPlanning: true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchExecutionPlanRequired: true,
    readyForRealWorkerDispatch: false,
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

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeRealDispatchApprovalDecision =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_APPROVAL_DECISION
