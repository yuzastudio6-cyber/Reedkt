import { buildBraveLiveCommandPlan, runBraveLiveApiValidation } from '../activation/brave-live-api-validation'

const execute = process.argv.includes('--execute')

if (!execute) {
  console.log(JSON.stringify(buildBraveLiveCommandPlan(), null, 2))
} else {
  const result = await runBraveLiveApiValidation({ execute: true })
  console.log(JSON.stringify({
    localReportPath: result.localReportPath,
    iamChanges: result.iamChanges,
    executionReport: {
      ok: result.executionReport.ok,
      status: result.executionReport.status,
      runId: result.executionReport.runId,
      secretConfigured: result.executionReport.secret.configured,
      secretSource: result.executionReport.secret.source,
      secretValuePrinted: result.executionReport.secret.secretValuePrinted,
      callCount: result.executionReport.apiCall.callCount,
      braveLiveApiCompleted: result.executionReport.apiCall.completed,
      normalizedSourceCount: result.executionReport.normalizedSources.length,
      rawResponseStored: result.executionReport.metadata.rawResponseStored,
      snippetsStored: result.executionReport.metadata.snippetsStored,
      phase49MReadiness: result.executionReport.phase49MReadiness,
      artifacts: result.executionReport.artifacts.map((artifact) => artifact.gcsUri),
      blockers: result.executionReport.blockers,
      warnings: result.executionReport.warnings,
    },
  }, null, 2))
}
