import type { ProductionToolId } from '../tool-registry'

export type UnifiedSkillLane =
  | 'track_b_media_oss'
  | 'track_a_native_container'
  | 'sound_cpu'
  | 'qwen_provider'
  | 'storage_billing'
  | 'planner_mock'

export type UnifiedSkillLaneStatus =
  | 'ready_for_backend_execution'
  | 'dry_run_only'
  | 'blocked_by_provider_lane'
  | 'blocked_by_storage_billing'
  | 'blocked_by_owner_approval'

export type UnifiedCapabilityId =
  | 'ocr'
  | 'audio'
  | 'color'
  | 'render'
  | 'transcript'
  | 'media_extraction'
  | 'timeline'
  | 'chart_dataviz'
  | 'browser_capture'
  | 'qwen_reasoning'
  | 'qwen_visual_understanding'
  | 'sound_music_audio'
  | 'track_a_container_tools'
  | 'storage_runtime'
  | 'credit_gate'

export type UnifiedSkillId =
  | 'media.ocr_text_regions'
  | 'media.audio_soundsync'
  | 'media.color_image_pipeline'
  | 'media.render_composition'
  | 'media.transcript_generation'
  | 'media.source_extraction'
  | 'media.timeline_interchange'
  | 'graphics.chart_dataviz'
  | 'graphics.browser_capture'
  | 'planning.qwen_reasoning'
  | 'planning.qwen_visual_understanding'
  | 'sound.music_audio_lane'
  | 'track_a.native_container_tools'
  | 'platform.storage_runtime'
  | 'platform.credit_gate'

export type LegacyEditLevelCapabilityId =
  | 'qwen_3_reasoning'
  | 'qwen25vl_visual_understanding'
  | 'speech_transcript'
  | 'media_extraction'
  | 'audio_soundsync'
  | 'graphic_design_understanding'
  | 'preference_dna'
  | 'edit_brief'
  | 'edit_brief_marker_chat'
  | 'edit_brief_marker_qa'
  | 'edit_brief_plan_hints'
  | 'source_video_playback'
  | 'source_video_understanding_package'
  | 'media_asset_repository'
  | 'storage_runtime'
  | 'deepseek_tool_code'
  | 'render_worker'
  | 'credit_gate'

export type UnifiedToolId =
  | ProductionToolId
  | 'qwen_provider_gateway'
  | 'deepseek_provider_gateway'
  | 'sound_cpu_lane'
  | 'gstreamer'
  | 'mkvtoolnix'
  | 'gpac_mp4box'
  | 'supabase_storage'
  | 'gcs_storage'
  | 'tool_cost_metering'
  | 'credit_wallet_ledger'

export interface UnifiedSkillLaneRecord {
  lane: UnifiedSkillLane
  status: UnifiedSkillLaneStatus
  toolIds: UnifiedToolId[]
  reason: string
  nextGate: string
}

export interface UnifiedSkillCapabilityRecord {
  skillId: UnifiedSkillId
  capabilityId: UnifiedCapabilityId
  legacyEditLevelCapabilityIds: LegacyEditLevelCapabilityId[]
  displayName: string
  plannerQuestionAliases: string[]
  description: string
  laneStatus: UnifiedSkillLaneStatus
  toolIds: UnifiedToolId[]
  readyToolIds: UnifiedToolId[]
  dryRunOnlyToolIds: UnifiedToolId[]
  blockedToolIds: UnifiedToolId[]
  lanes: UnifiedSkillLaneRecord[]
  executionGuardrails: string[]
  plannerAnswer: string
}

export interface UnifiedSkillCapabilitySummary {
  totalSkills: number
  totalCapabilities: number
  trackBMediaOssToolCount: number
  productReadyLocalOssCount: 0
  byStatus: Record<UnifiedSkillLaneStatus, number>
  trackBMediaOssToolIds: UnifiedToolId[]
  notes: string[]
}

export interface UnifiedSkillToolAvailability {
  query: string
  matchedSkillIds: UnifiedSkillId[]
  matchedCapabilityIds: UnifiedCapabilityId[]
  readyToolIds: UnifiedToolId[]
  dryRunOnlyToolIds: UnifiedToolId[]
  blockedToolIds: UnifiedToolId[]
  laneStatuses: UnifiedSkillLaneRecord[]
  backendExecutionCandidate: boolean
  externalBetaOrProductionAllowed: false
  answer: string
}

const hardExecutionGuardrails = [
  'requires_approved_plan_snapshot',
  'requires_credit_estimate',
  'requires_credit_reservation',
  'requires_idempotent_job_or_event',
  'requires_backend_worker_boundary',
  'requires_no_raw_prompts_or_secrets',
  'requires_private_artifact_paths_not_signed_urls',
] as const

export const TRACK_B_MEDIA_OSS_TOOL_IDS = [
  'ffmpeg',
  'ffprobe',
  'pyav',
  'opentimelineio',
  'remotion',
  'libass',
  'sharp',
  'paddleocr',
  'pyscenedetect',
  'opencv',
  'opencolorio',
  'openimageio',
  'audioflux',
  'signalsmith_stretch',
  'd3',
  'echarts',
] as const satisfies readonly UnifiedToolId[]

function lane(input: UnifiedSkillLaneRecord): UnifiedSkillLaneRecord {
  return input
}

function record(input: UnifiedSkillCapabilityRecord): UnifiedSkillCapabilityRecord {
  return input
}

export const UNIFIED_SKILL_CAPABILITY_REGISTRY = [
  record({
    skillId: 'media.ocr_text_regions',
    capabilityId: 'ocr',
    legacyEditLevelCapabilityIds: ['source_video_understanding_package'],
    displayName: 'OCR and text-region detection',
    plannerQuestionAliases: ['ocr', 'text detection', 'text regions', 'screen text', 'caption safe zones'],
    description: 'Finds UI/document/text regions for no-cover zones, screen recordings, source understanding, and caption collision planning.',
    laneStatus: 'ready_for_backend_execution',
    toolIds: ['paddleocr', 'opencv', 'playwright'],
    readyToolIds: ['opencv'],
    dryRunOnlyToolIds: [],
    blockedToolIds: ['paddleocr', 'playwright'],
    lanes: [
      lane({
        lane: 'track_b_media_oss',
        status: 'ready_for_backend_execution',
        toolIds: ['opencv'],
        reason: 'OpenCV-backed conservative frame/region checks can be planned for backend worker execution after approved snapshot and credit gates.',
        nextGate: 'tool_beta_execution_evidence_for_selected_ocr_recipe',
      }),
      lane({
        lane: 'track_b_media_oss',
        status: 'blocked_by_owner_approval',
        toolIds: ['paddleocr'],
        reason: 'PaddleOCR exists in the production registry, but model-weight/privacy acceptance still gates product execution.',
        nextGate: 'paddleocr_model_weight_and_private_text_acceptance',
      }),
      lane({
        lane: 'track_b_media_oss',
        status: 'blocked_by_owner_approval',
        toolIds: ['playwright'],
        reason: 'Browser capture can support OCR inputs only after URL/privacy/source approvals are attached to the approved plan.',
        nextGate: 'browser_capture_source_privacy_approval',
      }),
    ],
    executionGuardrails: [...hardExecutionGuardrails],
    plannerAnswer: 'OCR can plan conservative backend checks with OpenCV now; PaddleOCR and browser-capture OCR remain owner/privacy gated before real beta/product use.',
  }),
  record({
    skillId: 'media.audio_soundsync',
    capabilityId: 'audio',
    legacyEditLevelCapabilityIds: ['audio_soundsync'],
    displayName: 'Audio analysis and SoundSync timing',
    plannerQuestionAliases: ['audio', 'soundsync', 'beat grid', 'onsets', 'stretch', 'music timing'],
    description: 'Maps rhythm/onset cues, timing fits, and music-bed adjustment candidates for approved edit plans.',
    laneStatus: 'ready_for_backend_execution',
    toolIds: ['audioflux', 'signalsmith_stretch', 'deepfilternet', 'rnnoise', 'demucs', 'sound_cpu_lane'],
    readyToolIds: ['audioflux', 'signalsmith_stretch'],
    dryRunOnlyToolIds: ['sound_cpu_lane'],
    blockedToolIds: ['deepfilternet', 'rnnoise', 'demucs'],
    lanes: [
      lane({
        lane: 'track_b_media_oss',
        status: 'ready_for_backend_execution',
        toolIds: ['audioflux', 'signalsmith_stretch'],
        reason: 'Track B audio analysis/stretch candidates are available for backend-gated SoundSync planning and bounded execution evidence.',
        nextGate: 'accepted_tool_execution_evidence_for_audio_recipe',
      }),
      lane({
        lane: 'sound_cpu',
        status: 'dry_run_only',
        toolIds: ['sound_cpu_lane'],
        reason: 'SOUND owns semantic music/audio planning and handoff; current registry keeps it visible without claiming live execution.',
        nextGate: 'sound_cpu_owner_handoff_runtime_acceptance',
      }),
      lane({
        lane: 'sound_cpu',
        status: 'blocked_by_owner_approval',
        toolIds: ['deepfilternet', 'rnnoise', 'demucs'],
        reason: 'Denoise/source-separation tools need model, quality, and owner approval before product execution.',
        nextGate: 'sound_cleanup_model_and_quality_approval',
      }),
    ],
    executionGuardrails: [...hardExecutionGuardrails, 'speech_clarity_outranks_beat_alignment'],
    plannerAnswer: 'AudioFlux and Signalsmith Stretch are the usable backend-gated audio tools; SOUND cleanup/separation remains visible but gated.',
  }),
  record({
    skillId: 'media.color_image_pipeline',
    capabilityId: 'color',
    legacyEditLevelCapabilityIds: ['graphic_design_understanding', 'source_video_understanding_package'],
    displayName: 'Color and image pipeline',
    plannerQuestionAliases: ['color', 'grade', 'image', 'shot match', 'opencolorio', 'openimageio'],
    description: 'Plans clean color transforms, image/frame inspection, generated asset matching, and color QA handoffs.',
    laneStatus: 'ready_for_backend_execution',
    toolIds: ['opencolorio', 'openimageio', 'opencv', 'sharp', 'ffmpeg'],
    readyToolIds: ['opencolorio', 'openimageio', 'opencv', 'sharp', 'ffmpeg'],
    dryRunOnlyToolIds: [],
    blockedToolIds: [],
    lanes: [
      lane({
        lane: 'track_b_media_oss',
        status: 'ready_for_backend_execution',
        toolIds: ['opencolorio', 'openimageio', 'opencv', 'sharp', 'ffmpeg'],
        reason: 'Track B completed bounded color/image evidence; actual use still requires the selected backend recipe, private artifacts, and color QA gates.',
        nextGate: 'color_recipe_approved_snapshot_and_beta_evidence',
      }),
    ],
    executionGuardrails: [...hardExecutionGuardrails, 'requires_color_qa_before_preview_or_export'],
    plannerAnswer: 'Color can use OpenColorIO, OpenImageIO, OpenCV, Sharp, and FFmpeg as backend-gated candidates; no frontend color processing or final export is implied.',
  }),
  record({
    skillId: 'media.render_composition',
    capabilityId: 'render',
    legacyEditLevelCapabilityIds: ['render_worker', 'source_video_playback'],
    displayName: 'Render composition and export support',
    plannerQuestionAliases: ['render', 'composition', 'export', 'captions', 'remotion', 'libass'],
    description: 'Connects approved render manifests to deterministic composition, captions, subtitle burn-in, and media mux/export support.',
    laneStatus: 'blocked_by_storage_billing',
    toolIds: ['remotion', 'libass', 'ffmpeg', 'sharp', 'opentimelineio'],
    readyToolIds: ['remotion', 'libass', 'ffmpeg', 'sharp', 'opentimelineio'],
    dryRunOnlyToolIds: [],
    blockedToolIds: ['supabase_storage', 'gcs_storage', 'tool_cost_metering', 'credit_wallet_ledger'],
    lanes: [
      lane({
        lane: 'track_b_media_oss',
        status: 'ready_for_backend_execution',
        toolIds: ['remotion', 'libass', 'ffmpeg', 'sharp', 'opentimelineio'],
        reason: 'Render/composition tools are available as backend-gated execution candidates once approved manifests and artifacts exist.',
        nextGate: 'render_worker_execution_evidence_for_approved_manifest',
      }),
      lane({
        lane: 'storage_billing',
        status: 'blocked_by_storage_billing',
        toolIds: ['supabase_storage', 'gcs_storage', 'tool_cost_metering', 'credit_wallet_ledger'],
        reason: 'Final render/export needs durable private artifact storage, deployed cost events, wallet settlement, and approval records.',
        nextGate: 'deployed_storage_billing_and_wallet_evidence',
      }),
    ],
    executionGuardrails: [...hardExecutionGuardrails, 'requires_render_manifest', 'requires_private_output_artifacts'],
    plannerAnswer: 'Render tools are ready as backend candidates, but actual render/export remains blocked until storage, billing, wallet, and artifact gates pass.',
  }),
  record({
    skillId: 'media.transcript_generation',
    capabilityId: 'transcript',
    legacyEditLevelCapabilityIds: ['speech_transcript'],
    displayName: 'Speech transcript and caption source',
    plannerQuestionAliases: ['transcript', 'speech', 'caption source', 'whisper'],
    description: 'Provides transcript and word-timing source artifacts for captioning, trims, and source understanding.',
    laneStatus: 'blocked_by_owner_approval',
    toolIds: ['faster_whisper', 'whisper_cpp'],
    readyToolIds: [],
    dryRunOnlyToolIds: ['whisper_cpp'],
    blockedToolIds: ['faster_whisper', 'whisper_cpp'],
    lanes: [
      lane({
        lane: 'track_b_media_oss',
        status: 'blocked_by_owner_approval',
        toolIds: ['faster_whisper'],
        reason: 'Production transcription needs selected model weights, privacy handling, benchmark evidence, and owner acceptance.',
        nextGate: 'speech_transcription_model_weight_owner_approval',
      }),
      lane({
        lane: 'track_b_media_oss',
        status: 'dry_run_only',
        toolIds: ['whisper_cpp'],
        reason: 'whisper.cpp is evaluation-only fallback metadata and not a launch transcript path.',
        nextGate: 'explicit_transcription_fallback_approval',
      }),
    ],
    executionGuardrails: [...hardExecutionGuardrails, 'requires_private_audio_artifact', 'requires_transcript_qa'],
    plannerAnswer: 'Transcript generation is not ready for product execution yet; it is blocked on model-weight/privacy/owner approval.',
  }),
  record({
    skillId: 'media.source_extraction',
    capabilityId: 'media_extraction',
    legacyEditLevelCapabilityIds: ['media_extraction', 'source_video_understanding_package'],
    displayName: 'Source media extraction and analysis primitives',
    plannerQuestionAliases: ['media extraction', 'probe', 'scene detection', 'frame sampling', 'smart cut'],
    description: 'Prepares metadata, frame/audio access, scene candidates, source probes, and technical QA inputs.',
    laneStatus: 'ready_for_backend_execution',
    toolIds: ['ffmpeg', 'ffprobe', 'pyav', 'pyscenedetect', 'opencv'],
    readyToolIds: ['ffmpeg', 'ffprobe', 'pyav', 'pyscenedetect', 'opencv'],
    dryRunOnlyToolIds: [],
    blockedToolIds: [],
    lanes: [
      lane({
        lane: 'track_b_media_oss',
        status: 'ready_for_backend_execution',
        toolIds: ['ffmpeg', 'ffprobe', 'pyav', 'pyscenedetect', 'opencv'],
        reason: 'These tools are the backend media-analysis candidates for approved private source artifacts.',
        nextGate: 'selected_media_analysis_recipe_with_private_artifact_refs',
      }),
    ],
    executionGuardrails: [...hardExecutionGuardrails, 'must_not_make_semantic_cut_decisions_without_plan_validation'],
    plannerAnswer: 'Media extraction can use FFmpeg, ffprobe, PyAV, PySceneDetect, and OpenCV as backend-gated candidates for private source artifacts.',
  }),
  record({
    skillId: 'media.timeline_interchange',
    capabilityId: 'timeline',
    legacyEditLevelCapabilityIds: ['source_video_playback', 'render_worker'],
    displayName: 'Timeline interchange',
    plannerQuestionAliases: ['timeline', 'otio', 'edit decisions', 'source sequence'],
    description: 'Maps approved edit decisions into structured timeline manifests and render handoffs.',
    laneStatus: 'ready_for_backend_execution',
    toolIds: ['opentimelineio', 'hyperframe', 'remotion'],
    readyToolIds: ['opentimelineio', 'hyperframe', 'remotion'],
    dryRunOnlyToolIds: [],
    blockedToolIds: [],
    lanes: [
      lane({
        lane: 'track_b_media_oss',
        status: 'ready_for_backend_execution',
        toolIds: ['opentimelineio', 'remotion'],
        reason: 'Timeline interchange and render-manifest handoff can be planned from approved snapshots.',
        nextGate: 'timeline_manifest_approved_snapshot',
      }),
      lane({
        lane: 'planner_mock',
        status: 'ready_for_backend_execution',
        toolIds: ['hyperframe'],
        reason: 'Hyperframe remains the preview/editor boundary and must not process source media directly.',
        nextGate: 'preview_boundary_contract_review',
      }),
    ],
    executionGuardrails: [...hardExecutionGuardrails, 'approved_timeline_manifest_required'],
    plannerAnswer: 'Timeline interchange is available through OpenTimelineIO/Remotion/Hyperframe boundaries after an approved snapshot.',
  }),
  record({
    skillId: 'graphics.chart_dataviz',
    capabilityId: 'chart_dataviz',
    legacyEditLevelCapabilityIds: ['graphic_design_understanding'],
    displayName: 'Charts and data visuals',
    plannerQuestionAliases: ['chart', 'data visualization', 'diagram', 'd3', 'echarts'],
    description: 'Creates exact chart/diagram specs for controlled visual explainers and Remotion composition.',
    laneStatus: 'ready_for_backend_execution',
    toolIds: ['d3', 'echarts', 'remotion'],
    readyToolIds: ['d3', 'echarts', 'remotion'],
    dryRunOnlyToolIds: [],
    blockedToolIds: [],
    lanes: [
      lane({
        lane: 'track_b_media_oss',
        status: 'ready_for_backend_execution',
        toolIds: ['d3', 'echarts', 'remotion'],
        reason: 'Controlled chart specs can feed Remotion-backed visual layouts after approved data/source truth.',
        nextGate: 'approved_chart_data_and_render_manifest',
      }),
    ],
    executionGuardrails: [...hardExecutionGuardrails, 'approved_data_source_required'],
    plannerAnswer: 'Charts can use D3/ECharts plus Remotion as controlled backend/render candidates when the data source is approved.',
  }),
  record({
    skillId: 'graphics.browser_capture',
    capabilityId: 'browser_capture',
    legacyEditLevelCapabilityIds: ['graphic_design_understanding'],
    displayName: 'Browser capture',
    plannerQuestionAliases: ['browser capture', 'website capture', 'dashboard capture', 'playwright'],
    description: 'Captures approved web/app/dashboard views for visual explainers and source-backed UI footage.',
    laneStatus: 'blocked_by_owner_approval',
    toolIds: ['playwright', 'sharp', 'remotion'],
    readyToolIds: ['sharp', 'remotion'],
    dryRunOnlyToolIds: [],
    blockedToolIds: ['playwright'],
    lanes: [
      lane({
        lane: 'track_b_media_oss',
        status: 'blocked_by_owner_approval',
        toolIds: ['playwright'],
        reason: 'Browser capture needs URL/source permission, privacy review, credential isolation, and artifact policy before execution.',
        nextGate: 'browser_capture_source_and_privacy_approval',
      }),
      lane({
        lane: 'track_b_media_oss',
        status: 'ready_for_backend_execution',
        toolIds: ['sharp', 'remotion'],
        reason: 'Once capture artifacts are approved, Sharp and Remotion can prepare/compose them.',
        nextGate: 'approved_capture_artifact_manifest',
      }),
    ],
    executionGuardrails: [...hardExecutionGuardrails, 'no_credentials_or_signed_urls_as_source_truth'],
    plannerAnswer: 'Browser capture is visible but Playwright execution is owner/privacy gated; Sharp/Remotion can handle approved capture artifacts afterward.',
  }),
  record({
    skillId: 'planning.qwen_reasoning',
    capabilityId: 'qwen_reasoning',
    legacyEditLevelCapabilityIds: ['qwen_3_reasoning', 'edit_brief', 'edit_brief_plan_hints'],
    displayName: 'Qwen reasoning and edit planning',
    plannerQuestionAliases: ['qwen', 'reasoning', 'edit planning', 'plan hints'],
    description: 'Provider-backed reasoning lane for future edit strategy, plan hints, and structured planning.',
    laneStatus: 'blocked_by_provider_lane',
    toolIds: ['qwen_provider_gateway'],
    readyToolIds: [],
    dryRunOnlyToolIds: [],
    blockedToolIds: ['qwen_provider_gateway'],
    lanes: [
      lane({
        lane: 'qwen_provider',
        status: 'blocked_by_provider_lane',
        toolIds: ['qwen_provider_gateway'],
        reason: 'Qwen provider transport/private inference/dispatch remains a separate provider lane.',
        nextGate: 'qwen_provider_private_inference_and_transport_acceptance',
      }),
    ],
    executionGuardrails: [...hardExecutionGuardrails, 'providers_must_not_receive_raw_unapproved_chat'],
    plannerAnswer: 'Qwen reasoning is visible but blocked by the provider lane; planner must use mock/local planning until provider gates pass.',
  }),
  record({
    skillId: 'planning.qwen_visual_understanding',
    capabilityId: 'qwen_visual_understanding',
    legacyEditLevelCapabilityIds: ['qwen25vl_visual_understanding'],
    displayName: 'Qwen visual understanding',
    plannerQuestionAliases: ['qwen vl', 'visual understanding', 'source video understanding'],
    description: 'Provider-backed visual understanding lane for semantic source interpretation beyond deterministic tools.',
    laneStatus: 'blocked_by_provider_lane',
    toolIds: ['qwen_provider_gateway'],
    readyToolIds: [],
    dryRunOnlyToolIds: [],
    blockedToolIds: ['qwen_provider_gateway'],
    lanes: [
      lane({
        lane: 'qwen_provider',
        status: 'blocked_by_provider_lane',
        toolIds: ['qwen_provider_gateway'],
        reason: 'Visual-understanding provider execution requires private inference, media handling, and model-routing acceptance.',
        nextGate: 'qwen_visual_understanding_provider_acceptance',
      }),
    ],
    executionGuardrails: [...hardExecutionGuardrails, 'private_media_provider_boundary_required'],
    plannerAnswer: 'Qwen visual understanding is not execution-ready; deterministic Track B tools can provide bounded analysis while provider gates remain blocked.',
  }),
  record({
    skillId: 'sound.music_audio_lane',
    capabilityId: 'sound_music_audio',
    legacyEditLevelCapabilityIds: ['audio_soundsync'],
    displayName: 'SOUND music/audio semantics',
    plannerQuestionAliases: ['sound lane', 'music', 'sfx', 'audio semantics'],
    description: 'SOUND-owned music/SFX/audio semantics and QA handoff that consumes Track B tool evidence without duplicating media processing.',
    laneStatus: 'dry_run_only',
    toolIds: ['sound_cpu_lane', 'audioflux', 'signalsmith_stretch'],
    readyToolIds: ['audioflux', 'signalsmith_stretch'],
    dryRunOnlyToolIds: ['sound_cpu_lane'],
    blockedToolIds: [],
    lanes: [
      lane({
        lane: 'sound_cpu',
        status: 'dry_run_only',
        toolIds: ['sound_cpu_lane'],
        reason: 'SOUND lane owns semantic decisions and is still gated for runtime execution.',
        nextGate: 'sound_cpu_runtime_handoff_acceptance',
      }),
      lane({
        lane: 'track_b_media_oss',
        status: 'ready_for_backend_execution',
        toolIds: ['audioflux', 'signalsmith_stretch'],
        reason: 'Track B can supply bounded audio-feature/stretch candidates to SOUND after approved snapshots.',
        nextGate: 'approved_sound_tool_handoff_recipe',
      }),
    ],
    executionGuardrails: [...hardExecutionGuardrails, 'speech_clarity_qa_required'],
    plannerAnswer: 'SOUND can plan against AudioFlux/Signalsmith evidence, but SOUND semantic/runtime execution remains dry-run gated.',
  }),
  record({
    skillId: 'track_a.native_container_tools',
    capabilityId: 'track_a_container_tools',
    legacyEditLevelCapabilityIds: ['media_extraction', 'render_worker'],
    displayName: 'Track A native container tools',
    plannerQuestionAliases: ['track a', 'gstreamer', 'mkvtoolnix', 'mp4box', 'native container'],
    description: 'Track A-owned native container/render tools such as GStreamer, MKVToolNix, and GPAC/MP4Box.',
    laneStatus: 'blocked_by_owner_approval',
    toolIds: ['gstreamer', 'mkvtoolnix', 'gpac_mp4box'],
    readyToolIds: [],
    dryRunOnlyToolIds: ['gstreamer', 'mkvtoolnix'],
    blockedToolIds: ['gpac_mp4box'],
    lanes: [
      lane({
        lane: 'track_a_native_container',
        status: 'dry_run_only',
        toolIds: ['gstreamer', 'mkvtoolnix'],
        reason: 'Synthetic/private fixture evidence exists in Track A, but product execution remains behind Track A QA and handoff.',
        nextGate: 'track_a_native_container_rollup_and_runtime_acceptance',
      }),
      lane({
        lane: 'track_a_native_container',
        status: 'blocked_by_owner_approval',
        toolIds: ['gpac_mp4box'],
        reason: 'GPAC/MP4Box install-source work is still owner/environment gated and separate from Track B.',
        nextGate: 'gpac_mp4box_install_source_qa_and_owner_acceptance',
      }),
    ],
    executionGuardrails: [...hardExecutionGuardrails, 'track_b_ffmpeg_ffprobe_ownership_preserved'],
    plannerAnswer: 'Track A tools stay visible for future container paths, but they are not a Track B execution substitute.',
  }),
  record({
    skillId: 'platform.storage_runtime',
    capabilityId: 'storage_runtime',
    legacyEditLevelCapabilityIds: ['media_asset_repository', 'storage_runtime'],
    displayName: 'Private storage runtime',
    plannerQuestionAliases: ['storage', 'gcs', 'supabase storage', 'artifact manifest'],
    description: 'Private artifact storage, immutable source refs, and backend-only storage access for real tool execution.',
    laneStatus: 'blocked_by_storage_billing',
    toolIds: ['supabase_storage', 'gcs_storage'],
    readyToolIds: [],
    dryRunOnlyToolIds: [],
    blockedToolIds: ['supabase_storage', 'gcs_storage'],
    lanes: [
      lane({
        lane: 'storage_billing',
        status: 'blocked_by_storage_billing',
        toolIds: ['supabase_storage', 'gcs_storage'],
        reason: 'External beta/product execution requires deployed private storage evidence and read/write path verification.',
        nextGate: 'staging_storage_deployment_readback_and_privacy_approval',
      }),
    ],
    executionGuardrails: [...hardExecutionGuardrails, 'signed_urls_must_not_be_canonical_source_truth'],
    plannerAnswer: 'Storage is the main shared platform gate: tools can be mapped, but product execution needs deployed private artifact evidence.',
  }),
  record({
    skillId: 'platform.credit_gate',
    capabilityId: 'credit_gate',
    legacyEditLevelCapabilityIds: ['credit_gate'],
    displayName: 'Credit and cost gate',
    plannerQuestionAliases: ['credits', 'cost', 'billing', 'reservation', 'metering'],
    description: 'Approved plan, credit estimate, reservation, idempotent event, and wallet/ledger handoff for billable tool execution.',
    laneStatus: 'blocked_by_storage_billing',
    toolIds: ['tool_cost_metering', 'credit_wallet_ledger'],
    readyToolIds: [],
    dryRunOnlyToolIds: ['tool_cost_metering'],
    blockedToolIds: ['credit_wallet_ledger'],
    lanes: [
      lane({
        lane: 'storage_billing',
        status: 'dry_run_only',
        toolIds: ['tool_cost_metering'],
        reason: 'Cost metering math and mock events exist, but deployed persistence/readback still gates live billing.',
        nextGate: 'tool_cost_events_deployed_persistence_readback',
      }),
      lane({
        lane: 'storage_billing',
        status: 'blocked_by_storage_billing',
        toolIds: ['credit_wallet_ledger'],
        reason: 'Wallet spend/release/refund and paid settlement require backend ledger deployment and owner QA.',
        nextGate: 'wallet_settlement_and_billing_qa_approval',
      }),
    ],
    executionGuardrails: [...hardExecutionGuardrails, 'no_silent_billing_or_unapproved_overage'],
    plannerAnswer: 'Credit/cost gates are dry-run/mock-safe today; live billable execution remains blocked until deployed ledger and billing QA pass.',
  }),
] as const satisfies readonly UnifiedSkillCapabilityRecord[]

const zeroStatusCounts: Record<UnifiedSkillLaneStatus, number> = {
  ready_for_backend_execution: 0,
  dry_run_only: 0,
  blocked_by_provider_lane: 0,
  blocked_by_storage_billing: 0,
  blocked_by_owner_approval: 0,
}

export function listUnifiedSkillCapabilityRecords(): UnifiedSkillCapabilityRecord[] {
  return [...UNIFIED_SKILL_CAPABILITY_REGISTRY]
}

export function getUnifiedSkillCapabilityRecord(
  skillId: UnifiedSkillId,
): UnifiedSkillCapabilityRecord | undefined {
  return UNIFIED_SKILL_CAPABILITY_REGISTRY.find((record) => record.skillId === skillId)
}

export function getUnifiedSkillCapabilityRecordsByCapability(
  capabilityId: UnifiedCapabilityId,
): UnifiedSkillCapabilityRecord[] {
  return UNIFIED_SKILL_CAPABILITY_REGISTRY.filter((record) => record.capabilityId === capabilityId)
}

export function getUnifiedSkillCapabilityRecordsByLegacyCapability(
  capabilityId: LegacyEditLevelCapabilityId,
): UnifiedSkillCapabilityRecord[] {
  return UNIFIED_SKILL_CAPABILITY_REGISTRY.filter((record) => record.legacyEditLevelCapabilityIds.includes(capabilityId))
}

export function getUnifiedSkillToolAvailability(query: string): UnifiedSkillToolAvailability {
  const normalizedQuery = query.trim().toLowerCase()
  const matches = UNIFIED_SKILL_CAPABILITY_REGISTRY.filter((record) => {
    return record.skillId === normalizedQuery ||
      record.capabilityId === normalizedQuery ||
      record.legacyEditLevelCapabilityIds.some((capabilityId) => capabilityId === normalizedQuery) ||
      record.plannerQuestionAliases.some((alias) => alias === normalizedQuery || alias.includes(normalizedQuery))
  })
  const selectedRecords = matches.length > 0 ? matches : []
  const laneStatuses = selectedRecords.flatMap((record) => record.lanes)
  const readyToolIds = uniqueToolIds(selectedRecords.flatMap((record) => record.readyToolIds))
  const dryRunOnlyToolIds = uniqueToolIds(selectedRecords.flatMap((record) => record.dryRunOnlyToolIds))
  const blockedToolIds = uniqueToolIds(selectedRecords.flatMap((record) => record.blockedToolIds))
  const backendExecutionCandidate = selectedRecords.some((record) => record.lanes.some((lane) => lane.status === 'ready_for_backend_execution'))

  return {
    query,
    matchedSkillIds: selectedRecords.map((record) => record.skillId),
    matchedCapabilityIds: uniqueCapabilityIds(selectedRecords.map((record) => record.capabilityId)),
    readyToolIds,
    dryRunOnlyToolIds,
    blockedToolIds,
    laneStatuses,
    backendExecutionCandidate,
    externalBetaOrProductionAllowed: false,
    answer: selectedRecords.length > 0
      ? selectedRecords.map((record) => record.plannerAnswer).join(' ')
      : `No unified skill/capability registry match for "${query}".`,
  }
}

export function buildUnifiedSkillCapabilitySummary(): UnifiedSkillCapabilitySummary {
  const byStatus = { ...zeroStatusCounts }
  for (const record of UNIFIED_SKILL_CAPABILITY_REGISTRY) {
    byStatus[record.laneStatus] += 1
  }

  return {
    totalSkills: UNIFIED_SKILL_CAPABILITY_REGISTRY.length,
    totalCapabilities: new Set(UNIFIED_SKILL_CAPABILITY_REGISTRY.map((record) => record.capabilityId)).size,
    trackBMediaOssToolCount: TRACK_B_MEDIA_OSS_TOOL_IDS.length,
    productReadyLocalOssCount: 0,
    byStatus,
    trackBMediaOssToolIds: [...TRACK_B_MEDIA_OSS_TOOL_IDS],
    notes: [
      'This registry maps ReEditPro skills/capabilities to real tool IDs and lane gates.',
      'ready_for_backend_execution means backend-gated candidate only; it is not external beta, paid production, or product-ready local OSS by itself.',
      'External beta/product readiness still requires approved plan snapshots, credit estimate/reservation, idempotency, private artifact storage, deployed billing persistence, owner approvals, and accepted runtime evidence.',
      'Qwen, SOUND, and Track A lanes stay visible but gated so planners can route honestly without hiding follow-up work.',
    ],
  }
}

export function assertUnifiedSkillCapabilityRegistryValid(): void {
  const skillIds = new Set<UnifiedSkillId>()
  const trackBSet = new Set<UnifiedToolId>(TRACK_B_MEDIA_OSS_TOOL_IDS)

  for (const record of UNIFIED_SKILL_CAPABILITY_REGISTRY) {
    if (skillIds.has(record.skillId)) {
      throw new Error(`Duplicate unified skillId: ${record.skillId}`)
    }
    skillIds.add(record.skillId)

    if (record.toolIds.length === 0) {
      throw new Error(`Unified skill ${record.skillId} must map at least one toolId.`)
    }

    if (record.lanes.length === 0) {
      throw new Error(`Unified skill ${record.skillId} must declare at least one lane.`)
    }

    for (const guardrail of hardExecutionGuardrails) {
      if (!record.executionGuardrails.includes(guardrail)) {
        throw new Error(`Unified skill ${record.skillId} is missing hard guardrail ${guardrail}.`)
      }
    }
  }

  for (const toolId of TRACK_B_MEDIA_OSS_TOOL_IDS) {
    const appearsInRegistry = UNIFIED_SKILL_CAPABILITY_REGISTRY.some((record) => record.toolIds.includes(toolId))
    if (!appearsInRegistry) {
      throw new Error(`Track B tool ${toolId} is missing from unified skill registry.`)
    }
    if (!trackBSet.has(toolId)) {
      throw new Error(`Track B tool set mismatch for ${toolId}.`)
    }
  }
}

function uniqueToolIds(toolIds: UnifiedToolId[]): UnifiedToolId[] {
  return Array.from(new Set(toolIds))
}

function uniqueCapabilityIds(capabilityIds: UnifiedCapabilityId[]): UnifiedCapabilityId[] {
  return Array.from(new Set(capabilityIds))
}
