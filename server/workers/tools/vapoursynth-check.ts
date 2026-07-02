import { createToolResult, type ToolCheckContext, type ToolReadinessCheckResult } from '../tool-readiness-types'
import { parseFirstVersionLine, runVersionCommand } from './tool-check-utils'

export async function checkVapourSynth(context: ToolCheckContext): Promise<ToolReadinessCheckResult> {
  const startedAt = Date.now()
  const required = context.required ?? false
  const command = await runVersionCommand(
    context.env.pythonBin,
    ['-c', "import vapoursynth; print(getattr(vapoursynth, '__version__', 'unknown'))"],
    context.env.toolCheckTimeoutMs,
  )

  if (!command.ok) {
    return createToolResult({
      toolName: 'vapoursynth',
      status: required ? 'missing' : 'warning',
      required,
      capabilities: ['frame_pipeline_future'],
      summary: `VapourSynth import check unavailable: ${command.stderr}`,
      startedAt,
      binaryPath: context.env.pythonBin,
      errorCode: command.errorCode,
    })
  }

  return createToolResult({
    toolName: 'vapoursynth',
    status: 'passed',
    required,
    capabilities: ['frame_pipeline_future'],
    summary: 'VapourSynth Python import check passed. No plugins or media processing were executed.',
    startedAt,
    version: parseFirstVersionLine(command.stdout),
    binaryPath: context.env.pythonBin,
  })
}
