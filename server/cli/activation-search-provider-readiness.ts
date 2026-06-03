import { buildSearchProviderReadinessCommandPlan, runSearchProviderReadiness } from '../activation/search-provider-readiness'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log(JSON.stringify(buildSearchProviderReadinessCommandPlan(), null, 2))
} else {
  const result = await runSearchProviderReadiness({ execute: true })
  console.log(JSON.stringify({
    localReportPath: result.localReportPath,
    executionReport: {
      ok: result.executionReport.ok,
      runId: result.executionReport.runId,
      evidencePhases: result.executionReport.evidenceChain.phases.map((phase) => `${phase.phase}:${phase.status}`),
      searxngInternalReady: result.executionReport.scopeManifest.searxngInternalReady,
      braveOptionalFallbackReady: result.executionReport.scopeManifest.braveOptionalFallbackReady,
      hybridConsensusReady: result.executionReport.scopeManifest.hybridConsensusReady,
      searchProviderInternalTestingReady: result.executionReport.searchProviderInternalTestingReady,
      phase49OReadiness: result.executionReport.phase49OReadiness,
      artifacts: result.executionReport.artifacts.map((artifact) => artifact.gcsUri),
      blockers: result.executionReport.blockers,
      warnings: result.executionReport.warnings,
    },
  }, null, 2))
}
