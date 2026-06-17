import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR,
  buildOpenSourceToolStackDuckdbNativeRebuildQaReviewPlan,
  buildOpenSourceToolStackDuckdbNativeRebuildQaReviewReports,
} from '../activation/open-source-tool-stack-duckdb-native-rebuild-qa-review'

const plan = buildOpenSourceToolStackDuckdbNativeRebuildQaReviewPlan()
const reports = buildOpenSourceToolStackDuckdbNativeRebuildQaReviewReports()

const requiredReports = [
  'source-of-truth-audit.json',
  'evidence-revalidation-report.json',
  'evidence-revalidation-report.md',
  'duckdb-proof-qa.json',
  'duckdb-proof-qa.md',
  'polars-status-qa.json',
  'polars-status-qa.md',
  'ffmpeg-ffprobe-missing-binary-qa.json',
  'ffmpeg-ffprobe-missing-binary-qa.md',
  'internal-beta-impact-review.json',
  'internal-beta-impact-review.md',
  'package-lock-native-artifact-qa.json',
  'package-lock-native-artifact-qa.md',
  'duckdb-native-rebuild-qa-decision.json',
  'duckdb-native-rebuild-qa-decision.md',
  'duckdb-native-rebuild-qa-readiness-report.json',
  'duckdb-native-rebuild-qa-blocker-report.json',
  'duckdb-native-rebuild-qa-private-artifact-manifest.json',
  'duckdb-native-rebuild-qa-validation-results.md',
]

assert.equal(plan.mode, 'qa_review_metadata_only_no_rebuild_no_import_no_probe')
assert.equal(
  reports.decision.decision,
  'duckdb_native_rebuild_qa_passed_ready_for_ffmpeg_ffprobe_system_binary_review',
)
assert.equal(reports.duckdbProofQa.accepted, true)
assert.equal(reports.polarsStatusQa.accepted, true)
assert.equal(reports.ffmpegFfprobeMissingBinaryQa.systemBinaryReviewRequired, true)
assert.equal(reports.packageLockNativeArtifactQa.passed, true)
assert.equal(reports.readinessReport.readiness, true)

for (const report of requiredReports) {
  assert.equal(fs.existsSync(`${DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR}/${report}`), true, `Missing report ${report}`)
}

const scanText = requiredReports
  .map((file) => fs.readFileSync(`${DUCKDB_NATIVE_REBUILD_QA_REPORT_DIR}/${file}`, 'utf8'))
  .join('\n')

const forbiddenPatterns = [
  /\bnpmInstallAllowed["']?\s*[:=]\s*true\b/i,
  /\bnpmRebuildAllowed["']?\s*[:=]\s*true\b/i,
  /\bpackageLifecycleScriptsAllowed["']?\s*[:=]\s*true\b/i,
  /\bduckdbImportProofRerunAllowed["']?\s*[:=]\s*true\b/i,
  /\bduckdbQueryProofRerunAllowed["']?\s*[:=]\s*true\b/i,
  /\bpolarsProofRerunAllowed["']?\s*[:=]\s*true\b/i,
  /\bffmpegVersionProbeAllowed["']?\s*[:=]\s*true\b/i,
  /\bffprobeVersionProbeAllowed["']?\s*[:=]\s*true\b/i,
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
  /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|X-(?:Goog|Amz)-Signature=)\b/i,
]

for (const pattern of forbiddenPatterns) {
  assert.equal(pattern.test(scanText), false, `Forbidden pattern matched: ${pattern}`)
}

console.log('Open-source tool stack DuckDB native rebuild QA review smoke passed.')
