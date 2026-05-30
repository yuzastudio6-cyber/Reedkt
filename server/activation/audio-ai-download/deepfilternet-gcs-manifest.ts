import {
  DEEPFILTERNET_DOWNLOAD_GCS_PATH,
  DEEPFILTERNET_LICENSE_NAME,
  DEEPFILTERNET_SELECTED_VERSION,
  DEEPFILTERNET_SOURCE_REPO,
  DEEPFILTERNET_TOOL_FAMILY,
  DEEPFILTERNET_TOOL_ID,
  selectedDeepFilterNetArtifacts,
} from './deepfilternet-download-policy'
import { buildDeepFilterNetAggregateChecksum } from './deepfilternet-checksum'
import type {
  DeepFilterNetChecksumEntry,
  DeepFilterNetModelTreeManifest,
} from './audio-ai-download-types'

export function buildDeepFilterNetModelTreeManifest(input: {
  files: DeepFilterNetChecksumEntry[]
  createdAt: string
}): DeepFilterNetModelTreeManifest {
  const fileSha256 = Object.fromEntries(input.files.map((entry) => [entry.relativePath, entry.sha256]))
  const fileSizes = Object.fromEntries(input.files.map((entry) => [entry.relativePath, entry.sizeBytes]))
  return {
    phase: '36B',
    toolFamily: DEEPFILTERNET_TOOL_FAMILY,
    toolId: DEEPFILTERNET_TOOL_ID,
    selectedVersion: DEEPFILTERNET_SELECTED_VERSION,
    sourceRepo: DEEPFILTERNET_SOURCE_REPO,
    selectedArtifacts: selectedDeepFilterNetArtifacts.map((artifact) => ({ ...artifact })),
    licenseName: DEEPFILTERNET_LICENSE_NAME,
    fileSha256,
    aggregateSha256: buildDeepFilterNetAggregateChecksum(input.files),
    fileSizes,
    createdAt: input.createdAt,
    targetGcsPath: DEEPFILTERNET_DOWNLOAD_GCS_PATH,
    downloadAllowedInPhase36B: true,
    runtimeAllowed: false,
    audioProcessingAllowed: false,
    realVideoAudioAiCleanupAllowed: false,
    rnnoiseDownloadAllowed: false,
    demucsDownloadAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
    filmAllowed: false,
    slowMotionAllowed: false,
  }
}
