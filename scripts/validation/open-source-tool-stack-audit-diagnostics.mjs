import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const requiredDocs = [
  'docs/open-source-tool-stack/open-source-tool-stack-source-of-truth-audit.json',
  'docs/open-source-tool-stack/open-source-tool-stack-inventory.json',
  'docs/open-source-tool-stack/open-source-tool-stack-inventory.md',
  'docs/open-source-tool-stack/open-source-tool-stack-installed-vs-missing.md',
  'docs/open-source-tool-stack/open-source-tool-stack-proof-matrix.md',
  'docs/open-source-tool-stack/open-source-tool-stack-owner-map.md',
  'docs/open-source-tool-stack/open-source-tool-stack-blocked-register.md',
  'docs/open-source-tool-stack/open-source-tool-stack-install-proof-backlog.md',
  'docs/open-source-tool-stack/open-source-tool-stack-next-install-batches.md',
  'docs/open-source-tool-stack/open-source-tool-stack-decision.md',
]

const allowedInstallStatuses = new Set([
  'docs_only',
  'package_declared',
  'system_binary_declared',
  'installed',
  'missing',
  'blocked',
  'unknown',
])

const allowedProofStatuses = new Set([
  'e2e_proven',
  'smoke_only',
  'diagnostics_only',
  'docs_only',
  'not_proven',
  'blocked',
])

const requiredInventoryFields = [
  'toolName',
  'normalizedId',
  'category',
  'owner',
  'ossProviderClassification',
  'openSourceLikely',
  'providerOrApiInstead',
  'evidencePointers',
  'repoEvidence',
  'packageEvidence',
  'systemBinaryEvidence',
  'containerEvidence',
  'diagnosticScriptEvidence',
  'smokeTestEvidence',
  'e2eSyntheticEvidence',
  'installedStatus',
  'proofStatus',
  'blockers',
  'requiredNextAction',
  'safeBatch',
]

const requiredToolIds = [
  'ffmpeg',
  'ffprobe',
  'opencv',
  'pyav',
  'pyscenedetect',
  'sharp_libvips',
  'duckdb',
  'polars',
  'paddleocr',
  'paddlepaddle',
  'deepfilternet',
  'signalsmith_stretch',
  'demucs',
  'audioflux',
  'rnnoise',
  'librosa',
  'rubber_band',
  'essentia',
  'vllm',
  'qwen3_vl',
  'onnxruntime',
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'rembg',
  'real_esrgan',
  'film',
  'remotion',
  'opentimelineio',
  'libass',
  'gstreamer',
  'bento4_mp4box',
  'mkvtoolnix',
  'playwright_chromium',
  'maplibre',
  'turf',
  'gdal_ogr',
  'tippecanoe',
  'pmtiles',
  'deck_gl',
  'cesium_js',
  'd3',
  'echarts',
  'qwen_deepseek_provider_api',
  'lyria_provider_api',
  'mirelo_provider_api',
]

const expectedDecision = 'open_source_tool_stack_audit_completed_install_proof_backlog_ready'

const forbiddenPatterns = [
  ['production_enabled', /\bproduction\s+(?:is\s+)?(?:enabled|unlocked|approved|allowed|ready)\b/i],
  ['external_beta_enabled', /\bexternal beta\s+(?:is\s+)?(?:enabled|unlocked|approved|allowed|ready)\b/i],
  ['paid_production_enabled', /\bpaid production\s+(?:is\s+)?(?:enabled|unlocked|approved|allowed|ready)\b/i],
  ['tool_execution_allowed', /\btool execution\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['route_execution_allowed', /\broute execution\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['worker_execution_allowed', /\bworker execution\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['provider_execution_allowed', /\bprovider (?:execution|calls?)\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['media_processing_allowed', /\bmedia processing\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['supabase_write_allowed', /\bSupabase (?:write|mutation|SQL)\s*(?::|=)?\s*(?:enabled|allowed|executed|true)\b/i],
  ['gcs_upload_allowed', /\bGCS upload\s*(?::|=)?\s*(?:enabled|allowed|executed|true)\b/i],
  ['public_artifact_allowed', /\bpublic artifacts?\s*(?::|=)?\s*(?:enabled|allowed|created|ready|true)\b/i],
  ['signed_url_truth', /\bsigned URLs?\s+(?:are|is|become)\s+(?:the\s+)?source(?:-|\s+)of(?:-|\s+)truth\b/i],
  ['raw_prompt_execution_allowed', /\braw prompt execution\s*(?::|=)?\s*(?:enabled|allowed|ready|executed|true)\b/i],
  ['dependency_mutation_allowed', /\bdependency mutation\s*(?::|=)?\s*(?:enabled|allowed|executed|true)\b/i],
  ['all_tools_installed_claim', /\ball (?:open-source|OSS|local )?tools (?:are|were|have been) installed\b/i],
  ['all_tools_proven_claim', /\ball (?:open-source|OSS|local )?tools (?:are|were|have been) proven\b/i],
  [
    'secret_material',
    new RegExp(
      String.raw`\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|` +
        'X-' +
        String.raw`Goog-Signature=|X-` +
        String.raw`Amz-Signature=)\b`,
      'i',
    ),
  ],
]

const falseScopeFlags = [
  'toolExecutionAllowed',
  'routeExecutionAllowed',
  'workerExecutionAllowed',
  'providerExecutionAllowed',
  'runtimeExecutionAllowed',
  'mediaProcessingAllowed',
  'audioProcessingAllowed',
  'renderExecutionAllowed',
  'imageGenerationAllowed',
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

const failures = []

for (const path of requiredDocs) {
  if (!existsSync(path)) failures.push(`missing_doc:${path}`)
}

const docsText = requiredDocs
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

let sourceAudit
let inventory
try {
  sourceAudit = JSON.parse(readFileSync('docs/open-source-tool-stack/open-source-tool-stack-source-of-truth-audit.json', 'utf8'))
} catch (error) {
  failures.push(`source_audit_json_invalid:${error.message}`)
}

try {
  inventory = JSON.parse(readFileSync('docs/open-source-tool-stack/open-source-tool-stack-inventory.json', 'utf8'))
} catch (error) {
  failures.push(`inventory_json_invalid:${error.message}`)
}

if (sourceAudit) {
  if (sourceAudit.decision !== expectedDecision) failures.push(`source_audit_decision:${sourceAudit.decision}`)
  if (sourceAudit.supabaseClassification?.updateRequired !== 'no write') failures.push('source_audit_supabase_update_required_not_no_write')
  if (sourceAudit.supabaseClassification?.environmentTouched !== 'none') failures.push('source_audit_supabase_environment_touched_not_none')
  if (sourceAudit.supabaseClassification?.sqlExecuted !== 'none') failures.push('source_audit_sql_not_none')
  if (sourceAudit.supabaseClassification?.migrationDeployed !== 'no') failures.push('source_audit_migration_not_no')
  for (const flag of falseScopeFlags) {
    if (sourceAudit.executionScope?.[flag] !== false) failures.push(`source_audit_flag_not_false:${flag}`)
  }
  if (sourceAudit.secretPolicy?.payloadAccessed !== false || sourceAudit.secretPolicy?.payloadPrinted !== false || sourceAudit.secretPolicy?.payloadCommitted !== false) {
    failures.push('source_audit_secret_policy_not_false')
  }
}

const tools = inventory?.tools
if (!Array.isArray(tools)) {
  failures.push('inventory_tools_not_array')
} else {
  if (tools.length < 30) failures.push(`inventory_too_small:${tools.length}`)
  const ids = new Set()
  for (const [index, row] of tools.entries()) {
    for (const field of requiredInventoryFields) {
      if (!(field in row)) failures.push(`inventory_row_${index}_missing_field:${field}`)
    }
    if (typeof row.normalizedId === 'string') {
      if (ids.has(row.normalizedId)) failures.push(`duplicate_normalized_id:${row.normalizedId}`)
      ids.add(row.normalizedId)
    }
    if (!allowedInstallStatuses.has(row.installedStatus)) failures.push(`invalid_install_status:${row.normalizedId}:${row.installedStatus}`)
    if (!allowedProofStatuses.has(row.proofStatus)) failures.push(`invalid_proof_status:${row.normalizedId}:${row.proofStatus}`)
    if (row.proofStatus === 'e2e_proven' && !String(row.e2eSyntheticEvidence ?? '').trim()) {
      failures.push(`e2e_without_evidence:${row.normalizedId}`)
    }
    if (row.providerOrApiInstead === true && row.openSourceLikely !== false) {
      failures.push(`provider_api_not_separated:${row.normalizedId}`)
    }
    if (!Array.isArray(row.evidencePointers) || row.evidencePointers.length === 0) {
      failures.push(`missing_evidence_pointers:${row.normalizedId}`)
    }
    if (!String(row.requiredNextAction ?? '').trim()) failures.push(`missing_required_next_action:${row.normalizedId}`)
    if (!String(row.safeBatch ?? '').trim()) failures.push(`missing_safe_batch:${row.normalizedId}`)
  }
  for (const id of requiredToolIds) {
    if (!ids.has(id)) failures.push(`missing_required_tool:${id}`)
  }
  for (const id of ['qwen_deepseek_provider_api', 'lyria_provider_api', 'mirelo_provider_api']) {
    const row = tools.find((tool) => tool.normalizedId === id)
    if (!row?.providerOrApiInstead || row?.openSourceLikely !== false) failures.push(`provider_api_row_not_separated:${id}`)
  }
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
if (packageJson.scripts?.['open-source-tool-stack:audit:diagnostics'] !== 'node scripts/validation/open-source-tool-stack-audit-diagnostics.mjs') {
  failures.push('missing_package_script:open-source-tool-stack:audit:diagnostics')
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

const result = {
  status: failures.length === 0 ? 'passed' : 'blocked',
  decision: sourceAudit?.decision ?? null,
  totalCandidates: Array.isArray(tools) ? tools.length : 0,
  providerApiSeparated: Array.isArray(tools) ? tools.filter((tool) => tool.providerOrApiInstead).length : 0,
  packageDeclared: Array.isArray(tools) ? tools.filter((tool) => tool.installedStatus === 'package_declared').length : 0,
  systemBinaryDeclared: Array.isArray(tools) ? tools.filter((tool) => tool.installedStatus === 'system_binary_declared').length : 0,
  missing: Array.isArray(tools) ? tools.filter((tool) => tool.installedStatus === 'missing').length : 0,
  blocked: Array.isArray(tools) ? tools.filter((tool) => tool.installedStatus === 'blocked' || tool.proofStatus === 'blocked').length : 0,
  toolExecutionAllowed: false,
  routeExecutionAllowed: false,
  workerExecutionAllowed: false,
  providerExecutionAllowed: false,
  runtimeExecutionAllowed: false,
  mediaProcessingAllowed: false,
  supabaseWritesAllowed: false,
  sqlAllowed: false,
  gcsUploadAllowed: false,
  publicArtifactsAllowed: false,
  signedUrlsAsSourceOfTruthAllowed: false,
  rawPromptExecutionAllowed: false,
  productionUnlockAllowed: false,
  failures,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length > 0) process.exit(1)
