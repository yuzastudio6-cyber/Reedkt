import {
  buildMaskModelDownloadExecutionCommandPlans,
  buildStaticMaskModelDownloadCommandPlans,
  validateMaskModelDownloadPreflight,
} from '../activation/mask-model-download'

const jsonOutput = process.argv.includes('--json')
const report = {
  reportId: 'activation-phase-33b-mask-model-download-plan',
  preflight: validateMaskModelDownloadPreflight({
    projectId: readArgValue('--project') ?? process.env.GCP_PROJECT_ID ?? 'reeditpro',
    env: process.env.REEDITPRO_ENV ?? 'staging',
    repoId: readArgValue('--repo') ?? 'ZhengPeng7/BiRefNet',
  }),
  staticDownloadPlans: buildStaticMaskModelDownloadCommandPlans(),
  executionCommandPlans: buildMaskModelDownloadExecutionCommandPlans(),
  modelDownloadExecuted: false,
  providerExecuted: false,
  gpuDeployed: false,
  frameOrVideoProcessed: false,
  maskExecutionRan: false,
  textBehindSubjectExecutionRan: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  broadRealUserMediaAllowed: false,
}

if (jsonOutput) console.log(JSON.stringify(report, null, 2))
else {
  console.log([
    `Mask model download plan: ${report.reportId}`,
    `Preflight blockers: ${report.preflight.blockers.length}`,
    `Static download plans: ${report.staticDownloadPlans.length}`,
    `Execution command plans: ${report.executionCommandPlans.length} (text-only by default)`,
    'Model download executed: false',
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
