import {
  containerImageBuildPlans,
} from './container-image-plan'
import {
  validateContainerBuildCommandPlan,
  validateContainerImageTag,
} from './container-build-policy'
import type {
  ContainerBuildCommandPlan,
  ContainerImageBuildPlan,
} from './container-build-types'

export const containerBuildDoesNotDo = [
  'no deploy',
  'no push unless push phase',
  'no model downloads',
  'no provider calls',
  'no secrets',
  'no media processing',
]

export function buildContainerBuildCommandPlans(imageTag: string): ContainerBuildCommandPlan[] {
  const tagCheck = validateContainerImageTag(imageTag)
  if (!tagCheck.allowed) {
    throw new Error(`Invalid REEDITPRO_IMAGE_TAG: ${tagCheck.blockers.join('; ')}`)
  }

  return containerImageBuildPlans
    .slice()
    .sort((left, right) => left.buildOrder - right.buildOrder)
    .map((plan) => buildContainerBuildCommandPlan(plan, imageTag))
}

export function buildContainerBuildCommandPlan(
  plan: ContainerImageBuildPlan,
  imageTag: string,
): ContainerBuildCommandPlan {
  const fullImageName = buildFullImageName(plan.displayName, imageTag)
  const commandPlan: ContainerBuildCommandPlan = {
    commandId: `build_${plan.imageId}`,
    imageId: plan.imageId,
    imageTag,
    dockerfilePath: plan.dockerfilePath,
    contextPath: plan.contextPath,
    fullImageName,
    commandString: `docker build -f ${plan.dockerfilePath} -t ${fullImageName} ${plan.contextPath}`,
    safeToRunManually: true,
    requiresHumanConfirmation: true,
    doesNotDo: [...containerBuildDoesNotDo],
    warnings: [
      'Command string is printed for a human-run Phase 20 step only; Codex must not execute it.',
      ...(plan.heavyBuild ? ['GPU image is heavy and may be deferred until non-GPU staging is healthy.'] : []),
    ],
  }
  const policyCheck = validateContainerBuildCommandPlan(commandPlan)
  if (!policyCheck.allowed) {
    throw new Error(`Unsafe build command plan ${commandPlan.commandId}: ${policyCheck.blockers.join('; ')}`)
  }
  return commandPlan
}

export function buildFullImageName(imageName: string, imageTag: string): string {
  return `\${GCP_ARTIFACT_REGION}-docker.pkg.dev/\${GCP_PROJECT_ID}/\${REEDITPRO_ARTIFACT_REPOSITORY}/${imageName}:${imageTag}`
}
