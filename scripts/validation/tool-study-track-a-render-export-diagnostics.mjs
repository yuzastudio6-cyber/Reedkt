import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredDocs = [
  'docs/tool-studies/track-a-render-export-source-of-truth-audit.json',
  'docs/tool-studies/track-a-render-export-tool-study.md',
  'docs/tool-studies/track-a-render-export-capability-map.md',
  'docs/tool-studies/track-a-render-export-tool-combination-map.md',
  'docs/tool-studies/track-a-render-export-routing-policy.md',
  'docs/tool-studies/track-a-render-export-handoff-contract.md',
  'docs/tool-studies/track-a-render-export-internal-beta-gap-map.md',
  'docs/tool-studies/track-a-render-export-blocked-use-register.md',
  'docs/prompt-tool-study-0-track-a-render-export-validation-results.md',
  'docs/implementation-prompts/prompt-tool-study-0-track-a-render-export.md',
  'docs/cross-chat/READ_FIRST_FOR_ALL_OWNERS.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/OWNER_MATRIX.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]

const ownedToolIds = [
  'final_timeline_assembly_planning',
  'render_export_planning',
  'mux_transcode_container_planning',
  'codec_quality_profile_planning',
  'caption_subtitle_burnin_planning',
  'overlay_graphics_placement_handoff',
  'audio_video_sync_handoff_planning',
  'preview_proxy_export_qa_metadata',
  'artifact_manifest_checksum_planning',
  'private_gcs_path_planning',
  'retention_delete_rollback_planning',
  'export_cost_capacity_metadata',
  'final_export_route_capability_metadata',
]

const relatedButNotOwned = [
  'TRACK_B_MEDIA_PROCESSING',
  'SOUND_MUSIC_AUDIO',
  'AI_TOOLS_CREATIVE_GRAPHICS',
  'PROVIDER_GATEWAY',
  'WORKER_RUNTIME_JOBS',
  'PUBLIC_ARTIFACT_DELIVERY',
  'SUPABASE_RLS_STORAGE_DATABASE',
]

const requiredPhrases = [
  'track_a_render_export_tool_study_passed_docs_only',
  'complete_for_TRACK_A_RENDER_EXPORT_owner_study',
  'routeExecutionAllowed: false',
  'runtimeExecutionAllowed: false',
  'workerExecutionAllowed: false',
  'providerExecutionAllowed: false',
  'modelExecutionAllowed: false',
  'toolExecutionAllowed: false',
  'renderExecutionAllowed: false',
  'exportExecutionAllowed: false',
  'mediaProcessingAllowed: false',
  'publicArtifactsAllowed: false',
  'signedUrlsAsSourceOfTruthAllowed: false',
  'Supabase update required: `no write`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Signed URLs are never source of truth',
  'TOOL-STUDY-0 completion rollup and route-unlock readiness check',
]

const allowedConfirmations = new Set([
  'REEDITPRO_CONFIRM_TOOL_STUDY_0_TRACK_A_RENDER_EXPORT',
  'REEDITPRO_CONFIRM_TOOL_STUDY_DOCS_ONLY',
  'REEDITPRO_CONFIRM_TOOL_STUDY_DIAGNOSTICS_ONLY',
  'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
])

const forbiddenConfirmationFragments = [
  'TOOL_ROUTE_EXECUTION',
  'WORKER_EXECUTION',
  'PROVIDER_CALLS',
  'MODEL_EXECUTION',
  'RENDER_EXPORT_EXECUTION',
  'MEDIA_PROCESSING',
  'BROWSER_CAPTURE',
  'MAP_RENDERING',
  'SUPABASE_METADATA_WRITE',
  'SUPABASE_PRODUCTION_SQL',
  'GCS_UPLOAD',
  'PUBLIC_ARTIFACT',
  'SIGNED_URL',
  'PRODUCTION_WRITE',
  'EXTERNAL_BETA_UNLOCK',
  'PAID_PRODUCTION_UNLOCK',
  'DEPENDENCY_MUTATION',
  'RAW_PROMPT_EXECUTION',
  'SECRET_PAYLOAD_PRINT',
]

const forbiddenPatterns = [
  ['production_enabled', /\bproduction\s+(?:is\s+)?(?:enabled|unlocked|approved|allowed|ready)\b/i],
  ['external_beta_enabled', /\bexternal beta\s+(?:is\s+)?(?:enabled|unlocked|approved|allowed|ready)\b/i],
  ['paid_production_enabled', /\bpaid production\s+(?:is\s+)?(?:enabled|unlocked|approved|allowed|ready)\b/i],
  ['worker_execution_enabled', /\bworker execution\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['tool_execution_enabled', /\btool execution\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['route_execution_enabled', /\broute execution\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['provider_execution_enabled', /\bprovider (?:execution|calls?)\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['model_execution_enabled', /\bmodel execution\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['render_execution_enabled', /\brender execution\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['export_execution_enabled', /\bexport execution\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['render_or_export_enabled', /\brender\/export\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['media_processing_enabled', /\bmedia processing\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['signed_url_truth', /\bsigned URLs?\s+(?:are|is|become)\s+(?:the\s+)?source(?:-|\s+)of(?:-|\s+)truth\b/i],
  ['raw_prompt_enabled', /\braw prompt execution\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['supabase_mutation_enabled', /\bSupabase mutation\s*(?::|=)?\s*(?:enabled|allowed|executed|applied|true)\b/i],
  ['dependency_mutation_enabled', /\bdependency mutation\s*(?::|=)?\s*(?:enabled|allowed|executed|true)\b/i],
  ['public_artifact_enabled', /\bpublic artifacts?\s*(?::|=)?\s*(?:enabled|allowed|created|ready|true)\b/i],
  ['secret_material', new RegExp(String.raw`\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|X-` + String.raw`Goog-Signature=|X-` + String.raw`Amz-Signature=)\b`, 'i')],
]

const failures = []

for (const path of requiredDocs) {
  if (!existsSync(path)) failures.push(`missing_doc:${path}`)
}

const docsText = requiredDocs
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')

for (const toolId of ownedToolIds) {
  if (!docsText.includes(toolId)) failures.push(`missing_owned_tool:${toolId}`)
}

for (const relatedId of relatedButNotOwned) {
  if (!docsText.includes(relatedId)) failures.push(`missing_related_but_not_owned:${relatedId}`)
}

for (const phrase of requiredPhrases) {
  if (!docsText.includes(phrase)) failures.push(`missing_required_phrase:${phrase}`)
}

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

let audit
try {
  audit = JSON.parse(readFileSync('docs/tool-studies/track-a-render-export-source-of-truth-audit.json', 'utf8'))
} catch (error) {
  failures.push(`source_audit_json_invalid:${error.message}`)
}

if (audit) {
  if (audit.schema !== 'reeditpro.toolStudy.trackARenderExport.sourceOfTruthAudit.v1') {
    failures.push(`source_audit_schema:${audit.schema}`)
  }
  if (audit.decision !== 'track_a_render_export_tool_study_passed_docs_only') {
    failures.push(`source_audit_decision:${audit.decision}`)
  }
  if (audit.status !== 'complete_for_TRACK_A_RENDER_EXPORT_owner_study') {
    failures.push(`source_audit_status:${audit.status}`)
  }
  for (const toolId of ownedToolIds) {
    if (!audit.ownedTools?.includes(toolId)) failures.push(`source_audit_missing_owned_tool:${toolId}`)
  }
  const falseFlags = [
    'runtimeExecutionAllowed',
    'routeExecutionAllowed',
    'toolExecutionAllowed',
    'workerExecutionAllowed',
    'providerExecutionAllowed',
    'modelExecutionAllowed',
    'renderExecutionAllowed',
    'exportExecutionAllowed',
    'mediaProcessingAllowed',
    'browserCaptureAllowed',
    'mapRenderingAllowed',
    'supabaseWritesAllowed',
    'sqlAllowed',
    'gcsUploadAllowed',
    'publicArtifactsAllowed',
    'signedUrlsAsSourceOfTruthAllowed',
    'dependencyMutationAllowed',
    'rawPromptExecutionAllowed',
    'internalBetaUnlockAllowed',
    'externalBetaUnlockAllowed',
    'paidProductionUnlockAllowed',
    'productionUnlockAllowed',
  ]
  for (const flag of falseFlags) {
    if (audit.scope?.[flag] !== false) failures.push(`source_audit_flag_not_false:${flag}`)
  }
  if (audit.runtimeReadiness?.metadataReviewReady !== true) failures.push('source_audit_metadata_review_not_ready')
  if (audit.runtimeReadiness?.realRuntimeReady !== false) failures.push('source_audit_real_runtime_not_false')
  if (audit.runtimeReadiness?.renderRuntimeReady !== false) failures.push('source_audit_render_runtime_not_false')
  if (audit.runtimeReadiness?.exportRuntimeReady !== false) failures.push('source_audit_export_runtime_not_false')
  if (audit.runtimeReadiness?.workerRuntimeReady !== false) failures.push('source_audit_worker_runtime_not_false')
  if (audit.runtimeReadiness?.providerRuntimeReady !== false) failures.push('source_audit_provider_runtime_not_false')
  if (audit.runtimeReadiness?.publicArtifactDeliveryBlocked !== true) failures.push('source_audit_public_artifact_delivery_not_blocked')
  if (audit.runtimeReadiness?.signedUrlSourceOfTruthBlocked !== true) failures.push('source_audit_signed_url_truth_not_blocked')
  if (audit.supabaseClassification?.updateRequired !== 'no write') failures.push('source_audit_supabase_update_required_not_no_write')
  if (audit.supabaseClassification?.environmentTouched !== 'none') failures.push('source_audit_supabase_environment_touched')
  if (audit.supabaseClassification?.sql !== 'none') failures.push('source_audit_sql_not_none')
  if (audit.supabaseClassification?.migrationDeployed !== 'no') failures.push('source_audit_migration_deployed_not_no')
  if (audit.secretPolicy?.payloadAccessed !== false || audit.secretPolicy?.payloadPrinted !== false || audit.secretPolicy?.payloadCommitted !== false) {
    failures.push('source_audit_secret_policy_not_redacted')
  }
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
if (packageJson.scripts?.['tool-study:track-a-render-export:diagnostics'] !== 'node scripts/validation/tool-study-track-a-render-export-diagnostics.mjs') {
  failures.push('missing_package_script:tool-study:track-a-render-export:diagnostics')
}

try {
  const packageLockStatus = execFileSync('git', ['status', '--short', 'package-lock.json'], {
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    encoding: 'utf8',
  }).trim()
  if (packageLockStatus) failures.push(`package_lock_changed:${packageLockStatus}`)
} catch (error) {
  failures.push(`package_lock_status_failed:${error.message}`)
}

for (const [name, value] of Object.entries(process.env)) {
  if (!name.startsWith('REEDITPRO_CONFIRM_') || value !== 'true') continue
  if (allowedConfirmations.has(name)) continue
  if (forbiddenConfirmationFragments.some((fragment) => name.includes(fragment))) {
    failures.push(`forbidden_confirmation_set:${name}`)
  }
}

const result = {
  status: failures.length === 0 ? 'passed' : 'blocked',
  checkedDocs: requiredDocs.length,
  ownedToolIds: ownedToolIds.length,
  relatedButNotOwned: relatedButNotOwned.length,
  decision: audit?.decision ?? null,
  routeExecutionAllowed: false,
  runtimeExecutionAllowed: false,
  workerExecutionAllowed: false,
  providerExecutionAllowed: false,
  modelExecutionAllowed: false,
  toolExecutionAllowed: false,
  renderExecutionAllowed: false,
  exportExecutionAllowed: false,
  mediaProcessingAllowed: false,
  supabaseWritesAllowed: false,
  publicArtifactsAllowed: false,
  signedUrlsAsSourceOfTruthAllowed: false,
  dependencyMutationAllowed: false,
  rawPromptExecutionAllowed: false,
  productionUnlockAllowed: false,
  failures,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length > 0) process.exit(1)
