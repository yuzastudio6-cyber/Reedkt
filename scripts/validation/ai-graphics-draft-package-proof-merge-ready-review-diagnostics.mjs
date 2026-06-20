import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-draft-package-proof-draft-ready-execution-pr441'
const expectedDecision = 'ai_graphics_draft_package_proof_merge_ready_review_passed_with_warnings'
const allowedDecisions = new Set([
  expectedDecision,
  'ai_graphics_draft_package_proof_merge_ready_review_passed',
  'blocked_pending_pr425_merge_ready_review',
  'blocked_pending_pr433_merge_ready_review',
  'blocked_pending_pr441_merge_ready_review',
  'blocked_pending_ai_graphics_merge_conflict_review',
  'blocked_pending_ai_graphics_package_lock_merge_risk',
  'blocked_pending_ai_graphics_validation_staleness_review',
])

const requiredDocs = [
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-ready-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-ready-source-lockfile.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-ready-matrix.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-pr425-merge-ready-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-pr433-merge-ready-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-pr441-merge-ready-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-ready-stack-order.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-ready-package-lock-risk.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-ready-conflict-risk.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-ready-validation-staleness.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-ready-blocked-use-register.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-ready-decision.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-ready-next-lane-recommendation.md',
  'docs/prompt-ai-graphics-draft-package-proof-merge-ready-review-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-draft-package-proof-merge-ready-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-ready-source-lockfile.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-ready-matrix.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-ready-stack-order.json',
]

const expectedSources = [
  'PR #568',
  'PR #564',
  'PR #561',
  'PR #566',
  'PR #562',
  'PR #558',
  'PR #556',
  'PR #554',
  'PR #552',
  'PR #550',
  'PR #548',
  'PR #543',
  'PR #536',
  'PR #416',
  'PR #425',
  'PR #433',
  'PR #441',
  'PR #542',
  'PR #544',
]

const expectedOrder = [425, 433, 441]
const expectedBatchTools = {
  425: ['d3', 'echarts', 'vega_lite', 'vega'],
  433: ['satori', 'svgdotjs_svg_js', 'viz_js', 'lottie_web'],
  441: ['animejs', 'three_js', 'pixi_js', 'konva', 'babylonjs'],
}
const expectedTools = Object.values(expectedBatchTools).flat()

const requiredTrueBooleans = [
  'mergeReadyReviewCompleted',
  'allSourcePrsReviewed',
  'pr425Reviewed',
  'pr433Reviewed',
  'pr441Reviewed',
  'pr425OpenNonDraftClean',
  'pr433OpenNonDraftClean',
  'pr441OpenNonDraftClean',
  'stackOrderAccepted',
  'packageLockRiskReviewed',
  'conflictRiskReviewed',
  'validationStalenessReviewed',
  'readyForFutureMergeApproval',
]

const requiredFalseBooleans = [
  'canonicalPromotionApprovedNow',
  'prMergedNow',
  'prRetargetedNow',
  'prClosedNow',
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
  'gcsUploadPerformed',
  'publicArtifactCreated',
  'signedUrlCreated',
  'runtimeReadyNow',
  'internalBetaReadyNow',
  'externalBetaReadyNow',
  'productionReadyNow',
]

const forbiddenPatterns = [
  ['canonical_promotion_now', /\b(canonicalPromotionApprovedNow|readyForCanonicalPromotion)\b\s*[:=]\s*`?true`?/i],
  ['source_prs_merged_now', /\b(prMergedNow|sourcePrsMergedNow|pr425MergedNow|pr433MergedNow|pr441MergedNow)\b\s*[:=]\s*`?true`?/i],
  ['source_prs_retargeted_or_closed', /\b(prRetargetedNow|prClosedNow)\b\s*[:=]\s*`?true`?/i],
  ['draft_ready_now', /\b(draftMarkedReadyNow|draftsMarkedReadyNow|pr425MarkedReadyNow|pr433MarkedReadyNow|pr441MarkedReadyNow)\b\s*[:=]\s*`?true`?/i],
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
for (const required of ['TRACK_B_MEDIA_OSS_STEWARD', 'Track A', 'PR #425 -> PR #433 -> PR #441', 'AI_GRAPHICS_DRAFT_PACKAGE_PROOF_MERGE_APPROVAL_PR425']) {
  if (!docsText.includes(required)) failures.push(`missing_required_text:${required}`)
}
for (const tool of expectedTools) {
  if (!docsText.includes(tool)) failures.push(`missing_tool_in_docs:${tool}`)
}

let sourceLockfile = {}
let matrix = {}
let stackOrder = {}
try {
  sourceLockfile = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-ready-source-lockfile.json')
  matrix = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-ready-matrix.json')
  stackOrder = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-ready-stack-order.json')
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
if (stackOrder.firstMergeApprovalTarget !== 425) failures.push(`first_merge_approval_target_unexpected:${stackOrder.firstMergeApprovalTarget}`)
if (stackOrder.nextLane !== 'AI_GRAPHICS_DRAFT_PACKAGE_PROOF_MERGE_APPROVAL_PR425') failures.push('next_lane_unexpected')

const allTools = []
for (const expectedPr of expectedOrder) {
  const row = sourcePrs.find((entry) => entry.prNumber === expectedPr)
  if (!row) {
    failures.push(`missing_source_pr_row:${expectedPr}`)
    continue
  }
  if (row.state !== 'open') failures.push(`source_pr_not_open:${expectedPr}`)
  if (row.draft !== false) failures.push(`source_pr_not_non_draft:${expectedPr}`)
  if (row.mergeable !== 'CLEAN') failures.push(`source_pr_not_clean:${expectedPr}`)
  if (row.merged !== false) failures.push(`source_pr_merged:${expectedPr}`)
  if (row.packageJsonChanged !== true || row.packageLockChanged !== true) failures.push(`source_pr_package_flags_unexpected:${expectedPr}`)
  if (row.validationEvidenceStatus !== 'accepted_with_warnings') failures.push(`validation_evidence_status_unexpected:${expectedPr}`)
  if (row.packageLockRiskStatus !== 'reviewed_with_warnings') failures.push(`package_lock_risk_status_unexpected:${expectedPr}`)
  if (row.conflictRiskStatus !== 'reviewed_with_warnings') failures.push(`conflict_risk_status_unexpected:${expectedPr}`)
  if (row.validationStalenessStatus !== 'reviewed_with_warnings') failures.push(`validation_staleness_status_unexpected:${expectedPr}`)
  if (row.canonicalPromotionApprovedNow !== false || row.prMergedNow !== false || row.prRetargetedNow !== false || row.prClosedNow !== false) failures.push(`source_pr_now_flags_unexpected:${expectedPr}`)
  if (JSON.stringify(row.tools ?? []) !== JSON.stringify(expectedBatchTools[expectedPr])) failures.push(`source_pr_tools_mismatch:${expectedPr}`)
  allTools.push(...(row.tools ?? []))
}

if (sourcePrs.find((entry) => entry.prNumber === 425)?.readyForFutureMergeApproval !== true) failures.push('pr425_not_ready_for_future_merge_approval')
if (sourcePrs.find((entry) => entry.prNumber === 433)?.readyForFutureMergeApproval !== false) failures.push('pr433_should_be_deferred')
if (sourcePrs.find((entry) => entry.prNumber === 441)?.readyForFutureMergeApproval !== false) failures.push('pr441_should_be_deferred')

for (const tool of expectedTools) {
  if (allTools.filter((entry) => entry === tool).length !== 1) failures.push(`tool_not_exactly_once:${tool}`)
}

for (const source of ['pr568', 'pr564', 'pr561', 'pr566', 'pr562', 'pr558', 'pr556', 'pr554', 'pr552', 'pr550', 'pr548', 'pr543', 'pr536']) {
  const data = sourceLockfile.sources?.[source]
  if (!data) {
    failures.push(`missing_source_lockfile_entry:${source}`)
    continue
  }
  if (data.state !== 'open') failures.push(`source_lockfile_not_open:${source}`)
  if (data.draft !== true) failures.push(`source_lockfile_not_draft:${source}`)
  if (data.mergeable !== 'CLEAN') failures.push(`source_lockfile_not_clean:${source}`)
  if (data.merged !== false) failures.push(`source_lockfile_merged:${source}`)
}
for (const source of ['pr425', 'pr433', 'pr441']) {
  const data = sourceLockfile.sources?.[source]
  if (!data || data.state !== 'open' || data.draft !== false || data.mergeable !== 'CLEAN' || data.merged !== false) failures.push(`source_lockfile_source_pr_unexpected:${source}`)
}
for (const source of ['pr416', 'pr542', 'pr544']) {
  if (sourceLockfile.sources?.[source]?.state !== 'merged') failures.push(`source_lockfile_not_merged:${source}`)
}
if (sourceLockfile.trackBOwnerRule?.ownerId !== 'TRACK_B_MEDIA_OSS_STEWARD') failures.push('missing_trackb_owner_rule')
if (sourceLockfile.trackBOwnerRule?.atlasMayClaimTrackBTools !== false) failures.push('trackb_claim_exclusion_not_false')
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
  const expectedScript = 'node scripts/validation/ai-graphics-draft-package-proof-merge-ready-review-diagnostics.mjs'
  if (packageAfter.scripts?.['ai-graphics:draft-package-proof-merge-ready-review:diagnostics'] !== expectedScript) failures.push('missing_package_script')
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

const statusPaths = git(['status', '--porcelain']).split('\n').filter(Boolean).map((line) => line.slice(3))
for (const path of statusPaths) {
  if (generatedPathPattern.test(path)) failures.push(`generated_or_runtime_path_changed:${path}`)
}

const stagedPaths = git(['diff', '--cached', '--name-only']).split('\n').filter(Boolean)
for (const path of stagedPaths) {
  if (generatedPathPattern.test(path)) failures.push(`generated_or_runtime_path_staged:${path}`)
}

if (failures.length) {
  console.error('AI graphics draft package proof merge-ready review diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('AI graphics draft package proof merge-ready review diagnostics passed.')
