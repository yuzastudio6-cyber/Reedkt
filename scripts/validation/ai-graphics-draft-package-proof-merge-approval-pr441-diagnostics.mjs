import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-draft-package-proof-merge-execution-pr433'
const expectedDecision = 'ai_graphics_draft_package_proof_pr441_merge_approval_passed_with_warnings'
const allowedDecisions = new Set([
  expectedDecision,
  'ai_graphics_draft_package_proof_pr441_merge_approval_passed',
  'blocked_pending_pr425_post_merge_review',
  'blocked_pending_pr433_post_merge_review',
  'blocked_pending_pr441_not_open',
  'blocked_pending_pr441_not_mergeable_clean',
  'blocked_pending_pr441_head_changed_review',
  'blocked_pending_pr441_scope_mismatch',
  'blocked_pending_pr441_package_lock_risk_review',
  'blocked_pending_pr441_merge_approval_scope_review',
])

const requiredDocs = [
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-approval-pr441.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-approval-pr441-source-lockfile.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-approval-pr441-matrix.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-pr425-post-merge-review-pr441.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-pr433-post-merge-review-pr441.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-pr441-merge-approval.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-approval-stack-order-pr441.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-approval-package-lock-risk-pr441.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-approval-conflict-risk-pr441.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-approval-boundary-review-pr441.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-approval-blocked-use-register-pr441.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-approval-decision-pr441.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-approval-next-lane-recommendation-pr441.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-approval-pr441-matrix.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-approval-pr441-source-lockfile.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-approval-stack-order-pr441.json',
  'docs/prompt-ai-graphics-draft-package-proof-merge-approval-pr441-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-draft-package-proof-merge-approval-pr441.md',
]

const expectedSources = ['PR #579', 'PR #433', 'PR #425', 'PR #576', 'PR #573', 'PR #569', 'PR #568', 'PR #441', 'PR #543', 'PR #542', 'PR #544']
const pr425Tools = ['d3', 'echarts', 'vega_lite', 'vega']
const pr433Tools = ['satori', 'svgdotjs_svg_js', 'viz_js', 'lottie_web']
const pr441Tools = ['animejs', 'three_js', 'pixi_js', 'konva', 'babylonjs']
const expectedOrder = [425, 433, 441]
const pr425MergeSha = 'a055ef045db2a6ce127a044bee6219d5933532c3'
const pr433MergeSha = 'dd8cb0a03d47da6463d8ca014cfb3e53b7531ea0'

const requiredTrueBooleans = [
  'pr441MergeApprovalCompleted',
  'pr425PostMergeStateChecked',
  'pr425MergeShaRecorded',
  'pr433PostMergeStateChecked',
  'pr433MergeShaRecorded',
  'pr441LiveStateChecked',
  'pr441OpenNonDraftClean',
  'pr441MergeApprovedForFutureExecution',
  'stackOrderAccepted',
]

const requiredFalseBooleans = [
  'canonicalPromotionApprovedNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'pr441MergedNow',
  'prRetargetedNow',
  'prClosedNow',
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
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
]

const forbiddenPatterns = [
  ['pr441_merged_now', /\b(pr441MergedNow|prMergedNow|sourcePrsMergedNow)\b\s*[:=]\s*`?true`?/i],
  ['pr_closed_or_retargeted', /\b(prClosedNow|prRetargetedNow)\b\s*[:=]\s*`?true`?/i],
  ['canonical_promotion_now', /\b(canonicalPromotionApprovedNow|readyForCanonicalPromotion)\b\s*[:=]\s*`?true`?/i],
  ['all_21_installed', /\ball\s+21\s+tools\s+(?:are\s+)?installed\b/i],
  ['e2e_proof_claim', /\bE2E[- ]proof\b\s*[:=]\s*`?(true|claimed|approved|passed)`?/i],
  ['runtime_ready', /\bruntimeReadyNow\b\s*[:=]\s*`?true`?/i],
  ['beta_ready', /\b(internalBetaReadyNow|externalBetaReadyNow)\b\s*[:=]\s*`?true`?/i],
  ['production_ready', /\bproductionReadyNow\b\s*[:=]\s*`?true`?/i],
  ['gpu_runtime', /\bgpuRuntimePerformed\b\s*[:=]\s*`?true`?/i],
  ['browser_runtime', /\bbrowserWebglCanvasRuntimePerformed\b\s*[:=]\s*`?true`?/i],
  ['tool_worker_route_provider', /\b(toolExecutionPerformed|workerExecutionPerformed|routeExecutionPerformed|providerRuntimePerformed)\b\s*[:=]\s*`?true`?/i],
  ['supabase_gcs_public_signed', /\b(supabaseMutationPerformed|gcsUploadPerformed|publicArtifactCreated|signedUrlCreated)\b\s*[:=]\s*`?true`?/i],
  ['dry_run_passed', /\bdry_run_passed\b[\s\S]{0,40}\b(true|claimed|accepted|approved)\b/i],
  ['generated_local_fixture_passed', /\bgenerated_local_fixture_passed\b[\s\S]{0,40}\b(true|claimed|accepted|approved)\b/i],
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

for (const path of requiredDocs) {
  if (!existsSync(path)) failures.push(`missing_required_doc:${path}`)
}

const docsText = requiredDocs
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')

if (!docsText.includes(expectedDecision)) failures.push('missing_expected_decision')
for (const source of expectedSources) {
  if (!docsText.includes(source)) failures.push(`missing_source:${source}`)
}
for (const required of ['TRACK_B_MEDIA_OSS_STEWARD', 'Track A', 'PR #425 -> PR #433 -> PR #441', 'AI_GRAPHICS_DRAFT_PACKAGE_PROOF_MERGE_EXECUTION_PR441', pr425MergeSha, pr433MergeSha]) {
  if (!docsText.includes(required)) failures.push(`missing_required_text:${required}`)
}
for (const tool of [...pr425Tools, ...pr433Tools, ...pr441Tools]) {
  if (!docsText.includes(tool)) failures.push(`missing_tool_in_docs:${tool}`)
}

let sourceLockfile = {}
let matrix = {}
let stackOrder = {}
try {
  sourceLockfile = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-approval-pr441-source-lockfile.json')
  matrix = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-approval-pr441-matrix.json')
  stackOrder = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-approval-stack-order-pr441.json')
} catch (error) {
  failures.push(`json_parse_failed:${error.message}`)
}

for (const [name, data] of Object.entries({ sourceLockfile, matrix, stackOrder })) {
  if (!allowedDecisions.has(data.decision)) failures.push(`unexpected_${name}_decision:${data.decision}`)
  if (data.decision !== expectedDecision) failures.push(`${name}_decision_not_expected`)
}

const sourcePrs = matrix.sourcePrs ?? []
const actualOrder = sourcePrs.map((entry) => entry.prNumber)
if (JSON.stringify(actualOrder) !== JSON.stringify(expectedOrder)) failures.push(`unexpected_stack_order:${actualOrder.join('->')}`)
if (JSON.stringify(stackOrder.acceptedStackOrder ?? []) !== JSON.stringify(expectedOrder)) failures.push('stack_order_json_not_expected')
if (stackOrder.firstMergeExecutionTarget !== 441) failures.push(`first_merge_execution_target_unexpected:${stackOrder.firstMergeExecutionTarget}`)
if (stackOrder.nextLane !== 'AI_GRAPHICS_DRAFT_PACKAGE_PROOF_MERGE_EXECUTION_PR441') failures.push('next_lane_unexpected')

const rows = Object.fromEntries(sourcePrs.map((entry) => [entry.prNumber, entry]))
if (JSON.stringify(rows[425]?.tools ?? []) !== JSON.stringify(pr425Tools)) failures.push('pr425_tools_unexpected')
if (JSON.stringify(rows[433]?.tools ?? []) !== JSON.stringify(pr433Tools)) failures.push('pr433_tools_unexpected')
if (JSON.stringify(rows[441]?.tools ?? []) !== JSON.stringify(pr441Tools)) failures.push('pr441_tools_unexpected')
if (rows[425]?.state !== 'merged' || rows[425]?.merged !== true || rows[425]?.mergeSha !== pr425MergeSha) failures.push('pr425_post_merge_state_unexpected')
if (rows[433]?.state !== 'merged' || rows[433]?.merged !== true || rows[433]?.mergeSha !== pr433MergeSha) failures.push('pr433_post_merge_state_unexpected')
if (rows[441]?.state !== 'open' || rows[441]?.draft !== false || rows[441]?.mergeable !== 'MERGEABLE' || rows[441]?.merged !== false) failures.push('pr441_state_unexpected')
if (rows[441]?.mergeApprovedForFutureExecution !== true) failures.push('pr441_future_merge_approval_not_true')
if (rows[441]?.evidenceLevel !== 'install_import_manifest_static_proof') failures.push('pr441_evidence_level_unexpected')

for (const source of ['pr579', 'pr576', 'pr573', 'pr569', 'pr568', 'pr543']) {
  const data = sourceLockfile.sources?.[source]
  if (!data) {
    failures.push(`missing_source_lockfile_entry:${source}`)
    continue
  }
  if (data.state !== 'open') failures.push(`source_lockfile_not_open:${source}`)
  if (data.draft !== true) failures.push(`source_lockfile_not_draft:${source}`)
  if (data.mergeable !== 'MERGEABLE') failures.push(`source_lockfile_not_mergeable:${source}`)
  if (data.merged !== false) failures.push(`source_lockfile_merged:${source}`)
}
if (sourceLockfile.sources?.pr425?.state !== 'merged') failures.push('source_lockfile_pr425_not_merged')
if (sourceLockfile.sources?.pr425?.mergeSha !== pr425MergeSha) failures.push('source_lockfile_pr425_merge_sha_unexpected')
if (sourceLockfile.sources?.pr433?.state !== 'merged') failures.push('source_lockfile_pr433_not_merged')
if (sourceLockfile.sources?.pr433?.mergeSha !== pr433MergeSha) failures.push('source_lockfile_pr433_merge_sha_unexpected')
const pr441 = sourceLockfile.sources?.pr441
if (!pr441 || pr441.state !== 'open' || pr441.draft !== false || pr441.mergeable !== 'MERGEABLE' || pr441.merged !== false) failures.push('source_lockfile_pr441_unexpected')
for (const source of ['pr542', 'pr544']) {
  if (sourceLockfile.sources?.[source]?.state !== 'merged') failures.push(`source_lockfile_not_merged:${source}`)
}
if (sourceLockfile.trackBOwnerRule?.ownerId !== 'TRACK_B_MEDIA_OSS_STEWARD') failures.push('missing_trackb_owner_rule')
if (sourceLockfile.trackBOwnerRule?.atlasMayClaimTrackBTools !== false) failures.push('trackb_claim_exclusion_not_false')
if (sourceLockfile.trackBOwnerRule?.atlasMayInstallProveOrExecuteTrackBTools !== false) failures.push('trackb_execution_exclusion_not_false')
if (sourceLockfile.trackAOwnerContext?.atlasOwnsTrackARenderExport !== false) failures.push('tracka_exclusion_not_false')

for (const field of requiredTrueBooleans) {
  if (stackOrder.booleans?.[field] !== true) failures.push(`required_boolean_not_true:${field}`)
}
for (const field of requiredFalseBooleans) {
  if (stackOrder.booleans?.[field] !== false) failures.push(`required_boolean_not_false:${field}`)
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
  const expectedScript = 'node scripts/validation/ai-graphics-draft-package-proof-merge-approval-pr441-diagnostics.mjs'
  if (packageAfter.scripts?.['ai-graphics:draft-package-proof-merge-approval-pr441:diagnostics'] !== expectedScript) failures.push('missing_package_script')
} catch (error) {
  failures.push(`package_json_comparison_failed:${error.message}`)
}

try {
  const packageLockBefore = git(['show', `${baseRef}:package-lock.json`])
  const packageLockAfter = readFileSync('package-lock.json', 'utf8').trim()
  if (packageLockBefore.trim() !== packageLockAfter) failures.push('package_lock_changed')
} catch (error) {
  failures.push(`package_lock_comparison_failed:${error.message}`)
}

const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
if (trackedLocalArtifacts) failures.push(`tracked_local_artifacts:${trackedLocalArtifacts}`)

const changedPaths = git(['status', '--porcelain']).split('\n').filter(Boolean).map((line) => line.slice(3))
for (const path of changedPaths) {
  if (generatedPathPattern.test(path)) failures.push(`generated_or_runtime_path_changed:${path}`)
}

if (failures.length) {
  console.error('AI graphics draft package proof PR441 merge approval diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('AI graphics draft package proof PR441 merge approval diagnostics passed.')
