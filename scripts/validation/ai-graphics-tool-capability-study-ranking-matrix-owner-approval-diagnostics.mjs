import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const diffBase =
  process.env.AI_GRAPHICS_TOOL_CAPABILITY_OWNER_APPROVAL_DIFF_BASE ??
  'origin/codex/rp-ai-graphics-tool-capability-study-ranking-matrix-owner-review'
const expectedDecision = 'ai_graphics_tool_capability_study_and_ranking_matrix_owner_approved_with_warnings'
const sourceStudyDecision = 'ai_graphics_tool_capability_study_and_ranking_matrix_completed_with_warnings'
const sourceQaDecision = 'ai_graphics_tool_capability_study_and_ranking_matrix_qa_passed_with_warnings'
const sourceOwnerReviewDecision =
  'ai_graphics_tool_capability_study_and_ranking_matrix_owner_review_passed_with_warnings'

const tools = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
  'd3',
  'echarts',
  'vega_lite',
  'vega',
  'satori',
  'svgdotjs_svg_js',
  'viz_js',
  'lottie_web',
  'animejs',
  'three_js',
  'pixi_js',
  'konva',
  'babylonjs',
]
const capabilities = [
  'chart_overlay',
  'data_visualization',
  'svg_graphics',
  'diagram_graphics',
  'animation_overlay',
  'canvas_scene',
  'webgl_3d_scene',
  'background_removal',
  'subject_segmentation',
  'upscaling',
  'tensor_image_ops',
  'model_runtime_foundation',
  'planning_metadata_only',
  'blocked_or_deferred',
]
const canonical13 = [
  'd3',
  'echarts',
  'vega_lite',
  'vega',
  'satori',
  'svgdotjs_svg_js',
  'viz_js',
  'lottie_web',
  'animejs',
  'three_js',
  'pixi_js',
  'konva',
  'babylonjs',
]
const cpu6 = ['d3', 'vega_lite', 'vega', 'satori', 'svgdotjs_svg_js', 'viz_js']
const model8 = [
  'torch_torchvision',
  'transformers',
  'sam2',
  'birefnet',
  'real_esrgan',
  'kornia',
  'rembg',
  'transparent_background',
]

const requiredApprovalDocs = [
  'docs/tool-intelligence/ai-graphics/tool-capability-study-owner-approval.md',
  'docs/tool-intelligence/ai-graphics/tool-capability-study-owner-approval-source-lockfile.md',
  'docs/tool-intelligence/ai-graphics/tool-capability-study-owner-approval-matrix.md',
  'docs/tool-intelligence/ai-graphics/tool-ranking-matrix-owner-approval.md',
  'docs/tool-intelligence/ai-graphics/tool-selection-rules-owner-approval.md',
  'docs/tool-intelligence/ai-graphics/tool-elimination-rules-owner-approval.md',
  'docs/tool-intelligence/ai-graphics/tool-fallback-map-owner-approval.md',
  'docs/tool-intelligence/ai-graphics/tool-cloud-targets-owner-approval.md',
  'docs/tool-intelligence/ai-graphics/tool-proof-status-owner-approval.md',
  'docs/tool-intelligence/ai-graphics/agent-routing-examples-owner-approval.md',
  'docs/tool-intelligence/ai-graphics/blocked-runtime-register-owner-approval.md',
  'docs/tool-intelligence/ai-graphics/tool-capability-study-owner-approval-decision.md',
  'docs/prompt-ai-graphics-tool-capability-study-ranking-matrix-owner-approval-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-tool-capability-study-ranking-matrix-owner-approval.md',
]
const requiredApprovalJson = [
  'docs/tool-intelligence/ai-graphics/tool-capability-study-owner-approval-source-lockfile.json',
  'docs/tool-intelligence/ai-graphics/tool-capability-study-owner-approval-matrix.json',
  'docs/tool-intelligence/ai-graphics/tool-ranking-matrix-owner-approval.json',
  'docs/tool-intelligence/ai-graphics/tool-selection-rules-owner-approval.json',
  'docs/tool-intelligence/ai-graphics/tool-elimination-rules-owner-approval.json',
  'docs/tool-intelligence/ai-graphics/tool-fallback-map-owner-approval.json',
  'docs/tool-intelligence/ai-graphics/tool-cloud-targets-owner-approval.json',
  'docs/tool-intelligence/ai-graphics/tool-proof-status-owner-approval.json',
  'docs/tool-intelligence/ai-graphics/agent-routing-examples-owner-approval.json',
  'docs/tool-intelligence/ai-graphics/blocked-runtime-register-owner-approval.json',
  'docs/tool-intelligence/ai-graphics/tool-capability-study-owner-approval-decision.json',
  'docs/tool-intelligence/ai-graphics/tool-capability-study-owner-approval-result.json',
]
const sourceStudyDocs = [
  'docs/tool-intelligence/ai-graphics/tool-capability-study.md',
  'docs/tool-intelligence/ai-graphics/tool-capability-study.json',
  'docs/tool-intelligence/ai-graphics/tool-ranking-matrix.json',
  'docs/tool-intelligence/ai-graphics/tool-selection-rules.json',
  'docs/tool-intelligence/ai-graphics/tool-elimination-rules.json',
  'docs/tool-intelligence/ai-graphics/tool-fallback-map.json',
  'docs/tool-intelligence/ai-graphics/tool-cloud-targets.json',
  'docs/tool-intelligence/ai-graphics/tool-proof-status.json',
  'docs/tool-intelligence/ai-graphics/agent-routing-examples.json',
  'docs/tool-intelligence/ai-graphics/tool-capability-study-result.json',
]
const sourceQaDocs = [
  'docs/tool-intelligence/ai-graphics/tool-capability-study-qa-review.md',
  'docs/tool-intelligence/ai-graphics/tool-capability-study-qa-matrix.json',
  'docs/tool-intelligence/ai-graphics/tool-capability-study-qa-result.json',
  'docs/tool-intelligence/ai-graphics/tool-ranking-matrix-qa.json',
  'docs/tool-intelligence/ai-graphics/tool-selection-rules-qa.json',
  'docs/tool-intelligence/ai-graphics/tool-elimination-rules-qa.json',
  'docs/tool-intelligence/ai-graphics/tool-fallback-map-qa.json',
  'docs/tool-intelligence/ai-graphics/tool-cloud-targets-qa.json',
  'docs/tool-intelligence/ai-graphics/tool-proof-status-qa.json',
  'docs/tool-intelligence/ai-graphics/agent-routing-examples-qa.json',
]
const sourceOwnerDocs = [
  'docs/tool-intelligence/ai-graphics/tool-capability-study-owner-review.md',
  'docs/tool-intelligence/ai-graphics/tool-capability-study-owner-matrix.json',
  'docs/tool-intelligence/ai-graphics/tool-capability-study-owner-result.json',
  'docs/tool-intelligence/ai-graphics/tool-ranking-matrix-owner-review.json',
  'docs/tool-intelligence/ai-graphics/tool-selection-rules-owner-review.json',
  'docs/tool-intelligence/ai-graphics/tool-elimination-rules-owner-review.json',
  'docs/tool-intelligence/ai-graphics/tool-fallback-map-owner-review.json',
  'docs/tool-intelligence/ai-graphics/tool-cloud-targets-owner-review.json',
  'docs/tool-intelligence/ai-graphics/tool-proof-status-owner-review.json',
  'docs/tool-intelligence/ai-graphics/agent-routing-examples-owner-review.json',
]
const requiredTrue = [
  'capabilityStudyOwnerApprovalCompleted',
  'sourceCapabilityStudyAccepted',
  'sourceQaAccepted',
  'sourceOwnerReviewAccepted',
  'all21AtlasToolsOwnerApproved',
  'all13CanonicalPackageProofToolsIncluded',
  'all6CpuStaticValidatedToolsIncluded',
  'modelToolsIncludedAsBlockedForExecution',
  'rankingMatrixOwnerApproved',
  'selectionRulesOwnerApproved',
  'eliminationRulesOwnerApproved',
  'fallbackMapOwnerApproved',
  'cloudTargetsOwnerApproved',
  'proofStatusOwnerApproved',
  'agentRoutingExamplesOwnerApproved',
  'priorStudyEvidenceOwnerApproved',
  'agentCanSelectForPlanning',
]
const requiredFalse = [
  'agentCanExecuteToolsNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'routeExecutionPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]

const failures = []
const env = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const git = (args) => execFileSync('git', args, { env, encoding: 'utf8' }).trim()
const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    failures.push(`invalid_json:${file}:${error.message}`)
    return null
  }
}
const requireFile = (file, label = 'required_file') => {
  if (!existsSync(file)) failures.push(`${label}:${file}`)
}

for (const file of [
  ...requiredApprovalDocs,
  ...requiredApprovalJson,
  ...sourceStudyDocs,
  ...sourceQaDocs,
  ...sourceOwnerDocs,
]) {
  requireFile(file)
}
for (const tool of tools) {
  requireFile(`docs/tool-intelligence/ai-graphics/tool-cards/${tool}.md`, 'missing_source_tool_card')
  requireFile(`docs/tool-intelligence/ai-graphics/tool-cards/json/${tool}.json`, 'missing_source_tool_card_json')
  requireFile(`docs/tool-intelligence/ai-graphics/tool-cards/qa/${tool}.md`, 'missing_qa_tool_card')
  requireFile(`docs/tool-intelligence/ai-graphics/tool-cards/owner-review/${tool}.md`, 'missing_owner_tool_card')
  requireFile(`docs/tool-intelligence/ai-graphics/tool-cards/owner-approval/${tool}.md`, 'missing_owner_approval_tool_card')
}

const allDocs = [
  ...requiredApprovalDocs,
  ...requiredApprovalJson,
  ...sourceStudyDocs,
  ...sourceQaDocs,
  ...sourceOwnerDocs,
  ...tools.flatMap((tool) => [
    `docs/tool-intelligence/ai-graphics/tool-cards/${tool}.md`,
    `docs/tool-intelligence/ai-graphics/tool-cards/json/${tool}.json`,
    `docs/tool-intelligence/ai-graphics/tool-cards/qa/${tool}.md`,
    `docs/tool-intelligence/ai-graphics/tool-cards/owner-review/${tool}.md`,
    `docs/tool-intelligence/ai-graphics/tool-cards/owner-approval/${tool}.md`,
  ]),
]
const docsText = allDocs
  .filter((file) => existsSync(file))
  .map((file) => `\n--- ${file} ---\n${readFileSync(file, 'utf8')}`)
  .join('\n')

for (const decision of [expectedDecision, sourceStudyDecision, sourceQaDecision, sourceOwnerReviewDecision]) {
  if (!docsText.includes(decision)) failures.push(`missing_decision:${decision}`)
}
for (const pr of [
  '#628',
  '#627',
  '#623',
  '#621',
  '#617',
  '#616',
  '#614',
  '#607',
  '#604',
  '#589',
  '#425',
  '#433',
  '#441',
  '#376',
  '#361',
  '#542',
  '#544',
]) {
  if (!docsText.includes(`PR ${pr}`)) failures.push(`missing_pr_citation:${pr}`)
}
for (const phrase of ['TRACK_B_MEDIA_OSS_STEWARD', 'Track A', 'Track B']) {
  if (!docsText.includes(phrase)) failures.push(`missing_exclusion_context:${phrase}`)
}

const sourceLockfile = readJson('docs/tool-intelligence/ai-graphics/tool-capability-study-owner-approval-source-lockfile.json')
const approvalMatrix = readJson('docs/tool-intelligence/ai-graphics/tool-capability-study-owner-approval-matrix.json')
const ranking = readJson('docs/tool-intelligence/ai-graphics/tool-ranking-matrix-owner-approval.json')
const selection = readJson('docs/tool-intelligence/ai-graphics/tool-selection-rules-owner-approval.json')
const elimination = readJson('docs/tool-intelligence/ai-graphics/tool-elimination-rules-owner-approval.json')
const fallback = readJson('docs/tool-intelligence/ai-graphics/tool-fallback-map-owner-approval.json')
const cloud = readJson('docs/tool-intelligence/ai-graphics/tool-cloud-targets-owner-approval.json')
const proof = readJson('docs/tool-intelligence/ai-graphics/tool-proof-status-owner-approval.json')
const routing = readJson('docs/tool-intelligence/ai-graphics/agent-routing-examples-owner-approval.json')
const result = readJson('docs/tool-intelligence/ai-graphics/tool-capability-study-owner-approval-result.json')
const decision = readJson('docs/tool-intelligence/ai-graphics/tool-capability-study-owner-approval-decision.json')
const blocked = readJson('docs/tool-intelligence/ai-graphics/blocked-runtime-register-owner-approval.json')
const sourceRanking = readJson('docs/tool-intelligence/ai-graphics/tool-ranking-matrix.json')
const ownerReviewMatrix = readJson('docs/tool-intelligence/ai-graphics/tool-capability-study-owner-matrix.json')
const qaMatrix = readJson('docs/tool-intelligence/ai-graphics/tool-capability-study-qa-matrix.json')

for (const [label, record] of [
  ['source_lockfile', sourceLockfile],
  ['approval_matrix', approvalMatrix],
  ['result', result],
  ['decision', decision],
  ['blocked_runtime', blocked],
]) {
  if (record?.decision !== expectedDecision) failures.push(`${label}_decision_mismatch`)
}

const approvalRows = new Map((approvalMatrix?.approvalRows ?? []).map((row) => [row.toolId, row]))
const ownerRows = new Map((ownerReviewMatrix?.ownerRows ?? []).map((row) => [row.toolId, row]))
const qaRows = new Map((qaMatrix?.qaMatrix ?? []).map((row) => [row.toolId, row]))
const sourceRankedTools = new Set((sourceRanking?.tools ?? []).map((row) => row.toolId))
for (const tool of tools) {
  const approvalRow = approvalRows.get(tool)
  if (!approvalRow) failures.push(`approval_matrix_missing_tool:${tool}`)
  if (!ownerRows.has(tool)) failures.push(`owner_review_matrix_missing_tool:${tool}`)
  if (!qaRows.has(tool)) failures.push(`qa_matrix_missing_tool:${tool}`)
  if (!sourceRankedTools.has(tool)) failures.push(`source_ranking_missing_tool:${tool}`)
  if (!ranking?.tools?.includes(tool)) failures.push(`approval_ranking_missing_tool:${tool}`)
  for (const field of [
    'toolId',
    'displayName',
    'packageName',
    'sourceStudyAccepted',
    'sourceQaAccepted',
    'sourceOwnerReviewAccepted',
    'capabilityGroupsApproved',
    'rankingApproved',
    'selectionRulesApproved',
    'eliminationRulesApproved',
    'fallbacksApproved',
    'cloudTargetApproved',
    'proofStatusApproved',
    'agentCanSelectForPlanning',
    'agentCanExecuteToolsNow',
    'runtimeReadyNow',
    'internalBetaReadyNow',
    'externalBetaReadyNow',
    'productionReadyNow',
    'nextMilestone',
  ]) {
    if (approvalRow && !(field in approvalRow)) failures.push(`approval_row_missing_field:${tool}:${field}`)
  }
  if (approvalRow?.ownerApprovalStatus !== 'approved_with_warnings') {
    failures.push(`approval_status_mismatch:${tool}`)
  }
}
if (approvalRows.size !== tools.length) failures.push(`approval_matrix_tool_count:${approvalRows.size}`)

for (const cap of capabilities) {
  if (!docsText.includes(cap)) failures.push(`capability_missing:${cap}`)
  if (!selection?.capabilityGroups?.includes(cap)) failures.push(`selection_missing_capability:${cap}`)
  if (!fallback?.capabilityGroups?.includes(cap)) failures.push(`fallback_missing_capability:${cap}`)
}
for (const rule of [
  'capability mismatch',
  'proof status is below required proof',
  'browser/WebGL/canvas',
  'GPU/model',
  'public artifact',
  'signed URL',
  'Tool Route/Worker',
  'deferred/backlog',
]) {
  if (!docsText.includes(rule)) failures.push(`missing_elimination_blocker:${rule}`)
}
for (const target of [
  'cloud_run_cpu_job',
  'model_weight_review_later',
  'browser_chart_runtime_later',
  'animation_manifest_runtime_later',
  'browser_webgl_canvas_sandbox_later',
  'defer_or_drop_after_backlog_review',
]) {
  if (!cloud?.targets?.includes(target)) failures.push(`cloud_target_missing:${target}`)
}
for (const tool of canonical13) if (!proof?.canonicalPackageProofTools?.includes(tool)) failures.push(`canonical_missing:${tool}`)
for (const tool of cpu6) if (!proof?.cpuStaticValidatedTools?.includes(tool)) failures.push(`cpu_static_missing:${tool}`)
for (const tool of model8) if (!proof?.blockedDeferredModelTools?.includes(tool)) failures.push(`model_blocked_missing:${tool}`)
if (!routing?.agentRoutingExamplesOwnerApproved) failures.push('agent_routing_examples_not_owner_approved')
if (!elimination?.eliminationRulesOwnerApproved) failures.push('elimination_rules_not_owner_approved')

for (const field of requiredTrue) if (result?.booleans?.[field] !== true) failures.push(`required_boolean_not_true:${field}`)
for (const field of requiredFalse) if (result?.booleans?.[field] !== false) failures.push(`required_boolean_not_false:${field}`)
for (const field of [
  'agentCanExecuteToolsNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
]) {
  if (decision?.[field] !== false) failures.push(`decision_required_false_mismatch:${field}`)
  if (blocked?.[field] !== false) failures.push(`blocked_required_false_mismatch:${field}`)
}
if (decision?.agentCanSelectForPlanning !== true) failures.push('decision_planning_selection_not_true')
if (blocked?.runtimeBlocked !== true) failures.push('blocked_runtime_not_true')

const productCapabilityNames = new Set([...(sourceLockfile?.capabilityGroups ?? []), ...(selection?.capabilityGroups ?? [])])
for (const label of ['Track A', 'Track B', 'Atlas', 'TRACK_B_MEDIA_OSS_STEWARD']) {
  if (productCapabilityNames.has(label)) failures.push(`internal_label_used_as_capability:${label}`)
}

const packageJson = readJson('package.json')
const packageLock = readJson('package-lock.json')
const basePackageJson = JSON.parse(git(['show', `${diffBase}:package.json`]))
const basePackageLock = JSON.parse(git(['show', `${diffBase}:package-lock.json`]))
const expectedScript =
  'node scripts/validation/ai-graphics-tool-capability-study-ranking-matrix-owner-approval-diagnostics.mjs'
if (packageJson?.scripts?.['ai-graphics:tool-capability-study:owner-approval-diagnostics'] !== expectedScript) {
  failures.push('missing_owner_approval_package_script')
}
for (const [name, command] of Object.entries(basePackageJson.scripts ?? {})) {
  if (packageJson?.scripts?.[name] !== command) failures.push(`existing_script_changed:${name}`)
}
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  if (JSON.stringify(packageJson?.[section] ?? {}) !== JSON.stringify(basePackageJson?.[section] ?? {})) {
    failures.push(`dependency_section_changed:${section}`)
  }
}
if (JSON.stringify(packageLock) !== JSON.stringify(basePackageLock)) failures.push('package_lock_changed')
if (git(['ls-files', '.local-artifacts'])) failures.push('local_artifacts_tracked')
const generated = git(['ls-files'])
  .split('\n')
  .filter(Boolean)
  .filter((file) => /\.(png|jpe?g|webp|gif|mp4|mov|webm|pdf)$/i.test(file))
  .filter((file) => file.includes('tool-intelligence') || file.includes('ai-graphics'))
if (generated.length) failures.push(`generated_outputs_tracked:${generated.join(',')}`)

const forbiddenTrueFields = [
  'agentCanExecuteToolsNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'routeExecutionPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
]
for (const field of forbiddenTrueFields) {
  if (docsText.includes(`"${field}": true`) || docsText.includes(`\`${field}\`: \`true\``)) {
    failures.push(`forbidden_true_claim:${field}`)
  }
}
for (const claim of [
  'dry_run_passed',
  'generated_local_fixture_passed',
  'E2E proof accepted',
  'runtime readiness accepted',
  'internal beta ready',
  'external beta ready',
  'production ready',
]) {
  if (docsText.includes(claim)) failures.push(`forbidden_claim:${claim}`)
}

console.log(
  JSON.stringify(
    {
      status: failures.length ? 'failed' : 'passed',
      decision: expectedDecision,
      toolsOwnerApproved: tools.length,
      failures,
    },
    null,
    2,
  ),
)
if (failures.length) process.exitCode = 1
