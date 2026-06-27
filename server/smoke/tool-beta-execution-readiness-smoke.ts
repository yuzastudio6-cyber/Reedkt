import assert from 'node:assert/strict'
import {
  buildToolBetaExecutionReadinessReport,
  type ToolBetaAcceptedExecutionEvidence,
  type ToolBetaPlatformReadinessEvidence,
} from '../beta-readiness'
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
assert.equal(report.blockerPolicy, 'evidence_driven_block_unsafe_actions_only', 'blocker policy must block only unsafe actions')
assert.equal(
  report.blockerForwardProgressPolicy.intentionalBlanketBlocksAllowed,
  false,
  'blocker policy must not allow intentional blanket freezes',
)
assert.equal(
  report.blockerForwardProgressPolicy.blockerScope,
  'named_unsafe_action_only',
  'blocker policy must scope blockers to named unsafe actions',
)
assert.equal(
  report.blockerForwardProgressPolicy.safeForwardProgressRequired,
  true,
  'blocker policy must require safe forward progress lanes',
)
assert.equal(
  report.blockerForwardProgressPolicy.nextSafeActionRequiredForBlockers,
  true,
  'blocker policy must require a next safe action for blockers',
)
assert.equal(report.safeBlockerReductionAllowed, true, 'safe blocker-reduction work must remain allowed')
assert.deepEqual(
  report.blockedActionScope,
  ['external_beta_tool_execution', 'paid_production_tool_execution'],
  'default blocked action scope should name only unsafe beta/production execution',
)
assert.equal(report.tools.length, PRODUCTION_TOOL_IDS.length, 'one tool record per production tool is required')
assert.ok(report.blockers.length > 0, 'tool execution blockers must be explicit')
assert.ok(report.platformBlockers.length > 0, 'shared platform blockers must be explicit')
assert.ok(report.nextActions.length > 0, 'tool execution next actions must be explicit')
assert.ok(report.tools.every((tool) => tool.nextAction.trim().length > 0), 'every tool record must include a next safe action')
assert.ok(report.tools.every((tool) => tool.productReadyLocalOss === false), 'every tool must keep productReadyLocalOss false')
assert.ok(report.tools.every((tool) => tool.executableForProduction === false), 'every tool must keep production execution false')
assert.ok(report.tools.every((tool) => tool.safeBlockerReductionAllowed === true), 'every blocked tool must still allow safe unblock work')
assert.ok(
  report.tools.every((tool) => tool.blockedActionScope.includes('external_beta_tool_execution')),
  'tool blocked action scope must identify external beta execution without freezing unrelated work',
)
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
assert.deepEqual(acceptedFfmpeg.blockedActionScope, [], 'accepted named tool should have no tool-level blocked action scope')
assert.equal(acceptedFfmpeg.blockers.length, 0, 'accepted evidence should clear named tool blockers')
assert.equal(evidenceReport.externalBetaToolExecutionAllowed, false, 'platform and remaining tool blockers must still block full external beta')
assert.ok(evidenceReport.platformBlockers.length > 0, 'accepted evidence must not bypass shared platform blockers')
assert.ok(evidenceReport.platformBlockers[0]?.message.includes('platform evidence packet missing'), 'missing platform evidence should be named')

const platformEvidence: ToolBetaPlatformReadinessEvidence = {
  sourceId: 'tool-beta-platform-evidence:staging-billing-deployment',
  sourceSha: '1111111111111111111111111111111111111111',
  environment: 'staging',
  toolCostEventsMigrationDeployed: true,
  serviceRoleWritePathVerified: true,
  rlsMemberReadPathVerified: true,
  idempotentReplayVerified: true,
  walletSettlementVerified: true,
  stripeBoundaryVerified: true,
  monitoringVerified: true,
  billingQaVerified: true,
  deploymentApproved: true,
  securityApproved: true,
  storageApproved: true,
  legalApproved: true,
  supportApproved: true,
  notes: ['Smoke fixture proves the shared platform blocker can clear only with a complete evidence packet.'],
}
const platformOnlyEvidenceReport = buildToolBetaExecutionReadinessReport({ platformEvidence })
assert.equal(platformOnlyEvidenceReport.platformBlockers.length, 0, 'complete platform evidence should clear shared platform blocker')
assert.equal(platformOnlyEvidenceReport.externalBetaToolExecutionAllowed, false, 'tool blockers must still block external beta without per-tool evidence')

const acceptedEvidenceForAllTools: ToolBetaAcceptedExecutionEvidence[] = PRODUCTION_TOOL_IDS.map((toolId) => ({
  toolId,
  sourceId: `tool-beta-evidence:${toolId}:complete-runtime-qa`,
  sourceSha: '2222222222222222222222222222222222222222',
  readinessStatus: 'passed',
  realExecutionVerified: true,
  productionReadinessAccepted: true,
  productReadyLocalOss: true,
  modelWeightsApproved: true,
  notes: [`Smoke fixture proves ${toolId} can clear beta-readiness blockers when accepted evidence exists.`],
}))
const fullyEvidencedReport = buildToolBetaExecutionReadinessReport({
  acceptedEvidence: acceptedEvidenceForAllTools,
  platformEvidence,
})
assert.equal(fullyEvidencedReport.blockers.length, 0, 'complete per-tool evidence should clear all tool-specific blockers')
assert.equal(fullyEvidencedReport.platformBlockers.length, 0, 'complete platform evidence should clear platform blockers')
assert.equal(fullyEvidencedReport.productReadyLocalOssCount, PRODUCTION_TOOL_IDS.length, 'complete evidence should count every tool as product-ready in the evidence report')
assert.equal(fullyEvidencedReport.externalBetaToolExecutionAllowed, true, 'complete accepted evidence should allow external beta tool execution')
assert.equal(fullyEvidencedReport.productionToolExecutionAllowed, true, 'complete accepted evidence should allow production tool execution at the tool gate')
assert.deepEqual(fullyEvidencedReport.blockedActionScope, [], 'complete evidence should clear global blocked action scope')

assert.ok(
  buildToolBetaExecutionReadinessReport({
    platformEvidence: { ...platformEvidence, stripeBoundaryVerified: false },
  }).platformBlockers[0]?.message.includes('Stripe boundary not verified'),
  'partial platform evidence should name missing Stripe boundary verification',
)
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
  fullyEvidencedExternalBetaToolExecutionAllowed: fullyEvidencedReport.externalBetaToolExecutionAllowed,
  externalBetaToolExecutionAllowed: report.externalBetaToolExecutionAllowed,
  productionToolExecutionAllowed: report.productionToolExecutionAllowed,
}, null, 2))
