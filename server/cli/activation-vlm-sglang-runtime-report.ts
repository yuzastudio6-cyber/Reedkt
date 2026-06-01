import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  VLM_SGLANG_RUNTIME_REPORT_DIR,
  buildVlmSglangRuntimeStaticReport,
  writeVlmSglangRuntimeBlockedExecutionArtifacts,
  writeVlmSglangRuntimeStaticArtifacts,
} from '../activation/vlm-sglang-runtime'

const writeArtifacts = process.argv.includes('--write-artifacts')
const recordBlockerArg = process.argv.find((arg) => arg.startsWith('--record-blocker='))
const blockerDetailArg = process.argv.find((arg) => arg.startsWith('--blocker-detail='))
const runIdArg = process.argv.find((arg) => arg.startsWith('--run-id='))
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const artifactDir = artifactDirArg?.split('=')[1] ?? VLM_SGLANG_RUNTIME_REPORT_DIR

if (recordBlockerArg) {
  await writeVlmSglangRuntimeBlockedExecutionArtifacts({
    runId: runIdArg?.split('=')[1] ?? `phase39c-sg-${new Date().toISOString().replace(/[^0-9A-Za-z]/g, '').slice(0, 15)}`,
    artifactDir,
    blocker: recordBlockerArg.split('=')[1] ?? 'local_environment_blocker',
    detail: blockerDetailArg?.split('=').slice(1).join('='),
  })
} else if (writeArtifacts) {
  await writeVlmSglangRuntimeStaticArtifacts(artifactDir)
}

let report = buildVlmSglangRuntimeStaticReport()
if (!writeArtifacts) {
  try {
    report = JSON.parse(await readFile(path.join(artifactDir, 'phase_39c_sg_generated_runtime_recovery_report.json'), 'utf8'))
  } catch {
    // No execution report has been committed yet; keep the static non-mutating report.
  }
}

console.log(JSON.stringify(report, null, 2))
