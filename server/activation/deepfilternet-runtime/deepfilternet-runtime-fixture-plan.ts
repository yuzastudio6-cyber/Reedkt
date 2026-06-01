import { deepFilterNetRuntimeConfig } from './deepfilternet-runtime-policy'
import type { DeepFilterNetRuntimeFixturePlan } from './deepfilternet-runtime-types'

export function buildDeepFilterNetRuntimeFixturePlan(): DeepFilterNetRuntimeFixturePlan {
  return {
    generatedAudioOnly: true,
    sampleRate: deepFilterNetRuntimeConfig.fixtureSampleRate,
    channels: deepFilterNetRuntimeConfig.fixtureChannels,
    durationSeconds: deepFilterNetRuntimeConfig.fixtureDurationSeconds,
    format: 'wav',
    cleanReferenceGenerated: true,
    noiseProfile: 'deterministic speech-like harmonic tones plus low-amplitude broadband synthetic noise',
    blockers: [],
    warnings: ['Generated-audio fixture proves runtime only; subjective real-video audio cleanup is not evaluated in Phase 36C.'],
  }
}
