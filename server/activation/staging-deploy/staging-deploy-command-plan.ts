import type {
  StagingCloudRunJobPlan,
  StagingCloudRunServicePlan,
  StagingDeployCommandPlan,
} from './staging-deploy-types'

const doesNotDo = [
  'no GPU deployment',
  'no provider calls',
  'no model downloads',
  'no real user media processing',
  'no secret values',
  'no public access by default',
  'no production or external beta unblock',
]

export function buildStagingDeployCommandPlans(
  servicePlan: StagingCloudRunServicePlan,
  jobPlans: StagingCloudRunJobPlan[],
): StagingDeployCommandPlan[] {
  return [
    {
      commandId: 'deploy-staging-api',
      targetId: 'api',
      commandString: [
        `gcloud run deploy ${servicePlan.serviceName}`,
        `--project=reeditpro --region=${servicePlan.region}`,
        `--image=${servicePlan.imageRef}`,
        `--service-account=${servicePlan.serviceAccountEmail}`,
        '--min-instances=0 --cpu=1 --memory=1Gi --concurrency=40',
        `--set-env-vars=${formatEnvVars(servicePlan.envVars)}`,
        '--no-allow-unauthenticated',
      ].join(' '),
      safeToRunManually: false,
      requiresHumanConfirmation: true,
      confirmationEnvVar: 'REEDITPRO_CONFIRM_STAGING_DEPLOY',
      doesNotDo,
      warnings: ['Blocked until architecture compatibility includes linux/amd64.'],
    },
    ...jobPlans.map((jobPlan) => ({
      commandId: `deploy-${jobPlan.targetId}`,
      targetId: jobPlan.targetId,
      commandString: [
        `gcloud run jobs deploy ${jobPlan.jobName}`,
        `--project=reeditpro --region=${jobPlan.region}`,
        `--image=${jobPlan.imageRef}`,
        `--service-account=${jobPlan.serviceAccountEmail}`,
        `--cpu=${jobPlan.cpu} --memory=${jobPlan.memory}`,
        '--tasks=1 --parallelism=1',
        `--max-retries=${jobPlan.maxRetries}`,
        `--set-env-vars=${formatEnvVars(jobPlan.envVars)}`,
        formatCommand(jobPlan.command),
      ].join(' '),
      safeToRunManually: false,
      requiresHumanConfirmation: true as const,
      confirmationEnvVar: 'REEDITPRO_CONFIRM_STAGING_DEPLOY' as const,
      doesNotDo,
      warnings: ['Blocked until architecture compatibility includes linux/amd64.'],
    })),
  ]
}

function formatEnvVars(envVars: Record<string, string>): string {
  return Object.entries(envVars).map(([key, value]) => `${key}=${value}`).join(',')
}

function formatCommand(command: string[]): string {
  const [entrypoint, ...args] = command
  return [
    `--command=${shellQuote(entrypoint)}`,
    `--args=${args.map(shellQuote).join(',')}`,
  ].join(' ')
}

function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_./:=@-]+$/.test(value)) return value
  return `'${value.replaceAll("'", "'\"'\"'")}'`
}
