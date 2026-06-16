import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'

const reportDir = 'docs/open-source-tool-stack/batch-1-qa-review'
const expectedDecision = 'open_source_tool_stack_batch_1_qa_passed_with_missing_optional_tools_ready_for_missing_optional_install_review'

const requiredFiles = [
  `${reportDir}/source-of-truth-audit.json`,
  `${reportDir}/pr-435-execution-evidence-review.json`,
  `${reportDir}/pr-435-execution-evidence-review.md`,
  `${reportDir}/passed-target-quality-review.json`,
  `${reportDir}/passed-target-quality-review.md`,
  `${reportDir}/missing-optional-tool-impact-review.json`,
  `${reportDir}/missing-optional-tool-impact-review.md`,
  `${reportDir}/package-lock-integrity-review.json`,
  `${reportDir}/package-lock-integrity-review.md`,
  `${reportDir}/internal-beta-relevance-review.json`,
  `${reportDir}/internal-beta-relevance-review.md`,
  `${reportDir}/blocked-scope-verification.json`,
  `${reportDir}/blocked-scope-verification.md`,
  `${reportDir}/batch-1-qa-review-decision.json`,
  `${reportDir}/batch-1-qa-review-decision.md`,
  `${reportDir}/batch-1-qa-review-readiness-report.json`,
  `${reportDir}/batch-1-qa-review-blocker-report.json`,
  `${reportDir}/batch-1-qa-review-private-artifact-manifest.json`,
  `${reportDir}/batch-1-qa-review-validation-results.md`,
  'docs/implementation-prompts/prompt-open-source-tool-stack-missing-optional-tool-install-review.md',
]

const requiredDecisionFiles = [
  'docs/open-source-tool-stack/batch-1-execution/batch-1-execution-decision.json',
  'docs/open-source-tool-stack/batch-1-execution/sharp-libvips-proof-report.json',
  'docs/open-source-tool-stack/batch-1-execution/duckdb-proof-report.json',
  'docs/open-source-tool-stack/batch-1-execution/polars-proof-report.json',
  'docs/open-source-tool-stack/batch-1-execution/ffmpeg-version-probe-report.json',
  'docs/open-source-tool-stack/batch-1-execution/ffprobe-version-probe-report.json',
]

const forbiddenPatterns = [
  ['dependency_install_allowed', /\bdependencyInstallAllowed["']?\s*[:=]\s*true\b/i],
  ['package_lock_mutation_allowed', /\bpackageLockMutationAllowed["']?\s*[:=]\s*true\b/i],
  ['new_tool_import_smoke_allowed', /\bnewToolImportSmokeAllowed["']?\s*[:=]\s*true\b/i],
  ['new_tool_version_probe_allowed', /\bnewToolVersionProbeAllowed["']?\s*[:=]\s*true\b/i],
  ['new_fixture_proof_allowed', /\bnewFixtureProofAllowed["']?\s*[:=]\s*true\b/i],
  ['tool_execution_allowed', /\btoolExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['route_execution_allowed', /\brouteExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['worker_execution_allowed', /\bworkerExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['provider_execution_allowed', /\bproviderExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['media_processing_allowed', /\bmediaProcessingAllowed["']?\s*[:=]\s*true\b/i],
  ['supabase_write_allowed', /\bsupabaseWritesAllowed["']?\s*[:=]\s*true\b/i],
  ['gcs_upload_allowed', /\bgcsUploadAllowed["']?\s*[:=]\s*true\b/i],
  ['public_artifact_allowed', /\bpublicArtifactsAllowed["']?\s*[:=]\s*true\b/i],
  ['signed_url_truth_allowed', /\bsignedUrlsAsSourceOfTruthAllowed["']?\s*[:=]\s*true\b/i],
  ['raw_prompt_allowed', /\brawPromptExecutionAllowed["']?\s*[:=]\s*true\b/i],
  ['production_unlock_allowed', /\bproductionUnlockAllowed["']?\s*[:=]\s*true\b/i],
  ['pr384_canonical', /PR #384.*canonical/i],
  ['secret_material', /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|X-(?:Goog|Amz)-Signature=)\b/i],
]

const failures = []

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch (error) {
    failures.push(`invalid_json:${path}:${error.message}`)
    return undefined
  }
}

for (const file of [...requiredFiles, ...requiredDecisionFiles]) {
  if (!existsSync(file)) failures.push(`missing_file:${file}`)
}

const docsText = requiredFiles
  .filter((file) => existsSync(file))
  .map((file) => `\n--- ${file} ---\n${readFileSync(file, 'utf8')}`)
  .join('\n')

for (const [name, pattern] of forbiddenPatterns) {
  const match = docsText.match(pattern)
  if (match) failures.push(`forbidden_pattern:${name}:${match[0]}`)
}

const decision = existsSync(`${reportDir}/batch-1-qa-review-decision.json`) ? readJson(`${reportDir}/batch-1-qa-review-decision.json`) : undefined
const evidence = existsSync(`${reportDir}/pr-435-execution-evidence-review.json`) ? readJson(`${reportDir}/pr-435-execution-evidence-review.json`) : undefined
const passedTargets = existsSync(`${reportDir}/passed-target-quality-review.json`) ? readJson(`${reportDir}/passed-target-quality-review.json`) : undefined
const missingOptional = existsSync(`${reportDir}/missing-optional-tool-impact-review.json`) ? readJson(`${reportDir}/missing-optional-tool-impact-review.json`) : undefined
const packageLock = existsSync(`${reportDir}/package-lock-integrity-review.json`) ? readJson(`${reportDir}/package-lock-integrity-review.json`) : undefined
const internalBeta = existsSync(`${reportDir}/internal-beta-relevance-review.json`) ? readJson(`${reportDir}/internal-beta-relevance-review.json`) : undefined
const blockedScope = existsSync(`${reportDir}/blocked-scope-verification.json`) ? readJson(`${reportDir}/blocked-scope-verification.json`) : undefined
const executionDecision = existsSync('docs/open-source-tool-stack/batch-1-execution/batch-1-execution-decision.json')
  ? readJson('docs/open-source-tool-stack/batch-1-execution/batch-1-execution-decision.json')
  : undefined

if (decision) {
  if (decision.schema !== 'reeditpro.openSourceToolStack.batch1QaReview.decision.v1') failures.push(`decision_schema:${decision.schema}`)
  if (decision.decision !== expectedDecision) failures.push(`decision:${decision.decision}`)
  if (decision.nextPrompt !== 'OPEN_SOURCE_TOOL_STACK_MISSING_OPTIONAL_TOOL_INSTALL_REVIEW') failures.push(`next_prompt:${decision.nextPrompt}`)
  if (decision.dependencyInstallAttempted !== false) failures.push('decision_dependency_install_attempted')
  if (decision.packageLockMutationAttempted !== false) failures.push('decision_package_lock_mutation_attempted')
  if (decision.newToolImportSmokeRun !== false) failures.push('decision_new_import_smoke_run')
  if (decision.newToolVersionProbeRun !== false) failures.push('decision_new_version_probe_run')
  if (decision.newFixtureProofRun !== false) failures.push('decision_new_fixture_proof_run')
  if (decision.missingOptionalToolsCountedAsInstalledOrProven !== false) failures.push('missing_optional_counted_as_proven')
  if (decision.fullToolImplementationReadinessClaimed !== false) failures.push('full_tool_readiness_claimed')
  if (decision.supabaseClassification?.updateRequired !== 'no write') failures.push('supabase_update_not_no_write')
  if (decision.executionScope && Object.values(decision.executionScope).some((value) => value !== false)) failures.push('decision_execution_scope_not_all_false')
}

if (executionDecision?.decision !== 'open_source_tool_stack_batch_1_execution_passed_with_missing_optional_tools') {
  failures.push(`execution_decision:${executionDecision?.decision}`)
}
if (evidence?.passed !== true) failures.push('evidence_review_not_passed')
if (passedTargets?.passed !== true) failures.push('passed_target_review_not_passed')
if (missingOptional?.passed !== true) failures.push('missing_optional_review_not_passed')
if (missingOptional?.installReviewRequiredBeforeCountingMissingTools !== true) failures.push('missing_optional_install_review_not_required')
if (missingOptional?.blocksBatch2ExecutionRecommendation !== true) failures.push('missing_optional_does_not_block_batch2_execution')
if (packageLock?.passed !== true) failures.push('package_lock_review_not_passed')
if (internalBeta?.passed !== true) failures.push('internal_beta_review_not_passed')
if (blockedScope?.passed !== true) failures.push('blocked_scope_review_not_passed')

let packageLockStatus = ''
try {
  packageLockStatus = execFileSync('git', ['status', '--short', '--', 'package-lock.json'], {
    encoding: 'utf8',
    env: { ...process.env, DEVELOPER_DIR: '/Library/Developer/CommandLineTools' },
  }).trim()
} catch (error) {
  failures.push(`git_status_package_lock_failed:${error.message}`)
}
if (packageLockStatus) failures.push(`package_lock_has_git_status:${packageLockStatus}`)

if (failures.length) {
  console.error('Open-source Batch 1 QA review diagnostics failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(
  JSON.stringify(
    {
      status: 'passed',
      decision: decision?.decision,
      nextPrompt: decision?.nextPrompt,
      acceptedWithWarnings: decision?.acceptedWithWarnings,
      packageLockUnchanged: packageLock?.packageLockUnchanged,
      missingOptionalCount: Array.isArray(missingOptional?.targets) ? missingOptional.targets.length : 0,
      supabaseClassification: decision?.supabaseClassification,
    },
    null,
    2
  )
)
