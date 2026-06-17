import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR,
  buildOpenSourceToolStackMissingOptionalPackageBinaryApprovalPlan,
  buildOpenSourceToolStackMissingOptionalPackageBinaryApprovalReports,
} from '../activation/open-source-tool-stack-missing-optional-package-binary-approval'

const plan = buildOpenSourceToolStackMissingOptionalPackageBinaryApprovalPlan()
const reports = buildOpenSourceToolStackMissingOptionalPackageBinaryApprovalReports()

const requiredReports = [
  'source-of-truth-audit.json',
  'evidence-revalidation-report.json',
  'evidence-revalidation-report.md',
  'duckdb-package-approval.json',
  'duckdb-package-approval.md',
  'polars-package-approval.json',
  'polars-package-approval.md',
  'ffmpeg-ffprobe-binary-approval.json',
  'ffmpeg-ffprobe-binary-approval.md',
  'package-lock-policy.json',
  'package-lock-policy.md',
  'system-binary-worker-container-policy.json',
  'system-binary-worker-container-policy.md',
  'future-execution-scope.json',
  'future-execution-scope.md',
  'package-binary-approval-decision.json',
  'package-binary-approval-decision.md',
  'package-binary-approval-readiness-report.json',
  'package-binary-approval-blocker-report.json',
  'package-binary-approval-private-artifact-manifest.json',
  'package-binary-approval-validation-results.md',
]

assert.equal(plan.mode, 'approval_metadata_only_no_install_no_lock_mutation_no_proofs')
assert.equal(reports.decision.decision, 'missing_optional_package_and_binary_approval_passed_ready_for_execution')
assert.equal(reports.evidenceRevalidationReport.passed, true)
assert.equal(reports.duckdbPackageApproval.selectedFuturePackageCandidate, 'duckdb')
assert.equal(reports.polarsPackageApproval.selectedFuturePackageCandidate, 'nodejs-polars')
assert.equal(reports.ffmpegFfprobeBinaryApproval.passed, true)
assert.equal(reports.packageLockPolicy.packageLockUnchangedInThisApproval, true)
assert.equal(reports.futureExecutionScope.currentPhaseExecutionAllowed, false)

for (const report of requiredReports) {
  assert.equal(fs.existsSync(`${MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR}/${report}`), true, `Missing report ${report}`)
}

const scanText = requiredReports
  .map((file) => fs.readFileSync(`${MISSING_OPTIONAL_PACKAGE_BINARY_APPROVAL_REPORT_DIR}/${file}`, 'utf8'))
  .join('\n')

const forbiddenPatterns = [
  /\bdependencyInstallAllowed["']?\s*[:=]\s*true\b/i,
  /\bpackageInstallAllowed["']?\s*[:=]\s*true\b/i,
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
  /"pr384Canonical"\s*:\s*true/i,
  /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|X-(?:Goog|Amz)-Signature=)\b/i,
]

for (const pattern of forbiddenPatterns) {
  assert.equal(pattern.test(scanText), false, `Forbidden pattern matched: ${pattern}`)
}

console.log('Open-source missing optional package/binary approval smoke passed.')
