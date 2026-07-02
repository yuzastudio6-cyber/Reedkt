import type {
  FixtureBoundMetadataProbePolicy,
} from './fixture-bound-metadata-probe-types'

const baseSafety = {
  networkAllowed: false,
  stdinAllowed: false,
  shellAllowed: false,
  arbitraryArgsAllowed: false,
  realUserMediaAllowed: false,
  signedUrlsAllowed: false,
  publicArtifactsAllowed: false,
  workerExecutionAllowed: false,
  providerCallsAllowed: false,
  supabaseMutationAllowed: false,
  sqlAllowed: false,
  packageLockMutationAllowed: false,
  betaProductionAllowed: false,
  outputSanitizationRequired: true,
  failClosed: true,
} as const

export const FIXTURE_BOUND_METADATA_PROBE_POLICIES = [
  {
    probeId: 'ffprobe_fixture_bound_synthetic_audio_metadata_probe',
    toolId: 'ffprobe',
    probeKind: 'fixture_bound_metadata_probe',
    fixtureKind: 'synthetic_audio',
    allowedFixtureContentTypes: ['audio/wav'],
    executionMethod: 'exec_file_no_shell',
    executableName: 'ffprobe',
    exactArgPrefix: ['-v', 'error', '-show_format', '-show_streams', '-of', 'json'],
    inputPathPlaceholder: 'GENERATED_SYNTHETIC_FIXTURE_INTERNAL_PATH',
    timeoutMs: 3000,
    maxBufferBytes: 262144,
    allowedExitCodes: [0],
    ...baseSafety,
    notes: [
      'Read-only metadata probe against generated synthetic WAV fixture only.',
      'Do not probe real user media, video fixtures, URLs, or repository files.',
      'Do not transcode, mux, filter, or execute safe command plans.',
    ],
  },
] as const satisfies readonly FixtureBoundMetadataProbePolicy[]

export function listFixtureBoundMetadataProbePolicies(): FixtureBoundMetadataProbePolicy[] {
  return [...FIXTURE_BOUND_METADATA_PROBE_POLICIES]
}

export function getFixtureBoundMetadataProbePolicy(
  probeId: string,
): FixtureBoundMetadataProbePolicy | undefined {
  return FIXTURE_BOUND_METADATA_PROBE_POLICIES.find((policy) => policy.probeId === probeId)
}
