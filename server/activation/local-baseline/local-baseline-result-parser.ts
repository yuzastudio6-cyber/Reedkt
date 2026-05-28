import {
  isGeneratedFixtureOrToolSkipWarning,
  isViteLargeChunkWarning,
} from './local-baseline-policy'
import type {
  LocalBaselineCommandResult,
  ParseLocalBaselineCommandResultInput,
} from './local-baseline-types'

const outputLimit = 6000

const redactionPatterns: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /sk-[A-Za-z0-9_-]{12,}/g, replacement: '[REDACTED_OPENAI_KEY]' },
  { pattern: /AIza[A-Za-z0-9_-]{20,}/g, replacement: '[REDACTED_GOOGLE_KEY]' },
  { pattern: /ghp_[A-Za-z0-9_]{20,}/g, replacement: '[REDACTED_GITHUB_TOKEN]' },
  { pattern: /(service[_-]?role[_-]?key\s*[:=]\s*)\S+/gi, replacement: '$1[REDACTED]' },
  { pattern: /(password\s*[:=]\s*)\S+/gi, replacement: '$1[REDACTED]' },
  { pattern: /(token\s*[:=]\s*)\S+/gi, replacement: '$1[REDACTED]' },
  { pattern: /(X-Goog-Signature=)[A-Fa-f0-9]+/g, replacement: '$1[REDACTED]' },
  { pattern: /-----BEGIN [^-]+-----[\s\S]+?-----END [^-]+-----/g, replacement: '[REDACTED_PRIVATE_KEY]' },
]

export function parseLocalBaselineCommandResult(input: ParseLocalBaselineCommandResultInput): LocalBaselineCommandResult {
  const outputSummary = redactLocalBaselineOutput([input.stdout, input.stderr].filter(Boolean).join('\n'))
  const warnings: string[] = []

  if (isViteLargeChunkWarning(outputSummary) && input.exitCode === 0) {
    warnings.push('vite_large_chunk_warning')
  }

  if (isGeneratedFixtureOrToolSkipWarning(outputSummary) && input.exitCode === 0) {
    warnings.push('local_fixture_or_tool_skip_safe')
  }

  return {
    commandId: input.commandId,
    npmScript: input.npmScript,
    status: statusForCommandResult(input.exitCode, warnings),
    exitCode: input.exitCode ?? undefined,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    durationMs: input.durationMs,
    outputSummary,
    warnings,
    error: input.error,
  }
}

export function notRunCommandResult(commandId: string, npmScript: string): LocalBaselineCommandResult {
  return {
    commandId,
    npmScript,
    status: 'not_run',
    warnings: [],
  }
}

export function redactLocalBaselineOutput(output: string): string {
  const redacted = redactionPatterns.reduce(
    (current, redaction) => current.replace(redaction.pattern, redaction.replacement),
    output,
  )

  if (redacted.length <= outputLimit) return redacted
  return `${redacted.slice(0, outputLimit)}\n[output truncated by activation local baseline]`
}

function statusForCommandResult(exitCode: number | null, warnings: string[]): LocalBaselineCommandResult['status'] {
  if (exitCode !== 0) return 'failed'
  if (warnings.includes('local_fixture_or_tool_skip_safe')) return 'skipped'
  if (warnings.length > 0) return 'warning'
  return 'passed'
}
