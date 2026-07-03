import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  BATCH_1_EXECUTION_REPORT_DIR,
  buildOpenSourceToolStackBatch1ExecutionPlan,
  buildOpenSourceToolStackBatch1ExecutionReports,
} from '../activation/open-source-tool-stack-batch-1-execution'

const plan = buildOpenSourceToolStackBatch1ExecutionPlan()
const reports = buildOpenSourceToolStackBatch1ExecutionReports()

const requiredReports = [
  'source-of-truth-audit.json',
  'dependency-baseline-validation.json',
  'dependency-baseline-validation.md',
  'selected-target-guard.json',
  'selected-target-guard.md',
  'duckdb-proof-report.json',
  'polars-proof-report.json',
  'sharp-libvips-proof-report.json',
  'ffmpeg-version-probe-report.json',
  'ffprobe-version-probe-report.json',
  'route-capability-manifest-validation-report.json',
  'fixture-report-validation-report.json',
  'inventory-proof-matrix-validation-report.json',
  'side-effect-and-lock-integrity-report.json',
  'batch-1-execution-decision.json',
  'batch-1-execution-decision.md',
  'batch-1-execution-blocker-report.json',
  'batch-1-execution-readiness-report.json',
  'batch-1-execution-private-artifact-manifest.json',
  'batch-1-execution-validation-results.md',
]

assert.equal(plan.mode, 'no_install_no_lock_mutation_selected_proofs_only')
assert.equal(plan.approvedTargets.length, 8)
assert.ok(
  [
    'open_source_tool_stack_batch_1_execution_passed_ready_for_batch_1_qa_review',
    'open_source_tool_stack_batch_1_execution_passed_with_missing_optional_tools',
    'blocked_pending_batch_1_proof_validation',
  ].includes(String(reports.decision.decision))
)
assert.equal(reports.selectedTargetGuard.passed, true)
assert.equal(reports.routeCapabilityManifestValidation.passed, true)
assert.equal(reports.fixtureReportValidation.passed, true)
assert.equal(reports.inventoryProofMatrixValidation.passed, true)

for (const report of requiredReports) {
  assert.equal(fs.existsSync(`${BATCH_1_EXECUTION_REPORT_DIR}/${report}`), true, `Missing report ${report}`)
}

const scanText = requiredReports
  .map((file) => fs.readFileSync(`${BATCH_1_EXECUTION_REPORT_DIR}/${file}`, 'utf8'))
  .join('\n')

const forbiddenPatterns = [
  /\bdependencyInstallAllowed["']?\s*[:=]\s*true\b/i,
  /\bpackageLockMutationAllowed["']?\s*[:=]\s*true\b/i,
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
  /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|X-Goog-Signature=|X-Amz-Signature=)\b/i,
]

for (const pattern of forbiddenPatterns) {
  assert.equal(pattern.test(scanText), false, `Forbidden pattern matched: ${pattern}`)
}

console.log('Open-source tool stack Batch 1 execution smoke passed.')
