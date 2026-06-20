import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-draft-package-proof-runtime-boundary-owner-qa-review'
const expectedDecision = 'ai_graphics_cpu_static_spec_validation_approval_passed_with_warnings'
const allowedDecisions = new Set([
  expectedDecision,
  'ai_graphics_cpu_static_spec_validation_approval_passed',
  'blocked_pending_ai_graphics_cpu_static_scope_review',
  'blocked_pending_ai_graphics_cpu_static_fixture_plan',
  'blocked_pending_ai_graphics_cpu_static_output_contract',
  'blocked_pending_ai_graphics_runtime_boundary_conflict',
])

const requiredDocs = [
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-approval.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-approval-source-lockfile.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-approval-matrix.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-approval-d3.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-approval-vega-lite.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-approval-vega.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-approval-satori.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-approval-svgdotjs-svg-js.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-approval-viz-js.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-fixture-plan.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-output-contract.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-blocked-use-register.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-next-lane-recommendation.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-approval-decision.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-approval-source-lockfile.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-approval-matrix.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-fixture-plan.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-output-contract.json',
  'docs/prompt-ai-graphics-cpu-static-spec-validation-approval-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-cpu-static-spec-validation-approval.md',
]

const statusDocs = [
  'docs/open-source-tool-stack/ownership/ai-graphics-next-proof-plan.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-tool-evidence-ledger.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-tool-evidence-ledger.json',
  'docs/production-beta-readiness-scorecard.md',
]

const expectedSources = [
  'PR #604',
  'PR #602',
  'PR #598',
  'PR #594',
  'PR #589',
  'PR #585',
  'PR #582',
  'PR #425',
  'PR #433',
  'PR #441',
  'PR #543',
  'PR #536',
  'PR #416',
  'PR #542',
  'PR #544',
]
const expectedOpenDraftSources = ['pr604', 'pr602', 'pr598', 'pr594', 'pr589', 'pr585', 'pr582', 'pr543', 'pr536']
const expectedMergedSources = ['pr425', 'pr433', 'pr441', 'pr416', 'pr542', 'pr544']
const expectedMergeShas = {
  pr425: 'a055ef045db2a6ce127a044bee6219d5933532c3',
  pr433: 'dd8cb0a03d47da6463d8ca014cfb3e53b7531ea0',
  pr441: 'd174de59471eacf05bed5a5511d661f2e5ba9f0f',
}
const approvedTools = ['d3', 'vega_lite', 'vega', 'satori', 'svgdotjs_svg_js', 'viz_js']
const excludedTools = ['echarts', 'lottie_web', 'animejs', 'three_js', 'pixi_js', 'konva', 'babylonjs']
const expectedProof = 'canonical_merged_package_import_static_fixture_proof'
const expectedNextPrompt = 'AI_GRAPHICS_DRAFT_PACKAGE_PROOF_CPU_STATIC_SPEC_VALIDATION_EXECUTION'

const requiredTrueBooleans = [
  'cpuStaticSpecValidationApprovalCompleted',
  'sourceRuntimeBoundaryOwnerQaAccepted',
  'canonicalPackageProofAccepted',
  'all6CpuStaticToolsApprovedForFutureValidation',
  'd3FutureStaticValidationApproved',
  'vegaLiteFutureStaticValidationApproved',
  'vegaFutureStaticValidationApproved',
  'satoriFutureStaticValidationApproved',
  'svgdotjsFutureStaticValidationApproved',
  'vizJsFutureStaticValidationApproved',
]

const requiredFalseBooleans = [
  'staticValidationExecutionApprovedNow',
  'staticFixtureExecutionApprovedNow',
  'agentExecutionAllowedNow',
  'browserRuntimeApprovedNow',
  'webglCanvasRuntimeApprovedNow',
  'toolRouteExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'providerRuntimeApprovedNow',
  'publicArtifactApprovedNow',
  'signedUrlApprovedNow',
  'canonicalRuntimePromotionApproved',
  'canonicalE2ePromotionApproved',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'importSmokeExecutedNow',
  'syntheticFixtureExecutedNow',
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
]

const perToolFalseFields = [
  'staticValidationApprovedNow',
  'staticFixtureExecutionApprovedNow',
  'browserRuntimeRequired',
  'webglCanvasRequired',
  'toolRouteExecutionApprovedNow',
  'workerExecutionApprovedNow',
  'publicArtifactApprovedNow',
  'signedUrlApprovedNow',
]

const forbiddenPatterns = [
  ['static_validation_now', /\bstaticValidationExecutionApprovedNow\b\s*[:=|]\s*`?true`?/i],
  ['static_fixture_now', /\bstaticFixtureExecutionApprovedNow\b\s*[:=|]\s*`?true`?/i],
  ['agent_execution', /\bagentExecutionAllowedNow\b\s*[:=|]\s*`?true`?/i],
  ['runtime_ready', /\bruntimeReadyNow\b\s*[:=|]\s*`?true`?/i],
  ['runtime_promotion', /\bcanonicalRuntimePromotionApproved\b\s*[:=|]\s*`?true`?/i],
  ['e2e_promotion', /\bcanonicalE2ePromotionApproved\b\s*[:=|]\s*`?true`?/i],
  ['internal_beta_ready', /\binternalBetaReadyNow\b\s*[:=|]\s*`?true`?/i],
  ['external_beta_ready', /\bexternalBetaReadyNow\b\s*[:=|]\s*`?true`?/i],
  ['production_ready', /\bproductionReadyNow\b\s*[:=|]\s*`?true`?/i],
  ['gpu_runtime', /\bgpuRuntimePerformed\b\s*[:=|]\s*`?true`?/i],
  ['model_download', /\bmodelWeightDownloadPerformed\b\s*[:=|]\s*`?true`?/i],
  ['browser_runtime', /\bbrowser(WebglCanvas)?Runtime(ApprovedNow|Performed)\b\s*[:=|]\s*`?true`?/i],
  ['execution', /\b(toolExecutionPerformed|workerExecutionPerformed|routeExecutionPerformed|providerRuntimePerformed)\b\s*[:=|]\s*`?true`?/i],
  ['storage_or_public_artifact', /\b(supabaseMutationPerformed|sqlExecutionPerformed|gcsUploadPerformed|publicArtifactCreated|signedUrlCreated|publicArtifactApprovedNow|signedUrlApprovedNow)\b\s*[:=|]\s*`?true`?/i],
  ['dry_run_passed', /\bdry_run_passed\b[\s\S]{0,40}\b(true|claimed|accepted|approved|passed)\b/i],
  ['generated_local_fixture_passed', /\bgenerated_local_fixture_passed\b[\s\S]{0,40}\b(true|claimed|accepted|approved|passed)\b/i],
]

const generatedPathPattern = /(^|\/)(\.local-artifacts|dist|build|coverage|screenshots?|renders?|render-output|browser-output|canvas-output|webgl-output|public-artifacts?)(\/|$)|\.(png|jpg|jpeg|gif|webp|mp4|mov|webm)$/i
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

function sameArray(actual, expected) {
  return JSON.stringify(actual ?? []) === JSON.stringify(expected)
}

for (const path of [...requiredDocs, ...statusDocs]) {
  if (!existsSync(path)) failures.push(`missing_required_doc:${path}`)
}

const docsText = [...requiredDocs, ...statusDocs]
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')

if (!docsText.includes(expectedDecision)) failures.push('missing_expected_decision')
if (!docsText.includes(expectedProof)) failures.push('missing_expected_proof_level')
if (!docsText.includes(expectedNextPrompt)) failures.push('missing_next_prompt')
for (const source of expectedSources) {
  if (!docsText.includes(source)) failures.push(`missing_source:${source}`)
}
for (const sha of Object.values(expectedMergeShas)) {
  if (!docsText.includes(sha)) failures.push(`missing_merge_sha:${sha}`)
}
for (const requiredText of ['TRACK_B_MEDIA_OSS_STEWARD', 'Track A', 'PR #544', 'PR #542']) {
  if (!docsText.includes(requiredText)) failures.push(`missing_required_text:${requiredText}`)
}
for (const tool of approvedTools) {
  if (!docsText.includes(tool)) failures.push(`missing_approved_tool_in_docs:${tool}`)
}
for (const tool of excludedTools) {
  if (!docsText.includes(tool)) failures.push(`missing_excluded_tool_in_docs:${tool}`)
}

let sourceLockfile = {}
let matrix = {}
let fixturePlan = {}
let outputContract = {}
let ledger = {}
try {
  sourceLockfile = readJson('docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-approval-source-lockfile.json')
  matrix = readJson('docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-approval-matrix.json')
  fixturePlan = readJson('docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-fixture-plan.json')
  outputContract = readJson('docs/open-source-tool-stack/ownership/ai-graphics-cpu-static-spec-validation-output-contract.json')
  ledger = readJson('docs/open-source-tool-stack/ownership/ai-graphics-tool-evidence-ledger.json')
} catch (error) {
  failures.push(`json_parse_failed:${error.message}`)
}

for (const [name, data] of Object.entries({ sourceLockfile, matrix, fixturePlan, outputContract })) {
  if (!allowedDecisions.has(data.decision)) failures.push(`unexpected_${name}_decision:${data.decision}`)
  if (data.decision !== expectedDecision) failures.push(`${name}_decision_not_expected`)
}

for (const source of expectedOpenDraftSources) {
  const row = sourceLockfile.sources?.[source]
  if (row?.state !== 'open' || row?.draft !== true || row?.mergeable !== 'MERGEABLE') failures.push(`open_draft_source_state_unexpected:${source}`)
}
for (const source of expectedMergedSources) {
  if (sourceLockfile.sources?.[source]?.state !== 'merged') failures.push(`source_not_merged:${source}`)
}
for (const [source, sha] of Object.entries(expectedMergeShas)) {
  if (sourceLockfile.sources?.[source]?.mergeSha !== sha) failures.push(`source_merge_sha_mismatch:${source}`)
}
if (sourceLockfile.trackBOwnerRule?.ownerId !== 'TRACK_B_MEDIA_OSS_STEWARD') failures.push('missing_trackb_owner_rule')
if (sourceLockfile.trackBOwnerRule?.atlasMayClaimTrackBTools !== false) failures.push('trackb_claim_exclusion_not_false')
if (sourceLockfile.trackAOwnerContext?.atlasOwnsTrackARenderExport !== false) failures.push('tracka_exclusion_not_false')

const rows = matrix.approvedTools ?? []
if (rows.length !== approvedTools.length) failures.push(`unexpected_approved_tool_count:${rows.length}`)
for (const expectedTool of approvedTools) {
  const matches = rows.filter((row) => row.toolId === expectedTool)
  if (matches.length !== 1) {
    failures.push(`approved_tool_not_exactly_once:${expectedTool}`)
    continue
  }
  const row = matches[0]
  if (row.canonicalPackageProofStatus !== expectedProof) failures.push(`unexpected_proof_status:${expectedTool}`)
  if (row.futureStaticValidationApproved !== true) failures.push(`future_static_validation_not_true:${expectedTool}`)
  if (!row.inputFixtureType) failures.push(`missing_fixture_type:${expectedTool}`)
  if (!row.expectedOutputType) failures.push(`missing_expected_output_type:${expectedTool}`)
  if (!row.outputValidationRule) failures.push(`missing_output_validation_rule:${expectedTool}`)
  if (row.nextProofMilestone !== 'CPU/static spec validation execution') failures.push(`unexpected_next_milestone:${expectedTool}`)
  for (const field of perToolFalseFields) {
    if (row[field] !== false) failures.push(`tool_field_not_false:${expectedTool}:${field}`)
  }
}

const excludedRows = matrix.excludedTools ?? []
if (excludedRows.length !== excludedTools.length) failures.push(`unexpected_excluded_tool_count:${excludedRows.length}`)
for (const expectedTool of excludedTools) {
  const matches = excludedRows.filter((row) => row.toolId === expectedTool)
  if (matches.length !== 1) {
    failures.push(`excluded_tool_not_exactly_once:${expectedTool}`)
    continue
  }
  const row = matches[0]
  if (row.futureStaticValidationApproved !== false) failures.push(`excluded_tool_future_static_not_false:${expectedTool}`)
  if (row.deferred !== true) failures.push(`excluded_tool_not_deferred:${expectedTool}`)
}
for (const tool of excludedTools) {
  if (rows.some((row) => row.toolId === tool)) failures.push(`excluded_tool_in_approved_matrix:${tool}`)
}

for (const field of requiredTrueBooleans) {
  if (matrix.booleans?.[field] !== true) failures.push(`required_boolean_not_true:${field}`)
}
for (const field of requiredFalseBooleans) {
  if (matrix.booleans?.[field] !== false) failures.push(`required_boolean_not_false:${field}`)
}
if (matrix.nextPromptRecommendation !== expectedNextPrompt) failures.push('matrix_next_prompt_unexpected')

if (fixturePlan.executionApprovedNow !== false) failures.push('fixture_plan_execution_not_false')
if (!sameArray((fixturePlan.tools ?? []).map((row) => row.toolId), approvedTools)) failures.push('fixture_plan_tools_mismatch')
if (!sameArray(fixturePlan.deferredTools, excludedTools)) failures.push('fixture_plan_deferred_tools_mismatch')
for (const row of fixturePlan.tools ?? []) {
  if (row.domOrBrowserRequired !== false) failures.push(`fixture_dom_browser_not_false:${row.toolId}`)
}
for (const field of ['staticFixtureExecutionApprovedNow', 'browserRuntimeApprovedNow', 'webglCanvasRuntimeApprovedNow', 'publicArtifactApprovedNow', 'signedUrlApprovedNow']) {
  if (fixturePlan[field] !== false) failures.push(`fixture_plan_boolean_not_false:${field}`)
}

for (const output of ['generated_svg', 'generated_image', 'generated_media', 'browser_output', 'webgl_canvas_output', 'public_artifact', 'signed_url']) {
  if (!outputContract.disallowedCurrentOutputs?.includes(output)) failures.push(`output_contract_missing_disallowed:${output}`)
}
for (const field of Object.keys(outputContract.booleans ?? {})) {
  if (outputContract.booleans[field] !== false) failures.push(`output_contract_boolean_not_false:${field}`)
}

const ledgerApproval = ledger.latestCpuStaticSpecValidationApproval ?? {}
if (ledgerApproval.decision !== expectedDecision) failures.push('ledger_cpu_static_decision_unexpected')
if (!sameArray(ledgerApproval.approvedFutureStaticValidationTools, approvedTools)) failures.push('ledger_approved_tools_mismatch')
if (!sameArray(ledgerApproval.deferredTools, excludedTools)) failures.push('ledger_deferred_tools_mismatch')
if (ledger.nextPrompt !== expectedNextPrompt) failures.push('ledger_next_prompt_unexpected')
for (const field of ['staticValidationExecutionApprovedNow', 'staticFixtureExecutionApprovedNow', 'agentExecutionAllowedNow', 'toolRouteExecutionApprovedNow', 'workerExecutionApprovedNow', 'browserRuntimeApprovedNow', 'webglCanvasRuntimeApprovedNow', 'publicArtifactApprovedNow', 'signedUrlApprovedNow', 'runtimeReadyNow', 'internalBetaReadyNow', 'externalBetaReadyNow', 'productionReadyNow']) {
  if (ledgerApproval[field] !== false) failures.push(`ledger_boolean_not_false:${field}`)
}

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_claim:${name}:${match[0]}`)
}

try {
  const packageBefore = JSON.parse(git(['show', `${baseRef}:package.json`]))
  const packageAfter = JSON.parse(readFileSync('package.json', 'utf8'))
  for (const section of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    if (JSON.stringify(packageBefore[section] ?? {}) !== JSON.stringify(packageAfter[section] ?? {})) {
      failures.push(`package_dependency_section_changed:${section}`)
    }
  }
  const expectedScript = 'node scripts/validation/ai-graphics-cpu-static-spec-validation-approval-diagnostics.mjs'
  if (packageAfter.scripts?.['ai-graphics:cpu-static-spec-validation-approval:diagnostics'] !== expectedScript) {
    failures.push('missing_package_script')
  }
  const scriptsBefore = { ...(packageBefore.scripts ?? {}) }
  const scriptsAfter = { ...(packageAfter.scripts ?? {}) }
  delete scriptsAfter['ai-graphics:cpu-static-spec-validation-approval:diagnostics']
  delete scriptsAfter['ai-graphics:cpu-static-spec-validation:execute']
  delete scriptsAfter['ai-graphics:cpu-static-spec-validation:diagnostics']
  delete scriptsAfter['ai-graphics:cpu-static-spec-validation-dependency-reconciliation:diagnostics']
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
  console.error('AI graphics CPU static spec validation approval diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('AI graphics CPU static spec validation approval diagnostics passed.')
