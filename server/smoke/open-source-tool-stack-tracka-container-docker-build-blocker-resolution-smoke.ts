import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_REPORT_DIR,
  buildTrackaContainerDockerBuildBlockerResolutionPlan,
  buildTrackaContainerDockerBuildBlockerResolutionReports,
} from '../activation/open-source-tool-stack-tracka-container-docker-build-blocker-resolution'

const plan = buildTrackaContainerDockerBuildBlockerResolutionPlan()
const reports = buildTrackaContainerDockerBuildBlockerResolutionReports()

const requiredReports = [
  'source-of-truth-audit.json',
  'dockerfile-build-context-review.json',
  'dockerfile-build-context-review.md',
  'build-script-inventory.json',
  'build-script-inventory.md',
  'build-context-generation-policy.json',
  'build-context-generation-policy.md',
  'docker-build-strategy-review.json',
  'docker-build-strategy-review.md',
  'future-execution-scope.json',
  'future-execution-scope.md',
  'docker-build-blocker-resolution-decision.json',
  'docker-build-blocker-resolution-decision.md',
  'docker-build-blocker-resolution-readiness-report.json',
  'docker-build-blocker-resolution-private-artifact-manifest.json',
  'docker-build-blocker-resolution-validation-results.md',
]

assert.equal(plan.mode, 'metadata_only_build_context_blocker_resolution_no_docker_no_probes')
assert.equal(
  reports.decision.decision,
  'docker_build_blocker_resolution_passed_ready_for_build_context_generation_approval',
)
assert.equal(reports.readinessReport.readiness, true)
assert.equal(reports.decision.currentPhaseDockerBuildRun, false)
assert.equal(reports.decision.currentPhaseFfmpegProbeRun, false)
assert.equal(reports.buildContextGenerationPolicy.generatedOutputsMayBeCommitted, false)

for (const report of requiredReports) {
  assert.equal(
    fs.existsSync(`${TRACKA_CONTAINER_DOCKER_BUILD_BLOCKER_RESOLUTION_REPORT_DIR}/${report}`),
    true,
    `Missing report ${report}`,
  )
}

console.log('Open-source tool stack Track A Docker build blocker-resolution smoke passed.')
