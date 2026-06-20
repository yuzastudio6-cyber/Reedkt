import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const diffBase =
  process.env.AI_GRAPHICS_TOOL_CAPABILITY_QA_DIFF_BASE ??
  'origin/codex/rp-ai-graphics-tool-capability-study-ranking-matrix'
const expectedDecision = 'ai_graphics_tool_capability_study_and_ranking_matrix_qa_passed_with_warnings'
const sourceDecision = 'ai_graphics_tool_capability_study_and_ranking_matrix_completed_with_warnings'

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
const requiredQaDocs = [
  'docs/tool-intelligence/ai-graphics/tool-capability-study-qa-review.md',
  'docs/tool-intelligence/ai-graphics/tool-capability-study-qa-source-lockfile.md',
  'docs/tool-intelligence/ai-graphics/tool-capability-study-qa-matrix.md',
  'docs/tool-intelligence/ai-graphics/tool-ranking-matrix-qa.md',
  'docs/tool-intelligence/ai-graphics/tool-selection-rules-qa.md',
  'docs/tool-intelligence/ai-graphics/tool-elimination-rules-qa.md',
  'docs/tool-intelligence/ai-graphics/tool-fallback-map-qa.md',
  'docs/tool-intelligence/ai-graphics/tool-cloud-targets-qa.md',
  'docs/tool-intelligence/ai-graphics/tool-proof-status-qa.md',
  'docs/tool-intelligence/ai-graphics/agent-routing-examples-qa.md',
  'docs/tool-intelligence/ai-graphics/blocked-runtime-register-qa.md',
  'docs/tool-intelligence/ai-graphics/tool-capability-study-qa-decision.md',
  'docs/prompt-ai-graphics-tool-capability-study-ranking-matrix-qa-review-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-tool-capability-study-ranking-matrix-qa-review.md',
]
const requiredQaJson = [
  'docs/tool-intelligence/ai-graphics/tool-capability-study-qa-matrix.json',
  'docs/tool-intelligence/ai-graphics/tool-capability-study-qa-source-lockfile.json',
  'docs/tool-intelligence/ai-graphics/tool-ranking-matrix-qa.json',
  'docs/tool-intelligence/ai-graphics/tool-selection-rules-qa.json',
  'docs/tool-intelligence/ai-graphics/tool-elimination-rules-qa.json',
  'docs/tool-intelligence/ai-graphics/tool-fallback-map-qa.json',
  'docs/tool-intelligence/ai-graphics/tool-cloud-targets-qa.json',
  'docs/tool-intelligence/ai-graphics/tool-proof-status-qa.json',
  'docs/tool-intelligence/ai-graphics/agent-routing-examples-qa.json',
  'docs/tool-intelligence/ai-graphics/tool-capability-study-qa-result.json',
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
const requiredTrue = [
  'capabilityStudyQaCompleted',
  'sourceCapabilityStudyAccepted',
  'all21AtlasToolsQaReviewed',
  'all13CanonicalPackageProofToolsIncluded',
  'all6CpuStaticValidatedToolsIncluded',
  'modelToolsIncludedAsBlockedForExecution',
  'rankingMatrixQaAccepted',
  'selectionRulesQaAccepted',
  'eliminationRulesQaAccepted',
  'fallbackMapQaAccepted',
  'cloudTargetsQaAccepted',
  'proofStatusQaAccepted',
  'agentRoutingExamplesQaAccepted',
  'priorStudyEvidenceAccepted',
  'agentCanSelectForPlanning',
]
const requiredFalse = [
  'agentCanExecuteToolsNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
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

for (const file of [...requiredQaDocs, ...requiredQaJson, ...sourceStudyDocs]) requireFile(file)
for (const tool of tools) {
  requireFile(`docs/tool-intelligence/ai-graphics/tool-cards/${tool}.md`, 'missing_source_tool_card')
  requireFile(`docs/tool-intelligence/ai-graphics/tool-cards/json/${tool}.json`, 'missing_source_tool_card_json')
  requireFile(`docs/tool-intelligence/ai-graphics/tool-cards/qa/${tool}.md`, 'missing_qa_tool_card')
}

const qaFiles = [...requiredQaDocs, ...requiredQaJson, ...tools.map((tool) => `docs/tool-intelligence/ai-graphics/tool-cards/qa/${tool}.md`)]
const sourceFiles = [
  ...sourceStudyDocs,
  ...tools.flatMap((tool) => [
    `docs/tool-intelligence/ai-graphics/tool-cards/${tool}.md`,
    `docs/tool-intelligence/ai-graphics/tool-cards/json/${tool}.json`,
  ]),
]
const docsText = [...qaFiles, ...sourceFiles]
  .filter((file) => existsSync(file))
  .map((file) => `\n--- ${file} ---\n${readFileSync(file, 'utf8')}`)
  .join('\n')

if (!docsText.includes(expectedDecision)) failures.push('expected_qa_decision_missing')
if (!docsText.includes(sourceDecision)) failures.push('source_decision_missing')
for (const pr of ['#623', '#621', '#617', '#616', '#614', '#607', '#604', '#589', '#425', '#433', '#441', '#376', '#361']) {
  if (!docsText.includes(`PR ${pr}`)) failures.push(`missing_pr_citation:${pr}`)
}
for (const phrase of ['TRACK_B_MEDIA_OSS_STEWARD', 'Track A', 'Track B']) {
  if (!docsText.includes(phrase)) failures.push(`missing_exclusion_context:${phrase}`)
}

const qaSource = readJson('docs/tool-intelligence/ai-graphics/tool-capability-study-qa-source-lockfile.json')
const qaMatrix = readJson('docs/tool-intelligence/ai-graphics/tool-capability-study-qa-matrix.json')
const qaRanking = readJson('docs/tool-intelligence/ai-graphics/tool-ranking-matrix-qa.json')
const qaSelection = readJson('docs/tool-intelligence/ai-graphics/tool-selection-rules-qa.json')
const qaElimination = readJson('docs/tool-intelligence/ai-graphics/tool-elimination-rules-qa.json')
const qaFallback = readJson('docs/tool-intelligence/ai-graphics/tool-fallback-map-qa.json')
const qaCloud = readJson('docs/tool-intelligence/ai-graphics/tool-cloud-targets-qa.json')
const qaProof = readJson('docs/tool-intelligence/ai-graphics/tool-proof-status-qa.json')
const qaRouting = readJson('docs/tool-intelligence/ai-graphics/agent-routing-examples-qa.json')
const qaResult = readJson('docs/tool-intelligence/ai-graphics/tool-capability-study-qa-result.json')
const sourceRanking = readJson('docs/tool-intelligence/ai-graphics/tool-ranking-matrix.json')
const sourceProof = readJson('docs/tool-intelligence/ai-graphics/tool-proof-status.json')
const sourceCloud = readJson('docs/tool-intelligence/ai-graphics/tool-cloud-targets.json')

if (qaSource?.decision !== expectedDecision) failures.push('qa_source_lockfile_decision_mismatch')
if (qaResult?.decision !== expectedDecision) failures.push('qa_result_decision_mismatch')
const qaRows = new Map((qaMatrix?.qaMatrix ?? []).map((row) => [row.toolId, row]))
for (const tool of tools) {
  if (!qaRows.has(tool)) failures.push(`qa_matrix_missing_tool:${tool}`)
  if (!qaRanking?.tools?.includes(tool)) failures.push(`qa_ranking_missing_tool:${tool}`)
}
const sourceRankedTools = new Set((sourceRanking?.tools ?? []).map((row) => row.toolId))
for (const tool of tools) {
  if (!sourceRankedTools.has(tool)) failures.push(`source_ranking_missing_tool:${tool}`)
}
for (const tool of tools) {
  if (!JSON.stringify(sourceProof).includes(tool)) failures.push(`source_proof_missing_tool:${tool}`)
  if (!JSON.stringify(sourceCloud).includes(tool)) failures.push(`source_cloud_missing_tool:${tool}`)
}
for (const cap of capabilities) {
  if (!docsText.includes(cap)) failures.push(`capability_missing:${cap}`)
  if (!qaSelection?.capabilityGroups?.includes(cap)) failures.push(`qa_selection_missing_capability:${cap}`)
  if (!qaFallback?.capabilityGroups?.includes(cap)) failures.push(`qa_fallback_missing_capability:${cap}`)
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
for (const target of ['cloud_run_cpu_job', 'model_weight_review_later', 'browser_chart_runtime_later', 'animation_manifest_runtime_later', 'browser_webgl_canvas_sandbox_later', 'defer_or_drop_after_backlog_review']) {
  if (!qaCloud?.targets?.includes(target)) failures.push(`qa_cloud_target_missing:${target}`)
}
for (const tool of canonical13) if (!qaProof?.canonicalPackageProofTools?.includes(tool)) failures.push(`qa_canonical_missing:${tool}`)
for (const tool of cpu6) if (!qaProof?.cpuStaticValidatedTools?.includes(tool)) failures.push(`qa_cpu_static_missing:${tool}`)
for (const tool of model8) if (!qaProof?.blockedDeferredModelTools?.includes(tool)) failures.push(`qa_model_blocked_missing:${tool}`)
if (!qaRouting?.agentRoutingExamplesQaAccepted) failures.push('agent_routing_examples_qa_not_accepted')

for (const field of requiredTrue) if (qaResult?.booleans?.[field] !== true) failures.push(`required_boolean_not_true:${field}`)
for (const field of requiredFalse) if (qaResult?.booleans?.[field] !== false) failures.push(`required_boolean_not_false:${field}`)

const productCapabilityNames = new Set([...(qaSource?.capabilityGroups ?? []), ...(qaSelection?.capabilityGroups ?? [])])
for (const label of ['Track A', 'Track B', 'Atlas', 'TRACK_B_MEDIA_OSS_STEWARD']) {
  if (productCapabilityNames.has(label)) failures.push(`internal_label_used_as_capability:${label}`)
}

const packageJson = readJson('package.json')
const packageLock = readJson('package-lock.json')
const basePackageJson = JSON.parse(git(['show', `${diffBase}:package.json`]))
const basePackageLock = JSON.parse(git(['show', `${diffBase}:package-lock.json`]))
if (
  packageJson?.scripts?.['ai-graphics:tool-capability-study:qa-diagnostics'] !==
  'node scripts/validation/ai-graphics-tool-capability-study-ranking-matrix-qa-diagnostics.mjs'
) {
  failures.push('missing_qa_package_script')
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
for (const claim of ['dry_run_passed', 'generated_local_fixture_passed', 'E2E proof accepted', 'runtime readiness accepted', 'internal beta ready', 'production ready']) {
  if (docsText.includes(claim)) failures.push(`forbidden_claim:${claim}`)
}

console.log(
  JSON.stringify(
    {
      status: failures.length ? 'failed' : 'passed',
      decision: expectedDecision,
      toolsQaReviewed: tools.length,
      failures,
    },
    null,
    2,
  ),
)
if (failures.length) process.exitCode = 1
