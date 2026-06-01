import { buildTrackAVisualReadinessClosureReport } from '../track-a-visual-readiness-closure'
import type { TrackIntegrationTrackSummary } from './track-integration-audit-types'

export function buildTrackIntegrationTrackASummary(): TrackIntegrationTrackSummary {
  const report = buildTrackAVisualReadinessClosureReport()
  const blockers = [
    ...report.blockers,
    ...report.evidenceChain.flatMap((item) => item.internalReadinessBlockers),
  ]
  const ready = report.status === 'ready'
    && report.trackAInternalReadiness.readyForInternalPrivateVisualVideoTesting
    && blockers.length === 0

  const evidence = [
    {
      track: 'A' as const,
      phase: '45F',
      label: 'Track A visual-video readiness closure',
      status: ready ? 'ready' as const : 'blocked' as const,
      runId: report.approvedEvidence.runId,
      reportScript: 'activation:track-a-visual-readiness-closure:report',
      artifactUris: [
        report.approvedEvidence.readinessManifestUri,
        report.approvedEvidence.evidenceChainUri,
        report.approvedEvidence.privateE2EArtifactValidationUri,
        report.approvedEvidence.qaReportUri,
      ].filter((uri): uri is string => Boolean(uri)),
      blockers,
      warnings: report.warnings,
      summary: ready
        ? 'Phase 45F verifies the Track A evidence chain and readiness manifest for internal private visual-video testing only.'
        : 'Track A Phase 45F evidence is missing, blocked, or internally inconsistent.',
    },
  ]

  return {
    track: 'A',
    status: ready ? 'ready' : 'blocked',
    readyEvidenceCount: ready ? 1 : 0,
    blockedEvidenceCount: ready ? 0 : 1,
    evidence,
    blockers,
    warnings: report.warnings,
    summary: ready
      ? 'Track A is ready for internal private visual-video testing using Phase 45F approved evidence.'
      : `Track A is blocked: ${blockers.join('; ') || 'Phase 45F readiness is not ready.'}`,
  }
}
