import {
  SAM2_CHECKPOINT_FILE_NAME,
  SAM2_CHECKPOINT_SOURCE_URL,
  SAM2_CONFIG_FILE_NAME,
  SAM2_CONFIG_SOURCE_URL,
  SAM2_LICENSE_NAME,
  SAM2_MODEL_DOWNLOAD_GCS_PATH,
  SAM2_MODEL_FAMILY,
  SAM2_MODEL_ID,
} from './sam2-model-download-policy'
import { buildSam2AggregateChecksum } from './sam2-model-checksum'
import type { Sam2ChecksumEntry, Sam2ModelTreeManifest } from './sam2-model-download-types'

export function buildSam2ModelTreeManifest(input: {
  files: Sam2ChecksumEntry[]
  createdAt: string
}): Sam2ModelTreeManifest {
  const fileSha256 = Object.fromEntries(input.files.map((entry) => [entry.relativePath, entry.sha256]))
  const fileSizes = Object.fromEntries(input.files.map((entry) => [entry.relativePath, entry.sizeBytes]))
  return {
    phase: '35B',
    modelFamily: SAM2_MODEL_FAMILY,
    modelId: SAM2_MODEL_ID,
    checkpointFileName: SAM2_CHECKPOINT_FILE_NAME,
    configFileName: SAM2_CONFIG_FILE_NAME,
    checkpointSourceUrl: SAM2_CHECKPOINT_SOURCE_URL,
    configSourceUrl: SAM2_CONFIG_SOURCE_URL,
    licenseName: SAM2_LICENSE_NAME,
    fileSha256,
    aggregateSha256: buildSam2AggregateChecksum(input.files),
    fileSizes,
    createdAt: input.createdAt,
    targetGcsPath: SAM2_MODEL_DOWNLOAD_GCS_PATH,
    downloadAllowedInPhase35B: true,
    runtimeAllowed: false,
    temporalTrackingAllowed: false,
    fullVideoMaskAllowed: false,
    fullVideoTextBehindSubjectAllowed: false,
    productionReadyAllowed: false,
    externalBetaAllowed: false,
    paidProductionAllowed: false,
    broadRealUserMediaAllowed: false,
    providerAllowed: false,
    revideoAllowed: false,
  }
}
