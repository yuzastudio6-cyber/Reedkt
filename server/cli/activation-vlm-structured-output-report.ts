import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import {
  VLM_STRUCTURED_OUTPUT_REPORT_DIR,
  buildVlmStructuredOutputStaticReport,
  getVlmStructuredOutputPlan,
  vlmStructuredOutputStrategies,
} from '../activation/vlm-structured-output'
import { writeVlmRuntimeJsonArtifact } from '../activation/vlm-runtime'

const writeArtifacts = process.argv.includes('--write-artifacts')
const artifactDirArg = process.argv.find((arg) => arg.startsWith('--artifact-dir='))
const artifactDir = artifactDirArg?.split('=')[1] ?? VLM_STRUCTURED_OUTPUT_REPORT_DIR
const report = buildVlmStructuredOutputStaticReport()

if (writeArtifacts) {
  await mkdir(artifactDir, { recursive: true })
  const plan = getVlmStructuredOutputPlan()
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39cq_structured_output_plan.json'), plan)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39cq_structured_output_failure_taxonomy.json'), report.failureTaxonomy)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39cq_structured_output_schema.json'), plan.compactSchema)
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39cq_structured_output_strategy_matrix.json'), {
    phase: '39C-Q-SO',
    reportId: 'phase_39cq_structured_output_strategy_matrix',
    matrixId: plan.strategyMatrix.length ? 'phase39c-qwen-structured-output-v1' : 'unavailable',
    defaultMode: 'non_mutating',
    strategies: vlmStructuredOutputStrategies,
    status: 'blocked',
    blockers: ['execution_not_run'],
  })
  await writeVlmRuntimeJsonArtifact(path.join(artifactDir, 'phase_39cq_structured_output_recovery_report.json'), report)
}

console.log(JSON.stringify(report, null, 2))
