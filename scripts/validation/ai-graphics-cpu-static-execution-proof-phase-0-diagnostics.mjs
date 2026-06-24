import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef =
  process.env.AI_GRAPHICS_CPU_STATIC_EXECUTION_PROOF_PHASE0_DIFF_BASE ??
  'origin/codex/rp-ai-graphics-canonical-agent-selection-runtime-boundary-handoff-owner-approval'
const expectedDecision = 'ai_graphics_cpu_static_execution_proof_phase_0_completed_with_warnings'
const targetTools = ['d3', 'vega_lite', 'vega', 'satori', 'svgdotjs_svg_js', 'viz_js']
const expectedPackages = {
  d3: 'd3',
  vega_lite: 'vega-lite',
  vega: 'vega',
  satori: 'satori',
  svgdotjs_svg_js: '@svgdotjs/svg.js',
  viz_js: '@viz-js/viz',
}
const expectedScripts = {
  'ai-graphics:cpu-static-execution-proof:phase0':
    'node scripts/validation/ai-graphics-cpu-static-execution-proof-phase-0.mjs',
  'ai-graphics:cpu-static-execution-proof:phase0-diagnostics':
    'node scripts/validation/ai-graphics-cpu-static-execution-proof-phase-0-diagnostics.mjs',
}
const requiredFiles = [
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-fixtures.json',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0.md',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0.json',
  'docs/prompt-ai-graphics-cpu-static-execution-proof-phase-0-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-cpu-static-execution-proof-phase-0.md',
  'scripts/validation/ai-graphics-cpu-static-execution-proof-phase-0.mjs',
  'scripts/validation/ai-graphics-cpu-static-execution-proof-phase-0-diagnostics.mjs',
  'scripts/validation/ai-graphics/cpu-static-tools/common.mjs',
  'scripts/validation/ai-graphics/cpu-static-tools/d3-proof.mjs',
  'scripts/validation/ai-graphics/cpu-static-tools/vega-lite-proof.mjs',
  'scripts/validation/ai-graphics/cpu-static-tools/vega-proof.mjs',
  'scripts/validation/ai-graphics/cpu-static-tools/satori-proof.mjs',
  'scripts/validation/ai-graphics/cpu-static-tools/svgdotjs-proof.mjs',
  'scripts/validation/ai-graphics/cpu-static-tools/viz-js-proof.mjs',
]
const requiredRecordFiles = [
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-fixtures.json',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0.md',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0.json',
  'docs/prompt-ai-graphics-cpu-static-execution-proof-phase-0-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-cpu-static-execution-proof-phase-0.md',
]
const requiredTrueBooleans = [
  'cpuStaticExecutionProofPhase0Completed',
  'actualImportsAttempted',
  'actualFixturesAttempted',
  'actualOutputContractsChecked',
  'dependencyInstallFromLockOnly',
  'agentCanSelectForPlanning',
]
const requiredFalseBooleans = [
  'packageLockMutationPerformed',
  'generatedArtifactsCommitted',
  'agentCanExecuteToolsNow',
  'routeExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'toolExecutionApprovedNow',
  'browserWebglCanvasRuntimeApprovedNow',
  'gpuRuntimeApprovedNow',
  'providerRuntimeApprovedNow',
  'publicArtifactApprovedNow',
  'signedUrlApprovedNow',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'productionReadyNow',
]

const failures = []
const env = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const git = (args) => execFileSync('git', args, { env, encoding: 'utf8' }).trim()
const fail = (message) => failures.push(message)
const readJson = (file) => {
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch (error) {
    fail(`invalid_json:${file}:${error.message}`)
    return null
  }
}

for (const file of requiredFiles) {
  if (!existsSync(file)) fail(`missing_required_file:${file}`)
}

const summary = readJson('docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0.json')
const fixtures = readJson('docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-fixtures.json')
const packageJson = readJson('package.json')
const packageLock = readJson('package-lock.json')
const basePackageJson = JSON.parse(git(['show', `${baseRef}:package.json`]))
const basePackageLock = JSON.parse(git(['show', `${baseRef}:package-lock.json`]))

const docsText = requiredRecordFiles
  .filter((file) => existsSync(file))
  .map((file) => `\n--- ${file} ---\n${readFileSync(file, 'utf8')}`)
  .join('\n')

if (summary?.decision !== expectedDecision) fail(`unexpected_decision:${summary?.decision}`)
if (summary?.localArtifactRoot !== '.local-artifacts/ai-graphics/cpu-static-proof/ai-graphics-cpu-static-execution-proof-phase-0-local') {
  fail(`unexpected_local_artifact_root:${summary?.localArtifactRoot}`)
}
if (summary?.generatedArtifactsCommitted !== false) fail('generated_artifacts_committed_not_false')
if (summary?.packageLockStatus !== 'unchanged') fail(`package_lock_status_not_unchanged:${summary?.packageLockStatus}`)

for (const field of requiredTrueBooleans) {
  if (summary?.booleans?.[field] !== true) fail(`required_boolean_not_true:${field}`)
}
for (const field of requiredFalseBooleans) {
  if (summary?.booleans?.[field] !== false) fail(`required_boolean_not_false:${field}`)
}

const tools = Array.isArray(summary?.tools) ? summary.tools : []
for (const toolId of targetTools) {
  const tool = tools.find((entry) => entry.toolId === toolId)
  if (!tool) {
    fail(`missing_tool_result:${toolId}`)
    continue
  }
  if (tool.packageName !== expectedPackages[toolId]) fail(`package_mismatch:${toolId}:${tool.packageName}`)
  if (!['proof_passed', 'proof_blocked_missing_runtime', 'proof_blocked_missing_package'].includes(tool.status)) {
    fail(`invalid_tool_status:${toolId}:${tool.status}`)
  }
  if (tool.status === 'proof_failed_unexpected_error') fail(`unexpected_tool_failure:${toolId}`)
  if (tool.importStatus === 'not_attempted') fail(`import_not_attempted:${toolId}`)
  if (tool.fixtureStatus === 'not_attempted') fail(`fixture_not_attempted:${toolId}`)
  if (tool.outputContractStatus === 'not_checked') fail(`output_contract_not_checked:${toolId}`)
  for (const field of [
    'agentCanExecuteToolsNow',
    'routeExecutionApprovedNow',
    'workerExecutionApprovedNow',
    'toolExecutionApprovedNow',
    'browserWebglCanvasRuntimeApprovedNow',
    'gpuRuntimeApprovedNow',
    'providerRuntimeApprovedNow',
    'publicArtifactApprovedNow',
    'signedUrlApprovedNow',
    'runtimeReadyNow',
    'internalBetaReadyNow',
    'productionReadyNow',
  ]) {
    if (tool[field] !== false) fail(`tool_runtime_gate_not_false:${toolId}:${field}`)
  }
}
for (const toolId of targetTools) {
  if (!fixtures?.[toolId]) fail(`missing_fixture:${toolId}`)
}
for (const toolId of ['d3', 'vega_lite', 'vega', 'svgdotjs_svg_js', 'viz_js']) {
  const tool = tools.find((entry) => entry.toolId === toolId)
  if (tool?.status !== 'proof_passed') fail(`expected_tool_to_pass:${toolId}:${tool?.status}`)
}
const satori = tools.find((entry) => entry.toolId === 'satori')
if (!['proof_passed', 'proof_blocked_missing_runtime'].includes(satori?.status)) fail(`satori_status_not_accepted:${satori?.status}`)
if (satori?.status === 'proof_blocked_missing_runtime' && !/font/i.test(satori.blockedReason ?? '')) {
  fail('satori_block_missing_font_reason')
}

for (const pr of ['#724', '#722', '#719', '#718', '#715', '#694', '#671', '#683', '#623', '#621', '#425', '#433', '#441']) {
  if (!docsText.includes(`PR ${pr}`)) fail(`missing_source_pr_citation:${pr}`)
}
for (const sha of [
  'a055ef045db2a6ce127a044bee6219d5933532c3',
  'dd8cb0a03d47da6463d8ca014cfb3e53b7531ea0',
  'd174de59471eacf05bed5a5511d661f2e5ba9f0f',
]) {
  if (!docsText.includes(sha)) fail(`missing_package_proof_merge_sha:${sha}`)
}

for (const [scriptName, command] of Object.entries(expectedScripts)) {
  if (packageJson?.scripts?.[scriptName] !== command) fail(`missing_expected_script:${scriptName}`)
}
for (const [scriptName, command] of Object.entries(basePackageJson.scripts ?? {})) {
  if (packageJson?.scripts?.[scriptName] !== command) fail(`existing_script_changed:${scriptName}`)
}
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  if (JSON.stringify(packageJson?.[section] ?? {}) !== JSON.stringify(basePackageJson?.[section] ?? {})) {
    fail(`dependency_section_changed:${section}`)
  }
}
for (const packageName of Object.values(expectedPackages)) {
  if (!packageJson?.dependencies?.[packageName]) fail(`missing_package_json_dependency:${packageName}`)
  if (!packageLock?.packages?.[`node_modules/${packageName}`]) fail(`missing_package_lock_dependency:${packageName}`)
}
if (JSON.stringify(packageLock) !== JSON.stringify(basePackageLock)) fail('package_lock_changed')

const trackedFiles = git(['ls-files']).split('\n').filter(Boolean)
for (const file of trackedFiles) {
  if (file.includes('.local-artifacts')) fail(`local_artifacts_tracked:${file}`)
  if (/(^|\/)(generated-media|media-output|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)/i.test(file)) {
    fail(`generated_output_path_tracked:${file}`)
  }
}
for (const artifact of tools.flatMap((tool) => tool.localArtifactPaths ?? [])) {
  if (!artifact.startsWith('.local-artifacts/ai-graphics/cpu-static-proof/')) fail(`local_artifact_outside_policy:${artifact}`)
  if (trackedFiles.includes(artifact)) fail(`local_artifact_tracked:${artifact}`)
}

for (const forbidden of [
  /agentCanExecuteToolsNow:\s*true/i,
  /routeExecutionApprovedNow:\s*true/i,
  /workerExecutionApprovedNow:\s*true/i,
  /toolExecutionApprovedNow:\s*true/i,
  /browserWebglCanvasRuntimeApprovedNow:\s*true/i,
  /gpuRuntimeApprovedNow:\s*true/i,
  /providerRuntimeApprovedNow:\s*true/i,
  /publicArtifactApprovedNow:\s*true/i,
  /signedUrlApprovedNow:\s*true/i,
  /runtimeReadyNow:\s*true/i,
  /internalBetaReadyNow:\s*true/i,
  /productionReadyNow:\s*true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
  /Tool Route execution approved/i,
  /Worker execution approved/i,
  /production unlock/i,
]) {
  if (forbidden.test(docsText)) fail(`forbidden_claim:${forbidden}`)
}

const diagnostic = {
  status: failures.length === 0 ? 'passed' : 'failed',
  decision: expectedDecision,
  checkedTools: targetTools,
  failures,
}
console.log(JSON.stringify(diagnostic, null, 2))
if (failures.length > 0) process.exitCode = 1
