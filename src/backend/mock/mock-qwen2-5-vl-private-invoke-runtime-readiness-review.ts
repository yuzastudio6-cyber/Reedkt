import { QWEN2_5_VL_PRIVATE_INVOKE_CPU_CALLER_CONTRACT_SMOKE_RESULT } from './mock-qwen2-5-vl-cloud-run-gpu-private-invoke-cpu-caller-contract-smoke-result'

export type Qwen25VlFirstFixtureInferenceRequirementStatus =
  | 'accepted_current_evidence'
  | 'required_before_first_fixture_inference'
  | 'blocked_until_future_prompt'

export type Qwen25VlFirstFixtureInferenceRequirement = {
  id: string
  status: Qwen25VlFirstFixtureInferenceRequirementStatus
  owner: string
  requirement: string
  currentEvidence: string[]
  missingEvidence: string[]
}

export const QWEN2_5_VL_PRIVATE_INVOKE_RUNTIME_READINESS_REVIEW = {
  workstream: 'AI_VIDEO_BROLL_GENERATION',
  toolId: 'qwen2_5_vl_7b_instruct',
  registryToolId: 'qwen_vl',
  mode: 'qwen2_5_vl_private_invoke_runtime_readiness_review_mock_only',
  decision:
    'qwen2_5_vl_private_invoke_runtime_readiness_review_first_fixture_inference_plan_required',
  upstreamCpuCallerContractSmokeDecision:
    QWEN2_5_VL_PRIVATE_INVOKE_CPU_CALLER_CONTRACT_SMOKE_RESULT.decision,
  selectedRuntime: {
    platform: 'google_cloud_run_gpu',
    gpu: 'nvidia_l4',
    region: 'us-central1',
    service: 'reeditpro-qwen2-5-vl-l4-worker',
    costPosture: 'scale_to_zero_required',
    runOnUseStopWhenIdle: true,
    minInstancesRequired: 0,
    maxInstancesForFirstFixtureSmoke: 1,
    cpuFallbackAllowedForRealQwenVlm: false,
  },
  acceptedEvidence: [
    {
      id: 'private_caller_contract_path',
      status: 'accepted_current_evidence',
      owner: 'AI_VIDEO_BROLL_GENERATION',
      requirement: 'Private CPU caller can reach the internal GPU service through the approved route.',
      currentEvidence: [
        'CPU-only caller source, image, Cloud Run Job, service account, and Direct VPC route are in place.',
        'Controlled caller execution observed the expected fail-closed service response.',
      ],
      missingEvidence: [],
    },
    {
      id: 'fail_closed_runtime_contract',
      status: 'accepted_current_evidence',
      owner: 'AI_VIDEO_BROLL_GENERATION',
      requirement: 'GPU service stays fail-closed after contract invocation.',
      currentEvidence: [
        'HTTP 403 qwen_inference_disabled_after_contract_check was observed.',
        'contractSatisfiedForFutureRuntime=true was observed.',
        'runtimeContractExecutesNow=false and modelInferenceEnabled=false were observed.',
      ],
      missingEvidence: [],
    },
  ] satisfies Qwen25VlFirstFixtureInferenceRequirement[],
  firstFixtureInferenceRequirements: [
    {
      id: 'approved_snapshot_and_approval',
      status: 'required_before_first_fixture_inference',
      owner: 'SOUND_MUSIC_AUDIO_OR_EDIT_PLANNING_OWNER',
      requirement:
        'Future smoke must reference an approved plan snapshot, immutable approved plan version, source finding ids, edit intent ids, and approval scope.',
      currentEvidence: [
        'Approved-snapshot queue contract exists in prior Qwen private invoke surfaces.',
      ],
      missingEvidence: [
        'Concrete fixture approved snapshot reference.',
        'Fixture approval scope or accepted no-production approval placeholder.',
      ],
    },
    {
      id: 'credit_and_cost_gate',
      status: 'required_before_first_fixture_inference',
      owner: 'BILLING_STRIPE_CREDITS',
      requirement:
        'Future smoke must include credit reservation evidence or accepted no-spend local fixture cost gate.',
      currentEvidence: [
        'This review keeps credit mutation false.',
      ],
      missingEvidence: [
        'No-spend fixture cost acceptance.',
        'Max one request, no batch, no user traffic, timeout, and max scale 1 cost guard.',
      ],
    },
    {
      id: 'private_input_artifact',
      status: 'required_before_first_fixture_inference',
      owner: 'SUPABASE_RLS_STORAGE_DATABASE',
      requirement:
        'Future smoke must use a private source artifact or private sampled-frame reference with manifest, checksum, provenance, and no public URL source of truth.',
      currentEvidence: [
        'Private invoke path is available without public service exposure.',
      ],
      missingEvidence: [
        'Private fixture artifact reference.',
        'Manifest checksum metadata.',
        'Source-of-truth row or approved local reference policy.',
      ],
    },
    {
      id: 'worker_runtime_contract',
      status: 'required_before_first_fixture_inference',
      owner: 'WORKER_RUNTIME_JOBS',
      requirement:
        'Future smoke must define worker job id, queue lease metadata, idempotency key, approved snapshot reference, and no raw prompt execution.',
      currentEvidence: [
        'Transport adapter rejects raw prompt-shaped queue payloads.',
      ],
      missingEvidence: [
        'Fixture worker payload shape.',
        'Lease and idempotency evidence.',
      ],
    },
    {
      id: 'model_revision_and_runtime_gate',
      status: 'required_before_first_fixture_inference',
      owner: 'AI_VIDEO_BROLL_GENERATION',
      requirement:
        'Future smoke must bind model revision/checksum metadata and explicitly toggle import/load/inference only inside the approved fixture execution.',
      currentEvidence: [
        'Model import, model load, vLLM engine initialization, and inference remain false in this review.',
      ],
      missingEvidence: [
        'Approved fixture model revision.',
        'Runtime gate change plan for exactly one future execution.',
      ],
    },
    {
      id: 'metadata_only_output',
      status: 'required_before_first_fixture_inference',
      owner: 'OBSERVABILITY_AUDIT_COST',
      requirement:
        'Future smoke output must be private metadata-only JSON for visual understanding and QA use cases.',
      currentEvidence: [
        'Qwen planner UI restricts Qwen to visual understanding and visual QA metadata.',
      ],
      missingEvidence: [
        'Expected metadata schema.',
        'QA and audit evidence capture without generated asset creation.',
      ],
    },
    {
      id: 'blocked_public_delivery',
      status: 'blocked_until_future_prompt',
      owner: 'TRACK_A_RENDER_EXPORT',
      requirement:
        'Future smoke must not create generated assets, signed URLs, public artifacts, final render, mux, export, beta, or production claims.',
      currentEvidence: [
        'All public delivery and render/export flags remain false in this review.',
      ],
      missingEvidence: [
        'Separate owner approval would be required for any delivery path.',
      ],
    },
  ] satisfies Qwen25VlFirstFixtureInferenceRequirement[],
  allowedFutureMetadataUseCases: [
    'visual_understanding',
    'broll_candidate_review',
    'frame_asset_qa',
    'caption_visual_consistency_qa',
  ],
  blockedUses: [
    'raw_chat_execution',
    'raw_prompt_execution',
    'frontend_model_runtime',
    'unbounded_video_analysis',
    'public_or_signed_url_source_of_truth',
    'generated_broll_video',
    'generated_asset_creation',
    'final_render_mux_export_delivery',
    'beta_or_production_traffic',
  ],
  readinessFlags: {
    privateInvokeContractPathReady: true,
    failClosedContractSmokePassed: true,
    runtimeReadinessReviewRecorded: true,
    firstApprovedFixtureInferenceSmokeReady: false,
    runtimeReady: false,
    betaReady: false,
    productionReady: false,
  },
  executionFlags: {
    serviceUrlResolvedNow: false,
    audienceResolvedNow: false,
    authHeaderCreated: false,
    identityTokenFetched: false,
    cloudRunInvocationAttempted: false,
    serviceRuntimeRequestSent: false,
    modelImportRun: false,
    modelLoadRun: false,
    vllmEngineInitialized: false,
    promptProcessed: false,
    forwardPassRun: false,
    inferenceRun: false,
    workersDispatched: false,
    supabaseTouched: false,
    sqlExecuted: false,
    gcpMutationOccurred: false,
    generatedAssetsCreated: false,
    publicArtifactsCreated: false,
    signedUrlsCreated: false,
    creditMutationCreated: false,
    renderExportRun: false,
    betaUnlocked: false,
    productionUnlocked: false,
    dryRunPassedClaimed: false,
    generatedLocalFixturePassedClaimed: false,
  },
  nextPrompt:
    'QWEN2_5_VL_STACK_TOOL_57-APPROVED-FIXTURE-INFERENCE-SMOKE-PLAN: define first private approved-fixture Qwen inference smoke, no execution',
} as const

export type Qwen25VlPrivateInvokeRuntimeReadinessReview =
  typeof QWEN2_5_VL_PRIVATE_INVOKE_RUNTIME_READINESS_REVIEW
