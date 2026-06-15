import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const owner = 'AI_TOOLS_CREATIVE_GRAPHICS'
const expectedDecision = 'owner_tool_stack_audit_completed_ready_for_install_proof_approval'
const expectedSourceDecision = 'open_source_tool_stack_audit_completed_install_proof_backlog_ready'

const requiredDocs = [
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-tool-inventory.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-tool-inventory.json',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-install-proof-backlog.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-install-proof-backlog.json',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-e2e-proof-plan.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-e2e-proof-plan.json',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-install-batches.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-install-batches.json',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-blocked-register.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-blocked-register.json',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-decision.md',
  'docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-decision.json',
  'docs/prompt-ai-tools-creative-graphics-open-source-tool-stack-audit-validation-results.md',
  'docs/implementation-prompts/prompt-ai-tools-creative-graphics-open-source-tool-stack-audit.md',
]

const requiredJsonDocs = requiredDocs.filter((path) => path.endsWith('.json'))

const requiredOwnerToolIds = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'rembg',
  'transparent_background',
  'real_esrgan',
  'kornia',
  'd3',
  'echarts',
  'pixijs',
  'three_js',
  'babylon_js',
  'lottie',
  'konva',
  'vega_lite',
]

const requiredLegacyIds = [
  'remotion',
  'revideo',
  'satori',
  'resvg_js',
  'viz_graphviz',
  'svg_js',
  'anime_js',
]

const requiredToolFields = [
  'toolName',
  'normalizedId',
  'owner',
  'openSourceLikely',
  'providerOrApiInstead',
  'repoEvidence',
  'packageEvidence',
  'systemBinaryEvidence',
  'containerEvidence',
  'diagnosticScriptEvidence',
  'smokeTestEvidence',
  'e2eSyntheticEvidence',
  'installedStatus',
  'proofStatus',
  'blocker',
  'requiredNextAction',
  'proposedBatch',
]

const falseScopeFlags = [
  'dependencyMutationAllowed',
  'toolExecutionAllowed',
  'routeExecutionAllowed',
  'workerExecutionAllowed',
  'providerExecutionAllowed',
  'modelExecutionAllowed',
  'runtimeExecutionAllowed',
  'mediaProcessingAllowed',
  'audioProcessingAllowed',
  'renderExportAllowed',
  'browserCaptureAllowed',
  'mapRenderingAllowed',
  'supabaseWritesAllowed',
  'sqlAllowed',
  'gcsUploadAllowed',
  'storageTransferAllowed',
  'publicArtifactsAllowed',
  'signedUrlsAsSourceOfTruthAllowed',
  'rawPromptExecutionAllowed',
  'internalBetaUnlockAllowed',
  'externalBetaUnlockAllowed',
  'productionUnlockAllowed',
]

const forbiddenPatterns = [
  ['all_tools_installed', /\ball (?:AI|creative|open-source|OSS|local )?tools (?:are|were|have been) installed\b/i],
  ['all_tools_e2e_proven', /\ball (?:AI|creative|open-source|OSS|local )?tools (?:are|were|have been) (?:E2E-|e2e-)?proven\b/i],
  ['dependency_mutation_enabled', /\bdependency mutation\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['tool_execution_enabled', /\btool execution\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['route_execution_enabled', /\broute execution\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['worker_execution_enabled', /\bworker execution\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['provider_model_enabled', /\bprovider\/?model (?:calls?|execution)\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['supabase_write_enabled', /\bSupabase (?:write|mutation|SQL)\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['gcs_upload_enabled', /\b(?:GCS upload|storage transfer)\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['public_artifact_enabled', /\bpublic artifacts?\b[^.\n]*(?:enabled|approved|allowed|created|true)\b/i],
  ['raw_prompt_enabled', /\braw prompt execution\b[^.\n]*(?:enabled|approved|allowed|performed|executed|true)\b/i],
  ['beta_enabled', /\b(?:internal beta|external beta)\b[^.\n]*(?:enabled|approved|allowed|unlocked|true)\b/i],
  ['production_enabled', /\bproduction\b[^.\n]*(?:enabled|approved|allowed|unlocked|true)\b/i],
  [
    'secret_material',
    /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|X-Goog-Signature=|X-Amz-Signature=)\b/i,
  ],
]

const failures = []

for (const path of requiredDocs) {
  if (!existsSync(path)) failures.push(`missing_doc:${path}`)
}

const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    failures.push(`json_invalid:${path}:${error.message}`)
    return null
  }
}

for (const path of requiredJsonDocs) {
  if (existsSync(path)) readJson(path)
}

const inventory = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-tool-inventory.json')
  ? readJson('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-tool-inventory.json')
  : null
const sourceInventory = existsSync('docs/open-source-tool-stack/open-source-tool-stack-inventory.json')
  ? readJson('docs/open-source-tool-stack/open-source-tool-stack-inventory.json')
  : null
const decision = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-decision.json')
  ? readJson('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-decision.json')
  : null
const backlog = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-install-proof-backlog.json')
  ? readJson('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-install-proof-backlog.json')
  : null
const batches = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-install-batches.json')
  ? readJson('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-install-batches.json')
  : null
const blockedRegister = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-blocked-register.json')
  ? readJson('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-blocked-register.json')
  : null
const e2ePlan = existsSync('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-e2e-proof-plan.json')
  ? readJson('docs/open-source-tool-stack/owners/AI_TOOLS_CREATIVE_GRAPHICS-e2e-proof-plan.json')
  : null

const docsText = requiredDocs
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')
const unsafeClaimText = docsText.replace(/\bNo [^.\n]* was enabled\./g, '')

for (const [name, pattern] of forbiddenPatterns) {
  const match = unsafeClaimText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

if (inventory) {
  if (inventory.owner !== owner) failures.push(`inventory_owner:${inventory.owner}`)
  if (inventory.decisionState !== expectedDecision) failures.push(`inventory_decision:${inventory.decisionState}`)
  if (inventory.sourceDecision !== expectedSourceDecision) failures.push(`inventory_source_decision:${inventory.sourceDecision}`)
  if (inventory.supabaseClassification?.updateRequired !== 'no write') failures.push('supabase_update_required_not_no_write')
  if (inventory.supabaseClassification?.updateStatus !== 'docs_only') failures.push('supabase_update_status_not_docs_only')
  if (inventory.supabaseClassification?.environmentTouched !== 'none') failures.push('supabase_environment_not_none')
  if (inventory.supabaseClassification?.sqlExecuted !== 'none') failures.push('supabase_sql_not_none')
  if (inventory.supabaseClassification?.migrationDeployed !== 'no') failures.push('supabase_migration_not_no')
  if (inventory.supabaseClassification?.milestoneSync !== 'not_performed') failures.push('supabase_milestone_sync_not_not_performed')
  for (const flag of falseScopeFlags) {
    if (inventory.executionScope?.[flag] !== false) failures.push(`execution_scope_not_false:${flag}`)
  }

  const tools = Array.isArray(inventory.tools) ? inventory.tools : []
  if (tools.length !== requiredOwnerToolIds.length) failures.push(`owner_tool_count:${tools.length}`)
  const ids = new Set(tools.map((tool) => tool.normalizedId))
  for (const id of requiredOwnerToolIds) {
    if (!ids.has(id)) failures.push(`missing_owner_tool:${id}`)
  }
  for (const tool of tools) {
    for (const field of requiredToolFields) {
      if (!(field in tool)) failures.push(`tool_missing_field:${tool.normalizedId}:${field}`)
    }
    if (tool.owner !== owner) failures.push(`tool_owner_mismatch:${tool.normalizedId}:${tool.owner}`)
    if (tool.providerOrApiInstead !== false) failures.push(`tool_provider_api_not_false:${tool.normalizedId}`)
    if (!String(tool.requiredNextAction ?? '').trim()) failures.push(`tool_missing_next_action:${tool.normalizedId}`)
    if (!String(tool.proposedBatch ?? '').trim()) failures.push(`tool_missing_batch:${tool.normalizedId}`)
    if (!String(tool.blocker ?? '').trim()) failures.push(`tool_missing_blocker:${tool.normalizedId}`)
    if (tool.proofStatus === 'e2e_proven') failures.push(`unexpected_e2e_proven:${tool.normalizedId}`)
  }
  const legacyIds = new Set((inventory.legacyPromptReconciliation ?? []).map((row) => row.normalizedId))
  for (const id of requiredLegacyIds) {
    if (!legacyIds.has(id)) failures.push(`missing_legacy_reconciliation:${id}`)
  }
}

const sourceOwnerTools = Array.isArray(sourceInventory?.tools)
  ? sourceInventory.tools.filter((tool) => tool.owner === owner).map((tool) => tool.normalizedId).sort()
  : []
if (sourceOwnerTools.length > 0) {
  const expected = [...requiredOwnerToolIds].sort()
  if (JSON.stringify(sourceOwnerTools) !== JSON.stringify(expected)) {
    failures.push(`source_owner_tool_mismatch:${sourceOwnerTools.join(',')}`)
  }
}

if (decision) {
  if (decision.decisionState !== expectedDecision) failures.push(`decision_state:${decision.decisionState}`)
  if (decision.ownedCandidates !== requiredOwnerToolIds.length) failures.push(`decision_owned_candidates:${decision.ownedCandidates}`)
  if (decision.e2eProvenTools !== 0) failures.push(`decision_e2e_proven:${decision.e2eProvenTools}`)
  if (decision.nextApprovalPrompt !== 'AI_TOOLS_CREATIVE_GRAPHICS_OPEN_SOURCE_TOOL_STACK_INSTALL_PROOF_APPROVAL_BATCH_1') {
    failures.push(`decision_next_prompt:${decision.nextApprovalPrompt}`)
  }
}

for (const [name, data] of [
  ['backlog', backlog],
  ['batches', batches],
  ['blocked_register', blockedRegister],
  ['e2e_plan', e2ePlan],
]) {
  if (data?.owner !== owner) failures.push(`${name}_owner:${data?.owner}`)
  if (data?.decisionState !== expectedDecision) failures.push(`${name}_decision:${data?.decisionState}`)
}

if (e2ePlan?.e2eProofApprovedNow !== false) failures.push('e2e_proof_approved_not_false')
if (e2ePlan?.globalRules) {
  for (const [key, value] of Object.entries(e2ePlan.globalRules)) {
    if (key.endsWith('Allowed') && value !== false) failures.push(`e2e_global_rule_not_false:${key}`)
  }
}

const packageJson = readJson('package.json')
if (
  packageJson?.scripts?.['open-source-tool-stack:ai-tools-creative-graphics:diagnostics'] !==
  'node scripts/validation/open-source-tool-stack-ai-tools-creative-graphics-diagnostics.mjs'
) {
  failures.push('missing_package_script:open-source-tool-stack:ai-tools-creative-graphics:diagnostics')
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

const result = {
  status: failures.length === 0 ? 'passed' : 'blocked',
  owner,
  decisionState: decision?.decisionState ?? null,
  sourceDecision: inventory?.sourceDecision ?? null,
  ownedCandidates: inventory?.tools?.length ?? 0,
  requiredOwnerTools: requiredOwnerToolIds.length,
  legacyReconciliations: inventory?.legacyPromptReconciliation?.length ?? 0,
  e2eProvenTools: decision?.e2eProvenTools ?? null,
  nextApprovalPrompt: decision?.nextApprovalPrompt ?? null,
  supabaseUpdateRequired: inventory?.supabaseClassification?.updateRequired ?? null,
  supabaseUpdateStatus: inventory?.supabaseClassification?.updateStatus ?? null,
  supabaseEnvironmentTouched: inventory?.supabaseClassification?.environmentTouched ?? null,
  sqlExecuted: inventory?.supabaseClassification?.sqlExecuted ?? null,
  migrationDeployed: inventory?.supabaseClassification?.migrationDeployed ?? null,
  failures,
}

console.log(JSON.stringify(result, null, 2))
if (failures.length > 0) process.exit(1)
