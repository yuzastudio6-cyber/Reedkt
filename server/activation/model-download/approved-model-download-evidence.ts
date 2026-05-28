import {
  FASTER_WHISPER_TINY_RUNTIME_PATH,
  FASTER_WHISPER_TINY_STAGING_PATH,
} from '../model-approval/model-candidate-registry'
import type { ApprovedModelDownloadEvidence } from './model-download-types'

export const approvedModelDownloadEvidence: ApprovedModelDownloadEvidence = {
  modelWeightManifestId: 'faster_whisper_tiny_staging_v1',
  repoId: 'Systran/faster-whisper-tiny',
  modelName: 'Systran/faster-whisper-tiny',
  status: 'verified',
  resolvedRevision: 'd90ca5fe260221311c53c58e660288d3deb8d356',
  aggregateSha256: '331e779addbf1ed02bf462c0c26d978d23ecd01ec8f79fb3771cc21975e696f5',
  fileCount: 6,
  totalSizeBytes: 78207087,
  downloadedAt: '2026-05-28T00:50:24Z',
  uploadedAt: '2026-05-28T00:51:17Z',
  stagingStoragePath: FASTER_WHISPER_TINY_STAGING_PATH,
  runtimePath: FASTER_WHISPER_TINY_RUNTIME_PATH,
  gcsManifestPath: `${FASTER_WHISPER_TINY_STAGING_PATH}model_tree_manifest.json`,
  gcsChecksumPath: `${FASTER_WHISPER_TINY_STAGING_PATH}file_checksums_sha256.txt`,
  sanitizedLocalTempPath: '/tmp/reeditpro-model-download/faster-whisper-tiny/snapshot',
  uploadedObjectCount: 8,
  blockers: [],
  warnings: [
    'Phase 26B verifies private staging model storage only; it does not run transcription.',
    'Phase 28 execution remains blocked until a speech runtime image/job is deployed and verified.',
  ],
}

export function getApprovedModelDownloadEvidence(): ApprovedModelDownloadEvidence {
  return { ...approvedModelDownloadEvidence }
}
