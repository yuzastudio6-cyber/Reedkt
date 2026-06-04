import { runMapGeospatialReadiness } from '../activation/map-geospatial-readiness'

const execute = process.argv.includes('--execute')

runMapGeospatialReadiness({ execute })
  .then(({ executionReport, localReportPath, iamChanges }) => {
    console.log(`Phase 50G map/geospatial readiness ${executionReport.ok ? 'completed' : 'blocked'}.`)
    console.log(`Run ID: ${executionReport.runId}`)
    console.log(`Map/geospatial internal testing ready: ${executionReport.mapGeospatialInternalTestingReady}`)
    console.log(`Phase52A readiness: ${executionReport.phase52AReadiness}`)
    console.log(`Local report: ${localReportPath}`)
    console.log(`IAM changes: ${iamChanges.join('; ')}`)
    if (executionReport.blockers.length) {
      console.log('Blockers:')
      for (const blocker of executionReport.blockers) console.log(`- ${blocker}`)
    }
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
