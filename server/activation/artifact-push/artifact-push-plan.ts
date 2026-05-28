import {
  containerImageBuildPlans,
  validateContainerImageTag,
} from '../container-build'
import type { ContainerBuildImageId } from '../container-build'

export interface ArtifactPushPlanInput {
  project?: string
  artifactRegion?: string
  repository?: string
  imageTag?: string
}

export interface ArtifactPushCommandPlan {
  commandId: string
  imageId: ContainerBuildImageId
  fullImageName: string
  commandString: string
  safeToRunManually: boolean
  requiresHumanConfirmation: true
  confirmationEnvVar: 'REEDITPRO_CONFIRM_ARTIFACT_PUSH'
  deferred: boolean
  doesNotDo: string[]
  warnings: string[]
}

export interface ArtifactPushPlanReport {
  reportId: string
  createdAt: string
  project?: string
  artifactRegion?: string
  repository?: string
  imageTag?: string
  commandPlans: ArtifactPushCommandPlan[]
  blockers: string[]
  warnings: string[]
  dockerPushExecuted: false
  gcloudExecuted: false
  deploymentExecuted: false
  productionReadyAllowed: false
  externalBetaAllowed: false
  realUserMediaTestingAllowed: false
}

const nonGpuPhase23Images = new Set<ContainerBuildImageId>([
  'api',
  'tool-readiness-worker',
  'cpu-worker',
  'qa-worker',
  'render-worker',
])

const doesNotDo = [
  'does not execute docker push',
  'does not run gcloud',
  'does not deploy',
  'does not call providers',
  'does not download model weights',
  'does not process or mount media',
  'does not include secrets',
  'does not unblock production or external beta',
]

export function buildArtifactPushPlanReport(input: ArtifactPushPlanInput): ArtifactPushPlanReport {
  const blockers = validateArtifactPushInput(input)
  const commandPlans = blockers.length === 0 ? buildCommandPlans(input as Required<ArtifactPushPlanInput>) : []
  const warnings = [
    'Phase 23 push commands are printed as human-run text only; this CLI never executes docker push.',
    'GPU image remains deferred until the GPU build/readiness phase.',
    'Phase 24 deployment remains blocked until GCP resources, image push evidence, IAM, and secrets are verified.',
  ]

  return {
    reportId: 'activation-phase-23-artifact-push-plan',
    createdAt: new Date().toISOString(),
    project: input.project,
    artifactRegion: input.artifactRegion,
    repository: input.repository,
    imageTag: input.imageTag,
    commandPlans,
    blockers,
    warnings,
    dockerPushExecuted: false,
    gcloudExecuted: false,
    deploymentExecuted: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    realUserMediaTestingAllowed: false,
  }
}

export function summarizeArtifactPushPlanReport(report: ArtifactPushPlanReport): string {
  return [
    `Artifact push plan: ${report.reportId}`,
    `Project: ${report.project ?? '(missing)'}`,
    `Artifact region: ${report.artifactRegion ?? '(missing)'}`,
    `Repository: ${report.repository ?? '(missing)'}`,
    `Image tag: ${report.imageTag ?? '(missing)'}`,
    `Command plans: ${report.commandPlans.length}`,
    `Blockers: ${report.blockers.length}`,
    `Docker push executed: ${report.dockerPushExecuted}`,
    `gcloud executed: ${report.gcloudExecuted}`,
    `Deployment executed: ${report.deploymentExecuted}`,
    `Production ready allowed: ${report.productionReadyAllowed}`,
    `External beta allowed: ${report.externalBetaAllowed}`,
    `Real user media testing allowed: ${report.realUserMediaTestingAllowed}`,
    '',
    'Blockers:',
    ...(report.blockers.length > 0 ? report.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Human-run command plan text:',
    ...(report.commandPlans.length > 0 ? report.commandPlans.map(formatCommandPlan) : ['- no commands until blockers are resolved']),
    '',
    'Warnings:',
    ...report.warnings.map((warning) => `- ${warning}`),
  ].join('\n')
}

function buildCommandPlans(input: Required<ArtifactPushPlanInput>): ArtifactPushCommandPlan[] {
  return containerImageBuildPlans.map((plan) => {
    const fullImageName = `${input.artifactRegion}-docker.pkg.dev/${input.project}/${input.repository}/${plan.displayName}:${input.imageTag}`
    const deferred = !nonGpuPhase23Images.has(plan.imageId)
    return {
      commandId: `push_${plan.imageId}`,
      imageId: plan.imageId,
      fullImageName,
      commandString: deferred
        ? 'GPU image deferred for Phase 23 non-GPU push preparation.'
        : `REEDITPRO_CONFIRM_ARTIFACT_PUSH=true docker push ${fullImageName}`,
      safeToRunManually: !deferred,
      requiresHumanConfirmation: true,
      confirmationEnvVar: 'REEDITPRO_CONFIRM_ARTIFACT_PUSH',
      deferred,
      doesNotDo: [...doesNotDo],
      warnings: deferred
        ? ['GPU image was not built in Phase 20B and must not be pushed in Phase 23 non-GPU preparation.']
        : ['Text-only plan. This CLI does not execute docker push.'],
    }
  })
}

function validateArtifactPushInput(input: ArtifactPushPlanInput): string[] {
  const blockers: string[] = []
  const tagCheck = validateContainerImageTag(input.imageTag)
  if (!tagCheck.allowed) blockers.push(...tagCheck.blockers)
  if (!input.project || !/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(input.project)) {
    blockers.push('GCP project id is missing or not project-id safe.')
  }
  if (!input.artifactRegion || !/^[a-z]+-[a-z]+[0-9]$/.test(input.artifactRegion)) {
    blockers.push('Artifact region is missing or invalid.')
  }
  if (!input.repository || !/^[a-z0-9][a-z0-9-]{2,62}$/.test(input.repository)) {
    blockers.push('Artifact repository is missing or invalid.')
  }
  return blockers
}

function formatCommandPlan(plan: ArtifactPushCommandPlan): string {
  return [
    `# ${plan.commandId}`,
    `imageId=${plan.imageId}`,
    `deferred=${plan.deferred}`,
    `requiresHumanConfirmation=${plan.requiresHumanConfirmation}`,
    `confirmationEnvVar=${plan.confirmationEnvVar}`,
    `fullImageName=${plan.fullImageName}`,
    `commandString=${plan.commandString}`,
    `doesNotDo=${plan.doesNotDo.join('; ')}`,
    `warnings=${plan.warnings.join('; ')}`,
  ].join('\n')
}
