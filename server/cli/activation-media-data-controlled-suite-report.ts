import {
  MEDIA_DATA_CONTROLLED_SUITE_REPORT_DIR,
  readMediaDataControlledSuiteSummary,
  writeMediaDataControlledSuiteStaticArtifacts,
} from '../activation/media-data-controlled-suite'

const writeArtifacts = process.argv.includes('--write-artifacts')
  || process.env.REEDITPRO_CONFIRM_MEDIA_DATA_CONTROLLED_REAL_VIDEO === 'true'
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? MEDIA_DATA_CONTROLLED_SUITE_REPORT_DIR

if (writeArtifacts) {
  await writeMediaDataControlledSuiteStaticArtifacts(reportDir)
}

console.log(JSON.stringify(await readMediaDataControlledSuiteSummary(reportDir), null, 2))
