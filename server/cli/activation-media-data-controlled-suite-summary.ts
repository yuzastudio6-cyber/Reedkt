import { MEDIA_DATA_CONTROLLED_SUITE_REPORT_DIR, readMediaDataControlledSuiteSummary } from '../activation/media-data-controlled-suite'

const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? MEDIA_DATA_CONTROLLED_SUITE_REPORT_DIR

console.log(JSON.stringify(await readMediaDataControlledSuiteSummary(reportDir), null, 2))
