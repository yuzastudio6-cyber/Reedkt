import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const diffBase =
  process.env.AI_GRAPHICS_TOOL_CAPABILITY_DIFF_BASE ??
  'origin/codex/rp-ai-graphics-cpu-static-spec-validation-refreshed-execution-owner-review'
const expectedDecision = 'ai_graphics_tool_capability_study_and_ranking_matrix_completed_with_warnings'
const requiredDocs = [
  'docs/tool-intelligence/ai-graphics/tool-capability-study.md',
  'docs/tool-intelligence/ai-graphics/tool-ranking-matrix.md',
  'docs/tool-intelligence/ai-graphics/tool-selection-rules.md',
  'docs/tool-intelligence/ai-graphics/tool-elimination-rules.md',
  'docs/tool-intelligence/ai-graphics/tool-fallback-map.md',
  'docs/tool-intelligence/ai-graphics/tool-cloud-targets.md',
  'docs/tool-intelligence/ai-graphics/tool-proof-status.md',
  'docs/tool-intelligence/ai-graphics/agent-routing-examples.md',
  'docs/tool-intelligence/ai-graphics/blocked-runtime-register.md',
  'docs/tool-intelligence/ai-graphics/next-proof-milestones.md',
  'docs/tool-intelligence/ai-graphics/tool-capability-study-decision.md',
  'docs/prompt-ai-graphics-tool-capability-study-ranking-matrix-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-tool-capability-study-ranking-matrix.md',
]
const requiredJson = [
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
const capabilityDocs = [
  'chart-overlay',
  'svg-graphics',
  'diagram-graphics',
  'animation-overlay',
  'browser-webgl-canvas-scenes',
  'background-removal',
  'upscaling',
  'model-runtime-foundation',
].map((slug) => `docs/tool-intelligence/ai-graphics/capabilities/${slug}.md`)
const requiredTrue = [
  'capabilityStudyCompleted',
  'all21AtlasToolsStudied',
  'all13CanonicalPackageProofToolsIncluded',
  'all6CpuStaticValidatedToolsIncluded',
  'modelToolsIncludedAsBlockedForExecution',
  'rankingMatrixCreated',
  'selectionRulesCreated',
  'eliminationRulesCreated',
  'fallbackMapCreated',
  'cloudTargetsCreated',
  'proofStatusCreated',
  'agentRoutingExamplesCreated',
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

for (const file of [...requiredDocs, ...requiredJson, ...capabilityDocs]) {
  if (!existsSync(file)) failures.push(`missing_required_file:${file}`)
}
for (const tool of tools) {
  for (const file of [
    `docs/tool-intelligence/ai-graphics/tool-cards/${tool}.md`,
    `docs/tool-intelligence/ai-graphics/tool-cards/json/${tool}.json`,
  ]) {
    if (!existsSync(file)) failures.push(`missing_tool_card:${file}`)
  }
}

const docsText = [
  ...requiredDocs,
  ...requiredJson,
  ...capabilityDocs,
  ...tools.flatMap((tool) => [
    `docs/tool-intelligence/ai-graphics/tool-cards/${tool}.md`,
    `docs/tool-intelligence/ai-graphics/tool-cards/json/${tool}.json`,
  ]),
]
  .filter((file) => existsSync(file))
  .map((file) => `\n--- ${file} ---\n${readFileSync(file, 'utf8')}`)
  .join('\n')

if (!docsText.includes(expectedDecision)) failures.push('expected_decision_missing')
for (const pr of ['#621', '#617', '#616', '#614', '#607', '#604', '#589', '#425', '#433', '#441', '#376', '#361']) {
  if (!docsText.includes(`PR ${pr}`)) failures.push(`missing_pr_citation:${pr}`)
}
for (const phrase of ['TRACK_B_MEDIA_OSS_STEWARD', 'Track A', 'Track B']) {
  if (!docsText.includes(phrase)) failures.push(`missing_exclusion_context:${phrase}`)
}

const ranking = readJson('docs/tool-intelligence/ai-graphics/tool-ranking-matrix.json')
const selection = readJson('docs/tool-intelligence/ai-graphics/tool-selection-rules.json')
const elimination = readJson('docs/tool-intelligence/ai-graphics/tool-elimination-rules.json')
const fallback = readJson('docs/tool-intelligence/ai-graphics/tool-fallback-map.json')
const cloud = readJson('docs/tool-intelligence/ai-graphics/tool-cloud-targets.json')
const proof = readJson('docs/tool-intelligence/ai-graphics/tool-proof-status.json')
const result = readJson('docs/tool-intelligence/ai-graphics/tool-capability-study-result.json')

const rankedTools = new Set((ranking?.tools ?? []).map((row) => row.toolId))
for (const tool of tools) if (!rankedTools.has(tool)) failures.push(`ranking_missing_tool:${tool}`)
for (const cap of capabilities) if (!docsText.includes(cap)) failures.push(`capability_missing:${cap}`)
for (const cap of ['chart_overlay', 'svg_graphics', 'diagram_graphics', 'animation_overlay', 'background_removal', 'upscaling']) {
  if (!selection?.selectionExamples?.[cap]) failures.push(`selection_example_missing:${cap}`)
}
for (const rule of [
  'capability mismatch',
  'proof status is below required proof',
  'browser/WebGL/canvas',
  'GPU/model weights',
  'public artifact/signed URL',
  'Tool Route/Worker',
  'simpler tool',
  'deferred/backlog',
]) {
  if (!JSON.stringify(elimination).includes(rule) && !docsText.includes(rule)) failures.push(`elimination_rule_missing:${rule}`)
}
for (const cap of capabilities) if (!fallback?.fallbackMap?.[cap]) failures.push(`fallback_missing:${cap}`)
for (const target of [
  'cloud_run_cpu_job',
  'model_weight_review_later',
  'browser_chart_runtime_later',
  'animation_manifest_runtime_later',
  'browser_webgl_canvas_sandbox_later',
  'defer_or_drop_after_backlog_review',
]) {
  if (!cloud?.cloudTargets?.[target]) failures.push(`cloud_target_missing:${target}`)
}
for (const tool of canonical13) if (!proof?.canonicalPackageProofTools?.includes(tool)) failures.push(`canonical_proof_missing:${tool}`)
for (const tool of cpu6) if (!proof?.cpuStaticValidatedTools?.includes(tool)) failures.push(`cpu_static_proof_missing:${tool}`)
for (const tool of model8) if (!proof?.blockedDeferredModelTools?.includes(tool)) failures.push(`model_blocked_missing:${tool}`)
for (const field of requiredTrue) if (result?.booleans?.[field] !== true) failures.push(`required_boolean_not_true:${field}`)
for (const field of requiredFalse) if (result?.booleans?.[field] !== false) failures.push(`required_boolean_not_false:${field}`)

const packageJson = readJson('package.json')
const packageLock = readJson('package-lock.json')
const basePackageJson = JSON.parse(git(['show', `${diffBase}:package.json`]))
const basePackageLock = JSON.parse(git(['show', `${diffBase}:package-lock.json`]))
if (
  packageJson?.scripts?.['ai-graphics:tool-capability-study:diagnostics'] !==
  'node scripts/validation/ai-graphics-tool-capability-study-ranking-matrix-diagnostics.mjs'
) {
  failures.push('missing_package_script')
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

const forbidden = [
  'dry_run_passed',
  'generated_local_fixture_passed',
  'agentCanExecuteToolsNow: true',
  'runtimeReadyNow: true',
  'internalBetaReadyNow: true',
  'productionReadyNow: true',
  'browserWebglCanvasRuntimePerformed: true',
  'gpuRuntimePerformed: true',
  'toolExecutionPerformed: true',
  'workerExecutionPerformed: true',
  'routeExecutionPerformed: true',
  'providerRuntimePerformed: true',
  'supabaseMutationPerformed: true',
  'gcsUploadPerformed: true',
  'publicArtifactCreated: true',
  'signedUrlCreated: true',
]
for (const claim of forbidden) if (docsText.includes(claim)) failures.push(`forbidden_claim:${claim}`)

console.log(JSON.stringify({ status: failures.length ? 'failed' : 'passed', decision: expectedDecision, toolsStudied: tools.length, failures }, null, 2))
if (failures.length) process.exitCode = 1
