import { spawnSync } from 'node:child_process'
import type { SpeechFoundationSkipReason } from './speech-worker-types'

export interface FasterWhisperRuntimeReadinessInput {
  fasterWhisperCommand?: string
  pythonCommand?: string
  timeoutMs?: number
}

export interface FasterWhisperRuntimeReadinessResult {
  status: 'ready' | 'blocked'
  command: string
  runtimeKind: 'python_module' | 'cli'
  blockers: SpeechFoundationSkipReason[]
}

export function resolveFasterWhisperRuntimeReadiness(
  input: FasterWhisperRuntimeReadinessInput = {},
): FasterWhisperRuntimeReadinessResult {
  if (input.fasterWhisperCommand) {
    return checkCliRuntime(input.fasterWhisperCommand, input.timeoutMs)
  }

  const pythonCommand = input.pythonCommand ?? 'python'
  const result = spawnSync(pythonCommand, ['-m', 'faster_whisper', '--help'], {
    encoding: 'utf8',
    timeout: input.timeoutMs ?? 5_000,
  })
  const combinedOutput = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.toLowerCase()
  const printedHelp = combinedOutput.includes('usage') || combinedOutput.includes('help')

  if (result.error || (result.status !== 0 && !printedHelp)) {
    return {
      status: 'blocked',
      command: pythonCommand,
      runtimeKind: 'python_module',
      blockers: [{
        code: 'faster_whisper_runtime_missing',
        message: 'Local-dev transcription skipped because the faster-whisper Python command path is unavailable. No package install or model download was attempted.',
        tool: 'faster_whisper',
      }],
    }
  }

  return {
    status: 'ready',
    command: pythonCommand,
    runtimeKind: 'python_module',
    blockers: [],
  }
}

function checkCliRuntime(command: string, timeoutMs?: number): FasterWhisperRuntimeReadinessResult {
  const result = spawnSync(command, ['--help'], {
    encoding: 'utf8',
    timeout: timeoutMs ?? 5_000,
  })
  const combinedOutput = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.toLowerCase()
  const printedHelp = combinedOutput.includes('usage') || combinedOutput.includes('help')

  if (result.error || (result.status !== 0 && !printedHelp)) {
    return {
      status: 'blocked',
      command,
      runtimeKind: 'cli',
      blockers: [{
        code: 'faster_whisper_runtime_missing',
        message: 'Local-dev transcription skipped because the configured faster-whisper command is unavailable. No package install or model download was attempted.',
        tool: 'faster_whisper',
      }],
    }
  }

  return {
    status: 'ready',
    command,
    runtimeKind: 'cli',
    blockers: [],
  }
}
