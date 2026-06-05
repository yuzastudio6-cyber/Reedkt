import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { futurePhaseSupabaseSyncPrTemplate, supabaseMilestoneSyncConfig } from './supabase-milestone-sync-policy'
import type { SupabaseMilestoneSyncArtifact } from './supabase-milestone-sync-types'

export async function writeSupabaseMilestoneSyncLocalArtifact(input: {
  localRoot: string
  bucket: string
  object: string
  value: unknown
  id: string
}): Promise<{ localPath: string; artifact: SupabaseMilestoneSyncArtifact }> {
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

export function buildFuturePhaseSyncContract() {
  return {
    phase: '51D',
    contract: 'ActivationMilestoneSyncInput',
    requiredPrBodyFields: futurePhaseSupabaseSyncPrTemplate.split('\n'),
    allowedArtifactReferences: ['private gs:// references only'],
    blockedArtifactReferences: ['public URLs as source of truth', 'signed URLs as source of truth', 'raw blobs/media/provider responses'],
    futurePhasesMustIncludeSupabaseSyncStatus: true,
    registryTables: ['activation_runs', 'activation_artifacts', 'activation_qa_gates', 'readiness_snapshots', 'tool_capabilities', 'feature_gates'],
    generatedAssetsPrefix: `gs://${supabaseMilestoneSyncConfig.generatedAssetsBucket}/${supabaseMilestoneSyncConfig.artifactPrefixBase}/<runId>/`,
    qaPrefix: `gs://${supabaseMilestoneSyncConfig.qaBucket}/${supabaseMilestoneSyncConfig.artifactPrefixBase}/<runId>/`,
  }
}
