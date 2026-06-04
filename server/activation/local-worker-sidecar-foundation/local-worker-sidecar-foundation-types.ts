export interface LocalWorkerSidecarFoundationReports {
  plan: Record<string, unknown>
  sourceEvidence: Record<string, unknown>
  protocolSchema: Record<string, unknown>
  planSnapshotPolicy: Record<string, unknown>
  artifactScopePolicy: Record<string, unknown>
  securityPolicy: Record<string, unknown>
  lifecyclePolicy: Record<string, unknown>
  fixtureManifest: Record<string, unknown>
  fixtureResults: Record<string, unknown>
  validationReport: Record<string, unknown>
  noopHandshakeReport: Record<string, unknown>
  routeHandoff: Record<string, unknown>
  costHandoff: Record<string, unknown>
  capabilityHandoff: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
}
