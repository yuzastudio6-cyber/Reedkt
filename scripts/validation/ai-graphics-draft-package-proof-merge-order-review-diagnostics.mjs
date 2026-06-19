import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-draft-package-proof-promotion-qa-review'
const expectedDecision = 'ai_graphics_draft_package_proof_merge_order_review_passed_with_warnings'
const allowedDecisions = new Set([
  expectedDecision,
  'blocked_pending_ai_graphics_pr425_refresh',
  'blocked_pending_ai_graphics_pr433_refresh',
  'blocked_pending_ai_graphics_pr441_refresh',
  'blocked_pending_ai_graphics_package_lock_conflict_review',
  'blocked_pending_ai_graphics_merge_order_conflict_resolution',
])

const requiredDocs = [
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-order-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-order-source-lockfile.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-order-matrix.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-pr425-merge-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-pr433-merge-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-pr441-merge-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-stack-order.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-conflict-risk-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-package-lock-risk-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-validation-staleness-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-readiness-decision.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-next-lane-recommendation.md',
  'docs/prompt-ai-graphics-draft-package-proof-merge-order-review-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-draft-package-proof-merge-order-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-order-source-lockfile.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-order-matrix.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-stack-order.json',
]

const expectedSources = ['PR #552', 'PR #550', 'PR #548', 'PR #543', 'PR #536', 'PR #416', 'PR #425', 'PR #433', 'PR #441', 'PR #542', 'PR #544']
const expectedTools = ['d3', 'echarts', 'vega_lite', 'vega', 'satori', 'svgdotjs_svg_js', 'viz_js', 'lottie_web', 'animejs', 'three_js', 'pixi_js', 'konva', 'babylonjs']
const expectedOrder = [425, 433, 441]
const expectedBatchTools = {
  425: ['d3', 'echarts', 'vega_lite', 'vega'],
  433: ['satori', 'svgdotjs_svg_js', 'viz_js', 'lottie_web'],
  441: ['animejs', 'three_js', 'pixi_js', 'konva', 'babylonjs'],
}

const requiredPrFields = [
  'prNumber',
  'title',
  'state',
  'draft',
  'mergeable',
  'baseRef',
  'headRef',
  'headSha',
  'sourceBatch',
  'tools',
  'packageJsonChanged',
  'packageLockChanged',
  'validationEvidenceStatus',
  'conflictRisk',
  'stalenessRisk',
  'mergeOrderRecommendation',
  'needsRefresh',
  'needsConflictResolution',
  'readyForMarkReadyLater',
  'readyForMergeLater',
  'blockedReason',
]

const requiredTrueBooleans = [
  'mergeOrderReviewCompleted',
  'allSourcePrsReviewed',
  'pr425Reviewed',
  'pr433Reviewed',
  'pr441Reviewed',
  'stackOrderRecommended',
  'sourcePrStatesRecorded',
  'packageLockRiskReviewed',
  'conflictRiskReviewed',
  'validationStalenessReviewed',
  'readyForMarkReadyLater',
  'readyForMergeLater',
]

const requiredFalseBooleans = [
  'canonicalPromotionApprovedNow',
  'dependencyInstallPerformed',
  'packageLockMutationPerformed',
  'prMergedNow',
  'draftMarkedReadyNow',
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
  ['canonical_promotion_now', /\b(canonicalPromotionApprovedNow|readyForCanonicalPromotion)\b\s*[:=]\s*`?true`?/i],
  ['source_prs_merged_now', /\b(prMergedNow|sourcePrsMergedNow)\b\s*[:=]\s*`?true`?/i],
  ['drafts_ready_now', /\b(draftMarkedReadyNow|draftsMarkedReadyNow)\b\s*[:=]\s*`?true`?/i],
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

let sourceLockfile = {}
let matrix = {}
let stackOrder = {}
try {
  sourceLockfile = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-order-source-lockfile.json')
  matrix = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-order-matrix.json')
  stackOrder = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-stack-order.json')
} catch (error) {
  failures.push(`json_parse_failed:${error.message}`)
}

for (const [name, data] of Object.entries({ sourceLockfile, matrix, stackOrder })) {
  if (!allowedDecisions.has(data.decision)) failures.push(`unexpected_${name}_decision:${data.decision}`)
  if (data.decision !== expectedDecision) failures.push(`${name}_decision_not_expected`)
}

const sourcePrs = matrix.sourcePrs ?? []
const actualOrder = sourcePrs.map((entry) => entry.prNumber)
if (JSON.stringify(actualOrder) !== JSON.stringify(expectedOrder)) {
  failures.push(`unexpected_merge_order:${actualOrder.join('->')}`)
}
if (JSON.stringify(stackOrder.recommendedMergeOrder ?? []) !== JSON.stringify(expectedOrder)) {
  failures.push('stack_order_json_not_expected')
}
if (stackOrder.orderLabel !== 'PR #425 -> PR #433 -> PR #441') failures.push('stack_order_label_not_expected')

const allTools = []
for (const expectedPr of expectedOrder) {
  const row = sourcePrs.find((entry) => entry.prNumber === expectedPr)
  if (!row) {
    failures.push(`missing_source_pr_row:${expectedPr}`)
    continue
  }
  for (const field of requiredPrFields) {
    if (!(field in row)) failures.push(`source_pr_missing_field:${expectedPr}:${field}`)
  }
  if (row.state !== 'open') failures.push(`source_pr_not_open:${expectedPr}`)
  if (row.draft !== true) failures.push(`source_pr_not_draft:${expectedPr}`)
  if (row.mergeable !== 'MERGEABLE') failures.push(`source_pr_not_mergeable:${expectedPr}`)
  if (row.packageJsonChanged !== true) failures.push(`source_pr_package_json_not_true:${expectedPr}`)
  if (row.packageLockChanged !== true) failures.push(`source_pr_package_lock_not_true:${expectedPr}`)
  if (row.needsRefresh !== false) failures.push(`source_pr_needs_refresh_not_false:${expectedPr}`)
  if (row.needsConflictResolution !== false) failures.push(`source_pr_needs_conflict_resolution_not_false:${expectedPr}`)
  if (row.readyForMarkReadyLater !== true) failures.push(`source_pr_mark_ready_later_not_true:${expectedPr}`)
  if (row.readyForMergeLater !== true) failures.push(`source_pr_merge_later_not_true:${expectedPr}`)
  if (row.blockedReason !== '') failures.push(`source_pr_blocker_not_empty:${expectedPr}`)
  if (row.mergeOrderRecommendation !== expectedOrder.indexOf(expectedPr) + 1) failures.push(`source_pr_order_recommendation_mismatch:${expectedPr}`)
  if (JSON.stringify(row.tools ?? []) !== JSON.stringify(expectedBatchTools[expectedPr])) {
    failures.push(`source_pr_tools_mismatch:${expectedPr}:${(row.tools ?? []).join(',')}`)
  }
  allTools.push(...(row.tools ?? []))
}

const sortedAllTools = [...allTools].sort()
if (JSON.stringify(sortedAllTools) !== JSON.stringify([...expectedTools].sort())) {
  failures.push(`unexpected_tool_set:${sortedAllTools.join(',')}`)
}
for (const tool of expectedTools) {
  if (allTools.filter((entry) => entry === tool).length !== 1) failures.push(`tool_not_exactly_once:${tool}`)
}

for (const source of ['pr552', 'pr550', 'pr548', 'pr543', 'pr536', 'pr425', 'pr433', 'pr441']) {
  const data = sourceLockfile.sources?.[source]
  if (!data) {
    failures.push(`missing_source_lockfile_entry:${source}`)
    continue
  }
  if (data.state !== 'open') failures.push(`source_lockfile_not_open:${source}`)
  if (data.draft !== true) failures.push(`source_lockfile_not_draft:${source}`)
  if (data.mergeable !== 'MERGEABLE') failures.push(`source_lockfile_not_mergeable:${source}`)
}
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
  const expectedScript = 'node scripts/validation/ai-graphics-draft-package-proof-merge-order-review-diagnostics.mjs'
  if (packageAfter.scripts?.['ai-graphics:draft-package-proof-merge-order-review:diagnostics'] !== expectedScript) {
    failures.push('missing_package_script')
  }
} catch (error) {
  failures.push(`package_json_comparison_failed:${error.message}`)
}

try {
  if (git(['show', `${baseRef}:package-lock.json`]).trim() !== readFileSync('package-lock.json', 'utf8').trim()) {
    failures.push('package_lock_changed')
  }
} catch (error) {
  failures.push(`package_lock_comparison_failed:${error.message}`)
}

let changedFiles = []
try {
  changedFiles = [
    git(['diff', '--name-only', `${baseRef}...HEAD`]),
    git(['diff', '--name-only']),
    git(['diff', '--cached', '--name-only']),
    git(['ls-files', '--others', '--exclude-standard']),
  ]
    .filter(Boolean)
    .join('\n')
    .split('\n')
    .filter(Boolean)
} catch (error) {
  failures.push(`changed_file_scan_failed:${error.message}`)
}

const forbiddenPath = changedFiles.find((path) =>
  path.startsWith('.local-artifacts/') ||
  /(^|\/)(media|render|browser|canvas|webgl|public-artifacts|generated-artifacts)(\/|$)/i.test(path),
)
if (forbiddenPath) failures.push(`forbidden_changed_artifact_path:${forbiddenPath}`)

try {
  const trackedLocalArtifacts = git(['ls-files', '.local-artifacts'])
  if (trackedLocalArtifacts) failures.push(`tracked_local_artifacts:${trackedLocalArtifacts}`)
} catch (error) {
  failures.push(`local_artifact_scan_failed:${error.message}`)
}

if (failures.length) {
  console.error('AI graphics draft package proof merge-order review diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('AI graphics draft package proof merge-order review diagnostics passed.')
