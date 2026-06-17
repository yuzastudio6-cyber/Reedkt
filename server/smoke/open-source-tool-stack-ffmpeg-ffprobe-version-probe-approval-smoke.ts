import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_REPORT_DIR,
  buildOpenSourceToolStackFfmpegFfprobeVersionProbeApprovalPlan,
  buildOpenSourceToolStackFfmpegFfprobeVersionProbeApprovalReports,
} from '../activation/open-source-tool-stack-ffmpeg-ffprobe-version-probe-approval'

const plan = buildOpenSourceToolStackFfmpegFfprobeVersionProbeApprovalPlan()
const reports = buildOpenSourceToolStackFfmpegFfprobeVersionProbeApprovalReports()

const requiredReports = [
  'source-of-truth-audit.json',
  'evidence-revalidation-report.json',
  'evidence-revalidation-report.md',
  'runtime-path-selection.json',
  'runtime-path-selection.md',
  'future-probe-command-approval.json',
  'future-probe-command-approval.md',
  'blocked-scope-policy.json',
  'blocked-scope-policy.md',
  'package-docker-artifact-policy.json',
  'package-docker-artifact-policy.md',
  'ffmpeg-ffprobe-version-probe-approval-decision.json',
  'ffmpeg-ffprobe-version-probe-approval-decision.md',
  'ffmpeg-ffprobe-version-probe-approval-readiness-report.json',
  'ffmpeg-ffprobe-version-probe-approval-blocker-report.json',
  'ffmpeg-ffprobe-version-probe-approval-private-artifact-manifest.json',
  'ffmpeg-ffprobe-version-probe-approval-validation-results.md',
]

assert.equal(plan.mode, 'metadata_approval_only_no_probe_no_docker_no_media')
assert.equal(
  reports.decision.decision,
  'ffmpeg_ffprobe_version_probe_approval_passed_ready_for_tracka_container_probe_execution',
)
assert.equal(reports.runtimePathSelection.selectedRuntimePath, 'tracka_repo_owned_render_worker_container')
assert.equal(reports.runtimePathSelection.localHostSystemBinaryApproved, false)
assert.equal(reports.futureProbeCommandApproval.versionProbeRunInThisPhase, false)
assert.equal(reports.packageDockerArtifactPolicy.dockerBuildApprovedNow, false)
assert.equal(reports.decision.ffmpegAcceptedAsInstalledAndProven, false)
assert.equal(reports.decision.ffprobeAcceptedAsInstalledAndProven, false)
assert.equal(reports.readinessReport.readiness, true)

for (const report of requiredReports) {
  assert.equal(fs.existsSync(`${FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_REPORT_DIR}/${report}`), true, `Missing report ${report}`)
}

const scanText = requiredReports
  .map((file) => fs.readFileSync(`${FFMPEG_FFPROBE_VERSION_PROBE_APPROVAL_REPORT_DIR}/${file}`, 'utf8'))
  .join('\n')

const forbiddenPatterns = [
  /\bffmpegAcceptedAsInstalledAndProven["']?\s*[:=]\s*true\b/i,
  /\bffprobeAcceptedAsInstalledAndProven["']?\s*[:=]\s*true\b/i,
  /\blocalHostSystemBinaryApproved["']?\s*[:=]\s*true\b/i,
  /\bversionProbeRunInThisPhase["']?\s*[:=]\s*true\b/i,
  /\bdockerBuildApprovedNow["']?\s*[:=]\s*true\b/i,
  /\bdockerRunApprovedNow["']?\s*[:=]\s*true\b/i,
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

console.log('Open-source tool stack FFmpeg FFprobe version-probe approval smoke passed.')
