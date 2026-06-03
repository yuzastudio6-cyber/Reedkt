import {
  MEDIA_DATA_REPORTING_QA_REPORT_DIR,
  readMediaDataReportingQaSummary,
  writeMediaDataReportingQaStaticArtifacts,
} from '../activation/media-data-reporting-qa'

const writeArtifacts = process.argv.includes('--write-artifacts')
  || process.env.REEDITPRO_CONFIRM_MEDIA_DATA_REPORTING_QA === 'true'
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? MEDIA_DATA_REPORTING_QA_REPORT_DIR

if (writeArtifacts) {
  await writeMediaDataReportingQaStaticArtifacts(reportDir)
}

console.log(JSON.stringify(await readMediaDataReportingQaSummary(reportDir), null, 2))
