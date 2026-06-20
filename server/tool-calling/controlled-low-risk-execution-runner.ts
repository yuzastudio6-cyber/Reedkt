import {
  execFile,
} from 'node:child_process'
import {
  createRequire,
} from 'node:module'
import {
  promisify,
} from 'node:util'
import type {
  ControlledLowRiskExecutionBoundary,
  ControlledLowRiskProbePolicy,
  ControlledLowRiskProbeResult,
  ControlledLowRiskReadinessProbeRun,
} from './controlled-low-risk-execution-types'
import {
  listControlledLowRiskProbePolicies,
} from './controlled-low-risk-execution-policy'
import {
  validateControlledLowRiskProbeResults,
} from './controlled-low-risk-execution-validator'

const execFileAsync = promisify(execFile)
const nodeRequire = createRequire(import.meta.url)
const MAX_SUMMARY_LINES = 2
const MAX_SUMMARY_CHARS = 600

interface ExecFileErrorLike {
  readonly code?: string | number
  readonly signal?: string
  readonly killed?: boolean
  readonly stdout?: string | Buffer
  readonly stderr?: string | Buffer
}

export const CONTROLLED_LOW_RISK_EXECUTION_BOUNDARY: ControlledLowRiskExecutionBoundary = {
  executesTools: true,
  mediaProcessingPerformed: false,
  realUserMediaUsed: false,
  fixtureInputUsed: false,
  workerExecutionPerformed: false,
  providerCallsPerformed: false,
  supabaseMutationPerformed: false,
  sqlExecuted: false,
  signedUrlsUsed: false,
  publicArtifactsCreated: false,
  packageLockMutated: false,
  betaProductionUnlocked: false,
}

function nowIso(): string {
  return new Date().toISOString()
}

function probeRunId(policy: ControlledLowRiskProbePolicy, startedAtMs: number): string {
  return `controlled_low_risk_probe_run_${policy.probeId}_${startedAtMs.toString(36)}`
}

function stringFromOutput(value: unknown): string {
  if (Buffer.isBuffer(value)) return value.toString('utf8')
  return typeof value === 'string' ? value : ''
}

function sanitizeProbeOutput(value: string): { summary: string | undefined, warnings: string[] } {
  const warnings: string[] = []
  const homeDirectory = process.env.HOME
  let sanitized = value

  if (!sanitized.trim()) {
    return { summary: undefined, warnings }
  }

  if (homeDirectory && sanitized.includes(homeDirectory)) {
    warnings.push('home_directory_redacted')
    sanitized = sanitized.split(homeDirectory).join('[redacted-home]')
  }

  if (/https?:\/\//i.test(sanitized)) {
    warnings.push('url_redacted')
    sanitized = sanitized.replace(/https?:\/\/\S+/gi, '[redacted-url]')
  }

  if (/(?:^|\s)[A-Za-z_][A-Za-z0-9_]*(?:TOKEN|KEY|SECRET|PASSWORD|CREDENTIAL)[A-Za-z0-9_]*=\S+/i.test(sanitized)) {
    warnings.push('env_like_token_redacted')
    sanitized = sanitized.replace(
      /(?:^|\s)[A-Za-z_][A-Za-z0-9_]*(?:TOKEN|KEY|SECRET|PASSWORD|CREDENTIAL)[A-Za-z0-9_]*=\S+/gi,
      ' [redacted-env-token]',
    )
  }

  if (/(?:^|\s)\/(?:Users|Applications|private|tmp|var|opt|usr|bin|sbin|etc|Volumes)\/\S+/i.test(sanitized)) {
    warnings.push('absolute_path_redacted')
    sanitized = sanitized.replace(
      /(?:^|\s)\/(?:Users|Applications|private|tmp|var|opt|usr|bin|sbin|etc|Volumes)\/\S+/gi,
      ' [redacted-path]',
    )
  }

  if (/[A-Za-z]:[\\/]\S+/.test(sanitized)) {
    warnings.push('windows_path_redacted')
    sanitized = sanitized.replace(/[A-Za-z]:[\\/]\S+/g, '[redacted-path]')
  }

  if (/&&|\|\||[|;`<>]|\$\(/.test(sanitized)) {
    warnings.push('shell_metacharacters_redacted')
    sanitized = sanitized.replace(/&&|\|\||[|;`<>]|\$\(/g, '[redacted-shell-token]')
  }

  const summary = sanitized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_SUMMARY_LINES)
    .join(' ')
    .slice(0, MAX_SUMMARY_CHARS)

  return {
    summary: summary || undefined,
    warnings,
  }
}

function firstVersionSummary(stdoutSummary?: string, stderrSummary?: string): string | undefined {
  return stdoutSummary ?? stderrSummary
}

function resultBase(
  policy: ControlledLowRiskProbePolicy,
  input: {
    status: ControlledLowRiskProbeResult['status']
    startedAt: string
    completedAt: string
    durationMs: number
    executableFound: boolean
    packageResolved?: boolean
    versionSummary?: string
    sanitizedStdoutSummary?: string
    sanitizedStderrSummary?: string
    exitCode?: number
    signal?: string
    issues?: readonly string[]
    warnings?: readonly string[]
  },
): ControlledLowRiskProbeResult {
  return {
    probeRunId: probeRunId(policy, Date.parse(input.startedAt)),
    probeId: policy.probeId,
    toolId: policy.toolId,
    probeKind: policy.probeKind,
    status: input.status,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    durationMs: input.durationMs,
    executableFound: input.executableFound,
    packageResolved: input.packageResolved,
    versionSummary: input.versionSummary,
    sanitizedStdoutSummary: input.sanitizedStdoutSummary,
    sanitizedStderrSummary: input.sanitizedStderrSummary,
    exitCode: input.exitCode,
    signal: input.signal,
    issues: input.issues ?? [],
    warnings: input.warnings ?? [],
    networkUsed: false,
    stdinUsed: false,
    shellUsed: false,
    arbitraryArgsUsed: false,
    mediaInputUsed: false,
    realUserMediaUsed: false,
    fixtureInputUsed: false,
    workerExecutionPerformed: false,
    providerCallsPerformed: false,
    supabaseMutationPerformed: false,
    sqlExecuted: false,
    signedUrlsUsed: false,
    publicArtifactsCreated: false,
    packageLockMutated: false,
    betaProductionUnlocked: false,
    executesTools: true,
    mediaProcessingPerformed: false,
  }
}

function elapsedSince(startedAtMs: number): { completedAt: string, durationMs: number } {
  const completedAtMs = Date.now()
  return {
    completedAt: new Date(completedAtMs).toISOString(),
    durationMs: Math.max(0, completedAtMs - startedAtMs),
  }
}

function errorCode(error: unknown): string | number | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as ExecFileErrorLike).code
  }

  return undefined
}

function errorSignal(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'signal' in error) {
    return (error as ExecFileErrorLike).signal
  }

  return undefined
}

function isMissingExecutable(error: unknown): boolean {
  return errorCode(error) === 'ENOENT'
}

function isTimedOut(error: unknown): boolean {
  return Boolean(error && typeof error === 'object' && (error as ExecFileErrorLike).killed)
}

async function runExecFileProbe(policy: ControlledLowRiskProbePolicy): Promise<ControlledLowRiskProbeResult> {
  const startedAtMs = Date.now()
  const startedAt = nowIso()
  const executableName = policy.executableName

  if (!executableName || !policy.exactArgs) {
    const elapsed = elapsedSince(startedAtMs)
    return resultBase(policy, {
      status: 'skipped_by_policy',
      startedAt,
      ...elapsed,
      executableFound: false,
      issues: ['exec_file_policy_missing_executable_or_args'],
    })
  }

  try {
    const output = await execFileAsync(executableName, [...policy.exactArgs], {
      timeout: policy.timeoutMs,
      windowsHide: true,
      shell: false,
      maxBuffer: policy.maxBufferBytes ?? 256 * 1024,
    })
    const stdout = sanitizeProbeOutput(stringFromOutput(output.stdout))
    const stderr = sanitizeProbeOutput(stringFromOutput(output.stderr))
    const warnings = [...stdout.warnings, ...stderr.warnings]
    const elapsed = elapsedSince(startedAtMs)
    const status = warnings.includes('shell_metacharacters_redacted') ? 'failed_closed' : 'passed'

    return resultBase(policy, {
      status,
      startedAt,
      ...elapsed,
      executableFound: true,
      sanitizedStdoutSummary: stdout.summary,
      sanitizedStderrSummary: stderr.summary,
      versionSummary: firstVersionSummary(stdout.summary, stderr.summary),
      exitCode: 0,
      issues: status === 'failed_closed' ? ['unsafe_output_redacted'] : [],
      warnings,
    })
  } catch (error) {
    const errorLike = error as ExecFileErrorLike
    const stdout = sanitizeProbeOutput(stringFromOutput(errorLike.stdout))
    const stderr = sanitizeProbeOutput(stringFromOutput(errorLike.stderr))
    const elapsed = elapsedSince(startedAtMs)

    if (isMissingExecutable(error)) {
      return resultBase(policy, {
        status: 'unavailable',
        startedAt,
        ...elapsed,
        executableFound: false,
        sanitizedStdoutSummary: stdout.summary,
        sanitizedStderrSummary: stderr.summary,
        signal: errorSignal(error),
        issues: ['executable_unavailable'],
        warnings: [...stdout.warnings, ...stderr.warnings],
      })
    }

    return resultBase(policy, {
      status: 'failed_closed',
      startedAt,
      ...elapsed,
      executableFound: true,
      sanitizedStdoutSummary: stdout.summary,
      sanitizedStderrSummary: stderr.summary,
      exitCode: typeof errorLike.code === 'number' ? errorLike.code : undefined,
      signal: errorSignal(error),
      issues: [isTimedOut(error) ? 'probe_timeout_failed_closed' : 'probe_exit_failed_closed'],
      warnings: [...stdout.warnings, ...stderr.warnings],
    })
  }
}

async function runPackageResolutionProbe(policy: ControlledLowRiskProbePolicy): Promise<ControlledLowRiskProbeResult> {
  const startedAtMs = Date.now()
  const startedAt = nowIso()
  const packageName = policy.packageName

  if (!packageName) {
    const elapsed = elapsedSince(startedAtMs)
    return resultBase(policy, {
      status: 'skipped_by_policy',
      startedAt,
      ...elapsed,
      executableFound: false,
      packageResolved: false,
      issues: ['package_resolution_policy_missing_package_name'],
    })
  }

  try {
    nodeRequire.resolve(`${packageName}/package.json`)
    const elapsed = elapsedSince(startedAtMs)

    return resultBase(policy, {
      status: 'passed',
      startedAt,
      ...elapsed,
      executableFound: false,
      packageResolved: true,
      versionSummary: `${packageName} package metadata is resolvable.`,
      sanitizedStdoutSummary: `${packageName} package metadata is resolvable.`,
    })
  } catch (error) {
    const elapsed = elapsedSince(startedAtMs)
    const code = errorCode(error)
    const status = code === 'MODULE_NOT_FOUND' ? 'unavailable' : 'skipped_by_policy'

    return resultBase(policy, {
      status,
      startedAt,
      ...elapsed,
      executableFound: false,
      packageResolved: false,
      issues: [status === 'unavailable' ? 'package_unavailable' : 'package_resolution_skipped_by_policy'],
    })
  }
}

export async function runControlledLowRiskProbe(
  policy: ControlledLowRiskProbePolicy,
): Promise<ControlledLowRiskProbeResult> {
  if (policy.executionMethod === 'exec_file_no_shell') {
    return runExecFileProbe(policy)
  }

  return runPackageResolutionProbe(policy)
}

export async function runControlledLowRiskProbes(
  policies: readonly ControlledLowRiskProbePolicy[] = listControlledLowRiskProbePolicies(),
): Promise<ControlledLowRiskProbeResult[]> {
  const results: ControlledLowRiskProbeResult[] = []

  for (const policy of policies) {
    results.push(await runControlledLowRiskProbe(policy))
  }

  return results
}

export async function runControlledLowRiskReadinessProbes(): Promise<ControlledLowRiskReadinessProbeRun> {
  const probePolicies = listControlledLowRiskProbePolicies()
  const probeResults = await runControlledLowRiskProbes(probePolicies)
  const validationSummary = validateControlledLowRiskProbeResults(probeResults, probePolicies)

  return {
    probePolicies,
    probeResults,
    validationSummary,
    executionBoundary: CONTROLLED_LOW_RISK_EXECUTION_BOUNDARY,
  }
}
