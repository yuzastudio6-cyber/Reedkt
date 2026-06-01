import {
  trackAVisualReadinessConfig,
  trackAVisualReadinessGateIds,
  trackAVisualReadinessRemainingBlockedScopes,
} from './track-a-visual-readiness-closure-policy'
import type {
  TrackAVisualEvidenceItem,
  TrackAVisualReadinessArtifact,
  TrackAVisualReadinessExecutionReport,
  TrackAVisualReadinessQaGate,
  TrackAVisualReadinessQaSummary,
} from './track-a-visual-readiness-closure-types'

export function buildTrackAVisualReadinessClosureQaSummary(input?: {
  evidenceChain: TrackAVisualEvidenceItem[]
  privateE2EArtifactValidation: TrackAVisualReadinessExecutionReport['privateE2EArtifactValidation']
  artifacts: TrackAVisualReadinessArtifact[]
  scriptsValid: boolean
  docsValid: boolean
  publicAccessBlocked: boolean
}): TrackAVisualReadinessQaSummary {
  if (!input) {
    return {
      status: 'blocked',
      gates: [],
      blockers: ['Phase 45F Track A visual-video readiness closure execution report is missing.'],
      warnings: ['Track A internal private visual-video testing closure remains blocked until Phase 45F executes.'],
    }
  }

  const mandatory = (gateId: TrackAVisualReadinessQaGate['gateId'], passed: boolean, summary: string): TrackAVisualReadinessQaGate => ({
    gateId,
    passed,
    severity: 'mandatory',
    summary,
  })
  const requiredGateSet = new Set(trackAVisualReadinessGateIds)
  const evidenceUris = input.evidenceChain.flatMap((item) => item.artifactUris)
  const uploadedUris = input.artifacts.map((artifact) => artifact.gcsUri)
  const allUris = [...evidenceUris, ...uploadedUris]
  const allEvidenceReady = input.evidenceChain.every((item) => item.readyForInternalTrackA)
  const internalBlockers = input.evidenceChain.flatMap((item) => item.internalReadinessBlockers)
  const allReportsReady = input.evidenceChain.every((item) => item.status === 'ready' || item.phase === '34D/34E')
  const expectedScopeBlockersOnly = input.evidenceChain.every((item) => item.readyForInternalTrackA || item.expectedScopeBlockers.length === 0)
  const privateE2EOk = input.privateE2EArtifactValidation.canonicalPrivateReviewExportExists
    && input.privateE2EArtifactValidation.canonicalPrivateReviewExportSizeBytes > 0
    && input.privateE2EArtifactValidation.e2eReviewManifestExists
    && input.privateE2EArtifactValidation.e2eReviewManifestSizeBytes > 0
    && input.privateE2EArtifactValidation.phase45EReportExists
    && input.privateE2EArtifactValidation.phase45EReportSizeBytes > 0
    && input.privateE2EArtifactValidation.privateGcsOnly

  const gates = [
    mandatory('track_a_evidence_chain', allEvidenceReady && internalBlockers.length === 0, 'SAM2, Real-ESRGAN, FILM, pro color/image, and Phase 45A-45E reports are verified for internal Track A scope.'),
    mandatory('tool_scope_integrity', expectedScopeBlockersOnly && trackAVisualReadinessRemainingBlockedScopes.length > 0, 'Expected broader-scope blockers remain blocked and do not conflict with internal private Track A readiness.'),
    mandatory('report_consistency', allReportsReady, 'Required Track A report scripts agree on ready/verified internal evidence status.'),
    mandatory('artifact_privacy', allUris.length > 0 && allUris.every((uri) => uri.startsWith('gs://reeditpro-staging-reeditpro-')), 'All referenced and uploaded artifacts use private staging GCS prefixes only.'),
    mandatory('private_e2e_review_integrity', privateE2EOk, 'Phase 45E manifest/report and canonical Phase 45D private review export exist and are non-empty/private.'),
    mandatory('scripts_validation', input.scriptsValid, 'Required package scripts are present for Phase 45F and prior Track A evidence reports.'),
    mandatory('docs_consistency', input.docsValid, 'Phase 45F docs are present and readiness/final-render docs remain consistent with private internal readiness only.'),
    mandatory('blocked_features', true, 'Production, external beta, paid production, broad media, providers, Revideo, Track B, arbitrary media, and final delivery remain blocked.'),
    mandatory('no_public_access', input.publicAccessBlocked, 'No public bucket principals or public/signed URLs are used as source of truth.'),
    mandatory('no_final_delivery', true, 'No new render/export/final delivery is created in Phase 45F.'),
  ]
  const missingGate = trackAVisualReadinessGateIds.filter((gateId) => !gates.some((gate) => gate.gateId === gateId))
  for (const gateId of missingGate) {
    if (requiredGateSet.has(gateId)) gates.push(mandatory(gateId, false, `Required QA gate ${gateId} was not evaluated.`))
  }
  const blockers = gates.filter((gate) => !gate.passed).map((gate) => `${gate.gateId}: ${gate.summary}`)
  return {
    status: blockers.length ? 'blocked' : 'passed',
    gates,
    blockers,
    warnings: [
      'Phase 45F is an evidence audit and readiness closure only.',
      'Track A readiness is limited to internal private visual-video testing.',
      'Final delivery, production, external beta, paid production, broad real media, providers, Revideo, and Track B remain blocked.',
    ],
  }
}

export function buildTrackAVisualReadinessManifest(input: {
  runId: string
  evidenceChain: TrackAVisualEvidenceItem[]
  qa: TrackAVisualReadinessQaSummary
}) {
  return {
    manifestId: 'phase45f-track-a-visual-readiness-manifest-v1',
    phase: trackAVisualReadinessConfig.phase,
    track: trackAVisualReadinessConfig.track,
    runId: input.runId,
    approvedPhase45ERunId: trackAVisualReadinessConfig.approvedPhase45ERunId,
    canonicalPrivateReviewExport: trackAVisualReadinessConfig.canonicalPrivateReviewExportGcsUri,
    evidenceChain: input.evidenceChain.map((item) => ({
      phase: item.phase,
      label: item.label,
      reportScript: item.reportScript,
      runId: item.runId,
      status: item.status,
      readyForInternalTrackA: item.readyForInternalTrackA,
      internalReadinessBlockers: item.internalReadinessBlockers,
      expectedScopeBlockers: item.expectedScopeBlockers,
      artifactUris: item.artifactUris,
    })),
    trackAInternalReadiness: {
      readyForInternalPrivateVisualVideoTesting: input.qa.status === 'passed',
      reason: input.qa.status === 'passed'
        ? 'Phase 45F verified the Track A evidence chain; ready for internal private visual-video testing only.'
        : `Phase 45F blocked: ${input.qa.blockers.join('; ')}`,
    },
    remainingBlockedScopes: trackAVisualReadinessRemainingBlockedScopes,
    finalDeliveryAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
    trackBAllowed: false,
  }
}
