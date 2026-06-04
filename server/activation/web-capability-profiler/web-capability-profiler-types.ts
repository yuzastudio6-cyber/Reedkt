export interface WebCapabilityProfilerReports {
  plan: Record<string, unknown>
  sourceEvidence: Record<string, unknown>
  profileSchema: Record<string, unknown>
  privacyPolicy: Record<string, unknown>
  bucketPolicy: Record<string, unknown>
  fixtureManifest: Record<string, unknown>
  fixtureResults: Record<string, unknown>
  validationReport: Record<string, unknown>
  routeHandoff: Record<string, unknown>
  blockerReport: Record<string, unknown>
  readinessReport: Record<string, unknown>
  privateArtifactManifest: Record<string, unknown>
  iamPlan: Record<string, unknown>
  costSummary: Record<string, unknown>
  webResearchMarkdown: string
}
