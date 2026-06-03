import { MEDIA_DATA_GENERATED_SUITE_REPORT_DIR, readMediaDataGeneratedSuiteSummary } from '../activation/media-data-generated-suite'

const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? MEDIA_DATA_GENERATED_SUITE_REPORT_DIR

console.log(JSON.stringify(await readMediaDataGeneratedSuiteSummary(reportDir), null, 2))
