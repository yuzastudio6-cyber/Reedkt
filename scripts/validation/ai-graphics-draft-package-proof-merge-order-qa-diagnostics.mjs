import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-draft-package-proof-merge-order-review'
const expectedDecision = 'ai_graphics_draft_package_proof_merge_order_qa_passed_with_warnings'
const allowedDecisions = new Set([
  expectedDecision,
  'ai_graphics_draft_package_proof_merge_order_qa_passed',
  'blocked_pending_ai_graphics_pr425_merge_order_qa',
  'blocked_pending_ai_graphics_pr433_merge_order_qa',
  'blocked_pending_ai_graphics_pr441_merge_order_qa',
  'blocked_pending_ai_graphics_package_lock_risk_qa',
  'blocked_pending_ai_graphics_validation_staleness_qa',
])

const requiredDocs = [
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-order-qa-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-order-qa-source-lockfile.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-order-qa-matrix.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-pr425-merge-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-pr433-merge-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-pr441-merge-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-stack-order-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-conflict-risk-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-package-lock-risk-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-validation-staleness-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-readiness-qa-decision.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-order-qa-next-lane-recommendation.md',
  'docs/prompt-ai-graphics-draft-package-proof-merge-order-qa-review-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-draft-package-proof-merge-order-qa-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-order-qa-source-lockfile.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-order-qa-matrix.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-stack-order-qa.json',
]

const expectedSources = ['PR #554', 'PR #552', 'PR #550', 'PR #548', 'PR #543', 'PR #536', 'PR #416', 'PR #425', 'PR #433', 'PR #441', 'PR #542', 'PR #544']
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
  'stackOrderAccepted',
  'packageJsonChanged',
  'packageLockChanged',
  'validationEvidenceAccepted',
  'conflictRiskAccepted',
  'stalenessRiskAccepted',
  'packageLockRiskAccepted',
  'mergeOrderQaStatus',
  'readyForMarkReadyLater',
  'readyForMergeLater',
  'canonicalPromotionApprovedNow',
  'prMergedNow',
  'draftMarkedReadyNow',
  'blockedReason',
]

const requiredTrueBooleans = [
  'mergeOrderQaCompleted',
  'mergeOrderReviewAccepted',
  'allSourcePrsQaReviewed',
  'pr425QaReviewed',
  'pr433QaReviewed',
  'pr441QaReviewed',
  'stackOrderAccepted',
  'sourcePrStatesAccepted',
  'packageLockRiskQaAccepted',
  'conflictRiskQaAccepted',
  'validationStalenessQaAccepted',
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
  sourceLockfile = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-order-qa-source-lockfile.json')
  matrix = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-order-qa-matrix.json')
  stackOrder = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-stack-order-qa.json')
} catch (error) {
  failures.push(`json_parse_failed:${error.message}`)
}

for (const [name, data] of Object.entries({ sourceLockfile, matrix, stackOrder })) {
  if (!allowedDecisions.has(data.decision)) failures.push(`unexpected_${name}_decision:${data.decision}`)
  if (data.decision !== expectedDecision) failures.push(`${name}_decision_not_expected`)
}

const sourcePrs = matrix.sourcePrs ?? []
const actualOrder = sourcePrs.map((entry) => entry.prNumber)
if (JSON.stringify(actualOrder) !== JSON.stringify(expectedOrder)) failures.push(`unexpected_merge_order:${actualOrder.join('->')}`)
if (JSON.stringify(stackOrder.acceptedMergeOrder ?? []) !== JSON.stringify(expectedOrder)) failures.push('stack_order_json_not_expected')
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
  for (const field of ['stackOrderAccepted', 'packageJsonChanged', 'packageLockChanged', 'validationEvidenceAccepted', 'conflictRiskAccepted', 'stalenessRiskAccepted', 'packageLockRiskAccepted', 'readyForMarkReadyLater', 'readyForMergeLater']) {
    if (row[field] !== true) failures.push(`source_pr_field_not_true:${expectedPr}:${field}`)
  }
  for (const field of ['canonicalPromotionApprovedNow', 'prMergedNow', 'draftMarkedReadyNow']) {
    if (row[field] !== false) failures.push(`source_pr_field_not_false:${expectedPr}:${field}`)
  }
  if (row.mergeOrderQaStatus !== 'accepted_with_warnings') failures.push(`source_pr_qa_status_unexpected:${expectedPr}`)
  if (row.blockedReason !== '') failures.push(`source_pr_blocker_not_empty:${expectedPr}`)
  if (JSON.stringify(row.tools ?? []) !== JSON.stringify(expectedBatchTools[expectedPr])) failures.push(`source_pr_tools_mismatch:${expectedPr}:${(row.tools ?? []).join(',')}`)
  allTools.push(...(row.tools ?? []))
}

const sortedAllTools = [...allTools].sort()
if (JSON.stringify(sortedAllTools) !== JSON.stringify([...expectedTools].sort())) failures.push(`unexpected_tool_set:${sortedAllTools.join(',')}`)
for (const tool of expectedTools) {
  if (allTools.filter((entry) => entry === tool).length !== 1) failures.push(`tool_not_exactly_once:${tool}`)
}

for (const source of ['pr554', 'pr552', 'pr550', 'pr548', 'pr543', 'pr536', 'pr425', 'pr433', 'pr441']) {
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
  const expectedScript = 'node scripts/validation/ai-graphics-draft-package-proof-merge-order-qa-diagnostics.mjs'
  if (packageAfter.scripts?.['ai-graphics:draft-package-proof-merge-order-qa:diagnostics'] !== expectedScript) failures.push('missing_package_script')
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
  console.error('AI graphics draft package proof merge-order QA diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('AI graphics draft package proof merge-order QA diagnostics passed.')
