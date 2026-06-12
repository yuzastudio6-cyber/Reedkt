import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { CrossWorkstreamArtifact } from './cross-workstream-handoff-types'

export async function writeCrossWorkstreamLocalArtifact(input: {
  localRoot: string
  bucket: string
  object: string
  value: unknown
  id: string
}): Promise<{ localPath: string; artifact: CrossWorkstreamArtifact }> {
  const content = typeof input.value === 'string' ? `${input.value}\n` : `${JSON.stringify(input.value, null, 2)}\n`
  const localPath = path.join(input.localRoot, input.object)
  await mkdir(path.dirname(localPath), { recursive: true })
  await writeFile(localPath, content, 'utf8')
  const hash = createHash('sha256').update(content).digest('hex')
  return {
    localPath,
    artifact: {
      id: input.id,
      kind: 'private_json',
      bucket: input.bucket,
      object: input.object,
      gcsUri: `gs://${input.bucket}/${input.object}`,
      sizeBytes: Buffer.byteLength(content),
      sha256: hash,
    },
  }
}
