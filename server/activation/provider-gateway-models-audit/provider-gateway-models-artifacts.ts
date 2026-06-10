import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { ProviderModelsAuditArtifact } from './provider-gateway-models-audit-types'

export async function writeProviderModelsAuditLocalArtifact(input: {
  localRoot: string
  bucket: string
  object: string
  value: unknown
  artifactId: string
  artifactType: string
}): Promise<{ localPath: string; artifact: ProviderModelsAuditArtifact }> {
  const body = `${JSON.stringify(input.value, null, 2)}\n`
  const sha256 = createHash('sha256').update(body).digest('hex')
  const localPath = path.join(input.localRoot, input.object)
  await mkdir(path.dirname(localPath), { recursive: true })
  await writeFile(localPath, body, 'utf8')
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
