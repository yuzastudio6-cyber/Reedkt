import type { ProductionContainerImageRole } from '../production-readiness'
import type { ReadinessCommandPlan } from './readiness-validation-types'
import { READINESS_DOES_NOT_RUN } from './readiness-validation-policy'

const imageEnvByRole: Record<ProductionContainerImageRole, string> = {
  api: 'REEDITPRO_API_IMAGE',
  cpu_worker: 'REEDITPRO_CPU_WORKER_IMAGE',
  gpu_worker: 'REEDITPRO_GPU_WORKER_IMAGE',
  render_worker: 'REEDITPRO_RENDER_WORKER_IMAGE',
  qa_worker: 'REEDITPRO_QA_WORKER_IMAGE',
  tool_readiness_worker: 'REEDITPRO_TOOL_READINESS_IMAGE',
}

const roleLabel: Record<ProductionContainerImageRole, string> = {
  api: 'API',
  cpu_worker: 'CPU worker',
  gpu_worker: 'GPU worker',
  render_worker: 'render worker',
  qa_worker: 'QA worker',
  tool_readiness_worker: 'tool-readiness worker',
}

export function buildContainerReadinessCommandPlan(
  imageRole: ProductionContainerImageRole,
): ReadinessCommandPlan {
  const imageEnv = imageEnvByRole[imageRole]
  const roleArg = imageRole === 'api' ? 'api' : imageRole
  return {
    id: `container_readiness_${imageRole}`,
    label: `${roleLabel[imageRole]} container readiness`,
    mode: 'container_command_plan',
    command: `docker run --rm --env REEDITPRO_READINESS_MODE=container_runtime --env REEDITPRO_CONTAINER_IMAGE_ROLE=${roleArg} \${${imageEnv}} npm run prod:readiness:summary -- --mode=static_only`,
    requiredEnvVars: [
      imageEnv,
      'REEDITPRO_CONFIRM_CONTAINER_READINESS=true',
    ],
    safetyNotes: [
      'Human-run container readiness command; Milestone 12 only emits the plan.',
      'The command must be printed and explicitly confirmed before docker run.',
      'Do not mount user source media or model-weight directories by default.',
    ],
    expectedOutputSummary: `${roleLabel[imageRole]} static readiness summary with no media processing or inference.`,
    doesNotRun: READINESS_DOES_NOT_RUN,
  }
}

export function buildAllContainerReadinessCommandPlan(): ReadinessCommandPlan {
  return {
    id: 'container_readiness_all',
    label: 'All container readiness',
    mode: 'container_command_plan',
    command: 'scripts/docker/prod/13-run-all-container-readiness.example.sh',
    requiredEnvVars: [
      'REEDITPRO_API_IMAGE',
      'REEDITPRO_CPU_WORKER_IMAGE',
      'REEDITPRO_RENDER_WORKER_IMAGE',
      'REEDITPRO_QA_WORKER_IMAGE',
      'REEDITPRO_GPU_WORKER_IMAGE',
      'REEDITPRO_TOOL_READINESS_IMAGE',
      'REEDITPRO_CONFIRM_CONTAINER_READINESS=true',
    ],
    safetyNotes: [
      'Runs human-confirmed docker readiness commands only when invoked manually.',
      'No production image build, push, gcloud, deployment, source media mount, provider call, model download, or inference is part of this plan.',
    ],
    expectedOutputSummary: 'Static readiness summaries for all production image roles.',
    doesNotRun: READINESS_DOES_NOT_RUN,
  }
}
