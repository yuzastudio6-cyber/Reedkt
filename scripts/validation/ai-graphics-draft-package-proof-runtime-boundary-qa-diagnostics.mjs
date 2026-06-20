import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-draft-package-proof-runtime-boundary-review'
const expectedDecision = 'ai_graphics_draft_package_proof_runtime_boundary_qa_passed_with_warnings'
const allowedDecisions = new Set([
  expectedDecision,
  'ai_graphics_draft_package_proof_runtime_boundary_qa_passed',
  'blocked_pending_ai_graphics_runtime_boundary_matrix_qa',
  'blocked_pending_ai_graphics_browser_webgl_boundary_qa',
  'blocked_pending_ai_graphics_tool_route_boundary_qa',
  'blocked_pending_ai_graphics_worker_boundary_qa',
])

const requiredDocs = [
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-qa-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-qa-source-lockfile.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-qa-matrix.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-cpu-static-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-browser-chart-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-animation-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-webgl-canvas-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-tool-route-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-worker-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-agent-selection-status-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-blocked-use-register-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-next-proof-milestones-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-qa-decision.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-qa.md',
  'docs/prompt-ai-graphics-draft-package-proof-runtime-boundary-qa-review-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-draft-package-proof-runtime-boundary-qa-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-qa-matrix.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-qa-source-lockfile.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-agent-selection-status-qa.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-next-proof-milestones-qa.json',
]

const expectedSources = ['PR #594', 'PR #589', 'PR #585', 'PR #582', 'PR #425', 'PR #433', 'PR #441', 'PR #543', 'PR #536', 'PR #416', 'PR #542', 'PR #544']
const expectedMergeShas = {
  pr425: 'a055ef045db2a6ce127a044bee6219d5933532c3',
  pr433: 'dd8cb0a03d47da6463d8ca014cfb3e53b7531ea0',
  pr441: 'd174de59471eacf05bed5a5511d661f2e5ba9f0f',
}
const expectedTools = [
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
const expectedProof = 'canonical_merged_package_import_static_fixture_proof'
const expectedRuntimeStatus = 'blocked_pending_runtime_approval'
const expectedLanes = {
  cpu_static_spec_validation_later: ['d3', 'vega_lite', 'vega', 'satori', 'svgdotjs_svg_js', 'viz_js'],
  browser_chart_runtime_later: ['echarts'],
  animation_manifest_runtime_later: ['lottie_web', 'animejs'],
  browser_webgl_canvas_sandbox_later: ['three_js', 'pixi_js', 'konva', 'babylonjs'],
  tool_route_metadata_handoff_later: expectedTools,
  worker_metadata_handoff_later: expectedTools,
  runtime_blocked_now: expectedTools,
}

const requiredTrueBooleans = [
  'runtimeBoundaryQaCompleted',
  'runtimeBoundaryReviewAccepted',
  'all13PackageProofToolsQaReviewed',
  'canonicalPackageProofAccepted',
  'agentSelectionMetadataAccepted',
]

const requiredFalseBooleans = [
  'agentExecutionAllowedNow',
  'cpuStaticRuntimeApprovedNow',
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
  'agentCanExecuteNowAccepted',
  'cpuStaticAllowedNowAccepted',
  'browserRuntimeAllowedNowAccepted',
  'webglCanvasRuntimeAllowedNowAccepted',
  'toolRouteExecutionAllowedNowAccepted',
  'workerExecutionAllowedNowAccepted',
  'publicArtifactAllowedNowAccepted',
  'signedUrlAllowedNowAccepted',
]

const forbiddenPatterns = [
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

for (const path of requiredDocs) {
  if (!existsSync(path)) failures.push(`missing_required_doc:${path}`)
}

const docsText = requiredDocs
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')

if (!docsText.includes(expectedDecision)) failures.push('missing_expected_decision')
if (!docsText.includes(expectedProof)) failures.push('missing_expected_proof_level')
if (!docsText.includes(expectedRuntimeStatus)) failures.push('missing_runtime_boundary_status')
for (const source of expectedSources) {
  if (!docsText.includes(source)) failures.push(`missing_source:${source}`)
}
for (const sha of Object.values(expectedMergeShas)) {
  if (!docsText.includes(sha)) failures.push(`missing_merge_sha:${sha}`)
}
for (const requiredText of ['TRACK_B_MEDIA_OSS_STEWARD', 'Track A', 'PR #544', 'PR #542']) {
  if (!docsText.includes(requiredText)) failures.push(`missing_required_text:${requiredText}`)
}
for (const tool of expectedTools) {
  if (!docsText.includes(tool)) failures.push(`missing_tool_in_docs:${tool}`)
}
for (const lane of Object.keys(expectedLanes)) {
  if (!docsText.includes(lane)) failures.push(`missing_lane_in_docs:${lane}`)
}

let sourceLockfile = {}
let matrix = {}
let agentSelection = {}
let nextMilestones = {}
try {
  sourceLockfile = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-qa-source-lockfile.json')
  matrix = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-qa-matrix.json')
  agentSelection = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-agent-selection-status-qa.json')
  nextMilestones = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-next-proof-milestones-qa.json')
} catch (error) {
  failures.push(`json_parse_failed:${error.message}`)
}

for (const [name, data] of Object.entries({ sourceLockfile, matrix, agentSelection, nextMilestones })) {
  if (!allowedDecisions.has(data.decision)) failures.push(`unexpected_${name}_decision:${data.decision}`)
  if (data.decision !== expectedDecision) failures.push(`${name}_decision_not_expected`)
}

const tools = matrix.tools ?? []
if (tools.length !== expectedTools.length) failures.push(`unexpected_tool_count:${tools.length}`)
for (const expectedTool of expectedTools) {
  const rows = tools.filter((row) => row.toolId === expectedTool)
  if (rows.length !== 1) {
    failures.push(`tool_not_exactly_once:${expectedTool}`)
    continue
  }
  const row = rows[0]
  if (row.canonicalPackageProofStatus !== expectedProof) failures.push(`unexpected_proof_status:${expectedTool}`)
  if (row.runtimeBoundaryStatusAccepted !== expectedRuntimeStatus) failures.push(`unexpected_runtime_boundary_status:${expectedTool}`)
  if (row.agentCanSelectForPlanningAccepted !== true) failures.push(`agent_select_not_true:${expectedTool}`)
  for (const field of perToolFalseFields) {
    if (row[field] !== false) failures.push(`tool_field_not_false:${expectedTool}:${field}`)
  }
  for (const [lane, laneTools] of Object.entries(expectedLanes)) {
    if (laneTools.includes(expectedTool) && !row.futureRuntimeLaneAccepted?.includes(lane)) failures.push(`tool_missing_lane:${expectedTool}:${lane}`)
  }
}

for (const [lane, laneTools] of Object.entries(expectedLanes)) {
  const actualTools = tools.filter((row) => row.futureRuntimeLaneAccepted?.includes(lane)).map((row) => row.toolId)
  if (!sameArray(actualTools, laneTools)) failures.push(`matrix_lane_tools_mismatch:${lane}`)
  if (!sameArray(nextMilestones.futureRuntimeLanes?.[lane], laneTools)) failures.push(`milestone_lane_tools_mismatch:${lane}`)
}

for (const [source, sha] of Object.entries(expectedMergeShas)) {
  if (sourceLockfile.sources?.[source]?.state !== 'merged') failures.push(`source_not_merged:${source}`)
  if (sourceLockfile.sources?.[source]?.mergeSha !== sha) failures.push(`source_merge_sha_mismatch:${source}`)
}
for (const source of ['pr594', 'pr589', 'pr585', 'pr582', 'pr543', 'pr536']) {
  if (sourceLockfile.sources?.[source]?.state !== 'open' || sourceLockfile.sources?.[source]?.draft !== true) failures.push(`open_draft_source_state_unexpected:${source}`)
}
for (const source of ['pr416', 'pr542', 'pr544']) {
  if (sourceLockfile.sources?.[source]?.state !== 'merged') failures.push(`context_source_not_merged:${source}`)
}

if (sourceLockfile.trackBOwnerRule?.ownerId !== 'TRACK_B_MEDIA_OSS_STEWARD') failures.push('missing_trackb_owner_rule')
if (sourceLockfile.trackBOwnerRule?.atlasMayClaimTrackBTools !== false) failures.push('trackb_claim_exclusion_not_false')
if (sourceLockfile.trackAOwnerContext?.atlasOwnsTrackARenderExport !== false) failures.push('tracka_exclusion_not_false')

if (agentSelection.agentSelectionMetadataAccepted !== true) failures.push('agent_selection_metadata_not_true')
if (agentSelection.agentExecutionAllowedNow !== false) failures.push('agent_execution_not_false')
if (agentSelection.currentAllowedUse !== 'canonical_package_import_static_fixture_proof_only') failures.push('unexpected_current_allowed_use')
if (!sameArray(agentSelection.tools, expectedTools)) failures.push('agent_selection_tools_mismatch')

for (const field of requiredTrueBooleans) {
  if (matrix.booleans?.[field] !== true) failures.push(`required_boolean_not_true:${field}`)
}
for (const field of requiredFalseBooleans) {
  if (matrix.booleans?.[field] !== false) failures.push(`required_boolean_not_false:${field}`)
}
for (const field of ['runtimeReadyNow', 'internalBetaReadyNow', 'externalBetaReadyNow', 'productionReadyNow', 'agentExecutionAllowedNow']) {
  if (nextMilestones[field] !== false) failures.push(`milestone_boolean_not_false:${field}`)
}
if (nextMilestones.agentSelectionMetadataAccepted !== true) failures.push('milestone_agent_selection_not_true')

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
  const expectedScript = 'node scripts/validation/ai-graphics-draft-package-proof-runtime-boundary-qa-diagnostics.mjs'
  if (packageAfter.scripts?.['ai-graphics:draft-package-proof-runtime-boundary-qa:diagnostics'] !== expectedScript) {
    failures.push('missing_package_script')
  }
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
  console.error('AI graphics runtime boundary QA diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('AI graphics runtime boundary QA diagnostics passed.')
