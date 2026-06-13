import { existsSync, readFileSync } from 'node:fs'

const requiredDocs = [
  'docs/tool-studies/track-a-render-export-tool-study.md',
  'docs/tool-studies/track-a-render-export-capability-map.md',
  'docs/tool-studies/track-a-render-export-tool-combination-map.md',
  'docs/tool-studies/track-a-render-export-routing-policy.md',
  'docs/tool-studies/track-a-render-export-handoff-contract.md',
  'docs/tool-studies/track-a-render-export-internal-beta-gap-map.md',
  'docs/tool-studies/track-a-render-export-blocked-use-register.md',
  'docs/prompt-tool-study-0-track-a-render-export-validation-results.md',
  'docs/implementation-prompts/prompt-tool-study-0-track-a-render-export.md',
]

const capabilityIds = [
  'final_composition_planning',
  'private_preview_planning',
  'render_manifest_policy',
  'export_manifest_policy',
  'caption_burnin_preview_route',
  'overlay_composition_handoff',
  'lower_third_title_card_composition_handoff',
  'transparent_overlay_intake',
  'ai_tools_asset_intake',
  'map_overlay_intake',
  'web_evidence_visual_intake',
  'track_b_media_analysis_intake',
  'sound_music_audio_intake',
  'final_artifact_qa_handoff',
  'private_review_artifact_policy',
  'future_export_delivery_policy',
]

const requiredPhrases = [
  'TRACK_A_RENDER_EXPORT',
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
  ['production_unlock_statement', /\bproduction unlock\b\s+(is|was|has been)\s+(enabled|allowed|ready)\b/i],
  ['external_beta_unlock_claim', /\bexternal beta unlock\s*(?::|=)\s*`?(enabled|allowed|ready|true)\b/i],
  ['internal_beta_unlock_claim', /\binternal beta unlock\s*(?::|=)\s*`?(enabled|allowed|ready|true)\b/i],
  ['final_render_execution_claim', /\bfinal render\/export\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['final_render_execution_statement', /\bfinal render\/export\b\s+(is|was|has been)\s+(enabled|allowed|ready|executed)\b/i],
  ['preview_render_execution_claim', /\bpreview render(ing| execution)?\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['ffmpeg_execution_claim', /\bFFmpeg execution\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['ffmpeg_execution_statement', /\bFFmpeg\b\s+(is|was|has been)\s+(enabled|allowed|ready|executed|ran)\b/i],
  ['remotion_execution_claim', /\bRemotion execution\s*(?::|=)\s*`?(enabled|allowed|ready|executed|true)\b/i],
  ['remotion_execution_statement', /\bRemotion\b\s+(is|was|has been)\s+(enabled|allowed|ready|executed|ran)\b/i],
  ['render_command_claim', /\b(render|export|ffmpeg|remotion)\s+command\s*(?::|=)\s*`?(enabled|added|ready|executed|true)\b/i],
  ['package_install_claim', /\b(unapproved package install|package install|dependency mutation)\s*(?::|=)\s*`?(enabled|allowed|executed|true)\b/i],
  ['secret_material', /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|X-Goog-Signature=|X-Amz-Signature=)\b/i],
]

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
if (packageJson.scripts?.['tool-study:track-a-render-export:diagnostics'] !== 'node scripts/validation/tool-study-track-a-render-export-diagnostics.mjs') {
  failures.push('missing_package_script:tool-study:track-a-render-export:diagnostics')
}

const result = {
  status: failures.length === 0 ? 'passed' : 'blocked',
  checkedDocs: requiredDocs.length,
  capabilityIds: capabilityIds.length,
  noRenderExportExecution: true,
  noPreviewRenderExecution: true,
  noFfmpegExecution: true,
  noRemotionExecution: true,
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
