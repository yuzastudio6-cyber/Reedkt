import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_REPORT_DIR,
  buildTrackaContainerFfmpegFfprobeBlockerResolutionPlan,
  buildTrackaContainerFfmpegFfprobeBlockerResolutionReports,
} from '../activation/open-source-tool-stack-tracka-container-ffmpeg-ffprobe-blocker-resolution'

const plan = buildTrackaContainerFfmpegFfprobeBlockerResolutionPlan()
const reports = buildTrackaContainerFfmpegFfprobeBlockerResolutionReports()

const requiredReports = [
  'source-of-truth-audit.json',
  'command-source-inventory.json',
  'command-source-inventory.md',
  'docker-container-invocation-policy.json',
  'docker-container-invocation-policy.md',
  'exact-future-probe-commands.json',
  'exact-future-probe-commands.md',
  'safety-and-artifact-policy.json',
  'safety-and-artifact-policy.md',
  'owner-handoff-review.json',
  'owner-handoff-review.md',
  'exact-probe-command-blocker-resolution-decision.json',
  'exact-probe-command-blocker-resolution-decision.md',
  'exact-probe-command-blocker-resolution-readiness-report.json',
  'exact-probe-command-blocker-resolution-private-artifact-manifest.json',
  'exact-probe-command-blocker-resolution-validation-results.md',
]

assert.equal(plan.mode, 'metadata_only_exact_command_blocker_resolution_no_runtime_execution')
assert.equal(
  reports.decision.decision,
  'exact_probe_command_blocker_resolution_passed_ready_for_docker_build_then_version_probe_execution',
)
assert.equal(reports.readinessReport.readiness, true)
assert.equal(reports.dockerContainerInvocationPolicy.currentPhaseDockerBuildRun, false)
assert.equal(reports.exactFutureProbeCommands.currentPhaseVersionProbeRun, false)
assert.equal(reports.safetyAndArtifactPolicy.passed, true)

for (const report of requiredReports) {
  assert.equal(
    fs.existsSync(`${TRACKA_CONTAINER_FFMPEG_FFPROBE_BLOCKER_RESOLUTION_REPORT_DIR}/${report}`),
    true,
    `Missing report ${report}`,
  )
}

console.log('Open-source tool stack Track A container FFmpeg FFprobe blocker-resolution smoke passed.')
