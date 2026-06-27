import { execFileSync } from 'node:child_process'
import { collectSecretLikePaths } from '../tool-cost-metering/secret-safety'
import type { BetaReadinessEvidencePacketInput } from '../beta-readiness/beta-readiness-evidence-store'
import type { ToolBetaAcceptedExecutionEvidence } from '../beta-readiness'

export interface BetaToolsLibassContainerProofPreflightEnv {
  REEDITPRO_BETA_LIBASS_PROOF_WORKSPACE_ID?: string
  REEDITPRO_BETA_LIBASS_PROOF_PROJECT_ID?: string
  REEDITPRO_BETA_LIBASS_PROOF_SOURCE_ID?: string
  REEDITPRO_BETA_LIBASS_PROOF_SOURCE_SHA?: string
  REEDITPRO_BETA_LIBASS_PROOF_NOTES?: string
  REEDITPRO_BETA_LIBASS_PROOF_MODE?: string
  REEDITPRO_BETA_LIBASS_PROOF_CONTAINER_IMAGE?: string
  REEDITPRO_BETA_LIBASS_PROOF_TIMEOUT_MS?: string
  REEDITPRO_BETA_LIBASS_PROOF_ACCEPT_PRODUCTION_READINESS?: string
  REEDITPRO_BETA_LIBASS_PROOF_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE?: string
  REEDITPRO_BETA_LIBASS_PROOF_REQUIRE_ACCEPTED_EVIDENCE?: string
  REEDITPRO_BETA_LIBASS_PROOF_ACCEPT_PRODUCT_READY_LOCAL_OSS?: string
}

export interface LibassFilterProof {
  mode: 'host' | 'docker'
  command: string
  args: string[]
  containerImage?: string
  exitOk: boolean
  hasAssFilter: boolean
  hasSubtitlesFilter: boolean
  observedFilterLines: string[]
  outputSnippet: string
  failureMessage?: string
}

export interface BetaToolsLibassContainerProofPreflightReport {
  ok: boolean
  previewOnly: true
  readyToRecordAcceptedEvidence: boolean
  proof: LibassFilterProof
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

export type LibassProofCommandRunner = (
  command: string,
  args: string[],
) => { stdout?: string | Buffer; stderr?: string | Buffer }

export function runBetaToolsLibassContainerProofPreflight(
  env: BetaToolsLibassContainerProofPreflightEnv,
  runner: LibassProofCommandRunner = defaultRunner,
): BetaToolsLibassContainerProofPreflightReport {
  const mode = parseMode(env.REEDITPRO_BETA_LIBASS_PROOF_MODE)
  const missingConfiguration = missingRequiredConfiguration(env, mode)
  const confirmationGaps = confirmationGapsFor(env)
  const secretLikeInputPaths = collectSecretLikePaths({
    workspaceId: env.REEDITPRO_BETA_LIBASS_PROOF_WORKSPACE_ID,
    projectId: env.REEDITPRO_BETA_LIBASS_PROOF_PROJECT_ID,
    sourceId: env.REEDITPRO_BETA_LIBASS_PROOF_SOURCE_ID,
    sourceSha: env.REEDITPRO_BETA_LIBASS_PROOF_SOURCE_SHA,
    notes: env.REEDITPRO_BETA_LIBASS_PROOF_NOTES,
    containerImage: env.REEDITPRO_BETA_LIBASS_PROOF_CONTAINER_IMAGE,
  }, 'betaToolsLibassContainerProofPreflight')

  const blockedBeforeCommand = missingConfiguration.length > 0 ||
    confirmationGaps.length > 0 ||
    secretLikeInputPaths.length > 0

  if (blockedBeforeCommand) {
    return buildReport({
      env,
      proof: emptyProof(mode, env.REEDITPRO_BETA_LIBASS_PROOF_CONTAINER_IMAGE),
      missingConfiguration,
      confirmationGaps,
      secretLikeInputPaths,
    })
  }

  const proof = runLibassFilterProof(env, mode, runner)
  return buildReport({
    env,
    proof,
    missingConfiguration,
    confirmationGaps,
    secretLikeInputPaths,
  })
}

function buildReport(input: {
  env: BetaToolsLibassContainerProofPreflightEnv
  proof: LibassFilterProof
  missingConfiguration: string[]
  confirmationGaps: string[]
  secretLikeInputPaths: string[]
}): BetaToolsLibassContainerProofPreflightReport {
  const productionAccepted = input.proof.exitOk &&
    (input.proof.hasAssFilter || input.proof.hasSubtitlesFilter) &&
    parseBoolean(input.env.REEDITPRO_BETA_LIBASS_PROOF_ACCEPT_PRODUCTION_READINESS) &&
    parseBoolean(input.env.REEDITPRO_BETA_LIBASS_PROOF_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE)

  const acceptedToolEvidence = productionAccepted
    ? [buildAcceptedEvidence(input.env, input.proof)]
    : []
  const evidencePacket = acceptedToolEvidence.length > 0
    ? {
      workspaceId: requiredEnv(input.env, 'REEDITPRO_BETA_LIBASS_PROOF_WORKSPACE_ID'),
      projectId: clean(input.env.REEDITPRO_BETA_LIBASS_PROOF_PROJECT_ID),
      acceptedToolEvidence,
    }
    : undefined
  const readyToRecordAcceptedEvidence = acceptedToolEvidence.length > 0 &&
    input.missingConfiguration.length === 0 &&
    input.confirmationGaps.length === 0 &&
    input.secretLikeInputPaths.length === 0
  const requireAcceptedEvidence = parseBoolean(input.env.REEDITPRO_BETA_LIBASS_PROOF_REQUIRE_ACCEPTED_EVIDENCE)

  return {
    ok: readyToRecordAcceptedEvidence && (!requireAcceptedEvidence || acceptedToolEvidence.length > 0),
    previewOnly: true,
    readyToRecordAcceptedEvidence,
    proof: input.proof,
    acceptedToolEvidence,
    evidencePacket,
    missingConfiguration: input.missingConfiguration,
    confirmationGaps: input.confirmationGaps,
    secretLikeInputPaths: input.secretLikeInputPaths,
    wouldReduceBlockers: acceptedToolEvidence.length > 0
      ? ['real_execution_not_verified', 'production_readiness_blocked']
      : [],
    remainingBlockers: [
      'product_ready_acceptance_missing',
      'caption_burnin_font_packaging_qa_pending',
      'deployed_staging_evidence_recording_pending',
      'platform_billing_deployment_unverified',
    ],
    nextSafeAction: acceptedToolEvidence.length > 0
      ? 'Record this libass evidence packet through the authenticated beta readiness evidence endpoint, then run caption burn-in/font QA before product-ready local OSS acceptance.'
      : 'Run the proof against the approved render/tool-readiness container image and verify ffmpeg exposes ass or subtitles filters without processing media.',
    warnings: [
      'Preview only; no backend evidence was recorded.',
      'This proof runs only ffmpeg -hide_banner -filters, optionally through docker run --rm --network none.',
      'No media input, subtitle file, render/export, provider call, Supabase write, beta activation, or production activation is allowed by this preflight.',
      'Passing filter inspection does not prove final caption burn-in, font packaging, safe-zone QA, LGPL/commercial review, or product-ready local OSS acceptance.',
    ],
  }
}

function buildAcceptedEvidence(
  env: BetaToolsLibassContainerProofPreflightEnv,
  proof: LibassFilterProof,
): ToolBetaAcceptedExecutionEvidence {
  const sourceId = clean(env.REEDITPRO_BETA_LIBASS_PROOF_SOURCE_ID) ?? 'beta-tools-libass-filter-proof'
  return {
    toolId: 'libass',
    sourceId: `${sourceId}:libass`,
    sourceSha: clean(env.REEDITPRO_BETA_LIBASS_PROOF_SOURCE_SHA),
    readinessStatus: 'passed',
    realExecutionVerified: true,
    productionReadinessAccepted: true,
    productReadyLocalOss: false,
    modelWeightsApproved: true,
    notes: [
      clean(env.REEDITPRO_BETA_LIBASS_PROOF_NOTES) ?? 'Bounded libass filter support proof.',
      `Mode ${proof.mode}; command ${proof.command} ${proof.args.join(' ')}.`,
      proof.containerImage ? `Container image ${proof.containerImage}.` : 'Host command proof; use container mode for worker-image evidence.',
      `Observed filters: ${proof.observedFilterLines.join(' | ') || 'none'}.`,
      'No media, subtitle rendering, Docker build, provider call, Supabase write, beta activation, or production activation occurred.',
      'Product-ready local OSS remains false until caption burn-in/font QA accepts runtime evidence.',
    ],
  }
}

function runLibassFilterProof(
  env: BetaToolsLibassContainerProofPreflightEnv,
  mode: 'host' | 'docker',
  runner: LibassProofCommandRunner,
): LibassFilterProof {
  const { command, args } = commandForMode(mode, env)
  try {
    const output = runner(command, args)
    const combinedOutput = `${String(output.stdout ?? '')}\n${String(output.stderr ?? '')}`
    return proofFromOutput({
      mode,
      command,
      args,
      containerImage: mode === 'docker' ? requiredEnv(env, 'REEDITPRO_BETA_LIBASS_PROOF_CONTAINER_IMAGE') : undefined,
      output: combinedOutput,
      exitOk: true,
    })
  } catch (error) {
    const failed = error as { stdout?: string | Buffer; stderr?: string | Buffer; message?: string }
    const combinedOutput = `${String(failed.stdout ?? '')}\n${String(failed.stderr ?? '')}`
    return {
      ...proofFromOutput({
        mode,
        command,
        args,
        containerImage: mode === 'docker' ? clean(env.REEDITPRO_BETA_LIBASS_PROOF_CONTAINER_IMAGE) : undefined,
        output: combinedOutput,
        exitOk: false,
      }),
      failureMessage: snippet(failed.message ?? combinedOutput),
    }
  }
}

function proofFromOutput(input: {
  mode: 'host' | 'docker'
  command: string
  args: string[]
  containerImage?: string
  output: string
  exitOk: boolean
}): LibassFilterProof {
  const observedFilterLines = input.output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /\b(ass|subtitles)\b/i.test(line))
    .slice(0, 12)
  return {
    mode: input.mode,
    command: input.command,
    args: input.args,
    containerImage: input.containerImage,
    exitOk: input.exitOk,
    hasAssFilter: observedFilterLines.some((line) => /\bass\b/i.test(line)),
    hasSubtitlesFilter: observedFilterLines.some((line) => /\bsubtitles\b/i.test(line)),
    observedFilterLines,
    outputSnippet: snippet(input.output),
  }
}

function commandForMode(
  mode: 'host' | 'docker',
  env: BetaToolsLibassContainerProofPreflightEnv,
): { command: string; args: string[] } {
  if (mode === 'docker') {
    return {
      command: 'docker',
      args: [
        'run',
        '--rm',
        '--network',
        'none',
        requiredEnv(env, 'REEDITPRO_BETA_LIBASS_PROOF_CONTAINER_IMAGE'),
        'ffmpeg',
        '-hide_banner',
        '-filters',
      ],
    }
  }
  return { command: 'ffmpeg', args: ['-hide_banner', '-filters'] }
}

function emptyProof(mode: 'host' | 'docker', containerImage?: string): LibassFilterProof {
  return {
    mode,
    command: mode === 'docker' ? 'docker' : 'ffmpeg',
    args: mode === 'docker'
      ? ['run', '--rm', '--network', 'none', clean(containerImage) ?? '[container-image-required]', 'ffmpeg', '-hide_banner', '-filters']
      : ['-hide_banner', '-filters'],
    containerImage: clean(containerImage),
    exitOk: false,
    hasAssFilter: false,
    hasSubtitlesFilter: false,
    observedFilterLines: [],
    outputSnippet: '',
  }
}

function missingRequiredConfiguration(
  env: BetaToolsLibassContainerProofPreflightEnv,
  mode: 'host' | 'docker',
): string[] {
  return [
    missingEnv(env, 'REEDITPRO_BETA_LIBASS_PROOF_WORKSPACE_ID'),
    missingEnv(env, 'REEDITPRO_BETA_LIBASS_PROOF_SOURCE_SHA'),
    mode === 'docker' ? missingEnv(env, 'REEDITPRO_BETA_LIBASS_PROOF_CONTAINER_IMAGE') : undefined,
    parseBoolean(env.REEDITPRO_BETA_LIBASS_PROOF_ACCEPT_PRODUCTION_READINESS)
      ? undefined
      : 'REEDITPRO_BETA_LIBASS_PROOF_ACCEPT_PRODUCTION_READINESS=true is required to produce blocker-reducing libass evidence.',
    parseBoolean(env.REEDITPRO_BETA_LIBASS_PROOF_REQUIRE_ACCEPTED_EVIDENCE)
      ? undefined
      : 'REEDITPRO_BETA_LIBASS_PROOF_REQUIRE_ACCEPTED_EVIDENCE=true is required so the preflight fails closed when libass support is absent.',
  ].filter((item): item is string => Boolean(item))
}

function confirmationGapsFor(env: BetaToolsLibassContainerProofPreflightEnv): string[] {
  return [
    parseBoolean(env.REEDITPRO_BETA_LIBASS_PROOF_ACCEPT_PRODUCTION_READINESS) &&
      !parseBoolean(env.REEDITPRO_BETA_LIBASS_PROOF_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE)
      ? 'REEDITPRO_BETA_LIBASS_PROOF_CONFIRM_PRODUCTION_READINESS_ACCEPTANCE=true is required when accepting production readiness.'
      : undefined,
    parseBoolean(env.REEDITPRO_BETA_LIBASS_PROOF_ACCEPT_PRODUCT_READY_LOCAL_OSS)
      ? 'This preflight cannot accept product-ready local OSS for libass; run a later caption burn-in/font QA gate instead.'
      : undefined,
  ].filter((item): item is string => Boolean(item))
}

function parseMode(value: string | undefined): 'host' | 'docker' {
  return clean(value) === 'docker' ? 'docker' : 'host'
}

function defaultRunner(command: string, args: string[]): { stdout: string } {
  return {
    stdout: execFileSync(command, args, {
      encoding: 'utf8',
      timeout: parsePositiveInteger(process.env.REEDITPRO_BETA_LIBASS_PROOF_TIMEOUT_MS) ?? 60000,
      maxBuffer: 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    }),
  }
}

function parsePositiveInteger(value: string | undefined): number | undefined {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

function missingEnv(env: BetaToolsLibassContainerProofPreflightEnv, name: keyof BetaToolsLibassContainerProofPreflightEnv): string | undefined {
  return clean(env[name]) ? undefined : `${name} is required.`
}

function requiredEnv(env: BetaToolsLibassContainerProofPreflightEnv, name: keyof BetaToolsLibassContainerProofPreflightEnv): string {
  const value = clean(env[name])
  if (!value) throw new Error(`${name} is required.`)
  return value
}

function parseBoolean(value: string | undefined): boolean {
  return value === 'true' || value === '1'
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function snippet(value: string): string {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 12)
    .join(' | ')
    .slice(0, 1000)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runBetaToolsLibassContainerProofPreflight(process.env)
  console.log(JSON.stringify(report, null, 2))
  if (!report.ok) {
    process.exitCode = 1
  }
}
