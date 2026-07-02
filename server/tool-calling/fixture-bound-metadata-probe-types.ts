import type {
  ProductionToolId,
} from '../tool-registry'
import type {
  BinaryFixtureContentType,
  BinaryFixtureGenerationPlan,
  BinaryFixtureGenerationResult,
} from './binary-fixture-generation-types'
import type {
  SyntheticFixtureKind,
} from './synthetic-fixture-plan-types'

export type FixtureBoundMetadataProbeKind = 'fixture_bound_metadata_probe'

export type FixtureBoundMetadataProbeExecutionMethod = 'exec_file_no_shell'

export type FixtureBoundMetadataProbeStatus =
  | 'passed'
  | 'unavailable'
  | 'failed_closed'

export interface FixtureBoundMetadataProbePolicy {
  probeId: string
  toolId: Extract<ProductionToolId, 'ffprobe'>
  probeKind: FixtureBoundMetadataProbeKind
  fixtureKind: Extract<SyntheticFixtureKind, 'synthetic_audio'>
  allowedFixtureContentTypes: readonly Extract<BinaryFixtureContentType, 'audio/wav'>[]
  executionMethod: FixtureBoundMetadataProbeExecutionMethod
  executableName: 'ffprobe'
  exactArgPrefix: readonly string[]
  inputPathPlaceholder: 'GENERATED_SYNTHETIC_FIXTURE_INTERNAL_PATH'
  timeoutMs: number
  maxBufferBytes: number
  allowedExitCodes: readonly number[]
  networkAllowed: false
  stdinAllowed: false
  shellAllowed: false
  arbitraryArgsAllowed: false
  realUserMediaAllowed: false
  signedUrlsAllowed: false
  publicArtifactsAllowed: false
  workerExecutionAllowed: false
  providerCallsAllowed: false
  supabaseMutationAllowed: false
  sqlAllowed: false
  packageLockMutationAllowed: false
  betaProductionAllowed: false
  outputSanitizationRequired: true
  failClosed: true
  notes: readonly string[]
}

export interface FixtureBoundSanitizedMetadataSummary {
  formatName?: string
  durationSeconds?: number
  streamCount: number
  audioStreamCount: number
  videoStreamCount: number
  codecTypes: readonly string[]
  sampleRate?: number
  channels?: number
  bitRate?: number
  probeOutputBytes: number
  metadataShapeValid: boolean
}

export interface FixtureBoundMetadataProbeResult {
  probeRunId: string
  probeId: string
  toolId: Extract<ProductionToolId, 'ffprobe'>
  fixtureId: string
  fixtureKind: Extract<SyntheticFixtureKind, 'synthetic_audio'>
  fixtureContentType: Extract<BinaryFixtureContentType, 'audio/wav'>
  sourceGenerationRunId: string
  sourceArtifactId: string
  status: FixtureBoundMetadataProbeStatus
  startedAt: string
  completedAt: string
  durationMs: number
  executableFound: boolean
  fixtureInputUsed: true
  realUserMediaUsed: false
  signedUrlsUsed: false
  shellUsed: false
  arbitraryArgsUsed: false
  workerExecutionPerformed: false
  providerCallsPerformed: false
  supabaseMutationPerformed: false
  sqlExecuted: false
  packageLockMutated: false
  betaProductionUnlocked: false
  mediaProcessingPerformed: false
  metadataProbePerformed: boolean
  exitCode?: number
  signal?: string
  sanitizedMetadataSummary?: FixtureBoundSanitizedMetadataSummary
  sanitizedStdoutSummary?: string
  sanitizedStderrSummary?: string
  issues: readonly string[]
  warnings: readonly string[]
  tempWorkspaceCreated: true
  tempWorkspaceCleanedUp: true
  executesTools: true
}

export interface FixtureBoundMetadataProbeExecutionBoundary {
  executesTools: true
  fixtureInputUsed: true
  metadataProbePerformed: boolean
  mediaProcessingPerformed: false
  realUserMediaUsed: false
  signedUrlsUsed: false
  shellUsed: false
  arbitraryArgsUsed: false
  workerExecutionPerformed: false
  providerCallsPerformed: false
  supabaseMutationPerformed: false
  sqlExecuted: false
  packageLockMutated: false
  betaProductionUnlocked: false
}

export interface FixtureBoundMetadataProbeValidationSummary {
  ok: boolean
  probePolicyCount: number
  probeResultCount: number
  passedCount: number
  unavailableCount: number
  failedClosedCount: number
  forbiddenFieldsFound: readonly string[]
  unsafeStringValues: readonly string[]
  invalidPolicyFindings: readonly string[]
  invalidResultFindings: readonly string[]
  nonFirstClassToolIds: readonly string[]
  pendingExternalToolsUsed: boolean
  tempWorkspacesCleanedUp: boolean
  metadataProbePerformed: boolean
  fixtureInputUsed: true
  realUserMediaUsed: false
  signedUrlsUsed: false
  shellUsed: false
  arbitraryArgsUsed: false
  mediaProcessingPerformed: false
  workerExecutionPerformed: false
  providerCallsPerformed: false
  supabaseMutationPerformed: false
  sqlExecuted: false
  packageLockMutated: false
  betaProductionUnlocked: false
  executesTools: true
}

export interface FixtureBoundMetadataProbeRun {
  binaryFixtureGenerationPlans: readonly BinaryFixtureGenerationPlan[]
  binaryFixtureGenerationResults: readonly BinaryFixtureGenerationResult[]
  probePolicies: readonly FixtureBoundMetadataProbePolicy[]
  probeResults: readonly FixtureBoundMetadataProbeResult[]
  validationSummary: FixtureBoundMetadataProbeValidationSummary
  executionBoundary: FixtureBoundMetadataProbeExecutionBoundary
  executesTools: true
}
