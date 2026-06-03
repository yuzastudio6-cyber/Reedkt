import {
  MEDIA_DATA_GENERATED_SUITE_REPORT_DIR,
  executeMediaDataGeneratedSuite,
  readMediaDataGeneratedSuiteSummary,
} from '../activation/media-data-generated-suite'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? MEDIA_DATA_GENERATED_SUITE_REPORT_DIR

if (execute) {
  const summary = await executeMediaDataGeneratedSuite({ reportDir, keepTemp })
  console.log(JSON.stringify(summary, null, 2))
} else {
  console.log(JSON.stringify(await readMediaDataGeneratedSuiteSummary(reportDir), null, 2))
}
