import { runRuntimeUnlockRoadmap, summarizeRuntimeUnlockReport } from '../activation/runtime-unlock-roadmap'

const execute = process.argv.includes('--execute')

runRuntimeUnlockRoadmap({ execute })
  .then(({ executionReport, localReportPath, iamChanges }) => {
    console.log(summarizeRuntimeUnlockReport({ ...executionReport, reportId: 'activation-phase-53a-runtime-unlock-roadmap', executionReport, createdAt: executionReport.createdAt }))
    console.log(`Local report: ${localReportPath}`)
    console.log(`IAM changes: ${iamChanges.join('; ')}`)
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
