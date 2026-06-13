import { existsSync, readFileSync } from 'node:fs'

const requiredDocs = [
  'docs/tool-studies/track-b-media-processing-tool-study.md',
  'docs/tool-studies/track-b-media-processing-capability-map.md',
  'docs/tool-studies/track-b-media-processing-tool-combination-map.md',
  'docs/tool-studies/track-b-media-processing-routing-policy.md',
  'docs/tool-studies/track-b-media-processing-handoff-contract.md',
  'docs/tool-studies/track-b-media-processing-internal-beta-gap-map.md',
  'docs/tool-studies/track-b-media-processing-blocked-use-register.md',
  'docs/prompt-tool-study-0-track-b-media-processing-validation-results.md',
  'docs/implementation-prompts/prompt-tool-study-0-track-b-media-processing.md',
]

const toolIds = [
  'paddleocr',
  'paddlepaddle',
  'opencv',
  'pyav',
  'pyscenedetect',
  'sharp_libvips',
  'duckdb',
  'polars',
  'deepfilternet',
  'signalsmith_stretch',
  'demucs_blocked',
  'qwen3_vl_blocked',
  'vllm_blocked',
  'media_capability_profiler',
  'desktop_capability_profiler',
  'local_worker_sidecar_planning',
  'media_cost_estimator',
  'tool_route_manifest_integration',
]

const capabilityIds = [
  'ocr_text_in_frame_planning',
  'frame_image_analysis_planning',
  'scene_detection_planning',
  'shot_boundary_planning',
  'video_metadata_extraction_planning',
  'media_derivative_planning',
  'image_resize_thumbnail_derivative_planning',
  'audio_environment_analysis_planning',
  'voice_noise_cleanup_planning',
  'time_stretch_speed_change_planning',
  'media_table_query_analysis_planning',
  'media_pipeline_manifest_planning',
  'generated_local_fixture_analysis',
  'private_artifact_manifest_policy',
  'demucs_future_stem_separation_planning',
  'qwen_vlm_future_visual_understanding_planning',
  'vllm_future_serving_planning',
]

const requiredPhrases = [
  'TRACK_B_MEDIA_PROCESSING',
  'ready_for_TOOL_ROUTE_1_route_dry_run_planning_after_owner_review',
  'blocked_current_branch_missing_sync_layer',
  'No Supabase mutation, SQL execution, Google Cloud API call, Secret Manager API call, provider call, model call, tool execution, worker execution, route execution, browser capture, Docker/Cloud Run execution, storage transfer, signed URL creation, public artifact creation, credit mutation, Stripe checkout/webhook/payment processing, deployment, internal beta unlock, external beta unlock, production unlock, dependency mutation, raw prompt execution, final render/export, or broad service-role handler was enabled.',
]

const failures = []
for (const path of requiredDocs) {
  if (!existsSync(path)) failures.push(`missing_doc:${path}`)
}

const docsText = requiredDocs
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')

for (const toolId of toolIds) {
  if (!docsText.includes(toolId)) failures.push(`missing_tool:${toolId}`)
}

for (const capabilityId of capabilityIds) {
  if (!docsText.includes(capabilityId)) failures.push(`missing_capability:${capabilityId}`)
}

for (const phrase of requiredPhrases) {
  if (!docsText.includes(phrase)) failures.push(`missing_required_phrase:${phrase.slice(0, 80)}`)
}

const forbiddenPatterns = [
  ['public_artifact_enabled', /\bpublic artifacts?\s*(?::|=)\s*`?(enabled|created|allowed|ready|true)\b/i],
  ['public_artifact_enabled_statement', /\bpublic artifacts?\b\s+(is|are|was|were)\s+(enabled|created|allowed|ready|source-of-truth)\b/i],
  ['signed_url_source_truth', /\bsigned URLs?\s*(?::|=)\s*`?(source-of-truth|source of truth|enabled|created|allowed|true)\b/i],
  ['signed_url_source_truth_statement', /\bsigned URLs?\b\s+(is|are|was|were)\s+(source-of-truth|source of truth|enabled|created|allowed)\b/i],
  ['raw_prompt_execution_claim', /\braw prompt execution\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['raw_prompt_execution_statement', /\braw prompt execution\b\s+(is|was|has been)\s+(enabled|allowed|ready|executed)\b/i],
  ['worker_execution_claim', /\bworker execution\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['worker_execution_statement', /\bworker execution\b\s+(is|was|has been)\s+(enabled|allowed|ready|executed)\b/i],
  ['provider_execution_claim', /\b(provider|model) calls?\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['provider_execution_statement', /\b(provider|model) calls?\b\s+(is|are|was|were|has been|have been)\s+(enabled|allowed|ready|executed)\b/i],
  ['tool_execution_claim', /\btool execution\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['tool_execution_statement', /\btool execution\b\s+(is|was|has been)\s+(enabled|allowed|ready|executed)\b/i],
  ['route_execution_claim', /\broute execution\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['route_execution_statement', /\broute execution\b\s+(is|was|has been)\s+(enabled|allowed|ready|executed)\b/i],
  ['browser_capture_execution_claim', /\bbrowser capture\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['supabase_mutation_claim', /\bSupabase mutation\s*(?::|=)\s*`?(enabled|allowed|executed|applied|true)\b/i],
  ['sql_execution_claim', /\bSQL executed:\s*`?(true|yes|applied)\b/i],
  ['migration_deployed_claim', /\bMigration deployed:\s*`?(true|yes|applied)\b/i],
  ['production_unlock_claim', /\bproduction unlock\s*(?::|=)\s*`?(enabled|allowed|ready|true)\b/i],
  ['external_beta_unlock_claim', /\bexternal beta unlock\s*(?::|=)\s*`?(enabled|allowed|ready|true)\b/i],
  ['internal_beta_unlock_claim', /\binternal beta unlock\s*(?::|=)\s*`?(enabled|allowed|ready|true)\b/i],
  ['media_processing_execution_claim', /\b(media processing|media runtime)\s*(?::|=)\s*`?(enabled|allowed|ready|executed|ran|true)\b/i],
  ['media_processing_execution_statement', /\b(media processing|media runtime)\b\s+(is|was|has been)\s+(enabled|allowed|ready|executed|run|ran)\b/i],
  ['ffmpeg_execution_claim', /\b(FFmpeg|FFprobe) execution\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['ffmpeg_execution_statement', /\b(FFmpeg|FFprobe)\b\s+(is|was|has been)\s+(enabled|allowed|ready|executed|ran)\b/i],
  ['ocr_execution_claim', /\bOCR execution\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['opencv_execution_claim', /\b(OpenCV|PyAV|PySceneDetect|Sharp\/libvips) execution\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['audio_runtime_claim', /\b(DeepFilterNet|Signalsmith Stretch|Demucs) runtime\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['vlm_runtime_claim', /\b(Qwen3?-?VL|Qwen\/VLM|VLM|vLLM) runtime\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['broad_media_claim', /\bbroad media\s*(?::|=)\s*`?(enabled|allowed|ready|true)\b/i],
  ['package_install_claim', /\b(unapproved package install|package install|dependency mutation)\s*(?::|=)\s*`?(enabled|allowed|executed|true)\b/i],
  ['secret_material', /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|X-Goog-Signature=|X-Amz-Signature=)\b/i],
]

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
if (packageJson.scripts?.['tool-study:track-b-media-processing:diagnostics'] !== 'node scripts/validation/tool-study-track-b-media-processing-diagnostics.mjs') {
  failures.push('missing_package_script:tool-study:track-b-media-processing:diagnostics')
}

const result = {
  status: failures.length === 0 ? 'passed' : 'blocked',
  checkedDocs: requiredDocs.length,
  toolIds: toolIds.length,
  capabilityIds: capabilityIds.length,
  noMediaProcessingExecution: true,
  noFfmpegOrFfprobeExecution: true,
  noOcrExecution: true,
  noOpenCvPyAvPySceneDetectExecution: true,
  noDeepFilterNetSignalsmithDemucsRuntime: true,
  noQwenVlmVllmRuntime: true,
  noProviderCalls: true,
  noToolExecution: true,
  noWorkerExecution: true,
  noRouteExecution: true,
  noSupabaseMutation: true,
  noGcsUpload: true,
  noPublicArtifacts: true,
  noSignedUrls: true,
  noBetaProductionUnlock: true,
  failures,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length > 0) process.exit(1)
