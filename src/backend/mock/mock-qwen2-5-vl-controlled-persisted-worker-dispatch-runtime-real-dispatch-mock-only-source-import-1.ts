const DECISION =
  'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_mock_only_source_import_recorded_preflight_required' as const

const EXECUTION = 'completed_mock_only_source_import_no_runtime_execution' as const

const NEXT_PROMPT =
  'QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_PREFLIGHT_1' as const

const SELECTED_RUNTIME = {
  platform: 'google_cloud_run_gpu',
  service: 'reeditpro-qwen2-5-vl-l4-worker',
  region: 'us-central1',
  gpu: 'nvidia_l4',
  costPosture: 'scale_to_zero_required',
  minInstances: 0,
  maxInstancesForInitialRuntime: 1,
  cpuFallbackAllowed: false,
} as const

const BASE_RUNTIME_FLAGS = {
  sourceImportRecorded: true,
  mockOnlySourceImport: true,
  preflightRequired: true,
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
} as const

const FIRST_REAL_DISPATCH_PREFLIGHT_ENVELOPE = [
  {
    id: 'approved_snapshot_fixture_intake',
    requiredInputs: ['approved_plan_snapshot_id', 'immutable_plan_version', 'confirmed_output_frame'],
    executionAllowedNow: false,
  },
  {
    id: 'credit_reservation_no_spend_check',
    requiredInputs: ['credit_reservation_id', 'estimated_internal_tool_cost_event'],
    executionAllowedNow: false,
  },
  {
    id: 'private_source_of_truth_refs',
    requiredInputs: ['private_storage_ref', 'asset_manifest_ref', 'checksum_ref'],
    executionAllowedNow: false,
  },
  {
    id: 'idempotency_duplicate_source_guard',
    requiredInputs: ['idempotency_key', 'approved_snapshot_hash'],
    executionAllowedNow: false,
  },
  {
    id: 'backend_only_service_role_lease_claim',
    requiredInputs: ['service_role_backend_context', 'worker_lease_request'],
    executionAllowedNow: false,
  },
  {
    id: 'qwen_request_envelope_build',
    requiredInputs: ['structured_prompt_envelope', 'private_input_manifest'],
    executionAllowedNow: false,
  },
  {
    id: 'private_invoke_credential_resolution',
    requiredInputs: ['service_url_name_only', 'audience_name_only', 'identity_token_policy'],
    executionAllowedNow: false,
  },
  {
    id: 'cloud_run_l4_invocation_attempt',
    requiredInputs: ['approved_preflight_confirmation', 'scale_to_zero_l4_runtime_policy'],
    executionAllowedNow: false,
  },
  {
    id: 'result_validation_and_persistence',
    requiredInputs: ['private_result_manifest', 'checksum_manifest', 'no_public_artifact_policy'],
    executionAllowedNow: false,
  },
  {
    id: 'qa_audit_cost_cleanup_credit_handoff',
    requiredInputs: ['qa_report_ref', 'audit_event_ref', 'cleanup_policy', 'credit_release_or_spend_policy'],
    executionAllowedNow: false,
  },
] as const

export const QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_MOCK_ONLY_SOURCE_IMPORT_1 = {
  packet: 'RP-EXTERNAL-BETA-QWEN-REAL-DISPATCH-MOCK-ONLY-SOURCE-IMPORT-1',
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_controlled_persisted_worker_dispatch_runtime_real_dispatch_mock_only_source_import_1',
  decision: DECISION,
  execution: EXECUTION,
  sourceChain: {
    sourceImportScopeMerge: '6dce0272d56fb83a90e3ced99d1ee0d811a7c52c',
    topDraftApprovalPr: '#1695 open/draft/head 634d4a81ed720834d67622291c6e4fc810ef61d5',
    lowerExecutionPlanPr: '#1690 open/draft/head 83b8bda891ce36e61551088ed46f297a4f10a6b9',
    newerPreflightPr: '#1702 open/draft/head 89d7a9ddde85cff3cd4abd4547a3abb65b570d18',
    singleTesterRealUsageQa:
      '#1686 open/draft/blocked_gcloud_reauthentication_required_before_single_tester_real_usage_qa',
    excludedRemotionPr: '#577 open/draft/blocked/excluded',
  },
  selectedRuntime: SELECTED_RUNTIME,
  sourceOfTruthRules: {
    approvedPlanSnapshotRequired: true,
    creditReservationRequired: true,
    privateStoragePathRequired: true,
    assetManifestRequired: true,
    checksumRequired: true,
    signedUrlsAreSourceOfTruth: false,
    publicUrlsAreSourceOfTruth: false,
    workersExecuteApprovedSnapshotsOnly: true,
    rawChatExecutionAllowed: false,
  },
  importScope: {
    fullDraftStackImportRejected: true,
    workerRuntimeSourceImported: false,
    mockOnlyPlanApprovalPreflightRecordImported: true,
    runtimePreflightRequiredBeforeAnyDispatch: true,
  },
  firstRealDispatchPreflightEnvelope: FIRST_REAL_DISPATCH_PREFLIGHT_ENVELOPE,
  runtimeFlags: BASE_RUNTIME_FLAGS,
  nextPrompt: NEXT_PROMPT,
} as const

export type Qwen25VlControlledPersistedWorkerDispatchRuntimeRealDispatchMockOnlySourceImport1 =
  typeof QWEN2_5_VL_CONTROLLED_PERSISTED_WORKER_DISPATCH_RUNTIME_REAL_DISPATCH_MOCK_ONLY_SOURCE_IMPORT_1
