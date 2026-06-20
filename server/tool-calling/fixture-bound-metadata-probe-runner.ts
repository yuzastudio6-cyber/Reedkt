import {
  execFile,
} from 'node:child_process'
import {
  createHash,
} from 'node:crypto'
import {
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import {
  tmpdir,
} from 'node:os'
import {
  join,
} from 'node:path'
import {
  promisify,
} from 'node:util'
import type {
  BinaryFixtureArtifactSummary,
  BinaryFixtureGenerationPlan,
  BinaryFixtureGenerationResult,
} from './binary-fixture-generation-types'
import {
  generateBinaryFixtureArtifactBuffer,
} from './binary-fixture-generators'
import {
  listFixtureBoundMetadataProbePolicies,
} from './fixture-bound-metadata-probe-policy'
import type {
  FixtureBoundMetadataProbeExecutionBoundary,
  FixtureBoundMetadataProbePolicy,
  FixtureBoundMetadataProbeResult,
  FixtureBoundMetadataProbeRun,
  FixtureBoundSanitizedMetadataSummary,
} from './fixture-bound-metadata-probe-types'
import {
  validateFixtureBoundMetadataProbeResults,
} from './fixture-bound-metadata-probe-validator'

const execFileAsync = promisify(execFile)

interface ExecFileErrorLike {
  readonly code?: string | number
  readonly signal?: string
  readonly killed?: boolean
  readonly stdout?: string | Buffer
  readonly stderr?: string | Buffer
}

interface FFprobeStream {
  readonly codec_type?: string
  readonly sample_rate?: string
  readonly channels?: number
  readonly duration?: string
  readonly bit_rate?: string
}

interface FFprobeFormat {
  readonly format_name?: string
  readonly duration?: string
  readonly bit_rate?: string
}

interface FFprobeJson {
  readonly streams?: readonly FFprobeStream[]
  readonly format?: FFprobeFormat
}

interface SelectedFixtureArtifact {
  readonly result: BinaryFixtureGenerationResult
  readonly summary: BinaryFixtureArtifactSummary
  readonly plan: BinaryFixtureGenerationPlan
}

export const FIXTURE_BOUND_METADATA_PROBE_EXECUTION_BOUNDARY: FixtureBoundMetadataProbeExecutionBoundary = {
  executesTools: true,
  fixtureInputUsed: true,
  metadataProbePerformed: false,
  mediaProcessingPerformed: false,
  realUserMediaUsed: false,
  signedUrlsUsed: false,
  shellUsed: false,
  arbitraryArgsUsed: false,
  workerExecutionPerformed: false,
  providerCallsPerformed: false,
  supabaseMutationPerformed: false,
  sqlExecuted: false,
  packageLockMutated: false,
  betaProductionUnlocked: false,
}

function nowIso(): string {
  return new Date().toISOString()
}

function probeRunId(policy: FixtureBoundMetadataProbePolicy, startedAtMs: number): string {
  return `fixture_bound_metadata_probe_run_${policy.probeId}_${startedAtMs.toString(36)}`
}

function sha256Buffer(buffer: Buffer): string {
  return createHash('sha256').update(buffer).digest('hex')
}

function stringFromOutput(value: unknown): string {
  if (Buffer.isBuffer(value)) return value.toString('utf8')
  return typeof value === 'string' ? value : ''
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

function sanitizeTextSummary(value: string): { summary: string | undefined, warnings: string[] } {
  const warnings: string[] = []
  const homeDirectory = process.env.HOME
  let sanitized = value

  if (!sanitized.trim()) return { summary: undefined, warnings }

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
    .slice(0, 2)
    .join(' ')
    .slice(0, 600)

  return {
    summary: summary || undefined,
    warnings,
  }
}

function numericString(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function safeFormatName(value: string | undefined): string | undefined {
  if (!value || !/^[a-z0-9_,.-]+$/i.test(value)) return undefined
  return value.slice(0, 80)
}

function summarizeFFprobeJson(stdout: string): FixtureBoundSanitizedMetadataSummary {
  const parsed = JSON.parse(stdout) as FFprobeJson
  const streams = Array.isArray(parsed.streams) ? parsed.streams : []
  const audioStreams = streams.filter((stream) => stream.codec_type === 'audio')
  const videoStreams = streams.filter((stream) => stream.codec_type === 'video')
  const primaryAudio = audioStreams[0]
  const codecTypes = [...new Set(streams
    .map((stream) => stream.codec_type)
    .filter((value): value is string => typeof value === 'string' && /^[a-z0-9_]+$/i.test(value)))]
    .sort()
  const durationSeconds = numericString(parsed.format?.duration) ?? numericString(primaryAudio?.duration)
  const bitRate = numericString(parsed.format?.bit_rate) ?? numericString(primaryAudio?.bit_rate)
  const sampleRate = numericString(primaryAudio?.sample_rate)
  const probeOutputBytes = Buffer.byteLength(stdout, 'utf8')
  const metadataShapeValid = streams.length > 0 && audioStreams.length >= 1 && videoStreams.length === 0

  return {
    formatName: safeFormatName(parsed.format?.format_name),
    durationSeconds,
    streamCount: streams.length,
    audioStreamCount: audioStreams.length,
    videoStreamCount: videoStreams.length,
    codecTypes,
    sampleRate,
    channels: primaryAudio?.channels,
    bitRate,
    probeOutputBytes,
    metadataShapeValid,
  }
}

function resultBase(
  policy: FixtureBoundMetadataProbePolicy,
  selected: SelectedFixtureArtifact | undefined,
  input: {
    status: FixtureBoundMetadataProbeResult['status']
    startedAt: string
    completedAt: string
    durationMs: number
    executableFound: boolean
    metadataProbePerformed: boolean
    sanitizedMetadataSummary?: FixtureBoundSanitizedMetadataSummary
    sanitizedStdoutSummary?: string
    sanitizedStderrSummary?: string
    exitCode?: number
    signal?: string
    issues?: readonly string[]
    warnings?: readonly string[]
  },
): FixtureBoundMetadataProbeResult {
  return {
    probeRunId: probeRunId(policy, Date.parse(input.startedAt)),
    probeId: policy.probeId,
    toolId: policy.toolId,
    fixtureId: selected?.summary.fixtureId ?? 'unavailable_synthetic_audio_fixture',
    fixtureKind: 'synthetic_audio',
    fixtureContentType: 'audio/wav',
    sourceGenerationRunId: selected?.result.generationResultId ?? 'unavailable_binary_fixture_generation_result',
    sourceArtifactId: selected?.summary.artifactSummaryId ?? 'unavailable_binary_fixture_artifact',
    status: input.status,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
    durationMs: input.durationMs,
    executableFound: input.executableFound,
    fixtureInputUsed: true,
    realUserMediaUsed: false,
    signedUrlsUsed: false,
    shellUsed: false,
    arbitraryArgsUsed: false,
    workerExecutionPerformed: false,
    providerCallsPerformed: false,
    supabaseMutationPerformed: false,
    sqlExecuted: false,
    packageLockMutated: false,
    betaProductionUnlocked: false,
    mediaProcessingPerformed: false,
    metadataProbePerformed: input.metadataProbePerformed,
    exitCode: input.exitCode,
    signal: input.signal,
    sanitizedMetadataSummary: input.sanitizedMetadataSummary,
    sanitizedStdoutSummary: input.sanitizedStdoutSummary,
    sanitizedStderrSummary: input.sanitizedStderrSummary,
    issues: input.issues ?? [],
    warnings: input.warnings ?? [],
    tempWorkspaceCreated: true,
    tempWorkspaceCleanedUp: true,
    executesTools: true,
  }
}

function selectAudioFixtureArtifact(
  generationResults: readonly BinaryFixtureGenerationResult[],
  generationPlans: readonly BinaryFixtureGenerationPlan[],
): SelectedFixtureArtifact | undefined {
  for (const result of generationResults) {
    const summary = result.artifactSummaries.find((artifact) => (
      artifact.fixtureKind === 'synthetic_audio' &&
      artifact.contentType === 'audio/wav' &&
      artifact.generatedBinary === true &&
      artifact.tempPathExposed === false &&
      artifact.committedToRepo === false
    ))
    if (!summary) continue

    const plan = generationPlans.find((candidate) => candidate.generationPlanId === result.generationPlanId)
    if (!plan) continue

    return { result, summary, plan }
  }

  return undefined
}

export async function runFixtureBoundMetadataProbe(
  policy: FixtureBoundMetadataProbePolicy,
  binaryFixtureGenerationResults: readonly BinaryFixtureGenerationResult[],
  binaryFixtureGenerationPlans: readonly BinaryFixtureGenerationPlan[],
): Promise<FixtureBoundMetadataProbeResult> {
  const startedAtMs = Date.now()
  const startedAt = nowIso()
  const selected = selectAudioFixtureArtifact(binaryFixtureGenerationResults, binaryFixtureGenerationPlans)
  const workspace = await mkdtemp(join(tmpdir(), 'reeditpro-fixture-bound-metadata-probe-'))

  try {
    if (!selected) {
      const elapsed = elapsedSince(startedAtMs)
      return resultBase(policy, undefined, {
        status: 'failed_closed',
        startedAt,
        ...elapsed,
        executableFound: false,
        metadataProbePerformed: false,
        issues: ['synthetic_audio_fixture_unavailable'],
      })
    }

    const sourceArtifact = selected.plan.sourceDryRunArtifacts.find((artifact) => (
      artifact.dryRunArtifactId === selected.summary.sourceDryRunArtifactId &&
      artifact.fixtureKind === 'synthetic_audio'
    ))
    if (!sourceArtifact) {
      const elapsed = elapsedSince(startedAtMs)
      return resultBase(policy, selected, {
        status: 'failed_closed',
        startedAt,
        ...elapsed,
        executableFound: false,
        metadataProbePerformed: false,
        issues: ['synthetic_audio_source_artifact_unavailable'],
      })
    }

    const generated = generateBinaryFixtureArtifactBuffer(sourceArtifact)
    if (
      generated.contentType !== 'audio/wav' ||
      generated.generatedBinary !== true ||
      sha256Buffer(generated.contentBuffer) !== selected.summary.checksum
    ) {
      const elapsed = elapsedSince(startedAtMs)
      return resultBase(policy, selected, {
        status: 'failed_closed',
        startedAt,
        ...elapsed,
        executableFound: false,
        metadataProbePerformed: false,
        issues: ['synthetic_audio_fixture_checksum_or_content_type_mismatch'],
      })
    }

    const internalFixturePath = join(workspace, 'generated-synthetic-audio.wav')
    await writeFile(internalFixturePath, generated.contentBuffer)
    const readbackBuffer = await readFile(internalFixturePath)
    if (
      readbackBuffer.byteLength !== selected.summary.sizeBytes ||
      sha256Buffer(readbackBuffer) !== selected.summary.checksum
    ) {
      const elapsed = elapsedSince(startedAtMs)
      return resultBase(policy, selected, {
        status: 'failed_closed',
        startedAt,
        ...elapsed,
        executableFound: false,
        metadataProbePerformed: false,
        issues: ['synthetic_audio_fixture_readback_mismatch'],
      })
    }

    try {
      const output = await execFileAsync(policy.executableName, [...policy.exactArgPrefix, internalFixturePath], {
        timeout: policy.timeoutMs,
        windowsHide: true,
        shell: false,
        maxBuffer: policy.maxBufferBytes,
      })
      const stdoutRaw = stringFromOutput(output.stdout)
      const stderr = sanitizeTextSummary(stringFromOutput(output.stderr))
      const metadataSummary = summarizeFFprobeJson(stdoutRaw)
      const elapsed = elapsedSince(startedAtMs)
      const issues = metadataSummary.videoStreamCount > 0 || !metadataSummary.metadataShapeValid
        ? ['synthetic_audio_metadata_shape_invalid']
        : []
      const status = issues.length > 0 ? 'failed_closed' : 'passed'

      return resultBase(policy, selected, {
        status,
        startedAt,
        ...elapsed,
        executableFound: true,
        metadataProbePerformed: status === 'passed',
        sanitizedMetadataSummary: metadataSummary,
        sanitizedStdoutSummary: `ffprobe metadata parsed, streams=${metadataSummary.streamCount}, audio=${metadataSummary.audioStreamCount}, video=${metadataSummary.videoStreamCount}, bytes=${metadataSummary.probeOutputBytes}`,
        sanitizedStderrSummary: stderr.summary,
        exitCode: 0,
        issues,
        warnings: stderr.warnings,
      })
    } catch (error) {
      const errorLike = error as ExecFileErrorLike
      const stdout = sanitizeTextSummary(stringFromOutput(errorLike.stdout))
      const stderr = sanitizeTextSummary(stringFromOutput(errorLike.stderr))
      const elapsed = elapsedSince(startedAtMs)

      if (isMissingExecutable(error)) {
        return resultBase(policy, selected, {
          status: 'unavailable',
          startedAt,
          ...elapsed,
          executableFound: false,
          metadataProbePerformed: false,
          sanitizedStdoutSummary: stdout.summary,
          sanitizedStderrSummary: stderr.summary,
          signal: errorSignal(error),
          issues: ['ffprobe_unavailable'],
          warnings: [...stdout.warnings, ...stderr.warnings],
        })
      }

      return resultBase(policy, selected, {
        status: 'failed_closed',
        startedAt,
        ...elapsed,
        executableFound: true,
        metadataProbePerformed: false,
        sanitizedStdoutSummary: stdout.summary,
        sanitizedStderrSummary: stderr.summary,
        exitCode: typeof errorLike.code === 'number' ? errorLike.code : undefined,
        signal: errorSignal(error),
        issues: [isTimedOut(error) ? 'ffprobe_timeout_failed_closed' : 'ffprobe_exit_or_parse_failed_closed'],
        warnings: [...stdout.warnings, ...stderr.warnings],
      })
    }
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
}

export async function runFixtureBoundMetadataProbes(
  binaryFixtureGenerationResults: readonly BinaryFixtureGenerationResult[],
  binaryFixtureGenerationPlans: readonly BinaryFixtureGenerationPlan[],
  policies: readonly FixtureBoundMetadataProbePolicy[] = listFixtureBoundMetadataProbePolicies(),
): Promise<FixtureBoundMetadataProbeResult[]> {
  const results: FixtureBoundMetadataProbeResult[] = []

  for (const policy of policies) {
    results.push(await runFixtureBoundMetadataProbe(
      policy,
      binaryFixtureGenerationResults,
      binaryFixtureGenerationPlans,
    ))
  }

  return results
}

export async function runFixtureBoundMetadataProbeStack(
  binaryFixtureGenerationResults: readonly BinaryFixtureGenerationResult[],
  binaryFixtureGenerationPlans: readonly BinaryFixtureGenerationPlan[],
): Promise<Omit<FixtureBoundMetadataProbeRun, 'binaryFixtureGenerationPlans' | 'binaryFixtureGenerationResults'>> {
  const probePolicies = listFixtureBoundMetadataProbePolicies()
  const probeResults = await runFixtureBoundMetadataProbes(
    binaryFixtureGenerationResults,
    binaryFixtureGenerationPlans,
    probePolicies,
  )
  const validationSummary = validateFixtureBoundMetadataProbeResults(probeResults, probePolicies)

  return {
    probePolicies,
    probeResults,
    validationSummary,
    executionBoundary: {
      ...FIXTURE_BOUND_METADATA_PROBE_EXECUTION_BOUNDARY,
      metadataProbePerformed: probeResults.some((result) => result.metadataProbePerformed),
    },
    executesTools: true,
  }
}
