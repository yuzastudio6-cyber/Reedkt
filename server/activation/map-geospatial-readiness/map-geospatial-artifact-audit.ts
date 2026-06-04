import type { MapGeospatialArtifactPrivacyAudit, MapGeospatialArtifactVerificationEntry, MapGeospatialEvidenceChain } from './map-geospatial-readiness-types'

export function buildPlannedMapGeospatialArtifactPrivacyAudit(evidenceChain: MapGeospatialEvidenceChain): MapGeospatialArtifactPrivacyAudit {
  const artifactVerification = buildArtifactVerificationEntries(evidenceChain).map((entry) => ({
    ...entry,
    exists: entry.phase === '50A',
    blockers: entry.phase === '50A' ? [] : ['Canonical private GCS artifact has not been metadata-verified in static report mode.'],
    warnings: entry.phase === '50A' ? ['Phase 50A is static docs-only evidence.'] : [],
  }))
  return buildMapGeospatialArtifactPrivacyAudit(artifactVerification)
}

export function buildMapGeospatialArtifactPrivacyAudit(artifactVerification: MapGeospatialArtifactVerificationEntry[]): MapGeospatialArtifactPrivacyAudit {
  const blockers = artifactVerification.flatMap((entry) => entry.blockers.map((blocker) => `${entry.artifactId}: ${blocker}`))
  const warnings = artifactVerification.flatMap((entry) => entry.warnings.map((warning) => `${entry.artifactId}: ${warning}`))
  return {
    auditId: 'phase50g-artifact-privacy-audit',
    privateGcsOnly: blockers.length === 0,
    signedUrlsAsSourceOfTruthAllowed: false,
    publicArtifactsAllowed: false,
    generatedScreenshotsCommitted: false,
    privateReportsCommitted: false,
    canonicalEvidenceUsed: true,
    artifactVerification,
    blockers,
    warnings,
  }
}

export function buildArtifactVerificationEntries(evidenceChain: MapGeospatialEvidenceChain): MapGeospatialArtifactVerificationEntry[] {
  return evidenceChain.phases.flatMap((phase): MapGeospatialArtifactVerificationEntry[] => {
    if (phase.artifactUris.length === 0) {
      return [{
        artifactId: `${phase.phase.toLowerCase()}-static-docs`,
        phase: phase.phase,
        gcsUri: 'static_docs_only',
        required: true,
        exists: true,
        metadataOnly: true,
        publicAccessAllowed: false,
        blockers: [],
        warnings: ['Static documentation evidence has no GCS object to verify.'],
      }]
    }
    return phase.artifactUris.map((gcsUri, index) => ({
      artifactId: `${phase.phase.toLowerCase()}-${index + 1}`,
      phase: phase.phase,
      gcsUri,
      required: true,
      exists: false,
      metadataOnly: true,
      publicAccessAllowed: false,
      blockers: [],
      warnings: [],
    }))
  })
}
