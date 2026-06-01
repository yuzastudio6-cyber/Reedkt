import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import {
  VLM_STRUCTURED_OUTPUT_COMPAT_REPORT_DIR,
  buildVlmStructuredOutputCompatStaticReport,
  getVlmStructuredOutputCompatPlan,
} from '../activation/vlm-structured-output-compat'
import { writeVlmRuntimeJsonArtifact } from '../activation/vlm-runtime'

const writeArtifacts = process.argv.includes('--write-artifacts')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const artifactDir = artifactDirArg?.split('=')[1] ?? VLM_STRUCTURED_OUTPUT_COMPAT_REPORT_DIR
const report = buildVlmStructuredOutputCompatStaticReport()

if (writeArtifacts) {
  await mkdir(artifactDir, { recursive: true })
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39cq_so2_vllm_structured_output_compat_plan.json'), getVlmStructuredOutputCompatPlan())
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39cq_so2_failure_taxonomy_update.json'), report.failureTaxonomy)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39cq_so2_structured_output_compat_recovery_report.json'), report)
}

console.log(JSON.stringify(report, null, 2))
