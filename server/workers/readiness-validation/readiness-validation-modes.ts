import type { ReadinessValidationMode } from './readiness-validation-types'

export const READINESS_VALIDATION_MODES: ReadonlyArray<ReadinessValidationMode> = [
  'static_only',
  'dry_run',
  'host_optional',
  'container_command_plan',
  'container_runtime',
  'production_blocked',
]

export function isReadinessValidationMode(value: string): value is ReadinessValidationMode {
  return READINESS_VALIDATION_MODES.includes(value as ReadinessValidationMode)
}

export function parseReadinessValidationMode(value: string | undefined): ReadinessValidationMode {
  if (!value) return 'static_only'
  if (!isReadinessValidationMode(value)) {
    throw new Error(`Unsupported readiness validation mode: ${value}`)
  }
  return value
}

export function modeExecutesHostChecks(mode: ReadinessValidationMode): boolean {
  return mode === 'host_optional'
}

export function modeExecutesContainerRuntime(mode: ReadinessValidationMode): boolean {
  return mode === 'container_runtime'
}

export function assertModeIsSmokeSafe(mode: ReadinessValidationMode): void {
  if (mode === 'container_runtime') {
    throw new Error('container_runtime readiness is reserved for later human-run validation and must not run in smoke tests.')
  }
}
