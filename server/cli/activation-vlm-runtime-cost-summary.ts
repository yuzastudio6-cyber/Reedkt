import { buildCostMemoryReport, vlmRuntimeConfig } from '../activation/vlm-runtime'

const report = buildCostMemoryReport('phase39c-cost-summary', false, false, [
  'Cost summary mode is non-mutating and does not run vLLM or copy model payloads.',
])

console.log([
  'Phase 39C VLM runtime cost/memory summary',
  `Model: ${vlmRuntimeConfig.modelId}`,
  `Revision: ${vlmRuntimeConfig.modelRevision}`,
  `Selected bytes: ${vlmRuntimeConfig.selectedTotalSizeBytes}`,
  `Approved GPU type: ${report.gpuType}`,
  `Memory risk: ${report.memoryRisk}`,
  `Cost risk: ${report.costRisk}`,
  'Runtime/beta/production remain blocked until guarded generated-fixture verification passes.',
].join('\n'))
