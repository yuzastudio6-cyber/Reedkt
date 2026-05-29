import {
  SAM2_CHECKPOINT_SOURCE_URL,
  SAM2_CONFIG_SOURCE_URL,
  SAM2_MODEL_DOWNLOAD_GCS_PATH,
  buildSam2ModelDownloadExecutionCommandPlans,
  validateSam2ModelDownloadStaticPlan,
} from '../activation/sam2-model-download'

const jsonOutput = process.argv.includes('--json')
const report = {
  reportId: 'activation-phase-35b-sam2-model-download-plan',
  preflight: validateSam2ModelDownloadStaticPlan({
    projectId: readArgValue('--project') ?? process.env.GCP_PROJECT_ID ?? 'reeditpro',
    region: readArgValue('--region') ?? process.env.GCP_REGION ?? 'us-central1',
    env: process.env.REEDITPRO_ENV ?? 'staging',
    checkpointSourceUrl: SAM2_CHECKPOINT_SOURCE_URL,
    configSourceUrl: SAM2_CONFIG_SOURCE_URL,
  }),
  executionCommandPlans: buildSam2ModelDownloadExecutionCommandPlans(),
  targetGcsPath: SAM2_MODEL_DOWNLOAD_GCS_PATH,
  modelDownloadExecuted: false,
  providerExecuted: false,
  gpuDeployed: false,
  frameOrVideoProcessed: false,
  sam2RuntimeAllowed: false,
  temporalTrackingAllowed: false,
  fullVideoMaskAllowed: false,
  fullVideoTextBehindSubjectAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  broadRealUserMediaAllowed: false,
}

if (jsonOutput) console.log(JSON.stringify(report, null, 2))
else {
  console.log([
    `SAM2 model download plan: ${report.reportId}`,
    `Preflight blockers: ${report.preflight.blockers.length}`,
    `Execution command plans: ${report.executionCommandPlans.length} (text-only by default)`,
    `Target GCS path: ${report.targetGcsPath}`,
    'Model download executed: false',
    'SAM2 runtime allowed: false',
    'Temporal tracking allowed: false',
    'Full-video mask allowed: false',
    'Full-video text-behind-subject allowed: false',
    'Production ready allowed: false',
    'External beta allowed: false',
    'Broad real user media allowed: false',
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
