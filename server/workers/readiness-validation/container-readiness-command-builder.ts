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
    command: `docker run --rm --network none --read-only --cap-drop ALL --security-opt no-new-privileges --user 65532:65532 --env REEDITPRO_CONFIRM_CONTAINER_READINESS --env REEDITPRO_READINESS_MODE=container_runtime --env REEDITPRO_CONTAINER_IMAGE_ROLE=${roleArg} --env REEDITPRO_CONTAINER_IMAGE_REFERENCE=\${${imageEnv}} --env REEDITPRO_SOURCE_COMMIT_SHA --env REEDITPRO_SOURCE_TREE_HASH --env REEDITPRO_RUNTIME_CONFINEMENT_ATTESTED=true --env REEDITPRO_NETWORK_MODE=none --env REEDITPRO_USER_MEDIA_MOUNTED=false --env REEDITPRO_MODEL_DOWNLOADS_DISABLED=true --env REEDITPRO_INFERENCE_DISABLED=true \${${imageEnv}} node dist-server/container-readiness-receipt.js`,
    requiredEnvVars: [
      imageEnv,
      'REEDITPRO_SOURCE_COMMIT_SHA',
      'REEDITPRO_SOURCE_TREE_HASH',
      'REEDITPRO_CONFIRM_CONTAINER_READINESS=true',
    ],
    safetyNotes: [
      'Human-run, immutable-digest container readiness command; source code only emits the plan.',
      'The command must be printed and explicitly confirmed before docker run.',
      'Do not mount user source media or model-weight directories by default.',
      'The emitted candidate is non-promotable until an independent same-source/image verifier and manual license/model gates pass.',
    ],
    expectedOutputSummary: `${roleLabel[imageRole]} bounded runtime-probe candidate receipt with no media processing, model loading, or inference.`,
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
      'REEDITPRO_SOURCE_COMMIT_SHA',
      'REEDITPRO_SOURCE_TREE_HASH',
      'REEDITPRO_CONFIRM_CONTAINER_READINESS=true',
    ],
    safetyNotes: [
      'Runs human-confirmed immutable-digest Docker readiness probes only when invoked manually.',
      'No production image build, push, gcloud, deployment, source media mount, provider call, model download, or inference is part of this plan.',
    ],
    expectedOutputSummary: 'Non-promotable bounded runtime-probe candidate receipts for all six production image roles.',
    doesNotRun: READINESS_DOES_NOT_RUN,
  }
}
