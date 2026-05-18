import type { EditPlan, OpenSourceToolId, ProviderModel } from '../types/reeditpro'
import type {
  WorkerGroup,
  WorkerGroupProfile,
  WorkerJobStepProfile,
  WorkerJobStepType,
  WorkerOutputType,
} from '../types/worker-runtime'

function groupProfile(profile: WorkerGroupProfile): WorkerGroupProfile {
  return profile
}

function stepProfile(profile: WorkerJobStepProfile): WorkerJobStepProfile {
  return profile
}

export const workerGroupProfiles: WorkerGroupProfile[] = [
  groupProfile({
    id: 'media_analysis_worker',
    label: 'Media analysis worker',
    description: 'Future transcript, visual, audio, scene, face/object, source clip, and safe-zone analysis.',
    executionMode: 'analysis_worker',
    bestFor: ['Source understanding', 'Transcript timing', 'Scene analysis', 'Safe-zone analysis'],
    requiredInputs: ['approvedPlanSnapshotId', 'sourceAssetIds'],
    outputTypes: ['qa_report', 'timing_map'],
    toolIds: ['opencv', 'whisper_cpp'],
    providerModels: [],
    qaResponsibilities: ['Analysis confidence', 'Source media readiness', 'No raw-chat reinterpretation'],
    safetyNotes: ['Analyze approved source media only.', 'Do not invent claims or evidence.'],
    futureOnly: true,
  }),
  groupProfile({
    id: 'ffmpeg_media_worker',
    label: 'FFmpeg media worker',
    description: 'Future trim, cut, export, transcode, color filter, loudness, cleanup, and final encoding worker.',
    executionMode: 'preprocess_worker',
    bestFor: ['Cut execution', 'Transcode', 'Loudness', 'Audio cleanup', 'Final encoding'],
    requiredInputs: ['approvedPlanSnapshotId', 'operationIds', 'sourceAssetIds'],
    outputTypes: ['processed_video', 'processed_audio'],
    toolIds: ['ffmpeg'],
    providerModels: [],
    qaResponsibilities: ['Cut accuracy', 'Loudness targets', 'Format compliance'],
    safetyNotes: ['No FFmpeg execution in frontend.', 'Run only approved operations.'],
    futureOnly: true,
  }),
  groupProfile({
    id: 'color_pipeline_worker',
    label: 'Color pipeline worker',
    description: 'Future color management, shot matching, generated asset matching, and Pro/Premium color operations.',
    executionMode: 'preprocess_worker',
    bestFor: ['Color correction', 'Look grade', 'Shot matching', 'Generated asset matching'],
    requiredInputs: ['approvedPlanSnapshotId', 'colorPipelinePlan'],
    outputTypes: ['processed_video', 'qa_report'],
    toolIds: ['ffmpeg', 'opencolorio', 'openimageio', 'opencv'],
    providerModels: [],
    qaResponsibilities: ['Skin tone safety', 'Shot match', 'Color-space assumptions'],
    safetyNotes: ['Do not overprocess documentary/case-study footage unless approved.'],
    futureOnly: true,
  }),
  groupProfile({
    id: 'audio_soundsync_worker',
    label: 'Audio SoundSync worker',
    description: 'Future audio analysis, BPM/onset timing, ducking, SFX cue processing, loudness, and voice cleanup execution.',
    executionMode: 'preprocess_worker',
    bestFor: ['Voice cleanup', 'Loudness', 'Beat timing', 'Ducking', 'SoundSync cues'],
    requiredInputs: ['approvedPlanSnapshotId', 'audioPipelinePlan'],
    outputTypes: ['processed_audio', 'timing_map', 'qa_report'],
    toolIds: ['ffmpeg', 'essentia', 'rubber_band'],
    providerModels: [],
    qaResponsibilities: ['Speech clarity', 'Loudness QA', 'Music/voice balance'],
    safetyNotes: ['Music and SFX must not overpower voice.'],
    futureOnly: true,
  }),
  groupProfile({
    id: 'map_visual_worker',
    label: 'Map visual worker',
    description: 'Future MapLibre/Turf asset and frame sequence worker for routes, pins, labels, and map cards.',
    executionMode: 'render_worker',
    bestFor: ['Route reveal assets', 'Location cards', 'Map frame sequences'],
    requiredInputs: ['approvedPlanSnapshotId', 'mapAnimationPlanItemIds'],
    outputTypes: ['map_visual_asset'],
    toolIds: ['maplibre', 'turf'],
    providerModels: [],
    qaResponsibilities: ['Map label readability', 'Route/source confidence', 'Safe zones'],
    safetyNotes: ['Do not call unapproved tile sources or make unverified geography claims.'],
    futureOnly: true,
  }),
  groupProfile({
    id: 'dataviz_worker',
    label: 'Data visualization worker',
    description: 'Future chart, diagram, money-flow, timeline, metric, and process visual worker.',
    executionMode: 'render_worker',
    bestFor: ['Charts', 'Diagrams', 'Timelines', 'Money flows', 'Metric visuals'],
    requiredInputs: ['approvedPlanSnapshotId', 'dataVizPlanItemIds'],
    outputTypes: ['chart_visual_asset'],
    toolIds: ['d3', 'echarts', 'vega_lite'],
    providerModels: [],
    qaResponsibilities: ['Data label readability', 'Source confidence', 'Exact text control'],
    safetyNotes: ['Do not route exact labels or evidence visuals to AI video.'],
    futureOnly: true,
  }),
  groupProfile({
    id: 'browser_capture_worker',
    label: 'Browser capture worker',
    description: 'Future authorized browser/app capture and redaction worker.',
    executionMode: 'preprocess_worker',
    bestFor: ['Authorized website captures', 'Dashboard screenshots', 'App walkthrough assets'],
    requiredInputs: ['approvedPlanSnapshotId', 'authorizedUrlOrUserProvidedPage'],
    outputTypes: ['browser_capture_asset'],
    toolIds: ['playwright', 'sharp'],
    providerModels: [],
    qaResponsibilities: ['Privacy redaction', 'Readability', 'Source authorization'],
    safetyNotes: ['No auth, paywall, CAPTCHA, or site restriction bypass.'],
    futureOnly: true,
  }),
  groupProfile({
    id: 'mask_tracking_worker',
    label: 'Mask tracking worker',
    description: 'Future segmentation, subject/contact/hero object masks, tracking, and mask QA worker.',
    executionMode: 'preprocess_worker',
    bestFor: ['Foreground masks', 'Contact object preservation', 'Hero object tracking', 'Mask QA'],
    requiredInputs: ['approvedPlanSnapshotId', 'foregroundMaskingPlanItemIds'],
    outputTypes: ['mask_asset', 'qa_report'],
    toolIds: ['opencv'],
    providerModels: [],
    qaResponsibilities: ['Mask edge quality', 'Contact object preservation', 'Fallback layout readiness'],
    safetyNotes: ['Future worker required; no real masks in frontend mock.'],
    futureOnly: true,
  }),
  groupProfile({
    id: 'image_asset_worker',
    label: 'Image asset worker',
    description: 'Future provider worker for GPT-Image-2 stills, keyframes, cards, and references.',
    executionMode: 'generation_worker',
    bestFor: ['Still assets', 'Cards', 'Keyframes', 'Character references'],
    requiredInputs: ['approvedPlanSnapshotId', 'providerPromptPlanIds'],
    outputTypes: ['generated_image_asset'],
    toolIds: [],
    providerModels: ['gpt_image_2'],
    qaResponsibilities: ['Prompt adherence', 'Safety', 'Frame background policy'],
    safetyNotes: ['Provider prompts must come from approved prompt plans.'],
    futureOnly: true,
  }),
  groupProfile({
    id: 'ai_video_asset_worker',
    label: 'AI video asset worker',
    description: 'Future provider worker for Wan/Hailuo/Veo AI clip assets only.',
    executionMode: 'generation_worker',
    bestFor: ['AI animation clips', 'Fallback clips', 'Premium rescue clips'],
    requiredInputs: ['approvedPlanSnapshotId', 'providerPromptPlanIds'],
    outputTypes: ['ai_video_clip_asset'],
    toolIds: [],
    providerModels: ['wan_2_2_kf2v_flash', 'wan_2_6_i2v_flash', 'hailuo_2_3_fast', 'hailuo_02', 'veo_3_1_lite'],
    qaResponsibilities: ['Tier/model policy', 'Resolution policy', 'Prompt adherence'],
    safetyNotes: ['Basic/Pro no Veo. Premium Veo final fallback only. AI video clips are not final canvas.'],
    futureOnly: true,
  }),
  groupProfile({
    id: 'remotion_render_worker',
    label: 'Remotion render worker',
    description: 'Future final canvas/timeline composition, layer assembly, caption, panel, preview, and export rendering.',
    executionMode: 'render_worker',
    bestFor: ['Preview composition', 'Final render', 'Layer assembly', 'Caption placement'],
    requiredInputs: ['approvedPlanSnapshotId', 'rendererLayerIds'],
    outputTypes: ['renderer_composition_asset', 'final_export'],
    toolIds: ['remotion'],
    providerModels: [],
    qaResponsibilities: ['Frame/safe-zone QA', 'Layer order', 'Caption readability'],
    safetyNotes: ['Remotion owns final canvas; provider models do not.'],
    futureOnly: true,
  }),
  groupProfile({
    id: 'qa_worker',
    label: 'QA worker',
    description: 'Future structured QA and plan-compliance worker.',
    executionMode: 'qa_worker',
    bestFor: ['Plan compliance', 'Tier policy', 'Visual/audio/layout QA', 'Fallback review'],
    requiredInputs: ['approvedPlanSnapshotId', 'workerOutputs'],
    outputTypes: ['qa_report', 'error_report'],
    toolIds: ['opencv'],
    providerModels: [],
    qaResponsibilities: ['Approved snapshot compliance', 'No policy bypass', 'User review triggers'],
    safetyNotes: ['QA should block out-of-scope changes.'],
    futureOnly: true,
  }),
  groupProfile({
    id: 'export_worker',
    label: 'Export worker',
    description: 'Future final export packaging, output format, storage, and delivery worker.',
    executionMode: 'export_worker',
    bestFor: ['Preview delivery', 'Final export', 'Storage delivery'],
    requiredInputs: ['approvedPlanSnapshotId', 'finalRenderAssetId'],
    outputTypes: ['final_export', 'renderer_composition_asset'],
    toolIds: ['ffmpeg'],
    providerModels: [],
    qaResponsibilities: ['Output format', 'Aspect ratio', 'Delivery status'],
    safetyNotes: ['Final export only after QA and approval gates.'],
    futureOnly: true,
  }),
]

export const workerJobStepProfiles: WorkerJobStepProfile[] = [
  stepProfile({ id: 'validate_approved_snapshot', label: 'Validate approved snapshot', purpose: 'Confirm the immutable approved plan snapshot exists before work starts.', workerGroup: 'qa_worker', executionMode: 'qa_worker', requiredInputs: ['approvedPlanSnapshotId'], outputTypes: ['qa_report'], allowedFallbackBehavior: ['Request user review if missing or stale.'], qaResponsibilities: ['Approved snapshot compliance'], failureHandling: ['Block job before expensive work.'], creditImpact: 'none', toolIds: [], providerModels: [], safetyNotes: ['Workers execute approved snapshots, not raw chat.'], futureOnly: true }),
  stepProfile({ id: 'reserve_credits', label: 'Reserve credits', purpose: 'Confirm future credit reservation before expensive execution.', workerGroup: 'export_worker', executionMode: 'planning_only', requiredInputs: ['creditReservationId', 'creditEstimateId'], outputTypes: ['none'], allowedFallbackBehavior: ['Wait for credits or request user review.'], qaResponsibilities: ['Credit gate compliance'], failureHandling: ['Block expensive steps.'], creditImpact: 'none', toolIds: [], providerModels: [], safetyNotes: ['No deduction/reservation in frontend mock.'], futureOnly: true }),
  stepProfile({ id: 'prepare_source_media', label: 'Prepare source media', purpose: 'Make approved source media worker-ready.', workerGroup: 'ffmpeg_media_worker', executionMode: 'preprocess_worker', requiredInputs: ['sourceAssetIds'], outputTypes: ['processed_video', 'processed_audio'], allowedFallbackBehavior: ['Retry preparation or request review.'], qaResponsibilities: ['Source media readiness'], failureHandling: ['Block dependent steps.'], creditImpact: 'low', toolIds: ['ffmpeg'], providerModels: [], safetyNotes: ['No FFmpeg execution in frontend.'], futureOnly: true }),
  stepProfile({ id: 'analyze_media', label: 'Analyze media', purpose: 'Future visual/audio/source analysis.', workerGroup: 'media_analysis_worker', executionMode: 'analysis_worker', requiredInputs: ['sourceAssetIds'], outputTypes: ['qa_report', 'timing_map'], allowedFallbackBehavior: ['Retry analysis or lower confidence.'], qaResponsibilities: ['Analysis confidence'], failureHandling: ['Request review if analysis is required.'], creditImpact: 'low', toolIds: ['opencv'], providerModels: [], safetyNotes: ['Do not invent claims.'], futureOnly: true }),
  stepProfile({ id: 'transcribe_audio', label: 'Transcribe audio', purpose: 'Future transcript and timing extraction.', workerGroup: 'media_analysis_worker', executionMode: 'analysis_worker', requiredInputs: ['sourceAssetIds'], outputTypes: ['timing_map'], allowedFallbackBehavior: ['Retry or request transcript review.'], qaResponsibilities: ['Transcript timing'], failureHandling: ['Request user review if transcript is needed.'], creditImpact: 'low', toolIds: ['whisper_cpp'], providerModels: [], safetyNotes: ['Transcript must remain source-grounded.'], futureOnly: true }),
  stepProfile({ id: 'trim_and_cut', label: 'Trim and cut', purpose: 'Execute approved edit operations and cut list.', workerGroup: 'ffmpeg_media_worker', executionMode: 'preprocess_worker', requiredInputs: ['operationIds', 'segmentIds'], outputTypes: ['processed_video'], allowedFallbackBehavior: ['Retry cut or split scene if approved.'], qaResponsibilities: ['Cut accuracy'], failureHandling: ['Fallback to approved segment structure.'], creditImpact: 'medium', toolIds: ['ffmpeg'], providerModels: [], safetyNotes: ['Run only approved operations.'], futureOnly: true }),
  stepProfile({ id: 'color_correct', label: 'Color correct', purpose: 'Execute basic color correction.', workerGroup: 'color_pipeline_worker', executionMode: 'preprocess_worker', requiredInputs: ['colorPipelinePlan'], outputTypes: ['processed_video'], allowedFallbackBehavior: ['Simplify correction settings.'], qaResponsibilities: ['Skin tone and exposure QA'], failureHandling: ['Use conservative correction.'], creditImpact: 'low', toolIds: ['ffmpeg', 'opencv'], providerModels: [], safetyNotes: ['Do not overprocess documentary footage.'], futureOnly: true }),
  stepProfile({ id: 'color_grade', label: 'Color grade', purpose: 'Execute approved look grade and shot matching.', workerGroup: 'color_pipeline_worker', executionMode: 'preprocess_worker', requiredInputs: ['colorPipelinePlan'], outputTypes: ['processed_video'], allowedFallbackBehavior: ['Fallback to neutral grade.'], qaResponsibilities: ['Shot matching and color consistency'], failureHandling: ['Request review for strong look changes.'], creditImpact: 'medium', toolIds: ['ffmpeg', 'opencolorio', 'openimageio'], providerModels: [], safetyNotes: ['Respect approved style and safety constraints.'], futureOnly: true }),
  stepProfile({ id: 'normalize_audio', label: 'Normalize audio', purpose: 'Execute approved loudness normalization.', workerGroup: 'audio_soundsync_worker', executionMode: 'preprocess_worker', requiredInputs: ['audioPipelinePlan'], outputTypes: ['processed_audio'], allowedFallbackBehavior: ['Use simpler loudness target.'], qaResponsibilities: ['Loudness QA'], failureHandling: ['Keep source-safe audio if cleanup fails.'], creditImpact: 'low', toolIds: ['ffmpeg'], providerModels: [], safetyNotes: ['Speech clarity first.'], futureOnly: true }),
  stepProfile({ id: 'sound_cleanup', label: 'Sound cleanup', purpose: 'Execute approved voice/noise cleanup.', workerGroup: 'audio_soundsync_worker', executionMode: 'preprocess_worker', requiredInputs: ['audioPipelinePlan'], outputTypes: ['processed_audio'], allowedFallbackBehavior: ['Reduce cleanup intensity.'], qaResponsibilities: ['Speech clarity QA'], failureHandling: ['Fallback to lighter cleanup.'], creditImpact: 'low', toolIds: ['ffmpeg'], providerModels: [], safetyNotes: ['Do not degrade speaker voice.'], futureOnly: true }),
  stepProfile({ id: 'analyze_music_beats', label: 'Analyze music beats', purpose: 'Create future BPM/onset/beat timing maps.', workerGroup: 'audio_soundsync_worker', executionMode: 'analysis_worker', requiredInputs: ['audioPipelinePlan'], outputTypes: ['timing_map'], allowedFallbackBehavior: ['Skip beat sync or use simpler timing.'], qaResponsibilities: ['Beat alignment QA'], failureHandling: ['Proceed with non-beat-synced edit if approved.'], creditImpact: 'medium', toolIds: ['essentia'], providerModels: [], safetyNotes: ['No real audio analysis in frontend.'], futureOnly: true }),
  stepProfile({ id: 'generate_gpt_image_asset', label: 'Generate GPT image asset', purpose: 'Future GPT-Image-2 still/card/keyframe generation.', workerGroup: 'image_asset_worker', executionMode: 'generation_worker', requiredInputs: ['providerPromptPlanIds'], outputTypes: ['generated_image_asset'], allowedFallbackBehavior: ['Retry, simplify prompt, convert to motion design.'], qaResponsibilities: ['Prompt adherence and safety QA'], failureHandling: ['Request review if output fails QA.'], creditImpact: 'high', toolIds: [], providerModels: ['gpt_image_2'], safetyNotes: ['Use approved prompt plans only.'], futureOnly: true }),
  stepProfile({ id: 'generate_ai_video_asset', label: 'Generate AI video asset', purpose: 'Future Wan/Hailuo/Veo clip generation.', workerGroup: 'ai_video_asset_worker', executionMode: 'generation_worker', requiredInputs: ['providerPromptPlanIds'], outputTypes: ['ai_video_clip_asset'], allowedFallbackBehavior: ['Retry, simplify prompt, use approved fallback, convert to still/motion design.'], qaResponsibilities: ['Model/tier/frame policy QA'], failureHandling: ['Request review if fallback exceeds policy.'], creditImpact: 'premium', toolIds: [], providerModels: ['wan_2_2_kf2v_flash', 'wan_2_6_i2v_flash', 'hailuo_2_3_fast', 'hailuo_02', 'veo_3_1_lite'], safetyNotes: ['Basic/Pro no Veo. Premium Veo final fallback only.'], futureOnly: true }),
  stepProfile({ id: 'render_map_asset', label: 'Render map asset', purpose: 'Future map route/pin/card asset rendering.', workerGroup: 'map_visual_worker', executionMode: 'render_worker', requiredInputs: ['mapAnimationPlanItemIds'], outputTypes: ['map_visual_asset'], allowedFallbackBehavior: ['Static map, lower panel, or side-by-side fallback.'], qaResponsibilities: ['Label readability and source confidence'], failureHandling: ['Use approved fallback layout.'], creditImpact: 'medium', toolIds: ['maplibre', 'turf'], providerModels: [], safetyNotes: ['No unapproved tile/API calls.'], futureOnly: true }),
  stepProfile({ id: 'render_dataviz_asset', label: 'Render data visualization asset', purpose: 'Future chart/diagram asset rendering.', workerGroup: 'dataviz_worker', executionMode: 'render_worker', requiredInputs: ['dataVizPlanItemIds'], outputTypes: ['chart_visual_asset'], allowedFallbackBehavior: ['Simpler chart or static card.'], qaResponsibilities: ['Label/data readability'], failureHandling: ['Request source review if data confidence is weak.'], creditImpact: 'medium', toolIds: ['d3', 'echarts', 'vega_lite'], providerModels: [], safetyNotes: ['Do not invent numbers or evidence.'], futureOnly: true }),
  stepProfile({ id: 'capture_browser_asset', label: 'Capture browser asset', purpose: 'Future authorized page/app/dashboard capture.', workerGroup: 'browser_capture_worker', executionMode: 'preprocess_worker', requiredInputs: ['authorizedUrlOrUserProvidedPage'], outputTypes: ['browser_capture_asset'], allowedFallbackBehavior: ['Request user review or use static user-provided asset.'], qaResponsibilities: ['Redaction, readability, source authorization'], failureHandling: ['Block if capture is not authorized.'], creditImpact: 'medium', toolIds: ['playwright', 'sharp'], providerModels: [], safetyNotes: ['No auth, paywall, CAPTCHA, or restriction bypass.'], futureOnly: true }),
  stepProfile({ id: 'generate_mask_asset', label: 'Generate mask asset', purpose: 'Future foreground/contact/hero object mask generation.', workerGroup: 'mask_tracking_worker', executionMode: 'preprocess_worker', requiredInputs: ['foregroundMaskingPlanItemIds'], outputTypes: ['mask_asset'], allowedFallbackBehavior: ['Fallback layout, subject-only mask, or manual review.'], qaResponsibilities: ['Mask edge and contact-object QA'], failureHandling: ['Use approved fallback layout.'], creditImpact: 'high', toolIds: ['opencv'], providerModels: [], safetyNotes: ['Future segmentation/tracking worker required.'], futureOnly: true }),
  stepProfile({ id: 'compose_remotion_preview', label: 'Compose Remotion preview', purpose: 'Future preview layer assembly.', workerGroup: 'remotion_render_worker', executionMode: 'render_worker', requiredInputs: ['rendererLayerIds'], outputTypes: ['renderer_composition_asset'], allowedFallbackBehavior: ['Fallback layout or static layers.'], qaResponsibilities: ['Caption/layer/safe-zone QA'], failureHandling: ['Request review if composition diverges.'], creditImpact: 'medium', toolIds: ['remotion'], providerModels: [], safetyNotes: ['Remotion owns final canvas.'], futureOnly: true }),
  stepProfile({ id: 'render_remotion_final', label: 'Render Remotion final', purpose: 'Future final composition render.', workerGroup: 'remotion_render_worker', executionMode: 'render_worker', requiredInputs: ['rendererLayerIds'], outputTypes: ['renderer_composition_asset'], allowedFallbackBehavior: ['Retry render or use approved fallback layout.'], qaResponsibilities: ['Final composition QA'], failureHandling: ['Block export if final render fails.'], creditImpact: 'high', toolIds: ['remotion'], providerModels: [], safetyNotes: ['No real render in frontend mock.'], futureOnly: true }),
  stepProfile({ id: 'postprocess_export', label: 'Postprocess export', purpose: 'Future encoding and export prep.', workerGroup: 'ffmpeg_media_worker', executionMode: 'postprocess_worker', requiredInputs: ['rendererCompositionAssetId'], outputTypes: ['processed_video'], allowedFallbackBehavior: ['Retry encode or simplify export settings.'], qaResponsibilities: ['Format/loudness QA'], failureHandling: ['Block delivery if export fails.'], creditImpact: 'medium', toolIds: ['ffmpeg'], providerModels: [], safetyNotes: ['No real export in frontend.'], futureOnly: true }),
  stepProfile({ id: 'run_qa_checks', label: 'Run QA checks', purpose: 'Run structured QA across outputs and policy compliance.', workerGroup: 'qa_worker', executionMode: 'qa_worker', requiredInputs: ['workerOutputs', 'approvedPlanSnapshotId'], outputTypes: ['qa_report'], allowedFallbackBehavior: ['Retry, fallback, or request user review.'], qaResponsibilities: ['All applicable QA'], failureHandling: ['Block delivery on blocking QA.'], creditImpact: 'low', toolIds: ['opencv'], providerModels: [], safetyNotes: ['QA enforces approved policy.'], futureOnly: true }),
  stepProfile({ id: 'retry_or_fallback', label: 'Retry or fallback', purpose: 'Apply approved retry/fallback policy.', workerGroup: 'qa_worker', executionMode: 'qa_worker', requiredInputs: ['failedStepId', 'fallbackPolicy'], outputTypes: ['error_report'], allowedFallbackBehavior: ['Only approved policy.'], qaResponsibilities: ['Fallback compliance'], failureHandling: ['Request review if exceeded.'], creditImpact: 'medium', toolIds: [], providerModels: [], safetyNotes: ['Fallback cannot exceed approved plan.'], futureOnly: true }),
  stepProfile({ id: 'request_user_review', label: 'Request user review', purpose: 'Pause for user approval when plan changes exceed allowance.', workerGroup: 'qa_worker', executionMode: 'qa_worker', requiredInputs: ['reviewReason'], outputTypes: ['qa_report'], allowedFallbackBehavior: ['None until approved.'], qaResponsibilities: ['Scope compliance'], failureHandling: ['Wait for review.'], creditImpact: 'none', toolIds: [], providerModels: [], safetyNotes: ['New approval required.'], futureOnly: true }),
  stepProfile({ id: 'deliver_preview', label: 'Deliver preview', purpose: 'Make future preview available after QA.', workerGroup: 'export_worker', executionMode: 'export_worker', requiredInputs: ['previewAssetId'], outputTypes: ['renderer_composition_asset'], allowedFallbackBehavior: ['Request review.'], qaResponsibilities: ['Preview delivery status'], failureHandling: ['Keep job reviewable.'], creditImpact: 'none', toolIds: [], providerModels: [], safetyNotes: ['Preview is not final export.'], futureOnly: true }),
  stepProfile({ id: 'create_final_export', label: 'Create final export', purpose: 'Prepare final output after approval and QA.', workerGroup: 'export_worker', executionMode: 'export_worker', requiredInputs: ['finalRenderAssetId'], outputTypes: ['final_export'], allowedFallbackBehavior: ['Retry export or request review.'], qaResponsibilities: ['Final export QA'], failureHandling: ['Refund/restore policy applies later.'], creditImpact: 'high', toolIds: ['ffmpeg'], providerModels: [], safetyNotes: ['No export job in frontend mock.'], futureOnly: true }),
]

export function getWorkerGroupProfile(group: WorkerGroup) {
  return workerGroupProfiles.find((profile) => profile.id === group)
}

export function getWorkerJobStepProfile(stepType: WorkerJobStepType) {
  return workerJobStepProfiles.find((profile) => profile.id === stepType)
}

function visualPlanUsesProvider(plan: EditPlan, predicate: (model: ProviderModel) => boolean) {
  return (plan.visualAssetPlan ?? []).some((asset) =>
    predicate(asset.providerRoute.primaryModel) ||
    asset.providerRoute.fallbackModels.some(predicate) ||
    asset.providerRoute.fallbackSteps.some((step) => step.model ? predicate(step.model) : false),
  )
}

export function getWorkerStepsForPlan(plan: EditPlan): WorkerJobStepType[] {
  const steps: WorkerJobStepType[] = [
    'validate_approved_snapshot',
    'reserve_credits',
    'prepare_source_media',
  ]

  if (plan.videoUnderstandingReport) {
    steps.push('analyze_media')
    if ((plan.segmentEditPlans ?? []).some((segment) => Boolean(segment.spokenTextSummary))) {
      steps.push('transcribe_audio')
    }
  }

  if ((plan.segmentEditPlans ?? []).length > 0) {
    steps.push('trim_and_cut')
  }

  if (plan.colorPipelinePlan) {
    steps.push('color_correct', 'color_grade')
  }

  if (plan.audioPipelinePlan) {
    steps.push('normalize_audio', 'sound_cleanup')
    if (plan.audioPipelinePlan.soundSyncCues.length > 0) {
      steps.push('analyze_music_beats')
    }
  }

  if (visualPlanUsesProvider(plan, (model) => model === 'gpt_image_2') || (plan.providerPromptPlans ?? []).some((prompt) => prompt.providerModel === 'gpt_image_2')) {
    steps.push('generate_gpt_image_asset')
  }

  if (visualPlanUsesProvider(plan, (model) => model === 'wan_2_2_kf2v_flash' || model === 'wan_2_6_i2v_flash' || model === 'hailuo_2_3_fast' || model === 'hailuo_02' || model === 'veo_3_1_lite') ||
    (plan.providerPromptPlans ?? []).some((prompt) => prompt.providerModel === 'wan_2_2_kf2v_flash' || prompt.providerModel === 'wan_2_6_i2v_flash' || prompt.providerModel === 'hailuo_2_3_fast' || prompt.providerModel === 'hailuo_02' || prompt.providerModel === 'veo_3_1_lite')) {
    steps.push('generate_ai_video_asset')
  }

  if (plan.mapAnimationPlan?.active) {
    steps.push('render_map_asset')
  }

  if (plan.dataVizPlan?.active) {
    steps.push('render_dataviz_asset')
  }

  if (plan.foregroundMaskingPlan?.active) {
    steps.push('generate_mask_asset')
  }

  if (plan.rendererCompositionPlan) {
    steps.push('compose_remotion_preview')
    if (plan.approvalRequired) {
      steps.push('render_remotion_final', 'postprocess_export', 'create_final_export')
    }
  }

  steps.push('run_qa_checks', 'deliver_preview')

  return Array.from(new Set(steps))
}

export function getProviderModelsForStep(stepType: WorkerJobStepType, plan: EditPlan): ProviderModel[] {
  if (stepType === 'generate_gpt_image_asset') {
    return ['gpt_image_2']
  }

  if (stepType !== 'generate_ai_video_asset') {
    return []
  }

  const models = new Set<ProviderModel>()

  for (const asset of plan.visualAssetPlan ?? []) {
    for (const model of [asset.providerRoute.primaryModel, ...asset.providerRoute.fallbackModels]) {
      if (model !== 'none' && model !== 'gpt_image_2' && model !== 'remotion_editor_motion' && model !== 'svg_lottie_renderer') {
        models.add(model)
      }
    }
    for (const step of asset.providerRoute.fallbackSteps) {
      if (step.model && step.model !== 'none' && step.model !== 'gpt_image_2' && step.model !== 'remotion_editor_motion' && step.model !== 'svg_lottie_renderer') {
        models.add(step.model)
      }
    }
  }

  return Array.from(models)
}

export function getToolIdsForStep(stepType: WorkerJobStepType): OpenSourceToolId[] {
  return getWorkerJobStepProfile(stepType)?.toolIds ?? []
}

export function getOutputTypesForStep(stepType: WorkerJobStepType): WorkerOutputType[] {
  return getWorkerJobStepProfile(stepType)?.outputTypes ?? ['none']
}
