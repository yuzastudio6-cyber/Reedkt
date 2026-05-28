import { existsSync, readFileSync } from 'node:fs'
import type { ArtifactImageDigestEvidence } from './artifact-push-types'

export interface ArtifactImageDigestSummary {
  reportId: string
  createdAt: string
  digestEvidence: ArtifactImageDigestEvidence[]
  requiredDigestsVerified: boolean
  blockers: string[]
  warnings: string[]
}

const requiredImageIds = new Set(['api', 'tool-readiness-worker', 'cpu-worker', 'qa-worker', 'render-worker'])

export function readArtifactDigestEvidenceFile(path: string): ArtifactImageDigestEvidence[] {
  if (!existsSync(path)) return []
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as { digestEvidence?: ArtifactImageDigestEvidence[] } | ArtifactImageDigestEvidence[]
  return Array.isArray(parsed) ? parsed : parsed.digestEvidence ?? []
}

export function buildArtifactImageDigestSummary(digestEvidence: ArtifactImageDigestEvidence[]): ArtifactImageDigestSummary {
  const blockers: string[] = []
  const warnings: string[] = ['GPU image digest is deferred until the GPU phase.']

  for (const imageId of requiredImageIds) {
    const evidence = digestEvidence.find((entry) => entry.imageId === imageId)
    if (!evidence?.digest || !evidence.verified) blockers.push(`${imageId} is missing verified Artifact Registry digest evidence.`)
  }

  return {
    reportId: 'activation-phase-23b-image-digest-summary',
    createdAt: new Date().toISOString(),
    digestEvidence,
    requiredDigestsVerified: blockers.length === 0,
    blockers,
    warnings,
  }
}

export function summarizeArtifactImageDigestSummary(summary: ArtifactImageDigestSummary): string {
  return [
    `Image digest summary: ${summary.reportId}`,
    `Digest evidence entries: ${summary.digestEvidence.length}`,
    `Required non-GPU digests verified: ${summary.requiredDigestsVerified}`,
    '',
    'Digests:',
    ...(summary.digestEvidence.length > 0
      ? summary.digestEvidence.map((entry) => `- ${entry.imageId}: ${entry.digest ?? '(missing)'} (${entry.verified ? 'verified' : 'not verified'}) ${entry.targetFullImageName}`)
      : ['- none']),
    '',
    'Blockers:',
    ...(summary.blockers.length > 0 ? summary.blockers.map((blocker) => `- ${blocker}`) : ['- none']),
    '',
    'Warnings:',
    ...summary.warnings.map((warning) => `- ${warning}`),
  ].join('\n')
}
