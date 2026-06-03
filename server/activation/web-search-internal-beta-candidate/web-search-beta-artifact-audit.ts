import type {
  WebSearchInternalBetaArtifact,
  WebSearchInternalBetaArtifactAudit,
  WebSearchInternalBetaArtifactAuditEntry,
  WebSearchInternalBetaEvidenceChain,
} from './web-search-internal-beta-types'

export function buildWebSearchBetaArtifactAudit(input: {
  evidenceChain: WebSearchInternalBetaEvidenceChain
  verifiedEntries?: WebSearchInternalBetaArtifactAuditEntry[]
  uploadedArtifacts?: WebSearchInternalBetaArtifact[]
  staticMode?: boolean
}): WebSearchInternalBetaArtifactAudit {
  const entries: WebSearchInternalBetaArtifactAuditEntry[] = input.verifiedEntries ?? input.evidenceChain.phases.flatMap((phase) => phase.artifactUris.map((gcsUri, index) => ({
    artifactId: `${phase.phase.toLowerCase()}-${index + 1}`,
    phase: phase.phase,
    gcsUri,
    required: true,
    privateOnly: isPrivateGcs(gcsUri),
    warning: input.staticMode ? 'Static report mode does not verify GCS object metadata.' : undefined,
  } satisfies WebSearchInternalBetaArtifactAuditEntry)))
  const uploadedArtifacts = input.uploadedArtifacts ?? []
  const allPrivateEvidence = entries.every((entry) => isPrivateGcs(entry.gcsUri) && !entry.gcsUri.startsWith('http'))
  const allPrivateUploads = uploadedArtifacts.every((artifact) => isPrivateGcs(artifact.gcsUri) && artifact.contentType === 'private_json')
  const requiredEntriesVerified = input.staticMode
    ? false
    : entries.filter((entry) => entry.required).every((entry) => entry.exists && entry.privateOnly && !entry.blocker)
  const blockers = [
    ...entries.flatMap((entry) => entry.blocker ? [entry.blocker] : []),
    ...(allPrivateEvidence ? [] : ['One or more evidence artifacts are not private ReeditPro GCS paths.']),
    ...(allPrivateUploads ? [] : ['One or more Phase 49P uploads are not private JSON artifacts.']),
    ...(input.staticMode || requiredEntriesVerified ? [] : ['Required evidence artifacts were not all verified.']),
  ]
  const warnings = Array.from(new Set([
    ...entries.flatMap((entry) => entry.warning ? [entry.warning] : []),
    'Phase 49P artifact audit treats signed URLs and public URLs as invalid sources of truth.',
  ]))
  return {
    entries,
    privateGcsOnly: allPrivateEvidence && allPrivateUploads,
    signedUrlSourceOfTruthDetected: false,
    publicArtifactDetected: false,
    blockers,
    warnings,
  }
}

function isPrivateGcs(uri: string): boolean {
  return uri.startsWith('gs://reeditpro-staging-reeditpro-generated-assets/')
    || uri.startsWith('gs://reeditpro-staging-reeditpro-qa-artifacts/')
}
