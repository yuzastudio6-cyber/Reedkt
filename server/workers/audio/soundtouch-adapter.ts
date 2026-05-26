import { existsSync } from 'node:fs'
import { assertNoPathTraversal, assertNoSignedUrlOrRawUrl } from '../media/media-path-safety'
import type { AudioFoundationRunMode, AudioToolSkipReason } from './audio-foundation-types'

export interface TempoPitchInput {
  sourceAudioLocalPath?: string
  outputAudioLocalPath?: string
  command?: string
  tempoRatio?: number
  pitchSemitones?: number
  timeoutMs: number
  runMode: AudioFoundationRunMode
  localDevToolExecution?: boolean
}

export function validateTempoPitchInput(input: TempoPitchInput): void {
  if ((input.tempoRatio && (input.tempoRatio < 0.75 || input.tempoRatio > 1.35)) ||
    (input.pitchSemitones && Math.abs(input.pitchSemitones) > 4)) {
    throw new Error('Milestone 9 rejects extreme tempo/pitch changes without future QA approval.')
  }
  for (const [label, value] of Object.entries({ sourceAudioLocalPath: input.sourceAudioLocalPath, outputAudioLocalPath: input.outputAudioLocalPath })) {
    if (value) {
      assertNoSignedUrlOrRawUrl(value, label)
      assertNoPathTraversal(value, label)
    }
  }
}

export function buildTempoPitchCommand(input: TempoPitchInput): { command: string; args: string[] } {
  validateTempoPitchInput(input)
  return {
    command: input.command ?? 'soundstretch',
    args: [
      input.sourceAudioLocalPath ?? '',
      input.outputAudioLocalPath ?? '',
      '-tempo=' + String(Math.round(((input.tempoRatio ?? 1) - 1) * 100)),
      '-pitch=' + String(input.pitchSemitones ?? 0),
    ],
  }
}

export async function runTempoPitchAdjustment(input: TempoPitchInput): Promise<{ status: 'skipped'; skipReason: AudioToolSkipReason }> {
  validateTempoPitchInput(input)
  return { status: 'skipped', skipReason: buildSkipReason(input) ?? { code: 'soundtouch_unavailable', message: 'SoundTouch is unavailable in Milestone 9 scaffolding.', tool: 'soundtouch' } }
}

export function buildSkipReason(input: TempoPitchInput): AudioToolSkipReason | undefined {
  if (input.runMode === 'production_blocked') return { code: 'production_soundtouch_blocked', message: 'Production SoundTouch execution is blocked in Milestone 9.', tool: 'soundtouch' }
  if (!input.localDevToolExecution) return { code: 'soundtouch_not_enabled', message: 'SoundTouch local-dev execution was not explicitly enabled.', tool: 'soundtouch' }
  if (!input.sourceAudioLocalPath || !existsSync(input.sourceAudioLocalPath)) return { code: 'local_audio_missing', message: 'SoundTouch skipped because local audio is unavailable.', tool: 'soundtouch' }
  return { code: 'soundtouch_unavailable', message: 'SoundTouch execution is scaffolded only unless the tool is already installed.', tool: 'soundtouch' }
}
