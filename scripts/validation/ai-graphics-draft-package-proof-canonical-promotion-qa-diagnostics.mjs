import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const baseRef = 'origin/codex/rp-ai-graphics-draft-package-proof-canonical-promotion-review'
const expectedDecision = 'ai_graphics_draft_package_proof_canonical_promotion_qa_passed_with_warnings'
const allowedDecisions = new Set([
  expectedDecision,
  'ai_graphics_draft_package_proof_canonical_promotion_qa_passed',
  'blocked_pending_ai_graphics_batch_1_canonical_qa',
  'blocked_pending_ai_graphics_batch_2_canonical_qa',
  'blocked_pending_ai_graphics_batch_3_canonical_qa',
  'blocked_pending_ai_graphics_runtime_boundary_qa',
])

const requiredDocs = [
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-canonical-promotion-qa-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-canonical-promotion-qa-source-lockfile.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-canonical-promotion-qa-matrix.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-batch-1-canonical-promotion-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-batch-2-canonical-promotion-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-batch-3-canonical-promotion-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-canonical-status-qa-ledger.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-runtime-boundary-after-canonical-promotion-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-next-proof-milestones-after-canonical-promotion-qa.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-canonical-promotion-qa-decision.md',
  'docs/prompt-ai-graphics-draft-package-proof-canonical-promotion-qa-review-results.md',
  'docs/implementation-prompts/prompt-ai-graphics-draft-package-proof-canonical-promotion-qa-review.md',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-canonical-promotion-qa-matrix.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-canonical-promotion-qa-source-lockfile.json',
  'docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-canonical-status-qa-ledger.json',
]

const expectedSources = ['PR #585', 'PR #582', 'PR #425', 'PR #433', 'PR #441', 'PR #543', 'PR #536', 'PR #416', 'PR #542', 'PR #544']
const expectedMergeShas = {
  'PR #425': 'a055ef045db2a6ce127a044bee6219d5933532c3',
  'PR #433': 'dd8cb0a03d47da6463d8ca014cfb3e53b7531ea0',
  'PR #441': 'd174de59471eacf05bed5a5511d661f2e5ba9f0f',
}
const expectedBatchTools = {
  batch_1: ['d3', 'echarts', 'vega_lite', 'vega'],
  batch_2: ['satori', 'svgdotjs_svg_js', 'viz_js', 'lottie_web'],
  batch_3: ['animejs', 'three_js', 'pixi_js', 'konva', 'babylonjs'],
}
const expectedTools = Object.values(expectedBatchTools).flat()
const expectedProof = 'canonical_merged_package_import_static_fixture_proof'

const requiredTrueBooleans = [
  'canonicalPromotionQaCompleted',
  'canonicalPromotionReviewAccepted',
  'all13PackageProofToolsQaReviewed',
  'batch1CanonicalQaAccepted',
  'batch2CanonicalQaAccepted',
  'batch3CanonicalQaAccepted',
  'pr425MergeShaAccepted',
  'pr433MergeShaAccepted',
  'pr441MergeShaAccepted',
  'canonicalPackageProofAccepted',
]

const requiredFalseBooleans = [
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

const forbiddenPatterns = [
  ['runtime_ready', /\bruntimeReadyNow\b\s*[:=|]\s*`?true`?/i],
  ['runtime_promotion', /\bcanonicalRuntimePromotionApproved\b\s*[:=|]\s*`?true`?/i],
  ['e2e_promotion', /\bcanonicalE2ePromotionApproved\b\s*[:=|]\s*`?true`?/i],
  ['internal_beta_ready', /\binternalBetaReadyNow\b\s*[:=|]\s*`?true`?/i],
  ['external_beta_ready', /\bexternalBetaReadyNow\b\s*[:=|]\s*`?true`?/i],
  ['production_ready', /\bproductionReadyNow\b\s*[:=|]\s*`?true`?/i],
  ['gpu_runtime', /\bgpuRuntimePerformed\b\s*[:=|]\s*`?true`?/i],
  ['model_download', /\bmodelWeightDownloadPerformed\b\s*[:=|]\s*`?true`?/i],
  ['browser_runtime', /\bbrowserWebglCanvasRuntimePerformed\b\s*[:=|]\s*`?true`?/i],
  ['execution', /\b(toolExecutionPerformed|workerExecutionPerformed|routeExecutionPerformed|providerRuntimePerformed)\b\s*[:=|]\s*`?true`?/i],
  ['storage_or_public_artifact', /\b(supabaseMutationPerformed|sqlExecutionPerformed|gcsUploadPerformed|publicArtifactCreated|signedUrlCreated)\b\s*[:=|]\s*`?true`?/i],
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

for (const path of requiredDocs) {
  if (!existsSync(path)) failures.push(`missing_required_doc:${path}`)
}

const docsText = requiredDocs
  .filter((path) => existsSync(path))
  .map((path) => `\n--- ${path} ---\n${readFileSync(path, 'utf8')}`)
  .join('\n')

if (!docsText.includes(expectedDecision)) failures.push('missing_expected_decision')
if (!docsText.includes(expectedProof)) failures.push('missing_expected_proof_level')
for (const source of expectedSources) {
  if (!docsText.includes(source)) failures.push(`missing_source:${source}`)
}
for (const [source, sha] of Object.entries(expectedMergeShas)) {
  if (!docsText.includes(sha)) failures.push(`missing_merge_sha:${source}:${sha}`)
}
for (const requiredText of ['TRACK_B_MEDIA_OSS_STEWARD', 'Track A', 'PR #544', 'PR #542']) {
  if (!docsText.includes(requiredText)) failures.push(`missing_required_text:${requiredText}`)
}
for (const tool of expectedTools) {
  if (!docsText.includes(tool)) failures.push(`missing_tool_in_docs:${tool}`)
}

let sourceLockfile = {}
let matrix = {}
let ledger = {}
try {
  sourceLockfile = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-canonical-promotion-qa-source-lockfile.json')
  matrix = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-canonical-promotion-qa-matrix.json')
  ledger = readJson('docs/open-source-tool-stack/ownership/ai-graphics-draft-package-proof-canonical-status-qa-ledger.json')
} catch (error) {
  failures.push(`json_parse_failed:${error.message}`)
}

for (const [name, data] of Object.entries({ sourceLockfile, matrix, ledger })) {
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
  if (row.canonicalPackageProofQaStatus !== 'accepted_with_warnings') failures.push(`unexpected_qa_status:${expectedTool}`)
  if (row.proofLevelAccepted !== expectedProof) failures.push(`unexpected_proof_level:${expectedTool}`)
  if (!Object.values(expectedMergeShas).includes(row.sourceMergeSha)) failures.push(`unexpected_source_merge_sha:${expectedTool}`)
  for (const field of ['runtimeReadyNow', 'internalBetaReadyNow', 'browserWebglCanvasRuntimeReady', 'toolExecutionReady', 'workerExecutionReady', 'routeExecutionReady']) {
    if (row[field] !== false) failures.push(`tool_runtime_field_not_false:${expectedTool}:${field}`)
  }
}

for (const [batch, toolsForBatch] of Object.entries(expectedBatchTools)) {
  const matrixTools = tools.filter((row) => row.sourceBatch === batch).map((row) => row.toolId)
  if (JSON.stringify(matrixTools) !== JSON.stringify(toolsForBatch)) failures.push(`matrix_batch_tools_mismatch:${batch}`)
  const ledgerTools = ledger.canonicalTools?.[batch] ?? []
  if (JSON.stringify(ledgerTools) !== JSON.stringify(toolsForBatch)) failures.push(`ledger_batch_tools_mismatch:${batch}`)
}
if (ledger.canonicalPackageProofStatus !== expectedProof) failures.push('ledger_proof_status_unexpected')
if (ledger.qaStatus !== 'accepted_with_warnings') failures.push('ledger_qa_status_unexpected')
if (ledger.runtimeReadyTools !== 0 || ledger.internalBetaReadyTools !== 0 || ledger.externalBetaReadyTools !== 0 || ledger.productionReadyTools !== 0) failures.push('ledger_ready_counts_not_zero')
if (ledger.canonicalRuntimePromotionApproved !== false || ledger.canonicalE2ePromotionApproved !== false) failures.push('ledger_runtime_or_e2e_not_false')

for (const [source, sha] of Object.entries({
  pr425: expectedMergeShas['PR #425'],
  pr433: expectedMergeShas['PR #433'],
  pr441: expectedMergeShas['PR #441'],
})) {
  if (sourceLockfile.sources?.[source]?.state !== 'merged') failures.push(`source_not_merged:${source}`)
  if (sourceLockfile.sources?.[source]?.mergeSha !== sha) failures.push(`source_merge_sha_mismatch:${source}`)
}
if (sourceLockfile.sources?.pr585?.state !== 'open' || sourceLockfile.sources?.pr585?.draft !== true) failures.push('pr585_source_state_unexpected')
if (sourceLockfile.sources?.pr582?.state !== 'open' || sourceLockfile.sources?.pr582?.draft !== true) failures.push('pr582_source_state_unexpected')
if (sourceLockfile.sources?.pr543?.state !== 'open' || sourceLockfile.sources?.pr543?.draft !== true) failures.push('pr543_source_state_unexpected')
if (sourceLockfile.sources?.pr536?.state !== 'open' || sourceLockfile.sources?.pr536?.draft !== true) failures.push('pr536_source_state_unexpected')
for (const source of ['pr416', 'pr542', 'pr544']) {
  if (sourceLockfile.sources?.[source]?.state !== 'merged') failures.push(`context_source_not_merged:${source}`)
}

if (sourceLockfile.trackBOwnerRule?.ownerId !== 'TRACK_B_MEDIA_OSS_STEWARD') failures.push('missing_trackb_owner_rule')
if (sourceLockfile.trackBOwnerRule?.atlasMayClaimTrackBTools !== false) failures.push('trackb_claim_exclusion_not_false')
if (sourceLockfile.trackAOwnerContext?.atlasOwnsTrackARenderExport !== false) failures.push('tracka_exclusion_not_false')
if (ledger.trackBOwnerRule?.atlasMayClaimTrackBTools !== false) failures.push('ledger_trackb_exclusion_not_false')
if (ledger.trackAOwnerContext?.atlasOwnsTrackARenderExport !== false) failures.push('ledger_tracka_exclusion_not_false')

for (const field of requiredTrueBooleans) {
  if (matrix.booleans?.[field] !== true) failures.push(`required_boolean_not_true:${field}`)
}
for (const field of requiredFalseBooleans) {
  if (matrix.booleans?.[field] !== false) failures.push(`required_boolean_not_false:${field}`)
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
  const expectedScript = 'node scripts/validation/ai-graphics-draft-package-proof-canonical-promotion-qa-diagnostics.mjs'
  if (packageAfter.scripts?.['ai-graphics:draft-package-proof-canonical-promotion-qa:diagnostics'] !== expectedScript) {
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
  console.error('AI graphics canonical promotion QA diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('AI graphics canonical promotion QA diagnostics passed.')
