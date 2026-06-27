export type QwenVlPlannerRoutingUiStatus =
  | 'primary_metadata'
  | 'advisory_metadata'
  | 'blocked_policy'

export type QwenVlPlannerRoutingUiHandoff = {
  id: string
  label: string
  source: string
  status: QwenVlPlannerRoutingUiStatus
  runtimeUseCase: string | null
  reason: string
  deterministicPrerequisites: string[]
  mustNotReplace: string[]
}

export type QwenVlPlannerRoutingUiExecutionGates = {
  plannerMayDispatchWorker: false
  plannerMayInvokeCloudRun: false
  plannerMayRunInference: false
  plannerMayDownloadModel: false
  plannerMayCreateGeneratedAsset: false
  plannerMayCreatePublicArtifact: false
  plannerMayCreateSignedUrl: false
  plannerMayRenderExport: false
  plannerMayUseRawPrompt: false
}

export type QwenVlPlannerRoutingUiPrivateInvokeClient = {
  routeId: 'jobs.qwen2_5_vl.privateInvoke.dryRun'
  routePath: '/api/jobs/qwen2-5-vl/private-invoke/dry-run/mock'
  clientHelper: 'callQwen25VlPrivateInvokeDryRun'
  statusHelper: 'getQwen25VlPrivateInvokeFrontendClientStatus'
  routeRuntime: 'mock'
  currentStatus: 'backend_runtime_persistence_local_validation_required'
  currentBlocker: string
  boundaryNotes: string[]
  runtimeFlags: {
    usesCentralApiClient: true
    serviceUrlResolvedNow: false
    authHeaderCreated: false
    identityTokenFetched: false
    cloudRunInvocationAttempted: false
    serviceRuntimeRequestSent: false
    inferenceRun: false
    workersDispatched: false
    generatedAssetsCreated: false
    publicArtifactsCreated: false
    signedUrlsCreated: false
    creditMutationCreated: false
  }
}

export type QwenVlPlannerRoutingUiData = {
  mode: 'qwen_vl_planner_routing_ui_mock_only'
  title: string
  summary: {
    totalPlannerTasks: number
    primaryMetadataRoutes: number
    advisoryMetadataRoutes: number
    blockedRoutes: number
    dryRunPassedClaimed: false
  }
  handoffs: QwenVlPlannerRoutingUiHandoff[]
  privateInvokeClient: QwenVlPlannerRoutingUiPrivateInvokeClient
  executionGates: QwenVlPlannerRoutingUiExecutionGates
  ownerBoundaries: string[]
  nextPrompt: 'QWEN2_5_VL_STACK_TOOL_58P-BACKEND-RUNTIME-PERSISTENCE-LOCAL-VALIDATION: validate Qwen persistence draft against an approved local database, no deploy/no cloud/no assets/no beta'
}

const handoffs: QwenVlPlannerRoutingUiHandoff[] = [
  {
    id: 'planner_source_sequence_map_visual_understanding',
    label: 'Source frame understanding',
    source: 'Source sequence map',
    status: 'primary_metadata',
    runtimeUseCase: 'visual_understanding',
    reason: 'Use Qwen as VLM metadata for sampled private source frames after deterministic frame sampling.',
    deterministicPrerequisites: ['OpenCV sampled frames', 'approved snapshot ref'],
    mustNotReplace: ['OpenCV', 'PaddleOCR'],
  },
  {
    id: 'planner_product_demo_step_detection',
    label: 'Product demo step detection',
    source: 'Edit-intent visual analysis',
    status: 'primary_metadata',
    runtimeUseCase: 'visual_understanding',
    reason: 'Use Qwen for product/demo step context while exact UI text remains deterministic.',
    deterministicPrerequisites: ['PaddleOCR text regions', 'OpenCV frame regions'],
    mustNotReplace: ['PaddleOCR', 'OpenCV'],
  },
  {
    id: 'planner_broll_relevance_scoring',
    label: 'B-roll relevance scoring',
    source: 'B-roll asset plan',
    status: 'primary_metadata',
    runtimeUseCase: 'broll_candidate_review',
    reason: 'Use Qwen to review candidate relevance after B-roll candidates exist; do not generate video.',
    deterministicPrerequisites: ['Wan/LTX candidate reference', 'private artifact manifest'],
    mustNotReplace: ['Wan', 'LTX'],
  },
  {
    id: 'planner_generated_asset_visual_qa',
    label: 'Generated asset visual QA',
    source: 'Generated asset QA plan',
    status: 'primary_metadata',
    runtimeUseCase: 'frame_asset_qa',
    reason: 'Use Qwen as advisory visual QA before composition handoff.',
    deterministicPrerequisites: ['private generated asset reference', 'QA plan reference'],
    mustNotReplace: ['Remotion', 'FFmpeg'],
  },
  {
    id: 'planner_caption_visual_collision_review',
    label: 'Caption visual consistency',
    source: 'Caption layout QA plan',
    status: 'advisory_metadata',
    runtimeUseCase: 'caption_visual_consistency_qa',
    reason: 'Use Qwen only after deterministic OCR and safe-zone checks.',
    deterministicPrerequisites: ['PaddleOCR text regions', 'OpenCV safe-zone regions'],
    mustNotReplace: ['PaddleOCR', 'Remotion', 'libass'],
  },
  {
    id: 'planner_ocr_layout_context_review',
    label: 'OCR layout context',
    source: 'Controlled tool QA plan',
    status: 'advisory_metadata',
    runtimeUseCase: 'visual_understanding',
    reason: 'Use Qwen for layout context around exact OCR output.',
    deterministicPrerequisites: ['PaddleOCR text output'],
    mustNotReplace: ['PaddleOCR'],
  },
  {
    id: 'planner_chart_screen_context_review',
    label: 'Chart/screen context',
    source: 'Controlled tool QA plan',
    status: 'advisory_metadata',
    runtimeUseCase: 'visual_understanding',
    reason: 'Use Qwen for screen context while controlled chart tools own exact values.',
    deterministicPrerequisites: ['D3/ECharts chart spec', 'PaddleOCR screen text'],
    mustNotReplace: ['D3', 'ECharts', 'Vega-Lite', 'PaddleOCR'],
  },
  {
    id: 'planner_safe_zone_semantic_signal',
    label: 'Safe-zone semantic signal',
    source: 'Caption layout QA plan',
    status: 'advisory_metadata',
    runtimeUseCase: 'caption_visual_consistency_qa',
    reason: 'Use Qwen for semantic salience signals after deterministic region detection.',
    deterministicPrerequisites: ['OpenCV region map', 'Remotion layout plan'],
    mustNotReplace: ['OpenCV', 'PaddleOCR', 'Remotion'],
  },
  {
    id: 'planner_blocked_ai_video_generation_request',
    label: 'AI video generation',
    source: 'Blocked execution request',
    status: 'blocked_policy',
    runtimeUseCase: null,
    reason: 'Qwen is not a generated B-roll model; route generation to Wan/LTX/Mochi/Hunyuan policy.',
    deterministicPrerequisites: ['Wan primary B-roll route'],
    mustNotReplace: ['Wan', 'LTX', 'Mochi', 'Hunyuan'],
  },
  {
    id: 'planner_blocked_final_export_request',
    label: 'Final render/export',
    source: 'Blocked execution request',
    status: 'blocked_policy',
    runtimeUseCase: null,
    reason: 'Qwen must not render, mux, export, or deliver final media.',
    deterministicPrerequisites: ['Remotion render plan', 'FFmpeg export plan'],
    mustNotReplace: ['Remotion', 'FFmpeg', 'ffprobe'],
  },
  {
    id: 'planner_blocked_raw_chat_request',
    label: 'Raw chat execution',
    source: 'Blocked execution request',
    status: 'blocked_policy',
    runtimeUseCase: null,
    reason: 'Raw chat is blocked; future workers require structured intent and approved snapshots.',
    deterministicPrerequisites: ['structured intent required'],
    mustNotReplace: ['Approved snapshot policy'],
  },
  {
    id: 'planner_blocked_frontend_request',
    label: 'Frontend invocation',
    source: 'Blocked execution request',
    status: 'blocked_policy',
    runtimeUseCase: null,
    reason: 'Qwen remains backend/worker-only and cannot be called from browser-facing code.',
    deterministicPrerequisites: ['backend worker boundary'],
    mustNotReplace: ['Worker runtime'],
  },
  {
    id: 'planner_blocked_unbounded_video_request',
    label: 'Unbounded long video',
    source: 'Blocked execution request',
    status: 'blocked_policy',
    runtimeUseCase: null,
    reason: 'Long-video analysis requires separate bounded sampling acceptance.',
    deterministicPrerequisites: ['bounded frame sampling'],
    mustNotReplace: ['PySceneDetect', 'OpenCV', 'ffprobe'],
  },
]

export function getQwenVlPlannerRoutingUiData(): QwenVlPlannerRoutingUiData {
  return {
    mode: 'qwen_vl_planner_routing_ui_mock_only',
    title: 'Qwen VLM planner routing',
    summary: {
      totalPlannerTasks: handoffs.length,
      primaryMetadataRoutes: handoffs.filter((handoff) => handoff.status === 'primary_metadata').length,
      advisoryMetadataRoutes: handoffs.filter((handoff) => handoff.status === 'advisory_metadata').length,
      blockedRoutes: handoffs.filter((handoff) => handoff.status === 'blocked_policy').length,
      dryRunPassedClaimed: false,
    },
    handoffs: handoffs.map((handoff) => ({ ...handoff })),
    privateInvokeClient: {
      routeId: 'jobs.qwen2_5_vl.privateInvoke.dryRun',
      routePath: '/api/jobs/qwen2-5-vl/private-invoke/dry-run/mock',
      clientHelper: 'callQwen25VlPrivateInvokeDryRun',
      statusHelper: 'getQwen25VlPrivateInvokeFrontendClientStatus',
      routeRuntime: 'mock',
      currentStatus: 'backend_runtime_persistence_local_validation_required',
      currentBlocker:
        'Controlled private invoke auth works, the dedicated Direct VPC private route subnet is configured, the no-model CPU-only caller source is defined, the controlled caller job is deployed, one caller contract smoke observed the expected fail-closed response with inference disabled, runtime readiness review is recorded, the first approved-fixture inference smoke plan is defined, gated fixture inference service source is deployed, the first approved-fixture smoke failure is documented, the tuned retry produced sanitized metadata-only output, and the structured-output source fix is deployed. The controlled structured-output retry passed with parsedJson=true, schemaValid=true, objectCount=3, and textLikeRegionCount=1. The structured-output result review accepted the schema keys, row counts, normalized metadata hash, and raw-output exclusion as metadata evidence. Private runtime review accepted the controlled L4 runtime evidence for metadata-only fixture readiness. Approved worker integration review accepted the local queue contract, fail-closed dispatch adapter, private invoke plan/config, structured fixture metadata, and private runtime evidence. Backend runtime dispatch implementation plan is recorded. Fail-closed backend runtime dispatch coordinator is implemented and composes schema validation, approved snapshot checks, credit checks, source-of-truth checks, idempotency, lease precondition, Qwen adapter, private invoke envelope, and transport preview without runtime side effects. Controlled backend dispatch dry-run review covers all eight coordinator outcomes with no runtime side effects. Backend runtime persistence plan maps Qwen dispatch to existing approved snapshot, credit reservation, job, event, worker runtime config, worker lease, runtime message, claim, idempotency, private storage record, signed URL audit, tool check, QA, and audit surfaces. Backend runtime persistence schema draft review confirms Qwen should reuse those existing surfaces and defines Qwen-specific worker type, job type, idempotency, payload, source-of-truth, lease/claim, RLS, event sanitization, and cleanup constraints. Backend runtime persistence migration draft and local SQL tests are recorded without active migrations, SQL execution, Supabase mutation, or runtime execution. User-facing readiness remains blocked until local validation applies the draft and tests in an approved local/non-production database harness.',
      boundaryNotes: [
        'The frontend helper calls only the central ReeditPro API client boundary.',
        'The mock route rejects raw prompt-shaped fields before dry-run coordination.',
        'The client does not resolve service URLs, create auth headers, fetch identity tokens, or invoke Cloud Run.',
        'The next runtime gate may validate the persistence migration draft and local SQL tests only in an approved local/non-production database harness; it must not deploy migrations, rerun inference, enable beta, enable production, create public artifacts, create signed URLs, or create generated assets.',
      ],
      runtimeFlags: {
        usesCentralApiClient: true,
        serviceUrlResolvedNow: false,
        authHeaderCreated: false,
        identityTokenFetched: false,
        cloudRunInvocationAttempted: false,
        serviceRuntimeRequestSent: false,
        inferenceRun: false,
        workersDispatched: false,
        generatedAssetsCreated: false,
        publicArtifactsCreated: false,
        signedUrlsCreated: false,
        creditMutationCreated: false,
      },
    },
    executionGates: {
      plannerMayDispatchWorker: false,
      plannerMayInvokeCloudRun: false,
      plannerMayRunInference: false,
      plannerMayDownloadModel: false,
      plannerMayCreateGeneratedAsset: false,
      plannerMayCreatePublicArtifact: false,
      plannerMayCreateSignedUrl: false,
      plannerMayRenderExport: false,
      plannerMayUseRawPrompt: false,
    },
    ownerBoundaries: [
      'Qwen is visual understanding and visual QA metadata only.',
      'Wan/LTX/Mochi/Hunyuan own generated B-roll routes.',
      'PaddleOCR and OpenCV own deterministic OCR, frame regions, and safe-zone evidence.',
      'D3, ECharts, and Vega-Lite own exact chart/dataviz output.',
      'Remotion, FFmpeg, and ffprobe own composition, media integrity, and final export.',
    ],
    nextPrompt: 'QWEN2_5_VL_STACK_TOOL_58P-BACKEND-RUNTIME-PERSISTENCE-LOCAL-VALIDATION: validate Qwen persistence draft against an approved local database, no deploy/no cloud/no assets/no beta',
  }
}
