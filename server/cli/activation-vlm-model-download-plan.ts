import {
  buildVlmModelDownloadReportFromCurrentMetadata,
} from '../activation/vlm-model-download'

const report = await buildVlmModelDownloadReportFromCurrentMetadata()

if (process.argv.includes('--json')) console.log(JSON.stringify(report.executionCommandPlans, null, 2))
else {
  console.log([
    'Phase 39B Qwen3-VL exact asset private staging plan',
    `Model: ${report.downloadEvidence.modelId}`,
    `Revision: ${report.downloadEvidence.revision}`,
    `Selected files: ${report.assetSelectionManifest.selectedFileCount}`,
    `Selected bytes: ${report.assetSelectionManifest.selectedTotalSizeBytes}`,
    `Private GCS prefix: ${report.downloadEvidence.targetGcsPath}`,
    'Plan/report mode does not download assets, upload to GCS, run runtime/inference, process media, run GPU, deploy, unlock beta/production, or touch Track A.',
    '',
    'Command plan:',
    ...report.executionCommandPlans.map((plan) => `- ${plan.commandId}: ${plan.commandString}`),
  ].join('\n'))
}
