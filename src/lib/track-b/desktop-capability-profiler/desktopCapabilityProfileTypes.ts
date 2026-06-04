export type DesktopCapabilityAvailability = boolean | 'unknown'

export type DesktopCapabilityCollectionMode =
  | 'fixture_mock'
  | 'local_profile_session_only'
  | 'local_profile_skipped_by_policy'
  | 'uploaded_private_future'

export type DesktopCapabilityPrivacyMode =
  | 'coarse'
  | 'redacted'
  | 'no_persistence'
  | 'no_identifiers'

export type DesktopRuntimeKind =
  | 'node_only'
  | 'electron_main'
  | 'electron_renderer'
  | 'tauri_shell'
  | 'unknown'

export type DesktopOsPlatformBucket = 'macos' | 'windows' | 'linux' | 'unknown'
export type DesktopOsArchBucket = 'arm64' | 'x64' | 'other' | 'unknown'
export type DesktopPackagedAppStatus = 'packaged' | 'dev' | 'unknown'
export type DesktopBooleanBucket = boolean | 'unknown'

export type DesktopParallelismBucket = '1_2' | '3_4' | '5_8' | '9_16' | '17_plus' | 'unknown'
export type DesktopTotalMemoryBucket = 'lt_4gb' | '4_8gb' | '8_16gb' | '16_32gb' | '32gb_plus' | 'unknown'
export type DesktopFreeMemoryBucket = 'lt_1gb' | '1_4gb' | '4_8gb' | '8gb_plus' | 'unknown'
export type DesktopCpuModelClass = 'redacted' | 'apple_silicon' | 'intel_x64' | 'amd_x64' | 'unknown' | 'other'

export type DesktopGpuClass = 'unavailable' | 'integrated_or_unknown' | 'discrete_or_unknown' | 'unknown' | 'redacted'
export type DesktopNodeVersionBucket = 'major_only' | 'unknown'
export type DesktopElectronVersionBucket = 'major_only' | 'unknown'
export type DesktopFreeDiskBucket = 'lt_1gb' | '1_10gb' | '10_50gb' | '50gb_plus' | 'unknown'

export type DesktopPrivacyRiskLevel = 'low' | 'medium' | 'high'
export type DesktopFingerprintingRiskLevel = 'low' | 'medium' | 'high'

export interface RawDesktopCapabilitySignals {
  runtimeKind?: DesktopRuntimeKind
  osPlatform?: string
  osArch?: string
  packagedAppStatus?: DesktopPackagedAppStatus
  sandboxedRenderer?: DesktopBooleanBucket
  contextIsolation?: DesktopBooleanBucket
  availableParallelism?: number
  totalMemoryBytes?: number
  freeMemoryBytes?: number
  cpuArchitecture?: DesktopOsArchBucket
  cpuModelClass?: DesktopCpuModelClass
  processCpuUsageAvailable?: DesktopCapabilityAvailability
  gpuInfoAvailable?: DesktopCapabilityAvailability
  gpuClass?: DesktopGpuClass
  webgpuDesktopAvailable?: DesktopCapabilityAvailability
  ffmpegAvailable?: DesktopCapabilityAvailability
  ffprobeAvailable?: DesktopCapabilityAvailability
  sharpAvailable?: DesktopCapabilityAvailability
  pythonAvailable?: DesktopCapabilityAvailability
  nodeVersionMajor?: number
  electronVersionMajor?: number
  tempDirWritable?: DesktopCapabilityAvailability
  estimatedFreeDiskBytes?: number
}

export interface DesktopCapabilityEnvironmentProfile {
  runtimeKind: DesktopRuntimeKind
  osPlatformBucket: DesktopOsPlatformBucket
  osArchBucket: DesktopOsArchBucket
  packagedAppStatus: DesktopPackagedAppStatus
  sandboxedRenderer: DesktopBooleanBucket
  contextIsolation: DesktopBooleanBucket
}

export interface DesktopCapabilityComputeProfile {
  availableParallelismBucket: DesktopParallelismBucket
  totalMemoryBucket: DesktopTotalMemoryBucket
  freeMemoryBucket: DesktopFreeMemoryBucket
  cpuArchitecture: DesktopOsArchBucket
  cpuModelClass: DesktopCpuModelClass
  processCpuUsageAvailable: DesktopCapabilityAvailability
}

export interface DesktopCapabilityGraphicsProfile {
  gpuInfoAvailable: DesktopCapabilityAvailability
  gpuClass: DesktopGpuClass
  webgpuDesktopAvailable: DesktopCapabilityAvailability
  exactGpuIdentityPersisted: false
}

export interface DesktopCapabilityMediaRuntimeProfile {
  ffmpegAvailable: DesktopCapabilityAvailability
  ffprobeAvailable: DesktopCapabilityAvailability
  sharpAvailable: DesktopCapabilityAvailability
  pythonAvailable: DesktopCapabilityAvailability
  nodeVersionBucket: DesktopNodeVersionBucket
  electronVersionBucket: DesktopElectronVersionBucket
  desktopRuntimeVersionRedacted: true
}

export interface DesktopCapabilityStorageProfile {
  tempDirWritable: DesktopCapabilityAvailability
  estimatedFreeDiskBucket: DesktopFreeDiskBucket
  directoryScanning: false
  pathListCollection: false
}

export interface DesktopCapabilityPolicyProfile {
  privacyRiskLevel: DesktopPrivacyRiskLevel
  fingerprintingRiskLevel: DesktopFingerprintingRiskLevel
  allowedForRoutePlanning: boolean
  allowedForWorkerExecution: false
  allowedForCostEstimator: false
  routeManifestVersion: string
  profileSchemaVersion: string
  liveProfileUploadAllowed: false
}

export interface DesktopCapabilityProfile {
  schemaVersion: string
  generatedAt: string
  collectionMode: DesktopCapabilityCollectionMode
  privacyMode: DesktopCapabilityPrivacyMode[]
  capabilityBuckets: {
    environment: DesktopCapabilityEnvironmentProfile
    compute: DesktopCapabilityComputeProfile
    graphics: DesktopCapabilityGraphicsProfile
    mediaRuntime: DesktopCapabilityMediaRuntimeProfile
    storage: DesktopCapabilityStorageProfile
    policy: DesktopCapabilityPolicyProfile
  }
  routePlanningHints: string[]
  blockedReasons: string[]
  warnings: string[]
  sourcePolicyRefs: string[]
}

export interface DesktopCapabilityFixture {
  fixtureId: string
  description: string
  rawSignals: RawDesktopCapabilitySignals
  expectedHints: string[]
  expectedWarnings: string[]
  expectedBlockedReasons: string[]
}

export interface DesktopCapabilityFixtureResult {
  fixtureId: string
  status: 'passed' | 'blocked'
  profile: DesktopCapabilityProfile
  missingExpectedHints: string[]
  missingExpectedWarnings: string[]
  missingExpectedBlockedReasons: string[]
}
