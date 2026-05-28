import type { StagingFixtureArtifact, StagingFixtureQASummary } from './staging-fixture-e2e-types'

export function buildStagingFixtureQASummary(artifacts: StagingFixtureArtifact[]): StagingFixtureQASummary {
  const required = artifacts.filter((artifact) => ['media_analysis', 'timeline_manifest', 'preview', 'final_export', 'qa_summary'].includes(artifact.kind))
  const missing = required.filter((artifact) => !artifact.exists)
  return {
    status: missing.length === 0 ? 'passed' : 'blocked',
    finalDeliveryAllowed: missing.length === 0,
    blockingGateFailures: missing.map((artifact) => `Missing ${artifact.kind}: gs://${artifact.bucket}/${artifact.object}`),
    warnings: ['Generated-fixture QA does not unblock real user media, external beta, or production readiness.'],
  }
}
