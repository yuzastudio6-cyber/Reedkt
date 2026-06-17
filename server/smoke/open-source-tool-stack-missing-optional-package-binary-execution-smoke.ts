import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  PACKAGE_BINARY_EXECUTION_REPORT_DIR,
  buildOpenSourceToolStackPackageBinaryExecutionPlan,
  buildOpenSourceToolStackPackageBinaryExecutionReports,
  readOpenSourceToolStackPackageBinaryExecutionArtifacts,
} from '../activation/open-source-missing-optional-package-binary-execution'

const plan = buildOpenSourceToolStackPackageBinaryExecutionPlan()
const reports = readOpenSourceToolStackPackageBinaryExecutionArtifacts() ?? buildOpenSourceToolStackPackageBinaryExecutionReports()

assert.equal(plan.approvedPackageCommand, 'npm install duckdb nodejs-polars --save-exact --ignore-scripts --no-audit --no-fund')
assert.deepEqual(plan.approvedPackageTargets, ['duckdb', 'nodejs-polars'])
assert.deepEqual(plan.checkOnlyBinaryTargets, ['ffmpeg', 'ffprobe'])
assert.ok(
  [
    'missing_optional_package_and_binary_execution_passed_ready_for_qa',
    'missing_optional_package_execution_passed_binary_missing_ready_for_system_binary_review',
    'missing_optional_package_install_passed_import_proof_blocked_by_ignored_scripts',
    'blocked_pending_duckdb_install_or_import',
    'blocked_pending_polars_install_or_import',
    'blocked_pending_package_lock_integrity',
    'blocked_pending_ffmpeg_binary_presence',
    'blocked_pending_ffprobe_binary_presence',
    'rejected_due_runtime_safety_risk',
  ].includes(String(reports.decision.decision))
)
assert.equal(reports.decision.systemBinaryInstallAttempted, false)
assert.equal(reports.decision.containerMutationAttempted, false)
assert.equal(reports.decision.mediaProcessingAttempted, false)
assert.equal(reports.decision.supabaseWritesAttempted, false)
assert.equal(reports.decision.publicArtifactsCreated, false)
assert.equal(reports.decision.signedUrlsCreated, false)

const requiredReports = [
  'source-of-truth-audit.json',
  'pre-install-baseline-report.json',
  'pre-install-baseline-report.md',
  'package-install-report.json',
  'package-install-report.md',
  'post-install-npm-ci-report.json',
  'duckdb-proof-report.json',
  'polars-proof-report.json',
  'ffmpeg-version-check-report.json',
  'ffprobe-version-check-report.json',
  'package-lock-integrity-report.json',
  'package-lock-integrity-report.md',
  'side-effect-safety-report.json',
  'package-binary-execution-decision.json',
  'package-binary-execution-decision.md',
  'package-binary-execution-readiness-report.json',
  'package-binary-execution-private-artifact-manifest.json',
  'package-binary-execution-validation-results.md',
]

if (fs.existsSync(PACKAGE_BINARY_EXECUTION_REPORT_DIR)) {
  for (const report of requiredReports) {
    assert.equal(fs.existsSync(`${PACKAGE_BINARY_EXECUTION_REPORT_DIR}/${report}`), true, `Missing report ${report}`)
  }

  const scanText = requiredReports
    .map((file) => fs.readFileSync(`${PACKAGE_BINARY_EXECUTION_REPORT_DIR}/${file}`, 'utf8'))
    .join('\n')

  const forbiddenPatterns = [
    /\bworkerExecutionAllowed["']?\s*[:=]\s*true\b/i,
    /\brouteExecutionAllowed["']?\s*[:=]\s*true\b/i,
    /\bproviderExecutionAllowed["']?\s*[:=]\s*true\b/i,
    /\bmediaProcessingAllowed["']?\s*[:=]\s*true\b/i,
    /\bsupabaseWritesAllowed["']?\s*[:=]\s*true\b/i,
    /\bgcsUploadAllowed["']?\s*[:=]\s*true\b/i,
    /\bpublicArtifactsAllowed["']?\s*[:=]\s*true\b/i,
    /\bsignedUrlsAsSourceOfTruthAllowed["']?\s*[:=]\s*true\b/i,
    /\brawPromptExecutionAllowed["']?\s*[:=]\s*true\b/i,
    /\bproductionUnlockAllowed["']?\s*[:=]\s*true\b/i,
    /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|X-Goog-Signature=|X-Amz-Signature=)\b/i,
  ]

  for (const pattern of forbiddenPatterns) {
    assert.equal(pattern.test(scanText), false, `Forbidden pattern matched: ${pattern}`)
  }
}

console.log('Open-source missing optional package/binary execution smoke passed.')
