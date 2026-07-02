import { createToolResult, type ToolCheckContext, type ToolReadinessCheckResult } from '../tool-readiness-types'
import { parseFirstVersionLine, runVersionCommand } from './tool-check-utils'

export async function checkOpenCV(context: ToolCheckContext): Promise<ToolReadinessCheckResult> {
  const startedAt = Date.now()
  const required = context.required ?? false
  const command = await runVersionCommand(
    context.env.pythonBin,
    ['-c', "import cv2; print(getattr(cv2, '__version__', 'unknown'))"],
    context.env.toolCheckTimeoutMs,
  )

  if (!command.ok) {
    return createToolResult({
      toolName: 'opencv',
      status: required ? 'missing' : 'warning',
      required,
      capabilities: ['visual_qa', 'face_safe_zone_future', 'frame_analysis_future'],
      summary: `OpenCV import check unavailable: ${command.stderr}`,
      startedAt,
      binaryPath: context.env.pythonBin,
      errorCode: command.errorCode,
    })
  }

  return createToolResult({
    toolName: 'opencv',
    status: 'passed',
    required,
    capabilities: ['visual_qa', 'face_safe_zone_future', 'frame_analysis_future'],
    summary: 'OpenCV Python import check passed. No media processing was executed.',
    startedAt,
    version: parseFirstVersionLine(command.stdout),
    binaryPath: context.env.pythonBin,
  })
}
