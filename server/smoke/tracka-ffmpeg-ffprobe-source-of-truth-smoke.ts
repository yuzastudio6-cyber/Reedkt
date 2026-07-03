import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR,
  buildTrackaFfmpegFfprobeSourceOfTruthPlan,
  buildTrackaFfmpegFfprobeSourceOfTruthReports,
} from '../activation/tracka-ffmpeg-ffprobe-source-of-truth'

const plan = buildTrackaFfmpegFfprobeSourceOfTruthPlan()
const reports = buildTrackaFfmpegFfprobeSourceOfTruthReports()

const requiredReports = [
  'source-of-truth-audit.json',
  'pr-463-diff-review.json',
  'pr-463-diff-review.md',
  'central-presence-check.json',
  'central-presence-check.md',
  'reconciliation-method.json',
  'reconciliation-method.md',
  'ffmpeg-ffprobe-central-evidence.json',
  'ffmpeg-ffprobe-central-evidence.md',
  'future-version-probe-boundary.json',
  'future-version-probe-boundary.md',
  'owner-handoff-and-blocker-review.json',
  'owner-handoff-and-blocker-review.md',
  'tracka-ffmpeg-ffprobe-source-of-truth-decision.json',
  'tracka-ffmpeg-ffprobe-source-of-truth-decision.md',
  'tracka-ffmpeg-ffprobe-source-of-truth-readiness-report.json',
  'tracka-ffmpeg-ffprobe-source-of-truth-blocker-report.json',
  'tracka-ffmpeg-ffprobe-source-of-truth-private-artifact-manifest.json',
  'tracka-ffmpeg-ffprobe-source-of-truth-validation-results.md',
]

assert.equal(plan.mode, 'docs_only_central_reconciliation_no_pr_463_replay_no_probe_no_docker_no_media')
assert.equal(
  reports.decision.decision,
  'tracka_ffmpeg_ffprobe_source_of_truth_reconciliation_passed_ready_for_version_probe_approval',
)
assert.equal(reports.decision.pr463ReplayCherryPickUsed, false)
assert.equal(reports.decision.ffmpegAcceptedAsInstalledAndProven, false)
assert.equal(reports.decision.ffprobeAcceptedAsInstalledAndProven, false)
assert.equal(reports.futureVersionProbeBoundary.futureVersionProbeApprovedNow, false)
assert.equal(reports.reconciliationMethod.method, 'docs_only_central_reconciliation')
assert.equal(reports.readinessReport.readiness, true)

for (const report of requiredReports) {
  assert.equal(fs.existsSync(`${TRACKA_FFMPEG_FFPROBE_SOURCE_OF_TRUTH_REPORT_DIR}/${report}`), true, `Missing report ${report}`)
}

console.log('Track A FFmpeg FFprobe source-of-truth smoke passed.')
