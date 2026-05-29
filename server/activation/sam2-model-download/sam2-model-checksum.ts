import { createHash } from 'node:crypto'
import { stat, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Sam2ChecksumEntry } from './sam2-model-download-types'

export function buildSam2AggregateChecksum(entries: Sam2ChecksumEntry[]): string {
  const sorted = [...entries].sort((a, b) => a.relativePath.localeCompare(b.relativePath))
  const content = sorted.map((entry) => `${entry.sha256}  ${entry.relativePath}`).join('\n')
  return createHash('sha256').update(`${content}\n`).digest('hex')
}

export function buildSam2ChecksumManifest(entries: Sam2ChecksumEntry[]): string {
  return [...entries]
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath))
    .map((entry) => `${entry.sha256}  ${entry.relativePath}`)
    .join('\n') + '\n'
}

export async function checksumSam2Files(localDir: string, fileNames: string[]): Promise<Sam2ChecksumEntry[]> {
  const entries: Sam2ChecksumEntry[] = []
  for (const fileName of fileNames) {
    const filePath = join(localDir, fileName)
    const [content, fileStat] = await Promise.all([readFile(filePath), stat(filePath)])
    entries.push({
      relativePath: fileName,
      sha256: createHash('sha256').update(content).digest('hex'),
      sizeBytes: fileStat.size,
    })
  }
  return entries.sort((a, b) => a.relativePath.localeCompare(b.relativePath))
}
