import { createToolResult, type ToolCheckContext, type ToolReadinessCheckResult } from '../tool-readiness-types'
import { resolveOptionalPackage } from './tool-check-utils'

export async function checkRemotion(context: ToolCheckContext): Promise<ToolReadinessCheckResult> {
  const startedAt = Date.now()
  const required = context.required ?? false
  const resolved = resolveOptionalPackage('remotion')
  if (!resolved.resolved) {
    return createToolResult({
      toolName: 'remotion',
      status: required ? 'missing' : 'warning',
      required,
      capabilities: ['composition_runtime', 'future_render_worker'],
      summary: 'Remotion package is not installed; render readiness remains unavailable.',
      startedAt,
      binaryPath: context.env.remotionBin,
      errorCode: resolved.errorCode,
    })
  }

  return createToolResult({
    toolName: 'remotion',
    status: 'passed',
    required,
    capabilities: ['composition_runtime', 'future_render_worker'],
    summary: 'Remotion package is resolvable. No render was executed.',
    startedAt,
    version: resolved.version,
    binaryPath: context.env.remotionBin,
  })
}
