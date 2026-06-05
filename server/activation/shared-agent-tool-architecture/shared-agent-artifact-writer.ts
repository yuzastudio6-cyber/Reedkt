import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { SharedAgentToolArchitectureArtifact } from './shared-agent-tool-architecture-types'

export async function writeSharedAgentToolArchitectureLocalArtifact(input: {
  localRoot: string
  bucket: string
  object: string
  value: unknown
  id: string
}): Promise<{ localPath: string; artifact: SharedAgentToolArchitectureArtifact }> {
  const json = `${JSON.stringify(input.value, null, 2)}\n`
  const localPath = path.join(input.localRoot, input.object.replace(/\//g, '__'))
  await mkdir(path.dirname(localPath), { recursive: true })
  await writeFile(localPath, json, 'utf8')
  return {
    localPath,
    artifact: {
      id: input.id,
      kind: 'private_json',
      bucket: input.bucket,
      object: input.object,
      gcsUri: `gs://${input.bucket}/${input.object}`,
      sizeBytes: Buffer.byteLength(json),
      sha256: createHash('sha256').update(json).digest('hex'),
    },
  }
}
