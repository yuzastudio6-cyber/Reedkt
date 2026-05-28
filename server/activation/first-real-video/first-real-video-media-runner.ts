import { firstRealVideoConfig } from './first-real-video-policy'

export function buildFirstRealVideoMediaPlan(): string[] {
  return [
    `Validate exactly one approved source video: ${firstRealVideoConfig.sourceVideoPath}.`,
    `Upload/copy to gs://${firstRealVideoConfig.sourceBucket}/activation-real-video/phase28/<runId>/source-video.mov.`,
    'Inside the guarded speech runtime job, use ffprobe for metadata and FFmpeg for WAV extraction.',
    `Store media probe in gs://${firstRealVideoConfig.analysisBucket}/activation-real-video/phase28/<runId>/analysis/media-probe.json.`,
    `Store extracted audio in gs://${firstRealVideoConfig.transcriptsBucket}/activation-real-video/phase28/<runId>/audio/source-audio.wav.`,
  ]
}
