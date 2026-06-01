import {
  OCR_MODEL_DOWNLOAD_GCS_PATH,
  OCR_MODEL_DOWNLOAD_TARGET_PREFIX,
  buildOcrModelDownloadExecutionCommandPlans,
  selectedOcrModelAssetUrls,
  validateOcrModelDownloadStaticPlan,
} from '../activation/ocr-model-download'

const jsonOutput = process.argv.includes('--json')
const report = {
  reportId: 'activation-phase-37b-paddleocr-exact-assets-download-plan',
  preflight: validateOcrModelDownloadStaticPlan({
    projectId: readArgValue('--project') ?? process.env.GCP_PROJECT_ID ?? 'reeditpro',
    region: readArgValue('--region') ?? process.env.GCP_REGION ?? 'us-central1',
    env: process.env.REEDITPRO_ENV ?? 'staging',
    targetPrefix: OCR_MODEL_DOWNLOAD_TARGET_PREFIX,
    assetUrls: selectedOcrModelAssetUrls,
  }),
  executionCommandPlans: buildOcrModelDownloadExecutionCommandPlans(),
  targetGcsPath: OCR_MODEL_DOWNLOAD_GCS_PATH,
  modelDownloadExecuted: false,
  privateGcsUploadExecuted: false,
  providerExecuted: false,
  gpuDeployed: false,
  frameOrVideoProcessed: false,
  ocrRuntimeAllowed: false,
  ocrInferenceAllowed: false,
  runtimeAutoDownloadAllowed: false,
  textlineOrientationAutoDownloadAllowed: false,
  realMediaOcrAllowed: false,
  realVideoOcrAllowed: false,
  captionRenderIntegrationAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  broadRealUserMediaAllowed: false,
  publicOutputAllowed: false,
}

if (jsonOutput) console.log(JSON.stringify(report, null, 2))
else {
  console.log([
    `OCR model download plan: ${report.reportId}`,
    `Preflight blockers: ${report.preflight.blockers.length}`,
    `Execution command plans: ${report.executionCommandPlans.length} (text-only by default)`,
    `Target GCS path: ${report.targetGcsPath}`,
    'Model download executed: false',
    'Private GCS upload executed: false',
    'OCR runtime allowed: false',
    'OCR inference allowed: false',
    'Runtime auto-download allowed: false',
    'Textline orientation auto-download allowed: false',
    'Real media OCR allowed: false',
    'Real video OCR allowed: false',
    'Caption/render integration allowed: false',
    'Production ready allowed: false',
    'External beta allowed: false',
    'Broad real user media allowed: false',
    'Public output allowed: false',
    '',
    'Commands:',
    ...report.executionCommandPlans.map((plan) => `- ${plan.commandId}: ${plan.commandString}`),
    '',
    'Blockers:',
    ...(report.preflight.blockers.length ? report.preflight.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...report.preflight.warnings.map((warning) => `- ${warning}`),
  ].join('\n'))
}

function readArgValue(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}
