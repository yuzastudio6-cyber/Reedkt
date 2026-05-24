import { createToolResult, type ToolCheckContext, type ToolReadinessCheckResult } from '../tool-readiness-types'

export async function checkPySceneDetect(context: ToolCheckContext): Promise<ToolReadinessCheckResult> {
  const startedAt = Date.now()
  const required = context.required ?? false

  return createToolResult({
    toolName: 'pyscenedetect',
    status: required ? 'missing' : 'warning',
    required,
    capabilities: ['scene_detection_future', 'shot_boundary_detection_future'],
    summary: 'PySceneDetect runtime is not configured in this milestone. No video analysis or media processing was executed.',
    startedAt,
    binaryPath: context.env.pythonBin,
    errorCode: 'planned_not_configured',
  })
}
