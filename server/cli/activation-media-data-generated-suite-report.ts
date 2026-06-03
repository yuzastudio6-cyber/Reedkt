import {
  MEDIA_DATA_GENERATED_SUITE_REPORT_DIR,
  readMediaDataGeneratedSuiteSummary,
  writeMediaDataGeneratedSuiteStaticArtifacts,
} from '../activation/media-data-generated-suite'

const writeArtifacts = process.argv.includes('--write-artifacts')
  || process.env.REEDITPRO_CONFIRM_MEDIA_DATA_GENERATED_FIXTURES === 'true'
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? MEDIA_DATA_GENERATED_SUITE_REPORT_DIR

if (writeArtifacts) {
  await writeMediaDataGeneratedSuiteStaticArtifacts(reportDir)
}

console.log(JSON.stringify(await readMediaDataGeneratedSuiteSummary(reportDir), null, 2))
