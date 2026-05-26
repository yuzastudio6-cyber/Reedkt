import type { AudioExecutionInput, AudioExecutionPlan } from './audio-execution-types'

export function buildMusicDuckingExecutionPlan(input: {
  executionInput: AudioExecutionInput
  executionPlan: AudioExecutionPlan
}) {
  return {
    operation: 'duck_music_under_voice' as const,
    enabled: input.executionPlan.musicDuckingOperationPlan.enabled,
    voiceFirst: true as const,
    duckingDb: input.executionPlan.musicDuckingOperationPlan.duckingDb,
    attackMs: input.executionPlan.musicDuckingOperationPlan.attackMs,
    releaseMs: input.executionPlan.musicDuckingOperationPlan.releaseMs,
    commandPlanOnly: true,
    finalMuxAllowed: false,
    reason: input.executionPlan.musicDuckingOperationPlan.enabled
      ? 'Music ducking is planned to protect voice clarity, but final mux is out of scope for M15A.'
      : 'No music ducking execution is needed for the available evidence.',
    warnings: input.executionInput.allowFinalMux === true ? ['Final mux is blocked in M15A.'] : [],
  }
}
