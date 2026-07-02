import { existsSync } from 'node:fs'
import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl } from '../media/media-path-safety'
import type { AudioFoundationRunMode, AudioToolSkipReason } from './audio-foundation-types'

export interface RNNoiseInput {
  sourceAudioLocalPath?: string
  outputAudioLocalPath?: string
  rnnoiseCommand?: string
  timeoutMs: number
  runMode: AudioFoundationRunMode
  localDevToolExecution?: boolean
}

export function validateRNNoiseInput(input: RNNoiseInput): void {
  for (const [label, value] of Object.entries({
    sourceAudioLocalPath: input.sourceAudioLocalPath,
    outputAudioLocalPath: input.outputAudioLocalPath,
  })) {
    if (value) {
      assertNoSignedUrlOrRawUrl(value, label)
      assertNoPathTraversal(value, label)
    }
  }
}

export function buildRNNoiseCommand(input: RNNoiseInput): { command: string; args: string[] } {
  validateRNNoiseInput(input)
  return { command: input.rnnoiseCommand ?? 'rnnoise_demo', args: [input.sourceAudioLocalPath ?? '', input.outputAudioLocalPath ?? ''] }
}

export async function runRNNoiseCleanup(input: RNNoiseInput): Promise<{ status: 'skipped'; skipReason: AudioToolSkipReason }> {
  validateRNNoiseInput(input)
  return { status: 'skipped', skipReason: buildRNNoiseSkipReason(input) ?? { code: 'rnnoise_unavailable', message: 'RNNoise is unavailable in Milestone 9 scaffolding.', tool: 'rnnoise' } }
}

export function buildRNNoiseSkipReason(input: RNNoiseInput): AudioToolSkipReason | undefined {
  if (input.runMode === 'production_blocked') return { code: 'production_rnnoise_blocked', message: 'Production RNNoise execution is blocked in Milestone 9.', tool: 'rnnoise' }
  if (!input.localDevToolExecution) return { code: 'rnnoise_not_enabled', message: 'RNNoise local-dev execution was not explicitly enabled.', tool: 'rnnoise' }
  if (!input.sourceAudioLocalPath || !existsSync(input.sourceAudioLocalPath)) return { code: 'local_audio_missing', message: 'RNNoise skipped because local audio is unavailable.', tool: 'rnnoise' }
  return { code: 'rnnoise_unavailable', message: 'RNNoise execution is scaffolded only unless the tool is already installed.', tool: 'rnnoise' }
}
