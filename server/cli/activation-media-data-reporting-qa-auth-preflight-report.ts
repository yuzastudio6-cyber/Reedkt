import {
  readMediaDataReportingQaAuthRerunSummary,
  writeMediaDataReportingQaAuthStaticArtifacts,
} from '../activation/media-data-reporting-qa/auth-preflight'

const writeArtifacts = process.argv.includes('--write-artifacts')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const artifactDir = artifactDirArg?.split('=')[1]

if (writeArtifacts) await writeMediaDataReportingQaAuthStaticArtifacts(artifactDir)

console.log(JSON.stringify(await readMediaDataReportingQaAuthRerunSummary(artifactDir), null, 2))
