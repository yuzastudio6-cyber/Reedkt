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
  currentStatus: 'backend_runtime_persistence_storage_upload_pipeline_policy_comment_baseline_fix_required'
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
  nextPrompt: 'QWEN2_5_VL_STACK_TOOL_58AW-BACKEND-RUNTIME-PERSISTENCE-BASELINE-STORAGE-UPLOAD-PIPELINE-POLICY-COMMENT-FIX: fix ReEditPro local baseline storage upload pipeline storage.objects policy comment ownership for Qwen harness validation, no deploy/no cloud/no assets/no beta'
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
      currentStatus: 'backend_runtime_persistence_storage_upload_pipeline_policy_comment_baseline_fix_required',
      currentBlocker:
        'Controlled private invoke auth works, the dedicated Direct VPC private route subnet is configured, the no-model CPU-only caller source is defined, the controlled caller job is deployed, one caller contract smoke observed the expected fail-closed response with inference disabled, runtime readiness review is recorded, the first approved-fixture inference smoke plan is defined, gated fixture inference service source is deployed, the first approved-fixture smoke failure is documented, the tuned retry produced sanitized metadata-only output, and the structured-output source fix is deployed. The controlled structured-output retry passed with parsedJson=true, schemaValid=true, objectCount=3, and textLikeRegionCount=1. The structured-output result review accepted the schema keys, row counts, normalized metadata hash, and raw-output exclusion as metadata evidence. Private runtime review accepted the controlled L4 runtime evidence for metadata-only fixture readiness. Approved worker integration review accepted the local queue contract, fail-closed dispatch adapter, private invoke plan/config, structured fixture metadata, and private runtime evidence. Backend runtime dispatch implementation plan is recorded. Fail-closed backend runtime dispatch coordinator is implemented and composes schema validation, approved snapshot checks, credit checks, source-of-truth checks, idempotency, lease precondition, Qwen adapter, private invoke envelope, and transport preview without runtime side effects. Controlled backend dispatch dry-run review covers all eight coordinator outcomes with no runtime side effects. Backend runtime persistence plan maps Qwen dispatch to existing approved snapshot, credit reservation, job, event, worker runtime config, worker lease, runtime message, claim, idempotency, private storage record, signed URL audit, tool check, QA, and audit surfaces. Backend runtime persistence schema draft review confirms Qwen should reuse those existing surfaces and defines Qwen-specific worker type, job type, idempotency, payload, source-of-truth, lease/claim, RLS, event sanitization, and cleanup constraints. Backend runtime persistence migration draft and local SQL tests are recorded without active migrations, SQL execution, Supabase mutation, or runtime execution. Backend runtime persistence local validation result is recorded as blocked because this worktree previously had no supabase/config.toml or approved local/non-production database harness. Backend runtime persistence local harness plan is recorded and rejects plain PostgreSQL, cloud/staging/production, live data, and manual platform stubs. Safe repo-local Supabase config text is now created and verified with loopback-only values, compatible local arm64 Node and Supabase CLI, and Docker CLI availability. Backend runtime persistence local harness validation was attempted and stopped before SQL because port 54322 is already allocated by an existing local reeditpro Supabase stack. The Qwen local harness config now uses non-conflicting ports 55430, 55431, 55432, 55433, and 55434. Backend runtime persistence local harness validation retry was attempted and stopped before Qwen draft SQL because active ReEditPro baseline migration 202605130007_generation_providers_generated_assets.sql failed with an ambiguous description column reference. The baseline migration fix qualifies seed.description and related seed fields. Backend runtime persistence local harness validation retry 2 verified that the generation-provider baseline migration now advances, then stopped before Qwen draft SQL because active migration 202605180001_reeditpro_core_workspace_projects.sql references projects.current_edit_session_id before that column exists. The current edit session baseline fix is recorded and retry 3 verified that migration now applies. Retry 3 then stopped before Qwen draft SQL because active migration 202605180002_reeditpro_media_source_sequence.sql references media_assets.status before that compatibility column exists on the older active baseline table. The media-assets status baseline fix is recorded and retry 4 verified that migration now applies. Retry 4 then stopped before Qwen draft SQL because active migration 202605180003_reeditpro_intent_plan_versions.sql references edit_plan_segments.edit_plan_version_id before that compatibility column exists on the older active baseline table. The edit-plan-segments version baseline fix is recorded and retry 5 verified that migration now applies. Retry 5 then stopped before Qwen draft SQL because active migration 202605180004_reeditpro_credits_approval_snapshots.sql references credit_reservations.approved_plan_snapshot_id before that compatibility column exists on the older active baseline table. The credit approval snapshots baseline fix is recorded and guards credit_reservations.approved_plan_snapshot_id, credit_ledger_entries.approved_plan_snapshot_id, and approval_records.approved_snapshot_id without backfill. Retry 6 verified that the credit approval snapshots fix now advances past that approved-snapshot reference blocker, then stopped before Qwen draft SQL at idx_credit_estimates_project_plan because credit_estimates.edit_plan_version_id does not exist on the older active baseline table. The credit estimates plan-version baseline fix is recorded and guards credit_estimates.edit_plan_version_id before idx_credit_estimates_project_plan without backfill. Retry 7 verified that idx_credit_estimates_project_plan now advances, then stopped before Qwen draft SQL at idx_generation_requests_project_snapshot because generation_requests.approved_plan_snapshot_id does not exist on the older active baseline table. The generation requests approved-snapshot baseline fix is recorded and guards generation_requests.approved_plan_snapshot_id before idx_generation_requests_project_snapshot without backfill. Retry 8 verified that idx_generation_requests_project_snapshot now advances, then stopped before Qwen draft SQL at idx_generated_asset_versions_asset_version because generated_asset_versions.version does not exist on the older active baseline table while version_number does. The generated_asset_versions.version baseline fix is recorded and guards generated_asset_versions.version before idx_generated_asset_versions_asset_version without backfill. Retry 9 verified idx_generated_asset_versions_asset_version now advances, then stopped before Qwen draft SQL because active migration 202605180006_reeditpro_qa_exports_audit.sql declares qa_check_results.check as an unquoted reserved column. The QA check-results reserved-column fix is recorded and quotes the preserved legacy column as "check" text. Retry 10 verified that parser fix, then stopped before Qwen draft SQL at idx_qa_reports_project_snapshot because qa_reports.approved_plan_snapshot_id is missing on the older active baseline table. The QA reports approved-snapshot baseline fix is recorded and guards qa_reports.approved_plan_snapshot_id plus qa_reports_approved_plan_snapshot_id_fkey without backfill. Retry 11 verified that QA reports fix, then stopped before Qwen draft SQL because 202605180007_reeditpro_rls_policies.sql attempted to replace public.is_workspace_member(uuid) with parameter workspace_uuid even though older baseline migrations created it with target_workspace_id. The RLS helper parameter fix is recorded and preserves target_workspace_id for public.is_workspace_member(uuid) and public.is_workspace_owner_or_admin(uuid). Retry 12 verified that RLS migration now applies, then stopped before Qwen draft SQL because 202605180008_reeditpro_storage_buckets_policies.sql attempted to comment on storage.buckets and the local migration role is not owner of the Supabase platform table. The storage buckets comment baseline fix is now recorded and guards that platform-table comment with an insufficient_privilege notice while preserving bucket privacy and storage.objects policy semantics. Retry 13 verified that the storage.buckets table comment guard advances, then stopped before Qwen draft SQL because the same storage policies migration attempted to comment on storage.objects policy reeditpro_project_members_read_project_objects; the local migration role is not owner of the platform relation. The storage.objects policy-comment baseline fix is now recorded and guards documentation-only policy comments with an insufficient_privilege notice while preserving storage.objects policy definitions. Retry 14 verified that fix and advanced to 202605200001_storage_upload_pipeline_readiness.sql, then stopped before Qwen draft SQL at comment on policy reeditpro_project_members_read_workspace_project_objects on storage.objects. User-facing readiness remains blocked until the storage upload pipeline policy-comment baseline fix is recorded.',
      boundaryNotes: [
        'The frontend helper calls only the central ReeditPro API client boundary.',
        'The mock route rejects raw prompt-shaped fields before dry-run coordination.',
        'The client does not resolve service URLs, create auth headers, fetch identity tokens, or invoke Cloud Run.',
        'The next runtime gate is the storage upload pipeline storage.objects policy-comment baseline fix after retry 14; it must not touch Supabase cloud, staging, production, live data, Cloud Run, Qwen inference, worker dispatch, generated assets, public artifacts, signed URLs, beta, or production.',
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
    nextPrompt: 'QWEN2_5_VL_STACK_TOOL_58AW-BACKEND-RUNTIME-PERSISTENCE-BASELINE-STORAGE-UPLOAD-PIPELINE-POLICY-COMMENT-FIX: fix ReEditPro local baseline storage upload pipeline storage.objects policy comment ownership for Qwen harness validation, no deploy/no cloud/no assets/no beta',
  }
}
