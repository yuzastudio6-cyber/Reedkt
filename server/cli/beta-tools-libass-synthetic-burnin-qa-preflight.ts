import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'
import type { BetaReadinessEvidencePacketInput } from '../beta-readiness/beta-readiness-evidence-store'
import type { ToolBetaAcceptedExecutionEvidence } from '../beta-readiness'

export interface BetaToolsLibassSyntheticBurninQaPreflightEnv {
  REEDITPRO_BETA_LIBASS_BURNIN_QA_WORKSPACE_ID?: string
  REEDITPRO_BETA_LIBASS_BURNIN_QA_PROJECT_ID?: string
  REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_ID?: string
  REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_SHA?: string
  REEDITPRO_BETA_LIBASS_BURNIN_QA_NOTES?: string
  REEDITPRO_BETA_LIBASS_BURNIN_QA_MODE?: string
  REEDITPRO_BETA_LIBASS_BURNIN_QA_CONTAINER_IMAGE?: string
  REEDITPRO_BETA_LIBASS_BURNIN_QA_TIMEOUT_MS?: string
  REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCTION_READINESS?: string
  REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE?: string
  REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE?: string
  REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE?: string
  REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCT_READY_LOCAL_OSS?: string
  REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE?: string
  REEDITPRO_BETA_LIBASS_BURNIN_QA_REQUIRE_ACCEPTED_EVIDENCE?: string
  REEDITPRO_BETA_LIBASS_BURNIN_QA_RETAIN_TEMP_OUTPUTS?: string
}

export interface LibassSyntheticBurninCommandRecord {
  step: 'font_discovery' | 'synthetic_video' | 'caption_burnin' | 'decode_probe'
  command: string
  args: string[]
  exitOk: boolean
  stdoutSnippet: string
  stderrSnippet: string
  failureMessage?: string
}

export interface LibassSyntheticBurninQaProof {
  runId: string
  mode: 'host' | 'docker'
  containerImage?: string
  syntheticOnly: true
  tempRoot: string
  tempRootRemoved: boolean
  inputVideo: {
    fileName: 'synthetic-caption-source.mp4'
    exists: boolean
    sizeBytes: number
    checksumSha256?: string
  }
  captionFile: {
    fileName: 'synthetic-captions.ass'
    exists: boolean
    sizeBytes: number
    checksumSha256?: string
    safeStylePresetAccepted: boolean
  }
  outputVideo: {
    fileName: 'synthetic-libass-burnin-output.mp4'
    exists: boolean
    sizeBytes: number
    checksumSha256?: string
    durationSeconds?: number
  }
  fontDiscoveryOk: boolean
  burninCommandOk: boolean
  decodeProbeOk: boolean
  noPrivateOrUserMedia: true
  noNetwork: boolean
  commandRecords: LibassSyntheticBurninCommandRecord[]
  failureMessage?: string
}

export interface BetaToolsLibassSyntheticBurninQaPreflightReport {
  ok: boolean
  previewOnly: true
  readyToRecordAcceptedEvidence: boolean
  duplicateContext: {
    openHistoricalPr: number
    url: string
    classification: 'historical_activation_private_media_context_not_current_beta_source_truth'
    reason: string
  }
  proof: LibassSyntheticBurninQaProof
  acceptedToolEvidence: ToolBetaAcceptedExecutionEvidence[]
  evidencePacket?: BetaReadinessEvidencePacketInput
  missingConfiguration: string[]
  confirmationGaps: string[]
  secretLikeInputPaths: string[]
  wouldReduceBlockers: string[]
  remainingBlockers: string[]
  nextSafeAction: string
  warnings: string[]
}

export type LibassSyntheticBurninCommandRunner = (
  command: string,
  args: string[],
  options: { timeoutMs: number },
) => { stdout?: string | Buffer; stderr?: string | Buffer }

export function runBetaToolsLibassSyntheticBurninQaPreflight(
  env: BetaToolsLibassSyntheticBurninQaPreflightEnv,
  runner: LibassSyntheticBurninCommandRunner = defaultRunner,
): BetaToolsLibassSyntheticBurninQaPreflightReport {
  const mode = parseMode(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_MODE)
  const missingConfiguration = missingRequiredConfiguration(env, mode)
  const confirmationGaps = confirmationGapsFor(env)
  const secretLikeInputPaths = collectSecretLikePaths({
    workspaceId: env.REEDITPRO_BETA_LIBASS_BURNIN_QA_WORKSPACE_ID,
    projectId: env.REEDITPRO_BETA_LIBASS_BURNIN_QA_PROJECT_ID,
    sourceId: env.REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_ID,
    sourceSha: env.REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_SHA,
    notes: env.REEDITPRO_BETA_LIBASS_BURNIN_QA_NOTES,
    containerImage: env.REEDITPRO_BETA_LIBASS_BURNIN_QA_CONTAINER_IMAGE,
  }, 'betaToolsLibassSyntheticBurninQaPreflight')
  const blockedBeforeCommand = missingConfiguration.length > 0 ||
    confirmationGaps.length > 0 ||
    secretLikeInputPaths.length > 0

  if (blockedBeforeCommand) {
    return buildReport({
      env,
      proof: emptyProof(mode, env.REEDITPRO_BETA_LIBASS_BURNIN_QA_CONTAINER_IMAGE),
      missingConfiguration,
      confirmationGaps,
      secretLikeInputPaths,
    })
  }

  const proof = runSyntheticBurninProof(env, mode, runner)
  return buildReport({
    env,
    proof,
    missingConfiguration,
    confirmationGaps,
    secretLikeInputPaths,
  })
}

function buildReport(input: {
  env: BetaToolsLibassSyntheticBurninQaPreflightEnv
  proof: LibassSyntheticBurninQaProof
  missingConfiguration: string[]
  confirmationGaps: string[]
  secretLikeInputPaths: string[]
}): BetaToolsLibassSyntheticBurninQaPreflightReport {
  const proofPassed = input.proof.burninCommandOk &&
    input.proof.decodeProbeOk &&
    input.proof.captionFile.safeStylePresetAccepted &&
    input.proof.outputVideo.exists &&
    input.proof.outputVideo.sizeBytes > 0 &&
    input.proof.tempRootRemoved
  const boundedAccepted = proofPassed &&
    parseBoolean(input.env.REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE) &&
    parseBoolean(input.env.REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE)
  const productReadyAccepted = proofPassed &&
    parseBoolean(input.env.REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCTION_READINESS) &&
    parseBoolean(input.env.REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE) &&
    parseBoolean(input.env.REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCT_READY_LOCAL_OSS) &&
    parseBoolean(input.env.REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE)
  const acceptedToolEvidence = boundedAccepted || productReadyAccepted
    ? [buildAcceptedEvidence(input.env, input.proof, productReadyAccepted)]
    : []
  const evidencePacket = acceptedToolEvidence.length > 0
    ? {
      workspaceId: requiredEnv(input.env, 'REEDITPRO_BETA_LIBASS_BURNIN_QA_WORKSPACE_ID'),
      projectId: clean(input.env.REEDITPRO_BETA_LIBASS_BURNIN_QA_PROJECT_ID),
      acceptedToolEvidence,
    }
    : undefined
  const readyToRecordAcceptedEvidence = acceptedToolEvidence.length > 0 &&
    input.missingConfiguration.length === 0 &&
    input.confirmationGaps.length === 0 &&
    input.secretLikeInputPaths.length === 0
  const requireAcceptedEvidence = parseBoolean(input.env.REEDITPRO_BETA_LIBASS_BURNIN_QA_REQUIRE_ACCEPTED_EVIDENCE)

  return {
    ok: readyToRecordAcceptedEvidence && (!requireAcceptedEvidence || acceptedToolEvidence.length > 0),
    previewOnly: true,
    readyToRecordAcceptedEvidence,
    duplicateContext: {
      openHistoricalPr: 73,
      url: 'https://github.com/yuzastudio6-cyber/Reedkt/pull/73',
      classification: 'historical_activation_private_media_context_not_current_beta_source_truth',
      reason: 'PR #73 targets an old activation base and references private GCS artifacts; this modern preflight keeps synthetic-only current-source evidence instead of duplicating or merging the private-media lane.',
    },
    proof: input.proof,
    acceptedToolEvidence,
    evidencePacket,
    missingConfiguration: input.missingConfiguration,
    confirmationGaps: input.confirmationGaps,
    secretLikeInputPaths: input.secretLikeInputPaths,
    wouldReduceBlockers: acceptedToolEvidence.length > 0
      ? ['real_execution_not_verified', 'production_readiness_blocked', 'product_ready_acceptance_missing']
      : [],
    remainingBlockers: acceptedToolEvidence.length > 0
      ? ['deployed_staging_evidence_recording_pending', 'platform_billing_deployment_unverified']
      : ['real_execution_not_verified', 'production_readiness_blocked', 'product_ready_acceptance_missing'],
    nextSafeAction: acceptedToolEvidence.length > 0
      ? 'Record this libass QA evidence packet through the authenticated beta readiness evidence endpoint, then verify deployed staging status before any external beta or production scope.'
      : 'Run the synthetic-only burn-in QA against an approved render/tool-readiness image or host ffmpeg with explicit production and product-ready acceptance confirmations.',
    warnings: [
      'Preview only; no backend evidence was recorded.',
      'This preflight creates only temp synthetic color video and ASS caption files, burns them through libass, probes the output, and removes temp artifacts.',
      'No user media, private media, GCS object, provider call, Supabase write, beta activation, production activation, or public artifact is allowed by this preflight.',
      productReadyAccepted
        ? 'Product-ready local OSS acceptance applies only to the bounded local libass burn-in capability for synthetic/private-caption-safe operation; deployed evidence and platform billing remain separate gates.'
        : 'Bounded accepted evidence reduces real-execution and production-readiness blockers only; product-ready local OSS remains false.',
    ],
  }
}

function buildAcceptedEvidence(
  env: BetaToolsLibassSyntheticBurninQaPreflightEnv,
  proof: LibassSyntheticBurninQaProof,
  productReadyLocalOss: boolean,
): ToolBetaAcceptedExecutionEvidence {
  const sourceId = clean(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_ID) ?? 'beta-tools-libass-synthetic-burnin-qa'
  return {
    toolId: 'libass',
    sourceId: `${sourceId}:libass`,
    sourceSha: clean(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_SHA),
    readinessStatus: 'passed',
    realExecutionVerified: true,
    productionReadinessAccepted: true,
    productReadyLocalOss,
    modelWeightsApproved: true,
    notes: [
      clean(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_NOTES) ?? 'Bounded synthetic libass burn-in QA proof.',
      `Mode ${proof.mode}; run ${proof.runId}.`,
      proof.containerImage ? `Container image ${proof.containerImage}.` : 'Host command proof; use container mode for worker-image evidence.',
      `Output ${proof.outputVideo.fileName} size ${proof.outputVideo.sizeBytes} bytes sha256 ${proof.outputVideo.checksumSha256 ?? 'unavailable'}.`,
      `Duration ${proof.outputVideo.durationSeconds ?? 'unavailable'} seconds; safe ASS style preset accepted: ${proof.captionFile.safeStylePresetAccepted}.`,
      productReadyLocalOss
        ? 'Product-ready local OSS was explicitly accepted for this synthetic/private-caption-safe local proof.'
        : 'Product-ready local OSS remains false; this is bounded accepted evidence only.',
      'Historical PR #73 is duplicate-adjacent activation/private-media context only, not the current beta source-truth lane.',
      'No user media, private media, GCS object, provider call, Supabase write, beta activation, production activation, public artifact, or signed URL occurred.',
    ],
  }
}

function runSyntheticBurninProof(
  env: BetaToolsLibassSyntheticBurninQaPreflightEnv,
  mode: 'host' | 'docker',
  runner: LibassSyntheticBurninCommandRunner,
): LibassSyntheticBurninQaProof {
  const runId = `libass-burnin-qa-${new Date().toISOString().replace(/[:.]/g, '-')}`
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), 'reeditpro-beta-libass-burnin-qa-'))
  const inputPath = path.join(tempRoot, 'synthetic-caption-source.mp4')
  const captionPath = path.join(tempRoot, 'synthetic-captions.ass')
  const outputPath = path.join(tempRoot, 'synthetic-libass-burnin-output.mp4')
  const commandRecords: LibassSyntheticBurninCommandRecord[] = []

  writeFileSync(captionPath, safeAssCaptionText(), 'utf8')

  try {
    commandRecords.push(runCommand('font_discovery', mode, env, tempRoot, ['fc-match', 'sans'], runner))
    commandRecords.push(runCommand('synthetic_video', mode, env, tempRoot, [
      'ffmpeg',
      '-hide_banner',
      '-nostdin',
      '-y',
      '-f',
      'lavfi',
      '-i',
      'testsrc=size=320x180:rate=30',
      '-t',
      '1',
      '-c:v',
      'mpeg4',
      '-q:v',
      '5',
      '-pix_fmt',
      'yuv420p',
      '-an',
      commandPath(mode, inputPath, 'synthetic-caption-source.mp4'),
    ], runner))
    commandRecords.push(runCommand('caption_burnin', mode, env, tempRoot, [
      'ffmpeg',
      '-hide_banner',
      '-nostdin',
      '-y',
      '-i',
      commandPath(mode, inputPath, 'synthetic-caption-source.mp4'),
      '-vf',
      subtitlesFilterArg(mode, captionPath),
      '-c:v',
      'mpeg4',
      '-q:v',
      '5',
      '-pix_fmt',
      'yuv420p',
      '-an',
      commandPath(mode, outputPath, 'synthetic-libass-burnin-output.mp4'),
    ], runner))
    if (commandRecords.some((record) => record.step === 'caption_burnin' && record.exitOk)) {
      const probeRecord = runCommand('decode_probe', mode, env, tempRoot, [
        'ffprobe',
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        commandPath(mode, outputPath, 'synthetic-libass-burnin-output.mp4'),
      ], runner)
      commandRecords.push(probeRecord)
    }
  } catch (error) {
    commandRecords.push({
      step: 'caption_burnin',
      command: 'internal',
      args: [],
      exitOk: false,
      stdoutSnippet: '',
      stderrSnippet: '',
      failureMessage: error instanceof Error ? error.message : 'Synthetic libass burn-in proof failed.',
    })
  }

  const outputDuration = parseDuration(commandRecords.find((record) => record.step === 'decode_probe')?.stdoutSnippet)
  const proof = buildProof({
    runId,
    mode,
    containerImage: mode === 'docker' ? clean(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_CONTAINER_IMAGE) : undefined,
    tempRoot,
    inputPath,
    captionPath,
    outputPath,
    outputDuration,
    commandRecords,
  })
  rmSync(tempRoot, { recursive: true, force: true })
  return {
    ...proof,
    tempRootRemoved: !existsSync(tempRoot),
  }
}

function runCommand(
  step: LibassSyntheticBurninCommandRecord['step'],
  mode: 'host' | 'docker',
  env: BetaToolsLibassSyntheticBurninQaPreflightEnv,
  tempRoot: string,
  innerCommandAndArgs: string[],
  runner: LibassSyntheticBurninCommandRunner,
): LibassSyntheticBurninCommandRecord {
  const { command, args } = commandForMode(mode, env, tempRoot, innerCommandAndArgs)
  try {
    const output = runner(command, args, { timeoutMs: timeoutMs(env) })
    return {
      step,
      command,
      args,
      exitOk: true,
      stdoutSnippet: snippet(String(output.stdout ?? '')),
      stderrSnippet: snippet(String(output.stderr ?? '')),
    }
  } catch (error) {
    const failed = error as { stdout?: string | Buffer; stderr?: string | Buffer; message?: string }
    return {
      step,
      command,
      args,
      exitOk: false,
      stdoutSnippet: snippet(String(failed.stdout ?? '')),
      stderrSnippet: snippet(String(failed.stderr ?? '')),
      failureMessage: snippet(failed.message ?? 'Optional command failed.'),
    }
  }
}

function commandForMode(
  mode: 'host' | 'docker',
  env: BetaToolsLibassSyntheticBurninQaPreflightEnv,
  tempRoot: string,
  innerCommandAndArgs: string[],
): { command: string; args: string[] } {
  if (mode === 'host') {
    const [command = '', ...args] = innerCommandAndArgs
    return { command, args }
  }
  return {
    command: 'docker',
    args: [
      'run',
      '--rm',
      '--network',
      'none',
      '-v',
      `${tempRoot}:/work:rw`,
      requiredEnv(env, 'REEDITPRO_BETA_LIBASS_BURNIN_QA_CONTAINER_IMAGE'),
      ...innerCommandAndArgs,
    ],
  }
}

function commandPath(mode: 'host' | 'docker', hostPath: string, fileName: string): string {
  return mode === 'docker' ? `/work/${fileName}` : hostPath
}

function subtitlesFilterArg(
  mode: 'host' | 'docker',
  captionPath: string,
): string {
  return `subtitles=filename=${escapeFfmpegFilterValue(commandPath(mode, captionPath, 'synthetic-captions.ass'))}`
}

function escapeFfmpegFilterValue(value: string): string {
  return value.replace(/([\\':,\\[\\]])/g, '\\$1')
}

function buildProof(input: {
  runId: string
  mode: 'host' | 'docker'
  containerImage?: string
  tempRoot: string
  inputPath: string
  captionPath: string
  outputPath: string
  outputDuration?: number
  commandRecords: LibassSyntheticBurninCommandRecord[]
}): LibassSyntheticBurninQaProof {
  const fontDiscoveryOk = input.commandRecords.some((record) => record.step === 'font_discovery' && record.exitOk)
  const burninCommandOk = input.commandRecords.some((record) => record.step === 'caption_burnin' && record.exitOk)
  const decodeProbeOk = input.commandRecords.some((record) => record.step === 'decode_probe' && record.exitOk)
  const output = fileSummary(input.outputPath)
  return {
    runId: input.runId,
    mode: input.mode,
    containerImage: input.containerImage,
    syntheticOnly: true,
    tempRoot: input.tempRoot,
    tempRootRemoved: false,
    inputVideo: {
      fileName: 'synthetic-caption-source.mp4',
      ...fileSummary(input.inputPath),
    },
    captionFile: {
      fileName: 'synthetic-captions.ass',
      ...fileSummary(input.captionPath),
      safeStylePresetAccepted: safeAssCaptionTextIsAccepted(readFileSync(input.captionPath, 'utf8')),
    },
    outputVideo: {
      fileName: 'synthetic-libass-burnin-output.mp4',
      ...output,
      durationSeconds: input.outputDuration,
    },
    fontDiscoveryOk,
    burninCommandOk,
    decodeProbeOk,
    noPrivateOrUserMedia: true,
    noNetwork: input.mode === 'docker',
    commandRecords: input.commandRecords,
    failureMessage: burninCommandOk && decodeProbeOk && output.exists
      ? undefined
      : 'Synthetic libass burn-in proof did not complete.',
  }
}

function fileSummary(filePath: string): { exists: boolean; sizeBytes: number; checksumSha256?: string } {
  if (!existsSync(filePath)) return { exists: false, sizeBytes: 0 }
  const sizeBytes = statSync(filePath).size
  return {
    exists: true,
    sizeBytes,
    checksumSha256: createHash('sha256').update(readFileSync(filePath)).digest('hex'),
  }
}

function safeAssCaptionText(): string {
  return `[Script Info]
ScriptType: v4.00+
PlayResX: 320
PlayResY: 180

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: ReEditProSafe, sans, 22, &H00FFFFFF, &H000000FF, &H00000000, &H99000000, 0, 0, 0, 0, 100, 100, 0, 0, 1, 2, 1, 2, 24, 24, 22, 1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.10,0:00:00.90,ReEditProSafe,,0,0,0,,Synthetic caption QA
`
}

function safeAssCaptionTextIsAccepted(text: string): boolean {
  return text.includes('Style: ReEditProSafe') &&
    text.includes(', 2, 24, 24, 22,') &&
    !/[{][^}]*\\(move|pos|org|clip|iclip|t|fad|fade)/i.test(text)
}

function parseDuration(value: string | undefined): number | undefined {
  if (!value) return undefined
  const parsed = Number.parseFloat(value.trim())
  return Number.isFinite(parsed) ? parsed : undefined
}

function emptyProof(
  mode: 'host' | 'docker',
  containerImage?: string,
): LibassSyntheticBurninQaProof {
  return {
    runId: 'not-run',
    mode,
    containerImage: mode === 'docker' ? clean(containerImage) : undefined,
    syntheticOnly: true,
    tempRoot: '[not-created]',
    tempRootRemoved: true,
    inputVideo: { fileName: 'synthetic-caption-source.mp4', exists: false, sizeBytes: 0 },
    captionFile: { fileName: 'synthetic-captions.ass', exists: false, sizeBytes: 0, safeStylePresetAccepted: false },
    outputVideo: { fileName: 'synthetic-libass-burnin-output.mp4', exists: false, sizeBytes: 0 },
    fontDiscoveryOk: false,
    burninCommandOk: false,
    decodeProbeOk: false,
    noPrivateOrUserMedia: true,
    noNetwork: mode === 'docker',
    commandRecords: [],
  }
}

function missingRequiredConfiguration(
  env: BetaToolsLibassSyntheticBurninQaPreflightEnv,
  mode: 'host' | 'docker',
): string[] {
  const missing: string[] = []
  if (!clean(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_WORKSPACE_ID)) missing.push('REEDITPRO_BETA_LIBASS_BURNIN_QA_WORKSPACE_ID is required.')
  if (!clean(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_ID)) missing.push('REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_ID is required.')
  if (!clean(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_SHA)) missing.push('REEDITPRO_BETA_LIBASS_BURNIN_QA_SOURCE_SHA is required.')
  if (mode === 'docker' && !clean(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_CONTAINER_IMAGE)) {
    missing.push('REEDITPRO_BETA_LIBASS_BURNIN_QA_CONTAINER_IMAGE is required for docker mode.')
  }
  return missing
}

function confirmationGapsFor(env: BetaToolsLibassSyntheticBurninQaPreflightEnv): string[] {
  const gaps: string[] = []
  const boundedAccepted = parseBoolean(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_BOUNDED_ACCEPTED_EVIDENCE)
  const productReadyAccepted = parseBoolean(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCT_READY_LOCAL_OSS)
  if (boundedAccepted && !parseBoolean(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE)) {
    gaps.push('REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_BOUNDED_ACCEPTED_EVIDENCE_ACCEPTANCE=true is required to confirm bounded accepted evidence.')
  }
  if (!boundedAccepted && !parseBoolean(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCTION_READINESS)) {
    gaps.push('REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCTION_READINESS=true is required to reduce production-readiness blockers.')
  }
  if (!boundedAccepted && !parseBoolean(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE)) {
    gaps.push('REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE=true is required to confirm production-readiness acceptance.')
  }
  if (!boundedAccepted && !productReadyAccepted) {
    gaps.push('REEDITPRO_BETA_LIBASS_BURNIN_QA_ACCEPT_PRODUCT_READY_LOCAL_OSS=true is required to reduce product-ready local OSS blockers for libass.')
  }
  if (productReadyAccepted && !parseBoolean(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE)) {
    gaps.push('REEDITPRO_BETA_LIBASS_BURNIN_QA_CONFIRM_PRODUCT_READY_LOCAL_OSS_ACCEPTANCE=true is required to confirm product-ready local OSS acceptance.')
  }
  if (parseBoolean(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_RETAIN_TEMP_OUTPUTS)) {
    gaps.push('Retaining temp outputs is not allowed for the beta libass burn-in QA preflight.')
  }
  return gaps
}

function parseMode(value: string | undefined): 'host' | 'docker' {
  return clean(value) === 'docker' ? 'docker' : 'host'
}

function timeoutMs(env: BetaToolsLibassSyntheticBurninQaPreflightEnv): number {
  const parsed = Number.parseInt(clean(env.REEDITPRO_BETA_LIBASS_BURNIN_QA_TIMEOUT_MS) ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 60000
}

function parseBoolean(value: string | undefined): boolean {
  return clean(value)?.toLowerCase() === 'true'
}

function requiredEnv(
  env: BetaToolsLibassSyntheticBurninQaPreflightEnv,
  key: keyof BetaToolsLibassSyntheticBurninQaPreflightEnv,
): string {
  const value = clean(env[key])
  if (!value) throw new Error(`${String(key)} is required.`)
  return value
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function snippet(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, 600)
}

function defaultRunner(
  command: string,
  args: string[],
  options: { timeoutMs: number },
): { stdout?: string | Buffer; stderr?: string | Buffer } {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    timeout: options.timeoutMs,
    windowsHide: true,
    maxBuffer: 1024 * 1024 * 2,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  if (result.error) {
    throw Object.assign(result.error, {
      stdout: result.stdout,
      stderr: result.stderr,
    })
  }
  if ((result.status ?? 0) !== 0) {
    throw Object.assign(new Error(`${command} exited with status ${result.status ?? 'unknown'}.`), {
      stdout: result.stdout,
      stderr: result.stderr,
    })
  }
  return {
    stdout: result.stdout,
    stderr: result.stderr,
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const report = runBetaToolsLibassSyntheticBurninQaPreflight(process.env)
  console.log(JSON.stringify(report, null, 2))
  if (!report.ok) process.exitCode = 1
}
