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
  currentStatus: 'controlled_persisted_worker_dispatch_runtime_real_dispatch_approval_plan_required'
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
  nextPrompt: 'QWEN2_5_VL_STACK_TOOL_58BZ-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVAL-PLAN: plan real persisted Qwen worker dispatch runtime approval, no generated assets/no beta'
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
      currentStatus: 'controlled_persisted_worker_dispatch_runtime_real_dispatch_approval_plan_required',
      currentBlocker:
        'Controlled private invoke auth works, the dedicated Direct VPC private route subnet is configured, the no-model CPU-only caller source is defined, the controlled caller job is deployed, one caller contract smoke observed the expected fail-closed response with inference disabled, runtime readiness review is recorded, structured-output retry/result review passed, private runtime and approved worker integration reviews are accepted, fail-closed backend dispatch and controlled dispatch dry-run are recorded, backend runtime persistence has advanced through local harness validation, active migration creation, active migration validation, deploy planning, target-class deploy approval, deploy-execution metadata preflight, read-only migration-history reconciliation, local history adoption to remote version 20260628000100, adopted active-migration local validation, remote satisfaction/no-deploy review, persisted worker dispatch readiness review, controlled persisted worker dispatch smoke planning, controlled persisted worker dispatch smoke execution, controlled persisted worker dispatch smoke result review, controlled persisted worker dispatch runtime planning, controlled persisted worker dispatch runtime implementation, controlled persisted worker dispatch runtime smoke planning, controlled persisted worker dispatch runtime smoke execution, controlled persisted worker dispatch runtime smoke result review, controlled persisted worker dispatch runtime approval planning, controlled persisted worker dispatch runtime approval decision, controlled persisted worker dispatch runtime execution plan, controlled persisted worker dispatch runtime execution approval, controlled persisted worker dispatch runtime execution preflight, controlled approved-fixture runtime execution attempt result, and controlled attempt result review are recorded. User-facing readiness remains blocked until the real-dispatch approval plan is recorded; generated assets, signed URLs, beta, and production remain blocked.',
      boundaryNotes: [
        'The frontend helper calls only the central ReeditPro API client boundary.',
        'The mock route rejects raw prompt-shaped fields before dry-run coordination.',
        'The client does not resolve service URLs, create auth headers, fetch identity tokens, or invoke Cloud Run.',
        'The next runtime gate is the controlled persisted worker dispatch runtime real-dispatch approval plan; it must keep generated assets, published artifacts, signed URLs, beta, and production blocked now.',
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
    nextPrompt: 'QWEN2_5_VL_STACK_TOOL_58BZ-CONTROLLED-PERSISTED-WORKER-DISPATCH-RUNTIME-REAL-DISPATCH-APPROVAL-PLAN: plan real persisted Qwen worker dispatch runtime approval, no generated assets/no beta',
  }
}
