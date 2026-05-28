import { firstRealVideoConfig } from './first-real-video-policy'

export function buildFirstRealVideoSpeechPlan(imageDigest = '<digest>'): string[] {
  return [
    `Deploy ${firstRealVideoConfig.jobName} with image ${imageDigest}.`,
    `Set REEDITPRO_SPEECH_RUNTIME_MODE=phase28_real_video and REEDITPRO_CONFIRM_FIRST_REAL_VIDEO_SPEECH_CAPTION=true.`,
    `Copy approved model from ${firstRealVideoConfig.modelGcsPath} to ${firstRealVideoConfig.modelRuntimePath}.`,
    `Verify checksum ${firstRealVideoConfig.modelAggregateSha256}.`,
    'Run faster-whisper tiny on CPU with local model path only.',
  ]
}
