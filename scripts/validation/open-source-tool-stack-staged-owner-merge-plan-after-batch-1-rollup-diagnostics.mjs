import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const reportDir = 'docs/open-source-tool-stack/staged-owner-merge-plan-after-batch-1-rollup'
const expectedDecision = 'staged_owner_merge_plan_passed_ready_for_e2e_validation_pr305_hydration_blocker_resolution'
const primaryNextPrompt = 'E2E_VALIDATION_PR_305_HYDRATION_BLOCKER_RESOLUTION'
const expectedPr523MergedAt = '2026-06-19T02:04:29Z'
const expectedPr523MergeCommit = 'f258967676c4877d3e1627b5710b789cff04b451'
const expectedPr305Blocker = 'pr_305_validation_blocked_npm_ci_failed'
const expectedQueueDecision = 'reeditpro_e2e_validation_queue_1_blocked_validation_failures'

const requiredFiles = [
  'source-of-truth-audit.json',
  'staged-owner-merge-plan.json',
  'staged-owner-merge-plan.md',
  'owner-pr-stack-order.json',
  'owner-pr-stack-order.md',
  'merge-readiness-blocker-matrix.json',
  'merge-readiness-blocker-matrix.md',
  'tool-count-and-claim-policy.json',
  'tool-count-and-claim-policy.md',
  'internal-beta-dependency-map.json',
  'internal-beta-dependency-map.md',
  'recommended-next-path.json',
  'recommended-next-path.md',
  'staged-owner-merge-plan-decision.json',
  'staged-owner-merge-plan-decision.md',
  'staged-owner-merge-plan-readiness-report.json',
  'staged-owner-merge-plan-private-artifact-manifest.json',
  'staged-owner-merge-plan-validation-results.md',
].map((file) => `${reportDir}/${file}`)

const requiredPromptFiles = [
  'docs/implementation-prompts/prompt-e2e-validation-pr-305-hydration-blocker-resolution.md',
  'docs/implementation-prompts/prompt-open-source-tool-stack-ai-graphics-worker-source-review-after-batch-1.md',
  'docs/implementation-prompts/prompt-open-source-tool-stack-sound-oss-source-reconciliation-after-batch-1.md',
  'docs/implementation-prompts/prompt-open-source-tool-stack-tracka-private-e2e-source-reconciliation-after-batch-1.md',
  'docs/implementation-prompts/prompt-product-internal-beta-readiness-aggregation-after-open-source-owner-reconciliation.md',
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

function readText(path) {
  try {
    return readFileSync(path, 'utf8')
  } catch {
    return ''
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
const stagedPlan = readJson(`${reportDir}/staged-owner-merge-plan.json`)
const ownerOrder = readJson(`${reportDir}/owner-pr-stack-order.json`)
const blockerMatrix = readJson(`${reportDir}/merge-readiness-blocker-matrix.json`)
const claimPolicy = readJson(`${reportDir}/tool-count-and-claim-policy.json`)
const betaMap = readJson(`${reportDir}/internal-beta-dependency-map.json`)
const nextPath = readJson(`${reportDir}/recommended-next-path.json`)
const decision = readJson(`${reportDir}/staged-owner-merge-plan-decision.json`)
const readiness = readJson(`${reportDir}/staged-owner-merge-plan-readiness-report.json`)
const manifest = readJson(`${reportDir}/staged-owner-merge-plan-private-artifact-manifest.json`)

if (sourceAudit.schema !== 'reeditpro.openSourceToolStack.stagedOwnerMergePlanAfterBatch1Rollup.sourceAudit.v1') {
  failures.push(`source_schema:${sourceAudit.schema}`)
}
if (decision.schema !== 'reeditpro.openSourceToolStack.stagedOwnerMergePlanAfterBatch1Rollup.decision.v1') {
  failures.push(`decision_schema:${decision.schema}`)
}
if (decision.decision !== expectedDecision) failures.push(`decision:${decision.decision}`)
if (decision.primaryNextPrompt !== primaryNextPrompt) failures.push(`primary_next_prompt:${decision.primaryNextPrompt}`)
if (readiness.readiness !== true) failures.push('readiness_not_true')
if (sourceAudit.expectedSourceSha !== '40a7a25c319aea2f3ff8149aa5a7a9e6206ed346') {
  failures.push(`source_sha:${sourceAudit.expectedSourceSha}`)
}

for (const report of [stagedPlan, ownerOrder, blockerMatrix, claimPolicy, betaMap, nextPath]) {
  if (report.accepted !== true) failures.push(`report_not_accepted:${report.schema}`)
}

const stages = Array.isArray(stagedPlan.details?.stages) ? stagedPlan.details.stages : []
for (const id of [
  'central_source_hygiene_and_duplicate_avoidance',
  'e2e_validation_pr305_hydration_blocker_resolution',
  'ai_graphics_worker_source_review',
  'sound_oss_source_reconciliation',
  'tracka_private_e2e_source_reconciliation',
  'batch2_install_proof_readiness_decision',
  'product_internal_beta_readiness_aggregation',
]) {
  if (!stages.some((stage) => stage.id === id)) failures.push(`missing_stage:${id}`)
}

if (claimPolicy.details?.inventoryCandidateCount !== 71) failures.push(`candidate_count:${claimPolicy.details?.inventoryCandidateCount}`)
if (claimPolicy.details?.aiGraphicsAcceptedWithWarningsCount !== 13) {
  failures.push(`ai_graphics_warning_count:${claimPolicy.details?.aiGraphicsAcceptedWithWarningsCount}`)
}
if (claimPolicy.details?.endToEndProductReadyTools !== 0) {
  failures.push(`end_to_end_product_ready_tools:${claimPolicy.details?.endToEndProductReadyTools}`)
}
if (claimPolicy.details?.fortyPlusToolsInstalledProvenEndToEndClaimAllowed !== false) {
  failures.push('forty_plus_claim_not_false')
}
if (nextPath.details?.primaryNextPath !== primaryNextPrompt) failures.push(`recommended_primary:${nextPath.details?.primaryNextPath}`)
if (nextPath.details?.primaryDecision !== expectedDecision) failures.push(`recommended_decision:${nextPath.details?.primaryDecision}`)
if (decision.e2ePr523?.state !== 'MERGED') failures.push(`pr523_state:${decision.e2ePr523?.state}`)
if (decision.e2ePr523?.isDraft !== false) failures.push(`pr523_draft:${decision.e2ePr523?.isDraft}`)
if (decision.e2ePr523?.mergedAt !== expectedPr523MergedAt) {
  failures.push(`pr523_merged_at:${decision.e2ePr523?.mergedAt}`)
}
if (decision.e2ePr523?.mergeCommitOid !== expectedPr523MergeCommit) {
  failures.push(`pr523_merge_commit:${decision.e2ePr523?.mergeCommitOid}`)
}
if (decision.pr305Blocker !== expectedPr305Blocker) failures.push(`pr305_blocker:${decision.pr305Blocker}`)
if (decision.queueDecision !== expectedQueueDecision) failures.push(`queue_decision:${decision.queueDecision}`)
if (decision.mergeReadyValidations !== 0) failures.push(`merge_ready_validations:${decision.mergeReadyValidations}`)

for (const field of [
  'fortyPlusToolsEndToEndProven',
  'workerRuntimeAccepted',
  'mediaProcessingAccepted',
  'mediaFileProbingAccepted',
  'captionBurnInAccepted',
  'renderExportAccepted',
  'routeProviderRuntimeAccepted',
  'providerModelRuntimeAccepted',
  'supabaseGcsPublicDeliveryAccepted',
  'signedUrlDeliveryAccepted',
  'rawPromptExecutionAccepted',
  'internalBetaUnlocked',
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

const allReportText = requiredFiles.map(readText).join('\n').toLowerCase()
const allCheckedText = [...requiredFiles, ...requiredPromptFiles].map(readText).join('\n').toLowerCase()
const stalePr523Patterns = [
  new RegExp('pr #?523 remains ' + 'open'),
  new RegExp('#523 remains ' + 'open'),
  new RegExp('pr #?523 remains ' + 'open draft'),
  new RegExp('pr #?523 remains ' + 'open/draft'),
  new RegExp('#523 is ' + 'open draft'),
  new RegExp('open draft ' + 'and blocked'),
  /pr #?523[^.\n]{0,120}state=open/,
  /pr #?523[^.\n]{0,120}draft=true/,
]
for (const pattern of stalePr523Patterns) {
  if (pattern.test(allCheckedText)) failures.push(`stale_pr523_wording:${pattern}`)
}
if (!allCheckedText.includes('pr #523 is merged and now serves as source evidence')) {
  failures.push('missing_pr523_merged_source_evidence_wording')
}
if (!allCheckedText.includes(`pr #523 merged at ${expectedPr523MergedAt.toLowerCase()} with merge commit ${expectedPr523MergeCommit}`)) {
  failures.push('missing_pr523_merged_at_commit_wording')
}
if (!allCheckedText.includes(`pr #305 remains blocked by ${expectedPr305Blocker}`)) {
  failures.push('missing_pr305_blocker_wording')
}
if (!allCheckedText.includes('merge-ready validations remain 0')) {
  failures.push('missing_merge_ready_validations_0_wording')
}
if (/e2e (queue|validation)[^.\n]{0,120}(unblocked|ready|passed)/i.test(allCheckedText)) {
  failures.push('forbidden_e2e_unblocked_claim')
}
if (/"mergeReadyValidations"\s*:\s*[1-9]/.test(allCheckedText)) {
  failures.push('merge_ready_validations_greater_than_0_claim')
}
const forbiddenPositivePatterns = [
  /40\+ tools (are )?(installed|proven)/,
  /worker runtime (is )?(ready|passed|accepted|unlocked)/,
  /media processing (is )?(ready|passed|accepted|unlocked)/,
  /render\/export (is )?(ready|passed|accepted|unlocked)/,
  /production (is )?(ready|unlocked|enabled)/,
  /external beta (is )?(ready|unlocked|enabled)/,
]
for (const pattern of forbiddenPositivePatterns) {
  const matches = allReportText.match(pattern)
  if (matches && !allReportText.includes(`do not claim 40+ tools`)) {
    failures.push(`forbidden_claim:${pattern}`)
  }
}

for (const number of [384, 401, 417, 420, 423, 425, 428, 432]) {
  const canonicalPattern = new RegExp(`pr #?${number}[^\\n]{0,120}(central|canonical|source-of-truth)`, 'i')
  if (canonicalPattern.test(allReportText) && !new RegExp(`pr #?${number}[^\\n]{0,160}(reference|non-canonical)`, 'i').test(allReportText)) {
    failures.push(`reference_pr_treated_as_canonical:${number}`)
  }
}

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

const secretPatterns = [
  new RegExp('service_' + 'role[_-]?key', 'i'),
  /postgres:\/\/[^`\s]+/i,
  new RegExp('supabase[^`\\n]{0,80}(anon|' + 'service)[_-]?key', 'i'),
  new RegExp('https?:\\/\\/[^`\\s]+(X-' + 'Amz-Signature|X-' + 'Goog-Signature|s' + 'ig=|sign' + 'ature=)', 'i'),
  new RegExp('x-' + 'goog-signature', 'i'),
  /ghp_[A-Za-z0-9_]{20,}/,
  /sk-[A-Za-z0-9]{20,}/,
]
for (const file of [...requiredFiles, ...requiredPromptFiles]) {
  const text = readText(file)
  for (const pattern of secretPatterns) {
    if (pattern.test(text)) failures.push(`secret_pattern:${file}:${pattern}`)
  }
}

if (failures.length) {
  console.error('Staged owner merge plan diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      ok: true,
      decision: decision.decision,
      primaryNextPrompt: decision.primaryNextPrompt,
      inventoryCandidateCount: claimPolicy.details?.inventoryCandidateCount,
      aiGraphicsAcceptedWithWarningsCount: claimPolicy.details?.aiGraphicsAcceptedWithWarningsCount,
      endToEndProductReadyTools: claimPolicy.details?.endToEndProductReadyTools,
      supabaseClassification: decision.supabaseClassification,
    },
    null,
    2,
  ),
)
