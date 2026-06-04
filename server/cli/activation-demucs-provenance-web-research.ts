import {
  DEMUCS_PROVENANCE_REPORT_DIR,
  buildDemucsWebResearchReport,
  writeDemucsProvenanceArtifacts,
} from '../activation/demucs-provenance-approval'

const noWrite = process.argv.includes('--no-write-artifacts')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const reportDir = artifactDirArg?.split('=')[1] ?? DEMUCS_PROVENANCE_REPORT_DIR

if (!noWrite) {
  await writeDemucsProvenanceArtifacts(reportDir)
}

console.log(JSON.stringify(buildDemucsWebResearchReport(), null, 2))
