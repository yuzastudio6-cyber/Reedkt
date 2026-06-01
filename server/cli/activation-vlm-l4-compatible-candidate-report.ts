import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import { buildVlmL4CompatibleCandidateStaticReport } from '../activation/vlm-l4-compatible-candidate'
import { writeVlmRuntimeJsonArtifact } from '../activation/vlm-runtime'

const writeArtifacts = process.argv.includes('--write-artifacts')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const artifactDir = artifactDirArg?.split('=')[1]
const report = buildVlmL4CompatibleCandidateStaticReport()

if (writeArtifacts && artifactDir) {
  await mkdir(artifactDir, { recursive: true })
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39bq_39cq_vlm_l4_candidate_recovery_report.json'), report)
}

console.log(JSON.stringify(report, null, 2))
