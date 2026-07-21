import type { ProductionContainerImageRole } from '../production-readiness'
import type { ReadinessCommandPlan } from './readiness-validation-types'
import { READINESS_DOES_NOT_RUN } from './readiness-validation-policy'
import {
  buildAllContainerReadinessCommandPlan,
  buildContainerReadinessCommandPlan,
} from './container-readiness-command-builder'

export function buildStaticReadinessCommandPlan(): ReadinessCommandPlan {
  return {
    id: 'static_readiness',
    label: 'Static production readiness',
    mode: 'static_only',
    command: 'npm.cmd run prod:readiness:summary',
    requiredEnvVars: [],
    safetyNotes: [
      'Default static mode builds a report from specs, Dockerfile declarations, model-weight templates, and policies.',
      'It does not execute Docker, gcloud, media tools, GPU tools, imports, providers, or downloads.',
    ],
    expectedOutputSummary: 'Production readiness summary with worker, image, tool, model-weight, and blocker sections.',
    doesNotRun: READINESS_DOES_NOT_RUN,
  }
}

export function buildContainerHostVerificationCommandPlan(): ReadinessCommandPlan {
  return {
    id: 'container_readiness_host_verification',
    label: 'Independent local container source/image verification',
    mode: 'host_optional',
    command: 'scripts/docker/prod/14-verify-container-readiness-candidate.example.sh',
    requiredEnvVars: [
      'REEDITPRO_CONTAINER_READINESS_CANDIDATE_FILE',
      'REEDITPRO_CONFIRM_CONTAINER_HOST_VERIFICATION=true',
    ],
    safetyNotes: [
      'Human-run only after a non-promotable runtime candidate has been retained outside the checkout.',
      'Reads exact clean Git identity and performs local Docker context/image inspection only.',
      'The emitted host receipt remains non-promotable; manual license/model and deployed-release gates stay closed.',
    ],
    expectedOutputSummary: 'Non-promotable local host receipt binding one candidate to an exact clean commit/tree and immutable image digest.',
    doesNotRun: [
      ...READINESS_DOES_NOT_RUN,
      'no Docker pull or run',
      'no cloud or database mutation',
      'no customer price, credits, service fee, wallet, or billing',
    ],
  }
}

export function buildReadinessCommandPlans(): ReadinessCommandPlan[] {
  const imageRoles: ProductionContainerImageRole[] = [
    'api',
    'cpu_worker',
    'render_worker',
    'qa_worker',
    'gpu_worker',
    'tool_readiness_worker',
  ]

  return [
    buildStaticReadinessCommandPlan(),
    ...imageRoles.map(buildContainerReadinessCommandPlan),
    buildAllContainerReadinessCommandPlan(),
    buildContainerHostVerificationCommandPlan(),
  ]
}

export function getReadinessCommandPlan(id: string): ReadinessCommandPlan | undefined {
  return buildReadinessCommandPlans().find((plan) => plan.id === id)
}
