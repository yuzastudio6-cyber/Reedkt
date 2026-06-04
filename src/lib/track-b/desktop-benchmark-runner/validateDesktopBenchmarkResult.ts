import { normalizeDesktopBenchmarkResult } from './normalizeDesktopBenchmarkResult'
import { DESKTOP_BENCHMARK_CAPS, DESKTOP_BENCHMARK_SCHEMA_VERSION } from './desktopBenchmarkPolicy'
import type { DesktopBenchmarkFixture, DesktopBenchmarkFixtureResult, DesktopBenchmarkProfile } from './desktopBenchmarkTypes'

export function validateDesktopBenchmarkResult(profile: DesktopBenchmarkProfile): string[] {
  const blockers: string[] = []
  if (profile.schemaVersion !== DESKTOP_BENCHMARK_SCHEMA_VERSION) blockers.push('schema_version_mismatch')
  if (profile.benchmarkCaps.singleThreadHardCapMs > 1000) blockers.push('single_thread_hard_cap_too_high')
  if (profile.benchmarkCaps.parallelHardCapMs > 1500) blockers.push('parallel_hard_cap_too_high')
  if (profile.benchmarkCaps.maxParallelWorkers > 2) blockers.push('parallel_worker_cap_too_high')
  if (profile.benchmarkCaps.memoryHardCapBytes > DESKTOP_BENCHMARK_CAPS.memoryHardCapBytes) blockers.push('memory_cap_too_high')
  if (profile.benchmarkCaps.tempFileHardCapBytes > DESKTOP_BENCHMARK_CAPS.tempFileHardCapBytes) blockers.push('temp_file_cap_too_high')
  if (profile.benchmarkCaps.networkBenchmarkAllowed !== false) blockers.push('network_benchmark_allowed')
  if (profile.benchmarkCaps.gpuBenchmarkAllowed !== false) blockers.push('gpu_benchmark_allowed')
  if (profile.benchmarkCaps.sustainedStressAllowed !== false) blockers.push('sustained_stress_allowed')
  if (!profile.privacyMode.includes('no_identifiers')) blockers.push('identifier_policy_missing')
  if (!profile.privacyMode.includes('no_persistence')) blockers.push('persistence_policy_missing')
  if (!profile.privacyMode.includes('redacted')) blockers.push('redaction_policy_missing')
  return blockers
}

export function runDesktopBenchmarkFixture(fixture: DesktopBenchmarkFixture): DesktopBenchmarkFixtureResult {
  const profile = normalizeDesktopBenchmarkResult(fixture.rawSignals, {
    collectionMode: 'fixture_mock',
    generatedAt: '2026-06-04T00:00:00.000Z',
  })
  const missingExpectedRouteHints = fixture.expectedRouteHints.filter((hint) => !profile.routePlanningHints.includes(hint))
  const missingExpectedCostHints = fixture.expectedCostHints.filter((hint) => !profile.costEstimatorHints.includes(hint))
  const missingExpectedBlockedReasons = fixture.expectedBlockedReasons.filter((reason) => !profile.blockedReasons.includes(reason))
  const profileBlockers = validateDesktopBenchmarkResult(profile)
  const blockers = [...missingExpectedRouteHints, ...missingExpectedCostHints, ...missingExpectedBlockedReasons, ...profileBlockers]
  return {
    fixtureId: fixture.fixtureId,
    status: blockers.length === 0 ? 'passed' : 'blocked',
    profile,
    missingExpectedRouteHints,
    missingExpectedCostHints,
    missingExpectedBlockedReasons,
  }
}

export function runDesktopBenchmarkFixtures(fixtures: DesktopBenchmarkFixture[]): DesktopBenchmarkFixtureResult[] {
  return fixtures.map((fixture) => runDesktopBenchmarkFixture(fixture))
}
