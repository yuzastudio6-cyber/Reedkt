import { runVlmModelApproval, summarizeVlmModelApprovalReport } from '../activation/vlm-model-approval'

const writeArtifacts = process.argv.includes('--write-artifacts')
const json = process.argv.includes('--json')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const artifactDir = artifactDirArg?.split('=')[1]

const result = await runVlmModelApproval({ writeArtifacts, artifactDir })

if (json) console.log(JSON.stringify(result, null, 2))
else {
  console.log([
    summarizeVlmModelApprovalReport(result.report),
    '',
    `Local artifact dir: ${result.localArtifactDir}`,
    `Artifacts written: ${result.writtenArtifacts.length}`,
    writeArtifacts ? 'No model files, media, credentials, signed URLs, or GCS objects were written.' : 'Pass --write-artifacts to emit local JSON metadata reports.',
  ].join('\n'))
}
