import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_REPORT_DIR,
  buildTrackaBuildContextGenerationApprovalPlan,
  buildTrackaBuildContextGenerationApprovalReports,
} from '../activation/open-source-tool-stack-tracka-build-context-generation-approval'

const plan = buildTrackaBuildContextGenerationApprovalPlan()
const reports = buildTrackaBuildContextGenerationApprovalReports()

const requiredReports = [
  'source-of-truth-audit.json',
  'build-command-approval-matrix.json',
  'build-command-approval-matrix.md',
  'generated-artifact-policy.json',
  'generated-artifact-policy.md',
  'future-execution-scope.json',
  'future-execution-scope.md',
  'build-context-generation-approval-decision.json',
  'build-context-generation-approval-decision.md',
  'build-context-generation-approval-readiness-report.json',
  'build-context-generation-approval-private-artifact-manifest.json',
  'build-context-generation-approval-validation-results.md',
]

assert.equal(plan.mode, 'metadata_only_build_context_generation_approval_no_dist_no_docker_no_probes')
assert.equal(reports.decision.decision, 'build_context_generation_approval_passed_ready_for_generation_execution')
assert.equal(reports.readinessReport.readiness, true)
assert.equal(reports.decision.currentPhaseBuildContextGenerationRun, false)
assert.equal(reports.decision.currentPhaseDockerBuildRun, false)
assert.equal(reports.generatedArtifactPolicy.generatedOutputsMayBeCommitted, false)
assert.equal(reports.futureExecutionScope.dockerBuildIncludedInNextPhase, false)

for (const report of requiredReports) {
  assert.equal(
    fs.existsSync(`${TRACKA_BUILD_CONTEXT_GENERATION_APPROVAL_REPORT_DIR}/${report}`),
    true,
    `Missing report ${report}`,
  )
}

console.log('Open-source tool stack Track A build-context generation approval smoke passed.')
