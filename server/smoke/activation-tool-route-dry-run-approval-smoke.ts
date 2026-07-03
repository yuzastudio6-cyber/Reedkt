import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  TOOL_ROUTE_REPORT_DIR,
  buildToolRouteDryRunApprovalPlan,
  buildToolRouteDryRunApprovalReports,
} from '../activation/tool-route-dry-run-approval'

const reports = buildToolRouteDryRunApprovalReports()
const plan = buildToolRouteDryRunApprovalPlan()
const requiredReports = [
  'tool_route_dry_run_source_of_truth_audit.json',
  'tool_study_source_of_truth_revalidation_report.json',
  'tool_route_dry_run_evidence_inventory.json',
  'tool_route_dry_run_scope_policy.json',
  'tool_route_synthetic_approved_plan_snapshot_fixtures.json',
  'tool_route_metadata_resolution_policy.json',
  'tool_route_artifact_source_of_truth_guardrails.json',
  'tool_route_fail_closed_policy.json',
  'tool_route_dry_run_approval_decision.json',
  'tool_route_dry_run_approval_blocker_report.json',
  'tool_route_dry_run_approval_readiness_report.json',
  'tool_route_dry_run_approval_private_artifact_manifest.json',
]
const requiredDocs = [
  'docs/tool-route-dry-run-approval.md',
  'docs/tool-route-dry-run-scope-policy.md',
  'docs/tool-route-metadata-resolution-policy.md',
  'docs/tool-route-artifact-source-of-truth-guardrails.md',
  'docs/tool-route-fail-closed-policy.md',
  'docs/tool-route-dry-run-approval-decision.md',
  'docs/implementation-prompts/prompt-tool-route-metadata-dry-run-execution.md',
]

assert.equal(plan.mode, 'metadata_docs_reports_only')
assert.equal(reports.decision.decision, 'approved_for_future_tool_route_metadata_dry_run_execution')
assert.equal(reports.readinessReport.readiness, true)
assert.equal(reports.sourceRevalidation.routeUnlockReadinessPrecondition, true)
assert.equal((reports.blockerReport.blockers as string[]).length, 0)
assert.equal(reports.sourceOfTruthAudit.duplicateRisk && typeof reports.sourceOfTruthAudit.duplicateRisk === 'object', true)
assert.equal((reports.sourceOfTruthAudit.duplicateRisk as { treatedAsSourceOfTruth?: boolean }).treatedAsSourceOfTruth, false)
assert.equal(reports.fixtures.fixtures.length, 10)
assert.equal(reports.fixtures.fixtures.filter((fixture) => fixture.fixtureClass === 'valid').length, 4)
assert.equal(reports.fixtures.fixtures.filter((fixture) => fixture.fixtureClass === 'invalid').length, 6)
for (const fixture of reports.fixtures.fixtures) {
  assert.equal(fixture.flags.routeExecutionAllowed, false)
  assert.equal(fixture.flags.runtimeExecutionAllowed, false)
  assert.equal(fixture.flags.toolExecutionAllowed, false)
  assert.equal(fixture.flags.workerExecutionAllowed, false)
  assert.equal(fixture.flags.providerExecutionAllowed, false)
  if (fixture.fixtureClass === 'invalid') assert.equal(fixture.expectedOutcome, 'failed_closed')
}
const decision = reports.decision as { realToolExecutionApproved?: boolean; routeExecutionApproved?: boolean; workerExecutionApproved?: boolean; providerExecutionApproved?: boolean }
assert.equal(decision.realToolExecutionApproved, false)
assert.equal(decision.routeExecutionApproved, false)
assert.equal(decision.workerExecutionApproved, false)
assert.equal(decision.providerExecutionApproved, false)
assert.deepEqual(reports.decision.supabaseClassification, {
  updateRequired: 'no write',
  updateStatus: 'Track B clean staging milestone sync completed before this phase; this packet is metadata/docs only.',
  environmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  nextSupabaseAction: 'none',
})

for (const report of requiredReports) {
  assert.equal(fs.existsSync(`${TOOL_ROUTE_REPORT_DIR}/${report}`), true, `Missing report ${report}`)
}
for (const doc of requiredDocs) {
  assert.equal(fs.existsSync(doc), true, `Missing doc ${doc}`)
}

const scanText = [
  ...requiredReports.map((file) => fs.readFileSync(`${TOOL_ROUTE_REPORT_DIR}/${file}`, 'utf8')),
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

console.log('Tool-route dry-run approval smoke passed.')
