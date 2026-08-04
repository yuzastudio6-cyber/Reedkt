import { createHash } from 'node:crypto'

import type { OfflineRemotionMotionStudioAnimaticPlanningPayload } from '../../tool-execution/remotion-render-execution'

export const MOTION_STUDIO_ANIMATIC_GOLDEN_PLANNING_PAYLOAD = Object.freeze({
  compositionProfileId: 'motion_studio_prepared_script_animatic_v1',
  width: 640,
  height: 360,
  fps: 24,
  durationFrames: 48,
  scenes: [
    {
      order: 0,
      sceneId: 'scene-ms008-opening',
      startFrame: 0,
      endFrame: 24,
      title: 'A precise opening',
      visualDescription: 'Orient the viewer with a deterministic timing-review panel.',
    },
    {
      order: 1,
      sceneId: 'scene-ms008-resolution',
      startFrame: 24,
      endFrame: 48,
      title: 'The story resolves',
      visualDescription: 'Confirm the second exact scene range before higher-cost production.',
    },
  ],
  panelBackground: '#111216',
  accentColor: '#7857FF',
} as const satisfies OfflineRemotionMotionStudioAnimaticPlanningPayload)

export const MOTION_STUDIO_ANIMATIC_GOLDEN_RUNTIME = Object.freeze({
  packageVersion: '4.0.487',
} as const)

export const MOTION_STUDIO_ANIMATIC_FRAME_GOLDENS = Object.freeze([
  { frame: 0, sha256: 'eb7662f266cf4da224be88139d10e126a4dbdb659c40452e72a1d38687a40fbb' },
  { frame: 23, sha256: '1e0f7e277a223039a57adb98ebd5bf27d0ca327dd0b678e3ce3b09b3bbf01898' },
  { frame: 47, sha256: '783889b7bd3d5d2f64b70a7461fa8dbff64db73dd076db356fc84cfa77f21098' },
] as const)

export function createMotionStudioAnimaticGoldenNarration(durationSeconds = 2): {
  mimeType: 'audio/wav'
  bytes: Buffer
  sha256: string
} {
  const sampleRate = 48_000
  const channelCount = 1
  const bytesPerSample = 2
  if (!Number.isSafeInteger(durationSeconds) || durationSeconds < 1 || durationSeconds > 30) {
    throw new Error('Deterministic animatic narration fixture duration is invalid.')
  }
  const sampleCount = sampleRate * durationSeconds
  const dataLength = sampleCount * channelCount * bytesPerSample
  const wav = Buffer.alloc(44 + dataLength)
  wav.write('RIFF', 0)
  wav.writeUInt32LE(36 + dataLength, 4)
  wav.write('WAVE', 8)
  wav.write('fmt ', 12)
  wav.writeUInt32LE(16, 16)
  wav.writeUInt16LE(1, 20)
  wav.writeUInt16LE(channelCount, 22)
  wav.writeUInt32LE(sampleRate, 24)
  wav.writeUInt32LE(sampleRate * channelCount * bytesPerSample, 28)
  wav.writeUInt16LE(channelCount * bytesPerSample, 32)
  wav.writeUInt16LE(bytesPerSample * 8, 34)
  wav.write('data', 36)
  wav.writeUInt32LE(dataLength, 40)
  for (let sample = 0; sample < sampleCount; sample += 1) {
    const envelope = Math.min(1, sample / 2_400, (sampleCount - sample) / 2_400)
    const signal = Math.sin(2 * Math.PI * 220 * sample / sampleRate) * 0.2 +
      Math.sin(2 * Math.PI * 330 * sample / sampleRate) * 0.08
    wav.writeInt16LE(Math.round(signal * envelope * 32_767), 44 + sample * bytesPerSample)
  }
  return {
    mimeType: 'audio/wav',
    bytes: wav,
    sha256: createHash('sha256').update(wav).digest('hex'),
  }
}
