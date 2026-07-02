import { createToolResult, type ToolCheckContext, type ToolReadinessCheckResult } from '../tool-readiness-types'

export async function checkSignalsmithStretch(context: ToolCheckContext): Promise<ToolReadinessCheckResult> {
  const startedAt = Date.now()
  const required = context.required ?? false
  return createToolResult({
    toolName: 'signalsmith_stretch',
    status: required ? 'missing' : 'warning',
    required,
    capabilities: ['music_time_stretch', 'pitch_adjustment'],
    summary: 'Signalsmith Stretch binary/package is not configured in this runtime.',
    startedAt,
    errorCode: 'not_configured',
  })
}
