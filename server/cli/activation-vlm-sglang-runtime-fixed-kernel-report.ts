import { readFile } from 'node:fs/promises'
import path from 'node:path'
import {
  VLM_SGLANG_FIXED_KERNEL_REPORT_DIR,
  buildVlmSglangFixedKernelStaticReport,
  writeVlmSglangFixedKernelStaticArtifacts,
} from '../activation/vlm-sglang-runtime'

const writeArtifacts = process.argv.includes('--write-artifacts')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const artifactDir = artifactDirArg?.split('=')[1] ?? VLM_SGLANG_FIXED_KERNEL_REPORT_DIR

if (writeArtifacts) await writeVlmSglangFixedKernelStaticArtifacts(artifactDir)

let report = buildVlmSglangFixedKernelStaticReport()
if (!writeArtifacts) {
  try {
    report = JSON.parse(await readFile(path.join(artifactDir, 'phase_39c_sg_fixed_kernel_recovery_report.json'), 'utf8'))
  } catch {
    // No fixed-kernel execution report exists yet; keep the static non-mutating report.
  }
}

console.log(JSON.stringify(report, null, 2))
