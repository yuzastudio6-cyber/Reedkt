import assert from 'node:assert/strict'
import { buildToolBetaExecutionReadinessReport } from '../beta-readiness'
import { PRODUCTION_TOOL_IDS } from '../tool-registry'

const report = buildToolBetaExecutionReadinessReport()

assert.ok(report.reportId.startsWith('tool-beta-execution-readiness-'), 'tool beta execution readiness report should build')
assert.equal(report.totalTools, PRODUCTION_TOOL_IDS.length, 'report must cover every production registry tool')
assert.equal(report.ownerCoverageToolCount, PRODUCTION_TOOL_IDS.length, 'report must include every metering owner coverage case')
assert.equal(report.readinessSpecToolCount, PRODUCTION_TOOL_IDS.length, 'report must include every readiness spec')
assert.equal(report.productReadyLocalOssCount, 0, 'report must not claim product-ready local OSS')
assert.equal(report.serviceFeeIncluded, false, 'tool event service fee must remain excluded')
assert.equal(
  report.productionBillingPersistence,
  'supabase_tool_cost_events_implemented_pending_deployment',
  'durable billing persistence should be implemented in source but blocked until deployment validation',
)
assert.equal(report.readinessMode, 'dry_run', 'report should be dry-run only')
assert.equal(report.allToolsHaveOwnerCoverage, true, 'all tools should have owner coverage')
assert.equal(report.allToolsHaveReadinessSpecs, true, 'all tools should have readiness specs')
assert.equal(report.internalDryRunMonitoringAllowed, true, 'internal dry-run monitoring can proceed after coverage')
assert.equal(report.externalBetaToolExecutionAllowed, false, 'external beta tool execution must remain blocked')
assert.equal(report.productionToolExecutionAllowed, false, 'production tool execution must remain blocked')
assert.equal(report.tools.length, PRODUCTION_TOOL_IDS.length, 'one tool record per production tool is required')
assert.ok(report.blockers.length > 0, 'tool execution blockers must be explicit')
assert.ok(report.platformBlockers.length > 0, 'shared platform blockers must be explicit')
assert.ok(report.nextActions.length > 0, 'tool execution next actions must be explicit')
assert.ok(report.tools.every((tool) => tool.productReadyLocalOss === false), 'every tool must keep productReadyLocalOss false')
assert.ok(report.tools.every((tool) => tool.executableForProduction === false), 'every tool must keep production execution false')
assert.ok(report.tools.every((tool) => tool.expectedWorkerTypes.length > 0), 'every tool must list expected worker types')
assert.ok(report.tools.every((tool) => tool.imageRoles.length > 0), 'every tool must list image roles')
assert.ok(report.tools.some((tool) => tool.toolId === 'revideo' && tool.blockers.length > 0), 'Revideo must remain blocked/evaluation-only')
assert.ok(report.blockers.some((blocker) => blocker.blockerId === 'real_execution_not_verified'), 'real execution proof must be required')
assert.ok(
  report.platformBlockers.some((blocker) => blocker.blockerId === 'production_billing_deployment_unverified'),
  'durable billing deployment validation must be required',
)
assert.ok(
  !report.blockers.some((blocker) => blocker.blockerId === 'production_billing_persistence_missing'),
  'durable billing should not be duplicated as a per-tool blocker after persistence is implemented',
)
assert.ok(report.blockers.some((blocker) => blocker.blockerId === 'model_weight_approval_missing'), 'model-weight approval must be required')

const evidenceReport = buildToolBetaExecutionReadinessReport({
  acceptedEvidence: [{
    toolId: 'ffmpeg',
    sourceId: 'tool-beta-evidence:bounded-ffmpeg-runtime-proof',
    sourceSha: '0000000000000000000000000000000000000000',
    readinessStatus: 'passed',
    realExecutionVerified: true,
    productionReadinessAccepted: true,
    productReadyLocalOss: true,
    notes: ['Smoke fixture proves accepted evidence can clear only the named tool blockers.'],
  }],
})
const acceptedFfmpeg = evidenceReport.tools.find((tool) => tool.toolId === 'ffmpeg')
assert.ok(acceptedFfmpeg, 'evidence report should include ffmpeg')
assert.equal(evidenceReport.readinessMode, 'evidence_review', 'accepted evidence should switch the report into evidence review mode')
assert.equal(evidenceReport.productReadyLocalOssCount, 1, 'accepted evidence should count one product-ready local OSS tool')
assert.equal(acceptedFfmpeg.productReadyLocalOss, true, 'accepted evidence should make only the named tool product-ready')
assert.equal(acceptedFfmpeg.readinessDryRun, false, 'accepted real execution evidence should clear dry-run status for the named tool')
assert.equal(acceptedFfmpeg.executableForExternalBeta, true, 'accepted evidence should make the named tool externally executable at record level')
assert.equal(acceptedFfmpeg.blockers.length, 0, 'accepted evidence should clear named tool blockers')
assert.equal(evidenceReport.externalBetaToolExecutionAllowed, false, 'platform and remaining tool blockers must still block full external beta')
assert.ok(evidenceReport.platformBlockers.length > 0, 'accepted evidence must not bypass shared platform blockers')
assert.throws(() => buildToolBetaExecutionReadinessReport({
  acceptedEvidence: [
    {
      toolId: 'ffmpeg',
      sourceId: 'duplicate-a',
      readinessStatus: 'passed',
      realExecutionVerified: true,
      productionReadinessAccepted: true,
      productReadyLocalOss: true,
      notes: ['duplicate evidence guard'],
    },
    {
      toolId: 'ffmpeg',
      sourceId: 'duplicate-b',
      readinessStatus: 'passed',
      realExecutionVerified: true,
      productionReadinessAccepted: true,
      productReadyLocalOss: true,
      notes: ['duplicate evidence guard'],
    },
  ],
}), /Duplicate accepted tool beta evidence/, 'duplicate accepted evidence should fail closed')

console.log(JSON.stringify({
  ok: true,
  totalTools: report.totalTools,
  ownerCoverageToolCount: report.ownerCoverageToolCount,
  readinessSpecToolCount: report.readinessSpecToolCount,
  blockers: report.blockers.length,
  platformBlockers: report.platformBlockers.length,
  evidenceReviewProductReadyLocalOssCount: evidenceReport.productReadyLocalOssCount,
  externalBetaToolExecutionAllowed: report.externalBetaToolExecutionAllowed,
  productionToolExecutionAllowed: report.productionToolExecutionAllowed,
}, null, 2))
