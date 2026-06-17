import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR,
  buildOpenSourceToolStackFfmpegFfprobeSystemBinaryReviewPlan,
  buildOpenSourceToolStackFfmpegFfprobeSystemBinaryReviewReports,
} from '../activation/open-source-tool-stack-ffmpeg-ffprobe-system-binary-review'

const plan = buildOpenSourceToolStackFfmpegFfprobeSystemBinaryReviewPlan()
const reports = buildOpenSourceToolStackFfmpegFfprobeSystemBinaryReviewReports()

const requiredReports = [
  'source-of-truth-audit.json',
  'evidence-revalidation-report.json',
  'evidence-revalidation-report.md',
  'tracka-pr-463-reference-review.json',
  'tracka-pr-463-reference-review.md',
  'strategy-selection-review.json',
  'strategy-selection-review.md',
  'future-version-probe-scope.json',
  'future-version-probe-scope.md',
  'owner-handoff-review.json',
  'owner-handoff-review.md',
  'internal-beta-impact-review.json',
  'internal-beta-impact-review.md',
  'ffmpeg-ffprobe-system-binary-review-decision.json',
  'ffmpeg-ffprobe-system-binary-review-decision.md',
  'ffmpeg-ffprobe-system-binary-review-readiness-report.json',
  'ffmpeg-ffprobe-system-binary-review-blocker-report.json',
  'ffmpeg-ffprobe-system-binary-review-private-artifact-manifest.json',
  'ffmpeg-ffprobe-system-binary-review-validation-results.md',
]

assert.equal(plan.mode, 'metadata_strategy_review_only_no_install_no_probe_no_media')
assert.equal(
  reports.decision.decision,
  'ffmpeg_ffprobe_system_binary_review_passed_ready_for_tracka_source_of_truth_merge',
)
assert.equal(reports.decision.ffmpegAcceptedAsInstalledAndProven, false)
assert.equal(reports.decision.ffprobeAcceptedAsInstalledAndProven, false)
assert.equal(reports.futureVersionProbeScope.futureVersionProbeApprovedNow, false)
assert.equal(reports.ownerHandoffReview.trackaSourceOfTruthMergeRequired, true)
assert.equal(reports.readinessReport.readiness, true)

for (const report of requiredReports) {
  assert.equal(fs.existsSync(`${FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR}/${report}`), true, `Missing report ${report}`)
}

const scanText = requiredReports
  .map((file) => fs.readFileSync(`${FFMPEG_FFPROBE_SYSTEM_BINARY_REVIEW_REPORT_DIR}/${file}`, 'utf8'))
  .join('\n')

const forbiddenPatterns = [
  /\bffmpegAcceptedAsInstalledAndProven["']?\s*[:=]\s*true\b/i,
  /\bffprobeAcceptedAsInstalledAndProven["']?\s*[:=]\s*true\b/i,
  /\bfutureVersionProbeApprovedNow["']?\s*[:=]\s*true\b/i,
  /\bffmpegVersionProbeAllowed["']?\s*[:=]\s*true\b/i,
  /\bffprobeVersionProbeAllowed["']?\s*[:=]\s*true\b/i,
  /\bsystemBinaryInstallAllowed["']?\s*[:=]\s*true\b/i,
  /\bdockerBuildAllowed["']?\s*[:=]\s*true\b/i,
  /\bdockerContainerMutationAllowed["']?\s*[:=]\s*true\b/i,
  /\bmediaProcessingAllowed["']?\s*[:=]\s*true\b/i,
  /\bworkerExecutionAllowed["']?\s*[:=]\s*true\b/i,
  /\bproviderExecutionAllowed["']?\s*[:=]\s*true\b/i,
  /\bsupabaseWritesAllowed["']?\s*[:=]\s*true\b/i,
  /\bpublicArtifactsAllowed["']?\s*[:=]\s*true\b/i,
  /\bsignedUrlsAsSourceOfTruthAllowed["']?\s*[:=]\s*true\b/i,
  /\bproductionUnlockAllowed["']?\s*[:=]\s*true\b/i,
  /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|X-(?:Goog|Amz)-Signature=)\b/i,
]

for (const pattern of forbiddenPatterns) {
  assert.equal(pattern.test(scanText), false, `Forbidden pattern matched: ${pattern}`)
}

console.log('Open-source tool stack FFmpeg FFprobe system-binary review smoke passed.')
