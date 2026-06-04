export const WEB_CAPABILITY_PRIVACY_POLICY = {
  privacyMode: ['coarse', 'no_persistence', 'no_identifiers'],
  persistentDeviceIdentifier: 'blocked',
  rawFullUserAgent: 'blocked',
  exactScreenResolution: 'blocked',
  detailedGpuAdapterVendorDevice: 'blocked',
  ipAddressCapture: 'blocked',
  networkSpeedTest: 'blocked',
  endpointPing: 'blocked',
  mediaFileProbing: 'blocked',
  clipboardAccess: 'blocked',
  filesystemAccess: 'blocked',
  localStoragePersistenceByDefault: 'blocked',
  sessionStoragePersistenceByDefault: 'blocked',
  crossSiteTracking: 'blocked',
  liveProfileUpload: 'blocked_until_future_explicit_phase_with_consent',
  browserModuleReturnShape: 'local_object_only',
} as const

export const WEB_CAPABILITY_BUCKET_POLICY = {
  hardwareConcurrency: ['1_2', '3_4', '5_8', '9_16', '17_plus', 'unknown'],
  deviceMemory: ['lt_4gb', '4_8gb', '8_16gb', '16_plus', 'unknown'],
  storageQuota: ['lt_1gb', '1_5gb', '5_20gb', '20gb_plus', 'unknown'],
  storageUsage: ['lt_100mb', '100mb_1gb', '1gb_plus', 'unknown'],
  gpuAdapter: ['available_redacted', 'unavailable', 'blocked_by_policy', 'unknown'],
  networkEffectiveType: ['slow-2g', '2g', '3g', '4g', 'unknown'],
  screenResolution: 'not_collected',
  userAgent: 'not_collected',
} as const
