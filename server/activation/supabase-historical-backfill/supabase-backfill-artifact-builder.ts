import { createHash } from 'node:crypto'
import { stat, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { SupabaseHistoricalBackfillArtifact, SupabaseHistoricalBackfillExecutionReport } from './supabase-historical-backfill-types'
import { supabaseHistoricalBackfillConfig } from './supabase-historical-backfill-policy'

export async function writeSupabaseHistoricalBackfillLocalArtifact(input: {
  localRoot: string
  bucket: string
  objectPath: string
  value: unknown
  id: string
}): Promise<{ localPath: string; artifact: SupabaseHistoricalBackfillArtifact }> {
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

export function buildSupabaseHistoricalBackfillArtifactManifest(report: SupabaseHistoricalBackfillExecutionReport) {
  return {
    phase: '51C',
    runId: report.runId,
    generatedAssetsBucket: supabaseHistoricalBackfillConfig.generatedAssetsBucket,
    qaBucket: supabaseHistoricalBackfillConfig.qaBucket,
    artifacts: report.artifacts,
    publicArtifactAccess: false,
    signedUrlSourceOfTruth: false,
    secretsStored: false,
  }
}
