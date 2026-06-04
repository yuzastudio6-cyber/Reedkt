import type { DesktopCapabilityProfile } from './desktopCapabilityProfileTypes'

export function buildDesktopCapabilityRouteHandoff(profile: DesktopCapabilityProfile) {
  return {
    status: 'hints_only_route_execution_blocked',
    routePlanningHints: profile.routePlanningHints,
    blockedReasons: profile.blockedReasons,
    routeExecutionAllowed: false,
    workerExecutionAllowed: false,
    profileUploadAllowed: false,
    desktopProfilingCannotOverrideBlockedRoutes: true,
    costEstimatorRequired: 'Phase 44H',
    desktopBenchmarkRunnerRequired: 'Phase 44F',
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
