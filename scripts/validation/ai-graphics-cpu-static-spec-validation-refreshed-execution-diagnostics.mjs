import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const diffBase =
  process.env.AI_GRAPHICS_CPU_STATIC_REFRESHED_DIFF_BASE ??
  'origin/codex/rp-ai-tools-creative-graphics-batch-3-approval-packet'
const expectedDecision = 'ai_graphics_cpu_static_spec_validation_refreshed_execution_passed_with_warnings'
const allowedDecisions = new Set([
  expectedDecision,
  'ai_graphics_cpu_static_spec_validation_refreshed_execution_passed',
  'blocked_pending_refreshed_base_missing_dependencies',
  'blocked_pending_refreshed_npm_ci',
  'blocked_pending_d3_static_validation',
  'blocked_pending_vega_lite_static_validation',
  'blocked_pending_vega_static_validation',
  'blocked_pending_satori_static_contract_validation',
  'blocked_pending_svgdotjs_static_contract_validation',
  'blocked_pending_viz_js_static_validation',
  'blocked_pending_cpu_static_output_contract',
])

const requiredFiles = [
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-execution.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-source-lockfile.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-result.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-matrix.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-d3.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-vega-lite.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-vega.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-satori.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-svgdotjs.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-viz-js.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-output-contract.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-blocked-use-register.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-next-lane.md',
  'docs/prompt-ai-graphics-cpu-static-spec-validation-refreshed-execution-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-cpu-static-spec-validation-refreshed-execution.md',
]
const requiredJsonFiles = [
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-matrix.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-source-lockfile.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-result.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-output-contract.json',
]
const approvedTools = ['d3', 'vega_lite', 'vega', 'satori', 'svgdotjs_svg_js', 'viz_js']
const expectedPackages = {
  d3: 'd3',
  vega_lite: 'vega-lite',
  vega: 'vega',
  satori: 'satori',
  svgdotjs_svg_js: '@svgdotjs/svg.js',
  viz_js: '@viz-js/viz',
}
const excludedTools = ['echarts', 'lottie_web', 'animejs', 'three_js', 'pixi_js', 'konva', 'babylonjs']
const requiredTrueBooleans = [
  'cpuStaticSpecValidationRefreshedExecutionCompleted',
  'sourceReconciliationAccepted',
  'refreshedBaseUsed',
  'dependenciesPresentFromFreshBase',
  'all6CpuStaticToolsExecutedOrContractValidated',
  'd3StaticValidationPassed',
  'vegaLiteStaticValidationPassed',
  'vegaStaticValidationPassed',
  'satoriStaticContractValidationPassed',
  'svgdotjsStaticContractValidationPassed',
  'vizJsStaticValidationPassed',
  'npmCiPerformed',
]
const requiredFalseBooleans = [
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'importSmokeExecutedNow',
  'syntheticFixtureExecutedNow',
  'browserRuntimePerformed',
  'webglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'toolRouteExecutionPerformed',
  'workerExecutionPerformed',
  'providerRuntimePerformed',
  'supabaseMutationPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'productionReadyNow',
]
const expectedScripts = {
  'ai-graphics:cpu-static-spec-validation:refreshed-execute':
    'node scripts/validation/ai-graphics-cpu-static-spec-validation-refreshed-execution.mjs',
  'ai-graphics:cpu-static-spec-validation:refreshed-diagnostics':
    'node scripts/validation/ai-graphics-cpu-static-spec-validation-refreshed-execution-diagnostics.mjs',
}

const failures = []
const env = { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' }
const git = (args) => execFileSync('git', args, { env, encoding: 'utf8' }).trim()
const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    failures.push(`invalid_json:${path}:${error.message}`)
    return null
  }
}

for (const path of [...requiredFiles, ...requiredJsonFiles]) {
  if (!existsSync(path)) failures.push(`missing_required_file:${path}`)
}

const docsText = [...requiredFiles, ...requiredJsonFiles]
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')

const decisions = [...docsText.matchAll(/Decision:\s*`([^`]+)`/g)].map((match) => match[1])
if (!decisions.includes(expectedDecision)) failures.push(`expected_decision_missing:${expectedDecision}`)
for (const decision of decisions) {
  if (!allowedDecisions.has(decision)) failures.push(`invalid_decision:${decision}`)
}

for (const pr of ['#614', '#612', '#607', '#604', '#425', '#433', '#441', '#542', '#544']) {
  if (!docsText.includes(`PR ${pr}`)) failures.push(`source_pr_missing:${pr}`)
}
for (const sha of [
  'a055ef045db2a6ce127a044bee6219d5933532c3',
  'dd8cb0a03d47da6463d8ca014cfb3e53b7531ea0',
  'd174de59471eacf05bed5a5511d661f2e5ba9f0f',
]) {
  if (!docsText.includes(sha)) failures.push(`merge_sha_missing:${sha}`)
}
if (!docsText.includes('TRACK_B_MEDIA_OSS_STEWARD')) failures.push('track_b_owner_exclusion_missing')
if (!docsText.includes('Track A render/export')) failures.push('track_a_exclusion_missing')

const matrix = readJson('docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-matrix.json')
const result = readJson('docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-result.json')
const sourceLock = readJson('docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-source-lockfile.json')
const outputContract = readJson('docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-output-contract.json')

if (result?.decision !== expectedDecision) failures.push(`result_decision_mismatch:${result?.decision}`)
if (sourceLock?.freshBaseUsed !== 'origin/codex/rp-ai-tools-creative-graphics-batch-3-approval-packet') {
  failures.push(`fresh_base_mismatch:${sourceLock?.freshBaseUsed}`)
}

const matrixTools = Array.isArray(matrix?.tools) ? matrix.tools : []
for (const toolId of approvedTools) {
  const row = matrixTools.find((entry) => entry.toolId === toolId)
  if (!row) {
    failures.push(`missing_tool:${toolId}`)
    continue
  }
  if (row.packageName !== expectedPackages[toolId]) failures.push(`package_name_mismatch:${toolId}:${row.packageName}`)
  if (row.canonicalPackageProofStatus !== 'canonical_merged_package_import_static_fixture_proof') {
    failures.push(`proof_status_mismatch:${toolId}:${row.canonicalPackageProofStatus}`)
  }
  if (row.dependencyPresentFromFreshBase !== true) failures.push(`dependency_not_present:${toolId}`)
  if (row.cpuStaticValidationExecuted !== true) failures.push(`cpu_static_not_executed:${toolId}`)
  for (const field of [
    'browserRuntimeUsed',
    'webglCanvasUsed',
    'toolRouteExecuted',
    'workerExecuted',
    'publicArtifactCreated',
    'signedUrlCreated',
  ]) {
    if (row[field] !== false) failures.push(`runtime_field_not_false:${toolId}:${field}`)
  }
}
for (const toolId of excludedTools) {
  if (!docsText.includes(toolId)) failures.push(`excluded_tool_not_recorded:${toolId}`)
  const row = matrixTools.find((entry) => entry.toolId === toolId)
  if (row?.cpuStaticValidationExecuted === true) failures.push(`excluded_tool_executed:${toolId}`)
}
if (outputContract?.publicArtifactCreated !== false) failures.push('output_contract_public_artifact_not_false')
if (outputContract?.signedUrlCreated !== false) failures.push('output_contract_signed_url_not_false')

for (const field of requiredTrueBooleans) {
  if (result?.booleans?.[field] !== true) failures.push(`required_boolean_not_true:${field}`)
}
for (const field of requiredFalseBooleans) {
  if (result?.booleans?.[field] !== false) failures.push(`required_boolean_not_false:${field}`)
}

const packageJson = readJson('package.json')
const packageLock = readJson('package-lock.json')
const basePackageJson = JSON.parse(git(['show', `${diffBase}:package.json`]))
const basePackageLock = JSON.parse(git(['show', `${diffBase}:package-lock.json`]))

for (const [scriptName, command] of Object.entries(expectedScripts)) {
  if (packageJson?.scripts?.[scriptName] !== command) failures.push(`missing_package_script:${scriptName}`)
}
for (const [scriptName, command] of Object.entries(basePackageJson.scripts ?? {})) {
  if (packageJson?.scripts?.[scriptName] !== command) failures.push(`existing_script_changed:${scriptName}`)
}
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  if (JSON.stringify(packageJson?.[section] ?? {}) !== JSON.stringify(basePackageJson?.[section] ?? {})) {
    failures.push(`dependency_section_changed:${section}`)
  }
}
for (const packageName of Object.values(expectedPackages)) {
  if (!packageJson?.dependencies?.[packageName]) failures.push(`missing_package_json_dependency:${packageName}`)
  if (!packageLock?.packages?.[`node_modules/${packageName}`]) failures.push(`missing_package_lock_dependency:${packageName}`)
}
if (JSON.stringify(packageLock) !== JSON.stringify(basePackageLock)) failures.push('package_lock_changed')

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) failures.push(`local_artifacts_tracked:${trackedLocalArtifacts}`)
const trackedGeneratedOutputs = git(['ls-files'])
  .split('\n')
  .filter(Boolean)
  .filter((path) => /\.(png|jpe?g|webp|gif|mp4|mov|webm|pdf)$/i.test(path))
  .filter((path) => path.includes('ai-graphics') || path.includes('open-source-tool-stack'))
if (trackedGeneratedOutputs.length > 0) failures.push(`generated_output_tracked:${trackedGeneratedOutputs.join(',')}`)

for (const forbidden of [
  'dry_run_passed',
  'generated_local_fixture_passed',
  'runtimeReadyNow: true',
  'internalBetaReadyNow: true',
  'productionReadyNow: true',
  'browserRuntimePerformed: true',
  'webglCanvasRuntimePerformed: true',
  'toolRouteExecutionPerformed: true',
  'workerExecutionPerformed: true',
  'providerRuntimePerformed: true',
  'supabaseMutationPerformed: true',
  'gcsUploadPerformed: true',
  'publicArtifactCreated: true',
  'signedUrlCreated: true',
]) {
  if (docsText.includes(forbidden)) failures.push(`forbidden_claim:${forbidden}`)
}

const diagnostic = {
  status: failures.length === 0 ? 'passed' : 'failed',
  decision: expectedDecision,
  checkedTools: approvedTools,
  excludedTools,
  failures,
}
console.log(JSON.stringify(diagnostic, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
