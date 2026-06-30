import { QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_ATTEMPT_RESULT } from './mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-result'

const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_attempt_result_review_accepted_approved_fixture_inference_plan_required' as const
const NEXT_PROMPT =
  'QWEN2_5_VL_STACK_TOOL_58CX-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVED-FIXTURE-INFERENCE-PLAN: plan one controlled Qwen approved-fixture inference through persisted worker dispatch, no generated assets/no beta' as const

const attemptResult =
  QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_ATTEMPT_RESULT

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_ATTEMPT_RESULT_REVIEW = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_transport_attempt_result_review',
  decision: DECISION,
  upstreamControlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptResultDecision:
    attemptResult.decision,
  reviewedEvidence: {
    transportAttemptResultDoc:
      'docs/qwen2-5-vl-7b-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-result.md',
    transportAttemptResultSpec:
      'src/backend/mock/mock-qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-result.ts',
    transportAttemptResultSmoke:
      'server/smoke/qwen2-5-vl-controlled-persisted-worker-dispatch-runtime-real-dispatch-transport-attempt-result-smoke.ts',
    cpuOnlyCallerSource: 'server/workers/qwen2_5_vl_private_invoke_cpu_caller/internal_caller.py',
    privateInvokeResponseClassifier:
      'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-response.ts',
    privateInvokeTransportAdapter:
      'src/backend/workers/qwen2-5-vl-cloud-run-gpu-private-invoke-transport-adapter.ts',
    approvedPlanSnapshotPolicy: 'approved-plan-snapshot-policy.md',
    editingAgentExecutionArchitecture: 'editing-agent-execution-architecture.md',
  },
  acceptedEvidence: {
    transportAttemptResultAccepted: attemptResult.attemptSummary.attemptPassedFailClosed,
    transportAttemptRecorded: attemptResult.attemptSummary.attemptRecorded,
    cloudRunJobExecutionEvidenceAccepted:
      attemptResult.transportAttempt.cloudRunJobExecutionCreated &&
      attemptResult.attemptSummary.executionName === 'reeditpro-qwen2-5-vl-private-caller-fwrgv',
    singleTaskExecutionAccepted:
      attemptResult.transportAttempt.taskCount === 1 &&
      attemptResult.attemptSummary.succeededCount === 1 &&
      attemptResult.attemptSummary.failedCount === 0,
    privateServiceRequestEvidenceAccepted:
      attemptResult.transportAttempt.serviceRuntimeRequestSent &&
      attemptResult.transportAttempt.retryAttempted === false,
    identityTokenRuntimeScopeAccepted:
      attemptResult.transportAttempt.identityTokenFetchedInsideCaller &&
      attemptResult.transportAttempt.identityTokenPrinted === false &&
      attemptResult.transportAttempt.identityTokenStored === false,
    authHeaderRuntimeScopeAccepted:
      attemptResult.transportAttempt.authHeaderCreatedInsideCaller &&
      attemptResult.transportAttempt.authHeaderPrinted === false &&
      attemptResult.transportAttempt.authHeaderStored === false,
    serviceTargetNonPersistenceAccepted:
      attemptResult.transportAttempt.targetUrlResolvedInMemory &&
      attemptResult.transportAttempt.targetUrlPrinted === false &&
      attemptResult.transportAttempt.targetUrlStored === false,
    audienceNonPersistenceAccepted:
      attemptResult.transportAttempt.audienceResolvedInMemory &&
      attemptResult.transportAttempt.audiencePrinted === false &&
      attemptResult.transportAttempt.audienceStored === false,
    failClosedResponseAccepted:
      attemptResult.response.httpStatus === 403 &&
      attemptResult.response.serviceReason === 'qwen_inference_disabled_after_contract_check' &&
      attemptResult.response.classificationStatus === 'blocked_contract_valid_inference_disabled',
    contractSatisfiedForFutureRuntimeAccepted:
      attemptResult.response.contractSatisfiedForFutureRuntime &&
      attemptResult.response.runtimeContractExecutesNow === false,
    responsePersistenceBlockedAccepted:
      attemptResult.response.metadataOutputStored === false &&
      attemptResult.response.rawResponseBodyStored === false &&
      attemptResult.response.persistOutputAllowedNow === false,
    creditSpendBlockedAccepted: attemptResult.response.creditSpendAllowedNow === false,
    postAttemptFailClosedStateAccepted:
      attemptResult.postAttemptState.cpuCallerDefaultExecutionGateFalse &&
      attemptResult.postAttemptState.failClosedEnvStillFalse,
    selectedGpuL4Accepted: attemptResult.runtimeFlags.selectedGpuL4,
    scaleToZeroCostPostureAccepted: attemptResult.runtimeFlags.scaleToZeroCostPostureAccepted,
    maxScaleOneAccepted: attemptResult.runtimeFlags.maxScaleOneObserved,
    signedUrlsRemainNonSourceOfTruth:
      attemptResult.sourceOfTruthRules.signedUrlSourceOfTruthAllowed === false,
    publicUrlsRemainNonSourceOfTruth:
      attemptResult.sourceOfTruthRules.publicUrlSourceOfTruthAllowed === false,
    inferenceNonExecutionAccepted: attemptResult.runtimeFlags.inferenceRun === false,
    modelImportNonExecutionAccepted: attemptResult.runtimeFlags.modelImportRun === false,
    modelLoadNonExecutionAccepted: attemptResult.runtimeFlags.modelLoadRun === false,
    generatedAssetNonCreationAccepted:
      attemptResult.runtimeFlags.generatedAssetsCreated === false,
    supabaseNonMutationAccepted:
      attemptResult.runtimeFlags.supabaseTouched === false &&
      attemptResult.runtimeFlags.sqlExecuted === false,
    storageAndPublicArtifactNonCreationAccepted:
      attemptResult.runtimeFlags.signedUrlsCreated === false &&
      attemptResult.runtimeFlags.publicArtifactsCreated === false,
    creditMutationNonCreationAccepted:
      attemptResult.runtimeFlags.creditMutationCreated === false,
  },
  remainingBlockers: {
    controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePlanRequired:
      true,
    readyForRealWorkerDispatch: false,
    privateInvokeReady: false,
    approvedFixtureInferenceAcceptedForPersistedDispatch: false,
    qwenInferenceAcceptedNow: false,
    generatedAssetCreationAccepted: false,
    supabasePersistenceAccepted: false,
    creditSpendAccepted: false,
    betaReady: false,
    productionReady: false,
    reasons: [
      'approved_fixture_inference_plan_not_recorded_for_persisted_worker_dispatch',
      'transport_attempt_review_accepts_only_fail_closed_reachability',
      'inference_enablement_requires_separate_plan_approval_preflight_attempt_and_review',
      'output_persistence_qa_audit_cost_credit_handling_still_required',
      'beta_and_production_still_blocked',
    ],
  },
  sourceOfTruthRules: attemptResult.sourceOfTruthRules,
  runtimeFlags: {
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptResultReviewRequired:
      false,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptResultReviewRecorded:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptResultReviewAccepted:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchApprovedFixtureInferencePlanRequired:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptRecorded:
      true,
    controlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptPassedFailClosed:
      true,
    transportReachabilityAcceptedForFutureInferencePlan: true,
    failClosedResponseAccepted: true,
    cloudRunJobExecutionEvidenceAccepted: true,
    privateServiceRequestEvidenceAccepted: true,
    identityTokenRuntimeScopeAccepted: true,
    authHeaderRuntimeScopeAccepted: true,
    serviceTargetNonPersistenceAccepted: true,
    audienceNonPersistenceAccepted: true,
    responsePersistenceBlockedAccepted: true,
    creditSpendBlockedAccepted: true,
    postAttemptFailClosedStateAccepted: true,
    selectedGpuL4Accepted: true,
    scaleToZeroCostPostureAccepted: true,
    maxScaleOneAccepted: true,
    signedUrlsRemainNonSourceOfTruth: true,
    publicUrlsRemainNonSourceOfTruth: true,
    readyForRealWorkerDispatch: false,
    privateInvokeReady: false,
    approvedFixtureInferenceAcceptedForPersistedDispatch: false,
    qwenInferenceAcceptedNow: false,
    generatedAssetCreationAccepted: false,
    supabasePersistenceAccepted: false,
    creditSpendAccepted: false,
    reviewRanCloudRunInvocation: false,
    reviewRanPrivateServiceRequest: false,
    reviewFetchedIdentityToken: false,
    reviewCreatedAuthHeader: false,
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
    betaReady: false,
    productionReady: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
  },
  nextPrompt: NEXT_PROMPT,
} as const

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeRealDispatchTransportAttemptResultReview =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_TRANSPORT_ATTEMPT_RESULT_REVIEW
