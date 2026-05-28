import {
  FASTER_WHISPER_TINY_RUNTIME_PATH,
  FASTER_WHISPER_TINY_STAGING_PATH,
} from './model-candidate-registry'
import type { ModelStoragePlan } from './model-approval-types'

export function buildFasterWhisperTinyStoragePlan(): ModelStoragePlan {
  return {
    storagePlanId: 'faster_whisper_tiny_staging_storage_v1',
    modelCandidateId: 'systran_faster_whisper_tiny',
    expectedRuntimePath: FASTER_WHISPER_TINY_RUNTIME_PATH,
    stagingStoragePath: FASTER_WHISPER_TINY_STAGING_PATH,
    privateStorageRequired: true,
    publicAccessAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    committedToGitAllowed: false,
    sourceMediaBucketAllowed: false,
    retentionNotes: [
      'Store only in private staging storage under generated-assets/model-weights until a dedicated model-weights bucket exists.',
      'Keep source, revision, checksum, and license evidence in manifests before any runtime execution.',
    ],
    cleanupNotes: [
      'Future cleanup should delete only this model-weight prefix after explicit approval.',
      'Do not delete user media, generated fixture artifacts, buckets, or service accounts.',
    ],
    warnings: [
      'Generated-assets bucket is used because Phase 22B did not create a dedicated model-weight bucket.',
      'Model storage/download status is reported by Phase 26B; runtime loading remains unavailable until an explicit load/verification phase completes.',
    ],
  }
}
