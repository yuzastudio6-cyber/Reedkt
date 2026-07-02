import type { AudioExecutionResult } from './audio-execution-types'

export function buildAudioExecutionResult(input: AudioExecutionResult): AudioExecutionResult {
  return {
    ...input,
    blocksFinalExport: true,
  }
}
