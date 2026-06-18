import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_REPORT_DIR,
  buildTrackaContainerFfmpegFfprobeVersionProbePlan,
  buildTrackaContainerFfmpegFfprobeVersionProbeReports,
} from '../activation/open-source-tool-stack-tracka-container-ffmpeg-ffprobe-version-probe-execution'

const plan = buildTrackaContainerFfmpegFfprobeVersionProbePlan()
const reports = buildTrackaContainerFfmpegFfprobeVersionProbeReports()

const requiredReports = [
  'source-of-truth-audit.json',
  'exact-command-source-review.json',
  'exact-command-source-review.md',
  'pre-execution-validation-report.json',
  'pre-execution-validation-report.md',
  'docker-container-readiness-report.json',
  'ffmpeg-version-probe-report.json',
  'ffprobe-version-probe-report.json',
  'side-effect-artifact-safety-report.json',
  'tracka-container-ffmpeg-ffprobe-version-probe-decision.json',
  'tracka-container-ffmpeg-ffprobe-version-probe-decision.md',
  'tracka-container-ffmpeg-ffprobe-version-probe-readiness-report.json',
  'tracka-container-ffmpeg-ffprobe-version-probe-blocker-report.json',
  'tracka-container-ffmpeg-ffprobe-version-probe-private-artifact-manifest.json',
  'tracka-container-ffmpeg-ffprobe-version-probe-validation-results.md',
]

assert.equal(plan.mode, 'blocked_before_probe_until_exact_container_invocation_source_exists')
assert.equal(reports.decision.decision, 'blocked_pending_exact_probe_command_source')
assert.equal(reports.exactCommandSourceReview.selectedRuntimePath, 'tracka_repo_owned_render_worker_container')
assert.equal(reports.exactCommandSourceReview.exactContainerInvocationPresent, false)
assert.equal(reports.ffmpegVersionProbeReport.probeRun, false)
assert.equal(reports.ffprobeVersionProbeReport.probeRun, false)
assert.equal(reports.sideEffectArtifactSafetyReport.passed, true)

for (const report of requiredReports) {
  assert.equal(
    fs.existsSync(`${TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_REPORT_DIR}/${report}`),
    true,
    `Missing report ${report}`,
  )
}

console.log('Open-source tool stack Track A container FFmpeg FFprobe version-probe smoke passed.')
