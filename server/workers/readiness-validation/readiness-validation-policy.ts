import type { ReadinessValidationMode } from './readiness-validation-types'

export const READINESS_DOES_NOT_RUN = [
  'no media processing',
  'no model downloads',
  'no inference',
  'no providers',
  'no secrets',
  'no deployment',
  'no Docker build or push',
  'no final render/export',
]

export const STATIC_READINESS_SAFETY_NOTES = [
  'Static readiness validates declarations, manifests, specs, and policies only.',
  'Dry-run readiness does not execute command checks, imports, Docker, gcloud, providers, media tools, GPU tools, or model downloads.',
  'Container runtime readiness is represented as a command plan only in Milestone 12.',
]

export function assertReadinessModeDoesNotExecuteProductionWork(mode: ReadinessValidationMode): void {
  if (mode === 'container_runtime') {
    throw new Error('Milestone 12 does not execute container runtime readiness from npm scripts or smoke tests.')
  }

  if (mode === 'production_blocked') {
    throw new Error('Production readiness execution is blocked until readiness has passed in a later milestone.')
  }
}

export function safetyNotesForMode(mode: ReadinessValidationMode): string[] {
  if (mode === 'host_optional') {
    return [
      ...STATIC_READINESS_SAFETY_NOTES,
      'Host optional mode may run safe command/import checks only when explicitly requested; smoke tests keep it disabled.',
    ]
  }

  if (mode === 'container_command_plan') {
    return [
      ...STATIC_READINESS_SAFETY_NOTES,
      'Container command plan mode emits docker command templates but does not execute them.',
    ]
  }

  return STATIC_READINESS_SAFETY_NOTES
}
