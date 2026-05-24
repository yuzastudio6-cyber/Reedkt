import { createToolResult, type ToolCheckContext, type ToolReadinessCheckResult } from '../tool-readiness-types'

export async function checkWhisper(context: ToolCheckContext): Promise<ToolReadinessCheckResult> {
  const startedAt = Date.now()
  const required = context.required ?? false

  return createToolResult({
    toolName: 'whisper',
    status: required ? 'missing' : 'warning',
    required,
    capabilities: ['transcription_future', 'timestamped_segments_future'],
    summary: 'Whisper/faster-whisper/whisper.cpp runtime is not selected or configured in this milestone. No transcription or media processing was executed.',
    startedAt,
    binaryPath: context.env.pythonBin,
    errorCode: 'planned_not_configured',
  })
}
