import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const reportDir = 'docs/open-source-tool-stack/owner-lane-reconciliation-after-batch-1-rollup'
const expectedDecision = 'owner_lane_reconciliation_passed_ready_for_staged_owner_merge_plan'
const primaryNextPrompt = 'OPEN_SOURCE_TOOL_STACK_STAGED_OWNER_MERGE_PLAN_AFTER_BATCH_1_ROLLUP'

const requiredFiles = [
  'source-of-truth-audit.json',
  'owner-lane-status-matrix.json',
  'owner-lane-status-matrix.md',
  'ai-graphics-worker-reconciliation-review.json',
  'ai-graphics-worker-reconciliation-review.md',
  'sound-oss-reconciliation-review.json',
  'sound-oss-reconciliation-review.md',
  'tracka-private-e2e-reconciliation-review.json',
  'tracka-private-e2e-reconciliation-review.md',
  'e2e-validation-reconciliation-review.json',
  'e2e-validation-reconciliation-review.md',
  'reconciled-tool-count-summary.json',
  'reconciled-tool-count-summary.md',
  'recommended-next-path.json',
  'recommended-next-path.md',
  'owner-lane-reconciliation-decision.json',
  'owner-lane-reconciliation-decision.md',
  'owner-lane-reconciliation-readiness-report.json',
  'owner-lane-reconciliation-private-artifact-manifest.json',
  'owner-lane-reconciliation-validation-results.md',
].map((file) => `${reportDir}/${file}`)

const requiredPromptFiles = [
  'docs/implementation-prompts/prompt-open-source-tool-stack-staged-owner-merge-plan-after-batch-1-rollup.md',
  'docs/implementation-prompts/prompt-open-source-tool-stack-ai-graphics-worker-reconciliation-after-batch-1.md',
  'docs/implementation-prompts/prompt-open-source-tool-stack-sound-oss-reconciliation-after-batch-1.md',
  'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-private-e2e-reconciliation-after-batch-1.md',
  'docs/implementation-prompts/prompt-e2e-validation-pr-305-hydration-blocker-resolution.md',
  'docs/implementation-prompts/prompt-product-internal-beta-readiness-aggregation-after-open-source-batch-1.md',
  'docs/implementation-prompts/prompt-open-source-tool-stack-batch-2-install-proof-approval-after-owner-reconciliation.md',
]

const failures = []
for (const file of [...requiredFiles, ...requiredPromptFiles]) {
  if (!existsSync(file)) failures.push(`missing_file:${file}`)
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    failures.push(`invalid_json:${path}:${error.message}`)
    return {}
  }
}

function git(args) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
}

function gitStatus(path) {
  return git(['status', '--short', '--', path])
}

function packageJsonAt(ref) {
  try {
    return JSON.parse(git(['show', `${ref}:package.json`]))
  } catch {
    return null
  }
}

const sourceAudit = readJson(`${reportDir}/source-of-truth-audit.json`)
const matrix = readJson(`${reportDir}/owner-lane-status-matrix.json`)
const aiGraphics = readJson(`${reportDir}/ai-graphics-worker-reconciliation-review.json`)
const sound = readJson(`${reportDir}/sound-oss-reconciliation-review.json`)
const tracka = readJson(`${reportDir}/tracka-private-e2e-reconciliation-review.json`)
const e2e = readJson(`${reportDir}/e2e-validation-reconciliation-review.json`)
const counts = readJson(`${reportDir}/reconciled-tool-count-summary.json`)
const nextPath = readJson(`${reportDir}/recommended-next-path.json`)
const decision = readJson(`${reportDir}/owner-lane-reconciliation-decision.json`)
const readiness = readJson(`${reportDir}/owner-lane-reconciliation-readiness-report.json`)
const manifest = readJson(`${reportDir}/owner-lane-reconciliation-private-artifact-manifest.json`)

if (sourceAudit.schema !== 'reeditpro.openSourceToolStack.ownerLaneReconciliationAfterBatch1Rollup.sourceAudit.v1') {
  failures.push(`source_schema:${sourceAudit.schema}`)
}
if (decision.schema !== 'reeditpro.openSourceToolStack.ownerLaneReconciliationAfterBatch1Rollup.decision.v1') {
  failures.push(`decision_schema:${decision.schema}`)
}
if (decision.decision !== expectedDecision) failures.push(`decision:${decision.decision}`)
if (decision.primaryNextPrompt !== primaryNextPrompt) failures.push(`primary_next_prompt:${decision.primaryNextPrompt}`)
if (readiness.readiness !== true) failures.push('readiness_not_true')
if (sourceAudit.expectedSourceSha !== '3fbbbb8ba3ea0e7f07a9bc956f72bc340ccec880') {
  failures.push(`source_sha:${sourceAudit.expectedSourceSha}`)
}
for (const report of [matrix, aiGraphics, sound, tracka, e2e, counts, nextPath]) {
  if (report.accepted !== true) failures.push(`report_not_accepted:${report.schema}`)
}

const rows = Array.isArray(matrix.details?.rows) ? matrix.details.rows : []
for (const lane of [
  'Central Batch 1',
  'AI graphics / Worker Runtime',
  'Sound/Music/Audio',
  'Track A Render/Export',
  'E2E validation queue',
  'Worker Runtime Track A private E2E contracts',
  'Tool Route Track A private E2E gates',
  'Model/provider context',
  'Supabase/storage context',
  'Web/Search',
  'Map/Geospatial',
]) {
  if (!rows.some((row) => row.lane === lane)) failures.push(`missing_lane:${lane}`)
}

if (counts.details?.inventoryCandidateCount !== 71) failures.push(`candidate_count:${counts.details?.inventoryCandidateCount}`)
if (counts.details?.aiGraphicsAcceptedWithWarningsCount !== 13) {
  failures.push(`ai_graphics_warning_count:${counts.details?.aiGraphicsAcceptedWithWarningsCount}`)
}
if (counts.details?.endToEndProductReadyTools !== 0) {
  failures.push(`end_to_end_product_ready_tools:${counts.details?.endToEndProductReadyTools}`)
}
if (counts.details?.fortyPlusToolsInstalledProvenEndToEndClaimAllowed !== false) {
  failures.push('forty_plus_claim_not_false')
}
if (aiGraphics.details?.runtimeApprovals?.workerExecution !== false) failures.push('ai_graphics_worker_runtime_not_false')
if (sound.details?.scopedStatus !== 'metadata_and_synthetic_fixture_evidence_with_warnings') {
  failures.push(`sound_scoped_status:${sound.details?.scopedStatus}`)
}
if (tracka.details?.status?.internalBetaUnlocked !== false) failures.push('tracka_internal_beta_not_false')
if (e2e.details?.blocker !== 'pr_305_validation_blocked_npm_ci_failed') failures.push(`e2e_blocker:${e2e.details?.blocker}`)
if (nextPath.details?.primaryNextPath !== primaryNextPrompt) failures.push(`recommended_primary:${nextPath.details?.primaryNextPath}`)

for (const field of [
  'batch2InstallProofApprovalNow',
  'productInternalBetaReadinessAggregationNow',
  'fortyPlusToolsEndToEndProven',
  'mediaProcessingAccepted',
  'mediaFileProbingAccepted',
  'captionBurnInAccepted',
  'renderExportAccepted',
  'workerRuntimeAccepted',
  'routeProviderRuntimeAccepted',
  'providerModelRuntimeAccepted',
  'supabaseGcsPublicDeliveryAccepted',
  'signedUrlDeliveryAccepted',
  'rawPromptExecutionAccepted',
  'externalBetaUnlocked',
  'productionUnlocked',
  'runtimeCommandsRunInThisPhase',
  'dockerRunInThisPhase',
  'ffmpegFfprobeRunInThisPhase',
  'buildContextGenerationRunInThisPhase',
  'npmInstallRunInThisPhase',
  'npmRebuildRunInThisPhase',
  'packageLockMutationAllowed',
  'githubPrMergeRunInThisPhase',
]) {
  if (decision[field] !== false) failures.push(`decision_${field}_not_false`)
}

for (const field of [
  'dependencyInstallRunInThisPhase',
  'npmInstallRunInThisPhase',
  'npmRebuildRunInThisPhase',
  'packageLockMutationAllowed',
  'dockerBuildRunInThisPhase',
  'dockerRunRunInThisPhase',
  'ffmpegProbeRunInThisPhase',
  'ffprobeProbeRunInThisPhase',
  'buildContextGenerationRunInThisPhase',
  'mediaProcessingRunInThisPhase',
  'mediaFileProbeRunInThisPhase',
  'captionBurnInRunInThisPhase',
  'renderExportRunInThisPhase',
  'workerExecutionRunInThisPhase',
  'routeExecutionRunInThisPhase',
  'providerModelCallsRunInThisPhase',
  'browserCaptureRunInThisPhase',
  'mapRenderingRunInThisPhase',
  'supabaseWritesRunInThisPhase',
  'sqlRunInThisPhase',
  'gcsUploadRunInThisPhase',
  'publicArtifactsCreated',
  'signedUrlsCreated',
  'rawPromptExecutionRunInThisPhase',
  'betaUnlocked',
  'productionUnlocked',
  'githubPrMergeRunInThisPhase',
  'privatePayloadsAccessed',
  'secretsAccessed',
  'secretsPrinted',
  'secretsCommitted',
]) {
  if (manifest[field] !== false) failures.push(`manifest_${field}_not_false`)
}

if (decision.supabaseClassification?.updateRequired !== 'no write') failures.push('decision_supabase_not_no_write')
if (manifest.supabaseClassification?.sqlExecuted !== 'none') failures.push('manifest_supabase_sql_not_none')

for (const path of ['package-lock.json', '.dockerignore', 'docker/prod/render-worker/Dockerfile']) {
  const status = gitStatus(path)
  if (status) failures.push(`protected_file_changed:${path}:${status}`)
}
for (const path of ['dist', 'dist-server', 'dist-remotion-worker', 'dist-staging-fixture-worker', 'dist-staging-real-video-export-worker', 'node_modules']) {
  if (existsSync(path)) failures.push(`forbidden_output_present:${path}`)
  const status = gitStatus(path)
  if (status) failures.push(`forbidden_output_staged_or_tracked:${path}:${status}`)
}

const basePackageJson = packageJsonAt('origin/codex/rp-github-merge-hygiene-open-pr-stack-audit')
const localPackageJson = JSON.parse(readFileSync('package.json', 'utf8'))
if (basePackageJson) {
  for (const key of ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies']) {
    if (JSON.stringify(localPackageJson[key] ?? {}) !== JSON.stringify(basePackageJson[key] ?? {})) {
      failures.push(`package_dependency_section_changed:${key}`)
    }
  }
}

const docsText = requiredFiles
  .filter((file) => existsSync(file))
  .map((file) => readFileSync(file, 'utf8'))
  .join('\n')
const forbiddenPatterns = [
  ['secret_material', /\b(AKIA[0-9A-Z]{16}|sk-(?:proj|live|test)-[A-Za-z0-9_-]{20,}|postgres(?:ql)?:\/\/|X-(?:Goog|Amz)-Signature=)\b/i],
  ['runtime_passed', /\b(workerRuntimeAccepted|routeProviderRuntimeAccepted|providerModelRuntimeAccepted)["']?\s*[:=]\s*true\b/i],
  ['media_processing_accepted_true', /\bmediaProcessingAccepted["']?\s*[:=]\s*true\b/i],
  ['render_export_accepted_true', /\brenderExportAccepted["']?\s*[:=]\s*true\b/i],
  ['external_beta_unlocked_true', /\bexternalBetaUnlocked["']?\s*[:=]\s*true\b/i],
  ['production_unlocked_true', /\bproductionUnlocked["']?\s*[:=]\s*true\b/i],
]
for (const [label, pattern] of forbiddenPatterns) {
  if (pattern.test(docsText)) failures.push(`forbidden_pattern:${label}`)
}

for (const line of docsText.split('\n')) {
  const lower = line.toLowerCase()
  const mentionsFortyPlusClaim =
    lower.includes('40+ tools') && (lower.includes('installed/proven') || lower.includes('end-to-end proven'))
  const safeWarning =
    lower.includes('do not claim') || lower.includes('warning') || lower.includes('claimallowed') || lower.includes('false')
  if (mentionsFortyPlusClaim && !safeWarning) failures.push(`forbidden_pattern:forty_plus_claim_positive:${line.trim()}`)
}

if (failures.length) {
  console.error('Owner-lane reconciliation diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: decision.decision,
      ownerLaneRows: rows.length,
      inventoryCandidateCount: counts.details.inventoryCandidateCount,
      aiGraphicsAcceptedWithWarningsCount: counts.details.aiGraphicsAcceptedWithWarningsCount,
      endToEndProductReadyTools: counts.details.endToEndProductReadyTools,
      primaryNextPrompt,
      supabaseClassification: decision.supabaseClassification,
    },
    null,
    2,
  ),
)
