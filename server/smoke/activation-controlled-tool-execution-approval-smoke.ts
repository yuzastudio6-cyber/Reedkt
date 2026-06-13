import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  CONTROLLED_TOOL_EXECUTION_APPROVAL_REPORT_DIR,
  buildControlledToolExecutionApprovalPlan,
  buildControlledToolExecutionApprovalReports,
} from '../activation/controlled-tool-execution-approval'

const reports = buildControlledToolExecutionApprovalReports()
const plan = buildControlledToolExecutionApprovalPlan()
const requiredReports = [
  'controlled_tool_execution_source_of_truth_audit.json',
  'pre_approval_revalidation_report.json',
  'controlled_tool_execution_evidence_inventory.json',
  'first_controlled_tool_candidate_review.json',
  'controlled_execution_scope_policy.json',
  'approved_plan_snapshot_requirements.json',
  'worker_handoff_requirements.json',
  'controlled_tool_artifact_source_of_truth_guardrails.json',
  'controlled_tool_fail_closed_policy.json',
  'controlled_tool_observability_cost_audit_requirements.json',
  'controlled_tool_execution_approval_decision.json',
  'controlled_tool_execution_approval_blocker_report.json',
  'controlled_tool_execution_approval_readiness_report.json',
  'controlled_tool_execution_approval_private_artifact_manifest.json',
]
const requiredDocs = [
  'docs/controlled-tool-execution-approval.md',
  'docs/controlled-tool-execution-first-candidate-review.md',
  'docs/controlled-tool-execution-scope-policy.md',
  'docs/controlled-tool-execution-approved-plan-snapshot-requirements.md',
  'docs/controlled-tool-execution-worker-handoff-requirements.md',
  'docs/controlled-tool-execution-artifact-guardrails.md',
  'docs/controlled-tool-execution-fail-closed-policy.md',
  'docs/controlled-tool-execution-observability-cost-audit.md',
  'docs/controlled-tool-execution-approval-decision.md',
  'docs/implementation-prompts/prompt-first-controlled-tool-execution-dry-run.md',
]

assert.equal(plan.mode, 'metadata_docs_reports_only')
assert.equal(reports.decision.decision, 'approved_for_future_first_controlled_tool_execution_dry_run')
assert.equal(reports.readinessReport.readiness, true)
assert.deepEqual(reports.blockerReport.blockers, [])
assert.equal(reports.readinessReport.toolRouteApprovalPassed, true)
assert.equal(reports.readinessReport.toolRouteMetadataDryRunPassed, true)
assert.equal(reports.readinessReport.firstCandidateReviewPassed, true)
assert.equal(reports.readinessReport.approvedPlanSnapshotRequirementsPassed, true)
assert.equal(reports.readinessReport.workerHandoffRequirementsPassed, true)
assert.equal(reports.readinessReport.artifactGuardrailsPassed, true)
assert.equal(reports.readinessReport.failClosedPolicyPassed, true)
assert.equal(reports.readinessReport.observabilityCostAuditRequirementsPassed, true)
assert.equal((reports.decision.selectedFirstCandidate as Record<string, unknown>).candidateId, 'controlled-tool:first_fixture_report_validation')
assert.equal((reports.sourceOfTruthAudit.pr384DuplicateRisk as Record<string, unknown>).treatedAsSourceOfTruth, false)
assert.equal(reports.decision.realToolExecutionApproved, false)
assert.equal(reports.decision.routeExecutionApproved, false)
assert.equal(reports.decision.workerExecutionApproved, false)
assert.equal(reports.decision.providerExecutionApproved, false)
assert.equal(reports.decision.supabaseWritesApproved, false)
assert.equal(reports.decision.publicArtifactsApproved, false)
assert.equal(reports.decision.signedUrlsApproved, false)
assert.deepEqual(reports.decision.supabaseClassification, {
  updateRequired: 'no write',
  updateStatus: 'Track B clean staging milestone sync completed before this phase; this packet is metadata/reporting only.',
  environmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  nextSupabaseAction: 'none',
})

for (const report of requiredReports) {
  assert.equal(fs.existsSync(`${CONTROLLED_TOOL_EXECUTION_APPROVAL_REPORT_DIR}/${report}`), true, `Missing report ${report}`)
}
for (const doc of requiredDocs) {
  assert.equal(fs.existsSync(doc), true, `Missing doc ${doc}`)
}

const scanText = [
  ...requiredReports.map((file) => fs.readFileSync(`${CONTROLLED_TOOL_EXECUTION_APPROVAL_REPORT_DIR}/${file}`, 'utf8')),
  ...requiredDocs.map((file) => fs.readFileSync(file, 'utf8')),
].join('\n')
for (const pattern of [
  /\brouteExecutionAllowed\s*[:=]\s*true\b/i,
  /\btoolExecutionAllowed\s*[:=]\s*true\b/i,
  /\bworkerExecutionAllowed\s*[:=]\s*true\b/i,
  /\bproviderExecutionAllowed\s*[:=]\s*true\b/i,
  /\bpublicArtifactsAllowed\s*[:=]\s*true\b/i,
  /\bsignedUrlsAsSourceOfTruthAllowed\s*[:=]\s*true\b/i,
  /\bproductionUnlockAllowed\s*[:=]\s*true\b/i,
  /\brawPromptExecutionAllowed\s*[:=]\s*true\b/i,
  /\b(sk-[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9._~+/-]{16,}|postgres(?:ql)?:\/\/|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+|X-Goog-Signature=|X-Amz-Signature=)\b/i,
]) {
  assert.equal(pattern.test(scanText), false, `Forbidden pattern matched: ${pattern}`)
}

console.log('Controlled tool execution approval smoke passed.')
