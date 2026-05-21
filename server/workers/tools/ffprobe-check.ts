import { createToolResult, type ToolCheckContext, type ToolReadinessCheckResult } from '../tool-readiness-types'
import { parseFirstVersionLine, runVersionCommand } from './tool-check-utils'

export async function checkFFprobe(context: ToolCheckContext): Promise<ToolReadinessCheckResult> {
  const startedAt = Date.now()
  const required = context.required ?? true
  const command = await runVersionCommand(context.env.ffprobeBin, ['-version'], context.env.toolCheckTimeoutMs)
  if (!command.ok) {
    return createToolResult({
      toolName: 'ffprobe',
      status: required ? 'missing' : 'warning',
      required,
      capabilities: ['media_probe', 'duration_probe', 'stream_metadata'],
      summary: `FFprobe unavailable at ${context.env.ffprobeBin}: ${command.stderr}`,
      startedAt,
      binaryPath: context.env.ffprobeBin,
      errorCode: command.errorCode,
    })
  }
  const versionLine = parseFirstVersionLine(command.stdout)

  return createToolResult({
    toolName: 'ffprobe',
    status: 'passed',
    required,
    capabilities: ['media_probe', 'duration_probe', 'stream_metadata'],
    summary: versionLine ? `FFprobe version check passed: ${versionLine}` : 'FFprobe version check passed.',
    startedAt,
    version: versionLine,
    binaryPath: context.env.ffprobeBin,
  })
}
