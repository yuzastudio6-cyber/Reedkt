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
    command: 'npm run prod:readiness:summary',
    requiredEnvVars: [],
    safetyNotes: [
      'Default static mode builds a report from specs, Dockerfile declarations, model-weight templates, and policies.',
      'It does not execute Docker, gcloud, media tools, GPU tools, imports, providers, or downloads.',
    ],
    expectedOutputSummary: 'Production readiness summary with worker, image, tool, model-weight, and blocker sections.',
    doesNotRun: READINESS_DOES_NOT_RUN,
  }
}

export function buildReadinessCommandPlans(): ReadinessCommandPlan[] {
  const imageRoles: ProductionContainerImageRole[] = [
    'cpu_worker',
    'render_worker',
    'qa_worker',
    'gpu_worker',
  ]

  return [
    buildStaticReadinessCommandPlan(),
    ...imageRoles.map(buildContainerReadinessCommandPlan),
    buildAllContainerReadinessCommandPlan(),
  ]
}

export function getReadinessCommandPlan(id: string): ReadinessCommandPlan | undefined {
  return buildReadinessCommandPlans().find((plan) => plan.id === id)
}
