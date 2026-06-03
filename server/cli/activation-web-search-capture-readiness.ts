import { buildWebSearchReadinessCommandPlan, runWebSearchCaptureReadiness } from '../activation/web-search-capture-readiness'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log(JSON.stringify(buildWebSearchReadinessCommandPlan(), null, 2))
} else {
  const result = await runWebSearchCaptureReadiness({ execute: true })
  console.log(JSON.stringify({
    evidence: result.evidence,
    localReportPath: result.localReportPath,
    executionReport: {
      ok: result.executionReport.ok,
      runId: result.executionReport.runId,
      privateSearxngService: result.executionReport.config.serviceName,
      evidencePhases: result.executionReport.evidenceChain.phases.map((phase) => `${phase.phase}:${phase.status}`),
      servicePublicAccess: result.executionReport.serviceAccessAudit.publicUnauthenticatedAccess,
      artifactCount: result.executionReport.artifacts.length,
      phase49IReadiness: result.executionReport.phase49IReadiness,
      blockers: result.executionReport.blockers,
      warnings: result.executionReport.warnings,
    },
  }, null, 2))
}
