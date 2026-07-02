import { createToolResult, type ToolCheckContext, type ToolReadinessCheckResult } from '../tool-readiness-types'
import { parseFirstVersionLine, runVersionCommand } from './tool-check-utils'

export async function checkFFmpeg(context: ToolCheckContext): Promise<ToolReadinessCheckResult> {
  const startedAt = Date.now()
  const required = context.required ?? true
  const command = await runVersionCommand(context.env.ffmpegBin, ['-version'], context.env.toolCheckTimeoutMs)
  if (!command.ok) {
    return createToolResult({
      toolName: 'ffmpeg',
      status: required ? 'missing' : 'warning',
      required,
      capabilities: ['trim', 'transcode', 'audio_extract', 'encode'],
      summary: `FFmpeg unavailable at ${context.env.ffmpegBin}: ${command.stderr}`,
      startedAt,
      binaryPath: context.env.ffmpegBin,
      errorCode: command.errorCode,
    })
  }
  const versionLine = parseFirstVersionLine(command.stdout)

  return createToolResult({
    toolName: 'ffmpeg',
    status: 'passed',
    required,
    capabilities: ['trim', 'transcode', 'audio_extract', 'encode'],
    summary: versionLine ? `FFmpeg version check passed: ${versionLine}` : 'FFmpeg version check passed.',
    startedAt,
    version: versionLine,
    binaryPath: context.env.ffmpegBin,
  })
}
