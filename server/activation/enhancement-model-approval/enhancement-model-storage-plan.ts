import {
  FILM_EVALUATED_ONLY_STAGING_PATH,
  REAL_ESRGAN_X4PLUS_RUNTIME_PATH,
  REAL_ESRGAN_X4PLUS_RUNTIME_TEMP_PATH,
  REAL_ESRGAN_X4PLUS_STAGING_PATH,
} from './enhancement-model-candidate-registry'
import type { EnhancementModelStoragePlan } from './enhancement-model-approval-types'

export function buildRealEsrganEnhancementModelStoragePlan(): EnhancementModelStoragePlan {
  return {
    storagePlanId: 'real_esrgan_x4plus_staging_storage_v1',
    modelCandidateId: 'xinntao_real_esrgan_x4plus',
    expectedRuntimePath: REAL_ESRGAN_X4PLUS_RUNTIME_PATH,
    runtimeTempPath: REAL_ESRGAN_X4PLUS_RUNTIME_TEMP_PATH,
    stagingStoragePath: REAL_ESRGAN_X4PLUS_STAGING_PATH,
    filmFutureStoragePath: FILM_EVALUATED_ONLY_STAGING_PATH,
    privateStorageRequired: true,
    publicAccessAllowed: false,
    signedUrlSourceOfTruthAllowed: false,
    committedToGitAllowed: false,
    sourceMediaBucketAllowed: false,
    retentionNotes: [
      'Store Real-ESRGAN weights only in private staging generated-assets model-weight storage until a dedicated private model-weight bucket exists.',
      'Record source, revision, checksum, file inventory, and license evidence before Phase 34C runtime verification.',
      'FILM future storage path is recorded as evaluated-only; it is not approved for download in Phase 34A.',
    ],
    cleanupNotes: [
      'Future cleanup may delete only the Real-ESRGAN x4plus model-weight prefix after explicit approval.',
      'Do not delete Phase 28-33E media artifacts, buckets, service accounts, BiRefNet weights, or unrelated model-weight prefixes.',
    ],
    warnings: [
      'Generated-assets bucket is used because activation staging already stores approved model weights there.',
      'Phase 34A does not download or upload model files; checksum remains missing until Phase 34B.',
      'FILM pre-trained model storage remains blocked/evaluated-only.',
    ],
  }
}
