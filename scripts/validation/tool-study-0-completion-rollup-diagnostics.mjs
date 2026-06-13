import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const requiredDocs = [
  'docs/tool-studies/tool-study-0-completion-source-of-truth-audit.json',
  'docs/tool-studies/tool-study-0-owner-study-matrix.json',
  'docs/tool-studies/tool-study-0-owner-study-matrix.md',
  'docs/tool-studies/tool-study-0-diagnostics-rollup.json',
  'docs/tool-studies/tool-study-0-diagnostics-rollup.md',
  'docs/tool-studies/tool-study-0-route-unlock-readiness.json',
  'docs/tool-studies/tool-study-0-route-unlock-readiness.md',
  'docs/tool-studies/tool-study-0-global-blocked-use-register.md',
  'docs/implementation-prompts/prompt-tool-study-0-completion-rollup.md',
  'docs/cross-chat/READ_FIRST_FOR_ALL_OWNERS.md',
  'docs/cross-chat/CURRENT_HANDOFF.md',
  'docs/cross-chat/NEXT_UNLOCK_LANES.md',
  'docs/cross-chat/OWNER_MATRIX.md',
  'docs/cross-chat/BLOCKED_SCOPES.md',
]

const ownerIds = [
  'WEB_SEARCH_CAPTURE',
  'MAP_GEOSPATIAL',
  'TRACK_B_MEDIA_PROCESSING',
  'SOUND_MUSIC_AUDIO',
  'AI_TOOLS_CREATIVE_GRAPHICS',
  'TRACK_A_RENDER_EXPORT',
]

const requiredPhrases = [
  'blocked_pending_owner_study_merge',
  'docs_diagnostics_complete',
  'Docs diagnostics complete: `true`',
  'Merged source-of-truth complete: `false`',
  'routeExecutionAllowed: false',
  'runtimeExecutionAllowed: false',
  'toolExecutionAllowed: false',
  'workerExecutionAllowed: false',
  'providerExecutionAllowed: false',
  'mediaProcessingAllowed: false',
  'audioProcessingAllowed: false',
  'renderExecutionAllowed: false',
  'exportExecutionAllowed: false',
  'publicArtifactsAllowed: false',
  'signedUrlsAsSourceOfTruthAllowed: false',
  'rawPromptExecutionAllowed: false',
  'Signed URLs are never source of truth',
  'Supabase update required: `no write`',
  'SQL executed: `none`',
  'Migration deployed: `no`',
]

const allowedConfirmations = new Set([
  'REEDITPRO_CONFIRM_TOOL_STUDY_0_COMPLETION_ROLLUP',
  'REEDITPRO_CONFIRM_TOOL_STUDY_DOCS_ONLY',
  'REEDITPRO_CONFIRM_TOOL_STUDY_DIAGNOSTICS_ONLY',
  'REEDITPRO_CONFIRM_SECRET_REFERENCE_METADATA_ONLY',
  'REEDITPRO_CONFIRM_ROUTE_UNLOCK_READINESS_CHECK',
])

const forbiddenConfirmationFragments = [
  'TOOL_ROUTE_EXECUTION',
  'WORKER_EXECUTION',
  'PROVIDER_CALLS',
  'MEDIA_PROCESSING',
  'AUDIO_PROCESSING',
  'RENDER_EXPORT',
  'IMAGE_GENERATION',
  'IMAGE_EDITING',
  'BROWSER_CAPTURE',
  'MAP_RENDERING',
  'SUPABASE_METADATA_WRITE',
  'SUPABASE_PRODUCTION_SQL',
  'GCS_UPLOAD',
  'PUBLIC_ARTIFACT',
  'SIGNED_URL_DELIVERY',
  'PRODUCTION_WRITE',
  'EXTERNAL_BETA_UNLOCK',
  'PAID_PRODUCTION_UNLOCK',
  'DEPENDENCY_MUTATION',
  'RAW_PROMPT_EXECUTION',
  'SECRET_PAYLOAD_PRINT',
  'GITHUB_PR_MERGE',
]

const forbiddenPatterns = [
  ['production_enabled', /\bproduction\s+(?:is\s+)?(?:enabled|unlocked|approved|allowed|ready)\b/i],
  ['external_beta_enabled', /\bexternal beta\s+(?:is\s+)?(?:enabled|unlocked|approved|allowed|ready)\b/i],
  ['paid_production_enabled', /\bpaid production\s+(?:is\s+)?(?:enabled|unlocked|approved|allowed|ready)\b/i],
  ['worker_execution_enabled', /\bworker execution\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['tool_execution_enabled', /\btool execution\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['route_execution_enabled', /\broute execution\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['provider_execution_enabled', /\bprovider (?:execution|calls?)\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['media_processing_enabled', /\bmedia processing\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['audio_processing_enabled', /\baudio processing\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['render_export_enabled', /\brender\/export\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['public_artifact_enabled', /\bpublic artifacts?\s*(?::|=)?\s*(?:enabled|allowed|created|ready|true)\b/i],
  ['signed_url_truth', /\bsigned URLs?\s+(?:are|is|become)\s+(?:the\s+)?source(?:-|\s+)of(?:-|\s+)truth\b/i],
  ['raw_prompt_enabled', /\braw prompt execution\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['supabase_mutation_enabled', /\bSupabase mutation\s*(?::|=)?\s*(?:enabled|allowed|executed|applied|true)\b/i],
  ['dependency_mutation_enabled', /\bdependency mutation\s*(?::|=)?\s*(?:enabled|allowed|executed|true)\b/i],
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

for (const ownerId of ownerIds) {
  if (!docsText.includes(ownerId)) failures.push(`missing_owner:${ownerId}`)
}

for (const phrase of requiredPhrases) {
  if (!docsText.includes(phrase)) failures.push(`missing_required_phrase:${phrase}`)
}

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    failures.push(`json_invalid:${path}:${error.message}`)
    return null
  }
}

const audit = readJson('docs/tool-studies/tool-study-0-completion-source-of-truth-audit.json')
const matrix = readJson('docs/tool-studies/tool-study-0-owner-study-matrix.json')
const diagnostics = readJson('docs/tool-studies/tool-study-0-diagnostics-rollup.json')
const readiness = readJson('docs/tool-studies/tool-study-0-route-unlock-readiness.json')

if (audit) {
  if (audit.decision !== 'blocked_pending_owner_study_merge') failures.push(`audit_decision:${audit.decision}`)
  if (audit.docs_diagnostics_complete !== true) failures.push('audit_docs_diagnostics_not_complete')
  if (audit.merged_source_of_truth_complete !== false) failures.push('audit_merged_source_not_false')
  if (audit.route_unlock_ready !== false) failures.push('audit_route_unlock_ready_not_false')
  for (const pr of [367, 373, 376, 379]) {
    const prRecord = audit.livePrStatus?.find((item) => item.number === pr)
    if (!prRecord) failures.push(`audit_missing_pr:${pr}`)
    if (prRecord && prRecord.state !== 'OPEN') failures.push(`audit_pr_not_open:${pr}:${prRecord.state}`)
    if (prRecord && prRecord.isDraft !== false) failures.push(`audit_pr_draft:${pr}`)
    if (prRecord && prRecord.mergeStateStatus !== 'CLEAN') failures.push(`audit_pr_not_clean:${pr}:${prRecord.mergeStateStatus}`)
    if (prRecord && prRecord.mergedSourceOfTruth !== false) failures.push(`audit_pr_merged_source_not_false:${pr}`)
  }
  const falseFlags = [
    'runtimeExecutionAllowed',
    'routeExecutionAllowed',
    'toolExecutionAllowed',
    'workerExecutionAllowed',
    'providerExecutionAllowed',
    'modelExecutionAllowed',
    'mediaProcessingAllowed',
    'audioProcessingAllowed',
    'renderExecutionAllowed',
    'exportExecutionAllowed',
    'imageGenerationAllowed',
    'imageEditingAllowed',
    'browserCaptureAllowed',
    'mapRenderingAllowed',
    'supabaseWritesAllowed',
    'sqlAllowed',
    'gcsUploadAllowed',
    'publicArtifactsAllowed',
    'signedUrlsAsSourceOfTruthAllowed',
    'dependencyMutationAllowed',
    'rawPromptExecutionAllowed',
    'externalBetaUnlockAllowed',
    'paidProductionUnlockAllowed',
    'productionUnlockAllowed',
    'githubPrMergeAllowed',
  ]
  for (const flag of falseFlags) {
    if (audit.scope?.[flag] !== false) failures.push(`audit_flag_not_false:${flag}`)
  }
}

if (matrix) {
  if (matrix.docs_diagnostics_complete !== true) failures.push('matrix_docs_diagnostics_not_complete')
  if (matrix.merged_source_of_truth_complete !== false) failures.push('matrix_merged_source_not_false')
  for (const ownerId of ownerIds) {
    if (!matrix.owners?.some((owner) => owner.owner === ownerId)) failures.push(`matrix_missing_owner:${ownerId}`)
  }
}

if (diagnostics) {
  if (diagnostics.docs_diagnostics_complete !== true) failures.push('diagnostics_docs_diagnostics_not_complete')
  for (const ownerId of ownerIds) {
    const item = diagnostics.diagnostics?.find((entry) => entry.owner === ownerId)
    if (!item) failures.push(`diagnostics_missing_owner:${ownerId}`)
    if (item && !['passed', 'not_applicable_source_evidence_only'].includes(item.status)) {
      failures.push(`diagnostics_owner_not_passed:${ownerId}:${item.status}`)
    }
  }
}

if (readiness) {
  if (readiness.decision !== 'blocked_pending_owner_study_merge') failures.push(`readiness_decision:${readiness.decision}`)
  if (readiness.docs_diagnostics_complete !== true) failures.push('readiness_docs_diagnostics_not_complete')
  if (readiness.merged_source_of_truth_complete !== false) failures.push('readiness_merged_source_not_false')
  if (readiness.route_unlock_ready !== false) failures.push('readiness_route_unlock_ready_not_false')
  if (!readiness.blockers?.some((blocker) => blocker.id === 'owner_study_prs_not_merged')) {
    failures.push('readiness_missing_owner_study_merge_blocker')
  }
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
if (packageJson.scripts?.['tool-study:completion-rollup:diagnostics'] !== 'node scripts/validation/tool-study-0-completion-rollup-diagnostics.mjs') {
  failures.push('missing_package_script:tool-study:completion-rollup:diagnostics')
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
  decision: readiness?.decision ?? null,
  docsDiagnosticsComplete: readiness?.docs_diagnostics_complete ?? null,
  mergedSourceOfTruthComplete: readiness?.merged_source_of_truth_complete ?? null,
  routeUnlockReady: readiness?.route_unlock_ready ?? null,
  ownerCount: ownerIds.length,
  routeExecutionAllowed: false,
  runtimeExecutionAllowed: false,
  toolExecutionAllowed: false,
  workerExecutionAllowed: false,
  providerExecutionAllowed: false,
  mediaProcessingAllowed: false,
  audioProcessingAllowed: false,
  renderExecutionAllowed: false,
  exportExecutionAllowed: false,
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
