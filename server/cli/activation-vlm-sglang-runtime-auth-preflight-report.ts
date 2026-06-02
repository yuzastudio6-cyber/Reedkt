import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  VLM_SGLANG_AUTH_PREFLIGHT_REPORT_DIR,
  buildVlmSgAuthPreflightStaticReport,
  writeVlmSgAuthPreflightStaticArtifacts,
} from '../activation/vlm-sglang-runtime'

const writeArtifacts = process.argv.includes('--write-artifacts')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const artifactDir = artifactDirArg?.split('=')[1] ?? VLM_SGLANG_AUTH_PREFLIGHT_REPORT_DIR

if (writeArtifacts) await writeVlmSgAuthPreflightStaticArtifacts(artifactDir)

let report = buildVlmSgAuthPreflightStaticReport()
if (!writeArtifacts) {
  try {
    report = JSON.parse(await readFile(path.join(artifactDir, 'phase_39c_sg_auth_rerun_recovery_report.json'), 'utf8'))
  } catch {
    // No auth-rerun report exists yet; keep the static blocked report.
  }
}

console.log(JSON.stringify(report, null, 2))
