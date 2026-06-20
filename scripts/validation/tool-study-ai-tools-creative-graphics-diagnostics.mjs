import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredDocs = [
  'docs/tool-studies/ai-tools-creative-graphics-source-of-truth-audit.json',
  'docs/tool-studies/ai-tools-creative-graphics-tool-study.md',
  'docs/tool-studies/ai-tools-creative-graphics-capability-map.md',
  'docs/tool-studies/ai-tools-creative-graphics-tool-combination-map.md',
  'docs/tool-studies/ai-tools-creative-graphics-routing-policy.md',
  'docs/tool-studies/ai-tools-creative-graphics-handoff-contract.md',
  'docs/tool-studies/ai-tools-creative-graphics-internal-beta-gap-map.md',
  'docs/tool-studies/ai-tools-creative-graphics-blocked-use-register.md',
  'docs/prompt-tool-study-0-ai-tools-creative-graphics-validation-results.md',
  'docs/implementation-prompts/prompt-tool-study-0-ai-tools-creative-graphics.md',
  'docs/cross-chat/READ_FIRST_FOR_ALL_OWNERS.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/OWNER_MATRIX.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]

const ownedToolIds = [
  'ai_image_generation_planning',
  'ai_image_editing_planning',
  'style_transfer_planning',
  'thumbnail_cover_poster_planning',
  'title_card_lower_third_overlay_planning',
  'typography_layout_composition_metadata',
  'brand_visual_style_metadata',
  'graphic_asset_qa_metadata',
  'design_prompt_to_intent_routing',
  'creative_graphics_route_capability_metadata',
  'creative_graphics_cost_capacity_metadata',
]

const relatedButNotOwned = [
  'TRACK_B_MEDIA_PROCESSING',
  'SOUND_MUSIC_AUDIO',
  'TRACK_A_RENDER_EXPORT',
  'PROVIDER_GATEWAY',
  'WORKER_RUNTIME_JOBS',
  'SUPABASE_RLS_STORAGE_DATABASE',
]

const requiredPhrases = [
  'ai_tools_creative_graphics_tool_study_passed_docs_only',
  'complete_for_AI_TOOLS_CREATIVE_GRAPHICS_owner_study',
  'routeExecutionAllowed: false',
  'runtimeExecutionAllowed: false',
  'workerExecutionAllowed: false',
  'providerExecutionAllowed: false',
  'modelExecutionAllowed: false',
  'toolExecutionAllowed: false',
  'imageGenerationAllowed: false',
  'imageEditingAllowed: false',
  'mediaProcessingAllowed: false',
  'Supabase update required: `no write`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
  'Signed URLs are never source of truth',
  'TRACK_A_RENDER_EXPORT`: complete after `tool-study:track-a-render-export:diagnostics` passes',
]

const allowedConfirmations = new Set([
  'REEDITPRO_CONFIRM_TOOL_STUDY_0_AI_TOOLS_CREATIVE_GRAPHICS',
  'REEDITPRO_CONFIRM_TOOL_STUDY_DOCS_ONLY',
  'REEDITPRO_CONFIRM_TOOL_STUDY_DIAGNOSTICS_ONLY',
  'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
])

const forbiddenConfirmationFragments = [
  'TOOL_ROUTE_EXECUTION',
  'WORKER_EXECUTION',
  'PROVIDER_CALLS',
  'MODEL_EXECUTION',
  'IMAGE_GENERATION',
  'IMAGE_EDITING',
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
  ['image_generation_enabled', /\bimage generation\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['image_editing_enabled', /\bimage editing\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
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
  audit = JSON.parse(readFileSync('docs/tool-studies/ai-tools-creative-graphics-source-of-truth-audit.json', 'utf8'))
} catch (error) {
  failures.push(`source_audit_json_invalid:${error.message}`)
}

if (audit) {
  if (audit.decision !== 'ai_tools_creative_graphics_tool_study_passed_docs_only') {
    failures.push(`source_audit_decision:${audit.decision}`)
  }
  if (audit.status !== 'complete_for_AI_TOOLS_CREATIVE_GRAPHICS_owner_study') {
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
    'imageGenerationAllowed',
    'imageEditingAllowed',
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
  if (audit.runtimeReadiness?.providerRuntimeReady !== false) failures.push('source_audit_provider_runtime_not_false')
  if (audit.runtimeReadiness?.imageGenerationRuntimeBlocked !== true) failures.push('source_audit_image_generation_not_blocked')
  if (audit.runtimeReadiness?.imageEditingRuntimeBlocked !== true) failures.push('source_audit_image_editing_not_blocked')
  if (audit.supabaseClassification?.updateRequired !== 'no write') failures.push('source_audit_supabase_update_required_not_no_write')
  if (audit.supabaseClassification?.environmentTouched !== 'none') failures.push('source_audit_supabase_environment_touched')
  if (audit.supabaseClassification?.sql !== 'none') failures.push('source_audit_sql_not_none')
  if (audit.supabaseClassification?.migrationDeployed !== 'no') failures.push('source_audit_migration_deployed_not_no')
  if (audit.secretPolicy?.payloadAccessed !== false || audit.secretPolicy?.payloadPrinted !== false || audit.secretPolicy?.payloadCommitted !== false) {
    failures.push('source_audit_secret_policy_not_redacted')
  }
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
if (packageJson.scripts?.['tool-study:ai-tools-creative-graphics:diagnostics'] !== 'node scripts/validation/tool-study-ai-tools-creative-graphics-diagnostics.mjs') {
  failures.push('missing_package_script:tool-study:ai-tools-creative-graphics:diagnostics')
}

try {
  const packageLockStatus = execFileSync('git', ['status', '--short', 'package-lock.json'], {
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
    encoding: 'utf8',
  }).trim()
  const documentedBaseFixExists = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-package-lock-base-fix-decision.md')
  if (packageLockStatus && !documentedBaseFixExists) failures.push(`package_lock_changed:${packageLockStatus}`)
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
  imageGenerationAllowed: false,
  imageEditingAllowed: false,
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
