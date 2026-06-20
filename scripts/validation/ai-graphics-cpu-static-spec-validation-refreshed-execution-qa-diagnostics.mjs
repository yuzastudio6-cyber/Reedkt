import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const diffBase =
  process.env.AI_GRAPHICS_CPU_STATIC_REFRESHED_QA_DIFF_BASE ??
  'origin/codex/rp-ai-graphics-cpu-static-spec-validation-refreshed-execution'
const expectedDecision = 'ai_graphics_cpu_static_spec_validation_refreshed_execution_qa_passed_with_warnings'
const allowedDecisions = new Set([
  expectedDecision,
  'ai_graphics_cpu_static_spec_validation_refreshed_execution_qa_passed',
  'blocked_pending_refreshed_execution_source_review',
  'blocked_pending_d3_static_validation_qa',
  'blocked_pending_vega_lite_static_validation_qa',
  'blocked_pending_vega_static_validation_qa',
  'blocked_pending_satori_static_contract_qa',
  'blocked_pending_svgdotjs_static_contract_qa',
  'blocked_pending_viz_js_static_validation_qa',
  'blocked_pending_cpu_static_output_contract_qa',
])

const requiredFiles = [
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-source-lockfile.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-matrix.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-d3.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-vega-lite.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-vega.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-satori.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-svgdotjs.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-viz-js.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-dependency-reconciliation.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-output-contract.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-blocked-use-register.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-next-lane.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-decision.md',
  'docs/prompt-ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-review-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-review.md',
]
const requiredJsonFiles = [
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-matrix.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-source-lockfile.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-result.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-output-contract.json',
]
const acceptedTools = ['d3', 'vega_lite', 'vega', 'satori', 'svgdotjs_svg_js', 'viz_js']
const expectedPackages = {
  d3: 'd3',
  vega_lite: 'vega-lite',
  vega: 'vega',
  satori: 'satori',
  svgdotjs_svg_js: '@svgdotjs/svg.js',
  viz_js: '@viz-js/viz',
}
const expectedResults = {
  d3: 'cpu_static_metadata_validation_passed',
  vega_lite: 'cpu_static_spec_compile_or_validation_passed',
  vega: 'cpu_static_spec_parse_or_validation_passed',
  satori: 'cpu_static_manifest_contract_validation_passed_with_no_render',
  svgdotjs_svg_js: 'cpu_static_manifest_contract_validation_passed_with_no_dom_runtime',
  viz_js: 'cpu_static_dot_metadata_validation_passed',
}
const deferredTools = ['echarts', 'lottie_web', 'animejs', 'three_js', 'pixi_js', 'konva', 'babylonjs']
const requiredTrueBooleans = [
  'cpuStaticSpecValidationRefreshedExecutionQaCompleted',
  'sourceExecutionAccepted',
  'sourceReconciliationAccepted',
  'refreshedBaseAccepted',
  'dependenciesPresentFromFreshBaseAccepted',
  'all6CpuStaticToolsQaReviewed',
  'd3StaticValidationQaAccepted',
  'vegaLiteStaticValidationQaAccepted',
  'vegaStaticValidationQaAccepted',
  'satoriStaticContractValidationQaAccepted',
  'svgdotjsStaticContractValidationQaAccepted',
  'vizJsStaticValidationQaAccepted',
  'npmCiAccepted',
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
  'ai-graphics:cpu-static-spec-validation:refreshed-qa-diagnostics':
    'node scripts/validation/ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-diagnostics.mjs',
}

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

for (const file of [...requiredFiles, ...requiredJsonFiles]) {
  if (!existsSync(file)) failures.push(`missing_required_file:${file}`)
}

const docsText = [...requiredFiles, ...requiredJsonFiles]
  .filter((file) => existsSync(file))
  .map((file) => `\n--- ${file} ---\n${readFileSync(file, 'utf8')}`)
  .join('\n')

const decisions = [...docsText.matchAll(/Decision:\s*`([^`]+)`/g)].map((match) => match[1])
if (!decisions.includes(expectedDecision)) failures.push(`expected_decision_missing:${expectedDecision}`)
for (const decision of decisions) {
  if (!allowedDecisions.has(decision)) failures.push(`invalid_decision:${decision}`)
}

for (const pr of ['#616', '#614', '#612', '#607', '#604', '#425', '#433', '#441']) {
  if (!docsText.includes(`PR ${pr}`)) failures.push(`source_pr_missing:${pr}`)
}
for (const sha of [
  '474a88aa31aaff46164d1ff0d9dc469e8d320bf1',
  'a055ef045db2a6ce127a044bee6219d5933532c3',
  'dd8cb0a03d47da6463d8ca014cfb3e53b7531ea0',
  'd174de59471eacf05bed5a5511d661f2e5ba9f0f',
]) {
  if (!docsText.includes(sha)) failures.push(`source_sha_missing:${sha}`)
}

const matrix = readJson('docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-matrix.json')
const result = readJson('docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-result.json')
const sourceLock = readJson('docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-source-lockfile.json')
const outputContract = readJson('docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-refreshed-execution-qa-output-contract.json')

if (result?.decision !== expectedDecision) failures.push(`result_decision_mismatch:${result?.decision}`)
if (sourceLock?.sourceExecutionPr !== 616) failures.push(`source_execution_pr_mismatch:${sourceLock?.sourceExecutionPr}`)
if (sourceLock?.sourceExecutionHead !== '474a88aa31aaff46164d1ff0d9dc469e8d320bf1') {
  failures.push(`source_execution_head_mismatch:${sourceLock?.sourceExecutionHead}`)
}
if (sourceLock?.refreshedBaseAccepted !== true) failures.push('refreshed_base_not_accepted')

const rows = Array.isArray(matrix?.tools) ? matrix.tools : []
for (const toolId of acceptedTools) {
  const row = rows.find((entry) => entry.toolId === toolId)
  if (!row) {
    failures.push(`missing_accepted_tool:${toolId}`)
    continue
  }
  if (row.packageName !== expectedPackages[toolId]) failures.push(`package_mismatch:${toolId}:${row.packageName}`)
  if (row.acceptedResultStatus !== expectedResults[toolId]) {
    failures.push(`result_status_mismatch:${toolId}:${row.acceptedResultStatus}`)
  }
  for (const field of ['dependencyPresentFromFreshBaseAccepted', 'cpuStaticValidationAccepted', 'outputValidationAccepted']) {
    if (row[field] !== true) failures.push(`accepted_field_not_true:${toolId}:${field}`)
  }
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
for (const toolId of deferredTools) {
  const row = rows.find((entry) => entry.toolId === toolId)
  if (!row) {
    failures.push(`missing_deferred_tool:${toolId}`)
    continue
  }
  if (row.cpuStaticValidationAccepted === true || row.executedAccepted === true) failures.push(`deferred_tool_accepted_as_executed:${toolId}`)
}

for (const field of requiredTrueBooleans) {
  if (result?.booleans?.[field] !== true) failures.push(`required_boolean_not_true:${field}`)
}
for (const field of requiredFalseBooleans) {
  if (result?.booleans?.[field] !== false) failures.push(`required_boolean_not_false:${field}`)
}
for (const field of ['publicArtifactCreated', 'signedUrlCreated', 'browserRuntimePerformed', 'webglCanvasRuntimePerformed']) {
  if (outputContract?.[field] !== false) failures.push(`output_contract_field_not_false:${field}`)
}

const packageJson = readJson('package.json')
const packageLock = readJson('package-lock.json')
const basePackageJson = JSON.parse(git(['show', `${diffBase}:package.json`]))
const basePackageLock = JSON.parse(git(['show', `${diffBase}:package-lock.json`]))
for (const [name, command] of Object.entries(expectedScripts)) {
  if (packageJson?.scripts?.[name] !== command) failures.push(`missing_package_script:${name}`)
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

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) failures.push(`local_artifacts_tracked:${trackedLocalArtifacts}`)
const trackedGeneratedOutputs = git(['ls-files'])
  .split('\n')
  .filter(Boolean)
  .filter((file) => /\.(png|jpe?g|webp|gif|mp4|mov|webm|pdf)$/i.test(file))
  .filter((file) => file.includes('ai-graphics') || file.includes('open-source-tool-stack'))
if (trackedGeneratedOutputs.length > 0) failures.push(`generated_outputs_tracked:${trackedGeneratedOutputs.join(',')}`)

const forbiddenClaims = [
  'dry_run_passed',
  'generated_local_fixture_passed',
  'executionRerunPerformed: true',
  'dependencyInstallPerformed: true',
  'packageLockMutationPerformed: true',
  'browserRuntimePerformed: true',
  'webglCanvasRuntimePerformed: true',
  'gpuRuntimePerformed: true',
  'toolRouteExecutionPerformed: true',
  'workerExecutionPerformed: true',
  'providerRuntimePerformed: true',
  'supabaseMutationPerformed: true',
  'gcsUploadPerformed: true',
  'publicArtifactCreated: true',
  'signedUrlCreated: true',
  'runtimeReadyNow: true',
  'internalBetaReadyNow: true',
  'productionReadyNow: true',
]
for (const claim of forbiddenClaims) {
  if (docsText.includes(claim)) failures.push(`forbidden_claim:${claim}`)
}

const diagnostic = {
  status: failures.length === 0 ? 'passed' : 'failed',
  decision: expectedDecision,
  acceptedTools,
  deferredTools,
  failures,
}
console.log(JSON.stringify(diagnostic, null, 2))

if (failures.length > 0) {
  process.exitCode = 1
}
