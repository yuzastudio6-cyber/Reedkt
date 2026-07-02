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

const execProbeMaxBufferBytes = 262144

export const CONTROLLED_LOW_RISK_PROBE_POLICIES = [
  {
    probeId: 'ffmpeg_version_probe',
    toolId: 'ffmpeg',
    probeKind: 'version_probe',
    executionMethod: 'exec_file_no_shell',
    executableName: 'ffmpeg',
    exactArgs: ['-version'],
    maxBufferBytes: execProbeMaxBufferBytes,
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
    maxBufferBytes: execProbeMaxBufferBytes,
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
    probeId: 'mediainfo_version_probe',
    toolId: 'mediainfo',
    probeKind: 'version_probe',
    executionMethod: 'exec_file_no_shell',
    executableName: 'mediainfo',
    exactArgs: ['--Version'],
    maxBufferBytes: execProbeMaxBufferBytes,
    timeoutMs: 3000,
    allowedExitCodes: [0],
    ...baseSafety,
    notes: [
      'Track B readiness version probe only.',
      'Do not inspect media files or fixtures.',
      'Missing executable is reported as unavailable.',
    ],
  },
  {
    probeId: 'exiftool_version_probe',
    toolId: 'exiftool',
    probeKind: 'version_probe',
    executionMethod: 'exec_file_no_shell',
    executableName: 'exiftool',
    exactArgs: ['-ver'],
    maxBufferBytes: execProbeMaxBufferBytes,
    timeoutMs: 3000,
    allowedExitCodes: [0],
    ...baseSafety,
    notes: [
      'Track B readiness version probe only.',
      'Do not inspect image, video, or metadata files.',
      'Missing executable is reported as unavailable.',
    ],
  },
  {
    probeId: 'tesseract_version_probe',
    toolId: 'tesseract',
    probeKind: 'version_probe',
    executionMethod: 'exec_file_no_shell',
    executableName: 'tesseract',
    exactArgs: ['--version'],
    maxBufferBytes: execProbeMaxBufferBytes,
    timeoutMs: 3000,
    allowedExitCodes: [0],
    ...baseSafety,
    notes: [
      'Track B readiness version probe only.',
      'Do not run OCR or read image files.',
      'Missing executable is reported as unavailable.',
    ],
  },
  {
    probeId: 'imagemagick_magick_version_probe',
    toolId: 'imagemagick',
    probeKind: 'version_probe',
    executionMethod: 'exec_file_no_shell',
    executableName: 'magick',
    exactArgs: ['-version'],
    maxBufferBytes: execProbeMaxBufferBytes,
    timeoutMs: 3000,
    allowedExitCodes: [0],
    ...baseSafety,
    notes: [
      'Track B readiness version probe for the primary ImageMagick binary.',
      'Do not transform images or inspect files.',
      'Missing executable is reported as unavailable.',
    ],
  },
  {
    probeId: 'imagemagick_convert_version_probe',
    toolId: 'imagemagick',
    probeKind: 'version_probe',
    executionMethod: 'exec_file_no_shell',
    executableName: 'convert',
    exactArgs: ['-version'],
    maxBufferBytes: execProbeMaxBufferBytes,
    timeoutMs: 3000,
    allowedExitCodes: [0],
    ...baseSafety,
    notes: [
      'Track B readiness version probe for legacy ImageMagick convert binary.',
      'This is not GraphicsMagick evidence.',
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
