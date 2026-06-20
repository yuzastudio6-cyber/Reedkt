import type {
  ControlledLowRiskProbePolicy,
} from './controlled-low-risk-execution-types'

const baseSafety = {
  networkAllowed: false,
  stdinAllowed: false,
  shellAllowed: false,
  arbitraryArgsAllowed: false,
  mediaInputAllowed: false,
  realUserMediaAllowed: false,
  fixtureInputAllowed: false,
  workerExecutionAllowed: false,
  providerCallsAllowed: false,
  supabaseMutationAllowed: false,
  sqlAllowed: false,
  signedUrlsAllowed: false,
  publicArtifactsAllowed: false,
  packageLockMutationAllowed: false,
  betaProductionAllowed: false,
  outputSanitizationRequired: true,
  failClosed: true,
} as const

export const CONTROLLED_LOW_RISK_PROBE_POLICIES = [
  {
    probeId: 'ffmpeg_version_probe',
    toolId: 'ffmpeg',
    probeKind: 'version_probe',
    executionMethod: 'exec_file_no_shell',
    executableName: 'ffmpeg',
    exactArgs: ['-version'],
    timeoutMs: 3000,
    allowedExitCodes: [0],
    ...baseSafety,
    notes: [
      'Version probe only.',
      'Do not pass media inputs or fixture inputs.',
      'Missing executable is reported as unavailable.',
    ],
  },
  {
    probeId: 'ffprobe_version_probe',
    toolId: 'ffprobe',
    probeKind: 'version_probe',
    executionMethod: 'exec_file_no_shell',
    executableName: 'ffprobe',
    exactArgs: ['-version'],
    timeoutMs: 3000,
    allowedExitCodes: [0],
    ...baseSafety,
    notes: [
      'Version probe only.',
      'Do not inspect media or fixture files.',
      'Missing executable is reported as unavailable.',
    ],
  },
  {
    probeId: 'remotion_package_resolution_probe',
    toolId: 'remotion',
    probeKind: 'package_resolution_probe',
    executionMethod: 'node_package_resolution',
    packageName: 'remotion',
    timeoutMs: 1000,
    allowedExitCodes: [0],
    ...baseSafety,
    notes: [
      'Package resolution only.',
      'Do not import Remotion runtime or render compositions.',
      'Missing package is reported as unavailable.',
    ],
  },
  {
    probeId: 'sharp_package_resolution_probe',
    toolId: 'sharp',
    probeKind: 'package_resolution_probe',
    executionMethod: 'node_package_resolution',
    packageName: 'sharp',
    timeoutMs: 1000,
    allowedExitCodes: [0],
    ...baseSafety,
    notes: [
      'Package resolution only.',
      'Do not import Sharp or process images.',
      'Missing package is reported as unavailable.',
    ],
  },
] as const satisfies readonly ControlledLowRiskProbePolicy[]

export function listControlledLowRiskProbePolicies(): ControlledLowRiskProbePolicy[] {
  return [...CONTROLLED_LOW_RISK_PROBE_POLICIES]
}

export function getControlledLowRiskProbePolicy(
  probeId: string,
): ControlledLowRiskProbePolicy | undefined {
  return CONTROLLED_LOW_RISK_PROBE_POLICIES.find((policy) => policy.probeId === probeId)
}
