import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  BATCH_1_QA_REVIEW_REPORT_DIR,
  buildOpenSourceToolStackBatch1QaReviewPlan,
  buildOpenSourceToolStackBatch1QaReviewReports,
} from '../activation/open-source-tool-stack-batch-1-qa-review'

const plan = buildOpenSourceToolStackBatch1QaReviewPlan()
const reports = buildOpenSourceToolStackBatch1QaReviewReports()

const requiredReports = [
  'source-of-truth-audit.json',
  'pr-435-execution-evidence-review.json',
  'pr-435-execution-evidence-review.md',
  'passed-target-quality-review.json',
  'passed-target-quality-review.md',
  'missing-optional-tool-impact-review.json',
  'missing-optional-tool-impact-review.md',
  'package-lock-integrity-review.json',
  'package-lock-integrity-review.md',
  'internal-beta-relevance-review.json',
  'internal-beta-relevance-review.md',
  'blocked-scope-verification.json',
  'blocked-scope-verification.md',
  'batch-1-qa-review-decision.json',
  'batch-1-qa-review-decision.md',
  'batch-1-qa-review-readiness-report.json',
  'batch-1-qa-review-blocker-report.json',
  'batch-1-qa-review-private-artifact-manifest.json',
  'batch-1-qa-review-validation-results.md',
]

assert.equal(plan.mode, 'metadata_review_only_no_new_proofs')
assert.equal(reports.decision.decision, 'open_source_tool_stack_batch_1_qa_passed_with_missing_optional_tools_ready_for_missing_optional_install_review')
assert.equal(reports.pr435ExecutionEvidenceReview.passed, true)
assert.equal(reports.passedTargetQualityReview.passed, true)
assert.equal(reports.missingOptionalToolImpactReview.passed, true)
assert.equal(reports.packageLockIntegrityReview.passed, true)
assert.equal(reports.blockedScopeVerification.passed, true)

for (const report of requiredReports) {
  assert.equal(fs.existsSync(`${BATCH_1_QA_REVIEW_REPORT_DIR}/${report}`), true, `Missing report ${report}`)
}

const scanText = requiredReports
  .map((file) => fs.readFileSync(`${BATCH_1_QA_REVIEW_REPORT_DIR}/${file}`, 'utf8'))
  .join('\n')

const forbiddenPatterns = [
  /\bdependencyInstallAllowed["']?\s*[:=]\s*true\b/i,
  /\bpackageLockMutationAllowed["']?\s*[:=]\s*true\b/i,
  /\bnewToolImportSmokeAllowed["']?\s*[:=]\s*true\b/i,
  /\bnewToolVersionProbeAllowed["']?\s*[:=]\s*true\b/i,
  /\bnewFixtureProofAllowed["']?\s*[:=]\s*true\b/i,
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

console.log('Open-source tool stack Batch 1 QA review smoke passed.')
