export type WebCapabilityAvailability = boolean | 'unknown'

export type WebCapabilityCollectionMode =
  | 'fixture_mock'
  | 'live_browser_local_only'
  | 'uploaded_private_future'

export type WebCapabilityPrivacyMode =
  | 'coarse'
  | 'no_persistence'
  | 'no_identifiers'

export type HardwareConcurrencyBucket =
  | '1_2'
  | '3_4'
  | '5_8'
  | '9_16'
  | '17_plus'
  | 'unknown'

export type DeviceMemoryBucket =
  | 'lt_4gb'
  | '4_8gb'
  | '8_16gb'
  | '16_plus'
  | 'unknown'

export type StorageQuotaBucket =
  | 'lt_1gb'
  | '1_5gb'
  | '5_20gb'
  | '20gb_plus'
  | 'unknown'

export type StorageUsageBucket =
  | 'lt_100mb'
  | '100mb_1gb'
  | '1gb_plus'
  | 'unknown'

export type WebGpuAdapterClass =
  | 'available_redacted'
  | 'unavailable'
  | 'blocked_by_policy'
  | 'unknown'

export type CodecSupportProbePolicy =
  | 'disabled_by_default'
  | 'safe_standard_configs_only'
  | 'unavailable'

export type PrivacyRiskLevel = 'low' | 'medium' | 'high'
export type FingerprintingRiskLevel = 'low' | 'medium' | 'high'

export interface RawWebCapabilitySignals {
  secureContext?: WebCapabilityAvailability
  crossOriginIsolated?: WebCapabilityAvailability
  workerAvailable?: WebCapabilityAvailability
  dedicatedWorkerAvailable?: WebCapabilityAvailability
  serviceWorkerAvailable?: WebCapabilityAvailability
  offscreenCanvasAvailable?: WebCapabilityAvailability
  platformCoarse?: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  hardwareConcurrency?: number
  deviceMemoryGb?: number
  wasmAvailable?: WebCapabilityAvailability
  wasmSimdLikely?: WebCapabilityAvailability
  sharedArrayBufferAvailable?: WebCapabilityAvailability
  highResolutionTimerAllowed?: WebCapabilityAvailability
  webglAvailable?: WebCapabilityAvailability
  webgl2Available?: WebCapabilityAvailability
  webgpuAvailable?: WebCapabilityAvailability
  offscreenCanvas2dAvailable?: WebCapabilityAvailability
  offscreenCanvasWebglAvailable?: WebCapabilityAvailability
  webCodecsAvailable?: WebCapabilityAvailability
  videoEncoderAvailable?: WebCapabilityAvailability
  videoDecoderAvailable?: WebCapabilityAvailability
  audioEncoderAvailable?: WebCapabilityAvailability
  audioDecoderAvailable?: WebCapabilityAvailability
  mediaCapabilitiesAvailable?: WebCapabilityAvailability
  storageEstimateAvailable?: WebCapabilityAvailability
  storageQuotaBytes?: number
  storageUsageBytes?: number
  persistentStorageAvailable?: WebCapabilityAvailability
  networkInformationAvailable?: WebCapabilityAvailability
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown'
  saveData?: WebCapabilityAvailability
}

export interface WebCapabilityEnvironmentProfile {
  secureContext: WebCapabilityAvailability
  crossOriginIsolated: WebCapabilityAvailability
  workerAvailable: WebCapabilityAvailability
  dedicatedWorkerAvailable: WebCapabilityAvailability
  serviceWorkerAvailable: WebCapabilityAvailability
  offscreenCanvasAvailable: WebCapabilityAvailability
  platformCoarse: 'desktop' | 'mobile' | 'tablet' | 'unknown'
}

export interface WebCapabilityComputeProfile {
  hardwareConcurrencyBucket: HardwareConcurrencyBucket
  deviceMemoryBucket: DeviceMemoryBucket
  wasmAvailable: WebCapabilityAvailability
  wasmSimdLikely: WebCapabilityAvailability
  sharedArrayBufferAvailable: WebCapabilityAvailability
  wasmThreadsLikely: WebCapabilityAvailability
  highResolutionTimerAllowed: WebCapabilityAvailability
}

export interface WebCapabilityGraphicsProfile {
  webglAvailable: WebCapabilityAvailability
  webgl2Available: WebCapabilityAvailability
  webgpuAvailable: WebCapabilityAvailability
  webgpuSecureContextRequired: boolean
  webgpuAdapterClass: WebGpuAdapterClass
  offscreenCanvas2dAvailable: WebCapabilityAvailability
  offscreenCanvasWebglAvailable: WebCapabilityAvailability
}

export interface WebCapabilityMediaProfile {
  webCodecsAvailable: WebCapabilityAvailability
  videoEncoderAvailable: WebCapabilityAvailability
  videoDecoderAvailable: WebCapabilityAvailability
  audioEncoderAvailable: WebCapabilityAvailability
  audioDecoderAvailable: WebCapabilityAvailability
  mediaCapabilitiesAvailable: WebCapabilityAvailability
  codecSupportProbePolicy: CodecSupportProbePolicy
}

export interface WebCapabilityStorageProfile {
  storageEstimateAvailable: WebCapabilityAvailability
  storageQuotaBucket: StorageQuotaBucket
  storageUsageBucket: StorageUsageBucket
  persistentStorageAvailable: WebCapabilityAvailability
}

export interface WebCapabilityNetworkProfile {
  networkInformationAvailable: WebCapabilityAvailability
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown'
  saveData: WebCapabilityAvailability
  noSpeedTest: true
  noEndpointPing: true
}

export interface WebCapabilityPolicyProfile {
  privacyRiskLevel: PrivacyRiskLevel
  fingerprintingRiskLevel: FingerprintingRiskLevel
  allowedForRoutePlanning: boolean
  allowedForWorkerExecution: false
  allowedForCostEstimator: false
  routeManifestVersion: string
  profileSchemaVersion: string
}

export interface WebCapabilityProfile {
  schemaVersion: string
  generatedAt: string
  collectionMode: WebCapabilityCollectionMode
  privacyMode: WebCapabilityPrivacyMode[]
  capabilityBuckets: {
    environment: WebCapabilityEnvironmentProfile
    compute: WebCapabilityComputeProfile
    graphics: WebCapabilityGraphicsProfile
    media: WebCapabilityMediaProfile
    storage: WebCapabilityStorageProfile
    network: WebCapabilityNetworkProfile
    policy: WebCapabilityPolicyProfile
  }
  routePlanningHints: string[]
  blockedReasons: string[]
  warnings: string[]
  unsupportedApis: string[]
  sourcePolicyRefs: string[]
}

export interface WebCapabilityFixture {
  fixtureId: string
  description: string
  rawSignals: RawWebCapabilitySignals
  expectedHints: string[]
  expectedWarnings: string[]
  expectedBlockedReasons: string[]
}

export interface WebCapabilityFixtureResult {
  fixtureId: string
  status: 'passed' | 'blocked'
  profile: WebCapabilityProfile
  missingExpectedHints: string[]
  missingExpectedWarnings: string[]
  missingExpectedBlockedReasons: string[]
}
