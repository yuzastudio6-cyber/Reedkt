import { realVideoAudioCleanupConfig } from './real-video-audio-cleanup-policy'

export function buildPhase31LoudnessCommandPlan(inputPath = '[worker-temp-input-final-export.mp4]'): {
  measurementCommand: string[]
  normalizationCommand: string[]
} {
  const config = realVideoAudioCleanupConfig
  const loudnorm = `loudnorm=I=${config.targetIntegratedLufs}:TP=${config.targetTruePeakDbtp}:LRA=${config.targetLra}:print_format=json`
  return {
    measurementCommand: ['ffmpeg', '-hide_banner', '-nostdin', '-i', inputPath, '-af', loudnorm, '-f', 'null', '-'],
    normalizationCommand: ['ffmpeg', '-hide_banner', '-nostdin', '-i', inputPath, '-af', `${loudnorm}:linear=true`, '-vn', '-c:a', 'aac', '[worker-temp-normalized-audio.m4a]'],
  }
}
