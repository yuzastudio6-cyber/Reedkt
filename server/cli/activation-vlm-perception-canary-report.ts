import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  VLM_PERCEPTION_CANARY_REPORT_DIR,
  buildVlmPerceptionCanaryStaticReport,
  writeVlmPerceptionCanaryStaticArtifacts,
} from '../activation/vlm-perception-canary'

const writeArtifacts = process.argv.includes('--write-artifacts')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const artifactDir = artifactDirArg?.split('=')[1] ?? VLM_PERCEPTION_CANARY_REPORT_DIR

if (writeArtifacts) {
  await writeVlmPerceptionCanaryStaticArtifacts(artifactDir)
}

let report = buildVlmPerceptionCanaryStaticReport()
if (!writeArtifacts) {
  try {
    report = JSON.parse(await readFile(path.join(artifactDir, 'phase_39cq_so3_perception_canary_recovery_report.json'), 'utf8'))
  } catch {
    // No execution report has been committed yet; keep the static non-mutating report.
  }
}

console.log(JSON.stringify(report, null, 2))
