import {
  buildTempoPitchCommand,
  runTempoPitchAdjustment,
  validateTempoPitchInput,
} from './soundtouch-adapter'
import type { TempoPitchInput } from './soundtouch-adapter'
import type { AudioToolSkipReason } from './audio-foundation-types'

export type SignalsmithStretchInput = TempoPitchInput

export const validateSignalsmithStretchInput = validateTempoPitchInput
export const buildSignalsmithStretchCommand = buildTempoPitchCommand
export const runSignalsmithStretchAdjustment = runTempoPitchAdjustment

export function buildSignalsmithStretchSkipReason(input: SignalsmithStretchInput): AudioToolSkipReason | undefined {
  if (input.runMode === 'production_blocked') return { code: 'production_signalsmith_stretch_blocked', message: 'Production Signalsmith Stretch execution is blocked in Milestone 9.', tool: 'signalsmith_stretch' }
  if (!input.localDevToolExecution) return { code: 'signalsmith_stretch_not_enabled', message: 'Signalsmith Stretch local-dev execution was not explicitly enabled.', tool: 'signalsmith_stretch' }
  if (!input.sourceAudioLocalPath) return { code: 'local_audio_missing', message: 'Signalsmith Stretch skipped because local audio is unavailable.', tool: 'signalsmith_stretch' }
  return { code: 'signalsmith_stretch_unavailable', message: 'Signalsmith Stretch execution is scaffolded only unless the tool is already installed.', tool: 'signalsmith_stretch' }
}
