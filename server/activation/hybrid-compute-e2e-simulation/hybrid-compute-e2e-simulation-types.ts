export interface HybridComputeE2ESimulationReports {
  plan: Record<string, unknown>
  inputManifest: Record<string, unknown>
  simulationSchema: Record<string, unknown>
  planSnapshotFixtureManifest: Record<string, unknown>
  artifactScopeFixtureManifest: Record<string, unknown>
  routeSimulationReport: Record<string, unknown>
  costSimulationReport: Record<string, unknown>
  sidecarSimulationReport: Record<string, unknown>
  failureSimulationReport: Record<string, unknown>
  scorecard: Record<string, unknown>
  readinessDecision: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
