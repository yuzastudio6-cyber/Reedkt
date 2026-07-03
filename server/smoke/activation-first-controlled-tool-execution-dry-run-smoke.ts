import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  FIRST_CONTROLLED_TOOL_EXECUTION_REPORT_DIR,
  SELECTED_FIRST_CONTROLLED_TOOL_CANDIDATE,
  buildFirstControlledToolExecutionPlan,
  buildFirstControlledToolExecutionReports,
} from '../activation/first-controlled-tool-execution-dry-run'

const reports = buildFirstControlledToolExecutionReports()
const plan = buildFirstControlledToolExecutionPlan()
const requiredReports = [
  'first_controlled_tool_source_of_truth_audit.json',
  'pre_execution_revalidation_report.json',
  'first_controlled_tool_evidence_inventory.json',
  'selected_candidate_guard_report.json',
  'approved_plan_snapshot_fixture_report.json',
  'selected_candidate_execution_report.json',
  'artifact_source_of_truth_validation_report.json',
  'execution_blocker_validation_report.json',
  'fail_closed_validation_report.json',
  'observability_cost_audit_report.json',
  'first_controlled_tool_execution_decision.json',
  'first_controlled_tool_execution_blocker_report.json',
  'first_controlled_tool_execution_readiness_report.json',
  'first_controlled_tool_execution_private_artifact_manifest.json',
]
const requiredDocs = [
  'docs/first-controlled-tool-execution-dry-run.md',
  'docs/first-controlled-tool-execution-dry-run-decision.md',
  'docs/first-controlled-tool-execution-dry-run-fail-closed.md',
  'docs/first-controlled-tool-execution-dry-run-artifact-scope.md',
  'docs/implementation-prompts/prompt-next-controlled-candidate-or-worker-handoff-review.md',
]

assert.equal(plan.mode, 'selected_candidate_metadata_report_validation_only')
assert.equal(plan.selectedCandidate, SELECTED_FIRST_CONTROLLED_TOOL_CANDIDATE)
assert.equal(reports.decision.decision, 'first_controlled_tool_execution_dry_run_passed_ready_for_next_controlled_candidate_or_worker_handoff_review')
assert.equal(reports.readinessReport.readiness, true)
assert.deepEqual(reports.blockerReport.blockers, [])
assert.equal((reports.decision.selectedCandidate as Record<string, unknown>).candidateId, SELECTED_FIRST_CONTROLLED_TOOL_CANDIDATE)
assert.equal(reports.readinessReport.selectedCandidateGuardPassed, true)
assert.equal(reports.readinessReport.approvedPlanSnapshotFixturePassed, true)
assert.equal(reports.readinessReport.selectedCandidateExecutionPassed, true)
assert.equal(reports.readinessReport.artifactSourceOfTruthValidationPassed, true)
assert.equal(reports.readinessReport.executionBlockerValidationPassed, true)
assert.equal(reports.readinessReport.failClosedValidationPassed, true)
assert.equal(reports.readinessReport.observabilityCostAuditPassed, true)
assert.equal(reports.decision.realToolsExecuted, false)
assert.equal(reports.decision.nonSelectedToolsExecuted, false)
assert.equal(reports.decision.workersExecuted, false)
assert.equal(reports.decision.realRoutesExecuted, false)
assert.equal(reports.decision.providersCalled, false)
assert.equal(reports.decision.mediaProcessed, false)
assert.equal(reports.decision.supabaseWrites, false)
assert.equal(reports.decision.gcsUploads, false)
assert.equal(reports.decision.publicArtifactsCreated, false)
assert.equal(reports.decision.signedUrlsCreated, false)
assert.equal(reports.decision.betaProductionUnlocked, false)
assert.deepEqual(reports.decision.supabaseClassification, {
  updateRequired: 'no write',
  updateStatus: 'Track B clean staging milestone sync completed before this phase; this dry-run is metadata/report validation only.',
  environmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  nextSupabaseAction: 'none',
})

for (const report of requiredReports) {
  assert.equal(fs.existsSync(`${FIRST_CONTROLLED_TOOL_EXECUTION_REPORT_DIR}/${report}`), true, `Missing report ${report}`)
}
for (const doc of requiredDocs) {
  assert.equal(fs.existsSync(doc), true, `Missing doc ${doc}`)
}

const scanText = [
  ...requiredReports.map((file) => fs.readFileSync(`${FIRST_CONTROLLED_TOOL_EXECUTION_REPORT_DIR}/${file}`, 'utf8')),
  ...requiredDocs.map((file) => fs.readFileSync(file, 'utf8')),
].join('\n')
const secretValuePattern = new RegExp(
  [
    `sk-${'[A-Za-z0-9_-]{16,}'}`,
    `Bearer\\s+${'[A-Za-z0-9._~+/-]{16,}'}`,
    `postgres${'(?:ql)?'}:\\/\\/`,
    `eyJ${'[A-Za-z0-9_-]+'}\\.${'[A-Za-z0-9_-]+'}\\.${'[A-Za-z0-9_-]+'}`,
    `X-${'Goog'}-Signature=`,
    `X-${'Amz'}-Signature=`,
  ].join('|'),
  'i'
)
for (const pattern of [
  /\brouteExecutionAllowed\s*[:=]\s*true\b/i,
  /\bruntimeExecutionAllowed\s*[:=]\s*true\b/i,
  /\btoolExecutionAllowed\s*[:=]\s*true\b/i,
  /\bworkerExecutionAllowed\s*[:=]\s*true\b/i,
  /\bproviderExecutionAllowed\s*[:=]\s*true\b/i,
  /\bmediaProcessingAllowed\s*[:=]\s*true\b/i,
  /\bsupabaseWritesAllowed\s*[:=]\s*true\b/i,
  /\bpublicArtifactsAllowed\s*[:=]\s*true\b/i,
  /\bsignedUrlsAsSourceOfTruthAllowed\s*[:=]\s*true\b/i,
  /\bproductionUnlockAllowed\s*[:=]\s*true\b/i,
  /\brawPromptExecutionAllowed\s*[:=]\s*true\b/i,
  secretValuePattern,
]) {
  assert.equal(pattern.test(scanText), false, `Forbidden pattern matched: ${pattern}`)
}

console.log('First controlled tool execution dry-run smoke passed.')
