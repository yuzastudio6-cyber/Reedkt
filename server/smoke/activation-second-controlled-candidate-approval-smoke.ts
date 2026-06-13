import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  SECOND_CONTROLLED_CANDIDATE_APPROVAL_REPORT_DIR,
  SECOND_CONTROLLED_CANDIDATE_ID,
  SECOND_CONTROLLED_FIXTURE_ID,
  SECOND_CONTROLLED_ROUTE_ID,
  buildSecondControlledCandidateApprovalPlan,
  buildSecondControlledCandidateApprovalReports,
} from '../activation/second-controlled-candidate-approval'

const reports = buildSecondControlledCandidateApprovalReports()
const plan = buildSecondControlledCandidateApprovalPlan()
const requiredReports = [
  'source_of_truth_audit.json',
  'pre_approval_revalidation_report.json',
  'evidence_inventory.json',
  'second_candidate_scope_review.json',
  'sound_music_audio_route_review.json',
  'approved_plan_snapshot_requirements.json',
  'worker_handoff_review.json',
  'artifact_source_of_truth_guardrails.json',
  'fail_closed_policy.json',
  'observability_cost_audit_requirements.json',
  'second_controlled_candidate_approval_decision.json',
  'second_controlled_candidate_approval_blocker_report.json',
  'second_controlled_candidate_approval_readiness_report.json',
  'second_controlled_candidate_approval_private_artifact_manifest.json',
]
const requiredDocs = [
  'docs/second-controlled-candidate-approval.md',
  'docs/second-controlled-candidate-scope-review.md',
  'docs/second-controlled-candidate-sound-music-audio-route-review.md',
  'docs/second-controlled-candidate-approved-plan-snapshot-requirements.md',
  'docs/second-controlled-candidate-worker-handoff-review.md',
  'docs/second-controlled-candidate-artifact-guardrails.md',
  'docs/second-controlled-candidate-fail-closed-policy.md',
  'docs/second-controlled-candidate-observability-cost-audit.md',
  'docs/second-controlled-candidate-approval-decision.md',
  'docs/implementation-prompts/prompt-second-controlled-candidate-dry-run.md',
]

assert.equal(plan.mode, 'metadata_docs_reports_only')
assert.equal(reports.decision.decision, 'approved_for_future_second_controlled_candidate_dry_run')
assert.equal(reports.readinessReport.readiness, true)
assert.deepEqual(reports.blockerReport.blockers, [])
assert.equal(reports.readinessReport.pr402RecommendationPassed, true)
assert.equal(reports.readinessReport.scopeReviewPassed, true)
assert.equal(reports.readinessReport.soundMusicAudioRouteReviewPassed, true)
assert.equal(reports.readinessReport.approvedPlanSnapshotRequirementsPassed, true)
assert.equal(reports.readinessReport.workerHandoffReviewPassed, true)
assert.equal(reports.readinessReport.artifactGuardrailsPassed, true)
assert.equal(reports.readinessReport.failClosedPolicyPassed, true)
assert.equal(reports.readinessReport.observabilityCostAuditRequirementsPassed, true)
const candidate = reports.decision.selectedCandidate as Record<string, unknown>
assert.equal(candidate.candidateId, SECOND_CONTROLLED_CANDIDATE_ID)
assert.equal(candidate.sourceFixtureId, SECOND_CONTROLLED_FIXTURE_ID)
assert.equal(candidate.sourceRouteCandidateId, SECOND_CONTROLLED_ROUTE_ID)
assert.equal((reports.sourceOfTruthAudit.pr384DuplicateRisk as Record<string, unknown>).treatedAsSourceOfTruth, false)
assert.equal(reports.decision.secondCandidateExecuted, false)
assert.equal(reports.decision.realToolExecutionApproved, false)
assert.equal(reports.decision.routeExecutionApproved, false)
assert.equal(reports.decision.workerExecutionApproved, false)
assert.equal(reports.decision.providerExecutionApproved, false)
assert.equal(reports.decision.mediaProcessingApproved, false)
assert.equal(reports.decision.audioProcessingApproved, false)
assert.equal(reports.decision.supabaseWritesApproved, false)
assert.equal(reports.decision.publicArtifactsApproved, false)
assert.equal(reports.decision.signedUrlsApproved, false)
assert.deepEqual(reports.decision.supabaseClassification, {
  updateRequired: 'no write',
  updateStatus: 'Track B clean staging milestone sync completed before this phase; this packet is approval metadata only.',
  environmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  nextSupabaseAction: 'none',
})

for (const report of requiredReports) {
  assert.equal(fs.existsSync(`${SECOND_CONTROLLED_CANDIDATE_APPROVAL_REPORT_DIR}/${report}`), true, `Missing report ${report}`)
}
for (const doc of requiredDocs) {
  assert.equal(fs.existsSync(doc), true, `Missing doc ${doc}`)
}

const scanText = [
  ...requiredReports.map((file) => fs.readFileSync(`${SECOND_CONTROLLED_CANDIDATE_APPROVAL_REPORT_DIR}/${file}`, 'utf8')),
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
  /\baudioProcessingAllowed\s*[:=]\s*true\b/i,
  /\bsupabaseWritesAllowed\s*[:=]\s*true\b/i,
  /\bpublicArtifactsAllowed\s*[:=]\s*true\b/i,
  /\bsignedUrlsAsSourceOfTruthAllowed\s*[:=]\s*true\b/i,
  /\bproductionUnlockAllowed\s*[:=]\s*true\b/i,
  /\brawPromptExecutionAllowed\s*[:=]\s*true\b/i,
  secretValuePattern,
]) {
  assert.equal(pattern.test(scanText), false, `Forbidden pattern matched: ${pattern}`)
}

console.log('Second controlled candidate approval smoke passed.')
