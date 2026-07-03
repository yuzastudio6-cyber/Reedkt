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

assert.equal(plan.mode, 'exact_tracka_render_worker_docker_build_then_container_version_probes')
assert.equal(plan.sourceSha, '2f6ab6463870dc12d6837dc71f816ad5eefcd88f')
assert.equal(reports.exactCommandSourceReview.selectedRuntimePath, 'tracka_repo_owned_render_worker_container')
assert.equal(reports.exactCommandSourceReview.imageTag, 'reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-2f6ab6463870dc12d6837dc71f816ad5eefcd88f')
assert.equal(reports.exactCommandSourceReview.exactContainerInvocationPresent, true)
assert.equal(
  reports.exactCommandSourceReview.approvedDockerBuildCommand,
  'docker build -f docker/prod/render-worker/Dockerfile -t reeditpro-render-worker:tracka-ffmpeg-ffprobe-probe-2f6ab6463870dc12d6837dc71f816ad5eefcd88f .',
)
assert.equal(reports.dockerContainerReadinessReport.dockerBuildRun, false)
assert.equal(reports.ffmpegVersionProbeReport.probeRun, false)
assert.equal(reports.ffprobeVersionProbeReport.probeRun, false)
assert.equal(reports.ffmpegVersionProbeReport.noLocalHostProbe, true)
assert.equal(reports.ffprobeVersionProbeReport.noMediaInput, true)
assert.equal(reports.sideEffectArtifactSafetyReport.passed, true)

for (const report of requiredReports) {
  assert.equal(
    fs.existsSync(`${TRACKA_CONTAINER_FFMPEG_FFPROBE_VERSION_PROBE_REPORT_DIR}/${report}`),
    true,
    `Missing report ${report}`,
  )
}

console.log('Open-source tool stack Track A container FFmpeg FFprobe version-probe smoke passed.')
