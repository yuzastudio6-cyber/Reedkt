import { buildHybridSearchCommandPlan } from '../activation/hybrid-search-consensus-e2e'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log(JSON.stringify(buildHybridSearchCommandPlan(), null, 2))
} else {
  const { runHybridSearchConsensusE2E } = await import('../activation/hybrid-search-consensus-e2e/hybrid-search-runner')
  const result = await runHybridSearchConsensusE2E({ execute: true })
  console.log(JSON.stringify({
    localReportPath: result.localReportPath,
    iamChanges: result.iamChanges,
    executionReport: {
      ok: result.executionReport.ok,
      status: result.executionReport.status,
      runId: result.executionReport.runId,
      query: result.executionReport.planSnapshot.query,
      searxngSourceCount: result.executionReport.normalizedSearxngSources.length,
      braveSourceCount: result.executionReport.normalizedBraveSources.length,
      mergedSourceCount: result.executionReport.mergedSources.length,
      providerAgreementScore: result.executionReport.consensusReport.providerAgreementScore,
      captureCount: result.executionReport.captureRecords.length,
      extractionCount: result.executionReport.extractionRecords.length,
      rawBraveResponseStored: result.executionReport.combinedManifest.rawBraveResponseStored,
      braveSnippetStored: result.executionReport.combinedManifest.braveSnippetStored,
      phase49NReadiness: result.executionReport.phase49NReadiness,
      artifacts: result.executionReport.artifacts.map((artifact) => artifact.gcsUri),
      blockers: result.executionReport.blockers,
      warnings: result.executionReport.warnings,
    },
  }, null, 2))
}
