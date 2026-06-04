import type {
  DeviceMemoryBucket,
  HardwareConcurrencyBucket,
  StorageQuotaBucket,
  StorageUsageBucket,
  WebCapabilityAvailability,
  WebGpuAdapterClass,
} from './webCapabilityProfileTypes'

export const WEB_CAPABILITY_PROFILE_SCHEMA_VERSION = 'web-capability-profile-v1'
export const WEB_CAPABILITY_ROUTE_MANIFEST_VERSION = 'track-b-route-manifest-v1'

export function bucketHardwareConcurrency(value: number | undefined): HardwareConcurrencyBucket {
  if (!Number.isFinite(value) || value === undefined || value <= 0) return 'unknown'
  if (value <= 2) return '1_2'
  if (value <= 4) return '3_4'
  if (value <= 8) return '5_8'
  if (value <= 16) return '9_16'
  return '17_plus'
}

export function bucketDeviceMemory(value: number | undefined): DeviceMemoryBucket {
  if (!Number.isFinite(value) || value === undefined || value <= 0) return 'unknown'
  if (value < 4) return 'lt_4gb'
  if (value < 8) return '4_8gb'
  if (value < 16) return '8_16gb'
  return '16_plus'
}

export function bucketStorageQuota(bytes: number | undefined): StorageQuotaBucket {
  if (!Number.isFinite(bytes) || bytes === undefined || bytes < 0) return 'unknown'
  const gib = bytes / 1024 / 1024 / 1024
  if (gib < 1) return 'lt_1gb'
  if (gib < 5) return '1_5gb'
  if (gib < 20) return '5_20gb'
  return '20gb_plus'
}

export function bucketStorageUsage(bytes: number | undefined): StorageUsageBucket {
  if (!Number.isFinite(bytes) || bytes === undefined || bytes < 0) return 'unknown'
  const mib = bytes / 1024 / 1024
  if (mib < 100) return 'lt_100mb'
  if (mib < 1024) return '100mb_1gb'
  return '1gb_plus'
}

export function toAvailability(value: unknown): WebCapabilityAvailability {
  return typeof value === 'boolean' ? value : 'unknown'
}

export function webGpuAdapterClass(webgpuAvailable: WebCapabilityAvailability): WebGpuAdapterClass {
  if (webgpuAvailable === true) return 'available_redacted'
  if (webgpuAvailable === false) return 'unavailable'
  return 'unknown'
}
