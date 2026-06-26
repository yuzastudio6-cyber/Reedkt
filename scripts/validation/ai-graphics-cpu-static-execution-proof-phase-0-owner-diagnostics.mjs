import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef =
  process.env.AI_GRAPHICS_CPU_STATIC_EXECUTION_PROOF_PHASE0_OWNER_DIFF_BASE ??
  'origin/codex/rp-ai-graphics-cpu-static-execution-proof-phase-0-qa-review'
const expectedDecision = 'ai_graphics_cpu_static_execution_proof_phase_0_owner_review_passed_with_warnings'
const expectedQaDecision = 'ai_graphics_cpu_static_execution_proof_phase_0_qa_passed_with_warnings'
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
  'ai-graphics:cpu-static-execution-proof:phase0-owner-diagnostics':
    'node scripts/validation/ai-graphics-cpu-static-execution-proof-phase-0-owner-diagnostics.mjs',
}
const requiredDocs = [
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-owner-review.md',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-owner-source-lockfile.md',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-tool-results-owner-review.md',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-output-contracts-owner-review.md',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-artifact-policy-owner-review.md',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-blocked-register-owner-review.md',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-runtime-boundary-owner-review.md',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-next-lane-owner-review.md',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-owner-review-decision.md',
  'docs/prompt-ai-graphics-cpu-static-execution-proof-phase-0-owner-review-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-cpu-static-execution-proof-phase-0-owner-review.md',
]
const requiredJson = [
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-owner-review.json',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-owner-source-lockfile.json',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-tool-results-owner-review.json',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-output-contracts-owner-review.json',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-artifact-policy-owner-review.json',
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-blocked-register-owner-review.json',
]
const perToolOwnerDocs = {
  d3: 'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0/owner-review/d3.md',
  vega_lite: 'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0/owner-review/vega-lite.md',
  vega: 'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0/owner-review/vega.md',
  satori: 'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0/owner-review/satori.md',
  svgdotjs_svg_js:
    'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0/owner-review/svgdotjs-svg-js.md',
  viz_js: 'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0/owner-review/viz-js.md',
}
const requiredTrueBooleans = [
  'cpuStaticExecutionProofPhase0OwnerReviewCompleted',
  'sourceCpuStaticExecutionProofPhase0QaAccepted',
  'sourceCpuStaticExecutionProofPhase0Accepted',
  'actualImportsOwnerAccepted',
  'actualFixturesOwnerAccepted',
  'actualOutputContractsOwnerAccepted',
  'proofRunnerOwnerAccepted',
  'localArtifactPolicyOwnerAccepted',
  'committedSummaryOwnerAccepted',
  'd3ProofOwnerAccepted',
  'vegaLiteProofOwnerAccepted',
  'vegaProofOwnerAccepted',
  'satoriBlockedOwnerAccepted',
  'svgdotjsSvgJsProofOwnerAccepted',
  'vizJsProofOwnerAccepted',
  'npmCiFromLockOwnerAccepted',
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
const sourcePrs = [
  '#731',
  '#728',
  '#724',
  '#722',
  '#719',
  '#718',
  '#715',
  '#694',
  '#671',
  '#683',
  '#623',
  '#621',
  '#425',
  '#433',
  '#441',
]
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

for (const file of [...requiredDocs, ...requiredJson, ...Object.values(perToolOwnerDocs)]) {
  if (!existsSync(file)) fail(`missing_required_file:${file}`)
}

const owner = readJson('docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-owner-review.json')
const lockfile = readJson('docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-owner-source-lockfile.json')
const toolResults = readJson('docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-tool-results-owner-review.json')
const outputContracts = readJson(
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-output-contracts-owner-review.json',
)
const artifactPolicy = readJson(
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-artifact-policy-owner-review.json',
)
const blockedRegister = readJson(
  'docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-blocked-register-owner-review.json',
)
const qa = readJson('docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0-qa-review.json')
const sourceSummary = readJson('docs/tool-intelligence/ai-graphics/cpu-static-execution-proof-phase-0.json')
const packageJson = readJson('package.json')
const packageLock = readJson('package-lock.json')
const basePackageJson = JSON.parse(git(['show', `${baseRef}:package.json`]))
const basePackageLock = JSON.parse(git(['show', `${baseRef}:package-lock.json`]))

const docsText = requiredDocs
  .filter((file) => existsSync(file))
  .map((file) => `\n--- ${file} ---\n${readFileSync(file, 'utf8')}`)
  .join('\n')
const ownerToolDocsText = Object.values(perToolOwnerDocs)
  .filter((file) => existsSync(file))
  .map((file) => `\n--- ${file} ---\n${readFileSync(file, 'utf8')}`)
  .join('\n')
const allOwnerText = `${docsText}\n${ownerToolDocsText}`

if (owner?.decision !== expectedDecision) fail(`unexpected_owner_decision:${owner?.decision}`)
if (owner?.status !== 'passed_with_warnings') fail(`unexpected_owner_status:${owner?.status}`)
if (qa?.decision !== expectedQaDecision) fail(`unexpected_qa_decision:${qa?.decision}`)
if (sourceSummary?.decision !== expectedSourceDecision) fail(`unexpected_source_decision:${sourceSummary?.decision}`)
if (lockfile?.liveSourceQaHeadAccepted !== '86cb23b1213297a11eee4eb19590ce68c7ed694b') {
  fail(`live_source_qa_head_not_locked:${lockfile?.liveSourceQaHeadAccepted}`)
}
if (lockfile?.liveSourceProofHeadAccepted !== '585b8160ce104ff03efe181d2ce0fda29bc08f40') {
  fail(`live_source_proof_head_not_locked:${lockfile?.liveSourceProofHeadAccepted}`)
}
if (owner?.npmCiStatusOwnerAcceptedFromSource !== 'passed_from_existing_package_lock_before_phase0_runner') {
  fail(`npm_ci_status_not_owner_accepted:${owner?.npmCiStatusOwnerAcceptedFromSource}`)
}
if (owner?.packageLockStatus !== 'unchanged') fail(`package_lock_status_not_owner_accepted:${owner?.packageLockStatus}`)

for (const field of requiredTrueBooleans) {
  if (owner?.booleans?.[field] !== true) fail(`required_boolean_not_true:${field}`)
}
for (const field of requiredFalseBooleans) {
  if (owner?.booleans?.[field] !== false) fail(`required_boolean_not_false:${field}`)
}

const ownerTools = Array.isArray(owner?.tools) ? owner.tools : []
const qaTools = Array.isArray(qa?.tools) ? qa.tools : []
const sourceTools = Array.isArray(sourceSummary?.tools) ? sourceSummary.tools : []
const ownerToolResults = Array.isArray(toolResults?.ownerReviewedResults) ? toolResults.ownerReviewedResults : []
for (const toolId of targetTools) {
  const ownerTool = ownerTools.find((tool) => tool.toolId === toolId)
  const qaTool = qaTools.find((tool) => tool.toolId === toolId)
  const sourceTool = sourceTools.find((tool) => tool.toolId === toolId)
  const resultTool = ownerToolResults.find((tool) => tool.toolId === toolId)
  if (!ownerTool) fail(`missing_owner_tool:${toolId}`)
  if (!qaTool) fail(`missing_qa_tool:${toolId}`)
  if (!sourceTool) fail(`missing_source_tool:${toolId}`)
  if (!resultTool) fail(`missing_owner_result_tool:${toolId}`)
  if (ownerTool?.packageName !== expectedPackages[toolId]) fail(`owner_package_mismatch:${toolId}:${ownerTool?.packageName}`)
  if (ownerTool?.status !== expectedToolStatuses[toolId]) fail(`owner_tool_status_mismatch:${toolId}:${ownerTool?.status}`)
  if (qaTool?.status !== expectedToolStatuses[toolId]) fail(`qa_tool_status_mismatch:${toolId}:${qaTool?.status}`)
  if (sourceTool?.status !== expectedToolStatuses[toolId]) fail(`source_tool_status_mismatch:${toolId}:${sourceTool?.status}`)
  if (resultTool?.observedStatus !== expectedToolStatuses[toolId]) {
    fail(`owner_result_status_mismatch:${toolId}:${resultTool?.observedStatus}`)
  }
  if (ownerTool?.importStatus !== 'passed') fail(`owner_import_not_passed:${toolId}:${ownerTool?.importStatus}`)
  if (toolId === 'satori') {
    if (ownerTool?.fixtureStatus !== 'blocked') fail(`satori_fixture_not_blocked:${ownerTool?.fixtureStatus}`)
    if (ownerTool?.outputContractStatus !== 'blocked_contract_recorded') {
      fail(`satori_output_contract_not_blocked_recorded:${ownerTool?.outputContractStatus}`)
    }
    if (!/font fixture|font data|approved font/i.test(`${ownerTool?.blockedReason ?? ''} ${ownerTool?.ownerNotes ?? ''} ${allOwnerText}`)) {
      fail('satori_missing_approved_font_fixture_reason')
    }
  } else {
    if (ownerTool?.fixtureStatus !== 'executed') fail(`fixture_not_executed:${toolId}:${ownerTool?.fixtureStatus}`)
    if (ownerTool?.outputContractStatus !== 'checked') {
      fail(`output_contract_not_checked:${toolId}:${ownerTool?.outputContractStatus}`)
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
    if (ownerTool?.[field] !== false) fail(`owner_tool_gate_not_false:${toolId}:${field}`)
  }
}

for (const contract of outputContracts?.contracts ?? []) {
  if (!targetTools.includes(contract.toolId)) fail(`unexpected_contract_tool:${contract.toolId}`)
  if (contract.ownerAccepted !== true) fail(`output_contract_not_owner_accepted:${contract.toolId}`)
}
const satoriBlock = (blockedRegister?.blockedTools ?? []).find((entry) => entry.toolId === 'satori')
if (!satoriBlock) fail('missing_satori_blocked_register_entry')
if (satoriBlock?.status !== 'proof_blocked_missing_runtime') fail(`satori_block_status_mismatch:${satoriBlock?.status}`)
if (!/font fixture|font data/i.test(satoriBlock?.reason ?? '')) fail('satori_block_reason_missing_font_fixture')

if (artifactPolicy?.ownerAccepted !== true) fail('artifact_policy_not_owner_accepted')
if (artifactPolicy?.generatedArtifactsCommitted !== false) fail('artifact_policy_generated_artifacts_not_false')
if (artifactPolicy?.localArtifactRoot !== sourceSummary?.localArtifactRoot) fail('artifact_policy_root_mismatch')
for (const artifact of artifactPolicy?.localArtifactPaths ?? []) {
  if (!artifact.startsWith('.local-artifacts/ai-graphics/cpu-static-proof/')) fail(`artifact_outside_local_policy:${artifact}`)
}

for (const pr of sourcePrs) {
  if (!allOwnerText.includes(`PR ${pr}`)) fail(`missing_pr_citation:${pr}`)
}
for (const sha of mergeShas) {
  if (!allOwnerText.includes(sha)) fail(`missing_merge_sha:${sha}`)
}
for (const toolId of targetTools) {
  if (!allOwnerText.includes(toolId)) fail(`missing_tool_text:${toolId}`)
}
if (!/jsdom/i.test(allOwnerText)) fail('missing_svgdotjs_jsdom_adapter_note')
if (!/metadata staleness/i.test(allOwnerText)) fail('missing_status_metadata_staleness_note')
if (!allOwnerText.includes('.local-artifacts/ai-graphics/cpu-static-proof/')) fail('missing_local_artifact_policy_text')

for (const [scriptName, command] of Object.entries(expectedScripts)) {
  if (packageJson?.scripts?.[scriptName] !== command) fail(`missing_expected_script:${scriptName}`)
}
for (const [scriptName, command] of Object.entries(basePackageJson.scripts ?? {})) {
  if (packageJson?.scripts?.[scriptName] !== command) fail(`existing_script_changed:${scriptName}`)
}
const allowedDescendantScripts = new Set([
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
  'ai-graphics:model-weight-manifest-readiness:diagnostics',
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
  /agentCanExecuteToolsNow[\s"`:]+true/i,
  /routeExecutionApprovedNow[\s"`:]+true/i,
  /workerExecutionApprovedNow[\s"`:]+true/i,
  /toolExecutionApprovedNow[\s"`:]+true/i,
  /browserWebglCanvasRuntimeApprovedNow[\s"`:]+true/i,
  /gpuRuntimeApprovedNow[\s"`:]+true/i,
  /providerRuntimeApprovedNow[\s"`:]+true/i,
  /publicArtifactApprovedNow[\s"`:]+true/i,
  /signedUrlApprovedNow[\s"`:]+true/i,
  /runtimeReadyNow[\s"`:]+true/i,
  /internalBetaReadyNow[\s"`:]+true/i,
  /productionReadyNow[\s"`:]+true/i,
  /dry_run_passed/i,
  /generated_local_fixture_passed/i,
  /runtime ready now/i,
  /production ready now/i,
]) {
  if (pattern.test(allOwnerText)) fail(`forbidden_claim:${pattern}`)
}

if (failures.length) {
  console.error('AI graphics CPU/static execution proof Phase 0 owner diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('AI graphics CPU/static execution proof Phase 0 owner diagnostics passed.')
