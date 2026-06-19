import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-draft-package-proof-promotion-review'
const expectedDecision = 'ai_graphics_draft_package_proof_promotion_qa_passed_with_warnings'
const allowedDecisions = new Set([
  expectedDecision,
  'ai_graphics_draft_package_proof_promotion_qa_passed',
  'blocked_pending_ai_graphics_source_pr_conflict_qa',
  'blocked_pending_ai_graphics_package_diff_qa',
  'blocked_pending_ai_graphics_validation_refresh_qa',
  'blocked_pending_ai_graphics_runtime_boundary_qa',
])

const requiredDocs = [
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-promotion-qa-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-promotion-qa-source-lockfile.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-promotion-qa-matrix.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-batch-1-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-batch-2-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-batch-3-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-package-diff-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-validation-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-readiness-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-qa-blocked-use-register.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-qa-next-lane-recommendation.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-promotion-qa-decision.md',
  'docs/prompt-ai-graphics-draft-package-proof-promotion-qa-review-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-draft-package-proof-promotion-qa-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-promotion-qa-matrix.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-promotion-qa-source-lockfile.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-readiness-qa.json',
]

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

const batchGroups = {
  batch_1: ['d3', 'echarts', 'vega_lite', 'vega'],
  batch_2: ['satori', 'svgdotjs_svg_js', 'viz_js', 'lottie_web'],
  batch_3: ['animejs', 'three_js', 'pixi_js', 'konva', 'babylonjs'],
}

const expectedSources = ['PR #550', 'PR #548', 'PR #543', 'PR #536', 'PR #416', 'PR #425', 'PR #433', 'PR #441', 'PR #542', 'PR #544']
const requiredToolFields = [
  'toolId',
  'displayName',
  'packageName',
  'sourceBatch',
  'sourcePr',
  'sourcePrState',
  'sourcePrDraft',
  'sourcePrMergeable',
  'promotionReviewAccepted',
  'draftPackageProofStatusAccepted',
  'importSmokeEvidenceAccepted',
  'syntheticOrManifestFixtureEvidenceAccepted',
  'packageDiffAccepted',
  'runtimeBoundaryAccepted',
  'promotionQaStatus',
  'blockedReason',
  'nextAction',
]

const requiredTrueBooleans = [
  'draftPackageProofPromotionQaCompleted',
  'promotionReviewAccepted',
  'all13DraftPackageToolsQaReviewed',
  'batch1QaReviewed',
  'batch2QaReviewed',
  'batch3QaReviewed',
  'sourcePrStatesAccepted',
  'packageDiffQaAccepted',
  'validationEvidenceQaAccepted',
  'runtimeBoundaryQaAccepted',
  'readyForMergeOrderReview',
]

const requiredFalseBooleans = [
  'readyForCanonicalPromotion',
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
  'productionReadyNow',
]

const forbiddenPatterns = [
  ['all_21_installed', /\ball 21 tools (?:are )?installed\b/i],
  ['canonical_promotion_true', /\breadyForCanonicalPromotion\b\s*[:=]\s*`?true`?/i],
  ['canonical_before_merge', /\bcanonical promotion (?:completed|passed|approved)\b/i],
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
for (const required of ['TRACK_B_MEDIA_OSS_STEWARD', 'Track A', 'runtime boundary', 'merge-order review']) {
  if (!docsText.toLowerCase().includes(required.toLowerCase())) failures.push(`missing_required_text:${required}`)
}

let matrix = {}
let sourceLockfile = {}
let mergeReadiness = {}
try {
  matrix = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-promotion-qa-matrix.json')
  sourceLockfile = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-promotion-qa-source-lockfile.json')
  mergeReadiness = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-merge-readiness-qa.json')
} catch (error) {
  failures.push(`json_parse_failed:${error.message}`)
}

for (const [name, data] of Object.entries({ matrix, sourceLockfile, mergeReadiness })) {
  if (!allowedDecisions.has(data.decision)) failures.push(`unexpected_${name}_decision:${data.decision}`)
}
if (matrix.decision !== expectedDecision) failures.push('matrix_decision_not_expected')
if (sourceLockfile.decision !== expectedDecision) failures.push('source_lockfile_decision_not_expected')
if (mergeReadiness.decision !== expectedDecision) failures.push('merge_readiness_decision_not_expected')

const tools = matrix.tools ?? []
if (tools.length !== expectedTools.length) failures.push(`unexpected_tool_count:${tools.length}`)

for (const toolId of expectedTools) {
  const tool = tools.find((entry) => entry.toolId === toolId)
  if (!tool) {
    failures.push(`missing_tool:${toolId}`)
    continue
  }
  for (const field of requiredToolFields) {
    if (!(field in tool)) failures.push(`tool_missing_field:${toolId}:${field}`)
  }
  if (tool.sourcePrState !== 'open') failures.push(`tool_source_state_not_open:${toolId}`)
  if (tool.sourcePrDraft !== true) failures.push(`tool_source_draft_not_true:${toolId}`)
  if (tool.sourcePrMergeable !== 'MERGEABLE') failures.push(`tool_source_mergeable_not_mergeable:${toolId}`)
  if (tool.promotionQaStatus !== 'accepted_with_warnings') failures.push(`tool_qa_status_unexpected:${toolId}`)
  if (tool.blockedReason !== '') failures.push(`tool_blocked_reason_not_empty:${toolId}`)
  if (tool.nextAction !== 'merge_order_review') failures.push(`tool_next_action_unexpected:${toolId}`)
  for (const field of ['promotionReviewAccepted', 'draftPackageProofStatusAccepted', 'importSmokeEvidenceAccepted', 'syntheticOrManifestFixtureEvidenceAccepted', 'packageDiffAccepted', 'runtimeBoundaryAccepted']) {
    if (tool[field] !== true) failures.push(`tool_acceptance_field_not_true:${toolId}:${field}`)
  }
}

for (const [batch, expected] of Object.entries(batchGroups)) {
  const batchTools = tools.filter((entry) => entry.sourceBatch === batch).map((entry) => entry.toolId).sort()
  if (JSON.stringify(batchTools) !== JSON.stringify([...expected].sort())) {
    failures.push(`batch_group_mismatch:${batch}:${batchTools.join(',')}`)
  }
}

for (const [source, data] of Object.entries(sourceLockfile.sources ?? {})) {
  if (['pr550', 'pr548', 'pr543', 'pr536', 'pr425', 'pr433', 'pr441'].includes(source)) {
    if (data.state !== 'open') failures.push(`source_not_open:${source}`)
    if (data.draft !== true) failures.push(`source_not_draft:${source}`)
    if (data.mergeable !== 'MERGEABLE') failures.push(`source_not_mergeable:${source}`)
  }
  if (['pr416', 'pr542', 'pr544'].includes(source) && data.state !== 'merged') {
    failures.push(`source_not_merged:${source}`)
  }
}

if (sourceLockfile.trackBOwnerRule?.ownerId !== 'TRACK_B_MEDIA_OSS_STEWARD') failures.push('missing_trackb_owner_rule')
if (sourceLockfile.trackAOwnerContext?.atlasOwnsTrackARenderExport !== false) failures.push('tracka_exclusion_not_false')

for (const field of requiredTrueBooleans) {
  if (mergeReadiness.booleans?.[field] !== true) failures.push(`required_boolean_not_true:${field}`)
}
for (const field of requiredFalseBooleans) {
  if (mergeReadiness.booleans?.[field] !== false) failures.push(`required_boolean_not_false:${field}`)
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
  const expectedScript = 'node scripts/validation/ai-graphics-draft-package-proof-promotion-qa-diagnostics.mjs'
  if (packageAfter.scripts?.['ai-graphics:draft-package-proof-promotion-qa:diagnostics'] !== expectedScript) {
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
  console.error('AI graphics draft package proof promotion QA diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('AI graphics draft package proof promotion QA diagnostics passed.')
