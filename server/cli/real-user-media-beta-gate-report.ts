import {
  buildApprovedRealUserMediaBetaGateFixture,
  buildRealUserMediaBetaGateReport,
} from '../beta-readiness'

const report = buildRealUserMediaBetaGateReport(buildApprovedRealUserMediaBetaGateFixture())

console.log(JSON.stringify({
  ok: report.externalBetaWithRealUserMediaAllowed,
  decision: report.decision,
  sourceId: report.sourceId,
  sourceSha: report.sourceSha,
  workspaceId: report.workspaceId,
  projectId: report.projectId,
  approvedScope: report.approvedScope,
  artifactPrivacySummary: report.artifactPrivacySummary,
  goNoGo: {
    externalBetaAllowed: report.goNoGo.externalBetaAllowed,
    realUserMediaBetaAllowed: report.goNoGo.realUserMediaBetaAllowed,
    paidProductionAllowed: report.goNoGo.paidProductionAllowed,
  },
  checklist: report.checklist.map((item) => ({
    id: item.id,
    status: item.status,
    blockerCount: item.blockers.length,
  })),
  blockers: report.blockers,
  warnings: report.warnings,
  nextActions: report.nextActions,
}, null, 2))
