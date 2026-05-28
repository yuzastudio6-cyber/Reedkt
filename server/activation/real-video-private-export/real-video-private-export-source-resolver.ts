import { realVideoPrivateExportConfig } from './real-video-private-export-policy'

export function resolvePhase30ApprovedArtifactUris(): {
  source: string
  smartCutPlan: string
  timelineManifest: string
  otioManifest: string
  hyperframeBridge: string
  remotionManifest: string
  phase29Qa: string
  phase29Report: string
  phase28CaptionSegments: string
  phase28Srt: string
  phase28WebVtt: string
  phase28Ass: string
  phase28CaptionQa: string
} {
  const config = realVideoPrivateExportConfig
  return {
    source: config.sourceGcsUri,
    smartCutPlan: `gs://${config.analysisBucket}/${config.phase29Prefix}/smart-cut/smart-cut-plan.json`,
    timelineManifest: `gs://${config.analysisBucket}/${config.phase29Prefix}/timeline/timeline-manifest.json`,
    otioManifest: `gs://${config.analysisBucket}/${config.phase29Prefix}/timeline/opentimelineio-style.json`,
    hyperframeBridge: `gs://${config.analysisBucket}/${config.phase29Prefix}/timeline/hyperframe-bridge.json`,
    remotionManifest: `gs://${config.analysisBucket}/${config.phase29Prefix}/timeline/remotion-composition-manifest.json`,
    phase29Qa: `gs://${config.qaBucket}/${config.phase29Prefix}/qa/smart-cut-caption-qa.json`,
    phase29Report: `gs://${config.qaBucket}/${config.phase29Prefix}/reports/phase29-report.json`,
    phase28CaptionSegments: `gs://${config.transcriptsBucket}/${config.phase28Prefix}/captions/caption-segments.json`,
    phase28Srt: `gs://${config.transcriptsBucket}/${config.phase28Prefix}/captions/captions.srt`,
    phase28WebVtt: `gs://${config.transcriptsBucket}/${config.phase28Prefix}/captions/captions.vtt`,
    phase28Ass: `gs://${config.transcriptsBucket}/${config.phase28Prefix}/captions/captions.ass`,
    phase28CaptionQa: `gs://${config.qaBucket}/${config.phase28Prefix}/qa/caption-qa.json`,
  }
}

export function parseGcsUri(uri: string): { bucket: string; object: string } {
  const match = /^gs:\/\/([^/]+)\/(.+)$/.exec(uri)
  if (!match) throw new Error(`Invalid GCS URI: ${uri}`)
  return { bucket: match[1], object: match[2] }
}
