import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-draft-package-proof-draft-ready-execution-pr425'
const expectedDecision = 'ai_graphics_draft_package_proof_pr433_draft_ready_approval_passed_with_warnings'
const allowedDecisions = new Set([
  expectedDecision,
  'ai_graphics_draft_package_proof_pr433_draft_ready_approval_passed',
  'blocked_pending_pr425_post_ready_state_review',
  'blocked_pending_pr433_not_draft',
  'blocked_pending_pr433_not_mergeable_clean',
  'blocked_pending_pr433_head_changed_review',
  'blocked_pending_pr433_scope_mismatch',
  'blocked_pending_pr441_defer_review',
  'blocked_pending_pr433_draft_ready_scope_review',
])

const requiredDocs = [
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-draft-ready-approval-pr433.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-draft-ready-approval-pr433-source-lockfile.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-draft-ready-approval-pr433-matrix.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-pr425-post-ready-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-pr433-draft-ready-approval.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-pr441-deferred-after-pr433.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-draft-ready-stack-order-pr433.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-draft-ready-boundary-review-pr433.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-draft-ready-blocked-use-register-pr433.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-draft-ready-decision-pr433.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-draft-ready-next-lane-recommendation-pr433.md',
  'docs/prompt-ai-graphics-draft-package-proof-draft-ready-approval-pr433-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-draft-package-proof-draft-ready-approval-pr433.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-draft-ready-approval-pr433-matrix.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-draft-ready-approval-pr433-source-lockfile.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-draft-ready-stack-order-pr433.json',
]

const expectedSources = ['PR #561', 'PR #425', 'PR #558', 'PR #556', 'PR #554', 'PR #552', 'PR #550', 'PR #548', 'PR #543', 'PR #536', 'PR #416', 'PR #433', 'PR #441', 'PR #542', 'PR #544']
const pr433Tools = ['satori', 'svgdotjs_svg_js', 'viz_js', 'lottie_web']
const pr441Tools = ['animejs', 'three_js', 'pixi_js', 'konva', 'babylonjs']
const allStackTools = ['d3', 'echarts', 'vega_lite', 'vega', ...pr433Tools, ...pr441Tools]
const expectedOrder = [425, 433, 441]

const requiredTrueBooleans = [
  'pr433DraftReadyApprovalCompleted',
  'pr425PostReadyStateChecked',
  'pr425StillOpenNonDraftClean',
  'pr433Reviewed',
  'pr433DraftReadyApprovedForFutureExecution',
  'pr441ReviewedAsDeferred',
  'stackOrderAccepted',
  'readyForPr433DraftReadyExecution',
]

const requiredFalseBooleans = [
  'pr425MergedNow',
  'canonicalPromotionApprovedNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'pr433MarkedReadyNow',
  'pr441MarkedReadyNow',
  'anyOtherPrMarkedReadyNow',
  'prMergedNow',
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
  'productionReadyNow',
]

const forbiddenPatterns = [
  ['pr433_ready_now', /\b(pr433MarkedReadyNow|draftMarkedReadyNow)\b\s*[:=]\s*`?true`?/i],
  ['pr441_ready_now', /\bpr441MarkedReadyNow\b\s*[:=]\s*`?true`?/i],
  ['source_prs_merged_now', /\b(prMergedNow|sourcePrsMergedNow|pr425MergedNow)\b\s*[:=]\s*`?true`?/i],
  ['source_prs_retargeted_or_closed', /\b(prRetargetedNow|prClosedNow)\b\s*[:=]\s*`?true`?/i],
  ['canonical_promotion_now', /\b(canonicalPromotionApprovedNow|readyForCanonicalPromotion)\b\s*[:=]\s*`?true`?/i],
  ['all_21_installed', /\ball 21 tools (?:are )?installed\b/i],
  ['e2e_proof_claim', /\bE2E[- ]proof\b\s*[:=]\s*`?(true|claimed|approved|passed)`?/i],
  ['runtime_ready', /\bruntimeReadyNow\b\s*[:=]\s*`?true`?/i],
  ['internal_beta_ready', /\binternalBetaReadyNow\b\s*[:=]\s*`?true`?/i],
  ['production_ready', /\bproductionReadyNow\b\s*[:=]\s*`?true`?/i],
  ['gpu_runtime', /\bgpuRuntimePerformed\b\s*[:=]\s*`?true`?/i],
  ['model_download', /\bmodelWeightDownloadPerformed\b\s*[:=]\s*`?true`?/i],
  ['browser_runtime', /\bbrowserWebglCanvasRuntimePerformed\b\s*[:=]\s*`?true`?/i],
  ['tool_worker_route_provider', /\b(toolExecutionPerformed|workerExecutionPerformed|routeExecutionPerformed|providerRuntimePerformed)\b\s*[:=]\s*`?true`?/i],
  ['supabase_gcs_public_signed', /\b(supabaseMutationPerformed|gcsUploadPerformed|publicArtifactCreated|signedUrlCreated)\b\s*[:=]\s*`?true`?/i],
  ['dry_run_passed', /\bdry_run_passed\b[\s\S]{0,40}\b(true|claimed|accepted|approved)\b/i],
  ['generated_local_fixture_passed', /\bgenerated_local_fixture_passed\b[\s\S]{0,40}\b(true|claimed|accepted|approved)\b/i],
]

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
for (const required of ['TRACK_B_MEDIA_OSS_STEWARD', 'Track A', 'PR #425 -> PR #433 -> PR #441']) {
  if (!docsText.includes(required)) failures.push(`missing_required_text:${required}`)
}
for (const tool of [...pr433Tools, ...pr441Tools]) {
  if (!docsText.includes(tool)) failures.push(`missing_tool:${tool}`)
}

let sourceLockfile = {}
let matrix = {}
let stackOrder = {}
try {
  sourceLockfile = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-draft-ready-approval-pr433-source-lockfile.json')
  matrix = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-draft-ready-approval-pr433-matrix.json')
  stackOrder = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-draft-ready-stack-order-pr433.json')
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
if (stackOrder.orderLabel !== 'PR #425 -> PR #433 -> PR #441') failures.push('stack_order_label_not_expected')
if (stackOrder.firstDraftReadyTarget !== 433) failures.push(`first_draft_ready_target_unexpected:${stackOrder.firstDraftReadyTarget}`)

const rows = Object.fromEntries(sourcePrs.map((entry) => [entry.prNumber, entry]))
if (rows[425]?.draft !== false || rows[425]?.state !== 'open' || rows[425]?.mergeable !== 'CLEAN' || rows[425]?.merged !== false) failures.push('pr425_post_ready_state_unexpected')
if (rows[433]?.draft !== true || rows[433]?.state !== 'open' || rows[433]?.mergeable !== 'CLEAN' || rows[433]?.merged !== false) failures.push('pr433_state_unexpected')
if (rows[441]?.draft !== true || rows[441]?.state !== 'open' || rows[441]?.mergeable !== 'CLEAN' || rows[441]?.merged !== false) failures.push('pr441_state_unexpected')
if (JSON.stringify(rows[433]?.tools ?? []) !== JSON.stringify(pr433Tools)) failures.push('pr433_tools_unexpected')
if (JSON.stringify(rows[441]?.tools ?? []) !== JSON.stringify(pr441Tools)) failures.push('pr441_tools_unexpected')
if (rows[433]?.canBeMarkedReadyInFutureExecution !== true) failures.push('pr433_future_approval_not_true')
if (rows[433]?.canBeMarkedReadyNow !== false || rows[433]?.draftMarkedReadyNow !== false) failures.push('pr433_now_flags_not_false')
if (rows[441]?.canBeMarkedReadyInFutureExecution !== false) failures.push('pr441_future_approval_not_false')

const allTools = sourcePrs.flatMap((entry) => entry.tools ?? [])
for (const tool of allStackTools) {
  if (allTools.filter((entry) => entry === tool).length !== 1) failures.push(`tool_not_exactly_once:${tool}`)
}

for (const source of ['pr561', 'pr558', 'pr556', 'pr554', 'pr552', 'pr550', 'pr548', 'pr543', 'pr536', 'pr433', 'pr441']) {
  const data = sourceLockfile.sources?.[source]
  if (!data) {
    failures.push(`missing_source_lockfile_entry:${source}`)
    continue
  }
  if (data.state !== 'open') failures.push(`source_lockfile_not_open:${source}`)
  if (data.draft !== true) failures.push(`source_lockfile_not_draft:${source}`)
  if (data.mergeable !== 'CLEAN') failures.push(`source_lockfile_not_clean:${source}`)
}
const pr425 = sourceLockfile.sources?.pr425
if (!pr425 || pr425.state !== 'open' || pr425.draft !== false || pr425.mergeable !== 'CLEAN' || pr425.merged !== false) failures.push('source_lockfile_pr425_post_ready_unexpected')
for (const source of ['pr416', 'pr542', 'pr544']) {
  if (sourceLockfile.sources?.[source]?.state !== 'merged') failures.push(`source_lockfile_not_merged:${source}`)
}
if (sourceLockfile.trackBOwnerRule?.ownerId !== 'TRACK_B_MEDIA_OSS_STEWARD') failures.push('missing_trackb_owner_rule')
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
  const expectedScript = 'node scripts/validation/ai-graphics-draft-package-proof-draft-ready-approval-pr433-diagnostics.mjs'
  if (packageAfter.scripts?.['ai-graphics:draft-package-proof-draft-ready-approval-pr433:diagnostics'] !== expectedScript) failures.push('missing_package_script')
} catch (error) {
  failures.push(`package_json_comparison_failed:${error.message}`)
}

try {
  if (git(['show', `${baseRef}:package-lock.json`]).trim() !== readFileSync('package-lock.json', 'utf8').trim()) failures.push('package_lock_changed')
} catch (error) {
  failures.push(`package_lock_comparison_failed:${error.message}`)
}

let changedFiles = []
try {
  changedFiles = git(['diff', '--name-only', `${baseRef}...HEAD`]).split('\n').filter(Boolean)
} catch (error) {
  failures.push(`changed_files_failed:${error.message}`)
}

for (const file of changedFiles) {
  if (/(^|\/)\.local-artifacts(\/|$)/i.test(file)) failures.push(`local_artifact_committed:${file}`)
  if (/(^|\/)(media|render|browser|canvas|webgl|public-artifacts|generated-artifacts)(\/|$)/i.test(file)) failures.push(`generated_or_runtime_path_committed:${file}`)
}

if (failures.length) {
  console.error('AI graphics draft package proof PR433 draft-ready approval diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('AI graphics draft package proof PR433 draft-ready approval diagnostics passed.')
