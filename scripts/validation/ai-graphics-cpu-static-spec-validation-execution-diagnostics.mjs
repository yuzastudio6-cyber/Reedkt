import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-draft-package-proof-cpu-static-spec-validation-approval'
const expectedDecision = 'blocked_pending_cpu_static_dependency_install_from_lock'
const runId = 'ai-graphics-cpu-static-spec-validation-local-static'
const proofLevel = 'canonical_merged_package_import_static_fixture_proof'
const approvedTools = ['d3', 'vega_lite', 'vega', 'satori', 'svgdotjs_svg_js', 'viz_js']
const approvedPackages = {
  d3: 'd3',
  vega_lite: 'vega-lite',
  vega: 'vega',
  satori: 'satori',
  svgdotjs_svg_js: '@svgdotjs/svg.js',
  viz_js: '@viz-js/viz',
}
const deferredTools = ['echarts', 'lottie_web', 'animejs', 'three_js', 'pixi_js', 'konva', 'babylonjs']
const expectedSources = [
  'PR #607',
  'PR #604',
  'PR #602',
  'PR #598',
  'PR #594',
  'PR #589',
  'PR #582',
  'PR #425',
  'PR #433',
  'PR #441',
  'PR #543',
  'PR #542',
  'PR #544',
]
const expectedMergeShas = [
  'a055ef045db2a6ce127a044bee6219d5933532c3',
  'dd8cb0a03d47da6463d8ca014cfb3e53b7531ea0',
  'd174de59471eacf05bed5a5511d661f2e5ba9f0f',
]

const requiredDocs = [
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-execution.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-execution-source-lockfile.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-execution-result.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-execution-matrix.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-execution-d3.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-execution-vega-lite.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-execution-vega.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-execution-satori.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-execution-svgdotjs-svg-js.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-execution-viz-js.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-execution-output-contract.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-execution-blocked-use-register.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-execution-next-lane.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-execution-source-lockfile.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-execution-matrix.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-execution-result.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-execution-output-contract.json',
  'docs/prompt-ai-graphics-cpu-static-spec-validation-execution-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-cpu-static-spec-validation-execution.md',
]

const statusDocs = [
  'docs/open-source-tool-stack/ownership/ai-graphics-next-proof-plan.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-tool-evidence-ledger.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-tool-evidence-ledger.json',
  'docs/production-beta-readiness-scorecard.md',
]

const requiredTrueBooleans = [
  'cpuStaticSpecValidationExecutionAttempted',
  'sourceApprovalAccepted',
  'canonicalPackageProofAccepted',
  'dependencyLockfileGateEvaluated',
  'blockedPacketCommitted',
]

const requiredFalseBooleans = [
  'cpuStaticSpecValidationExecutionPassed',
  'all6CpuStaticToolsValidated',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'importSmokeExecutedNow',
  'syntheticFixtureExecutedNow',
  'staticFixtureExecutionPerformed',
  'toolExecutionPerformed',
  'workerExecutionPerformed',
  'routeExecutionPerformed',
  'providerRuntimePerformed',
  'browserWebglCanvasRuntimePerformed',
  'gpuRuntimePerformed',
  'modelWeightDownloadPerformed',
  'supabaseMutationPerformed',
  'sqlExecutionPerformed',
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
]

const forbiddenPatterns = [
  ['passed_decision', /ai_graphics_cpu_static_spec_validation_execution_passed_with_warnings/],
  ['runtime_ready_true', /\bruntimeReadyNow\b\s*[:=|]\s*`?true`?/i],
  ['internal_beta_true', /\binternalBetaReadyNow\b\s*[:=|]\s*`?true`?/i],
  ['external_beta_true', /\bexternalBetaReadyNow\b\s*[:=|]\s*`?true`?/i],
  ['production_true', /\bproductionReadyNow\b\s*[:=|]\s*`?true`?/i],
  ['runtime_or_execution_true', /\b(toolExecutionPerformed|workerExecutionPerformed|routeExecutionPerformed|providerRuntimePerformed|browserWebglCanvasRuntimePerformed|gpuRuntimePerformed|modelWeightDownloadPerformed)\b\s*[:=|]\s*`?true`?/i],
  ['storage_public_true', /\b(supabaseMutationPerformed|sqlExecutionPerformed|gcsUploadPerformed|publicArtifactCreated|signedUrlCreated)\b\s*[:=|]\s*`?true`?/i],
  ['dry_run_passed', /\bdry_run_passed\b[\s\S]{0,40}\b(true|claimed|accepted|approved|passed)\b/i],
  ['generated_local_fixture_passed', /\bgenerated_local_fixture_passed\b[\s\S]{0,40}\b(true|claimed|accepted|approved|passed)\b/i],
]

const generatedPathPattern =
  /(^|\/)(\.local-artifacts|dist|build|coverage|screenshots?|renders?|render-output|browser-output|canvas-output|webgl-output|public-artifacts?)(\/|$)|\.(png|jpg|jpeg|gif|webp|mp4|mov|webm|svg)$/i
const failures = []

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function packageDeclares(packageJson, packageName) {
  return Boolean(
    packageJson.dependencies?.[packageName] ||
      packageJson.devDependencies?.[packageName] ||
      packageJson.optionalDependencies?.[packageName] ||
      packageJson.peerDependencies?.[packageName],
  )
}

function lockfileDeclares(packageLock, packageName) {
  return Boolean(packageLock.packages?.[`node_modules/${packageName}`] || packageLock.dependencies?.[packageName])
}

for (const path of [...requiredDocs, ...statusDocs]) {
  if (!existsSync(path)) failures.push(`missing_required_doc:${path}`)
}

const docsText = [...requiredDocs, ...statusDocs]
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')

if (!docsText.includes(expectedDecision)) failures.push('missing_expected_blocked_decision')
if (!docsText.includes(runId)) failures.push('missing_run_id')
if (!docsText.includes(proofLevel)) failures.push('missing_canonical_package_proof_level')
for (const source of expectedSources) {
  if (!docsText.includes(source)) failures.push(`missing_source:${source}`)
}
for (const sha of expectedMergeShas) {
  if (!docsText.includes(sha)) failures.push(`missing_merge_sha:${sha}`)
}
for (const text of ['TRACK_B_MEDIA_OSS_STEWARD', 'Track A', 'PR #544', 'dependency_install_from_lock']) {
  if (!docsText.includes(text)) failures.push(`missing_required_text:${text}`)
}
for (const tool of [...approvedTools, ...deferredTools]) {
  if (!docsText.includes(tool)) failures.push(`missing_tool_in_docs:${tool}`)
}

let sourceLockfile = {}
let matrix = {}
let result = {}
let outputContract = {}
let ledger = {}
try {
  sourceLockfile = readJson('docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-execution-source-lockfile.json')
  matrix = readJson('docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-execution-matrix.json')
  result = readJson('docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-execution-result.json')
  outputContract = readJson('docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-execution-output-contract.json')
  ledger = readJson('docs/open-source-tool-stack/ownership/ai-graphics-tool-evidence-ledger.json')
} catch (error) {
  failures.push(`json_parse_failed:${error.message}`)
}

for (const [name, data] of Object.entries({ sourceLockfile, matrix, result, outputContract })) {
  if (data.decision !== expectedDecision) failures.push(`${name}_decision_not_blocked:${data.decision}`)
}
if (sourceLockfile.runId !== runId || result.runId !== runId) failures.push('run_id_json_mismatch')
if (sourceLockfile.sources?.pr607?.head !== '12cfc4f29e55db7a5b105ecfc3aba21480396435') failures.push('pr607_head_unexpected')
if (sourceLockfile.sources?.pr607?.draft !== true) failures.push('pr607_draft_not_true')
if (sourceLockfile.sources?.pr607?.mergeable !== 'MERGEABLE') failures.push('pr607_mergeable_unexpected')
if (sourceLockfile.trackBOwnerRule?.ownerId !== 'TRACK_B_MEDIA_OSS_STEWARD') failures.push('trackb_owner_rule_missing')
if (sourceLockfile.trackBOwnerRule?.atlasMayClaimTrackBTools !== false) failures.push('trackb_claim_not_false')
if (sourceLockfile.trackAOwnerContext?.atlasOwnsTrackARenderExport !== false) failures.push('tracka_exclusion_not_false')

const rows = matrix.tools ?? []
if (rows.length !== approvedTools.length) failures.push(`unexpected_matrix_tool_count:${rows.length}`)
for (const toolId of approvedTools) {
  const matches = rows.filter((row) => row.toolId === toolId)
  if (matches.length !== 1) {
    failures.push(`approved_tool_not_exactly_once:${toolId}`)
    continue
  }
  const row = matches[0]
  if (row.packageName !== approvedPackages[toolId]) failures.push(`package_name_mismatch:${toolId}`)
  if (row.status !== expectedDecision) failures.push(`row_status_not_blocked:${toolId}`)
  if (row.canonicalPackageProofStatus !== proofLevel) failures.push(`proof_level_mismatch:${toolId}`)
  if (row.packageJsonDeclared !== false || row.packageLockDeclared !== false) failures.push(`dependency_gate_not_false:${toolId}`)
  for (const field of ['cpuStaticValidationExecuted', 'outputValidationPassed', 'actualToolExecutionPerformed', 'browserRuntimePerformed', 'webglCanvasRuntimePerformed', 'publicArtifactCreated', 'signedUrlCreated']) {
    if (row[field] !== false) failures.push(`row_boolean_not_false:${toolId}:${field}`)
  }
}

if (JSON.stringify(matrix.deferredTools ?? []) !== JSON.stringify(deferredTools)) failures.push('deferred_tools_mismatch')
if (JSON.stringify(result.deferredTools ?? []) !== JSON.stringify(deferredTools)) failures.push('result_deferred_tools_mismatch')
if (JSON.stringify(result.approvedTools ?? []) !== JSON.stringify(approvedTools)) failures.push('result_approved_tools_mismatch')
for (const field of requiredTrueBooleans) {
  if (matrix.booleans?.[field] !== true || result.booleans?.[field] !== true) failures.push(`required_boolean_not_true:${field}`)
}
for (const field of requiredFalseBooleans) {
  if (matrix.booleans?.[field] !== false || result.booleans?.[field] !== false) failures.push(`required_boolean_not_false:${field}`)
}
for (const field of Object.keys(outputContract.booleans ?? {})) {
  if (outputContract.booleans[field] !== false) failures.push(`output_contract_boolean_not_false:${field}`)
}

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
const packageLock = JSON.parse(readFileSync('package-lock.json', 'utf8'))
for (const [toolId, packageName] of Object.entries(approvedPackages)) {
  if (packageDeclares(packageJson, packageName)) failures.push(`package_json_unexpectedly_declares:${toolId}`)
  if (lockfileDeclares(packageLock, packageName)) failures.push(`package_lock_unexpectedly_declares:${toolId}`)
}

const ledgerExecution = ledger.latestCpuStaticSpecValidationExecution ?? {}
if (ledgerExecution.decision !== expectedDecision) failures.push('ledger_execution_decision_unexpected')
if (ledgerExecution.runId !== runId) failures.push('ledger_run_id_unexpected')
if (JSON.stringify(ledgerExecution.approvedTools ?? []) !== JSON.stringify(approvedTools)) failures.push('ledger_approved_tools_mismatch')
if (JSON.stringify(ledgerExecution.deferredTools ?? []) !== JSON.stringify(deferredTools)) failures.push('ledger_deferred_tools_mismatch')
if (ledgerExecution.runtimeReadyNow !== false || ledgerExecution.internalBetaReadyNow !== false || ledgerExecution.productionReadyNow !== false) failures.push('ledger_readiness_not_false')

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_claim:${name}:${match[0]}`)
}

try {
  const packageBefore = JSON.parse(git(['show', `${baseRef}:package.json`]))
  const packageAfter = packageJson
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    if (JSON.stringify(packageBefore[section] ?? {}) !== JSON.stringify(packageAfter[section] ?? {})) {
      failures.push(`package_dependency_section_changed:${section}`)
    }
  }
  if (packageAfter.scripts?.['ai-graphics:cpu-static-spec-validation:execute'] !== 'node scripts/validation/ai-graphics-cpu-static-spec-validation-execution.mjs') failures.push('missing_execute_script')
  if (packageAfter.scripts?.['ai-graphics:cpu-static-spec-validation:diagnostics'] !== 'node scripts/validation/ai-graphics-cpu-static-spec-validation-execution-diagnostics.mjs') failures.push('missing_diagnostics_script')
  const scriptsBefore = { ...(packageBefore.scripts ?? {}) }
  const scriptsAfter = { ...(packageAfter.scripts ?? {}) }
  delete scriptsAfter['ai-graphics:cpu-static-spec-validation:execute']
  delete scriptsAfter['ai-graphics:cpu-static-spec-validation:diagnostics']
  if (JSON.stringify(scriptsBefore) !== JSON.stringify(scriptsAfter)) failures.push('unexpected_package_script_drift')
} catch (error) {
  failures.push(`package_json_compare_failed:${error.message}`)
}

try {
  if (git(['show', `${baseRef}:package-lock.json`]) !== readFileSync('package-lock.json', 'utf8').trim()) failures.push('package_lock_changed')
} catch (error) {
  failures.push(`package_lock_compare_failed:${error.message}`)
}

const changedFiles = new Set([
  ...git(['diff', '--name-only', baseRef, '--']).split('\n').filter(Boolean),
  ...git(['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean),
])
for (const file of changedFiles) {
  if (file.includes('.local-artifacts')) failures.push(`local_artifact_tracked:${file}`)
  if (generatedPathPattern.test(file)) failures.push(`generated_output_tracked:${file}`)
}

if (failures.length > 0) {
  console.error('AI graphics CPU static spec validation execution diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('AI graphics CPU static spec validation execution diagnostics passed.')
