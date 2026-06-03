import {
  MEDIA_DATA_CONTROLLED_SUITE_REPORT_DIR,
  executeMediaDataControlledSuite,
  readMediaDataControlledSuiteSummary,
} from '../activation/media-data-controlled-suite'

const execute = process.argv.includes('--execute')
const keepTemp = process.argv.includes('--keep-temp')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? MEDIA_DATA_CONTROLLED_SUITE_REPORT_DIR

if (execute) {
  const summary = await executeMediaDataControlledSuite({ reportDir, keepTemp })
  console.log(JSON.stringify(summary, null, 2))
} else {
  console.log(JSON.stringify(await readMediaDataControlledSuiteSummary(reportDir), null, 2))
}
