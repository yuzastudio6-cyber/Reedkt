import type { WebSearchArtifactVerificationEntry, WebSearchEvidenceChain } from './web-search-capture-readiness-types'

export function buildPlannedWebSearchArtifactVerification(evidenceChain: WebSearchEvidenceChain): WebSearchArtifactVerificationEntry[] {
  return evidenceChain.phases.flatMap((phase) => phase.artifactUris.map((gcsUri, index) => ({
    artifactId: `${phase.phase.toLowerCase()}-artifact-${index + 1}`,
    phase: phase.phase,
    gcsUri,
    required: true,
  })))
}

export function summarizeArtifactPrivacy(entries: WebSearchArtifactVerificationEntry[]): { passed: boolean; blockers: string[]; warnings: string[] } {
  const blockers = entries.flatMap((entry) => {
    const current: string[] = []
    if (!entry.gcsUri.startsWith('gs://reeditpro-staging-reeditpro-')) current.push(`${entry.artifactId} is outside the private ReeditPro staging bucket namespace.`)
    if (entry.gcsUri.includes('signed') || entry.gcsUri.startsWith('https://')) current.push(`${entry.artifactId} uses a public/signed URL style path.`)
    if (entry.exists === false) current.push(entry.blocker ?? `${entry.artifactId} was not found.`)
    return current
  })
  const warnings = entries.flatMap((entry) => entry.warning ? [entry.warning] : [])
  return { passed: blockers.length === 0, blockers, warnings }
}
