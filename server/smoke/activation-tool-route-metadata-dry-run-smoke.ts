import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  TOOL_ROUTE_METADATA_DRY_RUN_REPORT_DIR,
  buildToolRouteMetadataDryRunPlan,
  buildToolRouteMetadataDryRunReports,
} from '../activation/tool-route-metadata-dry-run'

const reports = buildToolRouteMetadataDryRunReports()
const plan = buildToolRouteMetadataDryRunPlan()
const requiredReports = [
  'tool_route_metadata_dry_run_source_of_truth_audit.json',
  'pre_execution_revalidation_report.json',
  'tool_route_metadata_dry_run_evidence_inventory.json',
  'tool_route_fixture_validation_report.json',
  'tool_route_owner_coverage_validation_report.json',
  'tool_route_metadata_resolution_report.json',
  'tool_route_artifact_scope_validation_report.json',
  'tool_route_noop_lifecycle_simulation_report.json',
  'tool_route_fail_closed_validation_report.json',
  'tool_route_observability_cost_audit_report.json',
  'tool_route_metadata_dry_run_decision.json',
  'tool_route_metadata_dry_run_blocker_report.json',
  'tool_route_metadata_dry_run_readiness_report.json',
  'tool_route_metadata_dry_run_private_artifact_manifest.json',
]
const requiredDocs = [
  'docs/tool-route-metadata-dry-run.md',
  'docs/tool-route-metadata-dry-run-decision.md',
  'docs/tool-route-metadata-dry-run-fail-closed.md',
  'docs/tool-route-metadata-dry-run-artifact-scope.md',
  'docs/implementation-prompts/prompt-controlled-tool-execution-approval-after-route-metadata-dry-run.md',
]

assert.equal(plan.mode, 'metadata_noop_execution_only')
assert.equal(reports.decision.decision, 'tool_route_metadata_dry_run_passed_ready_for_controlled_tool_execution_approval')
assert.equal(reports.readinessReport.readiness, true)
assert.deepEqual(reports.blockerReport.blockers, [])
assert.equal(reports.readinessReport.fixtureValidationPassed, true)
assert.equal(reports.readinessReport.ownerCoveragePassed, true)
assert.equal(reports.readinessReport.metadataResolutionPassed, true)
assert.equal(reports.readinessReport.artifactScopePassed, true)
assert.equal(reports.readinessReport.failClosedPassed, true)
assert.equal(reports.readinessReport.observabilityCostAuditPassed, true)
assert.equal(reports.decision.realToolsExecuted, false)
assert.equal(reports.decision.workersExecuted, false)
assert.equal(reports.decision.realRoutesExecuted, false)
assert.equal(reports.decision.providersCalled, false)
assert.equal(reports.decision.supabaseWrites, false)
assert.equal(reports.decision.publicArtifactsCreated, false)
assert.equal(reports.decision.signedUrlsCreated, false)
assert.deepEqual(reports.decision.supabaseClassification, {
  updateRequired: 'no write',
  updateStatus: 'Track B clean staging milestone sync completed before this phase; this packet is metadata/no-op only.',
  environmentTouched: 'none',
  sqlExecuted: 'none',
  migrationDeployed: 'no',
  nextSupabaseAction: 'none',
})

for (const report of requiredReports) {
  assert.equal(fs.existsSync(`${TOOL_ROUTE_METADATA_DRY_RUN_REPORT_DIR}/${report}`), true, `Missing report ${report}`)
}
for (const doc of requiredDocs) {
  assert.equal(fs.existsSync(doc), true, `Missing doc ${doc}`)
}

const scanText = [
  ...requiredReports.map((file) => fs.readFileSync(`${TOOL_ROUTE_METADATA_DRY_RUN_REPORT_DIR}/${file}`, 'utf8')),
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

console.log('Tool-route metadata dry-run smoke passed.')
