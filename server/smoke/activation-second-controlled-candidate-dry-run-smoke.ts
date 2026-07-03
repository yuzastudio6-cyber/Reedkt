import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  SECOND_CONTROLLED_CANDIDATE_DRY_RUN_REPORT_DIR,
  SECOND_CONTROLLED_DRY_RUN_CANDIDATE_ID,
  SECOND_CONTROLLED_DRY_RUN_FIXTURE_ID,
  SECOND_CONTROLLED_DRY_RUN_OWNER_LANE,
  SECOND_CONTROLLED_DRY_RUN_ROUTE_ID,
  buildSecondControlledCandidateDryRunPlan,
  buildSecondControlledCandidateDryRunReports,
} from '../activation/second-controlled-candidate-dry-run'

const reports = buildSecondControlledCandidateDryRunReports()
const plan = buildSecondControlledCandidateDryRunPlan()
const requiredReports = [
  'source_of_truth_audit.json',
  'pre_execution_revalidation_report.json',
  'evidence_inventory.json',
  'selected_second_candidate_guard_report.json',
  'approved_plan_snapshot_fixture_report.json',
  'sound_music_audio_metadata_route_fixture_report.json',
  'selected_second_candidate_execution_report.json',
  'artifact_source_of_truth_validation_report.json',
  'execution_blocker_validation_report.json',
  'fail_closed_validation_report.json',
  'observability_cost_audit_report.json',
  'second_controlled_candidate_dry_run_decision.json',
  'second_controlled_candidate_dry_run_blocker_report.json',
  'second_controlled_candidate_dry_run_readiness_report.json',
  'second_controlled_candidate_dry_run_private_artifact_manifest.json',
]
const requiredDocs = [
  'docs/second-controlled-candidate-dry-run.md',
  'docs/second-controlled-candidate-dry-run-decision.md',
  'docs/second-controlled-candidate-dry-run-fail-closed.md',
  'docs/second-controlled-candidate-dry-run-artifact-scope.md',
  'docs/implementation-prompts/prompt-next-controlled-candidate-or-worker-handoff-review-after-second.md',
]

assert.equal(plan.mode, 'selected_candidate_metadata_report_validation_only')
assert.equal(plan.selectedCandidate, SECOND_CONTROLLED_DRY_RUN_CANDIDATE_ID)
assert.equal(plan.selectedFixture, SECOND_CONTROLLED_DRY_RUN_FIXTURE_ID)
assert.equal(plan.selectedRoute, SECOND_CONTROLLED_DRY_RUN_ROUTE_ID)
assert.equal(plan.ownerLane, SECOND_CONTROLLED_DRY_RUN_OWNER_LANE)
assert.equal(reports.decision.decision, 'second_controlled_candidate_dry_run_passed_ready_for_next_controlled_candidate_or_worker_handoff_review')
assert.equal(reports.readinessReport.readiness, true)
assert.deepEqual(reports.blockerReport.blockers, [])
const selectedCandidate = reports.decision.selectedCandidate as Record<string, unknown>
assert.equal(selectedCandidate.candidateId, SECOND_CONTROLLED_DRY_RUN_CANDIDATE_ID)
assert.equal(selectedCandidate.sourceFixtureId, SECOND_CONTROLLED_DRY_RUN_FIXTURE_ID)
assert.equal(selectedCandidate.sourceRouteCandidateId, SECOND_CONTROLLED_DRY_RUN_ROUTE_ID)
assert.equal(selectedCandidate.ownerLane, SECOND_CONTROLLED_DRY_RUN_OWNER_LANE)
assert.equal(reports.readinessReport.selectedSecondCandidateGuardPassed, true)
assert.equal(reports.readinessReport.approvedPlanSnapshotFixturePassed, true)
assert.equal(reports.readinessReport.soundMusicAudioFixturePassed, true)
assert.equal(reports.readinessReport.selectedSecondCandidateExecutionPassed, true)
assert.equal(reports.readinessReport.artifactSourceOfTruthValidationPassed, true)
assert.equal(reports.readinessReport.executionBlockerValidationPassed, true)
assert.equal(reports.readinessReport.failClosedValidationPassed, true)
assert.equal(reports.readinessReport.observabilityCostAuditPassed, true)
assert.equal(reports.decision.secondCandidateExecuted, true)
assert.equal(reports.decision.nonSelectedToolsExecuted, false)
assert.equal(reports.decision.workersExecuted, false)
assert.equal(reports.decision.realRoutesExecuted, false)
assert.equal(reports.decision.providersCalled, false)
assert.equal(reports.decision.mediaProcessed, false)
assert.equal(reports.decision.audioProcessed, false)
assert.equal(reports.decision.supabaseWrites, false)
assert.equal(reports.decision.gcsUploads, false)
assert.equal(reports.decision.publicArtifactsCreated, false)
assert.equal(reports.decision.signedUrlsCreated, false)
assert.equal(reports.decision.betaProductionUnlocked, false)
assert.deepEqual(reports.decision.supabaseClassification, {
  updateRequired: 'no write',
  updateStatus: 'Track B clean staging milestone sync completed and merged before this phase; this dry-run is metadata/report validation only.',
  environmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  nextSupabaseAction: 'none',
})

for (const report of requiredReports) {
  assert.equal(fs.existsSync(`${SECOND_CONTROLLED_CANDIDATE_DRY_RUN_REPORT_DIR}/${report}`), true, `Missing report ${report}`)
}
for (const doc of requiredDocs) {
  assert.equal(fs.existsSync(doc), true, `Missing doc ${doc}`)
}

const scanText = [
  ...requiredReports.map((file) => fs.readFileSync(`${SECOND_CONTROLLED_CANDIDATE_DRY_RUN_REPORT_DIR}/${file}`, 'utf8')),
  ...requiredDocs.map((file) => fs.readFileSync(file, 'utf8')),
].join('\n')
const secretValuePattern = new RegExp(
  [
    `sk-${'[A-Za-z0-9_-]{16,}'}`,
    `Bearer\\s+${'[A-Za-z0-9._~+/-]{16,}'}`,
    `postgres${'(?:ql)?'}:\\/\\/`,
    `eyJ${'[A-Za-z0-9_-]+'}\\.${'[A-Za-z0-9_-]+'}\\.${'[A-Za-z0-9_-]+'}`,
    `X-${'Goog'}-${'Signature'}=`,
    `X-${'Amz'}-${'Signature'}=`,
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
  /\baudioProcessingAllowed\s*[:=]\s*true\b/i,
  /\bsupabaseWritesAllowed\s*[:=]\s*true\b/i,
  /\bpublicArtifactsAllowed\s*[:=]\s*true\b/i,
  /\bsignedUrlsAsSourceOfTruthAllowed\s*[:=]\s*true\b/i,
  /\bproductionUnlockAllowed\s*[:=]\s*true\b/i,
  /\brawPromptExecutionAllowed\s*[:=]\s*true\b/i,
  /PR #384.*canonical/i,
  secretValuePattern,
]) {
  assert.equal(pattern.test(scanText), false, `Forbidden pattern matched: ${pattern}`)
}

console.log('Second controlled candidate dry-run smoke passed.')
