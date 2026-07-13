export const PRIVATE_SOURCE_PROBE_STAGE_ROOT = 'upload-probes'
export const PRIVATE_SOURCE_PROBE_STAGE_VERSION = 'private-source-probe-v1'

export const PRIVATE_SOURCE_PROBE_SCOPE_HASH_PATTERN = /^[a-f0-9]{64}$/
export const PRIVATE_SOURCE_PROBE_ATTEMPT_ID_PATTERN =
  /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/

export function privateSourceProbeVersionRelativeDirectory(): string {
  return `${PRIVATE_SOURCE_PROBE_STAGE_ROOT}/${PRIVATE_SOURCE_PROBE_STAGE_VERSION}`
}

export function privateSourceProbeScopeRelativeDirectory(scopeHash: string): string {
  return `${privateSourceProbeVersionRelativeDirectory()}/${scopeHash}`
}

export function privateSourceProbeAttemptRelativeDirectory(scopeHash: string, attemptId: string): string {
  return `${privateSourceProbeScopeRelativeDirectory(scopeHash)}/${attemptId}`
}
