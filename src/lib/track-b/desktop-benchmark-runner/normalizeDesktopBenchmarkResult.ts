import {
  DESKTOP_BENCHMARK_CAPS,
  DESKTOP_BENCHMARK_SCHEMA_VERSION,
} from './desktopBenchmarkPolicy'
import { bucketRuntimeTools } from './desktopBenchmarkBuckets'
import type {
  DesktopBenchmarkCategoryResult,
  DesktopBenchmarkProfile,
  RawDesktopBenchmarkSignals,
} from './desktopBenchmarkTypes'

const SOURCE_POLICY_REFS = [
  'phase_44f_desktop_benchmark_privacy_policy',
  'phase_44f_desktop_benchmark_schema',
  'phase_44e_desktop_capability_profiler',
  'phase_44i_track_b_tool_route_manifest',
]

export function normalizeDesktopBenchmarkResult(
  raw: RawDesktopBenchmarkSignals,
  options: { collectionMode?: DesktopBenchmarkProfile['collectionMode']; generatedAt?: string } = {},
): DesktopBenchmarkProfile {
  const policyBlocked = raw.policyBlocked === true || raw.localBenchmarkConfirmed === false
  const runtimeToolsBucket = bucketRuntimeTools(raw)
  const blockedReasons = buildBlockedReasons({ policyBlocked })
  const warnings = buildWarnings(raw, runtimeToolsBucket)
  const routePlanningHints = buildRouteHints(raw, runtimeToolsBucket, blockedReasons)
  const costEstimatorHints = buildCostHints(raw, blockedReasons)

  return {
    schemaVersion: DESKTOP_BENCHMARK_SCHEMA_VERSION,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    collectionMode: options.collectionMode ?? 'fixture_mock',
    privacyMode: ['coarse', 'redacted', 'no_persistence', 'no_identifiers'],
    benchmarkCaps: DESKTOP_BENCHMARK_CAPS,
    benchmarkResults: {
      baseline: category('passed', raw.benchmarkRunnerOverheadBucket ?? 'unknown', ['metadata_only_startup_context']),
      cpuSingleThread: category(raw.cpuSingleThreadBucket === 'unknown' ? 'warning' : 'passed', raw.cpuSingleThreadBucket ?? 'unknown', ['generated_json_hash_typed_array_fixture']),
      cpuParallelOptional: category(
        raw.workerThreadsAvailable === false || raw.cpuParallelBucket === 'unavailable' ? 'skipped' : 'passed',
        raw.cpuParallelBucket ?? 'unknown',
        raw.workerThreadsAvailable === false ? ['worker_threads_unavailable'] : ['bounded_optional_parallel_fixture'],
      ),
      memory: category(raw.memoryBucket === 'unknown' ? 'warning' : 'passed', raw.memoryBucket ?? 'unknown', ['small_typed_array_allocation_copy']),
      storageTemp: category(raw.storageTempBucket === 'unavailable' ? 'skipped' : 'passed', raw.storageTempBucket ?? 'unknown', ['tiny_temp_file_policy']),
      runtimeTools: category(runtimeToolsBucket === 'unavailable' ? 'warning' : 'passed', runtimeToolsBucket, ['version_availability_metadata_only']),
      policy: category(policyBlocked ? 'blocked' : 'passed', policyBlocked ? 'blocked' : 'ok', ['route_worker_execution_blocked']),
    },
    normalizedBuckets: {
      cpuSingleThread: raw.cpuSingleThreadBucket ?? 'unknown',
      cpuParallelOptional: raw.cpuParallelBucket ?? 'unknown',
      memory: raw.memoryBucket ?? 'unknown',
      storageTemp: raw.storageTempBucket ?? 'unknown',
      runtimeTools: runtimeToolsBucket,
    },
    routePlanningHints,
    costEstimatorHints,
    blockedReasons,
    warnings,
    sourcePolicyRefs: SOURCE_POLICY_REFS,
  }
}

function category(status: DesktopBenchmarkCategoryResult['status'], bucket: string, notes: string[]): DesktopBenchmarkCategoryResult {
  return {
    status,
    bucket,
    durationBucket: bucket === 'fast' || bucket === 'mid' || bucket === 'slow' ? bucket : 'unknown',
    notes,
  }
}

function buildBlockedReasons(input: { policyBlocked: boolean }): string[] {
  if (input.policyBlocked) return ['local_benchmark_blocked_without_confirmation']
  return []
}

function buildWarnings(raw: RawDesktopBenchmarkSignals, runtimeToolsBucket: string): string[] {
  const warnings: string[] = []
  if (raw.cpuSingleThreadBucket === 'slow') warnings.push('slow_single_thread_bucket')
  if (raw.cpuParallelBucket === 'unavailable' || raw.workerThreadsAvailable === false) warnings.push('parallel_workers_limited')
  if (raw.memoryBucket === 'slow') warnings.push('memory_fixture_slow')
  if (raw.storageTempBucket === 'limited' || raw.storageTempBucket === 'unavailable') warnings.push('temp_storage_limited')
  if (runtimeToolsBucket === 'partial' || runtimeToolsBucket === 'unavailable') warnings.push('media_runtime_unavailable')
  return warnings.sort()
}

function buildRouteHints(raw: RawDesktopBenchmarkSignals, runtimeToolsBucket: string, blockedReasons: string[]): string[] {
  const hints = new Set<string>()
  if (blockedReasons.length > 0) hints.add('benchmark_unavailable_fail_closed')
  if (raw.cpuSingleThreadBucket === 'fast' && raw.memoryBucket === 'fast') hints.add('local_light_cpu_tasks_possible_future')
  if (raw.cpuSingleThreadBucket === 'mid') hints.add('local_metadata_tasks_possible')
  if (raw.cpuSingleThreadBucket === 'slow' || raw.memoryBucket === 'slow' || raw.storageTempBucket === 'limited') {
    hints.add('server_worker_preferred')
    hints.add('avoid_local_heavy_tasks')
  }
  if (runtimeToolsBucket === 'partial' || runtimeToolsBucket === 'unavailable') hints.add('local_media_runtime_missing')
  if (raw.cpuParallelBucket === 'unavailable' || raw.workerThreadsAvailable === false) hints.add('single_thread_only')
  if (raw.storageTempBucket === 'ok') hints.add('local_temp_storage_ok')
  if (hints.size === 0) hints.add('server_worker_preferred')
  return [...hints].sort()
}

function buildCostHints(raw: RawDesktopBenchmarkSignals, blockedReasons: string[]): string[] {
  const hints = new Set<string>()
  if (blockedReasons.length > 0) hints.add('benchmark_unavailable_fail_closed')
  if (raw.cpuSingleThreadBucket === 'fast' || raw.cpuSingleThreadBucket === 'mid') hints.add('benchmark_supports_cost_estimator')
  if (raw.memoryBucket === 'slow' || raw.storageTempBucket === 'limited') hints.add('local_cost_penalty_expected')
  if (raw.cpuParallelBucket === 'unavailable' || raw.workerThreadsAvailable === false) hints.add('parallel_workers_limited')
  if (hints.size === 0) hints.add('cost_estimator_input_ready')
  return [...hints].sort()
}
