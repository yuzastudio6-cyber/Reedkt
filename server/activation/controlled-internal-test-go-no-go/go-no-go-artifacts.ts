import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { GoNoGoArtifact } from './controlled-internal-test-go-no-go-types'

export async function writeGoNoGoLocalArtifact(input: {
  localRoot: string
  bucket: string
  object: string
  value: unknown
  id: string
  kind?: GoNoGoArtifact['kind']
}): Promise<{ localPath: string; artifact: GoNoGoArtifact }> {
  const body = typeof input.value === 'string' ? input.value : `${JSON.stringify(input.value, null, 2)}\n`
  const localPath = path.join(input.localRoot, input.object)
  await mkdir(path.dirname(localPath), { recursive: true })
  await writeFile(localPath, body, 'utf8')
  return {
    localPath,
    artifact: {
      id: input.id,
      kind: input.kind ?? 'private_json',
      bucket: input.bucket,
      object: input.object,
      gcsUri: `gs://${input.bucket}/${input.object}`,
      sizeBytes: Buffer.byteLength(body),
      sha256: createHash('sha256').update(body).digest('hex'),
    },
  }
}
