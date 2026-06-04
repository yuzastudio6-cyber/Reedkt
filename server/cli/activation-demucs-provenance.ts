import {
  DEMUCS_PROVENANCE_REPORT_DIR,
  readDemucsProvenanceSummary,
  writeDemucsProvenanceArtifacts,
} from '../activation/demucs-provenance-approval'

const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? DEMUCS_PROVENANCE_REPORT_DIR

await writeDemucsProvenanceArtifacts(reportDir)
console.log(JSON.stringify(await readDemucsProvenanceSummary(reportDir), null, 2))
