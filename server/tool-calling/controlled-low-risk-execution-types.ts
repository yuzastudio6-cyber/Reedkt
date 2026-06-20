import type {
  ProductionToolId,
} from '../tool-registry'

export type ControlledLowRiskProbeKind =
  | 'version_probe'
  | 'package_resolution_probe'

export type ControlledLowRiskExecutionMethod =
  | 'exec_file_no_shell'
  | 'node_package_resolution'

export type ControlledLowRiskProbeStatus =
  | 'passed'
  | 'unavailable'
  | 'skipped_by_policy'
  | 'failed_closed'

export interface ControlledLowRiskProbePolicy {
  probeId: string
  toolId: ProductionToolId
  probeKind: ControlledLowRiskProbeKind
  executionMethod: ControlledLowRiskExecutionMethod
  executableName?: string
  exactArgs?: readonly string[]
  maxBufferBytes?: number
  packageName?: string
  timeoutMs: number
  allowedExitCodes: readonly number[]
  networkAllowed: false
  stdinAllowed: false
  shellAllowed: false
  arbitraryArgsAllowed: false
  mediaInputAllowed: false
  realUserMediaAllowed: false
  fixtureInputAllowed: false
  workerExecutionAllowed: false
  providerCallsAllowed: false
  supabaseMutationAllowed: false
  sqlAllowed: false
  signedUrlsAllowed: false
  publicArtifactsAllowed: false
  packageLockMutationAllowed: false
  betaProductionAllowed: false
  outputSanitizationRequired: true
  failClosed: true
  notes: readonly string[]
}

export interface ControlledLowRiskProbeResult {
  probeRunId: string
  probeId: string
  toolId: ProductionToolId
  probeKind: ControlledLowRiskProbeKind
  status: ControlledLowRiskProbeStatus
  startedAt: string
  completedAt: string
  durationMs: number
  executableFound: boolean
  packageResolved?: boolean
  versionSummary?: string
  sanitizedStdoutSummary?: string
  sanitizedStderrSummary?: string
  exitCode?: number
  signal?: string
  issues: readonly string[]
  warnings: readonly string[]
  networkUsed: false
  stdinUsed: false
  shellUsed: false
  arbitraryArgsUsed: false
  mediaInputUsed: false
  realUserMediaUsed: false
  fixtureInputUsed: false
  workerExecutionPerformed: false
  providerCallsPerformed: false
  supabaseMutationPerformed: false
  sqlExecuted: false
  signedUrlsUsed: false
  publicArtifactsCreated: false
  packageLockMutated: false
  betaProductionUnlocked: false
  executesTools: true
  mediaProcessingPerformed: false
}

export interface ControlledLowRiskExecutionBoundary {
  executesTools: true
  mediaProcessingPerformed: false
  realUserMediaUsed: false
  fixtureInputUsed: false
  workerExecutionPerformed: false
  providerCallsPerformed: false
  supabaseMutationPerformed: false
  sqlExecuted: false
  signedUrlsUsed: false
  publicArtifactsCreated: false
  packageLockMutated: false
  betaProductionUnlocked: false
}

export interface ControlledLowRiskProbeValidationSummary {
  ok: boolean
  probePolicyCount: number
  probeResultCount: number
  passedCount: number
  unavailableCount: number
  skippedByPolicyCount: number
  failedClosedCount: number
  forbiddenFieldsFound: readonly string[]
  unsafeStringValues: readonly string[]
  invalidPolicyFindings: readonly string[]
  invalidResultFindings: readonly string[]
  nonFirstClassToolIds: readonly string[]
  pendingExternalToolsUsed: boolean
  shellUsed: false
  arbitraryArgsUsed: false
  mediaInputUsed: false
  realUserMediaUsed: false
  fixtureInputUsed: false
  mediaProcessingPerformed: false
  workerExecutionPerformed: false
  providerCallsPerformed: false
  supabaseMutationPerformed: false
  sqlExecuted: false
  signedUrlsUsed: false
  publicArtifactsCreated: false
  packageLockMutated: false
  betaProductionUnlocked: false
  executesTools: true
}

export interface ControlledLowRiskReadinessProbeRun {
  probePolicies: readonly ControlledLowRiskProbePolicy[]
  probeResults: readonly ControlledLowRiskProbeResult[]
  validationSummary: ControlledLowRiskProbeValidationSummary
  executionBoundary: ControlledLowRiskExecutionBoundary
}
