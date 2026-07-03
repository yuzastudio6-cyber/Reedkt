import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR,
  buildOpenSourceToolStackMissingOptionalInstallReviewPlan,
  buildOpenSourceToolStackMissingOptionalInstallReviewReports,
} from '../activation/open-source-tool-stack-missing-optional-install-review'

const plan = buildOpenSourceToolStackMissingOptionalInstallReviewPlan()
const reports = buildOpenSourceToolStackMissingOptionalInstallReviewReports()

const requiredReports = [
  'source-of-truth-audit.json',
  'evidence-revalidation-report.json',
  'evidence-revalidation-report.md',
  'duckdb-install-strategy.json',
  'duckdb-install-strategy.md',
  'polars-install-strategy.json',
  'polars-install-strategy.md',
  'ffmpeg-ffprobe-install-strategy.json',
  'ffmpeg-ffprobe-install-strategy.md',
  'package-lock-dependency-policy.json',
  'package-lock-dependency-policy.md',
  'system-binary-container-policy.json',
  'system-binary-container-policy.md',
  'synthetic-proof-plan.json',
  'synthetic-proof-plan.md',
  'missing-optional-install-review-decision.json',
  'missing-optional-install-review-decision.md',
  'missing-optional-install-review-readiness-report.json',
  'missing-optional-install-review-blocker-report.json',
  'missing-optional-install-review-private-artifact-manifest.json',
  'missing-optional-install-review-validation-results.md',
]

assert.equal(plan.mode, 'metadata_install_strategy_review_only_no_install_no_proofs')
assert.equal(reports.decision.decision, 'missing_optional_install_review_passed_ready_for_package_and_binary_approval')
assert.equal(reports.evidenceRevalidationReport.passed, true)
assert.equal(reports.duckdbInstallStrategy.selectedFuturePackageCandidate, 'duckdb')
assert.equal(reports.polarsInstallStrategy.selectedFuturePackageCandidate, 'nodejs-polars')
assert.equal(reports.ffmpegFfprobeInstallStrategy.passed, true)
assert.equal(reports.packageLockDependencyPolicy.passed, true)
assert.equal(reports.systemBinaryContainerPolicy.passed, true)
assert.equal(reports.syntheticProofPlan.proofExecutionAllowedInThisReview, false)

for (const report of requiredReports) {
  assert.equal(fs.existsSync(`${MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR}/${report}`), true, `Missing report ${report}`)
}

const scanText = requiredReports
  .map((file) => fs.readFileSync(`${MISSING_OPTIONAL_INSTALL_REVIEW_REPORT_DIR}/${file}`, 'utf8'))
  .join('\n')

const forbiddenPatterns = [
  /\bdependencyInstallAllowed["']?\s*[:=]\s*true\b/i,
  /\bpackageLockMutationAllowed["']?\s*[:=]\s*true\b/i,
  /\bsystemBinaryInstallAllowed["']?\s*[:=]\s*true\b/i,
  /\bcontainerImageMutationAllowed["']?\s*[:=]\s*true\b/i,
  /\bimportSmokeAllowed["']?\s*[:=]\s*true\b/i,
  /\bversionProbeAllowed["']?\s*[:=]\s*true\b/i,
  /\bfixtureProofAllowed["']?\s*[:=]\s*true\b/i,
  /\btoolExecutionAllowed["']?\s*[:=]\s*true\b/i,
  /\brouteExecutionAllowed["']?\s*[:=]\s*true\b/i,
  /\bworkerExecutionAllowed["']?\s*[:=]\s*true\b/i,
  /\bproviderExecutionAllowed["']?\s*[:=]\s*true\b/i,
  /\bmediaProcessingAllowed["']?\s*[:=]\s*true\b/i,
  /\bsupabaseWritesAllowed["']?\s*[:=]\s*true\b/i,
  /\bgcsUploadAllowed["']?\s*[:=]\s*true\b/i,
  /\bpublicArtifactsAllowed["']?\s*[:=]\s*true\b/i,
  /\bsignedUrlsAsSourceOfTruthAllowed["']?\s*[:=]\s*true\b/i,
  /\brawPromptExecutionAllowed["']?\s*[:=]\s*true\b/i,
  /\bproductionUnlockAllowed["']?\s*[:=]\s*true\b/i,
  /PR #384.*canonical/i,
  /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|X-(?:Goog|Amz)-Signature=)\b/i,
]

for (const pattern of forbiddenPatterns) {
  assert.equal(pattern.test(scanText), false, `Forbidden pattern matched: ${pattern}`)
}

console.log('Open-source missing optional install review smoke passed.')
