import { createHash } from 'node:crypto'
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import type { DeepFilterNetChecksumEntry } from './audio-ai-download-types'

export function buildDeepFilterNetAggregateChecksum(entries: DeepFilterNetChecksumEntry[]): string {
  const sorted = [...entries].sort((a, b) => a.relativePath.localeCompare(b.relativePath))
  const content = sorted.map((entry) => `${entry.sha256}  ${entry.relativePath}`).join('\n')
  return createHash('sha256').update(`${content}\n`).digest('hex')
}

export function buildDeepFilterNetChecksumManifest(entries: DeepFilterNetChecksumEntry[]): string {
  return [...entries]
    .sort((a, b) => a.relativePath.localeCompare(b.relativePath))
    .map((entry) => `${entry.sha256}  ${entry.relativePath}`)
    .join('\n') + '\n'
}

export async function checksumDeepFilterNetFiles(localDir: string, fileNames: string[]): Promise<DeepFilterNetChecksumEntry[]> {
  const entries: DeepFilterNetChecksumEntry[] = []
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
