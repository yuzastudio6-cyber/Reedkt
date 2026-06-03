import {
  MEDIA_DATA_REPORTING_QA_REPORT_DIR,
  executeMediaDataReportingQa,
  readMediaDataReportingQaSummary,
} from '../activation/media-data-reporting-qa'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? MEDIA_DATA_REPORTING_QA_REPORT_DIR

if (execute) {
  const summary = await executeMediaDataReportingQa({ reportDir, keepTemp })
  console.log(JSON.stringify(summary, null, 2))
} else {
  console.log(JSON.stringify(await readMediaDataReportingQaSummary(reportDir), null, 2))
}
