import { runWebSearchUiApiGating } from '../activation/web-search-ui-api-gating'

const execute = process.argv.includes('--execute')
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const runId = runIdArg?.split('=')[1]

runWebSearchUiApiGating({ execute, runId })
  .then((result) => {
    console.log(JSON.stringify({
      status: result.executionReport.ok ? 'completed' : 'blocked',
      runId: result.executionReport.runId,
      localReportPath: result.localReportPath,
      phase49JReadiness: result.executionReport.phase49JReadiness,
      artifacts: result.executionReport.artifacts.map((artifact) => artifact.gcsUri),
      blockers: result.executionReport.blockers,
      warnings: result.executionReport.warnings,
    }, null, 2))
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
