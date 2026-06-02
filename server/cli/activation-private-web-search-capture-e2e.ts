import { buildPrivateWebE2ECommandPlan, runPrivateWebSearchCaptureE2E } from '../activation/private-web-search-capture-e2e'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log(JSON.stringify(buildPrivateWebE2ECommandPlan(), null, 2))
} else {
  const result = await runPrivateWebSearchCaptureE2E({ execute: true })
  console.log(JSON.stringify({
    evidence: result.evidence,
    localReportPath: result.localReportPath,
    iamChanges: result.iamChanges,
    executionReport: {
      ok: result.executionReport.ok,
      runId: result.executionReport.runId,
      providerMode: result.executionReport.providerMode,
      sourceCount: result.executionReport.normalizedSources.length,
      captureCount: result.executionReport.captures.length,
      extractionCount: result.executionReport.extractions.length,
      phase49FReadiness: result.executionReport.phase49FReadiness,
      artifacts: result.executionReport.artifacts.map((artifact) => artifact.gcsUri),
      blockers: result.executionReport.blockers,
      warnings: result.executionReport.warnings,
    },
  }, null, 2))
}
