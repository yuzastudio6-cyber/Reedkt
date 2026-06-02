import { buildControlledLiveSearchCommandPlan, runControlledLiveSearchCaptureE2E } from '../activation/controlled-live-search-capture-e2e'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log(JSON.stringify(buildControlledLiveSearchCommandPlan(), null, 2))
} else {
  const result = await runControlledLiveSearchCaptureE2E({ execute: true })
  console.log(JSON.stringify({
    evidence: result.evidence,
    localReportPath: result.localReportPath,
    executionReport: {
      ok: result.executionReport.ok,
      runId: result.executionReport.runId,
      serviceName: result.executionReport.serviceName,
      invocationMethod: result.executionReport.privateSearxngInvocationMethod,
      normalizedSourceCount: result.executionReport.normalizedSources.length,
      selectedCaptureTargetCount: result.executionReport.selectedCaptureTargets.length,
      successfulCaptureCount: result.executionReport.captureRecords.length,
      successfulExtractionCount: result.executionReport.extractionRecords.length,
      combinedManifest: result.evidence.combinedManifestUri,
      phase49HReadiness: result.executionReport.phase49HReadiness,
      artifacts: result.executionReport.artifacts.map((artifact) => artifact.gcsUri),
      blockers: result.executionReport.blockers,
      warnings: result.executionReport.warnings,
    },
  }, null, 2))
}
