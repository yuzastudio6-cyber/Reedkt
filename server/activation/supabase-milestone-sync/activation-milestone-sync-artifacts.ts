import { createHash } from 'node:crypto'
import { readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { SupabaseMilestoneSyncArtifact } from './supabase-milestone-sync-types'

export async function writeSupabaseMilestoneSyncLocalArtifact(input: {
  localRoot: string
  bucket: string
  objectPath: string
  value: unknown
  id: string
}): Promise<{ localPath: string; artifact: SupabaseMilestoneSyncArtifact }> {
  const localPath = path.join(input.localRoot, `${input.id}.json`)
  await writeFile(localPath, `${JSON.stringify(input.value, null, 2)}\n`, 'utf8')
  const fileStat = await stat(localPath)
  const bytes = await readFile(localPath)
  return {
    localPath,
    artifact: {
      id: input.id,
      kind: 'private_json',
      bucket: input.bucket,
      object: input.objectPath,
      gcsUri: `gs://${input.bucket}/${input.objectPath}`,
      sizeBytes: fileStat.size,
      sha256: createHash('sha256').update(bytes).digest('hex'),
    },
  }
}

export function buildFuturePhaseSyncContract() {
  return {
    contract: 'ActivationMilestoneSyncInput',
    requiredBehavior: [
      'build normal phase report and private GCS artifacts',
      'build milestone sync input with private gs:// references only',
      'attempt Supabase milestone sync when registry secrets/config are available',
      'report Supabase milestone sync completed or blocked with exact reason',
      'do not fail non-data-plane tool execution solely because sync fails',
      'never store secrets, public artifact source-of-truth, signed URL source-of-truth, raw provider data, raw prompt execution, or production/beta unlocks',
    ],
    prSummaryTemplate: [
      'Supabase milestone sync:',
      '- status:',
      '- run ID:',
      '- activation_run row:',
      '- readback:',
      '- blocker if any:',
    ],
  }
}
