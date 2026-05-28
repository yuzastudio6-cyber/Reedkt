import {
  buildModelDownloadExecutionCommandPlans,
  buildStaticModelDownloadCommandPlans,
  validateModelDownloadPreflight,
} from '../activation/model-download'

const jsonOutput = process.argv.includes('--json')
const report = {
  reportId: 'activation-phase-26b-model-download-plan',
  preflight: validateModelDownloadPreflight({
    projectId: readArgValue('--project') ?? process.env.GCP_PROJECT_ID ?? 'reeditpro',
    env: process.env.REEDITPRO_ENV ?? 'staging',
    repoId: readArgValue('--repo') ?? 'Systran/faster-whisper-tiny',
  }),
  staticDownloadPlans: buildStaticModelDownloadCommandPlans(),
  executionCommandPlans: buildModelDownloadExecutionCommandPlans(),
  modelDownloadExecuted: false,
  providerExecuted: false,
  gpuDeployed: false,
  realUserMediaProcessed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  realUserMediaTestingAllowed: false,
}

if (jsonOutput) console.log(JSON.stringify(report, null, 2))
else {
  console.log([
    `Model download plan: ${report.reportId}`,
    `Preflight blockers: ${report.preflight.blockers.length}`,
    `Static download plans: ${report.staticDownloadPlans.length}`,
    `Execution command plans: ${report.executionCommandPlans.length} (text-only by default)`,
    'Model download executed: false',
    'Production ready allowed: false',
    'External beta allowed: false',
    'Real user media testing allowed: false',
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
