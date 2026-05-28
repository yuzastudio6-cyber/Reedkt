import { realVideoSmartCutConfig } from './real-video-smart-cut-policy'

export function resolvePhase28ArtifactUris(): Record<string, string> {
  const prefix = realVideoSmartCutConfig.phase28Prefix
  return {
    source: realVideoSmartCutConfig.sourceGcsUri,
    mediaProbe: `gs://${realVideoSmartCutConfig.analysisBucket}/${prefix}/analysis/media-probe.json`,
    transcript: `gs://${realVideoSmartCutConfig.transcriptsBucket}/${prefix}/transcripts/transcript.json`,
    wordTimestamps: `gs://${realVideoSmartCutConfig.transcriptsBucket}/${prefix}/transcripts/word-timestamps.json`,
    captionSegments: `gs://${realVideoSmartCutConfig.transcriptsBucket}/${prefix}/captions/caption-segments.json`,
    srt: `gs://${realVideoSmartCutConfig.transcriptsBucket}/${prefix}/captions/captions.srt`,
    webvtt: `gs://${realVideoSmartCutConfig.transcriptsBucket}/${prefix}/captions/captions.vtt`,
    ass: `gs://${realVideoSmartCutConfig.transcriptsBucket}/${prefix}/captions/captions.ass`,
    captionQa: `gs://${realVideoSmartCutConfig.qaBucket}/${prefix}/qa/caption-qa.json`,
    phase28Report: `gs://${realVideoSmartCutConfig.qaBucket}/${prefix}/reports/phase28-report.json`,
  }
}

export function assertApprovedPhase28Object(gcsUri: string): void {
  if (!gcsUri.startsWith('gs://')) throw new Error(`Expected a private GCS URI: ${gcsUri}`)
  if (!gcsUri.includes(`/${realVideoSmartCutConfig.phase28Prefix}/`)) {
    throw new Error(`Phase 29 may only use artifacts under ${realVideoSmartCutConfig.phase28Prefix}.`)
  }
  if (gcsUri.includes('?') || gcsUri.startsWith('http://') || gcsUri.startsWith('https://')) {
    throw new Error('Signed URLs and remote URLs are blocked for Phase 29.')
  }
}
