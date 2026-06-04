import type {
  DesktopCpuModelClass,
  DesktopFreeDiskBucket,
  DesktopFreeMemoryBucket,
  DesktopOsArchBucket,
  DesktopOsPlatformBucket,
  DesktopParallelismBucket,
  DesktopTotalMemoryBucket,
} from './desktopCapabilityProfileTypes'

export const DESKTOP_CAPABILITY_PROFILE_SCHEMA_VERSION = 'desktop-capability-profile-v1'
export const DESKTOP_CAPABILITY_ROUTE_MANIFEST_VERSION = 'track-b-route-manifest-v1'

const GIB = 1024 * 1024 * 1024

export function bucketDesktopPlatform(value: string | undefined): DesktopOsPlatformBucket {
  if (value === 'darwin') return 'macos'
  if (value === 'win32') return 'windows'
  if (value === 'linux') return 'linux'
  return 'unknown'
}

export function bucketDesktopArch(value: string | undefined): DesktopOsArchBucket {
  if (value === 'arm64') return 'arm64'
  if (value === 'x64' || value === 'amd64') return 'x64'
  if (!value) return 'unknown'
  return 'other'
}

export function bucketDesktopParallelism(value: number | undefined): DesktopParallelismBucket {
  if (!Number.isFinite(value) || !value) return 'unknown'
  if (value <= 2) return '1_2'
  if (value <= 4) return '3_4'
  if (value <= 8) return '5_8'
  if (value <= 16) return '9_16'
  return '17_plus'
}

export function bucketDesktopTotalMemory(value: number | undefined): DesktopTotalMemoryBucket {
  if (!Number.isFinite(value) || !value) return 'unknown'
  if (value < 4 * GIB) return 'lt_4gb'
  if (value < 8 * GIB) return '4_8gb'
  if (value < 16 * GIB) return '8_16gb'
  if (value < 32 * GIB) return '16_32gb'
  return '32gb_plus'
}

export function bucketDesktopFreeMemory(value: number | undefined): DesktopFreeMemoryBucket {
  if (!Number.isFinite(value) || !value) return 'unknown'
  if (value < GIB) return 'lt_1gb'
  if (value < 4 * GIB) return '1_4gb'
  if (value < 8 * GIB) return '4_8gb'
  return '8gb_plus'
}

export function bucketDesktopFreeDisk(value: number | undefined): DesktopFreeDiskBucket {
  if (!Number.isFinite(value) || !value) return 'unknown'
  if (value < GIB) return 'lt_1gb'
  if (value < 10 * GIB) return '1_10gb'
  if (value < 50 * GIB) return '10_50gb'
  return '50gb_plus'
}

export function inferCpuModelClass(input: {
  platformBucket: DesktopOsPlatformBucket
  archBucket: DesktopOsArchBucket
  explicit?: DesktopCpuModelClass
}): DesktopCpuModelClass {
  if (input.explicit) return input.explicit
  if (input.platformBucket === 'macos' && input.archBucket === 'arm64') return 'apple_silicon'
  if (input.archBucket === 'x64') return 'redacted'
  if (input.archBucket === 'unknown') return 'unknown'
  return 'other'
}

export function nodeVersionBucket(value: number | undefined): 'major_only' | 'unknown' {
  return Number.isFinite(value) && value ? 'major_only' : 'unknown'
}
