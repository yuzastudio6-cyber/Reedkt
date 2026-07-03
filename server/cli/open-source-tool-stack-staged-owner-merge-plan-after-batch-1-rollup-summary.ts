import { readStagedOwnerMergeArtifacts } from '../activation/open-source-tool-stack-staged-owner-merge-plan-after-batch-1-rollup'

const reports = readStagedOwnerMergeArtifacts()

console.log([
  'Staged owner merge plan after Batch 1 rollup',
  `Decision: ${String(reports.decision.decision)}`,
  `Primary next prompt: ${String(reports.decision.primaryNextPrompt)}`,
  `Candidates inventoried: ${String(reports.decision.inventoryCandidateCount)}`,
  `AI graphics accepted-with-warnings: ${String(reports.decision.aiGraphicsAcceptedWithWarningsCount)}`,
  `End-to-end product-ready tools: ${String(reports.decision.endToEndProductReadyTools)}`,
  'Do not claim 40+ tools are installed/proven end-to-end.',
].join('\n'))
