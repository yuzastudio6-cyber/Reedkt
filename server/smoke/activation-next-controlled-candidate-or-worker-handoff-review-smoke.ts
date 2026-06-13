import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  NEXT_CONTROLLED_REVIEW_REPORT_DIR,
  RECOMMENDED_SECOND_CONTROLLED_CANDIDATE,
  RECOMMENDED_SECOND_ROUTE_CANDIDATE,
  RECOMMENDED_SECOND_SOURCE_FIXTURE,
  buildNextControlledCandidateOrWorkerHandoffPlan,
  buildNextControlledCandidateOrWorkerHandoffReports,
} from '../activation/next-controlled-candidate-or-worker-handoff-review'

const reports = buildNextControlledCandidateOrWorkerHandoffReports()
const plan = buildNextControlledCandidateOrWorkerHandoffPlan()
const requiredReports = [
  'source_of_truth_audit.json',
  'pre_review_revalidation_report.json',
  'evidence_inventory.json',
  'controlled_candidate_inventory.json',
  'next_candidate_risk_ranking.json',
  'worker_handoff_readiness_review.json',
  'artifact_source_of_truth_review.json',
  'observability_cost_audit_review.json',
  'next_controlled_candidate_or_worker_handoff_decision.json',
  'next_controlled_candidate_or_worker_handoff_blocker_report.json',
  'next_controlled_candidate_or_worker_handoff_readiness_report.json',
  'next_controlled_candidate_or_worker_handoff_private_artifact_manifest.json',
]
const requiredDocs = [
  'docs/next-controlled-candidate-or-worker-handoff-review.md',
  'docs/next-controlled-candidate-inventory.md',
  'docs/next-controlled-candidate-risk-ranking.md',
  'docs/worker-handoff-readiness-after-first-controlled-tool.md',
  'docs/next-controlled-candidate-or-worker-handoff-decision.md',
  'docs/implementation-prompts/prompt-second-controlled-tool-candidate-approval.md',
]

assert.equal(plan.mode, 'metadata_docs_reports_only')
assert.equal(reports.decision.decision, 'recommended_next_controlled_candidate_approval')
assert.equal(reports.readinessReport.readiness, true)
assert.deepEqual(reports.blockerReport.blockers, [])
const candidate = reports.decision.recommendedNextCandidate as Record<string, unknown>
assert.equal(candidate.candidateId, RECOMMENDED_SECOND_CONTROLLED_CANDIDATE)
assert.equal(candidate.sourceFixtureId, RECOMMENDED_SECOND_SOURCE_FIXTURE)
assert.equal(candidate.sourceRouteCandidateId, RECOMMENDED_SECOND_ROUTE_CANDIDATE)
assert.equal(candidate.approvedAsNextCandidate, true)
assert.equal(reports.workerHandoffReadinessReview.workerExecutionApprovedThisPhase, false)
assert.equal(reports.workerHandoffReadinessReview.nextMeaningfulStepRequiresWorkerExecution, false)
assert.equal(reports.sourceOfTruthAudit.pr384DuplicateRisk && (reports.sourceOfTruthAudit.pr384DuplicateRisk as Record<string, unknown>).treatedAsSourceOfTruth, false)
assert.equal(reports.decision.realToolsExecuted, false)
assert.equal(reports.decision.routesExecuted, false)
assert.equal(reports.decision.workersExecuted, false)
assert.equal(reports.decision.providersCalled, false)
assert.equal(reports.decision.mediaProcessed, false)
assert.equal(reports.decision.audioProcessed, false)
assert.equal(reports.decision.renderExportExecuted, false)
assert.equal(reports.decision.imagesGeneratedOrEdited, false)
assert.equal(reports.decision.browserCaptureRun, false)
assert.equal(reports.decision.mapsRendered, false)
assert.equal(reports.decision.supabaseWrites, false)
assert.equal(reports.decision.sqlExecuted, false)
assert.equal(reports.decision.gcsUploads, false)
assert.equal(reports.decision.publicArtifactsCreated, false)
assert.equal(reports.decision.signedUrlsCreated, false)
assert.equal(reports.decision.rawPromptsExecuted, false)
assert.equal(reports.decision.betaProductionUnlocked, false)
assert.deepEqual(reports.decision.supabaseClassification, {
  updateRequired: 'no write',
  updateStatus: 'Track B clean staging milestone sync completed before this phase; this review is docs/reports metadata only.',
  environmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  nextSupabaseAction: 'none',
})

for (const report of requiredReports) {
  assert.equal(fs.existsSync(`${NEXT_CONTROLLED_REVIEW_REPORT_DIR}/${report}`), true, `Missing report ${report}`)
}
for (const doc of requiredDocs) {
  assert.equal(fs.existsSync(doc), true, `Missing doc ${doc}`)
}

const scanText = [
  ...requiredReports.map((file) => fs.readFileSync(`${NEXT_CONTROLLED_REVIEW_REPORT_DIR}/${file}`, 'utf8')),
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

console.log('Next controlled candidate or worker handoff review smoke passed.')
