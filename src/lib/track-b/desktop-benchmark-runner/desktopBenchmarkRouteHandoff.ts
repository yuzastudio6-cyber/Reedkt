import type { DesktopBenchmarkProfile } from './desktopBenchmarkTypes'

export function buildDesktopBenchmarkRouteHandoff(profile: DesktopBenchmarkProfile) {
  return {
    status: 'hints_only_route_execution_blocked',
    routePlanningHints: profile.routePlanningHints,
    blockedReasons: profile.blockedReasons,
    routeExecutionAllowed: false,
    workerExecutionAllowed: false,
    liveBenchmarkUploadAllowed: false,
    benchmarksCannotOverrideBlockedRoutes: true,
    costEstimatorRequired: 'Phase 44H',
    localWorkerSidecarRequired: 'Phase 44G',
    hybridE2eSimulationRequired: 'Phase 44J',
    approvedPlanSnapshotRequired: true,
    artifactScopeRequired: true,
    demucs: 'blocked',
    vlm: 'excluded',
    broadMedia: 'blocked',
    publicArtifacts: 'blocked',
    providerCalls: 'blocked',
  }
}

export function buildDesktopBenchmarkCostHandoff(profile: DesktopBenchmarkProfile) {
  return {
    status: 'cost_hints_only_cost_estimator_pending',
    costEstimatorHints: profile.costEstimatorHints,
    normalizedBuckets: profile.normalizedBuckets,
    costEstimatorRequired: 'Phase 44H',
    routeExecutionAllowed: false,
    workerExecutionAllowed: false,
    liveBenchmarkUploadAllowed: false,
    costEstimatorInputReady: profile.blockedReasons.length === 0,
  }
}
