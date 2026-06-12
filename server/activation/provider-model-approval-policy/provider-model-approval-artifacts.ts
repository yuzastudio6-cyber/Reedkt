import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { ProviderModelApprovalArtifact } from './provider-model-approval-types'

export async function writeProviderModelApprovalLocalArtifact(input: {
  localRoot: string
  bucket: string
  object: string
  value: unknown
  artifactId: string
  artifactType: string
}): Promise<{ localPath: string; artifact: ProviderModelApprovalArtifact }> {
  const localPath = path.join(input.localRoot, input.object)
  const serialized = `${JSON.stringify(input.value, null, 2)}\n`
  await mkdir(path.dirname(localPath), { recursive: true })
  await writeFile(localPath, serialized, 'utf8')
  const sha256 = createHash('sha256').update(serialized).digest('hex')
  return {
    localPath,
    artifact: {
      artifactId: input.artifactId,
      artifactType: input.artifactType,
      localPath,
      gcsUri: `gs://${input.bucket}/${input.object}`,
      sha256,
      privateArtifact: true,
    },
  }
}
