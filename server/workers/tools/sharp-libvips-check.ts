import { createToolResult, type ToolCheckContext, type ToolReadinessCheckResult } from '../tool-readiness-types'
import { resolveOptionalPackage } from './tool-check-utils'

export async function checkSharpLibvips(context: ToolCheckContext): Promise<ToolReadinessCheckResult> {
  const startedAt = Date.now()
  const required = context.required ?? false
  const resolved = resolveOptionalPackage('sharp')
  if (!resolved.resolved) {
    return createToolResult({
      toolName: 'sharp_libvips',
      status: required ? 'missing' : 'warning',
      required,
      capabilities: ['thumbnail', 'resize', 'overlay_image_prep'],
      summary: 'Sharp/libvips package is not installed; image worker readiness remains unavailable.',
      startedAt,
      errorCode: resolved.errorCode,
    })
  }

  return createToolResult({
    toolName: 'sharp_libvips',
    status: 'passed',
    required,
    capabilities: ['thumbnail', 'resize', 'overlay_image_prep'],
    summary: 'Sharp package is resolvable. No image processing was executed.',
    startedAt,
    version: resolved.version,
  })
}
