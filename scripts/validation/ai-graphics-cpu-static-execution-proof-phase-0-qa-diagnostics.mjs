import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef =
  process.env.AI_GRAPHICS_CPU_STATIC_EXECUTION_PROOF_PHASE0_QA_DIFF_BASE ??
  'origin/codex/rp-ai-graphics-cpu-static-execution-proof-phase-0'
const expectedDecision = 'ai_graphics_cpu_static_execution_proof_phase_0_qa_passed_with_warnings'
const expectedSourceDecision = 'ai_graphics_cpu_static_execution_proof_phase_0_completed_with_warnings'
const targetTools = ['d3', 'vega_lite', 'vega', 'satori', 'svgdotjs_svg_js', 'viz_js']
const expectedToolStatuses = {
  d3: 'proof_passed',
  vega_lite: 'proof_passed',
  vega: 'proof_passed',
  satori: 'proof_blocked_missing_runtime',
  svgdotjs_svg_js: 'proof_passed',
  viz_js: 'proof_passed',
}
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
  'ai-graphics:cpu-static-execution-proof:phase0-qa-diagnostics':
    'node scripts/validation/ai-graphics-cpu-static-execution-proof-phase-0-qa-diagnostics.mjs',
}
const requiredDocs = [
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-qa-review.md',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-qa-source-lockfile.md',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-tool-results-qa.md',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-output-contracts-qa.md',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-artifact-policy-qa.md',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-blocked-register-qa.md',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-runtime-boundary-qa.md',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-next-lane-qa.md',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-qa-decision.md',
  'docs/prompt-ai-graphics-cpu-static-execution-proof-phase-0-qa-review-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-cpu-static-execution-proof-phase-0-qa-review.md',
]
const requiredJson = [
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-qa-review.json',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-qa-source-lockfile.json',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-tool-results-qa.json',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-output-contracts-qa.json',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-artifact-policy-qa.json',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-blocked-register-qa.json',
]
const perToolQaDocs = {
  d3: 'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0/qa/d3.md',
  vega_lite: 'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0/qa/vega-lite.md',
  vega: 'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0/qa/vega.md',
  satori: 'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0/qa/satori.md',
  svgdotjs_svg_js: 'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0/qa/svgdotjs-svg-js.md',
  viz_js: 'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0/qa/viz-js.md',
}
const sourceRunnerFiles = [
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
const requiredTrueBooleans = [
  'cpuStaticExecutionProofPhase0QaCompleted',
  'sourceCpuStaticExecutionProofPhase0Accepted',
  'actualImportsQaAccepted',
  'actualFixturesQaAccepted',
  'actualOutputContractsQaAccepted',
  'proofRunnerQaAccepted',
  'localArtifactPolicyQaAccepted',
  'committedSummaryQaAccepted',
  'd3ProofQaAccepted',
  'vegaLiteProofQaAccepted',
  'vegaProofQaAccepted',
  'satoriBlockedQaAccepted',
  'svgdotjsSvgJsProofQaAccepted',
  'vizJsProofQaAccepted',
  'npmCiFromLockAccepted',
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
const sourcePrs = ['#728', '#724', '#722', '#719', '#718', '#715', '#694', '#671', '#683', '#623', '#621', '#425', '#433', '#441']
const mergeShas = [
  'a055ef045db2a6ce127a044bee6219d5933532c3',
  'dd8cb0a03d47da6463d8ca014cfb3e53b7531ea0',
  'd174de59471eacf05bed5a5511d661f2e5ba9f0f',
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

for (const file of [...requiredDocs, ...requiredJson, ...Object.values(perToolQaDocs), ...sourceRunnerFiles]) {
  if (!existsSync(file)) fail(`missing_required_file:${file}`)
}

const qa = readJson('docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-qa-review.json')
const lockfile = readJson('docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-qa-source-lockfile.json')
const toolResults = readJson('docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-tool-results-qa.json')
const outputContracts = readJson('docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-output-contracts-qa.json')
const artifactPolicy = readJson('docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-artifact-policy-qa.json')
const blockedRegister = readJson('docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-blocked-register-qa.json')
const sourceSummary = readJson('docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0.json')
const sourceFixtures = readJson('docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-fixtures.json')
const packageJson = readJson('package.json')
const packageLock = readJson('package-lock.json')
const basePackageJson = JSON.parse(git(['show', `${baseRef}:package.json`]))
const basePackageLockText = git(['show', `${baseRef}:package-lock.json`])
const basePackageLock = JSON.parse(basePackageLockText)

const docsText = requiredDocs
  .filter((file) => existsSync(file))
  .map((file) => `\n--- ${file} ---\n${readFileSync(file, 'utf8')}`)
  .join('\n')
const qaToolDocsText = Object.values(perToolQaDocs)
  .filter((file) => existsSync(file))
  .map((file) => `\n--- ${file} ---\n${readFileSync(file, 'utf8')}`)
  .join('\n')
const allQaText = `${docsText}\n${qaToolDocsText}`

if (qa?.decision !== expectedDecision) fail(`unexpected_qa_decision:${qa?.decision}`)
if (qa?.status !== 'passed_with_warnings') fail(`unexpected_qa_status:${qa?.status}`)
if (sourceSummary?.decision !== expectedSourceDecision) fail(`unexpected_source_decision:${sourceSummary?.decision}`)
if (sourceSummary?.draftPr?.number !== 728) fail(`source_pr_number_not_728:${sourceSummary?.draftPr?.number}`)
if (lockfile?.liveSourceHeadAccepted !== '585b8160ce104ff03efe181d2ce0fda29bc08f40') {
  fail(`live_source_head_not_locked:${lockfile?.liveSourceHeadAccepted}`)
}
if (lockfile?.nonBlockingStatusMetadataStaleness !== true) fail('source_metadata_staleness_not_recorded')
if (qa?.npmCiStatusAcceptedFromSource !== 'passed_from_existing_package_lock_before_phase0_runner') {
  fail(`npm_ci_status_not_accepted:${qa?.npmCiStatusAcceptedFromSource}`)
}
if (qa?.packageLockStatus !== 'unchanged') fail(`package_lock_status_not_accepted:${qa?.packageLockStatus}`)

for (const field of requiredTrueBooleans) {
  if (qa?.booleans?.[field] !== true) fail(`required_boolean_not_true:${field}`)
}
for (const field of requiredFalseBooleans) {
  if (qa?.booleans?.[field] !== false) fail(`required_boolean_not_false:${field}`)
}

const sourceTools = Array.isArray(sourceSummary?.tools) ? sourceSummary.tools : []
const qaTools = Array.isArray(qa?.tools) ? qa.tools : []
const qaToolResults = Array.isArray(toolResults?.acceptedResults) ? toolResults.acceptedResults : []
for (const toolId of targetTools) {
  const sourceTool = sourceTools.find((tool) => tool.toolId === toolId)
  const qaTool = qaTools.find((tool) => tool.toolId === toolId)
  const resultTool = qaToolResults.find((tool) => tool.toolId === toolId)
  if (!sourceTool) fail(`missing_source_tool:${toolId}`)
  if (!qaTool) fail(`missing_qa_tool:${toolId}`)
  if (!resultTool) fail(`missing_qa_result_tool:${toolId}`)
  if (!sourceFixtures?.[toolId]) fail(`missing_source_fixture:${toolId}`)
  if (sourceTool?.packageName !== expectedPackages[toolId]) fail(`source_package_mismatch:${toolId}:${sourceTool?.packageName}`)
  if (qaTool?.packageName !== expectedPackages[toolId]) fail(`qa_package_mismatch:${toolId}:${qaTool?.packageName}`)
  if (sourceTool?.status !== expectedToolStatuses[toolId]) fail(`source_tool_status_mismatch:${toolId}:${sourceTool?.status}`)
  if (qaTool?.status !== expectedToolStatuses[toolId]) fail(`qa_tool_status_mismatch:${toolId}:${qaTool?.status}`)
  if (resultTool?.observedStatus !== expectedToolStatuses[toolId]) fail(`tool_result_status_mismatch:${toolId}:${resultTool?.observedStatus}`)
  if (sourceTool?.importStatus !== 'passed') fail(`source_import_not_passed:${toolId}:${sourceTool?.importStatus}`)
  if (toolId === 'satori') {
    if (sourceTool?.fixtureStatus !== 'blocked') fail(`satori_fixture_not_blocked:${sourceTool?.fixtureStatus}`)
    if (sourceTool?.outputContractStatus !== 'blocked_contract_recorded') {
      fail(`satori_output_contract_not_blocked_recorded:${sourceTool?.outputContractStatus}`)
    }
    if (!/font fixture|font data|approved font/i.test(`${sourceTool?.blockedReason ?? ''} ${qaTool?.qaNotes ?? ''} ${allQaText}`)) {
      fail('satori_missing_approved_font_fixture_reason')
    }
  } else {
    if (sourceTool?.fixtureStatus !== 'executed') fail(`fixture_not_executed:${toolId}:${sourceTool?.fixtureStatus}`)
    if (sourceTool?.outputContractStatus !== 'checked') {
      fail(`output_contract_not_checked:${toolId}:${sourceTool?.outputContractStatus}`)
    }
  }
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
    if (sourceTool?.[field] !== false) fail(`source_tool_gate_not_false:${toolId}:${field}`)
    if (qaTool?.[field] !== false) fail(`qa_tool_gate_not_false:${toolId}:${field}`)
  }
}

for (const contract of outputContracts?.contracts ?? []) {
  if (!targetTools.includes(contract.toolId)) fail(`unexpected_contract_tool:${contract.toolId}`)
  if (contract.accepted !== true) fail(`output_contract_not_accepted:${contract.toolId}`)
}
const satoriBlock = (blockedRegister?.blockedTools ?? []).find((entry) => entry.toolId === 'satori')
if (!satoriBlock) fail('missing_satori_blocked_register_entry')
if (satoriBlock?.status !== 'proof_blocked_missing_runtime') fail(`satori_block_status_mismatch:${satoriBlock?.status}`)
if (!/font fixture|font data/i.test(satoriBlock?.reason ?? '')) fail('satori_block_reason_missing_font_fixture')

if (artifactPolicy?.policyAccepted !== true) fail('artifact_policy_not_accepted')
if (artifactPolicy?.generatedArtifactsCommitted !== false) fail('artifact_policy_generated_artifacts_not_false')
if (artifactPolicy?.localArtifactRoot !== sourceSummary?.localArtifactRoot) fail('artifact_policy_root_mismatch')
for (const artifact of artifactPolicy?.localArtifactPaths ?? []) {
  if (!artifact.startsWith('.local-artifacts/ai-graphics/cpu-static-proof/')) fail(`artifact_outside_local_policy:${artifact}`)
}

const runnerText = sourceRunnerFiles
  .filter((file) => existsSync(file))
  .map((file) => `\n--- ${file} ---\n${readFileSync(file, 'utf8')}`)
  .join('\n')
for (const [toolId, packageName] of Object.entries(expectedPackages)) {
  if (!runnerText.includes(packageName)) fail(`runner_missing_package_reference:${toolId}:${packageName}`)
}
for (const state of [
  'proof_passed',
  'proof_blocked_missing_runtime',
  'proof_blocked_missing_package',
  'proof_failed_unexpected_error',
]) {
  if (!runnerText.includes(state)) fail(`runner_missing_state:${state}`)
}
if (!runnerText.includes('.local-artifacts/ai-graphics/cpu-static-proof')) fail('runner_missing_local_artifact_root')

for (const pr of sourcePrs) {
  if (!allQaText.includes(`PR ${pr}`)) fail(`missing_pr_citation:${pr}`)
}
for (const sha of mergeShas) {
  if (!allQaText.includes(sha)) fail(`missing_merge_sha:${sha}`)
}
for (const toolId of targetTools) {
  if (!allQaText.includes(toolId)) fail(`missing_tool_text:${toolId}`)
}
if (!/jsdom/i.test(allQaText)) fail('missing_svgdotjs_jsdom_adapter_note')
if (!/metadata staleness/i.test(allQaText)) fail('missing_pr_status_metadata_staleness_note')

for (const [scriptName, command] of Object.entries(expectedScripts)) {
  if (packageJson?.scripts?.[scriptName] !== command) fail(`missing_expected_script:${scriptName}`)
}
for (const [scriptName, command] of Object.entries(basePackageJson.scripts ?? {})) {
  if (packageJson?.scripts?.[scriptName] !== command) fail(`existing_script_changed:${scriptName}`)
}
const allowedDescendantScripts = new Set([
  'ai-graphics:cpu-static-execution-proof:phase0-qa-diagnostics',
  'ai-graphics:cpu-static-execution-proof:phase0-owner-diagnostics',
  'ai-graphics:21-tool-runtime-install-readiness:diagnostics',
  'ai-graphics:gpu-import-readiness:diagnostics',
  'ai-graphics:node-runtime-proof',
  'ai-graphics:node-runtime-proof:diagnostics',
  'ai-graphics:gpu-worker-install-proof:diagnostics',
  'ai-graphics:browser-runtime-proof',
  'ai-graphics:browser-runtime-proof:diagnostics',
  'ai-graphics:satori-font-runtime-proof',
  'ai-graphics:satori-font-runtime-proof:diagnostics',
  'ai-graphics:gpu-model-install-build-targets:diagnostics',
  'ai-graphics:gpu-model-runtime-readiness-gate:diagnostics',
  'ai-graphics:tool-call-readiness:diagnostics',
  'ai-graphics:21-tool-proper-install-audit:diagnostics',
  'ai-graphics:tool-call-handoff:diagnostics',
  'ai-graphics:tool-call-plan-evaluator:diagnostics',
  'ai-graphics:beta-readiness-gate:diagnostics',
  'ai-graphics:tool-route-readiness:diagnostics',
  'ai-graphics:worker-handoff-readiness:diagnostics',
])
for (const scriptName of Object.keys(packageJson?.scripts ?? {})) {
  if (!basePackageJson.scripts?.[scriptName] && !allowedDescendantScripts.has(scriptName)) {
    fail(`unexpected_new_script:${scriptName}`)
  }
}
for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
  if (JSON.stringify(packageJson?.[section] ?? {}) !== JSON.stringify(basePackageJson?.[section] ?? {})) {
    fail(`dependency_section_changed:${section}`)
  }
}
if (JSON.stringify(packageLock) !== JSON.stringify(basePackageLock)) fail('package_lock_changed')

const trackedFiles = git(['ls-files']).split('\n').filter(Boolean)
for (const file of trackedFiles) {
  if (file.includes('.local-artifacts')) fail(`local_artifacts_tracked:${file}`)
  if (/(^|\/)(generated-media|media-output|browser-output|canvas-output|webgl-output|public-artifacts?|signed-urls?)(\/|$)/i.test(file)) {
    fail(`generated_output_path_tracked:${file}`)
  }
}
for (const artifact of artifactPolicy?.localArtifactPaths ?? []) {
  if (trackedFiles.includes(artifact)) fail(`local_artifact_tracked:${artifact}`)
}

for (const pattern of [
  /agentCanExecuteToolsNow[\\s\"`:]+true/i,
  /routeExecutionApprovedNow[\\s\"`:]+true/i,
  /workerExecutionApprovedNow[\\s\"`:]+true/i,
  /toolExecutionApprovedNow[\\s\"`:]+true/i,
  /browserWebglCanvasRuntimeApprovedNow[\\s\"`:]+true/i,
  /gpuRuntimeApprovedNow[\\s\"`:]+true/i,
  /providerRuntimeApprovedNow[\\s\"`:]+true/i,
  /publicArtifactApprovedNow[\\s\"`:]+true/i,
  /signedUrlApprovedNow[\\s\"`:]+true/i,
  /runtimeReadyNow[\\s\"`:]+true/i,
  /internalBetaReadyNow[\\s\"`:]+true/i,
  /productionReadyNow[\\s\"`:]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
  /runtime ready now/i,
  /production ready now/i,
]) {
  if (pattern.test(allQaText)) fail(`forbidden_claim:${pattern}`)
}

if (failures.length) {
  console.error('AI graphics CPU/static execution proof Phase 0 QA diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('AI graphics CPU/static execution proof Phase 0 QA diagnostics passed.')
