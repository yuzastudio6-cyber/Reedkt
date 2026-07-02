import { createToolResult, type ToolCheckContext, type ToolReadinessCheckResult } from '../tool-readiness-types'
import { resolveOptionalPackage } from './tool-check-utils'

export async function checkPlaywright(context: ToolCheckContext): Promise<ToolReadinessCheckResult> {
  const startedAt = Date.now()
  const required = context.required ?? false
  const resolved = resolveOptionalPackage('playwright')
  if (!resolved.resolved) {
    return createToolResult({
      toolName: 'playwright',
      status: required ? 'missing' : 'warning',
      required,
      capabilities: ['browser_capture_future', 'visual_regression_future'],
      summary: 'Playwright package is not installed; browser capture readiness remains unavailable.',
      startedAt,
      binaryPath: context.env.playwrightBin,
      errorCode: resolved.errorCode,
    })
  }

  return createToolResult({
    toolName: 'playwright',
    status: 'passed',
    required,
    capabilities: ['browser_capture_future', 'visual_regression_future'],
    summary: 'Playwright package is resolvable. No browser was opened.',
    startedAt,
    version: resolved.version,
    binaryPath: context.env.playwrightBin,
  })
}
