import { runAudioExecution } from '../audio/audio-execution-runner'
import type { AudioExecutionInput, AudioExecutionResult } from './audio-execution-pipeline-types'

export function runAudioExecutionPipeline(input: AudioExecutionInput): Promise<AudioExecutionResult> {
  return runAudioExecution(input)
}
