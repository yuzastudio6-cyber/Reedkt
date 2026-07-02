import type {
  FixtureBoundExportValidationPolicy,
} from './fixture-bound-export-validation-types'

const baseSafety = {
  sourceProbeExecutesTools: true,
  executesTools: false,
  mediaProcessingAllowed: false,
  realUserMediaAllowed: false,
  videoValidationAllowed: false,
  transcodingAllowed: false,
  muxingAllowed: false,
  filteringAllowed: false,
  renderingAllowed: false,
  workerExecutionAllowed: false,
  providerCallsAllowed: false,
  supabaseMutationAllowed: false,
  sqlAllowed: false,
  signedUrlsAllowed: false,
  packageLockMutationAllowed: false,
  betaProductionAllowed: false,
  finalDeliveryAllowed: false,
  failClosed: true,
} as const

export const FIXTURE_BOUND_EXPORT_VALIDATION_POLICIES = [
  {
    policyId: 'fixture_bound_synthetic_audio_export_validation',
    validationKind: 'fixture_bound_export_validation',
    sourceProbeToolId: 'ffprobe',
    fixtureKind: 'synthetic_audio',
    acceptedContentTypes: ['audio/wav'],
    requiredQualityGates: ['export_codec_format', 'export_duration_sync', 'render_asset_integrity'],
    optionalQualityGates: [
      {
        gateType: 'final_delivery',
        required: false,
        status: 'skipped',
        blocksPreview: false,
        blocksFinalExport: true,
        reason: 'final_delivery_requires_real_export_validation_future_milestone',
      },
    ],
    expectedMaxDurationSeconds: 3.1,
    acceptedFormatNames: ['wav'],
    allowedCodecTypes: ['audio'],
    allowedInputSummaryFields: [
      'formatName',
      'durationSeconds',
      'streamCount',
      'audioStreamCount',
      'videoStreamCount',
      'codecTypes',
      'sampleRate',
      'channels',
      'bitRate',
      'probeOutputBytes',
      'metadataShapeValid',
    ],
    ...baseSafety,
    notes: [
      'Consumes sanitized fixture-bound ffprobe metadata summaries only.',
      'Performs no tool, media, worker, provider, Supabase, SQL, render, mux, or transcode execution.',
      'Keeps final_delivery skipped until a future real export validation milestone.',
    ],
  },
] as const satisfies readonly FixtureBoundExportValidationPolicy[]

export function listFixtureBoundExportValidationPolicies(): FixtureBoundExportValidationPolicy[] {
  return [...FIXTURE_BOUND_EXPORT_VALIDATION_POLICIES]
}

export function getFixtureBoundExportValidationPolicy(
  policyId: string,
): FixtureBoundExportValidationPolicy | undefined {
  return FIXTURE_BOUND_EXPORT_VALIDATION_POLICIES.find((policy) => policy.policyId === policyId)
}
