import {
  BIREFNET_RUNTIME_PATH,
  BIREFNET_RUNTIME_TEMP_PATH,
  BIREFNET_STAGING_PATH,
} from './mask-model-candidate-registry'
import type { MaskModelStoragePlan } from './mask-model-approval-types'

export function buildBiRefNetMaskModelStoragePlan(): MaskModelStoragePlan {
  return {
    storagePlanId: 'birefnet_main_staging_storage_v1',
    modelCandidateId: 'zhengpeng7_birefnet',
    expectedRuntimePath: BIREFNET_RUNTIME_PATH,
    runtimeTempPath: BIREFNET_RUNTIME_TEMP_PATH,
    stagingStoragePath: BIREFNET_STAGING_PATH,
    privateStorageRequired: true,
    publicAccessAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    committedToGitAllowed: false,
    sourceMediaBucketAllowed: false,
    retentionNotes: [
      'Store BiRefNet weights only in private staging generated-assets model-weight storage until a dedicated private model-weight bucket exists.',
      'Record source, revision, checksum, and license evidence before Phase 33C runtime verification.',
    ],
    cleanupNotes: [
      'Future cleanup may delete only this BiRefNet model-weight prefix after explicit approval.',
      'Do not delete Phase 28-32 media artifacts, buckets, service accounts, or unrelated model-weight prefixes.',
    ],
    warnings: [
      'Generated-assets bucket is used because activation staging already stores approved model weights there.',
      'Phase 33A does not download or upload model files; checksum remains missing until Phase 33B.',
    ],
  }
}
