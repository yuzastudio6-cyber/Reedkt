export type DesktopBenchmarkCollectionMode =
  | 'fixture_mock'
  | 'local_bounded'
  | 'local_skipped_by_policy'
  | 'uploaded_private_future'

export type DesktopBenchmarkPrivacyMode = 'coarse' | 'redacted' | 'no_persistence' | 'no_identifiers'

export type DesktopBenchmarkStatus = 'passed' | 'warning' | 'skipped' | 'blocked'
export type DesktopBenchmarkPerformanceBucket = 'fast' | 'mid' | 'slow' | 'unknown'
export type DesktopBenchmarkStorageBucket = 'ok' | 'limited' | 'unavailable' | 'unknown'
export type DesktopBenchmarkToolAvailability = boolean | 'unknown'
export type DesktopBenchmarkRiskLevel = 'low' | 'medium' | 'high'

export interface DesktopBenchmarkCaps {
  singleThreadTargetMs: 250
  singleThreadHardCapMs: 1000
  parallelHardCapMs: 1500
  maxParallelWorkers: 2
  memoryDefaultBytes: 33554432
  memoryHardCapBytes: 67108864
  tempFileDefaultBytes: 1048576
  tempFileHardCapBytes: 4194304
  runtimeToolTimeoutMs: 2000
  networkBenchmarkAllowed: false
  gpuBenchmarkAllowed: false
  sustainedStressAllowed: false
}

export interface RawDesktopBenchmarkSignals {
  localBenchmarkConfirmed?: boolean
  benchmarkRunnerOverheadBucket?: DesktopBenchmarkPerformanceBucket
  cpuSingleThreadBucket?: DesktopBenchmarkPerformanceBucket
  cpuParallelBucket?: DesktopBenchmarkPerformanceBucket | 'unavailable'
  workerThreadsAvailable?: boolean | 'unknown'
  memoryBucket?: DesktopBenchmarkPerformanceBucket
  storageTempBucket?: DesktopBenchmarkStorageBucket
  ffmpegAvailable?: DesktopBenchmarkToolAvailability
  ffprobeAvailable?: DesktopBenchmarkToolAvailability
  pythonAvailable?: DesktopBenchmarkToolAvailability
  nodeAvailable?: DesktopBenchmarkToolAvailability
  policyBlocked?: boolean
}

export interface DesktopBenchmarkCategoryResult {
  status: DesktopBenchmarkStatus
  bucket: string
  durationBucket: DesktopBenchmarkPerformanceBucket
  notes: string[]
}

export interface DesktopBenchmarkProfile {
  schemaVersion: string
  generatedAt: string
  collectionMode: DesktopBenchmarkCollectionMode
  privacyMode: DesktopBenchmarkPrivacyMode[]
  benchmarkCaps: DesktopBenchmarkCaps
  benchmarkResults: {
    baseline: DesktopBenchmarkCategoryResult
    cpuSingleThread: DesktopBenchmarkCategoryResult
    cpuParallelOptional: DesktopBenchmarkCategoryResult
    memory: DesktopBenchmarkCategoryResult
    storageTemp: DesktopBenchmarkCategoryResult
    runtimeTools: DesktopBenchmarkCategoryResult
    policy: DesktopBenchmarkCategoryResult
  }
  normalizedBuckets: {
    cpuSingleThread: DesktopBenchmarkPerformanceBucket
    cpuParallelOptional: DesktopBenchmarkPerformanceBucket | 'unavailable'
    memory: DesktopBenchmarkPerformanceBucket
    storageTemp: DesktopBenchmarkStorageBucket
    runtimeTools: 'available' | 'partial' | 'unavailable' | 'unknown'
  }
  routePlanningHints: string[]
  costEstimatorHints: string[]
  blockedReasons: string[]
  warnings: string[]
  sourcePolicyRefs: string[]
}

export interface DesktopBenchmarkFixture {
  fixtureId: string
  description: string
  rawSignals: RawDesktopBenchmarkSignals
  expectedRouteHints: string[]
  expectedCostHints: string[]
  expectedBlockedReasons: string[]
}

export interface DesktopBenchmarkFixtureResult {
  fixtureId: string
  status: 'passed' | 'blocked'
  profile: DesktopBenchmarkProfile
  missingExpectedRouteHints: string[]
  missingExpectedCostHints: string[]
  missingExpectedBlockedReasons: string[]
}
