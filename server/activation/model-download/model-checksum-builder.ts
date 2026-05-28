import { createHash } from 'node:crypto'
import type { ApprovedModelDownloadEvidence } from './model-download-types'

export interface ModelChecksumEntry {
  relativePath: string
  sha256: string
  sizeBytes: number
}

export interface ModelTreeManifest {
  repoId: 'Systran/faster-whisper-tiny'
  resolvedRevision: string
  fileCount: number
  totalSizeBytes: number
  aggregateSha256: string
  files: ModelChecksumEntry[]
}

export function buildAggregateChecksum(entries: ModelChecksumEntry[]): string {
  const sorted = [...entries].sort((a, b) => a.relativePath.localeCompare(b.relativePath))
  const content = sorted.map((entry) => `${entry.sha256}  ${entry.relativePath}`).join('\n')
  return createHash('sha256').update(`${content}\n`).digest('hex')
}

export function buildModelTreeManifest(input: {
  repoId: 'Systran/faster-whisper-tiny'
  resolvedRevision: string
  files: ModelChecksumEntry[]
}): ModelTreeManifest {
  return {
    repoId: input.repoId,
    resolvedRevision: input.resolvedRevision,
    fileCount: input.files.length,
    totalSizeBytes: input.files.reduce((sum, file) => sum + file.sizeBytes, 0),
    aggregateSha256: buildAggregateChecksum(input.files),
    files: [...input.files].sort((a, b) => a.relativePath.localeCompare(b.relativePath)),
  }
}

export function evidenceHasChecksum(evidence: ApprovedModelDownloadEvidence): boolean {
  return Boolean(evidence.aggregateSha256 && /^[a-f0-9]{64}$/.test(evidence.aggregateSha256))
}
