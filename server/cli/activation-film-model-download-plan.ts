import {
  FILM_CHECKPOINT_SOURCE_URL,
  FILM_MODEL_DOWNLOAD_GCS_PATH,
  FILM_SELECTED_ARTIFACT_ROOT,
  FILM_SOURCE_REPO_URL,
  buildFilmModelDownloadExecutionCommandPlans,
  validateFilmModelDownloadStaticPlan,
} from '../activation/film-model-download'

const jsonOutput = process.argv.includes('--json')
const report = {
  reportId: 'activation-phase-38b-film-model-download-plan',
  preflight: validateFilmModelDownloadStaticPlan({
    projectId: readArgValue('--project') ?? process.env.GCP_PROJECT_ID ?? 'reeditpro',
    region: readArgValue('--region') ?? process.env.GCP_REGION ?? 'us-central1',
    env: process.env.REEDITPRO_ENV ?? 'staging',
    sourceRepoUrl: FILM_SOURCE_REPO_URL,
    checkpointSourceUrl: FILM_CHECKPOINT_SOURCE_URL,
    selectedArtifactRoot: FILM_SELECTED_ARTIFACT_ROOT,
  }),
  executionCommandPlans: buildFilmModelDownloadExecutionCommandPlans(),
  targetGcsPath: FILM_MODEL_DOWNLOAD_GCS_PATH,
  selectedArtifactRoot: FILM_SELECTED_ARTIFACT_ROOT,
  modelDownloadExecuted: false,
  providerExecuted: false,
  gpuDeployed: false,
  frameOrVideoProcessed: false,
  filmRuntimeAllowed: false,
  slowMotionAllowed: false,
  realVideoSlowMotionAllowed: false,
  fullVideoInterpolationAllowed: false,
  productionReadyAllowed: false,
  externalBetaAllowed: false,
  broadRealUserMediaAllowed: false,
}

if (jsonOutput) console.log(JSON.stringify(report, null, 2))
else {
  console.log([
    `FILM model download plan: ${report.reportId}`,
    `Preflight blockers: ${report.preflight.blockers.length}`,
    `Execution command plans: ${report.executionCommandPlans.length} (text-only by default)`,
    `Selected artifact root: ${report.selectedArtifactRoot}`,
    `Target GCS path: ${report.targetGcsPath}`,
    'Model download executed: false',
    'FILM runtime allowed: false',
    'Slow motion allowed: false',
    'Real-video slow motion allowed: false',
    'Full-video interpolation allowed: false',
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
