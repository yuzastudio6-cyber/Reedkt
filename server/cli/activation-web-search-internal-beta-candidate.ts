import { buildWebSearchInternalBetaCommandPlan, runWebSearchInternalBetaCandidate } from '../activation/web-search-internal-beta-candidate'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log(JSON.stringify(buildWebSearchInternalBetaCommandPlan(), null, 2))
} else {
  const result = await runWebSearchInternalBetaCandidate({ execute: true })
  console.log(JSON.stringify({
    localReportPath: result.localReportPath,
    executionReport: {
      ok: result.executionReport.ok,
      runId: result.executionReport.runId,
      evidencePhases: result.executionReport.evidenceChain.phases.map((phase) => `${phase.phase}:${phase.status}`),
      providerReady: result.executionReport.providerAudit.blockers.length === 0,
      uiApiReady: result.executionReport.uiApiAudit.blockers.length === 0,
      regressionReady: result.executionReport.regressionAudit.blockers.length === 0,
      webSearchInternalBetaCandidateReady: result.executionReport.webSearchInternalBetaCandidateReady,
      phase50AReadiness: result.executionReport.phase50AReadiness,
      artifacts: result.executionReport.artifacts.map((artifact) => artifact.gcsUri),
      blockers: result.executionReport.blockers,
      warnings: result.executionReport.warnings,
    },
  }, null, 2))
}
