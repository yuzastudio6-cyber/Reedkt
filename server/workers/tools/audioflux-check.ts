import { createToolResult, type ToolCheckContext, type ToolReadinessCheckResult } from '../tool-readiness-types'
import { parseFirstVersionLine, runVersionCommand } from './tool-check-utils'

export async function checkAudioFlux(context: ToolCheckContext): Promise<ToolReadinessCheckResult> {
  const startedAt = Date.now()
  const required = context.required ?? false
  const command = await runVersionCommand(
    context.env.pythonBin,
    ['-c', "import audioflux; print(getattr(audioflux, '__version__', 'unknown'))"],
    context.env.toolCheckTimeoutMs,
  )

  if (!command.ok) {
    const nativeRuntimeIncompatible = isNativeRuntimeIncompatible(command.stderr)
    return createToolResult({
      toolName: 'audioflux',
      status: nativeRuntimeIncompatible ? 'blocked' : required ? 'missing' : 'warning',
      required,
      capabilities: ['onset_analysis', 'rhythm_analysis', 'audio_feature_analysis'],
      summary: nativeRuntimeIncompatible
        ? `AudioFlux is installed but its native library is not compatible with this Python runtime architecture: ${command.stderr}`
        : `AudioFlux import check unavailable: ${command.stderr}`,
      startedAt,
      binaryPath: context.env.pythonBin,
      errorCode: nativeRuntimeIncompatible ? 'native_runtime_incompatible' : command.errorCode,
    })
  }

  return createToolResult({
    toolName: 'audioflux',
    status: 'passed',
    required,
    capabilities: ['onset_analysis', 'rhythm_analysis', 'audio_feature_analysis'],
    summary: 'AudioFlux Python import check passed. No audio analysis was executed.',
    startedAt,
    version: parseFirstVersionLine(command.stdout),
    binaryPath: context.env.pythonBin,
  })
}

function isNativeRuntimeIncompatible(stderr: string): boolean {
  const normalized = stderr.toLowerCase()
  return normalized.includes('audioflux/lib/libaudioflux.so') &&
    (
      normalized.includes('cannot open shared object file') ||
      normalized.includes('wrong elf class') ||
      normalized.includes('bad cpu type') ||
      normalized.includes('incompatible architecture')
    )
}
