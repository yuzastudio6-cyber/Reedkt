import { realVideoAudioCleanupConfig } from './real-video-audio-cleanup-policy'

export function resolvePhase31ApprovedArtifactUris(runId = 'phase31-planned'): {
  input: string
  loudnessReport: string
  normalizedAudio: string
  normalizedExport: string
  qaReport: string
  phase31Report: string
} {
  const config = realVideoAudioCleanupConfig
  const safeRunId = /^phase31-[0-9A-Za-z]+$/.test(runId) ? runId : 'phase31-planned'
  const prefix = `${config.phase31Prefix}/${safeRunId}`
  return {
    input: config.inputGcsUri,
    loudnessReport: `gs://${config.generatedAssetsBucket}/${prefix}/audio/loudness-report.json`,
    normalizedAudio: `gs://${config.generatedAssetsBucket}/${prefix}/audio/normalized-audio.m4a`,
    normalizedExport: `gs://${config.finalExportsBucket}/${prefix}/audio-normalized-export.mp4`,
    qaReport: `gs://${config.qaBucket}/${prefix}/qa/audio-cleanup-qa.json`,
    phase31Report: `gs://${config.qaBucket}/${prefix}/reports/phase31-report.json`,
  }
}

export function parsePhase31GcsUri(uri: string): { bucket: string; object: string } {
  const match = /^gs:\/\/([^/]+)\/(.+)$/.exec(uri)
  if (!match) throw new Error(`Invalid GCS URI: ${uri}`)
  return { bucket: match[1], object: match[2] }
}
