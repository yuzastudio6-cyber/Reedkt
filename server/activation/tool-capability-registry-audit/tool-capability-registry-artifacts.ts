import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { ToolCapabilityRegistryArtifact } from './tool-capability-registry-types'

export async function writeToolCapabilityRegistryLocalArtifact(input: {
  localRoot: string
  bucket: string
  object: string
  value: unknown
  id: string
}): Promise<{ localPath: string; artifact: ToolCapabilityRegistryArtifact }> {
  const body = `${JSON.stringify(input.value, null, 2)}\n`
  const localPath = path.join(input.localRoot, input.object)
  await mkdir(path.dirname(localPath), { recursive: true })
  await writeFile(localPath, body, 'utf8')
  return {
    localPath,
    artifact: {
      id: input.id,
      kind: 'private_json',
      bucket: input.bucket,
      object: input.object,
      gcsUri: `gs://${input.bucket}/${input.object}`,
      sizeBytes: Buffer.byteLength(body),
      sha256: createHash('sha256').update(body).digest('hex'),
    },
  }
}
