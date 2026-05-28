import type {
  StagingCloudRunJobPlan,
  StagingCloudRunServicePlan,
  StagingDeployCommandPlan,
  StagingDeployConfig,
  StagingImageArchitectureResult,
} from './staging-deploy-types'
import { validateStagingDeployConfig } from './staging-deploy-config'

export function validateStagingDeployPlan(input: {
  config: StagingDeployConfig
  servicePlan: StagingCloudRunServicePlan
  jobPlans: StagingCloudRunJobPlan[]
  commandPlans: StagingDeployCommandPlan[]
  architectureResults: StagingImageArchitectureResult[]
}): string[] {
  const blockers = [...validateStagingDeployConfig(input.config)]
  if (input.servicePlan.allowUnauthenticated) blockers.push('API service must not allow unauthenticated access by default.')
  if (input.servicePlan.secretsMounted) blockers.push('API service must not mount zero-version Secret Manager placeholders.')
  if (input.servicePlan.serviceAccountEmail.includes('reeditpro-staging-api-sa')) blockers.push('Old long API service account must not be used.')
  for (const jobPlan of input.jobPlans) {
    if (jobPlan.targetId === 'gpu-ai-job') blockers.push('GPU job must not be deployed in Phase 24B.')
    if (jobPlan.secretsMounted) blockers.push(`${jobPlan.jobName} must not mount zero-version secrets.`)
    if (jobPlan.serviceAccountEmail.includes('reeditpro-staging-api-sa')) blockers.push(`${jobPlan.jobName} references old long service account.`)
  }
  for (const architectureResult of input.architectureResults) {
    blockers.push(...architectureResult.blockers)
  }
  const commandText = input.commandPlans.map((plan) => plan.commandString).join('\n')
  if (/reeditpro-staging-gpu-ai-job|gpu-worker|nvidia|--gpu/i.test(commandText)) blockers.push('Command plan includes GPU deployment signal.')
  if (/--allow-unauthenticated/i.test(commandText)) blockers.push('Command plan includes public unauthenticated access.')
  if (/--set-secrets|versions\s+add|SECRET_VALUE|REAL_SECRET/i.test(commandText)) blockers.push('Command plan includes secret value or secret mount signal.')
  if (/provider\s+call|openai\s+api|stripe\s+charge|huggingface-cli|snapshot_download|from_pretrained|download\s+model|\/uploads\/|user[-_\s]?media/i.test(commandText)) {
    blockers.push('Command plan includes forbidden provider/model/media behavior.')
  }
  return Array.from(new Set(blockers))
}
