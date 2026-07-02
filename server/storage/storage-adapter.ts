import type { RuntimeEnv } from '../config/env'
import { GcsDisabledStorageAdapter, GcsStorageAdapter } from './gcs-storage-adapter'
import { LocalStorageAdapter } from './local-storage-adapter'
import { bucketNameForPurpose } from './storage-paths'
import type { StorageAdapter, UploadPurpose } from './storage-types'

export function createStorageAdapter(env: RuntimeEnv): StorageAdapter {
  if (env.storageMode === 'local') {
    return new LocalStorageAdapter(env.localStorageRoot)
  }

  if (env.storageMode === 'gcs') {
    return new GcsStorageAdapter(env)
  }

  return new GcsDisabledStorageAdapter()
}

export function resolveBucketName(env: RuntimeEnv, purpose: UploadPurpose): string {
  return bucketNameForPurpose(purpose, {
    source_media: env.gcsSourceMediaBucket,
    reference_media: env.gcsSourceMediaBucket,
    generated_asset: env.gcsGeneratedAssetsBucket,
    processed_media: env.gcsProcessedMediaBucket,
    preview: env.gcsPreviewsBucket,
    export: env.gcsExportsBucket,
    thumbnail: env.gcsThumbnailsBucket,
    qa_artifact: env.gcsQaArtifactsBucket,
    worker_temp: env.gcsWorkerTempBucket,
  })
}
