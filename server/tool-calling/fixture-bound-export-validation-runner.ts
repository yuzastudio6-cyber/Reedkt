import type {
  FixtureBoundMetadataProbeResult,
  FixtureBoundSanitizedMetadataSummary,
} from './fixture-bound-metadata-probe-types'
import {
  listFixtureBoundExportValidationPolicies,
} from './fixture-bound-export-validation-policy'
import type {
  FixtureBoundExportQualityGateResult,
  FixtureBoundExportSummary,
  FixtureBoundExportValidationExecutionBoundary,
  FixtureBoundExportValidationPolicy,
  FixtureBoundExportValidationResult,
  FixtureBoundExportValidationRun,
} from './fixture-bound-export-validation-types'
import {
  validateFixtureBoundExportValidationResults,
} from './fixture-bound-export-validation-validator'

export const FIXTURE_BOUND_EXPORT_VALIDATION_EXECUTION_BOUNDARY: FixtureBoundExportValidationExecutionBoundary = {
  executesTools: false,
  sourceProbeExecutesTools: true,
  exportValidationPerformed: false,
  mediaProcessingPerformed: false,
  realUserMediaUsed: false,
  videoValidationPerformed: false,
  transcodingPerformed: false,
  muxingPerformed: false,
  filteringPerformed: false,
  renderingPerformed: false,
  workerExecutionPerformed: false,
  providerCallsPerformed: false,
  supabaseMutationPerformed: false,
  sqlExecuted: false,
  signedUrlsUsed: false,
  rawProbeJsonExposed: false,
  packageLockMutated: false,
  betaProductionUnlocked: false,
}

function nowIso(): string {
  return new Date().toISOString()
}

function validationRunId(
  policy: FixtureBoundExportValidationPolicy,
  sourceProbe: FixtureBoundMetadataProbeResult,
): string {
  return `fixture_bound_export_validation_${policy.policyId}_${sourceProbe.probeRunId}`
}

function isWavCompatibleFormat(formatName: string | undefined): boolean {
  if (!formatName) return false

  return formatName
    .toLowerCase()
    .split(',')
    .map((value) => value.trim())
    .includes('wav')
}

function hasOnlyAudioStreams(summary: FixtureBoundSanitizedMetadataSummary): boolean {
  return (
    summary.audioStreamCount >= 1 &&
    summary.videoStreamCount === 0 &&
    summary.codecTypes.length >= 1 &&
    summary.codecTypes.every((codecType) => codecType === 'audio')
  )
}

function durationWithinExpectedRange(
  summary: FixtureBoundSanitizedMetadataSummary,
  policy: FixtureBoundExportValidationPolicy,
): boolean {
  return (
    typeof summary.durationSeconds === 'number' &&
    Number.isFinite(summary.durationSeconds) &&
    summary.durationSeconds > 0 &&
    summary.durationSeconds <= policy.expectedMaxDurationSeconds
  )
}

function buildExportSummary(
  policy: FixtureBoundExportValidationPolicy,
  sourceProbe: FixtureBoundMetadataProbeResult,
): FixtureBoundExportSummary | undefined {
  const summary = sourceProbe.sanitizedMetadataSummary
  if (!summary) return undefined

  const durationOk = durationWithinExpectedRange(summary, policy)
  const onlyAudio = hasOnlyAudioStreams(summary)
  const shapeValid = (
    summary.metadataShapeValid === true &&
    summary.streamCount >= 1 &&
    summary.audioStreamCount >= 1 &&
    summary.videoStreamCount === 0
  )

  return {
    containerFormat: summary.formatName,
    durationSeconds: summary.durationSeconds,
    streamCount: summary.streamCount,
    audioStreamCount: summary.audioStreamCount,
    videoStreamCount: summary.videoStreamCount,
    codecTypes: summary.codecTypes,
    sampleRate: summary.sampleRate,
    channels: summary.channels,
    expectedFixtureKind: 'synthetic_audio',
    expectedContentType: 'audio/wav',
    metadataShapeValid: shapeValid,
    durationWithinExpectedRange: durationOk,
    hasOnlyAudioStreams: onlyAudio,
    exportValidationShapeValid: (
      sourceProbe.fixtureKind === policy.fixtureKind &&
      policy.acceptedContentTypes.includes(sourceProbe.fixtureContentType) &&
      shapeValid &&
      durationOk &&
      onlyAudio
    ),
  }
}

function skippedFinalDeliveryGate(
  policy: FixtureBoundExportValidationPolicy,
): FixtureBoundExportQualityGateResult {
  const finalDelivery = policy.optionalQualityGates.find((gate) => gate.gateType === 'final_delivery')

  return {
    gateType: 'final_delivery',
    status: 'skipped',
    required: false,
    reason: finalDelivery?.reason ?? 'final_delivery_requires_real_export_validation_future_milestone',
    blocksPreview: false,
    blocksFinalExport: true,
  }
}

function blockedRequiredGate(
  gateType: FixtureBoundExportValidationPolicy['requiredQualityGates'][number],
  reason: string,
): FixtureBoundExportQualityGateResult {
  return {
    gateType,
    status: 'blocked',
    required: true,
    score: 0,
    threshold: 1,
    reason,
    blocksPreview: true,
    blocksFinalExport: true,
  }
}

function passFailGate(
  gateType: FixtureBoundExportValidationPolicy['requiredQualityGates'][number],
  passed: boolean,
  passReason: string,
  failReason: string,
): FixtureBoundExportQualityGateResult {
  return {
    gateType,
    status: passed ? 'passed' : 'failed',
    required: true,
    score: passed ? 1 : 0,
    threshold: 1,
    reason: passed ? passReason : failReason,
    blocksPreview: !passed,
    blocksFinalExport: !passed,
  }
}

function blockedGatesForSourceStatus(
  policy: FixtureBoundExportValidationPolicy,
  sourceProbe: FixtureBoundMetadataProbeResult,
): FixtureBoundExportQualityGateResult[] {
  const reason = sourceProbe.status === 'unavailable'
    ? 'source_probe_unavailable'
    : 'source_probe_failed_closed'

  return [
    ...policy.requiredQualityGates.map((gateType) => blockedRequiredGate(gateType, reason)),
    skippedFinalDeliveryGate(policy),
  ]
}

function buildQualityGateResults(
  policy: FixtureBoundExportValidationPolicy,
  sourceProbe: FixtureBoundMetadataProbeResult,
  exportSummary: FixtureBoundExportSummary | undefined,
): FixtureBoundExportQualityGateResult[] {
  if (sourceProbe.status !== 'passed' || !sourceProbe.sanitizedMetadataSummary || !exportSummary) {
    return blockedGatesForSourceStatus(policy, sourceProbe)
  }

  const inputSummary = sourceProbe.sanitizedMetadataSummary
  const codecFormatPasses = (
    sourceProbe.fixtureContentType === 'audio/wav' &&
    isWavCompatibleFormat(inputSummary.formatName) &&
    hasOnlyAudioStreams(inputSummary)
  )

  const durationPasses = exportSummary.durationWithinExpectedRange
  const integrityPasses = (
    inputSummary.metadataShapeValid === true &&
    inputSummary.streamCount >= 1 &&
    inputSummary.audioStreamCount >= 1 &&
    inputSummary.videoStreamCount === 0
  )

  return [
    passFailGate(
      'export_codec_format',
      codecFormatPasses,
      'wav_audio_only_codec_format_valid',
      'wav_audio_only_codec_format_invalid',
    ),
    passFailGate(
      'export_duration_sync',
      durationPasses,
      'synthetic_audio_duration_within_expected_range',
      'synthetic_audio_duration_outside_expected_range',
    ),
    passFailGate(
      'render_asset_integrity',
      integrityPasses,
      'synthetic_audio_metadata_integrity_valid',
      'synthetic_audio_metadata_integrity_invalid',
    ),
    skippedFinalDeliveryGate(policy),
  ]
}

function resultBase(
  policy: FixtureBoundExportValidationPolicy,
  sourceProbe: FixtureBoundMetadataProbeResult,
  input: {
    status: FixtureBoundExportValidationResult['status']
    exportSummary?: FixtureBoundExportSummary
    qualityGateResults: readonly FixtureBoundExportQualityGateResult[]
    issues?: readonly string[]
    warnings?: readonly string[]
  },
): FixtureBoundExportValidationResult {
  return {
    validationRunId: validationRunId(policy, sourceProbe),
    policyId: policy.policyId,
    validationKind: policy.validationKind,
    sourceProbeRunId: sourceProbe.probeRunId,
    sourceProbeId: sourceProbe.probeId,
    sourceProbeToolId: sourceProbe.toolId,
    sourceProbeStatus: sourceProbe.status,
    fixtureId: sourceProbe.fixtureId,
    fixtureKind: 'synthetic_audio',
    contentType: 'audio/wav',
    status: input.status,
    checkedAt: nowIso(),
    sanitizedInputSummary: sourceProbe.sanitizedMetadataSummary,
    exportSummary: input.exportSummary,
    qualityGateResults: input.qualityGateResults,
    issues: input.issues ?? [],
    warnings: input.warnings ?? [],
    sourceProbeExecutesTools: true,
    exportValidationPerformed: true,
    executesTools: false,
    mediaProcessingPerformed: false,
    realUserMediaUsed: false,
    videoValidationPerformed: false,
    transcodingPerformed: false,
    muxingPerformed: false,
    filteringPerformed: false,
    renderingPerformed: false,
    workerExecutionPerformed: false,
    providerCallsPerformed: false,
    supabaseMutationPerformed: false,
    sqlExecuted: false,
    signedUrlsUsed: false,
    rawProbeJsonExposed: false,
    packageLockMutated: false,
    betaProductionUnlocked: false,
  }
}

export function runFixtureBoundExportValidation(
  policy: FixtureBoundExportValidationPolicy,
  sourceProbe: FixtureBoundMetadataProbeResult,
): FixtureBoundExportValidationResult {
  if (
    sourceProbe.toolId !== policy.sourceProbeToolId ||
    sourceProbe.fixtureKind !== policy.fixtureKind ||
    !policy.acceptedContentTypes.includes(sourceProbe.fixtureContentType)
  ) {
    return resultBase(policy, sourceProbe, {
      status: 'failed_closed',
      qualityGateResults: blockedGatesForSourceStatus(policy, sourceProbe),
      issues: ['source_probe_not_accepted_by_policy'],
    })
  }

  if (sourceProbe.status === 'unavailable') {
    return resultBase(policy, sourceProbe, {
      status: 'unavailable',
      qualityGateResults: blockedGatesForSourceStatus(policy, sourceProbe),
      issues: ['source_probe_unavailable'],
      warnings: sourceProbe.warnings,
    })
  }

  if (sourceProbe.status === 'failed_closed') {
    return resultBase(policy, sourceProbe, {
      status: 'failed_closed',
      qualityGateResults: blockedGatesForSourceStatus(policy, sourceProbe),
      issues: ['source_probe_failed_closed', ...sourceProbe.issues],
      warnings: sourceProbe.warnings,
    })
  }

  const exportSummary = buildExportSummary(policy, sourceProbe)
  const qualityGateResults = buildQualityGateResults(policy, sourceProbe, exportSummary)
  const requiredGatesPassed = qualityGateResults
    .filter((gate) => gate.required)
    .every((gate) => gate.status === 'passed')

  return resultBase(policy, sourceProbe, {
    status: requiredGatesPassed ? 'passed' : 'blocked',
    exportSummary,
    qualityGateResults,
    issues: requiredGatesPassed ? [] : ['required_export_validation_gate_failed'],
    warnings: sourceProbe.warnings,
  })
}

export function runFixtureBoundExportValidations(
  sourceProbeResults: readonly FixtureBoundMetadataProbeResult[],
  policies: readonly FixtureBoundExportValidationPolicy[] = listFixtureBoundExportValidationPolicies(),
): FixtureBoundExportValidationResult[] {
  const results: FixtureBoundExportValidationResult[] = []

  for (const policy of policies) {
    const matchingProbe = sourceProbeResults.find((result) => (
      result.toolId === policy.sourceProbeToolId &&
      result.fixtureKind === policy.fixtureKind &&
      policy.acceptedContentTypes.includes(result.fixtureContentType)
    ))
    if (matchingProbe) {
      results.push(runFixtureBoundExportValidation(policy, matchingProbe))
    }
  }

  return results
}

export function runFixtureBoundExportValidationStack(
  sourceProbeResults: readonly FixtureBoundMetadataProbeResult[],
): Omit<FixtureBoundExportValidationRun, 'sourceProbePolicies' | 'sourceProbeResults'> {
  const exportValidationPolicies = listFixtureBoundExportValidationPolicies()
  const exportValidationResults = runFixtureBoundExportValidations(sourceProbeResults, exportValidationPolicies)
  const validationSummary = validateFixtureBoundExportValidationResults(
    exportValidationResults,
    exportValidationPolicies,
  )

  return {
    exportValidationPolicies,
    exportValidationResults,
    validationSummary,
    executionBoundary: {
      ...FIXTURE_BOUND_EXPORT_VALIDATION_EXECUTION_BOUNDARY,
      exportValidationPerformed: exportValidationResults.some((result) => result.exportValidationPerformed),
    },
    sourceProbeExecutesTools: true,
    executesTools: false,
  }
}
