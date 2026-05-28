import {
  containerReadinessDoesNotDo,
  validateContainerReadinessCommandPlan,
} from './container-readiness-policy'
import {
  containerReadinessImageEnvVars,
  containerReadinessImageOrder,
  containerReadinessProductionRoleByImageId,
} from './container-readiness-expected-tools'
import type {
  ContainerReadinessCommandPlan,
  ContainerReadinessImageId,
} from './container-readiness-types'

export function buildContainerReadinessCommandPlans(_imageTag?: string): ContainerReadinessCommandPlan[] {
  void _imageTag
  const plans = [
    buildStaticReadinessCommandPlan(),
    ...containerReadinessImageOrder.map(buildImageReadinessCommandPlan),
    buildAllImagesReadinessCommandPlan(),
  ]

  for (const plan of plans) {
    const policyCheck = validateContainerReadinessCommandPlan(plan)
    if (!policyCheck.allowed) {
      throw new Error(`Unsafe readiness command plan ${plan.commandId}: ${policyCheck.blockers.join('; ')}`)
    }
  }

  return plans
}

export function buildStaticReadinessCommandPlan(): ContainerReadinessCommandPlan {
  return {
    commandId: 'readiness_static',
    imageId: 'static-readiness',
    requiredEnvVars: ['REEDITPRO_CONFIRM_CONTAINER_READINESS=true'],
    commandString: 'npm.cmd run prod:readiness:summary',
    safeToRunManually: true,
    requiresHumanConfirmation: true,
    confirmationEnvVar: 'REEDITPRO_CONFIRM_CONTAINER_READINESS',
    doesNotDo: [...containerReadinessDoesNotDo],
    expectedOutput: 'Static production readiness summary with no Docker, providers, model downloads, or media processing.',
    notes: [
      'This command is already static-only, but Phase 21 keeps the same confirmation marker for readiness evidence discipline.',
    ],
  }
}

export function buildImageReadinessCommandPlan(imageId: ContainerReadinessImageId): ContainerReadinessCommandPlan {
  const imageEnv = containerReadinessImageEnvVars[imageId]
  const role = containerReadinessProductionRoleByImageId[imageId]
  const gpuEnv = imageId === 'gpu-worker'
    ? ' --env REEDITPRO_GPU_INFERENCE_DISABLED=true --env REEDITPRO_MODEL_DOWNLOADS_DISABLED=true'
    : ''
  const commandString = [
    'REEDITPRO_CONFIRM_CONTAINER_READINESS=true',
    'docker run --rm',
    '--env REEDITPRO_READINESS_MODE=container_runtime',
    `--env REEDITPRO_CONTAINER_IMAGE_ROLE=${role}`,
    gpuEnv.trim(),
    `\${${imageEnv}}`,
    'npm run prod:readiness:summary -- --mode=static_only',
  ].filter(Boolean).join(' ')

  return {
    commandId: `readiness_${imageId}`,
    imageId,
    requiredEnvVars: [
      imageEnv,
      'REEDITPRO_CONFIRM_CONTAINER_READINESS=true',
    ],
    commandString,
    safeToRunManually: true,
    requiresHumanConfirmation: true,
    confirmationEnvVar: 'REEDITPRO_CONFIRM_CONTAINER_READINESS',
    doesNotDo: [...containerReadinessDoesNotDo],
    expectedOutput: `${imageId} readiness summary with tool pass/missing/manual-review statuses and no media processing.`,
    notes: [
      'Command string is emitted as text for a human-run readiness check only; Codex must not execute it.',
      imageId === 'gpu-worker'
        ? 'GPU readiness is optional for non-GPU staging; model downloads and inference remain disabled.'
        : 'Required non-GPU readiness evidence feeds Phase 23 image push readiness.',
    ],
  }
}

export function buildAllImagesReadinessCommandPlan(): ContainerReadinessCommandPlan {
  return {
    commandId: 'readiness_all_images',
    imageId: 'all-images',
    requiredEnvVars: [
      'REEDITPRO_API_IMAGE',
      'REEDITPRO_TOOL_READINESS_IMAGE',
      'REEDITPRO_CPU_WORKER_IMAGE',
      'REEDITPRO_QA_WORKER_IMAGE',
      'REEDITPRO_RENDER_WORKER_IMAGE',
      'REEDITPRO_GPU_WORKER_IMAGE',
      'REEDITPRO_CONFIRM_CONTAINER_READINESS=true',
    ],
    commandString: 'REEDITPRO_CONFIRM_CONTAINER_READINESS=true scripts/docker/prod/13-run-all-container-readiness.example.sh',
    safeToRunManually: true,
    requiresHumanConfirmation: true,
    confirmationEnvVar: 'REEDITPRO_CONFIRM_CONTAINER_READINESS',
    doesNotDo: [...containerReadinessDoesNotDo],
    expectedOutput: 'Readiness summaries for all production container images.',
    notes: [
      'The script is a human-run example. Phase 21 CLIs only print/report; they do not invoke it.',
      'GPU output may remain deferred for non-GPU staging.',
    ],
  }
}
