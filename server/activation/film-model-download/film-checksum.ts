import { createHash } from 'node:crypto'
import { stat, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { FilmChecksumEntry } from './film-model-download-types'

export function buildFilmAggregateChecksum(entries: FilmChecksumEntry[]): string {
  const sorted = [...entries].sort((a, b) => a.relativePath.localeCompare(b.relativePath))
  const content = sorted.map((entry) => `${entry.sha256}  ${entry.relativePath}`).join('\n')
  return createHash('sha256').update(`${content}\n`).digest('hex')
}

export function buildFilmChecksumManifest(entries: FilmChecksumEntry[]): string {
  return [...entries]
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath))
    .map((entry) => `${entry.sha256}  ${entry.relativePath}`)
    .join('\n') + '\n'
}

export async function checksumFilmFiles(localDir: string, relativePaths: readonly string[]): Promise<FilmChecksumEntry[]> {
  const entries: FilmChecksumEntry[] = []
  for (const relativePath of relativePaths) {
    const filePath = join(localDir, relativePath)
    const [content, fileStat] = await Promise.all([readFile(filePath), stat(filePath)])
    entries.push({
      relativePath,
      sha256: createHash('sha256').update(content).digest('hex'),
      sizeBytes: fileStat.size,
    })
  }
  return entries.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
}
