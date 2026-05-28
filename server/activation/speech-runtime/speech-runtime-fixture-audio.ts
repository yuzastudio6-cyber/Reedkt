export function buildSpeechRuntimeFixturePlan() {
  return {
    fixtureKind: 'generated_tone_wav',
    durationSeconds: 2,
    sampleRateHz: 16000,
    channels: 1,
    realUserMediaAllowed: false,
    arbitraryMediaInputAllowed: false,
    notes: [
      'Generated audio is created inside the container at runtime.',
      'Empty transcript is acceptable if the generated fixture contains no speech and faster-whisper completes gracefully.',
    ],
  }
}
