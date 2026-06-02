import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  VLM_SGLANG_KERNEL_COMPAT_REPORT_DIR,
  buildVlmSglangKernelCompatStaticReport,
  writeVlmSglangKernelCompatStaticArtifacts,
} from '../activation/vlm-sglang-runtime'

const writeArtifacts = process.argv.includes('--write-artifacts')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const artifactDir = artifactDirArg?.split('=')[1] ?? VLM_SGLANG_KERNEL_COMPAT_REPORT_DIR

if (writeArtifacts) await writeVlmSglangKernelCompatStaticArtifacts(artifactDir)

let report = buildVlmSglangKernelCompatStaticReport()
if (!writeArtifacts) {
  try {
    report = JSON.parse(await readFile(path.join(artifactDir, 'phase_39c_sg_kernel_compat_recovery_report.json'), 'utf8'))
  } catch {
    // No kernel compatibility report has been committed yet; keep the static non-mutating report.
  }
}

console.log(JSON.stringify(report, null, 2))
