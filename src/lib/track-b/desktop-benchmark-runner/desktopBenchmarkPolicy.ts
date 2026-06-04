import type { DesktopBenchmarkCaps } from './desktopBenchmarkTypes'

export const DESKTOP_BENCHMARK_SCHEMA_VERSION = 'desktop-benchmark-schema-v1'
export const DESKTOP_BENCHMARK_ROUTE_MANIFEST_VERSION = 'track-b-route-manifest-v1'

export const DESKTOP_BENCHMARK_CAPS: DesktopBenchmarkCaps = {
  singleThreadTargetMs: 250,
  singleThreadHardCapMs: 1000,
  parallelHardCapMs: 1500,
  maxParallelWorkers: 2,
  memoryDefaultBytes: 33554432,
  memoryHardCapBytes: 67108864,
  tempFileDefaultBytes: 1048576,
  tempFileHardCapBytes: 4194304,
  runtimeToolTimeoutMs: 2000,
  networkBenchmarkAllowed: false,
  gpuBenchmarkAllowed: false,
  sustainedStressAllowed: false,
}

export const DESKTOP_BENCHMARK_PRIVACY_POLICY = {
  persistentDeviceIdentifier: 'blocked',
  hostname: 'blocked',
  username: 'blocked',
  macAddresses: 'blocked',
  serialNumbers: 'blocked',
  exactCpuGpuIdentifiers: 'blocked',
  environmentVariableDump: 'blocked',
  processList: 'blocked',
  installedAppScan: 'blocked',
  userDirectoryScan: 'blocked',
  arbitraryFilePaths: 'blocked',
  mediaFiles: 'blocked',
  networkBenchmark: 'blocked',
  gpuBenchmark: 'blocked',
  sustainedStressTest: 'blocked',
  localPersistenceByDefault: 'blocked',
  liveBenchmarkUpload: 'blocked_until_future_explicit_phase',
  operatorConfirmationRequiredForLocalRun: true,
  strictTimeMemoryCapsRequired: true,
  coarseBucketsAndRedactedMetricsOnly: true,
} as const
