import type {
  QualityGateStatus,
  QualityGateType,
} from '../../src/backend/contracts/production-tool-runtime-contracts'
import type {
  ProductionToolId,
} from '../tool-registry'
import type {
  BinaryFixtureContentType,
} from './binary-fixture-generation-types'
import type {
  FixtureBoundMetadataProbePolicy,
  FixtureBoundMetadataProbeResult,
  FixtureBoundMetadataProbeStatus,
  FixtureBoundSanitizedMetadataSummary,
} from './fixture-bound-metadata-probe-types'
import type {
  SyntheticFixtureKind,
} from './synthetic-fixture-plan-types'

export type FixtureBoundExportValidationKind = 'fixture_bound_export_validation'

export type FixtureBoundExportValidationStatus =
  | 'passed'
  | 'blocked'
  | 'unavailable'
  | 'failed_closed'

export interface FixtureBoundExportValidationOptionalGatePolicy {
  gateType: Extract<QualityGateType, 'final_delivery'>
  required: false
  status: Extract<QualityGateStatus, 'skipped'>
  blocksPreview: false
  blocksFinalExport: true
  reason: 'final_delivery_requires_real_export_validation_future_milestone'
}

export interface FixtureBoundExportValidationPolicy {
  policyId: 'fixture_bound_synthetic_audio_export_validation'
  validationKind: FixtureBoundExportValidationKind
  sourceProbeToolId: Extract<ProductionToolId, 'ffprobe'>
  fixtureKind: Extract<SyntheticFixtureKind, 'synthetic_audio'>
  acceptedContentTypes: readonly Extract<BinaryFixtureContentType, 'audio/wav'>[]
  requiredQualityGates: readonly Extract<
    QualityGateType,
    'export_codec_format' | 'export_duration_sync' | 'render_asset_integrity'
  >[]
  optionalQualityGates: readonly FixtureBoundExportValidationOptionalGatePolicy[]
  expectedMaxDurationSeconds: 3.1
  acceptedFormatNames: readonly string[]
  allowedCodecTypes: readonly ['audio']
  allowedInputSummaryFields: readonly (keyof FixtureBoundSanitizedMetadataSummary)[]
  sourceProbeExecutesTools: true
  executesTools: false
  mediaProcessingAllowed: false
  realUserMediaAllowed: false
  videoValidationAllowed: false
  transcodingAllowed: false
  muxingAllowed: false
  filteringAllowed: false
  renderingAllowed: false
  workerExecutionAllowed: false
  providerCallsAllowed: false
  supabaseMutationAllowed: false
  sqlAllowed: false
  signedUrlsAllowed: false
  packageLockMutationAllowed: false
  betaProductionAllowed: false
  finalDeliveryAllowed: false
  failClosed: true
  notes: readonly string[]
}

export interface FixtureBoundExportSummary {
  containerFormat?: string
  durationSeconds?: number
  streamCount: number
  audioStreamCount: number
  videoStreamCount: number
  codecTypes: readonly string[]
  sampleRate?: number
  channels?: number
  expectedFixtureKind: Extract<SyntheticFixtureKind, 'synthetic_audio'>
  expectedContentType: Extract<BinaryFixtureContentType, 'audio/wav'>
  metadataShapeValid: boolean
  durationWithinExpectedRange: boolean
  hasOnlyAudioStreams: boolean
  exportValidationShapeValid: boolean
}

export interface FixtureBoundExportQualityGateResult {
  gateType: QualityGateType
  status: Extract<QualityGateStatus, 'passed' | 'failed' | 'blocked' | 'skipped'>
  required: boolean
  score?: number
  threshold?: number
  reason: string
  blocksPreview: boolean
  blocksFinalExport: boolean
}

export interface FixtureBoundExportValidationResult {
  validationRunId: string
  policyId: FixtureBoundExportValidationPolicy['policyId']
  validationKind: FixtureBoundExportValidationKind
  sourceProbeRunId: string
  sourceProbeId: string
  sourceProbeToolId: Extract<ProductionToolId, 'ffprobe'>
  sourceProbeStatus: FixtureBoundMetadataProbeStatus
  fixtureId: string
  fixtureKind: Extract<SyntheticFixtureKind, 'synthetic_audio'>
  contentType: Extract<BinaryFixtureContentType, 'audio/wav'>
  status: FixtureBoundExportValidationStatus
  checkedAt: string
  sanitizedInputSummary?: FixtureBoundSanitizedMetadataSummary
  exportSummary?: FixtureBoundExportSummary
  qualityGateResults: readonly FixtureBoundExportQualityGateResult[]
  issues: readonly string[]
  warnings: readonly string[]
  sourceProbeExecutesTools: true
  exportValidationPerformed: boolean
  executesTools: false
  mediaProcessingPerformed: false
  realUserMediaUsed: false
  videoValidationPerformed: false
  transcodingPerformed: false
  muxingPerformed: false
  filteringPerformed: false
  renderingPerformed: false
  workerExecutionPerformed: false
  providerCallsPerformed: false
  supabaseMutationPerformed: false
  sqlExecuted: false
  signedUrlsUsed: false
  rawProbeJsonExposed: false
  packageLockMutated: false
  betaProductionUnlocked: false
}

export interface FixtureBoundExportValidationExecutionBoundary {
  executesTools: false
  sourceProbeExecutesTools: true
  exportValidationPerformed: boolean
  mediaProcessingPerformed: false
  realUserMediaUsed: false
  videoValidationPerformed: false
  transcodingPerformed: false
  muxingPerformed: false
  filteringPerformed: false
  renderingPerformed: false
  workerExecutionPerformed: false
  providerCallsPerformed: false
  supabaseMutationPerformed: false
  sqlExecuted: false
  signedUrlsUsed: false
  rawProbeJsonExposed: false
  packageLockMutated: false
  betaProductionUnlocked: false
}

export interface FixtureBoundExportValidationValidationSummary {
  ok: boolean
  validationPolicyCount: number
  validationResultCount: number
  passedCount: number
  blockedCount: number
  unavailableCount: number
  failedClosedCount: number
  coveredQualityGates: readonly QualityGateType[]
  requiredQualityGatesPassed: boolean
  finalDeliveryPassed: false
  forbiddenFieldsFound: readonly string[]
  unsafeStringValues: readonly string[]
  invalidPolicyFindings: readonly string[]
  invalidResultFindings: readonly string[]
  nonFirstClassToolIds: readonly string[]
  pendingExternalToolsUsed: boolean
  exportValidationPerformed: boolean
  executesTools: false
  sourceProbeExecutesTools: true
  mediaProcessingPerformed: false
  realUserMediaUsed: false
  videoValidationPerformed: false
  transcodingPerformed: false
  muxingPerformed: false
  filteringPerformed: false
  renderingPerformed: false
  workerExecutionPerformed: false
  providerCallsPerformed: false
  supabaseMutationPerformed: false
  sqlExecuted: false
  signedUrlsUsed: false
  rawProbeJsonExposed: false
  packageLockMutated: false
  betaProductionUnlocked: false
}

export interface FixtureBoundExportValidationRun {
  sourceProbePolicies: readonly FixtureBoundMetadataProbePolicy[]
  sourceProbeResults: readonly FixtureBoundMetadataProbeResult[]
  exportValidationPolicies: readonly FixtureBoundExportValidationPolicy[]
  exportValidationResults: readonly FixtureBoundExportValidationResult[]
  validationSummary: FixtureBoundExportValidationValidationSummary
  executionBoundary: FixtureBoundExportValidationExecutionBoundary
  sourceProbeExecutesTools: true
  executesTools: false
}
